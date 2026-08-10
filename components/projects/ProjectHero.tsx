import { ArrowUpRight } from "lucide-react";
import { StatusBadge } from "@/components/projects/StatusBadge";
import type { Project } from "@/lib/content";

export function ProjectHero({ project }: { project: Project }) {
  return (
    <header className="content-band pb-12">
      <div className="content-inner">
        <StatusBadge status={project.status} />
        <h1 className="mt-6 text-[clamp(4.5rem,12vw,10rem)] leading-[0.9]">{project.name}</h1>
        <p className="mt-7 max-w-2xl text-2xl leading-9 text-ink-1">{project.tagline}</p>
        <p className="mt-12 max-w-5xl font-mono text-[clamp(2.3rem,7vw,7rem)] leading-none text-accent">{project.result}</p>
        <a
          className="focus-ring mt-10 inline-flex items-center gap-2 rounded border border-rule bg-bg-1 px-4 py-3 font-mono text-xs text-ink-0 hover:border-accent"
          href={project.outbound}
          rel="noreferrer"
          target="_blank"
        >
          Read the full project <ArrowUpRight aria-hidden="true" size={14} />
        </a>
      </div>
    </header>
  );
}
