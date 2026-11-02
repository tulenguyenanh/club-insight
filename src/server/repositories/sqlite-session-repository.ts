import type { Booking, Session } from "@/domain/model";
import type { InstantWindow } from "@/domain/time-zone";
import type { Database } from "../db/connection";
import type { SessionRepository } from "./types";

interface SessionRow {
  id: string;
  club_id: string;
  title: string;
  starts_at: string;
  duration_minutes: number;
  places: number;
  status: Session["status"];
  attendance_recorded: 0 | 1;
}

interface BookingRow {
  id: string;
  session_id: string;
  player_id: string;
  player_name: string;
  booked_at: string;
  status: Booking["status"];
  cancelled_at: string | null;
  attended: 0 | 1 | null;
}

/** club id, window start, window end */
type WindowParams = [string, string, string];

const SESSION_COLUMNS = "id, club_id, title, starts_at, duration_minutes, places, status, attendance_recorded";

const BOOKING_SELECT = `
  SELECT b.id, b.session_id, b.player_id, p.name AS player_name,
         b.booked_at, b.status, b.cancelled_at, b.attended
  FROM bookings b
  JOIN players p ON p.id = b.player_id
`;

export class SqliteSessionRepository implements SessionRepository {
  constructor(private readonly db: Database) {}

  async findStartingIn(clubId: string, window: InstantWindow): Promise<Session[]> {
    const range: WindowParams = [clubId, window.start.toISOString(), window.end.toISOString()];
    const sessions = this.db
      .prepare<WindowParams, SessionRow>(
        `SELECT ${SESSION_COLUMNS} FROM sessions
         WHERE club_id = ? AND starts_at >= ? AND starts_at < ?
         ORDER BY starts_at`,
      )
      .all(...range);
    const bookings = this.db
      .prepare<WindowParams, BookingRow>(
        `${BOOKING_SELECT}
         WHERE b.session_id IN (
           SELECT id FROM sessions WHERE club_id = ? AND starts_at >= ? AND starts_at < ?
         )
         ORDER BY b.booked_at`,
      )
      .all(...range);
    return assemble(sessions, bookings);
  }

  async findById(clubId: string, sessionId: string): Promise<Session | null> {
    const session = this.db
      .prepare<[string, string], SessionRow>(`SELECT ${SESSION_COLUMNS} FROM sessions WHERE club_id = ? AND id = ?`)
      .get(clubId, sessionId);
    if (!session) return null;
    const bookings = this.db
      .prepare<[string], BookingRow>(`${BOOKING_SELECT} WHERE b.session_id = ? ORDER BY b.booked_at`)
      .all(sessionId);
    return assemble([session], bookings)[0];
  }

  async findFirstHeldStart(clubId: string, asOf: Date): Promise<Date | null> {
    // Mirrors isHeld() in domain/sessions.ts: not cancelled, and already started.
    const row = this.db
      .prepare<[string, string], { first: string | null }>(
        `SELECT MIN(starts_at) AS first FROM sessions
         WHERE club_id = ? AND status = 'scheduled' AND starts_at <= ?`,
      )
      .get(clubId, asOf.toISOString());
    return row?.first ? new Date(row.first) : null;
  }
}

function assemble(sessionRows: SessionRow[], bookingRows: BookingRow[]): Session[] {
  const bookingsBySession = new Map<string, Booking[]>();
  for (const row of bookingRows) {
    const list = bookingsBySession.get(row.session_id) ?? [];
    list.push(toBooking(row));
    bookingsBySession.set(row.session_id, list);
  }
  return sessionRows.map((row) => toSession(row, bookingsBySession.get(row.id) ?? []));
}

function toSession(row: SessionRow, bookings: Booking[]): Session {
  return {
    id: row.id,
    clubId: row.club_id,
    title: row.title,
    startsAt: new Date(row.starts_at),
    durationMinutes: row.duration_minutes,
    places: row.places,
    status: row.status,
    attendanceRecorded: row.attendance_recorded === 1,
    bookings,
  };
}

function toBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    playerId: row.player_id,
    playerName: row.player_name,
    bookedAt: new Date(row.booked_at),
    status: row.status,
    cancelledAt: row.cancelled_at ? new Date(row.cancelled_at) : null,
    attended: row.attended === null ? null : row.attended === 1,
  };
}
