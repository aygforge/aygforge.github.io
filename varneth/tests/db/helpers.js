import pg from 'pg';
import { createPgDb } from '../../server/pg-db.js';
import { migrate } from '../../server/migrate.js';
import { createGameServer } from '../../shared/server/commands.js';

export const ADMIN_URL = process.env.TEST_DATABASE_ADMIN_URL || 'postgres://postgres:postgres@localhost:5432/postgres';

export async function dbAvailable() {
  const c = new pg.Client({ connectionString: ADMIN_URL });
  try { await c.connect(); await c.end(); return true; } catch { return false; }
}

// Creates an isolated, freshly migrated database for one test file.
export async function freshDb(tag) {
  const name = `varneth_t_${tag}_${Date.now().toString(36)}${Math.floor(Math.random() * 1e6)}`;
  const admin = new pg.Client({ connectionString: ADMIN_URL });
  await admin.connect();
  await admin.query(`create database ${name}`);
  await admin.end();
  const url = ADMIN_URL.replace(/\/[^/]*$/, '/' + name);
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  await migrate((sql) => c.query(sql));
  await c.end();
  const db = createPgDb(url);
  let offset = 0;
  const server = createGameServer(db, { clockOffset: () => offset });
  return {
    db, server, url,
    advance(ms) { offset += ms; },
    async cleanup() {
      await db.end();
      const a = new pg.Client({ connectionString: ADMIN_URL });
      await a.connect();
      await a.query(`drop database if exists ${name} with (force)`);
      await a.end();
    },
  };
}

let n = 0;
export const idem = () => `t-${Date.now()}-${++n}-${Math.random().toString(36).slice(2, 8)}`;
export const uid = () => globalThis.crypto.randomUUID();

export function player(env, userId = uid()) {
  const call = (name, args = {}, key = idem()) => env.server.exec(userId, name, args, key);
  return { userId, call };
}
