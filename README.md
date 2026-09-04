# ClassPilot

Classroom planning and management for primary school teachers. Responsive web app (Windows /
macOS browsers, installable as a PWA on iPad and iPhone) plus a native iOS companion built
with Expo.

Personal learning and portfolio project. Non-commercial. Synthetic data only — no real
student information is ever entered.

## Documents

| File | What it is |
|---|---|
| `CLAUDE.md` | Context for Claude Code. Read first. |
| `docs/BRD.md` | Business requirements. Numbered FR / NFR / BR IDs. |
| `docs/architecture.md` | Stack, ADRs, free-tier budget, iOS delivery reality |
| `docs/implementation-plan.md` | Roadmap across all three phases, blocker register, design-pass point |
| `docs/environment-setup.md` | Machine split (Windows vs Mac), Supabase project setup, secrets |
| `docs/data-model.md` | The temporal schedule model and why it is shaped that way |
| `docs/phase-1-backlog.md` | Ordered milestones M0–M6 with requirement mappings |
| `docs/traceability.md` | Requirement → test → status |
| `supabase/migrations/` | Forward-only SQL migrations (Phase 1 schema + RLS policies) |

## Getting started

```bash
pnpm install
pnpm test                      # packages/shared — the schedule engine

# database (see docs/environment-setup.md):
#   Mac:      supabase start && supabase db reset
#   Windows:  pnpm db:query -- -f supabase/migrations/<file>.sql   # Management API
pnpm db:types                  # regenerate packages/shared/src/db/database.types.ts
```

## Stack

Next.js · Expo · TypeScript · Supabase (Postgres, Auth, Storage, RLS) · Tailwind ·
Vitest · Playwright · Maestro · Vercel

Everything runs inside free tiers. Two consequences worth knowing:
Supabase free projects pause after 7 days of inactivity (handled by
`.github/workflows/keepalive.yml`), and the native iOS app is signed with a free Apple ID
Personal Team — it installs only on the owner's own devices, needs macOS + Xcode to build,
must be reinstalled every 7 days, and cannot use push notifications or any other entitlement
a Personal Team can't sign. The PWA is the surface anyone else installs.
See `docs/architecture.md` §1 and ADR-006.

## iOS build

```bash
npx expo run:ios --device      # free-signed local build; renew every 7 days
pnpm --filter mobile start     # Expo Go dev loop
```
