"use client";

import { useState } from "react";
import type { RangeSelection, WeekDto, WeeklyResponse } from "@/contracts/api";
import { useApi } from "../hooks/use-api";
import { apiPaths } from "../lib/api-client";
import { formatDay, formatPeriod } from "../lib/format";
import { DataTable, type Column } from "./data-table";
import { Definition } from "./definition";
import { Badge, Card } from "./primitives";
import { EmptyState, ErrorState, LoadingState } from "./states";
import { SERIES_COLOUR, WeeklyActivityChart } from "./weekly-chart";

type View = "chart" | "table";

const COLUMNS: readonly Column<WeekDto>[] = [
  {
    header: "Week",
    cell: (week) => (
      <span className="flex flex-wrap items-center gap-x-2">
        {formatDay(week.weekStart, { weekday: true, year: true })}
        {week.period === "previous" && <Badge>Period before</Badge>}
        {week.isPartial && <span className="text-xs text-muted">partial: {formatPeriod(week)}</span>}
      </span>
    ),
  },
  { header: "Active players", align: "right", cell: (week) => week.activePlayers },
  { header: "Sessions held", align: "right", cell: (week) => week.sessionsHeld },
  { header: "Cancelled", align: "right", cell: (week) => week.sessionsCancelled || "–" },
];

export function WeeklyPanel({ clubId, range }: { clubId: string; range: RangeSelection }) {
  const [view, setView] = useState<View>("chart");
  const { data, error, isRefreshing } = useApi<WeeklyResponse>(apiPaths.weekly(clubId, range));

  return (
    <Card className="mt-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <h2 className="font-semibold">{data?.definition.label ?? "Active players per week"}</h2>
          {data && <Definition definition={data.definition} />}
        </div>
        <ViewToggle view={view} onChange={setView} />
      </div>

      <div className={`mt-4 transition-opacity ${isRefreshing ? "opacity-50" : ""}`}>
        {error ? (
          <ErrorState error={error} />
        ) : !data ? (
          <LoadingState label="Loading weeks…" />
        ) : data.weeks.every((week) => week.sessionsHeld === 0 && week.sessionsCancelled === 0) ? (
          <EmptyState title="No sessions in these weeks">Pick a different range to see weekly numbers.</EmptyState>
        ) : view === "chart" ? (
          <>
            <Legend data={data} />
            <WeeklyActivityChart weeks={data.weeks} />
          </>
        ) : (
          <DataTable
            caption="Active players per week, the period before first"
            columns={COLUMNS}
            rows={data.weeks}
            rowKey={(week) => `${week.period}:${week.weekStart}`}
          />
        )}
      </div>
    </Card>
  );
}

function Legend({ data }: { data: WeeklyResponse }) {
  const hasPartialWeeks = data.weeks.some((week) => week.isPartial);
  return (
    <ul className="mb-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-2">
      <LegendItem colour={SERIES_COLOUR.current}>{formatPeriod(data.period)}</LegendItem>
      <LegendItem colour={SERIES_COLOUR.previous}>{formatPeriod(data.previousPeriod)} (period before)</LegendItem>
      {hasPartialWeeks && (
        <LegendItem colour={SERIES_COLOUR.current} faded>
          Partial week: only some of its days are in range
        </LegendItem>
      )}
    </ul>
  );
}

function LegendItem({ colour, faded, children }: { colour: string; faded?: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-1.5">
      <span
        className="inline-block size-2.5 rounded-sm"
        style={{ background: colour, opacity: faded ? 0.4 : 1 }}
        aria-hidden
      />
      {children}
    </li>
  );
}

function ViewToggle({ view, onChange }: { view: View; onChange: (view: View) => void }) {
  return (
    <div role="group" aria-label="Show as" className="inline-flex rounded-lg border border-line p-0.5 text-sm">
      {(["chart", "table"] as const).map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={view === option}
          onClick={() => onChange(option)}
          className={`rounded-md px-3 py-1 font-medium capitalize ${
            view === option ? "bg-sunken text-ink" : "text-muted hover:text-ink"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
