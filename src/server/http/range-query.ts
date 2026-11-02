import type { RangeSelection } from "@/contracts/api";
import { DEFAULT_RANGE_PRESET, isRangePreset, RANGE_PRESETS } from "@/domain/period";
import { InvalidRequestError } from "../errors";

/**
 * Reads the date range from a query string: `?range=<preset>` or `?from=&to=`.
 * Only the shape is checked here; whether the dates make sense is a business
 * rule, checked by `resolvePeriod`.
 */
export function parseRangeSelection(params: URLSearchParams): RangeSelection {
  const from = params.get("from");
  const to = params.get("to");
  const range = params.get("range");

  if (from !== null || to !== null) {
    if (!from || !to) throw new InvalidRequestError('Send both "from" and "to", or neither.');
    return { kind: "custom", from, to };
  }

  if (range === null) return { kind: "preset", preset: DEFAULT_RANGE_PRESET };
  if (!isRangePreset(range)) {
    const known = Object.keys(RANGE_PRESETS).join(", ");
    throw new InvalidRequestError(`Unknown range "${range}". Use one of: ${known}.`);
  }
  return { kind: "preset", preset: range };
}
