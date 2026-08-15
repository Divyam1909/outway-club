import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Landing point for every Supabase Auth email link — signup confirmation,
 * password recovery and magic links all come back through here with a PKCE
 * `code` to exchange for a session.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  // Supabase reports expired / already-used links as query params rather than
  // an HTTP error, so surface a useful message instead of a blank redirect.
  // The raw text is provider wording ("otp_expired", "Email link is invalid or
  // has expired") and goes through the translator before anyone reads it.
  const authError = searchParams.get("error_description") ?? searchParams.get("error");
  if (authError) {
    return redirectWithMessage(
      origin,
      linkFailureMessage(authError, next, searchParams.get("error_code"))
    );
  }

  if (code) {
    const supabase = await createClient();

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      console.error("[auth/callback] code exchange failed:", error.message);
      return redirectWithMessage(origin, linkFailureMessage(error.message, next, null));
    } catch (caught) {
      // Supabase unreachable — never leave the visitor on a blank redirect.
      console.error("[auth/callback] code exchange threw:", caught);
      return redirectWithMessage(
        origin,
        "We couldn't complete that sign-in just now. Please try the link again in a moment."
      );
    }
  }

  // Landed here with neither a code nor an error — a link that lost its query
  // string, or someone opening /auth/callback directly.
  return redirectWithMessage(origin, linkFailureMessage("invalid", next, null));
}

/** Bounce back to the login screen with a message it knows how to display. */
function redirectWithMessage(origin: string, message: string) {
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(message)}`);
}

/**
 * Turn a failed email link into something the person can act on.
 *
 * The subtlety this exists for: when a SIGNUP confirmation link fails, the
 * account is usually already confirmed anyway. Two things cause it, and both
 * consume the one-time token on the way past —
 *
 *   1. A mail scanner or browser prefetch opens the link first. Supabase marks
 *      the address confirmed, then the human's real click finds the token
 *      spent and reports `otp_expired`.
 *   2. The link is opened on a different device from the one that signed up.
 *      The PKCE `code_verifier` lives in a cookie in the ORIGINAL browser, so
 *      the exchange has nothing to verify against — sign up on a laptop, open
 *      the mail on your phone, and you land here.
 *
 * In both cases telling someone "that link expired, request a new one" is
 * actively wrong: there is nothing to request, their account works, and they
 * only need to log in. Requesting another link just repeats the loop.
 *
 * Password recovery is genuinely different — an unused reset link really is
 * gone, and a fresh one is the correct next step — so it keeps that wording.
 */
function linkFailureMessage(raw: string, next: string, errorCode: string | null): string {
  const text = `${raw} ${errorCode ?? ""}`.toLowerCase();
  const isRecovery = next.startsWith("/reset-password");

  // Cross-device PKCE: the verifier cookie is in another browser. Naming the
  // cause is what stops someone retrying the same link on the same phone.
  if (text.includes("code verifier") || text.includes("code_verifier")) {
    return isRecovery
      ? "Open the reset link in the same browser you requested it from, or request a fresh one below."
      : "You opened that link on a different device from the one you signed up on. Your email is confirmed — just log in below.";
  }

  const usedOrExpired =
    text.includes("expired") || text.includes("invalid") || text.includes("already");

  if (usedOrExpired) {
    return isRecovery
      ? "That reset link has expired or has already been used. Links last one hour and work once — request a fresh one below."
      : "That confirmation link has already been used. Your account is almost certainly active — log in below and you're in. If it isn't, reset your password to get a fresh link.";
  }

  return isRecovery
    ? "That reset link didn't work. Request a fresh one below."
    : "That confirmation link didn't work. Try logging in below — your account may already be active.";
}

/**
 * Only ever redirect to a path on this site. Rejects absolute URLs and
 * protocol-relative paths so a crafted link can't bounce a freshly
 * authenticated user off to someone else's domain.
 */
function safeNext(value: string | null): string {
  if (!value) return "/account";
  if (!value.startsWith("/") || value.startsWith("//")) return "/account";
  return value;
}
