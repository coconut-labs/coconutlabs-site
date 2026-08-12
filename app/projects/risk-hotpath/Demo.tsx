"use client";

import { useEffect, useRef, useState } from "react";
import DemoShell, { type Outcome } from "@/components/demos/DemoShell";
import PresetButton from "@/components/demos/PresetButton";
import {
  type GateExports,
  type RunResult,
  type ScenarioId,
  type TapeEntry,
  SCENARIOS,
  STREAM_LEN,
  loadGate,
  initDefault,
  runScenario,
} from "./gate";

/* The live tape: the session's 600 already-computed decisions replay as a
   scrolling wire log with running counters, so the page reads as software
   operating, not a form submitting. The banner and table state the final
   truth instantly (the functional tier asserts those); the tape is
   presentation. Under prefers-reduced-motion it renders the finished tail
   with no replay. */
const TAPE_WINDOW = 14;
const TAPE_LINES_PER_TICK = 5;
const TAPE_TICK_MS = 40;

function TapeLine({ e }: { e: TapeEntry }) {
  const rejected = e.decision !== "Accept";
  return (
    <p className="whitespace-nowrap leading-5">
      <span className="text-ink-2">#{String(e.id).padStart(3, "0")}</span>{" "}
      <span className={e.side === "BUY" ? "text-ink-0" : "text-ink-1"}>{e.side}</span>{" "}
      <span className="text-ink-1">
        {e.qty}@{e.price.toFixed(2)}
      </span>{" "}
      <span className="text-ink-2">S{String(e.symbol).padStart(3, "0")}</span>{" "}
      {rejected ? (
        <span className="text-danger">✕ {e.decision.replace("Reject", "")}</span>
      ) : (
        <span className="text-success">✓ accept</span>
      )}
    </p>
  );
}

function OrderTape({ tape }: { tape: TapeEntry[] }) {
  const [pos, setPos] = useState(0);

  useEffect(() => {
    setPos(0);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPos(tape.length);
      return;
    }
    const timer = setInterval(() => {
      setPos((p) => {
        const nextPos = p + TAPE_LINES_PER_TICK;
        if (nextPos >= tape.length) {
          clearInterval(timer);
          return tape.length;
        }
        return nextPos;
      });
    }, TAPE_TICK_MS);
    return () => clearInterval(timer);
  }, [tape]);

  const seen = tape.slice(0, pos);
  const accepted = seen.filter((e) => e.decision === "Accept").length;
  const visible = seen.slice(-TAPE_WINDOW);

  return (
    <div className="rounded-sm border border-rule bg-bg-2/60" data-testid="order-tape">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-b border-hair px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-2">
        <span>wire · session tape</span>
        <span aria-live="off">
          {pos}/{tape.length} orders · <span className="text-success">{accepted} accepted</span> ·{" "}
          <span className={pos - accepted > 0 ? "text-danger" : ""}>{pos - accepted} rejected</span>
        </span>
      </div>
      <div className="h-[19rem] overflow-hidden px-4 py-3 font-mono text-[12px]">
        {visible.map((e, i) => (
          <TapeLine e={e} key={`${pos}-${i}`} />
        ))}
        {pos < tape.length ? <p className="leading-5 text-ink-2">▮</p> : null}
      </div>
    </div>
  );
}

const RULE_LABEL: Record<string, string> = {
  RejectMaxQuantity: "max quantity",
  RejectMaxNotional: "max notional",
  RejectPriceCollar: "price collar",
  RejectCreditLimit: "credit limit",
  RejectDuplicate: "duplicate id",
  RejectZeroQuantity: "zero quantity",
  RejectInvalidPrice: "invalid price",
  RejectInvalidConfig: "invalid config",
};

