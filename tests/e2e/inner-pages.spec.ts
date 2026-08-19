import { expect, test } from "@playwright/test";

const routes = [
  ["/projects", "Projects"],
  ["/projects/kvwarden", "KVWarden"],
  ["/projects/mlxd", "mlxd"],
  ["/projects/coconut-os", "Coconut OS"],
  ["/evidence", "Evidence"],
  ["/joinus", "Build with us."],
  ["/about", "A small lab for shared inference."],
  ["/contact", "Write the lab."],
  ["/colophon", "How this page is made."],
] as const;

for (const [route, heading] of routes) {
  test(`${route} renders`, async ({ page }) => {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  });
}

// Founder names hidden for now (see content/about/manifesto.mdx + app/about/page.tsx).
// When re-enabling: replace this with a /about-renders-both-founders assertion.
test("/about manifesto reads name-free", async ({ page }) => {
  await page.goto("/about", { waitUntil: "domcontentloaded" });
  await expect(page.getByText(/Coconut Labs is a small inference research lab/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Shrey Patel" })).not.toBeVisible();
  await expect(page.getByRole("heading", { name: "Jay Patel" })).not.toBeVisible();
});

test("/contact uses single info@coconutlabs.org inbox with Copy button", async ({ page }) => {
  await page.goto("/contact", { waitUntil: "domcontentloaded" });
  const main = page.getByRole("main");

  await expect(main.getByRole("link", { name: /info@coconutlabs.org/i })).toHaveAttribute(
    "href",
    "mailto:info@coconutlabs.org",
  );
  await expect(main.getByRole("button", { name: "Copy info@coconutlabs.org" })).toBeVisible();

  // Per-person addresses must NOT appear while names are hidden.
  await expect(main.getByText(/shreypatel@coconutlabs.org/i)).not.toBeVisible();
  await expect(main.getByText(/jaypatel@coconutlabs.org/i)).not.toBeVisible();
});

test("/contact has response-time + not-for-this-inbox blocks", async ({ page }) => {
  await page.goto("/contact", { waitUntil: "domcontentloaded" });
  await expect(page.getByText(/response time/i).first()).toBeVisible();
  await expect(page.getByText(/We don't always reply quickly/i)).toBeVisible();
  await expect(page.getByText(/not for this inbox/i).first()).toBeVisible();
  await expect(page.getByText(/Sales outreach/i)).toBeVisible();
});

test("/joinus shows the 5 starting paths + contributors block", async ({ page }) => {
  await page.goto("/joinus", { waitUntil: "domcontentloaded" });
  await expect(page.getByText(/Reproduce Gate 2/i)).toBeVisible();
  await expect(page.getByText(/H100 saturation case/i)).toBeVisible();
  await expect(page.getByText(/baseline scheduler/i)).toBeVisible();
  await expect(page.getByText(/failure mode in the fairness claim/i)).toBeVisible();
  await expect(page.getByText(/Patch the harness/i)).toBeVisible();
  await expect(page.getByText(/Just us, for now/i)).toBeVisible();
});

test("/projects shows KVWarden + mlxd + Coconut OS + tools section", async ({ page }) => {
  await page.goto("/projects", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "KVWarden" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "mlxd" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Coconut OS" })).toBeVisible();
  await expect(page.getByText(/tools and experiments/i)).toBeVisible();
  await expect(page.getByText(/1\.14× of solo TTFT, 26× better than FIFO/i)).toBeVisible();
  await expect(page.getByText(/In research/i).first()).toBeVisible();
});

// The filter row is gone: five tabs over three empty arrays, two of them the
// destination of a cached permanent redirect. /evidence carries one kind of
// thing and lists it plainly.
test("/evidence carries no filter nav", async ({ page }) => {
  await page.goto("/evidence", { waitUntil: "domcontentloaded" });

  for (const label of ["all", "notes", "papers", "podcasts", "talks"]) {
    await expect(page.getByRole("link", { name: label, exact: true })).toHaveCount(0);
  }
  await expect(page.getByRole("link", { name: "benchmarks page" })).toHaveAttribute(
    "href",
    "/evidence/benchmarks",
  );
});
