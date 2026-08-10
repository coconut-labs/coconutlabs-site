import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import Demo from "./Demo";

export const metadata = buildMetadata({
  title: "Schema-drift contract guardrail · Coconut Labs",
  description:
    "Silent schema drift keeps the column present and non-null, so schema, null, and row-count checks all pass — and the number downstream goes quietly wrong. A pinned data contract catches it.",
  path: "/projects/ingestion-data-contract",
});

// the six drifts, what they do downstream, and which check sees them.
const ROWS = [
  { drift: "Partial unit change", effect: "revenue reads $157,512 (true $299,354)", std: "misses", guard: "catches", note: "cents→dollars, in range" },
  { drift: "Precision truncation", effect: "sum drifts; values suspiciously round", std: "misses", guard: "catches", note: "floored to whole dollars" },
  { drift: "New enum value", effect: "a currency bucket nobody handles", std: "misses", guard: "catches", note: "unannounced CAD" },
  { drift: "Boolean re-encoding", effect: "refund count silently drops to 0", std: "misses", guard: "catches", note: "'true' → 'TRUE'/'1'/'yes'" },
  { drift: "Type widening", effect: "the revenue sum can't run", std: "misses", guard: "catches", note: "int → text, coerced past" },
  { drift: "Out-of-range scale", effect: "values blow past the max", std: "catches", guard: "catches", note: "the one loud drift" },
] as const;

