import { describe, expect, it, vi } from "vitest";
import { GET as home } from "@/app/route";
import { GET as clubs } from "@/app/api/clubs/route";
import { GET as club } from "@/app/api/clubs/[clubId]/route";
import { GET as summary } from "@/app/api/clubs/[clubId]/summary/route";
import { GET as weekly } from "@/app/api/clubs/[clubId]/weekly/route";
import { GET as activePlayers } from "@/app/api/clubs/[clubId]/active-players/route";
import { GET as sessions } from "@/app/api/clubs/[clubId]/sessions/route";
import { GET as sessionDetail } from "@/app/api/clubs/[clubId]/sessions/[sessionId]/route";
import { GET as noShows } from "@/app/api/clubs/[clubId]/no-shows/route";
import { callRoute } from "../support/route-client";

// The route handlers run for real (parsing, services, error mapping); only the
// composition root is swapped for the CSV data in memory with the clock pinned.
vi.mock("@/server/container", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/container")>();
  const { BRIEF_NOW, seededDatabase } = await import("../support/seeded-database");
  const { fixedClock } = await import("@/server/clock");
  const seeded = actual.createServices(seededDatabase(), fixedClock(BRIEF_NOW));
  return { ...actual, services: () => seeded };
});

// connection() only works inside a real Next.js request; here there is nothing to wait for.
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  connection: async () => undefined,
}));

const CLUB = { clubId: "club-001" };

describe("the JSON API contract", () => {
  it("lists clubs with the club's today and first session", async () => {
    const { status, body } = await callRoute(clubs, "/api/clubs");

    expect(status).toBe(200);
    expect(body.clubs).toEqual([
      expect.objectContaining({ id: "club-001", today: "2026-10-05", firstSessionOn: "2026-01-05" }),
      expect.objectContaining({ id: "club-002", firstSessionOn: null }),
    ]);
  });

  it("answers a summary with its period, comparison and definitions", async () => {
    const { status, body } = await callRoute(summary, "/api/clubs/club-001/summary", CLUB);

    expect(status).toBe(200);
    expect(body.period).toEqual({ from: "2026-09-07", to: "2026-10-04", days: 28 });
    expect(body.comparison).toEqual({ available: true });
    expect(body.metrics.noShows.definition.rules.length).toBeGreaterThan(0);
  });

  it.each([
    ["?range=last-3-weeks", /Unknown range/],
    ["?from=2026-09-01", /both "from" and "to"/],
    ["?from=2026-09-10&to=2026-09-01", /must be on or before/],
    ["?from=2026-09-01&to=2026-10-06", /can't be later than today/],
    ["?from=2026-02-30&to=2026-03-01", /real calendar days/],
    ["?from=2026-13-01&to=2026-10-01", /real calendar days/],
  ])("rejects %s with a 400 the client can show", async (query, message) => {
    const { status, body } = await callRoute(summary, `/api/clubs/club-001/summary${query}`, CLUB);

    expect(status).toBe(400);
    expect(body.error.code).toBe("invalid_request");
    expect(body.error.message).toMatch(message);
  });

  it("answers 404 for an unknown club or session", async () => {
    const unknownClub = await callRoute(club, "/api/clubs/nope", { clubId: "nope" });
    const unknownSession = await callRoute(sessionDetail, "/api/clubs/club-001/sessions/s9999", {
      ...CLUB,
      sessionId: "s9999",
    });

    expect(unknownClub.status).toBe(404);
    expect(unknownClub.body.error.code).toBe("not_found");
    expect(unknownSession.status).toBe(404);
  });

  it("serves every drill-down for the same range", async () => {
    const query = "?range=last-8-weeks";
    const responses = await Promise.all([
      callRoute(weekly, `/api/clubs/club-001/weekly${query}`, CLUB),
      callRoute(activePlayers, `/api/clubs/club-001/active-players${query}`, CLUB),
      callRoute(sessions, `/api/clubs/club-001/sessions${query}`, CLUB),
      callRoute(noShows, `/api/clubs/club-001/no-shows${query}`, CLUB),
    ]);

    for (const { status, body } of responses) {
      expect(status).toBe(200);
      expect(body.period).toEqual({ from: "2026-08-10", to: "2026-10-04", days: 56 });
    }
  });

  it("returns one session with its roster", async () => {
    const { status, body } = await callRoute(sessionDetail, "/api/clubs/club-001/sessions/s0001", {
      ...CLUB,
      sessionId: "s0001",
    });

    expect(status).toBe(200);
    expect(body.session).toMatchObject({ id: "s0001", title: "Early Bird Monday", status: "held" });
    expect(body.roster.length).toBeGreaterThan(0);
  });
});

describe("the home page", () => {
  it("redirects to the first club with a temporary redirect", async () => {
    const { status, headers } = await callRoute(home, "/");

    expect(status).toBe(307);
    expect(headers.get("location")).toBe("http://localhost/clubs/club-001");
  });
});
