/* Plate inks for the working drawings.
 *
 * The drawings sit on the dark plate (#0C0C0E in both themes, design-system
 * section 7), so their inks are pinned values, not theme tokens: a token
 * would flip to its light-scheme value and vanish against the constant
 * plate. Every hex here is on the design-lint plate allowlist. The primary
 * ink is #F7F7F5 (the light-scheme --bg-0 value) rather than the dark-scheme
 * --ink-0 #F2F2F0, which is not allowlisted; on the plate they are visually
 * identical and #F7F7F5 measures 18.22:1.
 *
 * Contrast on the plate is asserted in tests/unit/drawings/inks.test.ts:
 * INK 18.22:1, INK_DIM 5.15:1, ACCENT 6.97:1, all past the 4.5:1 body floor.
 */

export const PLATE = "#0C0C0E"; // figure ground, both themes
export const INK = "#F7F7F5"; // primary labels, box strokes, flow arrows
export const INK_DIM = "#82828E"; // secondary labels, failure paths, frames
export const ACCENT = "#7D93FF"; // measured values and dimension lines

function channel(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16);
  const r = channel((n >> 16) & 0xff);
  const g = channel((n >> 8) & 0xff);
  const b = channel(n & 0xff);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastOn(fg: string, bg: string): number {
  const a = relativeLuminance(fg);
  const b = relativeLuminance(bg);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}
