import { NextRequest } from "next/server";

type RouteHandler = (request: NextRequest, context: never) => Promise<Response>;

/** Calls a route handler the way Next.js would, and reads the JSON back. */
export async function callRoute(handler: RouteHandler, path: string, params: Record<string, string> = {}) {
  const response = await handler(new NextRequest(new URL(path, "http://localhost")), {
    params: Promise.resolve(params),
  } as never);
  const isJson = response.headers.get("content-type")?.includes("application/json");
  return {
    status: response.status,
    headers: response.headers,
    body: isJson ? await response.json() : await response.text(),
  };
}
