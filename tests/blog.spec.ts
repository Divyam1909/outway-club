import { test, expect, type Page } from "@playwright/test";

/**
 * The journal, end to end: an admin writes and publishes a post, a reader
 * finds it, reads it and comments, the admin moderates the comment, and the
 * post is removed again.
 *
 * Everything is created and deleted inside the run, so this leaves the
 * database as it found it — the site carries no seeded editorial content and
 * this suite must not become the exception. `scripts/cleanup-test-data.mjs`
 * sweeps up anything a failed run leaves behind (slugs are prefixed
 * `pw-test-`).
 *
 * Requires the temporary admin from:  node scripts/admin-test-user.mjs create
 */
const ADMIN = {
  email: "playwright-admin@outway.test",
  password: "pw-test-Admin-2026!",
};

/** A 1×1 PNG — enough for the uploader to produce a real storage URL. */
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

async function signIn(page: Page) {
  await page.goto("/login");
  // Target by id — the footer newsletter also has an "Email address" label.
  await page.locator("#login-email").fill(ADMIN.email);
  await page.locator("#login-password").fill(ADMIN.password);
  await page.getByRole("button", { name: /^Log in$/ }).click();
  await page.waitForURL(/\/account/);
}

test.describe("the journal, signed out", () => {
  test("index renders and is reachable from the nav", async ({ page, isMobile }) => {
    await page.goto("/blog", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Field notes/i);
    await expect(page.locator("h1")).toHaveCount(1);

    await page.goto("/");
    if (isMobile) await page.getByRole("button", { name: /open menu/i }).click();

    const nav = page.getByRole("navigation", { name: isMobile ? "Mobile" : "Main" });
    await nav.getByRole("link", { name: "Journal", exact: true }).click();
    await page.waitForURL("**/blog");
  });

  test("index fits the viewport", async ({ page }) => {
    await page.goto("/blog", { waitUntil: "networkidle" });
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth - overflow.clientWidth).toBeLessThanOrEqual(1);
  });

  test("an unknown post 404s rather than erroring", async ({ page }) => {
    const response = await page.goto("/blog/a-post-that-does-not-exist");
    expect(response?.status()).toBe(404);
  });

  test("sitemap covers the journal and robots leaves it indexable", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/blog");

    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).not.toMatch(/Disallow:\s*\/blog/);
  });

  test("comment endpoint rejects an unknown post", async ({ request }) => {
    const response = await request.post("/api/blog/comments", {
      headers: { "x-forwarded-for": `198.51.100.${Math.floor(Math.random() * 250) + 1}` },
      data: {
        postId: "00000000-0000-0000-0000-000000000000",
        authorName: "Nobody",
        authorEmail: "pw-nobody@example.com",
        body: "This should never be stored anywhere.",
        formStartedAt: Date.now() - 5000,
      },
    });
    expect(response.status()).toBe(404);
  });

  test("comment endpoint swallows honeypot submissions", async ({ request }) => {
    const response = await request.post("/api/blog/comments", {
      headers: { "x-forwarded-for": `198.51.100.${Math.floor(Math.random() * 250) + 1}` },
      data: {
        postId: "00000000-0000-0000-0000-000000000000",
        authorName: "Spam Bot",
        authorEmail: "pw-bot@example.com",
        body: "Buy cheap things, definitely not spam.",
        formStartedAt: Date.now() - 5000,
        company_website: "http://spam.example",
      },
    });
    // 200 so the bot doesn't learn it was caught — and nothing is written.
    expect(response.status()).toBe(200);
  });

  test("post endpoints reject anonymous callers", async ({ request }) => {
    const create = await request.post("/api/admin/blog/posts", {
      data: { title: "Unauthorised", contentHtml: "<p>nope</p>", status: "published" },
    });
    expect([401, 403]).toContain(create.status());

    const remove = await request.delete(
      "/api/admin/blog/posts/00000000-0000-0000-0000-000000000000"
    );
    expect([401, 403]).toContain(remove.status());

    const moderate = await request.patch(
      "/api/admin/blog/comments/00000000-0000-0000-0000-000000000000",
      { data: { isApproved: true } }
    );
    expect([401, 403]).toContain(moderate.status());
  });
});

