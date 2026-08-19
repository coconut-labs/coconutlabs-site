import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { contrastOn } from "@/components/drawings/inks";
import type { DrawNode } from "@/lib/figures/draw.mjs";
import { CATALOG } from "@/lib/figures/examples.mjs";
import { accentSubjects, buildFigure } from "@/lib/figures/geometry.mjs";
import { format } from "@/lib/figures/layouts.mjs";
import { INKS, INK_ROLES } from "@/lib/figures/spec.mjs";
import type { FigureSpec } from "@/lib/figures/spec.mjs";

/* The figure ink set, proved rather than asserted.
 *
 * tests/unit/drawings/inks.test.ts exists because the plate inks needed
 * numeric proof that they clear the body-text floor. The seven --fig-* roles
 * make the same claim across two schemes and two grounds, so they get the same
 * treatment: the values are read out of styles/tokens.css, not retyped here,
 * so a token edit that darkens a ground fails this test rather than shipping. */

const CSS = readFileSync("styles/tokens.css", "utf8");
const DARK_SELECTOR = ':root[data-theme="dark"]';

function schemeBlock(scheme: "light" | "dark"): string {
  if (scheme === "light") return CSS.slice(CSS.indexOf(":root {"), CSS.indexOf(DARK_SELECTOR));
  return CSS.slice(CSS.indexOf(DARK_SELECTOR), CSS.indexOf("@media (prefers-color-scheme"));
}

function token(scheme: "light" | "dark", name: string): string {
  const match = schemeBlock(scheme).match(new RegExp(`--${name}:\\s*(#[0-9A-Fa-f]{6})`));
  if (!match) throw new Error(`token --${name} not found in the ${scheme} block`);
  return match[1]!;
}

/* The role-to-token aliasing declared in styles/figure-tokens.css. */
const ALIAS: Record<string, string> = {
  "fig-ink": "ink-0",
  "fig-dim": "ink-2",
  "fig-accent": "accent",
  "fig-pass": "success",
  "fig-fail": "danger",
};

/* Roles that carry text or a glyph, so they owe the 4.5:1 body floor. --fig-rule
   is a hairline and --fig-well is a ground; neither is ever a label. */
const TEXT_ROLES = Object.keys(ALIAS);
const GROUNDS = [
  ["bg-1", "the figure frame"],
  ["bg-2", "the recessed well"],
] as const;

