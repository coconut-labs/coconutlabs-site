/* The six primitives, as pure data-to-geometry transforms.
 *
 * Each layout has the shape (data, ctx) -> { nodes, height }. ctx carries the
 * figure id (for marker ids), the viewBox width, and, for an `ab` figure, a
 * scale the two panels must share. Nothing here reads the DOM, measures text,
 * or branches on the renderer. Given the same data these return the same
 * numbers forever, which is what makes maxDiffPixels 0 achievable.
 *
 * Text metrics are the one thing an SVG layout genuinely cannot know. Rather
 * than guess, the layouts reserve fixed gutters and let long labels run into
 * the horizontal scroll the frame already provides. */

import {
  boxAnchor,
  linearAxis,
  linearScale,
  logDomain,
  logScale,
  logTicks,
  r2,
  spread,
} from "./scale.mjs";
import { arrowDefs, circle, g, line, markerId, path, rect, text } from "./draw.mjs";

export const PAD = 16;

/* ---------------------------------------------------------------- dist -- */

/**
 * Magnitudes on one scale. Linear draws bars from zero; log draws points on a
 * ladder, because the length of a bar on a log axis means nothing and drawing
 * one implies it does.
 */
export function dist(data, ctx) {
  const { id, width } = ctx;
  const items = data.items || [];
  if (items.length === 0) throw new Error("dist: needs at least one item");
  const lines = data.lines || [];
  const labelW = data.labelWidth ?? 168;
  const valueW = data.valueWidth ?? 140;
  const plotX = PAD + labelW + 14;
  const plotW = width - PAD - valueW - plotX;
  if (plotW <= 40) throw new RangeError("dist: width leaves no room to plot");

  const isLog = data.axis === "log";
  const values = items.map((i) => i.value);
  const cuts = lines.map((l) => l.at);

  let scale;
  let ticks;
  if (isLog) {
    const domain = ctx.sharedDomain || logDomain([...values, ...cuts]);
    scale = logScale({ domain, range: [plotX, plotX + plotW] });
    ticks = logTicks(domain);
  } else {
    const max = Math.max(...values, ...cuts);
    const axis = ctx.sharedDomain
      ? { top: ctx.sharedDomain[1], ticks: linearAxis(ctx.sharedDomain[1]).ticks }
      : linearAxis(max);
    scale = linearScale({ domain: [0, axis.top], range: [plotX, plotX + plotW] });
    ticks = axis.ticks;
  }

  const rowH = 34;
  const barH = 15;
  const top = PAD + 14;
  const axisY = top + items.length * rowH + 8;
  const nodes = [arrowDefs(id)];

  // grid first, so data draws over it
  const grid = [];
  for (const t of ticks) {
    const x = scale(t);
    grid.push(line({ x1: x, y1: top, x2: x, y2: axisY, stroke: "rule", width: 1 }));
    grid.push(text({ x, y: axisY + 17, value: format(t, data.unit), fill: "dim" }));
  }
  grid.push(line({ x1: plotX, y1: axisY, x2: plotX + plotW, y2: axisY, stroke: "dim", width: 1 }));
  if (isLog) {
    // Honesty rule C.2: a log axis says so. Far left of the tick row, well
    // clear of the first tick label, which sits centred on the axis origin.
    grid.push(text({ x: PAD, y: axisY + 17, value: "log axis", fill: "dim", anchor: "start" }));
  }
  nodes.push(g(null, grid));

  items.forEach((item, i) => {
    const cy = top + i * rowH + rowH / 2;
    const role = item.ink || "dim";
    const drawn = [
      text({ x: PAD + labelW, y: cy + 4, value: item.label, fill: "dim", anchor: "end" }),
    ];
    if (isLog) {
      drawn.push(
        line({ x1: plotX, y1: cy, x2: scale(item.value), y2: cy, stroke: "rule", width: 1 }),
        circle({ cx: scale(item.value), cy, r: 4.5, fill: role }),
      );
    } else {
      drawn.push(
        rect({ x: plotX, y: cy - barH / 2, w: Math.max(scale(item.value) - plotX, 1), h: barH, fill: role === "accent" ? "accent" : "well", stroke: role, width: 1 }),
      );
    }
    drawn.push(
      text({
        x: plotX + plotW + 10,
        y: cy + 4,
        value: item.note || format(item.value, data.unit),
        fill: role,
        anchor: "start",
      }),
    );
    nodes.push(g(item.step ?? null, drawn));
  });

  lines.forEach((cut) => {
    const x = scale(cut.at);
    nodes.push(
      g(cut.step ?? null, [
        line({ x1: x, y1: top - 10, x2: x, y2: axisY, stroke: cut.ink || "ink", width: 1, dash: "6 4" }),
        text({ x, y: top - 16, value: cut.label, fill: cut.ink || "ink" }),
      ]),
    );
  });

  return { nodes, height: axisY + 30 + PAD, scale };
}

