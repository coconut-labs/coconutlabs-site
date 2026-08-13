"use client";

/**
 * DotField — the site's ground: the wordmark's bracket dots, scaled to a
 * fabric that runs under every page.
 *
 * A fixed viewport canvas draws a world-space dot grid that scrolls with
 * the page. The forces are configurable per route (see FieldGround for the
 * route-keyed variants), all decorative, all deterministic in geometry:
 *
 * - The wave: a slow crest through world space (requests arriving),
 *   diagonal or vertical, or absent on pages that want stillness.
 * - The pulse: a metronome tick on the accent subset, for pages whose
 *   argument is a steady cadence under load.
 * - Gravity: the pointer is a mass. Nearby dots lean toward it and
 *   brighten, like fabric dimpling under a fingertip.
 * - Ripples: every click drops a stone. A ring spreads from the click
 *   point, displacing dots outward as the front passes. Ripple weight
 *   scales with the size of the element clicked: a card lands heavier
 *   than a toggle, so the page's physics agree with its hierarchy.
 *
 * Design-system §5 named exception (site ground): canvas
 * alpha/radius/displacement only, pauses on hidden tabs, and under
 * prefers-reduced-motion draws one flat static frame with no wave, no
 * pulse, no gravity, no ripples, no loop — the frame the pixel gate
 * screenshots. Colors resolve from the token layer and re-resolve on
 * theme flips. Alphas stay low; text contrast never moves.
 */

import { useEffect, useRef } from "react";

export type FieldConfig = {
  spacing: number;
  baseR: number;
  inkAlpha: number;
  accentAlpha: number;
  wave: "diag" | "down" | "none";
  wavelength: number;
  periodMs: number;
  crestInk: number;
  crestAccent: number;
  crestR: number;
  /** Vertical lift as the crest passes: the fabric breathes, not just glows. */
  crestLift: number;
  /** Metronome tick on the accent subset (benchmarks: steady under load). */
  pulse: boolean;
  pulsePeriodMs: number;
  gravityPull: number;
  gravityRadius: number;
  ripples: boolean;
  rippleEnergy: number;
};

const MAX_RIPPLES = 8;
const RIPPLE_SPEED = 0.62; // px per ms
const RIPPLE_WIDTH = 110;

type Ripple = { x: number; y: number; born: number; mass: number };

