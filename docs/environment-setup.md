# Environment setup

Where the project runs, and what each machine can and cannot do.

## Machine split

| Task | Windows (corporate) | macOS (personal) |
|---|---|---|
| Web app, `packages/shared`, unit tests, lint, typecheck | yes | yes |
| Schema work against a **hosted** Supabase project (`db push`, `gen types`) | yes | yes |
| **Local** Supabase stack (`supabase start`) | no — Docker is blocked by corporate policy | yes (Docker Desktop or Colima) |
| Native iOS build, iOS Simulator, Maestro iOS E2E | no | yes (Xcode, ADR-006) |
| CI (lint / typecheck / test, and later the DB stack) | — | runs on GitHub's Ubuntu runners, which have Docker |

Backend and native-iOS work happens on the Mac. This is a consequence of
ADR-006 and the Docker restriction, not a preference.

## macOS prerequisites

```bash
# Node 22 (matches .nvmrc). Any version manager is fine:
brew install fnm            # or nvm / asdf
fnm install 22 && fnm use 22
corepack enable              # provides pnpm 9 (pinned via package.json)

# Container runtime for the local Supabase stack — pick one:
brew install colima docker  # Colima: free, no licensing questions
#   ... or install Docker Desktop (fine for a personal Mac)

# Supabase CLI
brew install supabase/tap/supabase

# Xcode command-line tools (for the Expo iOS build later, M6)
xcode-select --install
```

Then:

```bash
git clone https://github.com/justiceg1425-dev/ClassPilot.git
cd ClassPilot
pnpm install
pnpm test          # M0 engine — should be green
```

## Supabase project

Create **one** project now, named `classpilot`. Do **not** create a separate
prod project yet — the free tier allows 2 active projects and pauses idle ones
after 7 days, so an empty prod project only wastes a slot. Prod is added at M4.

At creation: choose a nearby region and **save the database password** (shown
once).

### Settings to change

Dashboard → Authentication:

- Email provider: enabled (default).
- **Confirm email: ON** — FR-102 requires verification before access.
- Site URL: `http://localhost:3000`.
- Redirect URLs: add `http://localhost:3000/**`. The deployed URL is added at M4.

The built-in email sender (rate-limited to a few messages an hour on the free
tier) is enough for development. Custom SMTP is a later decision (plan blocker
B7) and needs sign-off before adding.

### Values to capture

Copy `.env.example` to `.env.local` (git-ignored) and fill in:

| `.env.local` key | Dashboard location |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API → `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → `service_role` `secret` key |
| `SUPABASE_PROJECT_REF` | Settings → General → Reference ID (also the URL subdomain) |
| `SUPABASE_DB_URL` | Settings → Database → Connection string → **Session pooler** URI (paste your real password in place of `[YOUR-PASSWORD]`) |
| `SUPABASE_ACCESS_TOKEN` | <https://supabase.com/dashboard/account/tokens> → generate |

Never paste the `service_role` key, the DB URL, or the access token into chat or
a commit. `.env.local` is git-ignored; the assistant reads values from that file
and does not echo them.

### GitHub Actions secrets

Set these on the repo (`gh secret set NAME`, paste value when prompted):

| Secret | Used by | Value |
|---|---|---|
| `SUPABASE_URL` | `.github/workflows/keepalive.yml` | Project URL |
| `SUPABASE_ANON_KEY` | `.github/workflows/keepalive.yml` | `anon` key |
| `SUPABASE_DB_URL` | `backup.yml` (added in M1.12) | Session-pooler URI with password |

## Local vs remote schema work

- **With the local stack (Mac):** `supabase start`, then `supabase db reset`
  applies `db/*.sql` and the seed. This is the M1.2 default.
- **Without Docker (Windows, or a quick fix):** `supabase link --project-ref
  $SUPABASE_PROJECT_REF` once, then `supabase db push` applies migrations
  straight to the hosted project and `supabase gen types typescript --linked`
  regenerates types. No local stack, but you are editing the shared hosted DB —
  fine for a solo project, and the only option off the Mac.
