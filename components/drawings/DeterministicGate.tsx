import { ACCENT, INK, INK_DIM } from "./inks";
import { Defs, NodeBox, SheetFrame, T, TitleBlock } from "./primitives";

/* DWG-03: the deterministic gate.
 *
 * The path a commit walks on this site: typecheck -> design-lint -> unit ->
 * build -> e2e in three engines -> pixel gate at maxDiffPixels 0 -> deploy ->
 * verify-live. Serpentine, two rows. Fail edges are drawn as return rails:
 * every red gate feeds back to commit, and a pixel diff has exactly one
 * legitimate exit (a baseline update with a stated reason). */

const W = 980;
const H = 560;
const ID = "dwg3";

export function DeterministicGate() {
  return (
    <svg
      aria-label="Working drawing of the deterministic release gate. A commit passes through typecheck, design-lint, 32 unit tests, a production build, end-to-end tests in three browser engines, and a pixel gate comparing 14 routes at four shots each with maxDiffPixels zero, then deploy and verify-live on nine surfaces plus a post-auth probe. Dashed rails return every failing gate to commit; baseline updates require a stated reason, and agent-range commits get agent-audit."
      className="block h-auto w-full"
      focusable="false"
      role="img"
      viewBox={`0 0 ${W} ${H}`}
    >
      <Defs accent={ACCENT} id={ID} />
      <SheetFrame h={H} w={W} />

      {/* top fail rail: static gates return to commit */}
      <T fill={INK_DIM} x={480} y={30}>
        any red gate: fix, recommit · nothing lands on a red gate
      </T>
      <path
        d="M 878 76 V 40 H 102 V 72"
        fill="none"
        markerEnd={`url(#${ID}-a-dim)`}
        stroke={INK_DIM}
        strokeDasharray="6 4"
        strokeWidth={1}
      />
      <line stroke={INK_DIM} strokeDasharray="6 4" strokeWidth={1} x1={296} x2={296} y1={76} y2={40} />
      <line stroke={INK_DIM} strokeDasharray="6 4" strokeWidth={1} x1={490} x2={490} y1={76} y2={40} />
      <line stroke={INK_DIM} strokeDasharray="6 4" strokeWidth={1} x1={684} x2={684} y1={76} y2={40} />

      {/* row 1: the static gates */}
      <NodeBox h={64} lines={["by hand or agent"]} title="COMMIT" w={152} x={26} y={80} />
      <line markerEnd={`url(#${ID}-a-ink)`} stroke={INK} strokeWidth={1.25} x1={178} x2={214} y1={112} y2={112} />
      <NodeBox h={64} lines={["tsc --noEmit"]} title="TYPECHECK" w={152} x={220} y={80} />
      <line markerEnd={`url(#${ID}-a-ink)`} stroke={INK} strokeWidth={1.25} x1={372} x2={408} y1={112} y2={112} />
      <NodeBox h={64} lines={["hex · dashes · fonts"]} title="DESIGN-LINT" w={152} x={414} y={80} />
      <line markerEnd={`url(#${ID}-a-ink)`} stroke={INK} strokeWidth={1.25} x1={566} x2={602} y1={112} y2={112} />
      <NodeBox h={64} lines={["vitest · 32 tests"]} title="UNIT" w={152} x={608} y={80} />
      <line markerEnd={`url(#${ID}-a-ink)`} stroke={INK} strokeWidth={1.25} x1={760} x2={796} y1={112} y2={112} />
      <NodeBox h={64} lines={["next build"]} title="BUILD" w={152} x={802} y={80} />

      {/* agent-audit annotation at the source */}
      <T fill={INK_DIM} x={112} y={168}>
        agent ranges:
      </T>
      <T fill={INK_DIM} x={112} y={184}>
        agent-audit before merge
      </T>

      {/* turn down into row 2 */}
      <line markerEnd={`url(#${ID}-a-ink)`} stroke={INK} strokeWidth={1.25} x1={878} x2={878} y1={144} y2={206} />

      {/* row 2: built-site gates, right to left */}
      <NodeBox h={64} lines={["chromium ff webkit"]} title="E2E · 3 ENGINES" w={152} x={802} y={210} />
      <line markerEnd={`url(#${ID}-a-ink)`} stroke={INK} strokeWidth={1.25} x1={802} x2={766} y1={242} y2={242} />
      <NodeBox
        h={64}
        lines={["14 routes · 4 shots each", "maxDiffPixels 0"]}
        title="PIXEL GATE"
        w={200}
        x={560}
        y={210}
      />
      <line markerEnd={`url(#${ID}-a-ink)`} stroke={INK} strokeWidth={1.25} x1={560} x2={524} y1={242} y2={242} />
      <NodeBox h={64} lines={["main → production"]} title="DEPLOY" w={152} x={366} y={210} />
      <line markerEnd={`url(#${ID}-a-ink)`} stroke={INK} strokeWidth={1.25} x1={366} x2={318} y1={242} y2={242} />
      <NodeBox h={64} lines={["9 surfaces", "+ post-auth probe"]} title="VERIFY-LIVE" w={152} x={160} y={210} />
      <line markerEnd={`url(#${ID}-a-ink)`} stroke={INK} strokeWidth={1.25} x1={160} x2={98} y1={242} y2={242} />
      <circle cx={88} cy={242} fill={ACCENT} r={5} />
      <T fill={ACCENT} size={11} x={88} y={224}>
        LIVE
      </T>

      {/* bottom fail rail: built-site gates return to commit */}
      <T fill={INK_DIM} x={480} y={322}>
        pixel diff intended? baseline update must state what changed and why
      </T>
      <path
        d="M 878 274 V 330 H 34 V 148"
        fill="none"
        markerEnd={`url(#${ID}-a-dim)`}
        stroke={INK_DIM}
        strokeDasharray="6 4"
        strokeWidth={1}
      />
      <line stroke={INK_DIM} strokeDasharray="6 4" strokeWidth={1} x1={660} x2={660} y1={274} y2={330} />
      <line stroke={INK_DIM} strokeDasharray="6 4" strokeWidth={1} x1={236} x2={236} y1={274} y2={330} />

      <T anchor="start" fill={INK_DIM} x={24} y={530}>
        regime: coconutlabs.org · npm run test:all + npm run test:visual · darwin local, linux in ci
      </T>

      <TitleBlock sheet="03 of 03" title="the deterministic gate" x={640} y={440} />
    </svg>
  );
}
