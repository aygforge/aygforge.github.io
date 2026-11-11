// Sunucu tarafı görev olayları (ortak dünya): refakat, alan savunması, sunak dalgaları, görev avları.
// İstemcideki src/world/questEvents.js ve AltarObj'nin görüntüsüz kopyası; bölgedeki herkes aynı olayı görür ve
// birlikte savaşır. Tamamlanınca herkese duyurulur; görev ilerlemesini her oyuncu kendi görevine göre işler
// (görevi olmayan için yalnız duyuru). Olay yaratıkları (questSpawn) ödül vermez — istemcideki kural.
import { TILE } from '../../src/data/constants.js';

class Guarded {
  constructor(z, o, kind) {
    this.z = z; this.o = o; this.kind = kind;
    this.id = o.id;
    this.x = o.x * TILE + TILE / 2; this.y = o.y * TILE + TILE / 2 + 8;
    this.radius = 14;
    this.maxHp = o.hp; this.hp = o.hp;
    this.running = false; this.dead = false;
    this.wave = [];
  }

  nearPlayers(r) { return [...this.z.players.values()].filter((p) => !p.dead && Math.hypot(p.x - this.x, p.y - this.y) < r); }

  takeHit(dmg) {
    if (!this.running || this.dead) return;
    this.hp -= dmg;
    if (this.hp <= 0) { this.dead = true; this.fail(`${this.o.name} düştü! Görev yeniden denenebilir.`); }
  }

  spawnWave(list, around, rMin = 4.5, rMax = 6) {
    const z = this.z, out = [];
    let k = 0;
    for (const [id, n] of list) for (let i = 0; i < n; i++, k++) {
      let pos = null;
      for (let t = 0; t < 24 && !pos; t++) {
        const a = Math.random() * Math.PI * 2, r = (rMin + Math.random() * (rMax - rMin)) * TILE;
        const x = around.x + Math.cos(a) * r, y = around.y + Math.sin(a) * r * 0.85;
        if (!z.grid.blockedAt(x, y) && z.grid.findPath(x, y, around.x, around.y, 900)) pos = { x, y };
      }
      if (!pos) pos = { x: around.x + (k % 3 - 1) * TILE, y: around.y + 2 * TILE };
      const e = z.spawn(id, pos.x, pos.y, { leashR: 40 * TILE });
      e.questSpawn = true; e.objective = this;
      e.state = 'chase'; e.engaged = true;
      z.fx('spark', pos.x, pos.y - 20, { scale: 2, tint: 0xff6040 });
      out.push(e);
    }
    this.wave.push(...out);
    return out;
  }
  aliveWave() { return this.wave.filter((e) => !e.dead); }
  clearWave() { for (const e of this.wave) this.z.despawn(e); this.wave = []; }

  complete(text) {
    this.running = false;
    this.clearWave();
    this.z.everyone({ k: 'qe', op: 'done', id: this.id, kind: this.kind === 'escort' ? 'escort' : 'defend', s: text });
    this.state(true);
  }
  fail(text) {
    this.running = false;
    this.clearWave();
    this.reset();
    this.z.everyone({ k: 'qe', op: 'fail', id: this.id, s: text });
    this.state(true);
  }
  reset() { this.hp = this.maxHp; this.dead = false; }

  // görüntü durumu (konum, can) — çalışırken her 0,1 sn yakındakilere, bitişte herkese
  state(all = false) {
    const ev = { k: 'qeo', id: this.id, x: Math.round(this.x), y: Math.round(this.y), hp: Math.max(0, Math.round(this.hp)), mhp: this.maxHp, run: this.running ? 1 : 0, end: this.atEnd ? 1 : 0, wave: this.waveNo || 0 };
    if (all) this.z.everyone(ev); else this.z.ev(ev, this.x, this.y);
  }
}

export class SEscort extends Guarded {
  constructor(z, o) {
    super(z, o, 'escort');
    this.start = { x: this.x, y: this.y };
    this.speedPx = (o.speed || 2.4) * TILE;
    this.follow = (o.follow || 5) * TILE;
    this.atEnd = false;
  }

