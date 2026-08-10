import Link from "next/link";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "The gallery · Coconut Labs",
  description:
    "One method at two scales: a deep MLOps platform, and small measured prototypes each reverse-engineering a real company's data-systems bottleneck.",
  path: "/projects/gallery",
});

// The frozen spine: seven bottleneck classes. A unit must claim a new class or go
// deeper in an occupied one. Empty cells are shown on purpose — a known frontier.
const CLASSES: { key: string; name: string; cover: { label: string; href?: string } | null }[] = [
  { key: "A", name: "Silent data regressions / quality guardrails", cover: { label: "Silent data-regression guardrail", href: "/projects/silent-data-regression-guardrail" } },
  { key: "B", name: "Point-in-time & lineage correctness", cover: { label: "Point-in-time correctness guardrail", href: "/projects/point-in-time-correctness" } },
  { key: "C", name: "Throughput & caching", cover: { label: "Silent cache-miss guardrail", href: "/projects/silent-cache-miss" } },
  { key: "D", name: "Cost & token attribution", cover: { label: "Atlas · cost plane", href: "/projects/agentic-mlops" } },
  { key: "E", name: "Format & storage tradeoffs", cover: { label: "Columnar-scan bytes guardrail", href: "/projects/columnar-scan-bytes-guardrail" } },
  { key: "F", name: "Eval & replay", cover: { label: "Atlas · reasoning path", href: "/projects/agentic-mlops" } },
  { key: "G", name: "Ingestion & schema-drift", cover: { label: "Ingestion data-contract guardrail", href: "/projects/ingestion-data-contract" } },
];

