import Link from "next/link";
import { ArrowRight, Check, X } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import Demo from "./Demo";

export const metadata = buildMetadata({
  title: "Columnar scan / bytes-read guardrail · Coconut Labs",
  description:
    "A two-column query that scans the whole table returns the right rows — so correctness checks pass while it reads 40x the bytes. This reads the bytes, not the rows.",
  path: "/projects/columnar-scan-bytes-guardrail",
});

// same Parquet file / same query, read two ways — measured by the Python harness.
const ROWS = [
  { check: "Bytes-read guardrail", full: "FLAGGED", proj: "passes", verdict: "catches it", tone: "good" },
  { check: "Result-correctness check", full: "right rows", proj: "right rows", verdict: "misses it", tone: "bad" },
  { check: "Bytes physically read", full: "8.6 MB", proj: "192 KB", verdict: "44.7x more", tone: "bad", num: true },
] as const;

export default function ColumnarScanPage() {
  return (
    <section className="content-band">
      <div className="content-inner max-w-4xl">
        <p className="font-mono text-xs uppercase text-accent-2">gallery unit · data core · bottleneck class E</p>
        <h1 className="mt-5 text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.02]">
          Columnar scan / bytes-read guardrail
        </h1>

        <div className="mt-8 border-l-2 border-accent-3/50 pl-5">
          <p className="text-lg italic leading-8 text-ink-1">
            &ldquo;A columnar database &hellip; allows having many columns in a table just in case, but to not pay the
            cost for unused columns on read query execution time (a traditional OLTP database reads all of the data
            during queries as the data is stored in rows and not columns).&rdquo;
          </p>
          <p className="mt-2 font-mono text-xs text-ink-2">
            ClickHouse documentation · &ldquo;What is a columnar database?&rdquo; · updated 2026-05-22
          </p>
        </div>

        <p className="mt-14 font-mono text-[clamp(1.4rem,3vw,2.4rem)] leading-tight text-ink-0">
          The query returns the <span className="text-accent">right rows</span>. It just read the whole table to get
          two columns &mdash; and nothing that checks correctness can see it.
        </p>

        {/* three-way scorecard — the hero */}
        <div className="mt-12 rounded-lg border border-rule bg-bg-1/60 p-6 md:p-9">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-2xl text-ink-0">Same file, one query, read two ways</h2>
            <p className="font-mono text-xs text-ink-2">200k rows · 2 of 12 columns · guardrail integer-exact</p>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse font-mono text-sm">
              <thead>
                <tr className="border-b border-rule text-left text-xs uppercase text-ink-2">
                  <th className="py-2 font-normal">Check</th>
                  <th className="py-2 font-normal">Full scan</th>
                  <th className="py-2 font-normal">Projected</th>
                  <th className="py-2 font-normal"></th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.check} className="border-b border-rule/60">
                    <td className="py-3 text-ink-1">{r.check}</td>
                    <td className={`py-3 ${r.tone === "good" ? "text-danger" : "text-ink-0"}`}>{r.full}</td>
                    <td className={`py-3 ${r.tone === "good" ? "text-success" : "text-ink-1"}`}>{r.proj}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1 ${r.tone === "good" ? "text-success" : "text-danger"}`}>
                        {r.tone === "good" ? <Check size={13} aria-hidden /> : <X size={13} aria-hidden />}
                        {r.verdict}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-5 font-mono text-xs leading-6 text-ink-2">
            Both reads return the identical <span className="text-ink-1">18 groups</span>. The full scan pulled{" "}
            <span className="text-ink-1">8.6 MB</span> through the reader to do it; the projected read pulled{" "}
            <span className="text-ink-1">192 KB</span> &mdash; <span className="text-ink-1">44.7x</span> less, measured on
            a real Parquet file. Against a row-oriented CSV of the same data it is <span className="text-ink-1">460x</span>.
          </p>
        </div>

        {/* interactive demo */}
        <div className="mt-12">
          <Demo />
        </div>

        {/* mechanism */}
        <h2 className="mt-16 text-3xl text-ink-0">Why the usual check fails</h2>
        <ul className="mt-6 max-w-2xl space-y-4 text-lg leading-8 text-ink-1">
          <li className="border-l-2 border-rule pl-5">
            <b>Correctness checks watch the output.</b> &ldquo;Did the query return the right rows?&rdquo; is true whether
            the engine read two columns or all twelve. The waste is entirely on the <em>read</em> side, where the result
            never looks.
          </li>
          <li className="border-l-2 border-rule pl-5">
            <b>The cost is invisible until it scales.</b> On a laptop file it is a warm-cache blip; on a wide table in
            object storage it is the bill and the latency. A row layout &mdash; or a columnar file read without projection
            pushdown &mdash; reads every column to answer a two-column question.
          </li>
        </ul>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-1">
          The guardrail ignores the rows and asserts a property of the <em>read</em>: the bytes touched must be within
          tolerance of what the projection needs. It flags the scan that a correctness check waves through.
        </p>

        <pre className="mt-8 overflow-x-auto rounded-lg border border-rule bg-bg-2/50 p-6 font-mono text-xs leading-6 text-ink-1">
{`query: SELECT country, device ...   (2 of 12 columns)

row layout          : read every column   →  88.5 MB   ✗  (460x)
columnar, full read : read every chunk    →   8.6 MB   ✗  ( 45x)
columnar, projected : read 2 column chunks →   192 KB  ✓

guardrail: flag when bytes_read > tolerance x projection_budget`}
        </pre>

        {/* evidence */}
        <h2 className="mt-16 text-3xl text-ink-0">Evidence</h2>
        <p className="mt-4 max-w-2xl font-mono text-xs leading-6 text-ink-2">
          Tier 4 &mdash; a real off-the-shelf control. The harness writes a real Parquet file and a real CSV, then counts
          the bytes physically pulled through the reader (pre-buffering off) for the same query three ways. The
          instrumented projected read (192 KB) is cross-checked against the file&rsquo;s own column-chunk metadata
          (130 KB floor), so the number is I/O, not buffer coalescing. Synthetic table (read-amplification needs a
          controlled row width); stated on the page, not hidden.
        </p>
        <pre className="mt-5 overflow-x-auto rounded-lg border border-rule bg-bg-2/50 p-5 font-mono text-sm text-ink-1">
{`make setup && make test && make run   # $0, laptop, no GPU, no network`}
        </pre>

        {/* gaps */}
        <h2 className="mt-16 text-2xl text-ink-0">Honest gaps</h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-ink-1">
          The dataset is synthetic and deterministic (<span className="font-mono text-sm">seed=7</span>) &mdash; showing
          read amplification needs a controlled row width, so the numbers are on a designed table, but the failure mode is
          real and cited. The <span className="text-ink-1">44.7x</span> is projection isolated &mdash; same file, same
          compression on both sides &mdash; and reflects projecting two low-cardinality dict-encoded columns; project a fat
          string column like <span className="font-mono text-sm">url</span> and the ratio shrinks. The{" "}
          <span className="text-ink-1">460x</span> CSV figure additionally includes compression, so it is a second axis,
          not a like-for-like projection number. The guardrail covers <em>projection</em> (columns read); predicate
          pushdown / row-group skipping is a second mechanism with its own failure modes and is deliberately out of scope.
          The live browser demo uses the integer read model &mdash; the real compression and encoding effects live only in
          the measured Parquet numbers, never in the model, so Python and the TypeScript port agree to the byte.
        </p>

        <div className="mt-14 flex flex-wrap gap-6 border-t border-rule pt-8">
          <Link className="focus-ring inline-flex items-center gap-2 rounded-sm font-mono text-sm text-accent" href="/projects/gallery">
            <ArrowRight aria-hidden size={14} className="rotate-180" /> Back to the gallery
          </Link>
          <Link className="focus-ring rounded-sm font-mono text-sm text-ink-1 hover:text-accent" href="/projects">
            All projects
          </Link>
        </div>
      </div>
    </section>
  );
}
