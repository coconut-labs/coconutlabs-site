import { ACCENT, INK, INK_DIM } from "./inks";
import { Defs, NodeBox, SheetFrame, T, TitleBlock } from "./primitives";

/* DWG-01: the kvwarden admission path.
 *
 * Request -> token bucket -> admission gate -> tenant-blind vLLM engine ->
 * response, with the FIFO bypass drawn dashed as the control and the two
 * measured p99 figures as dimension lines between the same endpoints.
 * Numbers are the canonical bench: 61.5 ms post-warmup (n=311) vs 1,585 ms
 * FIFO, 26x, on 1x A100, Llama-3.1-8B, vLLM 0.19.1, 300 s. */

const W = 980;
const H = 470;
const ID = "dwg1";

export function AdmissionPath() {
  return (
    <svg
      aria-label="Working drawing of the kvwarden admission path. A request passes through a token bucket and an admission gate before reaching a tenant-blind vLLM engine. The gated path measures 61.5 milliseconds p99 for a quiet tenant; the dashed FIFO bypass measures 1,585 milliseconds, 26 times slower."
      className="block h-auto w-full"
      focusable="false"
      role="img"
      viewBox={`0 0 ${W} ${H}`}
    >
      <Defs accent={ACCENT} id={ID} />
      <SheetFrame h={H} w={W} />

      {/* entry and exit terminals */}
      <circle cx={50} cy={150} fill={INK} r={4.5} />
      <T x={50} y={132}>
        REQUEST
      </T>
      <circle cx={888} cy={150} fill={INK} r={4.5} />
      <T x={888} y={132}>
        RESPONSE
      </T>

      {/* main flow */}
      <line markerEnd={`url(#${ID}-a-ink)`} stroke={INK} strokeWidth={1.25} x1={58} x2={122} y1={150} y2={150} />
      <NodeBox
        h={90}
        lines={["refill = rate_limit_rpm / 60", "tokens per second", "burst = bucket capacity"]}
        title="TOKEN BUCKET"
        w={190}
        x={126}
        y={105}
      />
      <line markerEnd={`url(#${ID}-a-ink)`} stroke={INK} strokeWidth={1.25} x1={316} x2={372} y1={150} y2={150} />
      <NodeBox
        h={90}
        lines={["max_concurrent in flight", "queue wait ≤ 30 s", "over the wait: shed"]}
        title="ADMISSION GATE"
        w={190}
        x={376}
        y={105}
      />
      <line markerEnd={`url(#${ID}-a-ink)`} stroke={INK} strokeWidth={1.25} x1={566} x2={622} y1={150} y2={150} />
      <NodeBox
        h={90}
        lines={["vLLM 0.19.1", "continuous batching", "no tenant identity"]}
        title="VLLM ENGINE"
        w={180}
        x={626}
        y={105}
      />
      <line markerEnd={`url(#${ID}-a-ink)`} stroke={INK} strokeWidth={1.25} x1={806} x2={872} y1={150} y2={150} />

      {/* the tenant-blind boundary */}
      <line
        stroke={INK_DIM}
        strokeDasharray="9 4 2 4"
        strokeWidth={1}
        x1={610}
        x2={610}
        y1={60}
        y2={280}
      />
      <T anchor="start" fill={INK_DIM} x={618} y={72}>
        tenant-blind past this line
      </T>

      {/* FIFO bypass: the control, dashed */}
      <path
        d="M 50 158 V 250 H 716 V 202"
        fill="none"
        markerEnd={`url(#${ID}-a-dim)`}
        stroke={INK_DIM}
        strokeDasharray="6 4"
        strokeWidth={1.25}
      />
      <T fill={INK_DIM} x={383} y={242}>
        FIFO baseline · no bucket, no gate
      </T>

      {/* dimension lines: measured, between the same endpoints */}
      <line stroke={INK_DIM} strokeWidth={0.75} x1={50} x2={50} y1={258} y2={352} />
      <line stroke={INK_DIM} strokeWidth={0.75} x1={888} x2={888} y1={158} y2={352} />
      <line
        markerEnd={`url(#${ID}-a-accent)`}
        markerStart={`url(#${ID}-a-accent)`}
        stroke={ACCENT}
        strokeWidth={1.25}
        x1={54}
        x2={884}
        y1={310}
        y2={310}
      />
      <T fill={ACCENT} size={11} x={469} y={302}>
        61.5 ms p99 · quiet tenant · post-warmup · n=311
      </T>
      <line
        markerEnd={`url(#${ID}-a-dim)`}
        markerStart={`url(#${ID}-a-dim)`}
        stroke={INK_DIM}
        strokeDasharray="6 4"
        strokeWidth={1.25}
        x1={54}
        x2={884}
        y1={345}
        y2={345}
      />
      <T fill={INK_DIM} x={469} y={337}>
        1,585 ms p99 · same tenant when FIFO meets a flood · 26x
      </T>

      {/* regime note: numbers travel with their conditions */}
      <T anchor="start" fill={INK_DIM} x={24} y={436}>
        regime: 1x A100 · Llama-3.1-8B · vLLM 0.19.1 · 300 s window
      </T>

      <TitleBlock sheet="01 of 03" title="kvwarden admission path" x={640} y={380} />
    </svg>
  );
}
