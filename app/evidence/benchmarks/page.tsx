import { buildMetadata } from "@/lib/seo";
import { CopyCommand } from "./CopyCommand";

export const metadata = buildMetadata({
  title: "Benchmarks · Coconut Labs",
  description:
    "The lab's public proof page. Every number carries its hardware, sample count, and methodology, and links to the raw artifact that produced it.",
  path: "/evidence/benchmarks",
});

// Every figure on this page comes from committed artifacts in
// coconut-labs/kvwarden. Regime: 1x A100 SXM4, Llama-3.1-8B-Instruct,
// vLLM 0.19.1, 300 s sustained, flooder 32 RPS + quiet tenant 1 RPS.
// Full-bench percentiles are the whole 300 s window; the hero p99 excludes
// the first 10 s JIT warmup transient per CORRECTIONS C7 in the repo.
const REGIME = "1× A100 SXM4 · Llama-3.1-8B · vLLM 0.19.1 · 300 s · flooder 32 RPS / quiet 1 RPS";

const STATS = [
  { label: "quiet tenant p99 TTFT", value: "61.5", unit: "ms", note: "1.14× of solo · post-warmup · n=311", tone: "good" },
  { label: "solo baseline p99", value: "53.9", unit: "ms", note: "same box, no contention · n=320", tone: "plain" },
  { label: "tail vs FIFO", value: "26×", unit: "", note: "1,585 ms down to 61.5 ms", tone: "plain" },
  { label: "quiet requests", value: "321", unit: "ok", note: "0 errors, both arms", tone: "plain" },
] as const;

// CSS bar chart: percentile spread of the quiet tenant, kvwarden arm,
// full 300 s bench. FIFO p99 drawn as the off-scale reference.
const SCALE_MAX = 80; // ms, x-axis ceiling; FIFO p99 is 20x past it
const BARS = [
  { label: "p50", ms: 37.9 },
  { label: "p95", ms: 51.4 },
  { label: "p99 (post-warmup)", ms: 61.5 },
] as const;

