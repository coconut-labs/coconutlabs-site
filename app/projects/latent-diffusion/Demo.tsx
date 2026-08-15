"use client";

import { useMemo, useState } from "react";
import DemoShell, { type Outcome } from "@/components/demos/DemoShell";
import LiveLog, { type LogLine } from "@/components/demos/LiveLog";
import PresetButton from "@/components/demos/PresetButton";
import {
  GRID,
  SCHEDULES,
  frame,
  scheduleById,
  trajectory,
  type ScheduleId,
} from "./schedule";

const DEFAULT_SCHEDULE: ScheduleId = "txt2img";
const DEFAULT_T = 500;

/* One 24x24 field, drawn as rects in the ink token at per-cell opacity. No new
   colors: opacity carries the value, the plate carries the ground. The rects
   are decorative; the aria-label states what the panel shows. */
function Field({ cells, label }: { cells: number[]; label: string }) {
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${GRID} ${GRID}`}
      preserveAspectRatio="xMidYMid meet"
      shapeRendering="crispEdges"
      className="block w-full text-ink-0"
    >
      {cells.map((o, i) => (
        <rect
          key={i}
          x={i % GRID}
          y={(i / GRID) | 0}
          width={1}
          height={1}
          fill="currentColor"
          fillOpacity={o}
        />
      ))}
    </svg>
  );
}

function Panel({
  caption,
  note,
  cells,
  label,
  testId,
}: {
  caption: string;
  note: string;
  cells: number[];
  label: string;
  testId: string;
}) {
  return (
    <figure className="rounded-sm border border-rule bg-bg-2/60 p-4" data-testid={testId}>
      <div className="mx-auto max-w-[15rem]">
        <Field cells={cells} label={label} />
      </div>
      <figcaption className="mt-3">
        <p className="font-mono text-xs text-ink-0">{caption}</p>
        <p className="mt-1 font-mono text-[0.68rem] leading-5 text-ink-2">{note}</p>
      </figcaption>
    </figure>
  );
}

export default function Demo() {
  const [id, setId] = useState<ScheduleId>(DEFAULT_SCHEDULE);
  const [t, setT] = useState(DEFAULT_T);
  const [errorPct, setErrorPct] = useState(0);
  // The trajectory log only mounts after a control is touched, so the route's
  // default render (and its visual baseline) stays byte-identical.
  const [interacted, setInteracted] = useState(false);

  const spec = scheduleById(id);
  const f = useMemo(() => frame(id, t, errorPct), [id, t, errorPct]);

  // Depends on the schedule only, so scrubbing t does not restart the replay.
  const steps = useMemo(() => trajectory(id), [id]);
  const logLines = useMemo<LogLine[]>(
    () =>
      steps.map((s) => ({
        flagged: s.noiseDominant,
        content: (
          <>
            <span className="text-ink-2">t={String(s.t).padStart(3, "0")}</span>{" "}
            <span className="text-ink-1">abar {s.alphaBar.toFixed(4)}</span>{" "}
            <span className="text-ink-0">signal {s.signalPct.toFixed(1)}%</span>{" "}
            <span className="text-ink-1">noise {s.noisePct.toFixed(1)}%</span>{" "}
            {s.noiseDominant ? (
              <span className="text-danger">✕ noise leads</span>
            ) : (
              <span className="text-success">✓ signal leads</span>
            )}
          </>
        ),
      })),
    [steps],
  );

  const outcome: Outcome = {
    tone: "neutral",
    label: `t = ${t} of ${spec.timesteps} · ${spec.label}`,
    headline:
      errorPct === 0
        ? `The field is carrying ${f.signalPct.toFixed(1)}% of its original amplitude and ${f.noisePct.toFixed(1)}% noise. Hand the reverse step the exact noise that went in and the original field comes back whole, RMS error ${f.reconRms.toFixed(3)}.`
        : `The field is carrying ${f.signalPct.toFixed(1)}% of its original amplitude and ${f.noisePct.toFixed(1)}% noise. A predictor ${errorPct}% off returns it with RMS error ${f.reconRms.toFixed(3)}, because this step multiplies predictor error by ${f.errorGain.toFixed(1)}x.`,
    detail: `alphas_cumprod[${t}] = ${f.alphaBar.toFixed(4)} · beta[${t}] = ${f.beta.toPrecision(4)} · endpoints ${spec.linear_start} to ${spec.linear_end} from ${spec.source}`,
  };

  return (
    <DemoShell
      scenario="The schedule is the part of a diffusion model that carries no weights. Pick one of the repo's configs, drag the timestep, and watch a 24x24 toy field dissolve into noise and come back. This is the repo's arithmetic running in your browser, not its trained model."
      controlsLabel="pick a schedule, drag the timestep, then break the predictor"
      controls={
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {SCHEDULES.map((s) => (
              <PresetButton
                key={s.id}
                active={s.id === id}
                onClick={() => {
                  setId(s.id);
                  setInteracted(true);
                }}
              >
                {s.label}
                <span className="ml-1 text-ink-2">
                  · {s.linear_start} to {s.linear_end}
                </span>
              </PresetButton>
            ))}
          </div>

          <div>
            <label htmlFor="ld-timestep" className="font-mono text-xs text-ink-1">
              timestep t: {t} of {spec.timesteps}
            </label>
            <input
              id="ld-timestep"
              data-testid="timestep"
              type="range"
              min={0}
              max={spec.timesteps - 1}
              step={1}
              value={t}
              onChange={(e) => {
                setT(Number(e.target.value));
                setInteracted(true);
              }}
              className="focus-ring mt-2 block w-full max-w-md accent-accent"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <PresetButton
              active={errorPct === 0}
              onClick={() => {
                setErrorPct(0);
                setInteracted(true);
              }}
            >
              Exact noise predictor
            </PresetButton>
            <PresetButton
              danger
              active={errorPct === 5}
              onClick={() => {
                setErrorPct(5);
                setInteracted(true);
              }}
            >
              Predictor 5% off
            </PresetButton>
          </div>
        </div>
      }
      outcome={outcome}
      footnote={
        <>
          The toy field is a fixed 24x24 pattern, not an image and not a latent. What comes from the
          repo is the schedule: {spec.linear_start} to {spec.linear_end} over {spec.timesteps} steps,{" "}
          <span className="text-ink-1">{spec.source}</span>, run through make_beta_schedule in
          ldm/modules/diffusionmodules/util.py and the two formulas in
          ldm/models/diffusion/ddpm.py.
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Panel
          testId="panel-noised"
          caption={`x_t  ·  forward step at t = ${t}`}
          note={`q_sample: sqrt(abar_t) * x_0 + sqrt(1 - abar_t) * eps. Signal ${f.signalPct.toFixed(1)}%, noise ${f.noisePct.toFixed(1)}%.`}
          cells={f.noisedCells}
          label={`The toy field after ${t} forward steps: ${f.signalPct.toFixed(1)} percent of the original amplitude survives, ${f.noisePct.toFixed(1)} percent is noise.`}
        />
        <Panel
          testId="panel-recovered"
          caption="x0_hat  ·  one reverse step"
          note={`predict_start_from_noise: sqrt(1/abar_t) * x_t - sqrt(1/abar_t - 1) * eps_hat. Error gain at this step ${f.errorGain.toFixed(1)}x.`}
          cells={f.recoveredCells}
          label={
            errorPct === 0
              ? "The field recovered by one reverse step given the exact noise: identical to the original."
              : `The field recovered by one reverse step given a predictor ${errorPct} percent off: RMS error ${f.reconRms.toFixed(3)}.`
          }
        />
      </div>

      <p className="mt-3 font-mono text-[0.68rem] leading-5 text-ink-2">
        The right panel is handed the true noise, optionally spoiled. A trained U-Net&rsquo;s entire
        job is estimating that noise from the left panel alone. Nothing here estimates anything, so
        read the right panel as the schedule&rsquo;s arithmetic, never as model output.
      </p>

      {interacted ? (
        <div className="mt-6">
          <LiveLog
            title="forward trajectory · alphas_cumprod"
            lines={logLines}
            counterNoun="steps"
            flaggedNoun="noise leads"
            linesPerTick={1}
            tickMs={90}
          />
        </div>
      ) : null}
    </DemoShell>
  );
}
