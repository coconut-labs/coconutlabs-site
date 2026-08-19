import Link from "next/link";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "The gallery · Coconut Labs",
  description:
    "Every card is a thing that silently breaks in real data systems. Every demo runs in your browser: flip the failure on, watch the checks disagree.",
  path: "/projects/gallery",
});

/* The spine: one bottleneck class per row. Every class names a failure that
   HIDES in production, which is what earns a unit: the system keeps answering
   while the answer goes wrong. A unit must claim a new class or go deeper in an
   occupied one. Empty cells are shown on purpose, a known frontier.

   A class I was proposed for latent diffusion and rejected. That unit teaches a
   mechanism nobody can run without the weights, not a failure that hides.
   Admitting it would have diluted what this table claims, so it sits below the
   table under its own heading, where the different kind of claim is visible. */
const CLASSES: { key: string; name: string; cover: { label: string; href?: string } | null }[] = [
  { key: "A", name: "Silent data regressions / quality guardrails", cover: { label: "Silent data-regression guardrail", href: "/projects/silent-data-regression-guardrail" } },
  { key: "B", name: "Point-in-time & lineage correctness", cover: { label: "Point-in-time correctness guardrail", href: "/projects/point-in-time-correctness" } },
  { key: "C", name: "Throughput & caching", cover: { label: "Silent cache-miss guardrail", href: "/projects/silent-cache-miss" } },
  { key: "D", name: "Cost & token attribution", cover: { label: "Atlas unit U5 · cost plane", href: "/projects/agentic-mlops#unit-U5" } },
  { key: "E", name: "Format & storage tradeoffs", cover: { label: "Columnar-scan bytes guardrail", href: "/projects/columnar-scan-bytes-guardrail" } },
  { key: "F", name: "Eval & replay", cover: { label: "Atlas unit U7 · reasoning path", href: "/projects/agentic-mlops#unit-U7" } },
  { key: "G", name: "Ingestion & schema-drift", cover: { label: "Ingestion data-contract guardrail", href: "/projects/ingestion-data-contract" } },
  { key: "H", name: "Hot-path admission & latency", cover: { label: "Pre-trade risk gate", href: "/projects/risk-hotpath" } },
];

