import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  RATE_LIMITS,
  TOO_MANY_REQUESTS,
  isBotSubmission,
  isValidEmail,
  rateLimitRequest,
  sanitizeMultiline,
  sanitizeText,
} from "@/lib/rate-limit";
import { enquiryAcknowledgementEmail, enquiryAlertEmail, sendEmail } from "@/lib/email";
import { site } from "@/config/site";

/**
 * Contact / enquiry submissions.
 *
 * The browser can no longer insert into `enquiries` directly (that RLS policy
 * was dropped in 0002), so every enquiry passes through here and gets rate
 * limited, bot filtered and length capped before it reaches the database.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  if (!(await rateLimitRequest(RATE_LIMITS.contact, request))) {
    return NextResponse.json(TOO_MANY_REQUESTS, { status: 429 });
  }

  // Silently accept and discard bot submissions so they don't retry.
  if (isBotSubmission(body)) {
    return NextResponse.json({ ok: true });
  }

  const name = sanitizeText(body.name, 120);
  const email = sanitizeText(body.email, 254).toLowerCase();
  const phone = sanitizeText(body.phone, 32) || null;
  const message = sanitizeMultiline(body.message, 4000);
  const tripId = typeof body.tripId === "string" && body.tripId ? body.tripId : null;

  if (name.length < 2) {
    return NextResponse.json({ error: "Please tell us your name." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "That email address doesn't look right." }, { status: 400 });
  }
  if (message.length < 10) {
    return NextResponse.json(
      { error: "Please add a little more detail so we can actually help." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { error } = await admin.from("enquiries").insert({
    name,
    email,
    phone,
    trip_id: tripId,
    message,
  });

  if (error) {
    console.error("[contact] insert failed:", error.message);
    return NextResponse.json(
      { error: "We couldn't save that just now. Please try again in a moment." },
      { status: 500 }
    );
  }

  let tripTitle: string | null = null;
  if (tripId) {
    const { data } = await admin.from("trips").select("title").eq("id", tripId).maybeSingle();
    tripTitle = data?.title ?? null;
  }

  const payload = { name, email, phone, message, tripTitle };

  // Email is best-effort — the enquiry is already safely stored.
  const alert = enquiryAlertEmail(payload);
  const ack = enquiryAcknowledgementEmail(payload);
  await Promise.allSettled([
    sendEmail({ to: site.opsEmail, subject: alert.subject, html: alert.html, replyTo: email }),
    sendEmail({ to: email, subject: ack.subject, html: ack.html, replyTo: site.email }),
  ]);

  return NextResponse.json({ ok: true });
}
