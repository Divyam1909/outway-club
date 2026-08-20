import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3000);
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,

  /**
   * One worker, locally as well as in CI.
   *
   * These specs share a single Supabase database and most of them mutate it —
   * roles get promoted, posts get published, promo codes get spent, seats get
   * booked. Run four at once and they read each other's writes: on 20 Aug 2026
   * a parallel run reported a React hydration mismatch on the admin console
   * that did not exist, minutes after the real one had been fixed and verified.
   * A suite that invents failures is worse than a slow one, because the honest
   * response to it is to stop believing the suite.
   *
   * CI was already serial, so this only aligns local runs with the signal that
   * actually gates a merge. The cost is roughly 1.5 minutes to 7 for a full
   * run; a single spec file, which is what you run while working, is unchanged.
   *
   * `PW_WORKERS=4 npx playwright test tests/site.spec.ts` opts back in, which is
   * safe for the read-only specs. The real fix is per-worker data isolation —
   * see docs/still-to-do.md.
   */
  workers: Number(process.env.PW_WORKERS ?? 1),
  reporter: [["list"], ["html", { open: "never" }]],

  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],

  webServer: {
    // Tests run against a production build — that's what ships, and dev-mode
    // overlays would mask real hydration and layout problems.
    command: `npx next start --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
