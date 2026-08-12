// TS port of the columnar-scan bytes-read guardrail (columnar-scan-bytes-guardrail repo).
// The read model + guardrail are the pure, deterministic core — same integer
// arithmetic as layout/read_model.py + guardrail/scan_check.py, so the same
// (projection, layout) yields the same bytes and the same verdict.
// Parity target: model.row_bytes / model.columnar_bytes / verdicts in results/scan.json.
//
// The measured real-Parquet figures (compression, encoding) come from the Python
// harness and are cited here as constants — a live browser number would drift from
// the evidence file, so we don't fake one.

// name -> modelled bytes-per-row. Must match layout/schema.py COLUMNS exactly.
export const COLUMNS: Record<string, number> = {
  event_id: 8,
  session_id: 8,
  user_id: 8,
  ts: 8,
  country: 2,
  device: 2,
  browser: 3,
  os: 3,
  url: 48,
  referrer: 44,
  user_agent: 96,
  payload: 128,
};

export const COLUMN_NAMES: readonly string[] = Object.keys(COLUMNS);
export const N_ROWS = 200_000;
export const QUERY_PROJECTION: readonly string[] = ["country", "device"];
export const TOL_PCT = 200; // allow up to 2x the projection's bytes

export type Layout = "row" | "columnar";
export type Violation = { kind: string; bytesRead: number; budget: number; detail: string };

export const totalWidth = (): number =>
  COLUMN_NAMES.reduce((a, c) => a + (COLUMNS[c] ?? 0), 0);

export const projectedWidth = (projection: readonly string[]): number =>
  projection.reduce((a, c) => a + (COLUMNS[c] ?? 0), 0);

// Row layout must touch every column to answer any query; columnar-with-pushdown
// reads only the projected columns.
export const bytesReadRow = (nRows: number = N_ROWS): number => nRows * totalWidth();
export const bytesReadColumnar = (projection: readonly string[], nRows: number = N_ROWS): number =>
  nRows * projectedWidth(projection);

// The bytes the query actually needs — the minimum a correct reader would touch.
export const projectionBudget = (projection: readonly string[], nRows: number = N_ROWS): number =>
  nRows * projectedWidth(projection);

// The guardrail: flag a read that exceeds tolerance * the projection budget.
// Integer comparison (bytesRead*100 > budget*tolPct) so Python and TS agree exactly.
export function checkScan(bytesRead: number, budget: number, tolPct: number = TOL_PCT): Violation[] {
  if (bytesRead * 100 > budget * tolPct) {
    const over = budget ? bytesRead / budget : Infinity;
    return [
      {
        kind: "full_scan",
        bytesRead,
        budget,
        detail: `read ${bytesRead.toLocaleString()} bytes for a projection needing ${budget.toLocaleString()} (${over.toFixed(1)}x over-read)`,
      },
    ];
  }
  return [];
}

export type ReadReport = {
  bytesRead: number;
  budget: number;
  flagged: boolean;
  overRead: number;
};

export function readReport(projection: readonly string[], layout: Layout, nRows: number = N_ROWS): ReadReport {
  const budget = projectionBudget(projection, nRows);
  const bytesRead = layout === "row" ? bytesReadRow(nRows) : bytesReadColumnar(projection, nRows);
  const flagged = checkScan(bytesRead, budget).length > 0;
  return { bytesRead, budget, flagged, overRead: budget ? bytesRead / budget : Infinity };
}

// ---- per-batch read log -----------------------------------------------------
// The same deterministic read, split into fixed row batches so the demo can
// stream it as a live log. Additive: nothing above this line changes. The sum
// of step bytes equals bytesReadRow / bytesReadColumnar exactly, and each
// batch runs through the same checkScan guardrail against its own slice of
// the projection budget. Widths are uniform per row, so a batch flags exactly
// when the whole read flags.
export const SCAN_BATCHES = 64;

export type ScanStep = {
  /** 1-based batch index. */
  batch: number;
  /** Rows this batch covers. */
  rows: number;
  /** Columns physically touched: all of them in row layout, the projection in columnar. */
  colsRead: number;
  /** Bytes this batch touched. */
  bytes: number;
  /** Running total after this batch. The last step's value equals readReport().bytesRead. */
  totalBytes: number;
  /** checkScan on this batch's bytes against this batch's projection budget. */
  flagged: boolean;
};

export function scanSteps(
  projection: readonly string[],
  layout: Layout,
  nRows: number = N_ROWS,
  batches: number = SCAN_BATCHES,
): ScanStep[] {
  const width = layout === "row" ? totalWidth() : projectedWidth(projection);
  const colsRead = layout === "row" ? COLUMN_NAMES.length : projection.length;
  const base = Math.floor(nRows / batches);
  const steps: ScanStep[] = [];
  let total = 0;
  for (let i = 0; i < batches; i++) {
    const rows = i === batches - 1 ? nRows - base * (batches - 1) : base;
    const bytes = rows * width;
    total += bytes;
    steps.push({
      batch: i + 1,
      rows,
      colsRead,
      bytes,
      totalBytes: total,
      flagged: checkScan(bytes, projectionBudget(projection, rows)).length > 0,
    });
  }
  return steps;
}

// Cited, measured by the Python harness (real Parquet + CSV, byte-counted) — not
// recomputed live. See results/scan.json.
export const CITED_MEASURED = {
  parquetProjectedBytes: 192_508,
  parquetFullBytes: 8_613_359,
  csvRowBytes: 88_505_840,
  parquetOverReadX: 44.7,
  csvOverReadX: 459.8,
} as const;
