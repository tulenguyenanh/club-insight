import { attendanceOf, keptBookings } from "../attendance";
import type { Session } from "../model";
import { heldSessions } from "../sessions";

export interface NoShowSummary {
  noShows: number;
  /** Kept bookings where attendance was taken: the denominator of the rate. */
  checkedBookings: number;
  /** Kept bookings where attendance wasn't taken, so we can't tell. */
  uncheckedBookings: number;
  sessionsWithAttendance: number;
  sessionsHeld: number;
  /** Share of checked bookings that were no-shows. Null when nothing was checked: unknown, not zero. */
  rate: number | null;
}

export function summariseNoShows(sessions: readonly Session[], asOf: Date): NoShowSummary {
  const held = heldSessions(sessions, asOf);

  let noShows = 0;
  let checkedBookings = 0;
  let uncheckedBookings = 0;
  for (const session of held) {
    for (const booking of keptBookings(session)) {
      const attendance = attendanceOf(session, booking);
      if (attendance === "unknown") {
        uncheckedBookings += 1;
        continue;
      }
      checkedBookings += 1;
      if (attendance === "no_show") noShows += 1;
    }
  }

  return {
    noShows,
    checkedBookings,
    uncheckedBookings,
    sessionsWithAttendance: held.filter((session) => session.attendanceRecorded).length,
    sessionsHeld: held.length,
    rate: checkedBookings > 0 ? noShows / checkedBookings : null,
  };
}
