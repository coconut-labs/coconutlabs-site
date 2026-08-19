import { describe, expect, it } from "vitest";

import type { DrawNode } from "@/lib/figures/draw.mjs";
import { abExample, timelineExample } from "@/lib/figures/examples.mjs";
import { buildFigure } from "@/lib/figures/geometry.mjs";
import { dist, flow, map, PAD, stack, states, timeline } from "@/lib/figures/layouts.mjs";
import { boxAnchor, linearScale, logScale, spread } from "@/lib/figures/scale.mjs";
import type { FigureSpec } from "@/lib/figures/spec.mjs";

/* Data-to-geometry, against expectations computed from the scale math rather
 * than copied out of a previous run. Where a coordinate is asserted literally,
 * the arithmetic that produced it is written above it. */

const CTX = { id: "fig-test-01", width: 880 };

function flatten(nodes: DrawNode[]): DrawNode[] {
  return nodes.flatMap((n) => [n, ...(n.children ? flatten(n.children) : [])]);
}

function ofType(nodes: DrawNode[], el: string): DrawNode[] {
  return flatten(nodes).filter((n) => n.el === el);
}

describe("dist, linear", () => {
  const data = {
    axis: "linear" as const,
    unit: "ms",
    labelWidth: 168,
    valueWidth: 140,
    items: [
      { label: "a", value: 250 },
      { label: "b", value: 1000 },
    ],
  };
  const built = dist(data, CTX);

  // plotX = PAD + labelWidth + 14 = 16 + 168 + 14 = 198
  // plotW = width - PAD - valueWidth - plotX = 880 - 16 - 140 - 198 = 526
  const plotX = 198;
  const plotW = 526;
  // max is 1000, so linearAxis gives step 200, top 1000
  const scale = linearScale({ domain: [0, 1000], range: [plotX, plotX + plotW] });

  it("starts every bar at the axis origin", () => {
    const bars = ofType(built.nodes, "rect");
    expect(bars).toHaveLength(2);
    for (const bar of bars) expect(bar.attrs.x).toBe(plotX);
  });

  it("makes bar length proportional to value", () => {
    const bars = ofType(built.nodes, "rect");
    const [a, b] = bars as [DrawNode, DrawNode];
    expect(a.attrs.width).toBeCloseTo(scale(250) - plotX, 1);
    expect(b.attrs.width).toBeCloseTo(scale(1000) - plotX, 1);
    // 250 is a quarter of 1000, so its bar is a quarter as long.
    expect(Number(a.attrs.width) * 4).toBeCloseTo(Number(b.attrs.width), 1);
  });

  it("reports the scale it used", () => {
    expect(built.scale!.kind).toBe("linear");
    expect(built.scale!.domain).toEqual([0, 1000]);
  });
});

describe("dist, log", () => {
  const data = {
    axis: "log" as const,
    unit: "ms",
    labelWidth: 210,
    items: [
      { label: "solo", value: 53.9 },
      { label: "gated", value: 61.5 },
      { label: "fifo", value: 1585 },
    ],
  };
  const built = dist(data, CTX);
  // plotX = 16 + 210 + 14 = 240; plotW = 880 - 16 - 140 - 240 = 484
  const scale = logScale({ domain: [10, 10000], range: [240, 724] });

  it("draws points, not bars, because a log bar length means nothing", () => {
    expect(ofType(built.nodes, "rect")).toHaveLength(0);
    expect(ofType(built.nodes, "circle")).toHaveLength(3);
  });

  it("places each point at its log position", () => {
    const points = ofType(built.nodes, "circle");
    expect(points[0]!.attrs.cx).toBeCloseTo(scale(53.9), 1);
    expect(points[1]!.attrs.cx).toBeCloseTo(scale(61.5), 1);
    expect(points[2]!.attrs.cx).toBeCloseTo(scale(1585), 1);
  });

  it("says log in the tick row", () => {
    const labels = ofType(built.nodes, "text").map((t) => t.text);
    expect(labels).toContain("log axis");
  });
});

