import Link from "next/link";
import { ColophonSection } from "@/components/colophon/ColophonSection";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Colophon · Coconut Labs",
  description: "Fonts, stack, and build notes for coconutlabs.org.",
  path: "/colophon",
});

export default function ColophonPage() {
  return (
    <section className="content-band">
      <div className="content-inner">
        <p className="font-mono text-xs uppercase text-ink-2">colophon</p>
        <h1 className="mt-5 text-[clamp(30px,4vw,46px)] leading-[1.05] tracking-[-0.03em]">How this page is made.</h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-ink-1">
          The type, the stack, and the build notes behind coconutlabs.org, for anyone curious how
          the site itself is put together.
        </p>
        <p className="mt-6">
          <Link
            className="focus-ring inline-flex items-center gap-2 rounded-sm font-mono text-xs uppercase text-accent"
            href="/projects"
          >
            For the work itself, see projects <span aria-hidden="true">→</span>
          </Link>
        </p>
        <div className="mt-16">
          <ColophonSection title="Type">
            <p>Instrument Serif for display, Fraunces for editorial body copy, Geist for interface text, and Geist Mono for metadata.</p>
          </ColophonSection>
          <ColophonSection title="Stack">
            <p>Next.js App Router, React, TypeScript, Tailwind CSS, MDX content files, Playwright, Vitest, axe-core, and Lighthouse CI.</p>
          </ColophonSection>
          <ColophonSection title="Inspiration">
            <p>Research notebooks, quiet workstations, paper folds, and web pages that leave room for the result.</p>
          </ColophonSection>
        </div>
      </div>
    </section>
  );
}