/**
 * Thousands grouping, by hand.
 *
 * toLocaleString("en-US") would read the same here on almost any machine, but
 * "almost" is the wrong word for a renderer whose whole contract is
 * byte-identical output across three build systems and a maxDiffPixels 0 gate.
 * A Node built without full ICU quietly formats differently, and a purity test
 * that calls the renderer twice in one process cannot see that, so the
 * grouping happens here by hand.
 */
export function format(v, unit) {
  let n;
  if (typeof v === "number") {
    const neg = v < 0;
    const [whole, frac] = Math.abs(v).toString().split(".");
    const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    n = `${neg ? "-" : ""}${grouped}${frac ? `.${frac}` : ""}`;
  } else {
    n = String(v);
  }
  return unit ? `${n} ${unit}` : n;
}

/* ----------------------------------------------------------------- map -- */

/** Extent with named regions, boundary values, and offset dimension lines. */
export function map(data, ctx) {
  const { id, width } = ctx;
  const [lo, hi] = data.extent;
  const gutter = data.gutter ?? 0;
  const x0 = PAD + gutter;
  const x1 = width - PAD;
  const scale = ctx.sharedScale || linearScale({ domain: [lo, hi], range: [x0, x1] });
  const barY = PAD + 34;
  const barH = data.barHeight ?? 60;
  const nodes = [arrowDefs(id)];

  (data.regions || []).forEach((region) => {
    const rx = scale(region.from);
    const rw = Math.max(scale(region.to) - rx, 1);
    const role = region.ink || "ink";
    const cx = rx + rw / 2;
    const drawn = [
      rect({ x: rx, y: barY, w: rw, h: barH, fill: region.fill ? "well" : null, stroke: role, width: 1.25 }),
      text({ x: cx, y: barY + 24, value: region.label, fill: role, size: 11, tracking: "0.08em" }),
    ];
    if (region.sub) drawn.push(text({ x: cx, y: barY + 42, value: region.sub, fill: "dim" }));
    drawn.push(
      text({ x: rx, y: barY + barH + 17, value: String(region.fromLabel ?? region.from), fill: "dim" }),
    );
    nodes.push(g(region.step ?? null, drawn));
  });

  const last = (data.regions || [])[data.regions.length - 1];
  if (last) {
    nodes.push(
      g(null, [
        text({
          x: scale(last.to),
          y: barY + barH + 17,
          value: String(last.toLabel ?? last.to),
          fill: "dim",
        }),
      ]),
    );
  }

  (data.marks || []).forEach((mark) => {
    const x = scale(mark.at);
    nodes.push(
      g(mark.step ?? null, [
        line({ x1: x, y1: barY - 12, x2: x, y2: barY + barH + 4, stroke: mark.ink || "ink", width: 1, dash: "9 4 2 4" }),
        text({ x, y: barY - 18, value: mark.label, fill: mark.ink || "ink" }),
      ]),
    );
  });

  // Clear of the boundary-value row, which sits at barY + barH + 17.
  let y = barY + barH + 52;
  (data.dims || []).forEach((dim) => {
    const a = scale(dim.from);
    const b = scale(dim.to);
    // Defaults to dim, never accent. An accent that no one declared is an
    // accent the one-accent validator cannot see.
    const role = dim.ink || "dim";
    nodes.push(
      g(dim.step ?? null, [
        line({ x1: a, y1: barY + barH + 4, x2: a, y2: y + 4, stroke: "rule", width: 1 }),
        line({ x1: b, y1: barY + barH + 4, x2: b, y2: y + 4, stroke: "rule", width: 1 }),
        line({
          x1: a,
          y1: y,
          x2: b,
          y2: y,
          stroke: role,
          width: 1.25,
          marker: markerId(id, role === "accent" ? "accent" : "dim"),
          markerStart: markerId(id, role === "accent" ? "accent" : "dim"),
        }),
        text({ x: (a + b) / 2, y: y - 8, value: dim.label, fill: role, size: 11 }),
      ]),
    );
    y += 34;
  });

  return { nodes, height: y + PAD, scale };
}

/* ---------------------------------------------------------------- flow -- */

