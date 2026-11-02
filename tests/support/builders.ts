import type { Booking, Session } from "@/domain/model";

/** Small builders so each test spells out only what it is about. */

let nextId = 1;

export function booking(overrides: Partial<Booking> = {}): Booking {
  const id = nextId++;
  return {
    id: `b${id}`,
    playerId: `p${id}`,
    playerName: `Player ${id}`,
    bookedAt: new Date("2026-09-01T00:00:00Z"),
    status: "booked",
    cancelledAt: null,
    attended: null,
    ...overrides,
  };
}

export function attended(overrides: Partial<Booking> = {}): Booking {
  return booking({ attended: true, ...overrides });
}

export function noShow(overrides: Partial<Booking> = {}): Booking {
  return booking({ attended: false, ...overrides });
}

export function cancelledBooking(overrides: Partial<Booking> = {}): Booking {
  return booking({ status: "cancelled", cancelledAt: new Date("2026-09-02T00:00:00Z"), ...overrides });
}

export function session(overrides: Partial<Session> = {}): Session {
  return {
    id: `s${nextId++}`,
    clubId: "club-test",
    title: "Open Play",
    startsAt: new Date("2026-09-15T12:00:00Z"),
    durationMinutes: 120,
    places: 12,
    status: "scheduled",
    attendanceRecorded: true,
    bookings: [],
    ...overrides,
  };
}

export const AS_OF = new Date("2026-10-05T02:00:00Z"); // Monday 5 Oct 2026, 09:00 in Ho Chi Minh City
export const HCMC = "Asia/Ho_Chi_Minh";
