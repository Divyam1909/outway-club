import { test } from "@playwright/test";

const ADMIN = { email: "playwright-admin@outway.test", password: "pw-test-Admin-2026!" };

test("admin screenshots", async ({ page }, testInfo) => {
  await page.goto("/login");
  await page.locator("#login-email").fill(ADMIN.email);
  await page.locator("#login-password").fill(ADMIN.password);
  await page.getByRole("button", { name: /^Log in$/ }).click();
  await page.waitForURL(/\/account/);

  for (const [name, path] of [
    ["dashboard", "/admin"],
    ["destinations", "/admin/destinations"],
    ["destination-new", "/admin/destinations/new"],
    ["blog", "/admin/blog"],
    ["blog-new", "/admin/blog/new"],
    ["blog-comments", "/admin/blog/comments"],
    ["users", "/admin/users"],
    ["bookings", "/admin/bookings"],
    ["reviews", "/admin/reviews"],
    ["enquiries", "/admin/enquiries"],
    ["subscribers", "/admin/subscribers"],
  ] as const) {
    await page.goto(path, { waitUntil: "networkidle" });
    await page.screenshot({ path: `tests/__screens__/${testInfo.project.name}-admin-${name}.png`, fullPage: true });
  }
});
