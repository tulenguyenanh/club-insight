"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { ClubListResponse } from "@/contracts/api";
import { useApi } from "../hooks/use-api";
import { useReportParams } from "../hooks/use-report-params";
import { apiPaths } from "../lib/api-client";

export function AppHeader() {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-7 place-items-center rounded-md bg-accent text-sm text-white" aria-hidden>
            CI
          </span>
          <span className="hidden sm:inline">Club Insights</span>
        </Link>
        <ClubSwitcher />
      </div>
    </header>
  );
}

/** No login: hosts pick their club here. Switching keeps the chosen dates. */
function ClubSwitcher() {
  const { data } = useApi<ClubListResponse>(apiPaths.clubs());
  const { clubId } = useReportParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  if (!data) return null;

  return (
    <label className="flex min-w-0 items-center gap-2 text-sm">
      <span className="hidden text-muted sm:inline">Club</span>
      <select
        className="min-w-0 max-w-[16rem] truncate rounded-md border border-line bg-surface px-2 py-1.5 font-medium"
        value={clubId ?? ""}
        onChange={(event) => router.push(`/clubs/${encodeURIComponent(event.target.value)}?${searchParams}`)}
      >
        {clubId === null && <option value="">Choose a club</option>}
        {data.clubs.map((club) => (
          <option key={club.id} value={club.id}>
            {club.name}
          </option>
        ))}
      </select>
    </label>
  );
}
