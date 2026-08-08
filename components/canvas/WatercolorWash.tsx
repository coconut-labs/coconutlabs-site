/**
 * WatercolorWash — a procedural pigment wash on thin paper.
 *
 * Pure inline SVG, zero assets, deterministic per seed (SSR-safe, no Math.random).
 * The look: a soft interior soak plus a darker "wet edge" rim, both carved from
 * ellipses by fractal-noise displacement, then multiply-blended into the paper.
 * Decorative only: aria-hidden, pointer-events none. Keep opacity ≤ 0.2 so the
 * contrast and Lighthouse budgets never notice it.
 */
import type { CSSProperties } from "react";

type WatercolorWashProps = {
  color?: string;
  /** Different seeds give different bloom shapes; same seed renders identically every build. */
  seed?: number;
  opacity?: number;
  className?: string;
  style?: CSSProperties;
};

export function WatercolorWash({
  color = "#9b6b1f",
  seed = 7,
  opacity = 0.16,
  className,
  style,
}: WatercolorWashProps) {
  const uid = `wash-${seed}`;
  // Small deterministic jitter so different seeds also shift geometry, not just noise.
  const jx = (seed * 37) % 60;
  const jy = (seed * 53) % 44;
  return (
    <svg
      aria-hidden="true"
      className={className}
      focusable="false"
      style={{ pointerEvents: "none", mixBlendMode: "multiply", opacity, ...style }}
      viewBox="0 0 600 480"
    >
      <defs>
        <filter height="180%" id={`${uid}-soak`} width="180%" x="-40%" y="-40%">
          <feTurbulence baseFrequency="0.012 0.017" numOctaves="3" result="n" seed={seed} type="fractalNoise" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="88" />
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter height="180%" id={`${uid}-rim`} width="180%" x="-40%" y="-40%">
          <feTurbulence baseFrequency="0.016 0.022" numOctaves="3" result="n" seed={seed + 11} type="fractalNoise" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="72" />
          <feGaussianBlur stdDeviation="1.4" />
        </filter>
      </defs>
      {/* interior soak: pigment pooling, softest layer */}
      <g fill={color} filter={`url(#${uid}-soak)`}>
        <ellipse cx={300 + jx} cy={230 + jy} opacity="0.5" rx="215" ry="150" />
        <ellipse cx={220 + jx} cy={190 + jy} opacity="0.34" rx="150" ry="110" />
        <ellipse cx={380 - jx} cy={280 - jy} opacity="0.3" rx="160" ry="105" />
      </g>
      {/* wet edge: pigment gathers at the rim as the water dries */}
      <g fill="none" filter={`url(#${uid}-rim)`} stroke={color}>
        <ellipse cx={300 + jx} cy={230 + jy} opacity="0.55" rx="216" ry="151" strokeWidth="2.4" />
        <ellipse cx={252 + jx} cy={206 + jy} opacity="0.3" rx="168" ry="122" strokeWidth="1.6" />
      </g>
    </svg>
  );
}
