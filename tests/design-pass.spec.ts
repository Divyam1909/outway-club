import { expect, test } from "@playwright/test";

const TRIP = "/trips/udaipur-mount-abu";

test("gallery lightbox opens, counts and closes", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(TRIP, { waitUntil: "networkidle" });

  await page.getByRole("button", { name: /See them all/i }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(/1 of \d+/);

  await page.keyboard.press("ArrowRight");
  await expect(dialog).toContainText(/2 of \d+/);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("mobile bar opens the date sheet", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop");
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(TRIP, { waitUntil: "networkidle" });

  await page.evaluate(() => window.scrollTo(0, 900));

  // Exactly one: the bar. The desktop sidebar widget is display:none here.
  await expect(page.getByRole("button", { name: "Book now" })).toHaveCount(1);
  await page.getByRole("button", { name: "Book now" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("radio").first()).toBeAttached();
  await expect(dialog.getByRole("button", { name: /Continue to checkout/i })).toBeVisible();
});

test("field focus ring is clay, and fields are 16px", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop");
  await page.goto("/login", { waitUntil: "networkidle" });

  const email = page.locator("#login-email");
  await email.focus();
  await page.waitForTimeout(400); // .field has transition-colors; let it land

  const styles = await email.evaluate((node) => {
    const s = getComputedStyle(node);
    return { fontSize: s.fontSize, boxShadow: s.boxShadow, borderColor: s.borderColor };
  });

  expect(styles.fontSize).toBe("16px");
  // clay #B05622 -> rgb(176, 86, 34)
  expect(styles.boxShadow).toContain("rgb(176, 86, 34)");
  expect(styles.borderColor).toBe("rgb(176, 86, 34)");
});

test("password toggle is a 44px target", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop");
  await page.goto("/login", { waitUntil: "networkidle" });
  const box = await page.getByRole("button", { name: "Show password" }).boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);
});
