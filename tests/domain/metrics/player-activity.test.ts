import { describe, expect, it } from "vitest";
import { summarisePlayers } from "@/domain/metrics/player-activity";
import { AS_OF, attended, booking, cancelledBooking, noShow, session } from "../../support/builders";

describe("summarisePlayers", () => {
  const an = { playerId: "an", playerName: "An" };
  const sessions = [
    session({ startsAt: new Date("2026-09-08T12:00:00Z"), bookings: [attended(an)] }),
    session({ startsAt: new Date("2026-09-15T12:00:00Z"), bookings: [noShow(an)] }),
    session({ startsAt: new Date("2026-09-22T12:00:00Z"), attendanceRecorded: false, bookings: [booking(an)] }),
    session({ startsAt: new Date("2026-09-29T12:00:00Z"), bookings: [cancelledBooking(an)] }),
  ];

  it("adds up each player's sessions, no-shows and checked bookings", () => {
    const [record] = summarisePlayers(sessions, AS_OF);

    expect(record).toMatchObject({
      playerId: "an",
      playerName: "An",
      sessionsPlayed: 2, // attended + attendance not taken
      noShows: 1,
      checkedBookings: 2, // only where attendance was taken
    });
  });

  it("remembers the latest session played and the latest no-show", () => {
    const [record] = summarisePlayers(sessions, AS_OF);

    expect(record.lastPlayedAt?.toISOString()).toBe("2026-09-22T12:00:00.000Z");
    expect(record.lastNoShowAt?.toISOString()).toBe("2026-09-15T12:00:00.000Z");
  });

  it("leaves out players whose only booking was cancelled", () => {
    expect(summarisePlayers([session({ bookings: [cancelledBooking()] })], AS_OF)).toEqual([]);
  });
});
