"use client";

import { useMemo, useState } from "react";
import DemoShell, { type Outcome } from "@/components/demos/DemoShell";
import LiveLog, { type LogLine } from "@/components/demos/LiveLog";
import PresetButton from "@/components/demos/PresetButton";
import VerdictCard from "@/components/demos/VerdictCard";
import { fitProfile, check, checkTrace, schemaControlFlags, CORRUPTIONS, type Dataset, type Row } from "./guardrail";
import sample from "./sample.json";

const CLEAN: Dataset = { columns: ["s", "a", "e", "f", "t"], rows: sample.rows as Row[] };

export default function Demo() {
  const profile = useMemo(() => fitProfile(CLEAN), []);
  const [activeId, setActiveId] = useState<string | null>(null);
  // The check log renders only after the first preset click, so the route's
  // default visual state is byte-identical to the pre-log page.
  const [touched, setTouched] = useState(false);

  const pick = (id: string | null) => {
    setActiveId(id);
    setTouched(true);
  };

  const active = CORRUPTIONS.find((c) => c.id === activeId) ?? null;
  const ds = active ? active.fn(CLEAN) : CLEAN;
  const violations = check(profile, ds);

  // Derived from the same check() run the banner reports: one step per
  // comparison, flagged steps are exactly the violations. Recomputed only on
  // preset change (the only state changes this component has), which is also
  // what restarts the replay.
  const logLines: LogLine[] = checkTrace(profile, ds).map((s) => ({
    content: (
      <>
        <span className="text-ink-2">{s.name}</span>{" "}
        <span className="text-ink-1">{s.observed}</span>{" "}
        <span className="text-ink-2">expect {s.expected}</span>{" "}
        {s.verdict === "flag" ? (
          <span className="text-danger">✕ {s.kind}</span>
        ) : s.verdict === "ok" ? (
          <span className="text-success">✓ ok</span>
        ) : null}
      </>
    ),
    flagged: s.verdict === "flag",
  }));
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
          <PresetButton active={activeId === null} onClick={() => pick(null)}>
            Clean data
          </PresetButton>
          {CORRUPTIONS.map((c) => (
            <PresetButton key={c.id} danger active={activeId === c.id} onClick={() => pick(c.id)}>
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
      {touched ? (
        <div className="mb-6">
          <LiveLog
            title="guardrail · check log"
            lines={logLines}
            counterNoun="steps"
            flaggedNoun="flagged"
            linesPerTick={1}
            tickMs={190}
          />
        </div>
      ) : null}
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
