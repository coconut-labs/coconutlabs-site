"use client";

import type { ReactNode } from "react";

/* One preset scenario chip. aria-pressed carries the state for keyboard and
   screen-reader users; color alone never does. */
export default function PresetButton({
  active,
  danger = false,
  onClick,
  children,
}: {
  active: boolean;
  /** Style the active state with the danger token (a corrupting preset). */
  danger?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  const activeCls = danger ? "border-danger bg-danger/10 text-danger" : "border-accent bg-accent/10 text-accent";
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`focus-ring rounded-sm border px-3 py-2 font-mono text-xs transition ${
        active ? activeCls : "border-rule text-ink-1 hover:border-accent hover:text-accent"
      }`}
    >
      {children}
    </button>
  );
}
