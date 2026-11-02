import type { Club, Session } from "@/domain/model";
import type { InstantWindow } from "@/domain/time-zone";

/**
 * Storage ports. Services depend on these interfaces, not on SQLite, so the
 * store can change (or be faked in tests) without touching any business rule.
 */
export interface ClubRepository {
  list(): Promise<Club[]>;
  findById(clubId: string): Promise<Club | null>;
}

export interface SessionRepository {
  /** Sessions, with all their bookings, that start inside `window`. */
  findStartingIn(clubId: string, window: InstantWindow): Promise<Session[]>;
  findById(clubId: string, sessionId: string): Promise<Session | null>;
  /** Start of the club's earliest session that went ahead by `asOf`, or null. */
  findFirstHeldStart(clubId: string, asOf: Date): Promise<Date | null>;
}