export default function IngestionDataContractPage() {
  return (
    <section className="content-band">
      <div className="content-inner max-w-4xl">
        <p className="font-mono text-xs uppercase text-ink-2">gallery unit · data core · bottleneck class G</p>
        <p className="mt-2 font-mono text-xs">
          <a className="focus-ring text-ink-1 underline decoration-1 underline-offset-2 hover:text-accent" href="https://github.com/coconut-labs/ingestion-data-contract-guardrail">
            source: github.com/coconut-labs/ingestion-data-contract-guardrail
          </a>
        </p>
        <h1 className="mt-5 text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.02]">Schema-drift contract guardrail</h1>

        <div className="mt-8 border-l-2 border-ink-0/50 pl-5">
          <p className="text-lg italic leading-8 text-ink-1">
            &ldquo;A crashed pipeline gets fixed. A lying one gets quoted in a board meeting.&rdquo;
          </p>
          <p className="mt-2 font-mono text-xs text-ink-2">
            dlt (dlthub) engineering blog · &ldquo;Schema evolution in data pipelines&rdquo; · Aman Gupta · 2026-06-05
          </p>
        </div>

        <p className="mt-14 font-mono text-[clamp(1.4rem,3vw,2.4rem)] leading-tight text-ink-0">
          The drift keeps the column present and <span className="text-accent">non-null</span>. So the schema check
          passes, the null check passes, the row-count check passes — and the number goes quietly wrong.
        </p>

        {/* scorecard — the hero */}
        <div className="mt-12 rounded-lg border border-rule bg-bg-1/60 p-6 md:p-9">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-2xl text-ink-0">Six drifts, one landing table</h2>
            <p className="font-mono text-xs text-ink-2">guardrail 6/6 · standard check 1/6 · ~0.1 ms/check</p>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[38rem] border-collapse font-mono text-sm">
              <thead>
                <tr className="border-b border-rule text-left text-xs uppercase text-ink-2">
                  <th className="py-2 font-normal">Drift</th>
                  <th className="py-2 font-normal">What it does downstream</th>
                  <th className="py-2 font-normal">Std check</th>
                  <th className="py-2 font-normal">Contract</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.drift} className="border-b border-rule/60">
                    <td className="py-3 text-ink-1">
                      {r.drift}
                      <span className="block text-[0.68rem] text-ink-2">{r.note}</span>
                    </td>
                    <td className="py-3 text-ink-2">{r.effect}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1 ${r.std === "catches" ? "text-success" : "text-danger"}`}>
                        {r.std === "catches" ? <span aria-hidden="true">✓</span> : <span aria-hidden="true">✕</span>}
                        {r.std}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 text-success">
                        <span aria-hidden="true">✓</span>
                        {r.guard}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-5 font-mono text-xs leading-6 text-ink-2">
            The standard check catches exactly one drift — the only one whose values leave the observed range. Every
            other drift keeps each value individually valid and corrupts the aggregate. The unit-scale one makes the
            revenue report read <span className="text-ink-1">$157,512</span> against a true{" "}
            <span className="text-ink-1">$299,354</span>: no error, no null, quoted in the meeting.
          </p>
        </div>

        {/* interactive demo */}
        <div className="mt-12">
          <Demo />
        </div>

        {/* mechanism */}
        <h2 className="mt-16 text-3xl text-ink-0">Why the usual gate fails</h2>
        <ul className="mt-6 max-w-2xl space-y-4 text-lg leading-8 text-ink-1">
          <li className="border-l-2 border-rule pl-5">
            <b>A schema check reads the shape.</b> Column present, dtype unchanged, non-null, row count identical, values
            inside the observed range. Every silent drift preserves all five. The inferred schema signs off.
          </li>
          <li className="border-l-2 border-rule pl-5">
            <b>The corruption is in meaning, not shape.</b> A currency that split into two spellings, a boolean that grew
            a third encoding, a cents column that started shipping dollars — each value still looks valid. Only the
            aggregate is wrong.
          </li>
        </ul>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-1">
          The contract pins <em>meaning</em>: the declared dtype, the allowed value domain of each categorical column, a
          magnitude band for the money column, and a ceiling on how &ldquo;round&rdquo; those values may be. A drift that
          survives shape checks still has to survive the domain, the band, and the precision signature — and these don&rsquo;t.
        </p>

        <pre className="mt-8 overflow-x-auto rounded-lg border border-rule bg-bg-2/50 p-6 font-mono text-xs leading-6 text-ink-1">
{`standard check : present? non-null? same dtype? in [min,max]? same rowcount?   → all pass
contract       : currency ∈ {USD,EUR,GBP}?  amount mean within ±20%?  ≤10% whole-dollar?
                 → new "CAD", or a mean off by 47%, or 30% suddenly round → FLAGGED`}
        </pre>

        {/* evidence */}
        <h2 className="mt-16 text-3xl text-ink-0">Evidence</h2>
        <p className="mt-4 max-w-2xl font-mono text-xs leading-6 text-ink-2">
          Tier 4 — one landing table, six drifts, scored by the contract guardrail and by a real off-the-shelf control
          (pandera&rsquo;s inferred schema at defaults, plus explicit row-count and null-ratio checks). The control is not a
          strawman: it catches the one drift that leaves the observed range, and only that one. The rest it waves through,
          and the downstream number moves. Synthetic data (drift needs controlled before/after); stated, not hidden.
        </p>
        <pre className="mt-5 overflow-x-auto rounded-lg border border-rule bg-bg-2/50 p-5 font-mono text-sm text-ink-1">
{`make setup && make test && make run   # $0, laptop, no GPU, no network`}
        </pre>

        {/* honest gaps */}
        <h2 className="mt-16 text-2xl text-ink-0">Honest gaps</h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-ink-1">
          The contract&rsquo;s categorical domains are declared, so a genuinely new-but-legitimate category reads as a drift
          until the contract is updated — that friction is the point, but it is friction. The magnitude and precision bands
          are fitted from a golden sample and tuned for this table; production needs per-column tuning. And the hardest
          drift class is out of reach of any per-column contract: a <em>cross-field</em> one — say, amounts that stop being
          normalized to a common currency while every column stays in its own domain — corrupts the sum with no new value
          anywhere, and needs a reconciliation total, not a schema. That is the next guardrail, not this one.
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
