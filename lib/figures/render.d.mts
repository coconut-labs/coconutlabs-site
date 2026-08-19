/* Types for the vanilla renderer. */
import type { Drawing } from "./geometry.mjs";
import type { Caption, FigureSpec } from "./spec.mjs";
import type { DrawNode } from "./draw.mjs";

export type RenderedFigure = {
  html: string;
  svg: string;
  alt: string;
  steps: string[];
  caption: Caption;
  drawing: Drawing;
};

export declare function escapeHtml(value: unknown): string;
export declare function renderNode(node: DrawNode): string;
export declare function renderSvg(drawing: Drawing): string;
export declare function renderFigure(spec: FigureSpec): RenderedFigure;
export declare function renderRuntimeScript(): string;
export declare function renderPage(specs: FigureSpec[]): {
  html: string;
  script: string;
  figures: RenderedFigure[];
};
