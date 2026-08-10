import type { Post } from "@/lib/content";

export function PostHeader({ post }: { post: Post }) {
  return (
    <header className="post-shell pb-10">
      <div className="max-w-[62ch]">
        <p className="font-mono text-xs uppercase text-ink-2">
          {post.date} · {post.type} · {post.readingTime}
        </p>
        <h1 className="mt-6 text-[clamp(4rem,10vw,8.8rem)] leading-[0.92]">{post.title}</h1>
        <p className="mt-8 font-sans text-xl leading-8 text-ink-1 md:text-2xl">{post.dek}</p>
        <p className="mt-8 font-mono text-xs uppercase text-ink-2">By {post.authors.join(", ")}</p>
      </div>
    </header>
  );
}
