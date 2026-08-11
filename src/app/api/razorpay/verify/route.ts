import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { recordPaidBooking, type TravelerInput } from "@/lib/bookings";
import { RATE_LIMITS, TOO_MANY_REQUESTS, rateLimitRequest } from "@/lib/rate-limit";

/**
 * Called by the browser as soon as Razorpay's checkout reports success.
 *
 * Its job is narrow: prove the payment is genuine, prove the caller is signed
 * in, and hand off. It does NOT decide what was bought — the signature below
 * is an HMAC over `order_id|payment_id` and says nothing about trip, departure
 * or headcount, so those are read from the Razorpay order itself inside
 * recordPaidBooking. Anything this route reads out of the request body can
 * only ever be decoration.
 *
 * If the customer's browser dies before this fires, the webhook at
 * /api/razorpay/webhook records the same booking from the same order.
 */
interface VerifyPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  travelers?: TravelerInput[];
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

  if (!(await rateLimitRequest(RATE_LIMITS.verifyPayment, request, user.id))) {
    return NextResponse.json(TOO_MANY_REQUESTS, { status: 429 });
  }

  let payload: VerifyPayload;
  try {
    payload = (await request.json()) as VerifyPayload;
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = payload;

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

  const result = await recordPaidBooking({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    expectedUserId: user.id,
    details: {
      travelers: payload.travelers,
      specialRequests: payload.specialRequests,
      contactPhone: payload.contactPhone,
    },
    source: "verify",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ bookingId: result.bookingId });
}
