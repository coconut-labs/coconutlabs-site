"use client";

import { useEffect, useRef, type ReactNode } from "react";

/* Progressive disclosure for the "go deeper" sections. Native <details> with a
   styled <summary> row, so it is keyboard operable and free for screen readers.
   defaultOpenDesktop opens the row after mount on >=768px viewports only;
   server render is closed everywhere, which keeps hydration deterministic and
   mobile collapsed by default. */
export default function Disclosure({
  summary,
  defaultOpenDesktop = false,
  children,
}: {
  summary: string;
  defaultOpenDesktop?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement | null>(null);

  useEffect(() => {
    if (defaultOpenDesktop && window.matchMedia("(min-width: 768px)").matches) {
      ref.current?.setAttribute("open", "");
    }
  }, [defaultOpenDesktop]);

  return (
    <details ref={ref} className="group border-b border-rule">
      <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-4 rounded-sm py-4 font-mono text-sm text-ink-0 transition hover:text-accent [&::-webkit-details-marker]:hidden">
        <span>{summary}</span>
        {/* drawn chevron, not a text glyph: the estate keeps arrow characters out of prose */}
        <svg
          aria-hidden="true"
          className="shrink-0 text-ink-2 transition-transform group-open:rotate-90"
          fill="none"
          height="12"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.6"
          viewBox="0 0 12 12"
          width="12"
        >
          <path d="M4.25 2.5 L7.75 6 L4.25 9.5" />
        </svg>
      </summary>
      <div className="pb-7">{children}</div>
    </details>
  );
}
