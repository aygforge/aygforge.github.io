// Parti ↔ oyun bağlantısı: durum gönderimi, harita değişimi, arkadaşın yanına gitme, lideri takip, davetler,
// sayfa yenilemede partiye geri dönme. Arayüz: src/ui/panels/party.js, haritadaki arkadaşlar: src/world/remotePlayers.js.
import { app } from '../core/app.js';
import { bus } from '../core/events.js';
import { MAPS, WAYSTONES } from '../data/maps/index.js';
import { TILE } from '../data/constants.js';
import { online } from './index.js';
import { Party, Lobby } from './party.js';
import { createRealtimeTransport } from './realtime.js';
import { net, createServerTransport } from './gameServer.js';
import { isDungeonUnlocked } from '../systems/dungeon.js';

const KEY = 'ahen_party';
const REJOIN_MS = 30 * 60 * 1000;     // yenileme / menüye dönüşten sonra 30 dk içinde aynı partiye kendiliğinden dön
const FOLLOW_KEY = 'ahen_party_follow';

function lsGet(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } }
function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch { /* */ } }
const toast = (text, kind = 'info') => bus.emit('toast', { text, kind });
export const mapName = (id) => MAPS[id]?.name || id || '—';

export const partyGame = {
  party: null, lobby: null, api: null, transport: null,
  invites: [],          // bekleyen davetler { from, nick, code, at }
  follow: false,
  // ortak dünya sunucusu ayarlıysa parti/davet onun üzerinden (Supabase Realtime mesaj kotası harcanmaz)
  transportFactory: (api) => (net.configured ? createServerTransport() : createRealtimeTransport(api)),

  me() {
    const u = online.loggedIn ? online.api?.user : null;
    return u ? { uid: u.id, nick: (online.nickname || u.nickname || (u.email || 'oyuncu').split('@')[0]).slice(0, 16) } : null;
  },

  init() {
    this.follow = lsGet(FOLLOW_KEY) === true;
    setInterval(() => this.loop(), 100);
    bus.on('mapEnter', () => { this.syncLife(); this.party?.tick(this.stateNow()); });
    bus.on('online', () => this.syncLife());
  },

  // giriş/çıkış ve dünyaya giriş/çıkışa göre bağlantıları aç/kapat
  syncLife() {
    const inWorld = !!app.world?.player && !!app.char;
    if (!online.loggedIn) { if (this.party?.inParty) this.party.leave(true); this.lobby?.stop(); this.dropClients(); lsSet(KEY, null); return; }
    if (!this.ensure()) return;
    if (inWorld) {
      this.lobby.start();
      const saved = lsGet(KEY);
      if (!this.party.inParty && saved?.code && Date.now() - saved.at < REJOIN_MS) this.party.join(saved.code);
    }
  },

  ensure() {
    if (!online.loggedIn) return false;
    if (this.api === online.api && this.party) return true;
    this.dropClients();
    this.api = online.api;
    this.transport = this.transportFactory(online.api);
    this.party = new Party({
      transport: this.transport, me: () => this.me(),
      onChange: (k) => bus.emit('party', k),
      onEvent: (e) => this.onEvent(e),
    });
    this.lobby = new Lobby({
      transport: this.transport, me: () => this.me(),
      onInvite: (inv) => {
        if (this.party.code === inv.code) return;
        this.invites = this.invites.filter((x) => x.from !== inv.from).concat({ ...inv, at: Date.now() });
        bus.emit('partyInvite', inv);
        bus.emit('party', 'invite');
      },
      onReply: (r) => toast(r.ok ? `${r.nick} partiye katılıyor` : `${r.nick} daveti reddetti`, r.ok ? 'ok' : 'info'),
    });
    return true;
  },

  dropClients() {
    this.party?.leave(true); this.lobby?.stop();
    this.party = null; this.lobby = null; this.api = null; this.transport = null;
    bus.emit('party', 'status');
  },

  onEvent(e) {
    if (e.type === 'joined') { lsSet(KEY, { code: e.code, at: Date.now() }); toast(`Partidesin — kod: ${e.code}`, 'ok'); }
    else if (e.type === 'left') { lsSet(KEY, null); toast('Partiden ayrıldın'); }
    else if (e.type === 'full') { lsSet(KEY, null); toast('Parti dolu (en çok 4 kişi)', 'warn'); }
    else if (e.type === 'member-join') toast(`${e.nick} partiye katıldı`, 'ok');
    else if (e.type === 'member-leave') toast(`${e.nick} partiden ayrıldı`);
    else if (e.type === 'member-map') {
      if (app.world) toast(`${e.nick} → ${mapName(e.map)}`);
      if (this.follow && e.uid === this.party.leaderUid && e.uid !== this.me()?.uid) {
        const m = this.party.others().find((x) => x.uid === e.uid);
        setTimeout(() => { if (m && this.canGoTo(m).ok) this.goTo(m); }, 1200);
      }
    } else if (e.type === 'chat') bus.emit('partyChat', e);
  },

  stateNow() {
    const w = app.world, p = w?.player, ch = app.char;
    if (!p || !ch || w.changing) return null;
    const st = app.stats();
    return {
      m: w.mapId, x: Math.round(p.x), y: Math.round(p.y), f: p.facing < 0 ? -1 : 1, mv: p.moving ? 1 : 0,
      hp: Math.round(Math.max(0, Math.min(1, ch.hp / st.maxHp)) * 100), lv: ch.level, n: ch.name, cls: ch.cls,
      d: p.dead ? 1 : 0, a: p.busy > 0 && !p.dead ? 1 : 0, dg: w.mapDef.dungeon ? 1 : 0,
    };
  },

  loop() {
    const p = this.party;
    if (!app.world && this.lobby?.on) this.lobby.stop();   // menüde davet dinlenmez (oyuna girince yeniden açılır)
    if (!p?.inParty) return;
    if (!app.world) {
      // menüye dönüldü: kanaldan çık ama kodu hatırla (oyuna dönünce kendiliğinden geri katılır)
      const code = p.code;
      p.leave(true);
      lsSet(KEY, { code, at: Date.now() });
      return;
    }
    if (document.hidden) return;
    if (p.tick(this.stateNow())) {
      const saved = lsGet(KEY);
      if (!saved || Date.now() - saved.at > 10000) lsSet(KEY, { code: p.code, at: Date.now() });
    }
  },

  // ------------------------------------------------------------- arayüz eylemleri
  create() {
    if (!this.ensure()) return { ok: false, msg: 'Parti için çevrimiçi giriş gerekli' };
    return this.party.create();
  },
  join(code) {
    if (!this.ensure()) return { ok: false, msg: 'Parti için çevrimiçi giriş gerekli' };
    return this.party.join(code);
  },
  leave() { this.party?.leave(); lsSet(KEY, null); },
  invite(uid) {
    if (!this.ensure()) return { ok: false, msg: 'Parti için çevrimiçi giriş gerekli' };
    this.lobby.start();
    if (!this.party.inParty) this.party.create();
    return this.lobby.invite(uid, this.party.code);
  },
  answer(inv, ok) {
    this.invites = this.invites.filter((x) => x !== inv && x.from !== inv.from);
    this.lobby?.reply(inv.from, ok);
    bus.emit('party', 'invite');
    if (ok) return this.join(inv.code);
    return { ok: true };
  },
  chat(text) { return this.party ? this.party.sendChat(text) : { ok: false, msg: 'Partide değilsin' }; },
  setFollow(v) { this.follow = !!v; lsSet(FOLLOW_KEY, this.follow); bus.emit('party', 'follow'); },

  // Arkadaşın yanına git: aynı haritada ışınlanma, başka haritada (keşfedilmiş ve dungeon olmayan) bölgeye geçiş.
  canGoTo(m) {
    const w = app.world, p = w?.player, ch = app.char;
    const st = m?.st;
    if (!w || !p || !ch) return { ok: false, msg: 'Oyunda değilsin' };
    if (!st || !m.fresh) return { ok: false, msg: 'Konumu bilinmiyor' };
    if (st.dg) {
      // parti dungeon'u: oyun sunucusunda partinin ortak örneğine katıl (dungeon kilidi kendi karakterinde açık olmalı)
      if (!net.ready) return { ok: false, msg: 'Birlikte dungeon için oyun sunucusuna bağlı olmalısın' };
      if (!isDungeonUnlocked(ch, st.m)) return { ok: false, msg: `${mapName(st.m)} senin için henüz açılmadı` };
      if (w.mapDef.dungeon && w.mapId !== st.m) return { ok: false, msg: 'Önce bulunduğun dungeon\'dan çık' };
    } else if (w.mapDef.dungeon) return { ok: false, msg: 'Önce dungeon\'dan çık' };
    if (p.dead) return { ok: false, msg: 'Önce yeniden doğ' };
    if (p.inCombat()) return { ok: false, msg: 'Savaş sırasında olmaz' };
    if (!MAPS[st.m]) return { ok: false, msg: 'Bilinmeyen harita' };
    if (st.m !== w.mapId && !st.dg) {
      const known = Object.entries(WAYSTONES).some(([id, ws]) => ws.map === st.m && ch.world.waystones.includes(id));
      if (!known) return { ok: false, msg: `${mapName(st.m)} henüz keşfedilmedi (Yol Taşı'nı bul)` };
    }
    return { ok: true };
  },

  goTo(m) {
    const c = this.canGoTo(m);
    if (!c.ok) { toast(c.msg, 'warn'); return c; }
    const w = app.world, st = m.st;
    // tam üstüne değil, yanına (yürünebilirse)
    const spots = [[24, 0], [-24, 0], [0, 20], [0, -20], [0, 0]].map(([dx, dy]) => [st.x + dx, st.y + dy]);
    if (st.m === w.mapId) {
      const s = spots.find(([x, y]) => !w.grid.blockedAt(x, y)) || [st.x, st.y];
      w.player.x = s[0]; w.player.y = s[1];
      w.player.clearTarget(); w.player.approaching = false;
      w.fx?.text?.(s[0], s[1] - 60, 'Işınlandın', { color: '#7fe0a0', size: 11 });
      bus.emit('closePanels');
      return { ok: true };
    }
    bus.emit('closePanels');
    w.changeMap(st.m, null, { pos: { x: Math.floor(st.x / TILE), y: Math.floor(st.y / TILE) }, enterDungeon: !!st.dg });
    return { ok: true };
  },
};
