/* One check's verdict: name, flagged/passed with a text label beside the color,
   and a mono detail line. Shared by the guardrail sandboxes. */
export default function VerdictCard({
  name,
  flagged,
  good,
  detail,
}: {
  name: string;
  flagged: boolean;
  /** Whether this verdict is the right call for the current data. */
  good: boolean;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-rule bg-bg-2/40 p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-ink-1">{name}</span>
        <span className={`inline-flex items-center gap-1 font-mono text-xs ${good ? "text-success" : "text-danger"}`}>
          <span aria-hidden="true">{good ? "✓" : "✕"}</span>
          {flagged ? "flagged" : "passed"}
        </span>
      </div>
      <p className="mt-3 font-mono text-[0.72rem] leading-5 text-ink-2">{detail}</p>
    </div>
  );
}
