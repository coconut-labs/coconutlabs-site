/* Types for the authoring format.
 *
 * The core is authored as zero-dependency .mjs so the book build (which has
 * no dependency budget at all) and the standalone HTML pass can import it
 * unbuilt. TypeScript consumers get their types from these sidecars. */

export type Primitive = "map" | "flow" | "timeline" | "dist" | "states" | "stack";
export type Claim = "measured" | "reported" | "illustrative" | "schematic";
export type InkRole = "ink" | "dim" | "rule" | "accent" | "well" | "pass" | "fail";

/** An int step, or an inclusive [from, to] range, or "from-to". */
export type StepRange = number | [number, number] | string | null;

export type Step = { caption: string };

export type Provenance = { href: string; label?: string };

/* ---- per-primitive data shapes ---------------------------------------- */

export type DistItem = {
  label: string;
  value: number;
  ink?: InkRole;
  note?: string;
  step?: StepRange;
};

export type DistLine = { at: number; label: string; ink?: InkRole; step?: StepRange };

export type DistData = {
  axis?: "linear" | "log";
  unit?: string;
  items: DistItem[];
  lines?: DistLine[];
  labelWidth?: number;
  valueWidth?: number;
};

export type MapRegion = {
  from: number;
  to: number;
  label: string;
  sub?: string;
  ink?: InkRole;
  fill?: boolean;
  fromLabel?: string;
  toLabel?: string;
  step?: StepRange;
};

export type MapData = {
  extent: [number, number];
  regions: MapRegion[];
  marks?: { at: number; label: string; ink?: InkRole; step?: StepRange }[];
  dims?: { from: number; to: number; label: string; ink?: InkRole; step?: StepRange }[];
  gutter?: number;
  barHeight?: number;
};

export type FlowStation = {
  id: string;
  label: string;
  lines?: string[];
  ink?: InkRole;
  step?: StepRange;
};

export type FlowEdge = {
  from: string;
  to: string;
  label?: string;
  style?: "solid" | "dashed";
  route?: "below";
  ink?: InkRole;
  step?: StepRange;
};

export type FlowData = {
  stations: FlowStation[];
  edges?: FlowEdge[];
  boundary?: { after: string; label: string; step?: StepRange };
  gap?: number;
};

export type StackBand = {
  label: string;
  sub?: string;
  right?: string;
  ink?: InkRole;
  step?: StepRange;
};

export type StackData = {
  bands: StackBand[];
  boundary?: { after: number; label: string; step?: StepRange };
  here?: number;
  bandHeight?: number;
  gutter?: number;
};

export type TimelineBlock = {
  from: number;
  to: number;
  label?: string;
  kind?: "run" | "wait";
  ink?: InkRole;
  step?: StepRange;
};

export type TimelineData = {
  span: [number, number];
  unit?: string;
  lanes: { label: string; blocks?: TimelineBlock[]; step?: StepRange }[];
  marks?: { at: number; label: string; ink?: InkRole; step?: StepRange }[];
  labelWidth?: number;
  tickCount?: number;
};

export type StateNode = {
  id: string;
  label: string;
  col: number;
  row: number;
  sub?: string;
  fill?: boolean;
  ink?: InkRole;
  step?: StepRange;
};

export type StatesData = {
  nodes: StateNode[];
  edges?: {
    from: string;
    to: string;
    label?: string;
    kind?: "normal" | "illegal";
    ink?: InkRole;
    step?: StepRange;
  }[];
  nodeWidth?: number;
};

export type FigureData =
  | DistData
  | MapData
  | FlowData
  | StackData
  | TimelineData
  | StatesData;

/* ---- the spec --------------------------------------------------------- */

type SpecCommon = {
  /** fig-<surface>-<nn> */
  id: string;
  claim: Claim;
  title: string;
  alt: string;
  width: number;
  /** measured only */
  conditions?: string;
  /** measured only */
  provenance?: Provenance;
  /** reported only */
  source?: string;
  /** absent or length > 1; a one-step figure is a static figure */
  steps?: Step[];
  /** the frame a reader with no JS sees; defaults to the last step */
  staticStep?: number;
};

export type PrimitiveSpec = SpecCommon & { type: Primitive; data: FigureData };

export type AbSpec = SpecCommon & {
  type: "ab";
  of: Primitive;
  a: { title: string; data: FigureData };
  b: { title: string; data: FigureData };
  delta?: string;
};

export type FigureSpec = PrimitiveSpec | AbSpec;

export type Caption = {
  left: string;
  right: string;
  footnote: { label: string; href: string; text: string } | null;
};

/* ---- exports ---------------------------------------------------------- */

export declare const PRIMITIVES: Primitive[];
export declare const CLAIMS: Claim[];
export declare const INKS: Record<InkRole, string>;
export declare const INK_ROLES: InkRole[];
export declare function ink(role?: InkRole): string;
export declare function countAccents(node: unknown): number;
export declare function validateSpec<T extends FigureSpec>(spec: T): T;
export declare function stepCount(spec: FigureSpec): number;
export declare function isScrubbed(spec: FigureSpec): boolean;
export declare function resolveStaticStep(spec: FigureSpec): number;
export declare function composeCaption(spec: FigureSpec): Caption;
export declare function valueInk(grade: Claim): InkRole;
export declare function stepCaptions(spec: FigureSpec): string[];
