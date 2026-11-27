// Dünya çizici — Tides'ın "gemi yukarı, deniz aşağı akar" mantığının kara yolu karşılığı.
// Yol, bölgeye göre önbelleğe alınmış prosedürel parçalar (chunk) halinde üretilir ve aşağı kayar.
import { Rng } from '../engine/rng.js';
import { REGIONS, LANE_TYPES } from '../data/world.js';
import { R, shade, drawHuman, drawCreature, drawProp, drawIcon, LOOKS } from './sprites.js';

export const W = 427, H = 240, HERO_SX = 213, HERO_SY = 176, CHUNK = 120, ROAD_W = 30;
const PCOL = {
  dust: ['#c8b08a', '#a8906a'], smoke: ['#8a8a8a', '#6a6a6a', '#aaaaaa'], fire: ['#ff7a2a', '#ffd23a', '#ff4a1a'], water: ['#7ac0ff', '#bfe0ff', '#ffffff'],
  spark: ['#ffe27a', '#ffffff', '#ffb03a'], leaf: ['#5aaa3a', '#3a8a2a', '#c8943a'], heal: ['#9ef08a', '#e8ffd8'], light: ['#fff6b0', '#ffffff'], magic: ['#c8a8ff', '#9ad8ff', '#ffffff'],
  curse: ['#6a2aff', '#2a0a3a', '#ff3a8a'], sparkle: ['#fff6c0', '#ffffff'], note: ['#f2e080', '#ffffff'], mist: ['#c8d0e0', '#a8b0c0'], wood: ['#8a6a3a', '#a8885a'], stone: ['#8a8a88', '#6a6a68'],
  ice: ['#bfe8ff', '#ffffff'], snow: ['#ffffff', '#e8f0ff'], poison: ['#6aff4a', '#3a9a2a'], bubble: ['#5a7a4a', '#7a9a6a'], spore: ['#e8d8ff', '#c8a8e8'], flour: ['#f8f4e8', '#e8e0d0'], bones: ['#e8e4d8'],
  heart: ['#ff5a7a'], crumb: ['#c88a3a'], gold: ['#f2c14e', '#ffe28a'], goldleaf: ['#f2c14e', '#ffd23a'], confetti: ['#ff5a7a', '#5ac8ff', '#ffe25a', '#7aff7a', '#c87aff'], feather: ['#1a1a2a', '#3a3a4a'],
  crow: ['#1a1a24'], bat: ['#2a1a2a'], bee: ['#ffd23a', '#2a2a2a'], glass: ['#bfe0ff', '#ffffff'], paper: ['#e8e0c8'], wax: ['#c82a2a'], ink: ['#1a1a3a'], mud: ['#5a4024', '#7a5a34'], cloth: ['#4a9a3a', '#c8e84a'],
  sand: ['#e8d8a0', '#c8b880'], rune: ['#7ae0ff', '#ffffff'], ring: ['#c8943a', '#ffe28a'], wisp: ['#7ac8ff', '#bfe0ff'], flower: ['#ff8ab0', '#ffe06a', '#c8a8ff'], blood: ['#c82a2a'],
};
const RISE = new Set(['smoke', 'fire', 'heal', 'light', 'magic', 'curse', 'note', 'mist', 'heart', 'bubble', 'spore', 'sparkle', 'wisp', 'rune', 'crow', 'bat', 'feather']);

export class World {
  constructor(canvas) {
    this.cv = canvas; this.c = canvas.getContext('2d'); this.c.imageSmoothingEnabled = false;
    this.entities = []; this.proj = []; this.parts = []; this.chunks = [];
    this.hero = { id: 'hero', kind: 'hero', x: 0, y: 0, dir: 'up', pose: 'idle', alpha: 1, persist: 1 };
    this.heroLook = {};
    this.mode = 'road'; this.region = 1; this.lane = 'trade'; this.tod = 'day'; this.seed = 'menu'; this.chunkN = 0;
    this.speed = 0; this.targetSpeed = 0; this.scrollLeft = 0; this.scrollRate = 0;
    this.cam = { x: 0, y: 0, tx: 0, ty: 0 }; this.lift = 0; this.liftCur = 0; this.zoom = 1; this.zoomCur = 1;
    this.darkCur = 0; this.darkTarget = 0; this.darkRate = 1;
    this.weather = { kind: 'clear', heavy: 0 }; this.wparts = [];
    this.shakeT = 0; this.shakeAmp = 0; this.flashT = 0; this.flashDur = 0; this.flashCol = '#fff';
    this.t = 0; this.timeStop = 0; this.gate = null; this.townCache = new Map(); this.town = null;
  }
  // ——— Varlıklar ———
  spawn(e) { const x = { alpha: 1, dir: 'down', pose: 'idle', encounter: 1, ...e }; if (x.prop) x.dir = 'down'; this.remove(x.id); this.entities.push(x); return x; }
  remove(id) { this.entities = this.entities.filter((e) => e.id !== id); }
  get(id) { return id === 'hero' ? this.hero : this.entities.find((e) => e.id === id); }
  clearEncounter() { this.entities = this.entities.filter((e) => !e.encounter); this.proj = []; }
  pos(at) {
    if (at == null || at === 'hero') return { x: this.hero.x, y: this.hero.y - 8 };
    if (typeof at === 'string') { const e = this.get(at); return e ? { x: e.x, y: e.y - (e.prop ? 4 : 8) } : { x: 0, y: -60 }; }
    return at;
  }
  // dünya → tuval pikseli
  toScreen(x, y) { const z = this.zoomCur, py = HERO_SY - this.liftCur; return { x: HERO_SX + (x - this.cam.x) * z, y: py + (y - this.cam.y) * z }; }
  toCanvas(x, y) { return { x: Math.round(HERO_SX + x - this.cam.x), y: Math.round(HERO_SY - this.liftCur + y - this.cam.y) }; }

