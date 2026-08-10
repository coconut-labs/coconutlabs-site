import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "The Library",
  description:
    "The private study practice behind the lab: a systems atlas, a practice shelf, and essays. What it is, how it works, and the parts that surface publicly as research notes.",
});

const wings = [
  {
    name: "Below the Waterline",
    kind: "the atlas",
    status: "private",
    body: "A nightly atlas of how real systems actually work: case studies and ground-floor primers on MapReduce, Kafka's storage engine, vector search, LSM engines, GPUs, and LLM serving. Every piece descends from the business problem to the metal, with diagrams doing half the teaching.",
    note: "Six artifacts and counting. Private by design: the writing leans on first-person operational detail, so it stays on the shelf it was written for.",
  },
  {
    name: "The Study Shelf",
    kind: "practice",
    status: "private",
    body: "Working curricula run against real prototypes: an applied-AI systems course built module by module, and a forward-deployed engineering masterclass for data people. Every module ends in something that runs, and each carries a fifteen-minute daily rep.",
    note: "The operating rule is one rep a day, every day. A streak counter keeps the score honest.",
  },
  {
    name: "Essays",
    kind: "writing",
    status: "surfacing",
    body: "Fifteen pieces in plain English: the machinery under data tools, the craft of AI systems that hold up, the practice of learning one level down, and studio notes from building a synthesizer with a model in the room.",
    note: "Essays publish here as research notes once they are rewritten public-native and edited by hand.",
  },
];

export default function LibraryPage() {
  return (
    <div className="mx-auto max-w-3xl px-[var(--space-page-x)] py-20">
      <p className="font-mono text-xs uppercase tracking-wide text-ink-2">the practice behind the lab</p>
      <h1 className="mt-3 text-4xl text-ink-0">The Library</h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-1">
        The lab publishes measurements. The Library is where the understanding gets built first: one
        private study practice, three wings, one rule. Go one level below what the job requires,
        every day, and write it down well enough to teach.
      </p>

      <div className="mt-12 space-y-6">
        {wings.map((wing) => (
          <section
            className="rounded-xl border border-rule bg-bg-1 p-6"
            key={wing.name}
          >
            <div className="flex flex-wrap items-baseline gap-3">
              <h2 className="text-xl text-ink-0">{wing.name}</h2>
              <span className="font-mono text-[0.68rem] uppercase tracking-wide text-ink-2">
                {wing.kind} · {wing.status}
              </span>
            </div>
            <p className="mt-3 leading-7 text-ink-1">{wing.body}</p>
            <p className="mt-3 text-sm leading-6 text-ink-2">{wing.note}</p>
          </section>
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-rule bg-bg-1 p-6">
        <h2 className="text-xl text-ink-0">What has surfaced so far</h2>
        <p className="mt-3 leading-7 text-ink-1">
          Two library pieces have been rewritten public-native and live on the research shelf:{" "}
          <Link className="text-accent underline underline-offset-2 hover:opacity-80" href="/research/a-model-in-the-room">
            A model in the room
          </Link>{" "}
          and{" "}
          <Link className="text-accent underline underline-offset-2 hover:opacity-80" href="/research/mixing-and-evals">
            What mixing taught me about evals
          </Link>
          . More follow the same path: written privately, tested against real work, then rewritten
          clean for this shelf.
        </p>
        <p className="mt-4">
          <Link className="text-accent underline underline-offset-2 hover:opacity-80" href="/research">
            Browse the research shelf →
          </Link>
        </p>
      </div>
    </div>
  );
}
