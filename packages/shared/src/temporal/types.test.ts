import { describe, expect, it } from 'vitest';
import type { Session, TermCalendar, TimetableSlot } from './types.js';

/**
 * M0.1 — domain types compile and describe the shapes in docs/data-model.md.
 * The real behavioural coverage lands with getTeachingDays (M0.2) and
 * resolveDay (M0.3). This test exists so the toolchain is proven end to end.
 */
describe('temporal domain types (M0.1)', () => {
  it('models a whole-class recurring slot with an open-ended validity window', () => {
    const slot: TimetableSlot = {
      id: 'slot-1',
      classId: 'class-1',
      subjectId: 'subject-maths',
      gradeGroupId: null,
      dayOfWeek: 2,
      startTime: '09:00' as TimetableSlot['startTime'],
      durationMinutes: 60,
      validFrom: '2026-09-01' as TimetableSlot['validFrom'],
      validTo: null,
    };

    expect(slot.gradeGroupId).toBeNull();
    expect(slot.validTo).toBeNull();
  });

  it('models a grade-group-scoped slot for multi-grade parallel teaching (FR-407)', () => {
    const slot: TimetableSlot = {
      id: 'slot-2',
      classId: 'class-1',
      subjectId: 'subject-reading',
      gradeGroupId: 'grade-group-y3',
      dayOfWeek: 2,
      startTime: '09:00' as TimetableSlot['startTime'],
      durationMinutes: 60,
      validFrom: '2026-09-01' as TimetableSlot['validFrom'],
      validTo: '2027-01-05' as TimetableSlot['validTo'],
    };

    expect(slot.gradeGroupId).toBe('grade-group-y3');
  });

  it('models a cancellation tombstone as a session with origin "cancelled"', () => {
    const tombstone: Session = {
      id: 'session-1',
      classId: 'class-1',
      slotId: 'slot-1',
      subjectId: null,
      gradeGroupId: null,
      onDate: '2026-11-12' as Session['onDate'],
      startTime: '09:00' as Session['startTime'],
      durationMinutes: 60,
      origin: 'cancelled',
      objective: null,
      description: null,
      notes: null,
      status: 'planned',
    };

    expect(tombstone.origin).toBe('cancelled');
  });

  it('models a term calendar with terms and non-teaching periods', () => {
    const calendar: TermCalendar = {
      yearStartsOn: '2026-09-01' as TermCalendar['yearStartsOn'],
      yearEndsOn: '2027-07-16' as TermCalendar['yearEndsOn'],
      terms: [
        {
          name: 'Autumn',
          sequence: 1,
          startsOn: '2026-09-01' as TermCalendar['yearStartsOn'],
          endsOn: '2026-12-18' as TermCalendar['yearEndsOn'],
        },
      ],
      nonTeachingPeriods: [
        {
          label: 'October half term',
          startsOn: '2026-10-26' as TermCalendar['yearStartsOn'],
          endsOn: '2026-10-30' as TermCalendar['yearEndsOn'],
        },
      ],
    };

    expect(calendar.terms).toHaveLength(1);
    expect(calendar.nonTeachingPeriods[0]?.label).toBe('October half term');
  });
});