/** Stations and directed edges, with an optional boundary and control path. */
export function flow(data, ctx) {
  const { id, width } = ctx;
  const stations = data.stations || [];
  if (stations.length === 0) throw new Error("flow: needs at least one station");
  // Wide enough for a short edge label to sit between two stations without
  // running under either box. Long labels want route: "below".
  const gap = data.gap ?? 60;
  const boxW = r2((width - 2 * PAD - gap * (stations.length - 1)) / stations.length);
  if (boxW < 70) throw new RangeError("flow: too many stations for this width");
  const maxLines = Math.max(0, ...stations.map((s) => (s.lines || []).length));
  const boxH = 34 + Math.max(maxLines, 1) * 16;
  const top = PAD + 34;
  const xs = spread({ count: stations.length, extent: width - 2 * PAD, size: boxW, start: PAD });
  const nodes = [arrowDefs(id)];
  const at = (sid) => {
    const i = stations.findIndex((s) => s.id === sid);
    if (i < 0) throw new Error(`flow: no station "${sid}"`);
    return { i, x: xs[i], cx: xs[i] + boxW / 2 };
  };

  stations.forEach((station, i) => {
    const x = xs[i];
    const cx = x + boxW / 2;
    const role = station.ink || "ink";
    const drawn = [
      rect({ x, y: top, w: boxW, h: boxH, stroke: role, width: 1.25 }),
      text({ x: cx, y: top + 21, value: station.label, fill: role, size: 11, tracking: "0.08em" }),
    ];
    (station.lines || []).forEach((l, k) => {
      drawn.push(text({ x: cx, y: top + 39 + k * 16, value: l, fill: "dim" }));
    });
    nodes.push(g(station.step ?? null, drawn));
  });

  const belowY = top + boxH + 54;
  let usedBelow = false;

  (data.edges || []).forEach((edge) => {
    const a = at(edge.from);
    const b = at(edge.to);
    const role = edge.ink || (edge.style === "dashed" ? "dim" : "ink");
    const dash = edge.style === "dashed" ? "6 4" : null;
    const marker = markerId(id, role === "accent" ? "accent" : role === "dim" ? "dim" : "ink");
    const adjacent = Math.abs(b.i - a.i) === 1 && edge.route !== "below";
    const drawn = [];
    if (adjacent) {
      const forward = b.i > a.i;
      const x1 = forward ? a.x + boxW + 4 : a.x - 4;
      const x2 = forward ? b.x - 6 : b.x + boxW + 6;
      const y = top + boxH / 2;
      drawn.push(line({ x1, y1: y, x2, y2: y, stroke: role, width: 1.25, dash, marker }));
      if (edge.label) {
        drawn.push(text({ x: (x1 + x2) / 2, y: y - 10, value: edge.label, fill: "dim" }));
      }
    } else {
      usedBelow = true;
      const y = belowY;
      const d = `M ${r2(a.cx)} ${r2(top + boxH)} V ${r2(y)} H ${r2(b.cx)} V ${r2(top + boxH + 8)}`;
      drawn.push(path({ d, stroke: role, width: 1.25, dash: dash || "6 4", marker }));
      if (edge.label) {
        drawn.push(text({ x: (a.cx + b.cx) / 2, y: y - 8, value: edge.label, fill: "dim" }));
      }
    }
    nodes.push(g(edge.step ?? null, drawn));
  });

  let height = (usedBelow ? belowY + 26 : top + boxH + 26) + PAD;

  if (data.boundary) {
    const b = at(data.boundary.after);
    const x = r2(b.x + boxW + gap / 2);
    // A boundary late in the row would push its label off the right edge, so
    // the label flips to the inside of the line rather than overflowing.
    const flip = x > width * 0.6;
    // The boundary sits in the same gap as the edge that crosses it, and an
    // edge label sits in that gap too. Break the line around the label rather
    // than ruling through it: a break for a label is what a draughtsman does,
    // and it keeps the boundary crossing the arrow, which is the point.
    const arrowY = top + boxH / 2;
    const labelled = (data.edges || []).some(
      (e) =>
        e.label &&
        e.route !== "below" &&
        Math.abs(at(e.to).i - at(e.from).i) === 1 &&
        Math.min(at(e.from).i, at(e.to).i) === b.i,
    );
    const dash = "9 4 2 4";
    const segments = labelled
      ? [
          line({ x1: x, y1: PAD + 6, x2: x, y2: arrowY - 20, stroke: "dim", width: 1, dash }),
          line({ x1: x, y1: arrowY - 6, x2: x, y2: height - PAD - 8, stroke: "dim", width: 1, dash }),
        ]
      : [line({ x1: x, y1: PAD + 6, x2: x, y2: height - PAD - 8, stroke: "dim", width: 1, dash })];
    nodes.push(
      g(data.boundary.step ?? null, [
        ...segments,
        text({
          x: flip ? x - 8 : x + 8,
          y: PAD + 18,
          value: data.boundary.label,
          fill: "dim",
          anchor: flip ? "end" : "start",
        }),
      ]),
    );
  }

  return { nodes, height };
}

