/* One worked example per taxonomy entry: six primitives and two combinators.
 *
 * These are real figures, not lorem. Each is authored at the grade its content
 * actually supports, which is the point: the catalog page is also a proof that
 * the honesty rule survives contact with content. They double as the fixtures
 * the unit tests compute expectations against.
 *
 * The one measured figure carries the canonical bench and nothing else:
 * 53.9 ms solo / 61.5 ms post-warmup (n=311) / 1,585 ms FIFO / 26x, on
 * 1x A100, Llama-3.1-8B, vLLM 0.19.1, 300 s. */

const WIDTH = 880;

/* ---- dist, measured. The estate's canonical figure. -------------------- */

export const distExample = {
  id: "fig-ev-01",
  type: "dist",
  claim: "measured",
  title: "quiet-tenant TTFT p99",
  conditions: "1x A100 · Llama-3.1-8B · vLLM 0.19.1 · n=311 · 300 s",
  provenance: { href: "/evidence/benchmarks", label: "numbers" },
  alt:
    "Three time-to-first-token measurements for the same quiet tenant on a log axis. " +
    "Alone on the card it answers in 53.9 milliseconds. Behind the admission gate, " +
    "while a flooding tenant runs, it answers in 61.5 milliseconds. On plain FIFO, " +
    "in the same flood, it answers in 1,585 milliseconds, 26 times slower.",
  width: WIDTH,
  data: {
    axis: "log",
    unit: "ms",
    labelWidth: 210,
    items: [
      { label: "solo, no flood", value: 53.9, note: "53.9 ms" },
      { label: "gated, flood running", value: 61.5, ink: "accent", note: "61.5 ms · 1.14x solo" },
      { label: "FIFO, flood running", value: 1585, note: "1,585 ms · 26x" },
    ],
  },
};

/* ---- map, illustrative, scrubbed. --------------------------------------- */

export const mapExample = {
  id: "fig-ch03-01",
  type: "map",
  claim: "illustrative",
  title: "the four-level page walk",
  alt:
    "A 48-bit virtual address drawn as an extent, sliced into five fields. Nine bits " +
    "index each of four page tables in turn, PGD then PUD then PMD then PTE, and the " +
    "low twelve bits are the offset into the frame. Each table read depends on the " +
    "address the previous one returned, so a miss costs four dependent reads.",
  width: WIDTH,
  staticStep: 4,
  steps: [
    { caption: "CR3 holds the physical address of the top level table. Nothing has been indexed yet." },
    { caption: "Bits 47 to 39 index the PGD. That is one memory read, and its result is an address." },
    { caption: "Bits 38 to 30 index the PUD, in the table the PGD entry just named." },
    { caption: "Bits 29 to 21 index the PMD, then bits 20 to 12 index the PTE, each read waiting on the last." },
    { caption: "Bits 11 to 0 never index anything: they are the offset into the frame. Four dependent reads happened before a single byte moved." },
  ],
  data: {
    extent: [0, 48],
    barHeight: 62,
    regions: [
      { from: 0, to: 9, label: "PGD", sub: "bits 47:39", fromLabel: "47", step: [1, 4] },
      { from: 9, to: 18, label: "PUD", sub: "bits 38:30", fromLabel: "38", step: [2, 4] },
      { from: 18, to: 27, label: "PMD", sub: "bits 29:21", fromLabel: "29", step: [3, 4] },
      { from: 27, to: 36, label: "PTE", sub: "bits 20:12", fromLabel: "20", step: [3, 4] },
      { from: 36, to: 48, label: "OFFSET", sub: "bits 11:0", fromLabel: "11", toLabel: "0", step: 4 },
    ],
    marks: [{ at: 0, label: "CR3", step: [0, 4] }],
    dims: [{ from: 0, to: 36, label: "four dependent reads before the byte", ink: "accent", step: 4 }],
  },
};

/* ---- flow, schematic. --------------------------------------------------- */

export const flowExample = {
  id: "fig-ev-02",
  type: "flow",
  claim: "schematic",
  title: "where a model sits in the work",
  alt:
    "Three stations in a row: gather, shape, decide. A dash-dot boundary stands between " +
    "shape and decide. A model does the gathering and the shaping, on the upstream side " +
    "of the boundary. The decision happens downstream of it, where a person signs.",
  width: WIDTH,
  data: {
    stations: [
      { id: "gather", label: "GATHER", lines: ["read the room", "collect the artefacts"] },
      { id: "shape", label: "SHAPE", lines: ["draft the options", "name the tradeoffs"] },
      { id: "decide", label: "DECIDE", lines: ["a person signs it", "and owns the outcome"] },
    ],
    edges: [
      { from: "gather", to: "shape", label: "raw" },
      { from: "shape", to: "decide", label: "shaped" },
    ],
    boundary: { after: "shape", label: "a model works upstream of this line" },
  },
};

