// TS port of the schema-drift contract guardrail (ingestion-data-contract-guardrail repo).
// Same drifts, same contract, same standard control -- so the same landing table yields
// the same verdicts. Parity target: guardrail 6/6, standard check 1/6 (results/contract.json).

export type Cell = number | string;
export type Row = {
  order_id: number;
  amount_minor: Cell; // int in clean; a subset becomes text under the type-widening drift
  currency: string;
  country: string;
  is_refund: string;
  event_ts: number;
};
export type Dataset = { columns: string[]; rows: Row[] };
export type Violation = { kind: string; detail: string };

const MAGNITUDE_TOL = 0.2;
const GRANULARITY_CEIL = 0.1;

const DECLARED_DTYPE: Record<string, "int" | "str"> = {
  order_id: "int",
  amount_minor: "int",
  currency: "str",
  country: "str",
  is_refund: "str",
  event_ts: "int",
};
const ENUM_DOMAINS: Record<string, Set<string>> = {
  currency: new Set(["USD", "EUR", "GBP"]),
  country: new Set(["US", "GB", "DE", "FR"]),
  is_refund: new Set(["true", "false"]),
};

const isNum = (v: Cell): v is number => typeof v === "number";
const nums = (rows: Row[], key: keyof Row): number[] => {
  const out: number[] = [];
  for (const r of rows) {
    const v = r[key];
    if (typeof v === "number") out.push(v);
  }
  return out;
};
const mean = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const fracDivisible = (xs: number[]): number => (xs.length ? xs.filter((x) => x % 100 === 0).length / xs.length : 0);
const allNumbers = (rows: Row[], key: keyof Row): boolean => rows.every((r) => typeof r[key] === "number");

// ---- contract ---------------------------------------------------------------
export type Contract = { amountMean: number; granularity: number };

export function fitContract(clean: Dataset): Contract {
  const amt = nums(clean.rows, "amount_minor");
  return { amountMean: mean(amt), granularity: fracDivisible(amt) };
}

export function check(contract: Contract, ds: Dataset): Violation[] {
  const out: Violation[] = [];
  const { rows, columns } = ds;

  // 1. declared dtype
  const dtypeOk: Record<string, boolean> = {};
  for (const col of Object.keys(DECLARED_DTYPE)) {
    const decl = DECLARED_DTYPE[col];
    if (!columns.includes(col)) {
      out.push({ kind: "missing_column", detail: `declared column '${col}' absent` });
      dtypeOk[col] = false;
      continue;
    }
    const ok = decl === "int" ? rows.every((r) => isNum(r[col as keyof Row])) : rows.every((r) => typeof r[col as keyof Row] === "string");
    dtypeOk[col] = ok;
    if (!ok) {
      const bad = rows.find((r) => (decl === "int" ? !isNum(r[col as keyof Row]) : typeof r[col as keyof Row] !== "string"));
      out.push({ kind: "type_drift", detail: `'${col}' holds a ${typeof (bad ? bad[col as keyof Row] : "")}, contract declares ${decl}` });
    }
  }

  // 2. enum domain
  for (const col of Object.keys(ENUM_DOMAINS)) {
    if (!columns.includes(col) || !dtypeOk[col]) continue;
    const domain = ENUM_DOMAINS[col];
    if (!domain) continue;
    const extra = new Set<string>();
    for (const r of rows) {
      const v = String(r[col as keyof Row]);
      if (!domain.has(v)) extra.add(v);
    }
    if (extra.size) out.push({ kind: "enum_drift", detail: `'${col}' has values outside its domain: ${[...extra].sort().slice(0, 4).join(", ")}` });
  }

  // 3. magnitude band on the money column
  if (dtypeOk["amount_minor"]) {
    const amt = nums(rows, "amount_minor");
    const m = mean(amt);
    const rel = Math.abs(m - contract.amountMean) / Math.max(contract.amountMean, 1e-9);
    if (rel > MAGNITUDE_TOL) {
      out.push({ kind: "scale_drift", detail: `amount_minor mean ${m.toFixed(0)} is ${(rel * 100).toFixed(0)}% off the contract mean ${contract.amountMean.toFixed(0)} (> ${MAGNITUDE_TOL * 100}%)` });
    }
    // 4. granularity / precision signature
    const frac = fracDivisible(amt);
    if (frac > GRANULARITY_CEIL && frac > contract.granularity + 0.05) {
      out.push({ kind: "precision_drift", detail: `${(frac * 100).toFixed(0)}% of amount_minor values are whole dollars (baseline ${(contract.granularity * 100).toFixed(0)}%)` });
    }
  }

  return out;
}

