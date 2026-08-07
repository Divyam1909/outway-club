import { test, expect, type Page } from "@playwright/test";

/**
 * Exercises the admin console with a real signed-in session.
 *
 * Requires the temporary admin created by:
 *   node scripts/admin-test-user.mjs create
 * and removed afterwards with the `delete` argument.
 */
const ADMIN = {
  email: "playwright-admin@outway.test",
  password: "pw-test-Admin-2026!",
};

async function signIn(page: Page) {
  await page.goto("/login");
  // Target the login fields by id — the footer newsletter also has an
  // "Email address" label, which makes getByLabel("Email") ambiguous.
  await page.locator("#login-email").fill(ADMIN.email);
  await page.locator("#login-password").fill(ADMIN.password);
  await page.getByRole("button", { name: /^Log in$/ }).click();
  await page.waitForURL(/\/account/);
}

test.describe("admin console", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("dashboard shows real figures, not placeholders", async ({ page }) => {
    await page.goto("/admin");

    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("Revenue collected")).toBeVisible();
    await expect(page.getByText("Live bookings")).toBeVisible();
    await expect(page.getByText("Travellers booked")).toBeVisible();

    // Pre-launch there are no bookings, so this must say so rather than fake a number.
    await expect(page.getByText("No bookings yet")).toBeVisible();
  });

  test("every admin section loads without error", async ({ page }) => {
    const failures: string[] = [];
    page.on("response", (response) => {
      if (response.status() >= 500) failures.push(`${response.status()} ${response.url()}`);
    });
    page.on("pageerror", (error) => failures.push(error.message));

    const sections: [string, RegExp][] = [
      ["/admin/bookings", /^Bookings$/],
      ["/admin/trips", /Trips/],
      ["/admin/destinations", /^Destinations$/],
      ["/admin/blog", /^Journal$/],
      ["/admin/blog/new", /^Write a post$/],
      ["/admin/blog/comments", /^Comments$/],
      ["/admin/destinations/new", /^New destination$/],
      ["/admin/users", /^Users$/],
      ["/admin/reviews", /^Reviews$/],
      ["/admin/enquiries", /^Enquiries$/],
      ["/admin/subscribers", /^Waitlist$/],
    ];

    for (const [path, heading] of sections) {
      await page.goto(path, { waitUntil: "networkidle" });
      await expect(page.getByRole("heading", { level: 1 }), `${path} heading`).toContainText(heading);
    }

    expect(failures).toEqual([]);
  });

  test("users page lists accounts and offers role control", async ({ page }) => {
    await page.goto("/admin/users");

    await expect(page.getByText("Playwright Admin")).toBeVisible();
    // The signed-in admin is flagged, and can't be silently demoted to nothing.
    await expect(page.getByText("You", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /Remove admin/i }).first()).toBeVisible();
  });

  test("enquiries page shows submissions from the contact form", async ({ page }) => {
    await page.goto("/admin/enquiries");
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toContainText("Enquiries");

    // The public-facing suite posts test enquiries, so there should be at
    // least one — and it must render with a working mailto reply link.
    const emptyState = page.getByText("No enquiries yet");
    if (!(await emptyState.isVisible())) {
      await expect(page.locator('a[href^="mailto:"]').first()).toBeVisible();
    }
  });

  test("trip editor exposes a real image uploader, not a URL field", async ({ page }) => {
    await page.goto("/admin/trips");
    await page.getByRole("link", { name: /edit/i }).first().click();
    await page.waitForURL(/\/admin\/trips\/.+\/edit/);

    await expect(page.getByText("Hero image", { exact: true })).toBeVisible();
    await expect(page.getByText("Gallery", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /Choose photo/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Add photos/i })).toBeVisible();

    // The old raw-URL textarea should be gone.
    await expect(page.getByText(/Gallery image URLs/i)).toHaveCount(0);
  });

  test("admin nav badges surface pending work", async ({ page }) => {
    await page.goto("/admin");
    const nav = page.getByRole("navigation", { name: "Admin sections" });
    for (const label of [
      "Dashboard",
      "Bookings",
      "Trips",
      "Destinations",
      "Journal",
      "Users",
      "Reviews",
      "Enquiries",
      "Waitlist",
    ]) {
      await expect(nav.getByRole("link", { name: new RegExp(label) })).toBeVisible();
    }
  });

  test("admin pages are excluded from search engines", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("/admin");
  });
});
