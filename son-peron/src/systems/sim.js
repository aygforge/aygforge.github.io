// Tekil simülasyon otoritesi. Phaser/DOM bağımlılığı yoktur; testlerde başsız çalışır.
// GameClock + GameState + olay sistemi + atomik işlem günlüğü burada birleşir.
import { buildInterior, buildOutdoors, buildTown, buildRiver, INTERIOR_START, GARDEN_START_BEDS } from '../world/maps.js';
import { findPath } from '../world/grid.js';
import { SAVE_VERSION, SPEED, CLOSING_LIMIT_MIN } from '../data/supplement.js';
import * as Inv from './inventory.js';
import * as Build from './building.js';
import * as Kitchen from './kitchen.js';
import * as Service from './service.js';
import * as Trains from './trains.js';
import * as Staff from './staff.js';
import * as Quests from './quests.js';
import * as Farm from './farming.js';
import * as Town from './town.js';
import * as Cal from './calendar.js';
import * as Day from './daycycle.js';
import * as Interact from './interact.js';
import * as Save from './save.js';

export const DIRV = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };
export const ROT_DIR = ['down', 'left', 'up', 'right'];

export function newState(C, opts = {}) {
  const s = {
    version: SAVE_VERSION, seed: opts.seed ?? 20261111, rng: (opts.seed ?? 20261111) >>> 0, nextId: 1,
    day: 1, minute: C.dayStart, hold: false, closing: { active: false, elapsed: 0 }, weather: 'clear',
    gold: C.startGold, reputation: 50, stage: 1, paidCustomers: 0, open: false,
    flags: {}, tx: {}, zones: [], renovations: [], pendingProjects: [],
    player: { name: opts.name || 'Deniz', look: opts.look || { skin: 1, hair: 1, style: 0, outfit: 0, eyes: 0 }, scene: 'restaurant_interior', x: 10.5, y: 9.5, dir: 'down', inv: new Array(C.invSlots).fill(null), sel: 0, carry: [], pot: null, busy: null },
    depot: new Array(C.depotSlots).fill(null), limbo: [],
    furniture: [], batches: [], deliveries: [], crate: [],
    groups: [], customers: [], orders: [], passers: [], dirty: {}, stains: [],
    trains: [], staff: { candidates: [], roster: [], shift: {}, refreshDay: 0, agents: {} },
    quests: { story: null, done: [], side: [], sideCooldown: {}, daily: [], festival: null, counters: {}, claimed: {} },
    nodes: {}, npcs: {}, regulars: {}, guestbook: [], recipesCooked: {}, storyUnlocks: [], cosmeticsOwned: [],
    fire: 0, fishing: { casts: 0 }, coop: 1, event: null, eventTomorrow: null, festival: null, festivalTomorrow: null, celebration: null,
    today: Day.blankDay(), lastReport: null, stats: { days: 0, totalSales: 0, totalTips: 0, bestDay: 0, lost: 0 }, log: []
  };
  for (const [type, x, y, rot] of INTERIOR_START) s.furniture.push({ id: 'f' + s.nextId++, type, scene: 'restaurant_interior', x, y, rot, installed: true, slots: mkSlots(C, type) });
  for (const [x, y] of GARDEN_START_BEDS) s.furniture.push({ id: 'f' + s.nextId++, type: 'garden_bed', scene: 'railway_outdoors', x, y, rot: 0, installed: true, crop: null, tilled: false, watered: false });
  return s;
}
export function mkSlots(C, type) {
  const d = C.placeables[type]; if (!d?.barModule) return undefined;
  const out = [];
  for (let i = 0; i < (d.foodSlots || 0); i++) out.push({ kind: 'food', item: null });
  for (let i = 0; i < (d.drinkSlots || 0); i++) out.push({ kind: 'drink', item: null });
  return out;
}

