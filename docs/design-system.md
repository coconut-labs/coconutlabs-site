# Coconut Labs Design System — LOCKED v1.1

Locked 2026-08-11, amended 2026-08-19 (v1.1: the figure ground narrowed, and
the figure ink set, taxonomy, honesty rule and interaction grammar added; see
section 7). This catalog is the single source of truth for every Coconut Labs
surface: coconutlabs.org, masterclass, shreypatel, coconutos.org.
Changes require a version bump here and a note in the commit that bumps it.
`scripts/design-lint.mjs` enforces the mechanical rules; the visual suite
(`tests/visual/`) enforces the rendered result.

## 1. Tokens (authoritative source: styles/tokens.css)

| Token | Light | Dark | Role |
|---|---|---|---|
| --bg-0 | #F7F7F5 | #0C0C0E | page ground |
| --bg-1 | #FFFFFF | #141417 | card / panel |
| --bg-2 | #F0F0EA | #101013 | recessed band, code, footer |
| --bg-3 | #EDEDEA | #17171B | deepest recess |
| --ink-0 | #0B0B0C | #F2F2F0 | primary text, solid buttons |
| --ink-1 | #4A4A55 | #A8A8B2 | body text |
| --ink-2 | #6A6A78 | #82828E | metadata, labels, axis text |
| --rule | rgba(17,17,17,.12) | rgba(255,255,255,.16) | borders, dividers |
| --hair | rgba(17,17,17,.06) | rgba(255,255,255,.07) | in-card dividers |
| --accent | #2440CC | #7D93FF | links, measured series, wordmark second half |
| --success | #4a7355 | #7fb894 | live/passing status only |
| --danger | #8f3d2f | #e0836f | failing/baseline-FIFO only |
| --rad | 2px | 2px | every radius except genuine circles |
| --measure | 68ch | 68ch | reading column |
| --space-page-x | clamp(20px,4vw,64px) | same | page gutter |

Both ink-2 values are contrast-corrected (light 4.96:1 on bg-0, dark 4.84:1
on bg-1 floor). Do not lighten either. There is no accent-2 or accent-3.

## 2. Type

- Faces: Geist (display + body), Geist Mono (labels, numbers, code). Nothing else.
- Headings: weight 600, letter-spacing -0.03em, line-height 1.02-1.10.
- H1 page scale: clamp(30px,4vw,46px). Hero H1 may reach clamp(32px,5vw,54px).
- Section h2: clamp(1.6rem,3vw,2.4rem). Card h3: 16-19px weight 600.
- Body: 16.5px / 1.65 in --ink-1 (post prose) or --ink-0 (short UI copy).
- Labels: mono 10.5-11px uppercase, tracking 0.1-0.16em, --ink-2.
- Large numbers: 24-34px weight 600, tracking -0.03em; unit suffix 12-14px --ink-2.

## 3. Spacing and shape

- Grid gaps and paddings on Tailwind steps; page gutter via --space-page-x.
- Cards: bg-1, 1px --rule border, --rad, padding 20-24px.
- Stat rails: cells separated by 1px --rule via gap-px on a --rule background.
- No shadows except --shadow-soft/--shadow-paper on elevated cards.
- No gradients, no glassmorphism, no text shadows, no animated backgrounds
  (sole exception: the §5 DotField ground system).

## 4. Iconography and glyphs

No icon libraries. The full set: ● live/status dot, ○ open slot, ✓ pass,
✕ fail (always beside a text label, never color-only), → forward link,
← back link, ↗ external link, · separator, § only in legal/spec contexts.

## 5. Motion

- UI transitions under 200ms, opacity/transform only.
- prefers-reduced-motion collapses all motion (global clamp in tokens.css).
- Brand-motion exceptions (KernelSilk, kernel-tail, DotField): pause
  offscreen and on hidden tabs, render a static frame under reduced motion,
  opacity/transform-class motion only (canvas alpha/radius/displacement
  counts). DotField is the one sanctioned background system: the dot
  fabric runs as the site-wide ground (fixed viewport canvas, world-space
  grid that scrolls with the page) with route-keyed variants chosen in
  FieldGround: home = full fabric (wave, gravity, ripples), benchmarks =
  metronome tick on the accent subset, cadence = downward ledger wave,
  drawings = fine graph paper, research posts = faintest reading room,
  all other routes = quiet default. Same physics, same reduced-motion
  static frame, only coefficients differ. Alphas kept low so text
  contrast never moves. No background outside this system may animate.

