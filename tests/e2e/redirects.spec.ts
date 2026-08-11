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

  test("/projects/weft redirects to /projects/mlxd", async ({ page }) => {
    const response = await page.goto("/projects/weft");
    expect(response?.status()).toBe(200);
    expect(page.url()).toMatch(/\/projects\/mlxd$/);
  });

  for (const source of ["/coconut-os", "/coconutos", "/projects/coconutos"]) {
    test(`${source} redirects to /projects/coconut-os`, async ({ page }) => {
      const response = await page.goto(source);
      expect(response?.status()).toBe(200);
      expect(page.url()).toMatch(/\/projects\/coconut-os$/);
    });
  }

  test("alias redirects are permanent (308)", async ({ request }) => {
    const aliases = [
      ["/projects/weft", "/projects/mlxd"],
      ["/coconut-os", "/projects/coconut-os"],
      ["/coconutos", "/projects/coconut-os"],
      ["/projects/coconutos", "/projects/coconut-os"],
    ] as const;
    for (const [source, destination] of aliases) {
      const response = await request.get(source, { maxRedirects: 0 });
      expect(response.status(), source).toBe(308);
      expect(response.headers()["location"], source).toContain(destination);
    }
  });
});
