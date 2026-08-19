import Link from "next/link";
import { CoconutLabsLogo } from "@/components/primitives/CoconutLabsLogo";
import { getLatestPostSlug } from "@/lib/content";

// Direction A home hero: measurement first. Left column is the claim, right
// column is the plot card that backs it, stat rail underneath. The DotField
// ground behind it is mounted page-wide by app/page.tsx, not here.
const BARS = [
  { label: "solo", ms: 53.9, cls: "bg-ink-2" },
  { label: "kvwarden", ms: 61.5, cls: "bg-accent" },
] as const;
const SCALE_MAX = 80;

export async function Hero() {
  const latestSlug = await getLatestPostSlug();

  return (
    <section className="relative isolate overflow-hidden px-[var(--space-page-x)] py-20">
      <div className="relative mx-auto grid max-w-[88rem] items-end gap-[clamp(24px,4vw,56px)] md:grid-cols-[minmax(320px,1.15fr)_minmax(320px,1fr)]">
        <div>
          <p className="mb-6 font-mono text-xs uppercase tracking-[0.16em] text-ink-2">independent inference research</p>
          <h1 className="block leading-none text-ink-0">
            <CoconutLabsLogo
              animate
              ariaLabel="Coconut Labs"
              style={{
                display: "inline-flex",
                fontSize: "clamp(2.4rem, 6.4vw, 4.2rem)",
                maxWidth: "100%",
              }}
            />
          </h1>
          <p className="mt-8 max-w-[44ch] text-xl leading-8 text-ink-1">
            A quiet tenant keeps its latency under load. We build the schedulers that make that
            true and measure them on rented hardware. The parts that failed are published too.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              className="focus-ring inline-flex min-h-[44px] items-center gap-2 rounded-sm bg-ink-0 px-[18px] font-mono text-[11.5px] uppercase tracking-[0.1em] text-bg-0 transition hover:opacity-90"
              data-cta="hero"
              href={`/evidence/${latestSlug}`}
            >
              Read the latest result <span aria-hidden="true">→</span>
            </Link>
            <Link
              className="focus-ring inline-flex min-h-[44px] items-center gap-2 rounded-sm border border-rule bg-bg-0/80 px-[18px] font-mono text-[11.5px] uppercase tracking-[0.1em] text-ink-0 transition hover:border-accent hover:text-accent"
              href="/evidence/benchmarks"
            >
              The proof page
            </Link>
          </div>
        </div>

        {/* plot card */}
        <div className="rounded-sm border border-rule bg-bg-1 p-[22px] shadow-[var(--shadow-soft)]">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-0">quiet-tenant p99 TTFT</p>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-2">flooder 32 rps · 300 s</p>
          </div>
          <div className="mt-5 space-y-3">
            {BARS.map((b) => (
              <div className="grid grid-cols-[6.5rem_1fr_4rem] items-center gap-3" key={b.label}>
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-2">{b.label}</span>
                <div className="h-3.5 rounded-sm bg-bg-2">
                  <div className={`h-3.5 rounded-sm ${b.cls}`} style={{ width: `${(b.ms / SCALE_MAX) * 100}%` }} />
                </div>
                <span className="text-right font-mono text-[13px] text-ink-0">{b.ms} ms</span>
              </div>
            ))}
            <div className="grid grid-cols-[6.5rem_1fr_4rem] items-center gap-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-2">fifo</span>
              <div className="h-3.5 rounded-sm border border-dashed border-danger/60">
                <div className="h-full w-full rounded-sm bg-danger/15" />
              </div>
              <span className="text-right font-mono text-[13px] text-danger">1,585</span>
            </div>
          </div>
          <p className="mt-4 border-t border-[var(--hair)] pt-3 font-mono text-[10.5px] leading-5 text-ink-2">
            1× A100 · Llama-3.1-8B · vLLM 0.19.1 · n=311 post-warmup · FIFO bar off scale.{" "}
            <Link className="focus-ring text-accent underline decoration-1 underline-offset-2" href="/evidence/benchmarks">
              full provenance
            </Link>
          </p>
        </div>
      </div>

      {/* stat rail */}
      <div className="relative mx-auto mt-14 grid max-w-[88rem] grid-cols-2 gap-px overflow-hidden rounded-sm border border-rule bg-rule md:grid-cols-4">
        {[
          { label: "ratio to solo", value: "1.14×" },
          { label: "vs fifo tail", value: "26×" },
          { label: "harness", value: "public" },
          { label: "engineers", value: "two" },
        ].map((s) => (
          <div className="bg-bg-1 px-5 py-[18px]" key={s.label}>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-2">{s.label}</p>
            <p className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-ink-0">{s.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
