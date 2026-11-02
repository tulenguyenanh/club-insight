import { describe, expect, it } from "vitest";
import { weeklyActivity } from "@/domain/metrics/weekly";
import { AS_OF, HCMC, attended, session } from "../../support/builders";

const TWO_WEEKS = { from: "2026-09-21", to: "2026-10-04" };

describe("weeklyActivity", () => {
  // "Early Bird Monday" starts at 05:30 on Monday in Ho Chi Minh City,
  // which is still 22:30 on Sunday in UTC.
  it("puts an early Monday session in Monday's week, not the Sunday before", () => {
    const earlyBirdMonday = session({ startsAt: new Date("2026-09-27T22:30:00Z"), bookings: [attended()] });

    const weeks = weeklyActivity([earlyBirdMonday], TWO_WEEKS, HCMC, AS_OF);

    expect(weeks.map((w) => [w.week.weekStart, w.sessionsHeld])).toEqual([
      ["2026-09-21", 0],
      ["2026-09-28", 1],
    ]);
  });

  it("counts a player once per week, in each week they play", () => {
    const sessions = ["2026-09-22T12:00:00Z", "2026-09-24T12:00:00Z", "2026-09-29T12:00:00Z"].map((startsAt) =>
      session({ startsAt: new Date(startsAt), bookings: [attended({ playerId: "an" })] }),
    );

    expect(weeklyActivity(sessions, TWO_WEEKS, HCMC, AS_OF).map((w) => w.activePlayers)).toEqual([1, 1]);
  });

  it("counts cancelled sessions in the week they would have run", () => {
    const sessions = [
      session({ startsAt: new Date("2026-09-22T12:00:00Z") }),
      session({ startsAt: new Date("2026-09-24T12:00:00Z"), status: "cancelled" }),
    ];

    expect(weeklyActivity(sessions, TWO_WEEKS, HCMC, AS_OF).map((w) => [w.sessionsHeld, w.sessionsCancelled])).toEqual([
      [1, 1],
      [0, 0],
    ]);
  });

  it("reports every week of the period, even empty ones", () => {
    expect(weeklyActivity([], TWO_WEEKS, HCMC, AS_OF)).toHaveLength(2);
  });
});
