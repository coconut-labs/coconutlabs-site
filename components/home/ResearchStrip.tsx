import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/primitives/Card";
import { getAllPosts } from "@/lib/content";

export async function ResearchStrip() {
  const posts = await getAllPosts();

  return (
    <section className="content-band">
      <div className="content-inner">
        <div className="mb-8 flex items-end justify-between gap-6">
          <h2 className="text-[clamp(3rem,7vw,6rem)] leading-none">Recent research</h2>
          <Link className="focus-ring inline-flex items-center gap-2 rounded-sm font-mono text-xs text-accent" href="/research">
            Index <ArrowRight aria-hidden="true" size={14} />
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {posts.slice(0, 3).map((post) => (
            <Link className="focus-ring rounded-lg" href={`/research/${post.slug}`} key={post.slug}>
              <Card tilt className="h-full">
                <p className="font-mono text-[0.72rem] uppercase text-ink-2">
                  {post.date} · {post.type}
                </p>
                <h3 className="mt-6 text-3xl leading-tight">{post.title}</h3>
                <p className="mt-4 text-sm leading-6 text-ink-1">{post.dek}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
