import type { ApiErrorBody, RangeSelection } from "@/contracts/api";
import { rangeQueryString } from "./range";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path, { headers: { Accept: "application/json" } });
  if (response.ok) return (await response.json()) as T;

  const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
  throw new ApiError(body?.error.message ?? `The server answered ${response.status}.`, response.status);
}

const club = (clubId: string) => `/api/clubs/${encodeURIComponent(clubId)}`;

/** Every endpoint the screens use. The mobile app calls the same paths. */
export const apiPaths = {
  clubs: () => "/api/clubs",
  summary: (clubId: string, range: RangeSelection) => `${club(clubId)}/summary?${rangeQueryString(range)}`,
  weekly: (clubId: string, range: RangeSelection) => `${club(clubId)}/weekly?${rangeQueryString(range)}`,
  activePlayers: (clubId: string, range: RangeSelection) => `${club(clubId)}/active-players?${rangeQueryString(range)}`,
  sessions: (clubId: string, range: RangeSelection) => `${club(clubId)}/sessions?${rangeQueryString(range)}`,
  noShows: (clubId: string, range: RangeSelection) => `${club(clubId)}/no-shows?${rangeQueryString(range)}`,
  session: (clubId: string, sessionId: string) => `${club(clubId)}/sessions/${encodeURIComponent(sessionId)}`,
};
