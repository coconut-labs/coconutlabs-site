/* The vanilla renderer. Same spec object, self-contained SVG plus chrome.
 *
 * renderFigure(spec) is a pure string function: no Date, no Math.random, no
 * DOM measurement. Call it twice and get byte-identical output. That is a
 * unit test, and it is what makes a maxDiffPixels 0 pixel gate possible.
 *
 * Invocation, for standalone HTML pages and the book build:
 *
 *   import { renderFigure, renderPage } from "./lib/figures/render.mjs";
 *   const { html } = renderFigure(spec);        // one figure
 *   const page = renderPage([specA, specB]);    // figures + the runtime once
 *
 * The emitted markup is identical to what components/figures/Figure.tsx
 * produces, asserted in tests/unit/figures/parity.test.tsx. */

import { buildFigure } from "./geometry.mjs";
import { RUNTIME_JS } from "./runtime.mjs";

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

function attrs(map) {
  const parts = [];
  for (const [k, v] of Object.entries(map)) {
    if (v === null || v === undefined || v === false) continue;
    if (v === "") parts.push(k);
    else parts.push(`${k}="${escapeHtml(v)}"`);
  }
  return parts.length ? ` ${parts.join(" ")}` : "";
}

/** Serialise one draw node. Self-closing when there is nothing inside, which
 *  keeps the SVG small and the diffs readable. */
export function renderNode(node) {
  const open = `<${node.el}${attrs(node.attrs)}`;
  if (node.text !== undefined) return `${open}>${escapeHtml(node.text)}</${node.el}>`;
  if (!node.children || node.children.length === 0) return `${open}/>`;
  return `${open}>${node.children.map(renderNode).join("")}</${node.el}>`;
}

/** The SVG alone, without any chrome. */
export function renderSvg(drawing) {
  const head = attrs({
    class: "fig-svg",
    viewBox: drawing.viewBox,
    role: "img",
    "aria-label": drawing.alt,
    focusable: "false",
    xmlns: "http://www.w3.org/2000/svg",
  });
  return `<svg${head}>${drawing.nodes.map(renderNode).join("")}</svg>`;
}

function pad(n) {
  return n < 10 ? `0${n}` : String(n);
}

function renderControls(drawing) {
  if (!drawing.scrubbed) return "";
  const railId = `${drawing.id}-rail`;
  const ticks = [];
  for (let i = 0; i < drawing.stepCount; i += 1) ticks.push(`<option value="${i}"></option>`);
  return (
    `<div class="fig-controls" data-fig-controls hidden>` +
    `<label class="fig-rail-label" for="${escapeHtml(railId)}">drag to step</label>` +
    `<input class="fig-rail" type="range" id="${escapeHtml(railId)}" name="${escapeHtml(railId)}"` +
    ` min="0" max="${drawing.stepCount - 1}" step="1" value="${drawing.staticStep}"` +
    ` list="${escapeHtml(drawing.id)}-ticks" aria-describedby="${escapeHtml(drawing.id)}-step"/>` +
    `<datalist id="${escapeHtml(drawing.id)}-ticks">${ticks.join("")}</datalist>` +
    `<span class="fig-readout" data-fig-readout aria-hidden="true">` +
    `${pad(drawing.staticStep + 1)} / ${pad(drawing.stepCount)}</span>` +
    `</div>`
  );
}

function renderStepCaption(drawing) {
  if (!drawing.scrubbed) return "";
  const current = drawing.steps[drawing.staticStep] || "";
  return (
    `<p class="fig-step" id="${escapeHtml(drawing.id)}-step" data-fig-caption aria-live="polite">` +
    `${escapeHtml(current)}</p>`
  );
}

function renderProvenance(drawing) {
  const f = drawing.caption.footnote;
  if (!f) return "";
  return (
    `<p class="fig-provenance">${escapeHtml(f.label)}: ` +
    `<a href="${escapeHtml(f.href)}">${escapeHtml(f.text)}</a></p>`
  );
}

function renderWalkthrough(drawing) {
  if (!drawing.scrubbed) return "";
  const items = drawing.steps.map((s) => `<li>${escapeHtml(s)}</li>`).join("");
  return (
    `<details class="fig-read"><summary>Read this figure</summary>` +
    `<ol data-fig-walkthrough>${items}</ol></details>`
  );
}

/**
 * Render one figure: chrome, SVG, caption rows, rail, walkthrough.
 * Returns the pieces as well as the assembled html so a host can place them
 * itself if it needs to.
 */
export function renderFigure(spec) {
  const drawing = buildFigure(spec);
  const svg = renderSvg(drawing);
  const html =
    `<div class="fig" data-fig="${escapeHtml(drawing.id)}"` +
    ` data-fig-steps="${drawing.stepCount}" data-fig-static="${drawing.staticStep}">` +
    `<figure class="fig-frame">` +
    `<div class="fig-canvas">${svg}</div>` +
    renderControls(drawing) +
    renderStepCaption(drawing) +
    `<figcaption class="fig-caption">` +
    `<span class="fig-caption-left">${escapeHtml(drawing.caption.left)}</span>` +
    `<span class="fig-caption-right">${escapeHtml(drawing.caption.right)}</span>` +
    `</figcaption>` +
    renderProvenance(drawing) +
    `</figure>` +
    renderWalkthrough(drawing) +
    `</div>`;
  return {
    html,
    svg,
    alt: drawing.alt,
    steps: drawing.steps,
    caption: drawing.caption,
    drawing,
  };
}

/** The runtime, wrapped in a script tag, emitted once per page. */
export function renderRuntimeScript() {
  return `<script>${RUNTIME_JS}</script>`;
}

/**
 * Several figures plus the runtime, once. This is what the standalone HTML
 * pass and the book build call: figures in order, then one script.
 */
export function renderPage(specs) {
  const figures = specs.map((s) => renderFigure(s));
  return {
    html: figures.map((f) => f.html).join("\n"),
    script: renderRuntimeScript(),
    figures,
  };
}
