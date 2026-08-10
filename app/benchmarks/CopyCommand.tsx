"use client";

import { useState } from "react";

export function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-sm border border-rule bg-bg-1 p-3">
      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2">reproduce</span>
      <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-[13.5px] text-ink-0">
        {command}
      </code>
      <button
        className="focus-ring min-h-[44px] rounded-sm bg-ink-0 px-4 font-mono text-[11px] uppercase tracking-[0.1em] text-bg-0"
        onClick={() => {
          navigator.clipboard.writeText(command).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1400);
          });
        }}
        type="button"
      >
        {copied ? "✓ copied" : "copy"}
      </button>
    </div>
  );
}
