import { buildFigure } from "@/lib/figures/geometry.mjs";
import type { FigureSpec } from "@/lib/figures/spec.mjs";

import { Draw } from "./Draw";

/* The figure, as a server component. Zero client React.
 *
 * The geometry is decided at build time by buildFigure, the same function the
 * vanilla renderer calls, and the markup is the same markup renderFigure
 * emits. Interactivity arrives from one shared script, mounted once per page
 * by <FigureRuntime/>, which finds every [data-fig] on the page and wires its
 * rail. Nothing here hydrates.
 *
 * Without JS the figure renders at staticStep: the groups outside that step
 * carry data-fig-off, which is a CSS concern, so the static frame is real
 * rather than a blank waiting for a bundle. The rail stays hidden, because a
 * control that does nothing is worse than no control, and the walkthrough
 * below carries all n step sentences as prose.
 *
 * prefers-reduced-motion collapses the 140 ms cross-fade to zero in
 * styles/figure-tokens.css. The rail still works: reduced motion is not
 * reduced interaction, and each step already is a static frame. */

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function Figure({ spec }: { spec: FigureSpec }) {
  const drawing = buildFigure(spec);
  const { caption, id, scrubbed, staticStep, stepCount, steps } = drawing;
  const railId = `${id}-rail`;

  return (
    <div className="fig" data-fig={id} data-fig-static={staticStep} data-fig-steps={stepCount}>
      <figure className="fig-frame">
        <div className="fig-canvas">
          <svg
            aria-label={drawing.alt}
            className="fig-svg"
            focusable="false"
            role="img"
            viewBox={drawing.viewBox}
            xmlns="http://www.w3.org/2000/svg"
          >
            <Draw nodes={drawing.nodes} />
          </svg>
        </div>

        {scrubbed ? (
          <div className="fig-controls" data-fig-controls hidden>
            <label className="fig-rail-label" htmlFor={railId}>
              drag to step
            </label>
            <input
              aria-describedby={`${id}-step`}
              className="fig-rail"
              defaultValue={staticStep}
              id={railId}
              list={`${id}-ticks`}
              max={stepCount - 1}
              min={0}
              name={railId}
              step={1}
              type="range"
            />
            <datalist id={`${id}-ticks`}>
              {steps.map((_, i) => (
                <option key={i} value={i} />
              ))}
            </datalist>
            <span aria-hidden="true" className="fig-readout" data-fig-readout>
              {`${pad(staticStep + 1)} / ${pad(stepCount)}`}
            </span>
          </div>
        ) : null}

        {scrubbed ? (
          <p aria-live="polite" className="fig-step" data-fig-caption id={`${id}-step`}>
            {steps[staticStep]}
          </p>
        ) : null}

        <figcaption className="fig-caption">
          <span className="fig-caption-left">{caption.left}</span>
          <span className="fig-caption-right">{caption.right}</span>
        </figcaption>

        {caption.footnote ? (
          <p className="fig-provenance">
            {caption.footnote.label}:{" "}
            <a href={caption.footnote.href}>{caption.footnote.text}</a>
          </p>
        ) : null}
      </figure>

      {scrubbed ? (
        <details className="fig-read">
          <summary>Read this figure</summary>
          <ol data-fig-walkthrough>
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </details>
      ) : null}
    </div>
  );
}
