import type { Attendance, Booking, Session } from "./model";

/** A kept booking is one the player didn't cancel. */
export function isKept(booking: Booking): boolean {
  return booking.status === "booked";
}

export function keptBookings(session: Session): Booking[] {
  return session.bookings.filter(isKept);
}

/**
 * Attendance for a kept booking. When the session had no attendance taken we
 * do not know whether the player came, so the answer is "unknown", never "no_show".
 */
export function attendanceOf(session: Session, booking: Booking): Attendance {
  if (!session.attendanceRecorded || booking.attended === null) return "unknown";
  return booking.attended ? "attended" : "no_show";
}

/** A kept booking counts as playing unless the player was marked absent. */
export function countsAsPlayed(session: Session, booking: Booking): boolean {
  return isKept(booking) && attendanceOf(session, booking) !== "no_show";
}
