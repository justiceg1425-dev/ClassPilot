/**
 * Plain wall-clock time on `HH:MM` (24-hour) strings (M0).
 *
 * Overlap maths runs on minutes-from-midnight as plain integers. A slot that
 * starts late with a long duration can run past 24:00; we never format an end
 * time back to `HH:MM`, so that stays representable.
 */

import type { IsoTime } from './types.js';

const ISO_TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Type guard: a well-formed `HH:MM` 24-hour time of day. */
export function isIsoTime(value: string): value is IsoTime {
  return ISO_TIME_RE.test(value);
}

/** Parse and validate; throws `RangeError` on anything that is not `HH:MM`. */
export function parseIsoTime(value: string): IsoTime {
  if (!isIsoTime(value)) {
    throw new RangeError(`not a valid HH:MM 24-hour time: ${JSON.stringify(value)}`);
  }
  return value;
}

/** Build an `IsoTime` from numeric parts; throws `RangeError` if out of range. */
export function isoTime(hours: number, minutes: number): IsoTime {
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    throw new RangeError(`hours and minutes must be integers: ${hours}:${minutes}`);
  }
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new RangeError(`time out of range: ${hours}:${minutes}`);
  }
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}` as IsoTime;
}

/** Minutes since 00:00. */
export function minutesOfDay(time: IsoTime): number {
  return Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
}

/**
 * Do `[startA, startA+durationA)` and `[startB, startB+durationB)` overlap?
 * Half-open: two sessions that merely touch (one ends exactly as the next
 * starts) do not overlap.
 */
export function timeRangesOverlap(
  startA: IsoTime,
  durationMinutesA: number,
  startB: IsoTime,
  durationMinutesB: number,
): boolean {
  const a0 = minutesOfDay(startA);
  const b0 = minutesOfDay(startB);
  return a0 < b0 + durationMinutesB && b0 < a0 + durationMinutesA;
}
