import { describe, expect, it } from "vitest";
import { attendanceOf, countsAsPlayed, isKept, keptBookings } from "@/domain/attendance";
import { heldSessions, isCancelled, isHeld, sessionDate, sessionsIn } from "@/domain/sessions";
import { AS_OF, HCMC, attended, booking, cancelledBooking, noShow, session } from "../support/builders";

const ONE_MINUTE = 60_000;

describe("whether a session was held", () => {
  it("is held once it has started and wasn't cancelled", () => {
    expect(isHeld(session({ startsAt: new Date(AS_OF.getTime() - ONE_MINUTE) }), AS_OF)).toBe(true);
  });

  it("counts a session starting exactly now as held", () => {
    expect(isHeld(session({ startsAt: AS_OF }), AS_OF)).toBe(true);
  });

  it("isn't held before it starts", () => {
    expect(isHeld(session({ startsAt: new Date(AS_OF.getTime() + ONE_MINUTE) }), AS_OF)).toBe(false);
  });

  it("isn't held if the club cancelled it, and only counts as cancelled once its time has passed", () => {
    const pastCancelled = session({ status: "cancelled", startsAt: new Date(AS_OF.getTime() - ONE_MINUTE) });
    const futureCancelled = session({ status: "cancelled", startsAt: new Date(AS_OF.getTime() + ONE_MINUTE) });

    expect(isHeld(pastCancelled, AS_OF)).toBe(false);
    expect(isCancelled(pastCancelled, AS_OF)).toBe(true);
    expect(isCancelled(futureCancelled, AS_OF)).toBe(false);
  });

  it("filters a list down to the held sessions", () => {
    const held = session();
    expect(heldSessions([held, session({ status: "cancelled" })], AS_OF)).toEqual([held]);
  });
});

describe("which day a session belongs to", () => {
  const earlyBirdMonday = session({ startsAt: new Date("2026-09-27T22:30:00Z") });

  it("is the day it starts on at the club", () => {
    expect(sessionDate(earlyBirdMonday, HCMC)).toBe("2026-09-28");
  });

  it("decides which period it falls in", () => {
    expect(sessionsIn([earlyBirdMonday], { from: "2026-09-28", to: "2026-09-28" }, HCMC)).toHaveLength(1);
    expect(sessionsIn([earlyBirdMonday], { from: "2026-09-27", to: "2026-09-27" }, HCMC)).toHaveLength(0);
  });
});

describe("attendance", () => {
  it("is known only where attendance was taken", () => {
    const taken = session({ attendanceRecorded: true });
    const notTaken = session({ attendanceRecorded: false });

    expect(attendanceOf(taken, attended())).toBe("attended");
    expect(attendanceOf(taken, noShow())).toBe("no_show");
    expect(attendanceOf(taken, booking({ attended: null }))).toBe("unknown");
    // A stray mark on a session without attendance is ignored, not trusted.
    expect(attendanceOf(notTaken, noShow())).toBe("unknown");
  });

  it("treats kept bookings as played unless marked absent", () => {
    const taken = session();

    expect(countsAsPlayed(taken, attended())).toBe(true);
    expect(countsAsPlayed(taken, booking({ attended: null }))).toBe(true);
    expect(countsAsPlayed(taken, noShow())).toBe(false);
    expect(countsAsPlayed(taken, cancelledBooking())).toBe(false);
  });

  it("separates kept bookings from cancelled ones", () => {
    const kept = attended();
    const s = session({ bookings: [kept, cancelledBooking()] });

    expect(isKept(kept)).toBe(true);
    expect(keptBookings(s)).toEqual([kept]);
  });
});
