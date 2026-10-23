// Sunucu merkezi: bağlantılar, kimlik doğrulama (Supabase oturum belirteci), bölgeler (harita başına ortak dünya),
// yayın/abonelik kanalları (parti ve davetler — istemcideki Party/Lobby sınıfları aynen kullanır).
//
// İstemci → sunucu:
//   {t:'hello', token, v, nick}            giriş (yanıt: welcome | err)
//   {t:'enter', map, x, y, ...durum}       bölgeye gir (map null: dungeon/menü — bölgeden çık)
//   {t:'pos', x, y, f, mv, hp, d, a, lv}   konum/durum (≈8 Hz)
//   {t:'hit', e, dmg}                      yaratığa vuruş (hasarı istemci hesaplar)
//   {t:'st', e, slow:[oran, ms], stun:ms}  yaratığa durum etkisi
//   {t:'sub', topic, key} / {t:'unsub', topic} / {t:'bc', topic, ev, p} / {t:'track', topic, meta}
// Sunucu → istemci: welcome, err, zone, snap, evs (olay listesi: tg, fx, tx, hz, sh, pj, a, eh, die, kill, note),
//   bc (kanal yayını), pres (kanal üyeleri), count (çevrimiçi sayısı)
import { Zone, isSharedMap } from './sim/zone.mjs';
import { GAME_VERSION } from '../src/data/constants.js';

const ZONE_TTL_MS = 10 * 60 * 1000;     // boş bölge 10 dk sonra kapanır (yaratık durumu o süre korunur)
const MAX_MSG_PER_SEC = 60;
const minor = (v) => String(v || '').split('.').slice(0, 2).join('.');
const str = (v, n) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, n) : '');

export class Hub {
  // verify(token) → Promise<{ uid, email } | null>
  constructor({ verify, log = () => {} } = {}) {
    this.verify = verify; this.log = log;
    this.conns = new Set();
    this.byUid = new Map();
    this.zones = new Map();
    this.topics = new Map();      // topic → Map(conn → meta|null)
    this.last = Date.now();
  }

  // ---------------------------------------------------------------- bağlantı yaşam döngüsü
  attach(ws) {
    const c = { ws, uid: null, nick: '?', zone: null, topics: new Set(), rate: { t: Date.now(), n: 0 }, alive: true };
    this.conns.add(c);
    ws.on('message', (data) => { try { this.onMessage(c, JSON.parse(String(data))); } catch (e) { this.log('mesaj hatası', e?.message); } });
    ws.on('close', () => this.detach(c));
    ws.on('pong', () => { c.alive = true; });
    return c;
  }

  detach(c) {
    if (!this.conns.has(c)) return;
    this.conns.delete(c);
    this.leaveZone(c);
    for (const t of [...c.topics]) this.unsub(c, t);
    if (c.uid && this.byUid.get(c.uid) === c) this.byUid.delete(c.uid);
    this.broadcastCount();
  }

  send(c, msg) {
    if (c.ws.readyState !== 1) return;
    try { c.ws.send(JSON.stringify(msg)); } catch { /* kapanıyor */ }
  }
  sendUid(uid, msg) { const c = this.byUid.get(uid); if (c) this.send(c, msg); }

  // ---------------------------------------------------------------- mesajlar
  async onMessage(c, m) {
    const now = Date.now();
    if (now - c.rate.t > 1000) { c.rate.t = now; c.rate.n = 0; }
    if (++c.rate.n > MAX_MSG_PER_SEC) return;
    if (!m || typeof m.t !== 'string') return;
    if (m.t === 'hello') return this.hello(c, m);
    if (!c.uid) return;
    switch (m.t) {
      case 'enter': return this.enter(c, m);
      case 'pos': c.zone?.update(c.uid, m); return;
      case 'hit': c.zone?.onHit(c.uid, m.e, +m.dmg); return;
      case 'st': c.zone?.onStatus(c.uid, m.e, { slow: Array.isArray(m.slow) ? [+m.slow[0] || 0, +m.slow[1] || 0] : null, stun: +m.stun || 0 }); return;
      case 'sub': return this.sub(c, str(m.topic, 64));
      case 'unsub': return this.unsub(c, str(m.topic, 64));
      case 'track': return this.track(c, str(m.topic, 64), m.meta);
      case 'bc': return this.bc(c, str(m.topic, 64), str(m.ev, 24), m.p);
      default: return;
    }
  }

