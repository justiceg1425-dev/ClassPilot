# Data Model — Phase 1

The riskiest part of this project (RSK-02). Read this before writing schedule code.

---

## The core problem

A teacher's timetable is a **recurring weekly pattern**. Their actual teaching year is a
**sequence of specific dates** that deviates from that pattern constantly: a trip cancels
Tuesday afternoon, a subject swaps rooms from January, a public holiday removes a day, an
objective gets written against one particular Wednesday.

Three naive approaches, and why each fails:

| Approach | Failure |
|---|---|
| Store only the recurring pattern | Nowhere to put "on 12 March we did fractions and it went badly" |
| Materialise every session for the whole year up front | ~7,000 rows per teacher; every timetable edit becomes a bulk rewrite; deciding whether to rewrite past rows is a guess |
| Store the pattern and mutate it on change | Destroys history — regenerating last November's schedule produces this term's timetable |

## The chosen model

**Recurring slots with validity windows, plus lazily materialised sessions.**

```
timetable_slots
  class_id, subject_id, grade_group_id?, day_of_week, start_time,
  duration_minutes, valid_from, valid_to?
```

- A timetable change on 6 January does not edit the existing row. It sets
  `valid_to = 2027-01-05` on the old row and inserts a new row with
  `valid_from = 2027-01-06`. History is correct by construction.
- `grade_group_id` is null for a whole-class slot. Two slots may occupy the same day and time
  **only if** they target different grade groups (multi-grade parallel teaching, FR-407).

```
sessions
  class_id, date, slot_id?, subject_id, start_time, duration_minutes,
  objective, description, notes, status, origin, lesson_id?
```

- A row exists only once a teacher has put something in it, or added an ad-hoc session, or
  cancelled one. Untouched days cost zero rows.
- `origin` is `timetable` (materialised from a slot), `adhoc` (added for this date only), or
  `cancelled` (a tombstone suppressing a slot on this date).

### Resolving a day

```
resolveDay(classId, date) =
    slots where day_of_week matches date
      and valid_from <= date
      and (valid_to is null or valid_to >= date)
  minus slots with a `cancelled` session row on that date
  overlaid with materialised `timetable` session rows on that date
  plus `adhoc` session rows on that date
  sorted by start_time
```

This function lives in `packages/shared` and is used identically by web and mobile.
**It is the most heavily tested unit in the codebase.** Cases it must cover:

- A date before any slot's `valid_from`
- A date inside a non-teaching period (returns nothing)
- A mid-year timetable change, resolved on dates either side of the boundary
- A multi-grade class with two parallel slots in one time band
- A cancelled slot that also has a materialised session (cancellation wins)
- An ad-hoc session that overlaps a recurring slot (both returned; UI shows a conflict)
- A slot whose subject was deleted (soft-delete only — subjects are never hard-deleted)

---

## Entity relationships (Phase 1)

```
auth.users
   └── profiles
         └── schools
               ├── academic_years
               │     ├── terms
               │     └── non_teaching_periods
               └── classes  ──── (academic_year_id)
                     ├── grade_groups
                     │     └── students
                     ├── subjects
                     ├── timetable_slots ── (subject, grade_group)
                     ├── sessions ── (slot?, subject)
                     └── assessments
                           └── grades ── (student)
```

---

## Decisions taken (resolving BRD open questions)

**OQ-02 — where grading scales live.** Per class, with a per-assessment override. A teacher
sets a default scale for the class; an individual assessment may use a different one. Putting
it per subject was rejected as a level of granularity teachers do not ask for, and per
assessment only forces repetitive setup.

**OQ-04 — multi-grade daily schedule display.** Parallel columns when two grade groups have
different slots in the same time band; a single merged row when the slot is whole-class. The
data model supports both; the UI decides per time band.

**OQ-05 — mid-year timetable change.** Past schedules stay frozen. Implemented via validity
windows as above. This is now a decision, not a question.

Still open: OQ-01 (curriculum framework licensing), OQ-03 (mobile offline strategy),
OQ-06 (report comment versioning), OQ-07 (co-teaching conflict resolution).

---

## Constraints worth enforcing in the database, not the app

- No overlapping slots for the same class **and** the same grade group. Requires
  `btree_gist` and an exclusion constraint, or a trigger. Prefer the exclusion constraint —
  it cannot be bypassed.
- Terms within an academic year must not overlap, and must fall inside the year's dates.
- `students.grade_group_id` must reference a grade group belonging to the same class.
- A grade's student and its assessment's class must match. Enforced by a composite foreign
  key or a trigger — do not leave this to application code.
- `date` and `time` columns, never `timestamptz`, for anything academic. Timezone conversion
  on a school timetable is a bug generator with no upside.
