"use client";

import { useState } from "react";

export function ShareRow({ title, doi }: { title: string; doi?: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="no-print mx-auto flex max-w-[var(--measure)] flex-wrap gap-3 px-[var(--space-page-x)] pb-24 font-mono text-xs">
      <button
        className="focus-ring inline-flex h-10 items-center gap-2 rounded border border-rule bg-bg-1 px-3 text-ink-0 hover:border-accent"
        onClick={copyLink}
        type="button"
      >
        {copied ? <span aria-hidden="true">✓</span> : null}
        {copied ? "Copied" : "Copy link"}
      </button>
      <a
        className="focus-ring inline-flex h-10 items-center gap-2 rounded border border-rule bg-bg-1 px-3 hover:border-accent"
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(typeof window === "undefined" ? "" : window.location.href)}`}
      >
        X
      </a>
      <a
        className="focus-ring inline-flex h-10 items-center gap-2 rounded border border-rule bg-bg-1 px-3 hover:border-accent"
        href={`mailto:?subject=${encodeURIComponent(title)}`}
      >
        Email
      </a>
      {doi ? <span className="inline-flex h-10 items-center rounded border border-rule bg-bg-2 px-3">DOI {doi}</span> : null}
    </div>
  );
}