// Each shipped unit as a story card: a plain-language hook, one thing you can do
// in the live demo, the measured result with its regime, and the provenance line.
type UnitCard = {
  title: string;
  hook: string;
  action: string;
  numbers: React.ReactNode;
  meta: string;
  href: string;
  source: string;
  /* Evidence badge. Defaults to the Tier-4 A/B badge the five guardrail units
     and the risk gate earned. A unit that carries no measured result must say
     so here: the badge is a claim like any other. */
  badge?: string;
};
const UNIT_CARDS: UnitCard[] = [
  {
    title: "Silent data-regression guardrail",
    hook: "Data can go bad without a single error. The table still looks valid; the numbers are wrong.",
    action: "Flip a corruption on, watch the guardrail catch what the schema contract passes.",
    numbers: (
      <>
        <span className="font-mono">6/6 vs 1/6</span> silent corruptions caught on{" "}
        <span className="font-mono">lerobot/pusht</span> · zero false positives · 1.8 ms/check
      </>
    ),
    meta: "Physical Intelligence · data core · class A",
    href: "/projects/silent-data-regression-guardrail",
    source: "https://github.com/coconut-labs/data-regression-guardrail",
  },
  {
    title: "Point-in-time correctness guardrail",
    hook: "A model can train on answers from the future. Offline accuracy rewards the leak.",
    action: "Toggle the leak on, watch the score jump to a number too good to trust.",
    numbers: (
      <>
        <span className="font-mono">0.999 leaked vs 0.771 correct</span> on the same 1200-row
        training set · guardrail ~0.1 ms
      </>
    ),
    meta: "feature stores · data core · class B",
    href: "/projects/point-in-time-correctness",
    source: "https://github.com/coconut-labs/point-in-time-correctness-guardrail",
  },
  {
    title: "Silent cache-miss guardrail",
    hook: "A cache can pass every functional test and never hit once. Every request pays full price.",
    action: "Break the cache, watch cost climb while correctness stays green.",
    numbers: (
      <>
        <span className="font-mono">95% hit ratio working vs 0% broken</span> over 240 requests on
        12 hot prompts · 20× redundant compute
      </>
    ),
    meta: "prompt caching · throughput · class C",
    href: "/projects/silent-cache-miss",
    source: "https://github.com/coconut-labs/silent-cache-miss-guardrail",
  },
  {
    title: "Columnar-scan bytes guardrail",
    hook: "A query can return the right rows while reading everything. Row checks stay green either way.",
    action: "Switch the scan mode, watch the byte counter disagree with the row counter.",
    numbers: (
      <>
        <span className="font-mono">44.7× the bytes</span> for the same correct answer, 200k rows,
        2 of 12 columns needed
      </>
    ),
    meta: "columnar formats · storage · class E",
    href: "/projects/columnar-scan-bytes-guardrail",
    source: "https://github.com/coconut-labs/columnar-scan-bytes-guardrail",
  },
  {
    title: "Ingestion data-contract guardrail",
    hook: "A feed can change meaning without dropping a row. Revenue reads $157k when the truth is $299k.",
    action: "Drift the units mid-stream, watch the contract object while schema and null checks pass.",
    numbers: (
      <>
        contract <span className="font-mono">6/6</span> drifts caught vs schema/null checks{" "}
        <span className="font-mono">1/6</span> · zero errors, zero nulls in the bad data · ~0.1
        ms/check
      </>
    ),
    meta: "ELT · schema-drift · class G",
    href: "/projects/ingestion-data-contract",
    source: "https://github.com/coconut-labs/ingestion-data-contract-guardrail",
  },
  {
    title: "Pre-trade risk gate",
    hook: "An order gets nanoseconds to be checked before the market moves. Too slow loses the trade; too lax loses the firm.",
    action: "Stream a fat-finger session through the real Rust crate, compiled to wasm, running in your browser.",
    numbers: (
      <>
        <span className="font-mono">37ns</span> full 7-check evaluation ·{" "}
        <span className="font-mono">23M evals/sec</span> native (Criterion, repo hardware) · 3.3KB
        wasm build
      </>
    ),
    meta: "electronic trading · execution core · class H",
    href: "/projects/risk-hotpath",
    source: "https://github.com/ShreyPatel4/risk-hotpath-hft",
  },
  {
    title: "Latent diffusion mechanics",
    hook: "Denoising an image one pixel at a time is 786,432 numbers a thousand times over. The word latent is the trick that made it fit on a laptop.",
    action: "Drag the timestep, watch a field dissolve into noise and come back, then break the noise predictor by 5 percent.",
    numbers: (
      <>
        <span className="font-mono">48x fewer values</span> to denoise at f = 8, computed live from
        the repo&rsquo;s autoencoder config · schedule and shapes cited to file, no trained model on
        the page
      </>
    ),
    meta: "CompVis latent diffusion · mechanism unit, outside the bottleneck spine",
    href: "/projects/latent-diffusion",
    source: "https://github.com/ShreyPatel4/Latent-Diffusion-Artbench-OpenImage",
    badge: "Shipped · mechanism, no measured result",
  },
];

