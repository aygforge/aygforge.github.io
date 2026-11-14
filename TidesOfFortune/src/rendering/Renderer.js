// Canvas yöneticisi: düşük çözünürlüklü tampon (mantıksal/3) + nearest-neighbor büyütme.
// Görsel animasyon oyun mantığından ayrıdır: Renderer yalnızca durumu okur.
import { BALANCE } from '../config/balance.js';
import { SeaRenderer } from './Sea.js';
import { shipSprite } from './ShipArt.js';
import { Deck } from './DeckActors.js';
import { drawEventArt } from './EventArt.js';
import { drawHarbor, drawDockFront } from './HarborArt.js';
import { drawMap } from './MapArt.js';
import { petFrame } from './Characters.js';
import { rect, px, disc, hline, line } from './pixel.js';
import { HARBOR_BY_ID } from '../data/harbors.js';
import { EVENT_BY_ID } from '../data/events.js';
import { hashString } from '../core/SeededRNG.js';

export const PX = BALANCE.render.pixelScale;

const VOYAGE_WEATHER = {
  1: [{ sky: 'day', sea: 'calm' }, { sky: 'dawn', sea: 'calm' }, { sky: 'day', sea: 'choppy' }],
  2: [{ sky: 'day', sea: 'choppy' }, { sky: 'dusk', sea: 'calm' }, { sky: 'overcast', sea: 'choppy' }],
  3: [{ sky: 'overcast', sea: 'choppy' }, { sky: 'fog', sea: 'calm', fx: ['fog'] }, { sky: 'dusk', sea: 'choppy' }, { sky: 'night', sea: 'dark' }],
  4: [{ sky: 'dusk', sea: 'rough' }, { sky: 'storm', sea: 'rough', fx: ['rain'] }, { sky: 'ash', sea: 'dark', fx: ['ash'] }, { sky: 'night', sea: 'dark' }],
  5: [{ sky: 'aurora', sea: 'ice', fx: ['snow'] }, { sky: 'night', sea: 'dark' }, { sky: 'storm', sea: 'rough', fx: ['rain', 'lightning'] }, { sky: 'overcast', sea: 'ice', fx: ['snow'] }],
};

