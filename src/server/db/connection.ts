import BetterSqlite3 from "better-sqlite3";
import { existsSync } from "node:fs";

export type Database = BetterSqlite3.Database;

/** An in-memory database, for tests. */
export function openInMemoryDatabase(): Database {
  return configure(new BetterSqlite3(":memory:"));
}

/** Opens (and creates, if needed) the database file the seed script writes. */
export function openDatabaseForWriting(path: string): Database {
  return configure(new BetterSqlite3(path));
}

/** Opens the seeded database read-only: the API never writes. */
export function openDatabaseForReading(path: string): Database {
  if (!existsSync(path)) {
    throw new Error(`No database at ${path}. Run \`npm run seed\` to build it from data/*.csv.`);
  }
  return configure(new BetterSqlite3(path, { readonly: true, fileMustExist: true }));
}

function configure(db: Database): Database {
  db.pragma("foreign_keys = ON");
  return db;
}
