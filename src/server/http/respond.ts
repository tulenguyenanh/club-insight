import type { ApiErrorBody } from "@/contracts/api";
import { connection } from "next/server";
import { InvalidRequestError, NotFoundError } from "../errors";

/**
 * Runs a route handler's work and turns the result, or the error, into JSON.
 * Keeps every route handler down to "parse input, call a service".
 */
export async function respond<T>(produce: () => Promise<T>): Promise<Response> {
  // better-sqlite3 is synchronous, so without this Next.js would run the
  // query at build time and serve a frozen answer.
  await connection();
  try {
    return Response.json(await produce());
  } catch (error) {
    return errorResponse(error);
  }
}

function errorResponse(error: unknown): Response {
  if (error instanceof InvalidRequestError) return errorJson(400, error.code, error.message);
  if (error instanceof NotFoundError) return errorJson(404, error.code, error.message);
  console.error(error);
  return errorJson(500, "internal", "Something went wrong on our side. Please try again.");
}

function errorJson(status: number, code: ApiErrorBody["error"]["code"], message: string): Response {
  const body: ApiErrorBody = { error: { code, message } };
  return Response.json(body, { status });
}
