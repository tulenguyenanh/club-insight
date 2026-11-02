import type { ApiErrorBody, RangeSelection } from "@/contracts/api";
import { rangeQueryString } from "./range";

export class ApiError extends Error {
  constructor(
    message: string,
    /** HTTP status, or 0 when no response arrived. */
    readonly status: number,
  ) {
    super(message);
  }
}

export async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path, { headers: { Accept: "application/json" } }).catch(() => {
    throw new ApiError("We couldn't reach the server. Check your connection and try again.", 0);
  });
  if (response.ok) return (await response.json()) as T;

  const body: unknown = await response.json().catch(() => null);
  throw new ApiError(errorMessageOf(body) ?? `The server answered ${response.status}.`, response.status);
}

/** The message from our own error shape, or null for anything else (a proxy's error page, say). */
function errorMessageOf(body: unknown): string | null {
  const message = (body as Partial<ApiErrorBody> | null)?.error?.message;
  return typeof message === "string" ? message : null;
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
