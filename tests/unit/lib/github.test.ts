import { describe, expect, it } from "vitest";
import { getRepoSignals } from "@/lib/github";
import snapshot from "@/content/signals.json";

/* Signals are a committed snapshot now (content/signals.json, refreshed by
   the nightly cadence workflow), not a build-time fetch. The tests pin the
   contract: the lib returns the committed file verbatim, and the snapshot
   itself stays well-formed so a bad nightly write fails the gate here. */
describe("github signals", () => {
  it("returns the committed snapshot verbatim", async () => {
    const signals = await getRepoSignals();
    expect(signals).toEqual(snapshot);
  });

  it("snapshot is well-formed", async () => {
    const signals = await getRepoSignals();
    expect(signals.repos).toBeGreaterThan(0);
    expect(signals.openIssues).toBeGreaterThanOrEqual(0);
    expect(signals.updatedLabel).toMatch(/^updated \d{4}-\d{2}-\d{2}$|^updated recently$/);
    expect(signals.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    if (signals.commitsThisWeek !== null) {
      expect(signals.commitsThisWeek).toBeGreaterThanOrEqual(0);
    }
  });
});
