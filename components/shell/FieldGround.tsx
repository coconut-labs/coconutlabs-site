"use client";

/* FieldGround — mounts the DotField fabric under every page and picks the
   variant from the route, so each page's ground argues that page's case:

   - home        the full fabric: diagonal request wave, gravity, ripples.
   - benchmarks  the metronome: no wave, the accent subset ticks a steady
                 beat. The page's whole claim is a quiet tenant keeping its
                 cadence under load; the ground keeps one too.
   - cadence     the ledger: the wave runs straight down, slow, like a
                 nightly record scrolling past.
   - drawings    graph paper: finer, fainter grid, no wave. A drafting
                 table, not a stage.
   - research/*  the reading room: faintest of all, no wave, soft ripples.
                 Prose owns the page; the ground just holds it.
   - elsewhere   the quiet default: slow diagonal wave, gentle everything.

   All variants share the same physics and the same §5 discipline; only the
   coefficients change. Remounts on variant change via key. */

import { usePathname } from "next/navigation";
import { DotField, type FieldConfig } from "./DotField";

const BASE: FieldConfig = {
  spacing: 28,
  baseR: 1.6,
  inkAlpha: 0.13,
  accentAlpha: 0.3,
  wave: "diag",
  wavelength: 460,
  periodMs: 8000,
  crestInk: 0.26,
  crestAccent: 0.42,
  crestR: 1.0,
  crestLift: 2.5,
  pulse: false,
  pulsePeriodMs: 1200,
  gravityPull: 5,
  gravityRadius: 190,
  ripples: true,
  rippleEnergy: 0.7,
};

const VARIANTS: Record<string, Partial<FieldConfig>> = {
  home: {
    inkAlpha: 0.19,
    accentAlpha: 0.44,
    periodMs: 6600,
    crestInk: 0.4,
    crestAccent: 0.62,
    crestR: 1.3,
    crestLift: 4,
    gravityPull: 7,
    gravityRadius: 210,
    rippleEnergy: 1,
  },
  metronome: {
    wave: "none",
    pulse: true,
    accentAlpha: 0.34,
  },
  ledger: {
    wave: "down",
    wavelength: 380,
    periodMs: 9000,
    crestLift: 3,
  },
  graph: {
    spacing: 22,
    baseR: 1.4,
    inkAlpha: 0.1,
    accentAlpha: 0.22,
    wave: "none",
    gravityPull: 4,
    rippleEnergy: 0.5,
  },
  reading: {
    inkAlpha: 0.09,
    accentAlpha: 0.2,
    wave: "none",
    gravityPull: 3,
    rippleEnergy: 0.4,
  },
};

function variantFor(path: string): string {
  if (path === "/") return "home";
  if (path === "/benchmarks") return "metronome";
  if (path === "/cadence") return "ledger";
  if (path === "/drawings") return "graph";
  if (path.startsWith("/research/")) return "reading";
  return "default";
}

export function FieldGround() {
  const pathname = usePathname();
  const name = variantFor(pathname ?? "/");
  const cfg: FieldConfig = { ...BASE, ...(VARIANTS[name] ?? {}) };
  return <DotField cfg={cfg} key={name} />;
}
