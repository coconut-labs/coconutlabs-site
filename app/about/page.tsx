// People grid hidden for now — names not public yet. Re-enable by
// uncommenting the loadPeople import + call and the people grid <div> below.
// import { PersonCard } from "@/components/about/PersonCard";
import Link from "next/link";
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
        <p className="font-mono text-xs uppercase text-ink-2">who we are and how we work</p>
        <h1 className="mt-5 text-[clamp(30px,4vw,46px)] leading-[1.05] tracking-[-0.03em]">A small lab for shared inference.</h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-ink-1">
          The manifesto and the working principles of a two-person inference research lab.
        </p>
        <p className="mt-6">
          <Link
            className="focus-ring inline-flex items-center gap-2 rounded-sm font-mono text-xs uppercase text-accent"
            href="/benchmarks"
          >
            See the proof page <span aria-hidden="true">→</span>
          </Link>
        </p>
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
