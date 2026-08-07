/**
 * Creates or removes a temporary admin account so the admin console can be
 * exercised end to end by Playwright.
 *
 *   node scripts/admin-test-user.mjs create
 *   node scripts/admin-test-user.mjs delete
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

const action = process.argv[2];

async function findUser() {
  const { data } = await admin.auth.admin.listUsers({ perPage: 200 });
  return data?.users.find((user) => user.email === TEST_ADMIN.email) ?? null;
}

if (action === "create") {
  let user = await findUser();

  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email: TEST_ADMIN.email,
      password: TEST_ADMIN.password,
      email_confirm: true,
      user_metadata: { full_name: "Playwright Admin" },
    });
    if (error) throw error;
    user = data.user;
  }

  const { error: roleError } = await admin
    .from("profiles")
    .update({ role: "admin", full_name: "Playwright Admin" })
    .eq("id", user.id);
  if (roleError) throw roleError;

  console.log(`admin ready: ${TEST_ADMIN.email} (${user.id})`);
} else if (action === "delete") {
  const user = await findUser();
  if (!user) {
    console.log("nothing to delete");
  } else {
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw error;
    console.log(`deleted ${TEST_ADMIN.email}`);
  }
} else {
  console.error("usage: node scripts/admin-test-user.mjs create|delete");
  process.exit(1);
}
