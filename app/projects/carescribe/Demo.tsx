"use client";

import { useState } from "react";
import DemoShell, { type Outcome } from "@/components/demos/DemoShell";
import PresetButton from "@/components/demos/PresetButton";

/* The first unit that calls a real model instead of running a seeded engine
   in the browser. The transcript goes to a Worker, the Worker calls Workers AI
   on Cloudflare's GPUs, and the note comes back. Nothing is stored.

   The transcripts are synthetic and written for this page. The paste box is
   deliberately labelled: a clinical demo that invites real records is a
   liability, so the copy says not to and the response repeats it. */

const ENDPOINT = "https://carescribe-demo.shrey77-wrk.workers.dev";

type Preset = { id: string; label: string; text: string };

const PRESETS: Preset[] = [
  {
    id: "cardiac",
    label: "chest pain",
    text:
      "54 year old male, chest tightness starting two days ago, worse on exertion and relieved by rest. " +
      "No radiation to the arm, no shortness of breath. Non smoker. Blood pressure 148 over 92, heart rate 88, " +
      "afebrile. Lungs clear to auscultation. History of hyperlipidemia, takes atorvastatin 20 milligrams daily. " +
      "Plan is ECG today, troponin, start low dose aspirin, follow up in one week.",
  },
  {
    id: "sparse",
    label: "thin transcript",
    text:
      "Patient came in with a cough. Been going on a while. Seems fine otherwise. We will see how it goes.",
  },
  {
    id: "peds",
    label: "paediatric fever",
    text:
      "Four year old girl brought in by mother, fever to 39.1 for two days, pulling at the right ear, " +
      "eating less but drinking normally. No rash, no vomiting. Temperature 38.8 in clinic, heart rate 122. " +
      "Right tympanic membrane erythematous and bulging. Started amoxicillin 45 milligrams per kilogram per day " +
      "divided twice daily for ten days. Return if fever persists past 48 hours.",
  },
];

type Result = {
  note: string;
  model: string;
  elapsedMs: number;
};

export default function Demo() {
  const [presetId, setPresetId] = useState(PRESETS[0]!.id);
  const [transcript, setTranscript] = useState(PRESETS[0]!.text);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pick = (p: Preset) => {
    setPresetId(p.id);
    setTranscript(p.text);
    setResult(null);
    setError(null);
  };

  const run = async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      const data = (await res.json()) as Record<string, unknown>;
      if (!res.ok || !data.ok) {
        setError(String(data.error ?? `Request failed with ${res.status}.`));
      } else {
        setResult({
          note: String(data.note),
          model: String(data.model),
          elapsedMs: Number(data.elapsed_ms),
        });
      }
    } catch {
      setError("Could not reach the model endpoint.");
    } finally {
      setRunning(false);
    }
  };

  const outcome: Outcome = error
    ? { tone: "danger", label: "NO NOTE", headline: error }
    : result
      ? {
          tone: "success",
          label: "NOTE RETURNED",
          headline: `A real model produced this note in ${(result.elapsedMs / 1000).toFixed(1)} s.`,
          detail: `${result.model} on Cloudflare's GPUs. Nothing you typed was stored.`,
        }
      : {
          tone: "neutral",
          label: running ? "RUNNING" : "READY",
          headline: running
            ? "Calling the model."
            : "Pick a transcript or write your own, then run it.",
        };

  return (
    <DemoShell
      scenario="You are the clinician at the end of a visit. The transcript is what was said. The note is what has to go in the chart, and it has to be right."
      controlsLabel="pick a transcript"
      controls={
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <PresetButton active={presetId === p.id} key={p.id} onClick={() => pick(p)}>
              {p.label}
            </PresetButton>
          ))}
        </div>
      }
      outcome={outcome}
      footnote={
        <>
          Synthetic transcripts, written for this page. Do not paste real patient data: it leaves
          your browser to reach the model. Nothing is stored at either end.
        </>
      }
    >
      <div className="mt-6">
        <label className="font-mono text-xs uppercase text-ink-2" htmlFor="cs-transcript">
          transcript
        </label>
        <textarea
          className="focus-ring mt-2 h-40 w-full rounded-sm border border-rule bg-bg-0 p-3 font-mono text-[12.5px] leading-6 text-ink-1"
          id="cs-transcript"
          onChange={(e) => setTranscript(e.target.value)}
          spellCheck={false}
          value={transcript}
        />
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <button
            className="focus-ring inline-flex min-h-[44px] items-center rounded-sm bg-ink-0 px-[18px] font-mono text-[11.5px] uppercase tracking-[0.1em] text-bg-0 transition hover:opacity-90 disabled:opacity-50"
            disabled={running || transcript.trim().length === 0}
            onClick={run}
            type="button"
          >
            {running ? "Running" : "Write the note"}
          </button>
          <p className="font-mono text-[11px] text-ink-2">{transcript.length} chars · cap 4000</p>
        </div>
      </div>

      {result ? (
        <div className="mt-7">
          <p className="font-mono text-xs uppercase text-ink-2">the note</p>
          <pre
            className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-sm border border-rule bg-bg-0 p-4 font-mono text-[12.5px] leading-6 text-ink-0"
            data-testid="carescribe-note"
          >
            {result.note}
          </pre>
        </div>
      ) : null}
    </DemoShell>
  );
}
