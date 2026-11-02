import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { fixedClock } from "@/server/clock";
import { createServices, type Services } from "@/server/container";
import { openInMemoryDatabase } from "@/server/db/connection";
import { seedFromCsv } from "@/server/db/seed";
import { InvalidRequestError, NotFoundError } from "@/server/errors";

// Seeds the real CSV exports and checks the API's numbers against figures
// computed independently (a separate Python script over the raw CSVs), with
// "now" pinned to Monday 5 October 2026, 09:00 in Ho Chi Minh City.
const NOW = new Date("2026-10-05T09:00:00+07:00");
const LAST_4_WEEKS = { kind: "preset", preset: "last-4-weeks" } as const;

let api: Services;

beforeAll(() => {
  const db = openInMemoryDatabase();
  seedFromCsv(db, join(process.cwd(), "data"));
  api = createServices(db, fixedClock(NOW));
});

describe("summary for the last 4 weeks at Saigon Smash", () => {
  it("covers 7 Sep - 4 Oct, compared with 10 Aug - 6 Sep", async () => {
    const summary = await api.insights.summary("club-001", LAST_4_WEEKS);

    expect(summary.period).toEqual({ from: "2026-09-07", to: "2026-10-04", days: 28 });
    expect(summary.previousPeriod).toEqual({ from: "2026-08-10", to: "2026-09-06", days: 28 });
  });

  it("matches the independently computed numbers", async () => {
    const { metrics } = await api.insights.summary("club-001", LAST_4_WEEKS);

    expect(metrics.activePlayers.current).toEqual({ value: 89, newPlayers: 22 });
    expect(metrics.activePlayers.previous).toEqual({ value: 88, newPlayers: 24 });
    expect(metrics.sessionsHeld.current).toMatchObject({ value: 20, cancelled: 0, keptBookings: 264 });
    expect(metrics.sessionsHeld.previous).toMatchObject({ value: 20, cancelled: 0, keptBookings: 248 });
    expect(metrics.noShows.current).toEqual({
      value: 15 / 151,
      noShows: 15,
      checkedBookings: 151,
      uncheckedBookings: 113,
      sessionsWithAttendance: 11,
      sessionsHeld: 20,
    });
    expect(metrics.noShows.previous).toMatchObject({ noShows: 14, checkedBookings: 152, sessionsWithAttendance: 12 });
  });

  it("buckets weeks Monday to Sunday in Ho Chi Minh City, not UTC", async () => {
    const { weeks } = await api.insights.weekly("club-001", LAST_4_WEEKS);

    // Bucketing by UTC date would give 38, 37, 41, 42 players and only 4 sessions in the last week.
    expect(weeks.map((w) => [w.weekStart, w.activePlayers, w.sessionsHeld])).toEqual([
      ["2026-09-07", 37, 5],
      ["2026-09-14", 36, 5],
      ["2026-09-21", 45, 5],
      ["2026-09-28", 44, 5],
    ]);
  });

  it("lists exactly the players and sessions behind the headline numbers", async () => {
    const players = await api.drillDown.activePlayers("club-001", LAST_4_WEEKS);
    const sessions = await api.drillDown.sessionList("club-001", LAST_4_WEEKS);
    const noShows = await api.drillDown.noShows("club-001", LAST_4_WEEKS);

    expect(players.players).toHaveLength(89);
    expect(players.players.filter((p) => p.isNew)).toHaveLength(22);
    expect(sessions.sessions.filter((s) => s.status === "held")).toHaveLength(20);
    expect(noShows.players.reduce((sum, p) => sum + p.noShows, 0)).toBe(15);
  });
});

describe("the February cancellations", () => {
  it("counts cancelled sessions separately and never as held", async () => {
    const { metrics } = await api.insights.summary("club-001", { kind: "custom", from: "2026-02-09", to: "2026-02-22" });

    expect(metrics.sessionsHeld.current).toMatchObject({ value: 4, cancelled: 6 });
    expect(metrics.activePlayers.current.value).toBe(16);
  });
});

describe("the new club with no data", () => {
  it("returns zeros with an unknown no-show rate and nothing to compare", async () => {
    const summary = await api.insights.summary("club-002", LAST_4_WEEKS);

    expect(summary.club).toMatchObject({ name: "Thảo Điền Tennis Club", firstSessionOn: null, createdOn: "2026-10-01" });
    expect(summary.metrics.activePlayers.current.value).toBe(0);
    expect(summary.metrics.activePlayers.change).toBeNull();
    expect(summary.metrics.noShows.current.value).toBeNull();
    expect(summary.metrics.noShows.change).toBeNull();
  });
});

describe("bad requests", () => {
  it("rejects unknown clubs and sessions", async () => {
    await expect(api.insights.summary("nope", LAST_4_WEEKS)).rejects.toThrow(NotFoundError);
    await expect(api.drillDown.sessionDetail("club-001", "nope")).rejects.toThrow(NotFoundError);
  });

  it("rejects ranges that end after today or run backwards", async () => {
    await expect(
      api.insights.summary("club-001", { kind: "custom", from: "2026-10-01", to: "2026-10-06" }),
    ).rejects.toThrow(InvalidRequestError);
    await expect(
      api.insights.summary("club-001", { kind: "custom", from: "2026-09-10", to: "2026-09-01" }),
    ).rejects.toThrow(InvalidRequestError);
    await expect(
      api.insights.summary("club-001", { kind: "custom", from: "2026-02-30", to: "2026-03-01" }),
    ).rejects.toThrow(InvalidRequestError);
  });
});
