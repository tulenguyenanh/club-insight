"use client";

import Link from "next/link";
import { useState } from "react";
import type { ClubDto, SessionRowDto, SessionsResponse } from "@/contracts/api";
import { DataTable, type Column } from "../components/data-table";
import { Definition } from "../components/definition";
import { Badge, Card } from "../components/primitives";
import { EmptyState } from "../components/states";
import { useApi } from "../hooks/use-api";
import { useReportParams } from "../hooks/use-report-params";
import { apiPaths } from "../lib/api-client";
import { formatDateTime, plural } from "../lib/format";
import { ReportView } from "./report-view";

const FILTERS = {
  all: { label: "All", keep: () => true },
  held: { label: "Held", keep: (s: SessionRowDto) => s.status === "held" },
  cancelled: { label: "Cancelled", keep: (s: SessionRowDto) => s.status === "cancelled" },
  "no-attendance": {
    label: "Attendance not taken",
    keep: (s: SessionRowDto) => s.status === "held" && !s.attendanceRecorded,
  },
} as const;

type FilterKey = keyof typeof FILTERS;

function columns(club: ClubDto, sessionHref: (id: string) => string): Column<SessionRowDto>[] {
  return [
    {
      header: "Session",
      cell: (session) => (
        <Link href={sessionHref(session.id)} className="group flex flex-col">
          <span className="font-medium text-accent-ink group-hover:underline">{session.title}</span>
          <span className="text-xs text-muted">{formatDateTime(session.startsAt, club.timeZone)}</span>
        </Link>
      ),
    },
    {
      header: "Booked",
      align: "right",
      cell: (session) => (
        <>
          {session.keptBookings}
          <span className="text-muted"> / {session.places}</span>
        </>
      ),
    },
    {
      header: "Cancelled bookings",
      align: "right",
      hideOnMobile: true,
      cell: (session) => session.cancelledBookings || "–",
    },
    { header: "Attendance", cell: (session) => <AttendanceSummary session={session} /> },
  ];
}

function AttendanceSummary({ session }: { session: SessionRowDto }) {
  if (session.status === "cancelled") return <Badge>Session cancelled</Badge>;
  if (session.status === "upcoming") return <Badge>Not started</Badge>;
  if (session.attended === null || session.noShows === null) return <span className="text-muted">Not taken</span>;
  return (
    <span>
      {session.attended} came
      {session.noShows > 0 && <span className="text-bad"> · {plural(session.noShows, "no-show")}</span>}
    </span>
  );
}

export function SessionsView() {
  const { clubId, range, hrefFor } = useReportParams();
  const query = useApi<SessionsResponse>(clubId ? apiPaths.sessions(clubId, range) : null);
  const [filter, setFilter] = useState<FilterKey>("all");

  return (
    <ReportView title="Sessions" query={query}>
      {(data) => {
        const rows = data.sessions.filter(FILTERS[filter].keep);
        const held = data.sessions.filter(FILTERS.held.keep).length;
        const cancelled = data.sessions.filter(FILTERS.cancelled.keep).length;
        return (
          <Card>
            <div className="mb-4 flex flex-col gap-2">
              <p className="text-lg font-semibold">
                {plural(held, "session")} held
                <span className="font-normal text-ink-2">, {cancelled} cancelled</span>
              </p>
              <Definition definition={data.definition} />
            </div>

            <div role="group" aria-label="Show sessions" className="mb-3 flex flex-wrap gap-1.5">
              {(Object.keys(FILTERS) as FilterKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={filter === key}
                  onClick={() => setFilter(key)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    filter === key ? "border-ink bg-ink text-surface" : "border-line text-ink-2 hover:bg-accent-wash"
                  }`}
                >
                  {FILTERS[key].label} ({data.sessions.filter(FILTERS[key].keep).length})
                </button>
              ))}
            </div>

            <DataTable
              caption="Sessions in this period, latest first"
              columns={columns(data.club, (id) => hrefFor(`/sessions/${encodeURIComponent(id)}`))}
              rows={rows}
              rowKey={(session) => session.id}
              empty={<EmptyState title="No sessions match">Choose another filter or a longer range.</EmptyState>}
            />
          </Card>
        );
      }}
    </ReportView>
  );
}
