import { beforeEach, describe, expect, it } from "vitest";

import { mapExample, scrubExample, statesExample } from "@/lib/figures/examples.mjs";
import { renderFigure } from "@/lib/figures/render.mjs";
import { attachFigures, RUNTIME_JS } from "@/lib/figures/runtime.mjs";
import type { FigureSpec } from "@/lib/figures/spec.mjs";

/* The rail, driven the way a reader drives it. The runtime under test is the
 * exact string that ships: attachFigures evaluates RUNTIME_JS rather than a
 * parallel implementation, so these assertions cannot drift from production. */

function mount(spec: FigureSpec, search = "") {
  document.body.innerHTML = renderFigure(spec).html;
  if (search) window.history.replaceState({}, "", `/${search}`);
  else window.history.replaceState({}, "", "/");
  attachFigures(window);
  const fig = document.querySelector<HTMLElement>("[data-fig]")!;
  return {
    fig,
    bar: fig.querySelector<HTMLElement>("[data-fig-controls]")!,
    rail: fig.querySelector<HTMLInputElement>("input[type=range]")!,
    readout: fig.querySelector<HTMLElement>("[data-fig-readout]")!,
    caption: fig.querySelector<HTMLElement>("[data-fig-caption]")!,
    groups: () => Array.from(fig.querySelectorAll<SVGElement>("[data-fig-step]")),
    live: () =>
      Array.from(fig.querySelectorAll<SVGElement>("[data-fig-step]")).filter(
        (g) => !g.hasAttribute("data-fig-off"),
      ),
  };
}

function drag(rail: HTMLInputElement, to: number) {
  rail.value = String(to);
  rail.dispatchEvent(new Event("input", { bubbles: true }));
}

beforeEach(() => {
  document.body.innerHTML = "";
  delete (window as unknown as Record<string, unknown>).coconutFigures;
});

describe("mounting", () => {
  it("reveals the rail only once the script has run", () => {
    document.body.innerHTML = renderFigure(mapExample as FigureSpec).html;
    const bar = document.querySelector("[data-fig-controls]")!;
    expect(bar.hasAttribute("hidden")).toBe(true);
    attachFigures(window);
    expect(bar.hasAttribute("hidden")).toBe(false);
  });

  it("is idempotent: a second scan does not double-mount", () => {
    const m = mount(mapExample as FigureSpec);
    expect(m.fig.getAttribute("data-fig-mounted")).toBe("1");
    const api = (window as unknown as { coconutFigures: { scan(): void } }).coconutFigures;
    api.scan();
    api.scan();
    drag(m.rail, 1);
    expect(m.readout.textContent).toBe("02 / 05");
  });

  it("leaves a static figure alone: no rail, nothing to mount", () => {
    document.body.innerHTML = renderFigure(statesExample as FigureSpec).html;
    attachFigures(window);
    expect(document.querySelector("[data-fig-controls]")).toBeNull();
  });

  it("mounts every figure on the page", () => {
    document.body.innerHTML =
      renderFigure(mapExample as FigureSpec).html + renderFigure(scrubExample as FigureSpec).html;
    attachFigures(window);
    const bars = Array.from(document.querySelectorAll("[data-fig-controls]"));
    expect(bars).toHaveLength(2);
    for (const bar of bars) expect(bar.hasAttribute("hidden")).toBe(false);
  });
});

