import { describe, expect, it } from 'vitest';
import type {
  IsoDate,
  IsoTime,
  Session,
  SessionOrigin,
  SessionStatus,
  TermCalendar,
  TimetableSlot,
} from './types.js';
import { isoWeekday, parseIsoDate } from './plain-date.js';
import { parseIsoTime } from './plain-time.js';
import { resolveDay, type ResolveDayInput } from './resolve-day.js';

const on = (s: string): IsoDate => parseIsoDate(s);
const at = (s: string): IsoTime => parseIsoTime(s);

/** ISO weekday 1 (Monday). Every base fixture targets this day. */
const MON = on('2026-09-07');

let slotSeq = 0;
function makeSlot(over: Partial<TimetableSlot> = {}): TimetableSlot {
  slotSeq += 1;
  const base: TimetableSlot = {
    id: `slot-${slotSeq}`,
    classId: 'c1',
    subjectId: 'subj-maths',
    gradeGroupId: null,
    dayOfWeek: 1,
    startTime: at('09:00'),
    durationMinutes: 60,
    validFrom: on('2026-09-01'),
    validTo: null,
  };
  return { ...base, ...over };
}

let sessionSeq = 0;
function makeSession(over: Partial<Session> = {}): Session {
  sessionSeq += 1;
  const base: Session = {
    id: `session-${sessionSeq}`,
    classId: 'c1',
    slotId: null,
    subjectId: 'subj-maths',
    gradeGroupId: null,
    onDate: MON,
    startTime: at('09:00'),
    durationMinutes: 60,
    origin: 'adhoc',
    objective: null,
    description: null,
    notes: null,
    status: 'planned',
  };
  return { ...base, ...over };
}