/* --------------------------------------------------------------- stack -- */

/** Ordered bands top to bottom. Thickness carries no information. */
export function stack(data, ctx) {
  const { width } = ctx;
  const bands = data.bands || [];
  if (bands.length === 0) throw new Error("stack: needs at least one band");
  const bandH = data.bandHeight ?? 48;
  const gap = 6;
  const x = PAD + (data.gutter ?? 0);
  const w = width - PAD - x;
  const top = PAD + 12;
  const nodes = [];

  bands.forEach((band, i) => {
    const y = top + i * (bandH + gap);
    const role = band.ink || "ink";
    const here = data.here === i;
    const drawn = [
      rect({ x, y, w, h: bandH, fill: here ? "well" : null, stroke: role, width: 1.25 }),
      text({ x: x + 16, y: y + 21, value: band.label, fill: role, size: 11, tracking: "0.08em", anchor: "start" }),
    ];
    if (band.sub) {
      drawn.push(text({ x: x + 16, y: y + 38, value: band.sub, fill: "dim", anchor: "start" }));
    }
    if (band.right) {
      drawn.push(text({ x: x + w - 16, y: y + 21, value: band.right, fill: "dim", anchor: "end" }));
    }
    if (here) {
      drawn.push(
        rect({ x: x - 6, y, w: 3, h: bandH, fill: "accent" }),
        text({ x: x + w - 16, y: y + 38, value: "you are here", fill: "accent", anchor: "end" }),
      );
    }
    nodes.push(g(band.step ?? null, drawn));
  });

  const height = top + bands.length * (bandH + gap) - gap + PAD + 12;

  if (data.boundary) {
    const i = data.boundary.after;
    const y = r2(top + (i + 1) * (bandH + gap) - gap / 2);
    nodes.push(
      g(data.boundary.step ?? null, [
        line({ x1: x - 6, y1: y, x2: x + w, y2: y, stroke: "dim", width: 1, dash: "9 4 2 4" }),
        text({ x: x + w, y: y - 6, value: data.boundary.label, fill: "dim", anchor: "end" }),
      ]),
    );
  }

  return { nodes, height };
}

/* ------------------------------------------------------------ timeline -- */

/** Lanes by time. Wait bands are drawn as outlines so a run and a wait can
 *  never be mistaken for one another at a glance. */
export function timeline(data, ctx) {
  const { id, width } = ctx;
  const lanes = data.lanes || [];
  if (lanes.length === 0) throw new Error("timeline: needs at least one lane");
  const [t0, t1] = data.span;
  const labelW = data.labelWidth ?? 132;
  const plotX = PAD + labelW + 14;
  const plotW = width - PAD - plotX - 12;
  if (plotW <= 40) throw new RangeError("timeline: width leaves no room to plot");
  const scale = ctx.sharedScale || linearScale({ domain: [t0, t1], range: [plotX, plotX + plotW] });

  const rowH = 40;
  const blockH = 22;
  const top = PAD + 26;
  const axisY = top + lanes.length * rowH + 6;
  const nodes = [arrowDefs(id)];

  const axis = linearAxis(t1 - t0, data.tickCount ?? 6);
  const grid = [];
  for (const t of axis.ticks) {
    const v = r2(t0 + t);
    if (v > t1) continue;
    const x = scale(v);
    grid.push(line({ x1: x, y1: top - 6, x2: x, y2: axisY, stroke: "rule", width: 1 }));
    grid.push(text({ x, y: axisY + 17, value: format(v, data.unit), fill: "dim" }));
  }
  grid.push(line({ x1: plotX, y1: axisY, x2: plotX + plotW, y2: axisY, stroke: "dim", width: 1 }));
  nodes.push(g(null, grid));

  lanes.forEach((lane, i) => {
    const cy = top + i * rowH + rowH / 2;
    nodes.push(
      g(lane.step ?? null, [
        text({ x: PAD + labelW, y: cy + 4, value: lane.label, fill: "dim", anchor: "end" }),
      ]),
    );
    (lane.blocks || []).forEach((block) => {
      const bx = scale(block.from);
      const bw = Math.max(scale(block.to) - bx, 1);
      const wait = block.kind === "wait";
      const role = block.ink || (wait ? "dim" : "ink");
      // A run block is always the recessed well, never a solid ink. An accent
      // run block filled with accent would put accent text on accent ground;
      // the accent belongs to the outline and the label.
      const drawn = [
        rect({
          x: bx,
          y: cy - blockH / 2,
          w: bw,
          h: blockH,
          fill: wait ? null : "well",
          stroke: role,
          width: 1.25,
          dash: wait ? "4 3" : null,
        }),
      ];
      if (block.label) {
        drawn.push(text({ x: bx + bw / 2, y: cy + 4, value: block.label, fill: wait ? "dim" : role }));
      }
      nodes.push(g(block.step ?? null, drawn));
    });
  });

  (data.marks || []).forEach((mark) => {
    const x = scale(mark.at);
    nodes.push(
      g(mark.step ?? null, [
        line({ x1: x, y1: PAD + 6, x2: x, y2: axisY, stroke: mark.ink || "ink", width: 1, dash: "9 4 2 4" }),
        text({ x, y: PAD + 18, value: mark.label, fill: mark.ink || "ink" }),
      ]),
    );
  });

  return { nodes, height: axisY + 30 + PAD, scale };
}

