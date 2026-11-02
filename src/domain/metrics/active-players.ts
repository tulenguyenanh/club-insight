import { countsAsPlayed } from "../attendance";
import type { LocalDate } from "../calendar";
import type { Session } from "../model";
import { containsDate, type Period } from "../period";
import { heldSessions, sessionDate } from "../sessions";

export interface ActivePlayersSummary {
  count: number;
  /** Active players whose first session at the club was in this period. */
  newPlayers: number;
}

/** Players with at least one kept booking at a held session, not marked as a no-show. */
export function activePlayerIds(sessions: readonly Session[], asOf: Date): Set<string> {
  const ids = new Set<string>();
  for (const session of heldSessions(sessions, asOf)) {
    for (const booking of session.bookings) {
      if (countsAsPlayed(session, booking)) ids.add(booking.playerId);
    }
  }
  return ids;
}

/** The first day each player played at the club, given the club's history. */
export function firstPlayedOn(history: readonly Session[], asOf: Date, timeZone: string): Map<string, LocalDate> {
  const firstDates = new Map<string, LocalDate>();
  for (const session of heldSessions(history, asOf)) {
    const date = sessionDate(session, timeZone);
    for (const booking of session.bookings) {
      if (!countsAsPlayed(session, booking)) continue;
      const known = firstDates.get(booking.playerId);
      if (known === undefined || date < known) firstDates.set(booking.playerId, date);
    }
  }
  return firstDates;
}

export function isNewInPeriod(playerId: string, firstPlayed: ReadonlyMap<string, LocalDate>, period: Period): boolean {
  const first = firstPlayed.get(playerId);
  return first !== undefined && containsDate(period, first);
}

export function summariseActivePlayers(
  sessions: readonly Session[],
  firstPlayed: ReadonlyMap<string, LocalDate>,
  period: Period,
  asOf: Date,
): ActivePlayersSummary {
  const ids = [...activePlayerIds(sessions, asOf)];
  return {
    count: ids.length,
    newPlayers: ids.filter((id) => isNewInPeriod(id, firstPlayed, period)).length,
  };
}
