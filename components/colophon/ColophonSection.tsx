export function ColophonSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-rule py-8">
      <h2 className="text-4xl">{title}</h2>
      <div className="mt-5 max-w-[var(--measure)] space-y-4 leading-7 text-ink-1">{children}</div>
    </section>
  );
}
