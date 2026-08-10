import { EmptyState } from "@/components/index/EmptyState";
import { IndexCard } from "@/components/index/IndexCard";
import type { ListEntry, WorkEntry } from "@/lib/content";

export function IndexPageTemplate({
  title,
  subtitle,
  entries,
}: {
  title: string;
  subtitle: string;
  entries: Array<ListEntry | WorkEntry>;
}) {
  return (
    <section className="content-band">
      <div className="content-inner">
        <p className="font-mono text-xs uppercase text-accent-2">index</p>
        <h1 className="mt-5 text-[clamp(4rem,10vw,9rem)] leading-[0.92]">{title}</h1>
        <p className="mt-7 max-w-2xl font-mono text-sm leading-7 text-ink-1">{subtitle}</p>
        <div className="mt-14 grid gap-5">
          {entries.length > 0 ? entries.map((entry) => <IndexCard entry={entry} key={"name" in entry ? entry.name : entry.title} />) : <EmptyState />}
        </div>
      </div>
    </section>
  );
}
