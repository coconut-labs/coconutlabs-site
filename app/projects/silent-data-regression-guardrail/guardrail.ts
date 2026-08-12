// TS port of the Python guardrail (data-regression-guardrail repo). Same detectors
// and thresholds, so the same data yields the same verdicts.
// Parity target: guardrail 6/6, schema contract 1/6 (results/guardrail.json).

export type Row = { s: number[]; a: number[]; e: number; f: number; t: number };
export type Dataset = { columns: string[]; rows: Row[] };
export type Violation = { kind: string; detail: string };

const SCALE_TOL = 0.15;
const FRAME_TOL = 0.2;
const START_TOL = 0.2;
const TRUNC_FRAC = 0.3;

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const mean = (xs: number[]) => (xs.length ? sum(xs) / xs.length : 0);
const median = (xs: number[]): number => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  const lo = s[m - 1] ?? 0, hi = s[m] ?? 0;
  return s.length % 2 ? hi : (lo + hi) / 2;
};

function byEpisode(rows: Row[]): Map<number, Row[]> {
  const m = new Map<number, Row[]>();
  for (const r of rows) {
    const g = m.get(r.e);
    if (g) g.push(r);
    else m.set(r.e, [r]);
  }
  return m;
}

// values of dimension j of an array column, undefined-safe
function col(rows: Row[], key: "s" | "a", j: number): number[] {
  const out: number[] = [];
  for (const r of rows) {
    const v = r[key][j];
    if (v !== undefined) out.push(v);
  }
  return out;
}

function episodePeriods(rows: Row[]): number[] {
  const out: number[] = [];
  for (const g of byEpisode(rows).values()) {
    if (g.length < 2) continue;
    const gs = [...g].sort((a, b) => a.f - b.f);
    const diffs: number[] = [];
    let prev = gs[0];
    for (let i = 1; i < gs.length && prev; i++) {
      const cur = gs[i];
      if (!cur) break;
      diffs.push(cur.t - prev.t);
      prev = cur;
    }
    out.push(median(diffs));
  }
  return out;
}

type DimStat = { min: number; max: number; mean: number };
const statOf = (vals: number[]): DimStat => ({ min: Math.min(...vals), max: Math.max(...vals), mean: mean(vals) });

export type Profile = {
  columns: string[];
  dims: { s: number; a: number };
  stats: { s: DimStat[]; a: DimStat[] };
  period: number;
  tsStart: number;
  minEpLen: number;
};

export function fitProfile(ds: Dataset): Profile {
  const { rows } = ds;
  const first = rows[0];
  const sDim = first ? first.s.length : 0;
  const aDim = first ? first.a.length : 0;
  const groups = [...byEpisode(rows).values()];
  const lengths = groups.map((g) => g.length);
  const starts = groups.map((g) => Math.min(...g.map((r) => r.t)));
  return {
    columns: ds.columns,
    dims: { s: sDim, a: aDim },
    stats: {
      s: Array.from({ length: sDim }, (_, j) => statOf(col(rows, "s", j))),
      a: Array.from({ length: aDim }, (_, j) => statOf(col(rows, "a", j))),
    },
    period: median(episodePeriods(rows)),
    tsStart: median(starts),
    minEpLen: lengths.length ? Math.min(...lengths) : 0,
  };
}

