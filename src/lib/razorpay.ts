import Razorpay from "razorpay";

/**
 * True only when real credentials are present — guards against the
 * `.env.example` placeholders being deployed by accident, which would
 * otherwise surface as an opaque 500 at checkout.
 */
export function isRazorpayConfigured(): boolean {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";
  const secret = process.env.RAZORPAY_KEY_SECRET ?? "";
  return (
    keyId.startsWith("rzp_") &&
    !keyId.includes("xxxx") &&
    secret.length > 8 &&
    !secret.startsWith("your-")
  );
}

export function getRazorpayInstance() {
  return new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
}
