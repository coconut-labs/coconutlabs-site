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
        <p className="font-mono text-xs uppercase text-accent-2">colophon</p>
        <h1 className="mt-5 text-[clamp(4rem,10vw,9rem)] leading-[0.92]">How this page is made.</h1>
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