/* ---- timeline, illustrative. -------------------------------------------- */

export const timelineExample = {
  id: "fig-ch09-01",
  type: "timeline",
  claim: "illustrative",
  title: "EEVDF lag and the eligible set",
  alt:
    "Three tasks across twelve milliseconds. Task A runs first and builds positive lag. " +
    "Task B waits, and at three milliseconds its lag makes it eligible, so it takes the " +
    "processor until its deadline at seven milliseconds. Task C arrives late and runs " +
    "last. The waits are drawn as outlines, the runs as filled blocks.",
  width: WIDTH,
  data: {
    span: [0, 12],
    unit: "ms",
    labelWidth: 150,
    lanes: [
      {
        label: "task A · lag +2",
        blocks: [
          { from: 0, to: 3, kind: "run", label: "run" },
          { from: 3, to: 7, kind: "wait" },
          { from: 7, to: 9, kind: "run", label: "run" },
        ],
      },
      {
        label: "task B · lag -1",
        blocks: [
          { from: 0, to: 3, kind: "wait" },
          { from: 3, to: 7, kind: "run", label: "run, until its deadline", ink: "accent" },
          { from: 7, to: 12, kind: "wait" },
        ],
      },
      {
        label: "task C · arrives at 9",
        blocks: [{ from: 9, to: 12, kind: "run", label: "run" }],
      },
    ],
    marks: [
      { at: 3, label: "B becomes eligible" },
      { at: 7, label: "B hits its deadline" },
    ],
  },
};

/* ---- states, schematic. ------------------------------------------------- */

export const statesExample = {
  id: "fig-ch08-01",
  type: "states",
  claim: "schematic",
  title: "task lifecycle, with the zombie",
  alt:
    "Five task states. A running task blocks and wakes between running and sleeping. " +
    "It exits into zombie, where it stays until its parent calls wait and it is reaped. " +
    "If the parent exits first, PID 1 adopts it. The one move that does not exist is " +
    "drawn dashed and crossed: a zombie cannot be woken.",
  width: WIDTH,
  data: {
    nodes: [
      { id: "running", label: "RUNNING", col: 0, row: 0, sub: "on a processor" },
      { id: "zombie", label: "ZOMBIE", col: 1, row: 0, sub: "exited, not reaped", fill: true },
      { id: "reaped", label: "REAPED", col: 2, row: 0, sub: "task_struct freed" },
      { id: "sleeping", label: "SLEEPING", col: 0, row: 1, sub: "on a wait queue" },
      { id: "reparented", label: "REPARENTED", col: 1, row: 1, sub: "PID 1 adopts it" },
    ],
    edges: [
      { from: "running", to: "sleeping", label: "blocks / wakes" },
      { from: "running", to: "zombie", label: "exit()" },
      { from: "zombie", to: "reaped", label: "parent wait()" },
      { from: "zombie", to: "reparented", label: "parent exits first" },
      { from: "zombie", to: "sleeping", kind: "illegal", label: "a zombie cannot be woken" },
    ],
  },
};

/* ---- stack, schematic. -------------------------------------------------- */

export const stackExample = {
  id: "fig-mc-04",
  type: "stack",
  claim: "schematic",
  title: "where a capability attaches",
  alt:
    "Six layers, agent at the top and hardware at the bottom, with a privilege boundary " +
    "under the agent. The capability work attaches at three of them: the syscall table, " +
    "the credential and discretionary access check, and the LSM hooks. The LSM layer is " +
    "marked as the one under discussion.",
  width: WIDTH,
  data: {
    bands: [
      { label: "AGENT", sub: "asks for a capability it was granted", right: "userspace" },
      { label: "SYSCALL TABLE", sub: "agent_spawn 472, agent_attest 473", right: "insertion point 1" },
      { label: "CRED / DAC", sub: "uid, gid, the classic capability set", right: "insertion point 2" },
      { label: "LSM HOOKS", sub: "security_coconut_*, one hook per operation", right: "insertion point 3" },
      { label: "AUDIT", sub: "one record per capability operation" },
      { label: "HARDWARE", sub: "rings and exception levels" },
    ],
    boundary: { after: 0, label: "privilege boundary" },
    here: 3,
  },
};

