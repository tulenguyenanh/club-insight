/**
 * Calendar-date arithmetic on plain `YYYY-MM-DD` strings.
 *
 * A LocalDate has no time zone: it is a day on the club's wall calendar.
 * Converting between LocalDates and instants lives in `time-zone.ts`.
 */
export type LocalDate = string;

const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 86_400_000;

export function isLocalDate(value: string): value is LocalDate {
  if (!LOCAL_DATE_PATTERN.test(value)) return false;
  return toUtcMidnight(value).toISOString().slice(0, 10) === value;
}

export function addDays(date: LocalDate, days: number): LocalDate {
  return fromUtcMidnight(toUtcMidnight(date).getTime() + days * MS_PER_DAY);
}

/** Number of days from `from` to `to`, counting both ends. */
export function daysInclusive(from: LocalDate, to: LocalDate): number {
  return Math.round((toUtcMidnight(to).getTime() - toUtcMidnight(from).getTime()) / MS_PER_DAY) + 1;
}

/** Weeks run Monday to Sunday. */
export function startOfWeek(date: LocalDate): LocalDate {
  const isoWeekday = (toUtcMidnight(date).getUTCDay() + 6) % 7; // Monday = 0
  return addDays(date, -isoWeekday);
}

export function minDate(a: LocalDate, b: LocalDate): LocalDate {
  return a <= b ? a : b;
}

export function maxDate(a: LocalDate, b: LocalDate): LocalDate {
  return a >= b ? a : b;
}

function toUtcMidnight(date: LocalDate): Date {
  return new Date(`${date}T00:00:00Z`);
}

function fromUtcMidnight(epochMs: number): LocalDate {
  return new Date(epochMs).toISOString().slice(0, 10);
}
