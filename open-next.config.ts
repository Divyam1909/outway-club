import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";

/**
 * Cloudflare Workers build config.
 *
 * On Vercel, everything below is provided by the platform and there is nothing
 * to configure — which is exactly why it is easy to miss that ISR is not a
 * property of Next.js but of the host underneath it. Deploy this app to Workers
 * without the three overrides here and the pages still render: they just never
 * cache, and `revalidatePath` silently does nothing. The site would look
 * correct and be slow, which is the worst way for a regression to present.
 *
 * Each piece maps to something the app actually does:
 *
 *   incrementalCache  Stores the prerendered output of `export const
 *                     revalidate = 300` pages — the trip, blog and destination
 *                     detail pages. Without it every visit re-queries Supabase.
 *
 *   tagCache          Backs `revalidatePath`. Every admin write calls it (see
 *                     src/lib/revalidate.ts), so without this the "publish a
 *                     trip and it appears immediately" behaviour is gone and
 *                     editors wait out the full five minutes.
 *
 *   queue: "direct"   Runs the background revalidation inline instead of
 *                     through a Durable Object. Correct at our traffic: the
 *                     only cost is that two simultaneous misses on the same
 *                     stale page may both regenerate it, and the only benefit
 *                     of the DO queue is de-duplicating that. Revisit if the
 *                     site ever gets busy enough for it to matter.
 */
export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
  tagCache: d1NextTagCache,
  queue: "direct",
});
