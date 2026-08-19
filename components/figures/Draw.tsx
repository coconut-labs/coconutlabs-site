import { createElement, type ReactElement } from "react";

import type { DrawNode } from "@/lib/figures/draw.mjs";

/* Draw nodes to React elements.
 *
 * The geometry arrives already decided. This walks the same tree the vanilla
 * renderer serialises to a string and produces elements instead, which is why
 * a figure is pixel-identical on the Next app, a standalone HTML page, and the
 * book build. It computes nothing.
 *
 * Draw nodes carry SVG-canonical attribute names because that is what the
 * string emitter needs. React wants the camelCase forms, so the conversion
 * happens here, once, against an explicit table: an implicit conversion would
 * silently drop any attribute the table did not anticipate, and a dropped
 * stroke-width is an invisible defect. */

const ATTR: Record<string, string> = {
  "stroke-width": "strokeWidth",
  "stroke-dasharray": "strokeDasharray",
  "stroke-linecap": "strokeLinecap",
  "stroke-opacity": "strokeOpacity",
  "fill-opacity": "fillOpacity",
  "text-anchor": "textAnchor",
  "font-size": "fontSize",
  "letter-spacing": "letterSpacing",
  "dominant-baseline": "dominantBaseline",
  "marker-end": "markerEnd",
  "marker-start": "markerStart",
  "clip-path": "clipPath",
  class: "className",
  viewBox: "viewBox",
  refX: "refX",
  refY: "refY",
  markerWidth: "markerWidth",
  markerHeight: "markerHeight",
};

/** Attributes that stay exactly as authored: data-*, aria-*, and the plain
 *  single-word SVG attributes React already accepts. */
function reactKey(key: string): string {
  if (ATTR[key]) return ATTR[key];
  if (key.startsWith("data-") || key.startsWith("aria-")) return key;
  if (key.includes("-")) {
    throw new Error(`Draw: no React mapping for SVG attribute "${key}"`);
  }
  return key;
}

function toProps(node: DrawNode, key: string): Record<string, unknown> {
  const props: Record<string, unknown> = { key };
  for (const [k, v] of Object.entries(node.attrs)) {
    // React drops an empty-string boolean-ish attribute, but data-fig-off has
    // to survive: it is what makes the no-JS static frame a real frame.
    props[reactKey(k)] = v === "" ? "" : v;
  }
  return props;
}

export function drawNode(node: DrawNode, key: string): ReactElement {
  const props = toProps(node, key);
  if (node.text !== undefined) return createElement(node.el, props, node.text);
  if (!node.children || node.children.length === 0) return createElement(node.el, props);
  return createElement(
    node.el,
    props,
    node.children.map((child, i) => drawNode(child, `${key}.${i}`)),
  );
}

export function Draw({ nodes }: { nodes: DrawNode[] }) {
  return <>{nodes.map((node, i) => drawNode(node, String(i)))}</>;
}
