// Backend connectors. The game client never computes rewards itself: every mutation is a
// command executed by the trusted command layer (shared/server/commands.js) in one of:
//   online  – Supabase Edge Function `game` (+ Supabase Auth)       => real players, real market
//   local   – node server/dev-server.js against your PostgreSQL     => real separate accounts locally
//   sandbox – in-browser PostgreSQL (PGlite) for offline practice   => clearly labelled, market disabled
import { MUTATING } from '../../shared/server/commands.js';

const env = import.meta.env || {};
export const CONFIG = {
  supabaseUrl: env.VITE_SUPABASE_URL || '',
  supabaseKey: env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || '',
  localUrl: env.VITE_LOCAL_SERVER_URL || '',
};

export function availableModes() {
  const m = [];
  if (CONFIG.supabaseUrl && CONFIG.supabaseKey) m.push('online');
  if (CONFIG.localUrl) m.push('local');
  m.push('sandbox');
  return m;
}

export class ApiError extends Error {
  constructor(code, message) { super(message || code); this.code = code; }
}

export function newIdem() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

// retries transport errors with the SAME idempotency key => no double spend on reconnect
async function withRetry(fn, tries = 3) {
  let last;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); } catch (e) {
      last = e;
      if (e instanceof ApiError) throw e;
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
  throw new ApiError('NETWORK', 'Sunucuya ulaşılamadı. Bağlantını kontrol et.');
}

function storage() {
  try { return window.localStorage; } catch { return null; }
}
const lsGet = (k) => { try { return storage()?.getItem(k) ?? null; } catch { return null; } };
const lsSet = (k, v) => { try { v == null ? storage()?.removeItem(k) : storage()?.setItem(k, v); } catch { /* ignore */ } };

// ------------------------------------------------------------------ online (Supabase)
async function onlineBackend() {
  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey, { auth: { persistSession: true } });
  let session = (await sb.auth.getSession()).data.session;
  sb.auth.onAuthStateChange((_e, s) => { session = s; });
  return {
    mode: 'online', label: 'Çevrimiçi', marketEnabled: true, usesEmail: true,
    async restore() { return session ? { userId: session.user.id } : null; },
    async register(email, password) {
      const { data, error } = await sb.auth.signUp({ email, password });
      if (error) throw new ApiError('AUTH', error.message);
      session = data.session;
      if (!session) throw new ApiError('CONFIRM_EMAIL', 'E-posta doğrulaması gerekli. Gelen kutunu kontrol et, sonra giriş yap.');
      return { userId: session.user.id };
    },
    async login(email, password) {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw new ApiError('AUTH', error.message);
      session = data.session;
      return { userId: session.user.id };
    },
    async logout() { await sb.auth.signOut(); session = null; },
    async call(name, args = {}, idem = MUTATING.has(name) ? newIdem() : null) {
      return withRetry(async () => {
        const res = await fetch(`${CONFIG.supabaseUrl}/functions/v1/game`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', apikey: CONFIG.supabaseKey, Authorization: `Bearer ${session?.access_token || ''}` },
          body: JSON.stringify({ name, args, idem }),
        });
        const j = await res.json().catch(() => null);
        if (!j) throw new Error('bad response');
        if (!j.ok) throw new ApiError(j.error?.code || 'ERROR', j.error?.message);
        return j.data;
      });
    },
  };
}

// ------------------------------------------------------------------ local server
async function localBackend() {
  let token = lsGet('varneth.local.token');
  const post = async (path, body, auth = true) => {
    const res = await fetch(CONFIG.localUrl.replace(/\/$/, '') + path, {
      method: 'POST', headers: { 'content-type': 'application/json', ...(auth && token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body),
    });
    const j = await res.json().catch(() => null);
    if (!j) throw new Error('bad response');
    if (!j.ok) throw new ApiError(j.error?.code || 'ERROR', j.error?.message);
    return j.data;
  };
  return {
    mode: 'local', label: 'Yerel Sunucu', marketEnabled: true, usesEmail: false,
    async restore() {
      if (!token) return null;
      try { return await post('/auth/me', {}); } catch { token = null; lsSet('varneth.local.token', null); return null; }
    },
    async register(u, p) { const d = await withRetry(() => post('/auth/register', { username: u, password: p }, false)); token = d.token; lsSet('varneth.local.token', token); return d; },
    async login(u, p) { const d = await withRetry(() => post('/auth/login', { username: u, password: p }, false)); token = d.token; lsSet('varneth.local.token', token); return d; },
    async logout() { token = null; lsSet('varneth.local.token', null); },
    async call(name, args = {}, idem = MUTATING.has(name) ? newIdem() : null) {
      return withRetry(() => post('/cmd', { name, args, idem }));
    },
  };
}

// ------------------------------------------------------------------ sandbox (in-browser PostgreSQL)
async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function sandboxBackend(onProgress) {
  onProgress?.('Yerel veritabanı hazırlanıyor…');
  const { createSandboxDb } = await import('./sandbox-db.js');
  const db = await createSandboxDb();
  const { createGameServer } = await import('../../shared/server/commands.js');
  const server = createGameServer(db);
  let userId = lsGet('varneth.sandbox.user');
  const q = (sql, p) => db.tx((t) => t(sql, p));
  return {
    mode: 'sandbox', label: 'Sandbox (çevrimdışı antrenman)', marketEnabled: false, usesEmail: false,
    async restore() {
      if (!userId) return null;
      const r = await q('select user_id from local_auth_users where user_id=$1', [userId]);
      return r.length ? { userId } : null;
    },
    async register(u, p) {
      const name = String(u || '').trim().toLowerCase();
      if (name.length < 3) throw new ApiError('AUTH', 'Kullanıcı adı en az 3 karakter.');
      if (String(p).length < 6) throw new ApiError('AUTH', 'Şifre en az 6 karakter.');
      const ex = await q('select 1 from local_auth_users where username=$1', [name]);
      if (ex.length) throw new ApiError('AUTH', 'Bu kullanıcı adı alınmış.');
      const r = await q('insert into local_auth_users (username, pass_hash) values ($1,$2) returning user_id', [name, await sha256('varneth:' + name + ':' + p)]);
      userId = r[0].user_id; lsSet('varneth.sandbox.user', userId);
      return { userId };
    },
    async login(u, p) {
      const name = String(u || '').trim().toLowerCase();
      const r = await q('select user_id from local_auth_users where username=$1 and pass_hash=$2', [name, await sha256('varneth:' + name + ':' + p)]);
      if (!r.length) throw new ApiError('AUTH', 'Kullanıcı adı veya şifre hatalı.');
      userId = r[0].user_id; lsSet('varneth.sandbox.user', userId);
      return { userId };
    },
    async logout() { userId = null; lsSet('varneth.sandbox.user', null); },
    async call(name, args = {}, idem = MUTATING.has(name) ? newIdem() : null) {
      if (name.startsWith('market_')) throw new ApiError('MARKET_DISABLED', 'Gerçek oyuncu pazarı sandbox modunda kapalıdır.');
      try { return await server.exec(userId, name, args, idem); } catch (e) {
        if (e.code && e.message) throw new ApiError(e.code, e.message);
        throw e;
      }
    },
  };
}

export async function connect(mode, onProgress) {
  if (mode === 'online') return onlineBackend();
  if (mode === 'local') return localBackend();
  return sandboxBackend(onProgress);
}
