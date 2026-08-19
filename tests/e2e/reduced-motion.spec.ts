import { expect, test } from "@playwright/test";

test("reduced motion route walk", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "MENU" }).click();
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("link", { name: "All evidence", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Evidence" })).toBeVisible();
  await expect(page.locator(".route-transition")).toHaveCount(0);
});
