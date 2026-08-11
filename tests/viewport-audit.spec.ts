import { expect, test } from "@playwright/test";

/**
 * The two widths that matter: a laptop and the narrowest phone still in real
 * use. Every public route is checked for horizontal overflow (which is always
 * a bug — the page body should never scroll sideways) and for console errors,
 * and a screenshot is dropped in tests/__screens__ to look at.
 *
 * Runs under the `desktop` project only; it sets its own viewport, so running
 * it twice would just repeat the same work.
 */

const PAGES = [
  ["home", "/"],
  ["trips", "/trips"],
  ["trip-detail", "/trips/udaipur-mount-abu"],
  ["destination", "/destinations/udaipur"],
  ["blog", "/blog"],
  ["testimonials", "/testimonials"],
  ["about", "/about"],
  ["contact", "/contact"],
  ["faq", "/faq"],
  ["login", "/login"],
  ["signup", "/signup"],
  ["refund-policy", "/refund-policy"],
] as const;

const VIEWPORTS = [
  { name: "1440", width: 1440, height: 900 },
  { name: "360", width: 360, height: 800 },
] as const;

test.describe.configure({ mode: "parallel" });

for (const viewport of VIEWPORTS) {
  for (const [name, path] of PAGES) {
    test(`${viewport.name}px ${name}`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "desktop", "sets its own viewport");

      const consoleErrors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });
      page.on("pageerror", (error) => consoleErrors.push(String(error)));

      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(path, { waitUntil: "networkidle" });

      // Settle the scroll-reveal transitions before measuring or capturing.
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(600);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);

      await page.screenshot({
        path: `tests/__screens__/${viewport.name}-${name}.png`,
        fullPage: true,
      });

      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        if (doc.scrollWidth <= doc.clientWidth) return null;
        // Name the widest offender rather than just failing — "something
        // overflows by 14px" is not a bug report anyone can act on.
        const culprits = [...document.querySelectorAll<HTMLElement>("body *")]
          .map((node) => {
            const box = node.getBoundingClientRect();
            return { right: Math.round(box.right), tag: node.tagName, cls: node.className };
          })
          .filter((entry) => entry.right > doc.clientWidth + 1)
          .sort((a, b) => b.right - a.right)
          .slice(0, 3);
        return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth, culprits };
      });

      expect(overflow, `horizontal overflow on ${path}`).toBeNull();
      expect(consoleErrors, `console errors on ${path}`).toEqual([]);
    });
  }
}
