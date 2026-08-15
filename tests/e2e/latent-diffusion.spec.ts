import { expect, test } from "@playwright/test";

/* Functional tier for the latent diffusion mechanics unit.
 *
 * Every expected value below is a COMPUTED FACT, not a hand-typed one. Each was
 * produced by compiling app/projects/latent-diffusion/schedule.ts and executing
 * it under Node, reproducing the exact strings Demo.tsx composes:
 *
 *   npx tsc app/projects/latent-diffusion/schedule.ts --outDir <tmp> \
 *     --target es2022 --module commonjs --strict
 *   node -e '<banner(id, t, err) reproduction; see derivation below>'
 *
 * Derivation output, verbatim:
 *
 *   txt2img      t=500 err=0  signal 52.6%  noise 85.1%  abar 0.2763  rms 0.000
 *   txt2img      t=999 err=0  signal  6.8%  noise 99.8%  abar 0.0047  rms 0.000
 *   txt2img      t=  0 err=0  signal 100.0% noise  2.9%  abar 0.9992  rms 0.000
 *   txt2img      t=500 err=5  rms 0.081  errorGain 1.6x
 *   txt2img      t=999 err=5  rms 0.734  errorGain 14.6x
 *   cin256       t=500 err=0  signal 33.9%  noise 94.1%  abar 0.1149
 *   cin256       t=999 err=5  rms 4.210  errorGain 83.8x
 *   ddpm-default t=500 err=0  signal 57.6%  noise 81.8%  abar 0.3313
 *
 *   baseCells(): 576 cells, opacity sum 283.018
 *   recoveredCells === baseCells at t = 0, 200, 500, 800, 999 (exact predictor)
 *   noisedCells opacity sums: t=0 -> 282.548, t=500 -> 276.872, t=999 -> 278.528
 *   trajectory(): 41 lines per schedule, last t = 999
 *
 *   latentRows(512, 3): 786,432 pixel values; f=4 -> 49,152 (16x);
 *   f=8 -> 16,384 (48x); f=16 -> 16,384 (48x); f=32 -> 16,384 (48x)
 *
 * The schedule constants themselves trace to the repo:
 *   configs/latent-diffusion/txt2img-1p4B-eval.yaml   0.00085 -> 0.012, 1000 steps
 *   configs/latent-diffusion/cin256-v2.yaml           0.0015  -> 0.0195, 1000 steps
 *   ldm/models/diffusion/ddpm.py:50                   1e-4    -> 2e-2, 1000 steps
 */

const PATH = "/projects/latent-diffusion";

type Page = import("@playwright/test").Page;

const outcome = (page: Page) => page.getByTestId("demo-outcome");
const slider = (page: Page) => page.getByTestId("timestep");

/** Sum of every rect's fill-opacity in a panel, rounded the way the engine
 *  rounds, so the browser value is comparable to the Node value. */
async function panelSum(page: Page, testId: string): Promise<number> {
  return page
    .getByTestId(testId)
    .locator("rect")
    .evaluateAll(
      (els) =>
        Math.round(
          els.reduce((a, e) => a + Number(e.getAttribute("fill-opacity") ?? "0"), 0) * 1000,
        ) / 1000,
    );
}

async function ready(page: Page) {
  await page.goto(PATH);
  await expect(outcome(page)).toContainText("t = 500 of 1000");
}

/** The range input needs a real interaction for React to see the change. */
async function setT(page: Page, t: number) {
  await slider(page).fill(String(t));
  await expect(outcome(page)).toContainText(`t = ${t} of 1000`);
}

test("the page opens on the txt2img schedule at t = 500", async ({ page }) => {
  await ready(page);
  await expect(outcome(page)).toContainText("t = 500 of 1000 · txt2img 1.4B");
  await expect(outcome(page)).toContainText("52.6% of its original amplitude");
  await expect(outcome(page)).toContainText("85.1% noise");
  await expect(outcome(page)).toContainText("alphas_cumprod[500] = 0.2763");
  await expect(outcome(page)).toContainText(
    "endpoints 0.00085 to 0.012 from configs/latent-diffusion/txt2img-1p4B-eval.yaml",
  );
});

