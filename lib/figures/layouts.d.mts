/* Types for the six primitive layouts. */
import type { DrawNode } from "./draw.mjs";
import type { Scale } from "./scale.mjs";
import type {
  DistData, FlowData, MapData, Primitive, StackData, StatesData, TimelineData,
} from "./spec.mjs";

export type LayoutContext = {
  id: string;
  width: number;
  sharedScale?: Scale;
  sharedDomain?: [number, number];
};

export type LayoutResult = { nodes: DrawNode[]; height: number; scale?: Scale };

export declare const PAD: number;
export declare function format(value: number | string, unit?: string): string;
export declare function dist(data: DistData, ctx: LayoutContext): LayoutResult;
export declare function map(data: MapData, ctx: LayoutContext): LayoutResult;
export declare function flow(data: FlowData, ctx: LayoutContext): LayoutResult;
export declare function stack(data: StackData, ctx: LayoutContext): LayoutResult;
export declare function timeline(data: TimelineData, ctx: LayoutContext): LayoutResult;
export declare function states(data: StatesData, ctx: LayoutContext): LayoutResult;
export declare const LAYOUTS: Record<Primitive, (data: never, ctx: LayoutContext) => LayoutResult>;
