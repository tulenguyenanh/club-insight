import type {
  MetricDefinitionDto,
  NoShowsSnapshot,
  PeriodDto,
  ReportContext,
  SessionRowDto,
  SessionsHeldSnapshot,
} from "@/contracts/api";
import { attendanceOf, keptBookings } from "@/domain/attendance";
import { METRIC_DEFINITIONS, type MetricKey } from "@/domain/metrics/definitions";
import type { NoShowSummary } from "@/domain/metrics/no-shows";
import type { SessionsHeldSummary } from "@/domain/metrics/sessions-held";
import type { Attendance, Session } from "@/domain/model";
import { periodLength, type Period } from "@/domain/period";
import { isHeld } from "@/domain/sessions";
import type { ReportScope } from "./report-scope";

/** Domain objects -> API shapes. No business rules live here, only translation. */

export function toPeriodDto(period: Period): PeriodDto {
  return { from: period.from, to: period.to, days: periodLength(period) };
}

export function toReportContext(scope: ReportScope): ReportContext {
  return {
    club: scope.clubDto,
    period: toPeriodDto(scope.period),
    previousPeriod: toPeriodDto(scope.previousPeriod),
    asOf: scope.asOf.toISOString(),
  };
}

export function definitionOf(key: MetricKey): MetricDefinitionDto {
  return METRIC_DEFINITIONS[key];
}

export function toSessionsSnapshot(summary: SessionsHeldSummary): SessionsHeldSnapshot {
  return {
    value: summary.held,
    cancelled: summary.cancelled,
    keptBookings: summary.keptBookings,
    fillRate: summary.fillRate,
  };
}

export function toNoShowsSnapshot(summary: NoShowSummary): NoShowsSnapshot {
  return {
    value: summary.rate,
    noShows: summary.noShows,
    checkedBookings: summary.checkedBookings,
    uncheckedBookings: summary.uncheckedBookings,
    sessionsWithAttendance: summary.sessionsWithAttendance,
    sessionsHeld: summary.sessionsHeld,
  };
}

export function toSessionRow(session: Session, asOf: Date): SessionRowDto {
  const kept = keptBookings(session);
  const outcomes = kept.map((booking) => attendanceOf(session, booking));
  const countOf = (outcome: Attendance) => outcomes.filter((o) => o === outcome).length;

  return {
    id: session.id,
    title: session.title,
    startsAt: session.startsAt.toISOString(),
    durationMinutes: session.durationMinutes,
    places: session.places,
    status: session.status === "cancelled" ? "cancelled" : isHeld(session, asOf) ? "held" : "upcoming",
    attendanceRecorded: session.attendanceRecorded,
    keptBookings: kept.length,
    cancelledBookings: session.bookings.length - kept.length,
    attended: session.attendanceRecorded ? countOf("attended") : null,
    noShows: session.attendanceRecorded ? countOf("no_show") : null,
  };
}
