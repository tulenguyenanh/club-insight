"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ClubListResponse } from "@/contracts/api";
import { EmptyState, ErrorState, LoadingState } from "../components/states";
import { useApi } from "../hooks/use-api";
import { apiPaths } from "../lib/api-client";

/** There is no login, so the home page opens the first club; the header switches between them. */
export function HomeView() {
  const router = useRouter();
  const { data, error } = useApi<ClubListResponse>(apiPaths.clubs());
  const firstClub = data?.clubs[0];

  useEffect(() => {
    if (firstClub) router.replace(`/clubs/${encodeURIComponent(firstClub.id)}`);
  }, [firstClub, router]);

  if (error) return <ErrorState error={error} />;
  if (data && !firstClub) {
    return <EmptyState title="No clubs yet">Run `npm run seed` to load the sample data.</EmptyState>;
  }
  return <LoadingState label="Opening your club…" />;
}