export class Sim {
  constructor(C, state) {
    this.C = C; this.s = state; this.fx = []; this._maps = {}; this._grids = {}; this.paused = false;
    if (!state.trains.length) Day.morning(this, true);
    Quests.init(this);
  }
  // ---- yardımcılar
  rand() { let a = (this.s.rng = (this.s.rng + 0x6D2B79F5) >>> 0); let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  ri(a, b) { return a + Math.floor(this.rand() * (b - a + 1)); }
  pick(arr) { return arr[Math.floor(this.rand() * arr.length)]; }
  nid(p) { return p + this.s.nextId++; }
  absMin() { return (this.s.day - 1) * 1440 + this.s.minute; }
  // Tek seferlik işlem: aynı kimlik ikinci kez uygulanmaz (para/ödül/teslimat çoğaltma koruması)
  once(id, fn) { if (this.s.tx[id]) return false; this.s.tx[id] = this.s.day; fn(); return true; }
  emit(type, data = {}) { const ev = { type, ...data }; this.fx.push(ev); if (this.fx.length > 400) this.fx.splice(0, 200); Quests.onEvent(this, ev); }
  msg(text, kind = 'info') { this.fx.push({ type: 'toast', text, kind }); return { ok: kind !== 'error', msg: text }; }
  fail(text) { this.fx.push({ type: 'toast', text, kind: 'error' }); return { ok: false, msg: text }; }
  def(inst) { return this.C.placeables[inst.type]; }
  fp(inst) { const d = this.def(inst); return inst.rot % 2 ? [d.h, d.w] : [d.w, d.h]; }
  furn(id) { return this.s.furniture.find((f) => f.id === id); }
  furnOfType(pred) { return this.s.furniture.filter((f) => pred(this.def(f), f)); }
  hasInstalled(type) { return this.s.furniture.some((f) => f.type === type && f.installed); }
  season() { return Cal.seasonOf(this.C, this.s.day); }

  map(scene) {
    const key = scene === 'restaurant_interior' ? scene + ':' + [...this.s.zones].sort().join(',') : scene;
    if (!this._maps[key]) {
      this._maps[key] = scene === 'restaurant_interior' ? buildInterior(this.C, this.s.zones) : scene === 'railway_outdoors' ? buildOutdoors(this.C) : scene === 'town_square' ? buildTown(this.C) : buildRiver(this.C);
    }
    return this._maps[key];
  }
  invalidate(scene) { delete this._grids[scene]; this.gridVersion = (this.gridVersion || 0) + 1; }
  // Çarpışma ızgarası: harita + katı mobilya + canlı kaynak düğümleri
  grid(scene, extra) {
    if (!extra && this._grids[scene]) return this._grids[scene];
    const m = this.map(scene); const g = Uint8Array.from(m.solid);
    for (const f of this.s.furniture) { if (f.scene !== scene || !this.def(f).solid) continue; const [w, h] = this.fp(f); for (let y = f.y; y < f.y + h; y++) for (let x = f.x; x < f.x + w; x++) g[y * m.w + x] = 1; }
    if (scene === 'railway_outdoors') for (const n of m.nodes) { const st = this.s.nodes[n.id]; if ((!st || st.alive !== false) && Farm.nodeDef(n.kind).solid) g[n.y * m.w + n.x] = 1; }
    if (extra) { for (let y = extra.y; y < extra.y + extra.h; y++) for (let x = extra.x; x < extra.x + extra.w; x++) g[y * m.w + x] = 1; return g; }
    return (this._grids[scene] = g);
  }
  path(scene, sx, sy, tx, ty) { const m = this.map(scene); return findPath(this.grid(scene), m.w, m.h, Math.floor(sx), Math.floor(sy), tx, ty); }
  // Ajan hareketi: a = {scene,x,y,dir,path,pi}
  goto(a, tx, ty) { const p = this.path(a.scene, a.x, a.y, tx, ty); if (!p) { a.path = null; return false; } a.path = p; a.pi = 1; return true; }
  step(a, dt, tilesPerMin) {
    if (!a.path) return true;
    let left = tilesPerMin * dt;
    while (left > 0 && a.pi < a.path.length) {
      const [cx, cy] = a.path[a.pi]; const tx = cx + 0.5, ty = cy + 0.5; const dx = tx - a.x, dy = ty - a.y; const d = Math.hypot(dx, dy);
      if (Math.abs(dx) > Math.abs(dy)) a.dir = dx > 0 ? 'right' : 'left'; else if (d > 0.001) a.dir = dy > 0 ? 'down' : 'up';
      if (d <= left) { a.x = tx; a.y = ty; a.pi++; left -= d; } else { a.x += (dx / d) * left; a.y += (dy / d) * left; left = 0; }
    }
    a.moving = a.pi < a.path.length;
    if (!a.moving) { a.path = null; return true; }
    return false;
  }
  npcSpeed(seedN = 0) { const px = SPEED.npcMin + ((seedN * 37) % (SPEED.npcMax - SPEED.npcMin)); return (px / 32) * this.C.realSecPerGameMin; }

  // ---- GameClock: tek zaman otoritesi. paused → hiçbir sayaç ilerlemez.
  tick(dtMin) {
    if (this.paused || dtMin <= 0) return;
    let left = dtMin;
    while (left > 1e-9) { const dt = Math.min(0.25, left); left -= dt; this._step(dt); }
  }
  _step(dt) {
    const s = this.s, C = this.C;
    Quests.checkHold(this);
    if (!s.hold && !s.closing.active) {
      s.minute += dt;
      if (s.minute >= C.dayEnd) { s.minute = C.dayEnd; s.closing.active = true; s.closing.elapsed = 0; s.open = false; this.emit('closing'); this.msg('Saat 23:00 — lokanta kapandı. İçerideki servisleri tamamlayıp yatabilirsin.'); }
    } else if (s.closing.active) {
      s.closing.elapsed += dt;
      if (s.closing.elapsed >= CLOSING_LIMIT_MIN && !s.closing.forced) { s.closing.forced = true; Service.forceCloseAll(this, 'Kapanış süresi doldu'); }
    }
    this._playerBusy(dt);
    Kitchen.tick(this, dt);
    if (!s.closing.active) Trains.tick(this);
    Service.tick(this, dt);
    Staff.tick(this, dt);
    Town.tick(this, dt);
    if (s.fire > 0) { s.fire = Math.max(0, s.fire - dt); if (s.fire === 0) this.emit('fire_out'); }
  }
  _playerBusy(dt) {
    const b = this.s.player.busy; if (!b) return;
    b.t += dt;
    if (b.t >= b.total) { this.s.player.busy = null; this.finishBusy(b); }
  }
  setBusy(kind, total, data = {}) { this.s.player.busy = { kind, t: 0, total, ...data }; this.emit('busy_start', { kind, ...data }); }
  finishBusy(b) {
    if (b.kind === 'node') Farm.finishHit(this, b);
    else if (b.kind === 'clean_table') Service.finishCleanTable(this, b.target, 'player');
    else if (b.kind === 'clean_stain') Service.finishCleanStain(this, b.target, 'player');
    else if (b.kind === 'farm') Farm.finishFarm(this, b);
    this.emit('busy_end', { kind: b.kind });
  }

  // ---- Oyuncu hareketi (dtSec gerçek saniye; saat duraklatılmışsa çağrılmaz)
  playerSpeed(run) { const p = this.s.player; return ((p.pot || p.carry.length) ? SPEED.carry : run ? SPEED.run : SPEED.walk) / 32; }
  movePlayer(dx, dy, dtSec, run) {
    const p = this.s.player; if (p.busy) return false;
    const len = Math.hypot(dx, dy); if (!len) { p.moving = false; return false; }
    dx /= len; dy /= len;
    if (Math.abs(dx) > Math.abs(dy)) p.dir = dx > 0 ? 'right' : 'left'; else p.dir = dy > 0 ? 'down' : 'up';
    const sp = this.playerSpeed(run) * dtSec; const g = this.grid(p.scene); const m = this.map(p.scene); const R = 0.28;
    const blocked = (x, y) => { for (const [ox, oy] of [[-R, -R], [R, -R], [-R, R], [R, R]]) { const cx = Math.floor(x + ox), cy = Math.floor(y + oy * 0.6 + 0.12); if (cx < 0 || cy < 0 || cx >= m.w || cy >= m.h || g[cy * m.w + cx]) return true; } return false; };
    const nx = p.x + dx * sp, ny = p.y + dy * sp;
    // Mobilyanın içinde kaldıysa (yerleştirme sonrası) serbestçe dışarı çıkabilsin
    const stuck = blocked(p.x, p.y);
    if (stuck || !blocked(nx, p.y)) p.x = Math.max(0.3, Math.min(m.w - 0.3, nx));
    if (stuck || !blocked(p.x, ny)) p.y = Math.max(0.3, Math.min(m.h - 0.3, ny));
    p.moving = true; p.running = !!run;
    this.checkPortal();
    return true;
  }
  checkPortal() {
    const p = this.s.player; const m = this.map(p.scene); const cx = Math.floor(p.x), cy = Math.floor(p.y);
    for (const pt of m.portals) {
      if (cx >= pt.x && cx < pt.x + pt.w && cy >= pt.y && cy < pt.y + pt.h) {
        if (pt.needStage && this.s.stage < pt.needStage) { p.x = pt.x - 0.6; this.msg('Dere yolu henüz kapalı. Lokantayı 2. aşamaya getirince açılır.'); return false; }
        this.changeScene(pt.to, pt.tx + 0.5, pt.ty + 0.5); return true;
      }
    }
    return false;
  }
  changeScene(to, x, y) {
    const p = this.s.player; const from = p.scene; p.scene = to; p.x = x; p.y = y;
    this.emit('scene_change', { from, to });
  }
  // Test/bot için: erişilebilirliği A* ile doğrulayıp oyuncuyu hedefe götürür
  walkPlayerTo(tx, ty) {
    const p = this.s.player; const path = this.path(p.scene, p.x, p.y, tx, ty);
    if (!path) return false;
    const g = this.grid(p.scene), m = this.map(p.scene);
    if (g[ty * m.w + tx]) { if (path.length < 2) return false; const [ax, ay] = path[path.length - 2]; p.x = ax + 0.5; p.y = ay + 0.5; } else { p.x = tx + 0.5; p.y = ty + 0.5; }
    this.checkPortal(); return true;
  }
}

Object.assign(Sim.prototype, {
  inv: Inv, build: Build, kitchen: Kitchen, service: Service, trainsys: Trains, staffsys: Staff, quests: Quests, farm: Farm, town: Town, cal: Cal, daysys: Day, ia: Interact, save: Save
});
