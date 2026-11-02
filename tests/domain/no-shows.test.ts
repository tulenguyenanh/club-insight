import { describe, expect, it } from "vitest";
import { summariseNoShows } from "@/domain/metrics/no-shows";
import { AS_OF, attended, booking, cancelledBooking, noShow, session } from "../support/builders";

// The no-show rate is the number most likely to be wrong: attendance was only
// taken at some sessions, and every shortcut (treating blanks as "came",
// counting cancellations, dividing by all bookings) gives a plausible-looking
// but wrong answer.
describe("summariseNoShows", () => {
  it("is unknown, not zero, when no attendance was taken", () => {
    const sessions = [session({ attendanceRecorded: false, bookings: [booking(), booking()] })];

    const result = summariseNoShows(sessions, AS_OF);

    expect(result.rate).toBeNull();
    expect(result.noShows).toBe(0);
    expect(result.checkedBookings).toBe(0);
    expect(result.uncheckedBookings).toBe(2);
    expect(result.sessionsWithAttendance).toBe(0);
    expect(result.sessionsHeld).toBe(1);
  });

  it("is a real zero when attendance was taken and everyone came", () => {
    const sessions = [session({ bookings: [attended(), attended()] })];

    expect(summariseNoShows(sessions, AS_OF).rate).toBe(0);
  });

  it("only divides by bookings at sessions where attendance was taken", () => {
    const sessions = [
      session({ bookings: [noShow(), attended(), attended(), attended()] }),
      // 8 bookings with no attendance: they must not dilute the rate to 1 in 12.
      session({ attendanceRecorded: false, bookings: Array.from({ length: 8 }, () => booking()) }),
    ];

    const result = summariseNoShows(sessions, AS_OF);

    expect(result.noShows).toBe(1);
    expect(result.checkedBookings).toBe(4);
    expect(result.uncheckedBookings).toBe(8);
    expect(result.rate).toBe(0.25);
    expect(result.sessionsWithAttendance).toBe(1);
    expect(result.sessionsHeld).toBe(2);
  });

  it("never counts a cancelled booking as a no-show", () => {
    const sessions = [session({ bookings: [attended(), cancelledBooking(), cancelledBooking()] })];

    const result = summariseNoShows(sessions, AS_OF);

    expect(result.noShows).toBe(0);
    expect(result.checkedBookings).toBe(1);
  });

  it("ignores sessions the club cancelled", () => {
    const sessions = [session({ status: "cancelled", bookings: [noShow()] }), session({ bookings: [attended()] })];

    const result = summariseNoShows(sessions, AS_OF);

    expect(result.noShows).toBe(0);
    expect(result.sessionsHeld).toBe(1);
  });

  it("ignores sessions that haven't started yet", () => {
    const later = new Date(AS_OF.getTime() + 60 * 60 * 1000);
    const sessions = [session({ startsAt: later, bookings: [noShow()] })];

    expect(summariseNoShows(sessions, AS_OF)).toMatchObject({ rate: null, sessionsHeld: 0 });
  });

  it("treats a blank attendance mark at a checked session as unknown", () => {
    const sessions = [session({ bookings: [noShow(), attended(), booking({ attended: null })] })];

    const result = summariseNoShows(sessions, AS_OF);

    expect(result.checkedBookings).toBe(2);
    expect(result.uncheckedBookings).toBe(1);
    expect(result.rate).toBe(0.5);
  });
});
