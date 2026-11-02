import { describe, expect, it } from "vitest";
import { openInMemoryDatabase, type Database } from "@/server/db/connection";
import { seedDatabase } from "@/server/db/seed";
import { DEFAULT_ROWS, csvExports } from "../support/csv-exports";

const count = (db: Database, table: string) =>
  (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;

describe("seeding from the CSV exports", () => {
  it("loads every row and stores values in their proper types", () => {
    const db = openInMemoryDatabase();

    const counts = seedDatabase(db, csvExports());

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
    seedDatabase(db, csvExports());
    seedDatabase(db, csvExports());

    expect(count(db, "bookings")).toBe(3);
  });

  it("names the file, line and field of a malformed value", () => {
    const sessions = [DEFAULT_ROWS.sessions[0], "s2,c1,Ladder,2026-01-06T12:00:00Z,90,lots,cancelled,false"];

    expect(() => seedDatabase(openInMemoryDatabase(), csvExports({ sessions }))).toThrow(
      /sessions\.csv, line 3[\s\S]*places/,
    );
  });

  it("rejects a time zone that doesn't exist", () => {
    expect(() =>
      seedDatabase(openInMemoryDatabase(), csvExports({ clubs: ["c1,Test Club,Asia/Atlantis,2026-01-01"] })),
    ).toThrow(/clubs\.csv, line 2[\s\S]*time zone/);
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
    const exports = csvExports({ [file]: [...DEFAULT_ROWS[file], row] });

    expect(() => seedDatabase(openInMemoryDatabase(), exports)).toThrow(message);
  });

  it("reports a duplicated id with the line that repeats it", () => {
    const exports = csvExports({
      bookings: [...DEFAULT_ROWS.bookings, "b1,s1,p1,2026-01-04T10:00:00Z,booked,,true"],
    });

    expect(() => seedDatabase(openInMemoryDatabase(), exports)).toThrow(
      /bookings\.csv, line 5: booking_id "b1" appears twice/,
    );
  });

  it("leaves the existing data untouched when a new export is rejected", () => {
    const db = openInMemoryDatabase();
    seedDatabase(db, csvExports());
    const broken = csvExports({ bookings: [...DEFAULT_ROWS.bookings, "b4,s9,p1,2026-01-04T10:00:00Z,booked,,"] });

    expect(() => seedDatabase(db, broken)).toThrow();
    expect(count(db, "bookings")).toBe(3);
  });
});
