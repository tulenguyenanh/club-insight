import { describe, expect, it } from "vitest";
import { activePlayerIds } from "@/domain/metrics/active-players";
import { weeklyActivity } from "@/domain/metrics/weekly";
import { lastFullWeeks, previousPeriod, weeksOf } from "@/domain/period";
import { sessionsIn } from "@/domain/sessions";
import { localDaysWindow } from "@/domain/time-zone";
import { AS_OF, HCMC, attended, noShow, session } from "../support/builders";

describe("weeks in the club's time zone", () => {
  // "Early Bird Monday" starts at 05:30 on Monday in Ho Chi Minh City,
  // which is still 22:30 on Sunday in UTC.
  const earlyBirdMonday = session({ startsAt: new Date("2026-09-27T22:30:00Z"), bookings: [attended()] });

  it("puts an early Monday session in Monday's week, not the Sunday before", () => {
    const weeks = weeklyActivity([earlyBirdMonday], { from: "2026-09-21", to: "2026-10-04" }, HCMC, AS_OF);

    expect(weeks.map((w) => [w.week.weekStart, w.sessionsHeld])).toEqual([
      ["2026-09-21", 0],
      ["2026-09-28", 1],
    ]);
  });

  it("includes a session on the first day of a period that began the evening before in UTC", () => {
    expect(sessionsIn([earlyBirdMonday], { from: "2026-09-28", to: "2026-09-28" }, HCMC)).toHaveLength(1);
    expect(sessionsIn([earlyBirdMonday], { from: "2026-09-27", to: "2026-09-27" }, HCMC)).toHaveLength(0);
  });

  it("turns calendar days into the right UTC instants", () => {
    const window = localDaysWindow("2026-10-05", "2026-10-05", HCMC);
    expect(window.start.toISOString()).toBe("2026-10-04T17:00:00.000Z");
    expect(window.end.toISOString()).toBe("2026-10-05T17:00:00.000Z");
  });

  it("counts a player once per week, in each week they play", () => {
    const tuesday = session({ startsAt: new Date("2026-09-22T12:00:00Z"), bookings: [attended({ playerId: "p1" })] });
    const thursday = session({ startsAt: new Date("2026-09-24T12:00:00Z"), bookings: [attended({ playerId: "p1" })] });
    const nextWeek = session({ startsAt: new Date("2026-09-29T12:00:00Z"), bookings: [attended({ playerId: "p1" })] });

    const weeks = weeklyActivity([tuesday, thursday, nextWeek], { from: "2026-09-21", to: "2026-10-04" }, HCMC, AS_OF);

    expect(weeks.map((w) => w.activePlayers)).toEqual([1, 1]);
  });

  it("marks weeks the period only partly covers", () => {
    expect(weeksOf({ from: "2026-09-02", to: "2026-09-15" })).toEqual([
      { weekStart: "2026-08-31", from: "2026-09-02", to: "2026-09-06", isPartial: true },
      { weekStart: "2026-09-07", from: "2026-09-07", to: "2026-09-13", isPartial: false },
      { weekStart: "2026-09-14", from: "2026-09-14", to: "2026-09-15", isPartial: true },
    ]);
  });
});

describe("periods", () => {
  it("'last 4 weeks' on a Monday means the four complete weeks before it", () => {
    expect(lastFullWeeks(4, "2026-10-05")).toEqual({ from: "2026-09-07", to: "2026-10-04" });
    expect(lastFullWeeks(4, "2026-10-11")).toEqual({ from: "2026-09-07", to: "2026-10-04" });
  });

  it("compares with the same number of days immediately before", () => {
    expect(previousPeriod({ from: "2026-09-07", to: "2026-10-04" })).toEqual({ from: "2026-08-10", to: "2026-09-06" });
    expect(previousPeriod({ from: "2026-03-01", to: "2026-03-31" })).toEqual({ from: "2026-01-29", to: "2026-02-28" });
  });
});

describe("active players", () => {
  it("doesn't count a player whose only booking was a no-show", () => {
    const sessions = [session({ bookings: [noShow({ playerId: "absent" }), attended({ playerId: "present" })] })];

    expect([...activePlayerIds(sessions, AS_OF)]).toEqual(["present"]);
  });
});
