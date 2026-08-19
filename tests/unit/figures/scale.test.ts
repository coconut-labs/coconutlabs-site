import { describe, expect, it } from "vitest";

import {
  bandLayout,
  boxAnchor,
  linearAxis,
  linearScale,
  logDomain,
  logScale,
  logTicks,
  niceStep,
  niceTicks,
  spread,
  stepAttr,
  stepCovers,
} from "@/lib/figures/scale.mjs";

describe("linearScale", () => {
  it("pins the domain ends to the range ends", () => {
    const s = linearScale({ domain: [0, 2000], range: [240, 740] });
    expect(s(0)).toBe(240);
    expect(s(2000)).toBe(740);
  });

  it("is linear in between", () => {
    const s = linearScale({ domain: [0, 2000], range: [240, 740] });
    // 500 of 2000 is a quarter of the way; the range is 500 wide.
    expect(s(500)).toBe(365);
    expect(s(1500)).toBe(615);
  });

  it("handles a domain that does not start at zero", () => {
    const s = linearScale({ domain: [4, 12], range: [0, 400] });
    expect(s(4)).toBe(0);
    expect(s(8)).toBe(200);
    expect(s(12)).toBe(400);
  });

  it("inverts", () => {
    const s = linearScale({ domain: [0, 12], range: [162, 852] });
    expect(s.invert(s(7))).toBeCloseTo(7, 10);
  });

  it("refuses an empty domain", () => {
    expect(() => linearScale({ domain: [5, 5], range: [0, 10] })).toThrow(/domain is empty/);
  });
});

describe("logScale", () => {
  it("puts the geometric midpoint at the range midpoint", () => {
    const s = logScale({ domain: [10, 1000], range: [0, 100] });
    // log10 of 100 is 2, halfway between 1 and 3.
    expect(s(100)).toBeCloseTo(50, 10);
    expect(s(10)).toBe(0);
    expect(s(1000)).toBeCloseTo(100, 10);
  });

  it("places the canonical bench values in ascending order", () => {
    const s = logScale({ domain: [10, 10000], range: [0, 600] });
    expect(s(53.9)).toBeLessThan(s(61.5));
    expect(s(61.5)).toBeLessThan(s(1585));
    // 10 to 10000 spans three decade intervals across 600 px, so each decade
    // is 200 px and 100 sits one decade above the origin.
    expect(s(100)).toBeCloseTo(200, 10);
    expect(s(1000)).toBeCloseTo(400, 10);
  });

  it("refuses a non-positive domain", () => {
    expect(() => logScale({ domain: [0, 100], range: [0, 10] })).toThrow(/strictly positive/);
  });

  it("refuses to place zero", () => {
    const s = logScale({ domain: [1, 100], range: [0, 10] });
    expect(() => s(0)).toThrow(/cannot place/);
  });
});

describe("niceStep", () => {
  it("walks the 1 / 2 / 2.5 / 5 / 10 ladder", () => {
    expect(niceStep(0.9)).toBe(1);
    expect(niceStep(1.4)).toBe(2);
    expect(niceStep(2.3)).toBe(2.5);
    expect(niceStep(3.17)).toBe(5);
    expect(niceStep(6)).toBe(10);
  });

  it("carries the ladder across decades", () => {
    expect(niceStep(317)).toBe(500);
    expect(niceStep(0.176)).toBe(0.2);
    expect(niceStep(0.0009)).toBe(0.001);
  });

  it("refuses a non-positive step", () => {
    expect(() => niceStep(0)).toThrow(/positive/);
  });
});

describe("niceTicks", () => {
  it("stops at or below the max", () => {
    // 1585 / 5 = 317, which snaps to a 500 step; 2000 would overshoot 1585.
    expect(niceTicks(1585, 5)).toEqual([0, 500, 1000, 1500]);
  });

  it("always starts at zero", () => {
    expect(niceTicks(37)[0]).toBe(0);
    expect(niceTicks(0.9)[0]).toBe(0);
  });

  it("does not accumulate float error", () => {
    expect(niceTicks(1, 5)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1]);
  });
});

