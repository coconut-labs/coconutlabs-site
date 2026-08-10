import { EmailLink } from "@/components/primitives/EmailLink";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Contact · Coconut Labs",
  description: "Reach Coconut Labs at info@coconutlabs.org.",
  path: "/contact",
});

// Per-person rows hidden for now — names not public yet.
// Re-enable when ready by uncommenting and removing the single-inbox block below.
//
// const rows = [
//   {
//     title: "Collaborate",
//     body:
//       "For research collaborators, contributors, and people running adjacent work. Send a trace, a result, a paper draft, or a question about the harness. If your message has a specific artifact attached, it will get a faster response than one that does not.",
//     email: "shreypatel@coconutlabs.org",
//     subject: "Collaborate",
//   },
//   {
//     title: "Press",
//     body:
//       "For journalists, podcasters, and analysts. We are happy to verify numbers, point at the canonical post for a result, and answer short factual questions. We do not do embargoed interviews or feature exclusives.",
//     email: "jaypatel@coconutlabs.org",
//     subject: "Press",
//   },
//   {
//     title: "General",
//     body:
//       "For everything that does not fit the other two — recruiters, students, partners, anyone with a question that is not a collaboration or a press request. This inbox is read by both of us. Plain language is fine; pitch decks are not.",
//     email: "info@coconutlabs.org",
//     subject: undefined,
//   },
// ];

const NOT_FOR = [
  "Sales outreach. If you are selling something, you can stop here.",
  "Recruiting. We are not hiring. If we ever are, /joinus will say so.",
  "Bug reports for KVWarden or mlxd. File an issue on the repo instead.",
];

export default function ContactPage() {
  return (
    <section className="content-band">
      <div className="content-inner">
        <p className="font-mono text-xs uppercase text-ink-2">contact</p>
        <h1 className="mt-5 text-[clamp(4rem,10vw,9rem)] leading-[0.92]">Write the lab.</h1>

        <div className="mt-16 border-t border-rule pt-10">
          <p className="max-w-2xl leading-7 text-ink-1">
            Collaborate, press, recruiting questions, students, partners — anything. One inbox, read by us. Plain language is fine; pitch decks are not. Attach a specific artifact (trace, result, paper draft) if you want a faster reply.
          </p>
          <div className="mt-7">
            <EmailLink className="font-mono text-xs" email="info@coconutlabs.org" />
          </div>
        </div>

        {/* Per-person rows commented out — see top of file. The single-inbox
            block above replaces them while names stay private.
        <div className="mt-16 grid gap-5">
          {rows.map((row) => (
            <article
              className="grid gap-5 border-t border-rule py-7 md:grid-cols-[14rem_minmax(0,1fr)_auto]"
              key={row.title}
            >
              <h2 className="text-4xl">{row.title}</h2>
              <p className="max-w-2xl leading-7 text-ink-1">{row.body}</p>
              <EmailLink className="font-mono text-xs" email={row.email} subject={row.subject} />
            </article>
          ))}
        </div>
        */}

        <div className="mt-20 border-t border-rule pt-10">
          <p className="font-mono text-xs uppercase text-ink-2">response time</p>
          <p className="mt-4 max-w-2xl leading-7 text-ink-1">
            We don't always reply quickly. If something is time-sensitive, say so in the subject line and we will read it sooner.
          </p>
        </div>

        <div className="mt-12 border-t border-rule pt-10">
          <p className="font-mono text-xs uppercase text-ink-2">not for this inbox</p>
          <ul className="mt-4 grid max-w-2xl gap-3 leading-7 text-ink-1">
            {NOT_FOR.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
