import { getRepoSignals } from "@/lib/github";
import { loadResearchFeed } from "@/lib/content";

// Direction A status strip: full width, directly under the header. Leads
// with a live dot, items separated by middle dots, everything mono and
// quiet. Dates are absolute: relative dates rot visual baselines daily and
// carry less information.
export async function StatusStrip() {
  const [signals, feed] = await Promise.all([getRepoSignals(), loadResearchFeed()]);
  const latest = feed[0];

  const items = [
    signals.commitsThisWeek === null ? "" : `${signals.commitsThisWeek} commits this week`,
    `${signals.repos} repos tracked`,
    latest ? `latest note ${latest.date}` : "",
    "kvwarden v0.1.6 on pypi",
  ].filter(Boolean);

  return (
    <div className="border-b border-[var(--hair)] px-[var(--space-page-x)] py-3">
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-2">
        <span className="text-success">
          <span aria-hidden="true">●</span> live
        </span>
        {items.map((item) => (
          <span key={item}>
            <span aria-hidden="true" className="mr-4 text-ink-2/60">
              ·
            </span>
            {item}
          </span>
        ))}
      </p>
    </div>
  );
}
