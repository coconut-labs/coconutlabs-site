"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./atlas.module.css";

/* Data lifecycle — §4.2, fourteen stops. Loop-backs: 8→5 (late labels reshape
   features), 13/14→6 (promote / roll back returns traffic to serve). */
type Stop = { n: number; name: string; units: string[]; loop?: string; loopTo?: number };
const STOPS: Stop[] = [
  { n: 1, name: "Ingest", units: ["U1", "U8"] },
  { n: 2, name: "Validate", units: ["U1", "U8"] },
  { n: 3, name: "Land", units: ["U1", "U8"] },
  { n: 4, name: "Transform", units: ["U1", "U8"] },
  { n: 5, name: "Feature", units: ["U2", "U8"], loop: "↑ fed by 8" },
  { n: 6, name: "Serve", units: ["U4", "U8"] },
  { n: 7, name: "Capture", units: ["U5", "U6", "U7", "U8"] },
  { n: 8, name: "Label", units: ["U2", "U8"], loop: "→ 5", loopTo: 5 },
  { n: 9, name: "Monitor", units: ["U2", "U8"] },
  { n: 10, name: "Train", units: ["U2", "U8"] },
  { n: 11, name: "Gate", units: ["U2", "U8"] },
  { n: 12, name: "Canary", units: ["U3", "U8"] },
  { n: 13, name: "Promote", units: ["U3", "U8"], loop: "→ 6", loopTo: 6 },
  { n: 14, name: "Roll back", units: ["U3", "U8"], loop: "→ 6", loopTo: 6 },
];

/* Layers — §3.4. Identity is glyph + label (color-alone fails CVD, validated). */
type LayerKey = "data" | "devops" | "ai" | "swe";
const LAYERS: { key: LayerKey; name: string; glyph: string | undefined; blurb: string }[] = [
  { key: "data", name: "Data Core", glyph: styles.glyphData, blurb: "schemas · lineage · drift" },
  { key: "devops", name: "DevOps / Platform", glyph: styles.glyphDevops, blurb: "terraform · k8s · teardown" },
  { key: "ai", name: "AI", glyph: styles.glyphAi, blurb: "agents · routing · traces" },
  { key: "swe", name: "SWE Core", glyph: styles.glyphSwe, blurb: "boundaries · concurrency" },
];

/* Units — §1.2 (JD trace), §12.2 (claim + target tier), §3.4 (layer). */
type Unit = { id: string; title: string; claim: string; jd: string; tier: string; layer: LayerKey };
const UNITS: Unit[] = [
  { id: "U1", title: "Registry + lineage", layer: "data", tier: "T4", jd: "manage model registries", claim: "Promotion and rollback are gated and auditable; an ungated stage change is impossible." },
  { id: "U2", title: "Continuous-training loop", layer: "data", tier: "T4", jd: "continuous training loops", claim: "Injected drift triggers retrain → gate → promote end to end, unattended." },
  { id: "U4", title: "Agent on Kubernetes", layer: "devops", tier: "T4", jd: "deploy agents as scalable microservices", claim: "HPA on in-flight requests holds p99 under a burst where a CPU-triggered HPA does not." },
  { id: "U8", title: "IaC + teardown", layer: "devops", tier: "T3", jd: "Kubernetes, Docker, Terraform", claim: "One manifest set deploys unchanged to kind, k3s, and (by plan) EKS; live rebuilds from zero." },
  { id: "U3", title: "A/B router", layer: "ai", tier: "T4", jd: "A/B testing infrastructure", claim: "Arm assignment is stable and unbiased; a guardrail abort fires before the cost threshold breaches." },
  { id: "U5", title: "Cost plane", layer: "ai", tier: "T3", jd: "track token usage", claim: "Attributed cost reconciles with the provider's own usage figures within tolerance." },
  { id: "U7", title: "Reasoning path", layer: "ai", tier: "T3", jd: "agent reasoning paths", claim: "A run is fully reconstructable from spans alone, with no raw reasoning text stored." },
  { id: "U9", title: "Tooling comparison", layer: "ai", tier: "T3", jd: "MLflow / W&B / LangSmith", claim: "The registry choice is defensible on criteria fixed in advance, not asserted." },
  { id: "U6", title: "Latency + tail budget", layer: "swe", tier: "T4", jd: "latency", claim: "Per-hop attribution shows the platform owns ~1% of the budget; turn reduction beats code tuning." },
  { id: "U10", title: "Scale envelope", layer: "swe", tier: "T3", jd: "scalable microservice architectures", claim: "A documented capacity envelope names the actual binding constraint." },
];

