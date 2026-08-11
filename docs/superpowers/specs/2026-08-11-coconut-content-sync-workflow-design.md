# coconut-content-sync — cross-property content pipeline

2026-08-11. A named Claude Code workflow that takes one content brief and lands it
across every public Coconut Labs property at once, gated, all-or-nothing.

## Problem

Content now lives in three repos on two forges:

| Property        | Repo                                  | Forge  | Deploy               |
|-----------------|---------------------------------------|--------|----------------------|
| coconutlabs.org | coconut-labs/ccocnutlabs-LP           | GitHub | Vercel, main -> prod |
| coconutos.org   | coconut-labs/coconut-os-lp            | GitHub | CF Pages, main->prod |
| Spec + README   | coconutlabs/coconutos                 | GitLab | none (repo only)     |

The GitHub copy of the spec repo is frozen: its push URL is the literal string
`DO_NOT_PUSH_USE_GITLAB`. GitLab access is git-over-SSH via the `~/.ssh/config`
host alias `gitlab.com-coconutlabs` (key `id_ed25519_gitlab_coconutlabs`); the
glab API token is scope-limited, so the pipeline uses git only, never the API.

An announcement touched by hand drifts: one site updates, the other lags, the
spec README says something else. The pipeline makes the three move together.

## Shape

Invocation: `Workflow({name: "coconut-content-sync", args: {brief, mode, stamp, scope?}})`

- `brief` — what to say, in plain words. Required.
- `stamp` — unique run id (e.g. `2026-08-11-1430`), becomes the work dir name.
  Required because workflow scripts cannot mint timestamps.
- `mode` — `plan` (scout only, no edits), `apply` (edits + gates, no push,
  default), `ship` (apply + push + deploy verification). Shipping to two
  production sites is always an explicit opt-in.
- `scope` — optional subset of `["labs","os-lp","spec"]`; default all three.

Pipeline (per-repo lanes run independently; barriers only where a stage needs
every lane's output):

1. **Scout** (per repo) — fresh shallow clone into
   `~/.cache/coconut-content-sync/<stamp>/<repo>`, verify `origin` matches the
   pinned URL exactly, map the brief to concrete files/sections. `plan` stops here.
2. **Draft** (per repo) — apply the edits: site content plus README/docs in the
   same repo, matching that repo's voice and commit conventions. Returns a
   marker phrase now present in the rendered content, for deploy verification.
3. **Review** (barrier) — one agent reads all three diffs together: factual
   consistency across properties (same claims, same numbers) plus the red
   lines below. One fix round, one re-review; still failing -> abort.
4. **Gate** (per repo) — labs: `npm run test:all` (typecheck, unit, build,
   e2e). os-lp: `bun install && bun run lint && bun run build` (npm fallback).
   spec: review-only, no mechanical gate.
5. **Ship** (barrier, `ship` mode only) — every gate green or nothing pushes.
   One agent pushes all three back-to-back: labs and os-lp to GitHub `main`,
   spec to GitLab `origin main`. Fresh-clone fast-forward pushes; a rejected
   push (upstream moved mid-run) is reported, never forced.
6. **Verify** — poll coconutlabs.org and coconutos.org for their markers
   (Vercel and Cloudflare Pages pick up the push; cap ~8 min), `ls-remote`
   confirms the spec HEAD advanced. Honest per-property status in the final
   report. A push that lands with no marker after 8 min is reported as
   not-live (e.g. the Pages git integration is disconnected), never assumed.

Every run returns `{mode, plans, diffs (paths + stats), review, gates, pushes,
deploy}` whether it succeeds or aborts.

## Red lines (enforced by the Review stage)

- No pricing anywhere public (struck from Coconut OS canon 2026-05-25).
- No dates/metrics in the labs `result` frontmatter (renders huge in ProjectHero).
- No internal doc citations (`docs/05-LLD §9`-style) on either site.
- No design-partner/beta solicitation.
- No founder names; `info@` is the only inbox.
- No em-dashes in coconutlabs.org copy (site-wide retirement, `bee9902`).
- Never a host redirect between coconutlabs.org and coconutos.org pre-GA.
- No AI attribution in commits, anywhere.

## Non-goals

- No GitLab API usage (token under-scoped; git push is the whole integration).
- No CI-resident automation: the pipeline runs from a Claude Code session on
  this machine, which is where the SSH keys live.
- No partial ships. If one property cannot go, none go.
- Never edits the dev clones under `~/Personal Projects/` — fresh clones only.

## Rejected approaches

- **CI-native cross-repo triggers** (Actions + GitLab CI): heavy secret
  wiring across two forges, and the actual work — rewriting copy under brand
  red lines — needs editorial judgment a pipeline YAML doesn't have.
- **Shell script templating**: same reason; sed does not write house voice.

## Location

`.claude/workflows/coconut-content-sync.js` — in the Conductor base repo dir
and workspaces (`.claude/` is deliberately untracked in the repo, so the
script is machine-local tooling, same as the rest of `.claude/`). This spec is
the committed record of the design.
