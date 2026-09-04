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

export {
  isIsoDate,
  parseIsoDate,
  isoDate,
  addDays,
  differenceInDays,
  compareIsoDate,
  isoWeekday,
  isWithinInclusive,
  eachDayInclusive,
  startOfIsoWeek,
} from './temporal/plain-date.js';

export {
  isIsoTime,
  parseIsoTime,
  isoTime,
  minutesOfDay,
  timeRangesOverlap,
} from './temporal/plain-time.js';

export {
  isTeachingDay,
  getTeachingDays,
  getTeachingWeeks,
  type TeachingWeek,
} from './temporal/teaching-days.js';

export { resolveDay, type ResolveDayInput } from './temporal/resolve-day.js';
