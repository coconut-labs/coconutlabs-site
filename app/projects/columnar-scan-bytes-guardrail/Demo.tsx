"use client";

import { useState } from "react";
import {
  COLUMNS,
  COLUMN_NAMES,
  N_ROWS,
  readReport,
  bytesReadRow,
  CITED_MEASURED,
  type Layout,
} from "./scan";

// Three queries over the same 12-column table — each needs only a slice of the row.
const QUERIES: { id: string; label: string; projection: string[] }[] = [
  { id: "by_country_device", label: "sessions by country + device", projection: ["country", "device"] },
  { id: "top_urls", label: "top URLs", projection: ["url"] },
  { id: "row_export", label: "full row export", projection: [...COLUMN_NAMES] },
];

const fmtBytes = (n: number): string => {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} MB`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)} KB`;
  return `${n} B`;
};

export default function Demo() {
  const [queryId, setQueryId] = useState("by_country_device");
  const [layout, setLayout] = useState<Layout>("columnar");

  const query = QUERIES.find((q) => q.id === queryId) ?? QUERIES[0]!;
  const projection = query.projection;
  const readSet = layout === "row" ? new Set(COLUMN_NAMES) : new Set(projection);

  const report = readReport(projection, layout);
  const flagged = report.flagged;

  return (
    <div className="rounded-lg border border-rule bg-bg-1/60 p-6 md:p-8">
      <p className="font-mono text-xs uppercase text-ink-2">run it yourself</p>
      <p className="mt-3 max-w-2xl text-base leading-7 text-ink-1">
        The same {N_ROWS.toLocaleString()}-row, {COLUMN_NAMES.length}-column table, live in your browser. Pick a query
        and a storage layout, and watch the guardrail read the <em>bytes</em>, not the rows, the correctness check only
        sees that the answer is right.
      </p>

      {/* query picker */}
      <div className="mt-6 flex flex-wrap gap-2">
        {QUERIES.map((q) => (
          <button
            key={q.id}
            type="button"
            onClick={() => setQueryId(q.id)}
            className={`focus-ring rounded-sm border px-3 py-1.5 font-mono text-xs transition ${
              q.id === queryId ? "border-accent/50 bg-accent/10 text-accent" : "border-rule text-ink-1 hover:text-accent"
            }`}
          >
            {q.label}
            <span className="ml-1 text-ink-2">· {q.projection.length}/{COLUMN_NAMES.length} col</span>
          </button>
        ))}
      </div>

      {/* layout toggle */}
      <div className="mt-4 inline-flex overflow-hidden rounded-sm border border-rule font-mono text-xs">
        <button
          type="button"
          onClick={() => setLayout("columnar")}
          className={`focus-ring px-4 py-2 transition ${layout === "columnar" ? "bg-accent/10 text-accent" : "text-ink-1 hover:text-accent"}`}
        >
          Columnar + projection
        </button>
        <button
          type="button"
          onClick={() => setLayout("row")}
          className={`focus-ring border-l border-rule px-4 py-2 transition ${layout === "row" ? "bg-danger/10 text-danger" : "text-ink-1 hover:text-danger"}`}
        >
          Row layout
        </button>
      </div>

      {/* column strip: which columns get physically read */}
      <div className="mt-6 flex flex-wrap gap-1.5">
        {COLUMN_NAMES.map((c) => {
          const read = readSet.has(c);
          const needed = projection.includes(c);
          return (
            <span
              key={c}
              className={`rounded-sm border px-2 py-1 font-mono text-[0.7rem] ${
                needed
                  ? "border-accent/50 bg-accent/10 text-accent"
                  : read
                  ? "border-danger/40 bg-danger/5 text-danger"
                  : "border-rule/60 text-ink-2"
              }`}
              title={`${COLUMNS[c] ?? 0} bytes/row`}
            >
              {c}
            </span>
          );
        })}
      </div>
      <p className="mt-2 font-mono text-[0.68rem] text-ink-2">
        <span className="text-accent">needed by the query</span> ·{" "}
        <span className="text-danger">read but not needed</span> · <span className="text-ink-2">skipped</span>
      </p>

      {/* bytes-read meter */}
      <div className="mt-6 rounded-lg border border-rule bg-bg-2/40 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="font-mono text-xs text-ink-1">Bytes read</span>
          <span className="font-mono text-lg text-ink-0">{fmtBytes(report.bytesRead)}</span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-bg-1">
          <div
            className={`h-full ${flagged ? "bg-danger" : "bg-success"}`}
            style={{ width: `${Math.min(100, (report.bytesRead / bytesReadRow()) * 100)}%` }}
          />
        </div>
        <p className="mt-2 font-mono text-[0.7rem] text-ink-2">
          projection needs {fmtBytes(report.budget)} · this read is {report.overRead.toFixed(1)}x that
        </p>
      </div>

      {/* two verdicts, side by side */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-rule bg-bg-2/40 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-ink-1">Bytes-read guardrail</span>
            <span className={`inline-flex items-center gap-1 font-mono text-xs ${flagged ? "text-danger" : "text-success"}`}>
              {flagged ? <span aria-hidden="true">✕</span> : <span aria-hidden="true">✓</span>}
              {flagged ? "FLAGGED" : "passes"}
            </span>
          </div>
          <p className="mt-2 font-mono text-[0.68rem] leading-5 text-ink-2">
            {flagged
              ? `${report.overRead.toFixed(1)}x over-read, this touches columns the query never asked for.`
              : report.overRead === 1
              ? `the query needs every column, so a full read IS minimal, the guardrail flags waste, not scans.`
              : `within budget, only the projected columns were read.`}
          </p>
        </div>
        <div className="rounded-lg border border-rule bg-bg-2/40 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-ink-1">Correctness control</span>
            <span className="inline-flex items-center gap-1 font-mono text-xs text-success">
              <span aria-hidden="true">✓</span> right rows
            </span>
          </div>
          <p className="mt-2 font-mono text-[0.68rem] leading-5 text-ink-2">
            the answer is identical whichever layout you pick, so this check passes even the full scan.
          </p>
        </div>
      </div>

      <p className="mt-5 font-mono text-[0.7rem] leading-5 text-ink-2">
        Bytes here are the deterministic model. On a real Parquet file the Python harness measured the same effect for
        real: the projected read touched {fmtBytes(CITED_MEASURED.parquetProjectedBytes)} versus{" "}
        {fmtBytes(CITED_MEASURED.parquetFullBytes)} for the full scan of the same file,{" "}
        {CITED_MEASURED.parquetOverReadX}x, and {CITED_MEASURED.csvOverReadX}x against a row-oriented CSV.
      </p>
    </div>
  );
}
