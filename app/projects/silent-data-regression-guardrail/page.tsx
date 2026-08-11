import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import Disclosure from "@/components/demos/Disclosure";
import Steps from "@/components/demos/Steps";
import Demo from "./Demo";

export const metadata = buildMetadata({
  title: "Silent data-regression guardrail · Coconut Labs",
  description:
    "A small, measured prototype: catching silent data regressions a standard schema contract misses, 6/6 vs 1/6 on a real robot dataset.",
  path: "/projects/silent-data-regression-guardrail",
});

const MATRIX: { name: string; guardrail: boolean; control: boolean; loud?: boolean }[] = [
  { name: "Dropped sensor channel", guardrail: true, control: false },
  { name: "Unit / scale flip", guardrail: true, control: false },
  { name: "Frame-rate drift", guardrail: true, control: false },
  { name: "Clock misalignment", guardrail: true, control: false },
  { name: "Episode truncation", guardrail: true, control: false },
  { name: "Schema rename", guardrail: true, control: true, loud: true },
];

function Mark({ hit }: { hit: boolean }) {
  return hit ? (
    <span className="inline-flex items-center gap-1 text-success">
      <span aria-hidden="true">✓</span> caught
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-ink-2">
      <span aria-hidden="true">✕</span> missed
    </span>
  );
}

