import { expect, test, type Locator, type Page } from "@playwright/test";

/* Functional tier for the five gallery sandboxes + the atlas guided tour.
   Preset in, verdict out: every expected banner string below is a computed
   fact, derived by executing the unit's engine module (a pure function over
   bundled data) directly in Node. The citing module is named per unit. */

type PresetCase = {
  /** Accessible name of the chip to click. */
  chip: string | RegExp;
  /** Strings the outcome banner must show after the click. */
  banner: (string | RegExp)[];
};

type Unit = {
  path: string;
  source: string;
  /** Banner content before any interaction. */
  defaultBanner: (string | RegExp)[];
  /** ✓ success · ✕ danger — the glyph the default banner must carry. */
  defaultGlyph: "✓" | "✕";
  /** How many chips are pressed at any time (1 group, or query+layout = 2). */
  pressedCount: number;
  /** A chip that produces a flagged (✕) state, for the glyph-label audit.
      Never default-active on load, so activating it also proves hydration:
      clicking a chip whose aria-pressed is already "true" in the SSR HTML
      would pass instantly with no React attached. */
  dangerProbe: string | RegExp;
  presets: PresetCase[];
};

const UNITS: Unit[] = [
  {
    // Verdicts computed by app/projects/silent-data-regression-guardrail/guardrail.ts
    // (fitProfile + check + schemaControlFlags over sample.json): the guardrail
    // flags all 6 corruptions, the schema control flags only the rename → the
    // rename reads "flagged by both", the other five "flagged by the guardrail only".
    path: "/projects/silent-data-regression-guardrail",
    source: "https://github.com/coconut-labs/data-regression-guardrail",
    defaultBanner: ["clean pass"],
    defaultGlyph: "✓",
    pressedCount: 1,
    dangerProbe: "Dropped sensor channel",
    presets: [
      { chip: "Dropped sensor channel", banner: ["flagged by the guardrail only", "state_dim"] },
      { chip: "Unit / scale flip", banner: ["flagged by the guardrail only", "value_scale"] },
      { chip: "Frame-rate drift", banner: ["flagged by the guardrail only", "frame_rate"] },
      { chip: "Clock misalignment", banner: ["flagged by the guardrail only", "timestamp"] },
      { chip: "Episode truncation", banner: ["flagged by the guardrail only", "truncation"] },
      { chip: "Schema rename", banner: ["flagged by both", "schema_drift"] },
      { chip: "Clean data", banner: ["clean pass"] },
    ],
  },
  {
    // Verdicts computed by app/projects/point-in-time-correctness/pit.ts
    // (generate(8, seed 7) + asofJoin / leakyJoin + leakedCount): the leaky join
    // takes each entity's latest feature (t=90), always after labelTs (30..69),
    // so 8 of 8 rows leak; the as-of join leaks 0 of 8.
    path: "/projects/point-in-time-correctness",
    source: "https://github.com/coconut-labs/point-in-time-correctness-guardrail",
    defaultBanner: ["clean pass", "0 of 8 rows"],
    defaultGlyph: "✓",
    pressedCount: 1,
    dangerProbe: "Leaky join (current value)",
    presets: [
      { chip: "Leaky join (current value)", banner: ["flagged", "The guardrail flagged 8 of 8 rows"] },
      { chip: "As-of join (correct)", banner: ["clean pass", "0 of 8 rows use a future feature"] },
    ],
  },
  {
    // Verdicts computed by app/projects/silent-cache-miss/silent-cache-miss.ts
    // (generate() = 240 requests over 12 hot prompts + runModeled + checkHitRatio):
    // canonical keys hit 228/240 = 95% (12 real calls); every volatile / below-min
    // config hits 0% (240 real calls), under the 50% floor → flagged. The demo's
    // default config is volatile_timestamp, so the page opens flagged.
    path: "/projects/silent-cache-miss",
    source: "https://github.com/coconut-labs/silent-cache-miss-guardrail",
    defaultBanner: ["flagged by the guardrail only", "hit ratio 0%"],
    defaultGlyph: "✕",
    pressedCount: 1,
    dangerProbe: "Request-id in key",
    presets: [
      { chip: "Canonical key (correct)", banner: ["clean pass", "95% of requests hit", "12 of 240"] },
      { chip: "Timestamp in key", banner: ["flagged by the guardrail only", "hit ratio 0%", "240 of 240"] },
      { chip: "Request-id in key", banner: ["flagged by the guardrail only", "hit ratio 0%"] },
      { chip: "Below min length", banner: ["flagged by the guardrail only", "hit ratio 0%"] },
    ],
  },
  {
    // Verdicts computed by app/projects/columnar-scan-bytes-guardrail/scan.ts
    // (readReport over the 12-column, 200k-row model; tolerance 2x budget):
    // row layout reads 358 B/row = 71.6 MB for every query → 89.5x over a 2-column
    // budget, 7.5x over the url budget, but exactly 1.0x for the full export;
    // columnar reads only the projection → always within budget.
    path: "/projects/columnar-scan-bytes-guardrail",
    source: "https://github.com/coconut-labs/columnar-scan-bytes-guardrail",
    defaultBanner: ["within budget"],
    defaultGlyph: "✓",
    pressedCount: 2, // one query chip + one layout chip
    dangerProbe: "Row layout",
    presets: [
      { chip: "Row layout", banner: ["flagged by the guardrail only", "89.5x"] },
      { chip: /top URLs/, banner: ["flagged by the guardrail only", "7.5x"] },
      { chip: /full row export/, banner: ["within budget", "needs every column"] },
      { chip: "Columnar + projection", banner: ["within budget"] },
      { chip: /sessions by country \+ device/, banner: ["within budget"] },
    ],
  },
  {
    // Verdicts computed by app/projects/ingestion-data-contract/contract.ts
    // (fitContract + check + controlFlags over sample.json): the contract flags
    // all 6 drifts; the standard schema/null/rowcount control flags only the
    // x1000 overflow (values leave the inferred range) → "flagged by both";
    // the five silent drifts read "flagged by the contract only".
    path: "/projects/ingestion-data-contract",
    source: "https://github.com/coconut-labs/ingestion-data-contract-guardrail",
    defaultBanner: ["clean pass"],
    defaultGlyph: "✓",
    pressedCount: 1,
    dangerProbe: "Type widening",
    presets: [
      { chip: "Partial unit change", banner: ["flagged by the contract only", "scale_drift"] },
      { chip: "Precision truncation", banner: ["flagged by the contract only", "precision_drift"] },
      { chip: "New enum value", banner: ["flagged by the contract only", "enum_drift"] },
      { chip: "Boolean re-encoding", banner: ["flagged by the contract only", "enum_drift"] },
      { chip: "Type widening", banner: ["flagged by the contract only", "type_drift"] },
      { chip: "Out-of-range scale", banner: ["flagged by both", "scale_drift"] },
      { chip: "Clean data", banner: ["clean pass"] },
    ],
  },
];

