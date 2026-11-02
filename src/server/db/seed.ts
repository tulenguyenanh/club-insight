import { parse } from "csv-parse/sync";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import type { Database } from "./connection";
import { resetSchema } from "./schema";

/**
 * Loads the four CSV exports into a fresh schema. Every row is validated first,
 * so a malformed export fails loudly with its file and line instead of
 * quietly producing wrong numbers.
 */

const instant = z.iso.datetime().transform((value) => new Date(value).toISOString());
const optionalInstant = z.union([z.literal(""), instant]).transform((value) => value || null);
const calendarDay = z.iso.date();
const csvBoolean = z.enum(["true", "false"]).transform((value) => (value === "true" ? 1 : 0));
const optionalCsvBoolean = z
  .enum(["true", "false", ""])
  .transform((value) => (value === "" ? null : value === "true" ? 1 : 0));
const timeZone = z.string().refine(isKnownTimeZone, "unknown IANA time zone");

const clubRow = z.object({
  club_id: z.string().min(1),
  name: z.string().min(1),
  time_zone: timeZone,
  created_at: calendarDay,
});

const playerRow = z.object({
  player_id: z.string().min(1),
  club_id: z.string().min(1),
  name: z.string().min(1),
  joined_club_at: calendarDay,
});

const sessionRow = z.object({
  session_id: z.string().min(1),
  club_id: z.string().min(1),
  title: z.string().min(1),
  starts_at: instant,
  duration_minutes: z.coerce.number().int().positive(),
  places: z.coerce.number().int().nonnegative(),
  status: z.enum(["scheduled", "cancelled"]),
  attendance_recorded: csvBoolean,
});

const bookingRow = z.object({
  booking_id: z.string().min(1),
  session_id: z.string().min(1),
  player_id: z.string().min(1),
  booked_at: instant,
  status: z.enum(["booked", "cancelled"]),
  cancelled_at: optionalInstant,
  attended: optionalCsvBoolean,
});

export interface SeedCounts {
  clubs: number;
  players: number;
  sessions: number;
  bookings: number;
}

export function seedFromCsv(db: Database, dataDir: string): SeedCounts {
  const clubs = readCsv(join(dataDir, "clubs.csv"), clubRow);
  const players = readCsv(join(dataDir, "players.csv"), playerRow);
  const sessions = readCsv(join(dataDir, "sessions.csv"), sessionRow);
  const bookings = readCsv(join(dataDir, "bookings.csv"), bookingRow);

  // One transaction: a running server reading the file sees the old data or the new, never half of each.
  db.transaction(() => {
    resetSchema(db);
    insertAll(
      db,
      "INSERT INTO clubs (id, name, time_zone, created_on) VALUES (@club_id, @name, @time_zone, @created_at)",
      clubs,
    );
    insertAll(
      db,
      "INSERT INTO players (id, club_id, name, joined_on) VALUES (@player_id, @club_id, @name, @joined_club_at)",
      players,
    );
    insertAll(
      db,
      `INSERT INTO sessions (id, club_id, title, starts_at, duration_minutes, places, status, attendance_recorded)
       VALUES (@session_id, @club_id, @title, @starts_at, @duration_minutes, @places, @status, @attendance_recorded)`,
      sessions,
    );
    insertAll(
      db,
      `INSERT INTO bookings (id, session_id, player_id, booked_at, status, cancelled_at, attended)
       VALUES (@booking_id, @session_id, @player_id, @booked_at, @status, @cancelled_at, @attended)`,
      bookings,
    );
  })();

  return { clubs: clubs.length, players: players.length, sessions: sessions.length, bookings: bookings.length };
}

function insertAll(db: Database, sql: string, rows: readonly object[]): void {
  const statement = db.prepare(sql);
  for (const row of rows) statement.run(row);
}

function readCsv<T>(path: string, schema: z.ZodType<T>): T[] {
  const records: Record<string, string>[] = parse(readFileSync(path, "utf8"), {
    columns: true,
    bom: true,
    skip_empty_lines: true,
    trim: true,
  });
  return records.map((record, index) => {
    const result = schema.safeParse(record);
    if (!result.success) {
      // +2: one for the header row, one because lines are counted from 1.
      throw new Error(`${path}, line ${index + 2}:\n${z.prettifyError(result.error)}`);
    }
    return result.data;
  });
}

function isKnownTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}
