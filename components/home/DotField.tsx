"use client";

/**
 * DotField — the home page's ground: the wordmark's bracket dots, scaled to
 * a fabric that runs the whole page.
 *
 * A fixed viewport canvas draws a world-space dot grid that scrolls with
 * the page. Three forces move it, all decorative, all deterministic in
 * geometry:
 *
 * - The wave: a slow diagonal crest through world space (requests
 *   arriving); the field brightens to meet it and settles.
 * - Gravity: the pointer is a mass. Nearby dots lean toward it and
 *   brighten, like fabric dimpling under a fingertip.
 * - Ripples: every click drops a stone. A ring spreads from the click
 *   point, displacing dots outward as the front passes, then the fabric
 *   settles. Ripple weight scales with the size of the element you
 *   clicked: a project card lands heavier than a small toggle, so the
 *   page's physics agree with its hierarchy.
 *
 * Design-system §5 named exception (home background): canvas
 * alpha/radius/displacement only, pauses on hidden tabs, unmounts on
 * navigation, and under prefers-reduced-motion draws one flat static frame
 * with no wave, no gravity, no ripples, no loop — the frame the pixel gate
 * screenshots. Colors resolve from the token layer and re-resolve on theme
 * flips. Alphas stay low; text contrast never moves.
 */

import { useEffect, useRef } from "react";

const SPACING = 34;
const BASE_R = 1.7;
const WAVELENGTH = 460;
const PERIOD_MS = 7000;
const POINTER_RADIUS = 210;
const POINTER_PULL = 7;
const MAX_RIPPLES = 8;
const RIPPLE_SPEED = 0.62; // px per ms
const RIPPLE_WIDTH = 110;

type Ripple = { x: number; y: number; born: number; mass: number };

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
      const phaseShift = animate ? (t % PERIOD_MS) / PERIOD_MS : 0;
      if (animate && ripples.length) {
        // A ripple is spent once its front has cleared the viewport diagonal.
        const reach = Math.hypot(width, height) + RIPPLE_WIDTH;
        ripples = ripples.filter((rp) => (t - rp.born) * RIPPLE_SPEED * rp.mass < reach * 1.2);
      }
      const jFirst = Math.floor(scrollY / SPACING) - 1;
      const jLast = Math.ceil((scrollY + height) / SPACING) + 1;
      const cols = Math.ceil(width / SPACING) + 1;
      for (let i = 0; i < cols; i++) {
        for (let j = jFirst; j <= jLast; j++) {
          const worldX = i * SPACING + SPACING / 2;
          const worldY = j * SPACING + SPACING / 2;
          let x = worldX;
          let y = worldY - scrollY;
          const isAccent = (((i * 7 + j * 13) % 23) + 23) % 23 === 0;
          let alpha = isAccent ? 0.44 : 0.19;
          let r = BASE_R;
          if (animate) {
            const phase = (worldX + worldY) / WAVELENGTH - phaseShift * 2 * Math.PI;
            const crest = Math.max(0, Math.sin(phase)) ** 3;
            alpha += crest * (isAccent ? 0.5 : 0.3);
            r += crest * 0.9;

            // Gravity: the fabric dimples toward the pointer.
            if (pointer) {
              const dx = pointer.x - x;
              const dy = pointer.y - y;
              const d = Math.hypot(dx, dy);
              if (d < POINTER_RADIUS && d > 0.001) {
                const near = (1 - d / POINTER_RADIUS) ** 2;
                x += (dx / d) * near * POINTER_PULL;
                y += (dy / d) * near * POINTER_PULL;
                alpha += near * 0.42;
                r += near * 1.3;
              }
            }

            // Ripples: expanding rings push the fabric outward as they pass.
            for (const rp of ripples) {
              const age = t - rp.born;
              const front = age * RIPPLE_SPEED * rp.mass;
              const dx = x - rp.x;
              const dy = y - rp.y;
              const d = Math.hypot(dx, dy);
              const off = d - front;
              if (Math.abs(off) < RIPPLE_WIDTH && d > 0.001) {
                // Gaussian ring profile, decaying as the ring travels.
                const ring = Math.exp(-(off * off) / (2 * (RIPPLE_WIDTH / 2.6) ** 2));
                const decay = Math.max(0, 1 - front / (900 * rp.mass));
                const energy = ring * decay * rp.mass;
                x += (dx / d) * energy * 9;
                y += (dy / d) * energy * 9;
                alpha += energy * 0.5;
                r += energy * 1.6;
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
    const onDown = (e: PointerEvent) => {
      if (reduced.matches) return;
      // The click's weight comes from what was clicked: a card is a boulder,
      // a toggle is a pebble. sqrt(area) normalized against a 320px card.
      let mass = 0.55;
      const el = e.target instanceof Element ? e.target.closest("a, button, [role='button'], article, section, div") : null;
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
