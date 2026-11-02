import type {
  ActivePlayersResponse,
  NoShowsResponse,
  RangeSelection,
  RosterRowDto,
  SessionDetailResponse,
  SessionsResponse,
} from "@/contracts/api";
import { attendanceOf, isKept } from "@/domain/attendance";
import { firstPlayedOn, isNewInPeriod } from "@/domain/metrics/active-players";
import { summariseNoShows } from "@/domain/metrics/no-shows";
import { summarisePlayers } from "@/domain/metrics/player-activity";
import type { Booking, Session } from "@/domain/model";
import type { Clock } from "../clock";
import { NotFoundError } from "../errors";
import type { SessionRepository } from "../repositories/types";
import type { ClubService } from "./club-service";
import { definitionOf, toNoShowsSnapshot, toReportContext, toSessionRow } from "./mappers";
import type { ReportScopeLoader } from "./report-scope";

/** The sessions and players behind each headline number. */
export class DrillDownService {
  constructor(
    private readonly scopes: ReportScopeLoader,
    private readonly clubService: ClubService,
    private readonly sessions: SessionRepository,
    private readonly clock: Clock,
  ) {}

  async activePlayers(clubId: string, selection: RangeSelection): Promise<ActivePlayersResponse> {
    const scope = await this.scopes.load(clubId, selection);
    const firstPlayed = firstPlayedOn(scope.history, scope.asOf, scope.club.timeZone);

    const players = summarisePlayers(scope.current, scope.asOf)
      .filter((player) => player.sessionsPlayed > 0)
      .sort((a, b) => b.sessionsPlayed - a.sessionsPlayed || a.playerName.localeCompare(b.playerName))
      .map((player) => ({
        playerId: player.playerId,
        name: player.playerName,
        sessionsPlayed: player.sessionsPlayed,
        noShows: player.noShows,
        lastPlayedAt: player.lastPlayedAt?.toISOString() ?? null,
        firstPlayedOn: firstPlayed.get(player.playerId) ?? null,
        isNew: isNewInPeriod(player.playerId, firstPlayed, scope.period),
      }));

    return { ...toReportContext(scope), definition: definitionOf("active-players"), players };
  }

  async sessionList(clubId: string, selection: RangeSelection): Promise<SessionsResponse> {
    const scope = await this.scopes.load(clubId, selection);
    const sessions = [...scope.current]
      .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime())
      .map((session) => toSessionRow(session, scope.asOf));

    return { ...toReportContext(scope), definition: definitionOf("sessions-held"), sessions };
  }

  async noShows(clubId: string, selection: RangeSelection): Promise<NoShowsResponse> {
    const scope = await this.scopes.load(clubId, selection);

    const players = summarisePlayers(scope.current, scope.asOf)
      .filter((player) => player.noShows > 0)
      .map((player) => ({
        playerId: player.playerId,
        name: player.playerName,
        noShows: player.noShows,
        checkedBookings: player.checkedBookings,
        rate: player.noShows / player.checkedBookings,
        lastNoShowAt: player.lastNoShowAt?.toISOString() ?? null,
      }))
      .sort((a, b) => b.noShows - a.noShows || b.rate - a.rate || a.name.localeCompare(b.name));

    return {
      ...toReportContext(scope),
      definition: definitionOf("no-shows"),
      coverage: toNoShowsSnapshot(summariseNoShows(scope.current, scope.asOf)),
      players,
    };
  }

  async sessionDetail(clubId: string, sessionId: string): Promise<SessionDetailResponse> {
    const asOf = this.clock.now();
    const club = await this.clubService.require(clubId);
    const session = await this.sessions.findById(club.id, sessionId);
    if (!session) throw new NotFoundError(`No session "${sessionId}" at ${club.name}.`);

    return {
      club: await this.clubService.describe(club, asOf),
      asOf: asOf.toISOString(),
      session: toSessionRow(session, asOf),
      roster: [...session.bookings].sort(byRosterOrder).map((booking) => toRosterRow(session, booking)),
    };
  }
}

/** Kept bookings first, then cancellations; alphabetical within each. */
function byRosterOrder(a: Booking, b: Booking): number {
  return Number(isKept(b)) - Number(isKept(a)) || a.playerName.localeCompare(b.playerName);
}

function toRosterRow(session: Session, booking: Booking): RosterRowDto {
  return {
    bookingId: booking.id,
    playerId: booking.playerId,
    name: booking.playerName,
    bookedAt: booking.bookedAt.toISOString(),
    status: booking.status,
    cancelledAt: booking.cancelledAt?.toISOString() ?? null,
    attendance: isKept(booking) ? attendanceOf(session, booking) : null,
  };
}
