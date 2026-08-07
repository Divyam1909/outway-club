import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { bookingConfirmationEmail, newBookingAlertEmail, sendEmail } from "@/lib/email";
import { site } from "@/config/site";
import { formatDateRange, formatINR, seatsLeft } from "@/lib/utils";
import { sanitizeMultiline, sanitizeText } from "@/lib/rate-limit";

interface DepartureRow {
  id: string;
  total_seats: number;
  seats_booked: number;
  price_override: number | null;
  start_date: string;
  end_date: string;
}

interface VerifyPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  tripId: string;
  departureId: string | null;
  numTravelers: number;
  travelers: { full_name: string; age?: number; gender?: string }[];
  specialRequests?: string;
  contactPhone?: string;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You need to be signed in to book." }, { status: 401 });
  }

  let payload: VerifyPayload;
  try {
    payload = (await request.json()) as VerifyPayload;
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    tripId,
    departureId,
    numTravelers,
    travelers,
    specialRequests,
  } = payload;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Incomplete payment response." }, { status: 400 });
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    console.error("[verify] RAZORPAY_KEY_SECRET is not set — cannot verify signature");
    return NextResponse.json({ error: "Payment verification unavailable." }, { status: 503 });
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  // Constant-time comparison — a plain !== leaks timing information about
  // how much of a forged signature was correct.
  const signatureValid =
    expectedSignature.length === razorpay_signature.length &&
    crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(razorpay_signature));

  if (!signatureValid) {
    console.error("[verify] signature mismatch for order", razorpay_order_id);
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Idempotency: Razorpay's handler can fire twice (retries, double-submit).
  // If this order already produced a booking, return it rather than charging
  // the seat count again.
  const { data: existing } = await admin
    .from("bookings")
    .select("id")
    .eq("razorpay_order_id", razorpay_order_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ bookingId: existing.id });
  }

  const { data: trip, error: tripError } = await admin
    .from("trips")
    .select("id, title, price_per_person, discounted_price, duration_days, duration_nights")
    .eq("id", tripId)
    .single();

  if (tripError || !trip) {
    return NextResponse.json({ error: "Trip not found." }, { status: 404 });
  }

  let pricePerPerson = Number(trip.discounted_price ?? trip.price_per_person);
  let departure: DepartureRow | null = null;

  if (departureId) {
    const { data, error } = await admin.from("departures").select("*").eq("id", departureId).single();
    if (error || !data) {
      return NextResponse.json({ error: "Departure not found." }, { status: 404 });
    }
    departure = data as DepartureRow;
    if (departure.price_override) pricePerPerson = Number(departure.price_override);
  }

  // The amount is recomputed server-side; the client's figure is never trusted.
  const totalAmount = pricePerPerson * numTravelers;

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, email, phone")
    .eq("id", user.id)
    .maybeSingle();

  const contactEmail = profile?.email || user.email || null;
  const contactPhone = sanitizeText(payload.contactPhone, 32) || profile?.phone || null;
  const cleanRequests = sanitizeMultiline(specialRequests, 2000) || null;

  const { data: booking, error: bookingError } = await admin
    .from("bookings")
    .insert({
      user_id: user.id,
      trip_id: tripId,
      departure_id: departureId,
      num_travelers: numTravelers,
      total_amount: totalAmount,
      status: "confirmed",
      payment_status: "paid",
      razorpay_order_id,
      razorpay_payment_id,
      special_requests: cleanRequests,
      contact_email: contactEmail,
      contact_phone: contactPhone,
    })
    .select()
    .single();

  if (bookingError || !booking) {
    // The payment succeeded but we couldn't record it. Loud log — this needs
    // manual reconciliation, and the customer must not be told "try again"
    // in a way that would charge them twice.
    console.error("[verify] BOOKING INSERT FAILED after successful payment", {
      razorpay_order_id,
      razorpay_payment_id,
      userId: user.id,
      error: bookingError?.message,
    });
    return NextResponse.json(
      {
        error:
          "Your payment went through but we couldn't save the booking. Please email us with your payment ID and we'll confirm it manually — you will not be charged again.",
      },
      { status: 500 }
    );
  }

  const travelerNames: string[] = [];
  if (travelers?.length) {
    const rows = travelers.slice(0, numTravelers).map((traveler, index) => {
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
    await admin.from("travelers").insert(rows);
  }

  if (departure) {
    const remaining = seatsLeft(departure.total_seats, departure.seats_booked);
    await admin
      .from("departures")
      .update({ seats_booked: departure.seats_booked + Math.min(numTravelers, remaining) })
      .eq("id", departure.id);
  }

  // Email is fire-and-forget: a mail failure must never fail a paid booking.
  const emailData = {
    bookingRef: booking.id.slice(0, 8).toUpperCase(),
    bookingId: booking.id,
    customerName: profile?.full_name || travelerNames[0] || "traveller",
    customerEmail: contactEmail ?? "",
    tripTitle: trip.title,
    dateRange: departure ? formatDateRange(departure.start_date, departure.end_date) : null,
    numTravelers,
    totalAmount: formatINR(totalAmount),
    travelerNames: travelerNames.length ? travelerNames : ["—"],
    specialRequests: cleanRequests,
    paymentId: razorpay_payment_id,
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

  return NextResponse.json({ bookingId: booking.id });
}
