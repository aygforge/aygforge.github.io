// Çevrimiçi sunucu ayarı: önce oyunla gelen online.json (paket sahibi doldurur), yoksa bu tarayıcıda elle girilen ayar.
// Yalnız HERKESE AÇIK anahtar kabul edilir (eski tip JWT "anon" ya da "sb_publishable_"). Gizli (service_role /
// "sb_secret_") anahtar oyuna asla konmamalı: reddedilir.

const LOCAL_KEY = 'ahen_online_config';
const SHARE_PREFIX = 'AHO1:';

function lsGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function lsSet(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* */ } }

function jwtRole(key) {
  const parts = String(key).split('.');
  if (parts.length !== 3) return null;
  try {
    const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(parts[1].length / 4) * 4, '='));
    return JSON.parse(json).role || null;
  } catch { return null; }
}

// Döner: { ok, cfg?: { url, anonKey }, msg? }
export function validateConfig(raw) {
  const url = String(raw?.url || raw?.supabaseUrl || '').trim().replace(/\/+$/, '');
  const anonKey = String(raw?.anonKey || raw?.key || '').trim();
  if (!url && !anonKey) return { ok: false, empty: true, msg: 'Sunucu ayarı yok' };
  if (!/^https:\/\/[a-z0-9.-]+(:\d+)?$/i.test(url)) return { ok: false, msg: 'Proje adresi https://xxxx.supabase.co biçiminde olmalı' };
  if (anonKey.startsWith('sb_secret_')) return { ok: false, msg: 'Bu GİZLİ anahtar! Oyuna yalnız "publishable" / "anon public" anahtar konur.' };
  const role = jwtRole(anonKey);
  if (role === 'service_role') return { ok: false, msg: 'Bu service_role (GİZLİ) anahtar! Oyuna yalnız "anon public" anahtar konur.' };
  if (!(anonKey.startsWith('sb_publishable_') || role === 'anon')) return { ok: false, msg: 'Anahtar tanınmadı: Supabase → Project Settings → API Keys → "publishable" ya da "anon public" anahtarını kopyala' };
  return { ok: true, cfg: { url, anonKey } };
}

export async function loadConfig() {
  // 1) oyunla gelen dosya (itch.io ZIP'inde online.json)
  try {
    const res = await fetch('online.json', { cache: 'no-store' });
    if (res.ok) {
      const v = validateConfig(await res.json());
      if (v.ok) return { ...v, source: 'bundle' };
    }
  } catch { /* dosya yok / çevrimdışı */ }
  // 2) bu tarayıcıda elle girilen ayar
  try {
    const v = validateConfig(JSON.parse(lsGet(LOCAL_KEY) || 'null'));
    if (v.ok) return { ...v, source: 'local' };
  } catch { /* */ }
  return { ok: false, empty: true };
}

export function saveLocalConfig(cfg) { lsSet(LOCAL_KEY, cfg ? JSON.stringify(cfg) : null); }

// Arkadaşlara verilecek tek satırlık sunucu kodu (yalnız adres + herkese açık anahtar içerir)
export function shareCode(cfg) {
  return SHARE_PREFIX + btoa(JSON.stringify({ url: cfg.url, anonKey: cfg.anonKey }));
}

export function parseShareCode(text) {
  const t = String(text || '').trim();
  if (t.startsWith(SHARE_PREFIX)) {
    try { return validateConfig(JSON.parse(atob(t.slice(SHARE_PREFIX.length)))); } catch { return { ok: false, msg: 'Sunucu kodu bozuk' }; }
  }
  return { ok: false, msg: 'Sunucu kodu AHO1: ile başlamalı' };
}
