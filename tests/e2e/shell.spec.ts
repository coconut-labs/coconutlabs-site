import { expect, test } from "@playwright/test";

test("header renders the wordmark and the MENU toggle", async ({ page }) => {
  await page.goto("/");
  const header = page.getByRole("banner");
  await expect(header).toBeVisible();
  await expect(header.getByRole("link", { name: "coconutlabs" })).toBeVisible();

  const toggle = header.getByRole("button", { name: "MENU" });
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toHaveAttribute("aria-controls", "site-menu");
});

test("MENU opens the panel with the four column labels and toggles to CLOSE", async ({ page }) => {
  await page.goto("/");
  const header = page.getByRole("banner");
  const panel = page.locator("#site-menu");
  await expect(panel).toBeHidden();

  await header.getByRole("button", { name: "MENU" }).click();
  const closeButton = header.getByRole("button", { name: "CLOSE" });
  await expect(closeButton).toHaveAttribute("aria-expanded", "true");
  await expect(panel).toBeVisible();

  for (const label of ["WORK", "EVIDENCE", "LEARN", "LAB", "WRITE TO US"]) {
    await expect(panel.getByText(label, { exact: true })).toBeVisible();
  }
  await expect(panel.getByRole("link", { name: "KVWarden" })).toBeVisible();
  await expect(panel.getByRole("link", { name: "Masterclass" })).toHaveAttribute(
    "href",
    "https://masterclass.coconutlabs.org",
  );
  // The panel's last column is an address, not a status readout. The live
  // dot and the "masterclass · live" line were theatre and came out.
  await expect(panel.getByRole("link", { name: "info@coconutlabs.org" })).toBeVisible();
  await expect(panel.getByText("● LIVE")).toHaveCount(0);

  // Toggle back closed from the same button.
  await closeButton.click();
  await expect(panel).toBeHidden();
});

test("Escape closes the panel and returns focus to the toggle", async ({ page }) => {
  await page.goto("/");
  const header = page.getByRole("banner");
  await header.getByRole("button", { name: "MENU" }).click();
  await expect(page.locator("#site-menu")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.locator("#site-menu")).toBeHidden();
  await expect(header.getByRole("button", { name: "MENU" })).toBeFocused();
});

test("menu closes on navigation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "MENU" }).click();
  await page.locator("#site-menu").getByRole("link", { name: "All evidence", exact: true }).click();
  await expect(page).toHaveURL(/\/evidence$/);
  await expect(page.locator("#site-menu")).toBeHidden();
});

test("footer carries the Steady Cadence row and the baseline row", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  await expect(footer).toBeVisible();
  await expect(footer).toHaveAttribute("id", "cadence");

  // Row 1: the letter pitch plus the live signup form.
  await expect(
    footer.getByText("Steady Cadence · one measured letter: what we shipped and what we got wrong"),
  ).toBeVisible();
  await expect(footer.getByLabel("Email address")).toBeVisible();
  await expect(footer.getByRole("button", { name: "SUBSCRIBE" })).toBeVisible();

  // Row 2: the sitemap. The SAME four columns the header menu renders, from
  // the same lib/nav.ts export; one representative link per kind is asserted.
  const sitemap = footer.getByRole("navigation", { name: "Site map" });
  await expect(sitemap).toBeVisible();
  for (const col of ["WORK", "EVIDENCE", "LEARN", "LAB"]) {
    await expect(sitemap.getByText(col, { exact: true })).toBeVisible();
  }
  await expect(sitemap.getByRole("link", { name: "Working drawings" })).toHaveAttribute(
    "href",
    "/drawings",
  );
  await expect(sitemap.getByRole("link", { name: "Hall of demos" })).toHaveAttribute(
    "href",
    "/projects/gallery",
  );
  await expect(sitemap.getByRole("link", { name: /Masterclass/ })).toHaveAttribute(
    "href",
    "https://masterclass.coconutlabs.org",
  );

  // Row 3: the hostname rail, every host in the estate on one mono line.
  await expect(footer.getByRole("link", { name: "waterline.coconutlabs.org" })).toHaveAttribute(
    "href",
    "https://waterline.coconutlabs.org",
  );
  await expect(footer.getByRole("link", { name: "library.coconutlabs.org" })).toHaveAttribute(
    "href",
    "https://library.coconutlabs.org",
  );

  // Row 4: identity plus the surfaces that actually exist. A surface we do
  // not have yet gets no row, so there is nothing here promising one.
  await expect(footer.getByText("Coconut Labs · independent inference research")).toBeVisible();
  await expect(footer.getByRole("link", { name: "GitHub" })).toHaveAttribute(
    "href",
    "https://github.com/coconut-labs",
  );
  await expect(footer.getByRole("link", { name: "RSS" })).toHaveAttribute("href", "/rss.xml");
  await expect(footer.getByRole("link", { name: "info@coconutlabs.org" })).toHaveAttribute(
    "href",
    "mailto:info@coconutlabs.org",
  );
  await expect(footer.getByText(/outposts/i)).toHaveCount(0);
});

