/* buildFigure(spec) -> Drawing. The single geometry source.
 *
 * Validates, dispatches to a primitive layout, applies the `ab` combinator if
 * asked, and stamps the static frame. What comes out is plain data: a tree of
 * draw nodes plus the strings the chrome needs. Both emitters take it from
 * here and neither computes a coordinate.
 *
 * Stepping is visibility, not computation: every step's geometry is in the
 * tree, groups carry data-fig-step, and the groups outside the static step
 * are stamped data-fig-off at build time. A reader with no JS therefore gets
 * a real frame, and the runtime only ever moves that attribute around. */

import {
  composeCaption,
  isScrubbed,
  resolveStaticStep,
  stepCaptions,
  stepCount,
  validateSpec,
} from "./spec.mjs";
import { LAYOUTS, PAD } from "./layouts.mjs";
import { g, text } from "./draw.mjs";
import { linearAxis, linearScale, logDomain, r2, stepCovers } from "./scale.mjs";

/** Walk a draw tree, stamping data-fig-off on every group the step misses. */
export function stampStatic(nodes, step) {
  return nodes.map((node) => {
    const attr = node.attrs && node.attrs["data-fig-step"];
    const off = attr !== undefined && attr !== null && !stepCovers(attr, step);
    const children = node.children ? stampStatic(node.children, step) : undefined;
    if (!off && !children) return node;
    return {
      ...node,
      attrs: off ? { ...node.attrs, "data-fig-off": "" } : node.attrs,
      ...(children ? { children } : {}),
    };
  });
}

const ACCENT = "var(--fig-accent)";

function paintsAccent(node) {
  for (const [k, v] of Object.entries(node.attrs || {})) {
    if (k !== "id" && v === ACCENT) return true;
  }
  return false;
}

function subtreeAccent(node) {
  if (node.el === "defs") return false;
  if (paintsAccent(node)) return true;
  return (node.children || []).some(subtreeAccent);
}

/**
 * How many distinct things in a drawing are accented.
 *
 * The spec-level accent count reads declared ink roles, which is the right
 * check at authoring time but blind to any accent a layout paints on its own.
 * This counts the rendered result instead: the number of innermost groups that
 * carry accent anywhere inside them. A mark drawn in accent with its own label
 * in accent is one subject, because a layout emits them in one group; a
 * highlighted bar in one group plus a delta callout in another is two.
 *
 * Arrowhead markers live in <defs> and are always emitted in all three inks,
 * so the defs subtree is excluded. Counting it would make every figure fail.
 */
export function accentSubjects(nodes) {
  let count = 0;
  const scan = (list) => {
    for (const node of list) {
      if (node.el === "defs") continue;
      if (node.el === "g") {
        if (!subtreeAccent(node)) continue;
        const inner = (node.children || []).filter((c) => c.el === "g" && subtreeAccent(c));
        if (inner.length > 0) scan(node.children);
        else count += 1;
        continue;
      }
      if (paintsAccent(node)) count += 1;
    }
  };
  scan(nodes);
  return count;
}

/** Shift a subtree by translating it. Used only by the ab combinator. */
function translate(nodes, dy) {
  return { el: "g", attrs: { transform: `translate(0 ${r2(dy)})` }, children: nodes };
}

/**
 * The scale two ab panels must share. Two bars side by side assert both were
 * measured the same way; two bars on different scales assert something false
 * about the comparison, so the combinator computes the scale once and hands
 * the same one to both panels.
 */
function sharedContext(spec, width) {
  const { of: kind, a, b } = spec;
  if (kind === "dist") {
    const all = [...a.data.items, ...b.data.items].map((i) => i.value);
    const cuts = [...(a.data.lines || []), ...(b.data.lines || [])].map((l) => l.at);
    const domain =
      a.data.axis === "log"
        ? logDomain([...all, ...cuts])
        : [0, linearAxis(Math.max(...all, ...cuts)).top];
    return { sharedDomain: domain };
  }
  if (kind === "map") {
    const lo = Math.min(a.data.extent[0], b.data.extent[0]);
    const hi = Math.max(a.data.extent[1], b.data.extent[1]);
    const gutter = a.data.gutter ?? 0;
    return {
      sharedScale: linearScale({ domain: [lo, hi], range: [PAD + gutter, width - PAD] }),
    };
  }
  if (kind === "timeline") {
    const lo = Math.min(a.data.span[0], b.data.span[0]);
    const hi = Math.max(a.data.span[1], b.data.span[1]);
    const labelW = a.data.labelWidth ?? 132;
    const plotX = PAD + labelW + 14;
    return {
      sharedScale: linearScale({ domain: [lo, hi], range: [plotX, width - PAD - 12] }),
    };
  }
  return {};
}

function panelTitle(title, y) {
  return g(null, [
    text({ x: PAD, y, value: title, fill: "ink", size: 11, tracking: "0.14em", anchor: "start" }),
  ]);
}

function buildAb(spec, width) {
  const shared = sharedContext(spec, width);
  const layout = LAYOUTS[spec.of];
  const ctx = { id: spec.id, width, ...shared };
  const a = layout(spec.a.data, ctx);
  const b = layout(spec.b.data, ctx);
  const titleH = 26;
  const nodes = [
    panelTitle(spec.a.title, PAD + 4),
    translate(a.nodes, titleH),
    panelTitle(spec.b.title, PAD + 4 + titleH + a.height + 10),
    translate(b.nodes, titleH * 2 + a.height + 10),
  ];
  let height = titleH * 2 + a.height + b.height + 10 + PAD;
  if (spec.delta) {
    nodes.push(
      g(null, [
        text({
          x: width - PAD,
          y: height - 6,
          value: spec.delta,
          fill: "accent",
          size: 11,
          anchor: "end",
        }),
      ]),
    );
    height += 12;
  }
  return { nodes, height };
}

/**
 * Build the geometry and the chrome strings for a spec.
 * Deterministic: no Date, no Math.random, no DOM. Call it twice, get the same
 * object graph, which is what tests/unit/figures/render.test.ts asserts.
 */
export function buildFigure(spec) {
  validateSpec(spec);
  const width = spec.width;
  const built = spec.type === "ab" ? buildAb(spec, width) : LAYOUTS[spec.type](spec.data, { id: spec.id, width });
  const staticStep = resolveStaticStep(spec);
  const height = Math.ceil(built.height);
  return {
    id: spec.id,
    type: spec.type,
    claim: spec.claim,
    width,
    height,
    viewBox: `0 0 ${width} ${height}`,
    nodes: stampStatic(built.nodes, staticStep),
    alt: spec.alt,
    caption: composeCaption(spec),
    steps: stepCaptions(spec),
    stepCount: stepCount(spec),
    staticStep,
    scrubbed: isScrubbed(spec),
  };
}
