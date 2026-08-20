import { expect, test } from "@playwright/test";

/* CareScribe is the first unit that leaves the browser: it posts to a Worker
   which calls a model on Cloudflare's GPUs. The model is therefore a network
   dependency and a daily allocation, so these tests never hit it for real.
   The endpoint is stubbed with the shapes the Worker actually returns, probed
   against the deployed Worker: 200 {ok, note, model, elapsed_ms} on success,
   503 {ok:false,error} when the neuron allocation is spent. */

const ENDPOINT = "https://carescribe-demo.shrey77-wrk.workers.dev";

const NOTE = [
  "CHIEF COMPLAINT: chest tightness two days, worse on exertion",
  "HISTORY: 54-year-old male, relieved by rest",
  "OBJECTIVE: BP 148/92, HR 88",
  "ASSESSMENT: not documented",
  "PLAN: ECG, troponin, aspirin",
].join("\n");

test("the page states where it runs and what it does not show", async ({ page }) => {
  await page.goto("/projects/carescribe", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "CareScribe", exact: true })).toBeVisible();

  // The sandbox is above the accordions, like every other unit.
  await expect(page.getByTestId("demo-shell")).toBeVisible();

  // The honesty panel is not optional on a clinical demo. It ships collapsed,
  // so open it and check the two claims that actually matter.
  const honesty = page.locator("details").filter({ hasText: "What this demo does not show" });
  await expect(honesty).toBeVisible();
  await honesty.locator("summary").click();
  await expect(honesty.getByText(/Not a medical device/i)).toBeVisible();

  // The do-not-paste warning sits on the sandbox itself, not behind a toggle.
  await expect(page.getByTestId("demo-shell").getByText(/Do not paste real patient data/i)).toBeVisible();
});

test("a run posts the transcript and renders the note the model returned", async ({ page }) => {
  let posted: string | null = null;
  await page.route(ENDPOINT, async (route) => {
    posted = String(route.request().postDataJSON()?.transcript ?? "");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        note: NOTE,
        model: "@cf/nvidia/nemotron-3-120b-a12b",
        elapsed_ms: 5581,
        stored: false,
      }),
    });
  });

  await page.goto("/projects/carescribe", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Write the note" }).click();

  const note = page.getByTestId("carescribe-note");
  await expect(note).toBeVisible();
  await expect(note).toContainText("CHIEF COMPLAINT");
  // The property the prompt exists to enforce: an unsupported heading is
  // marked, not filled in.
  await expect(note).toContainText("ASSESSMENT: not documented");

  // The transcript actually left the page, and the model is named beside the
  // result rather than left implicit.
  expect(posted).toContain("chest tightness");
  await expect(page.getByText(/nemotron-3-120b/)).toBeVisible();
  await expect(page.getByText(/5\.6 s/)).toBeVisible();
});

test("a spent daily allocation is reported in plain words, not as a crash", async ({ page }) => {
  await page.route(ENDPOINT, async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        ok: false,
        error:
          "The model call failed. The free daily allocation may be spent; it resets at 00:00 UTC.",
      }),
    });
  });

  await page.goto("/projects/carescribe", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Write the note" }).click();

  // Scoped to the sandbox: the same sentence also appears in the prose below,
  // which explains the allocation, and an unscoped match hits both.
  await expect(page.getByTestId("demo-shell").getByText(/resets at 00:00 UTC/)).toBeVisible();
  await expect(page.getByTestId("carescribe-note")).toHaveCount(0);
});

test("presets swap the transcript and clear the previous note", async ({ page }) => {
  await page.route(ENDPOINT, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, note: NOTE, model: "m", elapsed_ms: 1000 }),
    });
  });

  await page.goto("/projects/carescribe", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Write the note" }).click();
  await expect(page.getByTestId("carescribe-note")).toBeVisible();

  await page.getByRole("button", { name: "thin transcript" }).click();
  await expect(page.getByRole("button", { name: "thin transcript" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  // A stale note under a new transcript would be a lie about what was run.
  await expect(page.getByTestId("carescribe-note")).toHaveCount(0);
});
