import type { ClubListResponse } from "@/contracts/api";
import { services } from "@/server/container";
import { respond } from "@/server/http/respond";

export async function GET() {
  return respond(async (): Promise<ClubListResponse> => ({ clubs: await services().clubs.list() }));
}
