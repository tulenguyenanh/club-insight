"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import type { ClubDto, RosterRowDto, SessionDetailResponse } from "@/contracts/api";
import { DataTable, type Column } from "../components/data-table";
import { Badge, Card, Notice } from "../components/primitives";
import { ErrorState, LoadingState } from "../components/states";
import { useApi } from "../hooks/use-api";
import { useReportParams } from "../hooks/use-report-params";
import { apiPaths } from "../lib/api-client";
import { describeTimeZone, formatDateTime, formatDateTimeWithYear, formatTime } from "../lib/format";

const ATTENDANCE_LABEL = {
  attended: <span>Came</span>,
  no_show: <span className="font-medium text-bad">No-show</span>,
  unknown: <span className="text-muted">Not recorded</span>,
} as const;

function columns(club: ClubDto): Column<RosterRowDto>[] {
  return [
    { header: "Player", cell: (row) => <span className="font-medium">{row.name}</span> },
    {
      header: "Booking",
      cell: (row) =>
        row.status === "cancelled" && row.cancelledAt ? (
          <span className="text-muted">Cancelled {formatDateTime(row.cancelledAt, club.timeZone)}</span>
        ) : (
          <span>Booked {formatDateTime(row.bookedAt, club.timeZone)}</span>
        ),
    },
    { header: "Attendance", cell: (row) => (row.attendance ? ATTENDANCE_LABEL[row.attendance] : "–") },
  ];
}

export function SessionDetailView() {
  const { clubId, hrefFor } = useReportParams();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data, error } = useApi<SessionDetailResponse>(
    clubId && sessionId ? apiPaths.session(clubId, decodeURIComponent(sessionId)) : null,
  );

  if (error) return <ErrorState error={error} />;
  if (!data) return <LoadingState />;

  const { club, session, roster } = data;
  const end = new Date(new Date(session.startsAt).getTime() + session.durationMinutes * 60_000).toISOString();
  const kept = roster.filter((row) => row.status === "booked");
  const cancelled = roster.filter((row) => row.status === "cancelled");

  return (
    <>
      <header className="mb-6">
        <Link href={hrefFor("/sessions")} className="text-sm font-medium text-accent-ink hover:underline">
          ← Back to sessions
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{session.title}</h1>
        <p className="mt-1 text-sm text-muted">
          {formatDateTimeWithYear(session.startsAt, club.timeZone)}–{formatTime(end, club.timeZone)} ·{" "}
          {describeTimeZone(club.timeZone, new Date(session.startsAt))} · {club.name}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone={session.status === "cancelled" ? "bad" : "neutral"}>
            {{ held: "Held", cancelled: "Cancelled by the club", upcoming: "Not started yet" }[session.status]}
          </Badge>
          <Badge>
            {session.keptBookings} of {session.places} places booked
          </Badge>
          {session.status === "held" && (
            <Badge>{session.attendanceRecorded ? "Attendance taken" : "Attendance not taken"}</Badge>
          )}
        </div>
      </header>

      {session.status === "held" && !session.attendanceRecorded && (
        <div className="mb-4">
          <Notice>
            Attendance wasn&apos;t taken at this session, so we don&apos;t know who turned up. Its bookings count as
            played for active players, and aren&apos;t counted either way for no-shows.
          </Notice>
        </div>
      )}

      <Card>
        <h2 className="mb-3 font-semibold">
          {kept.length} kept {kept.length === 1 ? "booking" : "bookings"}
          {cancelled.length > 0 && <span className="font-normal text-ink-2">, {cancelled.length} cancelled</span>}
        </h2>
        <DataTable
          caption="Bookings for this session"
          columns={columns(club)}
          rows={roster}
          rowKey={(r) => r.bookingId}
        />
      </Card>
    </>
  );
}
