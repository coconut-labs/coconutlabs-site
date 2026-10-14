import { expect, test } from "@playwright/test";

/* Ironwright ships films, not an in-browser demo, so the page's contract is
   honesty about that: five lazy videos (intro + four packs), the four-pack
   claim stated against the six films that exist, and no source link until
   the repository is public. */

test("the page carries the intro and exactly four pack films, all lazy", async ({ page }) => {
  await page.goto("/projects/ironwright");
  await expect(page.getByRole("heading", { name: "Ironwright", exact: true })).toBeVisible();
  const videos = page.locator("video");
  await expect(videos).toHaveCount(5);
  for (const v of await videos.all()) {
    await expect(v).toHaveAttribute("preload", "none");
    await expect(v).toHaveAttribute("controls", "");
  }
  await expect(page.locator('video[src="/ironwright/intro.mp4"]')).toHaveCount(1);
  await expect(page.locator('video[src^="/ironwright/films/"]')).toHaveCount(4);
});

test("the honesty notes are present: film-only verticals and the source link", async ({ page }) => {
  await page.goto("/projects/ironwright");
  await page.getByText("Two more films, and why they do not count").click();
  await expect(page.getByText("ideation, not evidence", { exact: false })).toBeVisible();
  // The repo went public 2026-10-13; the page links it from the source
  // disclosure. The disclosure is open by default on desktop.
  await expect(page.locator('a[href="https://github.com/ShreyPatel4/ironwright"]')).toHaveCount(1);
});

test("the gallery card exists and routes here", async ({ page }) => {
  await page.goto("/projects/gallery");
  await expect(page.getByRole("heading", { name: "Ironwright" })).toBeVisible();
  await page
    .locator("article", { hasText: "Ironwright" })
    .getByRole("link", { name: "Run the demo" })
    .click();
  await expect(page).toHaveURL(/\/projects\/ironwright$/);
});

/* Functional literals below were derived by executing the same verification
   in Node (node:crypto sha256) over the committed chain.json: intact gives
   59 rows and 0 breaks; rewriting seq 23's status and recomputing its hash
   gives first break at seq 24, exactly 1 failing row. */
test("the chain verifies in the browser: 59 rows, 0 breaks", async ({ page }) => {
  await page.goto("/projects/ironwright");
  await page.getByRole("button", { name: "Verify the chain as shipped" }).click();
  await expect(page.getByTestId("demo-outcome")).toContainText("59 of 59 rows verified, 0 breaks");
});

test("a careful rewrite is caught one link later, at seq 24", async ({ page }) => {
  await page.goto("/projects/ironwright");
  await page.getByRole("button", { name: /Rewrite seq 23/ }).click();
  await expect(page.getByTestId("demo-outcome")).toContainText("Chain breaks at seq 24");
});

test("the pack films are the four real packs, named", async ({ page }) => {
  await page.goto("/projects/ironwright");
  for (const name of ["Brightline Retail", "Corvane Distribution", "Harborview Bank", "Granite Mutual"]) {
    await expect(page.getByText(name)).toBeVisible();
  }
});
