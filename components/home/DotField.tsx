"use client";

/**
 * DotField — the home page's ground: the wordmark's bracket dots, scaled to
 * a field that runs the whole page.
 *
 * A fixed viewport canvas draws a world-space dot grid: as you scroll, the
 * field scrolls with the page (world coordinates, not a repeating overlay).
 * A slow diagonal wave moves through the world (requests arriving); the
 * field brightens to meet it and settles, it never scrambles. A sparse
 * accent subset keeps its own cadence, the same accent that marks the quiet
 * tenant everywhere else. Near the pointer the dots lean in. Recessed bands
 * and cards paint over it, so the field lives in the page's open ground.
 *
 * Design-system §5 named exception (home background): canvas alpha/radius
 * motion only, pauses on hidden tabs, unmounts on navigation, and under
 * prefers-reduced-motion draws one flat static frame with no wave, no
 * pointer response, no scroll tracking, no loop — the frame the pixel gate
 * screenshots. Geometry is a fixed world grid: deterministic, no randomness.
 *
 * Colors resolve from the token layer (--ink-2, --accent) at mount and
 * re-resolve on theme flips. Alphas stay low; text contrast never moves.
 */

import { useEffect, useRef } from "react";

const SPACING = 44;
const BASE_R = 2;
const WAVELENGTH = 460;
const PERIOD_MS = 7000;
const POINTER_RADIUS = 200;

export function DotField() {
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
      const phaseShift = animate ? (t % PERIOD_MS) / PERIOD_MS : 0;
      // World-space rows visible in this viewport slice.
      const jFirst = Math.floor(scrollY / SPACING) - 1;
      const jLast = Math.ceil((scrollY + height) / SPACING) + 1;
      const cols = Math.ceil(width / SPACING) + 1;
      for (let i = 0; i < cols; i++) {
        for (let j = jFirst; j <= jLast; j++) {
          const worldX = i * SPACING + SPACING / 2;
          const worldY = j * SPACING + SPACING / 2;
          const x = worldX;
          const y = worldY - scrollY;
          const isAccent = (((i * 7 + j * 13) % 23) + 23) % 23 === 0;
          let alpha = isAccent ? 0.44 : 0.19;
          let r = BASE_R;
          if (animate) {
            // Diagonal traveling wave through world space: a smooth crest
            // that stays continuous as the page scrolls.
            const phase = (worldX + worldY) / WAVELENGTH - phaseShift * 2 * Math.PI;
            const crest = Math.max(0, Math.sin(phase)) ** 3;
            alpha += crest * (isAccent ? 0.55 : 0.34);
            r += crest * 1.1;
            if (pointer) {
              const d = Math.hypot(x - pointer.x, y - pointer.y);
              if (d < POINTER_RADIUS) {
                const near = (1 - d / POINTER_RADIUS) ** 2;
                alpha += near * 0.4;
                r += near * 1.4;
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

    const start = () => {
      if (running || reduced.matches || document.hidden) return;
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
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerout", onLeave, { passive: true });

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
      window.removeEventListener("resize", restart);
      document.removeEventListener("visibilitychange", onVisibility);
      scheme.removeEventListener("change", restart);
      reduced.removeEventListener("change", restart);
      mo.disconnect();
    };
  }, []);

  return (
    <canvas
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 h-screen w-screen"
      ref={canvasRef}
      style={{ zIndex: -1 }}
    />
  );
}
