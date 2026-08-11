"use client";

import { useMemo, useState } from "react";
import DemoShell, { type Outcome } from "@/components/demos/DemoShell";
import PresetButton from "@/components/demos/PresetButton";
import VerdictCard from "@/components/demos/VerdictCard";
import {
  generate,
  runModeled,
  traceModeled,
  checkHitRatio,
  functionalControlFlags,
  CONFIGS,
} from "./silent-cache-miss";

const LABELS: Record<string, string> = {
  canonical: "Canonical key (correct)",
  volatile_timestamp: "Timestamp in key",
  volatile_request_id: "Request-id in key",
  below_minimum: "Below min length",
};

export default function Demo() {
  const stream = useMemo(() => generate(), []);
  const [config, setConfig] = useState("volatile_timestamp");

  const active = CONFIGS.find((c) => c.name === config);
  if (!active) return null;
  const res = runModeled(stream, active.keyFn, active.name);
  const trace = traceModeled(stream, active.keyFn).slice(0, 8);
  const flagged = checkHitRatio(res.hitRatio, res.hits + res.misses).length > 0;
  const controlFlags = functionalControlFlags(stream, res);
  const pct = (res.hitRatio * 100).toFixed(0);

  const outcome: Outcome = flagged
    ? {
        tone: "danger",
        label: "flagged by the guardrail only",
        headline: `The guardrail flagged this config: hit ratio ${pct}% on a workload built to repeat. ${res.realCalls} of ${stream.length} requests paid full cost.`,
        detail: "Every answer was still correct, so the functional test saw nothing wrong.",
      }
    : {
        tone: "success",
        label: "clean pass",
        headline: `The cache works: ${pct}% of requests hit, only ${res.realCalls} of ${stream.length} paid full cost. Both checks pass.`,
      };

  return (
    <DemoShell
      scenario={`You are the platform engineer. The same warm workload, ${stream.length} requests over 12 hot prompts, runs against whichever cache-key config shipped. Live in your browser, deterministic every run.`}
      controlsLabel="pick the cache-key config"
      controls={
        <div className="flex flex-wrap gap-2">
          {CONFIGS.map((c) => (
            <PresetButton key={c.name} danger={c.buggy} active={c.name === config} onClick={() => setConfig(c.name)}>
              {LABELS[c.name] ?? c.name}
            </PresetButton>
          ))}
        </div>
      }
      outcome={outcome}
      footnote={
        <>
          The workload, cache, and both checks are live and deterministic, the same logic as the Python run, verified
          by <span className="text-ink-1">web/parity-check.mts</span> (PARITY OK, identical hit ratios).
        </>
      }
    >
      {/* per-request trace */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[30rem] border-collapse font-mono text-xs">
          <thead>
            <tr className="border-b border-rule text-left uppercase text-ink-2">
              <th className="py-2 font-normal">req</th>
              <th className="py-2 font-normal">cache key</th>
              <th className="py-2 font-normal">result</th>
            </tr>
          </thead>
          <tbody>
            {trace.map((row) => (
              <tr key={row.i} className="border-b border-rule/60">
                <td className="py-2 text-ink-1">#{row.i}</td>
                <td className={`py-2 ${active.buggy && !row.hit ? "text-danger" : "text-ink-2"}`}>
                  {row.key.length > 34 ? `${row.key.slice(0, 34)}…` : row.key}
                </td>
                <td className="py-2">
                  {row.hit ? (
                    <span className="inline-flex items-center gap-1 text-success">
                      <span aria-hidden="true">✓</span> hit
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-ink-2">
                      <span aria-hidden="true">✕</span> miss
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* two verdicts side by side */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <VerdictCard
          name="Silent-cache-miss guardrail"
          flagged={flagged}
          good={active.buggy ? flagged : !flagged}
          detail={`hit ratio ${pct}% · ${res.realCalls} of ${stream.length} requests paid full cost`}
        />
        <VerdictCard
          name="Functional correctness (the control)"
          flagged={controlFlags}
          good={!active.buggy && !controlFlags}
          detail="every returned answer matches the direct computation, so the test people trust sees nothing wrong."
        />
      </div>
    </DemoShell>
  );
}