  // ——— Yol parçaları ———
  setRoad({ region, lane, tod, seed }) {
    const changed = region !== this.region || seed !== this.seed;
    if (region) this.region = region; if (lane) this.lane = lane; if (tod) this.tod = tod; if (seed) this.seed = seed;
    if (!this.chunks.length || changed) this.resetChunks();
  }
  resetChunks() { this.chunks = []; for (let i = 0; i < 4; i++) this.chunks.push(this.makeChunk(H - CHUNK * (i + 1) + 40)); }
  makeChunk(y) {
    const n = this.chunkN++, rng = Rng.derive(this.seed, 'chunk', n), reg = REGIONS[this.region] || REGIONS[1];
    const cv = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(W, CHUNK) : Object.assign(document.createElement('canvas'), { width: W, height: CHUNK });
    const c = cv.getContext('2d'); c.imageSmoothingEnabled = false;
    // çimen ve doku
    R(c, 0, 0, W, CHUNK, reg.grass[0]);
    for (let i = 0; i < 260; i++) R(c, rng.int(0, W), rng.int(0, CHUNK), rng.int(1, 4), 1, reg.grass[rng.int(1, 2)]);
    for (let i = 0; i < 40; i++) { const x = rng.int(0, W), yy = rng.int(0, CHUNK); R(c, x, yy, 1, 2, shade(reg.grass[0], 1.25)); }
    const river = rng.chance(9);
    // yol
    const rx = HERO_SX - ROAD_W, rw = ROAD_W * 2;
    R(c, rx - 2, 0, rw + 4, CHUNK, shade(reg.road[0], 0.75));
    R(c, rx, 0, rw, CHUNK, reg.road[0]);
    if (reg.cobble) { for (let yy = 0; yy < CHUNK; yy += 5) for (let xx = rx + ((yy / 5) % 2) * 3; xx < rx + rw - 2; xx += 6) R(c, xx, yy, 5, 4, shade(reg.road[0], rng.range(0.88, 1.06))); }
    else { for (let i = 0; i < 120; i++) R(c, rng.int(rx + 1, rx + rw - 2), rng.int(0, CHUNK), rng.int(1, 3), 1, reg.road[1]); R(c, HERO_SX - 14, 0, 2, CHUNK, shade(reg.road[0], 0.9)); R(c, HERO_SX + 12, 0, 2, CHUNK, shade(reg.road[0], 0.9)); }
    if (river) {
      const ry = rng.int(30, 80); R(c, 0, ry, W, 18, '#3a6a9a'); for (let i = 0; i < 30; i++) R(c, rng.int(0, W), ry + rng.int(2, 15), rng.int(3, 8), 1, '#6a9aca');
      R(c, rx - 4, ry - 3, rw + 8, 24, '#8a6a3a'); for (let i = 0; i < 8; i++) R(c, rx - 4, ry - 3 + i * 3, rw + 8, 1, '#6a4a2a'); R(c, rx - 6, ry - 5, 2, 28, '#5a3a1a'); R(c, rx + rw + 4, ry - 5, 2, 28, '#5a3a1a');
    }
    // dekorlar (önbelleğe çizilir)
    const lane = LANE_TYPES[this.lane] || {}, decos = [...reg.deco, ...(lane.decoBias || [])];
    const list = [];
    const nd = rng.int(8, 13);
    for (let i = 0; i < nd; i++) {
      const side = rng.chance(50) ? -1 : 1;
      const x = HERO_SX + side * rng.int(ROAD_W + 12, 205), yy = rng.int(34, CHUNK - 2);
      const kind = rng.pick(decos);
      if (river && Math.abs(yy - 60) < 30) continue;
      list.push({ kind, x, y: yy });
    }
    if (rng.chance(18)) list.push({ kind: 'sign', x: HERO_SX + (rng.chance(50) ? -1 : 1) * (ROAD_W + 8), y: rng.int(40, 110) });
    list.sort((a, b) => a.y - b.y);
    for (const d of list) this.drawDeco(c, d, rng);
    return { y, cv };
  }
  drawDeco(c, d, rng) {
    switch (d.kind) {
      case 'haystack': R(c, d.x - 6, d.y - 8, 12, 8, '#d8b85a'); R(c, d.x - 4, d.y - 10, 8, 2, '#e8c86a'); break;
      case 'mine': R(c, d.x - 10, d.y - 14, 20, 14, '#6a6260'); R(c, d.x - 5, d.y - 10, 10, 10, '#141018'); R(c, d.x - 7, d.y - 12, 14, 2, '#7a5a3a'); break;
      case 'snowpatch': c.fillStyle = '#e8f0f8'; c.beginPath(); c.ellipse(d.x, d.y - 3, 12, 4, 0, 0, 7); c.fill(); break;
      case 'cartwreck': drawProp(c, 'cartWreck', d.x, d.y, {}, 0); break;
      case 'grave': drawProp(c, 'grave', d.x, d.y, {}, 0); break;
      case 'swamp': drawProp(c, 'swamp', d.x, d.y, {}, 0); break;
      case 'banner': drawProp(c, 'banner', d.x, d.y, { color: '#2a4a9a' }, 0); break;
      case 'deadtree': drawProp(c, 'deadtree', d.x, d.y, {}, 0); break;
      default: drawProp(c, d.kind, d.x, d.y, {}, 0);
    }
  }
  advance(dy) {
    if (!dy) return;
    for (const ch of this.chunks) ch.y += dy;
    for (const e of this.entities) if (!e.fly && !e.follow) e.y += dy;
    for (const p of this.parts) if (p.ground) p.y += dy;
    if (this.gate) this.gate.y += dy;
    // altta kalan parçaları geri dönüştür
    this.chunks.sort((a, b) => a.y - b.y);
    while (this.chunks.length && this.chunks[this.chunks.length - 1].y > H + 10) { this.chunks.pop(); this.chunks.unshift(this.makeChunk(this.chunks[0].y - CHUNK)); }
    while (this.chunks[0] && this.chunks[0].y > -CHUNK) this.chunks.unshift(this.makeChunk(this.chunks[0].y - CHUNK));
    // uzaklaşan varlıklar temizlenir
    this.entities = this.entities.filter((e) => e.persist || e.y < 260);
  }

