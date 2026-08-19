import { describe, expect, it } from "vitest";

import { distExample, mapExample, stackExample } from "@/lib/figures/examples.mjs";
import {
  composeCaption,
  countAccents,
  ink,
  isScrubbed,
  resolveStaticStep,
  stepCount,
  validateSpec,
} from "@/lib/figures/spec.mjs";
import type { FigureSpec } from "@/lib/figures/spec.mjs";

/** A minimal valid spec to mutate per case, so each test changes one thing. */
function base(): FigureSpec {
  return {
    id: "fig-test-01",
    type: "stack",
    claim: "schematic",
    title: "a stack",
    alt: "One band on top of another.",
    width: 880,
    data: { bands: [{ label: "TOP" }, { label: "BOTTOM" }] },
  } as FigureSpec;
}

describe("the claim gate", () => {
  it("refuses a figure with no claim", () => {
    const spec = { ...base(), claim: undefined } as unknown as FigureSpec;
    expect(() => validateSpec(spec)).toThrow(/missing claim/);
  });

  it("refuses a claim outside the four grades", () => {
    const spec = { ...base(), claim: "probably" } as unknown as FigureSpec;
    expect(() => validateSpec(spec)).toThrow(/claim must be one of/);
  });

  it("refuses measured without conditions", () => {
    const spec = { ...base(), claim: "measured", provenance: { href: "/x" } } as FigureSpec;
    expect(() => validateSpec(spec)).toThrow(/requires conditions/);
  });

  it("refuses measured without provenance", () => {
    const spec = { ...base(), claim: "measured", conditions: "1x A100 · n=311" } as FigureSpec;
    expect(() => validateSpec(spec)).toThrow(/requires provenance/);
  });

  it("refuses reported without a source", () => {
    const spec = { ...base(), claim: "reported" } as FigureSpec;
    expect(() => validateSpec(spec)).toThrow(/requires source/);
  });

  it("accepts illustrative and schematic with nothing extra", () => {
    expect(() => validateSpec({ ...base(), claim: "illustrative" } as FigureSpec)).not.toThrow();
    expect(() => validateSpec(base())).not.toThrow();
  });
});

describe("structural rules", () => {
  it("refuses an id that is not fig-surface-nn", () => {
    const spec = { ...base(), id: "page-walk" } as FigureSpec;
    expect(() => validateSpec(spec)).toThrow(/fig-<surface>-<nn>/);
  });

  it("refuses an unknown type", () => {
    const spec = { ...base(), type: "sankey" } as unknown as FigureSpec;
    expect(() => validateSpec(spec)).toThrow(/type must be one of/);
  });

  it("refuses a figure with no alt", () => {
    const spec = { ...base(), alt: "" } as FigureSpec;
    expect(() => validateSpec(spec)).toThrow(/alt paragraph/);
  });

  it("refuses a single-step steps array", () => {
    const spec = { ...base(), steps: [{ caption: "the only one" }] } as FigureSpec;
    expect(() => validateSpec(spec)).toThrow(/single step is a static figure/);
  });

  it("refuses a step with no caption", () => {
    const spec = { ...base(), steps: [{ caption: "a" }, { caption: "" }] } as FigureSpec;
    expect(() => validateSpec(spec)).toThrow(/step 1 needs a caption/);
  });

  it("refuses a staticStep outside the step range", () => {
    const spec = {
      ...base(),
      steps: [{ caption: "a" }, { caption: "b" }],
      staticStep: 4,
    } as FigureSpec;
    expect(() => validateSpec(spec)).toThrow(/outside 0\.\.1/);
  });
});

