import type { LocalDate } from "./calendar";

export interface Club {
  id: string;
  name: string;
  timeZone: string;
  createdOn: LocalDate;
}

export type SessionStatus = "scheduled" | "cancelled";
export type BookingStatus = "booked" | "cancelled";

export interface Booking {
  id: string;
  playerId: string;
  playerName: string;
  bookedAt: Date;
  status: BookingStatus;
  cancelledAt: Date | null;
  /** Null when attendance was not taken for this booking. */
  attended: boolean | null;
}

export interface Session {
  id: string;
  clubId: string;
  title: string;
  startsAt: Date;
  durationMinutes: number;
  places: number;
  status: SessionStatus;
  attendanceRecorded: boolean;
  bookings: readonly Booking[];
}

/** What we know about whether a kept booking turned into a player on court. */
export type Attendance = "attended" | "no_show" | "unknown";