export default function GalleryPage() {
  return (
    <section className="content-band">
      <div className="content-inner">
        <p className="font-mono text-xs uppercase text-ink-2">the gallery</p>
        <h1 className="mt-5 text-[clamp(3rem,9vw,7.5rem)] leading-[0.95]">Hall of demos</h1>
        <p className="mt-8 max-w-2xl text-lg leading-8 text-ink-1">
          One method at two scales. A deep case study — an agentic MLOps platform, built and
          measured end to end — and small free-standing prototypes, each reverse-engineering one
          company&rsquo;s publicly-stated data-systems bottleneck and solving a slice of it, honestly
          measured. Same unit contract, same evidence tiers, so the reader sees one discipline
          applied at two densities, not a pile of demos.
        </p>

        {/* the competency grid */}
        <div className="mt-16">
          <p className="font-mono text-xs uppercase text-ink-2">coverage · the frontier is the point</p>
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
          <p className="mt-4 font-mono text-xs text-ink-2">
            A new unit must claim an open class or go materially deeper in a filled one.
          </p>
        </div>

        {/* entries */}
        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {/* shipped gallery unit */}
          <article className="flex flex-col rounded-lg border border-rule bg-bg-1/70 p-8 transition hover:shadow-[var(--shadow-paper)]">
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-sm border border-success/40 bg-success/10 px-3 py-1 font-mono text-xs uppercase text-success">
              <span aria-hidden="true">●</span> Shipped · Tier 4
            </div>
            <h2 className="text-3xl leading-tight text-ink-0">Silent data-regression guardrail</h2>
            <p className="mt-2 font-mono text-xs uppercase text-ink-2">Physical Intelligence · data core · class A</p>
            <p className="mt-5 flex-1 text-base leading-7 text-ink-1">
              Catches the corruptions that leave a table structurally valid so a schema contract misses
              them. <span className="font-mono">6/6 vs 1/6</span> on a real robot dataset, zero false
              positives, 1.8 ms.
            </p>
            <Link
              href="/projects/silent-data-regression-guardrail"
              className="focus-ring mt-6 inline-flex items-center gap-2 rounded-sm font-mono text-sm text-accent"
            >
              Read the unit <span aria-hidden="true">→</span>
            </Link>
          </article>

          {/* point-in-time correctness unit */}
          <article className="flex flex-col rounded-lg border border-rule bg-bg-1/70 p-8 transition hover:shadow-[var(--shadow-paper)]">
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-sm border border-success/40 bg-success/10 px-3 py-1 font-mono text-xs uppercase text-success">
              <span aria-hidden="true">●</span> Shipped · Tier 4
            </div>
            <h2 className="text-3xl leading-tight text-ink-0">Point-in-time correctness guardrail</h2>
            <p className="mt-2 font-mono text-xs uppercase text-ink-2">feature stores · data core · class B</p>
            <p className="mt-5 flex-1 text-base leading-7 text-ink-1">
              Catches training data built from future feature values — the temporal leak a schema check passes and
              offline accuracy <span className="italic">rewards</span>. <span className="font-mono">0.999 leaked vs
              0.771 correct</span>; only the guardrail sees it.
            </p>
            <Link
              href="/projects/point-in-time-correctness"
              className="focus-ring mt-6 inline-flex items-center gap-2 rounded-sm font-mono text-sm text-accent"
            >
              Read the unit <span aria-hidden="true">→</span>
            </Link>
          </article>

          {/* silent cache-miss unit */}
          <article className="flex flex-col rounded-lg border border-rule bg-bg-1/70 p-8 transition hover:shadow-[var(--shadow-paper)]">
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-sm border border-success/40 bg-success/10 px-3 py-1 font-mono text-xs uppercase text-success">
              <span aria-hidden="true">●</span> Shipped · Tier 4
            </div>
            <h2 className="text-3xl leading-tight text-ink-0">Silent cache-miss guardrail</h2>
            <p className="mt-2 font-mono text-xs uppercase text-ink-2">prompt caching · throughput · class C</p>
            <p className="mt-5 flex-1 text-base leading-7 text-ink-1">
              Catches a cache that silently never hits — functional tests pass, every request pays full cost.{" "}
              <span className="font-mono">95% hit-ratio working vs 0%</span> (20× redundant compute), invisible to a
              correctness check.
            </p>
            <Link
              href="/projects/silent-cache-miss"
              className="focus-ring mt-6 inline-flex items-center gap-2 rounded-sm font-mono text-sm text-accent"
            >
              Read the unit <span aria-hidden="true">→</span>
            </Link>
          </article>

          {/* columnar-scan bytes unit */}
          <article className="flex flex-col rounded-lg border border-rule bg-bg-1/70 p-8 transition hover:shadow-[var(--shadow-paper)]">
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-sm border border-success/40 bg-success/10 px-3 py-1 font-mono text-xs uppercase text-success">
              <span aria-hidden="true">●</span> Shipped · Tier 4
            </div>
            <h2 className="text-3xl leading-tight text-ink-0">Columnar-scan bytes guardrail</h2>
            <p className="mt-2 font-mono text-xs uppercase text-ink-2">columnar formats · storage · class E</p>
            <p className="mt-5 flex-1 text-base leading-7 text-ink-1">
              A two-column query returns the right rows whether it reads 2 columns or all 12 — so correctness passes a
              full scan reading <span className="font-mono">44.7× the bytes</span>. The guardrail counts bytes, not rows.
            </p>
            <Link
              href="/projects/columnar-scan-bytes-guardrail"
              className="focus-ring mt-6 inline-flex items-center gap-2 rounded-sm font-mono text-sm text-accent"
            >
              Read the unit <span aria-hidden="true">→</span>
            </Link>
          </article>

          {/* ingestion data-contract unit */}
          <article className="flex flex-col rounded-lg border border-rule bg-bg-1/70 p-8 transition hover:shadow-[var(--shadow-paper)]">
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-sm border border-success/40 bg-success/10 px-3 py-1 font-mono text-xs uppercase text-success">
              <span aria-hidden="true">●</span> Shipped · Tier 4
            </div>
            <h2 className="text-3xl leading-tight text-ink-0">Ingestion data-contract guardrail</h2>
            <p className="mt-2 font-mono text-xs uppercase text-ink-2">ELT · schema-drift · class G</p>
            <p className="mt-5 flex-1 text-base leading-7 text-ink-1">
              Catches drift that keeps the column present and non-null — a silent unit change reads revenue as{" "}
              <span className="font-mono">$157k vs a true $299k</span>, zero errors, zero nulls. Schema/null checks pass
              it; the contract doesn&rsquo;t.
            </p>
            <Link
              href="/projects/ingestion-data-contract"
              className="focus-ring mt-6 inline-flex items-center gap-2 rounded-sm font-mono text-sm text-accent"
            >
              Read the unit <span aria-hidden="true">→</span>
            </Link>
          </article>

          {/* the flagship atlas */}
          <article className="flex flex-col rounded-lg border border-rule bg-bg-1/40 p-8">
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-sm border border-accent/40 bg-accent/10 px-3 py-1 font-mono text-xs uppercase text-accent">
              <span aria-hidden="true">●</span> Flagship · in build
            </div>
            <h2 className="text-3xl leading-tight text-ink-0">Agentic MLOps platform</h2>
            <p className="mt-2 font-mono text-xs uppercase text-ink-2">the deep case study · ten units</p>
            <p className="mt-5 flex-1 text-base leading-7 text-ink-1">
              One platform proving one claim: the classic MLOps loop still holds when the thing served is
              an LLM agent, once you add a token/cost axis and a reasoning-trace artifact. Explore it as a
              14-stop data lifecycle.
            </p>
            <Link
              href="/projects/agentic-mlops"
              className="focus-ring mt-6 inline-flex items-center gap-2 rounded-sm font-mono text-sm text-accent"
            >
              Open the atlas <span aria-hidden="true">→</span>
            </Link>
          </article>
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