  // ——— Efektler ———
  particles(kind, at, n = 12, opt = {}) {
    const p = this.pos(at), cols = PCOL[kind] || PCOL.dust, rise = RISE.has(kind);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = (opt.speed || 1) * (10 + Math.random() * 30);
      this.parts.push({ x: p.x + (Math.random() - 0.5) * 8, y: p.y + (Math.random() - 0.5) * 6, vx: Math.cos(a) * sp * (rise ? 0.4 : 1), vy: rise ? -10 - Math.random() * 25 : Math.sin(a) * sp - 15, g: rise ? -6 : 60, life: 0, max: 0.6 + Math.random() * 0.8, col: cols[i % cols.length], s: kind === 'confetti' || kind === 'smoke' || kind === 'mist' ? 2 : 1, ground: 1 });
    }
    if (this.parts.length > 600) this.parts.splice(0, this.parts.length - 600);
  }
  projectile(from, to, kind, dur) { const a = this.pos(from), b = this.pos(to); this.proj.push({ a, b, kind, t: 0, dur, arc: ['bomb', 'rock', 'coin', 'pouch', 'bread', 'herb', 'nut', 'carrot', 'ladle', 'bag', 'rope', 'ink'].includes(kind) ? 18 : kind === 'icon' ? 14 : 0 }); }
  coins(from, to, n) { for (let i = 0; i < n; i++) { const a = this.pos(from), b = this.pos(to); this.proj.push({ a: { x: a.x + (Math.random() - 0.5) * 6, y: a.y }, b: { x: b.x + (Math.random() - 0.5) * 4, y: b.y }, kind: 'coin', t: -i * 0.07, dur: 0.55, arc: 14 + Math.random() * 10 }); } }
  give(from, to, icon) { const a = this.pos(from), b = this.pos(to); this.proj.push({ a: { x: a.x, y: a.y - 4 }, b: { x: b.x, y: b.y - 4 }, kind: 'icon', icon, t: 0, dur: 0.7, arc: 16 }); }
  shake(amp, dur) { this.shakeAmp = Math.max(this.shakeAmp, amp); this.shakeT = Math.max(this.shakeT, dur); }
  flash(col, dur) { this.flashCol = col; this.flashT = dur; this.flashDur = dur; }
  setWeather(kind, opt = {}) { this.weather = { kind: kind || 'clear', heavy: opt.heavy || 0, thick: opt.thick || 0 }; }

  // ——— Güncelle ———
  update(dt) {
    this.t += dt;
    if (this.timeStop > 0) { this.timeStop -= dt; dt *= 0.05; }
    // kaydırma
    let dy = 0;
    if (this.scrollLeft > 0) { dy = Math.min(this.scrollLeft, this.scrollRate * dt); this.scrollLeft -= dy; }
    else { this.speed += (this.targetSpeed - this.speed) * Math.min(1, dt * 2.5); dy = this.speed * dt; }
    if (this.mode === 'road') this.advance(dy);
    this.walking = dy > 0.05;
    // kamera
    this.liftCur += (this.lift - this.liftCur) * Math.min(1, dt * 3);
    this.zoomCur += (this.zoom - this.zoomCur) * Math.min(1, dt * 2.5);
    this.cam.x += (this.cam.tx - this.cam.x) * Math.min(1, dt * 2.5); this.cam.y += (this.cam.ty - this.cam.y) * Math.min(1, dt * 2.5);
    this.darkCur += Math.sign(this.darkTarget - this.darkCur) * Math.min(Math.abs(this.darkTarget - this.darkCur), dt * this.darkRate);
    // varlıklar: ara geçişler
    for (const e of [this.hero, ...this.entities]) {
      if (e.tween) {
        const tw = e.tween; tw.t += dt; const k = Math.min(1, tw.t / tw.dur), q = tw.ease === 'linear' ? k : k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        for (const key of Object.keys(tw.to)) if (typeof tw.to[key] === 'number') e[key] = tw.from[key] + (tw.to[key] - tw.from[key]) * q;
        if (tw.walk && !e.prop) { e.pose = tw.run ? 'run' : 'walk'; const dx = tw.to.x != null ? tw.to.x - tw.from.x : 0, dyy = tw.to.y != null ? tw.to.y - tw.from.y : 0; if (Math.abs(dx) > 1 || Math.abs(dyy) > 1) e.dir = Math.abs(dx) > Math.abs(dyy) ? (dx < 0 ? 'left' : 'right') : (dyy < 0 ? 'up' : 'down'); }
        if (k >= 1) { const done = tw.after; e.tween = null; if (tw.walk && !e.prop) { e.pose = tw.endPose || 'idle'; if (tw.endDir) e.dir = tw.endDir; } if (done) done(e); }
      }
      if (e.jumpT != null) { e.jumpT += dt; e.z = Math.sin(Math.min(1, e.jumpT / e.jumpDur) * Math.PI) * e.jumpH; if (e.jumpT >= e.jumpDur) { e.jumpT = null; e.z = 0; } }
      if (e.hitT > 0) e.hitT -= dt;
      if (e.emoteT > 0) e.emoteT -= dt;
      if (e.swingT > 0) e.swingT -= dt;
      if (e.spinT > 0) { e.spinT -= dt; e.dir = ['down', 'left', 'up', 'right'][Math.floor(e.spinT * 12) % 4]; if (e.spinT <= 0) e.dir = e.spinEnd || 'down'; }
      if (e.flee) { e.x += e.flee.vx * dt; e.y += e.flee.vy * dt; if (Math.abs(e.x) > 260 || e.y < -260 || e.y > 260) e.dead = true; }
      if (e.carriedBy) { const c = this.get(e.carriedBy); if (c) { e.x = c.x; e.y = c.y - 0.5; e.z = 10; } }
      if (e.follow && e !== this.hero) { e.x += (this.hero.x + 14 - e.x) * Math.min(1, dt * 2); e.y += (this.hero.y + 16 - e.y) * Math.min(1, dt * 2); e.pose = this.walking ? 'walk' : 'idle'; e.dir = 'up'; }
    }
    this.entities = this.entities.filter((e) => !e.dead);
    if (!this.hero.tween && this.mode === 'road') { if (this.walking) { this.hero.pose = this.hero.pose === 'idle' || this.hero.pose === 'walk' ? 'walk' : this.hero.pose; this.hero.dir = 'up'; } else if (this.hero.pose === 'walk') this.hero.pose = 'idle'; }
    // mermiler
    for (const p of this.proj) p.t += dt;
    this.proj = this.proj.filter((p) => p.t < p.dur);
    for (const p of this.parts) { p.life += dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.96; }
    this.parts = this.parts.filter((p) => p.life < p.max);
    if (this.shakeT > 0) this.shakeT -= dt; else this.shakeAmp = 0;
    if (this.flashT > 0) this.flashT -= dt;
    this.updateWeather(dt);
  }
  updateWeather(dt) {
    const w = this.weather.kind, want = w === 'rain' ? (this.weather.heavy ? 160 : 90) : w === 'snow' ? 70 : w === 'blizzard' ? 180 : 0;
    while (this.wparts.length < want) this.wparts.push({ x: Math.random() * W, y: Math.random() * H, v: 0.6 + Math.random() * 0.6 });
    if (this.wparts.length > want) this.wparts.length = want;
    for (const p of this.wparts) {
      if (w === 'rain') { p.y += 260 * p.v * dt; p.x -= 40 * dt; } else { p.y += (w === 'blizzard' ? 70 : 28) * p.v * dt + (this.walking ? 20 * dt : 0); p.x += (w === 'blizzard' ? -90 : Math.sin(this.t + p.v * 9) * 10) * dt; }
      if (p.y > H) { p.y = -4; p.x = Math.random() * W; } if (p.x < -10) p.x = W; if (p.x > W + 10) p.x = 0;
    }
  }

  // ——— Çiz ———
  render() {
    const c = this.c; c.setTransform(1, 0, 0, 1, 0, 0);
    const sx = this.shakeAmp ? Math.round((Math.random() - 0.5) * this.shakeAmp) : 0, sy = this.shakeAmp ? Math.round((Math.random() - 0.5) * this.shakeAmp) : 0;
    c.translate(sx, sy);
    const z = this.zoomCur, py = HERO_SY - this.liftCur;
    if (this.mode !== 'town' && Math.abs(z - 1) > 0.001) { c.translate(HERO_SX * (1 - z), py * (1 - z)); c.scale(z, z); R(c, -W, -H, W * 3, H * 3, (REGIONS[this.region] || REGIONS[1]).grass[0]); }
    if (this.mode === 'town' && this.town) this.renderTownBg();
    else { const oy = -this.liftCur - this.cam.y; for (const ch of this.chunks) c.drawImage(ch.cv, -Math.round(this.cam.x), Math.round(ch.y + oy)); }
    if (this.gate && this.mode !== 'town') this.drawGate(this.gate);
    // varlıklar
    const list = [...this.entities, this.hero].filter((e) => e.alpha > 0.01 && !e.hidden).sort((a, b) => (a.layer || 0) - (b.layer || 0) || (a.y + (a.elev ? 4 : 0)) - (b.y + (b.elev ? 4 : 0)));
    for (const e of list) this.drawEntity(e);
    // mermiler
    for (const p of this.proj) {
      if (p.t < 0) continue;
      const k = Math.min(1, p.t / p.dur), x = p.a.x + (p.b.x - p.a.x) * k, y = p.a.y + (p.b.y - p.a.y) * k - Math.sin(k * Math.PI) * p.arc, s = this.toCanvas(x, y);
      if (p.kind === 'icon') drawIcon(c, p.icon, s.x - 5, s.y - 5, 1);
      else this.drawProj(p.kind, s.x, s.y, p.a, p.b);
    }
    for (const p of this.parts) { const s = this.toCanvas(p.x, p.y); c.globalAlpha = Math.max(0, 1 - p.life / p.max); R(c, s.x, s.y, p.s, p.s, p.col); }
    c.globalAlpha = 1;
    c.setTransform(1, 0, 0, 1, 0, 0);
    this.renderWeather();
    if (this.flashT > 0) { c.globalAlpha = Math.max(0, this.flashT / this.flashDur) * 0.7; R(c, -10, -10, W + 20, H + 20, this.flashCol); c.globalAlpha = 1; }
  }
  drawProj(kind, x, y, a, b) {
    const c = this.c;
    switch (kind) {
      case 'arrow': { const ang = Math.atan2(b.y - a.y, b.x - a.x); c.save(); c.translate(x, y); c.rotate(ang); R(c, -5, 0, 8, 1, '#8a6a3a'); R(c, 3, -1, 2, 3, '#d8d8e0'); R(c, -6, -1, 2, 3, '#e8e8e8'); c.restore(); break; }
      case 'magic': case 'fireball': R(c, x - 2, y - 2, 5, 5, kind === 'fireball' ? '#ff7a2a' : '#c8a8ff'); R(c, x - 1, y - 1, 3, 3, '#ffffff'); this.parts.push({ x: x - HERO_SX + this.cam.x, y: y - HERO_SY + this.liftCur + this.cam.y, vx: 0, vy: 0, g: 0, life: 0, max: 0.25, col: kind === 'fireball' ? '#ffb03a' : '#9ad8ff', s: 2 }); break;
      case 'bomb': R(c, x - 2, y - 2, 4, 4, '#2a2a2a'); R(c, x, y - 4, 1, 2, '#ff7a2a'); break;
      case 'rock': R(c, x - 3, y - 3, 6, 5, '#7a7a78'); break;
      case 'ice': R(c, x - 1, y - 4, 3, 7, '#bfe8ff'); break;
      case 'coin': R(c, x - 1, y - 1, 3, 3, '#f2c14e'); R(c, x, y, 1, 1, '#ffe28a'); break;
      case 'ink': R(c, x - 2, y - 2, 4, 4, '#1a1a3a'); break;
      case 'rope': R(c, x - 2, y - 2, 4, 4, '#c8a86a'); break;
      default: drawIcon(c, kind === 'pouch' ? 'bag' : kind, x - 5, y - 5, 1);
    }
  }
  drawEntity(e) {
    const c = this.c, s = this.toCanvas(e.x, e.y - (e.z || 0) - (e.elev ? 10 : 0));
    c.save();
    c.globalAlpha = Math.max(0, Math.min(1, e.alpha == null ? 1 : e.alpha));
    if (e.glow) { const g = c.createRadialGradient(s.x, s.y - 8, 2, s.x, s.y - 8, 18); g.addColorStop(0, e.glow + 'aa'); g.addColorStop(1, e.glow + '00'); c.fillStyle = g; c.fillRect(s.x - 20, s.y - 28, 40, 40); }
    const scale = e.scale || 1;
    if (scale !== 1 && e.kind !== 'wolf' && e.kind !== 'crow') { c.translate(s.x, s.y); c.scale(scale, scale); c.translate(-s.x, -s.y); }
    if (e.rot && e.prop && !['fallingTree', 'mill', 'bell', 'scaffold'].includes(e.kind)) { c.translate(s.x, s.y); c.rotate(e.rot); c.translate(-s.x, -s.y); }
    if (e.sunk || e.swim) { c.beginPath(); c.rect(s.x - 30, s.y - 60, 60, 60 - (e.sunk ? 7 : 5)); c.clip(); }
    if (e.crouch && e.tween) { c.translate(s.x, s.y); c.scale(1, 0.85); c.translate(-s.x, -s.y); }
    const hit = e.hitT > 0 && Math.floor(e.hitT * 20) % 2 === 0;
    if (hit) c.globalAlpha *= 0.45;
    if (e.prop) drawProp(c, e.kind, s.x, s.y, e, this.t);
    else if (e.id === 'hero') {
      const pose = e.swingT > 0 ? 'attack' : e.pose;
      drawHuman(c, s.x, s.y, { kind: 'hero', look: this.heroLook, prop: this.heroProp, acc: this.heroAcc, armorWeight: this.heroArmorW }, e.dir, e.climb ? 'reach' : pose, this.t, e);
      if (e.armorTalk) { const o = Math.floor(this.t * 3) % 2; R(c, s.x - 2, s.y - 13, 4, 1, o ? '#1a1a1a' : '#9a9aa8'); }
    } else if (LOOKS[e.kind] && !e.mounted) drawHuman(c, s.x, s.y, e, e.dir, e.swingT > 0 ? 'attack' : e.pose, this.t, e);
    else drawCreature(c, e.kind, s.x, s.y, e, this.t);
    if (e.sunk || e.swim) { c.restore(); c.save(); R(c, s.x - 8, s.y - (e.sunk ? 7 : 5), 16, 2, e.sunk ? '#5a4024' : '#7ac0ff'); }
    c.restore();
    if (e.emoteT > 0 && e.emote) {
      const ey = s.y - (e.prop ? 22 : 26) - (e.kind === 'troll' || e.kind === 'golem' || e.kind === 'wyvern' ? 18 : 0);
      R(c, s.x - 5, ey - 1, 11, 9, '#fffaf0'); R(c, s.x - 5, ey - 1, 11, 1, '#2a1a10'); R(c, s.x - 5, ey + 7, 11, 1, '#2a1a10'); R(c, s.x - 1, ey + 8, 2, 2, '#fffaf0');
      const em = e.emote, cx = s.x;
      if (em === '💢') { R(c, cx - 3, ey + 1, 2, 2, '#e82a2a'); R(c, cx + 1, ey + 1, 2, 2, '#e82a2a'); R(c, cx - 3, ey + 4, 2, 2, '#e82a2a'); R(c, cx + 1, ey + 4, 2, 2, '#e82a2a'); }
      else if (em === '💧') { R(c, cx, ey + 1, 1, 1, '#3a8ae8'); R(c, cx - 1, ey + 2, 3, 2, '#3a8ae8'); R(c, cx - 2, ey + 4, 5, 2, '#3a8ae8'); R(c, cx - 1, ey + 6, 3, 1, '#3a8ae8'); }
      else if (em === '♥') { R(c, cx - 3, ey + 1, 2, 2, '#e83a5a'); R(c, cx + 1, ey + 1, 2, 2, '#e83a5a'); R(c, cx - 3, ey + 2, 6, 2, '#e83a5a'); R(c, cx - 2, ey + 4, 4, 1, '#e83a5a'); R(c, cx - 1, ey + 5, 2, 1, '#e83a5a'); }
      else if (em === '✸') { R(c, cx - 1, ey, 2, 7, '#f2c14e'); R(c, cx - 3, ey + 2, 6, 2, '#f2c14e'); }
      else { c.fillStyle = '#2a1a10'; c.font = '8px "Jersey 10", monospace'; c.textAlign = 'center'; c.textBaseline = 'top'; c.fillText(em === 'zzz' ? 'z z' : em, cx + 0.5, ey - 0.5); }
    }
  }
  drawGate(g) {
    const c = this.c, s = this.toCanvas(0, g.y), x = s.x, y = s.y, t = g.type;
    const wall = t === 'monastery' ? '#c8c0b0' : t === 'fort' || t === 'capital' || t === 'city' ? '#9a9a98' : t === 'mountain' ? '#8a7a6a' : '#8a6a3a';
    if (t === 'village' || t === 'trade') { for (let i = -18; i <= 18; i++) if (Math.abs(i) > 4) R(c, x + i * 6 - 2, y - 26, 4, 26, wall); R(c, x - 30, y - 34, 6, 34, shade(wall, 0.8)); R(c, x + 24, y - 34, 6, 34, shade(wall, 0.8)); R(c, x - 30, y - 38, 60, 5, '#7a4a2a'); }
    else { R(c, x - W, y - 34, W * 2, 34, wall); R(c, x - W, y - 38, W * 2, 4, shade(wall, 1.15)); for (let i = -40; i < 40; i++) R(c, x + i * 10, y - 42, 5, 4, shade(wall, 1.15)); R(c, x - 40, y - 56, 20, 56, shade(wall, 0.9)); R(c, x + 20, y - 56, 20, 56, shade(wall, 0.9)); if (t === 'capital') { R(c, x - 32, y - 70, 4, 14, '#5a3a1a'); R(c, x - 28, y - 70, 10, 6, '#c82a2a'); R(c, x + 28, y - 70, 4, 14, '#5a3a1a'); R(c, x + 32, y - 70, 10, 6, '#c82a2a'); } }
    R(c, x - 18, y - 30, 36, 30, '#2a1a10'); R(c, x - 16, y - 28, 32, 2, '#5a3a1a');
    if (g.open) R(c, x - 16, y - 26, 32, 26, '#4a3a2a');
  }
  renderWeather() {
    const c = this.c, w = this.weather.kind;
    if (w === 'rain') { c.fillStyle = 'rgba(180,200,230,0.6)'; for (const p of this.wparts) c.fillRect(p.x, p.y, 1, 4); }
    if (w === 'snow' || w === 'blizzard') { c.fillStyle = '#ffffff'; for (const p of this.wparts) c.fillRect(p.x, p.y, p.v > 1 ? 2 : 1, p.v > 1 ? 2 : 1); if (w === 'blizzard') { c.fillStyle = 'rgba(230,240,255,0.25)'; c.fillRect(0, 0, W, H); } }
    if (w === 'fog') { c.fillStyle = `rgba(210,215,225,${this.weather.thick ? 0.38 : 0.22})`; c.fillRect(0, 0, W, H); for (let i = 0; i < 5; i++) { const yy = ((this.t * 6 + i * 50) % (H + 60)) - 30; c.fillStyle = 'rgba(225,230,240,0.18)'; c.fillRect(0, yy, W, 22); } }
    const night = this.tod === 'night' && this.mode === 'road' ? 0.38 : this.tod === 'dusk' && this.mode === 'road' ? 0.14 : 0;
    const dk = Math.max(night, this.darkCur);
    if (dk > 0.01) {
      const s = this.toScreen(this.hero.x, this.hero.y - 8);
      const g = c.createRadialGradient(s.x, s.y, 10, s.x, s.y, 150);
      const col = this.tod === 'dusk' && this.darkCur < 0.15 ? '40,20,40' : '8,8,24';
      g.addColorStop(0, `rgba(${col},${dk * 0.55})`); g.addColorStop(1, `rgba(${col},${Math.min(0.9, dk * 1.2)})`);
      c.fillStyle = g; c.fillRect(0, 0, W, H);
    }
  }
  // ——— Kasaba sahnesi ———
  setTown(town) { this.mode = 'town'; this.town = town; this.entities = this.entities.filter((e) => e.townNpc); if (!this.entities.length) this.spawnTownNpcs(town); this.hero.x = 0; this.hero.y = 0; this.hero.dir = 'up'; this.hero.pose = 'idle'; this.cam.tx = this.cam.ty = this.cam.x = this.cam.y = 0; this.lift = this.liftCur = 40; this.zoom = this.zoomCur = 1; }
  spawnTownNpcs(town) {
    const rng = Rng.derive(town.id, 'npc'), kinds = town.type === 'fort' ? ['soldier', 'soldier', 'officer', 'villager'] : town.type === 'monastery' ? ['monk', 'monk', 'priest', 'pilgrim'] : town.type === 'mountain' ? ['miner', 'dwarf', 'villager', 'villagerF'] : town.type === 'capital' ? ['guard', 'noble', 'herald', 'villagerF', 'merchant'] : ['villager', 'villagerF', 'merchant', 'child', 'farmer'];
    for (let i = 0; i < 5; i++) this.entities.push({ id: 'tn' + i, kind: kinds[(i + rng.int(0, 4)) % kinds.length], x: rng.int(-110, 110), y: rng.int(-70, -10), dir: rng.pick(['down', 'left', 'right']), pose: 'idle', alpha: 1, townNpc: 1, persist: 1, wanderT: rng.range(1, 4) });
  }
  townWander(dt) {
    for (const e of this.entities) if (e.townNpc && !e.tween) { e.wanderT -= dt; if (e.wanderT <= 0) { e.wanderT = 2 + Math.random() * 4; const tx = Math.max(-140, Math.min(140, e.x + (Math.random() - 0.5) * 60)), ty = Math.max(-80, Math.min(-6, e.y + (Math.random() - 0.5) * 30)); e.tween = { from: { x: e.x, y: e.y }, to: { x: tx, y: ty }, t: 0, dur: 1.6 + Math.random(), walk: 1 }; } }
  }
  renderTownBg() {
    const key = this.town.type + '|' + this.town.region;
    if (!this.townCache.has(key)) this.townCache.set(key, this.makeTownBg(this.town));
    this.c.drawImage(this.townCache.get(key), 0, 0);
  }
  makeTownBg(town) {
    const cv = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(W, H) : Object.assign(document.createElement('canvas'), { width: W, height: H });
    const c = cv.getContext('2d'), rng = Rng.derive(town.type, town.region, 'townbg'), reg = REGIONS[town.region] || REGIONS[1], t = town.type;
    R(c, 0, 0, W, H, reg.grass[0]); for (let i = 0; i < 300; i++) R(c, rng.int(0, W), rng.int(0, H), rng.int(1, 3), 1, reg.grass[rng.int(1, 2)]);
    // meydan
    const sq = t === 'village' ? '#a8845a' : t === 'monastery' ? '#c8c0a8' : '#9a958a';
    R(c, 40, 60, W - 80, 150, sq);
    for (let y = 60; y < 210; y += 6) for (let x = 40 + ((y / 6) % 2) * 4; x < W - 40; x += 8) R(c, x, y, 7, 5, shade(sq, rng.range(0.9, 1.06)));
    R(c, HERO_SX - 24, 200, 48, 40, shade(sq, 0.95));
    // binalar
    const wall = t === 'fort' || t === 'capital' ? '#8a8a88' : t === 'monastery' ? '#d8d0c0' : t === 'mountain' ? '#7a6a5a' : '#c8a878';
    const roof = t === 'mountain' ? '#e8f0f8' : t === 'monastery' ? '#7a3a2a' : t === 'capital' ? '#2a4a9a' : '#8a3a2a';
    const house = (x, y, w, h) => { R(c, x, y, w, h, wall); R(c, x - 3, y - 8, w + 6, 9, roof); R(c, x, y - 12, w, 4, shade(roof, 1.1)); R(c, x + w / 2 - 3, y + h - 10, 6, 10, '#4a2a1a'); R(c, x + 4, y + 6, 5, 5, '#ffd27a'); if (w > 30) R(c, x + w - 9, y + 6, 5, 5, '#ffd27a'); };
    const n = t === 'city' || t === 'capital' ? 7 : 5;
    for (let i = 0; i < n; i++) house(20 + i * ((W - 40) / n), 14 + (i % 2) * 6, 34 + rng.int(0, 10), 30);
    house(6, 120, 30, 34); house(W - 38, 120, 30, 34);
    if (t === 'fort' || t === 'capital' || t === 'city') { R(c, 0, 0, W, 10, '#7a7a78'); for (let i = 0; i < 44; i++) R(c, i * 10, 0, 5, 14, '#8a8a88'); }
    if (t === 'capital') { R(c, HERO_SX - 40, 0, 80, 44, '#c8c4b8'); R(c, HERO_SX - 50, -2, 20, 54, '#b8b4a8'); R(c, HERO_SX + 30, -2, 20, 54, '#b8b4a8'); R(c, HERO_SX - 12, 20, 24, 24, '#2a1a10'); R(c, HERO_SX - 2, 0, 4, 10, '#c82a2a'); }
    if (t === 'monastery') { R(c, HERO_SX - 16, 2, 32, 40, '#e8e0d0'); R(c, HERO_SX - 6, -10, 12, 14, '#e8e0d0'); R(c, HERO_SX - 1, -16, 2, 8, '#c8a02a'); R(c, HERO_SX - 4, -13, 8, 2, '#c8a02a'); }
    // pazar tezgâhları, kuyu, çeşme
    drawProp(c, 'stall', 90, 110, {}, 0); drawProp(c, 'stall', W - 90, 110, {}, 0); drawProp(c, 'well', HERO_SX, 112, {}, 0);
    drawProp(c, 'barrel', 70, 160, {}, 0); drawProp(c, 'crate', 80, 164, {}, 0); drawProp(c, 'banner', W - 70, 170, { color: t === 'capital' ? '#c82a2a' : '#2a4a9a' }, 0);
    if (t === 'trade' || t === 'city') drawProp(c, 'cart', W - 120, 180, {}, 0);
    if (t === 'fort') { drawProp(c, 'armorStand', 120, 170, {}, 0); drawProp(c, 'anvil', 130, 180, {}, 0); }
    if (t === 'mountain') { drawProp(c, 'rock', 60, 200, {}, 0); drawProp(c, 'pine', 30, 220, {}, 0); drawProp(c, 'pine', W - 30, 220, {}, 0); }
    if (t === 'village') { drawProp(c, 'tree', 30, 220, {}, 0); drawProp(c, 'tree', W - 30, 220, {}, 0); drawProp(c, 'flowers', 120, 200, {}, 0); }
    return cv;
  }
}
