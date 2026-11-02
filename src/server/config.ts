import { join } from "node:path";

/**
 * Runtime settings, read once from the environment.
 *
 * `CLUB_INSIGHTS_NOW` pins the clock. The brief treats Monday 5 October 2026,
 * 09:00 in Ho Chi Minh City as now, so that is the default; set it to an empty
 * string to use the real time.
 */
const DEFAULT_NOW = "2026-10-05T09:00:00+07:00";

export interface AppConfig {
  databasePath: string;
  dataDir: string;
  fixedNow: Date | null;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const dataDir = join(process.cwd(), "data");
  return {
    dataDir,
    databasePath: env.DATABASE_PATH || join(dataDir, "club-insights.db"),
    fixedNow: parseNow(env.CLUB_INSIGHTS_NOW ?? DEFAULT_NOW),
  };
}

function parseNow(value: string): Date | null {
  if (value === "") return null;
  const now = new Date(value);
  if (Number.isNaN(now.getTime())) throw new Error(`CLUB_INSIGHTS_NOW is not a valid date: ${value}`);
  return now;
}
