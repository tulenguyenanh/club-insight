import { NextRequest } from "next/server";
import { GET as club } from "@/app/api/clubs/[clubId]/route";
import { GET as activePlayers } from "@/app/api/clubs/[clubId]/active-players/route";
import { GET as noShows } from "@/app/api/clubs/[clubId]/no-shows/route";
import { GET as sessions } from "@/app/api/clubs/[clubId]/sessions/route";
import { GET as sessionDetail } from "@/app/api/clubs/[clubId]/sessions/[sessionId]/route";
import { GET as summary } from "@/app/api/clubs/[clubId]/summary/route";
import { GET as weekly } from "@/app/api/clubs/[clubId]/weekly/route";
import { GET as clubs } from "@/app/api/clubs/route";

type Handler = (request: NextRequest, context: never) => Promise<Response>;

const ROUTES: [pattern: RegExp, handler: Handler, params: string[]][] = [
  [/^\/api\/clubs$/, clubs, []],
  [/^\/api\/clubs\/([^/]+)$/, club, ["clubId"]],
  [/^\/api\/clubs\/([^/]+)\/summary$/, summary, ["clubId"]],
  [/^\/api\/clubs\/([^/]+)\/weekly$/, weekly, ["clubId"]],
  [/^\/api\/clubs\/([^/]+)\/active-players$/, activePlayers, ["clubId"]],
  [/^\/api\/clubs\/([^/]+)\/sessions$/, sessions, ["clubId"]],
  [/^\/api\/clubs\/([^/]+)\/sessions\/([^/]+)$/, sessionDetail, ["clubId", "sessionId"]],
  [/^\/api\/clubs\/([^/]+)\/no-shows$/, noShows, ["clubId"]],
];

/**
 * A `fetch` that answers "/api/..." from the real route handlers in this
 * process, so screen tests exercise the whole chain except the network.
 */
export async function inProcessFetch(input: RequestInfo | URL): Promise<Response> {
  const url = new URL(String(input), "http://localhost");
  for (const [pattern, handler, names] of ROUTES) {
    const match = url.pathname.match(pattern);
    if (!match) continue;
    const params = Object.fromEntries(names.map((name, i) => [name, decodeURIComponent(match[i + 1])]));
    return handler(new NextRequest(url), { params: Promise.resolve(params) } as never);
  }
  return new Response("Not found", { status: 404 });
}
