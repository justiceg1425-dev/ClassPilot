# CLAUDE.md

Project context for Claude Code. Read this first, every session.

---

## What this is

**ClassPilot** — a classroom planning and management platform for primary/elementary school
teachers. Responsive web app plus an iOS companion app. One dataset: plan the year, run the
day, track students, produce parent-facing documents.

**This is a personal learning and portfolio project.** Non-commercial. No real student data
will ever be entered — the reference deployment uses synthetic data only. Do not add
analytics, tracking, payment processing, or telemetry.

Full requirements: `docs/BRD.md`. Every requirement has an ID (FR-xxx / NFR-xx / BR-xx).
**Reference the requirement ID in commit messages and test names.**

Roadmap across all phases, plus the live blocker register: `docs/implementation-plan.md`.

---

## Owner context

The owner is a Lead QA Engineer with 14+ years in regulated, high-reliability domains.
Consequences for how you work here:

- Testability is a first-class design concern, not an afterthought. If a design choice makes
  something hard to test automatically, say so before writing it.
- Do not skip error paths, edge cases, or validation to "get something working."
- When you are uncertain, say so plainly rather than producing confident-looking code.
- Prefer explicit over clever. This codebase will be read by others as a work sample.

---

## Stack (decided — see docs/architecture.md for rationale)

| Layer | Choice |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Web | Next.js (App Router), TypeScript, Tailwind |
| Mobile | Expo (React Native), TypeScript, Expo Router |
| Shared | `packages/shared` — types, Zod schemas, domain logic, generated DB types |
| Backend | Supabase — Postgres, Auth, Storage, Row Level Security |
| Server logic | Next.js route handlers; Supabase Edge Functions only where genuinely needed |
| PDF | `@react-pdf/renderer` (no headless Chrome — too heavy for free tiers) |
| Web hosting | Vercel Hobby |
| Tests | Vitest (unit), Playwright (web E2E), Maestro (mobile E2E) |
| CI | GitHub Actions |

### Repo layout

```
apps/
  web/            Next.js app
  mobile/         Expo app
packages/
  shared/         types, Zod schemas, domain logic (date/schedule math lives HERE)
  db/             migrations, seed scripts, generated types
docs/
db/
```

**Domain logic goes in `packages/shared`, never duplicated in a client.** The schedule
resolution logic in particular is used by both web and mobile and must have one
implementation with one test suite.

---

## Hard constraints

These come from the free-tier budget. Design within them; do not propose paid services.

- **Supabase free**: 500 MB Postgres, 1 GB file storage, 5 GB egress/month, 2 active
  projects, no backups. Projects **auto-pause after 7 days of inactivity** — a GitHub Actions
  cron keeps it warm (`.github/workflows/keepalive.yml`).
- **Vercel Hobby**: free, non-commercial use only. Fits this project; do not add commercial
  features.
- **No paid Apple Developer account.** Decided: free Apple ID signing. See "iOS delivery"
  below. This blocks certain iOS capabilities outright — check before adding any native module.
- Student photos must be resized and compressed client-side before upload. 1 GB is not much.
- No always-on servers, no queues, no Redis, no Docker in production.

---

## iOS delivery — read before touching the mobile app

**Decision taken (ADR-006).** Free Apple ID signing, no paid Apple Developer Program. The
owner rebuilds and reinstalls to their own devices every 7 days via Xcode. Requires macOS.

Three surfaces exist and they are not equivalent:

1. **Expo Go** — free, no signing. `pnpm --filter mobile start`, scan the QR. Requires the
   dev server running. This is the day-to-day development loop.
2. **Free-signed local build** — `npx expo run:ios --device` or `eas build --local`, signed
   with an Xcode Personal Team. A real standalone app on the owner's iPhone and iPad.
   Certificate expires after 7 days; rebuild to renew. **This is the native delivery path.**
3. **PWA** — the Next.js web app installed from Safari. Free, standalone, no expiry, and the
   only surface anyone other than the owner can install. **Retained as the shareable surface.**

### Personal Team limits — design within these

Per Apple: 10 App IDs and 3 registered devices, both expiring after 7 days; max 3 apps
installed per device; provisioning profiles expire 7 days from issuance.

**Blocked capabilities — a build using any of these fails at signing:**

