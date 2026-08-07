import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/error-messages";

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
      friendlyError(
        { message: authError },
        "link",
        "That link didn't work. Please request a new one."
      )
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
      return redirectWithMessage(
        origin,
        friendlyError(
          error,
          "link",
          "That link has expired or has already been used. Request a fresh one and it'll arrive in seconds."
        )
      );
    } catch (caught) {
      // Supabase unreachable — never leave the visitor on a blank redirect.
      console.error("[auth/callback] code exchange threw:", caught);
      return redirectWithMessage(
        origin,
        "We couldn't complete that sign-in just now. Please try the link again in a moment."
      );
    }
  }

  return redirectWithMessage(
    origin,
    "That link is no longer valid. Password and confirmation links work once and expire after an hour, request a new one below."
  );
}

/** Bounce back to the login screen with a message it knows how to display. */
function redirectWithMessage(origin: string, message: string) {
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(message)}`);
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
