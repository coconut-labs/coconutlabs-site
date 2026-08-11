"use client";

import { useState } from "react";
import DemoShell, { type Outcome } from "@/components/demos/DemoShell";
import PresetButton from "@/components/demos/PresetButton";
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

  const outcome: Outcome = flagged
    ? {
        tone: "danger",
        label: "flagged by the guardrail only",
        headline: `This read touched ${fmtBytes(report.bytesRead)}, ${report.overRead.toFixed(1)}x what the query needed. The rows came back right, so the correctness check stays green.`,
        detail: `projection needs ${fmtBytes(report.budget)} · guardrail flags when bytes read exceed tolerance x budget`,
      }
    : report.overRead === 1 && projection.length === COLUMN_NAMES.length
      ? {
          tone: "success",
          label: "within budget",
          headline: "The query needs every column, so a full read is minimal. The guardrail flags waste, not scans.",
          detail: `bytes read ${fmtBytes(report.bytesRead)} · budget ${fmtBytes(report.budget)}`,
        }
      : {
          tone: "success",
          label: "within budget",
          headline: `Only the projected columns were read: ${fmtBytes(report.bytesRead)} against a budget of ${fmtBytes(report.budget)}. Same right rows, a fraction of the bytes.`,
        };

  return (
    <DemoShell
      scenario={`You are the analytics engineer. The same ${N_ROWS.toLocaleString()}-row, ${COLUMN_NAMES.length}-column table sits under every query. Pick a query and a storage layout; the guardrail counts the bytes the read actually touches.`}
      controlsLabel="pick a query and a layout"
      controls={
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {QUERIES.map((q) => (
              <PresetButton key={q.id} active={q.id === queryId} onClick={() => setQueryId(q.id)}>
                {q.label}
                <span className="ml-1 text-ink-2">· {q.projection.length}/{COLUMN_NAMES.length} col</span>
              </PresetButton>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <PresetButton active={layout === "columnar"} onClick={() => setLayout("columnar")}>
              Columnar + projection
            </PresetButton>
            <PresetButton danger active={layout === "row"} onClick={() => setLayout("row")}>
              Row layout
            </PresetButton>
          </div>
        </div>
      }
      outcome={outcome}
      footnote={
        <>
          Bytes here are the deterministic model. On a real Parquet file the Python harness measured the same effect for
          real: the projected read touched {fmtBytes(CITED_MEASURED.parquetProjectedBytes)} versus{" "}
          {fmtBytes(CITED_MEASURED.parquetFullBytes)} for the full scan of the same file,{" "}
          {CITED_MEASURED.parquetOverReadX}x, and {CITED_MEASURED.csvOverReadX}x against a row-oriented CSV.
        </>
      }
    >
      {/* column strip: which columns get physically read */}
      <div className="flex flex-wrap gap-1.5">
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

      {/* the control's verdict, for contrast */}
      <div className="mt-4 rounded-lg border border-rule bg-bg-2/40 p-4">
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
    </DemoShell>
  );
}
