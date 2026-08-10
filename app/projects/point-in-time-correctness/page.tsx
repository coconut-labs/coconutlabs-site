import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import PitDemo from "./PitDemo";

export const metadata = buildMetadata({
  title: "Point-in-time correctness guardrail · Coconut Labs",
  description:
    "Temporal leakage is the bug where offline accuracy goes up — so accuracy can't catch it and schema checks can't see it. This does.",
  path: "/projects/point-in-time-correctness",
});

// rows = the three checks; each says what it does to the leaky join.
const ROWS = [
  { check: "Point-in-time guardrail", leaky: "FLAGGED", correct: "passes", verdict: "catches it", tone: "good" },
  { check: "Schema / type contract", leaky: "passes", correct: "passes", verdict: "misses it", tone: "bad" },
  { check: "Offline AUC (5-fold)", leaky: "0.999", correct: "0.771", verdict: "rewards it", tone: "bad", num: true },
] as const;

export default function PointInTimePage() {
  return (
    <section className="content-band">
      <div className="content-inner max-w-4xl">
        <p className="font-mono text-xs uppercase text-ink-2">gallery unit · data core · bottleneck class B</p>
        <p className="mt-2 font-mono text-xs">
          <a className="focus-ring text-ink-1 underline decoration-1 underline-offset-2 hover:text-accent" href="https://github.com/coconut-labs/point-in-time-correctness-guardrail">
            source: github.com/coconut-labs/point-in-time-correctness-guardrail
          </a>
        </p>
        <h1 className="mt-5 text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.02]">
          Point-in-time correctness guardrail
        </h1>

        <div className="mt-8 border-l-2 border-ink-0/50 pl-5">
          <p className="text-lg italic leading-8 text-ink-1">
            &ldquo;&hellip;to prevent data leakage, which occurs when you use feature values for model training that
            were not available at the time the label was recorded.&rdquo;
          </p>
          <p className="mt-2 font-mono text-xs text-ink-2">
            Databricks feature-store docs · Point-in-time feature joins · 2026-06-12
          </p>
        </div>

        <p className="mt-14 font-mono text-[clamp(1.4rem,3vw,2.4rem)] leading-tight text-ink-0">
          The one bug where offline accuracy goes <span className="text-accent">up</span>. So accuracy can&rsquo;t
          catch it, and a schema check can&rsquo;t see it.
        </p>

        {/* three-way scorecard — the hero */}
        <div className="mt-12 rounded-lg border border-rule bg-bg-1/60 p-6 md:p-9">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-2xl text-ink-0">Same data, joined two ways</h2>
            <p className="font-mono text-xs text-ink-2">1200/1200 rows leaked · guardrail ~0.1 ms</p>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse font-mono text-sm">
              <thead>
                <tr className="border-b border-rule text-left text-xs uppercase text-ink-2">
                  <th className="py-2 font-normal">Check</th>
                  <th className="py-2 font-normal">Leaky join</th>
                  <th className="py-2 font-normal">Point-in-time</th>
                  <th className="py-2 font-normal"></th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.check} className="border-b border-rule/60">
                    <td className="py-3 text-ink-1">{r.check}</td>
                    <td className={`py-3 ${r.tone === "good" ? "text-success" : "text-ink-0"}`}>{r.leaky}</td>
                    <td className="py-3 text-ink-1">{r.correct}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1 ${r.tone === "good" ? "text-success" : "text-danger"}`}>
                        {r.tone === "good" ? <span aria-hidden="true">✓</span> : <span aria-hidden="true">✕</span>}
                        {r.verdict}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-5 font-mono text-xs leading-6 text-ink-2">
            A working <span className="text-ink-1">0.771</span> model; the leak inflates it to a too-good-to-be-true{" "}
            <span className="text-ink-1">0.999</span>. Pick a pipeline by accuracy and you pick the bug. The schema
            contract passes it. Only the guardrail catches it.
          </p>
        </div>

        {/* interactive demo — live join + guardrail */}
        <div className="mt-12">
          <PitDemo />
        </div>

        {/* mechanism */}
        <h2 className="mt-16 text-3xl text-ink-0">Why the usual safeguards fail</h2>
        <ul className="mt-6 max-w-2xl space-y-4 text-lg leading-8 text-ink-1">
          <li className="border-l-2 border-rule pl-5">
            <b>Schema validation checks the shape.</b> A leaky training table and a correct one have identical
            columns and types — the leak is in <em>which value</em> got joined, not the schema. It passes.
          </li>
          <li className="border-l-2 border-rule pl-5">
            <b>Offline accuracy is actively misleading.</b> The leak <em>raises</em> the score, so the metric you use
            to judge the pipeline gives the broken one the better mark.
          </li>
        </ul>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-1">
          Point-in-time correctness is a property of the join. The right join is <em>as-of</em>: for each label, the
          most recent feature at or before its time. The guardrail is one line of intent — <b>no feature may be
          timestamped after its label</b> — checked independently of any score.
        </p>

        <pre className="mt-8 overflow-x-auto rounded-lg border border-rule bg-bg-2/50 p-6 font-mono text-xs leading-6 text-ink-1">
{`leaky join  : label at t=40  ─▶  feature at t=95   (35 units of future)  ✗
as-of join  : label at t=40  ─▶  feature at t=40   (present)             ✓

guardrail: flag rows where feature_ts > label_ts`}
        </pre>

        {/* evidence */}
        <h2 className="mt-16 text-3xl text-ink-0">Evidence</h2>
        <p className="mt-4 max-w-2xl font-mono text-xs leading-6 text-ink-2">
          Tier 4 — the same data joined two ways, scored by the guardrail, a real schema validator, and a model&rsquo;s
          offline AUC. The AUC line is the sharp part: the metric people trust to catch problems instead rewards this one.
          Synthetic data (leakage needs controlled feature timing); stated on the page, not hidden.
        </p>
        <pre className="mt-5 overflow-x-auto rounded-lg border border-rule bg-bg-2/50 p-5 font-mono text-sm text-ink-1">
{`make setup && make test && make run   # $0, laptop, no GPU, no network`}
        </pre>

        {/* the bug measurement caught */}
        <h2 className="mt-16 text-2xl text-ink-0">A leak inside the anti-leak join</h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-ink-1">
          The first &ldquo;correct&rdquo; as-of join was itself leaky at the boundary — a feature timestamped exactly at
          the label instant was a post-outcome value, and the join picked it up for any label landing on a sample step.
          The honest model scored AUC <b>0.40 — below chance</b>, which is impossible for a real signal, and exactly the
          tell that the clean table wasn&rsquo;t clean. Fixing the boundary restored 0.77. Only reading a number that
          didn&rsquo;t make sense surfaced it.
        </p>

        <div className="mt-14 flex flex-wrap gap-6 border-t border-rule pt-8">
          <Link className="focus-ring inline-flex items-center gap-2 rounded-sm font-mono text-sm text-accent" href="/projects/gallery">
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
