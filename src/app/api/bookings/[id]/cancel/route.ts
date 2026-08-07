import { NextResponse } from "next/server";
import { differenceInCalendarDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRazorpayInstance, isRazorpayConfigured } from "@/lib/razorpay";
import { RATE_LIMITS, TOO_MANY_REQUESTS, rateLimitRequest, sanitizeMultiline } from "@/lib/rate-limit";
import { cancellationAlertEmail, cancellationEmail, sendEmail } from "@/lib/email";
import { refundPercentFor, site } from "@/config/site";
import { formatINR } from "@/lib/utils";

/**
 * Customer-initiated booking cancellation.
 *
 * The refund percentage comes from REFUND_TIERS in src/config/site.ts — the
 * same constant that renders the table on /refund-policy — so what a customer
 * is shown and what they actually receive can never drift apart.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: bookingId } = await context.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Please sign in to manage this booking." }, { status: 401 });
  }

  if (!(await rateLimitRequest(RATE_LIMITS.cancelBooking, request, user.id))) {
    return NextResponse.json(TOO_MANY_REQUESTS, { status: 429 });
  }

  let reason = "";
  try {
    const body = await request.json();
    reason = sanitizeMultiline(body?.reason, 1000);
  } catch {
    // A reason is optional — an empty body is fine.
  }

  const admin = createAdminClient();

  const { data: booking, error: bookingError } = await admin
    .from("bookings")
    .select("*, trip:trips(title), departure:departures(*)")
    .eq("id", bookingId)
    .maybeSingle();

  if (bookingError || !booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  // The caller must own the booking, unless they're an admin cancelling on
  // someone's behalf.
  const { data: profile } = await admin
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .maybeSingle();
  const isAdmin = profile?.role === "admin";

  if (booking.user_id !== user.id && !isAdmin) {
    return NextResponse.json({ error: "That isn't your booking." }, { status: 403 });
  }

  if (booking.status === "cancelled") {
    return NextResponse.json({ error: "This booking is already cancelled." }, { status: 409 });
  }
  if (booking.status === "completed") {
    return NextResponse.json(
      { error: "This trip has already run, so it can't be cancelled. Email us if something went wrong." },
      { status: 409 }
    );
  }

  const departure = booking.departure as { id: string; start_date: string; seats_booked: number } | null;
  const daysBeforeDeparture = departure
    ? differenceInCalendarDays(new Date(departure.start_date), new Date())
    : 999;

  const paid = booking.payment_status === "paid";
  const refundPercent = paid ? refundPercentFor(daysBeforeDeparture) : 0;
  const totalAmount = Number(booking.total_amount);
  const refundAmount = Math.round((totalAmount * refundPercent) / 100);

  // --- Initiate the Razorpay refund -----------------------------------------
  let razorpayRefundId: string | null = null;
  let refundInitiated = false;

  if (refundAmount > 0 && booking.razorpay_payment_id && isRazorpayConfigured()) {
    try {
      const razorpay = getRazorpayInstance();
      const refund = await razorpay.payments.refund(booking.razorpay_payment_id, {
        amount: Math.round(refundAmount * 100),
        speed: "normal",
        notes: { bookingId, reason: reason || "Customer cancellation" },
      });
      razorpayRefundId = refund.id;
      refundInitiated = true;
    } catch (error) {
      // Never block a cancellation on a gateway hiccup. The booking is
      // cancelled and flagged refund_pending for ops to complete manually.
      console.error("[cancel] Razorpay refund failed:", error);
    }
  }

  const paymentStatus = !paid
    ? booking.payment_status
    : refundAmount === 0
      ? "paid"
      : refundInitiated
        ? "refunded"
        : "refund_pending";

  const { error: updateError } = await admin
    .from("bookings")
    .update({
      status: "cancelled",
      payment_status: paymentStatus,
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason || null,
      refund_amount: refundAmount,
      razorpay_refund_id: razorpayRefundId,
    })
    .eq("id", bookingId);

  if (updateError) {
    console.error("[cancel] update failed:", updateError.message);
    return NextResponse.json(
      { error: "We couldn't cancel that just now. Please email us and we'll sort it out." },
      { status: 500 }
    );
  }

  // Release the seats back to the departure.
  if (departure) {
    await admin
      .from("departures")
      .update({ seats_booked: Math.max(0, departure.seats_booked - booking.num_travelers) })
      .eq("id", departure.id);
  }

  // --- Notify both sides ----------------------------------------------------
  const tripTitle = (booking.trip as { title: string } | null)?.title ?? "your trip";
  const customerEmail = booking.contact_email || profile?.email || user.email || "";
  const emailData = {
    bookingRef: bookingId.slice(0, 8).toUpperCase(),
    customerName: profile?.full_name || "traveller",
    customerEmail,
    tripTitle,
    refundAmount: formatINR(refundAmount),
    refundPercent,
    totalAmount: formatINR(totalAmount),
    reason: reason || null,
  };

  const customerMail = cancellationEmail(emailData);
  const opsMail = cancellationAlertEmail({ ...emailData, bookingId });

  await Promise.allSettled([
    customerEmail
      ? sendEmail({ to: customerEmail, subject: customerMail.subject, html: customerMail.html })
      : Promise.resolve(false),
    sendEmail({ to: site.opsEmail, subject: opsMail.subject, html: opsMail.html }),
  ]);

  return NextResponse.json({
    ok: true,
    refundAmount,
    refundPercent,
    refundInitiated,
  });
}
