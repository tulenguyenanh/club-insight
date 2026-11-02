import { join } from "node:path";
import { openInMemoryDatabase, type Database } from "@/server/db/connection";
import { seedFromCsv } from "@/server/db/seed";

/** The brief's "now": Monday 5 October 2026, 09:00 in Ho Chi Minh City. */
export const BRIEF_NOW = new Date("2026-10-05T09:00:00+07:00");

/**
 * The real CSV exports, loaded into an in-memory database.
 * Deliberately doesn't import the container, so tests can mock the container with it.
 */
export function seededDatabase(): Database {
  const db = openInMemoryDatabase();
  seedFromCsv(db, join(process.cwd(), "data"));
  return db;
}