  buildPath() {
    const g = this.z.grid;
    const pts = [[this.x, this.y], ...this.o.route.map(([x, y]) => [x * TILE + TILE / 2, y * TILE + TILE / 2])];
    const path = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const seg = g.findPath(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 40000);
      if (seg && seg.length) path.push(...seg); else path.push({ x: pts[i + 1][0], y: pts[i + 1][1] });
    }
    return path;
  }

  begin() {
    this.x = this.start.x; this.y = this.start.y; this.atEnd = false;
    this.reset();
    this.path = this.buildPath();
    this.total = this.path.length; this.node = 0;
    this.ambushed = new Set();
    this.stuckT = 0; this.lastPos = { x: this.x, y: this.y };
    this.running = true;
  }

  reset() { super.reset(); if (this.start) { this.x = this.start.x; this.y = this.start.y; } }

  update(dt) {
    if (!this.running) return;
    const z = this.z;
    if (!this.nearPlayers(22 * TILE).length) { this.fail(`${this.o.name} yalnız kaldı. Refakat yeniden denenebilir.`); return; }
    const frac = this.total ? this.node / this.total : 1;
    for (const [k, am] of (this.o.ambushes || []).entries()) {
      if (!this.ambushed.has(k) && frac >= am.at) {
        this.ambushed.add(k);
        const ahead = this.path[Math.min(this.path.length - 1, this.node + 4)] || this;
        this.spawnWave(am.wave, ahead, 3.5, 5.5);
        z.everyone({ k: 'note', s: am.say || 'Pusu! Kervanı koru!', kind: 'elite' });
      }
    }
    const threatened = this.aliveWave().some((e) => Math.hypot(e.x - this.x, e.y - this.y) < 3.2 * TILE);
    const near = this.nearPlayers(this.follow).length > 0;
    if (near && !threatened && this.node < this.path.length) {
      const n = this.path[this.node];
      const dx = n.x - this.x, dy = n.y - this.y, d = Math.hypot(dx, dy);
      if (d < 5) this.node++;
      else { const step = Math.min(d, this.speedPx * dt); z.grid.move(this, dx / d * step, dy / d * step); }
      this.stuckT += dt;
      if (this.stuckT >= 1.5) {
        if (Math.hypot(this.x - this.lastPos.x, this.y - this.lastPos.y) < 6) { this.x = n.x; this.y = n.y; this.node++; }
        this.stuckT = 0; this.lastPos = { x: this.x, y: this.y };
      }
    }
    if (this.node >= this.path.length && !this.aliveWave().length) { this.atEnd = true; this.complete(this.o.doneSay || `${this.o.name} hedefe ulaştı!`); }
  }
}

export class SDefense extends Guarded {
  constructor(z, o) { super(z, o, 'defense'); this.waveNo = 0; this.waitT = 0; }
  begin() { this.reset(); this.running = true; this.waveNo = 0; this.nextWave(); }
  nextWave() {
    this.waveNo++;
    const ring = this.o.ring || [5, 7];
    this.spawnWave(this.o.waves[this.waveNo - 1], { x: this.x, y: this.y }, ring[0], ring[1]);
    this.z.everyone({ k: 'note', s: `${this.o.name}: Dalga ${this.waveNo}/${this.o.waves.length}`, kind: 'elite' });
  }
  update(dt) {
    if (!this.running) return;
    if (!this.nearPlayers(18 * TILE).length) { this.fail(`${this.o.name} savunmasız bırakıldı. Yeniden denenebilir.`); return; }
    if (this.aliveWave().length) return;
    if (this.waveNo >= this.o.waves.length) { this.complete(this.o.doneSay || `${this.o.name} korundu!`); return; }
    this.waitT += dt;
    if (this.waitT >= 1.4) { this.waitT = 0; this.nextWave(); }
  }
}

// Sunak: yaratık dalgaları (normal ödüllü yaratıklar); bitince yakındaki herkese "arındırıldı" (ödülü her oyuncu kendi
// bekleme süresine göre alır)
export class SAltar {
  constructor(z, o) { this.z = z; this.o = o; this.id = o.id; this.x = o.x * TILE + TILE / 2; this.y = o.y * TILE + TILE / 2; this.event = null; }
  start() {
    if (this.event) return false;
    this.event = { wave: 0, alive: [], waitT: 0 };
    this.z.everyone({ k: 'alt', op: 'start', id: this.id, n: this.o.waves.length });
    this.spawnWave();
    return true;
  }
  spawnWave() {
    const z = this.z, list = this.o.waves[this.event.wave];
    this.event.alive = list.map((id, i) => {
      const a = (i / list.length) * Math.PI * 2;
      let x = this.x + Math.cos(a) * 3 * TILE, y = this.y + Math.sin(a) * 2.5 * TILE;
      if (z.grid.blockedAt(x, y)) { x = this.x + (i - 1) * TILE; y = this.y + 2 * TILE; }
      const e = z.spawn(id, x, y, { leashR: 12 * TILE });
      let near = null;
      for (const p of z.players.values()) if (!p.dead && (!near || Math.hypot(p.x - x, p.y - y) < Math.hypot(near.x - x, near.y - y))) near = p;
      if (near) { e.target = near.uid; e.aggro(near, false); }
      z.fx('spark', x, y - 20, { scale: 2, tint: 0xc070ff });
      return e;
    });
  }
  update(dt) {
    const ev = this.event;
    if (!ev) return;
    if (![...this.z.players.values()].some((p) => Math.hypot(p.x - this.x, p.y - this.y) < 30 * TILE)) {
      for (const e of ev.alive) this.z.despawn(e);
      this.event = null;
      this.z.everyone({ k: 'alt', op: 'fail', id: this.id });
      return;
    }
    if (ev.alive.some((e) => !e.dead)) return;
    if (ev.wave + 1 < this.o.waves.length) {
      ev.waitT += dt;
      if (ev.waitT < 1.2) return;
      ev.waitT = 0; ev.wave++;
      this.z.everyone({ k: 'note', s: `Dalga ${ev.wave + 1}/${this.o.waves.length}`, kind: 'elite' });
      this.spawnWave();
      return;
    }
    this.event = null;
    this.z.ev({ k: 'alt', op: 'done', id: this.id }, this.x, this.y, 25 * TILE);
  }
}