/* ---- ab, over timeline, illustrative. ----------------------------------- */

export const abExample = {
  id: "fig-ch02-01",
  type: "ab",
  of: "timeline",
  claim: "illustrative",
  title: "short top half against long top half",
  alt:
    "Two ten millisecond timelines on one scale. In the first, the interrupt handler " +
    "acknowledges in one millisecond and defers the work to a softirq, so the waiting " +
    "task starts at one millisecond. In the second, the handler does the work in hard " +
    "interrupt context for six milliseconds, and the waiting task pays every one of them.",
  width: WIDTH,
  delta: "the waiting task pays 6 ms instead of 1 ms",
  a: {
    title: "SHORT TOP HALF",
    data: {
      span: [0, 10],
      unit: "ms",
      labelWidth: 150,
      lanes: [
        { label: "hard IRQ", blocks: [{ from: 0, to: 1, kind: "run", label: "ack" }] },
        { label: "softirq", blocks: [{ from: 1, to: 4, kind: "run", label: "the actual work" }] },
        {
          label: "waiting task",
          blocks: [
            { from: 0, to: 1, kind: "wait" },
            { from: 1, to: 10, kind: "run", label: "runs" },
          ],
        },
      ],
    },
  },
  b: {
    title: "LONG TOP HALF",
    data: {
      span: [0, 10],
      unit: "ms",
      labelWidth: 150,
      lanes: [
        {
          label: "hard IRQ",
          blocks: [{ from: 0, to: 6, kind: "run", label: "the actual work, in hard IRQ" }],
        },
        { label: "softirq", blocks: [] },
        {
          label: "waiting task",
          blocks: [
            { from: 0, to: 6, kind: "wait" },
            { from: 6, to: 10, kind: "run", label: "runs" },
          ],
        },
      ],
    },
  },
};

/* ---- scrub, over dist, illustrative. ------------------------------------ */

export const scrubExample = {
  id: "fig-mc-05",
  type: "dist",
  claim: "illustrative",
  title: "autocorrelation against the Poisson assumption",
  alt:
    "Divergence from a Poisson reference as the autocorrelation of a synthetic arrival " +
    "process rises from phi zero to phi 0.92. Each step adds one more phi. A gate line " +
    "is drawn at 0.25 nats; the third value crosses it, and everything above it describes " +
    "traffic that a Poisson queue model sizes wrongly.",
  width: WIDTH,
  staticStep: 5,
  steps: [
    { caption: "At phi 0.00 the arrivals are memoryless. This is the Poisson reference itself, and it diverges from itself by nothing." },
    { caption: "phi 0.20 gives each arrival a little memory of the last one. Bursts begin to clump." },
    { caption: "At phi 0.45 the gate is drawn at 0.25 nats. Everything under the line still passes as random." },
    { caption: "phi 0.68 crosses the gate. The trace can no longer be described as Poisson without losing something that matters." },
    { caption: "At phi 0.85 a queue sized from Poisson assumptions is sizing itself against the wrong distribution entirely." },
    { caption: "phi 0.92 is roughly what a real request stream looks like. The Poisson assumption was never the conservative choice." },
  ],
  data: {
    axis: "linear",
    unit: "nats",
    labelWidth: 190,
    valueWidth: 130,
    items: [
      { label: "phi 0.00 · Poisson", value: 0.01, step: [0, 5] },
      { label: "phi 0.20", value: 0.04, step: [1, 5] },
      { label: "phi 0.45", value: 0.12, step: [2, 5] },
      { label: "phi 0.68", value: 0.29, step: [3, 5] },
      { label: "phi 0.85", value: 0.61, step: [4, 5] },
      { label: "phi 0.92", value: 0.88, ink: "accent", step: 5 },
    ],
    lines: [{ at: 0.25, label: "KL gate", step: [2, 5] }],
  },
};

/** The catalog, in taxonomy order: six primitives, then the two combinators. */
export const CATALOG = [
  { entry: "map", spec: mapExample },
  { entry: "flow", spec: flowExample },
  { entry: "timeline", spec: timelineExample },
  { entry: "dist", spec: distExample },
  { entry: "states", spec: statesExample },
  { entry: "stack", spec: stackExample },
  { entry: "ab", spec: abExample },
  { entry: "scrub", spec: scrubExample },
];

export const EXAMPLES = {
  map: mapExample,
  flow: flowExample,
  timeline: timelineExample,
  dist: distExample,
  states: statesExample,
  stack: stackExample,
  ab: abExample,
  scrub: scrubExample,
};
