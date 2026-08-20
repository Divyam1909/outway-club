import { test, expect, type Page } from "@playwright/test";

/**
 * The three things added in August 2026 that a screenshot cannot verify:
 * the blogger role's boundary, the reader-submission workflow end to end, and
 * promo codes actually changing the price at checkout.
 *
 * Requires the temporary accounts created by:
 *   node scripts/admin-test-user.mjs create
 * and removed afterwards with the `delete` argument.
 */
const ADMIN = { email: "playwright-admin@outway.test", password: "pw-test-Admin-2026!" };
const BLOGGER = { email: "playwright-blogger@outway.test", password: "pw-test-Blogger-2026!" };
const READER = { email: "playwright-reader@outway.test", password: "pw-test-Reader-2026!" };

const TRIP_SLUG = "jawai-udaipur";

async function signIn(page: Page, account: { email: string; password: string }) {
  await page.goto("/login");
  // Target the login fields by id — the footer newsletter also has an
  // "Email address" label, which makes getByLabel("Email") ambiguous.
  await page.locator("#login-email").fill(account.email);
  await page.locator("#login-password").fill(account.password);
  await page.getByRole("button", { name: /^Log in$/ }).click();
  await page.waitForURL(/\/account/);
}

// ---------------------------------------------------------------------------
// The blogger boundary
// ---------------------------------------------------------------------------

test.describe("blogger role", () => {
  test("reaches the Journal and nothing else", async ({ page }) => {
    await signIn(page, BLOGGER);

    // The Journal opens.
    await page.goto("/admin/blog");
    await expect(page.getByRole("heading", { name: "Journal", level: 1 })).toBeVisible();

    // The nav offers no commercial section.
    const nav = page.getByRole("navigation", { name: "Admin sections" });
    await expect(nav.getByRole("link", { name: /Journal/ })).toBeVisible();
    for (const label of ["Bookings", "Trips", "Promo codes", "Requests", "Users"]) {
      await expect(nav.getByRole("link", { name: label })).toHaveCount(0);
    }

    // And typing the URL in by hand does not get them in either — every one of
    // those pages states its own guard rather than trusting the nav.
    for (const path of [
      "/admin/trips",
      "/admin/bookings",
      "/admin/promo-codes",
      "/admin/users",
      "/admin/requests",
    ]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/$/, { timeout: 15_000 });
    }

    // The dashboard sends them to their own work rather than showing revenue.
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/blog$/);
  });
});

// ---------------------------------------------------------------------------
// Reader submission, end to end
// ---------------------------------------------------------------------------

