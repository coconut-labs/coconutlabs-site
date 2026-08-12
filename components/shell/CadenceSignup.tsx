"use client";

import { useState } from "react";

/* Steady Cadence signup, footer band. Posts JSON to the live worker and maps
   its three measured response shapes (probed 2026-08-12): 201 {ok:true} new,
   200 {ok:true, already:true} duplicate, 4xx/5xx {ok:false, error} failure.
   The status line is a permanently mounted polite live region so the outcome
   is announced without stealing focus. House tokens only; 44px targets. */

type Phase = "idle" | "submitting" | "success" | "already" | "error";

const ENDPOINT = "https://steady-cadence.shrey77-wrk.workers.dev/subscribe";

const STATUS_COPY: Record<Phase, string> = {
  idle: "",
  submitting: "Sending…",
  success: "✓ You are on the list.",
  already: "Already on the list.",
  error: "That did not go through. Check the address and try once more.",
};

export function CadenceSignup() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [email, setEmail] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (phase === "submitting") return;
    setPhase("submitting");
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "footer" }),
      });
      const body = (await res.json().catch(() => null)) as
        | { ok?: boolean; already?: boolean }
        | null;
      if (res.ok && body?.ok) {
        if (body.already) {
          setPhase("already");
        } else {
          setPhase("success");
          setEmail("");
        }
      } else {
        setPhase("error");
      }
    } catch {
      setPhase("error");
    }
  }

  const done = phase === "success" || phase === "already";

  return (
    <div className="flex flex-col gap-2">
      <form
        className="flex flex-wrap items-center gap-2"
        noValidate={false}
        onSubmit={onSubmit}
      >
        <label className="sr-only" htmlFor="cadence-email">
          Email address
        </label>
        <input
          autoComplete="email"
          className="focus-ring min-h-[44px] w-[min(260px,70vw)] rounded-sm border border-rule bg-bg-1 px-3 font-mono text-[12px] text-ink-0 placeholder:text-ink-2"
          disabled={phase === "submitting"}
          id="cadence-email"
          name="email"
          onChange={(event) => {
            setEmail(event.target.value);
            if (done || phase === "error") setPhase("idle");
          }}
          placeholder="you@example.com"
          required
          type="email"
          value={email}
        />
        <button
          className="focus-ring min-h-[44px] cursor-pointer rounded-sm border border-ink-0 bg-ink-0 px-4 font-mono text-[11px] tracking-[0.14em] text-bg-1 transition hover:opacity-85 disabled:cursor-default disabled:opacity-60"
          disabled={phase === "submitting"}
          type="submit"
        >
          {phase === "submitting" ? "SENDING" : "SUBSCRIBE"}
        </button>
      </form>
      {/* Always mounted so the live region announces phase changes. */}
      <p
        aria-live="polite"
        className={`min-h-[1.2em] font-mono text-[11px] ${
          phase === "error" ? "text-danger" : phase === "success" ? "text-success" : "text-ink-2"
        }`}
        data-testid="cadence-status"
        role="status"
      >
        {STATUS_COPY[phase]}
      </p>
    </div>
  );
}