export class Renderer {
  constructor(canvas, core) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.core = core;
    this.sea = new SeaRenderer();
    this.deck = new Deck();
    this.scene = 'menu';
    this.params = {};
    this.t = 0;
    this.last = 0;
    this.running = false;
    this.W = 427;
    this.H = 240;
    this.sailSpeed = 1;
    this.flashColor = null;
    this.flashT = 0;
    this.shadowT = -1;
    this.onBubbles = null;
    this.onFrame = null;
    this.shipShake = 0;
    this.sinkAnim = 0;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.stop();
      else this.start();
    });
  }

  resize(logicalW, logicalH) {
    this.W = Math.ceil(logicalW / PX);
    this.H = Math.ceil(logicalH / PX);
    this.canvas.width = this.W;
    this.canvas.height = this.H;
    this.ctx.imageSmoothingEnabled = false;
  }

  setScene(name, params = {}) {
    if (this.scene !== name) this.sea.particles = [];
    this.scene = name;
    this.params = params;
  }

  flash(color) {
    this.flashColor = color;
    this.flashT = 0.6;
  }

  showShadow() {
    this.shadowT = 0.12;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const loop = (ts) => {
      if (!this.running) return;
      const settings = this.core.settings;
      const minDt = settings.fps30 ? 1000 / 31 : 0;
      if (ts - this.last >= minDt) {
        const dt = Math.min(0.1, (ts - this.last) / 1000);
        this.last = ts;
        this.frame(dt);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
  }

  frame(dt) {
    const reduce = this.core.settings.reduceMotion;
    this.t += dt * (reduce ? 0.35 : 1);
    const ctx = this.ctx;
    const { W, H } = this;
    try {
      switch (this.scene) {
        case 'menu': this.drawMenu(ctx, W, H, dt); break;
        case 'harbor': this.drawHarborScene(ctx, W, H, dt); break;
        case 'voyage': this.drawVoyage(ctx, W, H, dt); break;
        case 'event': this.drawEvent(ctx, W, H, dt); break;
        case 'map': this.drawMapScene(ctx, W, H, dt); break;
        case 'summary': this.drawSummary(ctx, W, H, dt); break;
        default: rect(ctx, 0, 0, W, H, '#120c18');
      }
    } catch (e) {
      console.error('render', e);
      rect(ctx, 0, 0, W, H, '#120c18');
    }
    if (this.flashT > 0) {
      this.flashT -= dt;
      ctx.globalAlpha = Math.max(0, this.flashT) * 0.6;
      rect(ctx, 0, 0, W, H, this.flashColor);
      ctx.globalAlpha = 1;
    }
    if (this.onFrame) this.onFrame(dt);
  }

  // ───────── Sahneler ─────────

  weatherFor(run, idx) {
    const h = HARBOR_BY_ID[run.route[Math.min(idx, run.route.length - 1)].harborId];
    const list = VOYAGE_WEATHER[h.region];
    const pick = list[hashString(run.seed + '|w|' + idx) % list.length];
    return { ...pick, fx: pick.fx || [] };
  }

  drawShipWithDeck(ctx, x, waterY, level, damage, crew, pets, dt, opts = {}) {
    const sp = shipSprite(level, damage);
    const bob = this.core.settings.reduceMotion ? 0 : Math.round(Math.sin(this.t * 1.6) * 1.2);
    const sinkOff = damage === 'sinking' ? 3 : 0;
    const shake = this.shipShake > 0 ? Math.round((Math.random() - 0.5) * 3) : 0;
    const sx = Math.round(x) + shake;
    const sy = Math.round(waterY - sp.waterY + bob + sinkOff + (opts.extraSink || 0));
    this.deck.sync(crew, pets, sp);
    this.deck.update(dt);
    ctx.drawImage(sp.canvas, sx, sy);
    this.deck.draw(ctx, sx, sy);
    if (damage === 'sinking' || damage === 'critical') {
      if (Math.random() < (damage === 'sinking' ? 0.5 : 0.15)) this.sea.particles.push({ k: 'smoke', x: sx + sp.hullX0 + Math.random() * (sp.hullX1 - sp.hullX0), y: sy + sp.deckY - 2, vx: -3, vy: -6, life: 3, s: 0 });
      if (damage === 'sinking') for (let i = 0; i < 2; i++) px(ctx, sx + sp.hullX0 + 10 + ((this.t * 20 + i * 17) % (sp.hullX1 - sp.hullX0 - 20)), sy + sp.waterY - 2 + ((this.t * 8 + i * 3) % 4), '#cfe8f0');
    }
    if (this.onBubbles) this.onBubbles(this.deck.bubblePositions(sx, sy).map((b) => ({ ...b, x: b.x * PX, y: b.y * PX })));
    return { sp, sx, sy };
  }

  drawMenu(ctx, W, H, dt) {
    const hz = Math.round(H * 0.56);
    this.sea.drawSky(ctx, W, hz, this.t, 'dusk');
    this.sea.drawFarLand(ctx, W, hz, 7, '#4a3050');
    this.sea.drawSea(ctx, W, hz, H, this.t, 'calm', 0.8, 'dusk');
    const level = this.params.level || 1;
    const sp = shipSprite(level, 'healthy');
    const bob = Math.round(Math.sin(this.t * 1.6) * 1.2);
    const x = Math.round(W * 0.5 - sp.w / 2);
    const wy = Math.round(H * 0.8);
    ctx.drawImage(sp.canvas, x, wy - sp.waterY + bob);
    for (let i = 0; i < 18; i++) hline(ctx, x + sp.hullX0 - i * 3 - 6, x + sp.hullX0 - i * 3, wy + 1 + (i % 3), 'rgba(230,240,250,0.5)');
    this.sea.drawFrontWaves(ctx, W, wy + 4, this.t, 'calm', 0.8);
    this.sea.updateWeather(dt, W, H, ['sparkle'], 0.3);
    this.sea.drawWeather(ctx, W, H, ['sparkle']);
  }

  drawHarborScene(ctx, W, H, dt) {
    const run = this.core.run;
    if (!run) return this.drawMenu(ctx, W, H, dt);
    const harbor = HARBOR_BY_ID[run.route[run.idx].harborId];
    drawHarbor(ctx, W, H, harbor, this.t, this.sea);
    const dmg = this.params.damage || 'healthy';
    this.deck.setMood('calm');
    this.drawShipWithDeck(ctx, 6, Math.round(H * 0.72), run.ship.level, dmg, run.crew, run.pets, dt);
    this.sea.drawFrontWaves(ctx, W, Math.round(H * 0.72) + 6, this.t * 0.4, 'calm', 0.3);
    drawDockFront(ctx, W, H, this.t);
    this.sea.updateWeather(dt, W, H, harbor.type === 'ice' ? ['snow'] : harbor.type === 'volcanic' ? ['ash', 'embers'] : []);
    this.sea.drawWeather(ctx, W, H, harbor.type === 'ice' ? ['snow'] : harbor.type === 'volcanic' ? ['ash', 'embers'] : []);
  }

  drawVoyage(ctx, W, H, dt) {
    const run = this.core.run;
    if (!run || !run.voyage) return this.drawMenu(ctx, W, H, dt);
    const v = run.voyage;
    const wx = this.weatherFor(run, v.toIdx);
    let sky = wx.sky;
    let fx = [...wx.fx];
    const mood = this.params.mood || 'calm';
    if (mood === 'disaster') { sky = sky === 'night' || sky === 'aurora' ? sky : 'storm'; fx = [...new Set([...fx, 'rain'])]; }
    const hz = Math.round(H * 0.46);
    const speed = this.sailSpeed;
    this.sea.drawSky(ctx, W, hz, this.t * speed, sky);
    const region = HARBOR_BY_ID[run.route[v.toIdx].harborId].region;
    this.sea.drawFarLand(ctx, W, hz, (hashString(run.seed + v.toIdx) % 50) + 1, ['#5a7a6a', '#6a7a8a', '#4a5a6a', '#3a2e30', '#8aa0b0'][region - 1], region === 4 ? 'volcano' : 'hills');
    this.sea.drawSea(ctx, W, hz, H, this.t, wx.sea, speed, sky);
    const night = sky === 'night' || sky === 'aurora';
    this.deck.setMood(mood === 'calm' && night ? 'night' : mood);
    const wy = Math.round(H * 0.78);
    const { sp, sx } = this.drawShipWithDeck(ctx, Math.round(W * 0.08), wy, run.ship.level, this.params.damage || 'healthy', run.crew, run.pets, dt);
    // dümen suyu
    for (let i = 0; i < 24; i++) {
      const x = sx + sp.hullX0 - 4 - i * 4 - ((this.t * 30 * speed) % 4);
      hline(ctx, x, x + 2, wy + 1 + (i % 3), 'rgba(235,245,250,0.55)');
    }
    // pruva köpüğü
    for (let i = 0; i < 5; i++) px(ctx, sx + sp.hullX1 - 2 + Math.sin(this.t * 6 + i) * 2, wy - 1 + i * 0.5, '#ffffff');
    // gölge (Zıpır & Tarçın atlanınca bir kez, bir karelik)
    if (this.shadowT > 0) {
      this.shadowT -= dt;
      const shadowImg = petFrame(this.params.shadowPet || 'PET_ZIPIR', 'sit');
      ctx.globalAlpha = 0.35;
      ctx.drawImage(shadowImg, Math.round(W * 0.7), wy - 10);
      ctx.globalAlpha = 1;
    }
    this.sea.drawFrontWaves(ctx, W, wy + 6, this.t, wx.sea, speed);
    this.sea.updateWeather(dt, W, H, fx);
    this.sea.drawWeather(ctx, W, H, fx);
    if (this.shipShake > 0) this.shipShake -= dt;
  }

  drawEvent(ctx, W, H, dt) {
    const ev = EVENT_BY_ID[this.params.eventId];
    if (!ev) return this.drawMenu(ctx, W, H, dt);
    drawEventArt(ctx, W, H, ev.art || {}, this.t, this.sea, ev.id, this.core.settings.reduceMotion, dt);
  }

  drawMapScene(ctx, W, H, dt) {
    const run = this.core.run;
    if (!run) return this.drawMenu(ctx, W, H, dt);
    const nodes = drawMap(ctx, W, H, run, { known: this.params.known, progress: this.params.progress, t: this.t });
    if (this.params.onNodes) this.params.onNodes(nodes.map((n) => ({ x: n.x * PX, y: n.y * PX })));
  }

  drawSummary(ctx, W, H, dt) {
    const run = this.core.run;
    const sunk = run && run.result !== 'complete';
    const hz = Math.round(H * 0.5);
    this.sea.drawSky(ctx, W, hz, this.t, sunk ? 'night' : 'dawn');
    this.sea.drawSea(ctx, W, hz, H, this.t, sunk ? 'dark' : 'calm', 0.3, sunk ? 'night' : 'dawn');
    const level = run?.ship.level || 1;
    const sp = shipSprite(level, sunk ? 'sinking' : 'healthy');
    this.sinkAnim = Math.min(1, this.sinkAnim + dt * 0.08);
    const x = Math.round(W * 0.5 - sp.w / 2);
    const wy = Math.round(H * 0.74);
    if (sunk) {
      ctx.save();
      const sink = Math.round(this.sinkAnim * (sp.h * 0.75));
      ctx.beginPath();
      ctx.rect(0, 0, W, wy + 2);
      ctx.clip();
      ctx.drawImage(sp.canvas, x, wy - sp.waterY + sink);
      ctx.restore();
      for (let i = 0; i < 8; i++) rect(ctx, W * 0.3 + i * 18 + Math.sin(this.t + i) * 3, wy + 4 + (i % 3) * 6, 6, 2, '#5a3a20');
      for (let i = 0; i < 6; i++) px(ctx, x + sp.w / 2 + Math.sin(this.t * 2 + i) * 14, wy - ((this.t * 10 + i * 5) % 18), '#cfe8f0');
    } else {
      ctx.drawImage(sp.canvas, x, wy - sp.waterY + Math.round(Math.sin(this.t * 1.5)));
      this.sea.updateWeather(dt, W, H, ['sparkle'], 0.6);
      this.sea.drawWeather(ctx, W, H, ['sparkle']);
    }
    this.sea.drawFrontWaves(ctx, W, wy + 4, this.t, sunk ? 'dark' : 'calm', 0.4);
  }
}
