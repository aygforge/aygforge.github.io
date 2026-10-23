// Bölge (açık dünya haritası) simülasyonu: o haritadaki herkes için TEK yaratık kümesi.
// Spawn kuralları istemcidekiyle aynı (kamp yuvaları, yeniden doğma süresi, elit katkı kuralı), ama süre gerçek zamandır.
// Görsel olaylar oyuncunun görüş alanına (AOI) gönderilir; hasar 'eh' mesajıyla yalnız vurulan oyuncuya gider.
import { MAPS, ELITE_RULE } from '../../src/data/maps/index.js';
import { bossStage, DUNGEON_INFO } from '../../src/systems/dungeon.js';
import { ENEMIES } from '../../src/data/enemies.js';
import { TILE, TG_SQUASH } from '../../src/data/constants.js';
import { buildMap } from '../../src/world/mapBuilder.js';
import { Grid } from '../../src/world/grid.js';
import { SEnemy } from './enemy.mjs';
import { SEscort, SDefense, SAltar } from './events.mjs';

export const AOI = 28 * TILE;            // yaratık/olay görüş yarıçapı
export const PLAYER_AOI = 40 * TILE;     // diğer oyuncular
export const SHARE_RANGE = 30 * TILE;    // parti EXP paylaşımı mesafesi
export const PARTY_BONUS = 0.2;          // kişi başına ek toplam EXP (2 kişi: 1,2 → kişi başı 0,6)
const builtCache = {};

export function sharePerMember(n) { return n <= 1 ? 1 : (1 + PARTY_BONUS * (n - 1)) / n; }

export function isSharedMap(mapId) { return !!MAPS[mapId] && !MAPS[mapId].dungeon; }
export function isDungeonMap(mapId) { return !!MAPS[mapId]?.dungeon && !!DUNGEON_INFO[mapId]; }

export class Zone {
  // out(uid, msg): oyuncuya mesaj; partyOf(uid): parti anahtarı ya da null
  // run: dungeon örneği için başlangıç koşu durumu { cleared, seals, bossKilled } (ilk giren oyuncununki)
  constructor(mapId, { out, partyOf = () => null, now = () => Date.now(), run = null, key = null } = {}) {
    this.mapId = mapId;
    this.def = MAPS[mapId];
    this.built = builtCache[mapId] || (builtCache[mapId] = buildMap(this.def));
    this.grid = new Grid(this.built);
    this.out = out; this.partyOf = partyOf;
    this.clock = 0;
    this.players = new Map();
    this.enemies = [];
    this.slots = []; this.elites = []; this.bosses = [];
    this.timers = [];
    this.stamp = Date.now().toString(36);   // boss ödül kimliği (sunucu yeniden başlarsa yeni boss = yeni ödül)
    this.bossSerial = 0; this.hzN = 0;
    this.eliteState = { kills: 0, lastDeath: -1e12 };
    this.hazards = []; this.shards = []; this.projectiles = [];
    this.queue = new Map();        // uid → bekleyen olaylar
    this.checkT = 0; this.snapT = 0;
    this.pathBudget = 6;
    this.emptySince = now();
    this.key = key || mapId;
    if (this.def.dungeon) this.initDungeon(run); else this.init();
  }

  init() {
    for (const a of this.def.areas || []) {
      for (const s of a.spawns || []) for (let i = 0; i < s.max; i++) {
        const slot = { area: a, enemy: s.enemy, ent: null, respawnAt: 0 };
        this.slots.push(slot);
        this.spawnSlot(slot, true);
      }
      if (a.elite) this.elites.push({ area: a, enemy: a.elite, ent: null });
      if (a.boss) this.bosses.push({ area: a, enemy: a.boss, ent: null, respawnAt: 0 });
    }
    // görev olayları ve sunaklar (haritadaki nesnelerden)
    this.events = new Map();
    for (const o of this.def.objects || []) {
      if (o.type === 'escort') this.events.set(o.id, new SEscort(this, o));
      else if (o.type === 'defense') this.events.set(o.id, new SDefense(this, o));
      else if (o.type === 'altar') this.events.set(o.id, new SAltar(this, o));
    }
    this.hunts = new Map();   // anahtar → { enemy, x, y, ent, want: Set(uid) }
  }

  // ---------------------------------------------------------------- görev olayları, sunaklar, görev avları
  // başlatma isteği: istemci görev uygunluğunu kendisi denetledi (görevi olmayan zaten başlatamaz)
  onEvent(uid, id) {
    const ev = this.events?.get(id);
    const p = this.player(uid);
    if (!ev || !p || p.dead || Math.hypot(p.x - ev.x, p.y - ev.y) > 6 * TILE) return;
    if (ev instanceof SAltar) { ev.start(); return; }
    if (ev.running) return;
    ev.begin();
    this.everyone({ k: 'qe', op: 'start', id, nick: p.nick });
    ev.state(true);
  }

