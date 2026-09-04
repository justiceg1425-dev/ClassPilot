import { describe, expect, it } from 'vitest';
import type { IsoDate, IsoWeekday, TermCalendar } from './types.js';
import { getTeachingDays, getTeachingWeeks, isTeachingDay } from './teaching-days.js';
import { parseIsoDate } from './plain-date.js';

const d = (s: string): IsoDate => parseIsoDate(s);
const WEEKDAYS: readonly IsoWeekday[] = [1, 2, 3, 4, 5];

/** A short calendar: September 2026, one two-week term, no holidays. */
const shortCalendar: TermCalendar = {
  yearStartsOn: d('2026-09-01'),
  yearEndsOn: d('2026-09-30'),
  terms: [{ name: 'Term 1', sequence: 1, startsOn: d('2026-09-07'), endsOn: d('2026-09-18') }],
  nonTeachingPeriods: [],
};

describe('teaching-days (M0.2, FR-204)', () => {
  describe('isTeachingDay', () => {
    it('is true for a weekday inside a term', () => {
      expect(isTeachingDay(shortCalendar, d('2026-09-09'), WEEKDAYS)).toBe(true);
    });

    it('is false outside every term', () => {
      expect(isTeachingDay(shortCalendar, d('2026-09-21'), WEEKDAYS)).toBe(false);
    });

    it('is false outside the academic year bounds even if a term says otherwise', () => {
      const bleedsPastYear: TermCalendar = {
        ...shortCalendar,
        terms: [{ name: 'T', sequence: 1, startsOn: d('2026-08-25'), endsOn: d('2026-09-18') }],
      };
      expect(isTeachingDay(bleedsPastYear, d('2026-08-26'), WEEKDAYS)).toBe(false);
      expect(isTeachingDay(bleedsPastYear, d('2026-09-02'), WEEKDAYS)).toBe(true);
    });

    it('respects the weekday filter', () => {
      const saturday = d('2026-09-12');
      expect(isTeachingDay(shortCalendar, saturday, WEEKDAYS)).toBe(false);
      expect(isTeachingDay(shortCalendar, saturday)).toBe(true); // default: all seven days
    });

    it('is false inside a non-teaching period', () => {
      const withHalfTerm: TermCalendar = {
        ...shortCalendar,
        nonTeachingPeriods: [
          { label: 'Closure', startsOn: d('2026-09-14'), endsOn: d('2026-09-15') },
        ],
      };
      expect(isTeachingDay(withHalfTerm, d('2026-09-14'), WEEKDAYS)).toBe(false);
      expect(isTeachingDay(withHalfTerm, d('2026-09-16'), WEEKDAYS)).toBe(true);
    });
  });

  describe('getTeachingDays', () => {
    it('lists every weekday in the term, ascending', () => {
      expect(getTeachingDays(shortCalendar, WEEKDAYS)).toEqual([
        '2026-09-07',
        '2026-09-08',
        '2026-09-09',
        '2026-09-10',
        '2026-09-11',
        '2026-09-14',
        '2026-09-15',
        '2026-09-16',
        '2026-09-17',
        '2026-09-18',
      ]);
    });

    it('removes non-teaching periods', () => {
      const withHalfTerm: TermCalendar = {
        ...shortCalendar,
        nonTeachingPeriods: [
          { label: 'Closure', startsOn: d('2026-09-14'), endsOn: d('2026-09-15') },
        ],
      };
      expect(getTeachingDays(withHalfTerm, WEEKDAYS)).toHaveLength(8);
      expect(getTeachingDays(withHalfTerm, WEEKDAYS)).not.toContain('2026-09-14');
    });

    it('de-duplicates when terms are passed unsorted or overlapping', () => {
      const messy: TermCalendar = {
        ...shortCalendar,
        terms: [
          { name: 'B', sequence: 2, startsOn: d('2026-09-14'), endsOn: d('2026-09-18') },
          { name: 'A', sequence: 1, startsOn: d('2026-09-07'), endsOn: d('2026-09-15') },
        ],
      };
      const days = getTeachingDays(messy, WEEKDAYS);
      expect(days).toEqual([...days].sort());
      expect(new Set(days).size).toBe(days.length);
    });
  });

  describe('getTeachingWeeks', () => {
    it('groups teaching days into Monday-anchored weeks', () => {
      expect(getTeachingWeeks(shortCalendar, WEEKDAYS)).toEqual([
        {
          weekStart: '2026-09-07',
          teachingDays: ['2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11'],
        },
        {
          weekStart: '2026-09-14',
          teachingDays: ['2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18'],
        },
      ]);
    });

    it('drops weeks left with no teaching days', () => {
      const withHalfTerm: TermCalendar = {
        ...shortCalendar,
        terms: [{ name: 'T', sequence: 1, startsOn: d('2026-09-07'), endsOn: d('2026-09-11') }],
        nonTeachingPeriods: [
          { label: 'Whole week off', startsOn: d('2026-09-07'), endsOn: d('2026-09-11') },
        ],
      };
      expect(getTeachingWeeks(withHalfTerm, WEEKDAYS)).toEqual([]);
    });
  });
});
