import type { ChangeDto, LocalDateString, PeriodDto } from "@/contracts/api";

/**
 * Display formatting. Instants are always shown in the club's time zone,
 * never the viewer's: a host travelling abroad still sees session times as
 * they are at the club.
 */

const LOCALE = "en-GB";

/** Calendar days carry no time zone; format them as UTC so they never shift. */
function dayFormatter(options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(LOCALE, { ...options, timeZone: "UTC" });
}

function asUtcDay(date: LocalDateString): Date {
  return new Date(`${date}T00:00:00Z`);
}

export function formatDay(date: LocalDateString, options: { weekday?: boolean; year?: boolean } = {}): string {
  return dayFormatter({
    weekday: options.weekday ? "short" : undefined,
    day: "numeric",
    month: "short",
    year: options.year ? "numeric" : undefined,
  }).format(asUtcDay(date));
}

/** "7 Sep – 4 Oct 2026", or "1 Dec 2025 – 4 Oct 2026" across years. */
export function formatPeriod(period: Pick<PeriodDto, "from" | "to">): string {
  const sameYear = period.from.slice(0, 4) === period.to.slice(0, 4);
  return `${formatDay(period.from, { year: !sameYear })} – ${formatDay(period.to, { year: true })}`;
}

export function formatDateTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDateTimeWithYear(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat(LOCALE, { timeZone, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

/** "Ho Chi Minh time (GMT+7)" */
export function describeTimeZone(timeZone: string, at: Date): string {
  const city = timeZone.split("/").pop()?.replaceAll("_", " ") ?? timeZone;
  const offset = new Intl.DateTimeFormat(LOCALE, { timeZone, timeZoneName: "shortOffset" })
    .formatToParts(at)
    .find((part) => part.type === "timeZoneName")?.value;
  return offset ? `${city} time (${offset})` : `${city} time`;
}

const integer = new Intl.NumberFormat(LOCALE);

export function formatCount(value: number): string {
  return integer.format(value);
}

export function formatPercent(fraction: number, digits = 1): string {
  return `${(fraction * 100).toFixed(digits)}%`;
}

export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${formatCount(count)} ${count === 1 ? singular : pluralForm}`;
}

export type ChangeKind = "count" | "rate";

/** "+3 (+12%)" for counts, "+1.4 pts" for rates. */
export function formatChange(change: ChangeDto, kind: ChangeKind): string {
  if (kind === "rate") {
    const points = change.absolute * 100;
    return `${signed(points, (n) => n.toFixed(1))} pts`;
  }
  const absolute = signed(change.absolute, formatCount);
  return change.relative === null ? absolute : `${absolute} (${signed(change.relative * 100, (n) => n.toFixed(0))}%)`;
}

function signed(value: number, format: (n: number) => string): string {
  if (value > 0) return `+${format(value)}`;
  if (value < 0) return `−${format(Math.abs(value))}`;
  return format(0);
}
