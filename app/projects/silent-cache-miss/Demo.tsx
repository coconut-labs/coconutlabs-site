"use client";

import { useMemo, useState } from "react";
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

  return (
    <div className="rounded-lg border border-rule bg-bg-1/60 p-6 md:p-8">
      <p className="font-mono text-xs uppercase text-ink-2">run it yourself</p>
      <p className="mt-3 max-w-2xl text-base leading-7 text-ink-1">
        The same {stream.length}-request warm workload over 12 hot prompts — live in your browser. Switch the cache-key
        config and watch the hit ratio collapse to zero while every answer stays correct.
      </p>

      {/* config selector */}
      <div className="mt-6 flex flex-wrap gap-2 font-mono text-xs">
        {CONFIGS.map((c) => {
          const on = c.name === config;
          const good = !c.buggy;
          return (
            <button
              key={c.name}
              type="button"
              onClick={() => setConfig(c.name)}
              className={`focus-ring rounded-sm border px-3 py-2 transition ${
                on
                  ? good
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-danger bg-danger/10 text-danger"
                  : "border-rule text-ink-1 hover:text-accent"
              }`}
            >
              {LABELS[c.name] ?? c.name}
            </button>
          );
        })}
      </div>

      {/* per-request trace */}
      <div className="mt-6 overflow-x-auto">
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
        <div className="rounded-lg border border-rule bg-bg-2/40 p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-ink-1">Silent-cache-miss guardrail</span>
            <span className={`inline-flex items-center gap-1 font-mono text-xs ${flagged ? "text-danger" : "text-success"}`}>
              {flagged ? <span aria-hidden="true">✕</span> : <span aria-hidden="true">✓</span>}
              {flagged ? "FLAGGED" : "passes"}
            </span>
          </div>
          <p className="mt-3 font-mono text-[0.72rem] leading-5 text-ink-2">
            hit ratio <span className={flagged ? "text-danger" : "text-success"}>{(res.hitRatio * 100).toFixed(0)}%</span>{" "}
            · {res.realCalls} of {stream.length} requests paid full cost
          </p>
        </div>

        <div className="rounded-lg border border-rule bg-bg-2/40 p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-ink-1">Functional correctness (the control)</span>
            <span className={`inline-flex items-center gap-1 font-mono text-xs ${controlFlags ? "text-danger" : "text-success"}`}>
              {controlFlags ? <span aria-hidden="true">✕</span> : <span aria-hidden="true">✓</span>}
              {controlFlags ? "FLAGGED" : "passes"}
            </span>
          </div>
          <p className="mt-3 font-mono text-[0.72rem] leading-5 text-ink-2">
            every returned answer matches the direct computation — so the test people trust sees nothing wrong.
          </p>
        </div>
      </div>

      <p className="mt-5 font-mono text-[0.7rem] leading-5 text-ink-2">
        The workload, cache and both checks are live and deterministic — the same logic as the Python run above, verified
        by <span className="text-ink-1">web/parity-check.mts</span> (PARITY OK, identical hit ratios).
      </p>
    </div>
  );
}
