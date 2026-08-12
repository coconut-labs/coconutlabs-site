// TS port of the point-in-time leakage demo (point-in-time-correctness-guardrail repo).
// The join + guardrail are live and deterministic; the AUC impact stays the cited
// Python measurement (0.999 vs 0.771) — a live model number would drift from the
// evidence file, so we don't fake one.

export type Entity = { id: number; labelTs: number; label: number; feature: { t: number; v: number }[] };
export type JoinRow = { id: number; labelTs: number; label: number; featureTs: number; featureValue: number; leaked: boolean };

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Same structure as the Python generator: a pre-label feature is weakly related to
// the label; after the label the outcome shows up strongly. So the latest value
// leaks the future; the as-of value doesn't.
export function generate(n = 8, seed = 7): Entity[] {
  const rnd = mulberry32(seed);
  const ents: Entity[] = [];
  for (let id = 0; id < n; id++) {
    const label = rnd() < 0.5 ? 0 : 1;
    const labelTs = 30 + Math.floor(rnd() * 40); // 30..69
    const feature: { t: number; v: number }[] = [];
    for (let t = 0; t <= 90; t += 10) {
      const noise = (rnd() - 0.5) * 12;
      const v = t <= labelTs ? 50 + 9 * label + noise : 50 - 32 * label + noise;
      feature.push({ t, v: Math.round(v * 10) / 10 });
    }
    ents.push({ id, labelTs, label, feature });
  }
  return ents;
}

const latestAtOrBefore = (feature: { t: number; v: number }[], ts: number) => {
  const eligible = feature.filter((p) => p.t <= ts);
  return eligible[eligible.length - 1] ?? feature[0];
};
const latest = (feature: { t: number; v: number }[]) => feature[feature.length - 1] ?? feature[0];

export function asofJoin(ents: Entity[]): JoinRow[] {
  return ents.map((e) => {
    const f = latestAtOrBefore(e.feature, e.labelTs) ?? { t: 0, v: 0 };
    return { id: e.id, labelTs: e.labelTs, label: e.label, featureTs: f.t, featureValue: f.v, leaked: f.t > e.labelTs };
  });
}

export function leakyJoin(ents: Entity[]): JoinRow[] {
  return ents.map((e) => {
    const f = latest(e.feature) ?? { t: 0, v: 0 };
    return { id: e.id, labelTs: e.labelTs, label: e.label, featureTs: f.t, featureValue: f.v, leaked: f.t > e.labelTs };
  });
}

// The guardrail: count rows whose feature is timestamped after the label.
export const leakedCount = (rows: JoinRow[]): number => rows.filter((r) => r.leaked).length;

// Per-entity join trace (additive, for the live demo): what each strategy
// actually picked, derived from the same asofJoin/leakyJoin rows the table
// and banner use. Nothing is recomputed differently for the animation.
export type JoinPick = {
  id: number;
  labelTs: number;
  /** feature rows in this entity's history */
  candidates: number;
  /** rows with t at or before the label, what an as-of join may use */
  eligible: number;
  pickedTs: number;
  pickedValue: number;
  leaked: boolean;
};

export function joinTrace(ents: Entity[], mode: "asof" | "leaky"): JoinPick[] {
  const rows = mode === "asof" ? asofJoin(ents) : leakyJoin(ents);
  return ents.map((e, i) => {
    const r = rows[i];
    return {
      id: e.id,
      labelTs: e.labelTs,
      candidates: e.feature.length,
      eligible: e.feature.filter((p) => p.t <= e.labelTs).length,
      pickedTs: r?.featureTs ?? 0,
      pickedValue: r?.featureValue ?? 0,
      leaked: r?.leaked ?? false,
    };
  });
}

// Cited, measured (Python harness) — not recomputed live.
export const CITED_AUC = { leaky: 0.999, asof: 0.771 } as const;
