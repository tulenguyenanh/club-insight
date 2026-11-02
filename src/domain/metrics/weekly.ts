import type { Session } from "../model";
import { weeksOf, type Period, type WeekSlice } from "../period";
import { heldSessions, isCancelled, sessionsIn } from "../sessions";
import { activePlayerIds } from "./active-players";

export interface WeekActivity {
  week: WeekSlice;
  /** Distinct active players this week. A player counts once in every week they play. */
  activePlayers: number;
  sessionsHeld: number;
  sessionsCancelled: number;
}

/** Active players for each Monday-to-Sunday week (in the club's time zone) that overlaps `period`. */
export function weeklyActivity(
  sessions: readonly Session[],
  period: Period,
  timeZone: string,
  asOf: Date,
): WeekActivity[] {
  return weeksOf(period).map((week) => {
    const inWeek = sessionsIn(sessions, week, timeZone);
    return {
      week,
      activePlayers: activePlayerIds(inWeek, asOf).size,
      sessionsHeld: heldSessions(inWeek, asOf).length,
      sessionsCancelled: inWeek.filter((session) => isCancelled(session, asOf)).length,
    };
  });
}
