// Katmanlı gökyüzü, deniz ve hava durumu (düşük çözünürlüklü tampona çizilir).
import { rect, ditherGradient, hash2, disc, ellipse, makeCanvas, px, hline, line } from './pixel.js';

export const SKIES = {
  day: { stops: [[0, '#4f97cf'], [0.65, '#8ccbe6'], [1, '#d3eef0']], sun: { x: 0.78, y: 0.18, c: '#fff3b0', r: 9 }, cloud: '#f4fbff', cloudShade: '#c6dde8' },
  dawn: { stops: [[0, '#3f4f8c'], [0.55, '#d98c8c'], [1, '#ffd49a']], sun: { x: 0.25, y: 0.82, c: '#ffe2a0', r: 11 }, cloud: '#ffd6c4', cloudShade: '#c98c96' },
  dusk: { stops: [[0, '#25224f'], [0.5, '#a24f72'], [1, '#f09450']], sun: { x: 0.7, y: 0.86, c: '#ffc070', r: 12 }, cloud: '#e59a8a', cloudShade: '#8a4a6a' },
  night: { stops: [[0, '#070b20'], [1, '#1f2a52']], moon: { x: 0.75, y: 0.2 }, stars: true, cloud: '#2c3866', cloudShade: '#1c2448' },
  storm: { stops: [[0, '#151a24'], [1, '#3f4a5a']], cloud: '#4a5464', cloudShade: '#2a303c', heavy: true },
  fog: { stops: [[0, '#76838f'], [1, '#bcc5cc']], cloud: '#a8b2ba', cloudShade: '#8a949c' },
  overcast: { stops: [[0, '#5f6e7e'], [1, '#a5b2bd']], cloud: '#b8c2ca', cloudShade: '#8a96a2', heavy: true },
  aurora: { stops: [[0, '#050a1c'], [1, '#18264a']], stars: true, aurora: true, moon: { x: 0.2, y: 0.18 }, cloud: '#1f2a4a', cloudShade: '#141c36' },
  ash: { stops: [[0, '#21130f'], [0.6, '#5e2a1c'], [1, '#a2481e']], cloud: '#3a2420', cloudShade: '#22140f', heavy: true },
  eerie: { stops: [[0, '#1d1236'], [0.6, '#4d2d6e'], [1, '#2f9a82']], stars: true, cloud: '#3a2a5a', cloudShade: '#22183c' },
};

export const SEAS = {
  calm: { bands: ['#4c93bb', '#3c7ea6', '#306b8f', '#25587a'], hi: '#a8dbef', foam: '#e8f6fb' },
  choppy: { bands: ['#3e7ea6', '#2f6a90', '#245979', '#1b4864'], hi: '#cfe8f0', foam: '#ffffff' },
  rough: { bands: ['#2d4b60', '#223a4c', '#1a2d3c', '#11202d'], hi: '#8aa4b4', foam: '#d8e4ea' },
  dark: { bands: ['#1d2b42', '#162236', '#10192a', '#0a1220'], hi: '#4d6d8f', foam: '#9ab0c4' },
  ice: { bands: ['#82b4cc', '#6c9db8', '#5b8ba6', '#4a7892'], hi: '#ffffff', foam: '#ffffff', floes: true },
  lava: { bands: ['#3c2622', '#2e1c1a', '#221414', '#180e0e'], hi: '#ff7a2a', foam: '#ffb060' },
  eerie: { bands: ['#3f6f7c', '#3a4f78', '#3a3a6e', '#2a2650'], hi: '#9af0d0', foam: '#d0fff0' },
};

const NIGHTISH = new Set(['night', 'aurora', 'storm', 'eerie', 'ash']);

export class SeaRenderer {
  constructor() {
    this.clouds = [];
    this.particles = [];
    this.flash = 0;
    this.bolt = null;
    this.cloudSprites = new Map();
  }

  cloudSprite(preset, i) {
    const key = preset + i;
    if (this.cloudSprites.has(key)) return this.cloudSprites.get(key);
    const sky = SKIES[preset] || SKIES.day;
    const w = 26 + ((i * 13) % 20);
    const h = 8 + ((i * 7) % 5);
    const c = makeCanvas(w, h + 2);
    const ctx = c.getContext('2d');
    const blobs = 3 + (i % 3);
    for (let b = 0; b < blobs; b++) {
      const bx = 5 + (b / (blobs - 1 || 1)) * (w - 10);
      const r = 3 + ((b * 5 + i) % 4);
      ellipse(ctx, bx, h - r + 1, r + 2, r, sky.cloudShade);
      ellipse(ctx, bx, h - r, r + 2, r, sky.cloud);
    }
    rect(ctx, 2, h - 1, w - 4, 2, sky.cloudShade);
    this.cloudSprites.set(key, c);
    return c;
  }

