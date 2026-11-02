import { afterEach, describe, expect, it, vi } from "vitest";
import { InvalidRequestError, NotFoundError } from "@/server/errors";
import { parseRangeSelection } from "@/server/http/range-query";
import { respond } from "@/server/http/respond";

// connection() only works inside a real Next.js request.
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  connection: async () => undefined,
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("parseRangeSelection", () => {
  const parse = (query: string) => parseRangeSelection(new URLSearchParams(query));

  it("defaults to the last 4 weeks", () => {
    expect(parse("")).toEqual({ kind: "preset", preset: "last-4-weeks" });
  });

  it("reads a preset or custom dates", () => {
    expect(parse("range=last-26-weeks")).toEqual({ kind: "preset", preset: "last-26-weeks" });
    expect(parse("from=2026-09-01&to=2026-09-30")).toEqual({ kind: "custom", from: "2026-09-01", to: "2026-09-30" });
  });

  it("insists on both ends of a custom range", () => {
    expect(() => parse("to=2026-09-30")).toThrow(InvalidRequestError);
    expect(() => parse("from=&to=2026-09-30")).toThrow(InvalidRequestError);
  });

  it("lists the presets it knows when given one it doesn't", () => {
    expect(() => parse("range=last-year")).toThrow(/last-4-weeks, last-8-weeks, last-13-weeks, last-26-weeks/);
  });
});

describe("respond", () => {
  it("sends the result as JSON", async () => {
    const response = await respond(async () => ({ ok: true }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it.each([
    [new InvalidRequestError("Choose fewer days."), 400, "invalid_request"],
    [new NotFoundError("No such club."), 404, "not_found"],
  ])("turns %s into a %i with a readable body", async (error, status, code) => {
    const response = await respond(async () => {
      throw error;
    });

    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ error: { code, message: error.message } });
  });

  it("hides unexpected errors from the client but logs them", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await respond(async () => {
      throw new Error("SQLITE_CORRUPT at /var/data/club.db");
    });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.code).toBe("internal");
    expect(body.error.message).not.toMatch(/SQLITE|var\/data/);
    expect(log).toHaveBeenCalled();
  });
});
