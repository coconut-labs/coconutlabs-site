import Link from "next/link";
import { AdmissionPath } from "@/components/drawings/AdmissionPath";
import { DeterministicGate } from "@/components/drawings/DeterministicGate";
import { DrawingFigure } from "@/components/drawings/DrawingFigure";
import { GatedLibrary } from "@/components/drawings/GatedLibrary";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Working drawings · Coconut Labs",
  description:
    "System diagrams with the precision of construction documents: real values, failure modes, revision blocks.",
  path: "/drawings",
});

export default function DrawingsPage() {
  return (
    <section className="content-band">
      <div className="content-inner">
        <p className="font-mono text-xs uppercase text-ink-2">working drawings</p>
        <h1 className="mt-5 text-[clamp(30px,4vw,46px)] leading-[1.05] tracking-[-0.03em]">
          Diagrams you could build from.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-ink-1">
          Real values, failure modes, revision blocks. Marketing diagrams lie by omission; these
          are the drawings we work from.
        </p>

        <div className="mt-16">
          <h2 className="text-[clamp(1.6rem,3vw,2.4rem)] leading-tight tracking-[-0.03em]">
            01 · kvwarden admission path
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-ink-1">
            How a quiet tenant stays quiet: fairness enforced before a tenant-blind engine, with
            the measured cost of not doing it drawn dashed.
          </p>
          <DrawingFigure
            alt="Path: request, then token bucket, then admission gate, then vLLM engine, then response. The token bucket refills at rate_limit_rpm over 60 tokens per second with burst up to bucket capacity. The admission gate holds max_concurrent requests in flight with a queue wait of up to 30 seconds, then sheds. The engine is tenant-blind. Measured: 61.5 milliseconds p99 for a quiet tenant post-warmup, n equals 311. The dashed FIFO bypass measures 1,585 milliseconds p99, 26 times slower. Regime: one A100, Llama-3.1-8B, vLLM 0.19.1, 300 second window."
            caption="dwg-01 · kvwarden admission path"
            conditions="1x A100 · Llama-3.1-8B · vLLM 0.19.1 · 300 s"
            minWidth={980}
            steps={[
              "A request enters at the left carrying a tenant id. Everything past the boundary line has no idea tenants exist, so fairness has to be enforced before the engine.",
              "The token bucket refills at rate_limit_rpm divided by 60 tokens per second, and the bucket depth is the burst allowance: a tenant can spend saved tokens in a spike but cannot beat the refill rate for long.",
              "The admission gate caps requests in flight at max_concurrent. A request that cannot get a slot waits up to 30 seconds, then is shed instead of queueing forever.",
              "The vLLM engine runs continuous batching and is tenant-blind by design; the dash-dot line marks where tenant identity stops existing.",
              "The accent dimension is the measured result: 61.5 ms p99 for a quiet tenant post-warmup, n=311, on 1x A100, Llama-3.1-8B, vLLM 0.19.1, over a 300 s window.",
              "The dashed dimension is the control: the same quiet tenant behind a flood sees 1,585 ms p99 when requests go straight to the engine FIFO, 26× the gated figure.",
            ]}
          >
            <AdmissionPath />
          </DrawingFigure>
          <p className="mt-3 font-mono text-[11px] text-ink-2">
            provenance for the dimensions:{" "}
            <Link
              className="focus-ring rounded-sm text-accent underline underline-offset-2"
              href="/benchmarks"
            >
              /benchmarks →
            </Link>
          </p>
        </div>

        <div className="mt-16">
          <h2 className="text-[clamp(1.6rem,3vw,2.4rem)] leading-tight tracking-[-0.03em]">
            02 · the gated library
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-ink-1">
            How a private library on a laptop serves the public internet with no open port, and
            what each status code means when it breaks.
          </p>
          <DrawingFigure
            alt="Path: browser, then Cloudflare edge, then cloudflared tunnel, then origin at localhost 8000, then static wings. The edge runs a Cloudflare Access check: an email allowlist of four people plus a service token for automation. The tunnel is cloudflared over QUIC, outbound-only, no open inbound port. The origin is python http dot server serving read-only files. Failure modes by hop: no auth gives 302 to the Access login, wrong email gives 403, tunnel down gives 530 from the edge, origin down gives 502, missing file gives 404."
            caption="dwg-02 · the gated library"
            conditions="cloudflare access · quic · outbound-only"
            minWidth={1040}
            steps={[
              "A browser asks for the library from any device; there is no VPN client. DNS is proxied, so the origin address is never public.",
              "The Cloudflare edge runs the Access check first: a four-address email allowlist for people, a service token for automation. No auth means a 302 to the Access login; a valid session with the wrong email is a 403.",
              "Traffic that passes rides a cloudflared tunnel over QUIC. The tunnel is outbound-only: the laptop dials out, nothing dials in, so there is no inbound port to scan.",
              "The origin is python http.server on localhost:8000 serving static wings of files. It never sees unauthenticated traffic.",
              "When it breaks, the status code names the failing layer, which is why this drawing is also the runbook: 302 auth, 403 identity, 530 tunnel, 502 origin, 404 path.",
            ]}
          >
            <GatedLibrary />
          </DrawingFigure>
        </div>

        <div className="mt-16">
          <h2 className="text-[clamp(1.6rem,3vw,2.4rem)] leading-tight tracking-[-0.03em]">
            03 · the deterministic gate
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-ink-1">
            What stands between a commit and production on this site. Nothing lands on a red gate.
          </p>
          <DrawingFigure
            alt="Path: commit, then typecheck, then design-lint, then 32 unit tests, then production build, then end-to-end tests in Chromium, Firefox and WebKit, then the pixel gate screenshotting 14 routes four ways each at maxDiffPixels zero, then deploy, then verify-live probing nine production surfaces plus a post-auth path. Dashed rails return every failing gate to commit. A pixel diff is only allowed through as a deliberate baseline update with a stated reason, and commits in agent ranges get agent-audit before merge."
            caption="dwg-03 · the deterministic gate"
            conditions="maxDiffPixels 0 · darwin + linux baselines"
            minWidth={980}
            steps={[
              "Every change starts as a commit, by hand or by agent; commits in agent ranges also get agent-audit before merge.",
              "Four static gates run first: typecheck, design-lint (raw hex, em dashes, icon libraries, font literals), the vitest unit suite at 32 tests, and a production build.",
              "Playwright then drives the built site in three engines: Chromium, Firefox, WebKit.",
              "The pixel gate screenshots 14 routes four ways each (two viewports, light and dark) and compares at maxDiffPixels 0 against committed baselines, darwin locally and linux in CI. One changed pixel is a red gate.",
              "A red gate loops back to commit. A pixel diff has exactly one legitimate exit: an intended change, a deliberate baseline update, and a commit message stating what changed visually and why.",
              "After deploy, verify-live probes 9 production surfaces plus a post-auth path; a failure there loops back like any other red gate.",
            ]}
          >
            <DeterministicGate />
          </DrawingFigure>
        </div>

        <div className="mt-14 flex flex-wrap gap-6 border-t border-rule pt-8 font-mono text-sm">
          <Link className="focus-ring rounded-sm text-accent hover:opacity-80" href="/projects">
            ← All projects
          </Link>
          <Link className="focus-ring rounded-sm text-ink-1 hover:text-accent" href="/benchmarks">
            Benchmarks
          </Link>
        </div>
      </div>
    </section>
  );
}