- Push notifications (`aps-environment`)
- iCloud, App Groups, Sign in with Apple, associated domains, Apple Pay
- Most background modes

Consequences that are binding on design:

- **No native push in the Expo app.** Do not add `expo-notifications` or any library that
  injects the push entitlement — it will not sign. If reminders are ever wanted, they go in
  the PWA, which supports web push on iOS 16.4+ when installed to the home screen.
- **No App Groups**, so no share extension or widget sharing a data container.
- Before adding any native module, check whether its config plugin adds an entitlement.
  If it does, it is out of scope unless the project buys the $99 membership.

### The rule this imposes on mobile state

A free-signed build stops launching the moment the certificate lapses, usually without
warning. **The mobile app must therefore never hold authoritative data.** Supabase is the
source of truth. The offline queue (FR-1508) is a write-through cache that can be discarded
without loss. Any design that would make a reinstall lose teacher work is wrong.

### When to revisit

The $99 membership buys exactly one thing this project lacks: a shareable TestFlight link.
Under free signing, nobody but the owner can install the native app. Buy it when someone else
needs to open it on their own device, and not before. EAS Free covers 15 iOS builds a month
from that point.

## Domain model — the part that will bite you

Read `docs/data-model.md` before writing any schedule code. Summary of the traps:

- A timetable is **recurring weekly**, but real days deviate. Do not materialise a row for
  every session of every day of the year.
- Timetable slots carry `valid_from` / `valid_to`. A mid-year timetable change creates new
  slot rows with new validity windows; it never edits history. Regenerating a past date must
  produce what was actually taught.
- A day's schedule is **resolved**, not stored: recurring slots valid on that date, minus
  cancellations, plus ad-hoc sessions, overlaid with any materialised session rows.
- Sessions are materialised lazily — a row is written the first time a teacher edits that
  session (adds an objective, marks it complete).
- **Multi-grade classes** can have two slots at the same time on the same day if they target
  different grade groups. The overlap constraint must account for this.

If a change to schedule resolution is requested, write the test first. This logic is the
highest-risk area in the codebase.

---

## Conventions

- TypeScript strict mode. No `any`. No non-null assertions without a comment saying why.
- Zod schemas in `packages/shared` are the single source of truth for validation; both
  clients and route handlers use them.
- Database access from clients goes through Supabase with RLS enforced. **Never rely on
  client-side filtering for authorisation** (NFR-11). Every table gets RLS policies in the
  same migration that creates it.
- Migrations are forward-only and checked in. No editing an applied migration.
- Dates: store `date` and `time` as Postgres `date` / `time`, not timestamps, for anything
  schedule-related. Timestamps for audit fields only. Avoid timezone conversion on academic
  dates entirely.
- Money (class budget) in integer minor units. Never floats.
- Commit format: `<type>(<scope>): <summary> [FR-xxx]`

---

## Definition of done

A Must-priority requirement is not done until:

1. Implementation merged.
2. At least one automated test references it by ID (NFR-23).
3. RLS policy exists and has a negative test proving another user cannot read the data.
4. The traceability row in `docs/traceability.md` is updated.
5. Keyboard operability verified for any grid-based entry screen (NFR-18).

---

## Working agreements

- **Ask before**: adding a dependency, introducing a new service, changing the schema in a
  way that requires a data migration, or deviating from the phase plan.
- **Do not**: scaffold Phase 2 or 3 features while Phase 1 is incomplete. Scope inflation is
  logged as RSK-01 and it is the most likely way this project dies.
- **Do**: push back if a requirement as written is ambiguous or contradicts another. The open
  questions in BRD §15 are genuinely open — flag when you hit one rather than guessing
  silently.
- Prefer small, reviewable commits over large ones.

---

## Common commands

```bash
pnpm install                      # install workspace
pnpm dev                          # web + mobile dev servers
pnpm --filter web dev             # web only
pnpm --filter mobile start        # Expo dev server (scan QR with Expo Go)
pnpm db:migrate                   # apply migrations to local Supabase
pnpm db:seed                      # load synthetic dataset (NFR-25)
pnpm db:types                     # regenerate TS types from schema
pnpm test                         # unit tests
pnpm test:e2e                     # Playwright
pnpm lint && pnpm typecheck
```
