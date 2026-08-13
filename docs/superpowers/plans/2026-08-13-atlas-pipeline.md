# Atlas Pipeline (Phase A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A public repo (coconut-labs/atlas-pipeline) where a real tiny-LLM agent moves through the classic MLOps loop (register → gate → canary → promote/rollback) nightly on GitHub Actions, committing every artifact, at $0 standing cost.

**Architecture:** Plain Node 22 scripts (zero npm dependencies) orchestrate llama.cpp CPU inference over a 20-case deterministic task suite. Mechanical graders only. One nightly workflow runs the loop and commits `runs/<date>/` artifacts plus registry state; a probe workflow proves Actions feasibility before anything builds on it. Deterministic drift variants make some nights fail on purpose so the record contains real rollbacks.

**Tech Stack:** Node 22 built-ins only (node:test, node:crypto, node:fs, node:child_process). llama.cpp pinned release binary. Qwen2.5-0.5B-Instruct GGUF (Apache 2.0). GitHub Actions (public repo, free).

## Global Constraints

- ZERO npm dependencies; Node built-ins only. ZERO AI anywhere except the llama.cpp inference under test (graders, orchestration, scoring are mechanical).
- Never fake a run: every number in an artifact comes from a real execution; unparseable values are recorded as `null`, never invented.
- All artifacts are committed JSON matching the schemas in Task 2 verbatim — the LP repo (Plan B) consumes these shapes as its contract.
- Commit identity: Shrey Patel <patelshrey77@gmail.com>; SSH remote `git@github.com:coconut-labs/atlas-pipeline.git`; NEVER any co-author line.
- Voice in README/comments: plain short sentences, no em dashes, no AI cadence. Numbers travel with their regime.
- Model: Qwen2.5-0.5B-Instruct-GGUF `qwen2.5-0.5b-instruct-q4_k_m.gguf`, pinned by revision URL. Fallback if the probe exceeds 20 min: SmolLM2-360M-Instruct Q4_K_M; second fallback: shrink suite to 12 cases. Never fake.
- llama.cpp pinned release tag `b4589` (ubuntu x64 prebuilt zip `llama-b4589-bin-ubuntu-x64.zip` from github.com/ggml-org/llama.cpp/releases). If that asset name 404s, pick the newest release's ubuntu x64 asset and pin THAT tag in `policy.json.llamacpp_tag`, recording the substitution in the commit message.

---

### Task 1: Repo scaffold + policy

**Files:**
- Create: `README.md`, `policy.json`, `.gitignore`, `package.json` (marker only, `"type": "module"`, no deps)

**Interfaces:**
- Produces: `policy.json` consumed by every later script:

```json
{
  "llamacpp_tag": "b4589",
  "model": {
    "name": "qwen2.5-0.5b-instruct-q4_k_m",
    "url": "https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf",
    "license": "Apache-2.0"
  },
  "thresholds": {
    "min_pass_rate": 0.7,
    "max_p95_ms": 30000,
    "max_tokens_per_task": 400
  },
  "reference_price_per_mtok": 0.15,
  "canary_case_ids": ["ex-01", "ex-05", "tc-01", "tc-05", "ar-01", "ar-03"]
}
```

- [ ] **Step 1: Confirm repo does not exist, then create it**

Run: `gh repo view coconut-labs/atlas-pipeline 2>&1 | head -1` — expect "Could not resolve". THE CONTROLLER (not a subagent) creates the repo per the operator's standing rule about `gh repo create`; the implementer starts from a cloned empty repo at `/Users/shrey/Personal Projects/atlas-pipeline` with the SSH remote already set. If the directory does not exist, STOP and report NEEDS_CONTEXT.

- [ ] **Step 2: Write the four files**

`README.md` (exactly this content to start; later tasks append):

```markdown
# atlas-pipeline

The classic MLOps loop, run for real against an LLM agent, every night,
for $0. Register, gate, canary, promote or roll back. Every artifact of
every run is committed here. Some nights are scheduled to fail: the drift
schedule degrades the candidate on purpose and the record shows the loop
catching it.

The agent is Qwen2.5-0.5B-Instruct on llama.cpp, CPU, inside GitHub
Actions. Small on purpose: the claim under test is the loop, not the
model. Scoring is mechanical (exact match and schema validity). No AI
grades AI here.

Rendered live at coconutlabs.org/projects/agentic-mlops.
```

`.gitignore`:

```
models/
bin/
node_modules/
.DS_Store
```

`package.json`:

```json
{ "name": "atlas-pipeline", "private": true, "type": "module" }
```

`policy.json`: the exact JSON from Interfaces above.

- [ ] **Step 3: Commit**

```bash
git add README.md policy.json .gitignore package.json
git commit -m "scaffold: policy, readme, ignore rules"
```

### Task 2: Artifact schemas + validator + tests

**Files:**
- Create: `lib/schemas.mjs`, `test/schemas.test.mjs`

**Interfaces:**
- Produces (consumed by Tasks 4-9 and by Plan B verbatim):
  - `validate(kind, obj) -> string[]` (empty array = valid). Kinds: `"version" | "gate" | "canary" | "decision" | "serving" | "trace"`.
  - Schema shapes (field: type; all required unless `|null` noted):

```
version:  { hash: string, created: string(ISO), model: string,
            prompt_template: string, temp: number, max_tokens: number,
            variant: string }
gate:     { date: string, version: string, cases: number,
            passed: number, pass_rate: number, p50_ms: number,
            p95_ms: number, tokens_per_task: number|null,
            est_cost_usd: number|null, actual_cost_usd: 0,
            verdict: "pass"|"fail", failing_axis: string|null }
canary:   { date: string, candidate: string, incumbent: string,
            cases: number, axes: { quality: {cand:number,inc:number},
            p95_ms: {cand:number,inc:number},
            errors: {cand:number,inc:number},
            tokens: {cand:number|null,inc:number|null} },
            verdict: "pass"|"fail", failing_axis: string|null }
decision: { date: string, candidate: string, incumbent: string,
            gate: "pass"|"fail", canary: "pass"|"fail",
            action: "promote"|"rollback", reason: string }
serving:  { version: string, since: string(ISO), history:
            [{version:string, from:string, action:string}] }
trace:    { date: string, version: string, case_id: string,
            prompt: string, raw_output: string, parsed: object|null,
            grader: { kind: string, pass: boolean, expected: object },
            timing_ms: number, tokens: number|null }
```

- [ ] **Step 1: Write the failing test** (`test/schemas.test.mjs`)

```js
import test from "node:test";
import assert from "node:assert/strict";
import { validate } from "../lib/schemas.mjs";

test("valid gate object passes", () => {
  const gate = {
    date: "2026-08-13", version: "abc123", cases: 20, passed: 17,
    pass_rate: 0.85, p50_ms: 900, p95_ms: 4100, tokens_per_task: 210,
    est_cost_usd: 0.0006, actual_cost_usd: 0, verdict: "pass",
    failing_axis: null,
  };
  assert.deepEqual(validate("gate", gate), []);
});

test("gate with missing field and wrong enum fails with named errors", () => {
  const errs = validate("gate", { date: "2026-08-13", verdict: "maybe" });
  assert.ok(errs.some((e) => e.includes("version")));
  assert.ok(errs.some((e) => e.includes("verdict")));
});

test("unknown kind throws", () => {
  assert.throws(() => validate("nope", {}));
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test test/schemas.test.mjs` — expect: fails (module not found).

- [ ] **Step 3: Implement `lib/schemas.mjs`**

A table-driven validator. Field spec syntax: `"string" | "number" | "object" | "number|null" | "string|null" | "object|null" | ["pass","fail"] | ["promote","rollback"] | "array"`.

```js
const SCHEMAS = {
  version: { hash: "string", created: "string", model: "string",
    prompt_template: "string", temp: "number", max_tokens: "number",
    variant: "string" },
  gate: { date: "string", version: "string", cases: "number",
    passed: "number", pass_rate: "number", p50_ms: "number",
    p95_ms: "number", tokens_per_task: "number|null",
    est_cost_usd: "number|null", actual_cost_usd: "number",
    verdict: ["pass", "fail"], failing_axis: "string|null" },
  canary: { date: "string", candidate: "string", incumbent: "string",
    cases: "number", axes: "object", verdict: ["pass", "fail"],
    failing_axis: "string|null" },
  decision: { date: "string", candidate: "string", incumbent: "string",
    gate: ["pass", "fail"], canary: ["pass", "fail"],
    action: ["promote", "rollback"], reason: "string" },
  serving: { version: "string", since: "string", history: "array" },
  trace: { date: "string", version: "string", case_id: "string",
    prompt: "string", raw_output: "string", parsed: "object|null",
    grader: "object", timing_ms: "number", tokens: "number|null" },
};

export function validate(kind, obj) {
  const schema = SCHEMAS[kind];
  if (!schema) throw new Error(`unknown schema kind: ${kind}`);
  const errors = [];
  for (const [field, spec] of Object.entries(schema)) {
    const v = obj?.[field];
    if (Array.isArray(spec)) {
      if (!spec.includes(v)) errors.push(`${field}: expected one of ${spec.join("|")}, got ${JSON.stringify(v)}`);
      continue;
    }
    const kinds = spec.split("|");
    const ok = kinds.some((k) =>
      k === "null" ? v === null :
      k === "array" ? Array.isArray(v) :
      k === "object" ? (typeof v === "object" && v !== null && !Array.isArray(v)) :
      typeof v === k);
    if (!ok) errors.push(`${field}: expected ${spec}, got ${typeof v}`);
  }
  return errors;
}
```