export function check(profile: Profile, ds: Dataset): Violation[] {
  const out: Violation[] = [];
  const { rows, columns } = ds;

  // schema — a declared column went missing
  const missing = profile.columns.filter((c) => !columns.includes(c));
  if (missing.length) out.push({ kind: "schema_drift", detail: `expected column(s) absent: ${missing.join(", ")}` });

  const first = rows[0];
  if (!first) return out;

  for (const key of ["s", "a"] as const) {
    if (!columns.includes(key)) continue; // schema-dropped columns are schema's job
    // array dimensionality
    const got = first[key].length;
    const expected = profile.dims[key];
    if (got !== expected) out.push({ kind: key === "s" ? "state_dim" : "action_dim", detail: `dimensionality ${got}, expected ${expected}` });
    // value scale
    const stats = profile.stats[key];
    for (let j = 0; j < Math.min(stats.length, got); j++) {
      const base = stats[j];
      if (!base) continue;
      const span = Math.max(base.max - base.min, 1e-9);
      const shift = Math.abs(mean(col(rows, key, j)) - base.mean);
      if (shift > SCALE_TOL * span) out.push({ kind: "value_scale", detail: `${key}[${j}] mean shifted ${shift.toFixed(1)} (> ${(SCALE_TOL * 100).toFixed(0)}% of span)` });
    }
  }

  // frame rate
  if (profile.period > 0) {
    const cand = median(episodePeriods(rows));
    if (Math.abs(cand - profile.period) > FRAME_TOL * profile.period) out.push({ kind: "frame_rate", detail: `inter-frame period ${cand.toFixed(3)}s, expected ${profile.period.toFixed(3)}s` });
  }

  // timestamp start
  const badStarts = [...byEpisode(rows).values()].filter((g) => Math.abs(Math.min(...g.map((r) => r.t)) - profile.tsStart) > START_TOL);
  if (badStarts.length) out.push({ kind: "timestamp", detail: `${badStarts.length} episode(s) start away from ${profile.tsStart.toFixed(2)}s` });

  // truncation
  const floor = profile.minEpLen * (1 - TRUNC_FRAC);
  const short = [...byEpisode(rows).values()].filter((g) => g.length < floor);
  if (short.length) out.push({ kind: "truncation", detail: `${short.length} episode(s) shorter than ${floor.toFixed(0)} frames` });

  return out;
}

// The off-the-shelf control: type/presence contract. Flags only a missing column.
export function schemaControlFlags(profile: Profile, ds: Dataset): boolean {
  return profile.columns.some((c) => !ds.columns.includes(c));
}

// ---- per-step check trace (additive, for the live demo) ---------------------
// The same comparisons check() makes, one step per measurement. Verdicts come
// from check()'s actual violations, so the flagged step count always equals
// the number of violations the banner reports. Per-episode lines are "info":
// raw measurements that roll up into their aggregate step.

export type CheckStep = {
  /** short mono label, e.g. "schema", "s[0] mean", "ep 4 start" */
  name: string;
  observed: string;
  expected: string;
  verdict: "ok" | "flag" | "info";
  /** violation kind when verdict is "flag" */
  kind?: string;
};

export function checkTrace(profile: Profile, ds: Dataset): CheckStep[] {
  const violations = check(profile, ds);
  const flagOf = (kind: string) => violations.find((v) => v.kind === kind);
  const steps: CheckStep[] = [];
  const { rows, columns } = ds;

  const schemaHit = flagOf("schema_drift");
  steps.push({
    name: "schema",
    observed: columns.join(","),
    expected: profile.columns.join(","),
    verdict: schemaHit ? "flag" : "ok",
    ...(schemaHit ? { kind: "schema_drift" } : {}),
  });

  const first = rows[0];
  if (!first) return steps;

  for (const key of ["s", "a"] as const) {
    if (!columns.includes(key)) continue; // mirrors check(): schema's job
    const got = first[key].length;
    const dimKind = key === "s" ? "state_dim" : "action_dim";
    const dimHit = flagOf(dimKind);
    steps.push({
      name: `${key} dims`,
      observed: String(got),
      expected: String(profile.dims[key]),
      verdict: dimHit ? "flag" : "ok",
      ...(dimHit ? { kind: dimKind } : {}),
    });
    const stats = profile.stats[key];
    for (let j = 0; j < Math.min(stats.length, got); j++) {
      const base = stats[j];
      if (!base) continue;
      const span = Math.max(base.max - base.min, 1e-9);
      const hit = violations.find((v) => v.kind === "value_scale" && v.detail.startsWith(`${key}[${j}]`));
      steps.push({
        name: `${key}[${j}] mean`,
        observed: mean(col(rows, key, j)).toFixed(1),
        expected: `${base.mean.toFixed(1)} (tol ${(SCALE_TOL * span).toFixed(1)})`,
        verdict: hit ? "flag" : "ok",
        ...(hit ? { kind: "value_scale" } : {}),
      });
    }
  }

  if (profile.period > 0) {
    const frameHit = flagOf("frame_rate");
    steps.push({
      name: "frame period",
      observed: `${median(episodePeriods(rows)).toFixed(3)}s`,
      expected: `${profile.period.toFixed(3)}s`,
      verdict: frameHit ? "flag" : "ok",
      ...(frameHit ? { kind: "frame_rate" } : {}),
    });
  }

  const episodes = [...byEpisode(rows).entries()].sort((a, b) => a[0] - b[0]);

  for (const [ep, g] of episodes) {
    steps.push({
      name: `ep ${ep} start`,
      observed: `t=${Math.min(...g.map((r) => r.t)).toFixed(2)}s`,
      expected: `t=${profile.tsStart.toFixed(2)}s (tol ${START_TOL.toFixed(2)}s)`,
      verdict: "info",
    });
  }
  const badStarts = episodes.filter(
    ([, g]) => Math.abs(Math.min(...g.map((r) => r.t)) - profile.tsStart) > START_TOL,
  ).length;
  const tsHit = flagOf("timestamp");
  steps.push({
    name: "ts alignment",
    observed: tsHit ? `${badStarts} episode(s) off` : "all aligned",
    expected: "0 off",
    verdict: tsHit ? "flag" : "ok",
    ...(tsHit ? { kind: "timestamp" } : {}),
  });

  const floor = profile.minEpLen * (1 - TRUNC_FRAC);
  for (const [ep, g] of episodes) {
    steps.push({
      name: `ep ${ep} frames`,
      observed: String(g.length),
      expected: `at least ${floor.toFixed(0)}`,
      verdict: "info",
    });
  }
  const short = episodes.filter(([, g]) => g.length < floor).length;
  const truncHit = flagOf("truncation");
  steps.push({
    name: "ep length",
    observed: truncHit ? `${short} episode(s) short` : "none short",
    expected: `all at least ${floor.toFixed(0)} frames`,
    verdict: truncHit ? "flag" : "ok",
    ...(truncHit ? { kind: "truncation" } : {}),
  });

  return steps;
}

