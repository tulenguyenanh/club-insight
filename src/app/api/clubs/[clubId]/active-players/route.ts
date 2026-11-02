import type { NextRequest } from "next/server";
import { services } from "@/server/container";
import { parseRangeSelection } from "@/server/http/range-query";
import { respond } from "@/server/http/respond";

export async function GET(request: NextRequest, ctx: RouteContext<"/api/clubs/[clubId]/active-players">) {
  return respond(async () => {
    const { clubId } = await ctx.params;
    return services().drillDown.activePlayers(clubId, parseRangeSelection(request.nextUrl.searchParams));
  });
}
