"use client";

import { Bar, BarChart, CartesianGrid, Rectangle, Tooltip, XAxis, YAxis } from "recharts";
import type { BarShapeProps, TooltipContentProps } from "recharts";
import type { WeekDto } from "@/contracts/api";
import { formatDay, plural } from "../lib/format";

interface ChartRow extends WeekDto {
  label: string;
  /** Only the latest full week carries a value label; the axis and tooltip carry the rest. */
  labelled: boolean;
}

const CHART_HEIGHT = 260;

/** The chosen period is the accent; the period before is grey context. */
export const SERIES_COLOUR: Record<WeekDto["period"], string> = {
  current: "var(--accent)",
  previous: "var(--series-previous)",
};

export function WeeklyActivityChart({ weeks }: { weeks: readonly WeekDto[] }) {
  const lastFullWeek = weeks.findLastIndex((week) => week.period === "current" && !week.isPartial);
  const rows: ChartRow[] = weeks.map((week, index) => ({
    ...week,
    label: formatDay(week.weekStart),
    labelled: index === lastFullWeek,
  }));

  return (
    <figure>
      <figcaption className="sr-only">
        Bar chart of active players for each week, the period before in grey and the chosen period in blue. The same
        numbers are in the table view.
      </figcaption>
      <BarChart
        responsive
        data={rows}
        style={{ width: "100%", height: CHART_HEIGHT }}
        margin={{ top: 22, right: 4, bottom: 0, left: -12 }}
      >
        <CartesianGrid vertical={false} stroke="var(--line)" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={{ stroke: "var(--axis)" }}
          tick={{ fill: "var(--muted)", fontSize: 12 }}
          minTickGap={16}
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--muted)", fontSize: 12 }}
          width={44}
        />
        <Tooltip cursor={{ fill: "var(--accent-wash)" }} content={WeekTooltip} isAnimationActive={false} />
        <Bar dataKey="activePlayers" name="Active players" maxBarSize={24} isAnimationActive={false} shape={WeekBar} />
      </BarChart>
    </figure>
  );
}

function WeekBar(props: BarShapeProps) {
  const row = props.payload as ChartRow;
  return (
    <g>
      <Rectangle
        x={props.x}
        y={props.y}
        width={props.width}
        height={props.height}
        radius={[4, 4, 0, 0]}
        fill={SERIES_COLOUR[row.period]}
        fillOpacity={row.isPartial ? 0.4 : 1}
      />
      {row.labelled && (
        <text
          x={props.x + props.width / 2}
          y={props.y - 6}
          textAnchor="middle"
          fontSize={12}
          fontWeight={600}
          fill="var(--ink)"
        >
          {row.activePlayers}
        </text>
      )}
    </g>
  );
}

function WeekTooltip({ active, payload }: TooltipContentProps) {
  const row = active ? (payload?.[0]?.payload as ChartRow | undefined) : undefined;
  if (!row) return null;

  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-sm shadow-lg">
      <p className="text-xs text-muted">
        {row.period === "previous" ? "Period before · " : ""}Week of {formatDay(row.weekStart, { weekday: true })}
        {row.isPartial && ` (only ${formatDay(row.from)} – ${formatDay(row.to)} in range)`}
      </p>
      <p className="mt-1">
        <strong className="text-base font-semibold">{row.activePlayers}</strong>{" "}
        <span className="text-ink-2">active {row.activePlayers === 1 ? "player" : "players"}</span>
      </p>
      <p className="text-xs text-ink-2">
        {plural(row.sessionsHeld, "session")} held
        {row.sessionsCancelled > 0 && ` · ${plural(row.sessionsCancelled, "session")} cancelled`}
      </p>
    </div>
  );
}
