"use client";

import { useMemo, useState } from "react";
import { generate, asofJoin, leakyJoin, leakedCount, CITED_AUC } from "./pit";

export default function PitDemo() {
  const entities = useMemo(() => generate(8), []);
  const [mode, setMode] = useState<"asof" | "leaky">("asof");

  const rows = mode === "asof" ? asofJoin(entities) : leakyJoin(entities);
  const leaked = leakedCount(rows);
  const flagged = leaked > 0;

  return (
    <div className="rounded-lg border border-rule bg-bg-1/60 p-6 md:p-8">
      <p className="font-mono text-xs uppercase text-ink-2">run it yourself</p>
      <p className="mt-3 max-w-2xl text-base leading-7 text-ink-1">
        Same {entities.length} labels, joined to their feature two ways, live in your browser. Toggle the join and
        watch the guardrail flag every row whose feature is timestamped <em>after</em> its label.
      </p>

      {/* toggle */}
      <div className="mt-6 inline-flex overflow-hidden rounded-sm border border-rule font-mono text-xs">
        <button
          type="button"
          onClick={() => setMode("asof")}
          className={`focus-ring px-4 py-2 transition ${mode === "asof" ? "bg-accent/10 text-accent" : "text-ink-1 hover:text-accent"}`}
        >
          As-of join (correct)
        </button>
        <button
          type="button"
          onClick={() => setMode("leaky")}
          className={`focus-ring border-l border-rule px-4 py-2 transition ${mode === "leaky" ? "bg-danger/10 text-danger" : "text-ink-1 hover:text-danger"}`}
        >
          Leaky join (current value)
        </button>
      </div>

      {/* join table */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[30rem] border-collapse font-mono text-xs">
          <thead>
            <tr className="border-b border-rule text-left uppercase text-ink-2">
              <th className="py-2 font-normal">label</th>
              <th className="py-2 font-normal">recorded at</th>
              <th className="py-2 font-normal">feature from</th>
              <th className="py-2 font-normal">value</th>
              <th className="py-2 font-normal">point-in-time</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-rule/60">
                <td className="py-2 text-ink-1">#{r.id} · y={r.label}</td>
                <td className="py-2 text-ink-1">t={r.labelTs}</td>
                <td className={`py-2 ${r.leaked ? "text-danger" : "text-ink-1"}`}>t={r.featureTs}{r.leaked ? ` (+${r.featureTs - r.labelTs} future)` : ""}</td>
                <td className="py-2 text-ink-2">{r.featureValue}</td>
                <td className="py-2">
                  {r.leaked ? (
                    <span className="inline-flex items-center gap-1 text-danger"><span aria-hidden="true">✕</span> leaked</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-success"><span aria-hidden="true">✓</span> ok</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* verdict */}
      <div className="mt-6 rounded-lg border border-rule bg-bg-2/40 p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs text-ink-1">Point-in-time guardrail</span>
          <span className={`inline-flex items-center gap-1 font-mono text-xs ${flagged ? "text-danger" : "text-success"}`}>
            {flagged ? <span aria-hidden="true">✕</span> : <span aria-hidden="true">✓</span>}
            {flagged ? "FLAGGED" : "passes"}
          </span>
        </div>
        <p className="mt-3 font-mono text-[0.72rem] leading-5 text-ink-2">
          {flagged
            ? `${leaked}/${rows.length} rows use a feature from after the label; the leaky join time-travels. A schema check passes this; offline accuracy rewards it.`
            : `0/${rows.length} rows use a future feature. Every feature was available when its label was recorded.`}
        </p>
      </div>

      <p className="mt-5 font-mono text-[0.7rem] leading-5 text-ink-2">
        The join and guardrail are live. The model impact, leaked AUC {CITED_AUC.leaky} vs point-in-time-correct{" "}
        {CITED_AUC.asof}, is the measured figure from the Python run above, not recomputed here.
      </p>
    </div>
  );
}
