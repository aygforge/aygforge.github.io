// Ortak dünya oyun sunucusu bağlantısı (4.4.0). Ayar: online.json → "gameServer": "wss://…" (ya da Sunucu ayarı).
// Giriş yapmış oyuncu oyuna girince bağlanır; açık dünya haritalarında yaratıklar sunucudan gelir (herkes aynısını görür),
// dungeon'lar ve kişisel görev olayları yerelde kalır. Sunucuya ulaşılamazsa oyun tek oyunculu devam eder.
// Mesaj biçimi: server/hub.mjs başındaki açıklama.
import { app } from '../core/app.js';
import { bus } from '../core/events.js';
import { GAME_VERSION } from '../data/constants.js';
import { MAPS } from '../data/maps/index.js';
import { online } from './index.js';
import { getRun } from '../systems/dungeon.js';

const LOCAL_KEY = 'ahen_game_server';
const POS_MS = 125;              // en sık konum gönderimi (8 Hz)
const KEEP_MS = 2000;            // durunca yoklama
const MENU_CLOSE_MS = 120000;    // menüde 2 dk kalınca bağlantı kapanır

function lsGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* */ } }
const toast = (text, kind = 'info') => bus.emit('toast', { text, kind });

export function wsUrl(u) {
  if (!u) return null;
  let s = String(u).trim().replace(/\/+$/, '');
  if (/^https?:/i.test(s)) s = s.replace(/^http/i, 'ws');
  if (!/^wss?:\/\//i.test(s)) return null;
  return /\/ws$/.test(s) ? s : s + '/ws';
}

export const net = {
  ws: null, status: 'off',        // off | connecting | ready | error
  uid: null, count: 0, err: null, fatal: false,
  zoneMap: null,                  // sunucunun bizi koyduğu bölge
  retry: 0, retryTimer: null, menuSince: 0,
  lastPos: null, lastPosAt: 0,
  subs: new Map(),                // topic → { onBroadcast, onPresence, onStatus, meta }
  WebSocketImpl: typeof WebSocket !== 'undefined' ? WebSocket : null,

  get url() { return wsUrl(lsGet(LOCAL_KEY) || online.cfg?.gameServer || ''); },
  get configured() { return !!this.url; },
  get ready() { return this.status === 'ready'; },
  setLocalUrl(u) { lsSet(LOCAL_KEY, u ? String(u).trim() : null); this.disconnect(); this.sync(); bus.emit('net'); },
  localUrl() { return lsGet(LOCAL_KEY) || ''; },

  init() {
    bus.on('mapEnter', () => { this.sync(); this.enterCurrent(); });
    bus.on('online', () => this.sync());
    setInterval(() => this.loop(), POS_MS);
  },

  // giriş + oyunda + ayarlıysa bağlan; çıkış yapınca kapat
  sync() {
    if (!this.configured || !online.loggedIn) { if (this.ws) this.disconnect(); return; }
    if (app.world && !this.ws && !this.retryTimer && !this.fatal) this.connect();
  },

  connect() {
    if (!this.WebSocketImpl || this.ws) return;
    this.status = 'connecting'; this.err = null;
    bus.emit('net');
    let ws;
    try { ws = new this.WebSocketImpl(this.url); } catch { this.onClose(); return; }
    this.ws = ws;
    ws.onopen = async () => {
      await online.api?.ensureFresh?.();
      this.send({ t: 'hello', token: online.api?.session?.access_token || '', v: GAME_VERSION, nick: this.nick() });
    };
    ws.onmessage = (ev) => { let m; try { m = JSON.parse(ev.data); } catch { return; } this.onMessage(m); };
    ws.onclose = () => { if (this.ws === ws) this.onClose(); };
    ws.onerror = () => {};
  },

  disconnect() {
    clearTimeout(this.retryTimer); this.retryTimer = null;
    const ws = this.ws;
    this.ws = null;
    if (ws) { try { ws.close(); } catch { /* */ } }
    this.setStatus('off');
  },

  onClose() {
    this.ws = null;
    const wasReady = this.ready;
    this.setStatus(this.fatal ? 'error' : 'connecting');
    if (wasReady) toast('Oyun sunucusu bağlantısı koptu — tek oyunculu devam ediliyor, yeniden bağlanılıyor…', 'warn');
    if (this.fatal || !this.configured || !online.loggedIn) return;
    const wait = Math.min(30000, 2000 * 2 ** Math.min(4, this.retry++));
    this.retryTimer = setTimeout(() => { this.retryTimer = null; this.sync(); }, wait);
  },

  setStatus(s) {
    const was = this.status;
    this.status = s;
    if (s !== 'ready') { this.onTrade?.({ op: 'cancel', msg: 'Sunucu bağlantısı koptu — ticaret iptal' }); this.zoneMap = null; app.world?.netWorld?.detach(); for (const sub of this.subs.values()) sub.onStatus?.('joining'); }
    if (was !== s) bus.emit('net');
  },

  nick() {
    const u = online.api?.user;
    return (online.nickname || u?.nickname || (u?.email || 'oyuncu').split('@')[0]).slice(0, 16);
  },

  send(m) {
    if (this.ws?.readyState !== 1) return false;
    try { this.ws.send(JSON.stringify(m)); return true; } catch { return false; }
  },

  // ---------------------------------------------------------------- gelen mesajlar
  onMessage(m) {
    switch (m.t) {
      case 'welcome':
        this.uid = m.uid; this.count = m.n || 1; this.retry = 0; this.fatal = false;
        this.status = 'ready';
        bus.emit('net');
        toast('Oyun sunucusuna bağlandın — ortak dünya', 'ok');
        for (const [topic, sub] of this.subs) { this.send({ t: 'sub', topic }); if (sub.meta) this.send({ t: 'track', topic, meta: sub.meta }); }
        this.enterCurrent();
        return;
      case 'err':
        this.err = m.msg;
        if (m.code === 'version' || m.code === 'dup') this.fatal = true;
        toast(m.msg, 'warn');
        bus.emit('net');
        return;
      case 'count': this.count = m.n; bus.emit('net'); return;
      case 'zone': this.zoneMap = m.map; app.world?.netWorld?.attach(m); return;
      case 'snap': app.world?.netWorld?.snap(m); return;
      case 'evs': app.world?.netWorld?.events(m.l); return;
      case 'subbed': this.subs.get(m.topic)?.onStatus?.('ok'); return;
      case 'bc': this.subs.get(m.topic)?.onBroadcast?.(m.ev, m.p || {}); return;
      case 'pres': this.subs.get(m.topic)?.onPresence?.(m.metas || []); return;
      case 'trade': this.onTrade?.(m); return;
      default: return;
    }
  },

  // bulunduğun haritayı sunucuya bildir (dungeon / menü: bölgeden çık)
  enterCurrent() {
    if (!this.ready) return;
    const w = app.world;
    const shared = w && MAPS[w.mapId];
    const st = this.state();
    this.lastPos = st; this.lastPosAt = Date.now();
    // dungeon: parti örneğine gir; örnek yoksa benim koşu durumumla kurulur
    const run = w?.mapDef?.dungeon ? getRun(app.char, w.mapId) : null;
    this.send({ t: 'enter', map: shared && st ? w.mapId : null, ...(st || {}), ...(run ? { run: { cleared: run.cleared, seals: run.seals || [], bossKilled: !!run.bossKilled } } : {}) });
  },

  state() {
    const w = app.world, p = w?.player, ch = app.char;
    if (!p || !ch || w.changing) return null;
    const st = app.stats();
    return {
      x: Math.round(p.x), y: Math.round(p.y), f: p.facing < 0 ? -1 : 1, mv: p.moving ? 1 : 0,
      hp: Math.round(Math.max(0, Math.min(1, ch.hp / st.maxHp)) * 100), d: p.dead ? 1 : 0, a: p.busy > 0 && !p.dead ? 1 : 0,
      lv: ch.level, cls: ch.cls, n: ch.name,
    };
  },

  loop() {
    if (!this.ws) {
      if (this.configured && online.loggedIn && app.world && !this.retryTimer && !this.fatal) this.connect();
      return;
    }
    if (!app.world) {
      if (!this.menuSince) { this.menuSince = Date.now(); if (this.ready) this.send({ t: 'enter', map: null }); }
      else if (Date.now() - this.menuSince > MENU_CLOSE_MS) this.disconnect();
      return;
    }
    if (this.menuSince) { this.menuSince = 0; this.enterCurrent(); }
    if (!this.ready || !this.zoneMap || document.hidden) return;
    const st = this.state();
    if (!st) return;
    const prev = this.lastPos, now = Date.now();
    const changed = !prev || Math.abs(st.x - prev.x) + Math.abs(st.y - prev.y) >= 1 || st.d !== prev.d || st.a !== prev.a || st.mv !== prev.mv || st.f !== prev.f || st.lv !== prev.lv || Math.abs(st.hp - prev.hp) >= 3;
    if (changed || now - this.lastPosAt > KEEP_MS) {
      this.send({ t: 'pos', ...st });
      this.lastPos = st; this.lastPosAt = now;
    }
  },

  // ---------------------------------------------------------------- dünyaya etkiler
  hit(id, dmg) { this.send({ t: 'hit', e: id, dmg: Math.round(dmg) }); },
  effect(id, s) { this.send({ t: 'st', e: id, ...s }); },
  seal(id) { this.send({ t: 'dg', op: 'seal', id }); },
  questEvent(id) { this.send({ t: 'qe', id }); },
  hunts(list) { this.send({ t: 'hunts', list }); },
};

// Parti ve davet kanalları için taşıma (src/online/realtime.js ile aynı arayüz) — sunucu varken Supabase Realtime kullanılmaz
export function createServerTransport() {
  return {
    join(topic, { onBroadcast, onPresence, onStatus } = {}) {
      const sub = { onBroadcast, onPresence, onStatus: (s) => { sub.ok = s === 'ok'; onStatus?.(s); }, meta: null, ok: false };
      net.subs.set(topic, sub);
      sub.onStatus('joining');
      if (net.ready) net.send({ t: 'sub', topic });
      return {
        get ok() { return sub.ok && net.ready; },
        send(event, payload) { return sub.ok && net.send({ t: 'bc', topic, ev: event, p: payload }); },
        track(meta) { sub.meta = meta; return sub.ok && net.send({ t: 'track', topic, meta }); },
        leave() { sub.ok = false; if (net.subs.get(topic) === sub) net.subs.delete(topic); net.send({ t: 'unsub', topic }); },
      };
    },
  };
}
