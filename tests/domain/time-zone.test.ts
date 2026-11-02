import { describe, expect, it } from "vitest";
import { localDaysWindow, startOfLocalDay, toLocalDate } from "@/domain/time-zone";
import { HCMC } from "../support/builders";

const HOUR = 3_600_000;

describe("calendar days in a time zone", () => {
  it("reads the day on the club's wall clock, not in UTC", () => {
    // 22:30 on Sunday in UTC is 05:30 on Monday in Ho Chi Minh City.
    expect(toLocalDate(new Date("2026-09-27T22:30:00Z"), HCMC)).toBe("2026-09-28");
    expect(toLocalDate(new Date("2026-09-27T16:59:59Z"), HCMC)).toBe("2026-09-27");
    expect(toLocalDate(new Date("2026-09-27T17:00:00Z"), HCMC)).toBe("2026-09-28");
  });

  it("finds the instant a day starts", () => {
    expect(startOfLocalDay("2026-10-05", HCMC).toISOString()).toBe("2026-10-04T17:00:00.000Z");
  });

  it("covers whole days, both ends included", () => {
    const window = localDaysWindow("2026-10-05", "2026-10-05", HCMC);

    expect(window.start.toISOString()).toBe("2026-10-04T17:00:00.000Z");
    expect(window.end.toISOString()).toBe("2026-10-05T17:00:00.000Z");
  });

  // Ho Chi Minh City has no daylight saving, but a club elsewhere might.
  it("handles days that are 23 or 25 hours long where clocks change", () => {
    const springForward = localDaysWindow("2026-03-29", "2026-03-29", "Europe/London");
    const fallBack = localDaysWindow("2026-10-25", "2026-10-25", "Europe/London");

    expect(springForward.end.getTime() - springForward.start.getTime()).toBe(23 * HOUR);
    expect(fallBack.end.getTime() - fallBack.start.getTime()).toBe(25 * HOUR);
  });
});
