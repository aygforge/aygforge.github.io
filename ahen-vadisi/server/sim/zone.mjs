// Bölge (açık dünya haritası) simülasyonu: o haritadaki herkes için TEK yaratık kümesi.
// Spawn kuralları istemcidekiyle aynı (kamp yuvaları, yeniden doğma süresi, elit katkı kuralı), ama süre gerçek zamandır.
// Görsel olaylar oyuncunun görüş alanına (AOI) gönderilir; hasar 'eh' mesajıyla yalnız vurulan oyuncuya gider.
import { MAPS, ELITE_RULE } from '../../src/data/maps/index.js';
import { ENEMIES } from '../../src/data/enemies.js';
import { TILE, TG_SQUASH } from '../../src/data/constants.js';
import { buildMap } from '../../src/world/mapBuilder.js';
import { Grid } from '../../src/world/grid.js';
import { SEnemy } from './enemy.mjs';

export const AOI = 28 * TILE;            // yaratık/olay görüş yarıçapı
export const PLAYER_AOI = 40 * TILE;     // diğer oyuncular
export const SHARE_RANGE = 30 * TILE;    // parti EXP paylaşımı mesafesi
export const PARTY_BONUS = 0.2;          // kişi başına ek toplam EXP (2 kişi: 1,2 → kişi başı 0,6)
const builtCache = {};

export function sharePerMember(n) { return n <= 1 ? 1 : (1 + PARTY_BONUS * (n - 1)) / n; }

export function isSharedMap(mapId) { return !!MAPS[mapId] && !MAPS[mapId].dungeon; }

export class Zone {
  // out(uid, msg): oyuncuya mesaj; partyOf(uid): parti anahtarı ya da null
  constructor(mapId, { out, partyOf = () => null, now = () => Date.now() } = {}) {
    this.mapId = mapId;
    this.def = MAPS[mapId];
    this.built = builtCache[mapId] || (builtCache[mapId] = buildMap(this.def));
    this.grid = new Grid(this.built);
    this.out = out; this.partyOf = partyOf;
    this.clock = 0;
    this.players = new Map();
    this.enemies = [];
    this.slots = []; this.elites = [];
    this.eliteState = { kills: 0, lastDeath: -1e12 };
    this.hazards = []; this.shards = []; this.projectiles = [];
    this.queue = new Map();        // uid → bekleyen olaylar
    this.checkT = 0; this.snapT = 0;
    this.pathBudget = 6;
    this.emptySince = now();
    this.init();
  }

  init() {
    for (const a of this.def.areas || []) {
      for (const s of a.spawns || []) for (let i = 0; i < s.max; i++) {
        const slot = { area: a, enemy: s.enemy, ent: null, respawnAt: 0 };
        this.slots.push(slot);
        this.spawnSlot(slot, true);
      }
      if (a.elite) this.elites.push({ area: a, enemy: a.elite, ent: null });
    }
  }

  // ---------------------------------------------------------------- yardımcılar
  isSafeAt(x, y) {
    if (this.def.safe) return true;
    for (const a of this.def.areas) if (a.safePocket && Math.hypot(x / TILE - a.x, y / TILE - a.y) <= a.r) return true;
    return false;
  }
  player(uid) { return this.players.get(uid) || null; }

  randomCell(area, awayFromPlayers) {
    const cells = this.built.areaCells[area.id] || [];
    for (let k = 0; k < 30 && cells.length; k++) {
      const [x, y] = cells[Math.floor(Math.random() * cells.length)];
      const px = x * TILE + TILE / 2, py = y * TILE + TILE / 2;
      if (!awayFromPlayers || ![...this.players.values()].some((p) => Math.hypot(px - p.x, py - p.y) < 6 * TILE)) return { x: px, y: py };
    }
    const [x, y] = cells[Math.floor(Math.random() * cells.length)] || [area.x, area.y];
    return { x: x * TILE + TILE / 2, y: y * TILE + TILE / 2 };
  }

  spawn(id, x, y, opts) {
    const e = new SEnemy(this, ENEMIES[id], x, y, opts);
    this.enemies.push(e);
    return e;
  }

  spawnSlot(slot, initial = false) {
    const pos = this.randomCell(slot.area, !initial);
    slot.ent = this.spawn(slot.enemy, pos.x, pos.y, { spawnRef: slot });
  }

