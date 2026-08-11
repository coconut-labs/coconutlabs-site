# coconutlabs.org — working rules

This file is loaded automatically by any agent working in this repo. It is
the operating contract. Deviations are defects.

## Design system is LOCKED (v1.0)

`docs/design-system.md` is the catalog; `styles/tokens.css` is the token
source. Do not add colors, faces, radii, shadows, or icon libraries. The
mechanical gate is `npm run lint:design` and it FAILS THE BUILD. If your
change needs a new token, stop and surface it; do not improvise one.

Non-negotiables you will be linted or reviewed against:
- Geist + Geist Mono only. One accent. 2px radius (--rad). Glyphs, not icons.
- No em dashes in prose. No AI cadence (delve/moreover/leverage-as-verb/
  unlock/paradigm/"not just X but Y"). Plain short sentences.
- Every number travels with its regime (hardware, n, version, duration).
- Canonical figures: 53.9 ms solo / 61.5 ms post-warmup (n=311) / 1,585 ms
  FIFO / 1.14x / 26x on 1x A100, Llama-3.1-8B, vLLM 0.19.1, 300 s. 26x is
  the cited multiple, not 29x. The synth is only ever "syn1".

## Gates (CI runs these; you will encounter them)

`npm run test:all` = typecheck + lint:design + unit + build + e2e (3
browsers). `npm run test:visual` = pixel-deterministic screenshots at
maxDiffPixels 0 against committed baselines (chromium project "visual").
If a visual test fails and the change is INTENDED, update baselines with
`--update-snapshots` and say in the commit what changed visually and why.
If you did not intend a pixel change, you broke something: fix it.

## Git discipline

- Commit as-is; identity is preconfigured. NEVER add co-author lines.
- Stage by explicit path (`git add <files>`), never `git add -A` — this repo
  hosts agent worktrees under .claude/ and blanket adds have swept them
  into commits before.
- Do not push unless your instructions explicitly say to push.
- Stay inside your assigned file territory. If a fix you need lives outside
  it, report it; do not edit it.

## Content honesty

Nothing ships that overclaims: no dates the project cannot defend, no
"measured" without an artifact, no team sizes that are not true today.
Progressive disclosure over deletion: long content moves into
<details>/<summary>, it does not get cut.
