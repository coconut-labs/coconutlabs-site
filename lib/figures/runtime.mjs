/* The step rail runtime. One control across the whole estate.
 *
 * Everything the rail needs is already in the DOM: the geometry, the step
 * ranges, and the captions (read out of the details walkthrough rather than
 * duplicated into a script payload). So this is small, has no dependencies,
 * and never computes geometry.
 *
 * Exported as a string because the three build targets deliver it three ways:
 * the Next app inlines it once in the root layout, the standalone HTML pass
 * appends it before </body>, and the book build concatenates it into the one
 * JS blob it already ships. Keeping it a string keeps all three identical.
 *
 * The source below is deliberately ES5-shaped and free of optional chaining:
 * it is injected verbatim into pages with no build step of their own. */

export const RUNTIME_JS = `(function () {
  "use strict";
  function pad(n) { return n < 10 ? "0" + n : "" + n; }

  function covers(attr, step) {
    var dash = attr.indexOf("-");
    var lo = dash > 0 ? +attr.slice(0, dash) : +attr;
    var hi = dash > 0 ? +attr.slice(dash + 1) : lo;
    return step >= lo && step <= hi;
  }

  function apply(fig, step) {
    var groups = fig.querySelectorAll("[data-fig-step]");
    for (var i = 0; i < groups.length; i++) {
      var el = groups[i];
      if (covers(el.getAttribute("data-fig-step"), step)) el.removeAttribute("data-fig-off");
      else el.setAttribute("data-fig-off", "");
    }
  }

  function mount(fig) {
    if (fig.getAttribute("data-fig-mounted")) return;
    fig.setAttribute("data-fig-mounted", "1");

    var bar = fig.querySelector("[data-fig-controls]");
    if (!bar) return;
    var input = bar.querySelector("input[type=range]");
    if (!input) return;

    var readout = bar.querySelector("[data-fig-readout]");
    var caption = fig.querySelector("[data-fig-caption]");
    var items = fig.querySelectorAll("[data-fig-walkthrough] li");
    var total = items.length || (+input.getAttribute("max") + 1);

    function show(step) {
      apply(fig, step);
      if (readout) readout.textContent = pad(step + 1) + " / " + pad(total);
      if (caption && items[step]) caption.textContent = items[step].textContent;
    }

    input.addEventListener("input", function () { show(+input.value); });

    // The pixel gate screenshots any step deterministically via ?step=N.
    var want = null;
    try {
      var q = new URLSearchParams(window.location.search).get("step");
      if (q !== null && q !== "" && !isNaN(+q)) want = Math.max(0, Math.min(total - 1, +q));
    } catch (e) { want = null; }
    if (want !== null) input.value = String(want);

    // Only now does the rail appear: without JS there is nothing to drag, and
    // a dead control is worse than no control.
    bar.removeAttribute("hidden");
    show(+input.value);
  }

  function scan(root) {
    var figs = (root || document).querySelectorAll("[data-fig]");
    for (var i = 0; i < figs.length; i++) mount(figs[i]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { scan(document); });
  } else {
    scan(document);
  }
  window.coconutFigures = { scan: scan };
})();`;

/** The same runtime, as a function, for tests and for callers that would
 *  rather import than inject. Evaluating the string is what ships; this keeps
 *  the two from drifting because it evaluates that exact string. */
export function attachFigures(win) {
  // eslint-disable-next-line no-new-func
  const run = new win.Function(RUNTIME_JS);
  run.call(win);
  return win.coconutFigures;
}
