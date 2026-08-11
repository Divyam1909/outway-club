/**
 * Turning a paid Razorpay order into a booking row.
 *
 * This is the only place that writes a paid booking, and it is deliberately
 * paranoid about where its facts come from.
 *
 * A Razorpay signature proves that a payment belongs to an order. It proves
 * nothing whatsoever about *what was bought* — the signature is an HMAC over
 * `order_id|payment_id` and nothing else. So anything that determines price
 * (which trip, which departure, how many travellers) is read back from the
 * order Razorpay itself is holding, never from the request body. The browser
 * only gets to supply cosmetic details: traveller names, special requests, a
 * contact number.
 *
 * Both entry points — the browser's verify call and Razorpay's webhook —
 * come through here, so they cannot drift apart.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { getRazorpayInstance } from "@/lib/razorpay";
import { bookingConfirmationEmail, newBookingAlertEmail, sendEmail } from "@/lib/email";
import { site } from "@/config/site";
import { formatDateRange, formatINR } from "@/lib/utils";
import { sanitizeMultiline, sanitizeText } from "@/lib/rate-limit";

export interface TravelerInput {
  full_name: string;
  age?: number;
  gender?: string;
}

/** Everything the customer types in. None of it can affect the price. */
export interface BookingDetails {
  travelers?: TravelerInput[];
  specialRequests?: string;
  contactPhone?: string;
}

export type RecordBookingResult =
  | { ok: true; bookingId: string; alreadyExisted: boolean }
  | { ok: false; status: number; error: string };

interface DepartureRow {
  id: string;
  total_seats: number;
  seats_booked: number;
  price_override: number | null;
  start_date: string;
  end_date: string;
}

/** Razorpay returns notes as strings; be liberal about what we accept back. */
function note(notes: unknown, key: string): string {
  if (!notes || typeof notes !== "object") return "";
  const value = (notes as Record<string, unknown>)[key];
  return value === null || value === undefined ? "" : String(value).trim();
}