  drawSky(ctx, W, horizon, t, preset = 'day', opts = {}) {
    const sky = SKIES[preset] || SKIES.day;
    const key = `${preset}|${W}|${horizon}`;
    this.skyCache ||= new Map();
    let c = this.skyCache.get(key);
    if (!c) {
      c = makeCanvas(W, horizon + 1);
      ditherGradient(c.getContext('2d'), 0, 0, W, horizon + 1, sky.stops);
      if (this.skyCache.size > 12) this.skyCache.clear();
      this.skyCache.set(key, c);
    }
    ctx.drawImage(c, 0, 0);
    if (sky.stars) {
      for (let i = 0; i < 70; i++) {
        const x = Math.floor(hash2(i, 1, 7) * W);
        const y = Math.floor(hash2(i, 2, 7) * horizon * 0.9);
        const tw = Math.sin(t * 2 + i) > 0.6 ? '#ffffff' : '#9aa6d0';
        px(ctx, x, y, tw);
      }
    }
    if (sky.aurora) {
      for (let x = 0; x < W; x++) {
        const y0 = 18 + Math.sin(x * 0.03 + t * 0.4) * 7 + Math.sin(x * 0.011 - t * 0.2) * 9;
        const len = 18 + Math.sin(x * 0.05 + t) * 6;
        for (let y = 0; y < len; y += 1) {
          if ((x + y) % 2 === 0 || y < len * 0.4) px(ctx, x, y0 + y, y < len * 0.45 ? '#5affb0' : x % 3 ? '#8a5aff' : '#3ad08a');
        }
      }
    }
    if (sky.sun && !opts.noSun) {
      const sx = sky.sun.x * W;
      const sy = sky.sun.y * horizon;
      disc(ctx, sx, sy, sky.sun.r + 3, 'rgba(255,240,180,0.25)');
      disc(ctx, sx, sy, sky.sun.r, sky.sun.c);
    }
    if (sky.moon) {
      const mx = sky.moon.x * W;
      const my = sky.moon.y * horizon;
      disc(ctx, mx, my, 9, 'rgba(220,230,255,0.15)');
      disc(ctx, mx, my, 6, '#e8ecf6');
      disc(ctx, mx + 3, my - 2, 5, sky.stops[0][1]);
    }
    // Bulutlar
    const n = sky.heavy ? 9 : 5;
    for (let i = 0; i < n; i++) {
      const spr = this.cloudSprite(preset, i);
      const speed = 2 + (i % 3);
      const x = ((hash2(i, 9) * (W + 60) + t * speed) % (W + 60)) - 50;
      const y = 4 + hash2(i, 3) * horizon * (sky.heavy ? 0.6 : 0.45);
      ctx.drawImage(spr, Math.round(x), Math.round(y));
    }
    if (sky.heavy && preset === 'storm') {
      ctx.fillStyle = 'rgba(20,24,34,0.35)';
      ctx.fillRect(0, 0, W, horizon * 0.5);
    }
  }

  drawFarLand(ctx, W, horizon, seed = 1, color = '#3d5a6a', kind = 'hills') {
    // Uzak adalar / kıyı silüetleri
    for (let i = 0; i < 3; i++) {
      const cx = hash2(i, seed, 3) * W;
      const w = 30 + hash2(i, seed, 5) * 60;
      const h = 4 + hash2(i, seed, 8) * 10;
      for (let x = -w / 2; x < w / 2; x++) {
        const f = 1 - Math.abs(x) / (w / 2);
        const hh = Math.round(h * Math.sqrt(f) + Math.sin(x * 0.4 + i) * 0.8);
        rect(ctx, cx + x, horizon - hh, 1, hh, color);
      }
      if (kind === 'volcano' && i === 0) {
        for (let k = 0; k < 6; k++) px(ctx, cx + Math.sin(k) * 2, horizon - h - 2 - k * 2, '#5a4a48');
      }
    }
  }

