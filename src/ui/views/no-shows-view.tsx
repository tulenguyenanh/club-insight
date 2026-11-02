"use client";

import Link from "next/link";
import type { ClubDto, NoShowPlayerRowDto, NoShowsResponse } from "@/contracts/api";
import { DataTable, type Column } from "../components/data-table";
import { Definition } from "../components/definition";
import { Card, Notice } from "../components/primitives";
import { EmptyState } from "../components/states";
import { useApi } from "../hooks/use-api";
import { useReportParams } from "../hooks/use-report-params";
import { apiPaths } from "../lib/api-client";
import { formatDateTime, formatPercent, plural } from "../lib/format";
import { ReportView } from "./report-view";

function columns(club: ClubDto): Column<NoShowPlayerRowDto>[] {
  return [
    { header: "Player", cell: (player) => <span className="font-medium">{player.name}</span> },
    { header: "No-shows", align: "right", cell: (player) => <span className="text-bad">{player.noShows}</span> },
    {
      header: "Of checked bookings",
      align: "right",
      cell: (player) => (
        <>
          {player.checkedBookings}
          <span className="ml-1 text-xs text-muted">({formatPercent(player.rate, 0)})</span>
        </>
      ),
    },
    {
      header: "Last no-show",
      hideOnMobile: true,
      cell: (player) => (player.lastNoShowAt ? formatDateTime(player.lastNoShowAt, club.timeZone) : "–"),
    },
  ];
}

export function NoShowsView() {
  const { clubId, range, hrefFor } = useReportParams();
  const query = useApi<NoShowsResponse>(clubId ? apiPaths.noShows(clubId, range) : null);

  return (
    <ReportView title="No-shows" query={query}>
      {(data) => {
        const { coverage } = data;
        const unchecked = coverage.sessionsHeld - coverage.sessionsWithAttendance;
        return (
          <Card>
            <div className="mb-4 flex flex-col gap-2">
              <p className="text-lg font-semibold">
                {coverage.value === null ? (
                  "No-show rate unknown"
                ) : (
                  <>
                    {formatPercent(coverage.value)} no-show rate
                    <span className="font-normal text-ink-2">
                      : {plural(coverage.noShows, "no-show")} in {plural(coverage.checkedBookings, "checked booking")}
                    </span>
                  </>
                )}
              </p>
              <Definition definition={data.definition} />
            </div>

            {unchecked > 0 && (
              <div className="mb-4">
                <Notice>
                  Attendance wasn&apos;t taken at {plural(unchecked, "session")} of {coverage.sessionsHeld} in these
                  dates ({plural(coverage.uncheckedBookings, "booking")}). Anyone who missed those isn&apos;t listed
                  here.{" "}
                  <Link href={hrefFor("/sessions")} className="font-medium underline">
                    See all sessions
                  </Link>
                </Notice>
              </div>
            )}

            <DataTable
              caption="Players with at least one no-show, most first"
              columns={columns(data.club)}
              rows={data.players}
              rowKey={(player) => player.playerId}
              empty={
                <EmptyState title={coverage.checkedBookings > 0 ? "No no-shows" : "No attendance taken"}>
                  {coverage.checkedBookings > 0
                    ? "Everyone who kept a booking at a session with attendance taken turned up."
                    : "Attendance wasn't taken at any session in these dates, so no-shows are unknown."}
                </EmptyState>
              }
            />
          </Card>
        );
      }}
    </ReportView>
  );
}