export default function GalleryPage() {
  return (
    <section className="content-band">
      <div className="content-inner">
        <p className="font-mono text-xs uppercase text-ink-2">the gallery</p>
        <h1 className="mt-5 text-[clamp(3rem,9vw,7.5rem)] leading-[0.95]">Hall of demos</h1>
        <p className="mt-8 max-w-2xl text-xl leading-8 text-ink-0">
          Every card is a thing that silently breaks in real data systems. Every demo runs in your
          browser.
        </p>
        <p className="mt-4 max-w-2xl text-base leading-7 text-ink-1">
          One method at two scales: a deep case study (an agentic MLOps platform, built and
          measured end to end) plus small free-standing prototypes, each reverse-engineering one
          company&rsquo;s publicly stated data-systems bottleneck and solving a slice of it, honestly
          measured. Same unit contract, same evidence tiers, so the reader sees one discipline
          applied at two densities, not a pile of demos.
        </p>

        {/* the story menu */}
        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {UNIT_CARDS.map((card) => (
            <article
              key={card.href}
              className="flex flex-col rounded-lg border border-rule bg-bg-1/70 p-8 transition hover:shadow-[var(--shadow-paper)]"
            >
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-sm border border-success/40 bg-success/10 px-3 py-1 font-mono text-xs uppercase text-success">
                  <span aria-hidden="true">●</span> {card.badge ?? "Shipped · Tier 4"}
                </span>
                <span className="inline-flex items-center rounded-sm border border-rule px-3 py-1 font-mono text-xs uppercase text-ink-2">
                  live in your browser
                </span>
              </div>
              <h2 className="text-3xl leading-tight text-ink-0">{card.title}</h2>
              <p className="mt-5 text-base leading-7 text-ink-1">{card.hook}</p>
              <p className="mt-3 font-mono text-sm leading-6 text-ink-0">
                <span aria-hidden="true">▸</span> {card.action}
              </p>
              <p className="mt-4 flex-1 text-sm leading-6 text-ink-2">{card.numbers}</p>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-sm">
                <Link
                  href={card.href}
                  className="focus-ring inline-flex items-center gap-2 rounded-sm text-accent"
                >
                  Run the demo <span aria-hidden="true">→</span>
                </Link>
                <a
                  href={card.source}
                  className="focus-ring inline-flex items-center gap-2 rounded-sm text-ink-1 hover:text-accent"
                >
                  Source <span aria-hidden="true">↗</span>
                </a>
              </div>
              <p className="mt-4 border-t border-rule pt-3 font-mono text-xs uppercase text-ink-2">
                {card.meta}
              </p>
            </article>
          ))}

          {/* the flagship atlas */}
          <article className="flex flex-col rounded-lg border border-rule bg-bg-1/40 p-8">
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-sm border border-accent/40 bg-accent/10 px-3 py-1 font-mono text-xs uppercase text-accent">
              <span aria-hidden="true">●</span> Flagship · in build
            </div>
            <h2 className="text-3xl leading-tight text-ink-0">Agentic MLOps platform</h2>
            <p className="mt-5 text-base leading-7 text-ink-1">
              The deep one. One platform proving one claim: the classic MLOps loop still holds when
              the thing served is an LLM agent, once you add a token/cost axis and a
              reasoning-trace artifact.
            </p>
            <p className="mt-3 flex-1 font-mono text-sm leading-6 text-ink-0">
              <span aria-hidden="true">▸</span> Take the guided tour: three acts, seven stops, then
              explore all fourteen lifecycle stations.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-sm">
              <Link
                href="/projects/agentic-mlops"
                className="focus-ring inline-flex items-center gap-2 rounded-sm text-accent"
              >
                Open the atlas <span aria-hidden="true">→</span>
              </Link>
            </div>
            <p className="mt-4 border-t border-rule pt-3 font-mono text-xs uppercase text-ink-2">
              the deep case study · ten units
            </p>
          </article>
        </div>

        {/* the competency grid */}
        <div className="mt-16">
          <p className="font-mono text-xs uppercase text-ink-2">coverage · one bottleneck class per row</p>
          <ul className="mt-6 divide-y divide-rule border-y border-rule">
            {CLASSES.map((c) => (
              <li key={c.key} className="flex flex-wrap items-center gap-x-6 gap-y-2 py-4">
                <span className="font-mono text-sm text-ink-2">{c.key}</span>
                <span className="min-w-[16rem] flex-1 text-ink-0">{c.name}</span>
                {c.cover ? (
                  c.cover.href ? (
                    <Link
                      href={c.cover.href}
                      className="focus-ring inline-flex items-center gap-2 rounded-sm border border-accent/40 bg-accent/10 px-3 py-1 font-mono text-xs text-accent"
                    >
                      {c.cover.label} <span aria-hidden="true">→</span>
                    </Link>
                  ) : (
                    <span className="rounded-sm border border-rule px-3 py-1 font-mono text-xs text-ink-1">{c.cover.label}</span>
                  )
                ) : (
                  <span className="font-mono text-xs text-ink-2">open</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-14 border-t border-rule pt-8">
          <Link href="/projects" className="focus-ring inline-flex items-center gap-2 rounded-sm font-mono text-sm text-ink-1 hover:text-accent">
            ← All projects
          </Link>
        </div>
      </div>
    </section>
  );
}
