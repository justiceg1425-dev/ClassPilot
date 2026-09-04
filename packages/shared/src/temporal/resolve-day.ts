/**
 * Resolving a class's schedule for a single date (M0.3, FR-501, FR-506).
 *
 * A day's schedule is never stored — it is computed from the recurring timetable
 * plus the sparse `sessions` rows that exist only where a teacher has touched a
 * day. See docs/data-model.md. This is the highest-risk unit in the codebase;
 * change it test-first.
 *
 *   resolveDay =
 *       slots whose weekday matches the date and whose validity window covers it
 *     minus slots carrying a `cancelled` tombstone on that date
 *     with each remaining slot's content taken from its materialised session, if any
 *     plus standalone sessions on that date (ad-hoc, or a `timetable` row whose
 *          slot was later deleted — either way, real work the teacher can see)
 *     sorted by start time, then a total tiebreaker
 *     with time-overlapping entries flagged when their grade-group scopes intersect
 *
 * If a `calendar` is supplied, a non-teaching date (holiday, closure, outside
 * the year) resolves to an empty day.
 */

import type {
  IsoDate,
  ResolvedSession,
  Session,
  SessionOrigin,
  TermCalendar,
  TimetableSlot,
} from './types.js';
import { compareIsoDate, isoWeekday } from './plain-date.js';
import { timeRangesOverlap } from './plain-time.js';
import { isTeachingDay } from './teaching-days.js';

export interface ResolveDayInput {
  readonly classId: string;
  readonly date: IsoDate;
  readonly slots: readonly TimetableSlot[];
  readonly sessions: readonly Session[];
  /**
   * When provided, a date that is not a teaching day resolves to `[]`. Omit to
   * resolve purely from slots and sessions (the caller has already checked).
   */
  readonly calendar?: TermCalendar;
}

export function resolveDay(input: ResolveDayInput): ResolvedSession[] {
  const { classId, date } = input;

  if (input.calendar !== undefined && !isTeachingDay(input.calendar, date)) {
    return [];
  }

  const weekday = isoWeekday(date);
  const slots = input.slots.filter((slot) => slot.classId === classId);
  const sessions = input.sessions.filter(
    (session) => session.classId === classId && session.onDate === date,
  );

  // The DB guarantees at most one session row per (class, date, slot).
  const sessionBySlot = new Map<string, Session>();
  for (const session of sessions) {
    if (session.slotId !== null) sessionBySlot.set(session.slotId, session);
  }

  const entries: ResolvedSession[] = [];

  // 1. Recurring slots in effect on this weekday and date.
  for (const slot of slots) {
    if (slot.dayOfWeek !== weekday) continue;
    if (compareIsoDate(slot.validFrom, date) > 0) continue;
    if (slot.validTo !== null && compareIsoDate(slot.validTo, date) < 0) continue;

    const materialised = sessionBySlot.get(slot.id);
    if (materialised !== undefined && materialised.origin === 'cancelled') {
      continue; // cancellation wins over any content the row still carries
    }

    entries.push(
      materialised === undefined
        ? fromBareSlot(slot, date)
        : fromMaterialisedSlot(slot, materialised, date),
    );
  }

  // 2. Standalone sessions not tied to a live slot.
  for (const session of sessions) {
    if (session.slotId !== null) continue; // covered by the slot loop
    if (session.origin === 'cancelled') continue; // nothing to suppress
    entries.push(fromStandaloneSession(session, date));
  }

  entries.sort(compareResolved);
  return markConflicts(entries);
}

function fromBareSlot(slot: TimetableSlot, date: IsoDate): ResolvedSession {
  return {
    onDate: date,
    startTime: slot.startTime,
    durationMinutes: slot.durationMinutes,
    subjectId: slot.subjectId,
    gradeGroupId: slot.gradeGroupId,
    slotId: slot.id,
    sessionId: null,
    origin: 'timetable',
    objective: null,
    description: null,
    notes: null,
    status: 'planned',
    hasConflict: false,
  };
}

function fromMaterialisedSlot(
  slot: TimetableSlot,
  session: Session,
  date: IsoDate,
): ResolvedSession {
  return {
    onDate: date,
    // A teacher may have nudged the time or length on the materialised row.
    startTime: session.startTime,
    durationMinutes: session.durationMinutes,
    // The slot stays the authority for which subject and grade group this is;
    // a soft-deleted (inactive) subject still resolves — the row is not lost.
    subjectId: slot.subjectId,
    gradeGroupId: slot.gradeGroupId,
    slotId: slot.id,
    sessionId: session.id,
    origin: 'timetable',
    objective: session.objective,
    description: session.description,
    notes: session.notes,
    status: session.status,
    hasConflict: false,
  };
}

function fromStandaloneSession(session: Session, date: IsoDate): ResolvedSession {
  return {
    onDate: date,
    startTime: session.startTime,
    durationMinutes: session.durationMinutes,
    subjectId: session.subjectId,
    gradeGroupId: session.gradeGroupId,
    slotId: null,
    sessionId: session.id,
    origin: session.origin,
    objective: session.objective,
    description: session.description,
    notes: session.notes,
    status: session.status,
    hasConflict: false,
  };
}

function originRank(origin: SessionOrigin): number {
  return origin === 'timetable' ? 0 : origin === 'adhoc' ? 1 : 2;
}

function cmp(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Total order so a permutation of the inputs cannot reorder the output
 * (NFR-23 / M0.5). Start time first, everything else only to break ties.
 */
function compareResolved(a: ResolvedSession, b: ResolvedSession): number {
  return (
    cmp(a.startTime, b.startTime) ||
    a.durationMinutes - b.durationMinutes ||
    cmp(a.gradeGroupId ?? '', b.gradeGroupId ?? '') ||
    cmp(a.subjectId ?? '', b.subjectId ?? '') ||
    originRank(a.origin) - originRank(b.origin) ||
    cmp(a.slotId ?? '', b.slotId ?? '') ||
    cmp(a.sessionId ?? '', b.sessionId ?? '')
  );
}

/** Two grade-group scopes intersect unless both are set and differ. */
function scopesIntersect(a: string | null, b: string | null): boolean {
  return a === null || b === null || a === b;
}

/**
 * Flag every entry that time-overlaps another entry it shares a scope with.
 * Two parallel slots for different grade groups in the same time band do not
 * conflict (FR-407); an ad-hoc session laid over a recurring slot does, and
 * both ends are flagged so the UI can surface the clash (data-model.md).
 */
function markConflicts(entries: readonly ResolvedSession[]): ResolvedSession[] {
  const clashing = new Set<number>();
  for (let i = 0; i < entries.length; i++) {
    const a = entries[i];
    if (a === undefined) continue;
    for (let j = i + 1; j < entries.length; j++) {
      const b = entries[j];
      if (b === undefined) continue;
      if (!scopesIntersect(a.gradeGroupId, b.gradeGroupId)) continue;
      if (!timeRangesOverlap(a.startTime, a.durationMinutes, b.startTime, b.durationMinutes)) {
        continue;
      }
      clashing.add(i);
      clashing.add(j);
    }
  }
  if (clashing.size === 0) return [...entries];
  return entries.map((entry, index) =>
    clashing.has(index) ? { ...entry, hasConflict: true } : entry,
  );
}