/* Guided tour — seven stations picked for narrative weight, in act order.
   Every other station stays fully explorable outside the tour. */
type TourTarget = { kind: "stop"; id: number } | { kind: "unit"; id: string };
type TourStep = { target: TourTarget; act: 1 | 2 | 3; title: string; line: string; why: string };
const ACT_NAMES: Record<1 | 2 | 3, string> = { 1: "Ship", 2: "Drift", 3: "Recover" };
const TOUR: TourStep[] = [
  {
    target: { kind: "unit", id: "U1" }, act: 1, title: "Registry + lineage",
    line: "Every agent version is registered, the same way any model artifact would be.",
    why: "If a version is not in the registry it cannot ship, so nothing reaches users unexplained.",
  },
  {
    target: { kind: "stop", id: 11 }, act: 1, title: "Gate",
    line: "Before a version moves forward it must pass a fixed evaluation gate.",
    why: "The gate turns \"looks good\" into a recorded pass or fail.",
  },
  {
    target: { kind: "stop", id: 6 }, act: 2, title: "Serve",
    line: "The gated version meets real traffic here.",
    why: "This is the only stop users ever touch. Every later stop exists to protect it.",
  },
  {
    target: { kind: "stop", id: 9 }, act: 2, title: "Monitor",
    line: "Production drifts. Monitoring watches quality, latency, errors, and a fourth axis: tokens and cost.",
    why: "An agent can fail while returning 200s. Token spend is often the first signal that gives it away.",
  },
  {
    target: { kind: "stop", id: 12 }, act: 2, title: "Canary",
    line: "A new version gets a small slice of traffic before it gets all of it.",
    why: "A bad version hurts a few requests, not every user.",
  },
  {
    target: { kind: "stop", id: 14 }, act: 3, title: "Roll back",
    line: "Rollback is its own stop. It returns traffic to serve (stop 6) in one gated move.",
    why: "Recovery that is a first-class path takes minutes, not a war room.",
  },
  {
    target: { kind: "unit", id: "U7" }, act: 3, title: "Reasoning path",
    line: "Every run can be rebuilt afterward from stored spans alone.",
    why: "After an incident you can prove what the agent did, without keeping raw reasoning text.",
  },
];

type Pin = { kind: "stop"; id: number } | { kind: "unit"; id: string } | null;

