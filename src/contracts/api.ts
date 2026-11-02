/**
 * The JSON contract of the Club Insights API.
 *
 * The web dashboard and the mobile app both read these shapes, so they carry
 * everything a screen needs to show a number honestly: the value, what it is
 * compared with, and its definition. Instants are ISO-8601 UTC strings; show
 * them in `club.timeZone`, not the viewer's time zone. Calendar days are
 * `YYYY-MM-DD` in the club's time zone.
 */
import type { MetricKey } from "@/domain/metrics/definitions";
import type { RangePreset } from "@/domain/period";

export type IsoDateTime = string;
export type LocalDateString = string;

export type { MetricKey, RangePreset };

/** `?range=last-4-weeks`, or `?from=2026-09-01&to=2026-09-30`. Defaults to the last 4 full weeks. */
export type RangeSelection =
  { kind: "preset"; preset: RangePreset } | { kind: "custom"; from: LocalDateString; to: LocalDateString };

export interface ApiErrorBody {
  error: { code: "invalid_request" | "not_found" | "internal"; message: string };
}

export interface ClubDto {
  id: string;
  name: string;
  timeZone: string;
  createdOn: LocalDateString;
  /** Today's date at the club. Ranges can't go past it. */
  today: LocalDateString;
  /** Day of the first session that went ahead, or null if the club hasn't held one yet. */
  firstSessionOn: LocalDateString | null;
}

export interface ClubListResponse {
  clubs: ClubDto[];
}

export interface PeriodDto {
  from: LocalDateString;
  to: LocalDateString;
  days: number;
}

export interface MetricDefinitionDto {
  key: MetricKey;
  label: string;
  summary: string;
  rules: readonly string[];
  higherIsBetter: boolean;
}

export interface ChangeDto {
  absolute: number;
  relative: number | null;
}

/** Every report says which club and dates it covers, and when it was computed. */
export interface ReportContext {
  club: ClubDto;
  period: PeriodDto;
  previousPeriod: PeriodDto;
  comparison: ComparisonDto;
  asOf: IsoDateTime;
}

/**
 * Whether comparing with the previous period is fair. It isn't when that
 * period starts before the club's first session: part of it would be empty.
 */
export type ComparisonDto =
  { available: true } | { available: false; reason: "no_sessions_yet" | "starts_before_first_session" };

export interface MetricDto<TSnapshot> {
  definition: MetricDefinitionDto;
  current: TSnapshot;
  previous: TSnapshot;
  /** Null when the previous period has nothing to compare with. */
  change: ChangeDto | null;
}

export interface ActivePlayersSnapshot {
  value: number;
  newPlayers: number;
}

export interface SessionsHeldSnapshot {
  value: number;
  cancelled: number;
  keptBookings: number;
  fillRate: number | null;
}

export interface NoShowsSnapshot {
  /** No-show rate as a fraction. Null means unknown: no attendance was taken. */
  value: number | null;
  noShows: number;
  checkedBookings: number;
  uncheckedBookings: number;
  sessionsWithAttendance: number;
  sessionsHeld: number;
}

export interface SummaryResponse extends ReportContext {
  metrics: {
    activePlayers: MetricDto<ActivePlayersSnapshot>;
    sessionsHeld: MetricDto<SessionsHeldSnapshot>;
    noShows: MetricDto<NoShowsSnapshot>;
  };
}

export interface WeekDto {
  /** Which side of the comparison this week belongs to. */
  period: "previous" | "current";
  weekStart: LocalDateString;
  /** The days of this week inside the chosen period. */
  from: LocalDateString;
  to: LocalDateString;
  isPartial: boolean;
  activePlayers: number;
  sessionsHeld: number;
  sessionsCancelled: number;
}

export interface WeeklyResponse extends ReportContext {
  definition: MetricDefinitionDto;
  /** The previous period's weeks, then the chosen period's, in date order. */
  weeks: WeekDto[];
}

export interface ActivePlayerRowDto {
  playerId: string;
  name: string;
  sessionsPlayed: number;
  noShows: number;
  lastPlayedAt: IsoDateTime | null;
  firstPlayedOn: LocalDateString | null;
  isNew: boolean;
}

export interface ActivePlayersResponse extends ReportContext {
  definition: MetricDefinitionDto;
  players: ActivePlayerRowDto[];
}

export interface SessionRowDto {
  id: string;
  title: string;
  startsAt: IsoDateTime;
  durationMinutes: number;
  places: number;
  status: "held" | "cancelled" | "upcoming";
  attendanceRecorded: boolean;
  keptBookings: number;
  cancelledBookings: number;
  /** Null when attendance wasn't taken. */
  attended: number | null;
  noShows: number | null;
}

export interface SessionsResponse extends ReportContext {
  definition: MetricDefinitionDto;
  sessions: SessionRowDto[];
}

export interface NoShowPlayerRowDto {
  playerId: string;
  name: string;
  noShows: number;
  checkedBookings: number;
  rate: number;
  lastNoShowAt: IsoDateTime | null;
}

export interface NoShowsResponse extends ReportContext {
  definition: MetricDefinitionDto;
  coverage: NoShowsSnapshot;
  players: NoShowPlayerRowDto[];
}

export type Attendance = "attended" | "no_show" | "unknown";

export interface RosterRowDto {
  bookingId: string;
  playerId: string;
  name: string;
  bookedAt: IsoDateTime;
  status: "booked" | "cancelled";
  cancelledAt: IsoDateTime | null;
  /** Null for cancelled bookings: attendance doesn't apply. */
  attendance: Attendance | null;
}

export interface SessionDetailResponse {
  club: ClubDto;
  asOf: IsoDateTime;
  session: SessionRowDto;
  roster: RosterRowDto[];
}