describe("the figure ink set", () => {
  it("is seven names, all aliases of existing tokens, and adds no color", () => {
    expect(INK_ROLES).toEqual(["ink", "dim", "rule", "accent", "well", "pass", "fail"]);
    for (const value of Object.values(INKS)) {
      expect(value).toMatch(/^var\(--fig-[a-z]+\)$/);
    }
    const sheet = readFileSync("styles/figure-tokens.css", "utf8");
    // Every --fig-* declaration is an alias. No hex, no rgb, anywhere.
    expect(sheet).not.toMatch(/#[0-9A-Fa-f]{3,8}\b/);
    expect(sheet).not.toMatch(/\brgba?\(/);
    for (const [role, alias] of Object.entries(ALIAS)) {
      expect(sheet).toContain(`--${role}: var(--${alias})`);
    }
    expect(sheet).toContain("--fig-rule: var(--rule)");
    expect(sheet).toContain("--fig-well: var(--bg-2)");
  });

  it("defines the roles once, so they follow the theme without a per-scheme block", () => {
    const sheet = readFileSync("styles/figure-tokens.css", "utf8");
    const declarations = sheet.match(/--fig-(ink|dim|rule|accent|well|pass|fail):/g) || [];
    expect(declarations).toHaveLength(7);
  });

  for (const scheme of ["light", "dark"] as const) {
    for (const [ground, description] of GROUNDS) {
      it(`clears the 4.5:1 body floor in ${scheme} on ${description}`, () => {
        const bg = token(scheme, ground);
        for (const role of TEXT_ROLES) {
          const fg = token(scheme, ALIAS[role]!);
          const ratio = contrastOn(fg, bg);
          expect(
            ratio,
            `--${role} (${fg}) on --${ground} (${bg}) in ${scheme} measures ${ratio.toFixed(2)}:1`,
          ).toBeGreaterThanOrEqual(4.5);
        }
      });
    }
  }

  it("names the tightest case, so a token edit that narrows it is visible here", () => {
    // --fig-dim carries 10.5px mono labels, and the light well is the ground it
    // has least room against. Anything under 4.5 here is a legibility defect.
    const ratio = contrastOn(token("light", "ink-2"), token("light", "bg-2"));
    expect(ratio).toBeGreaterThanOrEqual(4.5);
    expect(ratio).toBeLessThan(5);
  });
});

describe("one accent per figure, on the rendered result", () => {
  it.each(CATALOG.map((c) => [c.spec.id, c.spec] as const))(
    "%s accents at most one subject",
    (_id, spec) => {
      expect(accentSubjects(buildFigure(spec as FigureSpec).nodes)).toBeLessThanOrEqual(1);
    },
  );

  it("counts a mark and its own label as one subject, not two", () => {
    // fig-ev-01's accent point and its accent value note are emitted in one
    // group, because they are one thing being pointed at.
    const dist = CATALOG.find((c) => c.entry === "dist")!.spec as FigureSpec;
    expect(accentSubjects(buildFigure(dist).nodes)).toBe(1);
  });

  it("is refused at author time when a panel claims accent alongside the ab delta", () => {
    // Layer one. The ab delta callout is painted accent by the combinator
    // rather than by an ink role, so the validator counts it explicitly; a
    // panel claiming accent as well never reaches the renderer.
    const ab = CATALOG.find((c) => c.entry === "ab")!.spec;
    const sneaky = JSON.parse(JSON.stringify(ab));
    sneaky.a.data.lanes[0].blocks[0].ink = "accent";
    expect(() => buildFigure(sneaky as FigureSpec)).toThrow(
      /2 elements claim the accent ink/,
    );
  });

  it("counts two accented subjects in a rendered tree, whatever the spec said", () => {
    // Layer two, and the one that does not depend on knowing where accent can
    // come from. Two sibling groups, each painting accent, are two subjects.
    const tree: DrawNode[] = [
      { el: "defs", attrs: {}, children: [{ el: "marker", attrs: { fill: "var(--fig-accent)" } }] },
      {
        el: "g",
        attrs: { "data-fig-step": "0" },
        children: [
          { el: "rect", attrs: { stroke: "var(--fig-accent)" } },
          { el: "text", attrs: { fill: "var(--fig-accent)" }, text: "its own label" },
        ],
      },
      { el: "g", attrs: {}, children: [{ el: "text", attrs: { fill: "var(--fig-accent)" }, text: "a delta" }] },
      { el: "g", attrs: {}, children: [{ el: "rect", attrs: { stroke: "var(--fig-dim)" } }] },
    ];
    expect(accentSubjects(tree)).toBe(2);
  });

  it("ignores the arrowhead markers, which are always emitted in all three inks", () => {
    const flow = CATALOG.find((c) => c.entry === "flow")!.spec as FigureSpec;
    const drawing = buildFigure(flow);
    // defs carries an accent marker; the figure itself accents nothing.
    expect(JSON.stringify(drawing.nodes)).toContain("var(--fig-accent)");
    expect(accentSubjects(drawing.nodes)).toBe(0);
  });
});

describe("number formatting", () => {
  it("groups thousands without Intl, so output cannot vary with the ICU build", () => {
    expect(format(1585, "ms")).toBe("1,585 ms");
    expect(format(1234567)).toBe("1,234,567");
    expect(format(999)).toBe("999");
    expect(format(1000)).toBe("1,000");
  });

  it("keeps the fraction intact", () => {
    expect(format(53.9, "ms")).toBe("53.9 ms");
    expect(format(0.2, "nats")).toBe("0.2 nats");
    expect(format(1234.56)).toBe("1,234.56");
  });

  it("handles negatives and passes strings through", () => {
    expect(format(-4500)).toBe("-4,500");
    expect(format("n/a", "ms")).toBe("n/a ms");
  });

  it("never calls into Intl", () => {
    // Matches a call, not the word: the comment above format() names
    // toLocaleString to explain why it is not used.
    const source = readFileSync("lib/figures/layouts.mjs", "utf8");
    expect(source).not.toMatch(/\.toLocaleString\(/);
    expect(source).not.toMatch(/\bIntl\./);
  });
});
