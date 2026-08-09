import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Founder cards hidden for now — names not public yet. Re-enable by
// uncommenting the imports + FounderCard component + people grid below.
//
// import Image from "next/image";
// import { ArrowUpRight } from "lucide-react";
// import { loadPeople, type Person } from "@/lib/content";
//
// function FounderCard({ person }: { person: Person }) {
//   return (
//     <article className="grid gap-5 rounded-lg border border-rule bg-bg-1/70 p-4 shadow-[var(--shadow-soft)] sm:grid-cols-[8rem_minmax(0,1fr)]">
//       {person.image ? (
//         <div className="relative aspect-square overflow-hidden rounded border border-rule">
//           <Image alt={person.name} className="object-cover" fill src={person.image} />
//         </div>
//       ) : null}
//       <div>
//         <p className="font-mono text-xs uppercase text-accent-2">{person.role}</p>
//         <h3 className="mt-2 font-serif text-3xl leading-none">{person.name}</h3>
//         <p className="mt-3 text-sm leading-6 text-ink-1">{person.bio}</p>
//         <div className="mt-4 flex flex-wrap gap-3 font-mono text-[0.7rem] uppercase text-accent">
//           {person.links.map((link) => (
//             <a className="focus-ring inline-flex items-center gap-1 rounded-sm" href={link.href} key={link.href}>
//               {link.label} <ArrowUpRight aria-hidden="true" size={12} />
//             </a>
//           ))}
//         </div>
//       </div>
//     </article>
//   );
// }

export function PeopleStrip() {
  // const people = await loadPeople();  // re-enable when names are public

  return (
    <section className="content-band">
      <div className="content-inner">
        <div className="max-w-4xl">
          <p className="font-mono text-xs uppercase text-accent-2">the lab</p>
          <h2 className="mt-4 font-serif text-[clamp(3rem,7vw,6rem)] leading-none">Two engineers, close to the work.</h2>
          <p className="mt-7 max-w-2xl text-xl leading-9 text-ink-1">
            Coconut Labs is intentionally small. The work happens in the open at{" "}
            <a className="text-accent underline underline-offset-2 hover:text-accent-2" href="https://github.com/coconut-labs">github.com/coconut-labs</a>{" "}
            and shows up here when there is a result worth standing behind.
          </p>
        </div>

        {/* Founder cards hidden for now — see comment at top of file.
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {people.map((person) => (
            <FounderCard key={person.slug} person={person} />
          ))}
        </div>
        */}

        <Link className="focus-ring mt-8 inline-flex items-center gap-2 rounded-sm font-mono text-xs text-accent" href="/about">
          How we work <ArrowRight aria-hidden="true" size={14} />
        </Link>
      </div>
    </section>
  );
}