  // görev avları: oyuncunun görevinin istediği özel hedefler bölgede tek ve ortak doğar
  onHunts(uid, list) {
    if (!this.hunts) return;
    const keys = new Set();
    for (const h of Array.isArray(list) ? list.slice(0, 12) : []) {
      if (!h || typeof h.key !== 'string' || !ENEMIES[h.enemy] || !Number.isFinite(h.x) || !Number.isFinite(h.y)) continue;
      const key = h.key.slice(0, 40);
      keys.add(key);
      let cur = this.hunts.get(key);
      if (!cur) this.hunts.set(key, (cur = { enemy: h.enemy, x: h.x * TILE + TILE / 2, y: h.y * TILE + TILE / 2, ent: null, want: new Set() }));
      cur.want.add(uid);
    }
    for (const [key, cur] of this.hunts) if (!keys.has(key)) cur.want.delete(uid);
  }

  updateHunts() {
    for (const [key, h] of this.hunts) {
      for (const uid of h.want) if (!this.players.has(uid)) h.want.delete(uid);
      if (!h.want.size) { if (h.ent && !h.ent.dead) this.despawn(h.ent); this.hunts.delete(key); continue; }
      if (h.ent && !h.ent.dead) continue;
      if ([...this.players.values()].some((p) => Math.hypot(p.x - h.x, p.y - h.y) < 5 * TILE)) continue;   // oyuncunun dibinde doğmaz
      if (h.ent?.dead && this.clock - (h.diedAt || 0) < 3000) continue;
      h.ent = this.spawn(h.enemy, h.x, h.y, { leashR: 14 * TILE });
      h.ent.huntKey = key;
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

  // boss çağrısı (yardımcı, kristal, bayrak): ödül vermez; sahibinin hedefine saldırır
  spawnSummon(id, x, y, owner) {
    let px = x, py = y;
    if (this.grid.blockedAt(px, py)) { px = owner.x; py = owner.y - TILE; if (this.grid.blockedAt(px, py)) return null; }
    const e = this.spawn(id, px, py, { summoned: true, leashR: (ENEMIES[id].leash || 16) * TILE });
    const p = owner.targetPlayer?.();
    if (p && e.tpl.ai !== 'static') { e.target = p.uid; e.aggro(p, false); }
    return e;
  }

  // ödülsüz kaldırma (çağrılmışlar, süresi dolan kristaller)
  despawn(e) {
    if (!e || e.dead) return;
    e.dead = true;
    e.behavior?.onDeath?.();
    this.everyone({ k: 'die', e: e.id, q: 1 });
  }

  announce(e, s, c = '#ff9a4a') { this.everyone({ k: 'ann', s, c, x: Math.round(e.x), y: Math.round(e.y) }); }
  later(ms, fn) { this.timers.push({ at: this.clock + ms, fn }); }
  clearHazards(src) {
    const ids = this.hazards.filter((h) => h.src === src).map((h) => h.id);
    this.hazards = this.hazards.filter((h) => h.src !== src);
    if (ids.length) this.everyone({ k: 'hzc', ids });
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
    if (opts.kb) m.kb = [+opts.kb[0].toFixed(3), opts.kb[1]];
    if (opts.stun) m.stun = opts.stun;
    if (opts.pslow) m.pslow = opts.pslow;
    if (opts.say) m.say = opts.say;
    this.push(uid, m);
  }
  hazard({ x, y, r, dur, tick = 0.5, coef = 0.2, src, key = 'fire_ground', label = null, warn = 0, dmgType = 'magic', tint = null }) {
    const hz = { id: ++this.hzN, x, y, r, left: dur, tick, t: warn > 0 ? 0 : tick, coef, src, label, warn, dmgType };
    this.hazards.push(hz);
    this.ev({ k: 'hz', id: hz.id, x: Math.round(x), y: Math.round(y), r, dur, warn, key, tint }, x, y);
    return hz;
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
    if (this.events) for (const ev of this.events.values()) if (ev.running) this.push(uid, { k: 'qe', op: 'start', id: ev.id, nick: '' });
    this.out(uid, { t: 'zone', map: this.mapId, dg: this.dg ? this.dgState() : null, e: this.enemies.filter((e) => !e.dead && Math.hypot(e.x - p.x, e.y - p.y) <= AOI).map((e) => e.full()) });
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
    if (ref && this.bosses.includes(ref)) { ref.ent = null; ref.respawnAt = this.clock + (e.tpl.respawn || 600) * 1000; }
    e.behavior?.onDeath?.();
    if (this.dg) this.dgOnKill(e);
    if (e.huntKey && this.hunts?.has(e.huntKey)) this.hunts.get(e.huntKey).diedAt = this.clock;
    if (e.questSpawn) return;   // olay yaratığı: EXP/ganimet/görev sayacı yok (istemcideki kural)
    for (const c of this.credit(e, killer)) {
      const m = { k: 'kill', e: e.id, tpl: e.tpl.id, x: Math.round(e.x), y: Math.round(e.y), share: c.share, n: c.n, killer: killer === c.uid ? 1 : 0 };
      if (e.killId) m.killId = e.killId;
      this.push(c.uid, m);
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
      if (this.hunts && this.players.size) this.updateHunts();
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
    for (const b of this.bosses) {
      if ((b.ent && !b.ent.dead) || this.clock < b.respawnAt) continue;
      b.ent = this.spawn(b.enemy, b.area.x * TILE, b.area.y * TILE, { spawnRef: b, leashR: (b.area.r + 6) * TILE });
      b.ent.killId = `${b.enemy}:${this.mapId}:${this.stamp}:${++this.bossSerial}`;
    }
    if (this.timers.length) {
      const due = this.timers.filter((t) => this.clock >= t.at);
      this.timers = this.timers.filter((t) => this.clock < t.at);
      for (const t of due) t.fn();
    }
    // yalnız oyuncu varken yaratıklar düşünür (boş bölge bekler; durum korunur)
    if (this.players.size) {
      for (const e of this.enemies) e.update(dt);
      this.separate();
      if (this.events) for (const ev of this.events.values()) ev.update(dt);
    } else if (this.events) {
      for (const ev of this.events.values()) if (ev.running) ev.fail(`${ev.o.name}: kimse kalmadı.`);
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

  // ---------------------------------------------------------------- dungeon örneği (parti başına)
  // İstemcideki Spawner.initDungeon + WorldScene.setupGates/checkSeals/checkStageCleared'in sunucu karşılığı.
  initDungeon(run) {
    const def = this.def;
    const r = run && typeof run === 'object' ? run : {};
    const last = bossStage(this.mapId);
    this.dg = {
      cleared: Array.isArray(r.cleared) ? r.cleared.filter((n) => Number.isInteger(n) && n >= 1 && n <= last) : [],
      seals: Array.isArray(r.seals) ? r.seals.filter((id) => (def.seals || []).some((x) => x.id === id)) : [],
      bossKilled: !!r.bossKilled, waves: new Map(), waveIdx: {}, hinted: {},
    };
    // kapılar (açılmamış bölümler dinamik engel)
    for (const g of def.gates || []) {
      if (this.dg.cleared.includes(g.opensAfter)) continue;
      for (let y = g.y0; y <= g.y1; y++) for (let x = g.x0; x <= g.x1; x++) {
        const i = y * this.grid.w + x;
        if (!this.grid.solid[i]) this.grid.dyn[i] = 1;
      }
    }
    for (const [stageStr, list] of Object.entries(def.stages)) {
      const stage = +stageStr;
      if (this.dg.cleared.includes(stage)) continue;
      if (stage === last) {
        if (this.dg.bossKilled) continue;
        this.dg.boss = this.spawn(def.boss || 'mine_golem', def.bossSpawn.x * TILE, def.bossSpawn.y * TILE, { stage, leashR: 13 * TILE });
        continue;
      }
      const area = def.areas.find((a) => a.stage === stage);
      for (const [id, n] of list) for (let i = 0; i < n; i++) {
        const pos = this.randomCell(area, false);
        this.spawn(id, pos.x, pos.y, { stage, leashR: 10 * TILE });
      }
    }
  }

  dgState() {
    const d = this.dg;
    return { cleared: d.cleared, seals: d.seals, bossKilled: d.bossKilled, waves: [...d.waves.keys()].filter((id) => d.waves.get(id).some((e) => !e.dead)) };
  }

  currentStage() {
    const last = bossStage(this.mapId);
    for (let s = 1; s <= last; s++) if (!this.dg.cleared.includes(s)) return s;
    return last + 1;
  }

  sealCount(stage) {
    const list = (this.def.seals || []).filter((x) => (x.stage || 3) === stage && x.kind !== 'decoy');
    return { n: list.filter((x) => this.dg.seals.includes(x.id)).length, total: list.length };
  }

  // oyuncu bir mühre/mekanizmaya dokundu (istemci kanal süresini zaten bekledi)
  onSeal(uid, id) {
    const d = this.dg;
    const seal = (this.def.seals || []).find((x) => x.id === id);
    if (!d || !seal || seal.kind === 'decoy' || d.seals.includes(id) || !this.players.has(uid)) return;
    const stage = seal.stage || 3;
    if (this.currentStage() < stage) return;
    if (seal.kind === 'lever') { this.breakSeal(seal); return; }
    if (d.waves.get(id)?.some((e) => !e.dead)) return;
    this.sealWave(seal, 0);
    this.everyone({ k: 'dg', op: 'wave', id, idx: 0, n: seal.waves ? seal.waves.length : 1, name: seal.label || seal.name });
  }

  sealWave(seal, idx) {
    const list = [];
    let i = 0;
    this.dg.waveIdx[seal.id] = idx;
    for (const [id, n] of (seal.waves ? seal.waves[idx] : seal.wave)) for (let k = 0; k < n; k++, i++) {
      const a = (i / 3) * Math.PI * 2 + 0.4;
      let x = (seal.x + 0.5) * TILE + Math.cos(a) * 2.6 * TILE, y = (seal.y + 0.5) * TILE + Math.sin(a) * 2 * TILE;
      if (this.grid.blockedAt(x, y)) { x = (seal.x + 0.5) * TILE; y = (seal.y + 2) * TILE; }
      const e = this.spawn(id, x, y, { stage: seal.stage || 3, leashR: 12 * TILE });
      e.sealId = seal.id;
      let near = null;
      for (const p of this.players.values()) if (!p.dead && (!near || Math.hypot(p.x - x, p.y - y) < Math.hypot(near.x - x, near.y - y))) near = p;
      if (near) { e.target = near.uid; e.aggro(near, false); }
      this.fx('shatter', x, y - 20, { scale: 1.8 });
      list.push(e);
    }
    this.dg.waves.set(seal.id, list);
  }

  breakSeal(seal) {
    const d = this.dg;
    if (d.seals.includes(seal.id)) return;
    d.seals.push(seal.id);
    const stage = seal.stage || 3;
    const { n, total } = this.sealCount(stage);
    this.everyone({ k: 'dg', op: 'seal', id: seal.id, n, total, lever: seal.kind === 'lever' ? 1 : 0, name: seal.label || seal.name });
    this.checkStage(stage);
  }

  // bölüm temizliği: o bölümün yaratığı kalmadı ve mühürleri kırıldıysa kapı açılır
  checkStage(stage) {
    const d = this.dg;
    if (!d || d.cleared.includes(stage)) return;
    if (this.enemies.some((e) => !e.dead && e.stage === stage)) return;
    const sc = this.sealCount(stage);
    if (sc.n < sc.total) {
      if (!d.hinted[stage]) {
        d.hinted[stage] = true;
        const lever = (this.def.seals || []).some((x) => (x.stage || 3) === stage && x.kind === 'lever');
        const lastBefore = stage === bossStage(this.mapId) - 1;
        this.everyone({ k: 'note', s: lever ? `Bölüm sessiz... Kapıyı açmak için ${sc.total} mekanizmayı da etkinleştir.` : `Galeri sessiz... ${lastBefore ? 'Boss kapısını' : 'Kapıyı'} açmak için ${sc.total} mührü de kır.` });
      }
      return;
    }
    d.cleared.push(stage);
    d.cleared.sort((a, b) => a - b);
    if (stage === bossStage(this.mapId)) d.bossKilled = true;
    for (const g of this.def.gates || []) {
      if (g.opensAfter !== stage) continue;
      for (let y = g.y0; y <= g.y1; y++) for (let x = g.x0; x <= g.x1; x++) this.grid.dyn[y * this.grid.w + x] = 0;
    }
    this.everyone({ k: 'dg', op: 'clear', stage });
  }

  // dungeon'da ölüm: mühür dalgası bitti mi, bölüm temizlendi mi
  dgOnKill(e) {
    const d = this.dg;
    if (e.sealId) {
      const wave = d.waves.get(e.sealId);
      if (wave && !wave.some((x) => !x.dead)) {
        const seal = this.def.seals.find((x) => x.id === e.sealId);
        const next = (d.waveIdx[seal.id] || 0) + 1;
        if (seal.waves && next < seal.waves.length) {
          this.sealWave(seal, next);
          this.everyone({ k: 'dg', op: 'wave', id: seal.id, idx: next, n: seal.waves.length, name: seal.label || seal.name });
        } else { d.waves.delete(seal.id); this.breakSeal(seal); }
      }
    }
    if (e.stage) this.checkStage(e.stage);
  }

  // her oyuncuya görüş alanındaki değişen yaratıklar (+ yeni girenlerin tam bilgisi, çıkanlar) ve diğer oyuncular
  snapshots() {
    if (this.events) for (const ev of this.events.values()) if (ev.running) ev.state();
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
