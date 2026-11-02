/**
 * Rebuilds the SQLite database from data/*.csv. Safe to run any number of
 * times, including while the app is running.
 * Usage: npm run seed
 */
import { loadConfig } from "../src/server/config";
import { openDatabaseForWriting } from "../src/server/db/connection";
import { seedFromCsv } from "../src/server/db/seed";

const { databasePath, dataDir } = loadConfig();

const db = openDatabaseForWriting(databasePath);
const counts = seedFromCsv(db, dataDir);
db.close();

console.log(
  `Seeded ${databasePath}: ${counts.clubs} clubs, ${counts.players} players, ` +
    `${counts.sessions} sessions, ${counts.bookings} bookings.`,
);