describe("map", () => {
  const data = {
    extent: [0, 48] as [number, number],
    regions: [
      { from: 0, to: 9, label: "PGD" },
      { from: 9, to: 18, label: "PUD" },
      { from: 36, to: 48, label: "OFFSET" },
    ],
  };
  const built = map(data, CTX);
  // range is PAD..width-PAD = 16..864 over a 48-unit extent, so 17.6667 px/unit
  const scale = linearScale({ domain: [0, 48], range: [16, 864] });

  it("places a region at its extent position", () => {
    const rects = ofType(built.nodes, "rect");
    expect(rects[0]!.attrs.x).toBe(16);
    expect(rects[1]!.attrs.x).toBeCloseTo(scale(9), 1);
    expect(rects[2]!.attrs.x).toBeCloseTo(scale(36), 1);
  });

  it("sizes a region to its span", () => {
    const rects = ofType(built.nodes, "rect");
    // 9 units of 48, across 848 px
    expect(rects[0]!.attrs.width).toBeCloseTo((9 / 48) * 848, 1);
    expect(rects[2]!.attrs.width).toBeCloseTo((12 / 48) * 848, 1);
  });

  it("runs the last region flush to the right edge", () => {
    const rects = ofType(built.nodes, "rect");
    const last = rects[2]!;
    expect(Number(last.attrs.x) + Number(last.attrs.width)).toBeCloseTo(864, 1);
  });
});

describe("flow", () => {
  const data = {
    stations: [
      { id: "a", label: "A" },
      { id: "b", label: "B" },
      { id: "c", label: "C" },
    ],
    edges: [{ from: "a", to: "b" }],
  };
  const built = flow(data, CTX);
  // gap 60, so boxW = (880 - 32 - 120) / 3 = 242.667
  const boxW = (880 - 2 * PAD - 60 * 2) / 3;

  it("spreads stations across the full width", () => {
    const boxes = ofType(built.nodes, "rect");
    const xs = spread({ count: 3, extent: 880 - 2 * PAD, size: boxW, start: PAD });
    expect(boxes).toHaveLength(3);
    boxes.forEach((box, i) => expect(box.attrs.x).toBeCloseTo(xs[i]!, 1));
  });

  it("gives every station the same width", () => {
    const widths = new Set(ofType(built.nodes, "rect").map((b) => b.attrs.width));
    expect(widths.size).toBe(1);
  });

  it("draws an adjacent edge as a straight arrow between the two boxes", () => {
    const lines = ofType(built.nodes, "line");
    expect(lines).toHaveLength(1);
    const edge = lines[0]!;
    expect(edge.attrs.y1).toBe(edge.attrs.y2);
    expect(Number(edge.attrs.x1)).toBeGreaterThan(PAD + boxW);
    expect(edge.attrs["marker-end"]).toBe("url(#fig-test-01-a-ink)");
  });

  it("refuses to name a station that does not exist", () => {
    expect(() => flow({ ...data, edges: [{ from: "a", to: "z" }] }, CTX)).toThrow(/no station "z"/);
  });

  it("rules the boundary straight through when no edge label shares its gap", () => {
    const built2 = flow({ ...data, boundary: { after: "b", label: "past this line" } }, CTX);
    const dashed = ofType(built2.nodes, "line").filter(
      (l) => l.attrs["stroke-dasharray"] === "9 4 2 4",
    );
    expect(dashed).toHaveLength(1);
  });

  it("breaks the boundary around an edge label rather than ruling through it", () => {
    const built2 = flow(
      {
        ...data,
        edges: [{ from: "b", to: "c", label: "shaped" }],
        boundary: { after: "b", label: "past this line" },
      },
      CTX,
    );
    const dashed = ofType(built2.nodes, "line").filter(
      (l) => l.attrs["stroke-dasharray"] === "9 4 2 4",
    );
    expect(dashed).toHaveLength(2);
    const [upper, lower] = dashed as [DrawNode, DrawNode];
    // Same x, and a real gap between them where the label sits.
    expect(upper.attrs.x1).toBe(lower.attrs.x1);
    expect(Number(lower.attrs.y1)).toBeGreaterThan(Number(upper.attrs.y2));
    // The lower segment still crosses the arrow, which is the whole point.
    const arrow = ofType(built2.nodes, "line").find((l) => l.attrs["marker-end"])!;
    expect(Number(lower.attrs.y1)).toBeLessThan(Number(arrow.attrs.y1));
    expect(Number(lower.attrs.y2)).toBeGreaterThan(Number(arrow.attrs.y1));
  });
});

