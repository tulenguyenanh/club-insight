import { parse } from "csv-parse/sync";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import type { Database } from "./connection";
import { resetSchema } from "./schema";

/**
 * Loads the four CSV exports into a fresh schema. Every row is validated first
 * (types, unique ids, references between files), so a bad export fails loudly
 * with its file and line instead of quietly producing wrong numbers.
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

/** The text of the four CSV exports. */
export interface CsvExports {
  clubs: string;
  players: string;
  sessions: string;
  bookings: string;
}

export function readCsvExports(dataDir: string): CsvExports {
  const read = (name: keyof CsvExports) => readFileSync(join(dataDir, `${name}.csv`), "utf8");
  return { clubs: read("clubs"), players: read("players"), sessions: read("sessions"), bookings: read("bookings") };
}

export function seedFromCsv(db: Database, dataDir: string): SeedCounts {
  return seedDatabase(db, readCsvExports(dataDir));
}

export function seedDatabase(db: Database, exports: CsvExports): SeedCounts {
  const clubs = parseCsv("clubs.csv", exports.clubs, clubRow);
  const players = parseCsv("players.csv", exports.players, playerRow);
  const sessions = parseCsv("sessions.csv", exports.sessions, sessionRow);
  const bookings = parseCsv("bookings.csv", exports.bookings, bookingRow);

  // Checked here, before anything is written, so the error can name the line (SQLite's can't).
  const clubIds = uniqueIds("clubs.csv", clubs, "club_id");
  const playerIds = uniqueIds("players.csv", players, "player_id");
  const sessionIds = uniqueIds("sessions.csv", sessions, "session_id");
  uniqueIds("bookings.csv", bookings, "booking_id");
  requireKnown("players.csv", players, "club_id", clubIds, "clubs.csv");
  requireKnown("sessions.csv", sessions, "club_id", clubIds, "clubs.csv");
  requireKnown("bookings.csv", bookings, "session_id", sessionIds, "sessions.csv");
  requireKnown("bookings.csv", bookings, "player_id", playerIds, "players.csv");

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

function parseCsv<T>(file: string, text: string, schema: z.ZodType<T>): T[] {
  const records: Record<string, string>[] = parse(text, {
    columns: true,
    bom: true,
    skip_empty_lines: true,
    trim: true,
  });
  return records.map((record, index) => {
    const result = schema.safeParse(record);
    if (!result.success) throw new Error(`${file}, line ${lineOf(index)}:\n${z.prettifyError(result.error)}`);
    return result.data;
  });
}

function uniqueIds<K extends string>(file: string, rows: readonly Record<K, string>[], key: K): Set<string> {
  const ids = new Set<string>();
  rows.forEach((row, index) => {
    if (ids.has(row[key])) throw new Error(`${file}, line ${lineOf(index)}: ${key} "${row[key]}" appears twice.`);
    ids.add(row[key]);
  });
  return ids;
}

function requireKnown<K extends string>(
  file: string,
  rows: readonly Record<K, string>[],
  key: K,
  known: ReadonlySet<string>,
  knownFile: string,
): void {
  rows.forEach((row, index) => {
    if (!known.has(row[key])) {
      throw new Error(`${file}, line ${lineOf(index)}: ${key} "${row[key]}" is not in ${knownFile}.`);
    }
  });
}

/** +2: one for the header row, one because lines are counted from 1. */
function lineOf(rowIndex: number): number {
  return rowIndex + 2;
}

function isKnownTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}