  // ---------------------------------------------------------------- olaylar (görüş alanındaki oyunculara)
  push(uid, ev) {
    let q = this.queue.get(uid);
    if (!q) this.queue.set(uid, (q = []));
    q.push(ev);
  }
  ev(ev, x, y, r = AOI) {
    for (const p of this.players.values()) if (Math.hypot(p.x - x, p.y - y) <= r) this.push(p.uid, ev);
  }
  everyone(ev) { for (const p of this.players.values()) this.push(p.uid, ev); }
  telegraph(s, ms, c = 0xff3a2a) { this.ev({ k: 'tg', s: roundShape(s), ms, c }, s.x, s.y); }
  fx(key, x, y, o = {}) { this.ev({ k: 'fx', key, x: Math.round(x), y: Math.round(y), o }, x, y); }
  text(x, y, s, c, z = 13, snd = null) { this.ev({ k: 'tx', x: Math.round(x), y: Math.round(y), s, c, z, snd }, x, y); }
  // düşman → oyuncu isabeti: hasarı istemci kendi savunmasıyla hesaplar
  hit(uid, e, opts) {
    const m = { k: 'eh', e: e.id, tpl: e.tpl.id, coef: opts.coef ?? 1 };
    if (opts.n) m.n = 1;
    if (opts.dt) m.dt = opts.dt;
    if (opts.label) m.label = opts.label;
    if (opts.poison) m.poison = opts.poison;
    if (opts.slow) m.slow = opts.slow;
    if (opts.curse) m.curse = opts.curse;
    this.push(uid, m);
  }
  hazard({ x, y, r, dur, tick = 0.5, coef = 0.2, src, key = 'fire_ground', label = null, warn = 0, dmgType = 'magic', tint = null }) {
    this.hazards.push({ x, y, r, left: dur, tick, t: warn > 0 ? 0 : tick, coef, src, label, warn, dmgType });
    this.ev({ k: 'hz', x: Math.round(x), y: Math.round(y), r, dur, warn, key, tint }, x, y);
  }
  shard({ x, y, r, delay = 1.4, coef = 1, src, label = null, style = 'ice' }) {
    this.shards.push({ x, y, r, at: this.clock + delay * 1000, coef, src, label: label || (style === 'dark' ? 'Kara Mermi' : 'Buz Kıymığı') });
    this.ev({ k: 'sh', x: Math.round(x), y: Math.round(y), r, delay, style }, x, y);
  }
  projectile(e, tp, key, onHit) {
    const d = Math.hypot(tp.x - e.x, tp.y - e.y);
    this.projectiles.push({ at: this.clock + (d / 300) * 1000, uid: tp.uid, onHit });
    this.ev({ k: 'pj', e: e.id, to: tp.uid, key }, e.x, e.y);
  }

  // ---------------------------------------------------------------- oyuncular
  join(uid, st) {
    const p = { uid, x: st.x, y: st.y, radius: 9, dead: !!st.d, nick: st.nick || '?', cls: st.cls, lv: st.lv || 1, n: st.n || '', hp: st.hp ?? 100, f: 1, mv: 0, a: 0, seen: new Map(), seenP: new Set() };
    this.players.set(uid, p);
    this.out(uid, { t: 'zone', map: this.mapId, e: this.enemies.filter((e) => !e.dead && Math.hypot(e.x - p.x, e.y - p.y) <= AOI).map((e) => e.full()) });
    for (const e of this.enemies) if (!e.dead && Math.hypot(e.x - p.x, e.y - p.y) <= AOI) p.seen.set(e.id, '');
    return p;
  }

  leave(uid) {
    this.players.delete(uid);
    this.queue.delete(uid);
    for (const e of this.enemies) {
      if (e.target === uid) e.target = null;
      e.threat.delete(uid);
    }
    for (const p of this.players.values()) p.seenP.delete(uid);
    if (!this.players.size) this.emptySince = Date.now();
  }

  update(uid, st) {
    const p = this.players.get(uid);
    if (!p) return;
    if (Number.isFinite(st.x) && Number.isFinite(st.y)) { p.x = st.x; p.y = st.y; }
    p.dead = !!st.d; p.f = st.f < 0 ? -1 : 1; p.mv = st.mv ? 1 : 0; p.a = st.a ? 1 : 0;
    if (st.hp != null) p.hp = st.hp;
    if (st.lv) p.lv = st.lv;
    if (st.cls) p.cls = st.cls;
    if (st.n != null) p.n = st.n;
    if (st.nick) p.nick = st.nick;
  }

