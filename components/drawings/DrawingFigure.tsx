import type { ReactNode } from "react";

/* The plate + caption + walkthrough wrapper every working drawing sits in.
 *
 * The figure ground is the dark plate (#0C0C0E in both themes, design-system
 * section 7). Caption hairline and caption ink are pinned to the plate's own
 * values for the same reason the drawing inks are: theme tokens would flip
 * against a constant ground. The SVG scrolls horizontally on narrow
 * viewports instead of scaling down, so its 10.5px label floor holds.
 * The sr-only figcaption is the text alternative: it walks the path in
 * words for readers who never see the geometry. */

type Props = {
  caption: string;
  conditions: string;
  alt: string;
  steps: string[];
  minWidth: number;
  children: ReactNode;
};

export function DrawingFigure({ caption, conditions, alt, steps, minWidth, children }: Props) {
  return (
    <div className="mt-8">
      <figure className="m-0">
        <div className="rounded-sm border border-rule bg-[#0C0C0E] p-4 sm:p-5">
          <div className="overflow-x-auto">
            <div style={{ minWidth }}>{children}</div>
          </div>
          <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-[rgba(255,255,255,0.16)] pt-3">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#82828E]">
              {caption}
            </span>
            <span className="font-mono text-[10.5px] text-[#82828E]">{conditions}</span>
          </div>
        </div>
        <figcaption className="sr-only">{alt}</figcaption>
      </figure>
      <details className="group mt-3 rounded-sm border border-rule bg-bg-1">
        <summary className="focus-ring flex cursor-pointer items-center gap-2 rounded-sm p-4 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2">
          Read this drawing
        </summary>
        <ol className="list-decimal space-y-2 border-t border-hair p-5 pl-10 text-[15px] leading-7 text-ink-1">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </details>
    </div>
  );
}
