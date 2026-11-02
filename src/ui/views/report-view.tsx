"use client";

import type { ReactNode } from "react";
import type { ReportContext } from "@/contracts/api";
import { ReportHeader } from "../components/report-header";
import { ErrorState, LoadingState } from "../components/states";
import { useReportParams } from "../hooks/use-report-params";

interface ReportViewProps<T extends ReportContext> {
  title: string;
  query: { data: T | undefined; error: Error | undefined; isRefreshing: boolean };
  children: (data: T) => ReactNode;
}

/** The frame every drill-down shares: back link, header with dates, then the rows. */
export function ReportView<T extends ReportContext>({ title, query, children }: ReportViewProps<T>) {
  const { hrefFor } = useReportParams();
  const back = { href: hrefFor(), label: "Back to dashboard" };

  if (query.error) {
    return (
      <>
        <ReportHeader context={undefined} title={title} back={back} />
        <ErrorState error={query.error} />
      </>
    );
  }

  return (
    <>
      <ReportHeader context={query.data} title={title} back={back} />
      {query.data ? (
        <div className={`transition-opacity ${query.isRefreshing ? "opacity-50" : ""}`}>{children(query.data)}</div>
      ) : (
        <LoadingState />
      )}
    </>
  );
}
