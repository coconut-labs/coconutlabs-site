"use client";

import { useMemo, useState } from "react";
import {
  fitContract,
  fitControl,
  check,
  controlFlags,
  revenueUsd,
  refundCount,
  currencyBuckets,
  DRIFTS,
  type Dataset,
  type Row,
} from "./contract";
import sample from "./sample.json";

const CLEAN: Dataset = { columns: sample.columns as string[], rows: sample.rows as Row[] };
const usd = (n: number | null) => (n === null ? "sum crashes" : `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

export default function Demo() {
  const contract = useMemo(() => fitContract(CLEAN), []);
  const fitted = useMemo(() => fitControl(CLEAN), []);
  const cleanRev = useMemo(() => revenueUsd(CLEAN), []);
  const cleanRefunds = useMemo(() => refundCount(CLEAN), []);
  const cleanBuckets = useMemo(() => currencyBuckets(CLEAN), []);
  const [activeId, setActiveId] = useState<string | null>(null);

  const active = DRIFTS.find((c) => c.id === activeId) ?? null;
  const ds = active ? active.fn(CLEAN) : CLEAN;
  const violations = check(contract, ds);
  const controlFlagged = controlFlags(fitted, ds);
  const guardrailFlagged = violations.length > 0;

  const rev = revenueUsd(ds);
  const refunds = refundCount(ds);
  const buckets = currencyBuckets(ds);

  // what the downstream report reads now vs clean
  const effect = active
    ? active.id === "boolean_encoding"
      ? `refund count reads ${refunds} — was ${cleanRefunds}`
      : active.id === "enum_expansion"
        ? `${buckets} currency buckets — was ${cleanBuckets}`
        : rev === null
          ? "the revenue sum can no longer run"
          : `revenue reads ${usd(rev)} — true is ${usd(cleanRev)}`
    : `revenue ${usd(cleanRev)} · ${cleanRefunds} refunds · ${cleanBuckets} currency buckets`;

  return (
    <div className="rounded-lg border border-rule bg-bg-1/60 p-6 md:p-8">
      <p className="font-mono text-xs uppercase text-ink-2">run it yourself</p>
      <p className="mt-3 max-w-2xl text-base leading-7 text-ink-1">
        This runs the real guardrail in your browser on {CLEAN.rows.length} rows of a synthetic ELT landing table.
        Inject a drift and watch the contract catch what the standard schema / null / row-count check misses — and
        what it does to the number the report emits. Computed live, not canned.
      </p>

      {/* selector */}
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveId(null)}
          className={`focus-ring rounded-sm border px-3 py-1.5 font-mono text-xs transition ${
            activeId === null ? "border-accent bg-accent/10 text-accent" : "border-rule text-ink-1 hover:border-accent"
          }`}
        >
          Clean data
        </button>
        {DRIFTS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActiveId(c.id)}
            className={`focus-ring rounded-sm border px-3 py-1.5 font-mono text-xs transition ${
              activeId === c.id ? "border-accent bg-accent/10 text-accent" : "border-rule text-ink-1 hover:border-accent"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {active ? (
        <p className="mt-4 font-mono text-xs text-ink-2">
          Injected: {active.failure}. {active.silent ? "Column stays present, non-null, in-range." : "Values leave the observed range."}
        </p>
      ) : (
        <p className="mt-4 font-mono text-xs text-ink-2">Baseline: the table as landed. Nothing should fire.</p>
      )}

      {/* two verdicts */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Verdict
          name="The contract guardrail"
          flagged={guardrailFlagged}
          good={active === null ? !guardrailFlagged : guardrailFlagged}
          detail={
            guardrailFlagged
              ? violations.map((v) => `${v.kind}: ${v.detail}`).join(" · ")
              : "no violations — clean data passes"
          }
        />
        <Verdict
          name="Standard schema / null / row-count check"
          flagged={controlFlagged}
          good={active === null ? !controlFlagged : controlFlagged}
          detail={
            controlFlagged
              ? "rejected: a value left the observed range"
              : active
                ? "passed — column present, non-null, in-range, same row count, so it waves the drift through"
                : "passed — clean data is valid"
          }
        />
      </div>

      {/* downstream effect */}
      <div className="mt-4 rounded-lg border border-rule bg-bg-2/40 p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs text-ink-1">Downstream report</span>
          <span className={`font-mono text-xs ${active && (rev === null || (active.id === "boolean_encoding" && refunds !== cleanRefunds) || (active.id === "enum_expansion" && buckets !== cleanBuckets) || (rev !== null && cleanRev !== null && Math.abs(rev - cleanRev) > 1)) ? "text-danger" : "text-ink-2"}`}>
            {active ? (active.silent ? "no error · wrong number" : "out of range") : "baseline"}
          </span>
        </div>
        <p className="mt-3 font-mono text-[0.72rem] leading-5 text-ink-2">{effect}</p>
      </div>

      <p className="mt-5 font-mono text-[0.7rem] leading-5 text-ink-2">
        Same contract and standard check as the Python harness; verified to reproduce its 6/6-vs-1/6 verdicts on this
        table. The one drift the standard check catches is the only one that leaves the observed range.
      </p>
    </div>
  );
}

function Verdict({ name, flagged, good, detail }: { name: string; flagged: boolean; good: boolean; detail: string }) {
  return (
    <div className="rounded-lg border border-rule bg-bg-2/40 p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-ink-1">{name}</span>
        <span className={`inline-flex items-center gap-1 font-mono text-xs ${good ? "text-success" : "text-danger"}`}>
          {good ? <span aria-hidden="true">✓</span> : <span aria-hidden="true">✕</span>}
          {flagged ? "flagged" : "passed"}
        </span>
      </div>
      <p className="mt-3 font-mono text-[0.72rem] leading-5 text-ink-2">{detail}</p>
    </div>
  );
}
