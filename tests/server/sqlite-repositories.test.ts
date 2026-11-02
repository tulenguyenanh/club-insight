import { describe, expect, it } from "vitest";
import { SqliteClubRepository } from "@/server/repositories/sqlite-club-repository";
import { SqliteSessionRepository } from "@/server/repositories/sqlite-session-repository";
import { databaseWith, DEFAULT_ROWS } from "../support/csv-exports";

// Two clubs, so every query can be checked for leaking another club's rows.
const db = databaseWith({
  clubs: ["c1,Test Club,Asia/Ho_Chi_Minh,2026-01-01", "c0,Older Club,Asia/Ho_Chi_Minh,2025-06-01"],
  players: [...DEFAULT_ROWS.players, "q1,c0,Other,2025-06-02"],
  sessions: [
    ...DEFAULT_ROWS.sessions,
    "s3,c1,Late Game,2026-01-07T12:00:00Z,60,8,scheduled,false",
    "x1,c0,Other Club Game,2026-01-05T12:00:00Z,60,8,scheduled,true",
  ],
  bookings: [...DEFAULT_ROWS.bookings, "y1,x1,q1,2026-01-04T10:00:00Z,booked,,true"],
});
const clubs = new SqliteClubRepository(db);
const sessions = new SqliteSessionRepository(db);

const window = (start: string, end: string) => ({ start: new Date(start), end: new Date(end) });

describe("SqliteClubRepository", () => {
  it("lists clubs oldest first", async () => {
    expect((await clubs.list()).map((c) => c.id)).toEqual(["c0", "c1"]);
  });

  it("finds a club by id, or nothing", async () => {
    expect(await clubs.findById("c1")).toEqual({
      id: "c1",
      name: "Test Club",
      timeZone: "Asia/Ho_Chi_Minh",
      createdOn: "2026-01-01",
    });
    expect(await clubs.findById("nope")).toBeNull();
  });
});

describe("SqliteSessionRepository", () => {
  it("includes a session starting exactly at the window's start and excludes one at its end", async () => {
    const found = await sessions.findStartingIn("c1", window("2026-01-05T12:00:00Z", "2026-01-07T12:00:00Z"));

    expect(found.map((s) => s.id)).toEqual(["s1", "s2"]);
  });

  it("never returns another club's sessions", async () => {
    const found = await sessions.findStartingIn("c1", window("2026-01-01T00:00:00Z", "2026-02-01T00:00:00Z"));

    expect(found.map((s) => s.id)).toEqual(["s1", "s2", "s3"]);
  });

  it("attaches each session's bookings with player names and typed values", async () => {
    const [s1] = await sessions.findStartingIn("c1", window("2026-01-05T00:00:00Z", "2026-01-06T00:00:00Z"));

    expect(s1).toMatchObject({ id: "s1", status: "scheduled", attendanceRecorded: true, places: 12 });
    expect(s1.startsAt).toEqual(new Date("2026-01-05T12:00:00Z"));
    expect(s1.bookings.map((b) => [b.id, b.playerName, b.status, b.attended])).toEqual([
      ["b1", "An", "booked", true],
      ["b2", "Bình", "booked", false],
      ["b3", "Bình", "cancelled", null],
    ]);
    expect(s1.bookings[2].cancelledAt).toEqual(new Date("2026-01-04T12:00:00Z"));
  });

  it("finds a session by id only within its own club", async () => {
    expect((await sessions.findById("c1", "s1"))?.bookings).toHaveLength(3);
    expect(await sessions.findById("c1", "x1")).toBeNull();
    expect(await sessions.findById("c1", "nope")).toBeNull();
  });

  it("finds the first session that went ahead, skipping cancelled and future ones", async () => {
    expect(await sessions.findFirstHeldStart("c1", new Date("2026-02-01T00:00:00Z"))).toEqual(
      new Date("2026-01-05T12:00:00Z"),
    );
    expect(await sessions.findFirstHeldStart("c1", new Date("2026-01-05T11:59:59Z"))).toBeNull();
  });
});
