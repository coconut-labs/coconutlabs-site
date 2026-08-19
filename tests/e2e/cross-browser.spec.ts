import { expect, test } from "@playwright/test";

test("core pages smoke test", async ({ page }) => {
  for (const route of ["/", "/evidence", "/work", "/about", "/contact"]) {
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible();
  }
});
