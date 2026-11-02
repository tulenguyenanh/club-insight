import { fixedClock, systemClock, type Clock } from "./clock";
import { loadConfig } from "./config";
import { openDatabaseForReading, type Database } from "./db/connection";
import { SqliteClubRepository } from "./repositories/sqlite-club-repository";
import { SqliteSessionRepository } from "./repositories/sqlite-session-repository";
import { ClubService } from "./services/club-service";
import { DrillDownService } from "./services/drill-down-service";
import { InsightsService } from "./services/insights-service";
import { ReportScopeLoader } from "./services/report-scope";

/**
 * Composition root: the only place that knows which concrete classes are used.
 * Tests call `createServices` with an in-memory database and a fixed clock.
 */
export interface Services {
  clubs: ClubService;
  insights: InsightsService;
  drillDown: DrillDownService;
}

export function createServices(db: Database, clock: Clock): Services {
  const clubRepository = new SqliteClubRepository(db);
  const sessionRepository = new SqliteSessionRepository(db);
  const clubs = new ClubService(clubRepository, sessionRepository, clock);
  const scopes = new ReportScopeLoader(clubs, sessionRepository, clock);

  return {
    clubs,
    insights: new InsightsService(scopes),
    drillDown: new DrillDownService(scopes, clubs, sessionRepository, clock),
  };
}

// Kept on globalThis so hot reloads in development reuse one connection.
const globalForServices = globalThis as typeof globalThis & { clubInsightsServices?: Services };

export function services(): Services {
  globalForServices.clubInsightsServices ??= createDefaultServices();
  return globalForServices.clubInsightsServices;
}

function createDefaultServices(): Services {
  const config = loadConfig();
  const clock = config.fixedNow ? fixedClock(config.fixedNow) : systemClock;
  return createServices(openDatabaseForReading(config.databasePath), clock);
}
