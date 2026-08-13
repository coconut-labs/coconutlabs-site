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
      const scrollY = animate ? window.scrollY : 0;
      const phaseShift = animate ? (t % cfg.periodMs) / cfg.periodMs : 0;
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
            if (cfg.wave !== "none") {
              const along = cfg.wave === "diag" ? worldX + worldY : worldY;
              const phase = along / cfg.wavelength - phaseShift * 2 * Math.PI;
              const crest = Math.max(0, Math.sin(phase)) ** 3;
              alpha += crest * (isAccent ? cfg.crestAccent : cfg.crestInk);
              r += crest * cfg.crestR;
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