export async function recordPaidBooking({
  orderId,
  paymentId,
  expectedUserId,
  details = {},
  source,
}: {
  orderId: string;
  paymentId: string;
  /** Set from the session on the browser path; omitted for the webhook. */
  expectedUserId?: string;
  details?: BookingDetails;
  source: "verify" | "webhook";
}): Promise<RecordBookingResult> {
  const admin = createAdminClient();

  // Fast path for the common case: the webhook and the browser both reported
  // the same payment, and one of them got here first.
  const { data: existing } = await admin
    .from("bookings")
    .select("id")
    .eq("razorpay_order_id", orderId)
    .maybeSingle();

  if (existing) {
    return { ok: true, bookingId: existing.id, alreadyExisted: true };
  }

  // ---------------------------------------------------------------------
  // The order, straight from Razorpay. This is the authority on the sale.
  // ---------------------------------------------------------------------
  let order;
  try {
    order = await getRazorpayInstance().orders.fetch(orderId);
  } catch (error) {
    console.error(`[${source}] could not fetch order ${orderId} from Razorpay:`, error);
    return { ok: false, status: 502, error: "Couldn't reach the payment gateway to confirm your payment." };
  }

  if (order.status !== "paid") {
    console.error(`[${source}] order ${orderId} is '${order.status}', not 'paid' — refusing to book`);
    return { ok: false, status: 409, error: "That payment hasn't completed." };
  }

  const tripId = note(order.notes, "tripId");
  const departureId = note(order.notes, "departureId") || null;
  const numTravelers = Number(note(order.notes, "numTravelers"));
  const orderUserId = note(order.notes, "userId");

  if (!tripId || !orderUserId || !Number.isInteger(numTravelers) || numTravelers < 1) {
    // Only reachable for orders created before this code shipped, or by hand
    // in the Razorpay dashboard. Either way a human needs to look at it.
    console.error(`[${source}] order ${orderId} has unusable notes:`, order.notes);
    return { ok: false, status: 409, error: "We couldn't read the details of that order. Please contact us." };
  }

  // The signed-in caller must be the person the order was created for,
  // otherwise anyone could claim someone else's completed payment.
  if (expectedUserId && expectedUserId !== orderUserId) {
    console.error(`[${source}] user ${expectedUserId} tried to claim order ${orderId} belonging to ${orderUserId}`);
    return { ok: false, status: 403, error: "That payment belongs to a different account." };
  }

  const { data: trip, error: tripError } = await admin
    .from("trips")
    .select("id, title, price_per_person, discounted_price")
    .eq("id", tripId)
    .single();

  if (tripError || !trip) {
    return { ok: false, status: 404, error: "Trip not found." };
  }

  let pricePerPerson = Number(trip.discounted_price ?? trip.price_per_person);
  let departure: DepartureRow | null = null;

  if (departureId) {
    const { data, error } = await admin.from("departures").select("*").eq("id", departureId).single();
    if (error || !data) {
      return { ok: false, status: 404, error: "Departure not found." };
    }
    departure = data as DepartureRow;
    if (departure.price_override) pricePerPerson = Number(departure.price_override);
  }

  const totalAmount = pricePerPerson * numTravelers;

  // Last line of defence: what we think this costs must match what Razorpay
  // actually collected. Catches a price edited between order and payment, and
  // any gap in the reasoning above.
  const expectedPaise = Math.round(totalAmount * 100);
  const paidPaise = Number(order.amount);

  if (expectedPaise !== paidPaise) {
    console.error(
      `[${source}] AMOUNT MISMATCH on order ${orderId}: charged ${paidPaise} paise, priced ${expectedPaise} paise`
    );
    return {
      ok: false,
      status: 409,
      error: "The amount paid doesn't match this booking. Please contact us and we'll sort it out.",
    };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, email, phone")
    .eq("id", orderUserId)
    .maybeSingle();

  // profiles.email is populated by a trigger, but a row predating it — or a
  // profile that never got created — would otherwise leave the customer with
  // no receipt. The auth record always has the address they signed up with.
  let contactEmail = profile?.email || null;
  if (!contactEmail) {
    const { data: authUser } = await admin.auth.admin.getUserById(orderUserId);
    contactEmail = authUser?.user?.email ?? null;
  }

  const contactPhone = sanitizeText(details.contactPhone, 32) || profile?.phone || null;
  const cleanRequests = sanitizeMultiline(details.specialRequests, 2000) || null;

  const { data: booking, error: bookingError } = await admin
    .from("bookings")
    .insert({
      user_id: orderUserId,
      trip_id: tripId,
      departure_id: departureId,
      num_travelers: numTravelers,
      total_amount: totalAmount,
      status: "confirmed",
      payment_status: "paid",
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      special_requests: cleanRequests,
      contact_email: contactEmail,
      contact_phone: contactPhone,
    })
    .select()
    .single();

  if (bookingError || !booking) {
    // 23505 = unique violation on bookings_razorpay_order_key: the other entry
    // point inserted while we were working. That's success, not failure.
    if (bookingError?.code === "23505") {
      const { data: raced } = await admin
        .from("bookings")
        .select("id")
        .eq("razorpay_order_id", orderId)
        .maybeSingle();

      if (raced) return { ok: true, bookingId: raced.id, alreadyExisted: true };
    }

    // The payment succeeded but we couldn't record it. Loud log — this needs
    // manual reconciliation, and the customer must not be told "try again"
    // in a way that would charge them twice.
    console.error(`[${source}] BOOKING INSERT FAILED after successful payment`, {
      orderId,
      paymentId,
      userId: orderUserId,
      error: bookingError?.message,
    });
    return {
      ok: false,
      status: 500,
      error:
        "Your payment went through but we couldn't save the booking. Please email us with your payment ID and we'll confirm it manually, you will not be charged again.",
    };
  }

  // -------------------------------------------------------------------------
  // Everything past this point is best-effort. The booking is recorded and the
  // money is taken; nothing below may throw its way back to the customer.
  // -------------------------------------------------------------------------
  const travelerNames: string[] = [];

  if (details.travelers?.length) {
    const rows = details.travelers.slice(0, numTravelers).map((traveler, index) => {
      const fullName = sanitizeText(traveler.full_name, 120);
      travelerNames.push(fullName);
      return {
        booking_id: booking.id,
        full_name: fullName,
        age: Number.isFinite(traveler.age) ? traveler.age : null,
        gender: sanitizeText(traveler.gender, 20) || null,
        is_primary: index === 0,
      };
    });

    const { error: travelerError } = await admin.from("travelers").insert(rows);
    if (travelerError) {
      console.error(`[${source}] traveller details failed to save for booking ${booking.id}:`, travelerError.message);
    }
  }

  if (departure) {
    // Atomic: see book_departure_seats in 0005_booking_integrity.sql.
    const { data: seatRows, error: seatError } = await admin.rpc("book_departure_seats", {
      p_departure_id: departure.id,
      p_seats: numTravelers,
    });

    const seat = Array.isArray(seatRows) ? seatRows[0] : seatRows;

    if (seatError) {
      console.error(`[${source}] seat allocation failed for booking ${booking.id}:`, seatError.message);
    } else if (seat && seat.fitted === false) {
      console.error(
        `[${source}] DEPARTURE OVERSOLD — booking ${booking.id} took departure ${departure.id} to ` +
          `${seat.seats_booked}/${seat.total_seats}. Someone needs to be moved or refunded.`
      );
    }
  }

  const emailData = {
    bookingRef: booking.id.slice(0, 8).toUpperCase(),
    bookingId: booking.id,
    customerName: profile?.full_name || travelerNames[0] || "traveller",
    customerEmail: contactEmail ?? "",
    tripTitle: trip.title,
    dateRange: departure ? formatDateRange(departure.start_date, departure.end_date) : null,
    numTravelers,
    totalAmount: formatINR(totalAmount),
    travelerNames: travelerNames.length ? travelerNames : ["Not provided"],
    specialRequests: cleanRequests,
    paymentId,
  };

  const receipt = bookingConfirmationEmail(emailData);
  const alert = newBookingAlertEmail(emailData);

  await Promise.allSettled([
    contactEmail
      ? sendEmail({ to: contactEmail, subject: receipt.subject, html: receipt.html, replyTo: site.email })
      : Promise.resolve(false),
    sendEmail({
      to: site.opsEmail,
      subject: alert.subject,
      html: alert.html,
      ...(contactEmail ? { replyTo: contactEmail } : {}),
    }),
  ]);

  return { ok: true, bookingId: booking.id, alreadyExisted: false };
}
