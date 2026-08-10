import { ProjectHero } from "@/components/projects/ProjectHero";
import { loadProject } from "@/lib/content";
import { Markdown } from "@/lib/markdown";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Coconut OS · Coconut Labs",
  description: "A Linux distribution where agents are first-class.",
  path: "/projects/coconut-os",
});

export default async function CoconutOsPage() {
  const project = await loadProject("coconut-os");
  return (
    <>
      <ProjectHero project={project} />
      <section className="content-band pt-0">
        <div className="content-inner post-body">
          <Markdown content={project.content} />
        </div>
      </section>
    </>
  );
}
