import { test, expect } from "@playwright/test";

/* Every renamed URL keeps working. The off-domain hops are asserted at the
   response layer with maxRedirects 0 so the suite never leaves the local
   server: we check the Location header the app emits, not the far end. */

test.describe("legacy route redirects", () => {
  test("/work redirects to /projects#tools", async ({ page }) => {
    const response = await page.goto("/work");
    expect(response?.status()).toBe(200);
    expect(page.url()).toMatch(/\/projects(#tools)?$/);
  });

  test("/research and its old filter doors land on /evidence", async ({ page }) => {
    for (const from of ["/research", "/papers", "/podcasts", "/notes"]) {
      const response = await page.goto(from);
      // 304 on the later hops: four doors land on one page and Firefox serves
      // the second visit from cache. Both mean the redirect resolved.
      expect([200, 304]).toContain(response?.status());
      expect(page.url()).toMatch(/\/evidence$/);
      await expect(page.getByRole("heading", { name: "Evidence" })).toBeVisible();
    }
  });

  test("/research/:slug follows the rename", async ({ page }) => {
    const response = await page.goto("/research/tenant-fairness-on-shared-inference");
    expect(response?.status()).toBe(200);
    expect(page.url()).toMatch(/\/evidence\/tenant-fairness-on-shared-inference$/);
  });

  test("/benchmarks nests under evidence", async ({ page }) => {
    const response = await page.goto("/benchmarks");
    expect(response?.status()).toBe(200);
    expect(page.url()).toMatch(/\/evidence\/benchmarks$/);
  });

  test("/library hands off to the about-page section", async ({ page }) => {
    const response = await page.goto("/library");
    expect(response?.status()).toBe(200);
    expect(page.url()).toMatch(/\/about#the-library$/);
    await expect(page.locator("#the-library")).toBeVisible();
  });

  test("the two moved essays point at the personal site", async ({ request }) => {
    const cases: [string, string][] = [
      [
        "/research/a-model-in-the-room",
        "https://shreypatel.coconutlabs.org/essays/producing-with-a-model",
      ],
      [
        "/research/mixing-and-evals",
        "https://shreypatel.coconutlabs.org/essays/what-mixing-taught-me",
      ],
    ];
    for (const [from, to] of cases) {
      const response = await request.get(from, { maxRedirects: 0 });
      expect(response.status()).toBe(308);
      expect(response.headers().location).toBe(to);
    }
  });

  test("the memorable doors point at their hosts", async ({ request }) => {
    const cases: [string, string][] = [
      ["/atlas", "https://waterline.coconutlabs.org"],
      ["/waterline", "https://waterline.coconutlabs.org"],
      ["/essays", "https://shreypatel.coconutlabs.org/essays"],
      ["/learn", "https://coconutos-learn.pages.dev"],
      ["/masterclass", "https://masterclass.coconutlabs.org"],
      ["/library/enter", "https://library.coconutlabs.org"],
    ];
    for (const [from, to] of cases) {
      const response = await request.get(from, { maxRedirects: 0 });
      expect(response.status()).toBe(307);
      // Next normalizes a bare origin to origin + "/".
      expect((response.headers().location ?? "").replace(/\/$/, "")).toBe(to);
    }
  });

  test("/newsletter redirects to the footer cadence band", async ({ page }) => {
    const response = await page.goto("/newsletter");
    expect(response?.status()).toBe(200);
    expect(page.url()).toMatch(/\/#cadence$/);
    await expect(page.getByRole("contentinfo")).toHaveAttribute("id", "cadence");
  });

  test("/cadence is the nightly-record page, not a redirect", async ({ page }) => {
    const response = await page.goto("/cadence");
    expect(response?.status()).toBe(200);
    expect(page.url()).toMatch(/\/cadence$/);
    await expect(page.getByRole("heading", { name: "The nightly record" })).toBeVisible();
  });
});
