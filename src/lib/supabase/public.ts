import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Read-only client for public content — published trips, destinations,
 * approved reviews, published posts.
 *
 * The distinction from `./server` is not cosmetic. That client is bound to
 * `cookies()`, and touching cookies during render opts the whole route out of
 * static generation. Because the navbar and every public page read through the
 * data layer, one cookie-bound call at the bottom made *every* page on the site
 * `ƒ` dynamic — `/about` and `/faq`, which are literally static prose, were
 * being server-rendered per request with an auth round-trip attached, and every
 * `export const revalidate` in the app was dead code.
 *
 * Public content has no user context to respect, so it does not need the user's
 * session. Reading it through the anon key lets Next cache the page.
 *
 * This is safe against RLS rather than in spite of it: `anon` is exactly the
 * role an unauthenticated visitor already gets, and every caller additionally
 * filters `is_published` / `is_approved` itself. The one behaviour that changes
 * is that `is_admin()` is false here, so an admin can no longer preview an
 * unpublished trip by visiting its public URL — the admin console is where
 * drafts belong, and a draft leaking into a shared ISR cache would be worse.
 *
 * Never use this for anything user-scoped (bookings, profiles) or for writes.
 * It cannot see the caller, so RLS would deny it anyway — but the failure would
 * look like missing data rather than a permission error, which is the sort of
 * bug that hides. Use `./server` for user context, `./admin` for writes.
 */

let cached: SupabaseClient | null = null;

export function createPublicClient(): SupabaseClient {
  // Safe to memoise across requests precisely because it holds no per-user
  // state — that is the whole point of it.
  if (cached) return cached;

  cached = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  return cached;
}