describe("stepping", () => {
  it("shows only the groups the step covers", () => {
    const m = mount(mapExample as FigureSpec);
    drag(m.rail, 0);
    // At step 0 only the CR3 mark is in range; every region starts at step 1.
    const live = m.live();
    expect(live.length).toBe(1);
    expect(live[0]!.getAttribute("data-fig-step")).toBe("0-4");

    drag(m.rail, 4);
    // At the last step every group is in range.
    expect(m.live().length).toBe(m.groups().length);
  });

  it("adds one bar per step in the scrubbed dist", () => {
    const m = mount(scrubExample as FigureSpec);
    const counts: number[] = [];
    for (let i = 0; i < 6; i += 1) {
      drag(m.rail, i);
      counts.push(m.live().length);
    }
    // Monotonic: each step reveals more than the last, never fewer.
    for (let i = 1; i < counts.length; i += 1) {
      expect(counts[i]!).toBeGreaterThan(counts[i - 1]!);
    }
    expect(counts[0]).toBe(1);
    expect(counts[5]).toBe(7); // six phi values plus the gate line
  });

  it("is reversible: stepping back restores the earlier frame exactly", () => {
    const m = mount(scrubExample as FigureSpec);
    drag(m.rail, 2);
    const at2 = m.groups().map((g) => g.hasAttribute("data-fig-off"));
    drag(m.rail, 5);
    drag(m.rail, 2);
    expect(m.groups().map((g) => g.hasAttribute("data-fig-off"))).toEqual(at2);
  });

  it("updates the readout as one-based, zero-padded", () => {
    const m = mount(scrubExample as FigureSpec);
    drag(m.rail, 0);
    expect(m.readout.textContent).toBe("01 / 06");
    drag(m.rail, 5);
    expect(m.readout.textContent).toBe("06 / 06");
  });

  it("announces the step sentence, taken from the walkthrough", () => {
    const m = mount(scrubExample as FigureSpec);
    drag(m.rail, 2);
    expect(m.caption.textContent).toBe(scrubExample.steps![2]!.caption);
    expect(m.caption.getAttribute("aria-live")).toBe("polite");
  });
});

describe("keyboard", () => {
  it("is a native range input, so the arrow keys are free", () => {
    const m = mount(mapExample as FigureSpec);
    expect(m.rail.tagName).toBe("INPUT");
    expect(m.rail.type).toBe("range");
    expect(m.rail.min).toBe("0");
    expect(m.rail.max).toBe("4");
    expect(m.rail.step).toBe("1");
    // In tab order, and named.
    expect(m.rail.hasAttribute("disabled")).toBe(false);
    expect(m.rail.getAttribute("tabindex")).toBeNull();
    const label = m.fig.querySelector<HTMLLabelElement>("label")!;
    expect(label.htmlFor).toBe(m.rail.id);
  });

  it("moves a step when the value changes, however the value changed", () => {
    const m = mount(mapExample as FigureSpec);
    // A keyboard arrow sets .value and fires input; that is the whole contract.
    drag(m.rail, 3);
    expect(m.readout.textContent).toBe("04 / 05");
    drag(m.rail, 0);
    expect(m.readout.textContent).toBe("01 / 05");
  });
});

describe("deep linking for the pixel gate", () => {
  it("honours ?step=N", () => {
    const m = mount(scrubExample as FigureSpec, "?step=1");
    expect(m.rail.value).toBe("1");
    expect(m.readout.textContent).toBe("02 / 06");
    expect(m.live().length).toBe(2);
  });

  it("clamps a step outside the range instead of blanking the figure", () => {
    const high = mount(scrubExample as FigureSpec, "?step=99");
    expect(high.rail.value).toBe("5");
    const low = mount(scrubExample as FigureSpec, "?step=-4");
    expect(low.rail.value).toBe("0");
  });

  it("ignores a non-numeric step", () => {
    const m = mount(scrubExample as FigureSpec, "?step=banana");
    expect(m.rail.value).toBe(String(scrubExample.staticStep));
  });
});

describe("the runtime payload", () => {
  it("has no dependencies and touches no network", () => {
    expect(RUNTIME_JS).not.toMatch(/\bimport\b|\brequire\(|fetch\(|XMLHttpRequest/);
  });

  it("stays small enough to inline", () => {
    expect(RUNTIME_JS.length).toBeLessThan(4096);
  });

  it("computes no geometry: it only moves one attribute", () => {
    expect(RUNTIME_JS).not.toMatch(/getBoundingClientRect|Math\.(sin|cos|log|pow)/);
    expect(RUNTIME_JS).toContain("data-fig-off");
  });
});