## 6. Voice (enforced in copy review, linted where mechanical)

- No em dashes in prose. Comma, colon, period, or parentheses.
- No AI cadence: delve, moreover, tapestry, leverage-as-verb, unlock,
  paradigm, "at scale" as decoration, "not just X but Y".
- Numbers always travel with their regime (hardware, n, version, duration).
- The word "blog" never describes our writing. syn1 is only ever "syn1".

## 7. Component idioms

- Status strip: mono 10.5px row under the header, ● leading, · separated.
- Plot card: caption row (series left, conditions right), bars, hairline-topped
  provenance footnote linking /benchmarks.
- Honesty panel: danger-bordered card titled "what this does not show".
- Reproduce bar: mono command + copy button that swaps to "✓ copied" for 1.4s.
- Dark plate: #0C0C0E contained figure ground for **working drawings and brand
  marks** in both themes, with a mono caption bottom-left. v1.1 narrowed this
  from "diagrams" to "working drawings": the plate pins its inks (see
  `components/drawings/inks.ts`) so a drawing looks identical in light and
  dark, which is right for a construction document and wrong for a teaching
  figure sitting inside a reading column. The three drawings at `/drawings`
  stay on the plate; they are a separate genre.
- Inline teaching figures ride the theme. Their ink set is seven names defined
  once in `styles/figure-tokens.css`, all aliases of tokens above, no new
  colors: `--fig-ink` (--ink-0), `--fig-dim` (--ink-2), `--fig-rule` (--rule),
  `--fig-accent` (--accent), `--fig-well` (--bg-2), `--fig-pass` (--success),
  `--fig-fail` (--danger). One accent per figure: the accent marks the single
  quantity the figure exists to show, and if a figure needs a second accent it
  needs to be two figures. `--fig-pass` and `--fig-fail` mark tick and cross
  rows only, never a series.
- Figure taxonomy: six primitives (`map`, `flow`, `timeline`, `dist`,
  `states`, `stack`) and two combinators (`ab`, `scrub`). One renderer,
  `lib/figures/`, shared by the React components and the vanilla string
  emitter so a figure is identical on the Next app, a standalone HTML page,
  and the book build.
- Figure honesty: every figure carries a `claim` of `measured`, `reported`,
  `illustrative`, or `schematic`. The renderer refuses to build without it.
  `measured` additionally requires `conditions` and `provenance`; `reported`
  requires `source`. Caption row 1 is `fig-<surface>-<nn> · <what it shows>`
  left and the grade slot right; row 2 is the provenance line, measured only.
  A figure may assert exactly what the prose beside it may assert.
- Figure interaction: one control, a native `<input type="range">` step rail.
  No play button, no hover tooltips, no click targets inside the SVG. Stepping
  is visibility, not computation: every step's geometry ships in one SVG and
  the runtime moves one attribute. Without JS a figure renders at its
  `staticStep` with no rail; under `prefers-reduced-motion` the 140 ms
  cross-fade goes to 0 ms and the rail still works.
- DemoShell: scenario line, preset buttons, run affordance, aria-live outcome
  banner in plain words.
- Details/summary accordions for progressive disclosure; first open on
  desktop, all closed on mobile.

## 8. Enforcement

- `npm run lint:design` (scripts/design-lint.mjs): fails the gate on a figure
  spec with no `claim`, a `measured` spec with no `conditions` or
  `provenance`, a spec naming a color literal, more than one accent in one
  figure, and a rendered radius other than 2px. It also fails on raw hex
  outside tokens.css/plate exceptions, em dashes in prose strings,
  icon-library imports, border-radius literals, retired-palette values,
  font-family
  literals outside the token file.
- `npm run test:visual` (tests/visual/visual.spec.ts): pixel-deterministic
  screenshots of every stable route at 1440x900 and 375x812, light and dark,
  maxDiffPixels 0 AND per-pixel threshold 0 against committed baselines
  (threshold 0 matters: pixelmatch's default 0.2 ignores low-contrast
  changes and once passed a whole dark-theme background swap). Motion
  disabled via reduced motion; fonts awaited; deviceScaleFactor 1.
- Baseline update is a deliberate act: `npm run test:visual -- --update-snapshots`
  plus a commit message explaining what changed visually and why.
