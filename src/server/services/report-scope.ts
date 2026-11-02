import type { ClubDto, RangeSelection } from "@/contracts/api";
import { addDays, isLocalDate, type LocalDate } from "@/domain/calendar";
import type { Club, Session } from "@/domain/model";
import { periodForPreset, periodLength, previousPeriod, type Period } from "@/domain/period";
import { sessionsIn } from "@/domain/sessions";
import { startOfLocalDay } from "@/domain/time-zone";
import type { Clock } from "../clock";
import { InvalidRequestError } from "../errors";
import type { SessionRepository } from "../repositories/types";
import type { ClubService } from "./club-service";

/** Long enough for a year compared with the year before; short enough to keep weekly charts readable. */
export const MAX_PERIOD_DAYS = 366;

/** Everything a report needs, resolved once per request so every number agrees. */
export interface ReportScope {
  club: Club;
  clubDto: ClubDto;
  asOf: Date;
  period: Period;
  previousPeriod: Period;
  /** All of the club's sessions up to the end of `period`. */
  history: Session[];
  current: Session[];
  previous: Session[];
}

export class ReportScopeLoader {
  constructor(
    private readonly clubService: ClubService,
    private readonly sessions: SessionRepository,
    private readonly clock: Clock,
  ) {}

  async load(clubId: string, selection: RangeSelection): Promise<ReportScope> {
    const asOf = this.clock.now();
    const club = await this.clubService.require(clubId);
    const clubDto = await this.clubService.describe(club, asOf);
    const period = resolvePeriod(selection, clubDto.today);
    const previous = previousPeriod(period);

    const history = await this.sessions.findStartingIn(club.id, {
      start: new Date(0),
      end: startOfLocalDay(addDays(period.to, 1), club.timeZone),
    });

    return {
      club,
      clubDto,
      asOf,
      period,
      previousPeriod: previous,
      history,
      current: sessionsIn(history, period, club.timeZone),
      previous: sessionsIn(history, previous, club.timeZone),
    };
  }
}

export function resolvePeriod(selection: RangeSelection, today: LocalDate): Period {
  if (selection.kind === "preset") return periodForPreset(selection.preset, today);

  const { from, to } = selection;
  if (!isLocalDate(from) || !isLocalDate(to)) {
    throw new InvalidRequestError("Dates must be real calendar days written as YYYY-MM-DD.");
  }
  if (from > to) throw new InvalidRequestError(`"from" (${from}) must be on or before "to" (${to}).`);
  if (to > today) throw new InvalidRequestError(`"to" can't be later than today at the club (${today}).`);

  const period = { from, to };
  if (periodLength(period) > MAX_PERIOD_DAYS) {
    throw new InvalidRequestError(`Choose ${MAX_PERIOD_DAYS} days or fewer.`);
  }
  return period;
}