const shell = (page: Page) => page.getByTestId("demo-shell");
const banner = (page: Page) => page.getByTestId("demo-outcome");

/* Click a preset and wait until its state actually flips. The retry loop
   absorbs hydration landing after domcontentloaded (same pattern as the
   atlas spec); expect-polling only, no bare timeouts. */
async function activate(chip: Locator) {
  await expect(async () => {
    await chip.click();
    await expect(chip).toHaveAttribute("aria-pressed", "true", { timeout: 1500 });
  }).toPass({ timeout: 15_000 });
}

/* Every ✓/✕/● glyph inside the sandbox must have real text beside it in the
   same parent — the verdict is never color- or glyph-only. */
async function auditGlyphLabels(page: Page) {
  const bare = await shell(page).evaluate((root) => {
    const offenders: string[] = [];
    root.querySelectorAll('span[aria-hidden="true"]').forEach((g) => {
      const glyph = g.textContent ?? "";
      if (!/[✓✕●]/.test(glyph)) return;
      const label = (g.parentElement?.textContent ?? "").replace(glyph, "").trim();
      if (!label) offenders.push(g.parentElement?.outerHTML ?? "<detached>");
    });
    return offenders;
  });
  expect(bare).toEqual([]);
}

for (const unit of UNITS) {
  test.describe(unit.path, () => {
    test("sandbox sits above the accordions and opens with a coherent verdict", async ({ page }) => {
      await page.goto(unit.path, { waitUntil: "domcontentloaded" });
      await expect(shell(page)).toBeVisible();

      // The DemoShell precedes the first <details> in document order.
      const shellFirst = await page.evaluate(() => {
        const s = document.querySelector('[data-testid="demo-shell"]');
        const d = document.querySelector("details");
        if (!s || !d) return false;
        return Boolean(s.compareDocumentPosition(d) & Node.DOCUMENT_POSITION_FOLLOWING);
      });
      expect(shellFirst).toBe(true);

      // Default outcome: non-empty, the expected verdict, the expected tone glyph.
      for (const fragment of unit.defaultBanner) {
        await expect(banner(page)).toContainText(fragment);
      }
      await expect(banner(page)).toContainText(unit.defaultGlyph);
    });

    test("every preset flips aria-pressed and lands the engine's verdict", async ({ page }) => {
      await page.goto(unit.path, { waitUntil: "domcontentloaded" });
      for (const preset of unit.presets) {
        const chip = shell(page).getByRole("button", { name: preset.chip });
        await activate(chip);
        // Exactly one chip per control group stays pressed.
        await expect(shell(page).locator('button[aria-pressed="true"]')).toHaveCount(unit.pressedCount);
        for (const fragment of preset.banner) {
          await expect(banner(page)).toContainText(fragment);
        }
      }
    });

    test("verdict glyphs always carry an adjacent text label", async ({ page }) => {
      await page.goto(unit.path, { waitUntil: "domcontentloaded" });
      await expect(shell(page)).toBeVisible();
      await auditGlyphLabels(page); // default state
      await activate(shell(page).getByRole("button", { name: unit.dangerProbe }));
      await auditGlyphLabels(page); // flagged state, ✕ glyphs present
    });

    test("accordions open with content and the source link resolves", async ({ page }) => {
      await page.goto(unit.path, { waitUntil: "domcontentloaded" });
      // Settle hydration first (dangerProbe is never default-active) so
      // Disclosure's defaultOpenDesktop effect has already applied.
      await activate(shell(page).getByRole("button", { name: unit.dangerProbe }));

      const details = page.locator("details");
      const count = await details.count();
      expect(count).toBeGreaterThanOrEqual(5);
      for (let i = 0; i < count; i++) {
        const d = details.nth(i);
        if (!(await d.evaluate((el: HTMLDetailsElement) => el.open))) {
          await d.locator("summary").click();
        }
        await expect(d).toHaveJSProperty("open", true);
        const body = await d.evaluate((el) => {
          const summary = el.querySelector("summary");
          return (el.textContent ?? "").replace(summary?.textContent ?? "", "").trim();
        });
        expect(body.length).toBeGreaterThan(0);
      }

      await expect(
        page.getByRole("link", { name: /^source: github\.com\/coconut-labs\// })
      ).toHaveAttribute("href", unit.source);
    });

    test("presets are reachable by Tab and activate on Enter and Space", async ({ page }) => {
      await page.goto(unit.path, { waitUntil: "domcontentloaded" });
      const chips = shell(page).getByRole("button");
      const first = chips.first();
      const second = chips.nth(1);

      // Prove hydration on a chip that is not pressed in the SSR HTML, then
      // put the group in a known state with the first chip active.
      await activate(shell(page).getByRole("button", { name: unit.dangerProbe }));
      await activate(first);
      await first.focus();
      await page.keyboard.press("Tab");
      await expect(second).toBeFocused();
      await page.keyboard.press("Space");
      await expect(second).toHaveAttribute("aria-pressed", "true");
      await page.keyboard.press("Shift+Tab");
      await expect(first).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(first).toHaveAttribute("aria-pressed", "true");
    });
  });
}

/* Atlas guided tour: seven stations in LifecycleMap.tsx TOUR order. The
   sr-only aria-live region must announce each stop; Escape and finishing
   both return focus to the start button. */
test("atlas tour announces every stop and exits cleanly both ways", async ({ page }) => {
  await page.goto("/projects/agentic-mlops", { waitUntil: "domcontentloaded" });
  const start = page.getByRole("button", { name: "Take the tour" });
  const panel = page.getByRole("group", { name: "Guided tour" });
  const announcer = page.locator('div.sr-only[aria-live="polite"]');

  await expect(async () => {
    await start.press("Enter");
    await expect(panel).toBeVisible({ timeout: 1500 });
  }).toPass({ timeout: 15_000 });

  // TOUR in app/projects/agentic-mlops/LifecycleMap.tsx, in act order.
  const STOPS = ["Registry + lineage", "Gate", "Serve", "Monitor", "Canary", "Roll back", "Reasoning path"];
  for (let i = 0; i < STOPS.length; i++) {
    await expect(panel).toContainText(`Stop ${i + 1} of ${STOPS.length}`);
    await expect(announcer).toContainText(`Tour stop ${i + 1} of ${STOPS.length}: ${STOPS[i]}`);
    if (i < STOPS.length - 1) await page.keyboard.press("ArrowRight");
  }

  // ArrowRight on the last stop finishes the tour and hands focus back.
  await page.keyboard.press("ArrowRight");
  await expect(panel).not.toBeVisible();
  await expect(start).toBeFocused();

  // Restart, walk one stop, Escape exits with focus returned.
  await start.press("Enter");
  await expect(panel).toBeVisible();
  await expect(panel).toContainText("Stop 1 of 7");
  await page.keyboard.press("ArrowRight");
  await expect(panel).toContainText("Stop 2 of 7");
  await page.keyboard.press("Escape");
  await expect(panel).not.toBeVisible();
  await expect(start).toBeFocused();
});
