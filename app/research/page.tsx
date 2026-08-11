import Link from "next/link";
import { Card } from "@/components/primitives/Card";
import { loadResearchFeed, type FeedType } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Research · Coconut Labs",
  description: "Notes, papers, and recordings from the lab notebook.",
  path: "/research",
});

const FILTERS: { key: "all" | FeedType; label: string }[] = [
  { key: "all", label: "all" },
  { key: "note", label: "notes" },
  { key: "paper", label: "papers" },
  { key: "podcast", label: "podcasts" },
  { key: "talk", label: "talks" },
];

const EMPTY_COPY: Record<FeedType, string> = {
  note: "No notes yet.",
  paper:
    "No papers yet. The first preprint lands when a result is large enough to peer-review. Notes come first; papers come when notes stop being enough.",
  podcast:
    "No podcasts yet. We will list episodes and talks here when there is signal worth recording.",
  talk: "No talks yet. If you want to invite the lab to one, write to info@coconutlabs.org.",
};

type SearchParams = Promise<{ type?: string }>;

function isFeedType(value: string | undefined): value is FeedType {
  return value === "note" || value === "paper" || value === "podcast" || value === "talk";
}

export default async function ResearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { type } = await searchParams;
  const activeFilter: "all" | FeedType = isFeedType(type) ? type : "all";
  const feed = await loadResearchFeed();
  const visible = activeFilter === "all" ? feed : feed.filter((e) => e.type === activeFilter);

  return (
    <section className="content-band">
      <div className="content-inner">
        <p className="font-mono text-xs uppercase text-ink-2">writing</p>
        <h1 className="mt-5 text-[clamp(30px,4vw,46px)] leading-[1.05] tracking-[-0.03em]">Research</h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-ink-1">
          Every note here is a lab record: a claim, the bench that tested it, and what survived.
          Newest first, filtered by type below, each entry linked to its canonical artifact.
        </p>

        <div className="mt-10 flex items-center justify-between border-y border-rule py-4">
          <nav aria-label="Filter by type" className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs uppercase">
            {FILTERS.map((filter) => {
              const isActive = filter.key === activeFilter;
              const href = filter.key === "all" ? "/research" : `/research?type=${filter.key}`;
              return (
                <Link
                  className={`focus-ring rounded-sm transition ${isActive ? "text-ink-0" : "text-ink-2 hover:text-ink-0"}`}
                  data-active={isActive ? "true" : undefined}
                  href={href}
                  key={filter.key}
                >
                  {filter.label}
                </Link>
              );
            })}
          </nav>
          <a
            className="focus-ring rounded-sm font-mono text-xs uppercase text-ink-2 hover:text-ink-0"
            href="/rss.xml"
          >
            rss
          </a>
        </div>

        {visible.length === 0 ? (
          <p className="mt-14 max-w-3xl text-lg leading-8 text-ink-1">
            {activeFilter === "all" ? EMPTY_COPY.note : EMPTY_COPY[activeFilter]}
          </p>
        ) : (
          <div className="mt-14 grid gap-5">
            {visible.map((entry) => (
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