export default function LifecycleMap() {
  // Hover drives desktop; click pins so touch + keyboard users get the same reveal.
  const [hoverStop, setHoverStop] = useState<number | null>(null);
  const [hoverUnit, setHoverUnit] = useState<string | null>(null);
  const [pin, setPin] = useState<Pin>(null);
  const [tourIndex, setTourIndex] = useState<number | null>(null);
  // "Every station, every claim" — open on desktop, closed on mobile (set on mount).
  const [claimsOpen, setClaimsOpen] = useState(true);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const startBtnRef = useRef<HTMLButtonElement | null>(null);
  const stationRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const registerStation = (key: string) => (el: HTMLButtonElement | null) => {
    if (el) stationRefs.current.set(key, el);
    else stationRefs.current.delete(key);
  };

  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) setClaimsOpen(false);
  }, []);

  const touring = tourIndex != null;
  const tourStep = touring ? TOUR[tourIndex] : null;
  const tourStopId = tourStep?.target.kind === "stop" ? tourStep.target.id : null;
  const tourUnitId = tourStep?.target.kind === "unit" ? tourStep.target.id : null;

  // The tour drives the highlight while active; hover/pin drive it otherwise.
  const activeStop = touring ? tourStopId : hoverStop ?? (pin?.kind === "stop" ? pin.id : null);
  const activeUnit = touring ? tourUnitId : hoverUnit ?? (pin?.kind === "unit" ? pin.id : null);

  const activeStopObj = STOPS.find((s) => s.n === activeStop) ?? null;
  const activeUnitObj = UNITS.find((u) => u.id === activeUnit) ?? null;
  const loopTargetN = activeStopObj?.loopTo ?? null;
  const stopsForActiveUnit = activeUnit ? STOPS.filter((s) => s.units.includes(activeUnit)).map((s) => s.n) : [];

  const togglePin = (next: Pin) => {
    // Clicking any station hands control back to free exploration.
    if (touring) setTourIndex(null);
    setPin((cur) =>
      cur && next && cur.kind === next.kind && cur.id === next.id ? null : next
    );
  };

  const startTour = () => {
    setPin(null);
    setHoverStop(null);
    setHoverUnit(null);
    setTourIndex(0);
  };
  const exitTour = () => {
    setTourIndex(null);
    requestAnimationFrame(() => startBtnRef.current?.focus());
  };
  const tourNext = () => {
    if (tourIndex == null) return;
    if (tourIndex >= TOUR.length - 1) exitTour();
    else setTourIndex(tourIndex + 1);
  };
  const tourBack = () => {
    if (tourIndex == null) return;
    if (tourIndex > 0) setTourIndex(tourIndex - 1);
  };

  // Bring the current tour station into view. Reduced motion: jump, no panning.
  useEffect(() => {
    if (tourIndex == null) return;
    const step = TOUR[tourIndex];
    if (!step) return;
    if (step.target.kind === "unit") setClaimsOpen(true);
    const key = step.target.kind === "stop" ? `stop-${step.target.id}` : `unit-${step.target.id}`;
    const raf = requestAnimationFrame(() => {
      const el = stationRefs.current.get(key);
      if (el) {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      }
      panelRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(raf);
  }, [tourIndex]);

  // Tour keys live at the window level, as the panel footer promises:
  // arrows move and Escape exits even when focus is not inside the panel
  // (a panel-scoped handler broke whenever focus drifted, and WebKit never
  // grants it to a tabIndex=-1 div). Bound ONCE per tour with functional
  // updates: rebinding per stop opened a gap where rapid keypresses were
  // dropped between remove and re-add.
  useEffect(() => {
    if (!touring) return;
    const exitToStart = () => requestAnimationFrame(() => startBtnRef.current?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setTourIndex((i) => {
          if (i == null) return i;
          if (i >= TOUR.length - 1) { exitToStart(); return null; }
          return i + 1;
        });
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setTourIndex((i) => (i == null || i === 0 ? i : i - 1));
      } else if (e.key === "Escape") {
        e.preventDefault();
        setTourIndex(null);
        exitToStart();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [touring]);

  return (
    <div className={styles.wrap}>
      {/* Announces the current tour stop; lives outside the panel so it exists
          before the first step renders. */}
      <div aria-live="polite" className="sr-only">
        {tourStep
          ? `Tour stop ${(tourIndex ?? 0) + 1} of ${TOUR.length}: ${tourStep.title}. ${tourStep.line}`
          : ""}
      </div>

      <section aria-label="Data lifecycle map">
        <div className={styles.mapHead}>
          <h2 className={styles.mapTitle}>The data lifecycle, fourteen stops</h2>
          <div className={styles.mapControls}>
            <button
              type="button"
              ref={startBtnRef}
              className={styles.tourStart}
              onClick={startTour}
              aria-pressed={touring}
            >
              Take the tour
            </button>
            <span className={styles.mapHint}>seven stops · or hover / tap any station</span>
          </div>
        </div>
        <ol className={styles.ribbon}>
          {STOPS.map((s) => {
            const lit = activeStop === s.n || (activeUnit != null && s.units.includes(activeUnit));
            const dim = activeUnit != null && !s.units.includes(activeUnit);
            const loopTarget = loopTargetN === s.n;
            const pinned = pin?.kind === "stop" && pin.id === s.n;
            const tourFocus = tourStopId === s.n;
            return (
              <li key={s.n} className="list-none">
                <button
                  type="button"
                  ref={registerStation(`stop-${s.n}`)}
                  aria-pressed={pinned}
                  className={`${styles.stop} ${lit ? styles.lit : ""} ${loopTarget ? styles.loopTarget : ""} ${dim ? styles.dim : ""} ${tourFocus ? styles.tourFocus : ""}`}
                  onMouseEnter={() => !touring && setHoverStop(s.n)}
                  onMouseLeave={() => setHoverStop(null)}
                  onFocus={() => !touring && setHoverStop(s.n)}
                  onBlur={() => setHoverStop(null)}
                  onClick={() => togglePin({ kind: "stop", id: s.n })}
                  aria-label={`Stop ${s.n}, ${s.name}. Claimed by ${s.units.join(", ")}.${s.loopTo ? ` Loops back to stop ${s.loopTo}.` : ""}`}
                >
                  <span className={styles.stopNum}>{String(s.n).padStart(2, "0")}</span>
                  <span className={styles.stopName}>{s.name}</span>
                  <span className={styles.stopUnits}>
                    {s.units.map((u) => (
                      <span key={u} className={styles.stopUnitTag}>{u}</span>
                    ))}
                  </span>
                  {s.loop && <span className={styles.loopFlag}>{s.loop}</span>}
                </button>
              </li>
            );
          })}
        </ol>
        <div className={styles.claimRow} aria-live={touring ? "off" : "polite"}>
          {activeUnitObj ? (
            <span>
              <b>{activeUnitObj.id}</b> claims stops {stopsForActiveUnit.join(", ")}: {activeUnitObj.claim}
            </span>
          ) : activeStopObj ? (
            <span>
              <b>Stop {String(activeStopObj.n).padStart(2, "0")} · {activeStopObj.name}</b>, claimed by {activeStopObj.units.join(", ")}
              {activeStopObj.loopTo ? ` · loops back to stop ${activeStopObj.loopTo}` : ""}
            </span>
          ) : (
            <span>Ten units, one per JD requirement. Each is built and written before the next starts.</span>
          )}
        </div>
      </section>

      {/* Progressive disclosure: the full per-unit claim index. Open on desktop,
          closed on mobile. Nothing removed; the tour opens it when it needs to. */}
      <details
        className={styles.claims}
        open={claimsOpen}
        onToggle={(e) => setClaimsOpen(e.currentTarget.open)}
      >
        <summary className={styles.claimsSummary}>
          <span className={styles.claimsTitle}>Every station, every claim</span>
          <span className={styles.claimsMeta}>ten units across four layers · each carries one falsifiable claim</span>
        </summary>
        <section aria-label="Units by layer">
          <div className={styles.layers}>
            {LAYERS.map((layer) => {
              const units = UNITS.filter((u) => u.layer === layer.key);
              return (
                <div key={layer.key} className={styles.layer}>
                  <div className={styles.layerHead}>
                    <span className={`${styles.glyph} ${layer.glyph ?? ""}`} aria-hidden />
                    <span className={styles.layerName}>{layer.name}</span>
                    <span className={styles.layerMeta}>{layer.blurb}</span>
                  </div>
                  <div className={styles.layerUnits}>
                    {units.map((u) => {
                      const active =
                        activeUnit === u.id || (activeStop != null && (STOPS.find((s) => s.n === activeStop)?.units.includes(u.id) ?? false));
                      const pinned = pin?.kind === "unit" && pin.id === u.id;
                      const tourFocus = tourUnitId === u.id;
                      return (
                        <button
                          type="button"
                          key={u.id}
                          ref={registerStation(`unit-${u.id}`)}
                          aria-pressed={pinned}
                          className={`${styles.unit} ${active ? styles.unitActive : ""} ${tourFocus ? styles.tourFocus : ""}`}
                          onMouseEnter={() => !touring && setHoverUnit(u.id)}
                          onMouseLeave={() => setHoverUnit(null)}
                          onFocus={() => !touring && setHoverUnit(u.id)}
                          onBlur={() => setHoverUnit(null)}
                          onClick={() => togglePin({ kind: "unit", id: u.id })}
                          aria-label={`${u.id} ${u.title}, target ${u.tier}. ${u.claim}`}
                        >
                          <span className={styles.unitTop}>
                            <span className={styles.unitId}>{u.id}</span>
                            <span className={styles.unitTitle}>{u.title}</span>
                            <span className={styles.tier} title="target evaluation tier (§12)">{u.tier}</span>
                          </span>
                          <span className={styles.unitClaim}>{u.claim}</span>
                          <span className={styles.unitJd}>JD · {u.jd}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </details>

      {tourStep && (
        <div
          ref={panelRef}
          tabIndex={-1}
          role="group"
          aria-label="Guided tour"
          className={styles.tourPanel}
        >
          <p className={styles.tourMeta}>
            Stop {(tourIndex ?? 0) + 1} of {TOUR.length} · Act {tourStep.act} · {ACT_NAMES[tourStep.act]}
          </p>
          <p className={styles.tourLine}>
            <b>{tourStep.title}.</b> {tourStep.line}
          </p>
          <p className={styles.tourWhy}>Why it matters: {tourStep.why}</p>
          <div className={styles.tourNav}>
            <button type="button" className={styles.tourBtn} onClick={tourBack} disabled={tourIndex === 0}>
              ← Back
            </button>
            <button type="button" className={`${styles.tourBtn} ${styles.tourBtnPrimary}`} onClick={tourNext}>
              {tourIndex === TOUR.length - 1 ? "Finish" : "Next →"}
            </button>
            <button type="button" className={styles.tourBtn} onClick={exitTour}>
              Exit
            </button>
            <span className={styles.tourKeys}>arrow keys move · Esc exits</span>
          </div>
        </div>
      )}
    </div>
  );
}
