// Parti çekirdeği (Faz 1): üyelik (Realtime presence), konum/durum paylaşımı (broadcast), parti sohbeti, davetler.
// Oyun motorundan bağımsızdır: taşıma katmanı (realtime.js ya da testlerde sahtesi) ve saat dışarıdan verilir.
// Herkes kendi dünyasında oynar; arkadaşlar haritada "görünür" ama savaşa/ganimete etki etmez (Faz 3).
//
// Mesaj bütçesi (Supabase ücretsiz katman: ayda 2 milyon mesaj; her yayın = 1 gönderim + alıcı sayısı kadar):
// konum yalnız hareket ederken ve aynı haritada başka üye varken en sık SEND_MS'de bir gider; durunca bir son konum,
// boşta yalnız KEEPALIVE_MS'de bir yoklama. Böylece iki kişilik bir parti saatte yaklaşık 15–30 bin mesaj harcar.

export const PARTY_MAX = 4;
export const SEND_MS = 400;
export const KEEPALIVE_MS = 15000;
export const STALE_MS = 45000;
export const CHAT_MAX = 120;
const CODE_ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function newPartyCode(rand = Math.random) {
  let s = '';
  for (let i = 0; i < 6; i++) s += CODE_ABC[Math.floor(rand() * CODE_ABC.length)];
  return s;
}

export function normCode(s) {
  const c = String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return /^[A-HJ-NP-Z2-9]{6}$/.test(c) ? c : null;
}

const str = (v, n) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, n) : '');
const num = (v, lo, hi, d = 0) => (Number.isFinite(+v) ? Math.max(lo, Math.min(hi, +v)) : d);
const CLS = ['warrior', 'mage', 'archer', 'necromancer'];

// Başka oyunculardan gelen veri güvenilmez: biçim ve sınırlar burada zorlanır
export function sanitizeState(p) {
  if (!p || typeof p !== 'object') return null;
  const u = str(p.u, 64);
  if (!u) return null;
  return {
    u, m: str(p.m, 40), x: num(p.x, 0, 1e5), y: num(p.y, 0, 1e5), f: p.f < 0 ? -1 : 1, mv: p.mv ? 1 : 0,
    hp: num(p.hp, 0, 100, 100), lv: Math.round(num(p.lv, 1, 50, 1)), n: str(p.n, 16), cls: CLS.includes(p.cls) ? p.cls : 'warrior',
    nick: str(p.nick, 16), d: p.d ? 1 : 0, a: p.a ? 1 : 0, dg: p.dg ? 1 : 0,
  };
}

export function sanitizeChat(t) {
  return str(String(t ?? ''), CHAT_MAX).replace(/\s+/g, ' ').trim();
}

// presence listesi → katılma sırasına göre (ilk gelen lider); en çok PARTY_MAX kişi partide sayılır
export function orderMembers(metas) {
  const seen = new Set();
  return metas.filter((m) => m && m.uid && !seen.has(m.uid) && seen.add(m.uid))
    .map((m) => ({ uid: str(m.uid, 64), nick: str(m.nick, 16), joinedAt: num(m.joinedAt, 0, 1e15) }))
    .sort((a, b) => a.joinedAt - b.joinedAt || (a.uid < b.uid ? -1 : 1));
}

export class Party {
  // me(): { uid, nick } — giriş yapmış oyuncu. onChange(kind): arayüz yenilemesi. onEvent(ev): bildirimler
  constructor({ transport, me, now = () => Date.now(), onChange = () => {}, onEvent = () => {} }) {
    this.t = transport; this.me = me; this.now = now;
    this.onChange = onChange; this.onEvent = onEvent;
    this.reset();
  }

  reset() {
    this.code = null; this.status = 'none'; this.ch = null;
    this.presence = [];            // sıralı üyeler (presence)
    this.states = new Map();       // uid → son durum + alınma zamanı
    this.chat = [];
    this.last = null; this.lastSentAt = 0; this.forceNext = false; this.lastChatAt = 0;
    this.joinedAt = 0;
  }

  get inParty() { return !!this.code; }
  get leaderUid() { return this.presence[0]?.uid || null; }

