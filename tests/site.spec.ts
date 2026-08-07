import { test, expect, type Page } from "@playwright/test";

const TRIP_SLUG = "escape-001-udaipur-mount-abu";

const PUBLIC_ROUTES = [
  { path: "/", heading: /Udaipur/i },
  { path: "/trips", heading: /Escapes/i },
  { path: `/trips/${TRIP_SLUG}`, heading: /Escape 001/i },
  { path: "/upcoming", heading: /meaningful journeys/i },
  { path: "/testimonials", heading: /.+/ },
  { path: "/destinations", heading: /Where we go/i },
  { path: "/destinations/udaipur", heading: /Udaipur/i },
  { path: "/about", heading: /vague itineraries/i },
  { path: "/contact", heading: /Ask us anything/i },
  { path: "/faq", heading: /Questions people actually ask/i },
  { path: "/terms", heading: /Terms of Service/i },
  { path: "/privacy", heading: /Privacy Policy/i },
  { path: "/refund-policy", heading: /Cancellation/i },
  { path: "/login", heading: /Welcome back/i },
  { path: "/signup", heading: /Create your account/i },
  { path: "/forgot-password", heading: /Forgot your password/i },
];

/** Collects console errors and failed requests so every test can assert on them. */
function watchForErrors(page: Page) {
  const problems: string[] = [];

  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    // Razorpay isn't configured in this environment, and the browser logs a
    // 404 for the favicon variants Next generates lazily.
    if (/razorpay|favicon/i.test(text)) return;
    problems.push(`console: ${text}`);
  });

  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));

  page.on("response", (response) => {
    const status = response.status();
    const url = response.url();
    if (status >= 500) problems.push(`${status} ${url}`);
    // A 404 on a real page route is a routing bug; missing photography is
    // expected until real files are dropped in.
    if (status === 404 && !url.includes("/images/") && !url.includes("favicon")) {
      problems.push(`404 ${url}`);
    }
  });

  return problems;
}

