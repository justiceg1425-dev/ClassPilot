# Environment setup

Where the project runs, and what each machine can and cannot do.

## Machine split

| Task | Windows (corporate) | macOS (personal) |
|---|---|---|
| Web app, `packages/shared`, unit tests, lint, typecheck | yes | yes |
| Apply migrations / `pnpm db:types` via the Management API (HTTPS) | yes (with the CA bundle below) | yes |
| **Local** Supabase stack (`supabase start` / `db reset`) | no — Docker is blocked by corporate policy | yes (Docker Desktop or Colima) |
| `supabase db push` / `migration list` (direct Postgres connection) | **no — the corporate firewall blocks the PostgreSQL wire protocol** | yes |
| Native iOS build, iOS Simulator, Maestro iOS E2E | no | yes (Xcode, ADR-006) |
| CI (lint / typecheck / test, and later the DB stack) | — | runs on GitHub's Ubuntu runners, which have Docker |

The corporate Windows machine can do schema work only through the Supabase
**Management API** (HTTPS 443): `pnpm db:query` and `pnpm db:types` both go that
route. Anything needing a raw Postgres connection (`db push`, `db reset`,
`migration list`, pgTAP) needs the Mac. Native-iOS work needs the Mac (ADR-006).

## Corporate TLS-inspection proxy (Windows only)

The corporate network re-signs HTTPS with an internal root CA. curl and browsers
trust it (Windows cert store); Node does not, so `@supabase/supabase-js` and the
Supabase CLI fail with `SELF_SIGNED_CERT_IN_CHAIN`. Fix, once per machine:

```powershell
pwsh -File scripts/export-corp-ca.ps1   # writes .certs/corp-ca.pem (git-ignored)
```

`scripts/db.mjs` (which backs every `pnpm db:*` script) picks the bundle up
automatically when it exists. For ad-hoc Node scripts, set
`NODE_EXTRA_CA_CERTS=$PWD/.certs/corp-ca.pem`. The Mac and CI need none of this.

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

## Schema workflow

Migrations live in `supabase/migrations/<timestamp>_name.sql`, forward-only.
`pnpm db:*` scripts wrap the Supabase CLI (`scripts/db.mjs` — loads `.env.local`,
applies the CA bundle when present).

| Command | What it does | Windows? |
|---|---|---|
| `pnpm db:query -- -f supabase/migrations/<file>.sql` | run SQL against the linked project via the **Management API** | yes |
| `pnpm db:types` | regenerate `packages/shared/src/db/database.types.ts` (Management API) | yes |
| `pnpm db:push` | apply pending migrations over a **direct Postgres connection** | no (firewall) — Mac only |
| `pnpm db:reset` | reset the **local** stack to the migrations + seed | no (Docker) — Mac only |

**Applying a new migration from Windows:** write the file under
`supabase/migrations/`, run `pnpm db:query -- -f <that file>`, then record it so a
later `db push` from the Mac skips it:

```sh
pnpm db:query -- "insert into supabase_migrations.schema_migrations (version, name) values ('<timestamp>', '<name>') on conflict do nothing;"
pnpm db:types
```

**From the Mac** it is just `supabase db push` (or `supabase db reset` for the
local stack), then `pnpm db:types`.

The Phase-1 schema (`20260904090000_phase1_schema.sql`) has already been applied
to the hosted project and recorded in migration history.
