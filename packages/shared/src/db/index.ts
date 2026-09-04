/**
 * Generated database types and thin helpers over them.
 *
 * `database.types.ts` is produced by `pnpm db:types` (`supabase gen types`) and
 * is never hand-edited. Regenerate it after every migration.
 */

import type { Database } from './database.types.js';

export type { Database, Json } from './database.types.js';

/** Row shape of a public table, e.g. `TableRow<'students'>`. */
export type TableRow<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

/** Insert shape of a public table. */
export type TableInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

/** Update shape of a public table. */
export type TableUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
