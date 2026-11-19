// End-to-end over HTTP: two real accounts on the local game server trade an item.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn } from 'node:child_process';
import pg from 'pg';
import { dbAvailable, ADMIN_URL } from './helpers.js';

const HAS_DB = await dbAvailable();
const PORT = 18000 + Math.floor(Math.random() * 1000);
const BASE = `http://localhost:${PORT}`;

async function post(path, body, token) {
  const r = await fetch(BASE + path, { method: 'POST', headers: { 'content-type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: JSON.stringify(body) });
  const j = await r.json();
  if (!j.ok) { const e = new Error(j.error.message); e.code = j.error.code; throw e; }
  return j.data;
}
let n = 0;
const cmd = (tok, name, args = {}) => post('/cmd', { name, args, idem: `http-${Date.now()}-${++n}` }, tok);

describe.skipIf(!HAS_DB)('local game server over HTTP (two users)', () => {
  let proc, dbName, url;
  beforeAll(async () => {
    dbName = 'varneth_http_' + Date.now().toString(36);
    const a = new pg.Client({ connectionString: ADMIN_URL }); await a.connect(); await a.query(`create database ${dbName}`); await a.end();
    url = ADMIN_URL.replace(/\/[^/]*$/, '/' + dbName);
    proc = spawn(process.execPath, ['server/dev-server.js'], { env: { ...process.env, PORT: String(PORT), DATABASE_URL: url, LOCAL_SERVER_SECRET: 'test-secret-' + Math.random() }, stdio: 'pipe' });
    await new Promise((res, rej) => {
      const t = setTimeout(() => rej(new Error('server did not start')), 20000);
      proc.stdout.on('data', (d) => { if (String(d).includes('local game server')) { clearTimeout(t); res(); } });
      proc.stderr.on('data', (d) => process.stderr.write(d));
    });
  }, 60000);
  afterAll(async () => {
    proc?.kill();
    const a = new pg.Client({ connectionString: ADMIN_URL }); await a.connect(); await a.query(`drop database if exists ${dbName} with (force)`); await a.end();
  });

  it('register/login, auth required, cross-account trade', async () => {
    await expect(post('/cmd', { name: 'bootstrap' })).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
    const A = await post('/auth/register', { username: 'satici', password: 'secret123' });
    const B = await post('/auth/register', { username: 'alici', password: 'secret123' });
    await expect(post('/auth/register', { username: 'satici', password: 'x23456' })).rejects.toMatchObject({ code: 'AUTH' });
    await expect(post('/auth/login', { username: 'satici', password: 'wrong!!' })).rejects.toMatchObject({ code: 'AUTH' });
    const A2 = await post('/auth/login', { username: 'satici', password: 'secret123' });
    expect(A2.userId).toBe(A.userId);
    await expect(post('/cmd', { name: 'bootstrap' }, 'forged.token')).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
    await cmd(A.token, 'create_profile', { displayName: 'SaticiAvci' });
    await cmd(B.token, 'create_profile', { displayName: 'AliciAvci' });
    // seed one tradeable item and gold directly (test fixture), then trade through HTTP commands
    const c = new pg.Client({ connectionString: url }); await c.connect();
    const it = await c.query(`insert into item_instances (owner_user, base_id, rarity, item_level, upgrade, affixes, location, origin) values ($1,'u_broken_seal',4,15,7,'[{"id":"crit_chance","q":0.9,"v":0.03}]','stash','test') returning id`, [A.userId]);
    await c.query('update account_wallets set gold=10000 where user_id = any($1::uuid[])', [[A.userId, B.userId]]);
    const l = await cmd(A.token, 'market_list', { itemId: it.rows[0].id, price: 4000, hours: 48 });
    const search = await cmd(B.token, 'market_search', { rarity: 4 });
    expect(search.listings.map((x) => x.id)).toContain(l.listingId);
    const buy = await cmd(B.token, 'market_buy', { listingId: l.listingId });
    expect(buy.gold).toBe(6000);
    const row = (await c.query('select owner_user, upgrade, affixes from item_instances where id=$1', [it.rows[0].id])).rows[0];
    expect(row.owner_user).toBe(B.userId);
    expect(row.upgrade).toBe(7);
    const aBoot = await cmd(A.token, 'bootstrap');
    expect(aBoot.gold).toBe(10000 - 80 + 3800);
    expect(aBoot.notifications[0].kind).toBe('market_sold');
    await c.end();
  });
});