- [ ] **Step 4: Run tests, expect PASS**, then commit:

```bash
git add lib/schemas.mjs test/schemas.test.mjs
git commit -m "schemas: table-driven artifact validator with tests"
```

### Task 3: Task suite (20 cases) + graders + tests

**Files:**
- Create: `suite/cases.json`, `lib/graders.mjs`, `test/graders.test.mjs`

**Interfaces:**
- Produces: `gradeCase(caseObj, rawOutput) -> { kind, pass, expected, parsed }` consumed by Tasks 4, 6, 7.
- Case format (all 20 live in one `suite/cases.json` array):

```json
{ "id": "ex-01", "kind": "extract",
  "input": "Invoice 4471 from Meridian Supply, due 2026-09-01, total $1,284.50",
  "instruction": "Extract as JSON with keys invoice_no (string), vendor (string), due (YYYY-MM-DD), total_usd (number).",
  "expect": { "invoice_no": "4471", "vendor": "Meridian Supply", "due": "2026-09-01", "total_usd": 1284.5 } }
```

- [ ] **Step 1: Write `suite/cases.json` with exactly these 20 cases**

8 `extract` cases (`ex-01`..`ex-08`): invoices, meeting notes, shipping confirmations, error logs, each with `expect` = exact JSON object. 8 `toolcall` cases (`tc-01`..`tc-08`): instruction says respond ONLY with `{"tool": name, "args": {...}}`; `expect` = the exact tool-call object (tools: `get_weather{city}`, `search_flights{from,to,date}`, `create_ticket{title,priority}`, `convert{amount,from,to}`). 4 `arith` cases (`ar-01`..`ar-04`): word problems whose instruction demands `{"tool":"calculator","args":{"expression":"..."},"answer":<number>}`; grader checks `answer` numerically (tolerance 1e-6) and that `expression` is a non-empty string. Author every case with realistic short inputs and unambiguous expected objects; keep each input under 300 chars. (The implementer authors all 20 concretely following the three shown patterns; ambiguity in any case is a task failure, not the model's problem.)

Include this case verbatim as `tc-01` so canary slices are stable across implementers:

```json
{ "id": "tc-01", "kind": "toolcall",
  "input": "What is the weather in Pune right now?",
  "instruction": "Respond ONLY with a JSON tool call: {\"tool\": ..., \"args\": {...}}. Available: get_weather(city).",
  "expect": { "tool": "get_weather", "args": { "city": "Pune" } } }
```

- [ ] **Step 2: Write failing grader tests** (`test/graders.test.mjs`)

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gradeCase } from "../lib/graders.mjs";

const cases = JSON.parse(readFileSync("suite/cases.json", "utf8"));

test("suite has exactly 20 cases with unique ids and valid kinds", () => {
  assert.equal(cases.length, 20);
  assert.equal(new Set(cases.map((c) => c.id)).size, 20);
  for (const c of cases) assert.ok(["extract", "toolcall", "arith"].includes(c.kind));
});

test("extract: exact object match passes, wrong value fails", () => {
  const c = cases.find((x) => x.id === "ex-01");
  const good = gradeCase(c, "```json\n" + JSON.stringify(c.expect) + "\n```");
  assert.equal(good.pass, true);
  const bad = gradeCase(c, JSON.stringify({ ...c.expect, total_usd: 1 }));
  assert.equal(bad.pass, false);
});

