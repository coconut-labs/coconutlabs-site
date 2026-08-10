import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import LifecycleMap from "./LifecycleMap";

export const metadata = buildMetadata({
  title: "Agentic MLOps Platform · Coconut Labs",
  description:
    "A public, explorable case study: the classic MLOps loop — register, train, gate, canary, promote, roll back — still holds when the thing served is an LLM agent.",
  path: "/projects/agentic-mlops",
});

const GLANCE: [string, string][] = [
  ["Lifecycle stops", "14"],
  ["Loop-backs", "2"],
  ["Units", "10"],
  ["Layers", "4"],
  ["Target tier 4", "6"],
  ["Target tier 3", "4"],
  ["Standing cost", "$0"],
];

export default function AgenticMlopsPage() {
  return (
    <>
      <section className="content-band">
        <div className="content-inner flex flex-wrap items-start justify-between gap-[clamp(2rem,6vw,5rem)]">
          <div className="min-w-[min(100%,22rem)] flex-[1_1_34rem]">
            <p className="font-mono text-xs uppercase text-ink-2">
              Working name · unassigned pending audit
            </p>
            <h1 className="mt-4 max-w-[25ch] text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.02] text-ink-0">
              An agentic MLOps platform, built to be measured.
            </h1>
            <p className="mt-6 max-w-[var(--measure)] font-body text-lg leading-8 text-ink-1">
              One claim runs through the whole build: the classic MLOps loop — register, train,
              gate, canary, promote, roll back — still works when the thing being served is an LLM
              agent, provided you add a fourth telemetry axis (tokens and cost) and a fifth artifact
              type (the reasoning trace). Everything below either supports that claim or is cut.
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

      <section className="content-band pt-0">
        <div className="content-inner">
          <LifecycleMap />
          <div className="mt-14 flex flex-wrap gap-6 border-t border-rule pt-8 font-mono text-sm">
            <Link href="/projects/gallery" className="focus-ring rounded-sm text-accent">
              ← Back to the gallery
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
