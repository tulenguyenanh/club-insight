import { describe, expect, it } from "vitest";
import { openInMemoryDatabase, type Database } from "@/server/db/connection";
import { seedDatabase, type CsvExports } from "@/server/db/seed";

/** A minimal, valid set of exports. Each test changes only what it is about. */
function exportsWith(overrides: Partial<Record<keyof CsvExports, string[]>> = {}): CsvExports {
  const rows = {
    clubs: ["club_id,name,time_zone,created_at", "c1,Test Club,Asia/Ho_Chi_Minh,2026-01-01"],
    players: ["player_id,club_id,name,joined_club_at", "p1,c1,An,2026-01-02", "p2,c1,Bình,2026-01-03"],
    sessions: [
      "session_id,club_id,title,starts_at,duration_minutes,places,status,attendance_recorded",
      "s1,c1,Open Play,2026-01-05T12:00:00Z,120,12,scheduled,true",
      "s2,c1,Ladder,2026-01-06T12:00:00Z,90,16,cancelled,false",
    ],
    bookings: [
      "booking_id,session_id,player_id,booked_at,status,cancelled_at,attended",
      "b1,s1,p1,2026-01-04T10:00:00Z,booked,,true",
      "b2,s1,p2,2026-01-04T11:00:00Z,booked,,false",
      "b3,s1,p2,2026-01-04T11:30:00Z,cancelled,2026-01-04T12:00:00Z,",
    ],
    ...overrides,
  };
  return {
    clubs: rows.clubs.join("\n"),
    players: rows.players.join("\n"),
    sessions: rows.sessions.join("\n"),
    bookings: rows.bookings.join("\n"),
  };
}

const count = (db: Database, table: string) =>
  (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;

describe("seeding from the CSV exports", () => {
  it("loads every row and stores values in their proper types", () => {
    const db = openInMemoryDatabase();

    const counts = seedDatabase(db, exportsWith());

    expect(counts).toEqual({ clubs: 1, players: 2, sessions: 2, bookings: 3 });
    expect(db.prepare("SELECT starts_at, attendance_recorded FROM sessions WHERE id = 's1'").get()).toEqual({
      starts_at: "2026-01-05T12:00:00.000Z",
      attendance_recorded: 1,
    });
    expect(db.prepare("SELECT id, attended, cancelled_at FROM bookings ORDER BY id").all()).toEqual([
      { id: "b1", attended: 1, cancelled_at: null },
      { id: "b2", attended: 0, cancelled_at: null },
      { id: "b3", attended: null, cancelled_at: "2026-01-04T12:00:00.000Z" },
    ]);
  });

  it("can be run again without duplicating anything", () => {
    const db = openInMemoryDatabase();
    seedDatabase(db, exportsWith());
    seedDatabase(db, exportsWith());

    expect(count(db, "bookings")).toBe(3);
  });

  it("names the file, line and field of a malformed value", () => {
    const sessions = exportsWith().sessions.split("\n");
    sessions[2] = "s2,c1,Ladder,2026-01-06T12:00:00Z,90,lots,cancelled,false";

    expect(() => seedDatabase(openInMemoryDatabase(), exportsWith({ sessions }))).toThrow(
      /sessions\.csv, line 3[\s\S]*places/,
    );
  });

  it.each([
    [
      "bookings",
      "b4,s9,p1,2026-01-04T10:00:00Z,booked,,",
      /bookings\.csv, line 5: session_id "s9" is not in sessions\.csv/,
    ],
    [
      "bookings",
      "b4,s1,p9,2026-01-04T10:00:00Z,booked,,",
      /bookings\.csv, line 5: player_id "p9" is not in players\.csv/,
    ],
    [
      "sessions",
      "s3,c9,Ghost,2026-01-07T12:00:00Z,60,8,scheduled,false",
      /sessions\.csv, line 4: club_id "c9" is not in clubs\.csv/,
    ],
    ["players", "p3,c9,Châu,2026-01-04", /players\.csv, line 4: club_id "c9" is not in clubs\.csv/],
  ] as const)("says which %s row points at something missing", (file, row, message) => {
    const exports = exportsWith({ [file]: [...exportsWith()[file].split("\n"), row] });

    expect(() => seedDatabase(openInMemoryDatabase(), exports)).toThrow(message);
  });

  it("reports a duplicated id with the line that repeats it", () => {
    const exports = exportsWith({
      bookings: [...exportsWith().bookings.split("\n"), "b1,s1,p1,2026-01-04T10:00:00Z,booked,,true"],
    });

    expect(() => seedDatabase(openInMemoryDatabase(), exports)).toThrow(
      /bookings\.csv, line 5: booking_id "b1" appears twice/,
    );
  });

  it("leaves the existing data untouched when a new export is rejected", () => {
    const db = openInMemoryDatabase();
    seedDatabase(db, exportsWith());
    const broken = exportsWith({
      bookings: [...exportsWith().bookings.split("\n"), "b4,s9,p1,2026-01-04T10:00:00Z,booked,,"],
    });

    expect(() => seedDatabase(db, broken)).toThrow();
    expect(count(db, "bookings")).toBe(3);
  });
});
