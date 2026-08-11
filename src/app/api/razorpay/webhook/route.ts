import { NextResponse } from "next/server";
import crypto from "crypto";
import { recordPaidBooking } from "@/lib/bookings";

/**
 * Razorpay's server-to-server report that a payment captured.
 *
 * This exists because /api/razorpay/verify runs in the customer's browser, and
 * browsers close. If someone pays and then loses signal, shuts the laptop, or
 * the tab crashes during the redirect, verify never fires — the money is taken
 * and no booking exists anywhere except the Razorpay dashboard. This route is
 * the safety net, and it is the reason a booking must be recordable without
 * a session: there is no signed-in user on this path, so the owner is taken
 * from the order's own notes.
 *
 * Set it up at Razorpay Dashboard > Settings > Webhooks:
 *   URL     https://outway.club/api/razorpay/webhook
 *   Events  payment.captured
 *   Secret  the same value as RAZORPAY_WEBHOOK_SECRET
 *
 * Status codes matter here: Razorpay retries non-2xx responses with backoff.
 * We return 200 for anything permanent (already booked, junk event) so it
 * stops, and 5xx only when a retry might actually succeed.
 */
export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret || secret.startsWith("your-")) {
    console.error("[webhook] RAZORPAY_WEBHOOK_SECRET is not set — ignoring webhook");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });
  }

  const signature = request.headers.get("x-razorpay-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  // The HMAC is over the exact bytes Razorpay sent. Parsing to JSON first and
  // re-serialising would change the whitespace and never match.
  const raw = await request.text();

  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");

  const valid =
    expected.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));

  if (!valid) {
    console.error("[webhook] signature mismatch — dropping");
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let event: {
    event?: string;
    payload?: { payment?: { entity?: { id?: string; order_id?: string } } };
  };

  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Malformed payload." }, { status: 400 });
  }

  if (event.event !== "payment.captured") {
    // Subscribed to something else, or Razorpay added an event. Acknowledge so
    // it isn't retried forever.
    return NextResponse.json({ ignored: event.event ?? "unknown" });
  }

  const payment = event.payload?.payment?.entity;
  const orderId = payment?.order_id;
  const paymentId = payment?.id;

  if (!orderId || !paymentId) {
    console.error("[webhook] payment.captured with no order_id/id", payment);
    return NextResponse.json({ error: "Incomplete payment entity." }, { status: 400 });
  }

  const result = await recordPaidBooking({
    orderId,
    paymentId,
    // No session on this path — recordPaidBooking takes the owner from the
    // order's notes, which only our own create-order route can write.
    source: "webhook",
  });

  if (!result.ok) {
    // 5xx means "try me again": the gateway was unreachable or the insert
    // failed. Everything else is a decision that a retry won't change.
    const retryable = result.status >= 500;

    console.error(
      `[webhook] could not record booking for order ${orderId} (${result.status}): ${result.error}`
    );

    if (retryable) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ error: result.error, retry: false });
  }

  return NextResponse.json({
    bookingId: result.bookingId,
    created: !result.alreadyExisted,
  });
}
