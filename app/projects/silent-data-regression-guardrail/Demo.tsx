"use client";

import { useMemo, useState } from "react";
import { fitProfile, check, schemaControlFlags, CORRUPTIONS, type Dataset, type Row } from "./guardrail";
import sample from "./sample.json";

const CLEAN: Dataset = { columns: ["s", "a", "e", "f", "t"], rows: sample.rows as Row[] };

export default function Demo() {
  const profile = useMemo(() => fitProfile(CLEAN), []);
  const [activeId, setActiveId] = useState<string | null>(null);

  const active = CORRUPTIONS.find((c) => c.id === activeId) ?? null;
  const ds = active ? active.fn(CLEAN) : CLEAN;
  const violations = check(profile, ds);
  const controlFlagged = schemaControlFlags(profile, ds);
  const guardrailFlagged = violations.length > 0;

  return (
    <div className="rounded-lg border border-rule bg-bg-1/60 p-6 md:p-8">
      <p className="font-mono text-xs uppercase text-ink-2">run it yourself</p>
      <p className="mt-3 max-w-2xl text-base leading-7 text-ink-1">
        This runs the real guardrail in your browser on {CLEAN.rows.length} rows of{" "}
        <span className="font-mono">lerobot/pusht</span>. Inject a corruption and watch the guardrail catch what the
        schema contract misses, computed live, not canned.
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
        {CORRUPTIONS.map((c) => (
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
        <p className="mt-4 font-mono text-xs text-ink-2">Injected: {active.failure}.</p>
      ) : (
        <p className="mt-4 font-mono text-xs text-ink-2">Baseline: the data as recorded. Nothing should fire.</p>
      )}

      {/* two verdicts */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Verdict
          name="The guardrail"
          flagged={guardrailFlagged}
          good={active === null ? !guardrailFlagged : guardrailFlagged}
          detail={
            guardrailFlagged
              ? violations.map((v) => `${v.kind}: ${v.detail}`).join(" · ")
              : "no violations, clean data passes"
          }
        />
        <Verdict
          name="Type / presence contract"
          flagged={controlFlagged}
          good={active === null ? !controlFlagged : controlFlagged}
          detail={
            controlFlagged
              ? "rejected: a declared column is missing"
              : active
              ? "passed, the schema still looks valid, so it waves the corruption through"
              : "passed, clean data is valid"
          }
        />
      </div>

      <p className="mt-5 font-mono text-[0.7rem] leading-5 text-ink-2">
        Same detectors and thresholds as the Python harness; verified to reproduce its 6/6-vs-1/6 verdicts on this
        sample. The cited table above is the measured 50-episode run.
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
