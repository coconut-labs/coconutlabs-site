/* Draw nodes: the intermediate representation both emitters consume.
 *
 * A draw node is plain data: { el, attrs, text?, children?, step? }. It knows
 * nothing about SVG serialisation or about React. The vanilla renderer turns
 * a tree of these into a string; the React <Draw> component turns the same
 * tree into elements. That is the whole reason a figure looks identical on
 * three build systems.
 *
 * Attribute names here are SVG-canonical (stroke-width, text-anchor). The
 * React side converts; the string side does not have to. */

import { ink } from "./spec.mjs";
import { r2, stepAttr } from "./scale.mjs";

function coords(attrs) {
  const out = {};
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    out[k] = typeof v === "number" ? r2(v) : v;
  }
  return out;
}

function node(el, attrs, extra = {}) {
  return { el, attrs: coords(attrs), ...extra };
}

/** A group. Carries the step range; this is the entire interactivity
 *  mechanism, and it is one attribute. */
export function g(step, children, attrs = {}) {
  const kids = children.filter(Boolean);
  const s = stepAttr(step);
  return {
    el: "g",
    attrs: coords(s === null ? attrs : { ...attrs, "data-fig-step": s }),
    children: kids,
  };
}

export function rect({ x, y, w, h, fill = null, stroke = null, width = 1.25, dash = null, rx = 0 }) {
  if (rx !== 0 && rx !== 2) {
    throw new RangeError(`rect: rx must be 0 or 2 (the one radius), got ${rx}`);
  }
  return node("rect", {
    x,
    y,
    width: w,
    height: h,
    rx: rx || null,
    fill: fill ? ink(fill) : "none",
    stroke: stroke ? ink(stroke) : null,
    "stroke-width": stroke ? width : null,
    "stroke-dasharray": dash,
  });
}

export function line({ x1, y1, x2, y2, stroke = "ink", width = 1.25, dash = null, marker = null, markerStart = null }) {
  return node("line", {
    x1,
    y1,
    x2,
    y2,
    stroke: ink(stroke),
    "stroke-width": width,
    "stroke-dasharray": dash,
    "marker-end": marker ? `url(#${marker})` : null,
    "marker-start": markerStart ? `url(#${markerStart})` : null,
  });
}

export function path({ d, stroke = "ink", width = 1.25, dash = null, fill = null, marker = null }) {
  return node("path", {
    d,
    fill: fill ? ink(fill) : "none",
    stroke: ink(stroke),
    "stroke-width": width,
    "stroke-dasharray": dash,
    "marker-end": marker ? `url(#${marker})` : null,
  });
}

export function circle({ cx, cy, r, fill = "ink", stroke = null, width = 1.25 }) {
  return node("circle", {
    cx,
    cy,
    r,
    fill: fill ? ink(fill) : "none",
    stroke: stroke ? ink(stroke) : null,
    "stroke-width": stroke ? width : null,
  });
}

/**
 * Mono text. 10.5px is the label floor across the estate; nothing here is
 * allowed below it, so the size argument is clamped rather than trusted.
 */
export function text({ x, y, value, fill = "ink", size = 10.5, anchor = "middle", tracking = null, baseline = null }) {
  if (size < 10.5) throw new RangeError(`text: ${size}px is under the 10.5px label floor`);
  return node(
    "text",
    {
      x,
      y,
      fill: ink(fill),
      "font-size": size,
      "text-anchor": anchor,
      "letter-spacing": tracking,
      "dominant-baseline": baseline,
    },
    { text: String(value) },
  );
}

/** Arrowhead markers, id-prefixed per figure so several SVGs share a page. */
export function arrowDefs(id) {
  const head = "M0,0 L7,3.5 L0,7 Z";
  const common = {
    markerWidth: 7,
    markerHeight: 7,
    refX: 6.5,
    refY: 3.5,
    orient: "auto",
    viewBox: "0 0 8 8",
  };
  return {
    el: "defs",
    attrs: {},
    children: ["ink", "dim", "accent"].map((role) => ({
      el: "marker",
      attrs: coords({ id: `${id}-a-${role}`, ...common }),
      children: [node("path", { d: head, fill: ink(role) })],
    })),
  };
}

export function markerId(figureId, role = "ink") {
  return `${figureId}-a-${role}`;
}

/** A hairline frame around the drawing area. */
export function frame({ x, y, w, h }) {
  return rect({ x, y, w, h, stroke: "rule", width: 1 });
}

/** A label pinned to the left of a row, the estate's standard row gutter. */
export function rowLabel({ x, y, value, fill = "dim" }) {
  return text({ x, y, value, fill, anchor: "end" });
}
