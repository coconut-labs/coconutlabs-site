#!/usr/bin/env node
/**
 * refresh-signals — zero-AI nightly refresh of content/signals.json.
 *
 * The status strip used to fetch the GitHub API at build time, which made
 * rendered pixels depend on which build won the rate-limit lottery (CI got
 * the fallback, other builds got live numbers, the pixel gate chased both).
 * It also hardcoded "14 commits this week" as a fallback that never said
 * it was one. Signals are now a committed snapshot: this script fetches
 * real numbers, writes the file, and the nightly cadence workflow commits
 * it. Builds are deterministic; the site updates nightly; every number is
 * real or absent.
 */
import { writeFileSync, readFileSync } from "node:fs";

const ORG = "coconut-labs";
const REPOS = ["kvwarden", "coconutlabs-site", "coconut-os-lp", "atlas-pipeline",
  "data-regression-guardrail", "point-in-time-correctness-guardrail",
  "silent-cache-miss-guardrail", "columnar-scan-bytes-guardrail",
  "ingestion-data-contract-guardrail"];

const headers = { "user-agent": "coconutlabs-signals" };
if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

async function gh(path) {
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) return null;
  return res.json();
}

const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
let commitsThisWeek = 0;
let commitsKnown = true;
for (const repo of REPOS) {
  const commits = await gh(`/repos/${ORG}/${repo}/commits?since=${since}&per_page=100`);
  if (Array.isArray(commits)) commitsThisWeek += commits.length;
  else if (commits === null) commitsKnown = false;
}

const orgRepos = await gh(`/orgs/${ORG}/repos?per_page=100`);
if (!Array.isArray(orgRepos)) {
  console.error("signals: org listing failed, keeping the committed snapshot unchanged");
  process.exit(0);
}
const newest = orgRepos.map((r) => r.pushed_at).filter(Boolean).sort().at(-1);

const signals = {
  updatedLabel: newest ? `updated ${newest.slice(0, 10)}` : "updated recently",
  commitsThisWeek: commitsKnown ? commitsThisWeek : null,
  openIssues: orgRepos.reduce((s, r) => s + (r.open_issues_count ?? 0), 0),
  repos: orgRepos.length,
  asOf: new Date().toISOString().slice(0, 10),
};

const path = "content/signals.json";
let previous = null;
try { previous = readFileSync(path, "utf8"); } catch {}
const next = JSON.stringify(signals, null, 2) + "\n";
if (previous === next) {
  console.log("signals: unchanged");
} else {
  writeFileSync(path, next);
  console.log(`signals: wrote ${path}: ${JSON.stringify(signals)}`);
}
