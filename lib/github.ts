import snapshot from "@/content/signals.json";

/* Repo signals come from content/signals.json, a committed snapshot that
   scripts/refresh-signals.mjs rewrites and the nightly cadence workflow
   commits. The old build-time GitHub fetch made rendered pixels depend on
   which build won the rate-limit lottery (CI always got the fallback,
   which also silently hardcoded "14 commits this week"). Committed data
   keeps builds deterministic, the pixel gate honest, and every number
   real: commitsThisWeek is null when the API could not be reached on
   refresh night, and callers must render that as absent, not fake it. */

export type RepoSignals = {
  updatedLabel: string;
  commitsThisWeek: number | null;
  openIssues: number;
  repos: number;
  asOf: string;
};

export async function getRepoSignals(): Promise<RepoSignals> {
  return snapshot as RepoSignals;
}
