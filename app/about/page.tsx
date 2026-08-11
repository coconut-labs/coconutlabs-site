// People grid hidden for now — names not public yet. Re-enable by
// uncommenting the loadPeople import + call and the people grid <div> below.
// import { PersonCard } from "@/components/about/PersonCard";
import { PrincipleCard } from "@/components/about/PrincipleCard";
import { loadManifesto, loadPrinciples } from "@/lib/content";
import { Markdown } from "@/lib/markdown";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About · Coconut Labs",
  description: "Manifesto and working principles for Coconut Labs.",
  path: "/about",
});

export default async function AboutPage() {
  const [manifesto, principles] = await Promise.all([
    loadManifesto(),
    loadPrinciples(),
    // loadPeople(),  // re-enable when names are public
  ]);

  return (
    <section className="content-band">
      <div className="content-inner">
        <p className="font-mono text-xs uppercase text-ink-2">about</p>
        <h1 className="mt-5 text-[clamp(4rem,10vw,9rem)] leading-[0.92]">A small lab for shared inference.</h1>
        <div className="post-body mt-12">
          <Markdown content={manifesto} />
        </div>

        {/* People grid hidden for now, see import comment at top.
        <div className="mt-20 grid gap-5 lg:grid-cols-2">
          <h2 className="sr-only">People</h2>
          {people.map((person) => (
            <PersonCard key={person.slug} person={person} />
          ))}
        </div>
        */}

        <h2 className="mt-20 text-[clamp(3rem,7vw,6rem)] leading-none">How we work</h2>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {principles.map((principle) => (
            <PrincipleCard body={principle.body} key={principle.title} title={principle.title} />
          ))}
        </div>
      </div>
    </section>
  );
}
