/* Types for the worked examples. One example per layout kind, used by the
   catalog page and by the unit tests as the fixture set.

   Each example is typed as its concrete variant rather than the FigureSpec
   union: the tests reach into .data and into the A/B .delta, which the union
   does not carry. */
import type { AbSpec, FigureSpec, PrimitiveSpec } from "./spec.mjs";

export declare const distExample: PrimitiveSpec;
export declare const mapExample: PrimitiveSpec;
export declare const flowExample: PrimitiveSpec;
export declare const timelineExample: PrimitiveSpec;
export declare const statesExample: PrimitiveSpec;
export declare const stackExample: PrimitiveSpec;
export declare const abExample: AbSpec;
export declare const scrubExample: PrimitiveSpec;

export type CatalogEntry = { entry: string; spec: FigureSpec };

export declare const CATALOG: CatalogEntry[];
export declare const EXAMPLES: Record<string, FigureSpec>;
