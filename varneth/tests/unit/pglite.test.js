// The in-browser sandbox uses PGlite: verify the SAME migrations + command layer run on it.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { createGameServer } from '../../shared/server/commands.js';

describe('sandbox database (PGlite)', () => {
  it('runs migrations and a farm loop with verified rewards', async () => {
    const pg = new PGlite();
    for (const f of ['supabase/local/00_supabase_compat.sql', 'supabase/migrations/20261119000001_schema.sql', 'supabase/migrations/20261119000002_security.sql', 'supabase/local/10_local_auth.sql']) await pg.exec(fs.readFileSync(f, 'utf8'));
    let queue = Promise.resolve();
    const db = { tx(fn) { const run = () => pg.transaction(async (t) => { let c = Promise.resolve(); const q = (s, p = []) => { const x = c.then(() => t.query(s, p)).then((r) => r.rows); c = x.catch(() => {}); return x; }; return fn(q); }); const p = queue.then(run, run); queue = p.catch(() => {}); return p; } };
    let off = 0;
    const srv = createGameServer(db, { clockOffset: () => off });
    const uid = (await pg.query("insert into local_auth_users (username, pass_hash) values ('x','y') returning user_id")).rows[0].user_id;
    let k = 0;
    const c = (n, a = {}) => srv.exec(uid, n, a, 'pglite-key-' + ++k);
    await c('create_profile', { displayName: 'Sandbox' });
    const ch = await c('create_character', { slot: 1, name: 'Kum', cls: 'warrior' });
    const s = await c('farm_start', { characterId: ch.characterId, kind: 'farm', target: 'abandoned_road' });
    let xp = 0;
    for (let i = 0; i < 6; i++) { off += 20000; xp += (await c('farm_heartbeat', { sessionId: s.session.id })).settlement.xp; }
    const b = await c('bootstrap');
    expect(typeof b.gold).toBe('number');
    expect(xp).toBeGreaterThan(0);
    const v = await c('character', { characterId: ch.characterId });
    expect(v.character.xp + (v.character.level > 1 ? 1 : 0)).toBeGreaterThan(0);
    await pg.close();
  }, 60000);
});
