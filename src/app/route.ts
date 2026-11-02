import { connection, NextResponse, type NextRequest } from "next/server";
import { services } from "@/server/container";

/**
 * There is no login, so "/" opens the first club; the header switches between clubs.
 * This is a server redirect rather than a client-side one: a page that navigates
 * from an effect can be left hanging when Next.js restores it from its route cache.
 * 307 (temporary), so browsers never cache where it points.
 */
export async function GET(request: NextRequest) {
  await connection();
  const [firstClub] = await services().clubs.list();
  if (!firstClub) {
    return new Response("No clubs yet. Run `npm run seed` to load the sample data.", { status: 404 });
  }
  return NextResponse.redirect(new URL(`/clubs/${encodeURIComponent(firstClub.id)}`, request.url), 307);
}
