import { expect, test } from "@playwright/test";

/* Functional tier for the pre-trade risk gate unit. Every expected count
   below is a computed fact: derived by loading the SAME wasm artifact this
   page serves (public/demos/risk_gate_wasm.wasm) in Node and running
   app/projects/risk-hotpath/gate.ts scenarioStream/runScenario over it.
   Streams are seeded, so browser and Node must agree exactly:

     clean      600/600 accepted
     fat-finger 585 accepted / 15 max quantity
     collar     576 accepted / 24 price collar
     duplicate  580 accepted / 20 duplicate id
     credit     554 accepted / 46 credit limit
     hot-swap   463 accepted / 137 max quantity (cap 500 at order 300) */

const PATH = "/projects/risk-hotpath";

const outcome = (page: import("@playwright/test").Page) => page.getByTestId("demo-outcome");

async function ready(page: import("@playwright/test").Page) {
  await page.goto(PATH);
  // wasm fetch + instantiate is async; "gate armed" is the loaded state.
  // 20s: firefox under full-suite parallel load twice blew a 10s budget
  // (flake, passed isolated); the timeout is load headroom, not slowness.
  await expect(outcome(page)).toContainText("gate armed", { timeout: 20_000 });
}

test("gate loads and arms with the real wasm module", async ({ page }) => {
  await ready(page);
  await expect(outcome(page)).toContainText("instantiated in your browser");
});

const CASES: { chip: string; banner: (string | RegExp)[] }[] = [
  { chip: "Clean session", banner: ["clean pass", "All 600 orders accepted"] },
  { chip: "Fat-finger order", banner: ["15 rejected", "accepted 585 of 600", "max quantity"] },
  { chip: "Price collar breach", banner: ["24 rejected", "accepted 576 of 600", "price collar"] },
  { chip: "Replayed orders", banner: ["20 rejected", "accepted 580 of 600", "duplicate id"] },
  { chip: "Credit limit burn", banner: ["46 rejected", "accepted 554 of 600", "credit limit"] },
  { chip: "Config hot-swap", banner: ["137 rejected", "accepted 463 of 600", "max quantity"] },
];

for (const c of CASES) {
  test(`session: ${c.chip}`, async ({ page }) => {
    await ready(page);
    await page.getByRole("button", { name: c.chip }).click();
    for (const fragment of c.banner) {
      await expect(outcome(page)).toContainText(fragment);
    }
  });
}

test("rejection breakdown table matches the banner", async ({ page }) => {
  await ready(page);
  await page.getByRole("button", { name: "Credit limit burn" }).click();
  const table = page.getByTestId("demo-shell").locator("table");
  await expect(table).toContainText("✓ accepted");
  await expect(table).toContainText("554");
  await expect(table).toContainText("✕ credit limit");
  await expect(table).toContainText("46");
});

test("session replays as a live order tape with running counters", async ({ page }) => {
  await ready(page);
  // Credit burn: once the line is spent every later order is refused, so the
  // tape's visible tail (last 14 lines) is deterministically all rejects.
  await page.getByRole("button", { name: "Credit limit burn" }).click();
  const tape = page.getByTestId("order-tape");
  await expect(tape).toBeVisible();
  // The replay finishes in ~5s (600 lines at 125/sec); the counter must
  // land exactly on the computed totals. Reduced-motion contexts land
  // instantly; either way the end state is the same fact.
  await expect(tape).toContainText("600/600 orders", { timeout: 15_000 });
  await expect(tape).toContainText("554 accepted");
  await expect(tape).toContainText("46 rejected");
  await expect(tape).toContainText("✕ CreditLimit");
});

test("reset returns the gate to armed", async ({ page }) => {
  await ready(page);
  await page.getByRole("button", { name: "Fat-finger order" }).click();
  await expect(outcome(page)).toContainText("15 rejected");
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(outcome(page)).toContainText("gate armed");
});

test("hardware bench reports an evals/sec figure", async ({ page }) => {
  await ready(page);
  await page.getByRole("button", { name: "measure evals/sec on your hardware" }).click();
  // Wall-clock value varies by machine; assert the format, never the number.
  await expect(page.getByTestId("demo-shell")).toContainText(/\d+(\.\d+)?M evals\/sec/, {
    timeout: 30_000,
  });
});
