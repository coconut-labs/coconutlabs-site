/* Scale and layout math. Pure, zero dependency, no Date, no Math.random, no
 * DOM measurement. Every function here is total: it either returns a value
 * that depends only on its arguments, or it throws.
 *
 * This module is the reason the figure toolkit can have one geometry source
 * and two emitters. React and the vanilla renderer both consume the numbers
 * these functions produce; neither computes any geometry of its own. */

/** Round to 2 decimals so emitted coordinates are short and float noise never
 *  reaches the output string. Determinism is already guaranteed by purity;
 *  this is about a readable, diffable SVG. */
export function r2(n) {
  if (!Number.isFinite(n)) throw new TypeError(`r2: not a finite number: ${n}`);
  return Math.round(n * 100) / 100;
}

/** Round to 10 decimals. Used to kill accumulation error in tick sequences
 *  before it becomes a visible 0.30000000000000004 in a label. */
export function r10(n) {
  return Math.round(n * 1e10) / 1e10;
}

function checkRange(range, who) {
  if (!Array.isArray(range) || range.length !== 2) {
    throw new TypeError(`${who}: range must be a [from, to] pair`);
  }
  const [a, b] = range;
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    throw new TypeError(`${who}: range values must be finite`);
  }
}

/**
 * A linear scale from a value domain to a pixel range.
 * Returns a callable carrying its own domain/range/kind and an invert().
 */
export function linearScale({ domain, range }) {
  if (!Array.isArray(domain) || domain.length !== 2) {
    throw new TypeError("linearScale: domain must be a [lo, hi] pair");
  }
  const [d0, d1] = domain;
  if (!Number.isFinite(d0) || !Number.isFinite(d1)) {
    throw new TypeError("linearScale: domain values must be finite");
  }
  if (d0 === d1) throw new RangeError("linearScale: domain is empty");
  checkRange(range, "linearScale");
  const [r0, r1] = range;
  const m = (r1 - r0) / (d1 - d0);
  const scale = (v) => r0 + (v - d0) * m;
  scale.kind = "linear";
  scale.domain = [d0, d1];
  scale.range = [r0, r1];
  scale.invert = (p) => d0 + (p - r0) / m;
  return scale;
}

/**
 * A base-10 log scale. Throws on a non-positive domain, which is the whole
 * point: a log axis cannot show zero, and a figure that needs to show zero
 * needs a linear axis.
 */
export function logScale({ domain, range }) {
  if (!Array.isArray(domain) || domain.length !== 2) {
    throw new TypeError("logScale: domain must be a [lo, hi] pair");
  }
  const [d0, d1] = domain;
  if (!(d0 > 0) || !(d1 > 0)) {
    throw new RangeError("logScale: domain must be strictly positive");
  }
  if (d0 === d1) throw new RangeError("logScale: domain is empty");
  checkRange(range, "logScale");
  const [r0, r1] = range;
  const l0 = Math.log10(d0);
  const l1 = Math.log10(d1);
  const m = (r1 - r0) / (l1 - l0);
  const scale = (v) => {
    if (!(v > 0)) throw new RangeError(`logScale: cannot place ${v} on a log axis`);
    return r0 + (Math.log10(v) - l0) * m;
  };
  scale.kind = "log";
  scale.domain = [d0, d1];
  scale.range = [r0, r1];
  scale.invert = (p) => 10 ** (l0 + (p - r0) / m);
  return scale;
}

/** The 1 / 2 / 2.5 / 5 / 10 ladder, snapped up to the next rung. */
export function niceStep(raw) {
  if (!(raw > 0)) throw new RangeError("niceStep: raw step must be positive");
  const pow = 10 ** Math.floor(Math.log10(raw));
  const f = raw / pow;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return r10(nice * pow);
}

/**
 * Ticks for a linear axis, always starting at zero. Honesty rule C.2 lives
 * here rather than in a review checklist: there is no way to ask this
 * function for an axis that starts anywhere else.
 */
export function niceTicks(max, count = 5) {
  if (!(max > 0)) throw new RangeError("niceTicks: max must be positive");
  if (!(count >= 1)) throw new RangeError("niceTicks: count must be at least 1");
  const step = niceStep(max / count);
  const out = [];
  for (let i = 0; r10(i * step) <= max; i += 1) out.push(r10(i * step));
  return out;
}

/**
 * A linear axis that covers `max`: the nice step, the top (first multiple of
 * the step at or above max), and the tick sequence from zero to the top.
 * niceTicks stops at or below max; an axis has to enclose its data, so this
 * is the version a plot uses.
 */
