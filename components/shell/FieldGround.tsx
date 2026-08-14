"use client";

/* FieldGround — mounts the DotField fabric under every page.

   Route variants are RETIRED (2026-08-14, operator's call): one ground,
   everywhere, and the home page is the reference. Consistency beat
   per-page cleverness. The config below is the landing page's, verbatim.

   Retired variants, for the record, in case the argument comes back:

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

   They shared the same physics; only coefficients differed. */

import { DotField, type FieldConfig } from "./DotField";

const BASE: FieldConfig = {
  spacing: 28,
  baseR: 1.6,
  inkAlpha: 0.19,
  accentAlpha: 0.44,
  wave: "diag",
  wavelength: 460,
  periodMs: 6600,
  crestInk: 0.4,
  crestAccent: 0.62,
  crestR: 1.3,
  crestLift: 4,
  pulse: false,
  pulsePeriodMs: 1200,
  gravityPull: 7,
  gravityRadius: 210,
  ripples: true,
  rippleEnergy: 1,
};



export function FieldGround() {
  return <DotField cfg={BASE} />;
}
