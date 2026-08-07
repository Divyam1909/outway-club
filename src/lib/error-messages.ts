/**
 * Turns technical failures into sentences a person can act on.
 *
 * Nothing a database driver, an auth provider or a network stack says was
 * written to be read by a customer. `duplicate key value violates unique
 * constraint "trips_slug_key"` tells an admin nothing about what to do next;
 * "Another trip already uses that web address" tells them exactly what to fix.
 *
 * Every user-facing catch in the app routes through here, so the fallback
 * matters as much as the mappings: it must never be blank, and it must never
 * be the raw message.
 */

/** Generic last resort. Used when nothing more specific is known. */
export const GENERIC_ERROR =
  "Something went wrong on our end. Please try again, if it keeps happening, email us.";

/** Shown when fetch itself rejects: no response ever arrived. */
export const NETWORK_ERROR =
  "We couldn't reach the server. Check your connection and try again.";

interface SupabaseLikeError {
  message?: string;
  code?: string;
  details?: string;
  status?: number;
  /** supabase-js sets this: AuthApiError, AuthRetryableFetchError, … */
  name?: string;
}

/**
 * Postgres SQLSTATE codes that surface through PostgREST, mapped to copy that
 * says what happened *and* what to do. `subject` names the thing being saved so
 * one mapping can serve every editor ("trip", "destination", "post").
 */
function postgresMessage(code: string, subject: string): string | null {
  switch (code) {
    case "23505": // unique_violation
      return `Another ${subject} already uses that web address. Change the slug and try again.`;
    case "23503": // foreign_key_violation
      return `Something else still points at this ${subject}, so it can't be removed. Detach or delete those first.`;
    case "23502": // not_null_violation
      return "A required field is still empty. Fill in everything marked required and try again.";
    case "23514": // check_violation
      return "One of the values isn't allowed. Check the numbers and dates, then try again.";
    case "22P02": // invalid_text_representation
      return "One of the fields has the wrong kind of value in it. Check any number or date fields.";
    case "22001": // string_data_right_truncation
      return "One of the fields is longer than we can store. Shorten it and try again.";
    case "42501": // insufficient_privilege
      return "Your account doesn't have permission to do that. Ask an admin to grant access.";
    case "PGRST301": // JWT expired
    case "PGRST302":
      return "Your session expired. Refresh the page and sign in again.";
    case "PGRST116": // no rows returned where one was required
      return "We couldn't find that any more, it may have been deleted in another tab.";
    default:
      return null;
  }
}

/**
 * Supabase Auth returns prose, not codes, so these match on the text. Kept
 * narrow and case-insensitive: a message we don't recognise falls through to
 * the generic copy rather than being shown raw.
 */
function authMessage(raw: string): string | null {
  const message = raw.toLowerCase();

  if (message.includes("invalid login credentials")) {
    return "That email and password don't match an account. Check both, or reset your password.";
  }
  if (message.includes("email not confirmed")) {
    return "Your email address hasn't been confirmed yet. Open the link we sent you, or request a new one.";
  }
  if (message.includes("user already registered") || message.includes("already been registered")) {
    return "An account already exists for that email. Try logging in, or reset your password.";
  }
  if (message.includes("password should be at least")) {
    return "That password is too short. Use at least 8 characters.";
  }
  if (message.includes("should be different from the old password")) {
    return "That's your current password. Choose a different one.";
  }
  if (message.includes("email rate limit") || message.includes("rate limit exceeded")) {
    return "Too many attempts just now. Wait a minute and try again.";
  }
  if (message.includes("over_email_send_rate_limit")) {
    return "We've sent a few emails to that address already. Give it a minute before asking for another.";
  }
  if (
    message.includes("token has expired") ||
    message.includes("invalid or has expired") ||
    message.includes("otp_expired")
  ) {
    return "That link has expired. Links are valid for one hour and can only be used once, request a fresh one.";
  }
  if (message.includes("signups not allowed") || message.includes("signup is disabled")) {
    return "New accounts are closed at the moment. Email us and we'll sort you out.";
  }
  if (message.includes("unable to validate email") || message.includes("invalid email")) {
    return "That email address doesn't look right. Check it and try again.";
  }
  if (message.includes("captcha")) {
    return "The security check didn't pass. Refresh the page and try again.";
  }
  if (message.includes("user not found")) {
    return "We couldn't find an account for that email address.";
  }
  if (
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("load failed")
  ) {
    return NETWORK_ERROR;
  }
  return null;
}

/**
 * The single entry point. Give it whatever the failure produced and the noun
 * for what was being worked on; get back something safe to render.
 *
 * @param error   A Supabase/PostgREST error, an Error, or anything at all.
 * @param subject What was being acted on, for the wording ("trip", "post").
 * @param fallback Copy to use when the error isn't recognised.
 */
export function friendlyError(
  error: unknown,
  subject = "record",
  fallback: string = GENERIC_ERROR
): string {
  if (!error) return fallback;

  const candidate = error as SupabaseLikeError;

  if (typeof candidate.code === "string") {
    const mapped = postgresMessage(candidate.code, subject);
    if (mapped) return mapped;
  }

  // Status beats prose. supabase-js throws AuthRetryableFetchError for 429s
  // and for genuine connection failures alike, so its message ("Failed to
  // fetch") would otherwise send a rate-limited person off to check their wifi.
  if (candidate.status === 429) {
    return "Too many attempts in a short time. Wait a minute, then try again.";
  }

  const raw = typeof candidate.message === "string" ? candidate.message : "";
  if (raw) {
    const mapped = authMessage(raw);
    if (mapped) return mapped;
  }

  // Storage and gateway failures arrive as plain HTTP statuses.
  if (candidate.status === 413) {
    return "That file is too large. Pick a smaller one and try again.";
  }
  if (candidate.status === 401 || candidate.status === 403) {
    return "Your session expired or you don't have permission. Refresh the page and sign in again.";
  }
  if (typeof candidate.status === "number" && candidate.status >= 500) {
    return "The service is having a moment. Please try again shortly.";
  }

  return fallback;
}

/**
 * For `catch` blocks around `fetch`. A rejected fetch means the request never
 * completed, which is a connection problem — distinct from a server that
 * answered with an error, and worth saying so, because "try again" is genuinely
 * the right advice here.
 */
export function networkError(): string {
  return NETWORK_ERROR;
}

/**
 * Reads `{ error }` off an API response body, falling back to copy chosen by
 * the caller. Every route in this app returns a written message, but a proxy,
 * a gateway timeout or a crash can still produce HTML or an empty body — this
 * makes sure that case shows the fallback rather than "undefined".
 */
export async function messageFromResponse(
  response: Response,
  fallback: string = GENERIC_ERROR
): Promise<string> {
  const data = await response.json().catch(() => null);

  if (data && typeof data === "object" && typeof (data as { error?: unknown }).error === "string") {
    return (data as { error: string }).error;
  }

  // No readable body — say something useful based on the status alone.
  if (response.status === 401) return "Please sign in and try again.";
  if (response.status === 403) return "You don't have permission to do that.";
  if (response.status === 404) return "We couldn't find that any more.";
  if (response.status === 429) {
    return "That's a lot of attempts in a short time. Please wait a minute and try again.";
  }
  if (response.status === 503) {
    return "That service is temporarily unavailable. Please try again shortly.";
  }
  if (response.status >= 500) return GENERIC_ERROR;

  return fallback;
}
