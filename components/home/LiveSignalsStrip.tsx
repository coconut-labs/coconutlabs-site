import { getRepoSignals } from "@/lib/github";
import { loadResearchFeed } from "@/lib/content";

const KVWARDEN_BANNER = "kvwarden gate 2 · 1.14× solo · 26× better than fifo";

function relativeDate(date: string): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const days = Math.max(0, Math.round(diffMs / 86_400_000));
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.round(days / 7);
  return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
}

export async function LiveSignalsStrip() {
  const [signals, feed] = await Promise.all([getRepoSignals(), loadResearchFeed()]);
  const latest = feed[0];
  const latestNote = latest ? `latest note · ${latest.date} (${relativeDate(latest.date)})` : "";

  // Order matters: lead with credibility-heaviest signals.
  const items = [
    latestNote,
    signals.commitsThisWeek === null ? "commits: refresh pending" : `${signals.commitsThisWeek} commits this week`,
    KVWARDEN_BANNER,
    `${signals.repos} repos tracked`,
    `${signals.openIssues} rfc open`,
    signals.updatedLabel,
  ].filter(Boolean);

  return (
    <section className="px-[var(--space-page-x)] pb-12">
      <div className="content-inner flex flex-wrap gap-x-5 gap-y-2 border-t border-rule pt-5 font-mono text-[0.72rem] uppercase text-ink-2">
        {items.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </section>
  );
}
