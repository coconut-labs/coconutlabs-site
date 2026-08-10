import Link from "next/link";
import { Badge } from "@/components/primitives/Badge";
import { Card } from "@/components/primitives/Card";

const projects = [
  {
    name: "KVWarden",
    href: "/projects/kvwarden",
    status: "Live",
    result: "1.14x of solo, 26x better than FIFO",
    body: "Tenant fairness on shared inference. A quiet tenant stays visible when a flooder arrives.",
    tone: "success" as const,
  },
  {
    name: "mlxd",
    href: "/projects/mlxd",
    status: "In research",
    result: "Tenant-fair Apple Silicon inference",
    body: "A scheduler + admission layer on top of mlx_lm.server. Restoring tenant identity first, then fairness on unified-memory hardware.",
    tone: "accent" as const,
  },
];

export function ProjectsStrip() {
  return (
    <section className="content-band">
      <div className="content-inner">
        <h2 className="mb-8 text-[clamp(3rem,7vw,6rem)] leading-none">Projects</h2>
        <div className="grid gap-6">
          {projects.map((project) => (
            <Link className="focus-ring rounded-lg" href={project.href} key={project.name}>
              <Card className="grid gap-8 md:grid-cols-[0.8fr_1.2fr]" tilt>
                <div>
                  <Badge tone={project.tone}>{project.status}</Badge>
                  <h3 className="mt-5 text-5xl leading-none">{project.name}</h3>
                </div>
                <div>
                  <p className="font-mono text-[clamp(2rem,5vw,5rem)] leading-none text-accent">{project.result}</p>
                  <p className="mt-5 max-w-2xl text-lg leading-8 text-ink-1">{project.body}</p>
                  <span className="mt-7 inline-flex items-center gap-2 font-mono text-xs text-ink-0">
                    Read more <span aria-hidden="true">↗</span>
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
