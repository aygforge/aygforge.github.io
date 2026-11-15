// TOP-DOWN okyanus: akan dalga dokusu, gemi izi, ortam yaşamı ve hava durumu.
// Gemi "kuzeye" (yukarı) ilerler; dünya aşağı akar. offset = katedilen mesafe (px).
import { makeCanvas, rect, px, hline, disc, ellipse, hash2 } from '../pixel.js';
import { DRAW } from './Props.js';
import { topShip } from './TopShip.js';

export const OCEAN = {
  calm: { base: '#2f78a6', deep: '#26668f', crest: '#7cc4e0', foam: '#e8f6fb' },
  open: { base: '#2a6a96', deep: '#1f5a82', crest: '#6ab4d4', foam: '#e0f2f8' },
  dark: { base: '#1b3a58', deep: '#142e48', crest: '#4a7aa0', foam: '#b8d0e0' },
  storm: { base: '#22405a', deep: '#18304a', crest: '#8aa4b8', foam: '#e8f0f4' },
  ice: { base: '#4a88a8', deep: '#3a7896', crest: '#c8e8f4', foam: '#ffffff' },
  eerie: { base: '#2a5a6a', deep: '#2a4060', crest: '#8af0c8', foam: '#d0fff0' },
  ash: { base: '#2a3a46', deep: '#202c36', crest: '#6a7a84', foam: '#c0c8cc' },
  tropical: { base: '#2a9aa8', deep: '#1f8494', crest: '#8ae8e8', foam: '#ffffff' },
};

const T = 128;
const tiles = new Map();
function waveTile(pal, layer) {
  const key = pal.base + layer;
  if (tiles.has(key)) return tiles.get(key);
  const c = makeCanvas(T, T);
  const ctx = c.getContext('2d');
  if (layer === 0) {
    rect(ctx, 0, 0, T, T, pal.base);
    for (let i = 0; i < 260; i++) {
      const x = Math.floor(hash2(i, 1, 9) * T), y = Math.floor(hash2(i, 2, 9) * T);
      const len = 2 + Math.floor(hash2(i, 3, 9) * 6);
      ctx.fillStyle = pal.deep;
      for (let k = 0; k < len; k++) ctx.fillRect((x + k) % T, (y + Math.round(Math.sin(k * 0.8))) % T, 1, 1);
    }
  } else {
    for (let i = 0; i < 70; i++) {
      const x = Math.floor(hash2(i, 4, 7 + layer) * T), y = Math.floor(hash2(i, 5, 7 + layer) * T);
      const len = 2 + Math.floor(hash2(i, 6, 7) * 5);
      ctx.fillStyle = layer === 1 ? pal.crest : 'rgba(255,255,255,0.65)';
      for (let k = 0; k < len; k++) ctx.fillRect((x + k) % T, y, 1, 1);
      if (layer === 1 && len > 4) ctx.fillRect((x + 1) % T, (y + 1) % T, len - 2, 1);
    }
  }
  tiles.set(key, c);
  return c;
}

function tileFill(ctx, tile, W, H, ox, oy) {
  const sx = ((ox % T) + T) % T;
  const sy = ((oy % T) + T) % T;
  for (let y = -T; y < H + T; y += T) for (let x = -T; x < W + T; x += T) ctx.drawImage(tile, Math.round(x + sx - T), Math.round(y + sy - T));
}

export class Ocean {
  constructor() {
    this.offset = 0;
    this.t = 0;
    this.wake = [];
    this.ambient = [];
    this.spawnT = 2;
    this.weather = [];
    this.flash = 0;
    this.preset = 'calm';
    this.night = false;
    this.clouds = [];
    for (let i = 0; i < 4; i++) this.clouds.push({ x: Math.random() * 640, y: Math.random() * 400, r: 40 + Math.random() * 60 });
  }

  update(dt, speed, W, H, opts = {}) {
    this.t += dt;
    this.offset += speed * dt;
    this.W = W;
    this.H = H;
    for (const w of this.wake) {
      w.y += speed * dt;
      w.x += w.vx * dt;
      w.life -= dt;
    }
    this.wake = this.wake.filter((w) => w.life > 0 && w.y < H + 10);
    for (const a of this.ambient) {
      a.y += (speed * (a.depth ?? 1) + (a.vy || 0)) * dt;
      a.x += (a.vx || 0) * dt;
      a.t += dt;
    }
    this.ambient = this.ambient.filter((a) => a.y < H + 120 && a.x > -200 && a.x < W + 200);
    for (const cl of this.clouds) {
      cl.y += (speed * 0.35 + 3) * dt;
      cl.x += 2 * dt;
      if (cl.y - cl.r > H) { cl.y = -cl.r * 2; cl.x = Math.random() * W; }
    }
    if (opts.ambient !== false && speed > 4) {
      this.spawnT -= dt * (speed / 30);
      if (this.spawnT <= 0) {
        this.spawnT = 3 + Math.random() * 5;
        this.spawnAmbient(W, opts.region || 1);
      }
    }
    // hava parçacıkları
    for (const p of this.weather) { p.x += p.vx * dt; p.y += (p.vy + speed * 0.4) * dt; p.life -= dt; }
    this.weather = this.weather.filter((p) => p.life > 0 && p.y < H + 5);
    const kinds = opts.fx || [];
    const want = { rain: 160, snow: 80, ash: 60, embers: 30 };
    for (const k of kinds) {
      if (!want[k]) continue;
      let n = 0;
      for (const p of this.weather) if (p.k === k) n++;
      for (; n < want[k]; n++) this.weather.push(this.spawnWeather(k, W, H));
    }
    this.weather = this.weather.filter((p) => kinds.includes(p.k));
    if (kinds.includes('lightning')) {
      this.flash = Math.max(0, this.flash - dt * 2.5);
      if (Math.random() < dt * 0.12) { this.flash = 1; this.onThunder?.(); }
    } else this.flash = 0;
  }