describe('resolveDay (M0.3, FR-501, FR-506)', () => {
  it('resolves an untouched teaching day straight from the timetable', () => {
    const slots = [
      makeSlot({ startTime: at('10:30'), subjectId: 'subj-art' }),
      makeSlot({ startTime: at('08:30'), subjectId: 'subj-english' }),
      makeSlot({ startTime: at('09:30'), subjectId: 'subj-maths' }),
    ];
    const day = resolveDay({ classId: 'c1', date: MON, slots, sessions: [] });

    expect(day.map((e) => e.startTime)).toEqual(['08:30', '09:30', '10:30']);
    expect(day.every((e) => e.origin === 'timetable' && e.sessionId === null)).toBe(true);
    expect(day.every((e) => e.status === 'planned' && !e.hasConflict)).toBe(true);
  });

  it('case 1 — returns nothing for a date before every slot takes effect', () => {
    const slots = [makeSlot({ validFrom: on('2026-09-14') })];
    expect(resolveDay({ classId: 'c1', date: MON, slots, sessions: [] })).toEqual([]);
  });

  it('case 2 — returns nothing on a non-teaching date when a calendar is supplied', () => {
    const calendar: TermCalendar = {
      yearStartsOn: on('2026-09-01'),
      yearEndsOn: on('2027-07-16'),
      terms: [
        { name: 'Autumn', sequence: 1, startsOn: on('2026-09-01'), endsOn: on('2026-12-18') },
      ],
      nonTeachingPeriods: [
        { label: 'Half term', startsOn: on('2026-10-26'), endsOn: on('2026-10-30') },
      ],
    };
    const holiday = on('2026-10-26'); // a Monday inside the non-teaching period
    const slots = [makeSlot()];

    expect(resolveDay({ classId: 'c1', date: holiday, slots, sessions: [], calendar })).toEqual([]);
    // Without the calendar, the caller gets the raw timetable resolution.
    expect(resolveDay({ classId: 'c1', date: holiday, slots, sessions: [] })).toHaveLength(1);
  });

  describe('case 3 — a mid-year timetable change (OQ-05)', () => {
    const slots = [
      makeSlot({
        id: 'slot-old',
        subjectId: 'subj-maths',
        validFrom: on('2026-09-01'),
        validTo: on('2027-01-05'),
      }),
      makeSlot({
        id: 'slot-new',
        subjectId: 'subj-science',
        validFrom: on('2027-01-06'),
        validTo: null,
      }),
    ];

    it('resolves the old slot on a date before the boundary', () => {
      const day = resolveDay({ classId: 'c1', date: on('2026-11-09'), slots, sessions: [] });
      expect(day).toHaveLength(1);
      expect(day[0]?.slotId).toBe('slot-old');
      expect(day[0]?.subjectId).toBe('subj-maths');
    });

    it('resolves the new slot on a date after the boundary', () => {
      const day = resolveDay({ classId: 'c1', date: on('2027-01-11'), slots, sessions: [] });
      expect(day).toHaveLength(1);
      expect(day[0]?.slotId).toBe('slot-new');
      expect(day[0]?.subjectId).toBe('subj-science');
    });
  });

  it('case 4 — returns two parallel grade-group slots in one band, no conflict (FR-407)', () => {
    const slots = [
      makeSlot({ id: 'slot-y4', gradeGroupId: 'gg-y4', startTime: at('09:00') }),
      makeSlot({ id: 'slot-y3', gradeGroupId: 'gg-y3', startTime: at('09:00') }),
    ];
    const day = resolveDay({ classId: 'c1', date: MON, slots, sessions: [] });

    expect(day).toHaveLength(2);
    expect(day.map((e) => e.gradeGroupId)).toEqual(['gg-y3', 'gg-y4']); // deterministic order
    expect(day.some((e) => e.hasConflict)).toBe(false);
  });

  it('case 5 — a cancelled tombstone suppresses its slot, even one still carrying content', () => {
    const slots = [makeSlot({ id: 'slot-1' })];
    const sessions = [
      makeSession({
        slotId: 'slot-1',
        origin: 'cancelled',
        objective: 'Fractions (cancelled after a fire drill)',
      }),
    ];
    expect(resolveDay({ classId: 'c1', date: MON, slots, sessions })).toEqual([]);
  });

  it('case 6 — flags an ad-hoc session overlapping a recurring slot, returning both', () => {
    const slots = [makeSlot({ id: 'slot-1', startTime: at('09:00'), durationMinutes: 60 })];
    const sessions = [
      makeSession({
        id: 'adhoc-1',
        slotId: null,
        origin: 'adhoc',
        subjectId: 'subj-assembly',
        startTime: at('09:30'),
        durationMinutes: 60,
      }),
    ];
    const day = resolveDay({ classId: 'c1', date: MON, slots, sessions });

    expect(day).toHaveLength(2);
    expect(day.every((e) => e.hasConflict)).toBe(true);
  });

  it('case 7 — still resolves a slot whose subject has been retired (soft delete only)', () => {
    const slots = [makeSlot({ id: 'slot-1', subjectId: 'subj-retired' })];
    const day = resolveDay({ classId: 'c1', date: MON, slots, sessions: [] });

    expect(day).toHaveLength(1);
    expect(day[0]?.subjectId).toBe('subj-retired');
  });

  it('overlays a materialised session onto its slot (lazy materialisation)', () => {
    const slots = [makeSlot({ id: 'slot-1', subjectId: 'subj-maths' })];
    const sessions = [
      makeSession({
        id: 'sess-1',
        slotId: 'slot-1',
        origin: 'timetable',
        objective: 'Equivalent fractions',
        description: 'Fraction walls',
        notes: 'Group B needs manipulatives',
        status: 'done',
      }),
    ];
    const day = resolveDay({ classId: 'c1', date: MON, slots, sessions });

    expect(day).toHaveLength(1);
    expect(day[0]).toMatchObject({
      slotId: 'slot-1',
      sessionId: 'sess-1',
      origin: 'timetable',
      subjectId: 'subj-maths',
      objective: 'Equivalent fractions',
      status: 'done',
    });
  });

  it('surfaces a timetable session orphaned by slot deletion rather than dropping the work', () => {
    // Deviation from data-model.md, which lists only ad-hoc rows in step "plus".
    // A `timetable` row with a null slot_id is teacher work left behind when a
    // slot was hard-deleted; hiding it would lose an objective. Flagged for review.
    const sessions = [
      makeSession({
        id: 'sess-orphan',
        slotId: null,
        origin: 'timetable',
        objective: 'Column addition',
        status: 'partial',
      }),
    ];
    const day = resolveDay({ classId: 'c1', date: MON, slots: [], sessions });

    expect(day).toHaveLength(1);
    expect(day[0]).toMatchObject({
      sessionId: 'sess-orphan',
      origin: 'timetable',
      slotId: null,
      objective: 'Column addition',
    });
  });

  it('ignores slots and sessions belonging to another class', () => {
    const slots = [
      makeSlot({ id: 'mine', classId: 'c1' }),
      makeSlot({ id: 'theirs', classId: 'c2' }),
    ];
    const sessions = [makeSession({ id: 's2', classId: 'c2', origin: 'adhoc' })];
    const day = resolveDay({ classId: 'c1', date: MON, slots, sessions });

    expect(day).toHaveLength(1);
    expect(day[0]?.slotId).toBe('mine');
  });

  it('ignores a session dated to another day', () => {
    const slots = [makeSlot({ id: 'slot-1' })];
    const sessions = [
      makeSession({ id: 's-tue', slotId: 'slot-1', origin: 'cancelled', onDate: on('2026-09-08') }),
    ];
    // The cancellation is for Tuesday, so Monday still resolves its slot.
    expect(resolveDay({ classId: 'c1', date: MON, slots, sessions })).toHaveLength(1);
  });

  it('orders two otherwise-identical ad-hoc sessions by id, stably', () => {
    const common = {
      slotId: null,
      origin: 'adhoc' as const,
      subjectId: 'subj-choir',
      gradeGroupId: null,
      startTime: at('13:00'),
      durationMinutes: 30,
    };
    const forward = resolveDay({
      classId: 'c1',
      date: MON,
      slots: [],
      sessions: [makeSession({ id: 'aaa', ...common }), makeSession({ id: 'bbb', ...common })],
    });
    const reversed = resolveDay({
      classId: 'c1',
      date: MON,
      slots: [],
      sessions: [makeSession({ id: 'bbb', ...common }), makeSession({ id: 'aaa', ...common })],
    });

    expect(forward.map((e) => e.sessionId)).toEqual(['aaa', 'bbb']);
    expect(reversed.map((e) => e.sessionId)).toEqual(['aaa', 'bbb']);
    // They time-overlap and share a (whole-class) scope, so both are flagged.
    expect(forward.every((e) => e.hasConflict)).toBe(true);
  });

  describe('property: determinism and order stability (M0.5, NFR-23)', () => {
    it('is repeatable, permutation-invariant and start-time sorted for any generated day', () => {
      const rng = mulberry32(0xc1a5_5e11);

      for (let iteration = 0; iteration < 400; iteration += 1) {
        const scenario = randomScenario(rng);
        const base = resolveDay(scenario);

        expect(resolveDay(scenario)).toEqual(base); // repeatable

        const shuffled: ResolveDayInput = {
          ...scenario,
          slots: shuffle(rng, scenario.slots),
          sessions: shuffle(rng, scenario.sessions),
        };
        expect(resolveDay(shuffled)).toEqual(base); // permutation-invariant

        const starts = base.map((e) => e.startTime);
        expect(starts).toEqual([...starts].sort()); // sorted by start time

        const flagged = base.filter((e) => e.hasConflict).length;
        expect(flagged === 0 || flagged >= 2).toBe(true); // conflicts come in pairs
      }
    });
  });
});

