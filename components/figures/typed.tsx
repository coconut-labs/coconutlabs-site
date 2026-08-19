import type {
  AbSpec,
  Claim,
  DistData,
  FlowData,
  MapData,
  Primitive,
  Provenance,
  StackData,
  StatesData,
  Step,
  TimelineData,
} from "@/lib/figures/spec.mjs";

import { Figure } from "./Figure";

/* One React component per taxonomy entry.
 *
 * Each takes its primitive's data as a typed prop, so the compiler catches a
 * `dist` item handed to a `stack` before the renderer ever sees it. They are
 * thin on purpose: the geometry lives in lib/figures, shared with the vanilla
 * renderer, and a component that laid out its own figure would be a second
 * source of truth and a second thing to keep pixel-identical.
 *
 * `scrub` is not a component. It is the presence of `steps`, which any of
 * these accepts, because the combinator applies to every primitive. */

type Common = {
  /** fig-<surface>-<nn> */
  id: string;
  claim: Claim;
  title: string;
  alt: string;
  width?: number;
  /** measured only */
  conditions?: string;
  /** measured only */
  provenance?: Provenance;
  /** reported only */
  source?: string;
  /** absent for a static figure; two or more turns on the step rail */
  steps?: Step[];
  staticStep?: number;
};

const WIDTH = 880;

function props<T>(type: Primitive, common: Common, data: T) {
  const { width = WIDTH, ...rest } = common;
  return { ...rest, type, width, data } as never;
}

export function MapFigure({ data, ...common }: Common & { data: MapData }) {
  return <Figure spec={props("map", common, data)} />;
}

export function FlowFigure({ data, ...common }: Common & { data: FlowData }) {
  return <Figure spec={props("flow", common, data)} />;
}

export function TimelineFigure({ data, ...common }: Common & { data: TimelineData }) {
  return <Figure spec={props("timeline", common, data)} />;
}

export function DistFigure({ data, ...common }: Common & { data: DistData }) {
  return <Figure spec={props("dist", common, data)} />;
}

export function StatesFigure({ data, ...common }: Common & { data: StatesData }) {
  return <Figure spec={props("states", common, data)} />;
}

export function StackFigure({ data, ...common }: Common & { data: StackData }) {
  return <Figure spec={props("stack", common, data)} />;
}

/**
 * The ab combinator. Two instances of one primitive on one scale, stacked so
 * both panels get the full width and literally the same scale function.
 * Use only when both sides were measured the same way; two panels side by
 * side assert that they were.
 */
export function AbFigure<T extends Primitive>({
  a,
  b,
  delta,
  of,
  ...common
}: Common & {
  of: T;
  a: AbSpec["a"];
  b: AbSpec["b"];
  delta?: string;
}) {
  const { width = WIDTH, ...rest } = common;
  const spec = { ...rest, type: "ab" as const, of, a, b, delta, width };
  return <Figure spec={spec} />;
}
