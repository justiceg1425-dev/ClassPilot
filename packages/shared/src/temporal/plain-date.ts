/**
 * Plain calendar-date arithmetic on `YYYY-MM-DD` strings (M0).
 *
 * Academic dates never carry a time zone (CLAUDE.md). All maths here goes
 * through `Date.UTC` purely as a calendar calculator — no local time, no DST, no
 * conversion. A zero-padded `YYYY-MM-DD` also sorts chronologically under plain
 * string comparison, which `compareIsoDate` relies on.
 */

import type { IsoDate, IsoWeekday } from './types.js';

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function isRealYmd(year: number, month: number, day: number): boolean {
  if (year < 1 || year > 9999) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  // Date.UTC silently rolls overflow (Feb 30 -> Mar 2); round-trip to catch it.
  const dt = new Date(Date.UTC(year, month - 1, day));
  return dt.getUTCFullYear() === year && dt.getUTCMonth() === month - 1 && dt.getUTCDate() === day;
}

/** Type guard: a well-formed `YYYY-MM-DD` string naming a real calendar date. */
export function isIsoDate(value: string): value is IsoDate {
  const match = ISO_DATE_RE.exec(value);
  if (match === null) return false;
  return isRealYmd(Number(match[1]), Number(match[2]), Number(match[3]));
}

/** Parse and validate; throws `RangeError` on anything that is not a real date. */
export function parseIsoDate(value: string): IsoDate {
  if (!isIsoDate(value)) {
    throw new RangeError(`not a valid YYYY-MM-DD calendar date: ${JSON.stringify(value)}`);
  }
  return value;
}

/** Build an `IsoDate` from numeric parts; throws `RangeError` if it is not real. */
export function isoDate(year: number, month: number, day: number): IsoDate {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    throw new RangeError(`year, month and day must be integers: ${year}-${month}-${day}`);
  }
  if (!isRealYmd(year, month, day)) {
    throw new RangeError(`not a real calendar date: ${year}-${month}-${day}`);
  }
  const yyyy = String(year).padStart(4, '0');
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}` as IsoDate;
}

// An `IsoDate` is well-formed by construction, so these two parse without guards.
function toUtc(date: IsoDate): Date {
  return new Date(
    Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10))),
  );
}

function fromUtc(dt: Date): IsoDate {
  return isoDate(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

/** `date` shifted by whole days (negative to go back). */
export function addDays(date: IsoDate, days: number): IsoDate {
  if (!Number.isInteger(days)) throw new RangeError(`days must be an integer: ${days}`);
  const dt = toUtc(date);
  dt.setUTCDate(dt.getUTCDate() + days);
  return fromUtc(dt);
}

/** Whole days from `from` to `to` (`to - from`); negative if `to` precedes `from`. */
export function differenceInDays(from: IsoDate, to: IsoDate): number {
  const ms = toUtc(to).getTime() - toUtc(from).getTime();
  return Math.round(ms / 86_400_000);
}

/** `-1` if `a < b`, `1` if `a > b`, else `0`. */
export function compareIsoDate(a: IsoDate, b: IsoDate): -1 | 0 | 1 {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** ISO-8601 weekday: 1 = Monday … 7 = Sunday. */
export function isoWeekday(date: IsoDate): IsoWeekday {
  const jsDay = toUtc(date).getUTCDay(); // 0 = Sunday … 6 = Saturday
  return (jsDay === 0 ? 7 : jsDay) as IsoWeekday;
}

/** Inclusive on both ends: `start <= date <= end`. */
export function isWithinInclusive(date: IsoDate, start: IsoDate, end: IsoDate): boolean {
  return date >= start && date <= end;
}

/** Every date from `start` to `end` inclusive; `[]` if `start` is after `end`. */
export function eachDayInclusive(start: IsoDate, end: IsoDate): IsoDate[] {
  const out: IsoDate[] = [];
  let cursor = start;
  while (cursor <= end) {
    out.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return out;
}

/** The Monday of the ISO week containing `date`. */
export function startOfIsoWeek(date: IsoDate): IsoDate {
  return addDays(date, -(isoWeekday(date) - 1));
}