// --- deterministic pseudo-random generators (no fast-check dependency yet) ---

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = a;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function pick<T>(rng: () => number, items: readonly T[]): T {
  const value = items[Math.floor(rng() * items.length)];
  if (value === undefined) throw new Error('pick() from an empty list');
  return value;
}

function shuffle<T>(rng: () => number, items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const a = out[i];
    const b = out[j];
    if (a === undefined || b === undefined) continue;
    out[i] = b;
    out[j] = a;
  }
  return out;
}

const DATE_POOL: readonly IsoDate[] = [
  '2026-09-07',
  '2026-09-08',
  '2026-09-09',
  '2026-11-09',
  '2027-01-11',
].map(on);
const TIME_POOL: readonly IsoTime[] = ['08:30', '09:00', '09:30', '10:30', '13:00'].map(at);
const DURATION_POOL: readonly number[] = [30, 45, 60];
const GRADE_GROUP_POOL: readonly (string | null)[] = [null, 'gg-a', 'gg-b'];
const ORIGIN_POOL: readonly SessionOrigin[] = ['timetable', 'adhoc', 'cancelled'];
const STATUS_POOL: readonly SessionStatus[] = ['planned', 'done', 'partial', 'not_done'];

function randomScenario(rng: () => number): ResolveDayInput {
  const date = pick(rng, DATE_POOL);

  const slotCount = Math.floor(rng() * 6); // 0..5
  const slots: TimetableSlot[] = [];
  for (let i = 0; i < slotCount; i += 1) {
    slots.push({
      id: `pslot-${i}`,
      classId: 'c1',
      subjectId: `subj-${i % 3}`,
      gradeGroupId: pick(rng, GRADE_GROUP_POOL),
      dayOfWeek: isoWeekday(date),
      startTime: pick(rng, TIME_POOL),
      durationMinutes: pick(rng, DURATION_POOL),
      validFrom: on('2026-09-01'),
      validTo: rng() < 0.3 ? on('2026-12-18') : null,
    });
  }

  const sessionCount = Math.floor(rng() * 5); // 0..4
  const sessions: Session[] = [];
  for (let i = 0; i < sessionCount; i += 1) {
    // At most one session per slot per date (DB unique index); tie session i to
    // slot i so a shuffle can never change which row wins.
    const boundSlot = i < slots.length && rng() < 0.6 ? slots[i] : undefined;
    sessions.push({
      id: `psess-${i}`,
      classId: 'c1',
      slotId: boundSlot?.id ?? null,
      subjectId: `subj-${i % 3}`,
      gradeGroupId: pick(rng, GRADE_GROUP_POOL),
      onDate: rng() < 0.85 ? date : pick(rng, DATE_POOL),
      startTime: pick(rng, TIME_POOL),
      durationMinutes: pick(rng, DURATION_POOL),
      origin: pick(rng, ORIGIN_POOL),
      objective: rng() < 0.5 ? `obj-${i}` : null,
      description: null,
      notes: null,
      status: pick(rng, STATUS_POOL),
    });
  }

  return { classId: 'c1', date, slots, sessions };
}
