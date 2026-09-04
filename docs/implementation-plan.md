# Implementation Plan

Consolidated roadmap for ClassPilot across all three BRD phases, plus the blocker
register and the design-pass provisioning point. Companion to `BRD.md`
(the *what*), `architecture.md` (the *why*) and `phase-1-backlog.md` (Phase 1
ticket detail). This document is the *order* and the *open issues*.

Version 0.1 — 4 September 2026.

---

## 1. How to use this

- Work proceeds in **chunks** (one reviewable PR each) that ladder up to the
  **milestones** below. A milestone is done only when its exit criteria are met
  *and* every Must requirement in it satisfies the Definition of Done in
  `../CLAUDE.md`.
- Do not start a milestone before the previous one's exit criteria are met
  (RSK-01 — scope inflation is the most likely way this project dies).
- Every commit and test name carries the requirement ID it serves
  (`<type>(<scope>): <summary> [FR-xxx]`).
- When a requirement as written is ambiguous or contradicts another, stop and
  flag it. Section 6 records the ones already resolved.

---

## 2. Status snapshot

| Chunk | Contents | State |
|---|---|---|
| **1A** | Repo skeleton: pnpm workspace + Turborepo, TS strict base config, ESLint 9 flat + Prettier, `packages/shared` scaffold, M0.1 domain types + toolchain-proving test, `ci.yml`, this plan, B2 schema fix | **in progress** |
| 1B | M0.2–M0.6 — `getTeachingDays`, `resolveDay`, the eight resolution cases, the property test, the multi-grade display ADR | next |
| 2 | M1 — Foundations (Supabase, auth, schema+RLS, seed, negative-test harness, keepalive, backup) | not started |

---

## 3. Blocker & issue register

Severity: **S1** stops work · **S2** blocks a milestone if unaddressed · **S3** fix in place.

| # | Sev | Issue | Status / plan |
|---|---|---|---|
| **B1** | S3 | Native iOS build needs macOS; primary dev machine is Windows 11. | **Resolved** — owner has a Mac. Split workflow: web + Expo Go + Android on Windows; `expo run:ios --device`, `eas build --local`, Xcode signing, 7-day renewal and the iOS simulator (Maestro) on the Mac. Recorded in M6 notes. |
| **B2** | S3 | `db/001_phase1_schema.sql` fails to apply: `app_owns_class()` (`language sql`) referenced `classes`/`schools` before they exist; `check_function_bodies` is on by default. | **Fixed in chunk 1A** — function definition moved to immediately after the `classes` table, before the first policy that calls it. |
| **B3** | S2 | No `profiles` row is created on sign-up. Every RLS chain ends at `schools.owner_id → profiles(id)`, so a new user cannot create anything. | **Planned for M1.5** — add the standard `handle_new_user()` trigger on `auth.users` (or create the row in the post-sign-up route handler). Negative-test harness (M1.9) must cover "new user can create their first school". |
| **B4** | S3 | Phase 1 as backlogged is larger than Phase 1 as `BRD.md` §9 defines it — FR-305, FR-407, FR-504, FR-809 are marked Phase 2 in §9 but appear in the Phase 1 backlog, schema and M0 spike. | **Decision taken** (see §6): all four are Phase 1. `BRD.md` §9 phase columns and `traceability.md` to be reconciled in M1. |
| **B5** | S2 | OQ-01 (curriculum framework licensing) is unresolved and blocks Phase 2's first milestone. | **Direction set** (see §6): author a small, explicitly synthetic framework; make custom authoring first-class; never claim alignment to a real jurisdiction. Finalise before P2-M7. |
| **B6** | S3 | `traceability.md` has no rows for several Phase 1 requirements that have tickets (FR-105, FR-208, FR-302, FR-405, FR-406; NFR-16/17/19/20). DoD step 4 ("update the traceability row") then passes vacuously. | **Planned for M1** — complete the Phase 1 traceability skeleton (every Phase 1 Must + Should FR, every NFR) before feature milestones begin. |
| **B7** | S3 | Smaller M1 items: no `updated_at` triggers (`profiles`, `sessions`, `grades`); FR-106 needs a `service_role` route handler and NFR-13 needs a defined retention window (proposal: immediate hard delete, documented); Supabase free-tier auth email is rate-limited (fine for synthetic use; custom SMTP = new service = ask first); pick one home for generated DB types (`packages/shared`); `students.date_of_birth` nullable in DB vs required by FR-301 (proposal: required in Zod, nullable in DB for partial CSV rows). | Addressed across M1 / M2. |

