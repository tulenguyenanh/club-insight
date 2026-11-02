import { describe, expect, it } from "vitest";
import {
  describeTimeZone,
  formatChange,
  formatCount,
  formatDateTime,
  formatDay,
  formatPercent,
  formatPeriod,
  formatTime,
  isUnchanged,
  plural,
} from "@/ui/lib/format";
import { HCMC } from "../../support/builders";

describe("dates", () => {
  it("shows a calendar day the same wherever the viewer is", () => {
    expect(formatDay("2026-10-05")).toBe("5 Oct");
    expect(formatDay("2026-10-05", { weekday: true, year: true })).toBe("Mon, 5 Oct 2026");
  });

  it("states the year once for a period within a year, twice across years", () => {
    expect(formatPeriod({ from: "2026-08-10", to: "2026-10-04" })).toBe("10 Aug – 4 Oct 2026");
    expect(formatPeriod({ from: "2025-12-29", to: "2026-01-04" })).toBe("29 Dec 2025 – 4 Jan 2026");
  });

  it("shows times in the club's time zone, not the viewer's", () => {
    const sundayNightUtc = "2026-01-04T22:30:00Z";

    expect(formatDateTime(sundayNightUtc, HCMC)).toBe("Mon 5 Jan, 05:30");
    expect(formatTime(sundayNightUtc, HCMC)).toBe("05:30");
    expect(formatDateTime(sundayNightUtc, "Europe/London")).toBe("Sun 4 Jan, 22:30");
  });

  it("names the club's time zone and its offset", () => {
    expect(describeTimeZone(HCMC, new Date("2026-10-05T02:00:00Z"))).toBe("Ho Chi Minh time (GMT+7)");
  });
});

describe("numbers", () => {
  it("formats counts, percentages and plurals", () => {
    expect(formatCount(1733)).toBe("1,733");
    expect(formatPercent(15 / 151)).toBe("9.9%");
    expect(formatPercent(0.825, 0)).toBe("83%");
    expect(plural(1, "session")).toBe("1 session");
    expect(plural(2, "session")).toBe("2 sessions");
  });
});

describe("changes", () => {
  it("shows counts with their relative change, and rates in points", () => {
    expect(formatChange({ absolute: 1, relative: 1 / 88 }, "count")).toBe("+1 (+1%)");
    expect(formatChange({ absolute: -12, relative: -0.25 }, "count")).toBe("−12 (−25%)");
    expect(formatChange({ absolute: 20, relative: null }, "count")).toBe("+20");
    expect(formatChange({ absolute: 0.0072, relative: null }, "rate")).toBe("+0.7 pts");
  });

  it("treats a change as none when it would display as zero", () => {
    expect(isUnchanged({ absolute: 0, relative: 0 }, "count")).toBe(true);
    expect(isUnchanged({ absolute: 1, relative: 0.01 }, "count")).toBe(false);
    expect(isUnchanged({ absolute: 0.0004, relative: null }, "rate")).toBe(true);
    expect(isUnchanged({ absolute: -0.0004, relative: null }, "rate")).toBe(true);
    expect(isUnchanged({ absolute: 0.0005, relative: null }, "rate")).toBe(false);
  });
});
