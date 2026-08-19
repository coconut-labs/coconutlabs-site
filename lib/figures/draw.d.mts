/* Types for the draw-node intermediate representation. */
import type { InkRole, StepRange } from "./spec.mjs";

export type DrawNode = {
  el: string;
  attrs: Record<string, string | number>;
  text?: string;
  children?: DrawNode[];
};

export declare function g(step: StepRange, children: (DrawNode | null | false)[], attrs?: Record<string, string | number>): DrawNode;
export declare function rect(opts: {
  x: number; y: number; w: number; h: number;
  fill?: InkRole | null; stroke?: InkRole | null; width?: number; dash?: string | null; rx?: 0 | 2;
}): DrawNode;
export declare function line(opts: {
  x1: number; y1: number; x2: number; y2: number;
  stroke?: InkRole; width?: number; dash?: string | null; marker?: string | null; markerStart?: string | null;
}): DrawNode;
export declare function path(opts: {
  d: string; stroke?: InkRole; width?: number; dash?: string | null; fill?: InkRole | null; marker?: string | null;
}): DrawNode;
export declare function circle(opts: {
  cx: number; cy: number; r: number; fill?: InkRole | null; stroke?: InkRole | null; width?: number;
}): DrawNode;
export declare function text(opts: {
  x: number; y: number; value: string | number; fill?: InkRole; size?: number;
  anchor?: "start" | "middle" | "end"; tracking?: string | null; baseline?: string | null;
}): DrawNode;
export declare function arrowDefs(id: string): DrawNode;
export declare function markerId(figureId: string, role?: InkRole): string;
export declare function frame(opts: { x: number; y: number; w: number; h: number }): DrawNode;
export declare function rowLabel(opts: { x: number; y: number; value: string; fill?: InkRole }): DrawNode;