No S1 blockers. Chunk 1 has no external dependencies; M1 needs a free Supabase project created, M2 a free Vercel account.

---

## 4. Roadmap

### Phase 0 — Schedule-resolution spike

Pure TypeScript in `packages/shared`. No database, no framework. Front-loads
RSK-02.

| Ticket | Feature | Requirements |
|---|---|---|
| M0.1 | Domain types: `TimetableSlot`, `Session`, `ResolvedSession`, `TermCalendar` | — |
| M0.2 | `getTeachingDays(calendar)` | FR-204 |
| M0.3 | `resolveDay(classId, date, slots, sessions)` per `data-model.md` | FR-501, FR-506 |
| M0.4 | Unit tests for all eight resolution cases in `data-model.md` | NFR-23 |
| M0.5 | Property test: resolution is deterministic and slot-order stable for any date | NFR-23 |
| M0.6 | Multi-grade display decision written up as an ADR | OQ-04 |

**Exit:** `pnpm test` green; a mid-year timetable change and multi-grade parallel
slots both provably handled; zero UI; CI green on `main`.

### Phase 1 — Core planning, web + mobile

`phase-1-backlog.md` holds the ticket detail. Spine and confirmed deltas:

| Milestone | Feature area | Requirements | Delta from backlog |
|---|---|---|---|
| **M1 Foundations** | Monorepo wiring, Supabase project, auth (register / verify / login / reset / delete), schema + RLS applied, seed (2 users, 2 schools, 1 single-grade + 1 multi-grade class, 28 students, full timetable, one term of sessions + grades), RLS negative-test harness, CI, keepalive cron, weekly `pg_dump` backup | FR-101–104, 106; NFR-07, NFR-11, NFR-25 | + B3 profile trigger, + B6 traceability skeleton, + B7 items, + B4 BRD/traceability reconciliation |
| **M2 Setup UI (web)** | App shell + nav + active-context switcher; School CRUD; academic year + non-overlapping terms; non-teaching periods + derived teaching weeks; class CRUD (teaching days, day bounds); grade groups; student CRUD + grade-group assignment; CSV roster import (preview + per-row validation); mark student inactive; subjects (colour + short label + greyscale-distinctness check) | FR-201–208, 301, 302, 304, **305**, 405; NFR-20 | CSV parser is a dependency decision — ask first |
| **▶ Design pass** | See §5 | — | between M2 and M3 |
| **M3 Timetable (web)** | Weekly grid (teaching days × time bands); create slot (day / start / duration / subject); DB overlap constraint surfaced as a usable error; drag-move / resize / duplicate; grade-group-scoped slots as parallel columns; mid-year "change from date X" → new validity window; full keyboard operability | FR-401–404, 406, **407**; NFR-18 | FR-407 confirmed Phase 1 |
| **M4 Daily schedule + PWA** | Day view via `resolveDay`; edit objective / description / notes (lazy materialisation); session status done / partial / not done; per-date override (cancel / add ad-hoc / replace); previous/next teaching day in one interaction; mobile-width touch layout; PWA manifest + icons + iOS splash + installable from Safari; service worker offline **read** shell (current week cached) | FR-501, 502, **504**, 506, 507, 508; ADR-005; FR-1507 (read only) | offline **write** stays in Phase 2 (RSK-05) |
| **M5 Gradebook (web)** | Grading scales per class + per-assessment override; assessment CRUD; class grid entry with keyboard traversal; absent / exempt excluded from averages; per-student and per-class averages by subject and term; aggregation edge-case tests (all-exempt, empty set) | FR-801–803, 805, 807, **809**; NFR-02, NFR-18 | FR-809 confirmed Phase 1 |
| **M6 Mobile (Expo)** | Expo app + Expo Router + shared Supabase client from `packages/shared`; Today screen as landing; edit session objective + notes; roster + search; single-student and whole-class grade entry; cold launch interactive < 3s; Maestro E2E (today screen, grade entry); reject any native module whose config plugin adds a blocked entitlement; free Personal Team signing documented with the 7-day renewal | FR-1501–1503, 1505, 1506, 806; NFR-04; ADR-006 | native standalone build + iOS Maestro run on the Mac (B1) |

