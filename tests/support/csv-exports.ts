import { openInMemoryDatabase, type Database } from "@/server/db/connection";
import { seedDatabase, type CsvExports } from "@/server/db/seed";

const HEADERS: Record<keyof CsvExports, string> = {
  clubs: "club_id,name,time_zone,created_at",
  players: "player_id,club_id,name,joined_club_at",
  sessions: "session_id,club_id,title,starts_at,duration_minutes,places,status,attendance_recorded",
  bookings: "booking_id,session_id,player_id,booked_at,status,cancelled_at,attended",
};

/** A small, valid club: two players, one held session with attendance, one cancelled session. */
export const DEFAULT_ROWS: Record<keyof CsvExports, string[]> = {
  clubs: ["c1,Test Club,Asia/Ho_Chi_Minh,2026-01-01"],
  players: ["p1,c1,An,2026-01-02", "p2,c1,Bình,2026-01-03"],
  sessions: [
    "s1,c1,Open Play,2026-01-05T12:00:00Z,120,12,scheduled,true",
    "s2,c1,Ladder,2026-01-06T12:00:00Z,90,16,cancelled,false",
  ],
  bookings: [
    "b1,s1,p1,2026-01-04T10:00:00Z,booked,,true",
    "b2,s1,p2,2026-01-04T11:00:00Z,booked,,false",
    "b3,s1,p2,2026-01-04T11:30:00Z,cancelled,2026-01-04T12:00:00Z,",
  ],
};

/** CSV text for the four exports. Pass data rows (no header) for the files a test is about. */
export function csvExports(rows: Partial<Record<keyof CsvExports, string[]>> = {}): CsvExports {
  const text = (file: keyof CsvExports) => [HEADERS[file], ...(rows[file] ?? DEFAULT_ROWS[file])].join("\n");
  return { clubs: text("clubs"), players: text("players"), sessions: text("sessions"), bookings: text("bookings") };
}

/** An in-memory database seeded from `csvExports(rows)`. */
export function databaseWith(rows: Partial<Record<keyof CsvExports, string[]>> = {}): Database {
  const db = openInMemoryDatabase();
  seedDatabase(db, csvExports(rows));
  return db;
}
