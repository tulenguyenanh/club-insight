import { addDays, daysInclusive, maxDate, minDate, startOfWeek, type LocalDate } from "./calendar";

/** A run of calendar days in the club's time zone. Both ends are inclusive. */
export interface Period {
  from: LocalDate;
  to: LocalDate;
}

/** One Monday-to-Sunday week, clipped to the period it was cut from. */
export interface WeekSlice extends Period {
  weekStart: LocalDate;
  /** True when the period covers fewer than all seven days of this week. */
  isPartial: boolean;
}

export const RANGE_PRESETS = {
  "last-4-weeks": 4,
  "last-8-weeks": 8,
  "last-13-weeks": 13,
  "last-26-weeks": 26,
} as const;

export type RangePreset = keyof typeof RANGE_PRESETS;

export const DEFAULT_RANGE_PRESET: RangePreset = "last-4-weeks";

export function isRangePreset(value: string): value is RangePreset {
  return Object.hasOwn(RANGE_PRESETS, value);
}

/**
 * The last `weeks` complete Monday-to-Sunday weeks before `today`.
 * The current week is left out so the numbers don't move while it fills in.
 */
export function lastFullWeeks(weeks: number, today: LocalDate): Period {
  const to = addDays(startOfWeek(today), -1);
  return { from: addDays(to, -(7 * weeks - 1)), to };
}

export function periodForPreset(preset: RangePreset, today: LocalDate): Period {
  return lastFullWeeks(RANGE_PRESETS[preset], today);
}

/** The period of the same length that ends the day before `period` starts. */
export function previousPeriod(period: Period): Period {
  const to = addDays(period.from, -1);
  return { from: addDays(to, -(periodLength(period) - 1)), to };
}

export function periodLength(period: Period): number {
  return daysInclusive(period.from, period.to);
}

export function containsDate(period: Period, date: LocalDate): boolean {
  return period.from <= date && date <= period.to;
}

/** Every Monday-to-Sunday week that overlaps `period`, in order. */
export function weeksOf(period: Period): WeekSlice[] {
  const weeks: WeekSlice[] = [];
  for (let weekStart = startOfWeek(period.from); weekStart <= period.to; weekStart = addDays(weekStart, 7)) {
    const from = maxDate(weekStart, period.from);
    const to = minDate(addDays(weekStart, 6), period.to);
    weeks.push({ weekStart, from, to, isPartial: daysInclusive(from, to) < 7 });
  }
  return weeks;
}
