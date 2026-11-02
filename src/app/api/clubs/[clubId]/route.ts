import { services } from "@/server/container";
import { respond } from "@/server/http/respond";

export async function GET(_request: Request, ctx: RouteContext<"/api/clubs/[clubId]">) {
  return respond(async () => services().clubs.get((await ctx.params).clubId));
}
