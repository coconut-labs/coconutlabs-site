import { SplitText } from "@/components/primitives/SplitText";
import { ThinRule } from "@/components/primitives/ThinRule";

export function ManifestoStrip() {
  return (
    <section className="content-band">
      <div className="content-inner">
        <ThinRule className="mb-16" />
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,30rem)]">
          <div className="max-w-[var(--measure)] space-y-6 text-[clamp(1.05rem,1.4vw,1.3rem)] leading-[1.6] text-ink-0">
            <p>
              <SplitText text="Coconut Labs works on the shared layer of inference: scheduling, fairness, cache pressure, and the measurements that keep claims honest." />
            </p>
            <p className="text-ink-1">
              <SplitText text="The lab is small by design. Fewer abstractions between the benchmark, the note, and the code." />
            </p>
          </div>
          <blockquote className="border-l-2 border-ink-0 pl-6 text-[clamp(1.5rem,2.6vw,2.3rem)] font-semibold leading-[1.15] tracking-[-0.02em] text-ink-0">
            1,585 ms of waiting for a prompt that costs 53.9 ms with nothing else on the box.
          </blockquote>
        </div>
      </div>
    </section>
  );
}
