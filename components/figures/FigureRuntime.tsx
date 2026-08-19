import { RUNTIME_JS } from "@/lib/figures/runtime.mjs";

/* The step rail runtime, inlined once per page.
 *
 * Mount it once in a layout, not once per figure: it scans for every
 * [data-fig] on the page and is idempotent per figure. Inlined rather than
 * fetched because it is small enough that a request costs more than the bytes,
 * and because the same string is what the standalone HTML pass and the book
 * build append. One source, three targets, no drift.
 *
 * It is a plain <script>, so it runs after parse and never blocks a figure
 * from rendering: the figure is already complete without it. */

export function FigureRuntime() {
  return <script dangerouslySetInnerHTML={{ __html: RUNTIME_JS }} />;
}
