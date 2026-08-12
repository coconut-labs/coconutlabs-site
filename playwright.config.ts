import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: {
    timeout: 8_000,
  },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      testDir: "./tests/e2e",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      testDir: "./tests/e2e",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      testDir: "./tests/e2e",
      use: { ...devices["Desktop Safari"] },
    },
    {
      // Pixel-deterministic design gate. Chromium only: one renderer, one
      // truth. Not in the default 3-browser matrix; run via npm run
      // test:visual, baseline update is a deliberate act.
      name: "visual",
      testDir: "./tests/visual",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // Production server: `next dev` injects the dev-tools indicator into
    // rendered pages, which contaminated visual baselines. test:all builds
    // before running playwright; run `npm run build` first if invoking
    // playwright directly.
    command: "npx next start --hostname 127.0.0.1 --port 3000",
    url: "http://127.0.0.1:3000",
    // Never reuse: a long-lived next start serving a .next that a later
    // build replaced underneath it hands out mixed chunks, hydration dies,
    // and every interactivity test fails while static assertions pass.
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
