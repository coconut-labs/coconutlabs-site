/* The authoring format, its validator, and the caption convention.
 *
 * One plain object describes a figure. The same object is consumed by the
 * React components and by the vanilla renderer; nothing about it is specific
 * to either. It is JSON-serialisable on purpose, so a figure can live inline
 * in a markdown fence, in a .fig.json file, or as a module export, and the
 * three paths run identical code.
 *
 * The validator is not advisory. renderFigure and buildFigure both run it and
 * both throw. A figure that cannot state what it is claiming does not render. */

export const PRIMITIVES = ["map", "flow", "timeline", "dist", "states", "stack"];
export const CLAIMS = ["measured", "reported", "illustrative", "schematic"];

/** The seven figure inks, as role names. A spec never names a color. */
export const INKS = {
  ink: "var(--fig-ink)",
  dim: "var(--fig-dim)",
  rule: "var(--fig-rule)",
  accent: "var(--fig-accent)",
  well: "var(--fig-well)",
  pass: "var(--fig-pass)",
  fail: "var(--fig-fail)",
};

export const INK_ROLES = Object.keys(INKS);

/** Resolve an ink role to its CSS value. Unknown roles are a build error, not
 *  a silent fallback: a typo'd role would otherwise draw in black. */
export function ink(role = "ink") {
  const value = INKS[role];
  if (!value) {
    throw new TypeError(`ink: unknown role "${role}" (roles: ${INK_ROLES.join(", ")})`);
  }
  return value;
}

function fail(id, message) {
  throw new Error(`figure ${id || "(no id)"}: ${message}`);
}

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

/**
 * Count elements claiming the accent ink anywhere in a data object. One
 * accent per figure is the rule that lets a one-accent system draw
 * multi-series data without inventing a palette.
 */
export function countAccents(node) {
  if (Array.isArray(node)) return node.reduce((n, x) => n + countAccents(x), 0);
  if (node && typeof node === "object") {
    let n = node.ink === "accent" ? 1 : 0;
    for (const [key, value] of Object.entries(node)) {
      if (key === "ink") continue;
      n += countAccents(value);
    }
    return n;
  }
  return 0;
}

/**
 * Validate a spec. Throws with a message naming the figure and the rule.
 * Returns the spec so it can be used inline.
 */
