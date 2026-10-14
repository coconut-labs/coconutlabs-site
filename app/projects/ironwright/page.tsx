import Disclosure from "@/components/demos/Disclosure";
import Steps from "@/components/demos/Steps";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Ironwright · Coconut Labs",
  description:
    "A company that runs on mainframe files and CSV drops, taken to the point where an AI agent can make a business decision on it, safely. Four industry packs, $0, local.",
  path: "/projects/ironwright",
});

const FILMS = [
  {
    id: "retail",
    title: "Brightline Retail",
    question: "Why is this item underperforming in this store, and what do we do?",
  },
  {
    id: "supply_chain",
    title: "Corvane Distribution",
    question: "This shipment is late. Why, and expedite, reroute, or just tell the customer?",
  },
  {
    id: "banking_aml",
    title: "Harborview Bank",
    question: "Is this AML alert worth escalating, or can it be recommended for closure?",
  },
  {
    id: "insurance_claims",
    title: "Granite Mutual",
    question: "Fast track this claim, send it to coverage review, or refer it to SIU?",
  },
];

export default function IronwrightPage() {
  return (
    <section className="content-band">
      <div className="content-inner max-w-4xl">
        <p className="font-mono text-xs uppercase text-ink-2">gallery unit · legacy modernization</p>
        <h1 className="mt-5 text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.02]">Ironwright</h1>

        <p className="mt-6 max-w-2xl text-xl leading-9 text-ink-1">
          A company that runs on old iron: mainframe fixed-width files, aging databases, CSV
          drops. Ironwright takes it, end to end, to the point where an AI agent can make a real
          business decision on top of that data, safely. Not one demo: one engine and four mock
          businesses, each with its own legacy mess, its own ontology, and its own agent.
        </p>

        <figure className="mt-10">
          <video
            className="w-full rounded-sm border border-rule"
            controls
            preload="none"
            poster="/ironwright/intro-poster.jpg"
            src="/ironwright/intro.mp4"
          />
          <figcaption className="mt-2 font-mono text-[12px] text-ink-2">
            The whole story in 3 min 41 s, rendered from the engine&rsquo;s own runs. Silent.
          </figcaption>
        </figure>

        <div className="mt-12">
          <Steps
            items={[
              {
                label: "legacy in",
                text: "Fixed-width mainframe files, old SQLite applications, CSV drops, event streams. The mess is generated with the defects planted on purpose, so ground truth exists.",
              },
              {
                label: "lakehouse",
                text: "Bronze, silver, gold on Iceberg. Every write goes through write-audit-publish: branch, check, fast-forward. Bad loads never reach a reader.",
              },
              {
                label: "ontology",
                text: "Identity resolution with a provenance crosswalk, then objects, links, functions for reads and actions for writes.",
              },
              {
                label: "agent decides",
                text: "A LangGraph agent works the decision through ontology calls only, behind default-deny policy. Irreversible actions stop for a human. Every step lands in a hash-chained audit log.",
              },
            ]}
          />
        </div>

        <h2 className="mt-14 text-2xl">Four packs, four decisions</h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-ink-1">
          Each film below is rendered from the engine&rsquo;s own export for that pack: the
          numbers, runs and traces on screen are what the engine actually produced. 1 min 34 s
          each, silent.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {FILMS.map((f) => (
            <figure key={f.id}>
              <video
                className="w-full rounded-sm border border-rule"
                controls
                preload="none"
                poster={`/ironwright/films/${f.id}.jpg`}
                src={`/ironwright/films/${f.id}.mp4`}
              />
              <figcaption className="mt-2 text-sm leading-6 text-ink-1">
                <span className="font-mono text-[12px] text-ink-0">{f.title}</span>
                <br />
                {f.question}
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-14 border-t border-rule">
          <h2 className="sr-only">Go deeper</h2>

          <Disclosure summary="What runs where, and what it costs" defaultOpenDesktop>
            <p className="max-w-2xl text-base leading-7 text-ink-1">
              Everything runs on a laptop for $0: no Docker, no API keys, no cloud account. The
              lakehouse is PyIceberg on SQLite with DuckDB reads. The agent runs offline by
              default; pointing it at a hosted model is a config change, not a code change. The
              suite is 9 tests covering the engine and all four packs end to end, green on the
              2026-10-13 build of this page (Apple M1 Pro).
            </p>
          </Disclosure>

          <Disclosure summary="Two more films, and why they do not count">
            <p className="max-w-2xl text-base leading-7 text-ink-1">
              Healthcare and investing films exist too, rendered from hand-written specs rather
              than engine runs. They are ideation, not evidence, so they are not shown beside the
              four real packs. They ship with the source and are labeled the same way there.
            </p>
          </Disclosure>

          <Disclosure summary="The policy and audit posture">
            <p className="max-w-2xl text-base leading-7 text-ink-1">
              Policy is Cedar-style and default deny: an action either has a permit or it does
              not run, and irreversible actions carry forbids that route to human approval
              instead. Model output never picks an action and never reaches a tool argument. The
              audit log is hash-chained, so editing history breaks the chain visibly.
            </p>
          </Disclosure>

          <Disclosure summary="Where the source is">
            <p className="max-w-2xl text-base leading-7 text-ink-1">
              The repository is assembled and green locally and goes public under
              ShreyPatel4/ironwright; the link lands here the day it does. Until then, every
              claim on this page is reproducible from the films&rsquo; own frames: run ids,
              reconciliation counts, and trace waterfalls are shown, not described.
            </p>
          </Disclosure>
        </div>
      </div>
    </section>
  );
}