describe("stack", () => {
  const data = {
    bands: [{ label: "A" }, { label: "B" }, { label: "C" }],
    bandHeight: 48,
  };
  const built = stack(data, CTX);
  // top = PAD + 12 = 28, band 48, gap 6
  it("stacks bands at a fixed pitch, sizes carrying no information", () => {
    const rects = ofType(built.nodes, "rect");
    expect(rects.map((r) => r.attrs.y)).toEqual([28, 82, 136]);
    expect(new Set(rects.map((r) => r.attrs.height))).toEqual(new Set([48]));
  });

  it("runs bands the full width", () => {
    const rects = ofType(built.nodes, "rect");
    for (const r of rects) {
      expect(r.attrs.x).toBe(PAD);
      expect(r.attrs.width).toBe(880 - 2 * PAD);
    }
  });

  it("draws the boundary in the gap after the named band", () => {
    const withBoundary = stack({ ...data, boundary: { after: 0, label: "privilege" } }, CTX);
    const lines = ofType(withBoundary.nodes, "line");
    expect(lines).toHaveLength(1);
    // gap between band 0 (ends at 76) and band 1 (starts at 82) is 76..82
    expect(lines[0]!.attrs.y1).toBe(79);
    expect(lines[0]!.attrs["stroke-dasharray"]).toBe("9 4 2 4");
  });
});

describe("timeline", () => {
  const built = timeline(timelineExample.data as never, CTX);
  // labelWidth 150, so plotX = 16 + 150 + 14 = 180; plotW = 880 - 16 - 180 - 12 = 672
  const scale = linearScale({ domain: [0, 12], range: [180, 852] });

  it("places a block from its time span", () => {
    const rects = ofType(built.nodes, "rect");
    const first = rects[0]!; // task A, 0 to 3
    expect(first.attrs.x).toBeCloseTo(scale(0), 1);
    expect(first.attrs.width).toBeCloseTo(scale(3) - scale(0), 1);
  });

  it("draws a wait as an outline and a run as a filled well", () => {
    const rects = ofType(built.nodes, "rect");
    const waits = rects.filter((r) => r.attrs["stroke-dasharray"] === "4 3");
    const runs = rects.filter((r) => !r.attrs["stroke-dasharray"]);
    expect(waits.length).toBe(3);
    expect(runs.length).toBe(4);
    for (const w of waits) expect(w.attrs.fill).toBe("none");
    for (const r of runs) expect(r.attrs.fill).toBe("var(--fig-well)");
  });

  it("never fills a run block with the accent, which would put accent text on accent ground", () => {
    const fills = new Set(ofType(built.nodes, "rect").map((r) => r.attrs.fill));
    expect(fills.has("var(--fig-accent)")).toBe(false);
  });

  it("gives every lane the same pitch", () => {
    const laneLabels = ofType(built.nodes, "text").filter((t) =>
      String(t.text).startsWith("task "),
    );
    expect(laneLabels).toHaveLength(3);
    const ys = laneLabels.map((t) => Number(t.attrs.y));
    expect(ys[1]! - ys[0]!).toBe(40);
    expect(ys[2]! - ys[1]!).toBe(40);
  });
});