/* -------------------------------------------------------------- states -- */

/** Named states, labelled edges, and the illegal move drawn as illegal. */
export function states(data, ctx) {
  const { id, width } = ctx;
  const nodesIn = data.nodes || [];
  if (nodesIn.length === 0) throw new Error("states: needs at least one node");
  const nodeW = data.nodeWidth ?? 164;
  const nodeH = 48;
  const cols = Math.max(...nodesIn.map((n) => n.col)) + 1;
  const rows = Math.max(...nodesIn.map((n) => n.row)) + 1;
  const colXs = spread({ count: cols, extent: width - 2 * PAD, size: nodeW, start: PAD });
  const rowGap = 74;
  const top = PAD + 22;
  const boxes = new Map();
  const out = [arrowDefs(id)];

  nodesIn.forEach((n) => {
    const box = { x: colXs[n.col], y: top + n.row * (nodeH + rowGap), w: nodeW, h: nodeH };
    boxes.set(n.id, box);
    const role = n.ink || "ink";
    const drawn = [
      rect({ ...box, stroke: role, width: 1.25, fill: n.fill ? "well" : null }),
      text({ x: box.x + nodeW / 2, y: box.y + 22, value: n.label, fill: role, size: 11, tracking: "0.08em" }),
    ];
    if (n.sub) drawn.push(text({ x: box.x + nodeW / 2, y: box.y + 38, value: n.sub, fill: "dim" }));
    out.push(g(n.step ?? null, drawn));
  });

  (data.edges || []).forEach((edge) => {
    const a = boxes.get(edge.from);
    const b = boxes.get(edge.to);
    if (!a || !b) throw new Error(`states: edge ${edge.from} -> ${edge.to} names an unknown node`);
    const bc = { x: b.x + b.w / 2, y: b.y + b.h / 2 };
    const ac = { x: a.x + a.w / 2, y: a.y + a.h / 2 };
    const p1 = boxAnchor(a, bc.x, bc.y);
    const p2 = boxAnchor(b, ac.x, ac.y);
    const illegal = edge.kind === "illegal";
    const role = edge.ink || "dim";
    const drawn = [
      line({
        x1: p1.x,
        y1: p1.y,
        x2: p2.x,
        y2: p2.y,
        stroke: role,
        width: 1.25,
        dash: illegal ? "5 4" : null,
        marker: markerId(id, role === "accent" ? "accent" : role === "ink" ? "ink" : "dim"),
      }),
    ];
    const mx = r2((p1.x + p2.x) / 2);
    const my = r2((p1.y + p2.y) / 2);
    if (edge.label) {
      drawn.push(text({ x: mx, y: my - (illegal ? 12 : 7), value: edge.label, fill: "dim" }));
    }
    if (illegal) drawn.push(text({ x: mx, y: my + 12, value: "✕", fill: "fail", size: 12 }));
    out.push(g(edge.step ?? null, drawn));
  });

  return { nodes: out, height: top + rows * (nodeH + rowGap) - rowGap + PAD + 16 };
}

export const LAYOUTS = { dist, map, flow, stack, timeline, states };
