// Çevrimiçi test katmanı — Supabase REST istemcisi (kütüphanesiz, yalnız fetch).
// Kimlik: GoTrue (/auth/v1) e-posta + şifre; oturum localStorage'da. Veri: PostgREST (/rest/v1), satır güvenliği (RLS)
// sunucuda: her oyuncu yalnız kendi kaydını okur/yazar (bkz. supabase/kurulum.sql).
// Oyun bu katman olmadan da tamamen çalışır; ağ hatası oyunu durdurmaz, yalnız { ok:false, msg } döner.

const SESSION_KEY = 'ahen_online_session';
const TIMEOUT_MS = 12000;

function lsGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function lsSet(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* gizli sekme vb. */ } }

// Supabase hata gövdelerini Türkçe, kısa mesaja çevirir. Sunucu kodu (PGRST205, 42P01, 42501…) parantez içinde eklenir:
// sorun giderirken "hangi tablo, hangi hata" görülebilsin.
export function errorText(status, body) {
  const raw = String(body?.msg || body?.message || body?.error_description || body?.error || '').toLowerCase();
  const code = String(body?.code || body?.error_code || '');
  const tag = code ? ` [${code}]` : status ? ` [${status}]` : '';
  if (status === 0) return 'Sunucuya ulaşılamadı (internet bağlantısını kontrol et)';
  if (raw.includes('invalid login') || raw.includes('invalid_credentials') || raw.includes('invalid grant')) return 'E-posta ya da şifre yanlış';
  if (raw.includes('already registered') || raw.includes('already been registered') || raw.includes('user_already_exists')) return 'Bu e-posta zaten kayıtlı — giriş yap';
  if (raw.includes('email not confirmed')) return 'E-posta henüz onaylanmamış (Supabase\'te "Confirm email" kapatılmalı ya da e-postadaki bağlantı onaylanmalı)';
  if (raw.includes('password') && (raw.includes('6') || raw.includes('short') || raw.includes('weak'))) return 'Şifre en az 6 karakter olmalı';
  if (raw.includes('duplicate key') && raw.includes('nickname')) return 'Bu takma ad alınmış';
  if (raw.includes('rate limit') || status === 429) return 'Çok sık deneme — biraz bekleyip tekrar dene';
  if (code === 'PGRST205' || code === '42P01' || raw.includes('does not exist') || raw.includes('could not find the table')) {
    const t = /(?:table|relation) ['"]?(?:public\.)?([a-z_]+)/.exec(raw)?.[1];
    return `Sunucuda "${t || 'tablo'}" tablosu yok${tag} — supabase/kurulum.sql Supabase SQL Editor'da çalıştırılmalı`;
  }
  if (code === '42501' || raw.includes('permission denied')) return `Sunucu izni yok${tag} — supabase/kurulum.sql yeniden çalıştırılmalı`;
  if (raw.includes('row-level security')) return `Sunucu bu yazmayı reddetti (satır güvenliği)${tag}`;
  if (status === 401 || raw.includes('jwt')) return 'Oturum süresi doldu — yeniden giriş yap';
  if (status === 404) return `Sunucu adresi ya da tablo bulunamadı${tag} — kurulum SQL'i çalıştırıldı mı?`;
  return `Sunucu hatası${tag}${raw ? ': ' + raw.slice(0, 120) : ''}`;
}

export class OnlineApi {
  constructor(cfg, { fetchImpl = null } = {}) {
    this.url = cfg.url.replace(/\/+$/, '');
    this.key = cfg.anonKey;
    this.fetch = fetchImpl || ((...a) => fetch(...a));
    this.session = null;
    try { this.session = JSON.parse(lsGet(SESSION_KEY) || 'null'); } catch { this.session = null; }
    if (this.session && !this.session.access_token) this.session = null;
  }

  get user() { return this.session?.user || null; }
  get loggedIn() { return !!this.session?.access_token; }

  saveSession(s) {
    this.session = s ? { access_token: s.access_token, refresh_token: s.refresh_token, expires_at: s.expires_at || (Math.floor(Date.now() / 1000) + (s.expires_in || 3600)), user: s.user ? { id: s.user.id, email: s.user.email, nickname: s.user.user_metadata?.nickname || null } : this.session?.user || null } : null;
    lsSet(SESSION_KEY, this.session ? JSON.stringify(this.session) : null);
  }

  async raw(method, path, { body = null, headers = {}, auth = true } = {}) {
    const h = { apikey: this.key, 'Content-Type': 'application/json', ...headers };
    // oturum varsa kullanıcı belirteci; yoksa eski tip (JWT) anon anahtarı. Yeni "sb_publishable_" anahtarı JWT değildir,
    // yalnız apikey başlığında gider.
    if (auth && this.session?.access_token) h.Authorization = `Bearer ${this.session.access_token}`;
    else if (this.key.split('.').length === 3) h.Authorization = `Bearer ${this.key}`;
    const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctl ? setTimeout(() => ctl.abort(), TIMEOUT_MS) : null;
    try {
      const res = await this.fetch(this.url + path, { method, headers: h, body: body == null ? undefined : JSON.stringify(body), signal: ctl?.signal });
      const text = await res.text();
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch { data = text; }
      return { ok: res.ok, status: res.status, data };
    } catch {
      return { ok: false, status: 0, data: null };
    } finally { if (timer) clearTimeout(timer); }
  }

  // oturum süresi dolmak üzereyse yenile (1 dk pay)
  async ensureFresh() {
    if (!this.session) return false;
    if ((this.session.expires_at || 0) - 60 > Date.now() / 1000) return true;
    const r = await this.raw('POST', '/auth/v1/token?grant_type=refresh_token', { body: { refresh_token: this.session.refresh_token }, auth: false });
    if (r.ok && r.data?.access_token) { this.saveSession(r.data); return true; }
    if (r.status !== 0) this.saveSession(null);   // yenileme reddedildi: oturum kapanır (ağ hatasında oturum korunur)
    return false;
  }

  async request(method, path, opts = {}) {
    if (opts.auth !== false && this.session) await this.ensureFresh();
    let r = await this.raw(method, path, opts);
    // erişim belirteci sunucuda geçersizse bir kez yenilemeyi dene
    if (r.status === 401 && this.session?.refresh_token && opts.auth !== false) {
      this.session.expires_at = 0;
      if (await this.ensureFresh()) r = await this.raw(method, path, opts);
    }
    return r.ok ? { ok: true, data: r.data } : { ok: false, status: r.status, msg: errorText(r.status, r.data) };
  }

  // ---------------------------------------------------------------- kimlik
  async signUp(email, password, nickname) {
    const r = await this.raw('POST', '/auth/v1/signup', { body: { email, password, data: { nickname } }, auth: false });
    if (!r.ok) return { ok: false, msg: errorText(r.status, r.data) };
    const s = r.data?.access_token ? r.data : r.data?.session;
    if (!s?.access_token) return { ok: false, needsConfirm: true, msg: 'Hesap oluşturuldu ama e-posta onayı bekleniyor. Supabase → Authentication → Sign In / Providers → Email: "Confirm email" kapatılmalı (ya da e-postadaki bağlantıyı onayla), sonra giriş yap.' };
    this.saveSession({ ...s, user: s.user || r.data.user });
    const p = await this.setNickname(nickname);
    return p.ok ? { ok: true } : { ok: true, warn: p.msg };
  }

  async signIn(email, password) {
    const r = await this.raw('POST', '/auth/v1/token?grant_type=password', { body: { email, password }, auth: false });
    if (!r.ok || !r.data?.access_token) return { ok: false, msg: errorText(r.status, r.data) };
    this.saveSession(r.data);
    return { ok: true };
  }

  async signOut() {
    if (this.session) await this.raw('POST', '/auth/v1/logout', {});
    this.saveSession(null);
  }

  // ---------------------------------------------------------------- oyuncu
  async setNickname(nickname) {
    if (!this.user) return { ok: false, msg: 'Giriş yapılmamış' };
    return this.request('POST', '/rest/v1/players?on_conflict=user_id', { body: { user_id: this.user.id, nickname }, headers: { Prefer: 'resolution=merge-duplicates,return=minimal' } });
  }

  // hesabın kayıtta verilen takma adı (players satırı yazılamadıysa onarmak için)
  async getUserNickname() {
    if (this.user?.nickname) return this.user.nickname;
    const r = await this.request('GET', '/auth/v1/user');
    return (r.ok && r.data?.user_metadata?.nickname) || null;
  }

  async getNickname() {
    if (!this.user) return null;
    const r = await this.request('GET', `/rest/v1/players?select=nickname&user_id=eq.${this.user.id}`);
    return r.ok && r.data?.[0]?.nickname || null;
  }

  // ---------------------------------------------------------------- bulut kaydı
  async getCloudMeta() {
    if (!this.user) return { ok: false, msg: 'Giriş yapılmamış' };
    const r = await this.request('GET', `/rest/v1/cloud_saves?select=summary,game_version,updated_at&user_id=eq.${this.user.id}`);
    return r.ok ? { ok: true, meta: r.data?.[0] || null } : r;
  }

  async getCloudCode() {
    if (!this.user) return { ok: false, msg: 'Giriş yapılmamış' };
    const r = await this.request('GET', `/rest/v1/cloud_saves?select=code,summary,updated_at&user_id=eq.${this.user.id}`);
    if (!r.ok) return r;
    return r.data?.[0] ? { ok: true, row: r.data[0] } : { ok: false, msg: 'Bulutta kayıt yok' };
  }

  async putCloud({ code, summary, gameVersion, schemaVersion }) {
    if (!this.user) return { ok: false, msg: 'Giriş yapılmamış' };
    return this.request('POST', '/rest/v1/cloud_saves?on_conflict=user_id', {
      body: { user_id: this.user.id, code, summary, game_version: gameVersion, schema_version: schemaVersion, updated_at: new Date().toISOString() },
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    });
  }

  // ---------------------------------------------------------------- liderlik tablosu
  async putLeaderboard(rows) {
    if (!this.user || !rows.length) return { ok: true };
    return this.request('POST', '/rest/v1/leaderboard?on_conflict=user_id,char_id', {
      body: rows.map((r) => ({ ...r, user_id: this.user.id })),
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    });
  }

  async getLeaderboard(limit = 50) {
    const r = await this.request('GET', `/rest/v1/leaderboard?select=nickname,char_name,cls,level,exp,kills,boss_kills,quests,updated_at&order=level.desc,exp.desc&limit=${limit}`, { auth: this.loggedIn });
    return r.ok ? { ok: true, rows: Array.isArray(r.data) ? r.data : [] } : r;
  }

  // ---------------------------------------------------------------- çevrimiçi oyuncular
  // "buradayım": son görülme zamanını sunucu yazar (cihaz saatine güvenilmez)
  async heartbeat(row) {
    if (!this.user) return { ok: false, msg: 'Giriş yapılmamış' };
    return this.request('POST', '/rest/v1/presence?on_conflict=user_id', {
      body: { ...row, user_id: this.user.id },
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    });
  }

  async clearPresence() {
    if (!this.user) return { ok: true };
    return this.request('DELETE', `/rest/v1/presence?user_id=eq.${this.user.id}`, { headers: { Prefer: 'return=minimal' } });
  }

  async getOnline(limit = 100) {
    const r = await this.request('GET', `/rest/v1/online_players?select=nickname,char_name,cls,level,map&order=level.desc&limit=${limit}`, { auth: this.loggedIn });
    return r.ok ? { ok: true, rows: Array.isArray(r.data) ? r.data : [] } : r;
  }

  // ---------------------------------------------------------------- geri bildirim
  async sendFeedback(message, context) {
    return this.request('POST', '/rest/v1/feedback', {
      body: { message, context, user_id: this.user?.id || null },
      headers: { Prefer: 'return=minimal' }, auth: this.loggedIn,
    });
  }
}
