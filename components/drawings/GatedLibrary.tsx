import { ACCENT, INK, INK_DIM } from "./inks";
import { Defs, NodeBox, SheetFrame, T, TitleBlock } from "./primitives";

/* DWG-02: the gated library.
 *
 * Browser -> Cloudflare edge (Access check) -> cloudflared tunnel (QUIC,
 * outbound-only) -> python http.server on localhost:8000 -> static wings.
 * Each hop carries its failure mode as a dashed leader note, so the drawing
 * doubles as the runbook: the status code names the failing layer. */

const W = 1040;
const H = 440;
const ID = "dwg2";

function FailNote({ cx, lines }: { cx: number; lines: string[] }) {
  return (
    <g>
      <line
        stroke={INK_DIM}
        strokeDasharray="3 4"
        strokeWidth={1}
        x1={cx}
        x2={cx}
        y1={182}
        y2={236}
      />
      {lines.map((line, i) => (
        <T key={line} fill={INK_DIM} x={cx} y={250 + i * 16}>
          {line}
        </T>
      ))}
    </g>
  );
}

export function GatedLibrary() {
  return (
    <svg
      aria-label="Working drawing of the gated library serving path. A browser reaches the Cloudflare edge, which runs an Access check against an email allowlist of four plus a service token, then a cloudflared tunnel over QUIC carries traffic to python http dot server on localhost 8000, which serves static wings of files. Failure modes are annotated at each hop: 302 without auth, 403 wrong identity, 530 tunnel down, 502 origin down, 404 missing file."
      className="block h-auto w-full"
      focusable="false"
      role="img"
      viewBox={`0 0 ${W} ${H}`}
    >
      <Defs accent={ACCENT} id={ID} />
      <SheetFrame h={H} w={W} />

      <NodeBox h={84} lines={["any device", "no vpn client"]} title="BROWSER" w={140} x={30} y={98} />
      <line markerEnd={`url(#${ID}-a-ink)`} stroke={INK} strokeWidth={1.25} x1={170} x2={214} y1={140} y2={140} />
      <NodeBox
        h={84}
        lines={["access policy check", "email allowlist n=4", "or service token"]}
        title="CLOUDFLARE EDGE"
        w={200}
        x={218}
        y={98}
      />
      <line markerEnd={`url(#${ID}-a-ink)`} stroke={INK} strokeWidth={1.25} x1={418} x2={462} y1={140} y2={140} />
      <NodeBox
        h={84}
        lines={["cloudflared · quic", "outbound-only", "no open inbound port"]}
        title="TUNNEL"
        w={180}
        x={466}
        y={98}
      />
      <line markerEnd={`url(#${ID}-a-ink)`} stroke={INK} strokeWidth={1.25} x1={646} x2={690} y1={140} y2={140} />
      <NodeBox
        h={84}
        lines={["localhost:8000", "python http.server"]}
        title="ORIGIN"
        w={170}
        x={694}
        y={98}
      />
      <line markerEnd={`url(#${ID}-a-ink)`} stroke={INK} strokeWidth={1.25} x1={864} x2={900} y1={140} y2={140} />
      <NodeBox h={84} lines={["html + assets", "read-only"]} title="STATIC WINGS" w={112} x={904} y={98} />

      {/* failure modes, hop by hop: the runbook layer */}
      <FailNote cx={318} lines={["no auth → 302 to access login", "wrong email → 403 deny"]} />
      <FailNote cx={556} lines={["tunnel down → 530 from edge"]} />
      <FailNote cx={779} lines={["http.server down → 502"]} />
      <FailNote cx={960} lines={["missing file → 404"]} />

      {/* debug order: read the status, it names the failing layer */}
      <T anchor="start" fill={ACCENT} size={11} x={30} y={314}>
        debug from the status code:
      </T>
      <T anchor="start" fill={INK_DIM} x={30} y={330}>
        302 auth · 403 identity · 530 tunnel · 502 origin · 404 path
      </T>

      <T anchor="start" fill={INK_DIM} x={24} y={408}>
        regime: origin is a laptop behind nat · no inbound port is ever open
      </T>

      <TitleBlock sheet="02 of 03" title="the gated library" x={700} y={350} />
    </svg>
  );
}