  // oyuncunun vuruşu
  onHit(uid, id, dmg) {
    const e = this.enemies.find((x) => x.id === id);
    if (!e || e.dead || !this.players.has(uid)) return;
    if (!(dmg >= 0) || dmg > 200000) return;
    if (e.takeHit(uid, Math.round(dmg))) this.kill(e, uid);
  }

  // oyuncunun uyguladığı durum etkileri (yavaşlatma, sersemletme)
  onStatus(uid, id, s) {
    const e = this.enemies.find((x) => x.id === id);
    if (!e || e.dead) return;
    if (s.slow && e.tpl.kind !== 'boss') {
      const [pct, ms] = s.slow;
      if (this.clock >= e.slowUntil || e.slowPct <= pct) { e.slowUntil = this.clock + Math.min(10000, ms); e.slowPct = Math.min(0.9, pct); }
    }
    if (s.stun && e.tpl.kind !== 'boss') e.stunUntil = Math.max(e.stunUntil, this.clock + Math.min(5000, s.stun));
    if (e.state === 'idle') { const p = this.player(uid); if (p) e.aggro(p); }
  }

  // ---------------------------------------------------------------- ölüm, ödül paylaşımı
  kill(e, killer) {
    e.dead = true;
    this.everyone({ k: 'die', e: e.id });
    const ref = e.spawnRef;
    if (ref && this.slots.includes(ref)) {
      ref.ent = null;
      ref.respawnAt = this.clock + (e.tpl.respawn || 20) * (0.8 + Math.random() * 0.4) * 1000;
      if (e.tpl.kind === 'normal' && this.elites.some((el) => el.area === ref.area)) this.eliteState.kills++;
    }
    if (ref && this.elites.includes(ref)) { ref.ent = null; this.eliteState = { kills: 0, lastDeath: this.clock }; }
    for (const c of this.credit(e, killer)) {
      this.push(c.uid, { k: 'kill', e: e.id, tpl: e.tpl.id, x: Math.round(e.x), y: Math.round(e.y), share: c.share, n: c.n, killer: killer === c.uid ? 1 : 0 });
    }
  }

  // Hasar veren her grup (parti ya da tek oyuncu) ödül alır; parti içinde yakındaki üyeler EXP/altını paylaşır,
  // ganimet herkese ayrı düşer (kişisel ganimet). Görev sayacı tüm paylaşan üyelere işler.
  credit(e, killer) {
    const groups = new Map();
    const damagers = [...e.dmgBy.keys()].filter((uid) => this.players.has(uid));
    if (killer && this.players.has(killer) && !damagers.includes(killer)) damagers.push(killer);
    for (const uid of damagers) {
      const key = this.partyOf(uid) || 'solo:' + uid;
      if (!groups.has(key)) groups.set(key, new Set());
      groups.get(key).add(uid);
    }
    const out = [];
    for (const [key, set] of groups) {
      if (!key.startsWith('solo:')) {
        for (const p of this.players.values()) {
          if (this.partyOf(p.uid) === key && Math.hypot(p.x - e.x, p.y - e.y) <= SHARE_RANGE) set.add(p.uid);
        }
      }
      const n = set.size, share = sharePerMember(n);
      for (const uid of set) out.push({ uid, share, n });
    }
    return out;
  }

