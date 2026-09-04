# Architecture & Technical Design

Companion to `BRD.md`. Version 0.2 — 4 September 2026.

---

## 1. Target platforms

| Platform | Delivery | Cost | Status |
|---|---|---|---|
| Windows laptop browser | Next.js on Vercel | Free | Unconstrained |
| macOS browser | Next.js on Vercel | Free | Unconstrained |
| iPhone / iPad — installable, shareable | PWA via Safari "Add to Home Screen" | Free | **Shareable surface** |
| iPhone / iPad — native, standalone | Expo build signed by a free Apple ID Personal Team | Free | **Native delivery path** (owner's devices only, 7-day renewal) |
| iPhone / iPad — development loop | Expo Go | Free | Dev only; requires dev server |
| Anyone else's device | TestFlight / App Store | $99/yr | **Not purchased.** Revisit trigger below. |

### Decision: free Apple ID signing

The Apple Developer Program is $99/year and is the only way to distribute an iOS app to a
device that is not your own. The project does not buy it. The owner signs local builds with
an Xcode **Personal Team** — the free tier Apple grants any Apple ID — and reinstalls to their
own iPhone and iPad every 7 days when the provisioning profile lapses.

**Prerequisite:** macOS with Xcode and CocoaPods. Free-team signing only works through
Xcode's automatic signing. EAS *cloud* builds cannot produce an installable iOS device build
without a paid account, because registering device UDIDs requires one. Builds are therefore
local: `npx expo run:ios --device` or `eas build --local`. There is no Windows path to a
native iOS build.

**Personal Team limits, per Apple's membership comparison:** 10 App IDs and 3 registered
devices, both expiring after 7 days; a maximum of 3 apps installed per device; provisioning
profiles expiring 7 days from issuance, after which the app must be rebuilt and reinstalled.
An iPhone plus an iPad consumes two of the three device slots.

**Capabilities a Personal Team cannot sign** — the build fails at signing time, not runtime:
push notifications, iCloud, App Groups, Sign in with Apple, associated domains, Apple Pay,
and most background modes.

The binding consequence is **no native push notifications**. Note the inversion this creates:
an installed PWA on iOS 16.4+ supports web push, so on that axis the free web app is more
capable than the free-signed native app. Any future reminder or notification feature belongs
in the PWA.

**Revisit trigger:** buy the $99 membership when a person other than the owner needs to
install the native app on their own device — the only thing it buys that free signing does
not is a shareable TestFlight link. From that point EAS Free's 15 iOS builds per month is
ample. Until then the PWA is the surface anyone else opens.

## 2. Free-tier budget

| Service | Plan | Allowance | The limit that will actually bite |
|---|---|---|---|
| Supabase | Free | 500 MB Postgres, 1 GB storage, 5 GB egress, 50k MAU, 2 active projects | **7-day inactivity auto-pause.** Not the storage. |
| Vercel | Hobby | Static + serverless functions | Non-commercial use only — fine here |
| GitHub | Free | Repo + Actions minutes | Actions minutes on a public repo are unlimited |
| Expo | Free | SDK/CLI free forever; EAS gives 15 iOS + 15 Android builds/month | Builds are local, not cloud (ADR-006) — the EAS allowance is unused for now |
| Sentry / logging | Free tier | Optional | Skip in Phase 1 |

### Mitigations

- **Auto-pause**: a GitHub Actions scheduled workflow pings the database every few days
  (`.github/workflows/keepalive.yml`). Without it, the project goes offline after a quiet week
  and needs a manual unpause from the dashboard — which is exactly what happens the day
  someone opens your portfolio link.
- **No backups on free tier.** A weekly GitHub Action runs `pg_dump` and commits the output
  to a private repo or uploads it as an artifact. Do not skip this; NFR-07 depends on it.
- **1 GB file storage**: resize student photos to max 400px on the longest edge, WebP,
  client-side, before upload. 40 students × ~30 KB is trivial; 40 raw iPhone photos is 200 MB.
- **500 MB Postgres**: not a real constraint for this workload, given sessions are
  materialised lazily rather than one row per day per slot.
- **PostgREST grants change**: projects created after 30 May 2026 need explicit Postgres
  grants for Data API access, and existing free projects are affected from 30 October 2026.
  Include grants in migrations from the start rather than discovering this later.

---

## 3. Architecture

```
┌─────────────────┐     ┌──────────────────┐
│  Next.js (web)  │     │   Expo (mobile)  │
│  + PWA manifest │     │                  │
│  + service      │     │                  │
│    worker       │     │                  │
└────────┬────────┘     └────────┬─────────┘
         │                       │
         └───────────┬───────────┘
                     │
          ┌──────────▼──────────┐
          │ packages/shared     │
          │  types · Zod        │
          │  schedule resolver  │
          │  supabase client    │
          └──────────┬──────────┘
                     │
          ┌──────────▼──────────┐
          │      Supabase       │
          │  Postgres + RLS     │
          │  Auth · Storage     │
          └─────────────────────┘
                     ▲
          ┌──────────┴──────────┐
          │ Next.js route       │
          │ handlers            │
          │  · PDF generation   │
          │  · batch report     │
          │    cards            │
          └─────────────────────┘
```

Clients talk to Supabase directly for CRUD, with Row Level Security doing authorisation.
Server-side route handlers exist only for work that must not run on a client: PDF rendering,
batch operations, and any future AI calls (so the API key never ships to a device).

---

## 4. Architecture decision records

### ADR-001 — Supabase over Firebase or a self-built API

Postgres is the right database for this domain: the model is relational, with real
constraints, date ranges, and joins across six or seven tables for a single screen. Firebase's
document model would force denormalisation of exactly the data that needs integrity. Supabase
also gives Auth, Storage and RLS in the same free tier, removing three services from the
build. The cost is coupling to one vendor's client library — acceptable, and Postgres itself
is portable.

### ADR-002 — Separate Next.js web app rather than React Native Web everywhere

A single Expo codebase targeting web would reduce duplication, but the two hardest UI surfaces
here — the timetable grid and the gradebook grid — need real CSS grid, keyboard navigation
and print stylesheets. React Native Web fights all three. Printable output (RPT-01 through
RPT-11) is a first-class requirement and belongs in a DOM. Shared logic lives in
`packages/shared`; only presentation is duplicated.

### ADR-003 — Lazy session materialisation

See `data-model.md`. Storing one row per session per day for a year (≈ 190 days × 6 slots ×
6 classes) is ~7,000 rows per teacher — not a size problem, but it makes timetable edits
require bulk rewrites and makes "what was actually taught on 12 March" ambiguous. Resolving
from validity-windowed recurring slots keeps history correct by construction.

### ADR-004 — `@react-pdf/renderer` over Puppeteer

Headless Chrome needs ~500 MB of memory and long cold starts; Vercel's free serverless
functions will not tolerate it for a 30-card batch. `@react-pdf/renderer` is pure JS, runs in
a normal Node function, and gives deterministic output that can be snapshot-tested. The
trade-off is a restricted layout engine — report card templates must be designed within it.

### ADR-005 — PWA as the primary iOS delivery path

Documented above. Recorded as a decision because it constrains the web app: offline shell,
service worker caching, manifest, iOS splash screens and a genuinely touch-usable layout are
Phase 1 work, not polish.

---

### ADR-006 — Free Apple ID signing; no Apple Developer Program

**Context.** The project must fit in free tiers. A standalone native iOS app normally requires
the $99/year Apple Developer Program.

**Decision.** Sign local builds with an Xcode Personal Team and accept a 7-day reinstall
cycle on the owner's own devices. Do not purchase the membership.

**Consequences.**
- Requires macOS; there is no Windows path to a native iOS build.
- No push notifications, iCloud, App Groups, Sign in with Apple, associated domains or Apple
  Pay in the Expo app. Reject any native module whose config plugin adds one of these
  entitlements.
- No one but the owner can install the native app. The PWA carries every audience other than
  the owner, which raises rather than lowers the priority of ADR-005.
- Builds are local (`expo run:ios --device` / `eas build --local`), not EAS cloud.
- The app stops launching when the certificate lapses, usually unnoticed. Therefore the
  mobile client must hold no authoritative state — see §5a.

**Revisit when** someone other than the owner needs the app on their own device.

## 5. Mobile state ownership

A free-signed build expires every 7 days and simply refuses to launch until reinstalled.
Reinstallation may clear the app container. Therefore:

- **Supabase is the sole source of truth.** The mobile app is a client, never a store.
- The offline cache (FR-1507) is read-through and disposable.
- The offline write queue (FR-1508) is a durable-but-temporary outbox: writes are queued,
  synced at the earliest opportunity, and never treated as committed until the server
  acknowledges them. The UI must distinguish "saved locally" from "saved".
- No feature may be designed such that losing the app container loses teacher work.

This is a constraint imposed by the signing decision (ADR-006), not a general preference, and
it should be re-evaluated if the project ever moves to a paid membership.

## 6. Security model

Authorisation lives in the database. Every table carries `RLS enabled` and policies written in
the same migration that creates the table. The pattern:

- Ownership resolves up the chain to `auth.uid()`: a `grade` belongs to an `assessment`
  belongs to a `class` belongs to a `school` owned by a user.
- A `class_collaborators` join table (Phase 3) extends read/write to co-teachers; policies are
  written from Phase 1 to consult it, so adding collaboration later is not a policy rewrite.
- Every RLS policy gets a **negative test**: a second seeded user attempts the read and is
  denied. This is the single most important test class in the project (NFR-11).
- The Supabase `service_role` key never leaves server-side code and is never in a client
  bundle or an Expo build.

---

## 7. Testing strategy

| Level | Tool | Covers |
|---|---|---|
| Unit | Vitest | Schedule resolution, date/term maths, grade aggregation, budget totals |
| Contract | Vitest + Zod | Every API boundary validates against a shared schema |
| Database | pgTAP or SQL test harness | RLS policies, constraints, triggers — positive and negative |
| Component | Vitest + Testing Library | Grid keyboard navigation, form validation |
| E2E (web) | Playwright | Phase acceptance journeys; accessibility checks via axe |
| E2E (mobile) | Maestro | Today screen, attendance capture, offline queue |
| Visual | Playwright snapshots | PDF outputs and print layouts |

Priority order for a solo build: **schedule resolution unit tests → RLS negative tests → one
E2E journey per phase.** Everything else is secondary.

`pnpm db:seed` must produce a complete synthetic year — schools, a multi-grade class, 28
students, a full timetable, a term of sessions and grades — in one command (NFR-25). Every
test level depends on it, so build it in the first milestone, not later.

---

## 8. Delivery sequence

The BRD phases describe *what*. This is the *order*, and it deliberately front-loads risk:

1. **M0 — Spike.** Prototype schedule resolution in isolation, in `packages/shared`, with
   tests and no UI. Prove the validity-window model handles a mid-year timetable change and a
   multi-grade parallel slot. This addresses RSK-02 and answers OQ-04 and OQ-05.
2. **M1 — Foundations.** Monorepo, Supabase project, auth, schema for setup entities, RLS,
   seed script, CI.
3. **M2 — Setup UI.** Schools, years, terms, classes, students, CSV import.
4. **Design pass** — see below.
5. **M3 — Timetable.** The grid, on web.
6. **M4 — Daily schedule.** Web, then the PWA shell.
7. **M5 — Gradebook.**
8. **M6 — Mobile.** Expo app against the same API: today screen, roster, grade entry.

Then Phase 2 of the BRD.

---

## 9. Where design fits

**Not first, and not last.** The recommendation is a single design pass between M2 and M3.

Doing it first is premature: until the schedule resolution model exists, you do not know what
the timetable screen has to represent — whether a multi-grade slot is one cell split in two or
two parallel columns is a data question before it is a visual one (OQ-04). Designing that
screen before M0 means designing it twice.

Doing it last is worse: the timetable grid, the daily schedule, the gradebook grid and the
mobile today screen are the product. If they are assembled ad hoc from component-library
defaults, the whole thing reads as a CRUD exercise regardless of the engineering underneath.

The pass should produce: a small design-token set (type scale, spacing, colour including
subject colours that survive greyscale printing per NFR-20), and layouts for exactly five
screens — timetable grid, daily schedule (desktop and mobile), gradebook grid, curriculum
coverage matrix, mobile today screen. That is enough of a system for Claude Code to build
every other screen consistently without designing each one.
