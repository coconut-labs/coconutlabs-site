import { expect, test, type Locator, type Page } from "@playwright/test";

/* Live-log tier for the columnar-scan and ingestion-contract units: after the
   first preset interaction each unit streams its engine's real per-step log,
   and the counters land on the engine's totals. Every expected string below
   is a computed fact, derived by executing the engine module in Node before
   this spec was written; the citing derivation is in each test's comment. */

const shell = (page: Page) => page.getByTestId("demo-shell");
const log = (page: Page) => page.locator("main").getByTestId("live-log");

/* Click a preset and wait until its state actually flips. Same retry pattern
   as demo-functional.spec.ts: absorbs hydration landing after
   domcontentloaded, expect-polling only, no bare timeouts. */
async function activate(chip: Locator) {
  await expect(async () => {
    await chip.click();
    await expect(chip).toHaveAttribute("aria-pressed", "true", { timeout: 1500 });
  }).toPass({ timeout: 15_000 });
}

/* Derivation, scanSteps(["country","device"], "row") in
   app/projects/columnar-scan-bytes-guardrail/scan.ts: the 200,000-row read
   splits into 64 batches of 3,125 rows. Row layout touches all 12 columns at
   358 B/row, so every batch reads 3,125 x 358 = 1,118,750 B against a
   3,125 x 4 = 12,500 B two-column budget, 89.5x the budget and past the 2x
   tolerance, so checkScan flags all 64 batches. The running total ends at
   64 x 1,118,750 = 71,600,000 B, which the demo's formatter renders as
   71.6 MB, the same figure the outcome banner states. */
test("columnar-scan: Row layout streams 64 flagged batch reads landing on 71.6 MB", async ({ page }) => {
  await page.goto("/projects/columnar-scan-bytes-guardrail", { waitUntil: "domcontentloaded" });
  await expect(shell(page)).toBeVisible();

  // No interaction yet: the log must not exist, the default render is untouched.
  await expect(log(page)).toHaveCount(0);

  await activate(shell(page).getByRole("button", { name: "Row layout" }));

  await expect(log(page)).toBeVisible();
  // Replay runs about 5 s (64 lines at 1 line / 80 ms); poll past it.
  await expect(log(page)).toContainText("64/64 batches", { timeout: 15_000 });
  await expect(log(page)).toContainText("64 over budget");
  // The last batch line carries the running total that equals the banner's figure.
  await expect(log(page)).toContainText("total 71.6 MB");
  await expect(log(page)).toContainText("✕ over budget");
});

/* Derivation, contractSteps(fitContract(sample), typeWidened) in
   app/projects/ingestion-data-contract/contract.ts: the Type widening drift
   turns every 4th of the 240 sample rows (60 rows) into text amounts, and
   check() returns exactly one violation, type_drift with detail
   "'amount_minor' holds a string, contract declares int". The log is 240 row
   lines plus 11 clause lines (6 dtype, 3 enum, magnitude, granularity) = 251
   steps with 1 flagged, and the flagged dtype clause sits in the visible
   tail window (last 14 of 251). */
test("ingestion-contract: Type widening streams 251 steps with the type_drift clause flagged", async ({ page }) => {
  await page.goto("/projects/ingestion-data-contract", { waitUntil: "domcontentloaded" });
  await expect(shell(page)).toBeVisible();

  // No interaction yet: the log must not exist, the default render is untouched.
  await expect(log(page)).toHaveCount(0);

  await activate(shell(page).getByRole("button", { name: "Type widening" }));

  await expect(log(page)).toBeVisible();
  // Replay runs about 5 s (251 lines at 3 lines / 60 ms); poll past it.
  await expect(log(page)).toContainText("251/251 steps", { timeout: 15_000 });
  await expect(log(page)).toContainText("1 flagged");
  // The flagged clause line, verbatim from check()'s violation.
  await expect(log(page)).toContainText("✕ type_drift: 'amount_minor' holds a string, contract declares int");
});