export function linearAxis(max, count = 5) {
  if (!(max > 0)) throw new RangeError("linearAxis: max must be positive");
  const step = niceStep(max / count);
  const top = r10(Math.ceil(r10(max / step)) * step);
  const ticks = [];
  for (let i = 0; r10(i * step) <= top; i += 1) ticks.push(r10(i * step));
  return { step, top, ticks };
}

/**
 * Where a line aimed at (tx, ty) leaves a box. The standard box-ray clip:
 * scale the direction vector until it touches the nearer of the two half
 * extents. Used by `states` so an edge lands on a node border rather than
 * disappearing under it.
 */
export function boxAnchor({ x, y, w, h }, tx, ty) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const dx = tx - cx;
  const dy = ty - cy;
  if (dx === 0 && dy === 0) return { x: r2(cx), y: r2(cy) };
  const sx = dx === 0 ? Number.POSITIVE_INFINITY : w / 2 / Math.abs(dx);
  const sy = dy === 0 ? Number.POSITIVE_INFINITY : h / 2 / Math.abs(dy);
  const s = Math.min(sx, sy);
  return { x: r2(cx + dx * s), y: r2(cy + dy * s) };
}

/** The decade the value sits in, rounded outward. */
export function logDomain(values) {
  const finite = values.filter((v) => Number.isFinite(v) && v > 0);
  if (finite.length === 0) throw new RangeError("logDomain: no positive values");
  const lo = Math.min(...finite);
  const hi = Math.max(...finite);
  return [10 ** Math.floor(Math.log10(lo)), 10 ** Math.ceil(Math.log10(hi))];
}

/** Decade ticks across a log domain, inclusive of both ends. */
export function logTicks([lo, hi]) {
  if (!(lo > 0) || !(hi > lo)) throw new RangeError("logTicks: need 0 < lo < hi");
  const out = [];
  for (let e = Math.round(Math.log10(lo)); e <= Math.round(Math.log10(hi)); e += 1) {
    out.push(10 ** e);
  }
  return out;
}

/**
 * Split an extent into `count` bands separated by `gap`. Returns
 * [{ start, size }] in order. The invariant the test asserts: the bands and
 * the gaps together fill the extent exactly.
 */
export function bandLayout({ count, extent, gap = 0, start = 0 }) {
  if (!Number.isInteger(count) || count < 1) {
    throw new RangeError("bandLayout: count must be a positive integer");
  }
  if (!(extent > 0)) throw new RangeError("bandLayout: extent must be positive");
  if (gap < 0) throw new RangeError("bandLayout: gap must not be negative");
  const total = gap * (count - 1);
  if (total >= extent) throw new RangeError("bandLayout: gaps consume the whole extent");
  const size = (extent - total) / count;
  const bands = [];
  for (let i = 0; i < count; i += 1) {
    bands.push({ start: r2(start + i * (size + gap)), size: r2(size) });
  }
  return bands;
}

/**
 * Evenly space `count` items of width `size` across an extent, returning the
 * left edge of each. Used by flow (stations) and stack (bands) where the item
 * size is fixed by content rather than derived from the extent.
 */
export function spread({ count, extent, size, start = 0 }) {
  if (!Number.isInteger(count) || count < 1) {
    throw new RangeError("spread: count must be a positive integer");
  }
  if (count === 1) return [r2(start + (extent - size) / 2)];
  const gap = (extent - size * count) / (count - 1);
  const out = [];
  for (let i = 0; i < count; i += 1) out.push(r2(start + i * (size + gap)));
  return out;
}

/** Format a step range as the data-fig-step attribute value. */
export function stepAttr(step) {
  if (step === null || step === undefined) return null;
  if (Number.isInteger(step)) return String(step);
  if (Array.isArray(step) && step.length === 2) {
    const [a, b] = step;
    if (!Number.isInteger(a) || !Number.isInteger(b)) {
      throw new TypeError("stepAttr: range bounds must be integers");
    }
    if (b < a) throw new RangeError("stepAttr: range end precedes its start");
    return a === b ? String(a) : `${a}-${b}`;
  }
  if (typeof step === "string" && /^\d+(-\d+)?$/.test(step)) return step;
  throw new TypeError(`stepAttr: unusable step ${JSON.stringify(step)}`);
}

/** Whether a step range covers a given step index. */
export function stepCovers(attr, step) {
  if (attr === null || attr === undefined) return true;
  const dash = attr.indexOf("-");
  const lo = dash > 0 ? Number(attr.slice(0, dash)) : Number(attr);
  const hi = dash > 0 ? Number(attr.slice(dash + 1)) : lo;
  return step >= lo && step <= hi;
}
