/* Types for the pure scale and layout math. */

export interface Scale {
  (value: number): number;
  kind: "linear" | "log";
  domain: [number, number];
  range: [number, number];
  invert(pixel: number): number;
}

export declare function r2(n: number): number;
export declare function r10(n: number): number;
export declare function linearScale(opts: { domain: [number, number]; range: [number, number] }): Scale;
export declare function logScale(opts: { domain: [number, number]; range: [number, number] }): Scale;
export declare function niceStep(raw: number): number;
export declare function niceTicks(max: number, count?: number): number[];
export declare function linearAxis(max: number, count?: number): { step: number; top: number; ticks: number[] };
export declare function boxAnchor(
  box: { x: number; y: number; w: number; h: number },
  tx: number,
  ty: number,
): { x: number; y: number };
export declare function logDomain(values: number[]): [number, number];
export declare function logTicks(domain: [number, number]): number[];
export declare function bandLayout(opts: {
  count: number;
  extent: number;
  gap?: number;
  start?: number;
}): { start: number; size: number }[];
export declare function spread(opts: {
  count: number;
  extent: number;
  size: number;
  start?: number;
}): number[];
export declare function stepAttr(step: number | [number, number] | string | null | undefined): string | null;
export declare function stepCovers(attr: string | null | undefined, step: number): boolean;
