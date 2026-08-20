import { test } from "@playwright/test";

/**
 * Not assertions — a visual sweep. Run with:
 *   npx playwright test tests/screenshots.spec.ts
 * and look at the PNGs in tests/__screens__.
 */
const PAGES = [
  ["home", "/"],
  ["trips", "/trips"],
  ["trip-detail", "/trips/jawai-udaipur"],
  ["blog", "/blog"],
  ["testimonials", "/testimonials"],
  ["about", "/about"],
  ["contact", "/contact"],
  ["faq", "/faq"],
  ["refund-policy", "/refund-policy"],
  ["login", "/login"],
] as const;

for (const [name, path] of PAGES) {
  test(`screenshot ${name}`, async ({ page }, testInfo) => {
    await page.goto(path, { waitUntil: "networkidle" });
    // Let scroll-reveal transitions settle before capturing.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(700);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);

    await page.screenshot({
      path: `tests/__screens__/${testInfo.project.name}-${name}.png`,
      fullPage: true,
    });
  });
}
