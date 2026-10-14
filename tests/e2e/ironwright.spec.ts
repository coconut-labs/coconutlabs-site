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

test("the honesty notes are present: film-only verticals and no source link yet", async ({ page }) => {
  await page.goto("/projects/ironwright");
  await page.getByText("Two more films, and why they do not count").click();
  await expect(page.getByText("ideation, not evidence", { exact: false })).toBeVisible();
  // No link to the project repo until it is public (site chrome may link
  // github.com elsewhere; the contract is about this unit's source).
  await expect(page.locator('a[href*="github.com/ShreyPatel4/ironwright"]')).toHaveCount(0);
});

test("the gallery card exists and routes here", async ({ page }) => {
  await page.goto("/projects/gallery");
  await expect(page.getByRole("heading", { name: "Ironwright" })).toBeVisible();
  await page.getByRole("link", { name: "Watch the films" }).click();
  await expect(page).toHaveURL(/\/projects\/ironwright$/);
});

test("the pack films are the four real packs, named", async ({ page }) => {
  await page.goto("/projects/ironwright");
  for (const name of ["Brightline Retail", "Corvane Distribution", "Harborview Bank", "Granite Mutual"]) {
    await expect(page.getByText(name)).toBeVisible();
  }
});
