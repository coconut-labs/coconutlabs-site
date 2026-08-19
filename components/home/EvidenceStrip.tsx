import Link from "next/link";
import { getAllPosts } from "@/lib/content";

// Direction A: evidence on the home page is three quiet rows, not cards.
// Mono date column, 19px title, 14px dek, hairline separators.
export async function EvidenceStrip() {
  const posts = await getAllPosts();

  return (
    <section className="content-band">
      <div className="content-inner">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2">evidence</p>
            <h2 className="mt-3 text-[clamp(1.6rem,3vw,2.4rem)] leading-tight tracking-[-0.03em]">Recent results</h2>
          </div>
          <Link className="focus-ring inline-flex items-center gap-2 rounded-sm font-mono text-xs text-accent" href="/evidence">
            Index <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="divide-y divide-[var(--rule)] border-y border-rule">
          {posts.slice(0, 3).map((post) => (
            <Link
              className="focus-ring grid gap-2 py-6 transition hover:bg-bg-1 md:grid-cols-[120px_1fr] md:gap-6"
              href={`/evidence/${post.slug}`}
              key={post.slug}
            >
              <p className="font-mono text-[11px] uppercase leading-6 text-ink-2">{post.date}</p>
              <div>
                <h3 className="text-[19px] font-semibold leading-snug tracking-[-0.01em]">{post.title}</h3>
                <p className="mt-1.5 max-w-[68ch] text-sm leading-6 text-ink-1">{post.dek}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
