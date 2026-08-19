import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import Disclosure from "@/components/demos/Disclosure";
import Steps from "@/components/demos/Steps";
import Demo from "./Demo";

export const metadata = buildMetadata({
  title: "Silent cache-miss guardrail · Coconut Labs",
  description:
    "A cache with a key bug returns correct answers while never hitting, so functional tests pass and every request pays full cost. A hit-ratio guardrail catches it.",
  path: "/projects/silent-cache-miss",
});

// rows = the two checks; each says what it does to a silent-miss cache.
const ROWS = [
  { check: "Silent-cache-miss guardrail", buggy: "FLAGGED 3/3", correct: "passes", verdict: "catches it", tone: "good" },
  { check: "Functional correctness test", buggy: "passes 0/3", correct: "passes", verdict: "misses it", tone: "bad" },
] as const;

export default function SilentCacheMissPage() {
  return (
    <section className="content-band">
      <div className="content-inner max-w-4xl">
        <p className="font-mono text-xs uppercase text-ink-2">gallery unit · throughput &amp; caching</p>
        <h1 className="mt-5 text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.02]">
          Silent cache-miss guardrail
        </h1>

        {/* hook */}
        <p className="mt-6 max-w-2xl text-xl leading-9 text-ink-1">
          The cache returns the right answer every time. It also never hits, so every request quietly pays full price
          and no test says a word.
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
                text: "A warm stream of 240 requests over 12 hot prompts, the same every run.",
              },
              {
                label: "check runs",
                text: "The cache runs with the key config you picked. The guardrail checks the hit ratio against a floor; a functional test checks every answer.",
              },
              {
                label: "verdict out",
                text: "The banner reports the hit ratio, what it cost, and which check fired.",
              },
            ]}
          />
        </div>

        {/* go deeper */}
        <div className="mt-14 border-t border-rule">
          <h2 className="sr-only">Go deeper</h2>

          <Disclosure summary="Watch the walkthrough (45 s, silent)">
            <video className="w-full rounded-sm" controls preload="none" src="/walkthroughs/silent-cache-miss-walkthrough.webm" />
            <p className="mt-2 font-mono text-[10.5px] text-ink-2">Four cache keys, one honest hit rate · recorded from this page, unedited.</p>
          </Disclosure>

          <Disclosure summary="The measured result: 95% vs 0% hits" defaultOpenDesktop>
            <p className="max-w-2xl font-mono text-lg leading-relaxed text-ink-0">
              A cache with a key bug still returns the <span className="text-accent">right answer</span>. It just never
              hits, and nothing tells you.
            </p>
            <div className="mt-6 rounded-lg border border-rule bg-bg-1/60 p-5 md:p-7">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="text-2xl text-ink-0">Same warm workload, four key configs</h3>
                <p className="font-mono text-xs text-ink-2">240 requests · 12 hot prompts · guardrail ~0.001 ms</p>
              </div>
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[34rem] border-collapse font-mono text-sm">
                  <thead>
                    <tr className="border-b border-rule text-left text-xs uppercase text-ink-2">
                      <th className="py-2 font-normal">Check</th>
                      <th className="py-2 font-normal">Silent-miss configs</th>
                      <th className="py-2 font-normal">Correct config</th>
                      <th className="py-2 font-normal">
                        <span className="sr-only">Verdict</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ROWS.map((r) => (
                      <tr key={r.check} className="border-b border-rule/60">
                        <td className="py-3 text-ink-1">{r.check}</td>
                        <td className={`py-3 ${r.tone === "good" ? "text-success" : "text-ink-0"}`}>{r.buggy}</td>
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
                A working cache serves <span className="text-ink-1">95%</span> of requests from memory, 12 real calls. Each
                buggy config drops to <span className="text-ink-1">0%</span>, 240 real calls, <span className="text-ink-1">20&times;</span>{" "}
                the compute, while returning identical, correct answers. The functional test passes all of them. Only the
                guardrail sees the cost.
              </p>
            </div>
          </Disclosure>

          <Disclosure summary="Where the problem statement comes from">
            <div className="border-l-2 border-ink-0/50 pl-5">
              <p className="text-lg italic leading-8 text-ink-1">
                &ldquo;Shorter prompts cannot be cached, even if marked with <code>cache_control</code>. Any requests to cache
                fewer than this number of tokens will be processed without caching, and no error is returned.&rdquo;
              </p>
              <p className="mt-2 font-mono text-xs text-ink-2">
                Anthropic prompt-caching docs · Minimum cacheable prompt length · accessed 2026-08-04
              </p>
            </div>
          </Disclosure>

          <Disclosure summary="The full mechanism: why the functional test can't see it">
            <ul className="max-w-2xl space-y-4 text-lg leading-8 text-ink-1">
              <li className="border-l-2 border-rule pl-5">
                <b>The answer is computed from the query, not the cache.</b> A wrong cache key never produces a wrong
                result; on a miss the system recomputes correctly. So a test that checks outputs passes whether the cache
                hit or not.
              </li>
              <li className="border-l-2 border-rule pl-5">
                <b>The failure is silent by design.</b> Below the minimum length the provider declines to store and returns
                no error; a volatile field in the prefix breaks exact matching so the key is never identical twice. Either
                way: correct output, full cost, no signal.
              </li>
            </ul>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-1">
              Correctness cannot see cost. The guardrail asserts a different property: on a <em>warm</em> workload, one
              where requests are known to recur, the cache-hit ratio must clear a floor derived from the repetition
              structure. A cache that never hits reads 0.00 and is flagged, in about a microsecond.
            </p>
            <pre className="mt-8 overflow-x-auto rounded-lg border border-rule bg-bg-2/50 p-6 font-mono text-xs leading-6 text-ink-1">
{`bug: cache key = f"{timestamp}:{prompt}"   ->  key differs every request  ->  0% hits  ✗
fix: cache key = canonical(prompt)         ->  same key for same prompt   ->  95% hits  ✓

guardrail: on a warm workload, assert hit_ratio >= floor`}
            </pre>
          </Disclosure>

          <Disclosure summary="Evidence + how to reproduce">
            <p className="max-w-2xl font-mono text-xs leading-6 text-ink-2">
              One warm workload run through four key configs, scored by the guardrail and by a real functional
              correctness test. The functional test is the sharp part: the thing teams trust to validate a cache passes
              every silently broken config. Anchored on Python&rsquo;s own{" "}
              <span className="text-ink-1">functools.lru_cache</span>, a real off-the-shelf cache, whose{" "}
              <span className="text-ink-1">cache_info()</span> shows the identical miss
              (0 hits / 240 on the volatile key). Synthetic workload; the repetition is known by construction, stated on the
              page.
            </p>
            <pre className="mt-5 overflow-x-auto rounded-lg border border-rule bg-bg-2/50 p-5 font-mono text-sm text-ink-1">
{`make setup && make test && make run   # $0, laptop, no GPU, no network`}
            </pre>
          </Disclosure>

          <Disclosure summary="Honest gaps">
            <p className="max-w-2xl text-base leading-7 text-ink-1">
              The cache <em>models</em> the two documented provider rules (exact-prefix match, minimum cacheable length)
              rather than integrating with a live provider. The guardrail catches total silence, 0%, cleanly; partial
              degradation (say 95% down to 60% after a config change) needs a tuned floor or trend tracking, not a fixed one.
              And the workload&rsquo;s repetition is known here by construction; a production stream&rsquo;s warmth has to be
              measured before the floor means anything.
            </p>
          </Disclosure>
        </div>

        {/* footer */}
        <div className="mt-14 flex flex-wrap gap-6 border-t border-rule pt-8">
          <a
            className="focus-ring rounded-sm font-mono text-sm text-ink-1 underline decoration-1 underline-offset-2 hover:text-accent"
            href="https://github.com/coconut-labs/silent-cache-miss-guardrail"
          >
            source: github.com/coconut-labs/silent-cache-miss-guardrail
          </a>
          <Link className="focus-ring inline-flex items-center gap-2 rounded-sm font-mono text-sm text-accent" href="/projects/gallery">
            Back to the gallery
          </Link>
          <Link className="focus-ring rounded-sm font-mono text-sm text-ink-1 hover:text-accent" href="/projects">
            All projects
          </Link>
        </div>
      </div>
    </section>
  );
}