  /** Deniz: ufuktan aşağı bant bant renkler ve kayan dalga çizgileri (paralaks). */
  drawSea(ctx, W, horizon, H, t, preset = 'calm', speed = 1, skyPreset = 'day') {
    const sea = SEAS[preset] || SEAS.calm;
    const dark = NIGHTISH.has(skyPreset) && preset !== 'lava' && preset !== 'eerie';
    const depth = H - horizon;
    for (let y = 0; y < depth; y++) {
      const f = y / depth;
      const bi = Math.min(sea.bands.length - 1, Math.floor(Math.pow(f, 0.8) * sea.bands.length));
      let col = sea.bands[bi];
      rect(ctx, 0, horizon + y, W, 1, col);
    }
    if (dark) {
      ctx.fillStyle = 'rgba(5,10,30,0.45)';
      ctx.fillRect(0, horizon, W, depth);
    }
    // Ufuk parlaması
    hline(ctx, 0, W, horizon, sea.hi);
    // Dalga çizgileri
    for (let y = 2; y < depth; y += 2) {
      const f = y / depth;
      const sp = (4 + f * 26) * speed;
      const gap = Math.max(8, Math.round(40 - f * 30));
      const len = Math.max(1, Math.round(1 + f * 6));
      const off = (t * sp + hash2(y, 4) * 400) % gap;
      for (let x = -gap; x < W + gap; x += gap) {
        const xx = Math.round(x - off + hash2(Math.floor((x + 1000) / gap), y, 2) * gap * 0.6);
        if (hash2(Math.floor((x + 1000) / gap), y, 5) < 0.55) hline(ctx, xx, xx + len, horizon + y, dark ? 'rgba(160,190,220,0.35)' : sea.hi);
      }
    }
    if (sea.floes) {
      for (let i = 0; i < 9; i++) {
        const f = 0.2 + hash2(i, 77) * 0.8;
        const x = ((hash2(i, 78) * W * 1.5 - t * (6 + f * 20) * speed) % (W + 40) + W + 40) % (W + 40) - 20;
        const y = horizon + f * depth;
        ellipse(ctx, x, y, 4 + f * 8, 1 + f * 2, '#e8f4fa');
        hline(ctx, x - 3 - f * 7, x + 3 + f * 7, y + 1 + f * 2, '#9cc4d8');
      }
    }
    if (preset === 'lava') {
      for (let i = 0; i < 30; i++) {
        const x = (hash2(i, 31) * W + Math.sin(t + i) * 3) | 0;
        const y = horizon + 2 + hash2(i, 32) * depth;
        if (Math.sin(t * 3 + i) > 0.2) hline(ctx, x, x + 2, y, '#ff8a3a');
      }
    }
  }

  /** Gemi önündeki dalga katmanı (su hattını örter) */
  drawFrontWaves(ctx, W, y, t, preset = 'calm', speed = 1) {
    const sea = SEAS[preset] || SEAS.calm;
    const base = sea.bands[sea.bands.length - 1];
    for (let x = 0; x < W; x++) {
      const h = Math.round(2 + Math.sin(x * 0.18 + t * 3 * speed) * 1.5 + Math.sin(x * 0.07 - t * 1.4) * 1.2);
      rect(ctx, x, y - h, 1, h + 40, base);
      if (Math.sin(x * 0.18 + t * 3 * speed) > 0.75) px(ctx, x, y - h, sea.foam);
    }
  }

