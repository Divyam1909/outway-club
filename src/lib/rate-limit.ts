/**
 * Server-side rate limiting and bot filtering for public endpoints.
 *
 * Counters live in Postgres (see `bump_rate_limit` in 0002_launch.sql) rather
 * than in memory, because serverless instances don't share memory — an
 * in-process Map would reset on every cold start and let a bot straight
 * through. The table is only ever touched by the service role.
 */

import { createAdminClient } from "@/lib/supabase/admin";

export interface RateLimitRule {
  /** Namespace, so one IP's contact-form budget is separate from its orders. */
  bucket: string;
  /** Requests allowed per window. */
  limit: number;
  /** Window length in seconds. */
  windowSeconds: number;
}

export const RATE_LIMITS = {
  contact: { bucket: "contact", limit: 3, windowSeconds: 600 },
  newsletter: { bucket: "newsletter", limit: 5, windowSeconds: 3600 },
  createOrder: { bucket: "create_order", limit: 8, windowSeconds: 600 },
  // Generous: a real customer hits this once per payment, but a retrying
  // browser on a flaky connection can legitimately hit it several times.
  verifyPayment: { bucket: "verify_payment", limit: 20, windowSeconds: 600 },
  review: { bucket: "review", limit: 5, windowSeconds: 3600 },
  cancelBooking: { bucket: "cancel_booking", limit: 5, windowSeconds: 3600 },
  blogComment: { bucket: "blog_comment", limit: 4, windowSeconds: 900 },
} as const satisfies Record<string, RateLimitRule>;

/**
 * Best-effort client identifier. Behind Vercel/Cloudflare the left-most entry
 * of x-forwarded-for is the real client; everything after it is proxy chain.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    "unknown"
  );
}

/**
 * Returns true when the caller is within budget.
 *
 * Fails open: if the counter table is unreachable we let the request through
 * rather than blocking a paying customer over a logging dependency.
 */
export async function checkRateLimit(
  rule: RateLimitRule,
  identifier: string
): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("bump_rate_limit", {
      p_key: `${rule.bucket}:${identifier}`,
      p_limit: rule.limit,
      p_window_seconds: rule.windowSeconds,
    });

    if (error) {
      console.error("[rate-limit] rpc failed, allowing request:", error.message);
      return true;
    }
    return data !== false;
  } catch (error) {
    console.error("[rate-limit] threw, allowing request:", error);
    return true;
  }
}

/** Convenience wrapper: rate limit a request by its client IP. */
export async function rateLimitRequest(
  rule: RateLimitRule,
  request: Request,
  extraKey?: string
): Promise<boolean> {
  const identifier = extraKey ? `${getClientIp(request)}:${extraKey}` : getClientIp(request);
  return checkRateLimit(rule, identifier);
}

export const TOO_MANY_REQUESTS = {
  error: "That's a few too many attempts in a short window. Please wait a few minutes and try again.",
};

/**
 * Honeypot: a field hidden from humans by CSS. Anything that fills it in is
 * a form-filling bot. We return success to the caller so the bot doesn't
 * learn it was caught, but skip the write.
 */
export const HONEYPOT_FIELD = "company_website";

export function isBotSubmission(body: Record<string, unknown>): boolean {
  const trap = body[HONEYPOT_FIELD];
  if (typeof trap === "string" && trap.trim().length > 0) return true;

  // Humans take at least a couple of seconds to fill a form; scripted posts
  // are typically instant. `formStartedAt` is stamped when the form mounts.
  const startedAt = Number(body.formStartedAt);
  if (Number.isFinite(startedAt) && startedAt > 0) {
    const elapsedMs = Date.now() - startedAt;
    if (elapsedMs < 2000) return true;
  }
  return false;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && EMAIL_PATTERN.test(value.trim());
}

/** Trim, collapse whitespace, and hard-cap length before it hits the DB. */
export function sanitizeText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

/** Same as sanitizeText but preserves intentional line breaks. */
export function sanitizeMultiline(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength);
}
