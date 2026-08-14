/**
 * The one thing the bot trap needs on BOTH sides of the network boundary.
 *
 * The forms render this field; the API routes check it. That shared name used
 * to live in `rate-limit.ts`, which imports the Supabase service-role client —
 * so every client form that wanted the constant dragged the admin module into
 * the browser bundle with it. The key itself never shipped (Next replaces
 * non-`NEXT_PUBLIC_` env reads with `undefined` on the client), but the module
 * had no business being there, and `rate-limit.ts` is now marked server-only
 * so that import is a build error rather than a habit.
 *
 * Keep this file free of imports. The moment it pulls in anything server-side,
 * the same leak comes back through a different door.
 */

/** Hidden from humans by CSS. Anything that fills it in is a bot. */
export const HONEYPOT_FIELD = "company_website";
