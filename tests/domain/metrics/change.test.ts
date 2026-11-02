import { describe, expect, it } from "vitest";
import { countChange, rateChange } from "@/domain/metrics/change";

describe("countChange", () => {
  it("gives the difference and the relative change", () => {
    expect(countChange(110, 100, true)).toEqual({ absolute: 10, relative: 0.1 });
    expect(countChange(90, 100, true)).toEqual({ absolute: -10, relative: -0.1 });
  });

  it("has no relative change when the previous value was zero", () => {
    expect(countChange(5, 0, true)).toEqual({ absolute: 5, relative: null });
  });

  it("gives nothing when the previous period isn't comparable", () => {
    expect(countChange(110, 100, false)).toBeNull();
  });
});

describe("rateChange", () => {
  it("gives the difference in the rate, without a relative change", () => {
    expect(rateChange(0.1, 0.08)?.absolute).toBeCloseTo(0.02, 10);
    expect(rateChange(0.1, 0.08)?.relative).toBeNull();
  });

  it("gives nothing when either rate is unknown", () => {
    expect(rateChange(null, 0.08)).toBeNull();
    expect(rateChange(0.1, null)).toBeNull();
  });
});