  // Partideki herkes (ben dahil) — presence ile durum birleştirilir. Presence gecikirse taze durumu olan da sayılır.
  get members() {
    const now = this.now(), me = this.me();
    const out = [];
    const add = (uid, nick) => {
      if (out.some((m) => m.uid === uid)) return;
      const s = this.states.get(uid);
      out.push({ uid, nick: nick || s?.nick || '?', self: uid === me?.uid, leader: uid === this.leaderUid, st: s || null, fresh: !!s && now - s.at < STALE_MS });
    };
    this.presence.slice(0, PARTY_MAX).forEach((p) => add(p.uid, p.nick));
    for (const [uid, s] of this.states) if (now - s.at < STALE_MS && out.length < PARTY_MAX) add(uid, s.nick);
    if (me && this.inParty) add(me.uid, me.nick);
    return out;
  }

  others() { return this.members.filter((m) => !m.self); }

  create() { return this.join(newPartyCode()); }

  join(rawCode) {
    const code = normCode(rawCode);
    const me = this.me();
    if (!code) return { ok: false, msg: 'Geçersiz parti kodu (6 karakter)' };
    if (!me) return { ok: false, msg: 'Parti için çevrimiçi giriş gerekli' };
    if (this.code === code) return { ok: true };
    if (this.code) this.leave(true);
    this.code = code; this.status = 'joining'; this.joinedAt = this.now();
    this.ch = this.t.join('ahen-party-' + code, {
      presenceKey: me.uid,
      onStatus: (s) => {
        if (this.code !== code) return;
        if (s === 'ok') {
          const m = this.me();
          this.ch.track({ uid: m.uid, nick: m.nick, joinedAt: this.joinedAt });
          this.forceNext = true;
          if (this.status !== 'in') this.onEvent({ type: 'joined', code });
          this.status = 'in';
        } else if (s === 'error') this.status = 'error';
        else if (s === 'joining' && this.status === 'in') this.status = 'joining';
        this.onChange('status');
      },
      onPresence: (metas) => this.onPresence(metas),
      onBroadcast: (ev, p) => this.onBroadcast(ev, p),
    });
    this.onChange('status');
    return { ok: true, code };
  }

  leave(silent = false) {
    if (!this.code) return;
    if (this.ch?.ok) this.ch.send('bye', { u: this.me()?.uid });
    this.ch?.leave();
    const code = this.code;
    this.reset();
    if (!silent) this.onEvent({ type: 'left', code });
    this.onChange('status');
  }

  onPresence(metas) {
    const me = this.me();
    const before = new Set(this.presence.map((p) => p.uid));
    this.presence = orderMembers(metas);
    // parti doluysa sonradan gelen (ben) ayrılır
    const idx = this.presence.findIndex((p) => p.uid === me?.uid);
    if (idx >= PARTY_MAX) { this.onEvent({ type: 'full' }); this.leave(true); return; }
    for (const p of this.presence) {
      if (!before.has(p.uid) && p.uid !== me?.uid) { this.forceNext = true; if (before.size) this.onEvent({ type: 'member-join', nick: p.nick }); }
    }
    const now = new Set(this.presence.map((p) => p.uid));
    for (const uid of before) {
      if (!now.has(uid) && uid !== me?.uid) {
        const s = this.states.get(uid);
        this.states.delete(uid);
        this.onEvent({ type: 'member-leave', nick: s?.nick || this.nickOf(uid) });
      }
    }
    this.onChange('members');
  }

  nickOf(uid) { return this.states.get(uid)?.nick || this.presence.find((p) => p.uid === uid)?.nick || '?'; }

  onBroadcast(ev, p) {
    const me = this.me();
    if (ev === 'st') {
      const s = sanitizeState(p);
      if (!s || s.u === me?.uid) return;
      const prev = this.states.get(s.u);
      this.states.set(s.u, { ...s, at: this.now() });
      if (!prev) this.forceNext = true;     // yeni gelen beni de hemen görsün
      if (prev && prev.m !== s.m) this.onEvent({ type: 'member-map', nick: s.nick, map: s.m, uid: s.u });
      this.onChange('state');
    } else if (ev === 'chat') {
      const text = sanitizeChat(p.t);
      const u = str(p.u, 64);
      if (!text || !u || u === me?.uid) return;
      this.pushChat({ uid: u, nick: str(p.nick, 16) || this.nickOf(u), text, at: this.now() });
    } else if (ev === 'bye') {
      const u = str(p.u, 64);
      if (!u || u === me?.uid) return;
      const nick = this.nickOf(u);
      this.states.delete(u);
      this.presence = this.presence.filter((x) => x.uid !== u);
      this.onEvent({ type: 'member-leave', nick });
      this.onChange('members');
    }
  }

