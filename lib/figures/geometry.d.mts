/* Types for buildFigure, the single geometry source. */
import type { DrawNode } from "./draw.mjs";
import type { Caption, Claim, FigureSpec } from "./spec.mjs";

export type Drawing = {
  id: string;
  type: FigureSpec["type"];
  claim: Claim;
  width: number;
  height: number;
  viewBox: string;
  nodes: DrawNode[];
  alt: string;
  caption: Caption;
  steps: string[];
  stepCount: number;
  staticStep: number;
  scrubbed: boolean;
};

export declare function accentSubjects(nodes: DrawNode[]): number;
export declare function stampStatic(nodes: DrawNode[], step: number): DrawNode[];
export declare function buildFigure(spec: FigureSpec): Drawing;
