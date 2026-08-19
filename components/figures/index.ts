/* The figure toolkit, public surface.
 *
 * Authoring: build a plain spec object (see lib/figures/spec.d.mts) and hand
 * it to <Figure/>, or use a typed per-primitive component and hand it `data`.
 * The same object renders through lib/figures/render.mjs for standalone HTML
 * pages and the book build. */

export { Figure } from "./Figure";
export { FigureRuntime } from "./FigureRuntime";
export { Draw, drawNode } from "./Draw";
export {
  AbFigure,
  DistFigure,
  FlowFigure,
  MapFigure,
  StackFigure,
  StatesFigure,
  TimelineFigure,
} from "./typed";
