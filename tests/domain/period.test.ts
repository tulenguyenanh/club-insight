import { describe, expect, it } from "vitest";
import {
  containsDate,
  isRangePreset,
  lastFullWeeks,
  periodForPreset,
  periodLength,
  previousPeriod,
  weeksOf,
} from "@/domain/period";

describe("presets", () => {
  it("'last 4 weeks' on a Monday means the four complete weeks before it", () => {
    expect(lastFullWeeks(4, "2026-10-05")).toEqual({ from: "2026-09-07", to: "2026-10-04" });
  });

  it("leaves out the current week however far into it we are", () => {
    expect(lastFullWeeks(4, "2026-10-11")).toEqual({ from: "2026-09-07", to: "2026-10-04" });
  });

  it.each([
    ["last-4-weeks", 28],
    ["last-8-weeks", 56],
    ["last-13-weeks", 91],
    ["last-26-weeks", 182],
  ] as const)("%s covers %i days, Monday to Sunday", (preset, days) => {
    const period = periodForPreset(preset, "2026-10-05");

    expect(periodLength(period)).toBe(days);
    expect(period.to).toBe("2026-10-04");
  });

  it("only recognises its own preset names", () => {
    expect(isRangePreset("last-13-weeks")).toBe(true);
    expect(isRangePreset("last-3-weeks")).toBe(false);
    expect(isRangePreset("toString")).toBe(false);
    expect(isRangePreset("")).toBe(false);
  });
});

describe("the period before", () => {
  it("has the same number of days and ends the day before", () => {
    expect(previousPeriod({ from: "2026-09-07", to: "2026-10-04" })).toEqual({ from: "2026-08-10", to: "2026-09-06" });
  });

  it("counts days, not months", () => {
    expect(previousPeriod({ from: "2026-03-01", to: "2026-03-31" })).toEqual({ from: "2026-01-29", to: "2026-02-28" });
  });

  it("works for a single day", () => {
    expect(previousPeriod({ from: "2026-10-05", to: "2026-10-05" })).toEqual({ from: "2026-10-04", to: "2026-10-04" });
  });
});

describe("weeks of a period", () => {
  it("are whole when the period is whole weeks", () => {
    const weeks = weeksOf({ from: "2026-09-07", to: "2026-10-04" });

    expect(weeks.map((w) => w.weekStart)).toEqual(["2026-09-07", "2026-09-14", "2026-09-21", "2026-09-28"]);
    expect(weeks.every((w) => !w.isPartial)).toBe(true);
  });

  it("are clipped and marked partial at ragged ends", () => {
    expect(weeksOf({ from: "2026-09-02", to: "2026-09-15" })).toEqual([
      { weekStart: "2026-08-31", from: "2026-09-02", to: "2026-09-06", isPartial: true },
      { weekStart: "2026-09-07", from: "2026-09-07", to: "2026-09-13", isPartial: false },
      { weekStart: "2026-09-14", from: "2026-09-14", to: "2026-09-15", isPartial: true },
    ]);
  });

  it("can be a single day", () => {
    expect(weeksOf({ from: "2026-10-01", to: "2026-10-01" })).toEqual([
      { weekStart: "2026-09-28", from: "2026-10-01", to: "2026-10-01", isPartial: true },
    ]);
  });

  it("knows which days it contains", () => {
    const period = { from: "2026-09-07", to: "2026-10-04" };

    expect(containsDate(period, "2026-09-07")).toBe(true);
    expect(containsDate(period, "2026-10-04")).toBe(true);
    expect(containsDate(period, "2026-10-05")).toBe(false);
  });
});
