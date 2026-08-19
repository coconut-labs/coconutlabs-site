import Link from "next/link";
import { Card } from "@/components/primitives/Card";
import { loadEvidenceFeed } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Evidence · Coconut Labs",
  description: "What the lab measured, on rented hardware, including the parts that failed.",
  path: "/evidence",
});

/* No filter nav. It was five tabs over three empty arrays, and two of the
   tabs were the destination of a permanent redirect, so /papers and
   /podcasts were cached dead ends. When the first paper exists it is an
   evidence entry carrying type: paper, listed inline here. */
const EMPTY_COPY = "No entries yet. The first one lands when a bench says something worth reporting.";

export default async function EvidencePage() {
  const feed = await loadEvidenceFeed();

  return (
    <section className="content-band">
      <div className="content-inner">
        <p className="font-mono text-xs uppercase text-ink-2">what we measured</p>
        <h1 className="mt-5 text-[clamp(30px,4vw,46px)] leading-[1.05] tracking-[-0.03em]">Evidence</h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-ink-1">
          Every entry is a lab record: a claim, the bench that tested it, and what survived. A
          failed result is evidence too, so it gets an entry like any other. Newest first, each one
          linked to its canonical artifact.
        </p>

        <div className="mt-10 flex items-center justify-between border-y border-rule py-4 font-mono text-xs uppercase text-ink-2">
          <p>
            provenance for every number lives on the{" "}
            <Link className="focus-ring rounded-sm text-accent underline decoration-1 underline-offset-2" href="/evidence/benchmarks">
              benchmarks page
            </Link>
          </p>
          <a className="focus-ring rounded-sm hover:text-ink-0" href="/rss.xml">
            rss
          </a>
        </div>

        {feed.length === 0 ? (
          <p className="mt-14 max-w-3xl text-lg leading-8 text-ink-1">{EMPTY_COPY}</p>
        ) : (
          <div className="mt-14 grid gap-5">
            {feed.map((entry) => (
              <Link
                className="focus-ring rounded-lg"
                href={entry.href}
                key={`${entry.type}-${entry.slug}`}
              >
                <Card className="grid gap-6 md:grid-cols-[11rem_minmax(0,1fr)_auto]">
                  <p className="font-mono text-xs uppercase text-ink-2">
                    {entry.date}
                    <br />
                    {entry.type}
                  </p>
                  <div>
                    <h2 className="text-4xl leading-tight">{entry.title}</h2>
                    <p className="mt-3 max-w-3xl text-ink-1">{entry.dek}</p>
                    {entry.authors.length > 0 ? (
                      <p className="mt-4 font-mono text-xs text-ink-2">{entry.authors.join(", ")}</p>
                    ) : null}
                  </div>
                  <span aria-hidden="true" className="font-mono text-lg text-accent">→</span>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
