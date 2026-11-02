import type { Database } from "./connection";

/**
 * Instants are stored as ISO-8601 UTC text (`2026-01-04T22:30:00.000Z`), which
 * sorts and compares correctly as text. Calendar days are `YYYY-MM-DD`.
 */
const SCHEMA = `
  CREATE TABLE clubs (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    time_zone   TEXT NOT NULL,
    created_on  TEXT NOT NULL
  );

  CREATE TABLE players (
    id          TEXT PRIMARY KEY,
    club_id     TEXT NOT NULL REFERENCES clubs(id),
    name        TEXT NOT NULL,
    joined_on   TEXT NOT NULL
  );

  CREATE TABLE sessions (
    id                   TEXT PRIMARY KEY,
    club_id              TEXT NOT NULL REFERENCES clubs(id),
    title                TEXT NOT NULL,
    starts_at            TEXT NOT NULL,
    duration_minutes     INTEGER NOT NULL CHECK (duration_minutes > 0),
    places               INTEGER NOT NULL CHECK (places >= 0),
    status               TEXT NOT NULL CHECK (status IN ('scheduled', 'cancelled')),
    attendance_recorded  INTEGER NOT NULL CHECK (attendance_recorded IN (0, 1))
  );
  CREATE INDEX sessions_by_club_and_start ON sessions (club_id, starts_at);

  CREATE TABLE bookings (
    id            TEXT PRIMARY KEY,
    session_id    TEXT NOT NULL REFERENCES sessions(id),
    player_id     TEXT NOT NULL REFERENCES players(id),
    booked_at     TEXT NOT NULL,
    status        TEXT NOT NULL CHECK (status IN ('booked', 'cancelled')),
    cancelled_at  TEXT,
    attended      INTEGER CHECK (attended IN (0, 1))
  );
  CREATE INDEX bookings_by_session ON bookings (session_id);
`;

export function resetSchema(db: Database): void {
  db.exec(`
    DROP TABLE IF EXISTS bookings;
    DROP TABLE IF EXISTS sessions;
    DROP TABLE IF EXISTS players;
    DROP TABLE IF EXISTS clubs;
  `);
  db.exec(SCHEMA);
}
