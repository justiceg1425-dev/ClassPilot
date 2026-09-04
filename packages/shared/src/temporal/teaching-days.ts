/**
 * Deriving the teaching calendar from a year's terms and non-teaching periods
 * (M0.2, FR-204).
 *
 * A teaching day is a date that: falls inside the academic year's bounds, falls
 * inside some term, is one of the allowed weekdays, and is not inside any
 * non-teaching period (holiday, closure). Weekday filtering is optional here —
 * `getTeachingDays` answers a calendar-level question; a caller with a class
 * passes that class's `teaching_days`.
 */

import type { IsoDate, IsoWeekday, TermCalendar } from './types.js';
import {
  compareIsoDate,
  eachDayInclusive,
  isWithinInclusive,
  isoWeekday,
  startOfIsoWeek,
} from './plain-date.js';

const EVERY_WEEKDAY: readonly IsoWeekday[] = [1, 2, 3, 4, 5, 6, 7];

/** Is `date` a teaching day for this calendar (optionally restricted to `weekdays`)? */
export function isTeachingDay(
  calendar: TermCalendar,
  date: IsoDate,
  weekdays: readonly IsoWeekday[] = EVERY_WEEKDAY,
): boolean {
  if (!isWithinInclusive(date, calendar.yearStartsOn, calendar.yearEndsOn)) return false;
  if (!weekdays.includes(isoWeekday(date))) return false;
  if (!calendar.terms.some((term) => isWithinInclusive(date, term.startsOn, term.endsOn))) {
    return false;
  }
  return !calendar.nonTeachingPeriods.some((period) =>
    isWithinInclusive(date, period.startsOn, period.endsOn),
  );
}

/**
 * Every teaching day in the calendar, ascending. Walks each term's range (a few
 * hundred iterations for a year) rather than the whole year; terms are disjoint
 * by DB constraint, but the result is de-duplicated defensively.
 */
export function getTeachingDays(
  calendar: TermCalendar,
  weekdays: readonly IsoWeekday[] = EVERY_WEEKDAY,
): IsoDate[] {
  const seen = new Set<string>();
  const out: IsoDate[] = [];
  const terms = [...calendar.terms].sort((a, b) => compareIsoDate(a.startsOn, b.startsOn));
  for (const term of terms) {
    for (const date of eachDayInclusive(term.startsOn, term.endsOn)) {
      if (seen.has(date)) continue;
      if (isTeachingDay(calendar, date, weekdays)) {
        seen.add(date);
        out.push(date);
      }
    }
  }
  return out;
}

/** An ISO week (Monday-anchored) and the teaching days that fall within it. */
export interface TeachingWeek {
  readonly weekStart: IsoDate;
  readonly teachingDays: readonly IsoDate[];
}

/**
 * Teaching days grouped into Monday-anchored weeks, ascending. Weeks with no
 * teaching days do not appear (FR-204 — the derived teaching-week list).
 */
export function getTeachingWeeks(
  calendar: TermCalendar,
  weekdays: readonly IsoWeekday[] = EVERY_WEEKDAY,
): TeachingWeek[] {
  const byWeek = new Map<string, IsoDate[]>();
  for (const date of getTeachingDays(calendar, weekdays)) {
    const key = startOfIsoWeek(date);
    const bucket = byWeek.get(key);
    if (bucket === undefined) byWeek.set(key, [date]);
    else bucket.push(date);
  }
  return [...byWeek.entries()]
    .sort((a, b) => compareIsoDate(a[0] as IsoDate, b[0] as IsoDate))
    .map(([weekStart, teachingDays]) => ({ weekStart: weekStart as IsoDate, teachingDays }));
}