test("scrubbing the timestep walks the repo's own alphas_cumprod table", async ({ page }) => {
  await ready(page);

  await setT(page, 0);
  await expect(outcome(page)).toContainText("100.0% of its original amplitude");
  await expect(outcome(page)).toContainText("2.9% noise");
  await expect(outcome(page)).toContainText("alphas_cumprod[0] = 0.9992");
  // betas[0] is linear_start exactly, which is the schedule's own endpoint.
  await expect(outcome(page)).toContainText("beta[0] = 0.0008500");

  await setT(page, 999);
  await expect(outcome(page)).toContainText("6.8% of its original amplitude");
  await expect(outcome(page)).toContainText("99.8% noise");
  await expect(outcome(page)).toContainText("alphas_cumprod[999] = 0.0047");
  // betas[999] is linear_end exactly.
  await expect(outcome(page)).toContainText("beta[999] = 0.01200");
});

const SCHEDULES: { chip: string; label: string; signal: string; noise: string; abar: string }[] = [
  { chip: "cin256-v2", label: "cin256-v2", signal: "33.9%", noise: "94.1%", abar: "0.1149" },
  { chip: "DDPM default", label: "DDPM default", signal: "57.6%", noise: "81.8%", abar: "0.3313" },
];

for (const s of SCHEDULES) {
  test(`schedule ${s.label} changes the mix at the same t`, async ({ page }) => {
    await ready(page);
    await page.getByRole("button", { name: new RegExp(`^${s.chip}`) }).click();
    await expect(outcome(page)).toContainText(`t = 500 of 1000 · ${s.label}`);
    await expect(outcome(page)).toContainText(`${s.signal} of its original amplitude`);
    await expect(outcome(page)).toContainText(`${s.noise} noise`);
    await expect(outcome(page)).toContainText(`alphas_cumprod[500] = ${s.abar}`);
  });
}

test("an exact predictor returns the field whole at every timestep", async ({ page }) => {
  await ready(page);
  // The recovered panel is invariant under t when eps_hat is exact: it equals
  // baseCells(), whose 576 opacities sum to 283.018.
  for (const t of [0, 200, 500, 800, 999]) {
    await setT(page, t);
    await expect(outcome(page)).toContainText("RMS error 0.000");
    expect(await panelSum(page, "panel-recovered")).toBe(283.018);
  }
});

test("the forward panel actually moves while the recovered panel does not", async ({ page }) => {
  await ready(page);
  await setT(page, 0);
  expect(await panelSum(page, "panel-noised")).toBe(282.548);
  await setT(page, 500);
  expect(await panelSum(page, "panel-noised")).toBe(276.872);
  await setT(page, 999);
  expect(await panelSum(page, "panel-noised")).toBe(278.528);
  await expect(page.getByTestId("panel-noised").locator("rect")).toHaveCount(576);
});

test("a 5 percent predictor error is amplified by the step's own gain", async ({ page }) => {
  await ready(page);
  await page.getByRole("button", { name: "Predictor 5% off" }).click();

  // 0.05 * 1.62 = 0.081 at t=500; the gain is sqrt(1/abar_t - 1).
  await expect(outcome(page)).toContainText("RMS error 0.081");
  await expect(outcome(page)).toContainText("multiplies predictor error by 1.6x");

  // Same 5 percent, far later in the trajectory: 0.05 * 14.61 = 0.734.
  await setT(page, 999);
  await expect(outcome(page)).toContainText("RMS error 0.734");
  await expect(outcome(page)).toContainText("multiplies predictor error by 14.6x");

  // cin256 decays harder, so the same error costs far more there.
  await page.getByRole("button", { name: /^cin256-v2/ }).click();
  await expect(outcome(page)).toContainText("RMS error 4.210");
  await expect(outcome(page)).toContainText("multiplies predictor error by 83.8x");

  await page.getByRole("button", { name: "Exact noise predictor" }).click();
  await expect(outcome(page)).toContainText("RMS error 0.000");
});