test("cadence signup maps the worker's three response shapes", async ({ page }) => {
  // Hermetic: the live worker is never hit. Response shapes mirror the probed
  // contract: 201 {ok} new, 200 {ok, already} duplicate, 422 {ok:false} error.
  let call = 0;
  await page.route("https://steady-cadence.shrey77-wrk.workers.dev/subscribe", async (route) => {
    call += 1;
    expect(route.request().method()).toBe("POST");
    expect(route.request().postDataJSON()).toMatchObject({ source: "footer" });
    if (call === 1) {
      await route.fulfill({ status: 201, contentType: "application/json", body: '{"ok":true}' });
    } else if (call === 2) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: '{"ok":true,"already":true}',
      });
    } else {
      await route.fulfill({
        status: 422,
        contentType: "application/json",
        body: '{"ok":false,"error":"invalid email"}',
      });
    }
  });

  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  const input = footer.getByLabel("Email address");
  const submit = footer.getByRole("button", { name: "SUBSCRIBE" });
  const status = footer.getByTestId("cadence-status");

  await expect(status).toHaveAttribute("aria-live", "polite");

  await input.fill("reader@example.com");
  await submit.click();
  await expect(status).toHaveText("✓ You are on the list.");

  await input.fill("reader@example.com");
  await submit.click();
  await expect(status).toHaveText("Already on the list.");

  await input.fill("reader@example.com");
  await submit.click();
  await expect(status).toHaveText("That did not go through. Check the address and try once more.");
});

test("theme toggle cycles system, light, dark and persists across reload", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  const toggle = page.getByTestId("theme-toggle");
  const html = page.locator("html");

  await expect(toggle).toHaveText(/SYSTEM/);
  await expect(html).not.toHaveAttribute("data-theme");

  await toggle.click();
  await expect(toggle).toHaveText(/LIGHT/);
  await expect(html).toHaveAttribute("data-theme", "light");

  await toggle.click();
  await expect(toggle).toHaveText(/DARK/);
  await expect(html).toHaveAttribute("data-theme", "dark");
  expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe("dark");

  // The no-flash script replays the stored choice before paint.
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await expect(toggle).toHaveText(/DARK/);

  // Full cycle: dark returns to system, attribute and storage cleared.
  await toggle.click();
  await expect(toggle).toHaveText(/SYSTEM/);
  await expect(html).not.toHaveAttribute("data-theme");
  expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe(null);
});

test("explicit light theme wins over a dark OS preference", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  const toggle = page.getByTestId("theme-toggle");

  // Lowercased: the production CSS minifier lowercases hex literals.
  const bg = () =>
    page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--bg-0").trim().toLowerCase(),
    );

  expect(await bg()).toBe("#0c0c0e"); // system: follows the OS
  await toggle.click(); // system -> light
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(await bg()).toBe("#f7f7f5"); // forced light despite dark OS
});

test("chrome does not overflow at 375px, closed or open", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 720 });
  await page.goto("/");

  const noOverflow = () =>
    page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

  expect(await noOverflow()).toBe(true);
  await page.getByRole("button", { name: "MENU" }).click();
  await expect(page.locator("#site-menu")).toBeVisible();
  expect(await noOverflow()).toBe(true);
});
