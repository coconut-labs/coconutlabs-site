
export function EmptyState({ href = "https://github.com/coconut-labs" }: { href?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-rule bg-bg-1/55 p-8 font-mono text-sm text-ink-1">
      <a className="focus-ring inline-flex items-center gap-2 rounded-sm hover:text-accent" href={href}>
        // nothing here yet — watch the GitHub org for what is brewing
      </a>
    </div>
  );
}
