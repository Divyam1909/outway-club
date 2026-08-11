/**
 * Promote (or demote) an admin without opening the SQL editor.
 *
 *   npm run admin                            (or: list)
 *   npm run admin -- you@yourdomain.com
 *   npm run admin -- demote someone@yourdomain.com
 *
 * There is no such thing as a separate "admin login": an admin is an ordinary
 * account — signed up at /signup with an email and password like everyone
 * else — whose `profiles.role` is 'admin'. That flips the guard in
 * src/lib/auth.ts, which is what /admin and every /api/admin route check.
 *
 * The first one has to be made from outside the app, because promoting someone
 * through /admin/users requires already being an admin. After that, do it in
 * the UI. This uses the service-role key, which the database's role guard
 * (supabase/migrations/0002_launch.sql) treats as the bootstrap path.
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

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local."
  );
  process.exit(1);
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Accept `list` and `--list` alike: `npm run admin -- --list` gets eaten by npm
// as one of its own config flags and never reaches us, so the bare word has to
// work too. Anything with an @ in it is the email, wherever it sits.
const args = process.argv.slice(2).map((arg) => arg.replace(/^--/, "").toLowerCase());
const demote = args.includes("demote");
const list = args.includes("list");
const email = args.find((arg) => arg.includes("@"))?.trim();
const unknown = args.filter(
  (arg) => arg !== "demote" && arg !== "list" && !arg.includes("@")
);

async function listAdmins() {
  const { data, error } = await admin
    .from("profiles")
    .select("email, full_name, created_at")
    .eq("role", "admin")
    .order("created_at");

  if (error) throw error;
  if (!data?.length) {
    console.log("No admins yet. Run: node scripts/make-admin.mjs you@yourdomain.com");
    return;
  }
  console.log(`${data.length} admin${data.length === 1 ? "" : "s"}:`);
  for (const row of data) console.log(`  ${row.email}${row.full_name ? `  (${row.full_name})` : ""}`);
}

if (unknown.length) {
  console.error(`Not an email or a command: ${unknown.join(", ")}`);
  console.error("usage: node scripts/make-admin.mjs [demote] <email> | list");
  process.exit(1);
}

// No arguments means "just tell me who the admins are" — the same as `list`.
if (list || !email) {
  await listAdmins();
  process.exit(0);
}

const { data: profile, error: lookupError } = await admin
  .from("profiles")
  .select("id, email, role")
  .ilike("email", email)
  .maybeSingle();

if (lookupError) throw lookupError;

if (!profile) {
  console.error(
    `No account found for ${email}.\n` +
      "Sign up at /signup with that address first — this promotes an existing\n" +
      "account, it doesn't create one."
  );
  process.exit(1);
}

const role = demote ? "customer" : "admin";

if (profile.role === role) {
  console.log(`${email} is already ${role}. Nothing to do.`);
  process.exit(0);
}

// Refuse to remove the last admin, the same rule /api/admin/users/role enforces.
if (demote) {
  const { count } = await admin
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "admin");

  if ((count ?? 0) <= 1) {
    console.error("That's the only admin left. Promote someone else first.");
    process.exit(1);
  }
}

const { error: updateError } = await admin
  .from("profiles")
  .update({ role })
  .eq("id", profile.id);

if (updateError) throw updateError;

console.log(`${email} is now ${role}.`);
if (!demote) console.log("Sign out and back in, then open /admin.");
