# Phase 1 Backlog

Ordered. Front-loads the riskiest work. Each ticket names the requirements it satisfies —
carry the IDs into commits and test names.

Do not start a milestone before the previous one's exit criteria are met (RSK-01).

---

## M0 — Schedule resolution spike

**Purpose:** prove the temporal model before any UI exists. Addresses RSK-02, closes OQ-04
and OQ-05. No database, no framework — pure TypeScript in `packages/shared`.

| # | Ticket | Requirements |
|---|---|---|
| M0.1 | Define domain types: `TimetableSlot`, `Session`, `ResolvedSession`, `TermCalendar` | — |
| M0.2 | Implement `getTeachingDays(year, terms, nonTeachingPeriods)` | FR-204 |
| M0.3 | Implement `resolveDay(classId, date, slots, sessions)` per `data-model.md` | FR-501, FR-506 |
| M0.4 | Unit tests for all eight cases listed in `data-model.md` | NFR-23 |
| M0.5 | Property test: for any date, resolution is deterministic and slot-order stable | NFR-23 |
| M0.6 | Write up the multi-grade display decision as an ADR | OQ-04 |

**Exit:** `pnpm test` green, mid-year timetable change and multi-grade parallel slots both
provably handled, zero UI written.

---

## M1 — Foundations

| # | Ticket | Requirements |
|---|---|---|
| M1.1 | pnpm workspace + Turborepo; `apps/web`, `apps/mobile`, `packages/shared`, `packages/db` | — |
| M1.2 | Supabase project; local dev via Supabase CLI | — |
| M1.3 | Apply `db/001_phase1_schema.sql` as the first migration | — |
| M1.4 | Generate TypeScript types from schema; wire `pnpm db:types` | — |
| M1.5 | Auth: register, email verification, login, session persistence | FR-101–104 |
| M1.6 | Password reset via time-limited single-use link | FR-103 |
| M1.7 | Account deletion with verified cascade | FR-106, NFR-13 |
| M1.8 | Seed script: 2 users, 2 schools, one single-grade and one multi-grade class, 28 students, full timetable, one term of sessions and grades | NFR-25 |
| M1.9 | RLS negative test harness — user B cannot read any of user A's rows, table by table | NFR-11 |
| M1.10 | GitHub Actions: lint, typecheck, test on PR | — |
| M1.11 | `keepalive.yml` cron pinging Supabase every 3 days | Free-tier pause |
| M1.12 | `backup.yml` weekly `pg_dump` to artifact | NFR-07 |

**Exit:** a second user provably cannot read the first user's data; seed produces a working
dataset in one command; CI green on main.

---

## M2 — Setup UI (web)

| # | Ticket | Requirements |
|---|---|---|
| M2.1 | App shell, navigation, active-context switcher | FR-207, FR-208 |
| M2.2 | School CRUD | FR-201 |
| M2.3 | Academic year with terms; overlap validation surfaced from the DB constraint | FR-202, FR-203 |
| M2.4 | Non-teaching periods; derived teaching-week list | FR-204 |
| M2.5 | Class CRUD including teaching days and day bounds | FR-205 |
| M2.6 | Grade groups for multi-grade classes | FR-206 |
| M2.7 | Student CRUD; assignment to grade group | FR-301, FR-304 |
| M2.8 | CSV roster import with preview and per-row validation | FR-302 |
| M2.9 | Mark student inactive, preserving history | FR-305 |
| M2.10 | Subjects with colour and short label; greyscale-distinctness check on colour choice | FR-405, NFR-20 |

**Exit:** a full teaching context can be created through the UI with no SQL.

---

## Design pass

Between M2 and M3. See `architecture.md` §8. Produces design tokens plus layouts for:
timetable grid, daily schedule (desktop + mobile), gradebook grid, curriculum coverage matrix,
mobile today screen. Nothing else.

---

## M3 — Timetable (web)

| # | Ticket | Requirements |
|---|---|---|
| M3.1 | Weekly grid rendering teaching days and time bands | FR-401, FR-402 |
| M3.2 | Create slot: day, start, duration, subject | FR-403 |
| M3.3 | Overlap prevention — DB constraint surfaced as a usable error | FR-404 |
| M3.4 | Drag to move, resize to change duration, duplicate | FR-406 |
| M3.5 | Grade-group-scoped slots rendered as parallel columns | FR-407 |
| M3.6 | Mid-year change flow: "change from date X" creating a new validity window | OQ-05 |
| M3.7 | Full keyboard operability of the grid | NFR-18 |

**Exit:** a timetable can be built, changed mid-year, and a past date still resolves to what
was taught then — verified by an E2E test.

---

## M4 — Daily schedule + PWA

| # | Ticket | Requirements |
|---|---|---|
| M4.1 | Day view generated via `resolveDay` | FR-501 |
| M4.2 | Edit objective, description, notes per session (lazy materialisation) | FR-502 |
| M4.3 | Session status: done / partial / not done | FR-504 |
| M4.4 | Per-date override: cancel, add ad-hoc, replace | FR-506 |
| M4.5 | Previous/next teaching day in one interaction | FR-507 |
| M4.6 | Mobile-width layout, touch-usable | FR-508, NFR-16 |
| M4.7 | PWA: manifest, icons, iOS splash screens, installable from Safari | ADR-005 |
| M4.8 | Service worker: offline shell + current week cached read | FR-1507 (early) |

**Exit:** installable on an iPad home screen and usable for a full teaching day.

---

## M5 — Gradebook (web)

| # | Ticket | Requirements |
|---|---|---|
| M5.1 | Grading scales per class; assessment-level override | FR-802, FR-803, OQ-02 |
| M5.2 | Assessment CRUD | FR-801 |
| M5.3 | Class grid entry with keyboard traversal | FR-805, NFR-02, NFR-18 |
| M5.4 | Absent / exempt marking excluded from averages | FR-807 |
| M5.5 | Per-student and per-class averages by subject and term | FR-809 |
| M5.6 | Aggregation unit tests including all-exempt and empty-set edge cases | NFR-23 |

**Exit:** grades for a 28-student class enterable end-to-end by keyboard with no perceptible lag.

---

## M6 — Mobile (Expo)

| # | Ticket | Requirements |
|---|---|---|
| M6.1 | Expo app, Expo Router, shared Supabase client from `packages/shared` | FR-1501 |
| M6.2 | Today screen as landing | FR-1502 |
| M6.3 | Edit session objective and notes | FR-1503 |
| M6.4 | Student roster with search | FR-1506 |
| M6.5 | Single-student and whole-class grade entry | FR-1505 |
| M6.6 | Cold launch interactive within 3s | NFR-04 |
| M6.7 | Maestro E2E: today screen, grade entry | NFR-23 |
| M6.8 | Reject any native module whose config plugin adds a blocked entitlement | ADR-006 |
| M6.9 | Free Personal Team signing: `npx expo run:ios --device` documented, 7-day renewal noted in README | ADR-006 |

**Exit:** runs on a physical iPhone/iPad through Expo Go, and installs as a free-signed
standalone build against the same data as the web app.

---

## Deliberately not in Phase 1

Unit and lesson plans, curriculum standards and mapping, achievement tracking, report cards,
attendance, events, meetings, budget, workshops and rotations, collaboration, AI drafting,
offline write queue and conflict resolution. All of these are Phase 2 or 3 in the BRD. Do not
scaffold them early.
