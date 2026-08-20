/**
 * Removes everything the Playwright suite writes to the database.
 *
 *   node scripts/cleanup-test-data.mjs
 *
 * Matches only the fixed test addresses and prefixes below, so real enquiries
 * and real subscribers are never touched.
 */
import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createClient } = require("@supabase/supabase-js");

const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    })
);

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { count: enquiriesBefore } = await admin
  .from("enquiries")
  .select("*", { count: "exact", head: true });

await admin.from("enquiries").delete().or(
  "email.eq.playwright@example.com,email.like.burst-%@example.com,email.eq.bot@example.com"
);

await admin.from("newsletter_subscribers").delete().like("email", "pw-%@example.com");

// Booking requests from the questionnaire, same rule: fixed test addresses only.
await admin
  .from("trip_requests")
  .delete()
  .or("email.eq.playwright-request@example.com,email.like.pw-%@example.com");

// Journal posts and destinations the suite creates carry a fixed slug prefix.
// Comments cascade with their post; anything orphaned is caught by email.
await admin.from("blog_comments").delete().like("author_email", "pw-%@example.com");
await admin.from("blog_posts").delete().like("slug", "pw-test-%");
await admin.from("destinations").delete().like("slug", "pw-test-%");

// Reader submissions from roles-and-promos.spec.ts. These matter more than the
// rest of this file: the spec puts them through the full review flow, so they
// end up **published** and publicly visible on /blog rather than sitting
// harmlessly in a queue. Five of them were live on 20 Aug 2026 before this was
// added. The title is `Playwright test piece <timestamp>`, which slugifies to
// this prefix.
await admin.from("blog_posts").delete().like("slug", "playwright-test-piece-%");

// Promo codes from the same spec. `normalizeCode` strips punctuation, so these
// cannot use the `pw-test-` prefix everything else does — the spec generates
// `PWTEST<digits>`. Redemptions cascade with the code.
await admin.from("promo_codes").delete().like("code", "PWTEST%");

// Rate-limit counters are ephemeral; clearing them resets the test budget.
await admin.from("rate_limits").delete().neq("key", "");

const { count: enquiriesAfter } = await admin
  .from("enquiries")
  .select("*", { count: "exact", head: true });

const { count: subscribers } = await admin
  .from("newsletter_subscribers")
  .select("*", { count: "exact", head: true });

const { count: posts } = await admin
  .from("blog_posts")
  .select("*", { count: "exact", head: true });

const { count: requests } = await admin
  .from("trip_requests")
  .select("*", { count: "exact", head: true });

console.log(`enquiries   ${enquiriesBefore} -> ${enquiriesAfter}`);
console.log(`requests    ${requests} remaining`);
console.log(`subscribers ${subscribers} remaining`);
console.log(`blog posts  ${posts} remaining`);
console.log("rate limits cleared");
