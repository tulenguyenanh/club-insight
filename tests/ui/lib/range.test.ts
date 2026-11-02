import { describe, expect, it } from "vitest";
import { rangeFromSearchParams, rangeQueryString } from "@/ui/lib/range";

const read = (query: string) => rangeFromSearchParams(new URLSearchParams(query));

describe("date range in the URL", () => {
  it("defaults to the last 4 weeks", () => {
    expect(read("")).toEqual({ kind: "preset", preset: "last-4-weeks" });
  });

  it("reads a preset", () => {
    expect(read("range=last-13-weeks")).toEqual({ kind: "preset", preset: "last-13-weeks" });
  });

  it("reads custom dates, which win over a preset", () => {
    expect(read("range=last-8-weeks&from=2026-09-01&to=2026-09-30")).toEqual({
      kind: "custom",
      from: "2026-09-01",
      to: "2026-09-30",
    });
  });

  it.each([
    ["range=last-3-weeks", "unknown preset"],
    ["from=2026-09-01", "only one end"],
    ["from=2026-13-01&to=2026-10-01", "impossible month"],
    ["from=yesterday&to=today", "not dates"],
  ])("falls back to the default for %s (%s) instead of breaking the page", (query) => {
    expect(read(query)).toEqual({ kind: "preset", preset: "last-4-weeks" });
  });

  it("writes back exactly what it reads", () => {
    expect(rangeQueryString({ kind: "preset", preset: "last-8-weeks" })).toBe("range=last-8-weeks");
    expect(rangeQueryString({ kind: "custom", from: "2026-09-01", to: "2026-09-30" })).toBe(
      "from=2026-09-01&to=2026-09-30",
    );
    expect(read(rangeQueryString({ kind: "custom", from: "2026-09-01", to: "2026-09-30" }))).toEqual({
      kind: "custom",
      from: "2026-09-01",
      to: "2026-09-30",
    });
  });
});
