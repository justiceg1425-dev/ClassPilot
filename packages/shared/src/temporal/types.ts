/**
 * Core temporal domain types (M0.1).
 *
 * See docs/data-model.md. The schedule model is: recurring `TimetableSlot`s with
 * validity windows, plus lazily-materialised `Session` rows, resolved per date
 * into `ResolvedSession`s. Dates and times are stored and compared as plain
 * calendar values — never timestamps, never timezone-converted (CLAUDE.md).
 */

/** A calendar date with no time or zone, formatted `YYYY-MM-DD`. */
export type IsoDate = string & { readonly __isoDate: unique symbol };

/** A wall-clock time of day with no date or zone, formatted `HH:MM` (24-hour). */
export type IsoTime = string & { readonly __isoTime: unique symbol };

/** ISO-8601 weekday: 1 = Monday … 7 = Sunday. Matches Postgres `isodow`. */
export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** How a session came to exist on a given date. */
export type SessionOrigin = 'timetable' | 'adhoc' | 'cancelled';

/** Teaching progress a teacher records against a session. */
export type SessionStatus = 'planned' | 'done' | 'partial' | 'not_done';

/**
 * A recurring weekly block of teaching time for a class.
 *
 * A mid-year change never edits a slot: the old row gets a `validTo`, and a new
 * row is inserted with the next day as its `validFrom`. History stays correct by
 * construction.
 */
export interface TimetableSlot {
  readonly id: string;
  readonly classId: string;
  readonly subjectId: string;
  /** `null` for a whole-class slot; set to target one grade group (FR-407). */
  readonly gradeGroupId: string | null;
  readonly dayOfWeek: IsoWeekday;
  readonly startTime: IsoTime;
  readonly durationMinutes: number;
  /** First date (inclusive) this slot is in effect. */
  readonly validFrom: IsoDate;
  /** Last date (inclusive) this slot is in effect; `null` means open-ended. */
  readonly validTo: IsoDate | null;
}

/**
 * A materialised session row. Written only once a teacher puts something in a
 * session, adds an ad-hoc one, or cancels one. Untouched days cost zero rows.
 */
export interface Session {
  readonly id: string;
  readonly classId: string;
  /** The slot this session materialises; `null` for ad-hoc sessions. */
  readonly slotId: string | null;
  readonly subjectId: string | null;
  readonly gradeGroupId: string | null;
  readonly onDate: IsoDate;
  readonly startTime: IsoTime;
  readonly durationMinutes: number;
  readonly origin: SessionOrigin;
  readonly objective: string | null;
  readonly description: string | null;
  readonly notes: string | null;
  readonly status: SessionStatus;
}

/**
 * One entry in a resolved day: what is actually taught in a time band on a date,
 * after applying validity windows, cancellations, materialised rows and ad-hoc
 * additions. Produced by `resolveDay` (M0.3); never stored.
 */
export interface ResolvedSession {
  readonly onDate: IsoDate;
  readonly startTime: IsoTime;
  readonly durationMinutes: number;
  readonly subjectId: string | null;
  readonly gradeGroupId: string | null;
  /** The originating slot, if this entry came from the recurring timetable. */
  readonly slotId: string | null;
  /** The materialised session, if one exists for this entry. */
  readonly sessionId: string | null;
  readonly origin: SessionOrigin;
  readonly objective: string | null;
  readonly description: string | null;
  readonly notes: string | null;
  readonly status: SessionStatus;
  /**
   * True when an ad-hoc session overlaps a recurring slot in the same band.
   * Both entries are returned; the UI surfaces the clash (see data-model.md).
   */
  readonly hasConflict: boolean;
}

/** A named division of the academic year with an inclusive date range. */
export interface Term {
  readonly name: string;
  readonly sequence: number;
  readonly startsOn: IsoDate;
  readonly endsOn: IsoDate;
}

/** A holiday or closure removed from the teaching calendar, inclusive range. */
export interface NonTeachingPeriod {
  readonly label: string;
  readonly startsOn: IsoDate;
  readonly endsOn: IsoDate;
}

/**
 * Everything needed to decide whether a given date is a teaching day: the year
 * bounds, its terms, and the periods carved out of it. Input to
 * `getTeachingDays` (M0.2).
 */
export interface TermCalendar {
  readonly yearStartsOn: IsoDate;
  readonly yearEndsOn: IsoDate;
  readonly terms: readonly Term[];
  readonly nonTeachingPeriods: readonly NonTeachingPeriod[];
}
