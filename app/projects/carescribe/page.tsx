import Link from "next/link";
import Disclosure from "@/components/demos/Disclosure";
import Steps from "@/components/demos/Steps";
import { buildMetadata } from "@/lib/seo";
import Demo from "./Demo";

export const metadata = buildMetadata({
  title: "CareScribe · Coconut Labs",
  description:
    "A clinical transcript becomes a structured note, written by a real model running on Cloudflare's GPUs. Synthetic transcripts, nothing stored.",
  path: "/projects/carescribe",
});

export default function CareScribePage() {
  return (
    <section className="content-band">
      <div className="content-inner max-w-4xl">
        <p className="font-mono text-xs uppercase text-ink-2">gallery unit · applied ai</p>
        <h1 className="mt-5 text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.02]">CareScribe</h1>

        <p className="mt-6 max-w-2xl text-xl leading-9 text-ink-1">
          A clinician talks for four minutes. The chart needs five headings, and every one of them
          has to be supported by something that was actually said.
        </p>

        <div className="mt-10">
          <Demo />
        </div>

        <div className="mt-12">
          <Steps
            items={[
              {
                label: "transcript in",
                text: "A synthetic visit transcript, either one of the three presets or whatever you type.",
              },
              {
                label: "model runs",
                text: "Your browser posts it to a Worker. The Worker calls a model on Cloudflare's GPUs and waits. The note comes back whole.",
              },
              {
                label: "note out",
                text: "Five headings. Anything the transcript does not support is marked not documented rather than filled in.",
              },
            ]}
          />
        </div>

        <div className="mt-14 border-t border-rule">
          <h2 className="sr-only">Go deeper</h2>

          <Disclosure summary="The instruction the model is given" defaultOpenDesktop>
            <p className="max-w-2xl text-base leading-7 text-ink-1">
              The prompt is short and most of it is prohibition. It fixes the five headings, then
              spends its remaining words telling the model what not to do:
            </p>
            <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-sm border border-rule bg-bg-0 p-4 font-mono text-[12.5px] leading-6 text-ink-0">
{`Write only what the transcript supports. If the transcript does not
cover a heading, write 'not documented' under it. Never invent a vital
sign, a dose, a lab value, or a diagnosis.`}
            </pre>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink-1">
              Run the thin transcript preset to see whether it holds. That transcript supports
              almost nothing, and a model that wants to be helpful will happily produce a full note
              from it. The interesting output is the one that mostly says not documented.
            </p>
          </Disclosure>

          <Disclosure summary="How this runs for nothing">
            <p className="max-w-2xl text-base leading-7 text-ink-1">
              Workers AI is included in the Cloudflare free plan with an allocation of 10,000
              neurons per day. The Worker in front of it is on the free plan too, which caps a
              Worker at 10 ms of its own CPU per request. That sounds fatal for a model call and is
              not: CPU time counts only the Worker executing its own code, and time spent waiting
              on a binding does not count. The Worker validates, prompts, waits, and shapes the
              reply, which costs a couple of milliseconds. The model does the work on hardware I do
              not pay for.
            </p>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink-1">
              When the daily allocation runs out the endpoint returns 503 and says so, rather than
              failing in a way that looks like a bug. It resets at 00:00 UTC.
            </p>
          </Disclosure>

          <Disclosure summary="What this demo does not show">
            <ul className="max-w-2xl list-disc space-y-2 pl-5 text-base leading-7 text-ink-1">
              <li>
                No real patient data, ever. The transcripts are synthetic and written for this
                page. The repository behind it is a curation pipeline over public CC BY 4.0
                corpora with staged de-identification, and carries no PHI.
              </li>
              <li>
                No evaluation. This page shows one model answering one transcript. It does not
                show accuracy against a reference, agreement between clinicians, or a hallucination
                rate. Those numbers do not exist yet and the page does not imply them.
              </li>
              <li>
                No fine-tuning. This is a general instruction-following model with a careful
                prompt. Any claim that it was adapted to clinical text would be false.
              </li>
              <li>
                Not a medical device and not clinical advice.
              </li>
            </ul>
          </Disclosure>
        </div>

        <div className="mt-14 flex flex-wrap gap-6 border-t border-rule pt-8 font-mono text-xs">
          <a
            className="focus-ring rounded-sm text-accent"
            href="https://github.com/ShreyPatel4/carescribe"
            rel="noreferrer"
            target="_blank"
          >
            Source <span aria-hidden="true">↗</span>
          </a>
          <Link className="focus-ring rounded-sm text-accent" href="/projects/gallery">
            All units
          </Link>
        </div>
      </div>
    </section>
  );
}
