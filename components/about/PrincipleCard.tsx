export function PrincipleCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="border-t border-rule pt-6">
      <h3 className="text-3xl leading-tight">{title}</h3>
      <p className="mt-4 font-mono text-sm leading-7 text-ink-1">{body}</p>
    </article>
  );
}
