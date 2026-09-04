import { describe, expect, it } from 'vitest';
import {
  addDays,
  compareIsoDate,
  differenceInDays,
  eachDayInclusive,
  isIsoDate,
  isWithinInclusive,
  isoDate,
  isoWeekday,
  parseIsoDate,
  startOfIsoWeek,
} from './plain-date.js';

describe('plain-date (M0)', () => {
  describe('validation', () => {
    it('accepts real calendar dates', () => {
      expect(isIsoDate('2026-09-01')).toBe(true);
      expect(isIsoDate('2028-02-29')).toBe(true); // leap year
    });

    it('rejects malformed strings and impossible dates', () => {
      for (const bad of [
        '2026-9-1', // not zero-padded
        '2026/09/01',
        '26-09-01',
        '2026-13-01', // month 13
        '2026-00-10', // month 0
        '2026-02-30', // Feb 30
        '2027-02-29', // not a leap year
        '2026-04-31', // April has 30 days
        'garbage',
        '',
        '2026-09-01T00:00:00Z',
      ]) {
        expect(isIsoDate(bad), bad).toBe(false);
        expect(() => parseIsoDate(bad), bad).toThrow(RangeError);
      }
    });

    it('isoDate() builds and pads, and rejects unreal parts', () => {
      expect(isoDate(2026, 9, 1)).toBe('2026-09-01');
      expect(() => isoDate(2027, 2, 29)).toThrow(RangeError);
      expect(() => isoDate(2026, 9, 1.5)).toThrow(RangeError);
      expect(() => isoDate(0, 1, 1)).toThrow(RangeError);
    });
  });

  describe('arithmetic', () => {
    it('addDays crosses month and year boundaries', () => {
      expect(addDays(parseIsoDate('2026-09-30'), 1)).toBe('2026-10-01');
      expect(addDays(parseIsoDate('2026-12-31'), 1)).toBe('2027-01-01');
      expect(addDays(parseIsoDate('2027-01-01'), -1)).toBe('2026-12-31');
      expect(addDays(parseIsoDate('2028-02-28'), 1)).toBe('2028-02-29');
      expect(addDays(parseIsoDate('2026-09-07'), 0)).toBe('2026-09-07');
    });

    it('addDays rejects non-integer offsets', () => {
      expect(() => addDays(parseIsoDate('2026-09-07'), 1.5)).toThrow(RangeError);
    });

    it('differenceInDays is signed and symmetric', () => {
      const a = parseIsoDate('2026-09-01');
      const b = parseIsoDate('2026-09-08');
      expect(differenceInDays(a, b)).toBe(7);
      expect(differenceInDays(b, a)).toBe(-7);
      expect(differenceInDays(a, a)).toBe(0);
    });

    it('compareIsoDate orders chronologically', () => {
      expect(compareIsoDate(parseIsoDate('2026-09-01'), parseIsoDate('2026-10-01'))).toBe(-1);
      expect(compareIsoDate(parseIsoDate('2026-10-01'), parseIsoDate('2026-09-01'))).toBe(1);
      expect(compareIsoDate(parseIsoDate('2026-09-01'), parseIsoDate('2026-09-01'))).toBe(0);
    });

    it('isWithinInclusive covers both endpoints', () => {
      const start = parseIsoDate('2026-09-01');
      const end = parseIsoDate('2026-12-18');
      expect(isWithinInclusive(start, start, end)).toBe(true);
      expect(isWithinInclusive(end, start, end)).toBe(true);
      expect(isWithinInclusive(parseIsoDate('2026-08-31'), start, end)).toBe(false);
      expect(isWithinInclusive(parseIsoDate('2026-12-19'), start, end)).toBe(false);
    });
  });

  describe('weekdays', () => {
    it('isoWeekday returns 1..7 Monday..Sunday', () => {
      expect(isoWeekday(parseIsoDate('2026-09-07'))).toBe(1); // Monday
      expect(isoWeekday(parseIsoDate('2026-09-12'))).toBe(6); // Saturday
      expect(isoWeekday(parseIsoDate('2026-09-13'))).toBe(7); // Sunday
    });

    it('startOfIsoWeek snaps back to Monday and is idempotent', () => {
      const wed = parseIsoDate('2026-09-09');
      const mon = parseIsoDate('2026-09-07');
      expect(startOfIsoWeek(wed)).toBe(mon);
      expect(startOfIsoWeek(mon)).toBe(mon);
      expect(startOfIsoWeek(parseIsoDate('2026-09-13'))).toBe(mon); // Sunday still maps back
    });
  });

  describe('eachDayInclusive', () => {
    it('enumerates both endpoints', () => {
      const days = eachDayInclusive(parseIsoDate('2026-09-07'), parseIsoDate('2026-09-11'));
      expect(days).toEqual(['2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11']);
    });

    it('is a single day when start equals end', () => {
      expect(eachDayInclusive(parseIsoDate('2026-09-07'), parseIsoDate('2026-09-07'))).toEqual([
        '2026-09-07',
      ]);
    });

    it('is empty when start is after end', () => {
      expect(eachDayInclusive(parseIsoDate('2026-09-08'), parseIsoDate('2026-09-07'))).toEqual([]);
    });
  });
});
