"use client";

import Link from "next/link";

export function PaperTear404() {
  return (
    <div className="mx-auto grid min-h-[70svh] max-w-5xl place-items-center px-[var(--space-page-x)] py-24">
      <div
        className="relative w-full rounded-lg border border-rule bg-bg-1 p-10 shadow-[var(--shadow-paper)] md:p-16"
        style={{ clipPath: "polygon(0 0, 100% 0, 96% 42%, 100% 100%, 0 100%, 5% 58%)" }}
      >
        <p className="font-mono text-xs uppercase text-accent-2">404</p>
        <h1 className="mt-6 text-[clamp(4rem,10vw,9rem)] leading-[0.92]">This page was never written.</h1>
        <p className="mt-8 font-mono text-sm leading-7 text-ink-1">// page not found — perhaps it was never written.</p>
        <Link className="focus-ring mt-9 inline-block rounded border border-rule px-4 py-3 font-mono text-xs text-accent" href="/">
          Back home
        </Link>
      </div>
    </div>
  );
}
