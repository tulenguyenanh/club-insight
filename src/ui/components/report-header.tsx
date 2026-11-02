"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { ReportContext } from "@/contracts/api";
import { useReportParams } from "../hooks/use-report-params";
import { describeTimeZone, formatDateTime, formatDay, formatPeriod } from "../lib/format";
import { RangePicker } from "./range-picker";
import { Notice } from "./primitives";

interface ReportHeaderProps {
  context: ReportContext | undefined;
  /** Drill-down screens name the number they explain; the dashboard shows the club name. */
  title?: string;
  back?: { href: string; label: string };
  children?: ReactNode;
}

/** Club, dates and comparison, stated plainly at the top of every report. */
export function ReportHeader({ context, title, back, children }: ReportHeaderProps) {
  const { range, setRange } = useReportParams();
  const club = context?.club;

  return (
    <header className="mb-6 flex flex-col gap-4">
      <div>
        {back && (
          <Link href={back.href} className="text-sm font-medium text-accent-ink hover:underline">
            ← {back.label}
          </Link>
        )}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{title ?? club?.name ?? " "}</h1>
        {club && context && (
          <p className="mt-1 text-sm text-muted">
            {title && <>{club.name} · </>}
            Times in {describeTimeZone(club.timeZone, new Date(context.asOf))} · Figures as of{" "}
            {formatDateTime(context.asOf, club.timeZone)}
          </p>
        )}
      </div>

      <RangePicker range={range} today={club?.today} onChange={setRange} />

      {context && (
        <p className="text-sm text-ink-2">
          Showing <strong className="font-semibold text-ink">{formatPeriod(context.period)}</strong> (
          {context.period.days} days), compared with{" "}
          <strong className="font-semibold text-ink">{formatPeriod(context.previousPeriod)}</strong>.
        </p>
      )}

      {club?.firstSessionOn && context && !context.comparison.available && (
        <Notice tone="info">
          No comparison for these dates: the period before them starts ahead of the club&apos;s first session on{" "}
          {formatDay(club.firstSessionOn, { year: true })}, so part of it would be empty and the change would look
          bigger than it is.
        </Notice>
      )}

      {children}
    </header>
  );
}