describe("one accent per figure", () => {
  it("counts nested ink roles", () => {
    expect(countAccents({ items: [{ ink: "dim" }, { ink: "accent" }] })).toBe(1);
    expect(countAccents({ a: { b: [{ ink: "accent" }] }, c: { ink: "accent" } })).toBe(2);
    expect(countAccents({ ink: "accent" })).toBe(1);
  });

  it("does not count the string 'accent' where it is not an ink", () => {
    expect(countAccents({ label: "accent", items: [] })).toBe(0);
  });

  it("refuses two accents", () => {
    const spec = {
      ...base(),
      data: { bands: [{ label: "A", ink: "accent" }, { label: "B", ink: "accent" }] },
    } as FigureSpec;
    expect(() => validateSpec(spec)).toThrow(/2 elements claim the accent ink/);
  });

  it("counts a stack's you-are-here marker as the accent", () => {
    const spec = {
      ...base(),
      data: { bands: [{ label: "A", ink: "accent" }, { label: "B" }], here: 1 },
    } as FigureSpec;
    expect(() => validateSpec(spec)).toThrow(/2 elements claim the accent ink/);
    // the shipped example uses `here` alone, and passes
    expect(() => validateSpec(stackExample as FigureSpec)).not.toThrow();
  });
});

describe("no color literals in a spec", () => {
  it("refuses a hex in the data", () => {
    const spec = {
      ...base(),
      data: { bands: [{ label: "A", ink: "#2440CC" }] },
    } as unknown as FigureSpec;
    expect(() => validateSpec(spec)).toThrow(/names a color literal/);
  });

  it("resolves ink roles to custom properties, never to hex", () => {
    expect(ink("accent")).toBe("var(--fig-accent)");
    expect(ink("dim")).toBe("var(--fig-dim)");
    expect(ink()).toBe("var(--fig-ink)");
  });

  it("refuses an unknown ink role rather than falling back to black", () => {
    expect(() => ink("brand" as never)).toThrow(/unknown role/);
  });
});

describe("the caption convention", () => {
  it("writes a measured caption as the full regime", () => {
    const caption = composeCaption(distExample as FigureSpec);
    expect(caption.left).toBe("fig-ev-01 · quiet-tenant TTFT p99");
    expect(caption.right).toBe("1x A100 · Llama-3.1-8B · vLLM 0.19.1 · n=311 · 300 s");
    expect(caption.footnote).toEqual({
      label: "numbers",
      href: "/evidence/benchmarks",
      text: "/evidence/benchmarks →",
    });
  });

  it("writes a reported caption as who, what, when", () => {
    const spec = {
      ...base(),
      id: "fig-es-10",
      title: "an 80 GB card as real estate",
      claim: "reported",
      source: "Kwon et al., vLLM · 2023",
    } as FigureSpec;
    const caption = composeCaption(spec);
    expect(caption.left).toBe("fig-es-10 · an 80 GB card as real estate");
    expect(caption.right).toBe("reported · Kwon et al., vLLM · 2023");
    expect(caption.footnote).toBeNull();
  });

  it("writes illustrative as shape only", () => {
    expect(composeCaption(mapExample as FigureSpec).right).toBe("illustrative · shape only");
  });

  it("writes schematic as one word, with no provenance row", () => {
    const caption = composeCaption(base());
    expect(caption.right).toBe("schematic");
    expect(caption.footnote).toBeNull();
  });
});

describe("step bookkeeping", () => {
  it("treats a figure with no steps as one static step", () => {
    expect(stepCount(base())).toBe(1);
    expect(isScrubbed(base())).toBe(false);
    expect(resolveStaticStep(base())).toBe(0);
  });

  it("defaults the static frame to the last step, the complete picture", () => {
    const spec = { ...base(), steps: [{ caption: "a" }, { caption: "b" }, { caption: "c" }] };
    expect(stepCount(spec as FigureSpec)).toBe(3);
    expect(isScrubbed(spec as FigureSpec)).toBe(true);
    expect(resolveStaticStep(spec as FigureSpec)).toBe(2);
  });

  it("honours an explicit static frame", () => {
    expect(resolveStaticStep(mapExample as FigureSpec)).toBe(4);
  });
});
