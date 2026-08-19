/**
 * Creates or removes the temporary accounts the Playwright suite signs in as,
 * so the console and the contributor flow can be exercised end to end.
 *
 *   node scripts/admin-test-user.mjs create
 *   node scripts/admin-test-user.mjs delete
 *
 * Three accounts, one per role, because the roles are the thing under test:
 * an admin sees everything, a blogger sees the Journal and nothing else, and a
 * customer can send in an article but cannot publish one.
 *
 * Never run `create` against a database you care about without deleting after.
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

export const TEST_ADMIN = {
  email: "playwright-admin@outway.test",
  password: "pw-test-Admin-2026!",
};

export const TEST_BLOGGER = {
  email: "playwright-blogger@outway.test",
  password: "pw-test-Blogger-2026!",
};

export const TEST_READER = {
  email: "playwright-reader@outway.test",
  password: "pw-test-Reader-2026!",
};

const ACCOUNTS = [
  { ...TEST_ADMIN, role: "admin", name: "Playwright Admin" },
  { ...TEST_BLOGGER, role: "blogger", name: "Playwright Blogger" },
  { ...TEST_READER, role: "customer", name: "Playwright Reader" },
];

const action = process.argv[2];

async function findUser(email) {
  const { data } = await admin.auth.admin.listUsers({ perPage: 200 });
  return data?.users.find((user) => user.email === email) ?? null;
}

if (action === "create") {
  for (const account of ACCOUNTS) {
    let user = await findUser(account.email);

    if (!user) {
      const { data, error } = await admin.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata: { full_name: account.name },
      });
      if (error) throw error;
      user = data.user;
    }

    const { error: roleError } = await admin
      .from("profiles")
      .update({ role: account.role, full_name: account.name })
      .eq("id", user.id);
    if (roleError) throw roleError;

    console.log(`${account.role} ready: ${account.email} (${user.id})`);
  }
} else if (action === "delete") {
  for (const account of ACCOUNTS) {
    const user = await findUser(account.email);
    if (!user) {
      console.log(`nothing to delete for ${account.email}`);
      continue;
    }
    // Anything they wrote goes with them — a submission left behind by a
    // deleted test account would sit in the moderation queue for ever.
    await admin.from("blog_posts").delete().eq("author_id", user.id);
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw error;
    console.log(`deleted ${account.email}`);
  }
} else {
  console.error("usage: node scripts/admin-test-user.mjs create|delete");
  process.exit(1);
}