  spawnWeather(k, W, H) {
    const p = { k, x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0, life: 20 };
    if (k === 'rain') { p.vx = -40; p.vy = 260; p.life = 2; }
    if (k === 'snow') { p.vx = -6; p.vy = 18; }
    if (k === 'ash') { p.vx = -4; p.vy = 10; }
    if (k === 'embers') { p.vx = (Math.random() - 0.5) * 10; p.vy = -14; p.life = 4; }
    return p;
  }

  spawnAmbient(W, region) {
    const r = Math.random();
    const x = 40 + Math.random() * (W - 80);
    const side = Math.random() < 0.5 ? -1 : 1;
    const shipX = W / 2;
    const off = (lo) => shipX + side * (lo + Math.random() * (W / 2 - lo - 20));
    if (r < 0.2) this.ambient.push({ kind: 'fishSchool', x: off(70), y: -40, t: 0, n: 16 + Math.floor(Math.random() * 16) });
    else if (r < 0.38) this.ambient.push({ kind: 'gulls', x: Math.random() * W, y: -20, vx: (Math.random() - 0.5) * 40, vy: 25, t: 0, n: 2 + Math.floor(Math.random() * 4), air: true });
    else if (r < 0.5) this.ambient.push({ kind: 'debris', x: off(60), y: -20, t: 0, sub: Math.random() < 0.5 ? 'barrel' : 'timber' });
    else if (r < 0.6) this.ambient.push({ kind: 'distantShip', x: side < 0 ? 30 : W - 30, y: -80, vy: -14 + Math.random() * 8, t: 0, style: this.condition === 'pirates' ? (Math.random() < 0.7 ? 'pirate' : 'merchant') : this.condition === 'trade' ? 'merchant' : ['merchant', 'warship', 'pirate', 'merchant'][Math.floor(Math.random() * 4)], flip: Math.random() < 0.5 });
    if (this.condition === 'forgotten' && Math.random() < 0.5) this.ambient.push({ kind: 'glow', x: off(70), y: -40, t: 0 });
    else if (r < 0.7) this.ambient.push({ kind: 'shadow', x: off(80), y: -60, depth: 0.85, t: 0, s: 0.6 + Math.random() * 0.5 });
    else if (r < 0.8) this.ambient.push({ kind: 'islet', x: off(110), y: -70, t: 0, r: 16 + Math.random() * 14, palms: Math.floor(Math.random() * 3) });
    else if (r < 0.88 && region >= 3) this.ambient.push({ kind: 'fogBank', x: Math.random() * W, y: -80, t: 0, r: 70 });
    else if (r < 0.95) this.ambient.push({ kind: 'turtle', x: off(70), y: -30, depth: 0.9, t: 0 });
    else this.ambient.push({ kind: 'flyingFish', x: off(90), y: -30, t: 0 });
  }

  /** Arka plan: su + gölgeler + yüzen ortam nesneleri (gemiden önce çizilir) */
  drawBase(ctx, W, H) {
    const pal = OCEAN[this.preset] || OCEAN.calm;
    tileFill(ctx, waveTile(pal, 0), W, H, Math.sin(this.t * 0.2) * 3, this.offset * 0.85);
    tileFill(ctx, waveTile(pal, 1), W, H, Math.sin(this.t * 0.35) * 5, this.offset);
    tileFill(ctx, waveTile(pal, 2), W, H, 40 + Math.sin(this.t * 0.5) * 4, this.offset * 1.08 + 50);
    // bulut gölgeleri
    for (const cl of this.clouds) {
      ctx.fillStyle = 'rgba(10,20,40,0.10)';
      ellipse(ctx, cl.x, cl.y, cl.r, cl.r * 0.6, 'rgba(10,20,40,0.10)');
    }
    for (const a of this.ambient) if (!a.air) this.drawAmbient(ctx, a);
    for (const w of this.wake) {
      const a = Math.max(0, Math.min(1, w.life / w.max));
      ctx.fillStyle = `rgba(240,250,255,${0.75 * a})`;
      ctx.fillRect(Math.round(w.x), Math.round(w.y), w.s, w.s);
    }
  }

