/**
 * CoconutLabsLogo — animated lockup for coconutlabs.org and child sites.
 *
 * Architecture: HTML text + small SVG mark, laid out via inline-flex.
 * The wordmarks ("coconut", "labs") are HTML <span>s rendered by the
 * browser's native text engine (full font hinting, subpixel rendering,
 * always pixel-crisp at any size). Only the bracketed mark in the
 * middle is SVG. This is the difference between a soft-looking logo
 * and a tack-sharp one.
 *
 * Sizing is em-based — set `font-size` on the root via the `style`
 * prop (e.g. `style={{ fontSize: "clamp(2rem, 7vw, 4rem)" }}` for a
 * hero, `style={{ fontSize: "1rem" }}` for a header). Everything
 * (text, gaps, mark height, animation distances) scales from font-size.
 *
 * Animation sequence (~1.85s total) when `animate=true`:
 *   0ms     dot 1 drops in from above
 *   250ms   divider 1 fades in with a slight downward wave
 *   500ms   dots 2, 3, 4 drop in simultaneously
 *   750ms   dividers 2 & 3 fade in together
 *   1100ms  "coconut" emerges leftward, "labs" emerges rightward
 *   1550ms  outer brackets snap in fast from outside, framing the mark
 *
 * Each keyframe ends with `transform: none` (NOT `translate*(0)`) so
 * Chrome/Safari release the GPU compositing layer after animation ends
 * and the elements return to crisp main-thread rendering.
 *
 * Respects prefers-reduced-motion (skips animation, renders final state).
 * RSC-safe (no hooks, no browser APIs). currentColor everywhere.
 */

import type { CSSProperties, ReactElement } from "react";

export interface CoconutLabsLogoProps {
  /** Whether to play the entry animation. Default true. */
  animate?: boolean;
  className?: string;
  /**
   * Inline style overrides. Set `fontSize` here to control the lockup
   * size — everything else scales from it.
   */
  style?: CSSProperties;
  /** Accessible label for screen readers. Default "Coconut Labs". */
  ariaLabel?: string;
}

