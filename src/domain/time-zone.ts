import { TZDate } from "@date-fns/tz";
import { addDays, type LocalDate } from "./calendar";

/** A half-open span of time: `start <= t < end`. */
export interface InstantWindow {
  start: Date;
  end: Date;
}

/** The calendar day an instant falls on, as seen on the wall clock in `timeZone`. */
export function toLocalDate(instant: Date, timeZone: string): LocalDate {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

/** The instant a calendar day begins in `timeZone`. */
export function startOfLocalDay(date: LocalDate, timeZone: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(new TZDate(year, month - 1, day, timeZone).getTime());
}

/** The instants covered by the calendar days `from`..`to` (both inclusive) in `timeZone`. */
export function localDaysWindow(from: LocalDate, to: LocalDate, timeZone: string): InstantWindow {
  return {
    start: startOfLocalDay(from, timeZone),
    end: startOfLocalDay(addDays(to, 1), timeZone),
  };
}