  async hello(c, m) {
    if (minor(m.v) !== minor(GAME_VERSION)) {
      this.send(c, { t: 'err', code: 'version', msg: `Oyun sürümün (${m.v || '?'}) sunucuyla (${GAME_VERSION}) uyuşmuyor — oyunu güncelle (sayfayı yenile).` });
      return;
    }
    const who = await this.verify(String(m.token || '')).catch(() => null);
    if (!who?.uid) { this.send(c, { t: 'err', code: 'auth', msg: 'Oturum doğrulanamadı — yeniden giriş yap' }); return; }
    // aynı hesap ikinci kez bağlanırsa eski bağlantı kapanır
    const old = this.byUid.get(who.uid);
    if (old && old !== c) { this.send(old, { t: 'err', code: 'dup', msg: 'Bu hesapla başka bir yerden girildi' }); old.ws.close(); this.detach(old); }
    c.uid = who.uid; c.nick = str(m.nick, 16) || (who.email || 'oyuncu').split('@')[0];
    this.byUid.set(c.uid, c);
    this.send(c, { t: 'welcome', uid: c.uid, v: GAME_VERSION, n: this.byUid.size });
    this.broadcastCount();
  }

  enter(c, m) {
    const map = str(m.map, 40);
    this.leaveZone(c);
    if (!map || !isSharedMap(map)) return;
    let z = this.zones.get(map);
    if (!z) {
      z = new Zone(map, { out: (uid, msg) => this.sendUid(uid, msg), partyOf: (uid) => this.partyOf(uid) });
      this.zones.set(map, z);
    }
    c.zone = z;
    z.join(c.uid, { ...m, nick: c.nick });
  }

  leaveZone(c) {
    if (c.zone) { c.zone.leave(c.uid); c.zone = null; }
  }

  // ---------------------------------------------------------------- kanallar (parti, davet)
  sub(c, topic) {
    if (!topic) return;
    if (!this.topics.has(topic)) this.topics.set(topic, new Map());
    this.topics.get(topic).set(c, null);
    c.topics.add(topic);
    this.send(c, { t: 'subbed', topic });
    this.presence(topic);
  }
  unsub(c, topic) {
    const t = this.topics.get(topic);
    if (!t) return;
    t.delete(c); c.topics.delete(topic);
    if (!t.size) this.topics.delete(topic); else this.presence(topic);
  }
  track(c, topic, meta) {
    const t = this.topics.get(topic);
    if (!t || !t.has(c)) return;
    t.set(c, meta && typeof meta === 'object' ? { ...meta, uid: c.uid } : null);
    this.presence(topic);
  }
  bc(c, topic, ev, p) {
    const t = this.topics.get(topic);
    if (!t || !t.has(c) || !ev) return;
    for (const o of t.keys()) if (o !== c) this.send(o, { t: 'bc', topic, ev, p });
  }
  presence(topic) {
    const t = this.topics.get(topic);
    if (!t) return;
    const metas = [...t.values()].filter(Boolean);
    for (const o of t.keys()) this.send(o, { t: 'pres', topic, metas });
  }
  // oyuncunun partisi: üyesi olduğu (izlenen) 'ahen-party-…' kanalı
  partyOf(uid) {
    const c = this.byUid.get(uid);
    if (!c) return null;
    for (const topic of c.topics) if (topic.startsWith('ahen-party-') && this.topics.get(topic)?.get(c)) return topic;
    return null;
  }

  broadcastCount() {
    const n = this.byUid.size;
    for (const c of this.conns) if (c.uid) this.send(c, { t: 'count', n });
  }

  // ---------------------------------------------------------------- döngü
  tick() {
    const now = Date.now();
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    for (const [id, z] of this.zones) {
      if (!z.players.size && now - z.emptySince > ZONE_TTL_MS) { this.zones.delete(id); continue; }
      z.tick(dt);
    }
  }

  heartbeat() {
    for (const c of this.conns) {
      if (!c.alive) { c.ws.terminate?.(); this.detach(c); continue; }
      c.alive = false;
      try { c.ws.ping(); } catch { /* */ }
    }
  }

  stats() {
    return { players: this.byUid.size, zones: [...this.zones.entries()].map(([id, z]) => ({ id, players: z.players.size, enemies: z.enemies.length })) };
  }
}

// Supabase oturum belirteci doğrulama: /auth/v1/user (belirteç geçerliyse kullanıcıyı döner). Sonuç 5 dk önbellekte.
export function supabaseVerifier(url, key, fetchImpl = fetch) {
  const cache = new Map();
  return async (token) => {
    if (!token) return null;
    const hit = cache.get(token);
    if (hit && hit.until > Date.now()) return hit.who;
    const r = await fetchImpl(url.replace(/\/+$/, '') + '/auth/v1/user', { headers: { apikey: key, Authorization: `Bearer ${token}` } });
    if (!r.ok) return null;
    const u = await r.json();
    const who = u?.id ? { uid: u.id, email: u.email } : null;
    if (who) cache.set(token, { who, until: Date.now() + 5 * 60 * 1000 });
    if (cache.size > 2000) cache.clear();
    return who;
  };
}
