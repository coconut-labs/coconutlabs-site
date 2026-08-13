# Atlas real runs + unit environments — design

2026-08-13. Approved direction: demos become witnessed operations on real
$0 infrastructure; the atlas becomes a control room over a genuinely
running pipeline plus the territory map of the gallery. All remaining
pockets decided by the operator's delegation ("decide for me").

## The claim everything argues

"The classic MLOps loop survives LLM agents — and here it is running."
The atlas page's job is to make a visitor witness that claim in under a
minute: real runs, real verdicts, real rollbacks, real artifacts, $0
standing cost.

## Part A — the pipeline (new public repo: coconut-labs/atlas-pipeline)

The name is descriptive infrastructure naming (like the guardrail repos),
not a brand; no naming audit required beyond a GitHub availability check.

### The agent

- llama.cpp (pinned release) running Qwen2.5-0.5B-Instruct GGUF (Apache
  2.0), CPU, on ubuntu-latest GitHub Actions runners. Real inference, free
  on a public repo.
- An "agent version" = prompt template + sampling config + model ref,
  content-hashed. Versions live in `registry/versions/<hash>.json`.

### The task suite

- 20 deterministic cases in `suite/cases/*.json`: structured extraction
  (8), tool-call formatting (8), arithmetic-with-tool (4). Each case has a
  mechanical grader (exact match or JSON-schema validity) — ZERO AI in
  scoring, per INFERENCE-ECONOMICS doctrine.

### The loop (one nightly workflow, ~03:40 UTC; also workflow_dispatch)

1. REGISTER — build tonight's candidate version (see drift schedule),
   write registry entry.
2. GATE — run the suite; produce `runs/<date>/gate.json`: pass rate, p50/
   p95 latency, tokens per task, cost axis (tokens priced at a stated
   reference rate; real dollars are $0 and the page says both numbers).
   Thresholds in `policy.json` (pass rate >= 0.70, p95 <= stated budget,
   tokens/task <= budget).
3. CANARY — candidate vs incumbent on a 6-case slice; compare the four
   axes; `runs/<date>/canary.json`.
4. PROMOTE or ROLLBACK — flip `registry/serving.json` only if gate AND
   canary hold; otherwise record a rollback with the failing axis named.
   Either way write `runs/<date>/decision.json` and one full reasoning
   trace `runs/<date>/trace.json` (the fifth artifact type, rendered on
   the atlas).
5. Commit everything. The git history IS the ops record.

### The drift schedule (honesty mechanism)

Deterministic by date (day-of-month % 3 == 2): the candidate is a
deliberately degraded variant (prompt truncated to 60%, or temperature
1.4). Those nights the gate/canary SHOULD fail and the record shows a real
rollback. Failures are scheduled, disclosed on the page, and still real:
the loop catches them mechanically.

### Verification gates for phase A (facts to prove before building on them)

- llama.cpp + 0.5B GGUF completes 20 cases inside Actions limits (probe
  workflow first; budget < 20 min).
- Model download cached via actions/cache (HF URL pinned by revision).
- If the probe fails limits, fallback model is SmolLM2-360M-Instruct GGUF;
  if that fails, shrink suite to 12 cases. Never fake a run.

## Part B — atlas page: control room + territory

### Data path (deterministic by construction)

- The LP repo carries `content/atlas/status.json`: a snapshot of the
  latest N=14 runs' summaries + the current serving version + one full
  trace. Committed, so builds and the pixel gate are deterministic.
- The existing nightly-cadence workflow gains a zero-AI step: fetch the
  pipeline repo's latest artifacts (raw.githubusercontent, public), rewrite
  status.json, commit. Production updates nightly through the same cron
  that already commits digests. No live fetches at request time.

### Page rebuild

- Hero: the claim + "witnessed" line: last run date, verdict, serving
  version hash, runs recorded, rollbacks recorded. All from status.json.
- Glance table: run facts replace plan-speak. Drop "Target tier" rows.
- The map: every station carries one of three honest states:
  RUNNING (pipeline station: latest verdict + timestamp + log link),
  HELD (a gallery unit holds this ground: link to the unit demo),
  NOT BUILT (plain statement).
  Stations of the existing 14-stop map are mapped to these states in the
  spec table below; the tour is kept and re-scripted to walk the RUNNING
  spine first, then the HELD outposts.
- The trace panel: one reasoning trace rendered end to end (request →
  agent turns → tool calls → grader verdict → gate → decision), mono,
  collapsible per hop. This is "what we are trying to say", shown.
- Station-to-state mapping: register/gate/canary/promote/rollback/
  monitor(4-axis)/trace = RUNNING (pipeline). data-quality, point-in-time,
  caching, storage-bytes, ingestion-contract, admission = HELD (their
  units). remaining stops = NOT BUILT until they aren't.

## Part C — unit environments (all six gallery units)

Each unit page gains an ENVIRONMENT section, four panes, same order
everywhere:

1. THE CODE — the unit's actual engine source rendered in-page at build
   time from the repo tree, with a tiny deterministic tokenizer (comments/
   strings/keywords in existing tokens; no highlighting library, design
   lock intact) and a line-anchored link to GitHub.
2. THE ARCHITECTURE — a working-drawing-style figure per unit (the
   /drawings dark-plate pattern): boxes, dimensions, failure codes.
3. THE OPERATION — the existing sandbox + LiveLog, relabeled: "this runs
   the real engine in your browser, computed now".
4. THE RECORD — a real Actions run of the engine on its full dataset in
   its own repo (workflow committed per guardrail repo; artifacts
   committed), summarized with timestamp + verdicts + the exact command to
   reproduce. LP reads committed summaries through the same cadence-cron
   snapshot pattern (`content/atlas/unit-records.json`).

One named example use case opens each unit ("Monday 09:14, the feed lands
and every check is green. It is wrong anyway."), replacing abstract
scenario lines where they exist.

risk-hotpath's RECORD uses its existing native bench harness output
(Criterion) run in Actions; its CODE pane shows risk-gate/src/engine.rs
excerpts plus the wasm boundary.

## Sequencing

- Phase A: pipeline repo scaffold + probe + first real runs (blocking
  everything else).
- Phase B: atlas rebuild on committed snapshots.
- Phase C: unit environments (parallelizable per unit under the agent
  audit protocol; disjoint territories).
- Phase D: cadence-cron extension + gates (baselines regen once at C's
  end, linux refresh, verify-live).

## Testing

- Pipeline: graders unit-tested; the probe workflow is the existence
  proof; a dry-run mode executes the whole loop on 3 cases for CI.
- LP: functional tier asserts atlas states from a fixture status.json
  (RUNNING/HELD/NOT BUILT rendering, trace panel); visual/e2e as always;
  snapshot ingestion is a pure function with unit tests; empty states
  honest ("no run recorded yet") and tested.

## Out of scope

- Any paid infra, any AI in the nightly path, any per-project domain, any
  claim without a committed artifact behind it. LDM unit stays blocked on
  evidence. Subdomain surfaces untouched this cycle.
