"use client";

import { useState } from "react";
import LiveLog, { type LogLine } from "@/components/demos/LiveLog";
import chain from "./chain.json";

/* The audit chain, verified in this browser. The engine hash-chains every
   action it takes: hash = sha256(prev_hash + canonical row). The export
   ships each row's exact preimage, so verification here is the real
   computation (WebCrypto SHA-256 over the engine's own bytes), not a
   replay of a verdict computed elsewhere.

   Tamper mode rewrites one row the way a careful attacker would: it edits
   the action and recomputes that row's hash so the row itself looks
   perfect. The next row still begins with the original hash, so the chain
   betrays the rewrite one link later. */

type Row = {
  seq: number;
  actor: string;
  on_behalf_of: string | null;
  action: string;
  status: string;
  approved_by: string | null;
  prev_hash: string;
  hash: string;
  preimage: string;
};

const ROWS = (chain as { rows: Row[] }).rows;
/* The rewritten row in tamper mode: a denied delist that an attacker would
   love to turn into an approval. Chosen once, stated in the copy. */
const TAMPER_SEQ = 23;

async function sha256Hex(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, "0")).join("");
}

type Verdict = { lines: LogLine[]; breaks: number; firstBreak: number | null };

async function verify(rows: Row[]): Promise<Verdict> {
  const lines: LogLine[] = [];
  let breaks = 0;
  let firstBreak: number | null = null;
  let prev = "genesis";
  for (const r of rows) {
    const digest = await sha256Hex(r.preimage);
    const hashOk = digest === r.hash;
    const linkOk = r.preimage.startsWith(prev);
    const ok = hashOk && linkOk;
    if (!ok) {
      breaks += 1;
      if (firstBreak === null) firstBreak = r.seq;
    }
    lines.push({
      flagged: !ok,
      content: (
        <span>
          <span className="text-ink-2">seq {String(r.seq).padStart(2, "0")}</span>{" "}
          {r.actor} <span className="text-ink-2">&#8594;</span> {r.action} · {r.status}
          {r.approved_by ? ` · approved by ${r.approved_by}` : ""}{" "}
          <span className={ok ? "text-success" : "text-danger"}>
            {ok ? `· sha ok · link ok · ${r.hash.slice(0, 8)}` : !hashOk ? "· HASH MISMATCH" : "· LINK BROKEN: prev hash does not match"}
          </span>
        </span>
      ),
    });
    prev = r.hash;
  }
  return { lines, breaks, firstBreak };
}

async function tamperedRows(): Promise<Row[]> {
  return Promise.all(
    ROWS.map(async (r) => {
      if (r.seq !== TAMPER_SEQ) return r;
      const preimage = r.preimage.replace(`"${r.status}"`, '"approved"');
      return { ...r, status: "approved", preimage, hash: await sha256Hex(preimage) };
    }),
  );
}

export default function Demo() {
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [mode, setMode] = useState<"intact" | "tampered" | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(which: "intact" | "tampered") {
    setBusy(true);
    const rows = which === "intact" ? ROWS : await tamperedRows();
    const v = await verify(rows);
    setMode(which);
    setVerdict(v);
    setBusy(false);
  }

  const tamperRow = ROWS.find((r) => r.seq === TAMPER_SEQ);

  return (
    <div className="rounded-sm border border-rule bg-bg-1 p-4" data-testid="demo-shell">
      <p className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-2">
        the hash-chained audit log · retail pack · {ROWS.length} rows · verified here, in your browser
      </p>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-1">
        Every action the agent took landed in an audit log where each row&rsquo;s hash covers the
        previous row&rsquo;s. The export ships the exact bytes the engine hashed, so this page
        recomputes all {ROWS.length} SHA-256 digests and checks every link. Tamper mode rewrites
        one row the careful way, editing seq {TAMPER_SEQ} ({tamperRow?.action} ·{" "}
        {tamperRow?.status}) into an approval and recomputing that row&rsquo;s hash, so the row
        itself looks perfect. Watch where the chain catches it.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          className="focus-ring rounded-sm border border-rule bg-bg-0 px-4 py-2 font-mono text-[12.5px] text-ink-0 transition hover:border-accent hover:text-accent disabled:opacity-50"
          disabled={busy}
          onClick={() => run("intact")}
          type="button"
        >
          Verify the chain as shipped
        </button>
        <button
          className="focus-ring rounded-sm border border-rule bg-bg-0 px-4 py-2 font-mono text-[12.5px] text-ink-0 transition hover:border-accent hover:text-accent disabled:opacity-50"
          disabled={busy}
          onClick={() => run("tampered")}
          type="button"
        >
          Rewrite seq {TAMPER_SEQ}, then verify
        </button>
      </div>

      {verdict ? (
        <>
          <p
            aria-live="polite"
            className={`mt-4 rounded-sm border px-4 py-3 text-sm leading-6 ${
              verdict.breaks === 0
                ? "border-success/40 bg-success/10 text-ink-0"
                : "border-danger/40 bg-danger/10 text-ink-0"
            }`}
            data-testid="demo-outcome"
          >
            {verdict.breaks === 0 ? (
              <>
                {ROWS.length} of {ROWS.length} rows verified, 0 breaks. Every digest matches and
                every row begins with the hash of the one before it.
              </>
            ) : (
              <>
                Chain breaks at seq {verdict.firstBreak}. The rewritten row hashes cleanly, but
                the next row still carries the original hash, so the edit cannot hide.{" "}
                {verdict.breaks} row{verdict.breaks === 1 ? "" : "s"} fail.
              </>
            )}
          </p>
          <div className="mt-4">
            <LiveLog
              counterNoun="rows"
              flaggedNoun="breaks"
              lines={verdict.lines}
              title={mode === "intact" ? "audit chain · as shipped" : `audit chain · seq ${TAMPER_SEQ} rewritten`}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
