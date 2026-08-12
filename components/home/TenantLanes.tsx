"use client";

/**
 * TenantLanes — the hero background, and a small argument.
 *
 * Nine request timelines. Most lanes carry sparse traffic. One lane floods
 * with dense ticks; one lane keeps a steady accent cadence anyway. That is
 * the lab's whole thesis drawn as texture: a quiet tenant holding its rhythm
 * while a neighbor bursts.
 *
 * Motion (design-system §5 named exception): the tick field drifts left like
 * a strip-chart recorder, the flooder a touch faster for depth; the quiet
 * lane does not drift, it pulses in place, which is the point. A measurement
 * hairline follows the pointer inside the hero. All of it is opacity and
 * transform only, pauses offscreen, and collapses to this exact static frame
 * under prefers-reduced-motion — which is also what the pixel gate sees.
 *
 * Geometry stays deterministic (seeded LCG, no Math.random, SSR-safe).
 * Decorative only: aria-hidden, pointer-events none (the pointer listener
 * rides on the hero section, not on anything interactive), opacity kept low
 * so contrast on the text above never moves.
 */

import { useEffect, useRef } from "react";

const W = 1600;
const H = 900;
const LANES = 9;
const FLOODER_LANE = 5;
const QUIET_LANE = 2;

function ticks(seed: number, count: number, jitter: number): number[] {
  // LCG: deterministic per seed, same output server and client.
  let s = seed >>> 0;
  const next = () => ((s = (s * 1664525 + 1013904223) >>> 0), s / 0xffffffff);
  const out: number[] = [];
  const step = W / count;
  for (let i = 0; i < count; i++) {
    out.push(i * step + next() * step * jitter);
  }
  return out;
}

const laneY = (i: number) => ((i + 1) * H) / (LANES + 1);

function SparseTicks() {
  return (
    <>
      {Array.from({ length: LANES }, (_, i) => {
        if (i === FLOODER_LANE || i === QUIET_LANE) return null;
        return ticks(97 + i * 31, 14 + (i % 3) * 4, 3.5).map((x, j) => (
          <line
            key={`t${i}-${j}`}
            stroke="var(--ink-2)"
            strokeOpacity="0.28"
            strokeWidth="1.5"
            x1={x}
            x2={x}
            y1={laneY(i) - 7}
            y2={laneY(i) + 7}
          />
        ));
      })}
    </>
  );
}

function FlooderTicks() {
  return (
    <>
      {ticks(541, 150, 1.4).map((x, j) =>
        x > W * 0.28 ? (
          <line
            key={`f${j}`}
            stroke="var(--ink-1)"
            strokeOpacity="0.34"
            strokeWidth="1.5"
            x1={x}
            x2={x}
            y1={laneY(FLOODER_LANE) - 9}
            y2={laneY(FLOODER_LANE) + 9}
          />
        ) : null,
      )}
    </>
  );
}

export function TenantLanes() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const host = root?.parentElement;
    if (!root || !host) return;

    // Measurement hairline: track pointer x over the hero, one rAF deep.
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      const x = e.clientX - rect.left;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        root.style.setProperty("--mx", `${x}px`);
        root.dataset.cursor = "on";
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(raf);
      delete root.dataset.cursor;
    };
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);

    // §5 discipline: background motion pauses when the hero is offscreen.
    const io = new IntersectionObserver(([entry]) => {
      if (entry) root.dataset.paused = entry.isIntersecting ? "off" : "on";
    });
    io.observe(root);

    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      io.disconnect();
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0" ref={rootRef}>
      <svg
        className="absolute inset-0 h-full w-full"
        focusable="false"
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity: 0.5 }}
        viewBox={`0 0 ${W} ${H}`}
      >
        {/* lane hairlines: the chart paper, static */}
        {Array.from({ length: LANES }, (_, i) => (
          <line
            key={`l${i}`}
            stroke="var(--rule)"
            strokeWidth="1"
            x1="0"
            x2={W}
            y1={laneY(i)}
            y2={laneY(i)}
          />
        ))}
        {/* background tenants: sparse, irregular, drifting slowly left.
            The second copy sits one width to the right, clipped by the
            viewBox until the drift brings it in; the loop is seamless. */}
        <g className="lanes-drift-slow">
          <SparseTicks />
          <g transform={`translate(${W} 0)`}>
            <SparseTicks />
          </g>
        </g>
        {/* the flooder: dense burst, drifting a touch faster (depth) */}
        <g className="lanes-drift-fast">
          <FlooderTicks />
          <g transform={`translate(${W} 0)`}>
            <FlooderTicks />
          </g>
        </g>
        {/* the quiet tenant: steady cadence, unbothered, in accent.
            It does not drift; it pulses in place, left to right. */}
        {ticks(7, 26, 0.15).map((x, j) => (
          <line
            className="lanes-pulse"
            key={`q${j}`}
            stroke="var(--accent)"
            strokeOpacity="0.55"
            strokeWidth="2"
            style={{ animationDelay: `${(j * 0.12).toFixed(2)}s` }}
            x1={x}
            x2={x}
            y1={laneY(QUIET_LANE) - 10}
            y2={laneY(QUIET_LANE) + 10}
          />
        ))}
      </svg>
      {/* measurement hairline: a caliper over the chart, pointer-driven */}
      <div className="lanes-cursor" />
    </div>
  );
}
