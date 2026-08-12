/* The real risk-gate crate, loaded as wasm. No wasm-bindgen: the crate
   exports a flat scalar C ABI (rg_init / rg_swap_config / rg_evaluate /
   rg_bench), so raw WebAssembly.instantiate is the whole loader. The same
   3.3KB artifact is committed to the source repo; this copy is served from
   /demos/risk_gate_wasm.wasm.

   Everything here is deterministic: the scenario streams come from a seeded
   LCG (same multiplier family the repo generator uses), so the same preset
   always produces the same orders, decisions, and counts — in the browser,
   in the functional tests, and in Node. Wall-clock timings are the only
   nondeterministic outputs and are labeled as measured-just-now. */

export const DECISIONS = [
  "Accept",
  "RejectMaxQuantity",
  "RejectMaxNotional",
  "RejectPriceCollar",
  "RejectCreditLimit",
  "RejectDuplicate",
  "RejectZeroQuantity",
  "RejectInvalidPrice",
  "RejectInvalidConfig",
] as const;

export type DecisionName = (typeof DECISIONS)[number];

export type GateExports = {
  rg_init: (
    maxQty: bigint,
    maxNotional: number,
    creditLimit: number,
    collarLower: number,
    collarUpper: number,
    dupWindowNs: bigint,
  ) => void;
  rg_swap_config: (
    maxQty: bigint,
    maxNotional: number,
    creditLimit: number,
    collarLower: number,
    collarUpper: number,
    dupWindowNs: bigint,
  ) => number;
  rg_evaluate: (
    orderId: bigint,
    symbolId: number,
    traderId: number,
    price: number,
    quantity: bigint,
    side: number,
    refPrice: number,
    nowNs: bigint,
  ) => number;
  rg_bench: (n: bigint, seed: bigint) => bigint;
};

export async function loadGate(source: ArrayBuffer | Uint8Array): Promise<GateExports> {
  // The BufferSource overload returns { module, instance }; TS narrows the
  // union to the Module overload without the cast.
  const result = (await WebAssembly.instantiate(
    source as BufferSource,
    {},
  )) as WebAssembly.WebAssemblyInstantiatedSource;
  return result.instance.exports as unknown as GateExports;
}

/** Default config: the repo's RiskConfig::default values. */
export const DEFAULT_CONFIG = {
  maxQty: 10_000n,
  maxNotional: 5_000_000,
  creditLimit: 1_000_000_000,
  collarLower: 0.95,
  collarUpper: 1.05,
  dupWindowNs: 1_000_000n,
};

export function initDefault(gate: GateExports) {
  const c = DEFAULT_CONFIG;
  gate.rg_init(c.maxQty, c.maxNotional, c.creditLimit, c.collarLower, c.collarUpper, c.dupWindowNs);
}

/* ---- deterministic order streams ---------------------------------- */

export type StreamOrder = {
  orderId: bigint;
  symbolId: number;
  traderId: number;
  price: number;
  quantity: bigint;
  side: number;
  refPrice: number;
  nowNs: bigint;
};

function lcg(seed: bigint) {
  let s = seed === 0n ? 0x9e3779b97f4a7c15n : seed;
  return () => {
    s = (s * 6364136223846793005n + 1442695040888963407n) & 0xffffffffffffffffn;
    return s;
  };
}

export type ScenarioId =
  | "clean"
  | "fat-finger"
  | "collar"
  | "duplicate"
  | "credit"
  | "hot-swap";

export type Scenario = {
  id: ScenarioId;
  label: string;
  seat: string;
  danger: boolean;
};

export const SCENARIOS: Scenario[] = [
  { id: "clean", label: "Clean session", seat: "A normal morning: orders inside every limit.", danger: false },
  { id: "fat-finger", label: "Fat-finger order", seat: "A trader keys 50,000 where they meant 500.", danger: true },
  { id: "collar", label: "Price collar breach", seat: "Orders priced 20% through the reference price.", danger: true },
  { id: "duplicate", label: "Replayed orders", seat: "A gateway hiccups and resends orders it already sent.", danger: true },
  { id: "credit", label: "Credit limit burn", seat: "One trader keeps buying size until their credit line runs out.", danger: true },
  { id: "hot-swap", label: "Config hot-swap", seat: "Risk desk tightens the size cap mid-stream, no restart.", danger: false },
];