  pushChat(msg) {
    this.chat.push(msg);
    if (this.chat.length > 50) this.chat.shift();
    this.onEvent({ type: 'chat', ...msg });
    this.onChange('chat');
  }

  sendChat(text) {
    const t = sanitizeChat(text);
    const me = this.me();
    if (!t) return { ok: false, msg: 'Boş mesaj' };
    if (!this.ch?.ok) return { ok: false, msg: 'Parti bağlantısı yok' };
    if (this.now() - this.lastChatAt < 700) return { ok: false, msg: 'Biraz yavaş' };
    this.lastChatAt = this.now();
    this.ch.send('chat', { u: me.uid, nick: me.nick, t });
    this.pushChat({ uid: me.uid, nick: me.nick, text: t, at: this.now(), self: true });
    return { ok: true };
  }

  // Oyundan düzenli çağrılır (≈10 Hz) — ne zaman gönderileceğine burada karar verilir. Gönderildiyse true.
  tick(st) {
    if (!this.ch?.ok || !st) return false;
    const me = this.me();
    const now = this.now();
    const cur = { ...st, u: me.uid, nick: me.nick };
    const prev = this.last;
    const since = now - this.lastSentAt;
    const sameMapFriend = this.others().some((m) => m.fresh && m.st.m === cur.m);
    let send = this.forceNext || !prev || since >= KEEPALIVE_MS;
    if (!send && prev) {
      if (prev.m !== cur.m || prev.d !== cur.d || prev.lv !== cur.lv || prev.dg !== cur.dg) send = true;
      else if (sameMapFriend) {
        const movedPx = Math.hypot(cur.x - prev.x, cur.y - prev.y);
        if (movedPx >= 2 && since >= SEND_MS) send = true;                  // hareket
        else if (prev.mv && !cur.mv && movedPx >= 1) send = true;          // durdu: son konum
        else if (cur.a && !prev.a && since >= SEND_MS / 2) send = true;     // saldırı animasyonu
        else if (Math.abs(cur.hp - prev.hp) >= 10 && since >= 1000) send = true;
      } else if (Math.abs(cur.hp - prev.hp) >= 25 && since >= 3000) send = true;
    }
    if (!send) return false;
    this.ch.send('st', cur);
    this.last = cur; this.lastSentAt = now; this.forceNext = false;
    return true;
  }
}

// Davet kanalı: giriş yapmış ve oyundaki herkes dinler; mesaj yalnız "to" kişisine aittir.
export class Lobby {
  constructor({ transport, me, onInvite = () => {}, onReply = () => {} }) {
    this.t = transport; this.me = me; this.onInvite = onInvite; this.onReply = onReply;
    this.ch = null; this.lastInv = new Map();
  }

  get on() { return !!this.ch; }

  start() {
    if (this.ch) return;
    this.ch = this.t.join('ahen-lobby', {
      onBroadcast: (ev, p) => {
        const me = this.me();
        if (!me || !p || p.to !== me.uid) return;
        const from = str(p.from, 64), nick = str(p.nick, 16);
        if (ev === 'inv') { const code = normCode(p.code); if (code && from) this.onInvite({ from, nick, code }); }
        else if (ev === 'inv-r') this.onReply({ from, nick, ok: !!p.ok });
      },
    });
  }

  stop() { this.ch?.leave(); this.ch = null; }

  invite(toUid, code) {
    const me = this.me();
    if (!this.ch?.ok) return { ok: false, msg: 'Davet bağlantısı hazır değil, birazdan tekrar dene' };
    if (!toUid || toUid === me.uid) return { ok: false, msg: 'Geçersiz oyuncu' };
    if (Date.now() - (this.lastInv.get(toUid) || 0) < 5000) return { ok: false, msg: 'Davet zaten gönderildi' };
    this.lastInv.set(toUid, Date.now());
    this.ch.send('inv', { to: toUid, from: me.uid, nick: me.nick, code });
    return { ok: true };
  }

  reply(toUid, ok) {
    const me = this.me();
    if (this.ch?.ok && me) this.ch.send('inv-r', { to: toUid, from: me.uid, nick: me.nick, ok: !!ok });
  }
}
