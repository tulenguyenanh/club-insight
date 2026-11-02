import { describe, expect, it } from "vitest";
import { activePlayerIds, firstPlayedOn, isNewInPeriod, summariseActivePlayers } from "@/domain/metrics/active-players";
import { AS_OF, HCMC, attended, booking, cancelledBooking, noShow, session } from "../../support/builders";

describe("active players", () => {
  it("counts each player once, however many sessions they played", () => {
    const sessions = [
      session({ bookings: [attended({ playerId: "an" })] }),
      session({ bookings: [attended({ playerId: "an" }), attended({ playerId: "binh" })] }),
    ];

    expect([...activePlayerIds(sessions, AS_OF)].sort()).toEqual(["an", "binh"]);
  });

  it("counts players whose attendance wasn't taken", () => {
    const sessions = [session({ attendanceRecorded: false, bookings: [booking({ playerId: "an" })] })];

    expect([...activePlayerIds(sessions, AS_OF)]).toEqual(["an"]);
  });

  it("doesn't count a player whose only booking was a no-show", () => {
    const sessions = [session({ bookings: [noShow({ playerId: "absent" }), attended({ playerId: "present" })] })];

    expect([...activePlayerIds(sessions, AS_OF)]).toEqual(["present"]);
  });

  it("counts a player who missed one session but played another", () => {
    const sessions = [
      session({ bookings: [noShow({ playerId: "an" })] }),
      session({ bookings: [attended({ playerId: "an" })] }),
    ];

    expect([...activePlayerIds(sessions, AS_OF)]).toEqual(["an"]);
  });

  it("ignores cancelled bookings, cancelled sessions and sessions still to come", () => {
    const later = new Date(AS_OF.getTime() + 60_000);
    const sessions = [
      session({ bookings: [cancelledBooking({ playerId: "cancelled-booking" })] }),
      session({ status: "cancelled", bookings: [booking({ playerId: "cancelled-session" })] }),
      session({ startsAt: later, bookings: [booking({ playerId: "future" })] }),
    ];

    expect(activePlayerIds(sessions, AS_OF).size).toBe(0);
  });
});

describe("new players", () => {
  const history = [
    session({ startsAt: new Date("2026-08-01T12:00:00Z"), bookings: [noShow({ playerId: "an" })] }),
    session({ startsAt: new Date("2026-09-08T12:00:00Z"), bookings: [attended({ playerId: "an" })] }),
    session({ startsAt: new Date("2026-08-02T12:00:00Z"), bookings: [attended({ playerId: "binh" })] }),
    session({ startsAt: new Date("2026-09-09T12:00:00Z"), bookings: [attended({ playerId: "binh" })] }),
  ];
  const period = { from: "2026-09-07", to: "2026-10-04" };

  it("dates a player's first session from the first one they actually played", () => {
    const first = firstPlayedOn(history, AS_OF, HCMC);

    // An's August booking was a no-show, so their first session is in September.
    expect(first.get("an")).toBe("2026-09-08");
    expect(first.get("binh")).toBe("2026-08-02");
  });

  it("calls a player new when their first session falls in the period", () => {
    const first = firstPlayedOn(history, AS_OF, HCMC);

    expect(isNewInPeriod("an", first, period)).toBe(true);
    expect(isNewInPeriod("binh", first, period)).toBe(false);
    expect(isNewInPeriod("nobody", first, period)).toBe(false);
  });

  it("summarises the period as active and new counts", () => {
    const first = firstPlayedOn(history, AS_OF, HCMC);
    const inPeriod = history.slice(1, 2).concat(history.slice(3));

    expect(summariseActivePlayers(inPeriod, first, period, AS_OF)).toEqual({ count: 2, newPlayers: 1 });
  });
});
