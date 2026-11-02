import { describe, expect, it } from "vitest";
import { summariseSessionsHeld } from "@/domain/metrics/sessions-held";
import { AS_OF, attended, cancelledBooking, noShow, session } from "../../support/builders";

describe("summariseSessionsHeld", () => {
  it("counts held sessions, and cancelled ones separately", () => {
    const sessions = [session(), session(), session({ status: "cancelled" })];

    expect(summariseSessionsHeld(sessions, AS_OF)).toMatchObject({ held: 2, cancelled: 1 });
  });

  it("leaves out sessions that haven't started", () => {
    const later = new Date(AS_OF.getTime() + 60_000);

    expect(summariseSessionsHeld([session({ startsAt: later })], AS_OF)).toMatchObject({ held: 0, cancelled: 0 });
  });

  it("fills places with kept bookings, no-shows included, cancellations not", () => {
    const sessions = [
      session({ places: 10, bookings: [attended(), noShow(), cancelledBooking()] }),
      session({ places: 10, bookings: [attended(), attended()] }),
    ];

    expect(summariseSessionsHeld(sessions, AS_OF)).toMatchObject({
      keptBookings: 4,
      placesOffered: 20,
      fillRate: 0.2,
    });
  });

  it("has no fill rate when nothing was held", () => {
    expect(summariseSessionsHeld([], AS_OF)).toEqual({
      held: 0,
      cancelled: 0,
      keptBookings: 0,
      placesOffered: 0,
      fillRate: null,
    });
  });
});