test.describe("writing, reading and moderating a post", () => {
  // One long journey rather than several short tests: each step depends on
  // state the previous one left behind.
  test("full lifecycle", async ({ page }, testInfo) => {
    test.slow();

    // Unique per project *and* per run: the two projects execute in parallel,
    // and a slug left behind by an interrupted run must not block the next one
    // (slugs are unique in the database).
    const suffix = `${testInfo.project.name}-${Date.now()}`;
    const slug = `pw-test-journal-${suffix}`;
    const title = `Playwright journal entry ${suffix}`;
    const heading = "What the second morning actually looks like";
    // The moderation queue is shared, so the commenter's name has to be unique
    // too — otherwise the parallel project's pending comment can be the one
    // this run publishes.
    const reader = `Playwright Reader ${suffix}`;
    const paragraph =
      "This paragraph exists so the published article clears the minimum body length the publish endpoint enforces, and so the reading-time estimate has real words to count.";

    await signIn(page);

    // --- Write -------------------------------------------------------------
    await page.goto("/admin/blog");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Journal");

    await page.getByRole("link", { name: /Write a post/i }).click();
    await page.waitForURL("**/admin/blog/new");

    await page.locator("#post-title").fill(title);
    await page.locator("#post-slug").fill(slug);
    await page.locator("#post-tags").fill("playwright, testing");

    const editor = page.getByRole("textbox", { name: "Article body" });
    await editor.click();
    await page.keyboard.type(paragraph);

    // A real H2, applied from the toolbar.
    await page.keyboard.press("Enter");
    await page.keyboard.type(heading);
    await page.getByRole("button", { name: "Heading", exact: true }).click();

    // Then a bold run in a fresh paragraph. The caret is still in the heading,
    // so Enter opens the next block from there — no re-clicking needed, which
    // would drop the caret wherever the pointer happened to land.
    await page.keyboard.press("Enter");
    await page.getByRole("button", { name: "Paragraph", exact: true }).click();
    await page.getByRole("button", { name: "Bold", exact: true }).click();
    await page.keyboard.type("Bold closing line.");

    await expect(page.getByText(/\d+ words? · \d+ min read/)).toBeVisible();

    // --- Publish -----------------------------------------------------------
    await page.getByRole("button", { name: /^Publish$/ }).click();
    await page.waitForURL("**/admin/blog");
    // The list renders as a table on desktop and stacked cards on mobile, and
    // both are in the DOM — assert on whichever one this viewport shows.
    await expect(page.getByText(title).filter({ visible: true }).first()).toBeVisible();

    // --- Read --------------------------------------------------------------
    await page.goto(`/blog/${slug}`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 1 })).toContainText(title);
    await expect(page.getByRole("heading", { level: 2, name: heading })).toBeVisible();
    await expect(page.locator(".post-prose b, .post-prose strong")).toContainText("Bold closing");
    await expect(page.getByText(/min read/).first()).toBeVisible();

    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const article = blocks
      .map((block) => JSON.parse(block))
      .find((entry) => entry["@type"] === "BlogPosting");
    expect(article, "BlogPosting structured data").toBeTruthy();
    expect(article.headline).toBe(title);

    // It shows up on the index and under its tag.
    await page.goto("/blog", { waitUntil: "networkidle" });
    await expect(page.getByRole("link", { name: title }).first()).toBeVisible();

    await page.goto("/blog?tag=playwright", { waitUntil: "networkidle" });
    await expect(page.getByRole("link", { name: title }).first()).toBeVisible();

    // --- Comment ------------------------------------------------------------
    // Claim a synthetic client IP so this run gets its own comment budget.
    // Both projects otherwise share one, and the limiter's counters live in
    // Postgres and survive between runs — so a re-run inside 15 minutes would
    // be throttled and the moderation steps below would have nothing to work
    // on. (The limiter itself is covered by the API tests above.)
    await page.setExtraHTTPHeaders({
      "x-forwarded-for": `203.0.113.${Math.floor(Math.random() * 200) + 20}`,
    });

    await page.goto(`/blog/${slug}`);
    await page.locator("#comment-name").fill(reader);
    await page.locator("#comment-email").fill(`pw-reader-${suffix}@example.com`);
    await page
      .locator("#comment-body")
      .fill("Read this properly and it held up. Leaving a comment to exercise the moderation queue.");
    await page.getByRole("button", { name: "4 stars" }).click();

    // The endpoint treats a submission posted within 2s of the form mounting
    // as a script, answers 200 and stores nothing — so a browser driven at
    // full speed would look exactly like the bots this is meant to catch.
    await page.waitForTimeout(2500);
    await page.getByRole("button", { name: /Post comment/i }).click();

    await expect(page.getByText(/Thanks for reading properly/i)).toBeVisible({ timeout: 20_000 });

    // Unmoderated, so it must not be public yet.
    await page.goto(`/blog/${slug}`, { waitUntil: "networkidle" });
    await expect(page.getByText(reader)).toHaveCount(0);

    // --- Moderate -----------------------------------------------------------
    await page.goto("/admin/blog/comments", { waitUntil: "networkidle" });
    const pending = page.locator("li").filter({ hasText: reader }).first();
    await expect(pending).toBeVisible();

    // Retry the click: a button clicked before React has hydrated does
    // nothing at all and reports no error, which on the slower mobile profile
    // is a coin toss. The row flipping to "Hide" is proof the write landed.
    await expect(async () => {
      await pending.getByRole("button", { name: /Publish/i }).click();
      await expect(pending.getByRole("button", { name: /Hide/i })).toBeVisible({ timeout: 5_000 });
    }).toPass({ timeout: 30_000 });

    await page.goto(`/blog/${slug}`, { waitUntil: "networkidle" });
    await expect(page.getByText(reader)).toBeVisible();

    // --- Clean up -----------------------------------------------------------
    await page.goto("/admin/blog", { waitUntil: "networkidle" });
    await expect(async () => {
      page.once("dialog", (dialog) => dialog.accept());
      await page
        .locator("tr:visible, li:visible")
        .filter({ hasText: title })
        .first()
        .getByRole("button", { name: /Delete/i })
        .click();
      await expect(page.getByText(title)).toHaveCount(0, { timeout: 5_000 });
    }).toPass({ timeout: 30_000 });

    await expect
      .poll(async () => (await page.request.get(`/blog/${slug}`)).status(), { timeout: 20_000 })
      .toBe(404);
  });
});

