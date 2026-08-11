import type { ReactNode } from "react";

/* Shared stage for the guardrail sandboxes. House tokens only: bg-1 card,
   rule borders, --rad radius, mono labels, success/danger verdict colors with
   a text label always beside the color. Glyphs only (● ✓ ✕ →), no icon libs. */

export type OutcomeTone = "success" | "danger" | "neutral";

export type Outcome = {
  tone: OutcomeTone;
  /** Short mono label beside the glyph, e.g. "FLAGGED", "CLEAN PASS". */
  label: string;
  /** One or two plain sentences stating what just happened. */
  headline: string;
  detail?: string;
};

const GLYPH: Record<OutcomeTone, string> = { success: "✓", danger: "✕", neutral: "●" };

const TONE_TEXT: Record<OutcomeTone, string> = {
  success: "text-success",
  danger: "text-danger",
  neutral: "text-ink-1",
};

const TONE_BOX: Record<OutcomeTone, string> = {
  success: "border-success/40 bg-success/5",
  danger: "border-danger/40 bg-danger/5",
  neutral: "border-rule bg-bg-2/40",
};

export default function DemoShell({
  scenario,
  controlsLabel = "pick a scenario",
  controls,
  outcome,
  children,
  footnote,
}: {
  /** "You are the data engineer. ..." One line that puts the visitor in the seat. */
  scenario: string;
  controlsLabel?: string;
  /** Preset scenario buttons / toggles. Must be keyboard operable. */
  controls: ReactNode;
  /** Plain-words statement of what the last run did. Announced politely. */
  outcome: Outcome;
  /** Tables, traces, verdict cards. Wide content scrolls in its own container. */
  children?: ReactNode;
  footnote?: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-rule bg-bg-1/60">
      <div className="border-b border-rule p-5 md:p-7">
        <p className="font-mono text-xs uppercase text-ink-2">scenario sandbox</p>
        <p className="mt-2 max-w-2xl text-base leading-7 text-ink-1">{scenario}</p>
      </div>
      <div className="p-5 md:p-7">
        <p className="font-mono text-xs uppercase text-ink-2">{controlsLabel}</p>
        <div className="mt-3">{controls}</div>

        {/* outcome banner: always mounted so the live region announces changes */}
        <div aria-live="polite" className={`mt-6 rounded-sm border p-4 md:p-5 ${TONE_BOX[outcome.tone]}`}>
          <p className={`font-mono text-xs uppercase tracking-wide ${TONE_TEXT[outcome.tone]}`}>
            <span aria-hidden="true">{GLYPH[outcome.tone]}</span> {outcome.label}
          </p>
          <p className="mt-2 max-w-2xl text-base leading-7 text-ink-0">{outcome.headline}</p>
          {outcome.detail ? (
            <p className="mt-2 max-w-2xl font-mono text-xs leading-5 text-ink-2">{outcome.detail}</p>
          ) : null}
        </div>

        {children ? <div className="mt-6">{children}</div> : null}
        {footnote ? <p className="mt-5 font-mono text-[0.7rem] leading-5 text-ink-2">{footnote}</p> : null}
      </div>
    </section>
  );
}
