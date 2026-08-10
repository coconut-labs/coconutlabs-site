import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { EmailLink } from "@/components/primitives/EmailLink";
import type { Person } from "@/lib/content";

export function PersonCard({ person }: { person: Person }) {
  return (
    <article className="grid gap-6 rounded-lg border border-rule bg-bg-1/70 p-5 md:grid-cols-[12rem_minmax(0,1fr)]">
      {person.image ? (
        <div className="relative aspect-[4/5] overflow-hidden rounded border border-rule">
          <Image alt={person.name} className="object-cover" fill src={person.image} />
        </div>
      ) : null}
      <div>
        <p className="font-mono text-xs uppercase text-accent-2">{person.role}</p>
        <h3 className="mt-3 text-4xl">{person.name}</h3>
        <p className="mt-4 leading-7 text-ink-1">{person.bio}</p>
        <div className="mt-5 flex flex-wrap gap-4 font-mono text-xs">
          {person.links.map((link) => {
            if (link.href.startsWith("mailto:")) {
              const email = link.href.replace(/^mailto:/, "").replace(/\?.*$/, "");
              return <EmailLink email={email} key={link.href} label={link.label} />;
            }
            return (
              <a className="focus-ring inline-flex items-center gap-1 rounded-sm text-accent" href={link.href} key={link.href}>
                {link.label} <ArrowUpRight aria-hidden="true" size={13} />
              </a>
            );
          })}
        </div>
      </div>
    </article>
  );
}
