import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { fixedClock } from "@/server/clock";
import { loadConfig } from "@/server/config";
import { openDatabaseForReading, openInMemoryDatabase } from "@/server/db/connection";

describe("loadConfig", () => {
  it("defaults to the brief's 'now' and the seeded database in data/", () => {
    const config = loadConfig({});

    expect(config.fixedNow?.toISOString()).toBe("2026-10-05T02:00:00.000Z");
    expect(config.databasePath).toBe(join(process.cwd(), "data", "club-insights.db"));
  });

  it("can pin a different moment, or use the real clock", () => {
    expect(loadConfig({ CLUB_INSIGHTS_NOW: "2026-09-01T12:00:00+07:00" }).fixedNow?.toISOString()).toBe(
      "2026-09-01T05:00:00.000Z",
    );
    expect(loadConfig({ CLUB_INSIGHTS_NOW: "" }).fixedNow).toBeNull();
  });

  it("refuses a 'now' that isn't a date", () => {
    expect(() => loadConfig({ CLUB_INSIGHTS_NOW: "next Tuesday" })).toThrow(/CLUB_INSIGHTS_NOW/);
  });

  it("reads the database path from the environment", () => {
    expect(loadConfig({ DATABASE_PATH: "/tmp/other.db" }).databasePath).toBe("/tmp/other.db");
  });
});

describe("fixedClock", () => {
  it("always tells the same time, and can't be changed through what it returns", () => {
    const clock = fixedClock(new Date("2026-10-05T02:00:00Z"));
    clock.now().setFullYear(1999);

    expect(clock.now().toISOString()).toBe("2026-10-05T02:00:00.000Z");
  });
});

describe("database connections", () => {
  it("explains how to create a missing database instead of failing obscurely", () => {
    expect(() => openDatabaseForReading(join(process.cwd(), "data", "does-not-exist.db"))).toThrow(/npm run seed/);
  });

  it("enforces foreign keys", () => {
    const db = openInMemoryDatabase();

    expect(db.pragma("foreign_keys", { simple: true })).toBe(1);
  });
});
