import { SplitText } from "@/components/primitives/SplitText";
import { ThinRule } from "@/components/primitives/ThinRule";

export function ManifestoStrip() {
  return (
    <section className="content-band">
      <div className="content-inner">
        <ThinRule className="mb-16" />
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,30rem)]">
          <div className="max-w-[var(--measure)] space-y-7 font-body text-[clamp(1.3rem,2vw,2rem)] leading-[1.35] text-ink-0">
            <p>
              <SplitText text="Coconut Labs works on the shared layer of inference: scheduling, fairness, cache pressure, and the measurements that keep claims honest." />
            </p>
            <p className="text-ink-1">
              <SplitText text="The lab is small by design. Fewer abstractions between the benchmark, the note, and the code." />
            </p>
          </div>
          <blockquote className="text-[clamp(2.2rem,4vw,4.8rem)] leading-none text-ink-0">
            The quiet tenant should still have a name.
          </blockquote>
        </div>
      </div>
    </section>
  );
}
