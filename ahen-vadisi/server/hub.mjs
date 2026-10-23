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
//   {t:'trade', op, ...}                   ticaret: req/ans/offer/lock/confirm/ready/cancel (aşağıda)
// Sunucu → istemci: welcome, err, zone, snap, evs (olay listesi: tg, fx, tx, hz, sh, pj, a, eh, die, kill, note),
//   bc (kanal yayını), pres (kanal üyeleri), count (çevrimiçi sayısı)
import { Zone, isSharedMap, isDungeonMap } from './sim/zone.mjs';
import { bossStage } from '../src/systems/dungeon.js';

const runIsComplete = (run, map) => !!run && (!!run.bossKilled || (Array.isArray(run.cleared) && run.cleared.includes(bossStage(map))));
import { GAME_VERSION } from '../src/data/constants.js';
import { sanitizeOffer, emptyOffer } from '../src/systems/trade.js';

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
    this.trades = new Map();      // id → oturum
    this.tradeInv = new Map();    // hedef uid → { from, at }
    this.tradeN = 0;
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
    if (c.uid) for (const tr of [...this.trades.values()]) if (tr.a === c.uid || tr.b === c.uid) this.endTrade(tr, 'Karşı taraf bağlantıyı kaybetti — ticaret iptal');
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
      case 'trade': return this.trade(c, m);
      case 'dg': if (m.op === 'seal') c.zone?.onSeal?.(c.uid, str(m.id, 40)); return;
      case 'qe': c.zone?.onEvent?.(c.uid, str(m.id, 40)); return;
      case 'hunts': c.zone?.onHunts?.(c.uid, m.list); return;
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
    if (!map || !(isSharedMap(map) || isDungeonMap(map))) return;
    // dungeon: parti başına ayrı örnek (partisiz oyuncunun kendi örneği); açık dünya: herkese tek bölge
    const key = isDungeonMap(map) ? `${map}@${this.partyOf(c.uid) || 'solo:' + c.uid}` : map;
    let z = this.zones.get(key);
    // biten dungeon örneği (boss öldü) + yeni koşuyla giren oyuncu → örnek baştan kurulur (boss yeniden doğar).
    // Aksi halde oyuncu bitmiş örneğe düşer, boss hiç doğmaz ve "boss'u yen" görevi takılı kalır.
    if (z?.dg && z.dgComplete() && !runIsComplete(m.run, map)) {
      if (!z.players.size) { this.zones.delete(key); z = null; }
      else z.resetDungeon(m.run);
    }
    if (!z) {
      z = new Zone(map, { key, run: m.run, out: (uid, msg) => this.sendUid(uid, msg), partyOf: (uid) => this.partyOf(uid) });
      this.zones.set(key, z);
    }
    c.zone = z;
    z.join(c.uid, { ...m, nick: c.nick });
  }

  leaveZone(c) {
    if (!c.zone) return;
    const z = c.zone;
    z.leave(c.uid); c.zone = null;
    // biten ve boşalan dungeon örneği hemen kapanır (sonraki giriş yeni koşu)
    if (z.dg && !z.players.size && z.dgComplete()) for (const [k, v] of this.zones) if (v === z) this.zones.delete(k);
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

  // ---------------------------------------------------------------- ticaret (aracı)
  // Akış: req → (karşı taraf) ans → open → offer/lock (her değişiklik kilitleri ve onayları sıfırlar) →
  //   iki taraf da kilitli + onay → prep (her istemci "verebilir miyim, sığar mı" der) → ikisi de hazır → exec
  //   (her istemci kendi tarafını hep-ya-hiç uygular ve hemen kaydeder). İptal/kopma her aşamada iki tarafa bildirilir.
  tradeOf(uid) { for (const tr of this.trades.values()) if (tr.a === uid || tr.b === uid) return tr; return null; }
  tradeMsg(uid, msg) { this.sendUid(uid, { t: 'trade', ...msg }); }
  tradeState(tr) {
    for (const [me, them] of [[tr.a, tr.b], [tr.b, tr.a]]) {
      this.tradeMsg(me, { op: 'state', id: tr.id, mine: tr.offer[me], theirs: tr.offer[them], lock: { me: !!tr.lock[me], them: !!tr.lock[them] }, conf: { me: !!tr.conf[me], them: !!tr.conf[them] } });
    }
  }
  endTrade(tr, msg) {
    this.trades.delete(tr.id);
    for (const uid of [tr.a, tr.b]) this.tradeMsg(uid, { op: 'cancel', id: tr.id, msg });
  }

  trade(c, m) {
    const me = c.uid, op = str(m.op, 12);
    if (op === 'req') {
      const to = str(m.to, 64);
      const tc = this.byUid.get(to);
      if (!tc || to === me) return this.tradeMsg(me, { op: 'err', msg: 'Oyuncu oyun sunucusunda değil' });
      if (this.tradeOf(me) || this.tradeOf(to)) return this.tradeMsg(me, { op: 'err', msg: 'Oyunculardan biri zaten ticarette' });
      this.tradeInv.set(to, { from: me, at: Date.now() });
      this.tradeMsg(to, { op: 'req', from: me, nick: c.nick });
      this.tradeMsg(me, { op: 'sent', to, nick: tc.nick });
      return;
    }
    if (op === 'ans') {
      const inv = this.tradeInv.get(me);
      const from = str(m.from, 64);
      if (!inv || inv.from !== from || Date.now() - inv.at > 60000) return this.tradeMsg(me, { op: 'err', msg: 'Ticaret isteğinin süresi doldu' });
      this.tradeInv.delete(me);
      const fc = this.byUid.get(from);
      if (!fc) return this.tradeMsg(me, { op: 'err', msg: 'Oyuncu artık çevrimiçi değil' });
      if (!m.ok) return this.tradeMsg(from, { op: 'declined', nick: c.nick });
      if (this.tradeOf(me) || this.tradeOf(from)) return this.tradeMsg(me, { op: 'err', msg: 'Oyunculardan biri zaten ticarette' });
      const tr = { id: 'tr' + (++this.tradeN) + '_' + Date.now().toString(36), a: from, b: me, offer: { [from]: emptyOffer(), [me]: emptyOffer() }, lock: {}, conf: {}, ready: {}, phase: 'open' };
      this.trades.set(tr.id, tr);
      this.tradeMsg(from, { op: 'open', id: tr.id, with: { uid: me, nick: c.nick } });
      this.tradeMsg(me, { op: 'open', id: tr.id, with: { uid: from, nick: fc.nick } });
      this.tradeState(tr);
      return;
    }
    const tr = this.trades.get(str(m.id, 40));
    if (!tr || (tr.a !== me && tr.b !== me)) return;
    const other = tr.a === me ? tr.b : tr.a;
    if (op === 'cancel') return this.endTrade(tr, m.msg ? str(m.msg, 120) : `${c.nick} ticareti iptal etti`);
    if (op === 'offer' && tr.phase === 'open') {
      tr.offer[me] = sanitizeOffer(m.offer);
      tr.lock = {}; tr.conf = {};
      return this.tradeState(tr);
    }
    if (op === 'lock' && tr.phase === 'open') { tr.lock[me] = !!m.on; if (!m.on) tr.conf = {}; return this.tradeState(tr); }
    if (op === 'confirm' && tr.phase === 'open') {
      if (!tr.lock[me] || !tr.lock[other]) return;
      tr.conf[me] = true;
      this.tradeState(tr);
      if (tr.conf[other]) {
        tr.phase = 'prep';
        for (const [x, y] of [[tr.a, tr.b], [tr.b, tr.a]]) this.tradeMsg(x, { op: 'prep', id: tr.id, give: tr.offer[x], get: tr.offer[y] });
      }
      return;
    }
    if (op === 'ready' && tr.phase === 'prep') {
      if (!m.ok) return this.endTrade(tr, `Ticaret yapılamadı: ${str(m.msg, 100) || 'hazır değil'}`);
      tr.ready[me] = true;
      if (tr.ready[other]) {
        this.trades.delete(tr.id);
        for (const [x, y] of [[tr.a, tr.b], [tr.b, tr.a]]) this.tradeMsg(x, { op: 'exec', id: tr.id, give: tr.offer[x], get: tr.offer[y] });
        this.log('ticaret', tr.id, tr.a, '↔', tr.b);
      }
    }
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
    return { players: this.byUid.size, zones: [...this.zones.entries()].map(([id, z]) => ({ id: id.replace(/@.*/, '@örnek'), players: z.players.size, enemies: z.enemies.length })) };
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
