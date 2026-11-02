import type { LocalDate } from "./calendar";
import type { Session } from "./model";
import { containsDate, type Period } from "./period";
import { toLocalDate } from "./time-zone";

/** A session was held if the club didn't cancel it and it has already started. */
export function isHeld(session: Session, asOf: Date): boolean {
  return session.status === "scheduled" && session.startsAt <= asOf;
}

/** A session the club cancelled, counted once its start time has passed. */
export function isCancelled(session: Session, asOf: Date): boolean {
  return session.status === "cancelled" && session.startsAt <= asOf;
}

export function heldSessions(sessions: readonly Session[], asOf: Date): Session[] {
  return sessions.filter((session) => isHeld(session, asOf));
}

/** The club-calendar day a session starts on. Early Monday sessions are still Sunday in UTC. */
export function sessionDate(session: Session, timeZone: string): LocalDate {
  return toLocalDate(session.startsAt, timeZone);
}

/** Sessions that start on one of the period's days in the club's time zone. */
export function sessionsIn(sessions: readonly Session[], period: Period, timeZone: string): Session[] {
  return sessions.filter((session) => containsDate(period, sessionDate(session, timeZone)));
}
