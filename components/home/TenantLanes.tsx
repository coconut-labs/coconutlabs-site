/**
 * TenantLanes — the hero background, and a small argument.
 *
 * Nine request timelines. Most lanes carry sparse traffic. One lane floods
 * with dense ticks; one lane keeps a steady accent cadence anyway. That is
 * the lab's whole thesis drawn as texture: a quiet tenant holding its rhythm
 * while a neighbor bursts.
 *
 * Pure inline SVG, deterministic (seeded LCG, no Math.random, SSR-safe),
 * static by design so prefers-reduced-motion has nothing to object to.
 * Decorative only: aria-hidden, pointer-events none, opacity kept low so
 * contrast on the text above never moves.
 */

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

export function TenantLanes() {
  const laneY = (i: number) => ((i + 1) * H) / (LANES + 1);
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      focusable="false"
      preserveAspectRatio="xMidYMid slice"
      style={{ opacity: 0.5 }}
      viewBox={`0 0 ${W} ${H}`}
    >
      {/* lane hairlines */}
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
      {/* background tenants: sparse, irregular */}
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
      {/* the flooder: a dense burst arriving mid-lane */}
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
      {/* the quiet tenant: steady cadence, unbothered, in accent */}
      {ticks(7, 26, 0.15).map((x, j) => (
        <line
          key={`q${j}`}
          stroke="var(--accent)"
          strokeOpacity="0.55"
          strokeWidth="2"
          x1={x}
          x2={x}
          y1={laneY(QUIET_LANE) - 10}
          y2={laneY(QUIET_LANE) + 10}
        />
      ))}
    </svg>
  );
}
