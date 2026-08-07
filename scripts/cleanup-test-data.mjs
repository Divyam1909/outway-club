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

// Rate-limit counters are ephemeral; clearing them resets the test budget.
await admin.from("rate_limits").delete().neq("key", "");

const { count: enquiriesAfter } = await admin
  .from("enquiries")
  .select("*", { count: "exact", head: true });

const { count: subscribers } = await admin
  .from("newsletter_subscribers")
  .select("*", { count: "exact", head: true });

console.log(`enquiries   ${enquiriesBefore} -> ${enquiriesAfter}`);
console.log(`subscribers ${subscribers} remaining`);
console.log("rate limits cleared");
