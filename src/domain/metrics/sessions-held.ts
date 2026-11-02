import { keptBookings } from "../attendance";
import type { Session } from "../model";
import { heldSessions, isCancelled } from "../sessions";

export interface SessionsHeldSummary {
  held: number;
  cancelled: number;
  keptBookings: number;
  placesOffered: number;
  /** Kept bookings as a share of places at held sessions. Null when nothing was held. */
  fillRate: number | null;
}

export function summariseSessionsHeld(sessions: readonly Session[], asOf: Date): SessionsHeldSummary {
  const held = heldSessions(sessions, asOf);
  const booked = held.reduce((sum, session) => sum + keptBookings(session).length, 0);
  const places = held.reduce((sum, session) => sum + session.places, 0);
  return {
    held: held.length,
    cancelled: sessions.filter((session) => isCancelled(session, asOf)).length,
    keptBookings: booked,
    placesOffered: places,
    fillRate: places > 0 ? booked / places : null,
  };
}
