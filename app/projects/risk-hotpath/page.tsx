import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import Disclosure from "@/components/demos/Disclosure";
import Steps from "@/components/demos/Steps";
import Demo from "./Demo";

export const metadata = buildMetadata({
  title: "Pre-trade risk gate · Coconut Labs",
  description:
    "A 500-line no_std Rust crate that evaluates pre-trade risk in 37ns, running for real in your browser as 3.3KB of wasm.",
  path: "/projects/risk-hotpath",
});

const CHECKS = [
  { rule: "quantity nonzero", catches: "empty orders" },
  { rule: "price valid", catches: "NaN / negative / infinite prices" },
  { rule: "max quantity", catches: "fat-finger size errors" },
  { rule: "max notional", catches: "value-based size errors" },
  { rule: "price collar", catches: "orders far through the reference price" },
  { rule: "credit limit", catches: "cumulative per-trader exposure" },
  { rule: "duplicate id", catches: "gateway replays inside the window" },
];

export default function RiskHotpathPage() {
  return (
    <section className="content-band">
      <div className="content-inner max-w-4xl">
        <p className="font-mono text-xs uppercase text-ink-2">gallery unit · execution core</p>
        <h1 className="mt-5 text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.02]">Pre-trade risk gate</h1>

        {/* hook */}
        <p className="mt-6 max-w-2xl text-xl leading-9 text-ink-1">
          Every order in electronic trading passes through a risk gate before it can reach the
          exchange. The gate gets nanoseconds to say no: too slow and the order misses the market,
          too lax and one fat-fingered keystroke buys a company.
        </p>

        {/* scenario sandbox */}
        <div className="mt-10">
          <Demo />
        </div>

        {/* what you are looking at */}
        <div className="mt-12">
          <Steps
            items={[
              {
                label: "order in",
                text: "A seeded session of 600 synthetic orders streams in: prices around a reference, sizes inside limits, until the session you picked injects its failure.",
              },
              {
                label: "seven checks",
                text: "Each order runs the crate's full check chain, cheapest first: sanity, size caps, price collar, credit exposure, duplicate detection. First failure short-circuits.",
              },
              {
                label: "decision out",
                text: "Accept or a named rejection rule. The banner totals the session; the table breaks rejections down by rule.",
              },
            ]}
          />
        </div>

        {/* go deeper */}
        <div className="mt-14 border-t border-rule">
          <h2 className="sr-only">Go deeper</h2>

          <Disclosure summary="Watch the walkthrough (35 s, silent)">
            <video className="w-full rounded-sm" controls preload="none" src="/walkthroughs/risk-hotpath-walkthrough.webm" />
            <p className="mt-2 font-mono text-[10.5px] text-ink-2">
              Four sessions streamed through the gate, then the hardware bench · recorded from this
              page, unedited.
            </p>
          </Disclosure>

          <Disclosure summary="The measured result: 37ns per evaluation" defaultOpenDesktop>
            <p className="max-w-2xl font-mono text-lg leading-relaxed text-ink-0">
              The full seven-check evaluation runs in 37 nanoseconds with zero heap allocation.
            </p>
            <div className="mt-6 rounded-lg border border-rule bg-bg-1/60 p-5 md:p-7">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[30rem] border-collapse font-mono text-sm">
                  <thead>
                    <tr className="border-b border-rule text-left text-xs uppercase text-ink-2">
                      <th className="py-2 font-normal">claim</th>
                      <th className="py-2 font-normal">evidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["37ns full 7-check evaluation", "cargo bench -p risk-gate (Criterion)"],
                      ["23M evals/sec sustained", "hot_swap_demo, native, repo hardware"],
                      ["P99 42ns, no delta during config swap", "hot-swap demo, swap at window 3"],
                      ["zero heap allocation", "#![no_std]: no Vec, HashMap, or String in the crate"],
                      ["no input bypasses any rule", "8 proptest property-test invariants"],
                      ["1.5M events/sec streaming replay", "780K-event day replayed in 0.52s"],
                    ].map(([claim, evidence]) => (
                      <tr className="border-b border-rule/60" key={claim}>
                        <td className="py-2.5 text-ink-0">{claim}</td>
                        <td className="py-2.5 text-ink-2">{evidence}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-5 font-mono text-xs leading-6 text-ink-2">
                Native numbers come from the repo&rsquo;s committed benchmark harness on its own
                machine; the regime travels with each claim in the repo README. What runs on this
                page is the same crate through a wasm boundary, so use the measure button above for
                the number your hardware actually produces.
              </p>
            </div>
          </Disclosure>

          <Disclosure summary="The seven checks, in evaluation order">
            {/* A rule and a one-line gloss. Nothing is compared across columns,
                so this is a list. The browser numbers it, which is what the
                old counter column was doing by hand. */}
            <ol className="max-w-2xl list-decimal space-y-3 pl-6 marker:font-mono marker:text-sm marker:text-ink-2">
              {CHECKS.map((c) => (
                <li key={c.rule} className="pl-1">
                  <span className="font-mono text-sm text-ink-0">{c.rule}</span>
                  <span className="mt-0.5 block text-sm leading-6 text-ink-1">{c.catches}</span>
                </li>
              ))}
            </ol>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-ink-1">
              Ordering is a performance decision: checks are sorted by expected failure frequency so
              the common rejection exits earliest. Credit and duplicate state live in fixed-size
              arrays chosen at compile time, which is why the crate needs no allocator and why the
              whole thing fits in 3.3KB of wasm.
            </p>
          </Disclosure>

          <Disclosure summary="Why the browser demo is the real thing">
            <p className="max-w-2xl text-lg leading-8 text-ink-1">
              The demo does not reimplement the gate in JavaScript. The <code className="font-mono text-base">no_std</code>{" "}
              crate compiles to wasm with a flat C ABI (no wasm-bindgen, no glue, no allocator), and
              this page instantiates that 3.3KB module directly. Same source, same checks, same
              decisions as the native build: the property tests hold on both sides of the boundary.
            </p>
            <pre className="mt-6 overflow-x-auto rounded-lg border border-rule bg-bg-2/50 p-6 font-mono text-xs leading-6 text-ink-1">
{`risk-gate (no_std Rust crate)
   ├── native: cargo bench → 37ns/eval, 23M evals/sec
   └── wasm32-unknown-unknown → 3.3KB cdylib
         └── this page: WebAssembly.instantiate → rg_evaluate per order`}
            </pre>
          </Disclosure>

          <Disclosure summary="Evidence + how to reproduce">
            <p className="max-w-2xl font-mono text-xs leading-6 text-ink-2">
              Everything on this page traces to a command in the public repo. The bench, the
              property tests, the replay, and the wasm build are all reproducible on a laptop:
            </p>
            <pre className="mt-5 overflow-x-auto rounded-lg border border-rule bg-bg-2/50 p-5 font-mono text-sm text-ink-1">
{`cargo bench -p risk-gate                       # the 37ns claim
cargo test -p risk-gate                        # 8 proptest invariants
cargo run --release -p risk_core -- replay \\
  --input data/generated/day_01.jsonl          # 1.5M events/sec replay
cargo build --release -p risk-gate-wasm \\
  --target wasm32-unknown-unknown              # this page's module`}
            </pre>
          </Disclosure>

          <Disclosure summary="What it doesn't do">
            <ul className="max-w-2xl list-disc space-y-2 pl-5 text-base leading-7 text-ink-1">
              <li>
                Not an exchange simulator: the sessions here are synthetic order streams shaped like
                the repo generator&rsquo;s output, not market data.
              </li>
              <li>
                The 37ns / 23M figures are native numbers from the repo&rsquo;s machine; browser
                throughput is lower and varies by device, which is why the page measures it live
                instead of quoting it.
              </li>
              <li>
                The repo&rsquo;s observability stack (Prometheus, Grafana, the replay warehouse) does
                not run in the browser; the demo covers the hot path only.
              </li>
              <li>
                Single-gate, single-thread: real deployments shard gates per session and pin cores;
                none of that is modeled here.
              </li>
            </ul>
          </Disclosure>
        </div>

        {/* footer */}
        <div className="mt-14 flex flex-wrap gap-6 border-t border-rule pt-8">
          <a
            className="focus-ring rounded-sm font-mono text-sm text-ink-1 underline decoration-1 underline-offset-2 hover:text-accent"
            href="https://github.com/ShreyPatel4/risk-hotpath-hft"
          >
            source: github.com/ShreyPatel4/risk-hotpath-hft
          </a>
          <Link
            className="focus-ring inline-flex items-center gap-2 rounded-sm font-mono text-sm text-accent"
            href="/projects/gallery"
          >
            <span aria-hidden="true">←</span> Back to the gallery
          </Link>
          <Link className="focus-ring rounded-sm font-mono text-sm text-ink-1 hover:text-accent" href="/projects">
            All projects
          </Link>
        </div>
      </div>
    </section>
  );
}