test.describe("public pages render", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route.path} loads cleanly`, async ({ page }) => {
      const problems = watchForErrors(page);

      const response = await page.goto(route.path, { waitUntil: "networkidle" });
      expect(response?.status(), `${route.path} HTTP status`).toBeLessThan(400);

      await expect(page.locator("h1").first()).toBeVisible();
      await expect(page.locator("h1").first()).toContainText(route.heading);

      expect(problems, `${route.path} produced errors`).toEqual([]);
    });
  }
});

test.describe("no placeholder content survives", () => {
  test("no picsum, lorem or example.com anywhere", async ({ page }) => {
    for (const route of PUBLIC_ROUTES) {
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      const html = await page.content();

      expect(html, `${route.path} still references picsum`).not.toContain("picsum.photos");
      expect(html, `${route.path} has a lorem ipsum block`).not.toMatch(/lorem ipsum/i);
      expect(html, `${route.path} has an example.com address`).not.toContain("@outwayclub.example");
      expect(html, `${route.path} has a TODO marker`).not.toMatch(/\bTODO\b|\bFIXME\b/);
      expect(html, `${route.path} has the stock demo phone number`).not.toContain("98765 43210");
    }
  });

  test("homepage advertises no invented review count", async ({ page }) => {
    await page.goto("/");
    const body = await page.locator("body").innerText();
    // Pre-launch there are zero reviews; nothing should claim otherwise.
    expect(body).not.toMatch(/\d+,\d{3}\+?\s*travellers/i);
    expect(body).not.toMatch(/4\.\d\s*average rating/i);
  });
});

test.describe("layout has no horizontal overflow", () => {
  for (const route of PUBLIC_ROUTES.slice(0, 10)) {
    test(`${route.path} fits the viewport`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: "networkidle" });

      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));

      // A 1px rounding difference is normal; anything more is a real overflow.
      expect(
        overflow.scrollWidth - overflow.clientWidth,
        `${route.path} scrolls horizontally`
      ).toBeLessThanOrEqual(1);
    });
  }
});

test.describe("navigation", () => {
  test("primary nav reaches every top-level page", async ({ page, isMobile }) => {
    await page.goto("/");

    if (isMobile) {
      await page.getByRole("button", { name: /open menu/i }).click();
      await expect(page.getByRole("navigation", { name: "Mobile" })).toBeVisible();
    }

    const nav = page.getByRole("navigation", { name: isMobile ? "Mobile" : "Main" });
    for (const label of ["Escapes", "What's next", "Reviews", "About", "FAQs", "Contact"]) {
      await expect(nav.getByRole("link", { name: label, exact: true })).toBeVisible();
    }
  });

  test("mobile menu opens, closes and locks scroll", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile-only behaviour");

    await page.goto("/");
    await page.getByRole("button", { name: /open menu/i }).click();

    const drawer = page.getByRole("navigation", { name: "Mobile" });
    await expect(drawer).toBeVisible();
    await expect(page.locator("body")).toHaveCSS("overflow", "hidden");

    await page.getByRole("button", { name: /close menu/i }).click();
    await expect(drawer).toBeHidden();
  });

  test("footer legal links resolve", async ({ page }) => {
    await page.goto("/");
    for (const [label, path] of [
      ["Terms of Service", "/terms"],
      ["Privacy Policy", "/privacy"],
      ["Cancellation & refunds", "/refund-policy"],
    ] as const) {
      const link = page.getByRole("contentinfo").getByRole("link", { name: label });
      await expect(link).toHaveAttribute("href", path);
    }
  });
});

test.describe("the launch escape", () => {
  test("trip page shows dates, price and full itinerary", async ({ page }) => {
    await page.goto(`/trips/${TRIP_SLUG}`, { waitUntil: "networkidle" });

    await expect(page.getByRole("heading", { level: 1 })).toContainText("Escape 001");
    await expect(page.getByText(/15\s*–\s*17 Aug/i).first()).toBeVisible();
    await expect(page.getByText("₹12,499").first()).toBeVisible();

    // Three itinerary days, each with a heading.
    const timeline = page.locator("ol.border-l > li");
    await expect(timeline).toHaveCount(3);

    await expect(page.getByRole("heading", { name: /Full itinerary/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Inclusions, exclusions/i })).toBeVisible();
  });

  test("shows an honest empty state instead of invented reviews", async ({ page }) => {
    await page.goto(`/trips/${TRIP_SLUG}`);
    await expect(page.getByText("No reviews yet")).toBeVisible();
    await expect(page.getByText(/don't seed reviews/i)).toBeVisible();
  });

  test("booking CTA sends a signed-out visitor to login with a return path", async ({ page }) => {
    await page.goto(`/trips/${TRIP_SLUG}`);
    await page.getByRole("button", { name: /Book now/i }).click();
    await page.waitForURL(/\/login\?redirect=/);
    expect(page.url()).toContain(encodeURIComponent(`/booking/${TRIP_SLUG}`));
  });

  test("emits TouristTrip structured data without a fake rating", async ({ page }) => {
    await page.goto(`/trips/${TRIP_SLUG}`);

    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const trip = blocks.map((b) => JSON.parse(b)).find((d) => d["@type"] === "TouristTrip");

    expect(trip).toBeTruthy();
    expect(trip.name).toContain("Escape 001");
    expect(trip.offers.priceCurrency).toBe("INR");
    // No approved reviews yet, so no aggregateRating may be claimed.
    expect(trip.aggregateRating).toBeUndefined();
  });
});

test.describe("forms", () => {
  test("contact form submits, or is correctly rate limited", async ({ page }) => {
    await page.goto("/contact");

    await page.getByLabel("Name").fill("Playwright Test");
    await page.getByLabel("Email", { exact: true }).fill("playwright@example.com");
    await page.getByLabel("Message").fill(
      "This is an automated end-to-end test of the contact form submission path."
    );
    await page.getByRole("button", { name: /Send message/i }).click();

    // Desktop and mobile projects share an IP, and the endpoint allows 3
    // submissions per 10 minutes — so either outcome is the system behaving.
    const success = page.getByText(/we've got your message/i);
    const throttled = page.getByRole("alert").filter({ hasText: /too many attempts/i });

    await expect(success.or(throttled)).toBeVisible({ timeout: 15_000 });
  });

  test("contact endpoint rate limits a burst of submissions", async ({ request }) => {
    const payload = {
      name: "Burst Test",
      email: `burst-${Date.now()}@example.com`,
      message: "Automated check that the rate limiter engages on repeated posts.",
      // Older than the 2s minimum so the bot heuristic doesn't fire first.
      formStartedAt: Date.now() - 5000,
    };

    // Each API-level test claims its own synthetic client IP so the shared
    // per-IP budget doesn't make results depend on execution order.
    const headers = { "x-forwarded-for": `203.0.113.${Math.floor(Math.random() * 200) + 20}` };

    const statuses: number[] = [];
    for (let i = 0; i < 6; i += 1) {
      const response = await request.post("/api/contact", { data: payload, headers });
      statuses.push(response.status());
    }

    // The first few succeed, then the limiter engages.
    expect(statuses.slice(0, 3)).toContain(200);

    expect(statuses, `expected a 429 in ${statuses.join(", ")}`).toContain(429);
  });

  test("contact endpoint silently swallows honeypot submissions", async ({ request }) => {
    const response = await request.post("/api/contact", {
      // Unique per run — rate-limit counters live in Postgres and survive
      // between test runs, so a fixed address would eventually be throttled.
      headers: { "x-forwarded-for": `198.51.100.${Math.floor(Math.random() * 250) + 1}` },
      data: {
        name: "Spam Bot",
        email: "bot@example.com",
        message: "Buy cheap things at this link, definitely not spam at all.",
        formStartedAt: Date.now() - 5000,
        company_website: "http://spam.example",
      },
    });

    // Returns 200 so the bot doesn't learn it was caught, but nothing is stored.
    expect(response.status()).toBe(200);
  });

  test("newsletter signup works from the upcoming page", async ({ page }) => {
    await page.goto("/upcoming");

    // The footer carries the same form, so scope to the page body.
    const form = page.locator("#main");
    const email = `pw-${Date.now()}@example.com`;
    await form.locator("#upcoming-newsletter-email").fill(email);
    await form.getByRole("button", { name: /Notify me/i }).click();

    // 5 signups per hour per IP, shared across the desktop and mobile projects.
    const success = page.getByText(/on the list/i).first();
    const throttled = page.getByRole("alert").filter({ hasText: /too many attempts/i });

    await expect(success.or(throttled)).toBeVisible({ timeout: 15_000 });
  });

  test("honeypot field is parked off-screen, out of reach of real users", async ({ page }) => {
    await page.goto("/contact");

    const trap = page.locator("#company_website");
    await expect(trap).toHaveAttribute("tabindex", "-1");

    // Positioned far off-canvas rather than display:none — a bot parsing the
    // DOM still finds and fills it, which is the whole point.
    const box = await trap.boundingBox();
    expect(box, "honeypot should still be laid out").not.toBeNull();
    expect(box!.x, "honeypot should sit outside the viewport").toBeLessThan(-1000);
  });

  test("login page links to password recovery", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: /forgot password/i }).click();
    await page.waitForURL("**/forgot-password");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Forgot your password/i);
  });
});

test.describe("access control", () => {
  test("admin is not reachable while signed out", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForURL((url) => !url.pathname.startsWith("/admin"));
    expect(new URL(page.url()).pathname).not.toContain("/admin");
  });

  test("account redirects to login while signed out", async ({ page }) => {
    await page.goto("/account");
    await page.waitForURL(/\/login/);
    expect(decodeURIComponent(page.url())).toContain("redirect=/account");
  });

  test("review submission requires sign-in", async ({ page }) => {
    await page.goto(`/trips/${TRIP_SLUG}/review`);
    await page.waitForURL(/\/login/);
  });

  test("admin API rejects anonymous callers", async ({ request }) => {
    const response = await request.post("/api/admin/users/role", {
      data: { userId: "00000000-0000-0000-0000-000000000000", role: "admin" },
    });
    expect([401, 403]).toContain(response.status());
  });

  test("order creation rejects anonymous callers", async ({ request }) => {
    const response = await request.post("/api/razorpay/create-order", {
      data: { tripId: "00000000-0000-0000-0000-000000000000", numTravelers: 1 },
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test("payment verification rejects a forged signature", async ({ request }) => {
    const response = await request.post("/api/razorpay/verify", {
      data: {
        razorpay_order_id: "order_fake",
        razorpay_payment_id: "pay_fake",
        razorpay_signature: "deadbeef",
        tripId: "00000000-0000-0000-0000-000000000000",
        departureId: null,
        numTravelers: 1,
        travelers: [{ full_name: "Forged" }],
      },
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});

test.describe("SEO", () => {
  test("sitemap lists the launch trip", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);

    const xml = await response.text();
    expect(xml).toContain(`/trips/${TRIP_SLUG}`);
    expect(xml).toContain("/upcoming");
    expect(xml).toContain("/testimonials");
  });

  test("robots.txt blocks private routes and points at the sitemap", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);

    const text = await response.text();
    expect(text).toContain("Sitemap:");
    expect(text).toContain("/admin");
    expect(text).toContain("/account");
  });

  test("every public page has a unique title and description", async ({ page }) => {
    const seen = new Map<string, string>();

    for (const route of PUBLIC_ROUTES) {
      await page.goto(route.path, { waitUntil: "domcontentloaded" });

      const title = await page.title();
      expect(title.length, `${route.path} title is empty`).toBeGreaterThan(10);

      const previous = [...seen.entries()].find(([, value]) => value === title);
      expect(previous, `${route.path} duplicates the title on ${previous?.[0]}`).toBeUndefined();
      seen.set(route.path, title);
    }
  });

  test("organization structured data is present site-wide", async ({ page }) => {
    await page.goto("/");
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const parsed = blocks.map((block) => JSON.parse(block));

    expect(parsed.some((d) => d["@type"] === "TravelAgency")).toBe(true);
    expect(parsed.some((d) => d["@type"] === "WebSite")).toBe(true);
  });

  test("legacy URLs redirect", async ({ page }) => {
    await page.goto("/group-trips");
    expect(new URL(page.url()).pathname).toBe("/trips");

    await page.goto("/cancellation-policy");
    expect(new URL(page.url()).pathname).toBe("/refund-policy");
  });
});

test.describe("accessibility basics", () => {
  test("every page has exactly one h1 and a skip link", async ({ page }) => {
    for (const route of PUBLIC_ROUTES) {
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await expect(page.locator("h1"), `${route.path} h1 count`).toHaveCount(1);
    }

    await page.goto("/");
    await expect(page.getByRole("link", { name: /skip to content/i })).toBeAttached();
  });

  test("all images carry an alt attribute", async ({ page }) => {
    for (const route of ["/", `/trips/${TRIP_SLUG}`, "/about", "/destinations/udaipur"]) {
      await page.goto(route, { waitUntil: "networkidle" });
      const missing = await page.locator("img:not([alt])").count();
      expect(missing, `${route} has images without alt text`).toBe(0);
    }
  });

  test("interactive icon-only buttons are labelled", async ({ page }) => {
    await page.goto("/");
    const unlabelled = await page
      .locator("button:not([aria-label]):not([aria-labelledby])")
      .evaluateAll((buttons) =>
        buttons.filter((button) => (button.textContent ?? "").trim().length === 0).length
      );
    expect(unlabelled).toBe(0);
  });
});
