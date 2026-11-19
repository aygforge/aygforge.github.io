// Apply SQL migrations to a plain PostgreSQL (local dev / tests).
// Order: Supabase compatibility shim -> real migrations -> local auth table.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function migrationFiles({ local = true } = {}) {
  const mig = fs.readdirSync(path.join(root, 'supabase/migrations')).filter((f) => f.endsWith('.sql')).sort().map((f) => path.join(root, 'supabase/migrations', f));
  if (!local) return mig;
  return [path.join(root, 'supabase/local/00_supabase_compat.sql'), ...mig, path.join(root, 'supabase/local/10_local_auth.sql')];
}

export async function migrate(execSql, opts) {
  for (const f of migrationFiles(opts)) await execSql(fs.readFileSync(f, 'utf8'), f);
}

if (process.argv[1] && process.argv[1].endsWith('migrate.js')) {
  const { default: pg } = await import('pg');
  const url = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/varneth';
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  await migrate((sql) => c.query(sql));
  console.log('migrations applied to', url.replace(/:[^:@/]+@/, ':***@'));
  await c.end();
}
