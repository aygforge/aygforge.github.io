import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import pg from 'pg';
import { freshDb, player, dbAvailable } from './helpers.js';

const HAS_DB = await dbAvailable();

// Runs SQL as the Supabase `authenticated` role with a given JWT subject, like PostgREST does.
async function asUser(url, userId, sql, params = []) {
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  try {
    await c.query('begin');
    await c.query("select set_config('request.jwt.claim.sub', $1, true)", [userId || '']);
    await c.query(userId ? 'set local role authenticated' : 'set local role anon');
    const r = await c.query(sql, params);
    await c.query('rollback');
    return r.rows;
  } finally { await c.end(); }
}

describe.skipIf(!HAS_DB)('RLS & privileges', () => {
  let env, A, B, aChar;
  beforeAll(async () => {
    env = await freshDb('rls');
    A = player(env); B = player(env);
    await A.call('create_profile', { displayName: 'Rlsa' });
    await B.call('create_profile', { displayName: 'Rlsb' });
    aChar = (await A.call('create_character', { slot: 1, name: 'Gizli', cls: 'mage' })).characterId;
  }, 60000);
  afterAll(async () => env && env.cleanup());

  it('users read only their own characters, items and wallet', async () => {
    expect((await asUser(env.url, A.userId, 'select id from characters')).length).toBe(1);
    expect((await asUser(env.url, B.userId, 'select id from characters')).length).toBe(0);
    expect((await asUser(env.url, B.userId, 'select id from item_instances')).length).toBe(0);
    expect((await asUser(env.url, A.userId, 'select id from item_instances')).length).toBeGreaterThan(0);
    const w = await asUser(env.url, B.userId, 'select user_id from account_wallets');
    expect(w.map((x) => x.user_id)).toEqual([B.userId]);
  });

  it('clients cannot write gold, items or listings', async () => {
    await expect(asUser(env.url, A.userId, 'update account_wallets set gold = 999999')).rejects.toThrow(/permission denied/);
    await expect(asUser(env.url, A.userId, "insert into item_instances (owner_user, base_id, rarity, item_level, location, origin) values ($1,'u_storm_staff',4,30,'stash','hack')", [A.userId])).rejects.toThrow(/permission denied/);
    await expect(asUser(env.url, A.userId, 'delete from market_listings')).rejects.toThrow(/permission denied/);
    await expect(asUser(env.url, A.userId, 'update characters set level = 30')).rejects.toThrow(/permission denied/);
  });

  it('session seeds, ledgers of others and command log are invisible', async () => {
    await A.call('farm_start', { characterId: aChar, kind: 'farm', target: 'abandoned_road' });
    await expect(asUser(env.url, A.userId, 'select * from active_farm_sessions')).rejects.toThrow(/permission denied/);
    await expect(asUser(env.url, A.userId, 'select * from command_log')).rejects.toThrow(/permission denied/);
    expect((await asUser(env.url, B.userId, 'select * from currency_ledger')).every((r) => r.user_id === B.userId)).toBe(true);
  });

  it('anon sees nothing', async () => {
    await expect(asUser(env.url, null, 'select * from characters')).rejects.toThrow(/permission denied/);
  });

  it('active market listings are public to signed-in users', async () => {
    const it = await env.db.query(`insert into item_instances (owner_user, base_id, rarity, item_level, affixes, location, origin) values ($1,'ring_2',2,12,'[]','stash','test') returning id`, [A.userId]);
    await A.call('market_list', { itemId: it[0].id, price: 100, hours: 12 });
    const rows = await asUser(env.url, B.userId, "select seller_name, price from market_listings where status='active'");
    expect(rows.length).toBe(1);
    expect(rows[0].seller_name).toBe('Rlsa');
  });
});
