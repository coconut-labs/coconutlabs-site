import { expect, test } from "@playwright/test";

test("research index and post render", async ({ page }) => {
  await page.goto("/research");
  await expect(page.getByRole("heading", { name: "Research" })).toBeVisible();
  // Scoped to main: the sitemap footer now carries the same post link.
  await page.getByRole("main").getByRole("link", { name: /Tenant fairness/ }).click();
  await expect(page.getByRole("heading", { name: "Tenant fairness on shared inference" })).toBeVisible();
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
});

test("rss feed renders Atom", async ({ request }) => {
  const response = await request.get("/rss.xml");
  expect(response.ok()).toBe(true);
  const body = await response.text();
  expect(body).toContain("<feed");
  expect(body).toContain("<email>info@coconutlabs.org</email>");
});
