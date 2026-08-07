import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  RATE_LIMITS,
  TOO_MANY_REQUESTS,
  isBotSubmission,
  isValidEmail,
  rateLimitRequest,
  sanitizeText,
} from "@/lib/rate-limit";
import { sendEmail, waitlistWelcomeEmail } from "@/lib/email";

const ALLOWED_SOURCES = new Set(["footer", "upcoming", "trip", "home", "blog"]);

/**
 * Newsletter / "notify me about the next escape" signups.
 *
 * Re-subscribing with an address already on the list is treated as success,
 * so the response never reveals whether an address is already registered.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  if (!(await rateLimitRequest(RATE_LIMITS.newsletter, request))) {
    return NextResponse.json(TOO_MANY_REQUESTS, { status: 429 });
  }

  if (isBotSubmission(body)) {
    return NextResponse.json({ ok: true });
  }

  const email = sanitizeText(body.email, 254).toLowerCase();
  const name = sanitizeText(body.name, 120) || null;
  const rawSource = sanitizeText(body.source, 32);
  const source = ALLOWED_SOURCES.has(rawSource) ? rawSource : "footer";

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "That email address doesn't look right." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("newsletter_subscribers")
    .insert({ email, name, source });

  // 23505 = unique violation: they're already subscribed. Not an error here.
  const alreadySubscribed = error?.code === "23505";

  if (error && !alreadySubscribed) {
    console.error("[newsletter] insert failed:", error.message);
    return NextResponse.json(
      { error: "We couldn't add you just now. Please try again in a moment." },
      { status: 500 }
    );
  }

  if (!alreadySubscribed) {
    const welcome = waitlistWelcomeEmail({ email, name });
    await sendEmail({ to: email, subject: welcome.subject, html: welcome.html }).catch(() => false);
  }

  return NextResponse.json({ ok: true });
}
