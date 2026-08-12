#!/usr/bin/env node
/**
 * cadence-digest — the nightly engine's writer. ZERO AI, pure template.
 *
 * Queries the coconut-labs org's public repos for the last 24 h of
 * activity (commits, releases) plus this repo's content changes, and
 * renders content/cadence/YYYY-MM-DD.md. No activity -> exits 0 with no
 * file, so quiet days produce no empty posts.
 *
 * Runs in CI on a nightly cron; also runs locally. GITHUB_TOKEN is
 * optional (public repos), raises rate limits when present.
 */
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

const ORG = "coconut-labs";
const REPOS = ["kvwarden", "coconutlabs-site", "coconut-os-lp",
  "data-regression-guardrail", "point-in-time-correctness-guardrail",
  "silent-cache-miss-guardrail", "columnar-scan-bytes-guardrail",
  "ingestion-data-contract-guardrail"];

const now = new Date();
const since = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
const day = now.toISOString().slice(0, 10);
const outPath = `content/cadence/${day}.md`;

if (existsSync(outPath)) {
  console.log(`cadence: ${outPath} already exists, nothing to do`);
  process.exit(0);
}

const headers = { "user-agent": "steady-cadence-digest" };
if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

async function gh(path) {
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) return null;
  return res.json();
}

const sections = [];
let totalCommits = 0;

for (const repo of REPOS) {
  const commits = await gh(`/repos/${ORG}/${repo}/commits?since=${since}&per_page=30`);
  if (!Array.isArray(commits) || commits.length === 0) continue;
  // Skip pure cadence commits so the digest never reports itself.
  const lines = commits
    .map((c) => c.commit.message.split("\n")[0])
    .filter((m) => !m.startsWith("cadence:"));
  if (lines.length === 0) continue;
  totalCommits += lines.length;
  sections.push(`### ${repo}\n\n${lines.map((l) => `- ${l}`).join("\n")}`);
}

// Releases in the window (kvwarden and friends)
const relLines = [];
for (const repo of ["kvwarden", "coconut-os-lp"]) {
  const rels = await gh(`/repos/${ORG}/${repo}/releases?per_page=5`);
  if (!Array.isArray(rels)) continue;
  for (const r of rels) {
    if (new Date(r.published_at ?? 0) >= new Date(since)) {
      relLines.push(`- ${repo} ${r.tag_name}: ${r.name ?? ""}`.trim());
    }
  }
}
if (relLines.length) sections.unshift(`### Releases\n\n${relLines.join("\n")}`);

if (sections.length === 0) {
  console.log("cadence: quiet day, no digest");
  process.exit(0);
}

const body = `---
title: "Cadence · ${day}"
date: "${day}"
---

${totalCommits} commit${totalCommits === 1 ? "" : "s"} across the lab in the last day.

${sections.join("\n\n")}

*Written by the nightly engine from the public record. No hands involved.*
`;

mkdirSync("content/cadence", { recursive: true });
writeFileSync(outPath, body);
console.log(`cadence: wrote ${outPath} (${totalCommits} commits, ${sections.length} sections)`);
try {
  console.log(execSync(`wc -l ${outPath}`).toString().trim());
} catch {}
