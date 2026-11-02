import type { RangeSelection, SummaryResponse, WeeklyResponse } from "@/contracts/api";
import { firstPlayedOn, summariseActivePlayers } from "@/domain/metrics/active-players";
import { countChange, rateChange } from "@/domain/metrics/change";
import { summariseNoShows } from "@/domain/metrics/no-shows";
import { summariseSessionsHeld } from "@/domain/metrics/sessions-held";
import { weeklyActivity } from "@/domain/metrics/weekly";
import { definitionOf, toNoShowsSnapshot, toReportContext, toSessionsSnapshot } from "./mappers";
import type { ReportScopeLoader } from "./report-scope";

/** The headline numbers and the weekly trend. */
export class InsightsService {
  constructor(private readonly scopes: ReportScopeLoader) {}

  async summary(clubId: string, selection: RangeSelection): Promise<SummaryResponse> {
    const scope = await this.scopes.load(clubId, selection);
    const { asOf, club } = scope;

    const firstPlayed = firstPlayedOn(scope.history, asOf, club.timeZone);
    const players = {
      current: summariseActivePlayers(scope.current, firstPlayed, scope.period, asOf),
      previous: summariseActivePlayers(scope.previous, firstPlayed, scope.previousPeriod, asOf),
    };
    const sessions = {
      current: summariseSessionsHeld(scope.current, asOf),
      previous: summariseSessionsHeld(scope.previous, asOf),
    };
    const noShows = {
      current: summariseNoShows(scope.current, asOf),
      previous: summariseNoShows(scope.previous, asOf),
    };
    // Counts only compare fairly with a previous period in which the club actually ran sessions.
    const previousIsComparable = sessions.previous.held > 0;

    return {
      ...toReportContext(scope),
      metrics: {
        activePlayers: {
          definition: definitionOf("active-players"),
          current: { value: players.current.count, newPlayers: players.current.newPlayers },
          previous: { value: players.previous.count, newPlayers: players.previous.newPlayers },
          change: countChange(players.current.count, players.previous.count, previousIsComparable),
        },
        sessionsHeld: {
          definition: definitionOf("sessions-held"),
          current: toSessionsSnapshot(sessions.current),
          previous: toSessionsSnapshot(sessions.previous),
          change: countChange(sessions.current.held, sessions.previous.held, previousIsComparable),
        },
        noShows: {
          definition: definitionOf("no-shows"),
          current: toNoShowsSnapshot(noShows.current),
          previous: toNoShowsSnapshot(noShows.previous),
          change: rateChange(noShows.current.rate, noShows.previous.rate),
        },
      },
    };
  }

  async weekly(clubId: string, selection: RangeSelection): Promise<WeeklyResponse> {
    const scope = await this.scopes.load(clubId, selection);
    const weeks = weeklyActivity(scope.current, scope.period, scope.club.timeZone, scope.asOf);

    return {
      ...toReportContext(scope),
      definition: definitionOf("weekly-active-players"),
      weeks: weeks.map(({ week, ...counts }) => ({
        weekStart: week.weekStart,
        from: week.from,
        to: week.to,
        isPartial: week.isPartial,
        ...counts,
      })),
    };
  }
}
