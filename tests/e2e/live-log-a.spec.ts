import { expect, test, type Locator, type Page } from "@playwright/test";

/* Live-log tier for three gallery units: the shared LiveLog replay must be
   absent before the first preset click, then land exactly on the totals the
   unit's engine computed. Every expected string below is a computed fact,
   derived by executing the unit's engine module directly in Node (the citing
   module and derivation are named per test). The replay paces at reading
   speed (~5 s), so counter assertions poll with a 15 s ceiling; reduced-motion
   contexts land instantly on the same end state. */

const shell = (page: Page) => page.getByTestId("demo-shell");
const log = (page: Page) => page.getByTestId("live-log");

/* Click a preset and wait until its state actually flips; the retry loop
   absorbs hydration landing after domcontentloaded (same pattern as
   demo-functional.spec.ts). Chips are scoped to the demo shell because some
   preset names collide with sitemap footer links. */
async function activate(chip: Locator) {
  await expect(async () => {
    await chip.click();
    await expect(chip).toHaveAttribute("aria-pressed", "true", { timeout: 1500 });
  }).toPass({ timeout: 15_000 });
}

test("data-regression: check log replays 26 steps and lands the truncation flag", async ({ page }) => {
  await page.goto("/projects/silent-data-regression-guardrail", { waitUntil: "domcontentloaded" });
  // Default state carries no log at all; the visual baseline depends on this.
  await expect(shell(page)).toBeVisible();
  await expect(log(page)).toHaveCount(0);

  // Computed by guardrail.ts checkTrace(fitProfile(CLEAN), truncate_episodes(CLEAN))
  // over sample.json (8 episodes): 26 steps total; check() returns exactly one
  // violation (truncation: floor = minEpLen 69 * 0.7 = 48 frames, episodes 5
  // and 6 keep 47 and 20 frames -> "2 episode(s) short"), so 1 step is flagged
  // and it is the LAST step, deterministically inside the 14-line tail window.
  await activate(shell(page).getByRole("button", { name: "Episode truncation" }));
  await expect(log(page)).toBeVisible();
  await expect(log(page)).toContainText("26/26 steps", { timeout: 15_000 });
  await expect(log(page)).toContainText("1 flagged");
  await expect(log(page)).toContainText("✕ truncation");
  await expect(log(page)).toContainText("2 episode(s) short");
});

test("point-in-time: join log replays 8 picks and flags every leaked row", async ({ page }) => {
  await page.goto("/projects/point-in-time-correctness", { waitUntil: "domcontentloaded" });
  await expect(shell(page)).toBeVisible();
  await expect(log(page)).toHaveCount(0);

  // Computed by pit.ts joinTrace(generate(8, seed 7), "leaky"): every entity's
  // latest feature row is t=90 and every labelTs is 30..69, so all 8 rows leak
  // (matching the banner's "8 of 8 rows"). Entity #7 has labelTs=62, pick t=90,
  // 90-62 = +28 future; with only 8 lines the whole log is the tail window.
  await activate(shell(page).getByRole("button", { name: "Leaky join (current value)" }));
  await expect(log(page)).toBeVisible();
  await expect(log(page)).toContainText("8/8 rows", { timeout: 15_000 });
  await expect(log(page)).toContainText("8 leaked");
  await expect(log(page)).toContainText("#7");
  await expect(log(page)).toContainText("✕ leaked (+28 future)");
});

test("silent-cache-miss: request log replays 240 decisions, all misses", async ({ page }) => {
  await page.goto("/projects/silent-cache-miss", { waitUntil: "domcontentloaded" });
  // The page opens flagged (volatile_timestamp is the default config) but the
  // log still must not exist before an interaction.
  await expect(shell(page)).toBeVisible();
  await expect(log(page)).toHaveCount(0);

  // Computed by silent-cache-miss.ts traceModeled(generate(), volatileRequestId):
  // every key embeds the unique requestId, so all 240 of 240 requests miss
  // (matching the banner's "240 of 240 paid full cost"). The final trace row is
  // i=239, a miss with key "req-239:SYSTEM: ...", deterministically inside the
  // 14-line tail window. Chip is not the default config, which also proves
  // hydration before the log assertion.
  await activate(shell(page).getByRole("button", { name: "Request-id in key" }));
  await expect(log(page)).toBeVisible();
  await expect(log(page)).toContainText("240/240 requests", { timeout: 15_000 });
  await expect(log(page)).toContainText("240 misses");
  await expect(log(page)).toContainText("#239");
  await expect(log(page)).toContainText("req-239:");
  await expect(log(page)).toContainText("✕ miss");
});
