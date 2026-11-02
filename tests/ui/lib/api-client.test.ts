import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiPaths, fetchJson } from "@/ui/lib/api-client";

function respondWith(body: string, status: number, contentType = "application/json") {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(body, { status, headers: { "Content-Type": contentType } })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchJson", () => {
  it("returns the parsed body on success", async () => {
    respondWith('{"clubs":[]}', 200);

    await expect(fetchJson("/api/clubs")).resolves.toEqual({ clubs: [] });
  });

  it("passes on the API's own error message and status", async () => {
    respondWith('{"error":{"code":"invalid_request","message":"Choose 366 days or fewer."}}', 400);

    const error = await fetchJson("/api/x").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ message: "Choose 366 days or fewer.", status: 400 });
  });

  it("falls back to a plain message when the error isn't JSON", async () => {
    respondWith("<html>Bad gateway</html>", 502, "text/html");

    await expect(fetchJson("/api/x")).rejects.toMatchObject({ message: "The server answered 502.", status: 502 });
  });

  it("falls back to a plain message when the error is JSON of another shape", async () => {
    respondWith('{"message":"upstream timeout"}', 504);

    await expect(fetchJson("/api/x")).rejects.toMatchObject({ message: "The server answered 504.", status: 504 });
  });

  it("explains a network failure in words a host understands", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );

    await expect(fetchJson("/api/x")).rejects.toMatchObject({
      message: "We couldn't reach the server. Check your connection and try again.",
    });
  });
});

describe("apiPaths", () => {
  it("builds the same paths the mobile app uses, with the range as query", () => {
    expect(apiPaths.summary("club-001", { kind: "preset", preset: "last-8-weeks" })).toBe(
      "/api/clubs/club-001/summary?range=last-8-weeks",
    );
    expect(apiPaths.noShows("club-001", { kind: "custom", from: "2026-09-01", to: "2026-09-30" })).toBe(
      "/api/clubs/club-001/no-shows?from=2026-09-01&to=2026-09-30",
    );
  });

  it("escapes ids", () => {
    expect(apiPaths.session("club 1", "s/1")).toBe("/api/clubs/club%201/sessions/s%2F1");
  });
});
