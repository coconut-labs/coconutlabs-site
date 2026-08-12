import { describe, expect, it } from "vitest";
import { ACCENT, INK, INK_DIM, PLATE, contrastOn } from "@/components/drawings/inks";

/* The working drawings live on the constant dark plate, so their inks are
 * pinned hexes rather than theme tokens. This suite is the contract: every
 * ink that carries a label clears the 4.5:1 body-text floor on the plate.
 * The smallest label in the drawings is 10.5px mono, which is body-size,
 * not large-text, so 4.5 is the right threshold. */

describe("drawing plate inks", () => {
  it("primary ink clears 4.5:1 on the plate", () => {
    expect(contrastOn(INK, PLATE)).toBeGreaterThanOrEqual(4.5);
  });

  it("dim ink, which carries 10.5px labels, clears 4.5:1 on the plate", () => {
    expect(contrastOn(INK_DIM, PLATE)).toBeGreaterThanOrEqual(4.5);
  });

  it("accent, which carries the measured dimensions, clears 4.5:1 on the plate", () => {
    expect(contrastOn(ACCENT, PLATE)).toBeGreaterThanOrEqual(4.5);
  });
});
