import { describe, expect, it } from "vitest";
import { fixedClock } from "@/server/clock";
import { createServices } from "@/server/container";
import { databaseWith } from "../support/csv-exports";

// A small club with one of everything, at 09:00 on Mon 12 Jan 2026 in Ho Chi Minh City.
const NOW = new Date("2026-01-12T02:00:00Z");
const api = createServices(
  databaseWith({
    players: ["p1,c1,An,2026-01-02", "p2,c1,Bình,2026-01-03", "p3,c1,Châu,2026-01-03"],
    sessions: [
      "s1,c1,Open Play,2026-01-05T12:00:00Z,120,12,scheduled,true",
      "s2,c1,Ladder,2026-01-06T12:00:00Z,90,16,cancelled,false",
      "s3,c1,Social,2026-01-08T12:00:00Z,120,12,scheduled,false",
      "s4,c1,Next Week,2026-01-13T12:00:00Z,120,12,scheduled,false",
    ],
    bookings: [
      "b1,s1,p3,2026-01-04T10:00:00Z,booked,,true",
      "b2,s1,p2,2026-01-04T11:00:00Z,booked,,false",
      "b3,s1,p1,2026-01-04T11:30:00Z,cancelled,2026-01-04T12:00:00Z,",
      "b4,s1,p1,2026-01-04T11:45:00Z,booked,,true",
      "b5,s3,p1,2026-01-07T10:00:00Z,booked,,",
    ],
  }),
  fixedClock(NOW),
);
const WEEK_OF_5_JAN = { kind: "custom", from: "2026-01-05", to: "2026-01-11" } as const;

describe("the rows behind each number", () => {
  it("lists active players, most sessions first, without the no-show-only player", async () => {
    const { players } = await api.drillDown.activePlayers("c1", WEEK_OF_5_JAN);

    expect(players.map((p) => [p.name, p.sessionsPlayed, p.isNew])).toEqual([
      ["An", 2, true],
      ["Châu", 1, true],
    ]);
  });

  it("lists sessions latest first, each with its status and attendance", async () => {
    const { sessions } = await api.drillDown.sessionList("c1", WEEK_OF_5_JAN);

    expect(sessions.map((s) => [s.id, s.status, s.keptBookings, s.cancelledBookings, s.attended, s.noShows])).toEqual([
      ["s3", "held", 1, 0, null, null],
      ["s2", "cancelled", 0, 0, null, null],
      ["s1", "held", 3, 1, 2, 1],
    ]);
  });

  it("lists who didn't show up, with how much attendance was actually checked", async () => {
    const { players, coverage } = await api.drillDown.noShows("c1", WEEK_OF_5_JAN);

    expect(players).toEqual([expect.objectContaining({ name: "Bình", noShows: 1, checkedBookings: 1, rate: 1 })]);
    expect(coverage).toMatchObject({ sessionsHeld: 2, sessionsWithAttendance: 1, uncheckedBookings: 1 });
  });

  it("shows a roster with kept bookings first, then cancellations, alphabetically", async () => {
    const { roster } = await api.drillDown.sessionDetail("c1", "s1");

    expect(roster.map((r) => [r.name, r.status, r.attendance])).toEqual([
      ["An", "booked", "attended"],
      ["Bình", "booked", "no_show"],
      ["Châu", "booked", "attended"],
      ["An", "cancelled", null],
    ]);
  });

  it("calls a session that hasn't started yet upcoming", async () => {
    const { session } = await api.drillDown.sessionDetail("c1", "s4");

    expect(session.status).toBe("upcoming");
  });
});