export function CoconutLabsLogo({
  animate = true,
  className = "",
  style,
  ariaLabel = "Coconut Labs",
}: CoconutLabsLogoProps): ReactElement {
  const stateClass = animate ? "cl-animated" : "cl-static";

  return (
    <span
      role="img"
      aria-label={ariaLabel}
      className={`cl-logo ${stateClass} ${className}`.trim()}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.32em",
        fontFamily: "inherit",
        fontWeight: 400,
        letterSpacing: "-0.02em",
        lineHeight: 1,
        whiteSpace: "nowrap",
        verticalAlign: "middle",
        ...style,
      }}
    >
      <style>{`
        .cl-logo.cl-static .cl-mark-dot,
        .cl-logo.cl-static .cl-mark-bracket,
        .cl-logo.cl-static .cl-text {
          opacity: 1;
        }
        .cl-logo.cl-static .cl-mark-divider {
          opacity: 0.5;
        }

        .cl-logo.cl-animated .cl-mark-dot,
        .cl-logo.cl-animated .cl-mark-bracket,
        .cl-logo.cl-animated .cl-mark-divider,
        .cl-logo.cl-animated .cl-text {
          opacity: 0;
        }

        .cl-logo .cl-text {
          display: inline-block;
        }

        .cl-logo.cl-animated .cl-mark-dot-1 {
          animation: cl-dot-drop 350ms cubic-bezier(0.2, 0.8, 0.4, 1) 0ms forwards;
        }
        .cl-logo.cl-animated .cl-mark-divider-1 {
          animation: cl-divider-wave 400ms ease-out 250ms forwards;
        }
        .cl-logo.cl-animated .cl-mark-dot-2,
        .cl-logo.cl-animated .cl-mark-dot-3,
        .cl-logo.cl-animated .cl-mark-dot-4 {
          animation: cl-dot-drop 350ms cubic-bezier(0.2, 0.8, 0.4, 1) 500ms forwards;
        }
        .cl-logo.cl-animated .cl-mark-divider-2,
        .cl-logo.cl-animated .cl-mark-divider-3 {
          animation: cl-divider-wave 400ms ease-out 750ms forwards;
        }
        .cl-logo.cl-animated .cl-text-coconut {
          animation: cl-text-coconut-emerge 500ms cubic-bezier(0.2, 0.8, 0.4, 1) 1100ms forwards;
        }
        .cl-logo.cl-animated .cl-text-labs {
          animation: cl-text-labs-emerge 500ms cubic-bezier(0.2, 0.8, 0.4, 1) 1100ms forwards;
        }
        .cl-logo.cl-animated .cl-mark-bracket-left {
          animation: cl-bracket-left-snap 300ms cubic-bezier(0.2, 0.8, 0.4, 1) 1550ms forwards;
        }
        .cl-logo.cl-animated .cl-mark-bracket-right {
          animation: cl-bracket-right-snap 300ms cubic-bezier(0.2, 0.8, 0.4, 1) 1550ms forwards;
        }

        /* Each animation ends with transform: none (not translate*(0)) so
           Chrome/Safari can release the GPU compositing layer and return
           the element to crisp main-thread rendering. */

        @keyframes cl-dot-drop {
          from { opacity: 0; transform: translateY(-0.2em); }
          99%  { opacity: 1; transform: translateY(0); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes cl-divider-wave {
          0%   { opacity: 0;   transform: translateY(-0.1em); }
          60%  { opacity: 0.5; transform: translateY(0.04em); }
          99%  { opacity: 0.5; transform: translateY(0); }
          100% { opacity: 0.5; transform: none; }
        }
        @keyframes cl-text-coconut-emerge {
          from { opacity: 0; transform: translateX(0.45em); }
          99%  { opacity: 1; transform: translateX(0); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes cl-text-labs-emerge {
          from { opacity: 0; transform: translateX(-0.45em); }
          99%  { opacity: 1; transform: translateX(0); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes cl-bracket-left-snap {
          from { opacity: 0; transform: translateX(-0.25em); }
          99%  { opacity: 1; transform: translateX(0); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes cl-bracket-right-snap {
          from { opacity: 0; transform: translateX(0.25em); }
          99%  { opacity: 1; transform: translateX(0); }
          to   { opacity: 1; transform: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .cl-logo .cl-mark-dot,
          .cl-logo .cl-mark-bracket,
          .cl-logo .cl-text {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
          .cl-logo .cl-mark-divider {
            animation: none !important;
            opacity: 0.5 !important;
            transform: none !important;
          }
        }
      `}</style>

      {/* "coconut", HTML text, browser-native rendering */}
      <span className="cl-text cl-text-coconut">coconut</span>

      {/* The mark, SVG only for the bracketed cellular pattern */}
      <svg
        viewBox="0 0 100 30"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        shapeRendering="geometricPrecision"
        style={{
          display: "block",
          height: "0.92em",
          width: "auto",
          flexShrink: 0,
          overflow: "visible",
        }}
      >
        {/* outer left bracket */}
        <path
          d="M 6,3 L 0,3 L 0,27 L 6,27"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="cl-mark-bracket cl-mark-bracket-left"
        />

        {/* big dot 1 */}
        <circle cx="17" cy="15" r="3" fill="currentColor" className="cl-mark-dot cl-mark-dot-1" />

        {/* dotted divider 1, slightly thicker dots (r=1.2 vs 0.9) for
            crispness at smaller render sizes */}
        <g className="cl-mark-divider cl-mark-divider-1">
          <circle cx="28" cy="6" r="1.2" fill="currentColor" />
          <circle cx="28" cy="10.5" r="1.2" fill="currentColor" />
          <circle cx="28" cy="15" r="1.2" fill="currentColor" />
          <circle cx="28" cy="19.5" r="1.2" fill="currentColor" />
          <circle cx="28" cy="24" r="1.2" fill="currentColor" />
        </g>

        {/* big dots 2 & 3 */}
        <circle cx="39" cy="15" r="3" fill="currentColor" className="cl-mark-dot cl-mark-dot-2" />
        <circle cx="61" cy="15" r="3" fill="currentColor" className="cl-mark-dot cl-mark-dot-3" />

        {/* dotted divider 2, center of mark */}
        <g className="cl-mark-divider cl-mark-divider-2">
          <circle cx="50" cy="6" r="1.2" fill="currentColor" />
          <circle cx="50" cy="10.5" r="1.2" fill="currentColor" />
          <circle cx="50" cy="15" r="1.2" fill="currentColor" />
          <circle cx="50" cy="19.5" r="1.2" fill="currentColor" />
          <circle cx="50" cy="24" r="1.2" fill="currentColor" />
        </g>

        {/* big dot 4 */}
        <circle cx="83" cy="15" r="3" fill="currentColor" className="cl-mark-dot cl-mark-dot-4" />

        {/* dotted divider 3 */}
        <g className="cl-mark-divider cl-mark-divider-3">
          <circle cx="72" cy="6" r="1.2" fill="currentColor" />
          <circle cx="72" cy="10.5" r="1.2" fill="currentColor" />
          <circle cx="72" cy="15" r="1.2" fill="currentColor" />
          <circle cx="72" cy="19.5" r="1.2" fill="currentColor" />
          <circle cx="72" cy="24" r="1.2" fill="currentColor" />
        </g>

        {/* outer right bracket */}
        <path
          d="M 94,3 L 100,3 L 100,27 L 94,27"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="cl-mark-bracket cl-mark-bracket-right"
        />
      </svg>

      {/* "labs", HTML text, browser-native rendering */}
      <span className="cl-text cl-text-labs">labs</span>
    </span>
  );
}
