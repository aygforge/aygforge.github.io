// Local multi-user game server (Node). Real separate accounts + the real command layer on
// your PostgreSQL. Use it to test the player market with two browsers without Supabase.
//   DATABASE_URL=postgres://... LOCAL_SERVER_SECRET=... node server/dev-server.js
import http from 'node:http';
import crypto from 'node:crypto';
import { createPgDb } from './pg-db.js';
import { migrate } from './migrate.js';
import { createGameServer } from '../shared/server/commands.js';

const PORT = Number(process.env.PORT || 8787);
const URL_ = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/varneth';
const SECRET = process.env.LOCAL_SERVER_SECRET || crypto.randomBytes(32).toString('hex');
const ORIGIN = process.env.ALLOWED_ORIGIN || '*';
if (!process.env.LOCAL_SERVER_SECRET) console.warn('[varneth] LOCAL_SERVER_SECRET not set: using a random secret (tokens reset on restart).');

const db = createPgDb(URL_);
const exists = await db.query("select to_regclass('public.profiles') as t");
if (!exists[0].t) {
  const c = await db.pool.connect();
  await migrate((sql) => c.query(sql));
  c.release();
  console.log('[varneth] database migrated');
}
const game = createGameServer(db);

const sign = (uid) => { const p = Buffer.from(JSON.stringify({ uid, iat: Date.now() })).toString('base64url'); return p + '.' + crypto.createHmac('sha256', SECRET).update(p).digest('base64url'); };
function verify(tok) {
  const [p, s] = String(tok || '').split('.');
  if (!p || !s) return null;
  const want = crypto.createHmac('sha256', SECRET).update(p).digest('base64url');
  if (want.length !== s.length || !crypto.timingSafeEqual(Buffer.from(want), Buffer.from(s))) return null;
  const data = JSON.parse(Buffer.from(p, 'base64url').toString());
  if (Date.now() - data.iat > 30 * 24 * 3600 * 1000) return null;
  return data.uid;
}
const hash = (pw, salt) => crypto.scryptSync(pw, salt, 32).toString('hex');

const routes = {
  async '/auth/register'(body) {
    const u = String(body.username || '').trim().toLowerCase();
    if (!/^[a-z0-9_.-]{3,32}$/.test(u)) throw Object.assign(new Error('Kullanıcı adı 3-32 karakter (a-z, 0-9, _ . -)'), { code: 'AUTH' });
    if (String(body.password || '').length < 6) throw Object.assign(new Error('Şifre en az 6 karakter.'), { code: 'AUTH' });
    const salt = crypto.randomBytes(16).toString('hex');
    const r = await db.query('insert into local_auth_users (username, pass_hash) values ($1,$2) on conflict do nothing returning user_id', [u, salt + ':' + hash(body.password, salt)]);
    if (!r.length) throw Object.assign(new Error('Bu kullanıcı adı alınmış.'), { code: 'AUTH' });
    return { userId: r[0].user_id, token: sign(r[0].user_id) };
  },
  async '/auth/login'(body) {
    const r = await db.query('select user_id, pass_hash from local_auth_users where username=$1', [String(body.username || '').trim().toLowerCase()]);
    const [salt, hh] = (r[0]?.pass_hash || ':').split(':');
    if (!r.length || hash(String(body.password || ''), salt) !== hh) throw Object.assign(new Error('Kullanıcı adı veya şifre hatalı.'), { code: 'AUTH' });
    return { userId: r[0].user_id, token: sign(r[0].user_id) };
  },
  async '/auth/me'(_b, uid) { if (!uid) throw Object.assign(new Error('Oturum yok'), { code: 'UNAUTHENTICATED' }); return { userId: uid }; },
  async '/cmd'(body, uid) { return game.exec(uid, String(body.name), body.args || {}, body.idem || null); },
};

http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', ORIGIN);
  res.setHeader('Access-Control-Allow-Headers', 'content-type, authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const route = routes[req.url];
  if (req.method !== 'POST' || !route) { res.writeHead(404); return res.end(); }
  let raw = '';
  req.on('data', (c) => { raw += c; if (raw.length > 1e5) req.destroy(); });
  req.on('end', async () => {
    res.setHeader('content-type', 'application/json');
    try {
      const uid = verify((req.headers.authorization || '').replace(/^Bearer /, ''));
      const data = await route(JSON.parse(raw || '{}'), uid);
      res.end(JSON.stringify({ ok: true, data }));
    } catch (e) {
      if (!e.code || /^[0-9A-Z]{5}$/.test(e.code)) console.error('[varneth]', e);
      res.end(JSON.stringify({ ok: false, error: { code: e.code && !/^[0-9A-Z]{5}$/.test(e.code) ? e.code : 'SERVER_ERROR', message: e.code && !/^[0-9A-Z]{5}$/.test(e.code) ? e.message : 'Sunucu hatası' } }));
    }
  });
}).listen(PORT, () => console.log(`[varneth] local game server on http://localhost:${PORT}`));
