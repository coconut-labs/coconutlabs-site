import { expect, test } from "@playwright/test";

test("header renders the wordmark and the MENU toggle", async ({ page }) => {
  await page.goto("/");
  const header = page.getByRole("banner");
  await expect(header).toBeVisible();
  await expect(header.getByRole("link", { name: "coconutlabs" })).toBeVisible();

  const toggle = header.getByRole("button", { name: "MENU" });
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toHaveAttribute("aria-controls", "site-menu");
});

test("MENU opens the panel with the four column labels and toggles to CLOSE", async ({ page }) => {
  await page.goto("/");
  const header = page.getByRole("banner");
  const panel = page.locator("#site-menu");
  await expect(panel).toBeHidden();

  await header.getByRole("button", { name: "MENU" }).click();
  const closeButton = header.getByRole("button", { name: "CLOSE" });
  await expect(closeButton).toHaveAttribute("aria-expanded", "true");
  await expect(panel).toBeVisible();

  for (const label of ["WORK", "WRITING", "LAB", "STATUS"]) {
    await expect(panel.getByText(label, { exact: true })).toBeVisible();
  }
  await expect(panel.getByRole("link", { name: "KVWarden" })).toBeVisible();
  await expect(panel.getByRole("link", { name: "Masterclass" })).toHaveAttribute(
    "href",
    "https://masterclass.coconutlabs.org",
  );
  await expect(panel.getByText("● LIVE")).toBeVisible();

  // Toggle back closed from the same button.
  await closeButton.click();
  await expect(panel).toBeHidden();
});

test("Escape closes the panel and returns focus to the toggle", async ({ page }) => {
  await page.goto("/");
  const header = page.getByRole("banner");
  await header.getByRole("button", { name: "MENU" }).click();
  await expect(page.locator("#site-menu")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.locator("#site-menu")).toBeHidden();
  await expect(header.getByRole("button", { name: "MENU" })).toBeFocused();
});

test("menu closes on navigation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "MENU" }).click();
  await page.locator("#site-menu").getByRole("link", { name: "Research", exact: true }).click();
  await expect(page).toHaveURL(/\/research$/);
  await expect(page.locator("#site-menu")).toBeHidden();
});

test("footer carries the two mono items", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  await expect(footer).toBeVisible();
  await expect(footer.getByText("Coconut Labs · one lab, several surfaces")).toBeVisible();
  await expect(footer.getByRole("link", { name: "info@coconutlabs.org" })).toHaveAttribute(
    "href",
    "mailto:info@coconutlabs.org",
  );
});

test("chrome does not overflow at 375px, closed or open", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 720 });
  await page.goto("/");

  const noOverflow = () =>
    page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

  expect(await noOverflow()).toBe(true);
  await page.getByRole("button", { name: "MENU" }).click();
  await expect(page.locator("#site-menu")).toBeVisible();
  expect(await noOverflow()).toBe(true);
});
