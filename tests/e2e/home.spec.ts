import { expect, test } from "@playwright/test";

test("home renders the full composition in the new order", async ({ page }) => {
  await page.goto("/");

  // Status strip under the header, leading with the live dot
  await expect(page.getByText(/commits this week/i)).toBeVisible();

  // Hero: wordmark heading, the measurement claim, both CTAs
  await expect(page.getByRole("heading", { name: "Coconut Labs" })).toBeVisible();
  await expect(page.getByText(/quiet tenant keeps its latency/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /Read the latest note/i }).first()).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: /The proof page/i })).toBeVisible();

  // Plot card carries provenance, not just numbers
  await expect(page.getByText(/quiet-tenant p99 TTFT/i)).toBeVisible();
  await expect(page.getByText(/n=311 post-warmup/i)).toBeVisible();

  // Stat rail
  await expect(page.getByText("ratio to solo")).toBeVisible();
  await expect(page.getByText("vs fifo tail")).toBeVisible();

  // Strips — Projects (three flagships) above Research (rows)
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Coconut OS" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recent research" })).toBeVisible();

  // PeopleStrip — names hidden, generic copy used.
  await expect(page.getByRole("heading", { name: "Two engineers, close to the work." })).toBeVisible();

  // Contact strip
  await expect(page.getByText("Building something at this layer?")).toBeVisible();
  // Scoped to main: the Direction A footer carries its own mailto link.
  await expect(page.getByRole("main").getByRole("link", { name: /info@coconutlabs.org/i })).toHaveAttribute(
    "href",
    "mailto:info@coconutlabs.org",
  );
});