export default function BenchmarksPage() {
  return (
    <section className="content-band">
      <div className="content-inner">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase text-ink-2">the proof page</p>
            <h1 className="mt-5 text-[clamp(30px,4vw,46px)] leading-[1.05] tracking-[-0.03em]">Benchmarks</h1>
          </div>
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-2">
            <span aria-hidden="true" className="text-success">●</span> published from committed artifacts · kvwarden v0.1.6
          </p>
        </div>

        <p className="mt-6 max-w-2xl text-base leading-7 text-ink-1">
          This is the lab&rsquo;s proof page: every number we cite in public lives here, and a
          number without its hardware, sample count, and methodology is not a result. Every figure
          below carries all three and links to the raw artifact that produced it.
        </p>

        {/* stat grid */}
        <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-sm border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s) => (
            <div className="bg-bg-1 p-5" key={s.label}>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-2">{s.label}</p>
              <p className="mt-3 text-[clamp(1.7rem,2.4vw,2.1rem)] font-semibold tracking-[-0.03em] text-ink-0">
                {s.value}
                {s.unit ? <span className="ml-1 text-sm font-normal text-ink-2">{s.unit}</span> : null}
              </p>
              <p className={`mt-2 font-mono text-[11px] ${s.tone === "good" ? "text-success" : "text-ink-2"}`}>{s.note}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 font-mono text-[11px] text-ink-2">{REGIME}</p>

        {/* percentile bars */}
        <div className="mt-12 rounded-sm border border-rule bg-bg-1 p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[22px] font-semibold tracking-[-0.03em]">Quiet-tenant TTFT under flood</h2>
            <p className="font-mono text-[11px] text-ink-2">kvwarden token bucket · full 300 s bench</p>
          </div>
          <div className="mt-6 space-y-4">
            {BARS.map((b) => (
              <div className="grid grid-cols-[9rem_1fr_4.5rem] items-center gap-3" key={b.label}>
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-2">{b.label}</span>
                <div className="h-4 rounded-sm bg-bg-2">
                  <div
                    className="h-4 rounded-sm bg-accent"
                    style={{ width: `${Math.min(100, (b.ms / SCALE_MAX) * 100)}%` }}
                  />
                </div>
                <span className="text-right font-mono text-sm text-ink-0">{b.ms} ms</span>
              </div>
            ))}
            <div className="grid grid-cols-[9rem_1fr_4.5rem] items-center gap-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-2">p99 · FIFO</span>
              <div className="h-4 rounded-sm border border-dashed border-danger/60 bg-transparent">
                <div className="h-full w-full rounded-sm bg-danger/15" />
              </div>
              <span className="text-right font-mono text-sm text-danger">1,585 ms</span>
            </div>
          </div>
          <p className="mt-4 border-t border-[var(--hair)] pt-3 font-mono text-[11px] leading-5 text-ink-2">
            FIFO bar is off scale: the axis ends at {SCALE_MAX} ms and the FIFO tail is 20× past it.
            That gap is the product. p50 and p95 are the full bench; p99 excludes the first 10 s
            warmup transient, methodology in CORRECTIONS C7.
          </p>
        </div>

        {/* walkthrough */}
        <details className="group mt-10 rounded-sm border border-rule bg-bg-1">
          <summary className="focus-ring flex cursor-pointer items-center gap-2 p-4 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2">
            Watch the walkthrough (35 s, silent)
          </summary>
          <div className="border-t border-[var(--hair)] p-4">
            <video className="w-full rounded-sm" controls preload="none" src="/walkthroughs/benchmarks-walkthrough.webm" />
            <p className="mt-2 font-mono text-[10.5px] text-ink-2">
              The proof page top to bottom: plot, tables, the honesty panel, the reproduce bar ·
              recorded from this page, unedited.
            </p>
          </div>
        </details>

        {/* honesty panel */}
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-sm border border-danger/40 bg-bg-1 p-6">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-danger">what this does not show</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-ink-1">
              <li>The starvation regime is A100-at-saturation. On H100 at the same offered load, FIFO does not starve, so the mechanism runs clean but is not stressed.</li>
              <li>An earlier run on vLLM 0.8.5 measured 523× starvation. The v1 batcher absorbs cold-start backpressure better; 26× is the honest steady-state number and the only one we cite.</li>
              <li>Full-bench p99 for the KVWarden arm is 1,230 ms including the warmup transient. The 61.5 ms hero is post-warmup by stated method, not by trimming inconvenient data silently.</li>
              <li>Flooder rejections are the mechanism working: 6,488 requests got 429, by design.</li>
            </ul>
          </div>
          <div className="rounded-sm border border-rule bg-bg-1 p-6">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2">raw artifacts</h2>
            <ul className="mt-4 space-y-3 font-mono text-[13px] leading-6">
              <li>
                <a className="focus-ring text-accent underline decoration-1 underline-offset-2" href="https://github.com/coconut-labs/kvwarden/tree/main/results/gate2_preprint_v3">
                  results/gate2_preprint_v3/
                </a>
                <span className="ml-2 text-ink-2">arm summaries, per-window traces</span>
              </li>
              <li>
                <a className="focus-ring text-accent underline decoration-1 underline-offset-2" href="https://github.com/coconut-labs/kvwarden/blob/main/results/CORRECTIONS.md">
                  results/CORRECTIONS.md
                </a>
                <span className="ml-2 text-ink-2">every caveat we know about, C1 to C7</span>
              </li>
              <li>
                <a className="focus-ring text-accent underline decoration-1 underline-offset-2" href="https://github.com/coconut-labs/kvwarden/blob/main/docs/launch/gate2_fairness_runbook.md">
                  docs/launch/gate2_fairness_runbook.md
                </a>
                <span className="ml-2 text-ink-2">how to run it yourself</span>
              </li>
            </ul>
            <div className="mt-5">
              <CopyCommand command="pip install kvwarden==0.1.6" />
            </div>
          </div>
        </div>

        <p className="mt-10 max-w-2xl text-sm leading-6 text-ink-1">
          The bench we most want does not exist yet: yours. Run it against your own traffic and
          tell us where it breaks. That is worth more to this lab than a star.
        </p>
      </div>
    </section>
  );
}