  // ---------------------------------------------------------------- döngü
  tick(dt) {
    this.clock += dt * 1000;
    this.pathBudget = 6;
    this.checkT -= dt;
    if (this.checkT <= 0) {
      this.checkT = 0.5;
      for (const s of this.slots) if ((!s.ent || s.ent.dead) && this.clock >= s.respawnAt) this.spawnSlot(s);
      for (const el of this.elites) {
        if (el.ent && !el.ent.dead) continue;
        const st = this.eliteState;
        if (st.kills >= ELITE_RULE.killsNeeded && this.clock - st.lastDeath >= ELITE_RULE.minActiveSec * 1000) {
          const pos = this.randomCell(el.area, true);
          el.ent = this.spawn(el.enemy, pos.x, pos.y, { spawnRef: el });
          el.ent.home = { x: el.area.x * TILE, y: el.area.y * TILE };
          this.everyone({ k: 'note', s: `${el.ent.tpl.name} ${el.area.name} bölgesinde ortaya çıktı!`, kind: 'elite' });
        }
      }
    }
    // yalnız oyuncu varken yaratıklar düşünür (boş bölge bekler; durum korunur)
    if (this.players.size) {
      for (const e of this.enemies) e.update(dt);
      this.separate();
    }
    this.enemies = this.enemies.filter((e) => !e.dead);
    // tehlikeler, düşen parçalar, mermiler
    for (const hz of this.hazards) {
      if (hz.warn > 0) { hz.warn -= dt; continue; }
      hz.left -= dt;
      if (hz.left <= 0) { hz.dead = true; continue; }
      hz.t -= dt;
      if (hz.t <= 0) {
        hz.t = hz.tick;
        for (const p of this.players.values()) {
          if (!p.dead && Math.hypot((p.x - hz.x) / hz.r, (p.y - hz.y) / (hz.r * TG_SQUASH)) <= 1) this.hit(p.uid, hz.src, { coef: hz.coef, dt: hz.dmgType, label: hz.label });
        }
        hz.label = null;
      }
    }
    this.hazards = this.hazards.filter((h) => !h.dead);
    for (const s of this.shards) {
      if (this.clock < s.at) continue;
      s.dead = true;
      for (const p of this.players.values()) {
        if (!p.dead && Math.hypot((p.x - s.x) / s.r, (p.y - s.y) / (s.r * TG_SQUASH)) <= 1) this.hit(p.uid, s.src, { coef: s.coef, dt: 'magic', label: s.label });
      }
    }
    this.shards = this.shards.filter((s) => !s.dead);
    for (const pr of this.projectiles) {
      if (this.clock < pr.at) continue;
      pr.dead = true;
      const p = this.players.get(pr.uid);
      if (p && !p.dead) pr.onHit();
    }
    this.projectiles = this.projectiles.filter((p) => !p.dead);
    this.snapT -= dt;
    if (this.snapT <= 0) { this.snapT = 0.1; this.snapshots(); }
    this.flush();
  }

  separate() {
    const list = this.enemies;
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      if (a.dead || a.tpl.ai === 'static' || a.state === 'idle') continue;
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j];
        if (b.dead || b.tpl.ai === 'static') continue;
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), min = (a.radius + b.radius) * 0.9;
        if (d > 0.01 && d < min) {
          const push = (min - d) * 0.5;
          this.grid.move(a, -dx / d * push, -dy / d * push);
          this.grid.move(b, dx / d * push, dy / d * push);
        }
      }
    }
  }

  // her oyuncuya görüş alanındaki değişen yaratıklar (+ yeni girenlerin tam bilgisi, çıkanlar) ve diğer oyuncular
  snapshots() {
    for (const p of this.players.values()) {
      const e = [], n = [], g = [];
      const inAoi = new Set();
      for (const en of this.enemies) {
        if (Math.hypot(en.x - p.x, en.y - p.y) > AOI) continue;
        inAoi.add(en.id);
        const s = en.snap();
        const key = s.join(',');
        if (!p.seen.has(en.id)) { n.push(en.full()); p.seen.set(en.id, key); e.push(s); }
        else if (p.seen.get(en.id) !== key) { p.seen.set(en.id, key); e.push(s); }
      }
      for (const id of p.seen.keys()) if (!inAoi.has(id)) { p.seen.delete(id); g.push(id); }
      const ps = [];
      for (const q of this.players.values()) {
        if (q === p || Math.hypot(q.x - p.x, q.y - p.y) > PLAYER_AOI) continue;
        ps.push([q.uid, Math.round(q.x), Math.round(q.y), q.f, q.mv, q.hp, q.dead ? 1 : 0, q.a, q.lv, q.cls, q.nick, q.n]);
      }
      if (e.length || n.length || g.length || ps.length || p.hadP) this.out(p.uid, { t: 'snap', e, n, g, p: ps });
      p.hadP = ps.length > 0;
    }
  }

  flush() {
    for (const [uid, q] of this.queue) if (q.length) this.out(uid, { t: 'evs', l: q });
    this.queue.clear();
  }
}

function roundShape(s) {
  const o = {};
  for (const [k, v] of Object.entries(s)) o[k] = typeof v === 'number' && k !== 'angle' ? Math.round(v) : v;
  return o;
}
