import { describe, expect, it } from "vitest";
import { InvalidRequestError } from "@/server/errors";
import { assessComparison, MAX_PERIOD_DAYS, resolvePeriod } from "@/server/services/report-scope";

const TODAY = "2026-10-05";

describe("resolvePeriod", () => {
  it("turns a preset into dates relative to today at the club", () => {
    expect(resolvePeriod({ kind: "preset", preset: "last-8-weeks" }, TODAY)).toEqual({
      from: "2026-08-10",
      to: "2026-10-04",
    });
  });

  it("accepts custom dates up to and including today", () => {
    expect(resolvePeriod({ kind: "custom", from: "2026-10-05", to: "2026-10-05" }, TODAY)).toEqual({
      from: "2026-10-05",
      to: "2026-10-05",
    });
  });

  it(`allows up to ${MAX_PERIOD_DAYS} days and no more`, () => {
    expect(() => resolvePeriod({ kind: "custom", from: "2025-10-05", to: "2026-10-05" }, TODAY)).not.toThrow();
    expect(() => resolvePeriod({ kind: "custom", from: "2025-10-04", to: "2026-10-05" }, TODAY)).toThrow(
      InvalidRequestError,
    );
  });

  it.each([
    ["2026-09-10", "2026-09-01", /on or before/],
    ["2026-09-01", "2026-10-06", /later than today/],
    ["2026-9-1", "2026-09-30", /real calendar days/],
  ])("rejects %s to %s", (from, to, message) => {
    expect(() => resolvePeriod({ kind: "custom", from, to }, TODAY)).toThrow(message);
  });
});

describe("assessComparison", () => {
  it("compares when the period before lies after the first session", () => {
    expect(assessComparison({ from: "2026-08-10", to: "2026-09-06" }, "2026-01-05")).toEqual({ available: true });
  });

  it("allows a period before that starts on the first session's day", () => {
    expect(assessComparison({ from: "2026-01-05", to: "2026-02-01" }, "2026-01-05")).toEqual({ available: true });
  });

  it("doesn't compare with a period that is partly before the first session", () => {
    expect(assessComparison({ from: "2026-01-04", to: "2026-01-31" }, "2026-01-05")).toEqual({
      available: false,
      reason: "starts_before_first_session",
    });
  });

  it("doesn't compare at all before the first session", () => {
    expect(assessComparison({ from: "2026-08-10", to: "2026-09-06" }, null)).toEqual({
      available: false,
      reason: "no_sessions_yet",
    });
  });
});