test.describe("reader submissions", () => {
  test("signed out, the page asks for an account rather than the article", async ({ page }) => {
    await page.goto("/blog/write");
    await expect(page.getByRole("heading", { name: /Write for the Journal/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Sign in/ })).toBeVisible();
  });

  test("write, submit, approve, live", async ({ page, browser }) => {
    // Three sign-ins, three browser contexts and a whole article. The default
    // 30s is not enough for the journey this walks, and the thing under test is
    // the workflow, not its speed.
    test.setTimeout(150_000);

    const title = `Playwright test piece ${Date.now()}`;

    // --- the reader writes -------------------------------------------------
    await signIn(page, READER);
    await page.goto("/blog/write");

    await page.locator("#submission-title").fill(title);

    // The body is a contentEditable surface, and the server refuses anything
    // under ~900 characters — so this types a real article's worth.
    const body = page.locator('[contenteditable="true"]').first();
    await body.click();
    // insertText rather than pressSequentially: this is a thousand characters,
    // and typing them one keystroke at a time spends the entire test budget
    // proving that a keyboard works.
    await page.keyboard.insertText(
      "We went to Udaipur in the middle of the monsoon, which everybody told us was a mistake. " +
        "It was not. The lake was full for the first time in three years, the Aravallis were green " +
        "in a way they are green for about six weeks a year, and the crowds that fill the City " +
        "Palace in December were simply not there. We stayed inside the old city rather than out " +
        "by Fateh Sagar, which meant we walked everywhere and ate at the same rooftop three nights " +
        "running because it faced the water and nothing else needed to be better than that. " +
        "The one thing I would do differently is give the second morning to Nathdwara instead of " +
        "sleeping in, because we ended up rushing it on the way out and it deserved longer. " +
        "If you are deciding between August and December, take August, bring a rain jacket, and " +
        "accept that one afternoon will be lost to a downpour you will end up remembering fondly. " +
        "A note on the boat: go at the last slot rather than the first, because the light on the " +
        "ghats in the twenty minutes before the palace is floodlit is the thing everybody puts on " +
        "a postcard and almost nobody actually sits still for. We paid four hundred rupees each " +
        "and it was the best money spent all weekend. Eat at the small place two lanes behind " +
        "Gangaur Ghat rather than the one with the sign; same kitchen, half the price, and the " +
        "family running it will tell you exactly which temple is worth the walk in the morning."
    );

    // The editor syncs its HTML on input events, and the counter flipping to
    // "long enough" is the visible proof the form has the body it will send.
    await expect(page.getByText(/long enough/)).toBeVisible();

    await page.locator("#submission-agreed").check();

    // The bot filter rejects anything submitted less than two seconds after the
    // form mounted, and silently returns success so a script doesn't learn it
    // was caught (src/lib/rate-limit.ts). Pasting a whole article with
    // insertText is fast enough to trip that — which showed up as a submission
    // that reported "It's with us" and never reached the queue. Wait out the
    // threshold rather than weakening it: a real writer takes minutes.
    await page.waitForTimeout(2_500);

    await page.getByRole("button", { name: /Send it to us/ }).click();

    await expect(page.getByText(/It's with us/)).toBeVisible({ timeout: 20_000 });

    // It is not on the Journal yet. This is the whole promise of the review
    // step, so it is asserted rather than assumed.
    const anon = await browser.newContext();
    const anonPage = await anon.newPage();
    await anonPage.goto("/blog");
    await expect(anonPage.getByText(title)).toHaveCount(0);
    await anon.close();

    // --- an editor approves it ---------------------------------------------
    const editorContext = await browser.newContext();
    const editor = await editorContext.newPage();
    await signIn(editor, BLOGGER);
    await editor.goto("/admin/blog");

    const card = editor.locator("li").filter({ hasText: title }).first();
    await expect(card).toBeVisible();

    editor.once("dialog", (dialog) => dialog.accept());
    await card.getByRole("button", { name: /Publish now/ }).click();

    // The queue is the editor's own confirmation that the decision landed —
    // wait for it to empty before asking the public site about it, so a slow
    // round trip doesn't get misread as a caching failure.
    await expect(editor.locator("li").filter({ hasText: title })).toHaveCount(1, {
      timeout: 30_000,
    });
    await expect(editor.getByRole("button", { name: /Publish now/ })).toHaveCount(0, {
      timeout: 30_000,
    });

    // --- and it is live, immediately ---------------------------------------
    const readerContext = await browser.newContext();
    const readerPage = await readerContext.newPage();
    await expect(async () => {
      await readerPage.goto("/blog");
      await expect(readerPage.getByText(title).first()).toBeVisible({ timeout: 5_000 });
    }).toPass({ timeout: 45_000, intervals: [1_000, 2_000, 3_000] });

    await readerPage.getByText(title).first().click();
    await expect(readerPage.getByRole("heading", { name: title })).toBeVisible();
    // The byline is the reader's, and the body kept its paragraph markup.
    await expect(readerPage.getByText("Playwright Reader").first()).toBeVisible();
    await expect(readerPage.locator("article p").first()).toContainText("Udaipur");

    await readerContext.close();
    await editorContext.close();
  });
});

// ---------------------------------------------------------------------------
// Promo codes
// ---------------------------------------------------------------------------

test.describe("promo codes", () => {
  test("the event code is applied without anyone typing it", async ({ page, isMobile }) => {
    await page.goto(`/trips/${TRIP_SLUG}`);

    // Two prices, one struck through, and the live one is the discounted one.
    //
    // Which element carries them depends on the viewport, and that is the
    // design rather than an accident: BookingWidget is `hidden lg:block` and
    // MobileBookingBar owns booking below lg. This used to assert on the
    // desktop widget in both projects, so at 412px it was waiting on an
    // element the reader is deliberately never shown.
    if (isMobile) {
      // The bar slides in on scroll, so get off the top of the page first.
      await page.evaluate(() => window.scrollTo(0, 900));
      const bar = page.locator("div.fixed.bottom-0.lg\\:hidden").first();
      await expect(bar.getByText("₹16,999").first()).toBeVisible();
      await expect(bar.locator(".line-through").first()).toContainText("18,999");
    } else {
      const widget = page.locator(".lg\\:sticky").first();
      await expect(widget.getByText("₹16,999").first()).toBeVisible();
      await expect(widget.locator(".line-through")).toContainText("18,999");
    }

    await expect(page.getByText("Janmashtami departure").first()).toBeVisible();
  });

  test("carries through to the booking form and scales with headcount", async ({ page }) => {
    await page.goto(`/booking/${TRIP_SLUG}`);

    // The quote lands from the server, so wait for it rather than the paint.
    await expect(page.getByText("Janmashtami departure")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("−₹2,000")).toBeVisible();

    await page.getByRole("button", { name: "One traveller more" }).click();
    await expect(page.getByText("−₹2,000")).toBeVisible({ timeout: 15_000 });
  });

  test("refuses a code that isn't ours, and keeps the one that is", async ({ page }) => {
    await page.goto(`/booking/${TRIP_SLUG}`);
    await expect(page.getByText("Janmashtami departure")).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: /different code|promo code/i }).click();
    await page.locator("#promo-code-input").fill("NOTREAL99");
    await page.getByRole("button", { name: "Apply" }).click();

    await expect(page.getByText(/isn't one of ours/)).toBeVisible({ timeout: 15_000 });
    // The event discount survived the failed attempt.
    await expect(page.getByText("−₹2,000")).toBeVisible();
  });

  test("an admin can create one, and it works at checkout", async ({ page, browser }) => {
    const code = `PWTEST${Date.now().toString().slice(-6)}`;

    await signIn(page, ADMIN);
    await page.goto("/admin/promo-codes/new");

    await page.locator("#promo-code").fill(code);
    await page.locator("#promo-label").fill("Playwright partner");
    await page.getByRole("button", { name: /A flat amount/ }).click();
    await page.locator("#promo-value").fill("2500");
    await page.locator("#promo-usage-limit").fill("5");
    await page.getByRole("button", { name: /Create code/ }).click();

    await expect(page).toHaveURL(/\/admin\/promo-codes$/, { timeout: 20_000 });
    await expect(page.getByText(code)).toBeVisible();

    // A visitor types it in, and it beats the event code because it saves more.
    const context = await browser.newContext();
    const visitor = await context.newPage();
    await visitor.goto(`/booking/${TRIP_SLUG}`);
    await expect(visitor.getByText("Janmashtami departure")).toBeVisible({ timeout: 15_000 });

    await visitor.getByRole("button", { name: /different code|promo code/i }).click();
    await visitor.locator("#promo-code-input").fill(code);
    await visitor.getByRole("button", { name: "Apply" }).click();

    await expect(visitor.getByText("−₹2,500")).toBeVisible({ timeout: 15_000 });
    await expect(visitor.getByText("Playwright partner")).toBeVisible();
    // Exactly one discount line — never both.
    await expect(visitor.getByText("Janmashtami departure")).toHaveCount(0);

    await context.close();

    // Clean up after ourselves: the code never ran, so it can be deleted.
    await page.goto("/admin/promo-codes");
    const row = page.locator("li").filter({ hasText: code }).first();
    page.once("dialog", (dialog) => dialog.accept());
    await row.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText(code)).toHaveCount(0, { timeout: 15_000 });
  });
});
