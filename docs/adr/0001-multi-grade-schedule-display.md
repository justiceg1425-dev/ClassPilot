# ADR-0001 — Multi-grade daily-schedule display

| | |
|---|---|
| Status | Accepted |
| Date | 2026-09-04 |
| Milestone | M0.6 |
| Closes | OQ-04 |
| Relates to | FR-407, FR-501, FR-506; `docs/data-model.md`; `docs/architecture.md` §9 |

## Context

A multi-grade class holds students from two or more grade levels in one room. In
some time bands the whole class does the same thing (a shared assembly); in
others each grade group does something different in parallel (Year 3 guided
reading while Year 4 does independent writing). OQ-04 asked whether the daily
schedule should show **one merged column** or **one column per grade group**.

The question could not be answered before the schedule-resolution model existed
(architecture.md §9): whether a parallel band is one cell split in two or two
independent cells is a data-shape question first. M0 settled the data shape, so
this ADR can now settle the display.

## Decision

**Per-band, driven by the data — not a fixed layout for the whole screen.**

- A `TimetableSlot` (and a resolved `ResolvedSession`) carries `gradeGroupId`.
  `null` means whole-class; a set value scopes the entry to one grade group.
- `resolveDay` returns **one `ResolvedSession` per slot or standalone session**,
  each with its own `gradeGroupId`. It does not merge or split.
- The daily-schedule UI groups resolved entries by time band and then, per band:
  - all entries whole-class (`gradeGroupId === null`) → **one merged row**;
  - entries scoped to two or more distinct grade groups → **one column per
    grade group**, ordered by `gradeGroups.sequence`;
  - a mix (a whole-class entry sharing a band with a scoped one) → render as
    parallel columns and flag it, because it is almost certainly a mistake.

The same rule works for a single-grade class: every entry is whole-class, so
every band is a single merged row and no column-splitting ever happens.

## Conflict semantics (decided alongside, in `resolveDay`)

- Two entries **conflict** when their times overlap *and* their grade-group
  scopes intersect (`scopesIntersect`: they intersect unless both are set and
  differ). Both ends are flagged `hasConflict`, both are still returned; the UI
  surfaces the clash rather than the resolver dropping one.
- Two parallel slots for **different** grade groups in one band therefore do
  **not** conflict — that is the legitimate FR-407 case.
- The database exclusion constraint `slots_no_overlap` already prevents
  overlapping *slots* within one class + grade group, so in practice conflicts
  only arise between an ad-hoc session and a slot, or between two ad-hoc
  sessions.

## Other resolution behaviours fixed by M0

- **Non-teaching date.** When `resolveDay` is given a `TermCalendar` and the date
  is outside the year, outside every term, or inside a non-teaching period, it
  returns `[]`. Without a calendar it resolves purely from slots and sessions
  (the caller has already checked). *Open:* whether an explicitly added ad-hoc
  session on a holiday should still surface — deferred to M4 when the daily
  schedule UI is built.
- **Cancellation wins.** A `cancelled`-origin session for a slot suppresses that
  slot entirely, regardless of any objective text the row still carries.
- **Orphaned work is kept.** A `timetable`-origin session whose `slotId` is
  `null` (its slot was hard-deleted) is still returned as a standalone entry.
  This is a deliberate extension of the `data-model.md` resolution sketch, which
  lists only ad-hoc rows in its "plus" step; hiding a real objective a teacher
  wrote would violate the "never lose teacher work" rule. Flagged for review.
- **Retired subjects still resolve.** Subjects are soft-deleted only; a slot
  pointing at an inactive subject resolves normally. The UI decides how to badge
  it.
- **Deterministic order.** Entries sort by start time, then a total tiebreaker
  (`durationMinutes`, `gradeGroupId`, `subjectId`, origin rank, `slotId`,
  `sessionId`). A permutation of the input arrays cannot change the output — this
  is asserted by a generated-input property test (M0.5).

## Consequences

- The UI needs `gradeGroups` (with `sequence`) in scope wherever it renders a
  day or a week, to order and label parallel columns.
- The timetable grid (M3) has the same per-band decision to make and should
  share a layout helper with the daily schedule (M4).
- Print and PDF output (Phase 2) must handle the column split within the
  greyscale constraint (NFR-20) — parallel columns cannot rely on colour alone
  to distinguish grade groups.
- `resolveDay` stays a pure function in `packages/shared` with no knowledge of
  rendering; every display rule above is the caller's to apply.
