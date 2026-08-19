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
            href="/evidence/benchmarks"
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

        {/* Merged from the old /library page, which collided by name with the
            library.coconutlabs.org host and described two wings of a shelf
            that has four. /library 301s to this anchor. */}
        <section className="mt-20 rounded-sm border border-rule bg-bg-1 p-6" id="the-library">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2">the practice behind the lab</p>
          <h2 className="mt-3 text-xl text-ink-0">The Library</h2>
          <p className="mt-3 max-w-[68ch] leading-7 text-ink-1">
            The Library is the private study shelf the public work is built on, and it holds four
            things: the waterline atlas, the academy curricula, the essay drafts, and the
            masterclass source. The rule is one rep a day, fifteen minutes, go one level below what
            the job requires and write it down well enough to teach.
          </p>
          <p className="mt-3 max-w-[68ch] leading-7 text-ink-1">
            It stays behind a login at{" "}
            <a className="focus-ring text-accent underline decoration-1 underline-offset-2" href="https://library.coconutlabs.org">
              library.coconutlabs.org
            </a>{" "}
            because the drafts lean on first-person operational detail. The cleared subset is
            public: the atlas at{" "}
            <a className="focus-ring text-accent underline decoration-1 underline-offset-2" href="https://waterline.coconutlabs.org">
              Below the Waterline
            </a>
            , the course at{" "}
            <a className="focus-ring text-accent underline decoration-1 underline-offset-2" href="https://masterclass.coconutlabs.org">
              masterclass
            </a>
            , the essays at{" "}
            <a className="focus-ring text-accent underline decoration-1 underline-offset-2" href="https://shreypatel.coconutlabs.org/essays">
              shreypatel.coconutlabs.org/essays
            </a>
            . What the lab measured lands in{" "}
            <Link className="focus-ring text-accent underline decoration-1 underline-offset-2" href="/evidence">
              evidence
            </Link>
            .
          </p>
        </section>
      </div>
    </section>
  );
}
