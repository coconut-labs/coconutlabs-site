"use client";

import { useMemo, useState } from "react";
import DemoShell, { type Outcome } from "@/components/demos/DemoShell";
import LiveLog, { type LogLine } from "@/components/demos/LiveLog";
import PresetButton from "@/components/demos/PresetButton";
import VerdictCard from "@/components/demos/VerdictCard";
import {
  fitContract,
  fitControl,
  check,
  controlFlags,
  contractSteps,
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
  // The check log only exists once a preset has been touched, so the route's
  // default render (and its visual baseline) is byte-identical.
  const [interacted, setInteracted] = useState(false);

  const active = DRIFTS.find((c) => c.id === activeId) ?? null;
  const ds = useMemo(() => (active ? active.fn(CLEAN) : CLEAN), [active]);
  const violations = check(contract, ds);
  const controlFlagged = controlFlags(fitted, ds);
  const guardrailFlagged = violations.length > 0;

  const rev = revenueUsd(ds);
  const refunds = refundCount(ds);
  const buckets = currencyBuckets(ds);

  // The morning load as it lands, then the contract's clauses: 240 row lines
  // straight from the (possibly drifted) table, then one line per clause from
  // contractSteps in contract.ts. Flagged lines are exactly check()'s
  // violations; nothing is invented for the animation.
  const steps = useMemo(() => contractSteps(contract, ds), [contract, ds]);
  const logLines = useMemo<LogLine[]>(
    () => [
      ...ds.rows.map((r, i) => ({
        content: (
          <>
            <span className="text-ink-2">#{String(i + 1).padStart(3, "0")}</span>{" "}
            <span className="text-ink-0">
              {typeof r.amount_minor === "number" ? r.amount_minor : `"${r.amount_minor}"`}
            </span>{" "}
            <span className="text-ink-1">{r.currency}</span> <span className="text-ink-1">{r.country}</span>{" "}
            <span className="text-ink-2">refund {String(r.is_refund)}</span>
          </>
        ),
      })),
      ...steps.map((s) => ({
        flagged: s.status === "violation",
        content: (
          <>
            <span className="text-ink-1">check {s.name}</span>{" "}
            {s.status === "violation" ? (
              <span className="text-danger">
                ✕ {s.violation?.kind}: {s.violation?.detail}
              </span>
            ) : s.status === "skipped" ? (
              <span className="text-ink-2">skipped, dtype failed upstream</span>
            ) : (
              <span className="text-success">✓ ok</span>
            )}
          </>
        ),
      })),
    ],
    [ds, steps],
  );

  // what the downstream report reads now vs clean
  const effect = active
    ? active.id === "boolean_encoding"
      ? `refund count reads ${refunds}, was ${cleanRefunds}`
      : active.id === "enum_expansion"
        ? `${buckets} currency buckets, was ${cleanBuckets}`
        : rev === null
          ? "the revenue sum can no longer run"
          : `revenue reads ${usd(rev)}, true is ${usd(cleanRev)}`
    : `revenue ${usd(cleanRev)} · ${cleanRefunds} refunds · ${cleanBuckets} currency buckets`;

  const reportBroken =
    active !== null &&
    (rev === null ||
      (active.id === "boolean_encoding" && refunds !== cleanRefunds) ||
      (active.id === "enum_expansion" && buckets !== cleanBuckets) ||
      (rev !== null && cleanRev !== null && Math.abs(rev - cleanRev) > 1));

  const outcome: Outcome = active
    ? controlFlagged
      ? {
          tone: "danger",
          label: "flagged by both",
          headline: `Both checks flagged ${active.label.toLowerCase()}: values left the observed range. This is the one loud drift a standard check can catch.`,
          detail: violations[0] ? `${violations[0].kind}: ${violations[0].detail}` : undefined,
        }
      : {
          tone: "danger",
          label: "flagged by the contract only",
          headline: `The contract flagged ${active.label.toLowerCase()} while the standard check passed. Downstream, ${effect}.`,
          detail: violations.map((v) => `${v.kind}: ${v.detail}`).join(" · "),
        }
    : {
        tone: "success",
        label: "clean pass",
        headline: `The table as landed passes both checks. The report reads ${effect}.`,
      };

  return (
    <DemoShell
      scenario={`You are the analytics engineer. This morning's load is ${CLEAN.rows.length} rows of an ELT landing table, and it may carry one of these drifts. The real contract runs in your browser, computed live, not canned.`}
      controlsLabel="inject a drift"
      controls={
        <div className="flex flex-wrap gap-2">
          <PresetButton
            active={activeId === null}
            onClick={() => {
              setActiveId(null);
              setInteracted(true);
            }}
          >
            Clean data
          </PresetButton>
          {DRIFTS.map((c) => (
            <PresetButton
              key={c.id}
              danger
              active={activeId === c.id}
              onClick={() => {
                setActiveId(c.id);
                setInteracted(true);
              }}
            >
              {c.label}
            </PresetButton>
          ))}
        </div>
      }
      outcome={outcome}
      footnote={
        <>
          {active
            ? `Injected: ${active.failure}. ${active.silent ? "Column stays present, non-null, in-range." : "Values leave the observed range."}`
            : "Baseline: the table as landed. Nothing should fire."}{" "}
          Same contract and standard check as the Python harness; verified to reproduce its 6/6-vs-1/6 verdicts on this
          table. The one drift the standard check catches is the only one that leaves the observed range.
        </>
      }
    >
      {/* the load and the contract run, replayed at reading speed. The banner
          above already stated the verdict; the flagged counter lands on the
          same violation count. */}
      {interacted ? (
        <div className="mb-4">
          <LiveLog
            title="contract · check log"
            lines={logLines}
            counterNoun="steps"
            flaggedNoun="flagged"
            linesPerTick={3}
            tickMs={60}
          />
        </div>
      ) : null}

      {/* two verdicts */}
      <div className="grid gap-4 sm:grid-cols-2">
        <VerdictCard
          name="The contract guardrail"
          flagged={guardrailFlagged}
          good={active === null ? !guardrailFlagged : guardrailFlagged}
          detail={
            guardrailFlagged
              ? violations.map((v) => `${v.kind}: ${v.detail}`).join(" · ")
              : "no violations, clean data passes"
          }
        />
        <VerdictCard
          name="Standard schema / null / row-count check"
          flagged={controlFlagged}
          good={active === null ? !controlFlagged : controlFlagged}
          detail={
            controlFlagged
              ? "rejected: a value left the observed range"
              : active
                ? "passed, column present, non-null, in-range, same row count, so it waves the drift through"
                : "passed, clean data is valid"
          }
        />
      </div>

      {/* downstream effect */}
      <div className="mt-4 rounded-lg border border-rule bg-bg-2/40 p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs text-ink-1">Downstream report</span>
          <span className={`font-mono text-xs ${reportBroken ? "text-danger" : "text-ink-2"}`}>
            {active ? (active.silent ? "no error · wrong number" : "out of range") : "baseline"}
          </span>
        </div>
        <p className="mt-3 font-mono text-[0.72rem] leading-5 text-ink-2">{effect}</p>
      </div>
    </DemoShell>
  );
}
