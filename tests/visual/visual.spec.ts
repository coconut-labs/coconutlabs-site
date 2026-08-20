import { expect, test } from "@playwright/test";

/**
 * Pixel-deterministic visual regression — the hard design gate.
 *
 * Determinism levers: fixed viewports, deviceScaleFactor 1, reduced-motion
 * forced (collapses every UI transition AND freezes KernelSilk/DotField
 * to their static frames), fonts awaited, animations disabled at screenshot
 * time, network idle. maxDiffPixels 0: any rendered change fails until a
 * baseline is deliberately updated.
 *
 * Baselines are platform-suffixed by Playwright (darwin/linux). The local
 * gate runs against committed darwin baselines. CI (linux) runs the same
 * spec non-blocking until linux baselines are committed; see
 * docs/design-system.md section 8.
 *
 * Routes under active rebuild are added when they stabilize; the demo/atlas
 * routes join after the convey-power merge, with functional tests.
 */

const ROUTES = [
  "/",
  "/evidence",
  "/evidence/tenant-fairness-on-shared-inference",
  "/evidence/benchmarks",
  "/projects",
  "/projects/kvwarden",
  "/projects/mlxd",
  "/projects/coconut-os",
  "/projects/risk-hotpath",
  "/projects/latent-diffusion",
  "/drawings",
  "/about",
  "/credentials",
  "/contact",
  "/colophon",
];

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 375, height: 812 },
] as const;

const SCHEMES = ["light", "dark"] as const;

for (const vp of VIEWPORTS) {
  for (const scheme of SCHEMES) {
    test.describe(`${vp.name} ${scheme}`, () => {
      test.use({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
        colorScheme: scheme,
        contextOptions: { reducedMotion: "reduce" },
      });

      for (const route of ROUTES) {
        test(`pixel: ${route}`, async ({ page }) => {
          await page.goto(route, { waitUntil: "networkidle" });
          await page.evaluate(() => document.fonts.ready);
          // settle any first-paint reveal that reduced-motion converts to
          // an instant state change
          await page.waitForTimeout(150);
          await expect(page).toHaveScreenshot(
            `${route.replaceAll("/", "_") || "_home"}-${vp.name}-${scheme}.png`,
            {
              fullPage: true,
              animations: "disabled",
              caret: "hide",
              maxDiffPixels: 0,
              // maxDiffPixels alone is NOT strict: it counts pixels above
              // pixelmatch's default per-pixel color threshold (0.2), which
              // silently passed a full hero-background swap in the dark
              // theme (lanes -> dots, channel deltas ~20-50 on near-black).
              // threshold 0 flags any channel delta; rendering is
              // deterministic per platform, so this stays green run-to-run.
              threshold: 0,
            },
          );
        });
      }
    });
  }
}
