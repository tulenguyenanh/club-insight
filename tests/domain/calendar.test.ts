import { describe, expect, it } from "vitest";
import { addDays, daysInclusive, isLocalDate, maxDate, minDate, startOfWeek } from "@/domain/calendar";

describe("isLocalDate", () => {
  it.each(["2026-10-05", "2028-02-29", "2026-12-31", "2026-01-01"])("accepts the real day %s", (value) => {
    expect(isLocalDate(value)).toBe(true);
  });

  it.each([
    ["2026-02-29", "not a leap year"],
    ["2026-02-30", "no 30th of February"],
    ["2026-04-31", "April has 30 days"],
    ["2026-13-01", "there is no 13th month"],
    ["2026-00-10", "there is no month 0"],
    ["2026-9-1", "not zero-padded"],
    ["05/10/2026", "wrong format"],
    ["", "empty"],
  ])("rejects %s (%s) without throwing", (value) => {
    expect(isLocalDate(value)).toBe(false);
  });
});

describe("date arithmetic", () => {
  it("adds days across months, years and leap days", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("counts days with both ends included", () => {
    expect(daysInclusive("2026-10-05", "2026-10-05")).toBe(1);
    expect(daysInclusive("2026-09-07", "2026-10-04")).toBe(28);
  });

  it("starts weeks on Monday", () => {
    expect(startOfWeek("2026-10-05")).toBe("2026-10-05"); // Monday
    expect(startOfWeek("2026-10-04")).toBe("2026-09-28"); // Sunday belongs to the week before
    expect(startOfWeek("2026-01-01")).toBe("2025-12-29"); // across a year boundary
  });

  it("picks the earlier and later of two days", () => {
    expect(minDate("2026-10-05", "2026-09-30")).toBe("2026-09-30");
    expect(maxDate("2026-10-05", "2026-09-30")).toBe("2026-10-05");
  });
});
