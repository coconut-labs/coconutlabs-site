import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import LifecycleMap from "./LifecycleMap";

export const metadata = buildMetadata({
  title: "Agentic MLOps Platform · Coconut Labs",
  description:
    "A public, explorable case study: the classic MLOps loop — register, train, gate, canary, promote, roll back — still holds when the thing served is an LLM agent.",
  path: "/projects/agentic-mlops",
});

export default function AgenticMlopsPage() {
  return (
    <>
      <section className="content-band">
        <div
          className="content-inner"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "clamp(2rem, 6vw, 5rem)",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div style={{ flex: "1 1 34rem", minWidth: "min(100%, 22rem)" }}>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.72rem",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--ink-2)",
                marginBottom: "1rem",
              }}
            >
              Working name · unassigned pending audit
            </p>
            <h1
              style={{
                fontFamily: "var(--)",
                fontSize: "clamp(2rem, 5vw, 3.25rem)",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                color: "var(--ink-0)",
                maxWidth: "25ch",
              }}
            >
              An agentic MLOps platform, built to be measured.
            </h1>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "clamp(1rem, 1.6vw, 1.2rem)",
                lineHeight: 1.55,
                color: "var(--ink-1)",
                maxWidth: "var(--measure)",
                marginTop: "1.5rem",
              }}
            >
              One claim runs through the whole build: the classic MLOps loop — register, train,
              gate, canary, promote, roll back — still works when the thing being served is an LLM
              agent, provided you add a fourth telemetry axis (tokens and cost) and a fifth artifact
              type (the reasoning trace). Everything below either supports that claim or is cut.
            </p>
          </div>

          <dl
            aria-label="At a glance"
            style={{
              flex: "0 1 15rem",
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "0",
              fontFamily: "var(--font-mono)",
              fontSize: "0.8rem",
              alignSelf: "flex-start",
              marginTop: "0.5rem",
            }}
          >
            {[
              ["Lifecycle stops", "14"],
              ["Loop-backs", "2"],
              ["Units", "10"],
              ["Layers", "4"],
              ["Target tier 4", "6"],
              ["Target tier 3", "4"],
              ["Standing cost", "$0"],
            ].map(([label, value], i) => (
              <div
                key={label}
                style={{
                  display: "contents",
                }}
              >
                <dt
                  style={{
                    color: "var(--ink-2)",
                    padding: "0.5rem 0.75rem 0.5rem 0",
                    borderTop: i === 0 ? "none" : "1px solid var(--rule)",
                  }}
                >
                  {label}
                </dt>
                <dd
                  style={{
                    color: "var(--ink-0)",
                    fontWeight: 600,
                    textAlign: "right",
                    padding: "0.5rem 0",
                    borderTop: i === 0 ? "none" : "1px solid var(--rule)",
                  }}
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
            <Link href="/projects/gallery" className="focus-ring rounded-sm text-accent hover:opacity-80">
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