export const STREAM_LEN = 600;

/** Generate the deterministic stream for a scenario. Same seed → same orders. */
export function scenarioStream(id: ScenarioId): StreamOrder[] {
  const next = lcg(
    { clean: 11n, "fat-finger": 22n, collar: 33n, duplicate: 44n, credit: 55n, "hot-swap": 66n }[id],
  );
  const orders: StreamOrder[] = [];
  for (let i = 0; i < STREAM_LEN; i++) {
    const r = next();
    let refPrice = 100 + Number((r >> 32n) % 100n);
    let price = refPrice * (0.98 + Number((r >> 8n) % 5n) * 0.01);
    let quantity = 1n + ((r >> 16n) % 900n);
    let traderId = Number((r >> 7n) % 50n);
    let symbolId = Number(r % 120n);
    let side = Number(r % 2n);

    if (id === "fat-finger" && i % 40 === 7) quantity = 50_000n;
    if (id === "collar" && i % 25 === 3) price = refPrice * (r % 2n === 0n ? 1.2 : 0.7);
    if (id === "credit") {
      // One trader, always buying, near the size cap, on expensive symbols:
      // the per-order checks all pass while cumulative exposure climbs to the
      // 1B default credit line. Unique quantities keep dedup out of the story.
      traderId = 7;
      side = 0;
      refPrice = 190 + Number(r % 10n);
      price = refPrice;
      quantity = 9_000n + BigInt(i);
    }

    const order: StreamOrder = {
      orderId: BigInt(i) + 1n,
      symbolId,
      traderId,
      price,
      quantity,
      side,
      refPrice,
      nowNs: BigInt(i) * 1_000n,
    };

    // The dedup key is the order's economic content (trader, symbol, side,
    // price, qty), not its id: a gateway replay means the same order again
    // under a fresh id, which is exactly what the gate is built to catch.
    if (id === "duplicate" && i % 30 === 9 && i > 0) {
      const prev = orders[i - 1]!;
      order.symbolId = prev.symbolId;
      order.traderId = prev.traderId;
      order.price = prev.price;
      order.quantity = prev.quantity;
      order.side = prev.side;
      order.refPrice = prev.refPrice;
    }

    orders.push(order);
  }
  return orders;
}

export type RunResult = {
  total: number;
  accepted: number;
  rejected: number;
  byRule: Partial<Record<DecisionName, number>>;
  elapsedMs: number;
};

/** Run a scenario through the real gate. Resets the gate first so runs are
    independent and order-independent. The hot-swap scenario tightens
    max_quantity to 500 at the halfway mark via rg_swap_config. */
export function runScenario(gate: GateExports, id: ScenarioId): RunResult {
  initDefault(gate);
  const orders = scenarioStream(id);
  const byRule: Partial<Record<DecisionName, number>> = {};
  let accepted = 0;
  const t0 = performance.now();
  for (let i = 0; i < orders.length; i++) {
    if (id === "hot-swap" && i === STREAM_LEN / 2) {
      gate.rg_swap_config(
        500n,
        DEFAULT_CONFIG.maxNotional,
        DEFAULT_CONFIG.creditLimit,
        DEFAULT_CONFIG.collarLower,
        DEFAULT_CONFIG.collarUpper,
        DEFAULT_CONFIG.dupWindowNs,
      );
    }
    const o = orders[i]!;
    const d = gate.rg_evaluate(
      o.orderId,
      o.symbolId,
      o.traderId,
      o.price,
      o.quantity,
      o.side,
      o.refPrice,
      o.nowNs,
    );
    const name = DECISIONS[d] ?? "RejectInvalidConfig";
    if (name === "Accept") accepted += 1;
    else byRule[name] = (byRule[name] ?? 0) + 1;
  }
  const elapsedMs = performance.now() - t0;
  return {
    total: orders.length,
    accepted,
    rejected: orders.length - accepted,
    byRule,
    elapsedMs,
  };
}
