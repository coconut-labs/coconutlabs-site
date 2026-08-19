import Link from "next/link";
import { Card } from "@/components/primitives/Card";

// Direction A: name + accent metric line + one sentence. Large numbers live
// at 28-34px, not display size. The metric line does the sorting a state pill
// used to: KVWarden shows measured numbers, the other two show a phrase.
const projects = [
  {
    name: "KVWarden",
    href: "/projects/kvwarden",
    result: "1.14× of solo · 26× better than FIFO",
    body: "Tenant fairness on shared inference. A quiet tenant stays near solo latency while a flooder pushes the same engine.",
  },
  {
    name: "mlxd",
    href: "/projects/mlxd",
    result: "Tenant-fair inference on Apple Silicon",
    body: "A scheduler and admission layer on top of mlx_lm.server. Tenant identity first, then fairness on unified memory. Still in research.",
  },
  {
    name: "Coconut OS",
    href: "/projects/coconut-os",
    result: "Agents as kernel primitives",
    body: "A Linux distribution built on the position that the kernel should know what an agent is, what it may touch, and what it did. Spec phase, with kernel prototypes.",
  },
];

export function ProjectsStrip() {
  return (
    <section className="content-band">
      <div className="content-inner">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2">work</p>
        <h2 className="mb-8 mt-3 text-[clamp(1.6rem,3vw,2.4rem)] leading-tight tracking-[-0.03em]">Projects</h2>
        <div className="grid gap-6">
          {projects.map((project) => (
            <Link className="focus-ring rounded-sm" href={project.href} key={project.name}>
              <Card className="grid gap-6 md:grid-cols-[0.7fr_1.3fr]" tilt>
                <div>
                  <h3 className="text-[clamp(1.5rem,2.4vw,2rem)] font-semibold leading-none tracking-[-0.02em]">{project.name}</h3>
                </div>
                <div>
                  <p className="text-[clamp(24px,2.4vw,32px)] font-semibold leading-tight tracking-[-0.03em] text-accent">{project.result}</p>
                  <p className="mt-3 max-w-[68ch] text-base leading-7 text-ink-1">{project.body}</p>
                  <span className="mt-5 inline-flex items-center gap-2 font-mono text-xs text-ink-0">
                    Project page
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
        <p className="mt-8 font-mono text-xs leading-6 text-ink-2">
          kvwarden.org and coconutos.org are separate domains for now. Everything is one lab. The
          running demos live in the{" "}
          <Link className="focus-ring text-accent underline decoration-1 underline-offset-2" href="/projects/gallery">
            hall of demos
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