export function validateSpec(spec) {
  if (!spec || typeof spec !== "object") throw new Error("figure: spec must be an object");
  const { id } = spec;

  if (!isNonEmptyString(id)) fail(id, "needs an id");
  if (!/^fig-[a-z0-9]+(-[a-z0-9]+)*-\d{2}$/.test(id)) {
    fail(id, `id must look like fig-<surface>-<nn>, got "${id}"`);
  }

  const isAb = spec.type === "ab";
  if (!isAb && !PRIMITIVES.includes(spec.type)) {
    fail(id, `type must be one of ${PRIMITIVES.join(", ")}, ab; got "${spec.type}"`);
  }

  // The rule the renderer refuses to build without.
  if (!isNonEmptyString(spec.claim)) fail(id, "missing claim");
  if (!CLAIMS.includes(spec.claim)) {
    fail(id, `claim must be one of ${CLAIMS.join(", ")}; got "${spec.claim}"`);
  }
  if (spec.claim === "measured") {
    if (!isNonEmptyString(spec.conditions)) {
      fail(id, 'claim "measured" requires conditions (hardware, model, version, n, duration)');
    }
    if (!spec.provenance || !isNonEmptyString(spec.provenance.href)) {
      fail(id, 'claim "measured" requires provenance.href');
    }
  }
  if (spec.claim === "reported" && !isNonEmptyString(spec.source)) {
    fail(id, 'claim "reported" requires source (who, what, when)');
  }

  if (!isNonEmptyString(spec.title)) fail(id, "needs a title");
  if (!isNonEmptyString(spec.alt)) fail(id, "needs an alt paragraph");
  if (!Number.isFinite(spec.width) || spec.width <= 0) fail(id, "needs a positive width");

  if (spec.steps !== undefined) {
    if (!Array.isArray(spec.steps) || spec.steps.length < 1) {
      fail(id, "steps must be a non-empty array when present");
    }
    spec.steps.forEach((step, i) => {
      if (!step || !isNonEmptyString(step.caption)) {
        fail(id, `step ${i} needs a caption sentence`);
      }
    });
    if (spec.steps.length === 1) {
      fail(id, "a single step is a static figure; drop the steps array");
    }
  }

  const n = stepCount(spec);
  const staticStep = resolveStaticStep(spec);
  if (staticStep < 0 || staticStep >= n) {
    fail(id, `staticStep ${staticStep} is outside 0..${n - 1}`);
  }

  if (isAb) {
    if (!PRIMITIVES.includes(spec.of)) {
      fail(id, `ab figures need of: one of ${PRIMITIVES.join(", ")}`);
    }
    for (const side of ["a", "b"]) {
      const panel = spec[side];
      if (!panel || typeof panel !== "object") fail(id, `ab figure needs panel ${side}`);
      if (!isNonEmptyString(panel.title)) fail(id, `ab panel ${side} needs a title`);
      if (!panel.data || typeof panel.data !== "object") {
        fail(id, `ab panel ${side} needs data`);
      }
    }
  } else if (!spec.data || typeof spec.data !== "object") {
    fail(id, "needs a data object");
  }

  // A stack's "you are here" marker draws in accent without naming an ink
  // role, so it has to be counted or a stack could quietly carry two accents.
  const hereMarks = (d) => (d && Number.isInteger(d.here) ? 1 : 0);
  const accents = isAb
    ? countAccents(spec.a.data) + countAccents(spec.b.data) + hereMarks(spec.a.data) + hereMarks(spec.b.data)
    : countAccents(spec.data) + hereMarks(spec.data);
  if (accents > 1) {
    fail(id, `${accents} elements claim the accent ink; one accent per figure`);
  }

  const json = JSON.stringify(isAb ? [spec.a, spec.b] : spec.data);
  const hex = json.match(/#[0-9A-Fa-f]{3,8}\b/);
  if (hex) fail(id, `data names a color literal ${hex[0]}; use an ink role`);

  return spec;
}

/** How many steps this figure has. A static figure has exactly one. */
export function stepCount(spec) {
  return Array.isArray(spec.steps) && spec.steps.length > 0 ? spec.steps.length : 1;
}

/** Is this figure scrubbed? */
export function isScrubbed(spec) {
  return stepCount(spec) > 1;
}

/** The frame a reader with no JS sees. Defaults to the last step, which is
 *  the complete picture. */
export function resolveStaticStep(spec) {
  const n = stepCount(spec);
  return Number.isInteger(spec.staticStep) ? spec.staticStep : n - 1;
}

/**
 * The caption convention, section C, exactly.
 * Row 1 left  : fig-<surface>-<nn> · <what it shows>
 * Row 1 right : the grade slot
 * Row 2       : measured only, the provenance line
 */
export function composeCaption(spec) {
  const left = `${spec.id} · ${spec.title}`;
  let right;
  switch (spec.claim) {
    case "measured":
      right = spec.conditions;
      break;
    case "reported":
      right = `reported · ${spec.source}`;
      break;
    case "illustrative":
      right = "illustrative · shape only";
      break;
    default:
      right = "schematic";
  }
  const footnote =
    spec.claim === "measured"
      ? {
          label: spec.provenance.label || "numbers",
          href: spec.provenance.href,
          text: `${spec.provenance.href} →`,
        }
      : null;
  return { left, right, footnote };
}

/**
 * The grade of a single labelled value inside a mixed figure. Measured values
 * carry the accent; everything reported or illustrative is dim. A figure's
 * caption grade is the weakest grade present, which is the caller's job to
 * declare in spec.claim; this only decides ink.
 */
export function valueInk(grade) {
  return grade === "measured" ? "accent" : "dim";
}

/** The step captions, as plain sentences. One array feeds the rail readout,
 *  the aria-live region, and the details walkthrough. */
export function stepCaptions(spec) {
  if (!Array.isArray(spec.steps)) return [];
  return spec.steps.map((s) => s.caption);
}
