import { Markdown } from "@/lib/markdown";

export function PostBody({ content }: { content: string }) {
  return (
    <div className="post-shell pt-0">
      <article className="post-body">
        <Markdown content={content} />
      </article>
      <aside className="post-marginalia no-print hidden lg:block">
        <p>canonical result</p>
        <p className="mt-8">citations and side notes collapse inline on narrow screens.</p>
      </aside>
    </div>
  );
}
