import { services } from "@/server/container";
import { respond } from "@/server/http/respond";

export async function GET(_request: Request, ctx: RouteContext<"/api/clubs/[clubId]/sessions/[sessionId]">) {
  return respond(async () => {
    const { clubId, sessionId } = await ctx.params;
    return services().drillDown.sessionDetail(clubId, sessionId);
  });
}
