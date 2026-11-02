"use client";

import type { ClubDto, MetricDefinitionDto, ReportContext, SummaryResponse } from "@/contracts/api";
import { MetricCard } from "../components/metric-card";
import { Card, Notice } from "../components/primitives";
import { ReportHeader } from "../components/report-header";
import { ErrorState, LoadingState } from "../components/states";
import { WeeklyPanel } from "../components/weekly-panel";
import { useApi } from "../hooks/use-api";
import { useReportParams } from "../hooks/use-report-params";
import { apiPaths } from "../lib/api-client";
import { formatCount, formatDay, formatPercent, formatPeriod, plural } from "../lib/format";

export function DashboardView() {
  const { clubId, range, hrefFor } = useReportParams();
  const { data, error, isRefreshing } = useApi<SummaryResponse>(clubId ? apiPaths.summary(clubId, range) : null);

  if (error) return <ErrorState error={error} />;
  if (!data || !clubId) {
    return (
      <>
        <ReportHeader context={undefined} />
        <LoadingState label="Loading your club…" />
      </>
    );
  }
  if (data.club.firstSessionOn === null) {
    return <NoSessionsYet club={data.club} definitions={Object.values(data.metrics).map((m) => m.definition)} />;
  }

  const { activePlayers, sessionsHeld, noShows } = data.metrics;
  const previousIn = (value: string) => `${value} in ${formatPeriod(data.previousPeriod)}`;
  const noComparison = noComparisonText(data);

  return (
    <>
      <ReportHeader context={data} />
      <div className={`transition-opacity ${isRefreshing ? "opacity-50" : ""}`}>
        <div className="grid gap-4 lg:grid-cols-3">
          <MetricCard
            definition={activePlayers.definition}
            value={formatCount(activePlayers.current.value)}
            change={activePlayers.change}
            changeKind="count"
            previous={previousIn(formatCount(activePlayers.previous.value))}
            noComparison={noComparison}
            facts={
              <p>
                <strong className="font-semibold">{formatCount(activePlayers.current.newPlayers)}</strong> of them
                played their first session at the club in this period.
              </p>
            }
            drillDown={{ href: hrefFor("/players"), label: `See the ${plural(activePlayers.current.value, "player")}` }}
          />

          <MetricCard
            definition={sessionsHeld.definition}
            value={formatCount(sessionsHeld.current.value)}
            change={sessionsHeld.change}
            changeKind="count"
            previous={previousIn(formatCount(sessionsHeld.previous.value))}
            noComparison={noComparison}
            facts={
              <ul className="space-y-0.5 text-ink-2">
                <li>
                  {sessionsHeld.current.cancelled > 0 ? (
                    <strong className="font-semibold text-ink">
                      {plural(sessionsHeld.current.cancelled, "session")} cancelled
                    </strong>
                  ) : (
                    "No sessions cancelled"
                  )}
                </li>
                <li>
                  {plural(sessionsHeld.current.keptBookings, "booking")}
                  {sessionsHeld.current.fillRate !== null &&
                    `, filling ${formatPercent(sessionsHeld.current.fillRate, 0)} of places`}
                </li>
              </ul>
            }
            drillDown={{ href: hrefFor("/sessions"), label: "See every session" }}
          />

          <MetricCard
            definition={noShows.definition}
            value={noShows.current.value === null ? "Unknown" : formatPercent(noShows.current.value)}
            valueIsUnknown={noShows.current.value === null}
            change={noShows.change}
            changeKind="rate"
            previous={previousIn(noShows.previous.value === null ? "unknown" : formatPercent(noShows.previous.value))}
            noComparison={noShowComparisonText(data)}
            facts={
              noShows.current.value === null ? (
                <p className="text-ink-2">
                  Attendance wasn&apos;t taken at any of the {plural(noShows.current.sessionsHeld, "session")} held, so
                  we can&apos;t tell who didn&apos;t show up.
                </p>
              ) : (
                <p>
                  <strong className="font-semibold">{plural(noShows.current.noShows, "no-show")}</strong> in{" "}
                  {plural(noShows.current.checkedBookings, "checked booking")}.
                </p>
              )
            }
            notice={
              noShows.current.sessionsWithAttendance < noShows.current.sessionsHeld && (
                <Notice>
                  Attendance was taken at {noShows.current.sessionsWithAttendance} of {noShows.current.sessionsHeld}{" "}
                  sessions. The other {plural(noShows.current.uncheckedBookings, "booking")} aren&apos;t counted: we
                  don&apos;t know if those players came.
                </Notice>
              )
            }
            drillDown={{ href: hrefFor("/no-shows"), label: "See who didn't show up" }}
          />
        </div>

        <WeeklyPanel clubId={clubId} range={range} />
      </div>
    </>
  );
}

/** Why a count has no comparison. Counts only lack one when the server withholds it. */
function noComparisonText(context: ReportContext): string {
  if (context.comparison.available) return "";
  return context.comparison.reason === "no_sessions_yet"
    ? "No sessions yet to compare with."
    : "No comparison for these dates (see the note above).";
}

/** A rate can also lack a comparison because one side of it is unknown. */
function noShowComparisonText(summary: SummaryResponse): string {
  const { current, previous } = summary.metrics.noShows;
  if (!summary.comparison.available) return noComparisonText(summary);
  if (current.value === null) return "No comparison while this period's rate is unknown.";
  if (previous.value === null) return "No comparison: attendance wasn't taken in the period before.";
  return "";
}

/** The new club: no zeros pretending to be results, just what will appear and how to make it accurate. */
function NoSessionsYet({ club, definitions }: { club: ClubDto; definitions: MetricDefinitionDto[] }) {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{club.name}</h1>
        <p className="mt-1 text-sm text-muted">Set up on {formatDay(club.createdOn, { weekday: true, year: true })}</p>
      </header>

      <Card className="max-w-3xl">
        <h2 className="text-lg font-semibold">No sessions yet</h2>
        <p className="mt-1 text-ink-2">
          This page fills in after your first session goes ahead. From then on you&apos;ll see these numbers for any
          dates you choose, each compared with the period before.
        </p>

        <ul className="mt-5 grid gap-3 sm:grid-cols-3">
          {definitions.map((definition) => (
            <li key={definition.key} className="rounded-lg border border-line bg-sunken p-3">
              <p className="font-medium">{definition.label}</p>
              <p className="mt-1 text-sm text-ink-2">{definition.summary}</p>
            </li>
          ))}
        </ul>

        <h3 className="mt-6 font-semibold">Before your first session</h3>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-ink-2">
          <li>
            <strong className="font-semibold text-ink">Take attendance at every session.</strong> No-shows can only be
            counted where attendance was taken. Anywhere else they stay unknown.
          </li>
          <li>Mark sessions as cancelled rather than deleting them, so they show up as cancelled here.</li>
          <li>Week-by-week charts appear once you have a few weeks of sessions.</li>
        </ul>
      </Card>
    </>
  );
}
