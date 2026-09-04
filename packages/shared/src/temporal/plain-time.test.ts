import { describe, expect, it } from 'vitest';
import { isIsoTime, isoTime, minutesOfDay, parseIsoTime, timeRangesOverlap } from './plain-time.js';

describe('plain-time (M0)', () => {
  it('validates HH:MM 24-hour times', () => {
    for (const ok of ['00:00', '08:30', '09:05', '23:59']) {
      expect(isIsoTime(ok), ok).toBe(true);
    }
    for (const bad of ['8:30', '24:00', '23:60', '09:5', '0930', '09:00:00', '', 'noon']) {
      expect(isIsoTime(bad), bad).toBe(false);
      expect(() => parseIsoTime(bad), bad).toThrow(RangeError);
    }
  });

  it('isoTime() builds and pads, and rejects out-of-range parts', () => {
    expect(isoTime(9, 5)).toBe('09:05');
    expect(() => isoTime(24, 0)).toThrow(RangeError);
    expect(() => isoTime(9, 60)).toThrow(RangeError);
    expect(() => isoTime(9, 0.5)).toThrow(RangeError);
  });

  it('minutesOfDay counts from midnight', () => {
    expect(minutesOfDay(parseIsoTime('00:00'))).toBe(0);
    expect(minutesOfDay(parseIsoTime('08:30'))).toBe(510);
    expect(minutesOfDay(parseIsoTime('23:59'))).toBe(1439);
  });

  describe('timeRangesOverlap', () => {
    const at = (t: string): ReturnType<typeof parseIsoTime> => parseIsoTime(t);

    it('detects a genuine overlap', () => {
      expect(timeRangesOverlap(at('09:00'), 60, at('09:30'), 60)).toBe(true);
    });

    it('treats touching intervals as non-overlapping (half-open)', () => {
      expect(timeRangesOverlap(at('09:00'), 60, at('10:00'), 30)).toBe(false);
      expect(timeRangesOverlap(at('10:00'), 30, at('09:00'), 60)).toBe(false);
    });

    it('detects containment', () => {
      expect(timeRangesOverlap(at('09:00'), 120, at('09:30'), 15)).toBe(true);
    });

    it('is order-independent', () => {
      expect(timeRangesOverlap(at('09:30'), 60, at('09:00'), 60)).toBe(true);
    });

    it('handles a duration that runs past midnight without formatting an end time', () => {
      expect(timeRangesOverlap(at('23:00'), 180, at('23:30'), 60)).toBe(true);
    });
  });
});
