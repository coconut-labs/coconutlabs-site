import { loadContributors } from "@/lib/contributors";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Join us · Coconut Labs",
  description: "How to contribute to Coconut Labs research and tools.",
  path: "/joinus",
});

const STARTING_PATHS = [
  {
    title: "Reproduce Gate 2 on your own hardware.",
    body:
      "The Gate 2 numbers (53.9 ms solo, 61.5 ms under flooder, 26× better than FIFO) were measured on A100 with vLLM 0.19.1. Re-run the harness on different hardware (H100, L40S, MI300X, even a 4090) and open a PR with your traces and a one-page note. The harness is at coconut-labs/kvwarden/bench/. Reproductions on hardware we do not own are the most useful contribution we can receive right now.",
  },
  {
    title: "Run the H100 saturation case.",
    body:
      "The current H100 result shows modest deltas because the engine did not saturate at 32 RPS. We want a follow-up at higher flooder RPS (128+) or larger tenant count (N=16) on H100 SXM. Estimated cost: ~$3, ~30 min. If you have credit on Lambda, RunPod, or Modal and want to take this on, open an issue named “Gate 2.1b H100 saturation” and we will write up the runbook in the same thread.",
  },
  {
    title: "Add a baseline scheduler we have not compared against.",
    body:
      "KVWarden today is benchmarked against FIFO and solo. We want comparisons against at least vLLM's native scheduler at higher concurrency, and against any cache-aware baseline you can wire into the harness. The interface is in kvwarden/scheduler/baseline.py. Add a class, run the harness, ship a plot.",
  },
  {
    title: "Find a failure mode in the fairness claim.",
    body:
      "The Gate 2 result is narrow on purpose: one quiet tenant, one flooder, one trace shape. Construct a workload where KVWarden does worse than FIFO: different arrival distributions, adversarial prompt lengths, mixed model sizes. We will publish the counter-example as a research note with co-authorship if it holds up. Adversarial reproductions are at least as valuable to us as confirmatory ones.",
  },
  {
    title: "Patch the harness.",
    body:
      "The harness has rough edges: brittle config loading, no built-in support for streaming output measurement, no per-tenant histograms. Issues tagged `harness` in coconut-labs/kvwarden are real, current, and small enough to land in a weekend.",
  },
];

const FILE_LINKS: ReadonlyArray<readonly [string, string]> = [
  ["CONTRIBUTING.md", "https://github.com/coconut-labs/kvwarden/blob/main/CONTRIBUTING.md"],
  ["CODE_OF_CONDUCT.md", "https://github.com/coconut-labs/kvwarden/blob/main/CODE_OF_CONDUCT.md"],
  ["Open issues", "https://github.com/coconut-labs/kvwarden/issues"],
];

export default async function JoinUsPage() {
  const contributors = await loadContributors();

  return (
    <section className="content-band">
      <div className="content-inner">
        <p className="font-mono text-xs uppercase text-ink-2">how to contribute</p>
        <h1 className="mt-5 text-[clamp(30px,4vw,46px)] leading-[1.05] tracking-[-0.03em]">Build with us.</h1>

        <p className="mt-6 max-w-2xl text-base leading-7 text-ink-1">
          The fastest way in is a small reproducible artifact: a trace, a failing case, a benchmark, or a patch. We are two people. There is no Slack, no Discord, no weekly call. Contribution is async and lives on GitHub. Pick a starting path below.
        </p>

        <h2 className="mt-20 text-[clamp(2.4rem,5vw,4rem)] leading-tight">How to start</h2>
        <p className="mt-4 max-w-2xl font-mono text-sm leading-7 text-ink-1">
          Pick one of these. Each is articulated enough that you can start today without asking us first.
        </p>
        <ol className="mt-10 grid gap-7">
          {STARTING_PATHS.map((path, i) => (
            <li className="grid gap-4 border-t border-rule pt-7 md:grid-cols-[3rem_minmax(0,1fr)]" key={path.title}>
              <p className="font-mono text-xs uppercase text-ink-2">{String(i + 1).padStart(2, "0")}</p>
              <div>
                <h3 className="text-2xl leading-snug">{path.title}</h3>
                <p className="mt-3 max-w-3xl leading-8 text-ink-1">{path.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <h2 className="mt-24 text-[clamp(2.4rem,5vw,4rem)] leading-tight">What we give back</h2>
        <ul className="mt-7 grid max-w-3xl gap-4 text-lg leading-8 text-ink-1">
          <li><strong className="text-ink-0">Commit attribution.</strong> Every PR lands with your name on the commit. We do not squash to hide who did the work.</li>
          <li><strong className="text-ink-0">Co-authorship on substantive contributions.</strong> If your work materially shapes a research note, your name goes on the byline. We will negotiate this in the PR thread, not after the fact.</li>
          <li><strong className="text-ink-0">A contributor list.</strong> Your name lands on this page once a PR merges. The list updates from the canonical CONTRIBUTORS file in the relevant repo.</li>
          <li><strong className="text-ink-0">References and endorsements.</strong> If you do good work here and ask, we will write you a real reference for grad school, jobs, or grants.</li>
        </ul>

        <h2 className="mt-24 text-[clamp(2.4rem,5vw,4rem)] leading-tight">What we don't do</h2>
        <ul className="mt-7 grid max-w-3xl gap-4 text-lg leading-8 text-ink-1">
          <li><strong className="text-ink-0">Paid contracting.</strong> We do not pay for contributions. We are also not paid by anyone for the lab's work. If money is the right shape for what you are offering, we are the wrong door.</li>
          <li><strong className="text-ink-0">Recruiting outreach.</strong> We are not hiring. If we are ever hiring, the page you are reading will say so.</li>
          <li><strong className="text-ink-0">Sales calls.</strong> No demo decks, no discovery calls, no enterprise pilots. If KVWarden does not solve your problem from the README, it probably does not solve it.</li>
        </ul>

        <h2 className="mt-24 text-[clamp(2.4rem,5vw,4rem)] leading-tight">What we're not looking for right now</h2>
        <ul className="mt-7 grid max-w-3xl gap-4 text-lg leading-8 text-ink-1">
          <li><strong className="text-ink-0">Productizing KVWarden into a SaaS.</strong> The lab is research-first. The middleware is open source and stays that way.</li>
          <li><strong className="text-ink-0">Staffing the team.</strong> Coconut Labs is two people on purpose. Adding a third person is a decision we have not made and will not make casually.</li>
          <li><strong className="text-ink-0">VC introductions.</strong> We are not raising. We will say so on this page if that ever changes.</li>
        </ul>

        <div className="mt-24 border-t border-rule pt-10">
          <p className="font-mono text-xs uppercase text-ink-2">the actual files</p>
          <ul className="mt-5 grid gap-3 font-mono text-sm">
            {FILE_LINKS.map(([label, href]) => (
              <li key={label}>
                <a className="focus-ring inline-flex items-center gap-2 rounded-sm text-accent" href={href}>
                  {label} <span aria-hidden="true">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-16 border-t border-rule pt-10">
          <p className="font-mono text-xs uppercase text-ink-2">contributors so far</p>
          {contributors.length === 0 ? (
            <p className="mt-5 font-mono text-sm text-ink-1">Just us, for now.</p>
          ) : (
            <p className="mt-5 font-mono text-sm text-ink-1">{contributors.join(" · ")}</p>
          )}
        </div>
      </div>
    </section>
  );
}
