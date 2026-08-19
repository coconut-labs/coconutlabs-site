import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import type { DrawNode } from "@/lib/figures/draw.mjs";
import { CATALOG } from "@/lib/figures/examples.mjs";
import { buildFigure, stampStatic } from "@/lib/figures/geometry.mjs";
import { escapeHtml, renderFigure, renderPage } from "@/lib/figures/render.mjs";
import { stepCovers } from "@/lib/figures/scale.mjs";
import type { FigureSpec } from "@/lib/figures/spec.mjs";

const SPECS = CATALOG.map((c) => c.spec as FigureSpec);

function flatten(nodes: DrawNode[]): DrawNode[] {
  return nodes.flatMap((n) => [n, ...(n.children ? flatten(n.children) : [])]);
}

describe("purity", () => {
  it.each(SPECS.map((s) => [s.id, s] as const))(
    "%s renders byte-identically twice",
    (_id, spec) => {
      const a = renderFigure(spec);
      const b = renderFigure(spec);
      expect(a.html).toBe(b.html);
      expect(a.svg).toBe(b.svg);
      expect(a.html.length).toBeGreaterThan(200);
    },
  );

  it("builds an identical object graph twice", () => {
    for (const spec of SPECS) {
      expect(buildFigure(spec)).toEqual(buildFigure(spec));
    }
  });

  it("does not vary with call order", () => {
    const forwards = SPECS.map((s) => renderFigure(s).html);
    const backwards = [...SPECS].reverse().map((s) => renderFigure(s).html).reverse();
    expect(forwards).toEqual(backwards);
  });
});

describe("the static frame", () => {
  it("stamps data-fig-off on exactly the groups the step misses", () => {
    const nodes: DrawNode[] = [
      { el: "g", attrs: { "data-fig-step": "0-2" }, children: [] },
      { el: "g", attrs: { "data-fig-step": "3" }, children: [] },
      { el: "g", attrs: {}, children: [] },
    ];
    const stamped = stampStatic(nodes, 1);
    expect(stamped[0]!.attrs["data-fig-off"]).toBeUndefined();
    expect(stamped[1]!.attrs["data-fig-off"]).toBe("");
    expect(stamped[2]!.attrs["data-fig-off"]).toBeUndefined();
  });

  it("stamps nested groups too", () => {
    const nodes = [
      { el: "g", attrs: {}, children: [{ el: "g", attrs: { "data-fig-step": "5" }, children: [] }] },
    ];
    const stamped = stampStatic(nodes, 0);
    expect(stamped[0]!.children![0]!.attrs["data-fig-off"]).toBe("");
  });

  it("leaves every scrubbed figure showing a real frame, not a blank", () => {
    for (const spec of SPECS) {
      const drawing = buildFigure(spec);
      const groups = flatten(drawing.nodes).filter((n) => n.attrs["data-fig-step"] !== undefined);
      if (groups.length === 0) continue;
      const live = groups.filter((n) => n.attrs["data-fig-off"] === undefined);
      expect(live.length).toBeGreaterThan(0);
      for (const node of live) {
        expect(stepCovers(String(node.attrs["data-fig-step"]), drawing.staticStep)).toBe(true);
      }
      for (const node of groups.filter((n) => n.attrs["data-fig-off"] === "")) {
        expect(stepCovers(String(node.attrs["data-fig-step"]), drawing.staticStep)).toBe(false);
      }
    }
  });

  it("hides the rail until JS removes the attribute, so no control is ever dead", () => {
    const { html } = renderFigure(SPECS.find((s) => s.steps)!);
    expect(html).toContain('data-fig-controls hidden');
  });

  it("emits no rail at all for a static figure", () => {
    const staticSpec = SPECS.find((s) => !s.steps)!;
    const { html } = renderFigure(staticSpec);
    expect(html).not.toContain("data-fig-controls");
    expect(html).not.toContain("fig-read");
  });
});

describe("reduced motion", () => {
  it("collapses the cross-fade to zero and leaves the rail working", () => {
    const css = readFileSync("styles/figure-tokens.css", "utf8");
    const block = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(block).toMatch(/transition-duration:\s*0ms/);
    // The rail is not disabled, hidden, or pointer-events-none anywhere in the
    // reduced-motion block: reduced motion is not reduced interaction.
    const guard = block.slice(0, block.indexOf("}", block.indexOf("}") + 1));
    expect(guard).not.toMatch(/display:\s*none/);
    expect(guard).not.toMatch(/pointer-events/);
  });

  it("gives every step a static frame, which is what reduced motion shows", () => {
    const spec = SPECS.find((s) => s.steps && s.steps.length > 2)!;
    const drawing = buildFigure(spec);
    for (let step = 0; step < drawing.stepCount; step += 1) {
      const framed = stampStatic(drawing.nodes, step);
      const live = flatten(framed).filter(
        (n) => n.attrs["data-fig-step"] !== undefined && n.attrs["data-fig-off"] === undefined,
      );
      expect(live.length).toBeGreaterThan(0);
    }
  });
});