test("toolcall: tc-01 exact call passes; wrong tool fails", () => {
  const c = cases.find((x) => x.id === "tc-01");
  assert.equal(gradeCase(c, '{"tool":"get_weather","args":{"city":"Pune"}}').pass, true);
  assert.equal(gradeCase(c, '{"tool":"search_flights","args":{}}').pass, false);
});

test("arith: numeric tolerance on answer, expression must be non-empty", () => {
  const c = cases.find((x) => x.id === "ar-01");
  const out = JSON.stringify({ tool: "calculator", args: { expression: "2*3" }, answer: c.expect.answer + 1e-9 });
  assert.equal(gradeCase(c, out).pass, true);
});

test("garbage output fails cleanly with parsed null", () => {
  const c = cases[0];
  const r = gradeCase(c, "I cannot help with that.");
  assert.equal(r.pass, false);
  assert.equal(r.parsed, null);
});
```

- [ ] **Step 3: Run, expect failure.** `node --test test/graders.test.mjs`

- [ ] **Step 4: Implement `lib/graders.mjs`**

```js
// Mechanical graders. No AI grades AI here: extraction and tool calls are
// exact-object matches after tolerant JSON recovery; arithmetic checks the
// numeric answer within 1e-6. Tolerant recovery means: strip code fences,
// take the first {...} block, parse or fail to null.
function recoverJson(raw) {
  const stripped = raw.replace(/```(?:json)?/g, "");
  const start = stripped.indexOf("{");
  if (start === -1) return null;
  // Walk to the matching close brace of the first object.
  let depth = 0;
  for (let i = start; i < stripped.length; i++) {
    if (stripped[i] === "{") depth++;
    if (stripped[i] === "}") depth--;
    if (depth === 0) {
      try { return JSON.parse(stripped.slice(start, i + 1)); } catch { return null; }
    }
  }
  return null;
}

function deepEqual(a, b) {
  if (typeof a === "number" && typeof b === "number") return Math.abs(a - b) < 1e-6;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null || typeof a !== "object") return a === b;
  const ka = Object.keys(a).sort(); const kb = Object.keys(b).sort();
  if (ka.length !== kb.length || ka.some((k, i) => k !== kb[i])) return false;
  return ka.every((k) => deepEqual(a[k], b[k]));
}

export function gradeCase(caseObj, rawOutput) {
  const parsed = recoverJson(rawOutput);
  let pass = false;
  if (parsed !== null) {
    if (caseObj.kind === "extract" || caseObj.kind === "toolcall") {
      pass = deepEqual(parsed, caseObj.expect);
    } else if (caseObj.kind === "arith") {
      pass = typeof parsed.answer === "number" &&
        Math.abs(parsed.answer - caseObj.expect.answer) < 1e-6 &&
        typeof parsed?.args?.expression === "string" &&
        parsed.args.expression.length > 0 &&
        parsed.tool === "calculator";
    }
  }
  return { kind: caseObj.kind, pass, expected: caseObj.expect, parsed };
}
```

- [ ] **Step 5: Run tests to PASS, commit**

```bash
git add suite/cases.json lib/graders.mjs test/graders.test.mjs
git commit -m "suite: 20 mechanical cases and graders (no AI grades AI)"
```

### Task 4: Agent runner over llama.cpp

**Files:**
- Create: `lib/run-agent.mjs`, `scripts/fetch-deps.mjs`, `test/run-agent.test.mjs`

**Interfaces:**
- Consumes: `gradeCase` (Task 3), `policy.json` (Task 1).
- Produces (consumed by Tasks 6-8):
  - `runSuite(version, caseList, paths) -> { results: TraceLike[], p50_ms, p95_ms, tokens_per_task }` where each `TraceLike` matches the `trace` schema minus `date`/`version` (added by callers).
  - `scripts/fetch-deps.mjs`: downloads llama.cpp release binary to `bin/` and the GGUF to `models/` (both gitignored), idempotent, prints resolved paths.

- [ ] **Step 1: Write `scripts/fetch-deps.mjs`**

```js
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";

const policy = JSON.parse(readFileSync("policy.json", "utf8"));
mkdirSync("bin", { recursive: true });
mkdirSync("models", { recursive: true });

const zip = `llama-${policy.llamacpp_tag}-bin-ubuntu-x64.zip`;
const url = `https://github.com/ggml-org/llama.cpp/releases/download/${policy.llamacpp_tag}/${zip}`;
if (!existsSync("bin/llama-cli")) {
  execSync(`curl -fL --retry 3 -o /tmp/llama.zip ${url}`, { stdio: "inherit" });
  execSync(`unzip -o /tmp/llama.zip -d /tmp/llama && find /tmp/llama -name llama-cli -exec cp {} bin/ \\; && find /tmp/llama -name '*.so' -exec cp {} bin/ \\; && chmod +x bin/llama-cli`, { stdio: "inherit", shell: "/bin/bash" });
}
const model = `models/${policy.model.name}.gguf`;
if (!existsSync(model)) {
  execSync(`curl -fL --retry 3 -o ${model} ${policy.model.url}`, { stdio: "inherit" });
}
console.log(JSON.stringify({ cli: "bin/llama-cli", model }));
```

On macOS (local dev) the ubuntu binary will not run; the script still fetches the model, and `runSuite` is only exercised for real in Actions or via a locally built llama-cli. Tests below never invoke the binary.

- [ ] **Step 2: Write failing tests for the pure parts** (`test/run-agent.test.mjs`)

```js
import test from "node:test";
import assert from "node:assert/strict";
import { buildPrompt, parseTokens, percentile } from "../lib/run-agent.mjs";

test("buildPrompt substitutes case fields into the version template", () => {
  const v = { prompt_template: "SYS: answer as JSON.\nTASK: {{instruction}}\nINPUT: {{input}}" };
  const c = { instruction: "Do X.", input: "Y" };
  const p = buildPrompt(v, c);
  assert.ok(p.includes("Do X.") && p.includes("INPUT: Y"));
  assert.ok(!p.includes("{{"));
});

test("parseTokens reads llama.cpp eval line, null on absence", () => {
  const stderr = "llama_perf_context_print:        eval time =    1234.56 ms /    87 runs";
  assert.equal(parseTokens(stderr), 87);
  assert.equal(parseTokens("nothing here"), null);
});

test("percentile is exact on small arrays", () => {
  assert.equal(percentile([10, 20, 30, 40], 50), 25);
  assert.equal(percentile([10], 95), 10);
});
```

- [ ] **Step 3: Run, expect failure; implement `lib/run-agent.mjs`**

```js
import { execFileSync } from "node:child_process";

export function buildPrompt(version, caseObj) {
  return version.prompt_template
    .replaceAll("{{instruction}}", caseObj.instruction)
    .replaceAll("{{input}}", caseObj.input);
}

export function parseTokens(stderr) {
  const m = stderr.match(/eval time\s*=\s*[\d.]+\s*ms\s*\/\s*(\d+)\s*runs/);
  return m ? Number(m[1]) : null;
}

export function percentile(sorted, p) {
  const a = [...sorted].sort((x, y) => x - y);
  if (a.length === 1) return a[0];
  const idx = (p / 100) * (a.length - 1);
  const lo = Math.floor(idx), hi = Math.ceil(idx);
  return a[lo] + (a[hi] - a[lo]) * (idx - lo);
}

import { gradeCase } from "./graders.mjs";

export function runSuite(version, caseList, paths) {
  const results = [];
  for (const c of caseList) {
    const prompt = buildPrompt(version, c);
    const t0 = Date.now();
    let raw = "", stderrText = "";
    try {
      raw = execFileSync(paths.cli, [
        "-m", paths.model, "-p", prompt, "-n", String(version.max_tokens),
        "--temp", String(version.temp), "--no-display-prompt", "-no-cnv",
      ], { encoding: "utf8", timeout: 120000, stdio: ["ignore", "pipe", "pipe"] });
    } catch (err) {
      raw = err.stdout?.toString() ?? "";
      stderrText = err.stderr?.toString() ?? "";
    }
    const timing_ms = Date.now() - t0;
    const grade = gradeCase(c, raw);
    results.push({
      case_id: c.id, prompt, raw_output: raw, parsed: grade.parsed,
      grader: { kind: grade.kind, pass: grade.pass, expected: grade.expected },
      timing_ms, tokens: parseTokens(stderrText),
    });
  }
  const times = results.map((r) => r.timing_ms);
  const toks = results.map((r) => r.tokens).filter((t) => t !== null);
  return {
    results,
    p50_ms: percentile(times, 50),
    p95_ms: percentile(times, 95),
    tokens_per_task: toks.length ? toks.reduce((a, b) => a + b, 0) / toks.length : null,
  };
}
```

Note: capture stderr for token parsing on the success path too — wrap the call so stderr is always captured (execFileSync with `stdio` pipe array returns stdout; stderr on success must be captured via a temp-file redirect: `["-m", ...]` invoked through `bash -c "bin/llama-cli ... 2>stderr.tmp"`). The implementer resolves this mechanically; the contract is: `tokens` is parsed from llama.cpp's stderr or `null`, never invented.

- [ ] **Step 4: Tests PASS, commit**

```bash
git add lib/run-agent.mjs scripts/fetch-deps.mjs test/run-agent.test.mjs
git commit -m "runner: llama.cpp harness with parsed timings, tokens honest-or-null"
```

### Task 5: Versions, registry, drift schedule

**Files:**
- Create: `lib/versions.mjs`, `test/versions.test.mjs`

**Interfaces:**
- Produces (consumed by Tasks 6-8):
  - `baseVersion(policy) -> version` (variant "base", temp 0.2, max_tokens 256, the canonical prompt template below).
  - `candidateFor(dateStr, policy) -> version`: day-of-month % 3 === 2 → degraded variant (`variant: "drift-truncate"`: template truncated to 60% of its characters) else if day % 7 === 5 → (`variant: "drift-hot"`, temp 1.4) else a benign paraphrase variant (`variant: "candidate"`, same semantics, one wording change).
  - `versionHash(version) -> string` (sha256 of canonical JSON, first 12 hex).
  - Canonical prompt template:

```
You are a precise data assistant. Respond with ONLY the JSON asked for,
no prose, no code fences.
TASK: {{instruction}}
INPUT: {{input}}
JSON:
```

- [ ] **Step 1: Failing tests** (`test/versions.test.mjs`)

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { baseVersion, candidateFor, versionHash } from "../lib/versions.mjs";
import { validate } from "../lib/schemas.mjs";

const policy = JSON.parse(readFileSync("policy.json", "utf8"));

test("baseVersion validates against the version schema", () => {
  const v = baseVersion(policy);
  assert.deepEqual(validate("version", v), []);
  assert.equal(v.variant, "base");
});

test("drift schedule is deterministic by date", () => {
  assert.equal(candidateFor("2026-08-02", policy).variant, "drift-truncate"); // 2 % 3 === 2
  assert.equal(candidateFor("2026-08-05", policy).variant, "drift-hot");      // 5 % 3 !== 2, 5 % 7 === 5
  assert.equal(candidateFor("2026-08-01", policy).variant, "candidate");
});

test("hash is stable and 12 hex chars", () => {
  const v = baseVersion(policy);
  assert.equal(versionHash(v), versionHash({ ...v }));
  assert.match(versionHash(v), /^[0-9a-f]{12}$/);
});
```

- [ ] **Step 2: Run to fail; implement `lib/versions.mjs`** (createHash("sha256") over `JSON.stringify` with sorted keys; hash excludes `hash` and `created` fields; `created` = new Date().toISOString() at build; truncation = `template.slice(0, Math.floor(template.length * 0.6))`).

- [ ] **Step 3: Tests PASS, commit** (`git add lib/versions.mjs test/versions.test.mjs`, message: `versions: canonical template, deterministic drift schedule, stable hashes`)

### Task 6: Gate script

**Files:**
- Create: `scripts/gate.mjs`, `lib/gate.mjs`, `test/gate.test.mjs`

**Interfaces:**
- Consumes: `runSuite` output shape (Task 4), thresholds from `policy.json`.
- Produces: `gateFrom(suiteRun, version, date, policy) -> gate` (pure, tested); `scripts/gate.mjs` = CLI that fetch-deps, loads cases, runs the real suite for the candidate version file given as argv[2], writes `runs/<date>/gate.json` + one `trace.json` (the first failing case's trace, else the first case's), both schema-validated before write. `est_cost_usd` = tokens_per_task * cases * reference_price_per_mtok / 1e6, or null when tokens are null. `failing_axis` names the first violated threshold ("pass_rate" | "p95_ms" | "tokens_per_task") or null.

- [ ] **Step 1: Failing tests for the pure part** (`test/gate.test.mjs`): feed a fabricated suiteRun (allowed in tests: it tests gate MATH, no run is claimed) with pass_rate 0.65 → verdict "fail", failing_axis "pass_rate"; with all clear → "pass", null axis; tokens null → est_cost_usd null and tokens axis not evaluated.

```js
import test from "node:test";
import assert from "node:assert/strict";
import { gateFrom } from "../lib/gate.mjs";
const policy = { thresholds: { min_pass_rate: 0.7, max_p95_ms: 30000, max_tokens_per_task: 400 }, reference_price_per_mtok: 0.15 };
const mkRun = (passed, p95, tokens) => ({
  results: Array.from({ length: 20 }, (_, i) => ({ grader: { pass: i < passed } })),
  p50_ms: 800, p95_ms: p95, tokens_per_task: tokens,
});
test("low pass rate fails on pass_rate axis", () => {
  const g = gateFrom(mkRun(13, 1000, 200), { hash: "abc" }, "2026-08-13", policy);
  assert.equal(g.verdict, "fail");
  assert.equal(g.failing_axis, "pass_rate");
});
test("clean run passes with cost estimate", () => {
  const g = gateFrom(mkRun(18, 1000, 200), { hash: "abc" }, "2026-08-13", policy);
  assert.equal(g.verdict, "pass");
  assert.ok(Math.abs(g.est_cost_usd - (200 * 20 * 0.15) / 1e6) < 1e-9);
});
test("null tokens: cost null, tokens axis skipped", () => {
  const g = gateFrom(mkRun(18, 1000, null), { hash: "abc" }, "2026-08-13", policy);
  assert.equal(g.est_cost_usd, null);
  assert.equal(g.verdict, "pass");
});
```

- [ ] **Step 2: Implement `lib/gate.mjs` + `scripts/gate.mjs`, tests PASS, schema-validate output in the CLI (throw on errors), commit** (`gate: thresholds to verdicts, cost honest-or-null`)

### Task 7: Canary script

**Files:**
- Create: `scripts/canary.mjs`, `lib/canary.mjs`, `test/canary.test.mjs`

**Interfaces:**
- Consumes: `runSuite`, `policy.canary_case_ids` (6 ids), incumbent version file from `registry/serving.json` → `registry/versions/<hash>.json`.
- Produces: `canaryFrom(candRun, incRun, candHash, incHash, date) -> canary` (pure). Axes: quality = pass fraction on the slice; p95_ms; errors = count of cases with parsed null; tokens. Verdict fail if candidate quality < incumbent quality - 0.15, or candidate p95 > incumbent p95 * 2, or candidate errors > incumbent errors + 2; failing_axis names the first violated ("quality" | "p95_ms" | "errors").
- `scripts/canary.mjs`: real slice runs for both versions, writes `runs/<date>/canary.json`, schema-validated.

- [ ] **Step 1: Failing tests on the pure comparator** (three tests mirroring the three failure axes, one clean pass) — same fabricated-run pattern as Task 6.
- [ ] **Step 2: Implement, tests PASS, commit** (`canary: four axes, candidate vs incumbent on the fixed slice`)

### Task 8: Decision + registry write

**Files:**
- Create: `scripts/decide.mjs`, `lib/decide.mjs`, `test/decide.test.mjs`

**Interfaces:**
- Consumes: `runs/<date>/gate.json`, `runs/<date>/canary.json`, `registry/serving.json`.
- Produces: `decideFrom(gate, canary, serving, date) -> { decision, newServing }` (pure): action "promote" only when both verdicts are "pass" (serving flips to candidate, history appended `{version, from: date, action}`); otherwise "rollback" (serving unchanged, history appended with action "rollback"); reason is one sentence naming the failing axis, e.g. `"gate failed on pass_rate (0.55 < 0.70)"` or `"both green: candidate promoted"`.
- `scripts/decide.mjs` writes `runs/<date>/decision.json` and rewrites `registry/serving.json`, both schema-validated.
- First-run bootstrap: when `registry/serving.json` is absent, `decide.mjs --bootstrap` writes serving = base version with empty history and exits.

- [ ] **Step 1: Failing tests** — promote path, gate-fail path, canary-fail path, bootstrap path (4 tests, fabricated gate/canary objects).
- [ ] **Step 2: Implement, PASS, commit** (`decide: promote only on double green, rollbacks recorded with reasons`)

### Task 9: Loop orchestrator + dry-run mode

**Files:**
- Create: `scripts/loop.mjs`
- Modify: `README.md` (append a "Run it yourself" section with the exact commands)

**Interfaces:**
- Consumes: everything above.
- Produces: `node scripts/loop.mjs [--dry] [--date YYYY-MM-DD]`. Sequence: fetch-deps → ensure bootstrap → build candidate (`candidateFor(date)`), write `registry/versions/<hash>.json` → gate (full 20 cases; `--dry` = first 3 cases only, still REAL inference) → canary → decide → print one summary line. Exit code 0 even on rollback (a caught failure is a successful run of the loop); nonzero only on infrastructure errors.

- [ ] **Step 1: Implement the orchestrator** (thin sequencing; every artifact goes through `validate` before write; `runs/<date>/` is created; a `runs/<date>/summary.json` is written: `{ date, action, gate_verdict, canary_verdict, candidate, serving_after, dry: boolean }` — Plan B's cheapest ingestion surface; add "summary" to `lib/schemas.mjs` with that exact shape and one test).
- [ ] **Step 2: Local grader/schema suite still green:** `node --test test/` → all PASS. Commit (`loop: one command runs the whole night, dry mode is 3 real cases`)

### Task 10: Probe workflow (the feasibility gate)

**Files:**
- Create: `.github/workflows/probe.yml`

**Interfaces:**
- Produces: proof (or refutation) that Actions completes the dry loop inside limits. Everything after this task builds on its result.

- [ ] **Step 1: Write the workflow**

```yaml
name: probe
on: workflow_dispatch
jobs:
  dry-loop:
    runs-on: ubuntu-latest
    timeout-minutes: 25
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - uses: actions/cache@v4
        with:
          path: |
            models
            bin
          key: deps-${{ hashFiles('policy.json') }}
      - run: node --test test/
      - run: node scripts/loop.mjs --dry
      - run: cat runs/*/summary.json
      - uses: actions/upload-artifact@v4
        with: { name: probe-runs, path: runs/ }
```

- [ ] **Step 2: Push, dispatch, watch.** `gh workflow run probe && gh run watch <id> --exit-status`. Record wall time of the loop step in the task report. If the dry loop exceeds 15 minutes or the model stalls: apply the fallback ladder from Global Constraints (SmolLM2-360M, then 12 cases), commit the policy change with the substitution named, re-dispatch. Do not proceed to Task 11 until the probe is green.
- [ ] **Step 3: Commit** (`probe: actions feasibility gate for the dry loop`)

### Task 11: Nightly workflow + first real run

**Files:**
- Create: `.github/workflows/loop.yml`
- Modify: `README.md` (append "The record" section: what runs/ contains, the drift schedule disclosure, the reference-price sentence)

**Interfaces:**
- Produces: the standing nightly record; the artifact tree Plan B consumes.

- [ ] **Step 1: Write `loop.yml`**

```yaml
name: nightly-loop
on:
  schedule:
    - cron: "40 3 * * *"
  workflow_dispatch:
permissions:
  contents: write
concurrency: { group: loop, cancel-in-progress: false }
jobs:
  loop:
    runs-on: ubuntu-latest
    timeout-minutes: 45
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - uses: actions/cache@v4
        with:
          path: |
            models
            bin
          key: deps-${{ hashFiles('policy.json') }}
      - run: node --test test/
      - run: node scripts/loop.mjs
      - name: Commit the night's record
        run: |
          git config user.name "Shrey Patel"
          git config user.email "patelshrey77@gmail.com"
          git add runs/ registry/
          git commit -m "loop: $(date -u +%F) $(node -e 'const s=require("fs").readdirSync("runs").sort().pop();console.log(JSON.parse(require("fs").readFileSync(`runs/${s}/summary.json`)).action)')" || echo "nothing to commit"
          git push
```

- [ ] **Step 2: Dispatch the FIRST FULL RUN manually.** `gh workflow run nightly-loop`, watch to green, `git pull`, verify: `runs/<today>/{gate,canary,decision,summary,trace}.json` all present and schema-valid (`node -e` one-liner looping validate over them). Record in the task report: pass rate, p95, tokens/task, action taken.
- [ ] **Step 3: Commit README updates** (`record: first real run in the book`)

### Task 12: Memory + handoff to Plan B

**Files:**
- Modify (LP repo): none — this task only writes the handoff note in the atlas-pipeline README and reports the contract facts.

- [ ] **Step 1:** Append to README a short CONTRACT section: the artifact tree, the six schema kinds, and the sentence "coconutlabs.org ingests runs/<date>/summary.json and the latest trace via its nightly cadence workflow; schemas live in lib/schemas.mjs."
- [ ] **Step 2:** Final `node --test test/` green; commit (`contract: handoff surface for the site`); report DONE with: repo URL, first-run stats, probe wall time, any fallback substitutions.
