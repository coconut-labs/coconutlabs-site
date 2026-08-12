"use client";

import { type ReactNode, useEffect, useState } from "react";

/* LiveLog — the hall-of-demos "software operating" surface, generalized from
   the risk-gate wire tape. A unit computes its full result instantly with
   its real engine (the functional tier asserts that truth from the banner),
   then hands this component the per-step lines; the log replays them at
   reading speed with running counters, so the demo reads as a process
   running, not a form submitting.

   Contract, enforced by convention across units:
   - Lines are DERIVED from the engine's actual run, deterministic per
     preset. Nothing is fabricated for the animation.
   - The final counter state equals the totals the banner already states.
   - prefers-reduced-motion renders the finished tail instantly, no replay.
   - Nothing renders before the first interaction, so every route's default
     visual baseline is untouched. */

export type LogLine = {
  /** Rendered mono line. Keep it a single row of spans. */
  content: ReactNode;
  /** Counts toward the "flagged"/danger counter when true. */
  flagged?: boolean;
};

const WINDOW = 14;

export default function LiveLog({
  title,
  lines,
  counterNoun = "steps",
  flaggedNoun = "flagged",
  linesPerTick = 5,
  tickMs = 40,
}: {
  /** Mono header label, e.g. "profile · check log" or "wire · session tape". */
  title: string;
  lines: LogLine[];
  counterNoun?: string;
  flaggedNoun?: string;
  linesPerTick?: number;
  tickMs?: number;
}) {
  const [pos, setPos] = useState(0);

  useEffect(() => {
    setPos(0);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPos(lines.length);
      return;
    }
    const timer = setInterval(() => {
      setPos((p) => {
        const nextPos = p + linesPerTick;
        if (nextPos >= lines.length) {
          clearInterval(timer);
          return lines.length;
        }
        return nextPos;
      });
    }, tickMs);
    return () => clearInterval(timer);
  }, [lines, linesPerTick, tickMs]);

  const seen = lines.slice(0, pos);
  const flagged = seen.filter((l) => l.flagged).length;
  const visible = seen.slice(-WINDOW);

  return (
    <div className="rounded-sm border border-rule bg-bg-2/60" data-testid="live-log">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-b border-hair px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-2">
        <span>{title}</span>
        <span aria-live="off">
          {pos}/{lines.length} {counterNoun} ·{" "}
          <span className={flagged > 0 ? "text-danger" : "text-success"}>
            {flagged} {flaggedNoun}
          </span>
        </span>
      </div>
      <div className="max-h-[19rem] overflow-hidden px-4 py-3 font-mono text-[12px]">
        {visible.map((l, i) => (
          <div className="whitespace-nowrap leading-5" key={`${pos}-${i}`}>
            {l.content}
          </div>
        ))}
        {pos < lines.length ? <p className="leading-5 text-ink-2">▮</p> : null}
      </div>
    </div>
  );
}