test.describe("destination management", () => {
  test("an admin can create, edit and delete a destination", async ({ page }, testInfo) => {
    test.slow();

    const suffix = `${testInfo.project.name}-${Date.now()}`;
    const slug = `pw-test-place-${suffix}`;
    const name = `Playwright Valley ${suffix}`;

    await signIn(page);

    await page.goto("/admin/destinations");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Destinations");

    // --- Create --------------------------------------------------------------
    await page.getByRole("link", { name: /New destination/i }).click();
    await page.waitForURL("**/admin/destinations/new");

    await page.locator("#destination-name").fill(name);
    await page.locator("#destination-slug").fill(slug);
    await page.locator("#destination-region").fill("Test Range");
    await page.locator("#destination-tagline").fill("Created by the end-to-end suite.");

    // The hero image is required, and the form must say so itself rather than
    // letting the write fail at the database.
    await page.getByRole("button", { name: /Create destination/i }).click();
    // Scoped to the form — Next's route announcer is also role="alert".
    await expect(page.locator("form").getByRole("alert")).toContainText(/hero image/i);

    await page.locator('input[type="file"]').first().setInputFiles({
      name: "pw-hero.png",
      mimeType: "image/png",
      buffer: TINY_PNG,
    });
    await expect(page.getByText("1 image", { exact: true })).toBeVisible({ timeout: 30_000 });

    await page.getByRole("button", { name: /Create destination/i }).click();
    await page.waitForURL("**/admin/destinations");
    await expect(page.getByText(name)).toBeVisible();

    // Live on the public side immediately.
    await expect
      .poll(async () => (await page.request.get(`/destinations/${slug}`)).status(), {
        timeout: 20_000,
      })
      .toBeLessThan(400);

    // --- Edit ----------------------------------------------------------------
    await page.locator("li").filter({ hasText: name }).getByRole("link", { name: "Edit" }).click();
    await page.waitForURL(/\/admin\/destinations\/.+\/edit/);

    await page.locator("#destination-best-time").fill("Whenever the suite runs");
    await page.getByRole("button", { name: /Save changes/i }).click();
    await page.waitForURL("**/admin/destinations");
    await expect(page.getByText(name)).toBeVisible();

    // --- Delete --------------------------------------------------------------
    page.once("dialog", (dialog) => dialog.accept());
    await page
      .locator("li")
      .filter({ hasText: name })
      .getByRole("button", { name: /Delete/i })
      .click();

    await expect(page.getByText(name)).toHaveCount(0, { timeout: 20_000 });
  });
});