  drawAmbient(ctx, a) {
    switch (a.kind) {
      case 'fishSchool': DRAW.fishSchool(ctx, a.x, a.y, a.t, { n: a.n }); break;
      case 'debris': (a.sub === 'barrel' ? DRAW.barrel : DRAW.timber)(ctx, a.x, a.y, a.t, { n: 3 }); break;
      case 'shadow': DRAW.shadow(ctx, a.x, a.y, a.t, { s: a.s, a: 0.22 }); break;
      case 'islet': DRAW.island(ctx, a.x, a.y, a.t, { r: a.r, palms: a.palms }); break;
      case 'turtle': DRAW.turtle(ctx, a.x, a.y, a.t); break;
      case 'flyingFish': DRAW.flyingFish(ctx, a.x, a.y, a.t); break;
      case 'distantShip': {
        const s = topShip(1, 'healthy', a.style);
        ctx.globalAlpha = 0.85;
        ctx.save();
        ctx.translate(Math.round(a.x), Math.round(a.y));
        if (a.flip) ctx.rotate(Math.PI);
        ctx.scale(0.55, 0.55);
        ctx.drawImage(s.hull, -s.w / 2, -s.h / 2);
        ctx.drawImage(s.sailsFull, -s.w / 2, -s.h / 2);
        ctx.restore();
        ctx.globalAlpha = 1;
        break;
      }
      case 'fogBank': DRAW.fog(ctx, a.x, a.y, a.t, { r: a.r, a: 0.18 }); break;
      case 'glow': DRAW.glowPatch(ctx, a.x, a.y, a.t, { n: 3, w: 60, h: 40 }); break;
    }
  }

  /** Gemiden sonra çizilen hava katmanı ve uçan kuşlar */
  drawTop(ctx, W, H) {
    for (const a of this.ambient) {
      if (a.kind !== 'gulls') continue;
      for (let i = 0; i < a.n; i++) {
        const gx = a.x + i * 9 + Math.sin(a.t + i) * 4, gy = a.y + (i % 2) * 7;
        const f = Math.sin(a.t * 8 + i) > 0 ? 1 : 0;
        px(ctx, gx + 3, gy + 14, 'rgba(0,0,0,0.25)'); px(ctx, gx + 4, gy + 14, 'rgba(0,0,0,0.25)');
        hline(ctx, gx - 3, gx + 3, gy - f, '#f4f4f0');
        px(ctx, gx, gy + 1, '#f4f4f0'); px(ctx, gx, gy - 1, '#e8a040');
        px(ctx, gx - 3, gy - f, '#3a3a3a'); px(ctx, gx + 3, gy - f, '#3a3a3a');
      }
    }
    for (const p of this.weather) {
      if (p.k === 'rain') { ctx.fillStyle = 'rgba(200,220,240,0.55)'; ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 4); }
      else if (p.k === 'snow') px(ctx, p.x, p.y, '#ffffff');
      else if (p.k === 'ash') px(ctx, p.x, p.y, '#5a504c');
      else if (p.k === 'embers') px(ctx, p.x, p.y, Math.sin(p.life * 9) > 0 ? '#ffb040' : '#ff5a20');
    }
    if (this.fog) {
      for (let i = 0; i < 8; i++) DRAW.fog(ctx, (i * 97 + this.t * 6) % (W + 120) - 60, ((i * 61 + this.offset * 0.5) % (H + 120)) - 60, this.t, { r: 90, a: 0.16 * this.fog });
    }
    if (this.night) {
      ctx.fillStyle = 'rgba(8,12,40,0.42)';
      ctx.fillRect(0, 0, W, H);
    }
    if (this.dark) {
      ctx.fillStyle = `rgba(10,14,24,${this.dark})`;
      ctx.fillRect(0, 0, W, H);
    }
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(230,240,255,${this.flash * 0.4})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  /** Gemi izi: kıç ve pruva köpüğü */
  emitWake(x, y, beam, speed, sternY, bowY) {
    if (speed < 3) return;
    const n = Math.min(4, Math.ceil(speed / 12));
    for (let i = 0; i < n; i++) {
      for (const s of [-1, 1]) {
        this.wake.push({ x: x + s * (beam * 0.32 + Math.random() * 3), y: sternY + Math.random() * 2, vx: s * (6 + Math.random() * 10), life: 2.2, max: 2.2, s: Math.random() < 0.3 ? 2 : 1 });
        this.wake.push({ x: x + s * (beam * 0.18 + Math.random() * 4), y: bowY + Math.random() * 12, vx: s * (14 + Math.random() * 14), life: 0.9, max: 0.9, s: 1 });
      }
    }
    if (this.wake.length > 900) this.wake.splice(0, this.wake.length - 900);
  }
}