// ---- per-clause check log ---------------------------------------------------
// The same check() run, unrolled into one step per contract clause so the demo
// can stream it as a live log. Additive: check() itself is untouched; this
// calls it and maps each returned violation onto the clause that produced it.
// Kinds are disjoint per clause and column-level details always carry the
// quoted column name, so every violation lands on exactly one step and the
// count of "violation" steps always equals check().length.
export type ContractStep = {
  /** Clause name, e.g. "dtype amount_minor" or "enum currency". */
  name: string;
  /** "skipped" mirrors check(): downstream clauses do not run on a column whose dtype failed. */
  status: "ok" | "violation" | "skipped";
  violation: Violation | null;
};

export function contractSteps(contract: Contract, ds: Dataset): ContractStep[] {
  const violations = check(contract, ds);
  const forCol = (kinds: string[], col: string): Violation | null =>
    violations.find((v) => kinds.includes(v.kind) && v.detail.includes(`'${col}'`)) ?? null;
  const dtypeBad = (col: string): boolean => forCol(["missing_column", "type_drift"], col) !== null;

  const steps: ContractStep[] = [];
  for (const col of Object.keys(DECLARED_DTYPE)) {
    const v = forCol(["missing_column", "type_drift"], col);
    steps.push({ name: `dtype ${col}`, status: v ? "violation" : "ok", violation: v });
  }
  for (const col of Object.keys(ENUM_DOMAINS)) {
    const v = forCol(["enum_drift"], col);
    steps.push({ name: `enum ${col}`, status: v ? "violation" : dtypeBad(col) ? "skipped" : "ok", violation: v });
  }
  const amountBad = dtypeBad("amount_minor");
  const scale = violations.find((v) => v.kind === "scale_drift") ?? null;
  steps.push({
    name: "magnitude amount_minor",
    status: scale ? "violation" : amountBad ? "skipped" : "ok",
    violation: scale,
  });
  const precision = violations.find((v) => v.kind === "precision_drift") ?? null;
  steps.push({
    name: "granularity amount_minor",
    status: precision ? "violation" : amountBad ? "skipped" : "ok",
    violation: precision,
  });
  return steps;
}

// ---- the off-the-shelf control: schema (dtype+range) + null + rowcount, at defaults
export type Fitted = { rows: number; range: Record<string, { min: number; max: number }> };
const NUMERIC_COLS = ["order_id", "amount_minor", "event_ts"] as const;

export function fitControl(clean: Dataset): Fitted {
  const range: Record<string, { min: number; max: number }> = {};
  for (const col of NUMERIC_COLS) {
    const xs = nums(clean.rows, col);
    range[col] = { min: Math.min(...xs), max: Math.max(...xs) };
  }
  return { rows: clean.rows.length, range };
}

export function controlFlags(fitted: Fitted, ds: Dataset): boolean {
  // row-count equality
  if (ds.rows.length !== fitted.rows) return true;
  // null-ratio equality (no column is ever nulled here, so any null is a change)
  for (const r of ds.rows) {
    for (const v of Object.values(r)) if (v === null || v === undefined || v === "") return true;
  }
  // inferred numeric range -- but, like pandera at defaults, only enforced when the
  // column is still purely numeric. A widened (mixed number/text) column is object,
  // and the inferred range is not enforced on object columns -> it passes.
  for (const col of NUMERIC_COLS) {
    if (!allNumbers(ds.rows, col)) continue;
    const band = fitted.range[col];
    if (!band) continue;
    for (const v of nums(ds.rows, col)) if (v < band.min || v > band.max) return true;
  }
  return false;
}

