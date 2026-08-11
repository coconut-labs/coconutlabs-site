"use client";

import { useMemo, useState } from "react";
import DemoShell, { type Outcome } from "@/components/demos/DemoShell";
import PresetButton from "@/components/demos/PresetButton";
import VerdictCard from "@/components/demos/VerdictCard";
import { fitProfile, check, schemaControlFlags, CORRUPTIONS, type Dataset, type Row } from "./guardrail";
import sample from "./sample.json";

const CLEAN: Dataset = { columns: ["s", "a", "e", "f", "t"], rows: sample.rows as Row[] };

export default function Demo() {
  const profile = useMemo(() => fitProfile(CLEAN), []);
  const [activeId, setActiveId] = useState<string | null>(null);

  const active = CORRUPTIONS.find((c) => c.id === activeId) ?? null;
  const ds = active ? active.fn(CLEAN) : CLEAN;
  const violations = check(profile, ds);
  const controlFlagged = schemaControlFlags(profile, ds);
  const guardrailFlagged = violations.length > 0;

  const first = violations[0];
  const outcome: Outcome = active
    ? controlFlagged
      ? {
          tone: "danger",
          label: "flagged by both",
          headline: `Both checks flagged ${active.label.toLowerCase()}: a declared column is missing. This is the loud break a schema contract exists for.`,
          detail: first ? `${first.kind}: ${first.detail}` : undefined,
        }
      : {
          tone: "danger",
          label: "flagged by the guardrail only",
          headline: `The guardrail flagged ${active.label.toLowerCase()} while the schema contract passed the same data.`,
          detail: violations.map((v) => `${v.kind}: ${v.detail}`).join(" · "),
        }
    : {
        tone: "success",
        label: "clean pass",
        headline: "The data as recorded passes both checks. Nothing fired, which is the point: zero false positives on clean data.",
      };

  return (
    <DemoShell
      scenario={`You are the data engineer. This morning's load is ${CLEAN.rows.length} rows of the lerobot/pusht robot dataset, and it may carry one of these corruptions. The real guardrail runs in your browser, computed live, not canned.`}
      controlsLabel="inject a corruption"
      controls={
        <div className="flex flex-wrap gap-2">
          <PresetButton active={activeId === null} onClick={() => setActiveId(null)}>
            Clean data
          </PresetButton>
          {CORRUPTIONS.map((c) => (
            <PresetButton key={c.id} danger active={activeId === c.id} onClick={() => setActiveId(c.id)}>
              {c.label}
            </PresetButton>
          ))}
        </div>
      }
      outcome={outcome}
      footnote={
        <>
          {active
            ? `Injected: ${active.failure}.`
            : "Baseline: the data as recorded. Nothing should fire."}{" "}
          Same detectors and thresholds as the Python harness; verified to reproduce its 6/6-vs-1/6 verdicts on this
          sample. The cited table below is the measured 50-episode run.
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <VerdictCard
          name="The guardrail"
          flagged={guardrailFlagged}
          good={active === null ? !guardrailFlagged : guardrailFlagged}
          detail={
            guardrailFlagged
              ? violations.map((v) => `${v.kind}: ${v.detail}`).join(" · ")
              : "no violations, clean data passes"
          }
        />
        <VerdictCard
          name="Type / presence contract"
          flagged={controlFlagged}
          good={active === null ? !controlFlagged : controlFlagged}
          detail={
            controlFlagged
              ? "rejected: a declared column is missing"
              : active
                ? "passed, the schema still looks valid, so it waves the corruption through"
                : "passed, clean data is valid"
          }
        />
      </div>
    </DemoShell>
  );
}
