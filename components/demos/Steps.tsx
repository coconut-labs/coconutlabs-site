/* "What you are looking at": three numbered, mono-labeled steps so the
   mechanics of a sandbox are scannable without reading the deep sections. */
export default function Steps({ items }: { items: { label: string; text: string }[] }) {
  return (
    <div>
      <h2 className="font-mono text-xs uppercase text-ink-2">what you are looking at</h2>
      <ol className="mt-4 grid gap-4 md:grid-cols-3">
        {items.map((s, i) => (
          <li key={s.label} className="rounded-lg border border-rule bg-bg-1/60 p-5">
            <p className="font-mono text-xs uppercase text-ink-2">
              {String(i + 1).padStart(2, "0")} · {s.label}
            </p>
            <p className="mt-2 text-sm leading-6 text-ink-1">{s.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