**Phase 1 exit:** a teacher can set up a class, build a timetable, plan and run a
week, and record grades — on web, and on mobile via Expo Go, an installed PWA,
and (on the owner's devices) a free-signed native build.

### Phase 2 — Curriculum & reporting

Milestone-level only; tickets are written on entry to the phase (no early
scaffolding).

| Milestone | Feature area | Requirements |
|---|---|---|
| **P2-M7 Standards library** | Ship the synthetic default framework (subject → strand → standard, per grade level); per-user edit / reword / deactivate **without forking** the dataset; build a fully custom framework | FR-701–703; closes OQ-01 |
| **P2-M8 Curriculum map & coverage** | Allocate standards to terms and (optionally) weeks; coverage status not planned / planned / taught / assessed; matrix view standards × terms; export to PDF + spreadsheet | FR-704, 705, 707, 708; RPT-04 |
| **P2-M9 Unit & lesson plans** | Unit CRUD (title, subject, grades, duration); ordered lesson sequence; lesson detail (objective, duration, activities, materials, differentiation, assessment approach); link standards to unit and lessons; reorder; duplicate (incl. cross-class / year); unit PDF | FR-601–604, 607, 608, 610; RPT-03 |
| **P2-M10 Plan → schedule integration** *(highest P2 risk — touches the M0 resolver, tests first)* | Schedule a unit; propose dates from that subject's timetable slots; populate daily sessions with each lesson's objective + description; session auto-shows objective + linked standards; reorder updates scheduled dates | FR-605, 606, 510, 607; realises OBJ-01 |
| **P2-M11 Gradebook depth** | Pass/fail + comment-only assessments; link assessment ↔ standards; per-student progress over time; record standard achievement per student independent of an assessment; gradebook spreadsheet export | FR-804, 808, 810, 811, 813; RPT-05 |
| **P2-M12 Report cards** | Template (which subjects / standards / summary fields appear); populate from gradebook + achievement for a term; per-subject and overall comments; whole-class batch; PDF individual + merged batch; preview before batch | FR-901–906; NFR-03 (30 cards < 60s); ADR-004; RSK-07 (one fixed template first); RPT-07 |
| **P2-M13 Data export + Phase 2 print outputs** | Full account data export (JSON / archive); weekly timetable PDF; substitute-teacher day plan PDF; student progress summary PDF; feature-flag plan tiers | FR-107, 409, 509, 109; RPT-01, 02, 06, 12 |
| **P2-M14 Offline sync (mobile)** *(deliberately narrow — RSK-05)* | Cache the current week for offline read (full); queue offline edits as a write-through outbox ("saved locally" vs "saved" states); surface sync conflicts and require an explicit resolution choice; remaining student attributes; named student groups | FR-1507, 1508, 1509, 303, 309, 310; closes OQ-03 |

**Phase 2 exit:** a unit planned against standards, coverage visible at any point
in the year, and a class set of report cards produced in under 5 minutes of
teacher effort.

### Phase 3 — Class administration

| Milestone | Feature area | Requirements |
|---|---|---|
| **P3-M15 Attendance** | Per-student per-day (daily or per-half-day granularity); statuses present / absent / late / excused; reason note; mobile capture < 30s for 30 students; rates per student / class / term / year; below-threshold flagging; register export; attendance figures on the report card | FR-1001–1007, 1504, 908; RPT-08 |
| **P3-M16 Events & calendar** | Events (title, date or range, time, location, notes); events appear on the daily schedule for their date | FR-1101, 1102 |
| **P3-M17 Parent-teacher meetings** | Record meeting (student, guardian, datetime, outcome notes); double-booking warning; printable parents'-evening schedule | FR-1103–1105 |
| **P3-M18 Class budget** | Income / expense entries (date, description, amount, category — integer minor units); running balance + category breakdown; spreadsheet export | FR-1106–1108; RPT-10 |
| **P3-M19 Photo directory & demographics** | Photo per student (client-side resize / WebP before upload; access-controlled storage, never a public URL); printable class grid; age distribution chart from dates of birth | FR-306–308; NFR-15; RPT-09 |
| **P3-M20 Workshops & rotations** | Workshop block on a slot with ≥ 2 stations; station detail + supervision type; assign student groups to stations; **rotation generator** (a second deterministic engine → `packages/shared`, fully unit-tested); manual override of any assignment; show current rotation on the daily schedule; rotation chart print | FR-1201–1207; RPT-11 |
| **P3-M21 Collaboration** | Invite a co-teacher by email; roles co-teacher (read/write) and viewer (read-only); role-scoped access to timetable / plans / students / grades; created-by / last-modified-by per planning entry; owner revoke; **concurrent-edit detection** preventing silent overwrites; audit log of shared-class access | FR-1301–1306; NFR-14; OQ-07; extends `app_owns_class` to consult `class_collaborators` |
| **P3-M22 AI assistance + auth & timetable extras** | Draft activity description / differentiation / report-card comment; editable draft with explicit accept; never transmit student names or identifying detail; label AI-origin content; per-account usage cap. Server-side only — key never on a device; local Ollama fallback. Plus: TOTP 2FA, biometric unlock, Week A / B timetables, copy timetable across class/year, archive class, roll-forward class config | FR-1401–1407, 108, 1510, 408, 410, 209, 210 |

**Phase 3 exit:** attendance, events, meetings, budget, workshops, collaboration
and optional AI drafting all available.

---

## 5. Design pass — the provisioning point

**Primary pass: between M2 and M3.** Rationale (architecture.md §9): the
timetable grid cannot be designed until M0 has decided whether a multi-grade slot
is a split cell or two parallel columns (it is parallel columns — M0.6). Earlier
means designing it twice; later means the product's core screens get assembled
from component-library defaults.

**Mechanism:** Claude Design's canvas (the `design` skill). Claude drafts artboards
as `.dc.html`; the owner refines them visually and publishes.

**The primary pass produces exactly:**

- A small **design-token set** — type scale, spacing scale, colour, and a
  subject-colour palette that stays distinct in **greyscale** (NFR-20) and never
  carries meaning by colour alone (NFR-19).
- Layouts for **five screens / six surfaces**: timetable grid · daily schedule
  (desktop) · daily schedule (mobile) · gradebook grid · curriculum coverage
  matrix · mobile today screen.

Nothing else — that is enough of a system for every other screen to be built
consistently without designing each one.

**Recommended addition:** a half-day **tokens-only mini-pass before M2.1**
(colour + type + spacing + one card/table pattern, no screens) so the app shell
and context switcher are not built raw and re-skinned.

**Second, smaller touch:** opens Phase 2 — the report-card template and print
layouts (RSK-07: fix one template before making it configurable).

---

## 6. Scope decisions log

| Ref | Decision |
|---|---|
| OQ-02 | Grading scales live **per class, with a per-assessment override**. Not per subject. (`data-model.md`) |
| OQ-04 | Multi-grade daily schedule: **parallel columns** when two grade groups have different slots in one time band; a single merged row when the slot is whole-class. The UI decides per band. (`data-model.md`; ADR at M0.6) |
| OQ-05 | Mid-year timetable change: **past schedules stay frozen**, via validity windows on `timetable_slots`. (`data-model.md`) |
| B4 | FR-305, FR-407, FR-504, FR-809 are **Phase 1** (cheap, schema already supports them, FR-407 is load-bearing for M0). Reconcile `BRD.md` §9 + `traceability.md` in M1. |
| B5 | OQ-01: ship a **small synthetic** curriculum framework; custom authoring is first-class; no claim of real-jurisdiction alignment. Finalise before P2-M7. |
| — | User-based login with per-teacher isolation is **not a separate feature** — it is Supabase Auth (FR-101–104) + RLS on every table + the M1.9 negative-test harness, carried by every milestone's DoD. Only sanctioned cross-user access is P3-M21 co-teacher collaboration. |
| Still open | OQ-03 (offline strategy → P2-M14), OQ-06 (report-comment versioning → P2 design), OQ-07 (co-teaching conflict resolution → P3-M21). |

---

## 7. Environment & toolchain

| Item | Value |
|---|---|
| Package manager | pnpm 9.15.4 via Corepack (`packageManager` field pins it) |
| Node | CI and `.nvmrc` pinned to 22 LTS; local dev on 24 is fine for pure-TS work |
| Monorepo | pnpm workspaces (`apps/*`, `packages/*`) + Turborepo |
| TS | strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`; no `any`, no unexplained non-null assertions |
| Lint / format | ESLint 9 flat config with typed linting + Prettier; `format:check`, `lint`, `typecheck`, `test` all gate CI |
| Dev machine | Windows 11 Enterprise — watch for corporate proxy / CA friction on installs |
| iOS native | built on the owner's Mac (Xcode Personal Team, 7-day renewal) — see ADR-006 |

---

## 8. Definition of done (from `../CLAUDE.md`)

A Must-priority requirement is not done until: implementation merged; ≥ 1
automated test references it by ID (NFR-23); an RLS policy exists with a negative
test proving another user cannot read the data; the `traceability.md` row is
updated; keyboard operability is verified for any grid-based entry screen
(NFR-18).
