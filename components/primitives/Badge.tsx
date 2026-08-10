import type { ReactNode } from "react";

// Reduced palette: one accent, success for genuine live/positive status,
// ink for neutral metadata. The old amber/sage/rose paper tones are gone.
type BadgeTone = "accent" | "success" | "ink";

const tones: Record<BadgeTone, string> = {
  accent: "border-accent/40 bg-accent/10 text-accent",
  success: "border-success/40 bg-success/10 text-success",
  ink: "border-ink-0/30 bg-ink-0/5 text-ink-0",
};

export function Badge({ children, tone = "ink" }: { children: ReactNode; tone?: BadgeTone }) {
  return (
    <span className={`inline-flex rounded border px-2 py-1 font-mono text-[0.68rem] uppercase ${tones[tone]}`}>
      {children}
    </span>
  );
}
