import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/primitives/Card";
import type { ListEntry, WorkEntry } from "@/lib/content";

type IndexCardProps = {
  entry: ListEntry | WorkEntry;
};

function isWork(entry: ListEntry | WorkEntry): entry is WorkEntry {
  return "repo_url" in entry;
}

export function IndexCard({ entry }: IndexCardProps) {
  const href = isWork(entry) ? entry.repo_url : entry.href;
  const title = isWork(entry) ? entry.name : entry.title;
  const description = isWork(entry) ? entry.description : entry.dek;
  const meta = isWork(entry) ? `${entry.language} · ${entry.last_updated}` : `${entry.date} · ${entry.type}`;

  const content = (
    <Card className="grid gap-5 md:grid-cols-[13rem_minmax(0,1fr)_auto]">
      <p className="font-mono text-xs uppercase text-ink-2">{meta}</p>
      <div>
        <h2 className="text-4xl leading-tight">{title}</h2>
        <p className="mt-3 max-w-3xl text-ink-1">{description}</p>
      </div>
      {href ? <ArrowUpRight aria-hidden="true" className="text-accent" size={18} /> : null}
    </Card>
  );

  if (!href) {
    return content;
  }

  return (
    <a className="focus-ring rounded-lg" href={href} rel="noreferrer" target={href.startsWith("http") ? "_blank" : undefined}>
      {content}
    </a>
  );
}
