import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Figure } from "@/components/figures/Figure";
import { CATALOG } from "@/lib/figures/examples.mjs";
import { renderFigure } from "@/lib/figures/render.mjs";
import type { FigureSpec } from "@/lib/figures/spec.mjs";

/* One authoring format, two emitters, one result.
 *
 * The whole toolkit rests on this: a figure authored once must come out the
 * same through the React path (the Next app) and the string path (standalone
 * HTML, the book build). If these two ever diverge, a figure looks different
 * depending on which surface a reader lands on, and the pixel gate is
 * measuring one of two truths.
 *
 * Both sides are parsed by the same HTML parser before comparison, so the
 * comparison is of the resulting document, not of two spellings of it:
 * attribute order, self-closing style, and boolean-attribute spelling are all
 * differences that do not reach a reader. */

type Shape = {
  tag: string;
  attrs: [string, string][];
  text: string;
};

function shapeOf(html: string): Shape[] {
  const host = document.createElement("div");
  host.innerHTML = html;
  const out: Shape[] = [];
  const walk = (el: Element) => {
    out.push({
      tag: el.tagName.toLowerCase(),
      attrs: Array.from(el.attributes)
        .map((a) => [a.name, a.value] as [string, string])
        .sort((a, b) => a[0].localeCompare(b[0])),
      // Only leaf text is compared; a parent's textContent is just its
      // children's, already compared on their own rows.
      text: el.children.length === 0 ? (el.textContent || "").trim() : "",
    });
    for (const child of Array.from(el.children)) walk(child);
  };
  for (const child of Array.from(host.children)) walk(child);
  return out;
}

const SPECS = CATALOG.map((c) => c.spec as FigureSpec);

describe("React and the vanilla renderer agree", () => {
  it.each(SPECS.map((s) => [s.id, s] as const))("%s", (_id, spec) => {
    const fromReact = shapeOf(renderToStaticMarkup(<Figure spec={spec} />));
    const fromString = shapeOf(renderFigure(spec).html);

    expect(fromReact.length).toBe(fromString.length);
    expect(fromReact.map((n) => n.tag)).toEqual(fromString.map((n) => n.tag));
    expect(fromReact).toEqual(fromString);
  });

  it("emits a real element count, not an empty tree", () => {
    const shape = shapeOf(renderFigure(SPECS[0]!).html);
    expect(shape.length).toBeGreaterThan(20);
    expect(shape.filter((n) => n.tag === "svg")).toHaveLength(1);
  });
});

describe("the React path preserves the mechanism", () => {
  it("keeps data-fig-off, which is what makes the no-JS frame real", () => {
    // The shipped static frame is the last step, where every group is in
    // range and nothing is stamped off. Pin an earlier frame so there is
    // something to hide, and check React carries the attribute through.
    const scrubbed = { ...SPECS.find((s) => s.steps)!, staticStep: 0 } as FigureSpec;
    const markup = renderToStaticMarkup(<Figure spec={scrubbed} />);
    expect(markup).toContain("data-fig-step");
    expect(markup).toContain("data-fig-off");
    expect(shapeOf(markup)).toEqual(shapeOf(renderFigure(scrubbed).html));
  });

  it("shows everything at the last step, where nothing is out of range", () => {
    const scrubbed = SPECS.find((s) => s.steps)!;
    expect(renderToStaticMarkup(<Figure spec={scrubbed} />)).not.toContain("data-fig-off");
  });

  it("keeps every SVG presentation attribute across the camelCase conversion", () => {
    for (const spec of SPECS) {
      const markup = renderToStaticMarkup(<Figure spec={spec} />);
      const vanilla = renderFigure(spec).svg;
      for (const attr of ["stroke-width", "text-anchor", "font-size"]) {
        if (!vanilla.includes(attr)) continue;
        expect(markup).toContain(attr);
      }
    }
  });

  it("refuses an SVG attribute it has no mapping for, rather than dropping it", async () => {
    const { drawNode } = await import("@/components/figures/Draw");
    expect(() => drawNode({ el: "rect", attrs: { "shape-rendering": "crispEdges" } }, "0")).toThrow(
      /no React mapping/,
    );
  });

  it("renders zero client components: the whole figure is server output", () => {
    const source = renderToStaticMarkup(<Figure spec={SPECS[0]!} />);
    expect(source).not.toContain("$RC");
    expect(source).not.toContain("<template");
  });
});
