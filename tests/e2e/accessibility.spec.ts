import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = [
  "/",
  "/research",
  "/library",
  "/research/tenant-fairness-on-shared-inference",
  "/work",
  "/papers",
  "/podcasts",
  "/projects/kvwarden",
  "/projects/mlxd",
  "/joinus",
  "/about",
  "/contact",
  "/colophon",
];

for (const route of routes) {
  test(`axe scan ${route}`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).disableRules(["color-contrast"]).analyze();
    expect(results.violations).toEqual([]);
  });
}
