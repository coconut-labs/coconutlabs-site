import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import LifecycleMap from "./LifecycleMap";

export const metadata = buildMetadata({
  title: "Agentic MLOps Platform · Coconut Labs",
  description:
    "A public, explorable case study: the classic MLOps loop (register, train, gate, canary, promote, roll back) still holds when the thing served is an LLM agent.",
  path: "/projects/agentic-mlops",
});

// Every row is a plain countable thing. The two target-tier rows that used to
// sit here counted units by an internal evidence tier the page never defined,
// so a reader could not use them.
const GLANCE: [string, string][] = [
  ["Lifecycle stops", "14"],
  ["Loop-backs", "2"],
  ["Units", "10"],
  ["Layers", "4"],
  ["Standing cost", "$0"],
];

export default function AgenticMlopsPage() {
  return (
    <>
      <section className="content-band">
        <div className="content-inner flex flex-wrap items-start justify-between gap-[clamp(2rem,6vw,5rem)]">
          <div className="min-w-[min(100%,22rem)] flex-[1_1_34rem]">
            <p className="font-mono text-xs uppercase text-ink-2">
              the deep case study
            </p>
            <h1 className="mt-4 max-w-[25ch] text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.02] text-ink-0">
              An agentic MLOps platform, built to be measured.
            </h1>
            <p className="mt-6 max-w-[var(--measure)] font-body text-lg leading-8 text-ink-1">
              This one is still being built. One claim runs through the whole build: the classic
              MLOps loop (register, train, gate, canary, promote, roll back) still works when the
              thing being served is an LLM agent, provided you add a fourth telemetry axis (tokens
              and cost) and a fifth artifact type (the reasoning trace). Everything below either
              supports that claim or is cut.
            </p>
          </div>

          <dl
            aria-label="At a glance"
            className="mt-2 grid flex-[0_1_15rem] grid-cols-[1fr_auto] self-start font-mono text-sm"
          >
            {GLANCE.map(([label, value], i) => (
              <div key={label} className="contents">
                <dt className={`py-2 pr-3 text-ink-2 ${i === 0 ? "" : "border-t border-rule"}`}>
                  {label}
                </dt>
                <dd
                  className={`py-2 text-right font-semibold text-ink-0 ${i === 0 ? "" : "border-t border-rule"}`}
                >
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="content-band pt-0" aria-label="The story in three acts">
        <div className="content-inner">
          <p className="font-mono text-xs uppercase text-ink-2">the story, in three acts</p>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            <li className="rounded-lg border border-rule bg-bg-1/60 p-6">
              <p className="font-mono text-xs uppercase text-ink-2">Act 1 · Ship</p>
              <p className="mt-2 text-base leading-7 text-ink-1">
                An agent ships like any model: every version goes into a registry and must pass a
                gate before it moves.
              </p>
            </li>
            <li className="rounded-lg border border-rule bg-bg-1/60 p-6">
              <p className="font-mono text-xs uppercase text-ink-2">Act 2 · Drift</p>
              <p className="mt-2 text-base leading-7 text-ink-1">
                Production drifts. A canary slice and monitoring on four axes, tokens and cost
                included, catch it before users do.
              </p>
            </li>
            <li className="rounded-lg border border-rule bg-bg-1/60 p-6">
              <p className="font-mono text-xs uppercase text-ink-2">Act 3 · Recover</p>
              <p className="mt-2 text-base leading-7 text-ink-1">
                Rollback is a first-class path back to serving, and every run can be proved after
                the fact from its traces.
              </p>
            </li>
          </ol>
          <p className="mt-6 max-w-[var(--measure)] text-base leading-7 text-ink-1">
            The map below tells that story as fourteen stops and ten units. Click any station and
            it lights up with who owns it and what that unit proves. Or press{" "}
            <b className="font-semibold text-ink-0">Take the tour</b> for a guided walk through
            seven stops.
          </p>
        </div>
      </section>

      <section className="content-band pt-0">
        <div className="content-inner">
          <details className="group rounded-sm border border-rule bg-bg-1">
            <summary className="focus-ring flex cursor-pointer items-center gap-2 p-4 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2">
              Watch the walkthrough (45 s, silent)
            </summary>
            <div className="border-t border-[var(--hair)] p-4">
              <video className="w-full rounded-sm" controls preload="none" src="/walkthroughs/atlas-tour-walkthrough.webm" />
              <p className="mt-2 font-mono text-[10.5px] text-ink-2">The guided tour, seven stops through the lifecycle · recorded from this page, unedited.</p>
            </div>
          </details>
        </div>
      </section>

      <section className="content-band pt-0">
        <div className="content-inner">
          <LifecycleMap />
          <div className="mt-14 flex flex-wrap gap-6 border-t border-rule pt-8 font-mono text-sm">
            <Link href="/projects/gallery" className="focus-ring rounded-sm text-accent hover:opacity-80">
              Back to the gallery
            </Link>
            <Link href="/projects" className="focus-ring rounded-sm text-ink-1 hover:text-accent">
              All projects
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