export default function Demo() {
  const gateRef = useRef<GateExports | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [activeId, setActiveId] = useState<ScenarioId | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const [bench, setBench] = useState<string | null>(null);
  const [benchRunning, setBenchRunning] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/demos/risk_gate_wasm.wasm");
        const gate = await loadGate(await res.arrayBuffer());
        if (cancelled) return;
        initDefault(gate);
        gateRef.current = gate;
        setReady(true);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const active = SCENARIOS.find((s) => s.id === activeId) ?? null;

  const run = (id: ScenarioId | null) => {
    setActiveId(id);
    const gate = gateRef.current;
    if (!gate || id === null) {
      setResult(null);
      return;
    }
    setResult(runScenario(gate, id));
  };

  const runBench = () => {
    const gate = gateRef.current;
    if (!gate || benchRunning) return;
    setBenchRunning(true);
    // Let the button state paint before the synchronous 5M-eval call.
    setTimeout(() => {
      initDefault(gate);
      const n = 5_000_000;
      const t0 = performance.now();
      gate.rg_bench(BigInt(n), 7n);
      const dt = performance.now() - t0;
      const mps = n / (dt / 1000) / 1e6;
      setBench(`${mps.toFixed(1)}M evals/sec (${dt.toFixed(0)} ms for 5M orders, this browser, just now)`);
      setBenchRunning(false);
      // Bench shares the gate; reset any scenario view so counts stay true.
      setActiveId(null);
      setResult(null);
    }, 30);
  };

  const dominantRule = result
    ? Object.entries(result.byRule).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0]
    : undefined;

  const outcome: Outcome = failed
    ? {
        tone: "neutral",
        label: "gate unavailable",
        headline: "The wasm module failed to load in this browser. The source repo and its native benchmarks are linked below.",
      }
    : !ready
      ? {
          tone: "neutral",
          label: "loading the gate",
          headline: "Fetching the 3.3KB wasm build of the risk-gate crate.",
        }
      : active === null
        ? {
            tone: "neutral",
            label: "gate armed",
            headline:
              "The real Rust crate is instantiated in your browser with its default limits. Pick a session to stream orders through it.",
          }
        : result && result.rejected === 0
          ? {
              tone: "success",
              label: "clean pass",
              headline: `All ${result.total} orders accepted. Nothing fired, which is the point: the gate is invisible until something is wrong.`,
            }
          : {
              tone: "danger",
              label: `${result?.rejected ?? 0} rejected`,
              headline: `${active.seat} The gate accepted ${result?.accepted ?? 0} of ${result?.total ?? 0} orders and rejected ${result?.rejected ?? 0}${
                dominantRule ? `, mostly on the ${RULE_LABEL[dominantRule[0]] ?? dominantRule[0]} rule` : ""
              }.`,
              detail: result
                ? Object.entries(result.byRule)
                    .map(([rule, n]) => `${RULE_LABEL[rule] ?? rule}: ${n}`)
                    .join(" · ")
                : undefined,
            };

  return (
    <DemoShell
      scenario={`You are the risk desk. Every order below streams through the actual risk-gate crate, compiled to 3.3KB of wasm and running in your browser right now: not a simulation of the Rust, the Rust. Each session is ${STREAM_LEN} deterministic orders.`}
      controlsLabel="pick a session"
      controls={
        <div className="flex flex-wrap gap-2">
          <PresetButton active={activeId === null} onClick={() => run(null)}>
            Reset
          </PresetButton>
          {SCENARIOS.map((s) => (
            <PresetButton active={activeId === s.id} danger={s.danger} key={s.id} onClick={() => run(s.id)}>
              {s.label}
            </PresetButton>
          ))}
        </div>
      }
      outcome={outcome}
      footnote={
        <>
          Streams are seeded and deterministic: the same session always produces the same decisions.
          Wall-clock numbers are measured in your browser at click time and will differ by machine.{" "}
          <button
            className="focus-ring rounded-sm text-accent underline decoration-1 underline-offset-2 disabled:opacity-50"
            disabled={!ready || benchRunning}
            onClick={runBench}
            type="button"
          >
            {benchRunning ? "running 5M evals…" : "measure evals/sec on your hardware"}
          </button>
          {bench ? <span className="ml-2 text-ink-1">{bench}</span> : null}
        </>
      }
    >
      {result ? (
        <div className="space-y-6">
          <OrderTape tape={result.tape} />
          <div className="overflow-x-auto">
          <table className="w-full min-w-[26rem] border-collapse font-mono text-sm">
            <thead>
              <tr className="border-b border-rule text-left text-xs uppercase text-ink-2">
                <th className="py-2 font-normal">outcome</th>
                <th className="py-2 font-normal">orders</th>
                <th className="py-2 font-normal">share</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-rule/60">
                <td className="py-2.5 text-success">✓ accepted</td>
                <td className="py-2.5 text-ink-0">{result.accepted}</td>
                <td className="py-2.5 text-ink-2">{((result.accepted / result.total) * 100).toFixed(1)}%</td>
              </tr>
              {Object.entries(result.byRule).map(([rule, n]) => (
                <tr className="border-b border-rule/60" key={rule}>
                  <td className="py-2.5 text-danger">✕ {RULE_LABEL[rule] ?? rule}</td>
                  <td className="py-2.5 text-ink-0">{n}</td>
                  <td className="py-2.5 text-ink-2">{(((n ?? 0) / result.total) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 font-mono text-[10.5px] text-ink-2">
            {STREAM_LEN} evaluations took {result.elapsedMs < 1 ? "under a millisecond" : `${result.elapsedMs.toFixed(1)} ms`} through
            the wasm boundary, measured just now. The tape replays those decisions at reading
            speed; the gate itself was already done.
          </p>
          </div>
        </div>
      ) : null}
    </DemoShell>
  );
}
