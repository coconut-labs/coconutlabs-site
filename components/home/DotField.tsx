"use client";

/**
 * DotField — the hero background: the wordmark's bracket dots, scaled to a
 * field.
 *
 * A quiet grid of dots on the scheduler's clock. A slow diagonal wave moves
 * through the field (requests arriving); the field brightens to meet it and
 * settles, it never scrambles. A sparse accent subset keeps its own cadence,
 * the same accent that marks the quiet tenant everywhere else on the site.
 * Near the pointer the dots lean in a little, so the texture answers you
 * without becoming a toy.
 *
 * Design-system §5 named exception (hero background): opacity/transform-
 * class motion only (canvas alpha + radius), pauses offscreen and on hidden
 * tabs, and under prefers-reduced-motion draws one flat static frame with
 * no wave, no pointer response, no loop — which is exactly the frame the
 * pixel gate screenshots. Geometry is a fixed grid: deterministic, no
 * randomness, SSR-safe (canvas paints after mount; the SSR frame is empty
 * background, which reduced-motion baselines never see because the draw is
 * synchronous on mount).
 *
 * Colors are resolved from the token layer (--ink-2, --accent) at mount and
 * re-resolved on theme flips, so both schemes stay on-catalog. Alphas stay
 * low; contrast on the text above never moves.
 */

import { useEffect, useRef } from "react";

const SPACING = 44;
const BASE_R = 2;
const WAVELENGTH = 420;
const PERIOD_MS = 7000;
const POINTER_RADIUS = 160;

export function DotField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement?.parentElement;
    if (!canvas || !host) return;
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
    let visible = true;
    let pointer: { x: number; y: number } | null = null;

    const resolveColors = () => {
      const styles = getComputedStyle(document.documentElement);
      ink = styles.getPropertyValue("--ink-2").trim();
      accent = styles.getPropertyValue("--accent").trim();
    };

    const resize = () => {
      const rect = host.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    };

    const draw = (t: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const animate = !reduced.matches;
      const phaseShift = animate ? (t % PERIOD_MS) / PERIOD_MS : 0;
      const cols = Math.ceil(width / SPACING) + 1;
      const rows = Math.ceil(height / SPACING) + 1;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * SPACING + SPACING / 2;
          const y = j * SPACING + SPACING / 2;
          const isAccent = (i * 7 + j * 13) % 23 === 0;
          let alpha = isAccent ? 0.35 : 0.16;
          let r = BASE_R;
          if (animate) {
            // Diagonal traveling wave: a smooth crest, not a strobe.
            const phase = (x + y) / WAVELENGTH - phaseShift * 2 * Math.PI;
            const crest = Math.max(0, Math.sin(phase)) ** 3;
            alpha += crest * (isAccent ? 0.4 : 0.24);
            r += crest * 0.8;
            if (pointer) {
              const d = Math.hypot(x - pointer.x, y - pointer.y);
              if (d < POINTER_RADIUS) {
                const near = (1 - d / POINTER_RADIUS) ** 2;
                alpha += near * 0.35;
                r += near * 1.2;
              }
            }
          }
          // Soften toward the top and bottom edges so the field reads as
          // texture under the content, not a panel with borders.
          const edge = Math.min(1, Math.min(y, height - y) / 90);
          ctx.globalAlpha = Math.min(alpha, 0.85) * edge;
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

    const start = () => {
      if (running || reduced.matches || !visible || document.hidden) return;
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
      const rect = host.getBoundingClientRect();
      pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onLeave = () => {
      pointer = null;
    };
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);

    const io = new IntersectionObserver(([entry]) => {
      if (!entry) return;
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(host);

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Theme flips: explicit toggle writes data-theme; system flips fire the
    // scheme media query. Either way, re-resolve tokens and redraw.
    const mo = new MutationObserver(restart);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const scheme = window.matchMedia("(prefers-color-scheme: dark)");
    scheme.addEventListener("change", restart);
    reduced.addEventListener("change", restart);
    const ro = new ResizeObserver(restart);
    ro.observe(host);

    restart();

    return () => {
      stop();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      scheme.removeEventListener("change", restart);
      reduced.removeEventListener("change", restart);
      io.disconnect();
      mo.disconnect();
      ro.disconnect();
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <canvas className="absolute inset-0 h-full w-full" ref={canvasRef} />
    </div>
  );
}
