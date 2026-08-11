"use client";

import { useMemo, useState } from "react";
import DemoShell, { type Outcome } from "@/components/demos/DemoShell";
import PresetButton from "@/components/demos/PresetButton";
import { generate, asofJoin, leakyJoin, leakedCount, CITED_AUC } from "./pit";

export default function PitDemo() {
  const entities = useMemo(() => generate(8), []);
  const [mode, setMode] = useState<"asof" | "leaky">("asof");

  const rows = mode === "asof" ? asofJoin(entities) : leakyJoin(entities);
  const leaked = leakedCount(rows);
  const flagged = leaked > 0;

  const outcome: Outcome = flagged
    ? {
        tone: "danger",
        label: "flagged",
        headline: `The guardrail flagged ${leaked} of ${rows.length} rows: each one trains on a feature written after its label. The join time-travels.`,
        detail: `A schema check passes this table; offline accuracy rewards it (AUC ${CITED_AUC.leaky} vs the honest ${CITED_AUC.asof}).`,
      }
    : {
        tone: "success",
        label: "clean pass",
        headline: `0 of ${rows.length} rows use a future feature. Every feature was available when its label was recorded.`,
      };

  return (
    <DemoShell
      scenario={`You are the ML engineer building a training table. Same ${entities.length} labels, same feature history, live in your browser; the only choice is how they get joined.`}
      controlsLabel="pick the join"
      controls={
        <div className="flex flex-wrap gap-2">
          <PresetButton active={mode === "asof"} onClick={() => setMode("asof")}>
            As-of join (correct)
          </PresetButton>
          <PresetButton danger active={mode === "leaky"} onClick={() => setMode("leaky")}>
            Leaky join (current value)
          </PresetButton>
        </div>
      }
      outcome={outcome}
      footnote={
        <>
          The join and guardrail are live. The model impact, leaked AUC {CITED_AUC.leaky} vs point-in-time-correct{" "}
          {CITED_AUC.asof}, is the measured figure from the Python run, not recomputed here.
        </>
      }
    >
      <div className="overflow-x-auto">
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
    </DemoShell>
  );
}