test("the trajectory log replays the schedule and lands on its computed totals", async ({ page }) => {
  await ready(page);
  // Nothing renders before the first interaction, which is what keeps the
  // route's visual baseline stable.
  await expect(page.getByTestId("live-log")).toHaveCount(0);

  await setT(page, 600);
  const log = page.getByTestId("live-log");
  await expect(log).toBeVisible();
  // trajectory() emits 41 lines: t = 0, 25, ... 975, then 999.
  await expect(log).toContainText("41/41 steps", { timeout: 15_000 });
  // 26 of the 41 sampled steps have alphas_cumprod < 0.5 on this schedule.
  await expect(log).toContainText("26 noise leads");
  await expect(log).toContainText("t=999");
});

test("the compression table is arithmetic on the four autoencoder configs", async ({ page }) => {
  await page.goto(PATH);
  const main = page.locator("main");
  await expect(main).toContainText("786,432");
  // f = 8 (ch_mult [1,2,4,4]) is the headline row.
  await expect(main).toContainText("64x64x4");
  await expect(main).toContainText("16,384");
  await expect(main).toContainText("48x");
  // f = 4 (ch_mult [1,2,4]) is the only config that lands elsewhere.
  await expect(main).toContainText("128x128x3");
  await expect(main).toContainText("49,152");
  await expect(main).toContainText("16x");
  // The derivation checks itself against the config filenames at resolution 256.
  await expect(main).toContainText("64, 32, 16, 8");
  await expect(main).toContainText("64x64x3, 32x32x4, 16x16x16, 8x8x64");
});

test("the honesty panel states all three unverified claims and what would verify them", async ({
  page,
}) => {
  await page.goto(PATH);
  const panel = page.getByTestId("honesty-panel");
  await expect(panel).toBeVisible();
  await expect(panel).toContainText("They were claimed during development and the artifacts were not retained in the repository.");
  await expect(panel).toContainText("Trained on 10 H100 nodes over pooled ArtBench and OpenImages");
  await expect(panel).toContainText("FID reduced by 20 percent");
  await expect(panel).toContainText("1.84 second inference latency");
  await expect(panel).toContainText("A training log carrying step count, loss curve, wall clock");
  await expect(panel).toContainText("An eval output naming the FID implementation");
  await expect(panel).toContainText("A generation run recording sampler, step count, guidance scale");
  await expect(panel).toContainText("ldm.data.openimages");
});

test("no unverified figure appears anywhere outside the honesty panel", async ({ page }) => {
  await page.goto(PATH);
  const main = (await page.locator("main").textContent()) ?? "";
  const panel = (await page.getByTestId("honesty-panel").textContent()) ?? "";
  const count = (haystack: string, needle: string) => haystack.split(needle).length - 1;

  for (const needle of ["1.84", "H100", "FID", "20 percent"]) {
    const inPanel = count(panel, needle);
    expect(inPanel, `${needle} must appear in the honesty panel`).toBeGreaterThan(0);
    expect(count(main, needle), `${needle} must appear ONLY in the honesty panel`).toBe(inPanel);
  }
});

test("the source links name the repo and its upstream", async ({ page }) => {
  await page.goto(PATH);
  const main = page.locator("main");
  await expect(
    main.getByRole("link", { name: /ShreyPatel4\/Latent-Diffusion-Artbench-OpenImage/ }),
  ).toBeVisible();
  await expect(main.getByRole("link", { name: /CompVis\/latent-diffusion/ })).toBeVisible();
  await expect(main).toContainText("copied in rather than forked");
});

test("no horizontal overflow at 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto(PATH);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