export default function GuardrailUnitPage() {
  return (
    <section className="content-band">
      <div className="content-inner max-w-4xl">
        <p className="font-mono text-xs uppercase text-ink-2">gallery unit · data core · bottleneck class A</p>
        <h1 className="mt-5 text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.02]">
          Silent data-regression guardrail
        </h1>

        {/* hook */}
        <p className="mt-6 max-w-2xl text-xl leading-9 text-ink-1">
          The robot data looks fine and is wrong. A sensor axis quietly changed scale overnight, and every schema check
          you have still passes it into training.
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
                label: "data in",
                text: "A sample of lerobot/pusht, a real robot dataset, loads in your browser. The corruption you pick is injected into a copy of it.",
              },
              {
                label: "check runs",
                text: "The guardrail compares the load to a profile fitted on clean data: array dims, value stats, frame timing, episode lengths. A standard schema contract runs beside it.",
              },
              {
                label: "verdict out",
                text: "Each check reports flagged or passed. The banner says in plain words which one saw the break.",
              },
            ]}
          />
        </div>

        {/* go deeper */}
        <div className="mt-14 border-t border-rule">
          <h2 className="sr-only">Go deeper</h2>

          <Disclosure summary="The measured result: 6/6 vs 1/6" defaultOpenDesktop>
            <p className="max-w-2xl font-mono text-lg leading-relaxed text-ink-0">
              The data looks fine and is wrong. A schema contract passes it through; this catches it.
            </p>
            <div className="mt-6 rounded-lg border border-rule bg-bg-1/60 p-5 md:p-7">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="text-2xl text-ink-0">
                  On <span className="font-mono text-xl">lerobot/pusht</span>
                </h3>
                <p className="font-mono text-xs text-ink-2">6 silent corruptions + 1 loud · zero false positives · 1.8 ms/check</p>
              </div>
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[30rem] border-collapse font-mono text-sm">
                  <thead>
                    <tr className="border-b border-rule text-left text-xs uppercase text-ink-2">
                      <th className="py-2 font-normal">Silent corruption</th>
                      <th className="py-2 font-normal">Guardrail</th>
                      <th className="py-2 font-normal">Type/presence contract</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MATRIX.map((r) => (
                      <tr key={r.name} className="border-b border-rule/60">
                        <td className="py-2.5 text-ink-1">
                          {r.name}
                          {r.loud ? <span className="ml-2 text-xs text-ink-2">(the loud one)</span> : null}
                        </td>
                        <td className="py-2.5"><Mark hit={r.guardrail} /></td>
                        <td className="py-2.5"><Mark hit={r.control} /></td>
                      </tr>
                    ))}
                    <tr className="text-ink-0">
                      <td className="py-3 font-semibold">Total</td>
                      <td className="py-3 font-semibold text-success">6 / 6</td>
                      <td className="py-3 font-semibold">1 / 6</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-5 font-mono text-xs leading-6 text-ink-2">
                Both catch the loud schema rename. The guardrail catches all five <span className="text-ink-1">silent</span>{" "}
                regressions the contract sails past. Numbers written by the run, not by hand.
              </p>
            </div>
          </Disclosure>

          <Disclosure summary="Where the problem statement comes from">
            <div className="border-l-2 border-ink-0/50 pl-5">
              <p className="text-lg italic leading-8 text-ink-1">
                &ldquo;Implement observability, validation, and guardrails to prevent silent data regressions.&rdquo;
              </p>
              <p className="mt-2 font-mono text-xs text-ink-2">
                Physical Intelligence · ML Infra Engineer (Data Systems) · public job posting
              </p>
            </div>
            <p className="mt-6 max-w-2xl font-mono text-xs leading-6 text-ink-2">
              An independent prototype inspired by a publicly stated problem. Not affiliated with, or a replica of, any
              proprietary system; the title names the problem, never a company&rsquo;s internals.
            </p>
          </Disclosure>

          <Disclosure summary="The full mechanism: why a column validator misses it">
            <p className="max-w-2xl text-lg leading-8 text-ink-1">
              A standard data contract validates <em>columns</em>: this one exists, has this type, isn&rsquo;t null. That is
              the right shape for loud regressions and the wrong shape for silent ones, for two reasons.
            </p>
            <ul className="mt-6 max-w-2xl space-y-4 text-lg leading-8 text-ink-1">
              <li className="border-l-2 border-rule pl-5">
                <b>It can&rsquo;t see inside array columns.</b> A robot state is <code className="font-mono text-base">[x, y]</code>{" "}
                in one cell. Drop a dimension or rescale an axis and the column is unchanged, still a non-null object column.
              </li>
              <li className="border-l-2 border-rule pl-5">
                <b>It can&rsquo;t see across the episode structure.</b> Truncation, frame-rate drift, and clock misalignment
                are properties of <em>sequences</em>. A row-wise, column-wise validator has no concept of an episode.
              </li>
            </ul>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-1">
              And tightening it makes it worse: auto-inferring strict value ranges makes the validator{" "}
              <b>false-positive on clean unseen data</b>. A control that rejects good data isn&rsquo;t detecting regressions,
              it&rsquo;s just brittle. So the guardrail profiles the <em>structure</em> a column check can&rsquo;t: array
              dimensionality, per-dimension stats, inter-frame period, per-episode start, and the episode-length floor.
            </p>
            <pre className="mt-8 overflow-x-auto rounded-lg border border-rule bg-bg-2/50 p-6 font-mono text-xs leading-6 text-ink-1">
{`clean baseline ──▶ profile ──▶ check(candidate)
                   • array dims           → dropped channel
                   • per-dim value stats  → unit / scale flip
                   • inter-frame period   → frame-rate drift
                   • per-episode start    → clock misalignment
                   • episode-length floor → truncation
                   • column presence      → schema rename (loud)`}
            </pre>
          </Disclosure>

          <Disclosure summary="Evidence + how to reproduce">
            <p className="max-w-2xl font-mono text-xs leading-6 text-ink-2">
              Tier 4, a controlled A/B against a real off-the-shelf validator (pandera), not a strawman. pandera&rsquo;s
              strict statistical config was <em>disqualified</em> for false positives on clean holdout; that&rsquo;s recorded,
              not hidden. Reproduce it yourself:
            </p>
            <pre className="mt-5 overflow-x-auto rounded-lg border border-rule bg-bg-2/50 p-5 font-mono text-sm text-ink-1">
{`make setup && make test && make run   # $0, laptop, no GPU`}
            </pre>
          </Disclosure>

          <Disclosure summary="What it doesn't do">
            <ul className="max-w-2xl list-disc space-y-2 pl-5 text-base leading-7 text-ink-1">
              <li>A batch guardrail on a sampled subset, not a streaming petabyte system.</li>
              <li>Detects structural / distributional regressions, not semantic label errors.</li>
              <li>Mild truncation of a long episode is a known blind spot; the claim uses a severe (≤30%) truncation.</li>
              <li>Control is pandera standing in for a Great Expectations auto-profile (GE 1.x removed that profiler).</li>
            </ul>
          </Disclosure>
        </div>

        {/* footer */}
        <div className="mt-14 flex flex-wrap gap-6 border-t border-rule pt-8">
          <a
            className="focus-ring rounded-sm font-mono text-sm text-ink-1 underline decoration-1 underline-offset-2 hover:text-accent"
            href="https://github.com/coconut-labs/data-regression-guardrail"
          >
            source: github.com/coconut-labs/data-regression-guardrail
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