describe("linearAxis", () => {
  it("encloses the data rather than stopping short of it", () => {
    expect(linearAxis(1585, 5)).toEqual({
      step: 500,
      top: 2000,
      ticks: [0, 500, 1000, 1500, 2000],
    });
  });

  it("handles a sub-unit domain", () => {
    expect(linearAxis(0.88, 5)).toEqual({
      step: 0.2,
      top: 1,
      ticks: [0, 0.2, 0.4, 0.6, 0.8, 1],
    });
  });

  it("does not pad a max that is already on a step", () => {
    expect(linearAxis(10, 5)).toEqual({ step: 2, top: 10, ticks: [0, 2, 4, 6, 8, 10] });
  });
});

describe("log domain and ticks", () => {
  it("rounds the canonical bench outward to whole decades", () => {
    expect(logDomain([53.9, 61.5, 1585])).toEqual([10, 10000]);
  });

  it("emits one tick per decade, both ends inclusive", () => {
    expect(logTicks([10, 10000])).toEqual([10, 100, 1000, 10000]);
  });

  it("refuses a domain with no positive values", () => {
    expect(() => logDomain([0, -3])).toThrow(/no positive values/);
  });
});

describe("bandLayout", () => {
  it("fills the extent exactly, bands plus gaps", () => {
    const bands = bandLayout({ count: 4, extent: 400, gap: 10 });
    expect(bands).toHaveLength(4);
    const sizes = bands.reduce((n, b) => n + b.size, 0);
    expect(sizes + 10 * 3).toBeCloseTo(400, 6);
    const last = bands[3]!;
    expect(last.start + last.size).toBeCloseTo(400, 6);
  });

  it("starts where it is told", () => {
    expect(bandLayout({ count: 2, extent: 100, gap: 0, start: 16 })).toEqual([
      { start: 16, size: 50 },
      { start: 66, size: 50 },
    ]);
  });

  it("refuses gaps that eat the extent", () => {
    expect(() => bandLayout({ count: 5, extent: 40, gap: 10 })).toThrow(/whole extent/);
  });
});

describe("spread", () => {
  it("puts the first at the start and the last flush to the end", () => {
    const xs = spread({ count: 3, extent: 848, size: 260, start: 16 });
    expect(xs[0]).toBe(16);
    expect(xs[2]! + 260).toBeCloseTo(864, 6);
  });

  it("centres a lone item", () => {
    expect(spread({ count: 1, extent: 100, size: 40, start: 0 })).toEqual([30]);
  });
});

describe("boxAnchor", () => {
  const box = { x: 100, y: 100, w: 200, h: 100 };

  it("lands on the right edge for a target due east", () => {
    expect(boxAnchor(box, 900, 150)).toEqual({ x: 300, y: 150 });
  });

  it("lands on the bottom edge for a target due south", () => {
    expect(boxAnchor(box, 200, 900)).toEqual({ x: 200, y: 200 });
  });

  it("clips to the nearer half extent on a diagonal", () => {
    // Centre is (200, 150). Aiming at (400, 350): dx = 200, dy = 200.
    // Half width 100 gives s = 0.5, half height 50 gives s = 0.25, so the
    // horizontal edge wins and the point lands on the bottom.
    expect(boxAnchor(box, 400, 350)).toEqual({ x: 250, y: 200 });
  });

  it("returns the centre when the target is the centre", () => {
    expect(boxAnchor(box, 200, 150)).toEqual({ x: 200, y: 150 });
  });
});

describe("step ranges", () => {
  it("formats ints, pairs and strings", () => {
    expect(stepAttr(3)).toBe("3");
    expect(stepAttr([1, 4])).toBe("1-4");
    expect(stepAttr([2, 2])).toBe("2");
    expect(stepAttr("0-5")).toBe("0-5");
    expect(stepAttr(null)).toBeNull();
    expect(stepAttr(undefined)).toBeNull();
  });

  it("refuses a reversed range", () => {
    expect(() => stepAttr([4, 1])).toThrow(/precedes/);
  });

  it("covers inclusively, and an absent range covers everything", () => {
    expect(stepCovers("1-4", 1)).toBe(true);
    expect(stepCovers("1-4", 4)).toBe(true);
    expect(stepCovers("1-4", 0)).toBe(false);
    expect(stepCovers("1-4", 5)).toBe(false);
    expect(stepCovers("3", 3)).toBe(true);
    expect(stepCovers("3", 2)).toBe(false);
    expect(stepCovers(null, 9)).toBe(true);
  });
});
