#!/usr/bin/env node
/**
 * Thin, cross-platform wrapper around the Supabase CLI for this project.
 *
 *  - loads `.env.local` (SUPABASE_PROJECT_REF, SUPABASE_ACCESS_TOKEN, SUPABASE_DB_URL …)
 *  - if `.certs/corp-ca.pem` exists (a corporate TLS-inspection proxy), points
 *    Node's TLS at it so Management-API calls over HTTPS succeed
 *  - dispatches a few common tasks
 *
 * Usage:
 *   node scripts/db.mjs types            # regenerate packages/shared/src/db/database.types.ts
 *   node scripts/db.mjs query -f x.sql   # run SQL against the linked project (Management API)
 *   node scripts/db.mjs query "select 1"
 *   node scripts/db.mjs push             # push migrations (needs a direct DB connection)
 *   node scripts/db.mjs reset            # reset the LOCAL stack (needs Docker)
 *   node scripts/db.mjs link
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = { ...process.env };

const envFile = path.join(root, '.env.local');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (match && !(match[1] in env)) env[match[1]] = match[2];
  }
}

const caBundle = path.join(root, '.certs', 'corp-ca.pem');
if (existsSync(caBundle)) env.NODE_EXTRA_CA_CERTS = caBundle;

const ref = env.SUPABASE_PROJECT_REF;
const [task, ...rest] = process.argv.slice(2);

const argsByTask = {
  types: ['gen', 'types', 'typescript', '--project-id', ref],
  query: ['db', 'query', '--linked', ...rest],
  push: ['db', 'push', '--linked', ...rest],
  reset: ['db', 'reset', ...rest],
  link: ['link', '--project-ref', ref, ...rest],
};

if (!task || !(task in argsByTask)) {
  console.error('usage: node scripts/db.mjs <types|query|push|reset|link> [args]');
  process.exit(1);
}

if ((task === 'types' || task === 'link') && !ref) {
  console.error('SUPABASE_PROJECT_REF is not set (.env.local or environment)');
  process.exit(1);
}

const cli = path.join(root, 'node_modules', 'supabase', 'dist', 'supabase.js');
const captureStdout = task === 'types';
const result = spawnSync(process.execPath, [cli, ...argsByTask[task]], {
  cwd: root,
  env,
  encoding: 'utf8',
  stdio: ['inherit', captureStdout ? 'pipe' : 'inherit', 'inherit'],
});

if (captureStdout && result.status === 0) {
  const outFile = path.join(root, 'packages', 'shared', 'src', 'db', 'database.types.ts');
  writeFileSync(outFile, result.stdout);
  console.log(`wrote ${path.relative(root, outFile)}`);
}

process.exit(result.status ?? 1);
