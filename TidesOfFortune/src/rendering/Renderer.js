// Canvas yöneticisi: düşük çözünürlüklü tampon (mantıksal/2) + nearest-neighbor büyütme.
// Dünya (top-down deniz, gemi, güverte, karşılaşmalar) World'de; sunum akışı EncounterDirector'da.
import { BALANCE } from '../config/balance.js';
import { World } from './td/World.js';
import { EncounterDirector } from '../presentation/EncounterDirector.js';
import { drawMap } from './MapArt.js';
import { rect, px } from './pixel.js';

export const PX = BALANCE.render.pixelScale;

export class Renderer {
  constructor(canvas, core) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.core = core;
    this.world = new World();
    this.director = new EncounterDirector(this.world, core, {});
    this.scene = 'world';
    this.params = {};
    this.t = 0;
    this.last = 0;
    this.running = false;
    this.W = 640;
    this.H = 360;
    this.onOverlays = null;
    this.onFrame = null;
    const q = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('hiz') : null;
    this.timeScale = q ? Math.max(1, Math.min(40, Number(q) || 1)) : 1; // yalnızca test/geliştirme
    document.addEventListener('visibilitychange', () => (document.hidden ? this.stop() : this.start()));
  }

  resize(logicalW, logicalH) {
    this.W = Math.ceil(logicalW / PX);
    this.H = Math.ceil(logicalH / PX);
    this.canvas.width = this.W;
    this.canvas.height = this.H;
    this.ctx.imageSmoothingEnabled = false;
  }

  setScene(name, params = {}) {
    this.scene = name;
    this.params = params;
  }

  flash(color) {
    this.flashColor = color;
    this.flashT = 0.6;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const loop = (ts) => {
      if (!this.running) return;
      const minDt = this.core.settings.fps30 ? 1000 / 31 : 0;
      if (ts - this.last >= minDt) {
        const dt = Math.min(0.1, (ts - this.last) / 1000) * (this.timeScale || 1);
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
    this.t += dt;
    const ctx = this.ctx;
    const { W, H } = this;
    try {
      if (this.scene === 'map') {
        const run = this.core.run;
        if (run) {
          const nodes = drawMap(ctx, W, H, run, { known: this.params.known, progress: this.params.progress, t: this.t });
          this.params.onNodes?.(nodes);
        } else rect(ctx, 0, 0, W, H, '#120c18');
        this.onOverlays?.([]);
      } else {
        this.director.update(dt);
        this.director.tickDock(dt);
        this.world.update(dt, { reduceMotion: reduce });
        this.world.draw(ctx, W, H);
        this.onOverlays?.(this.world.overlays(W, H).map((o) => ({ ...o, x: o.x * PX, y: o.y * PX })));
      }
    } catch (e) {
      console.error('render', e);
      rect(ctx, 0, 0, W, H, '#120c18');
    }
    if (this.flashT > 0) {
      this.flashT -= dt;
      ctx.globalAlpha = Math.max(0, this.flashT) * 0.5;
      rect(ctx, 0, 0, W, H, this.flashColor);
      ctx.globalAlpha = 1;
    }
    if (this.onFrame) this.onFrame(dt);
    void px;
  }
}
