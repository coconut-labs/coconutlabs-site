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
        <span aria-hidden="true" className="text-ink-2 transition-transform group-open:rotate-90">
          →
        </span>
      </summary>
      <div className="pb-7">{children}</div>
    </details>
  );
}