describe("the honesty rule, in the output", () => {
  it("never emits a color literal: ink is a named role only", () => {
    for (const spec of SPECS) {
      const { svg } = renderFigure(spec);
      expect(svg).not.toMatch(/#[0-9A-Fa-f]{3,8}\b/);
      expect(svg).not.toMatch(/\brgb\(/);
      expect(svg).toContain("var(--fig-");
    }
  });

  it("never emits a radius other than the one radius", () => {
    for (const spec of SPECS) {
      const rs = renderFigure(spec).svg.match(/\br[xy]="([^"]+)"/g) || [];
      for (const r of rs) expect(["2"]).toContain(r.replace(/\br[xy]="|"/g, ""));
    }
  });

  it("never sets a font-family literal in the SVG: the face is a token in CSS", () => {
    for (const spec of SPECS) {
      expect(renderFigure(spec).svg).not.toContain("font-family");
    }
  });

  it("carries the provenance row on measured figures and only on those", () => {
    for (const spec of SPECS) {
      const { html } = renderFigure(spec);
      if (spec.claim === "measured") {
        expect(html).toContain("fig-provenance");
        expect(html).toContain(spec.provenance!.href);
      } else {
        expect(html).not.toContain("fig-provenance");
      }
    }
  });

  it("puts the grade in the right caption slot", () => {
    const measured = renderFigure(SPECS.find((s) => s.claim === "measured")!);
    expect(measured.caption.right).toContain("n=311");
    const illustrative = renderFigure(SPECS.find((s) => s.claim === "illustrative")!);
    expect(illustrative.caption.right).toBe("illustrative · shape only");
    const schematic = renderFigure(SPECS.find((s) => s.claim === "schematic")!);
    expect(schematic.caption.right).toBe("schematic");
  });

  it("refuses to render a spec that cannot state its claim", () => {
    const spec = { ...SPECS[0], claim: undefined } as unknown as FigureSpec;
    expect(() => renderFigure(spec)).toThrow(/missing claim/);
  });
});

describe("accessibility of the emitted markup", () => {
  it("gives every figure an accessible name that does not change per step", () => {
    for (const spec of SPECS) {
      const { svg, alt } = renderFigure(spec);
      expect(svg).toContain('role="img"');
      expect(svg).toContain(`aria-label="${escapeHtml(alt)}"`);
      expect(alt.trim().length).toBeGreaterThan(40);
    }
  });

  it("labels the rail and announces the step politely", () => {
    for (const spec of SPECS.filter((s) => s.steps)) {
      const { html } = renderFigure(spec);
      expect(html).toContain(`for="${spec.id}-rail"`);
      expect(html).toContain(`id="${spec.id}-rail"`);
      expect(html).toContain('aria-live="polite"');
      expect(html).toContain(`aria-describedby="${spec.id}-step"`);
    }
  });

  it("gives the rail one tick stop per step", () => {
    for (const spec of SPECS.filter((s) => s.steps)) {
      const { html, steps } = renderFigure(spec);
      const options = html.match(/<option value="\d+"><\/option>/g) || [];
      expect(options).toHaveLength(steps.length);
      expect(html).toContain(`max="${steps.length - 1}"`);
    }
  });

  it("carries every step sentence as prose in the walkthrough", () => {
    for (const spec of SPECS.filter((s) => s.steps)) {
      const { html, steps } = renderFigure(spec);
      const items = html.match(/<li>/g) || [];
      expect(items).toHaveLength(steps.length);
      for (const step of steps) expect(html).toContain(escapeHtml(step));
    }
  });
});

describe("escaping", () => {
  it("escapes the five characters that matter", () => {
    expect(escapeHtml(`<a href="x">&'`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&#39;");
  });

  it("escapes an alt containing markup rather than emitting it", () => {
    const spec = {
      ...SPECS[0],
      alt: 'A "quoted" <thing> & another',
    } as FigureSpec;
    const { svg } = renderFigure(spec);
    expect(svg).not.toContain("<thing>");
    expect(svg).toContain("&lt;thing&gt;");
  });
});

describe("renderPage", () => {
  it("emits every figure and the runtime exactly once", () => {
    const page = renderPage(SPECS);
    expect(page.figures).toHaveLength(SPECS.length);
    expect((page.script.match(/<script>/g) || []).length).toBe(1);
    for (const spec of SPECS) expect(page.html).toContain(`data-fig="${spec.id}"`);
  });

  it("produces a self-contained page: no src, no href to a script or sheet", () => {
    const page = renderPage(SPECS);
    expect(page.html).not.toContain("<script");
    expect(page.script).not.toContain("src=");
  });
});
