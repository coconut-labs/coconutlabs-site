#!/usr/bin/env node
/**
 * Render one worked example of each taxonomy entry into a scratch page and
 * screenshot it light and dark.
 *
 *   node scripts/figures-catalog.mjs            # write the page only
 *   node scripts/figures-catalog.mjs --shoot    # page + both screenshots
 *
 * The page is built by lib/figures/render.mjs, the vanilla renderer, so this
 * script is also the working proof that the standalone path produces a
 * complete, self-contained page: token sheet inlined, runtime inlined, no
 * network, no build step, no dependency.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { CATALOG } from "../lib/figures/examples.mjs";
import { renderPage } from "../lib/figures/render.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "..");
const SHOTS = resolve(REPO, "..", "design-merge-reports", "shots");
const OUT_HTML = join(SHOTS, "figures-catalog.html");

/* The taxonomy line under each figure. Kept here rather than in the spec:
   it describes the primitive, not the figure. */
const BLURB = {
  map: "extent with named regions. What occupies which range, and where the boundaries fall.",
  flow: "stations and directed edges. What happens in what order, and where a boundary is crossed.",
  timeline: "lanes by time. Who held the resource when, and how long someone else waited.",
  dist: "magnitudes on one scale. How big things are relative to each other, and whether they clear a line.",
  states: "nodes and guarded transitions. What states exist, and which move is the bug.",
  stack: "ordered bands, sizes meaningless. What sits on what, and where the interesting seam is.",
  ab: "two instances of one primitive on one scale. Used only when both sides were measured the same way.",
  scrub: "n discrete timesteps over any primitive. Earned only when the step captions teach as prose.",
};

function css() {
  const tokens = readFileSync(join(REPO, "styles", "tokens.css"), "utf8");
  const figures = readFileSync(join(REPO, "styles", "figure-tokens.css"), "utf8");
  // Read from disk rather than duplicated here: one source of truth for the
  // palette, and the standalone page is then provably on the same tokens as
  // the Next app.
  return `${tokens}\n${figures}\n${PAGE_CSS}`;
}

const PAGE_CSS = `
  body {
    background: var(--bg-0);
    color: var(--ink-0);
    font-family: var(--font-sans);
    margin: 0;
    padding: 56px clamp(20px, 4vw, 64px) 96px;
  }
  .page-head { border-bottom: 1px solid var(--rule); margin-bottom: 40px; padding-bottom: 24px; }
  .page-head h1 { font-size: 28px; font-weight: 600; letter-spacing: -0.01em; margin: 0; }
  .page-head p { color: var(--ink-1); margin: 10px 0 0; max-width: 68ch; }
  .entry { border-top: 1px solid var(--hair); margin-top: 56px; padding-top: 28px; }
  .entry:first-of-type { border-top: 0; }
  .entry-head {
    align-items: baseline; display: flex; flex-wrap: wrap; gap: 14px;
    font-family: var(--font-mono); font-size: 11px;
    letter-spacing: 0.14em; text-transform: uppercase;
  }
  .entry-name { color: var(--ink-0); }
  .entry-kind { color: var(--accent); }
  .entry-blurb {
    color: var(--ink-1); font-size: 14px; letter-spacing: 0; line-height: 1.6;
    margin: 8px 0 0; max-width: 68ch; text-transform: none;
  }
`;

function page(theme) {
  const { html, script } = renderPage(CATALOG.map((c) => c.spec));
  const blocks = CATALOG.map(({ entry, spec }, i) => {
    const one = html.split("\n")[i];
    return (
      `<section class="entry">` +
      `<div class="entry-head"><span class="entry-name">${entry}</span>` +
      `<span class="entry-kind">${spec.type === "ab" ? `ab over ${spec.of}` : spec.type}` +
      `${spec.steps ? ` + scrub, ${spec.steps.length} steps` : ""}</span></div>` +
      `<p class="entry-blurb">${BLURB[entry]}</p>` +
      one +
      `</section>`
    );
  });
  return `<!doctype html>
<html lang="en"${theme ? ` data-theme="${theme}"` : ""}>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Figure toolkit catalog</title>
<style>${css()}</style>
</head>
<body>
<div class="page-head">
<h1>Figure toolkit catalog</h1>
<p>Six primitives and two combinators, one worked example each. Every figure on
this page was produced by the vanilla renderer from the same spec object the
React components consume. Nothing here is a screenshot of a drawing tool.</p>
</div>
${blocks.join("\n")}
${script}
</body>
</html>`;
}

mkdirSync(SHOTS, { recursive: true });
writeFileSync(OUT_HTML, page(null), "utf8");
console.log(`wrote ${OUT_HTML}`);

if (process.argv.includes("--shoot")) {
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch();
  for (const scheme of ["light", "dark"]) {
    const tmp = join(SHOTS, `figures-catalog.${scheme}.html`);
    writeFileSync(tmp, page(scheme), "utf8");
    const context = await browser.newContext({
      viewport: { width: 1100, height: 1400 },
      deviceScaleFactor: 1,
      colorScheme: scheme,
      reducedMotion: "reduce",
    });
    const p = await context.newPage();
    await p.goto(`file://${tmp}`, { waitUntil: "load" });
    await p.evaluate(() => document.fonts.ready);
    const out = join(SHOTS, `figures-catalog-${scheme}.png`);
    await p.screenshot({ path: out, fullPage: true });
    console.log(`wrote ${out}`);
    await context.close();
  }
  await browser.close();
}
