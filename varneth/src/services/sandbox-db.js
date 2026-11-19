// In-browser PostgreSQL (PGlite, WASM) running the SAME migrations and command layer as
// the real server. Used only for the clearly-labelled offline sandbox. Data never leaves
// this browser and is never imported into the online economy.
import { PGlite } from '@electric-sql/pglite';
import compat from '../../supabase/local/00_supabase_compat.sql?raw';
import schema from '../../supabase/migrations/20261119000001_schema.sql?raw';
import security from '../../supabase/migrations/20261119000002_security.sql?raw';
import localAuth from '../../supabase/local/10_local_auth.sql?raw';

async function singleTabLock() {
  if (!navigator.locks) return true;
  return new Promise((resolve) => {
    navigator.locks.request('varneth-sandbox-db', { ifAvailable: true }, (lock) => {
      if (!lock) { resolve(false); return undefined; }
      resolve(true);
      return new Promise(() => {}); // hold for the lifetime of this tab
    });
  });
}

export async function createSandboxDb() {
  if (!(await singleTabLock())) throw new Error('Sandbox başka bir sekmede açık. Aynı tarayıcıda tek sekme kullan.');
  let pg;
  try {
    pg = new PGlite('idb://varneth-sandbox');
    await pg.waitReady;
  } catch {
    pg = new PGlite(); // IndexedDB unavailable (private mode): in-memory only
    await pg.waitReady;
  }
  const exists = await pg.query("select to_regclass('public.profiles') as t");
  if (!exists.rows[0].t) {
    await pg.exec(compat);
    await pg.exec(schema);
    await pg.exec(security);
    await pg.exec(localAuth);
  }
  let queue = Promise.resolve();
  return {
    // PGlite is single-connection: serialize transactions.
    tx(fn) {
      const run = () => pg.transaction(async (t) => {
        let chain = Promise.resolve();
        const q = (sql, params = []) => {
          const p = chain.then(() => t.query(sql, params)).then((r) => r.rows);
          chain = p.catch(() => {});
          return p;
        };
        return fn(q);
      });
      const p = queue.then(run, run);
      queue = p.catch(() => {});
      return p;
    },
  };
}
