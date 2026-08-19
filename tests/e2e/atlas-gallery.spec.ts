import { expect, test } from "@playwright/test";

/* Atlas: orientation, guided tour, progressive disclosure. */

test("atlas leads with the three-act orientation", async ({ page }) => {
  await page.goto("/projects/agentic-mlops", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Act 1 · Ship")).toBeVisible();
  await expect(page.getByText("Act 2 · Drift")).toBeVisible();
  await expect(page.getByText("Act 3 · Recover")).toBeVisible();
  // The what-to-click sentence precedes the map.
  await expect(page.getByText(/Click any station/)).toBeVisible();
});

test("atlas tour is keyboard operable: tab, arrows, enter, escape", async ({ page }) => {
  await page.goto("/projects/agentic-mlops", { waitUntil: "domcontentloaded" });
  const start = page.getByRole("button", { name: "Take the tour" });
  const panel = page.getByRole("group", { name: "Guided tour" });
  // Retry the opening keypress: hydration may land after domcontentloaded.
  await expect(async () => {
    await start.press("Enter");
    await expect(panel).toBeVisible({ timeout: 1500 });
  }).toPass({ timeout: 15000 });
  await expect(panel).toContainText("Stop 1 of 7");
  await expect(panel).toBeFocused();

  await page.keyboard.press("ArrowRight");
  await expect(panel).toContainText("Stop 2 of 7");
  await page.keyboard.press("ArrowLeft");
  await expect(panel).toContainText("Stop 1 of 7");

  // Back is disabled at the first stop; Next advances via enter on the button.
  await expect(panel.getByRole("button", { name: "← Back" })).toBeDisabled();
  await panel.getByRole("button", { name: "Next →" }).click();
  await expect(panel).toContainText("Stop 2 of 7");

  await page.keyboard.press("Escape");
  await expect(panel).not.toBeVisible();
  await expect(start).toBeFocused();
});

test("atlas keeps every station explorable and the claim index intact", async ({ page }) => {
  await page.goto("/projects/agentic-mlops", { waitUntil: "domcontentloaded" });
  // All fourteen lifecycle stops render as buttons.
  await expect(page.getByRole("button", { name: /^Stop \d+, / })).toHaveCount(14);
  // The dense claim index moved into an accordion, open on desktop, nothing deleted.
  const summary = page.getByText("Every station, every claim");
  await expect(summary).toBeVisible();
  // The unit buttons dropped the U-number from their accessible name; the
  // #unit-U5 / #unit-U7 deep-link ids the gallery uses are unchanged.
  await expect(page.getByRole("button", { name: /^Registry \+ lineage\./ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Scale envelope\./ })).toHaveCount(1);
  await expect(page.locator("#unit-U5")).toHaveCount(1);
  await expect(page.locator("#unit-U7")).toHaveCount(1);
});

test("atlas has no horizontal overflow at 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/projects/agentic-mlops", { waitUntil: "domcontentloaded" });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

/* Gallery: story menu with hooks, actions, and live/source badges. */

test("gallery opens with the hook and cards carry hook, action, badges", async ({ page }) => {
  await page.goto("/projects/gallery", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByText("Every card is a thing that silently breaks in real data systems.")
  ).toBeVisible();

  // Shipped unit cards, each with a live link and a source link.
  // 7 units: 6 on the bottleneck spine plus latent diffusion, which is a
  // mechanism unit and deliberately sits outside the class table.
  await expect(page.getByRole("link", { name: /Run the demo/ })).toHaveCount(7);
  await expect(page.getByRole("link", { name: /Source/ })).toHaveCount(7);
  await expect(page.getByText("live in your browser")).toHaveCount(7);

  // The Tier-4 chip is gone. The honesty it carried is now a sentence: the one
  // unit with no measured result says so on the card, in words.
  await expect(page.getByText("Shipped · Tier 4")).toHaveCount(0);
  await expect(
    page.getByText("This unit shows the mechanism. It carries no measured result."),
  ).toHaveCount(1);

  // A what-you-can-do line on a card.
  await expect(
    page.getByText("Flip a corruption on, watch the guardrail catch what the schema contract passes.")
  ).toBeVisible();

  // Flagship atlas card still routes to the atlas.
  await expect(page.getByRole("link", { name: /Open the atlas/ })).toBeVisible();

  // The coverage grid (the eight bottleneck classes) is intact below the cards.
  await expect(page.getByText("Ingestion & schema-drift")).toBeVisible();
});