  /** Hava efektleri. kinds: rain, snow, embers, ash, sparkle, bubbles, fireflies, fog, mist, glow, lightning, spray, smoke */
  updateWeather(dt, W, H, kinds, intensity = 1) {
    const want = {
      rain: 140, snow: 70, embers: 40, ash: 60, sparkle: 26, bubbles: 24, fireflies: 22, spray: 20, smoke: 18,
    };
    const set = new Set(kinds);
    for (const k of Object.keys(want)) {
      if (!set.has(k)) continue;
      const target = Math.round(want[k] * intensity);
      let count = 0;
      for (const p of this.particles) if (p.k === k) count++;
      for (let i = count; i < target; i++) this.particles.push(this.spawn(k, W, H, true));
    }
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.k === 'snow' || p.k === 'ash') p.x += Math.sin(p.y * 0.1 + p.s) * 0.3;
      if (p.k === 'fireflies' || p.k === 'sparkle') {
        p.x += Math.sin(p.life * 3 + p.s) * 0.2;
      }
    }
    this.particles = this.particles.filter((p) => p.life > 0 && p.y < H + 4 && p.y > -10 && p.x > -10 && p.x < W + 10 && set.has(p.k));
    if (set.has('lightning')) {
      this.flash = Math.max(0, this.flash - dt * 3);
      if (Math.random() < dt * 0.25) {
        this.flash = 1;
        this.bolt = { x: 20 + Math.random() * (W - 40), seed: Math.random() * 1000, life: 0.25 };
        if (this.onThunder) this.onThunder();
      }
      if (this.bolt) {
        this.bolt.life -= dt;
        if (this.bolt.life <= 0) this.bolt = null;
      }
    } else {
      this.flash = 0;
      this.bolt = null;
    }
  }

  spawn(k, W, H, randomY) {
    const p = { k, x: Math.random() * W, y: randomY ? Math.random() * H : -4, vx: 0, vy: 0, life: 10, s: Math.random() * 10 };
    switch (k) {
      case 'rain': p.vx = -30; p.vy = 140 + Math.random() * 40; p.life = 3; break;
      case 'snow': p.vx = -4; p.vy = 10 + Math.random() * 8; p.life = 30; break;
      case 'embers': p.y = randomY ? Math.random() * H : H + 2; p.vx = (Math.random() - 0.5) * 8; p.vy = -10 - Math.random() * 14; p.life = 6; break;
      case 'ash': p.vx = -3; p.vy = 6 + Math.random() * 5; p.life = 40; break;
      case 'sparkle': p.y = Math.random() * H * 0.8; p.vy = -2; p.life = 0.5 + Math.random() * 2; break;
      case 'bubbles': p.y = randomY ? H * 0.5 + Math.random() * H * 0.5 : H; p.vy = -8 - Math.random() * 8; p.life = 6; break;
      case 'fireflies': p.y = H * 0.3 + Math.random() * H * 0.5; p.vx = (Math.random() - 0.5) * 4; p.vy = (Math.random() - 0.5) * 3; p.life = 3 + Math.random() * 4; break;
      case 'spray': p.y = H * 0.55 + Math.random() * H * 0.3; p.vx = -20 - Math.random() * 20; p.vy = -6; p.life = 0.6 + Math.random(); break;
      case 'smoke': p.y = H * 0.3 + Math.random() * H * 0.3; p.vx = -2; p.vy = -4; p.life = 4 + Math.random() * 4; break;
    }
    return p;
  }

  drawWeather(ctx, W, H, kinds = []) {
    const set = new Set(kinds);
    for (const p of this.particles) {
      switch (p.k) {
        case 'rain': line(ctx, p.x, p.y, p.x - 1, p.y + 3, 'rgba(190,210,235,0.7)'); break;
        case 'snow': px(ctx, p.x, p.y, '#ffffff'); break;
        case 'embers': px(ctx, p.x, p.y, Math.sin(p.life * 10) > 0 ? '#ffb040' : '#ff5a20'); break;
        case 'ash': px(ctx, p.x, p.y, '#5a504c'); break;
        case 'sparkle': {
          const c = p.life % 0.5 > 0.25 ? '#fff6c0' : '#ffd84a';
          px(ctx, p.x, p.y, c);
          if (p.life % 1 > 0.6) { px(ctx, p.x - 1, p.y, c); px(ctx, p.x + 1, p.y, c); px(ctx, p.x, p.y - 1, c); px(ctx, p.x, p.y + 1, c); }
          break;
        }
        case 'bubbles': px(ctx, p.x, p.y, 'rgba(220,250,255,0.8)'); px(ctx, p.x + 1, p.y - 1, 'rgba(220,250,255,0.5)'); break;
        case 'fireflies': px(ctx, p.x, p.y, Math.sin(p.life * 5 + p.s) > 0 ? '#e8ff8a' : '#9acc4a'); break;
        case 'spray': px(ctx, p.x, p.y, 'rgba(240,250,255,0.8)'); break;
        case 'smoke': disc(ctx, p.x, p.y, 2 + (8 - p.life) * 0.4, 'rgba(60,60,64,0.35)'); break;
      }
    }
    if (set.has('fog') || set.has('mist')) {
      const a = set.has('fog') ? 0.42 : 0.22;
      for (let i = 0; i < 4; i++) {
        const y = H * (0.25 + i * 0.17);
        const off = Math.sin(performance.now() / 4000 + i) * 20;
        ctx.fillStyle = `rgba(210,220,226,${a})`;
        for (let x = -30; x < W + 30; x += 6) {
          const h = 6 + Math.sin((x + off) * 0.05 + i) * 4;
          ctx.fillRect(Math.round(x + off), Math.round(y - h / 2), 6, Math.round(h));
        }
      }
    }
    if (set.has('glow')) {
      ctx.fillStyle = 'rgba(120,255,190,0.08)';
      ctx.fillRect(0, 0, W, H);
    }
    if (this.bolt) {
      let x = this.bolt.x;
      let y = 0;
      while (y < H * 0.45) {
        const nx = x + (hash2(y, 3, this.bolt.seed | 0) - 0.5) * 8;
        line(ctx, x, y, nx, y + 5, '#ffffff');
        x = nx;
        y += 5;
      }
    }
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(230,240,255,${this.flash * 0.35})`;
      ctx.fillRect(0, 0, W, H);
    }
  }
}
