/**
 * @classpilot/shared — the single home for domain types, Zod schemas and domain
 * logic used by both the web and mobile clients. Nothing platform-specific.
 */

export type {
  IsoDate,
  IsoTime,
  IsoWeekday,
  SessionOrigin,
  SessionStatus,
  TimetableSlot,
  Session,
  ResolvedSession,
  Term,
  NonTeachingPeriod,
  TermCalendar,
} from './temporal/types.js';
