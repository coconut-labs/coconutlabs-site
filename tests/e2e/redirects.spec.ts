import { test, expect } from "@playwright/test";

test.describe("legacy route redirects", () => {
  test("/work redirects to /projects#tools", async ({ page }) => {
    const response = await page.goto("/work");
    expect(response?.status()).toBe(200);
    expect(page.url()).toMatch(/\/projects(#tools)?$/);
  });

  test("/papers redirects to /research?type=papers", async ({ page }) => {
    const response = await page.goto("/papers");
    expect(response?.status()).toBe(200);
    expect(page.url()).toMatch(/\/research\?type=papers$/);
  });

  test("/podcasts redirects to /research?type=podcasts", async ({ page }) => {
    const response = await page.goto("/podcasts");
    expect(response?.status()).toBe(200);
    expect(page.url()).toMatch(/\/research\?type=podcasts$/);
  });

  test("/newsletter redirects to the footer cadence band", async ({ page }) => {
    const response = await page.goto("/newsletter");
    expect(response?.status()).toBe(200);
    expect(page.url()).toMatch(/\/#cadence$/);
    await expect(page.getByRole("contentinfo")).toHaveAttribute("id", "cadence");
  });

  test("/cadence redirects to the footer cadence band", async ({ page }) => {
    const response = await page.goto("/cadence");
    expect(response?.status()).toBe(200);
    expect(page.url()).toMatch(/\/#cadence$/);
  });
});