// ---- corruptions (each keeps the table structurally plausible) --------------
const cloneRows = (rows: Row[]): Row[] => rows.map((r) => ({ ...r, s: [...r.s], a: [...r.a] }));

export type Corruption = { id: string; label: string; failure: string; fn: (ds: Dataset) => Dataset };

export const CORRUPTIONS: Corruption[] = [
  { id: "drop_state_dimension", label: "Dropped sensor channel", failure: "a channel silently stops being written", fn: (ds) => ({ columns: ds.columns, rows: cloneRows(ds.rows).map((r) => ({ ...r, s: r.s.slice(0, 1) })) }) },
  { id: "scale_flip_state", label: "Unit / scale flip", failure: "unit mismatch across sources", fn: (ds) => ({ columns: ds.columns, rows: cloneRows(ds.rows).map((r) => ({ ...r, s: [(r.s[0] ?? 0) * 0.3, ...r.s.slice(1)] })) }) },
  { id: "change_frame_rate", label: "Frame-rate drift", failure: "recorder rate changes; downstream assumes old dt", fn: (ds) => ({ columns: ds.columns, rows: cloneRows(ds.rows).map((r) => ({ ...r, t: Math.round(r.f * 0.05 * 100) / 100 })) }) },
  { id: "shift_timestamps", label: "Clock misalignment", failure: "cross-modal clock offset", fn: (ds) => ({ columns: ds.columns, rows: cloneRows(ds.rows).map((r) => ({ ...r, t: r.t + 1.0 })) }) },
  { id: "truncate_episodes", label: "Episode truncation", failure: "episodes truncated mid-recording", fn: (ds) => ({ columns: ds.columns, rows: truncate(ds.rows) }) },
  { id: "drift_schema", label: "Schema rename", failure: "upstream renames a required column", fn: (ds) => ({ columns: ds.columns.map((c) => (c === "s" ? "sx" : c)), rows: ds.rows }) },
];

function truncate(rows: Row[]): Row[] {
  const eps = [...new Set(rows.map((r) => r.e))].sort((a, b) => a - b);
  const targets = new Set(eps.slice(-3));
  const kept: Row[] = [];
  for (const [ep, g] of byEpisode(rows)) {
    kept.push(...(targets.has(ep) ? g.slice(0, Math.max(1, Math.floor(g.length * 0.3))) : g));
  }
  return kept;
}