describe("states", () => {
  const built = states(
    {
      nodes: [
        { id: "a", label: "A", col: 0, row: 0 },
        { id: "b", label: "B", col: 1, row: 0 },
      ],
      edges: [{ from: "a", to: "b", label: "goes" }],
    },
    CTX,
  );

  it("lands an edge on the node borders, not under them", () => {
    const xs = spread({ count: 2, extent: 848, size: 164, start: PAD });
    const boxA = { x: xs[0]!, y: PAD + 22, w: 164, h: 48 };
    const boxB = { x: xs[1]!, y: PAD + 22, w: 164, h: 48 };
    const p1 = boxAnchor(boxA, boxB.x + 82, boxB.y + 24);
    const p2 = boxAnchor(boxB, boxA.x + 82, boxA.y + 24);
    const edge = ofType(built.nodes, "line")[0]!;
    expect(edge.attrs.x1).toBe(p1.x);
    expect(edge.attrs.x2).toBe(p2.x);
    // the left box's right edge
    expect(edge.attrs.x1).toBe(xs[0]! + 164);
    expect(edge.attrs.x2).toBe(xs[1]!);
  });

  it("draws an illegal transition dashed and crossed", () => {
    const withIllegal = states(
      {
        nodes: [
          { id: "a", label: "A", col: 0, row: 0 },
          { id: "b", label: "B", col: 1, row: 0 },
        ],
        edges: [{ from: "a", to: "b", kind: "illegal", label: "never" }],
      },
      CTX,
    );
    const edge = ofType(withIllegal.nodes, "line")[0]!;
    expect(edge.attrs["stroke-dasharray"]).toBe("5 4");
    const glyphs = ofType(withIllegal.nodes, "text").filter((t) => t.text === "✕");
    expect(glyphs).toHaveLength(1);
    expect(glyphs[0]!.attrs.fill).toBe("var(--fig-fail)");
  });

  it("refuses an edge naming an unknown node", () => {
    expect(() =>
      states(
        { nodes: [{ id: "a", label: "A", col: 0, row: 0 }], edges: [{ from: "a", to: "ghost" }] },
        CTX,
      ),
    ).toThrow(/unknown node/);
  });
});

describe("the ab combinator", () => {
  const drawing = buildFigure(abExample as FigureSpec);
  // Each panel is emitted inside its own translate group, so panel geometry is
  // panel-local: identical coordinates in the two subtrees mean the two panels
  // are literally on the same scale.
  const panels = drawing.nodes.filter((n) => typeof n.attrs.transform === "string");
  const panelA = ofType(panels[0]!.children!, "rect");
  const panelB = ofType(panels[1]!.children!, "rect");

  it("emits exactly two panels", () => {
    expect(panels).toHaveLength(2);
    expect(panelA.length).toBeGreaterThan(0);
    expect(panelB.length).toBeGreaterThan(0);
  });

  it("puts the same value at the same x in both panels", () => {
    // Panel A's hard-IRQ ack runs 0 to 1; panel B's hard-IRQ work runs 0 to 6.
    // Both start at t=0, so both must start at the identical x.
    expect(panelA[0]!.attrs.x).toBe(panelB[0]!.attrs.x);
    // And both panels end their axis at the same place.
    const lastA = panelA[panelA.length - 1]!;
    const lastB = panelB[panelB.length - 1]!;
    expect(Number(lastA.attrs.x) + Number(lastA.attrs.width)).toBeCloseTo(
      Number(lastB.attrs.x) + Number(lastB.attrs.width),
      1,
    );
  });

  it("gives one millisecond the same width in both panels", () => {
    // A: ack is 0 to 1. B: the hard-IRQ work is 0 to 6. 6x the width, exactly.
    const oneMs = Number(panelA[0]!.attrs.width);
    const sixMs = Number(panelB[0]!.attrs.width);
    expect(sixMs).toBeCloseTo(oneMs * 6, 0);
  });

  it("stacks the second panel below the first", () => {
    const titles = ofType(drawing.nodes, "text").filter((t) =>
      String(t.text).endsWith("TOP HALF"),
    );
    expect(titles).toHaveLength(2);
    expect(drawing.height).toBeGreaterThan(400);
  });

  it("calls the delta out once", () => {
    const deltas = ofType(drawing.nodes, "text").filter((t) => t.text === abExample.delta);
    expect(deltas).toHaveLength(1);
    expect(deltas[0]!.attrs.fill).toBe("var(--fig-accent)");
  });
});

describe("layout guards", () => {
  it("refuses a dist too narrow to plot", () => {
    expect(() =>
      dist({ items: [{ label: "a", value: 1 }], labelWidth: 600 }, { id: "x", width: 700 }),
    ).toThrow(/no room to plot/);
  });

  it("refuses more flow stations than the width can hold", () => {
    const stations = Array.from({ length: 12 }, (_, i) => ({ id: `s${i}`, label: `S${i}` }));
    expect(() => flow({ stations }, CTX)).toThrow(/too many stations/);
  });

  it("refuses an empty primitive", () => {
    expect(() => stack({ bands: [] }, CTX)).toThrow(/at least one band/);
    expect(() => dist({ items: [] }, CTX)).toThrow(/at least one item/);
  });
});
