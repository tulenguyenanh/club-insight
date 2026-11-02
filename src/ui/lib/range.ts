import type { RangeSelection } from "@/contracts/api";
import { isLocalDate } from "@/domain/calendar";
import { DEFAULT_RANGE_PRESET, isRangePreset, RANGE_PRESETS, type RangePreset } from "@/domain/period";

/**
 * The page URL and the API use the same query parameters for the date range,
 * so a dashboard link can be shared and the screen can pass it straight through.
 */

export const PRESET_LABELS: Record<RangePreset, string> = {
  "last-4-weeks": "Last 4 weeks",
  "last-8-weeks": "Last 8 weeks",
  "last-13-weeks": "Last 13 weeks",
  "last-26-weeks": "Last 26 weeks",
};

export const PRESET_ORDER = Object.keys(RANGE_PRESETS) as RangePreset[];

/** Reads a range from the URL. Anything unreadable falls back to the default; the API reports real errors. */
export function rangeFromSearchParams(params: URLSearchParams): RangeSelection {
  const from = params.get("from");
  const to = params.get("to");
  if (from && to && isLocalDate(from) && isLocalDate(to)) return { kind: "custom", from, to };

  const range = params.get("range");
  return { kind: "preset", preset: range && isRangePreset(range) ? range : DEFAULT_RANGE_PRESET };
}

export function rangeQueryString(range: RangeSelection): string {
  const params =
    range.kind === "preset"
      ? new URLSearchParams({ range: range.preset })
      : new URLSearchParams({ from: range.from, to: range.to });
  return params.toString();
}
