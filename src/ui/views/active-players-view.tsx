"use client";

import type { ActivePlayerRowDto, ActivePlayersResponse, ClubDto } from "@/contracts/api";
import { DataTable, type Column } from "../components/data-table";
import { Definition } from "../components/definition";
import { Badge, Card } from "../components/primitives";
import { EmptyState } from "../components/states";
import { useApi } from "../hooks/use-api";
import { useReportParams } from "../hooks/use-report-params";
import { apiPaths } from "../lib/api-client";
import { formatDateTime, formatDay, plural } from "../lib/format";
import { ReportView } from "./report-view";

function columns(club: ClubDto): Column<ActivePlayerRowDto>[] {
  return [
    {
      header: "Player",
      cell: (player) => (
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{player.name}</span>
          {player.isNew && <Badge tone="accent">New</Badge>}
        </span>
      ),
    },
    { header: "Sessions played", align: "right", cell: (player) => player.sessionsPlayed },
    {
      header: "No-shows",
      align: "right",
      cell: (player) => (player.noShows > 0 ? <span className="text-bad">{player.noShows}</span> : "–"),
    },
    {
      header: "Last played",
      hideOnMobile: true,
      cell: (player) => (player.lastPlayedAt ? formatDateTime(player.lastPlayedAt, club.timeZone) : "–"),
    },
    {
      header: "First session here",
      hideOnMobile: true,
      cell: (player) => (player.firstPlayedOn ? formatDay(player.firstPlayedOn, { year: true }) : "–"),
    },
  ];
}

export function ActivePlayersView() {
  const { clubId, range } = useReportParams();
  const query = useApi<ActivePlayersResponse>(clubId ? apiPaths.activePlayers(clubId, range) : null);

  return (
    <ReportView title="Active players" query={query}>
      {(data) => {
        const newPlayers = data.players.filter((player) => player.isNew).length;
        return (
          <Card>
            <div className="mb-4 flex flex-col gap-2">
              <p className="text-lg font-semibold">
                {plural(data.players.length, "active player")}
                <span className="font-normal text-ink-2">
                  , {newPlayers === 0 ? "none of them new" : `${newPlayers} new to the club`}
                </span>
              </p>
              <Definition definition={data.definition} />
            </div>
            <DataTable
              caption="Active players in this period"
              columns={columns(data.club)}
              rows={data.players}
              rowKey={(player) => player.playerId}
              empty={<EmptyState title="Nobody played in these dates">Try a longer range.</EmptyState>}
            />
          </Card>
        );
      }}
    </ReportView>
  );
}
