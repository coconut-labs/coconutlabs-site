import Link from "next/link";
import { loadProject, loadWork } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Projects · Coconut Labs",
  description: "The lab's projects: KVWarden, mlxd, Coconut OS, the hall of demos, and the smaller tools behind the public work. One lab, several surfaces.",
  path: "/projects",
});

export default async function ProjectsPage() {
  const [kvwarden, mlxd, coconutOs, work] = await Promise.all([
    loadProject("kvwarden"),
    loadProject("mlxd"),
    loadProject("coconut-os"),
    loadWork(),
  ]);

  // Filter the tools list — flagships are projects, not tools.
  const tools = work.filter((entry) => !["KVWarden", "mlxd", "Coconut OS"].includes(entry.name));

  return (
    <section className="content-band">
      <div className="content-inner">
        <p className="font-mono text-xs uppercase text-ink-2">what the lab builds</p>
        <h1 className="mt-5 text-[clamp(30px,4vw,46px)] leading-[1.05] tracking-[-0.03em]">Projects</h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-ink-1">
          Everything the lab builds, flagship first: KVWarden is live and measured, mlxd and
          Coconut OS are in research, and the smaller tools behind the public work sit at the end.
        </p>
        <p className="mt-4 max-w-2xl font-mono text-xs leading-6 text-ink-2">
          One lab, several surfaces. kvwarden.org and coconutos.org are separate domains for now, but everything here is Coconut Labs.
        </p>

        {/* KVWarden, large card */}
        <article className="mt-16 rounded-lg border border-rule bg-bg-1/70 p-8 transition hover:shadow-[var(--shadow-paper)] md:p-12">
          <h2 className="text-[clamp(3rem,7vw,6rem)] leading-none">{kvwarden.name}</h2>
          <p className="mt-3 font-mono text-xs uppercase text-ink-2">{kvwarden.tagline}</p>
          <p className="mt-8 font-mono text-[clamp(1.6rem,3.5vw,3.2rem)] leading-tight text-ink-0">
            {kvwarden.result}
          </p>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-ink-1">{kvwarden.content}</p>
          <div className="mt-8 flex flex-wrap gap-5 font-mono text-xs">
            <Link
              className="focus-ring inline-flex items-center gap-2 rounded-sm text-accent"
              href="/evidence/tenant-fairness-on-shared-inference"
            >
              Read the launch
            </Link>
            <Link
              className="focus-ring inline-flex items-center gap-2 rounded-sm text-ink-1 hover:text-accent"
              href="/projects/kvwarden"
            >
              Project page
            </Link>
            <a
              className="focus-ring inline-flex items-center gap-2 rounded-sm text-ink-1 hover:text-accent"
              href="https://github.com/coconut-labs/kvwarden"
            >
              GitHub
            </a>
          </div>
        </article>

        {/* mlxd, medium card */}
        <article className="mt-10 rounded-lg border border-rule bg-bg-1/40 p-8">
          <h2 className="text-[clamp(2.4rem,5vw,4.4rem)] leading-none">{mlxd.name}</h2>
          <p className="mt-3 font-mono text-xs uppercase text-ink-2">{mlxd.tagline}</p>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-ink-1">{mlxd.content}</p>
          {mlxd.probeWindow ? (
            <p className="mt-5 font-mono text-xs text-ink-2">Probe window: {mlxd.probeWindow}.</p>
          ) : null}
          <div className="mt-7 flex flex-wrap gap-5 font-mono text-xs">
            <Link
              className="focus-ring inline-flex items-center gap-2 rounded-sm text-accent"
              href="/projects/mlxd"
            >
              Project page
            </Link>
          </div>
        </article>

        {/* Coconut OS, medium card */}
        <article className="mt-10 rounded-lg border border-rule bg-bg-1/40 p-8">
          <h2 className="text-[clamp(2.4rem,5vw,4.4rem)] leading-none">{coconutOs.name}</h2>
          <p className="mt-3 font-mono text-xs uppercase text-ink-2">{coconutOs.tagline}</p>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-ink-1">{coconutOs.content}</p>
          <div className="mt-7 flex flex-wrap gap-5 font-mono text-xs">
            <Link
              className="focus-ring inline-flex items-center gap-2 rounded-sm text-accent"
              href="/projects/coconut-os"
            >
              Project page
            </Link>
            <a
              className="focus-ring inline-flex items-center gap-2 rounded-sm text-ink-1 hover:text-accent"
              href="https://coconutos.org"
            >
              coconutos.org
            </a>
          </div>
        </article>

        {/* Gallery, hall of demos */}
        <article className="mt-10 rounded-lg border border-rule bg-bg-1/40 p-8">
          <h2 className="text-[clamp(2.4rem,5vw,4.4rem)] leading-none">Hall of demos</h2>
          <p className="mt-3 font-mono text-xs uppercase text-ink-2">an agentic MLOps atlas + measured prototypes</p>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-ink-1">
            One method at two scales: a deep agentic-MLOps platform case study, and seven small
            free-standing prototypes, each solving one company&rsquo;s real data-systems bottleneck,
            with a guardrail you can run in your browser.
          </p>
          <div className="mt-7 flex flex-wrap gap-5 font-mono text-xs">
            <Link
              className="focus-ring inline-flex items-center gap-2 rounded-sm text-accent"
              href="/projects/gallery"
            >
              Open the gallery
            </Link>
            <Link
              className="focus-ring inline-flex items-center gap-2 rounded-sm text-ink-1 hover:text-accent"
              href="/projects/agentic-mlops"
            >
              The atlas
            </Link>
          </div>
        </article>

        {/* Tools & experiments */}
        <div className="mt-16 border-t border-rule pt-10" id="tools">
          <p className="font-mono text-xs uppercase text-ink-2">tools and experiments</p>
          <p className="mt-4 max-w-2xl font-mono text-sm leading-7 text-ink-1">
            Smaller things, mostly the scaffolding behind the public work.
          </p>
          {tools.length === 0 ? (
            <p className="mt-8 font-mono text-xs text-ink-2">
              Nothing here yet. The repos live at{" "}
              <a
                className="focus-ring rounded-sm text-accent underline decoration-1 underline-offset-2"
                href="https://github.com/coconut-labs"
              >
                github.com/coconut-labs
              </a>
              .
            </p>
          ) : (
            <ul className="mt-8 grid gap-5 md:grid-cols-2">
              {tools.map((tool) => (
                <li className="border-l-2 border-rule pl-4" key={tool.name}>
                  <a
                    className="focus-ring inline-flex items-baseline gap-3 rounded-sm text-2xl text-ink-0 hover:text-accent"
                    href={tool.repo_url}
                  >
                    {tool.name}
                    <span className="font-mono text-xs uppercase text-ink-2">{tool.language}</span>
                  </a>
                  <p className="mt-2 max-w-prose text-sm leading-6 text-ink-1">{tool.description}</p>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-10 font-mono text-xs text-ink-2">
            <a
              className="focus-ring rounded-sm text-accent underline decoration-1 underline-offset-2"
              href="/rss.xml"
            >
              Subscribe by RSS
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