export function DotField({ cfg }: { cfg: FieldConfig }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let ink = "";
    let accent = "";
    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let running = false;
    let pointer: { x: number; y: number } | null = null;
    let ripples: Ripple[] = [];
    // Scroll physics: the viewport dragging past the fabric shears it.
    // A critically-damped spring tracks smoothed scroll velocity; each dot
    // lags by its own factor so the shear reads organic, then settles.
    let lastScrollY = -1;
    let scrollVel = 0;
    let shear = 0;
    // Content-dim grid: viewport cells covered by text blocks get a dim
    // factor so the field recedes under prose. Rebuilt on layout-affecting
    // events and every ~200ms while animating (cheap: <=120 rects into a
    // ~50x35 cell grid, then two dilation rings for soft edges).
    let dimGrid: Float32Array = new Float32Array(0);
    let dimCols = 0;
    let dimRows = 0;
    let lastDimBuild = -1;

    const buildDimGrid = () => {
      dimCols = Math.ceil(width / cfg.spacing) + 2;
      dimRows = Math.ceil(height / cfg.spacing) + 2;
      dimGrid = new Float32Array(dimCols * dimRows);
      const els = document.querySelectorAll(
        "main h1, main h2, main h3, main p, main li, main table, main pre, main video, main blockquote",
      );
      const n = Math.min(els.length, 140);
      for (let k = 0; k < n; k++) {
        const el = els[k]!;
        const rect = el.getBoundingClientRect();
        if (rect.bottom < -40 || rect.top > height + 40 || rect.width === 0) continue;
        const pad = 14;
        const c0 = Math.max(0, Math.floor((rect.left - pad) / cfg.spacing));
        const c1 = Math.min(dimCols - 1, Math.ceil((rect.right + pad) / cfg.spacing));
        const r0 = Math.max(0, Math.floor((rect.top - pad) / cfg.spacing));
        const r1 = Math.min(dimRows - 1, Math.ceil((rect.bottom + pad) / cfg.spacing));
        for (let r = r0; r <= r1; r++)
          for (let c = c0; c <= c1; c++) dimGrid[r * dimCols + c] = 1;
      }
      // Two dilation rings: 1 -> 0.55 -> 0.25, soft edges without a blur pass.
      for (const [ring, value] of [
        [1, 0.55],
        [2, 0.25],
      ] as const) {
        for (let r = 0; r < dimRows; r++) {
          for (let c = 0; c < dimCols; c++) {
            if (dimGrid[r * dimCols + c] !== 0) continue;
            let near = 0;
            for (let dr = -ring; dr <= ring; dr++) {
              for (let dc = -ring; dc <= ring; dc++) {
                const rr = r + dr;
                const cc = c + dc;
                if (rr >= 0 && rr < dimRows && cc >= 0 && cc < dimCols && dimGrid[rr * dimCols + cc]! >= 0.55)
                  near = 1;
              }
            }
            if (near) dimGrid[r * dimCols + c] = value;
          }
        }
      }
    };

    const dimAt = (x: number, y: number): number => {
      if (dimCols === 0) return 0;
      const c = Math.floor(x / cfg.spacing);
      const r = Math.floor(y / cfg.spacing);
      if (c < 0 || c >= dimCols || r < 0 || r >= dimRows) return 0;
      return dimGrid[r * dimCols + c] ?? 0;
    };

    const resolveColors = () => {
      const styles = getComputedStyle(document.documentElement);
      ink = styles.getPropertyValue("--ink-2").trim();
      accent = styles.getPropertyValue("--accent").trim();
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    };

    const draw = (t: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const animate = !reduced.matches;
      // Scroll offset applies in both modes: the world scrolls with the page
      // and the dim zones track the content, static or not. Only autonomous
      // motion (wave, pulse, gravity, ripples) is animate-gated.
      const scrollY = window.scrollY;
      const phaseShift = animate ? (t % cfg.periodMs) / cfg.periodMs : 0;
      if (animate) {
        if (lastScrollY < 0) lastScrollY = scrollY;
        const dv = scrollY - lastScrollY;
        lastScrollY = scrollY;
        scrollVel = scrollVel * 0.82 + dv * 0.18;
        // Spring toward the velocity target, clamped so fast flings stay
        // composed; decays to zero within ~400ms of the scroll stopping.
        const target = Math.max(-16, Math.min(16, scrollVel * 0.9));
        shear += (target - shear) * 0.16;
        if (Math.abs(shear) < 0.01 && Math.abs(scrollVel) < 0.01) {
          shear = 0;
          scrollVel = 0;
        }
      } else {
        shear = 0;
        scrollVel = 0;
        lastScrollY = -1;
      }
      if (t - lastDimBuild > 200 || lastDimBuild < 0) {
        buildDimGrid();
        lastDimBuild = t;
      }
      // Metronome: a brief bright tick, then quiet until the next beat.
      const tick = animate && cfg.pulse
        ? Math.max(0, Math.sin((2 * Math.PI * (t % cfg.pulsePeriodMs)) / cfg.pulsePeriodMs)) ** 6
        : 0;
      if (animate && ripples.length) {
        const reach = Math.hypot(width, height) + RIPPLE_WIDTH;
        ripples = ripples.filter((rp) => (t - rp.born) * RIPPLE_SPEED * rp.mass < reach * 1.2);
      }
      const jFirst = Math.floor(scrollY / cfg.spacing) - 1;
      const jLast = Math.ceil((scrollY + height) / cfg.spacing) + 1;
      const cols = Math.ceil(width / cfg.spacing) + 1;
      for (let i = 0; i < cols; i++) {
        for (let j = jFirst; j <= jLast; j++) {
          const worldX = i * cfg.spacing + cfg.spacing / 2;
          const worldY = j * cfg.spacing + cfg.spacing / 2;
          let x = worldX;
          let y = worldY - scrollY;
          const isAccent = (((i * 7 + j * 13) % 23) + 23) % 23 === 0;
          let alpha = isAccent ? cfg.accentAlpha : cfg.inkAlpha;
          let r = cfg.baseR;
          if (animate) {
            if (shear !== 0) {
              // Per-dot lag factor 0.6..1.4 from the grid hash: the fabric
              // stretches against the scroll instead of translating rigidly.
              const lag = 0.6 + ((((i * 13 + j * 7) % 5) + 5) % 5) * 0.2;
              y -= shear * lag;
            }
            if (cfg.wave !== "none") {
              const along = cfg.wave === "diag" ? worldX + worldY : worldY;
              const phase = along / cfg.wavelength - phaseShift * 2 * Math.PI;
              const crest = Math.max(0, Math.sin(phase)) ** 3;
              alpha += crest * (isAccent ? cfg.crestAccent : cfg.crestInk);
              r += crest * cfg.crestR;
              y -= crest * cfg.crestLift;
            }
            if (isAccent && tick > 0) {
              alpha += tick * 0.4;
              r += tick * 0.9;
            }
            if (pointer && cfg.gravityPull > 0) {
              const dx = pointer.x - x;
              const dy = pointer.y - y;
              const d = Math.hypot(dx, dy);
              if (d < cfg.gravityRadius && d > 0.001) {
                const near = (1 - d / cfg.gravityRadius) ** 2;
                x += (dx / d) * near * cfg.gravityPull;
                y += (dy / d) * near * cfg.gravityPull;
                alpha += near * 0.42;
                r += near * 1.3;
              }
            }
            if (cfg.ripples) {
              for (const rp of ripples) {
                const age = t - rp.born;
                const front = age * RIPPLE_SPEED * rp.mass;
                const dx = x - rp.x;
                const dy = y - rp.y;
                const d = Math.hypot(dx, dy);
                const off = d - front;
                if (Math.abs(off) < RIPPLE_WIDTH && d > 0.001) {
                  const ring = Math.exp(-(off * off) / (2 * (RIPPLE_WIDTH / 2.6) ** 2));
                  const decay = Math.max(0, 1 - front / (900 * rp.mass));
                  const energy = ring * decay * rp.mass * cfg.rippleEnergy;
                  x += (dx / d) * energy * 9;
                  y += (dy / d) * energy * 9;
                  alpha += energy * 0.5;
                  r += energy * 1.6;
                }
              }
            }
          }
          // Local dimming: the field recedes where content sits on it.
          const dim = dimAt(x, y);
          if (dim > 0) alpha *= 1 - 0.72 * dim;
          ctx.globalAlpha = Math.min(alpha, 0.95);
          ctx.fillStyle = isAccent ? accent : ink;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };

    const loop = (t: number) => {
      draw(t);
      raf = requestAnimationFrame(loop);
    };

    const needsLoop = cfg.wave !== "none" || cfg.pulse || cfg.gravityPull > 0 || cfg.ripples;
    const start = () => {
      if (running || reduced.matches || document.hidden || !needsLoop) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const restart = () => {
      stop();
      resolveColors();
      resize();
      lastDimBuild = -1;
      draw(0);
      start();
    };

    const onMove = (e: PointerEvent) => {
      pointer = { x: e.clientX, y: e.clientY };
    };
    const onLeave = () => {
      pointer = null;
    };
    const onDown = (e: PointerEvent) => {
      if (reduced.matches || !cfg.ripples) return;
      // The click's weight comes from what was clicked: a card is a boulder,
      // a toggle is a pebble. sqrt(area) normalized against a 320px card.
      let mass = 0.55;
      const el =
        e.target instanceof Element
          ? e.target.closest("a, button, [role='button'], article, section, div")
          : null;
      if (el) {
        const rect = el.getBoundingClientRect();
        const span = Math.sqrt(Math.max(1, rect.width * rect.height));
        mass = Math.min(1.7, Math.max(0.45, span / 320));
      }
      ripples.push({ x: e.clientX, y: e.clientY, born: performance.now(), mass });
      if (ripples.length > MAX_RIPPLES) ripples.shift();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerout", onLeave, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });

    // Static mode still tracks the page: redraw on scroll (scroll-linked
    // positioning is not autonomous motion) and after fonts settle layout,
    // so dim zones and the world grid stay aligned with the content.
    let scrollRaf = 0;
    const onScroll = () => {
      if (running) return; // the loop already reads scrollY every frame
      cancelAnimationFrame(scrollRaf);
      scrollRaf = requestAnimationFrame(() => {
        lastDimBuild = -1;
        draw(0);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    document.fonts?.ready.then(() => {
      lastDimBuild = -1;
      if (!running) draw(0);
    });

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const mo = new MutationObserver(restart);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const scheme = window.matchMedia("(prefers-color-scheme: dark)");
    scheme.addEventListener("change", restart);
    reduced.addEventListener("change", restart);
    window.addEventListener("resize", restart);

    restart();

    return () => {
      stop();
      cancelAnimationFrame(scrollRaf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerout", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("resize", restart);
      document.removeEventListener("visibilitychange", onVisibility);
      scheme.removeEventListener("change", restart);
      reduced.removeEventListener("change", restart);
      mo.disconnect();
    };
  }, [cfg]);

  return (
    <canvas
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 h-screen w-screen"
      ref={canvasRef}
      style={{ zIndex: -1 }}
    />
  );
}
