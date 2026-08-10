import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CoconutLabsLogo } from "@/components/primitives/CoconutLabsLogo";
import { HeroCanvas } from "@/components/home/HeroCanvas";
import { getLatestPostSlug } from "@/lib/content";

export async function Hero() {
  const latestSlug = await getLatestPostSlug();

  return (
    <section className="isolate relative grid min-h-[calc(100svh-var(--header-height))] place-items-center overflow-hidden px-[var(--space-page-x)] py-20">
      <HeroCanvas />
      <div className="mx-auto max-w-[88rem]">
        <p className="mb-6 font-mono text-xs uppercase text-accent-2">independent inference research</p>
        <h1 className="block leading-none text-ink-0">
          <CoconutLabsLogo
            animate
            ariaLabel="Coconut Labs"
            style={{
              display: "inline-flex",
              fontSize: "clamp(2.4rem, 7.5vw, 4.5rem)",
              maxWidth: "100%",
            }}
          />
        </h1>
        <p className="mt-10 max-w-2xl font-sans text-xl leading-8 text-ink-1 md:text-2xl">
          Schedulers, systems notes, and reproducible measurements for shared inference.
        </p>
        <p className="mt-6 max-w-2xl font-mono text-sm leading-7 text-ink-1">
          KVWarden Gate 2: 1.14× of solo TTFT under load. 26× better than FIFO.
        </p>
        <div className="mt-8">
          <Link
            className="focus-ring inline-flex items-center gap-2 rounded border border-accent bg-accent px-5 py-3 font-mono text-xs uppercase tracking-wide text-bg-0 transition hover:bg-accent-2 hover:border-accent-2"
            data-cta="hero"
            href={`/research/${latestSlug}`}
          >
            Read the launch <ArrowRight aria-hidden="true" size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
