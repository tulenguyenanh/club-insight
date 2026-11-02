"use client";

import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { RangeSelection } from "@/contracts/api";
import { rangeFromSearchParams, rangeQueryString } from "../lib/range";

/** The club and date range a report screen is showing, both kept in the URL. */
export function useReportParams() {
  const params = useParams<{ clubId?: string }>();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const range = useMemo(() => rangeFromSearchParams(new URLSearchParams(searchParams)), [searchParams]);
  const clubId = params.clubId ? decodeURIComponent(params.clubId) : null;

  const setRange = useCallback(
    (next: RangeSelection) => router.push(`${pathname}?${rangeQueryString(next)}`, { scroll: false }),
    [pathname, router],
  );

  /** A link to another screen of this club that keeps the current range. */
  const hrefFor = useCallback(
    (path = "") => `/clubs/${encodeURIComponent(clubId ?? "")}${path}?${rangeQueryString(range)}`,
    [clubId, range],
  );

  return { clubId, range, setRange, hrefFor };
}
