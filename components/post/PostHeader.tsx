import type { Post } from "@/lib/content";

export function PostHeader({ post }: { post: Post }) {
  return (
    <header className="post-shell pb-10">
      <div className="max-w-[var(--measure)]">
        <p className="font-mono text-xs uppercase text-ink-2">
          {post.date} · {post.type} · {post.readingTime}
        </p>
        <h1 className="mt-6 text-[clamp(30px,4vw,46px)] font-semibold leading-[1.05] tracking-[-0.03em]">
          {post.title}
        </h1>
        <p className="mt-6 font-sans text-base leading-relaxed text-ink-1">{post.dek}</p>
        <p className="mt-8 font-mono text-xs uppercase text-ink-2">By {post.authors.join(", ")}</p>
      </div>
    </header>
  );
}