// ---- downstream aggregation -------------------------------------------------
export function revenueUsd(ds: Dataset): number | null {
  if (!allNumbers(ds.rows, "amount_minor")) return null; // the sum cannot run
  return Math.round((nums(ds.rows, "amount_minor").reduce((a, b) => a + b, 0) / 100) * 100) / 100;
}
export const refundCount = (ds: Dataset): number => ds.rows.filter((r) => String(r.is_refund) === "true").length;
export const currencyBuckets = (ds: Dataset): number => new Set(ds.rows.map((r) => r.currency)).size;

// ---- drifts (deterministic transforms of the shared clean table) ------------
const clone = (ds: Dataset): Dataset => ({ columns: [...ds.columns], rows: ds.rows.map((r) => ({ ...r })) });
const setAt = (ds: Dataset, idx: number[], mut: (r: Row) => void): Dataset => {
  const out = clone(ds);
  for (const i of idx) {
    const r = out.rows[i];
    if (r) mut(r);
  }
  return out;
};
const every = (n: number, k: number, from = 0): number[] => {
  const out: number[] = [];
  for (let i = from; i < n; i += k) out.push(i);
  return out;
};
const whereEvery = (rows: Row[], pred: (r: Row) => boolean, k: number): number[] => {
  const hits: number[] = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (r && pred(r)) hits.push(i);
  }
  return hits.filter((_, j) => j % k === 0);
};

export type Corruption = { id: string; label: string; failure: string; silent: boolean; fn: (ds: Dataset) => Dataset };

export const DRIFTS: Corruption[] = [
  {
    id: "partial_unit_scale",
    label: "Partial unit change",
    failure: "a subset switch cents -> dollars",
    silent: true,
    fn: (ds) => {
      const amt = nums(ds.rows, "amount_minor");
      const floor = Math.min(...amt) * 100;
      const idx = whereEvery(ds.rows, (r) => isNum(r.amount_minor) && r.amount_minor >= floor, 2);
      return setAt(ds, idx, (r) => {
        if (isNum(r.amount_minor)) r.amount_minor = Math.floor(r.amount_minor / 100);
      });
    },
  },
  {
    id: "precision_truncation",
    label: "Precision truncation",
    failure: "amounts floored to whole dollars",
    silent: true,
    fn: (ds) => {
      const idx = whereEvery(ds.rows, (r) => isNum(r.amount_minor) && r.amount_minor >= 1000, 3);
      return setAt(ds, idx, (r) => {
        if (isNum(r.amount_minor)) r.amount_minor = Math.floor(r.amount_minor / 100) * 100;
      });
    },
  },
  {
    id: "enum_expansion",
    label: "New enum value",
    failure: "an unannounced CAD currency appears",
    silent: true,
    fn: (ds) => setAt(ds, every(ds.rows.length, 11), (r) => (r.currency = "CAD")),
  },
  {
    id: "boolean_encoding",
    label: "Boolean re-encoding",
    failure: "'true' arrives as 'TRUE' / '1' / 'yes'",
    silent: true,
    fn: (ds) => {
      const idx = whereEvery(ds.rows, (r) => r.is_refund === "true", 1);
      const vals = ["TRUE", "1", "yes"];
      const out = clone(ds);
      idx.forEach((i, j) => {
        const r = out.rows[i];
        if (r) r.is_refund = vals[j % vals.length] ?? "true";
      });
      return out;
    },
  },
  {
    id: "type_widening",
    label: "Type widening",
    failure: "amounts arrive as text (int -> object)",
    silent: true,
    fn: (ds) =>
      setAt(ds, every(ds.rows.length, 4), (r) => {
        if (isNum(r.amount_minor)) r.amount_minor = String(r.amount_minor);
      }),
  },
  {
    id: "amount_overflow",
    label: "Out-of-range scale",
    failure: "a subset arrives x1000 (micro-units)",
    silent: false,
    fn: (ds) =>
      setAt(ds, every(ds.rows.length, 4), (r) => {
        if (isNum(r.amount_minor)) r.amount_minor = r.amount_minor * 1000;
      }),
  },
];
