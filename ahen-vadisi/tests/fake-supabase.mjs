// Testler için bellek içi sahte Supabase (GoTrue /auth/v1 + PostgREST /rest/v1 alt kümesi).
// Gerçek sunucunun RLS kurallarını taklit eder: kullanıcı yalnız kendi cloud_saves satırını görür/yazar; liderlik herkese
// açık okunur, yalnız sahibi yazar; feedback yalnız eklenir. Birim testlerde fetch yerine, e2e'de Playwright route ile kullanılır.
import { randomUUID } from 'node:crypto';

export function createFakeSupabase({ confirmEmail = false, tokenTtl = 3600 } = {}) {
  const db = { users: [], players: [], cloud_saves: [], leaderboard: [], feedback: [] };
  const tokens = new Map();     // access_token -> { uid, exp }
  const refresh = new Map();    // refresh_token -> uid
  const log = [];
  const PK = { players: ['user_id'], cloud_saves: ['user_id'], leaderboard: ['user_id', 'char_id'] };

  const issue = (uid) => {
    const access = 'at_' + randomUUID(), rt = 'rt_' + randomUUID();
    const exp = Math.floor(Date.now() / 1000) + tokenTtl;
    tokens.set(access, { uid, exp });
    refresh.set(rt, uid);
    const u = db.users.find((x) => x.id === uid);
    return { access_token: access, token_type: 'bearer', expires_in: tokenTtl, expires_at: exp, refresh_token: rt, user: { id: uid, email: u.email } };
  };
  const json = (status, body) => ({ status, body: body === undefined ? '' : JSON.stringify(body) });
  const who = (headers) => {
    const a = headers.authorization || headers.Authorization || '';
    const t = a.startsWith('Bearer ') ? a.slice(7) : '';
    const s = tokens.get(t);
    if (s && s.exp > Date.now() / 1000) return { uid: s.uid };
    if (s) return { expired: true };
    return { uid: null };
  };

  function auth(method, path, q, body) {
    if (path === '/auth/v1/signup' && method === 'POST') {
      if (db.users.some((u) => u.email === body.email)) return json(422, { code: 'user_already_exists', msg: 'User already registered' });
      if (!body.password || body.password.length < 6) return json(422, { code: 'weak_password', msg: 'Password should be at least 6 characters.' });
      const u = { id: randomUUID(), email: body.email, password: body.password, confirmed: !confirmEmail };
      db.users.push(u);
      return confirmEmail ? json(200, { id: u.id, email: u.email }) : json(200, issue(u.id));
    }
    if (path === '/auth/v1/token' && method === 'POST') {
      if (q.get('grant_type') === 'password') {
        const u = db.users.find((x) => x.email === body.email && x.password === body.password);
        if (!u) return json(400, { error: 'invalid_grant', error_description: 'Invalid login credentials' });
        if (!u.confirmed) return json(400, { error_code: 'email_not_confirmed', msg: 'Email not confirmed' });
        return json(200, issue(u.id));
      }
      if (q.get('grant_type') === 'refresh_token') {
        const uid = refresh.get(body.refresh_token);
        if (!uid) return json(400, { error: 'invalid_grant', error_description: 'Invalid Refresh Token' });
        refresh.delete(body.refresh_token);
        return json(200, issue(uid));
      }
    }
    if (path === '/auth/v1/logout') return json(204);
    return json(404, { msg: 'not found' });
  }

  function rest(method, table, q, body, headers) {
    if (!db[table] || table === 'users') return json(404, { message: `Could not find the table 'public.${table}'` });
    const w = who(headers);
    if (w.expired) return json(401, { message: 'JWT expired' });
    const uid = w.uid;
    // satır görünürlüğü (RLS)
    const visible = (r) => table === 'cloud_saves' ? r.user_id === uid : table === 'feedback' ? false : true;
    if (method === 'GET') {
      if (table === 'cloud_saves' && !uid) return json(401, { message: 'permission denied for table cloud_saves' });
      if (table === 'feedback') return json(401, { message: 'permission denied for table feedback' });
      let rows = db[table].filter(visible);
      for (const [k, v] of q) if (v.startsWith('eq.')) rows = rows.filter((r) => String(r[k]) === v.slice(3));
      const order = q.get('order');
      if (order) {
        const keys = order.split(',').map((o) => o.split('.'));
        rows = [...rows].sort((a, b) => { for (const [k, d] of keys) { if (a[k] !== b[k]) return (a[k] < b[k] ? -1 : 1) * (d === 'desc' ? -1 : 1); } return 0; });
      }
      if (q.get('limit')) rows = rows.slice(0, +q.get('limit'));
      const sel = q.get('select');
      if (sel && sel !== '*') { const cols = sel.split(','); rows = rows.map((r) => Object.fromEntries(cols.map((c) => [c, r[c]]))); }
      return json(200, rows);
    }
    if (method === 'POST') {
      const list = Array.isArray(body) ? body : [body];
      if (table === 'feedback') {
        for (const r of list) {
          if (r.user_id && r.user_id !== uid) return json(403, { message: 'new row violates row-level security policy for table "feedback"' });
          if (!r.message || r.message.length < 3) return json(400, { message: 'violates check constraint' });
          db.feedback.push({ id: db.feedback.length + 1, ...r, created_at: new Date().toISOString() });
        }
        return json(201);
      }
      if (!uid) return json(401, { message: `permission denied for table ${table}` });
      for (const r of list) if (r.user_id !== uid) return json(403, { message: `new row violates row-level security policy for table "${table}"` });
      const upsert = (headers.prefer || headers.Prefer || '').includes('merge-duplicates');
      for (const r of list) {
        if (table === 'players' && db.players.some((p) => p.nickname === r.nickname && p.user_id !== uid)) return json(409, { code: '23505', message: 'duplicate key value violates unique constraint "players_nickname_key"' });
        if (table === 'leaderboard' && (r.level < 1 || r.level > 50)) return json(400, { message: 'violates check constraint "leaderboard_level_check"' });
        const pk = PK[table];
        const i = db[table].findIndex((x) => pk.every((k) => x[k] === r[k]));
        if (i >= 0 && !upsert) return json(409, { message: 'duplicate key value' });
        if (i >= 0) db[table][i] = { ...db[table][i], ...r }; else db[table].push({ ...r });
      }
      return json(201);
    }
    return json(405, { message: 'method not allowed' });
  }

  // (method, url, headers{lowercase}, bodyText) -> { status, body }
  function handle(method, url, headers, bodyText) {
    const u = new URL(url);
    const body = bodyText ? JSON.parse(bodyText) : null;
    log.push({ method, path: u.pathname + u.search });
    if (!headers.apikey) return json(401, { message: 'No API key found in request' });
    if (u.pathname.startsWith('/auth/v1/')) return auth(method, u.pathname, u.searchParams, body);
    if (u.pathname.startsWith('/rest/v1/')) return rest(method, u.pathname.slice(9), u.searchParams, body, headers);
    return json(404, { message: 'not found' });
  }

  // fetch uyumlu sarmalayıcı (birim testleri)
  async function fetchImpl(url, opts = {}) {
    const headers = Object.fromEntries(Object.entries(opts.headers || {}).map(([k, v]) => [k.toLowerCase(), v]));
    const r = handle(opts.method || 'GET', url, headers, opts.body || null);
    return { ok: r.status >= 200 && r.status < 300, status: r.status, text: async () => r.body };
  }

  return { db, handle, fetchImpl, log, tokens, expireAll: () => { for (const t of tokens.values()) t.exp = 0; } };
}
