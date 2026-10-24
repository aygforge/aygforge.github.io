/*
 * Mahjong: Zen Journey — Renderer, AnimationManager and InputManager.
 * The board is a single canvas. Tiles are drawn back-to-front (layer, then
 * column, then row) from cached sprites; hit-testing walks the same order in
 * reverse so the visually top-most tile always wins. The canvas only redraws
 * while something is animating.
 */
(function (root) {
  'use strict';
  const A = root.MJAssets;
  const now = () => (root.performance ? root.performance.now() : Date.now());
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  class BoardRenderer {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.atlas = new A.TileAtlas();
      this.session = null;
      this.viewW = 1; this.viewH = 1; this.dpr = 1;
      this.zoom = 1; this.ox = 0; this.oy = 0; this.baseTW = 40;
      this.maxZoom = 3;
      this.lift = new Map();
      this.anims = { remove: new Map(), appear: new Map(), flash: new Map(), shake: new Map(), flip: new Map() };
      this.hint = null;
      this.particles = [];
      this.raf = 0;
      this.dirty = true;
      this.paused = false;
      this.effects = true;
      this.debug = { free: false, coords: false };
      this.order = [];
      this.onZoomChange = null;
      this.insetBottom = 0;
    }
    setInsetBottom(px) {
      if (Math.abs(px - this.insetBottom) < 1) return;
      this.insetBottom = px;
      if (this.session && this.zoom <= 1.001) this.fit();
    }
    setSession(s) {
      this.session = s;
      this.lift.clear();
      for (const m of Object.values(this.anims)) m.clear();
      this.hint = null;
      this.particles.length = 0;
      const t = s.tiles;
      this.bounds = root.MJCore.layoutBounds(t);
      this.order = t.map((_, i) => i).sort((a, b) => t[a].z - t[b].z || t[a].x - t[b].x || t[a].y - t[b].y);
      this.fit();
    }
    resize(w, h) {
      const dpr = Math.min(root.devicePixelRatio || 1, 2.5);
      if (w < 2 || h < 2) return;
      this.viewW = w; this.viewH = h; this.dpr = dpr;
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      this.canvas.style.width = w + 'px';
      this.canvas.style.height = h + 'px';
      if (this.session) {
        // keep the player's zoom across resizes (toolbars, rotation, fullscreen)
        const z = this.zoom;
        this.fit();
        if (z > 1.001) this.zoomAt(w / 2, h / 2, z);
      }
      this.invalidate();
    }
    fit() {
      if (!this.bounds) return;
      const b = this.bounds;
      const pad = Math.min(14, this.viewW * 0.03);
      const unitsW = b.spanX / 2 + (b.maxZ + 1) * A.DEPTH;
      const unitsH = (b.spanY / 2) / A.TILE_ASPECT + (b.maxZ + 1) * A.DEPTH;
      const availH = Math.max(this.viewH * 0.55, this.viewH - this.insetBottom);
      this.baseTW = Math.max(12, Math.min((this.viewW - pad * 2) / unitsW, (availH - pad * 2) / unitsH, 84));
      this.zoom = 1;
      // allow zooming until tiles are ~3x the 44px touch target
      this.maxZoom = Math.max(1.6, Math.min(3.2, 90 / this.baseTW));
      this._center();
      if (this.onZoomChange) this.onZoomChange(this.zoom);
      this.invalidate();
    }
    get tw() { return this.baseTW * this.zoom; }
    boardSize() {
      const b = this.bounds, tw = this.tw, th = tw / A.TILE_ASPECT, d = tw * A.DEPTH;
      return { w: b.spanX * tw / 2 + (b.maxZ + 1) * d, h: b.spanY * th / 2 + (b.maxZ + 1) * d };
    }
    _center() {
      const s = this.boardSize();
      this.ox = (this.viewW - s.w) / 2;
      this.oy = (Math.max(this.viewH * 0.55, this.viewH - this.insetBottom) - s.h) / 2;
    }
    _clampPan() {
      const s = this.boardSize(), m = 40;
      if (s.w <= this.viewW) this.ox = (this.viewW - s.w) / 2;
      else this.ox = clamp(this.ox, this.viewW - s.w - m, m);
      if (s.h <= this.viewH) this.oy = (this.viewH - s.h) / 2;
      else this.oy = clamp(this.oy, this.viewH - s.h - m, m);
    }
    zoomAt(px, py, z) {
      z = clamp(z, 1, this.maxZoom);
      const u = (px - this.ox) / this.tw, v = (py - this.oy) / this.tw;
      this.zoom = z;
      this.ox = px - u * this.tw; this.oy = py - v * this.tw;
      this._clampPan();
      if (this.onZoomChange) this.onZoomChange(this.zoom);
      this.invalidate();
    }
    panBy(dx, dy) { this.ox += dx; this.oy += dy; this._clampPan(); this.invalidate(); }
    resetZoom() { this.zoom = 1; this._center(); if (this.onZoomChange) this.onZoomChange(1); this.invalidate(); }

    // face top-left in CSS px
    tilePos(i) {
      const t = this.session.tiles[i], b = this.bounds, tw = this.tw, th = tw / A.TILE_ASPECT, d = tw * A.DEPTH;
      return {
        x: this.ox + (t.x - b.minX) * tw / 2 + (b.maxZ - t.z) * d,
        y: this.oy + (t.y - b.minY) * th / 2 + (b.maxZ - t.z) * d,
        w: tw, h: th, d
      };
    }
    tileCenter(i) { const p = this.tilePos(i); return { x: p.x + p.w / 2, y: p.y + p.h / 2 }; }
    hitTest(px, py) {
      if (!this.session) return -1;
      for (let k = this.order.length - 1; k >= 0; k--) {
        const i = this.order[k];
        if (!this.session.isPresent(i)) continue;
        const p = this.tilePos(i);
        const lift = (this.lift.get(i) || 0) * p.h * 0.06;
        const inFace = px >= p.x && px <= p.x + p.w && py >= p.y - lift && py <= p.y + p.h - lift;
        const inBody = px >= p.x + p.d && px <= p.x + p.w + p.d && py >= p.y + p.d && py <= p.y + p.h + p.d;
        if (inFace || inBody) return i;
      }
      return -1;
    }

    // ---- animation triggers
    removeTiles(a, b) {
      const t = now();
      for (const i of [a, b]) { this.anims.remove.set(i, { t0: t, face: this.session.faces[i] }); this.lift.delete(i); this.anims.shake.delete(i); }
      if (this.hint && (this.hint.a === a || this.hint.b === b || this.hint.a === b || this.hint.b === a)) this.hint = null;
      if (this.effects) for (const i of [a, b]) this._burst(i);
      this.invalidate();
    }
    restoreTiles(list) {
      const t = now();
      for (const i of list) { this.anims.remove.delete(i); this.anims.appear.set(i, { t0: t }); }
      this.invalidate();
    }
    flash(list) { const t = now(); for (const i of list) this.anims.flash.set(i, { t0: t }); this.invalidate(); }
    shake(i) { this.anims.shake.set(i, { t0: now() }); this.invalidate(); }
    flip(list, oldFaces) { const t = now(); list.forEach((i, k) => this.anims.flip.set(i, { t0: t + (k % 12) * 12, old: oldFaces[i] })); this.invalidate(); }
    showHint(a, b) { this.hint = { a, b, t0: now() }; this.invalidate(); }
    clearHint() { if (this.hint) { this.hint = null; this.invalidate(); } }
    clearTransient() { for (const m of Object.values(this.anims)) m.clear(); this.particles.length = 0; this.hint = null; this.invalidate(); }
    _burst(i) {
      const c = this.tileCenter(i);
      const cols = ['#ffe08a', '#ffffff', '#9fe3c5', '#ffc6d6'];
      for (let k = 0; k < 10; k++) {
        const a = Math.random() * Math.PI * 2, sp = 40 + Math.random() * 110;
        this.particles.push({ x: c.x, y: c.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30, life: 0, max: 0.5 + Math.random() * 0.4, size: 2 + Math.random() * 3, col: cols[k % cols.length] });
      }
    }

    invalidate() {
      this.dirty = true;
      if (!this.raf && !this.paused) this.raf = root.requestAnimationFrame((t) => this._frame(t));
    }
    setPaused(p) {
      this.paused = p;
      if (p && this.raf) { root.cancelAnimationFrame(this.raf); this.raf = 0; }
      if (!p) this.invalidate();
    }
    _frame() {
      this.raf = 0;
      const active = this.draw(now());
      if (active || this.dirty) this.raf = root.requestAnimationFrame((t) => this._frame(t));
    }

    // Returns true while anything is still animating.
    draw(t) {
      this.dirty = false;
      const s = this.session, c = this.ctx;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, this.canvas.width, this.canvas.height);
      if (!s) return false;
      let active = false;
      const dpr = this.dpr;
      const twDev = this.tw * dpr;
      const q = Math.max(8, Math.round(twDev / 4) * 4);
      this.atlas.ensure(q / dpr, dpr);
      const scale = twDev / this.atlas.px;
      const m = this.atlas.m;
      const spriteW = m.spriteW * scale, spriteH = m.spriteH * scale, pad = m.pad * scale;
      // selection lift easing
      for (let i = 0; i < s.n; i++) {
        const target = s.selected === i ? 1 : 0;
        const cur = this.lift.get(i) || 0;
        if (cur !== target) {
          const nv = Math.abs(target - cur) < 0.04 ? target : cur + (target - cur) * 0.35;
          if (nv === 0) this.lift.delete(i); else this.lift.set(i, nv);
          active = true;
        }
      }
      const hint = this.hint && t - this.hint.t0 < 4000 ? this.hint : null;
      if (this.hint && !hint) this.hint = null;
      if (hint) active = true;

      for (const i of this.order) {
        const present = s.isPresent(i);
        const rem = this.anims.remove.get(i);
        if (!present && !rem) continue;
        const p = this.tilePos(i);
        let x = p.x * dpr, y = p.y * dpr, alpha = 1, sc = 1, sx = 1, face = s.faces[i];
        let blocked = present && !s.isFree(i);
        if (rem) {
          const k = (t - rem.t0) / 380;
          if (k >= 1 || present) { this.anims.remove.delete(i); if (!present) continue; }
          else { active = true; alpha = 1 - ease(k); sc = 1 + 0.18 * ease(k); face = rem.face; blocked = false; }
        }
        const ap = this.anims.appear.get(i);
        if (ap) {
          const k = (t - ap.t0) / 260;
          if (k >= 1) this.anims.appear.delete(i); else { active = true; alpha = Math.min(alpha, ease(k)); sc = 0.85 + 0.15 * ease(k); }
        }
        const lift = this.lift.get(i) || 0;
        y -= lift * p.h * 0.06 * dpr;
        const sh = this.anims.shake.get(i);
        if (sh) {
          const k = (t - sh.t0) / 320;
          if (k >= 1) this.anims.shake.delete(i); else { active = true; x += Math.sin(k * Math.PI * 6) * (1 - k) * p.w * 0.07 * dpr; }
        }
        const fl = this.anims.flip.get(i);
        if (fl) {
          const k = (t - fl.t0) / 360;
          if (k >= 1) this.anims.flip.delete(i);
          else if (k >= 0) { active = true; sx = Math.abs(Math.cos(k * Math.PI)); if (k < 0.5) face = fl.old; }
          else { active = true; face = fl.old; }
        }
        const spr = this.atlas.sprite(face, blocked && !lift);
        c.globalAlpha = alpha;
        if (sc !== 1 || sx !== 1) {
          const cx = x + p.w * dpr / 2, cy = y + p.h * dpr / 2;
          c.save(); c.translate(cx, cy); c.scale(sc * sx, sc); c.translate(-cx, -cy);
          c.drawImage(spr, x - pad, y - pad, spriteW, spriteH);
          c.restore();
        } else c.drawImage(spr, x - pad, y - pad, spriteW, spriteH);
        // state overlays
        if (present && (lift > 0.01 || (hint && (hint.a === i || hint.b === i)))) {
          const isHint = hint && (hint.a === i || hint.b === i) && lift < 0.5;
          const pulse = isHint ? 0.55 + 0.45 * Math.sin((t - hint.t0) / 160) : 1;
          c.save();
          c.shadowColor = isHint ? 'rgba(80,220,255,0.95)' : 'rgba(255,200,80,0.95)';
          c.shadowBlur = p.w * 0.35 * dpr * pulse;
          c.lineWidth = Math.max(2, p.w * 0.075) * dpr;
          c.strokeStyle = isHint ? `rgba(70,200,240,${0.6 + 0.4 * pulse})` : 'rgba(236,170,40,1)';
          A.rr(c, x + c.lineWidth / 2, y + c.lineWidth / 2, p.w * dpr - c.lineWidth, p.h * dpr - c.lineWidth, p.w * 0.13 * dpr);
          c.stroke();
          c.restore();
          if (!isHint) {
            c.fillStyle = 'rgba(255,220,120,0.16)';
            A.rr(c, x, y, p.w * dpr, p.h * dpr, p.w * 0.13 * dpr); c.fill();
          }
        }
        const fla = this.anims.flash.get(i);
        if (fla && present) {
          const k = (t - fla.t0) / 520;
          if (k >= 1) this.anims.flash.delete(i);
          else {
            active = true;
            c.fillStyle = `rgba(255,255,230,${0.55 * (1 - k)})`;
            A.rr(c, x, y, p.w * dpr, p.h * dpr, p.w * 0.13 * dpr); c.fill();
          }
        }
        if (this.debug.free && present && s.isFree(i)) {
          c.strokeStyle = '#19c26b'; c.lineWidth = 2 * dpr;
          A.rr(c, x + 2, y + 2, p.w * dpr - 4, p.h * dpr - 4, 4); c.stroke();
        }
        if (this.debug.coords && present) {
          c.fillStyle = 'rgba(0,0,0,0.65)'; c.fillRect(x, y + p.h * dpr - 12 * dpr, p.w * dpr, 12 * dpr);
          c.fillStyle = '#fff'; c.font = `${9 * dpr}px monospace`; c.textBaseline = 'bottom';
          const tt = s.tiles[i];
          c.fillText(`${i}:${tt.x},${tt.y},${tt.z}`, x + 2, y + p.h * dpr - 1);
        }
        c.globalAlpha = 1;
      }
      // particles
      if (this.particles.length) {
        active = true;
        const dt = 1 / 60;
        for (let k = this.particles.length - 1; k >= 0; k--) {
          const q2 = this.particles[k];
          q2.life += dt;
          if (q2.life >= q2.max) { this.particles.splice(k, 1); continue; }
          q2.x += q2.vx * dt; q2.y += q2.vy * dt; q2.vy += 120 * dt; q2.vx *= 0.97;
          c.globalAlpha = 1 - q2.life / q2.max;
          c.fillStyle = q2.col;
          c.beginPath(); c.arc(q2.x * dpr, q2.y * dpr, q2.size * dpr, 0, Math.PI * 2); c.fill();
        }
        c.globalAlpha = 1;
      }
      return active;
    }
  }

  // Pointer handling: tap to select, drag to pan, pinch / wheel to zoom.
  class InputManager {
    constructor(el, renderer, onTap) {
      this.el = el; this.r = renderer; this.onTap = onTap;
      this.pointers = new Map();
      this.gesture = null;
      this.enabled = true;
      el.addEventListener('pointerdown', (e) => this._down(e));
      el.addEventListener('pointermove', (e) => this._move(e));
      el.addEventListener('pointerup', (e) => this._up(e));
      el.addEventListener('pointercancel', (e) => this._cancel(e));
      el.addEventListener('lostpointercapture', (e) => this._cancel(e));
      el.addEventListener('wheel', (e) => this._wheel(e), { passive: false });
      el.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    _pt(e) { const r = this.el.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    _down(e) {
      if (!this.enabled) return;
      e.preventDefault();
      try { this.el.setPointerCapture(e.pointerId); } catch (err) { /* not capturable */ }
      this.pointers.set(e.pointerId, this._pt(e));
      if (this.pointers.size === 1) {
        const p = this._pt(e);
        this.gesture = { type: 'tap', x0: p.x, y0: p.y, lx: p.x, ly: p.y, id: e.pointerId };
      } else if (this.pointers.size === 2) {
        const [a, b] = [...this.pointers.values()];
        this.gesture = { type: 'pinch', d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: this.r.zoom, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
      }
    }
    _move(e) {
      if (!this.pointers.has(e.pointerId)) return;
      const p = this._pt(e);
      this.pointers.set(e.pointerId, p);
      const g = this.gesture;
      if (!g) return;
      if (g.type === 'pinch' && this.pointers.size >= 2) {
        const [a, b] = [...this.pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        this.r.zoomAt(mx, my, g.z0 * d / g.d0);
        this.r.panBy(mx - g.mx, my - g.my);
        g.mx = mx; g.my = my;
      } else if (g.type === 'tap' || g.type === 'pan') {
        const moved = Math.hypot(p.x - g.x0, p.y - g.y0);
        if (g.type === 'tap' && moved > 10 && this.r.zoom > 1.001) g.type = 'pan';
        if (g.type === 'pan') { this.r.panBy(p.x - g.lx, p.y - g.ly); }
        g.lx = p.x; g.ly = p.y;
        if (g.type === 'tap' && moved > 18) g.type = 'none';
      }
    }
    _up(e) {
      if (!this.pointers.has(e.pointerId)) return;
      const p = this._pt(e);
      this.pointers.delete(e.pointerId);
      const g = this.gesture;
      if (g && g.type === 'tap' && g.id === e.pointerId && this.pointers.size === 0 && this.enabled) {
        this.onTap(this.r.hitTest(p.x, p.y), p);
      }
      if (this.pointers.size === 0) this.gesture = null;
      else if (g && g.type === 'pinch') this.gesture = { type: 'none' };
    }
    _cancel(e) { this.pointers.delete(e.pointerId); if (!this.pointers.size) this.gesture = null; }
    _wheel(e) {
      if (!this.enabled) return;
      e.preventDefault();
      const p = this._pt(e);
      if (e.ctrlKey || Math.abs(e.deltaY) >= Math.abs(e.deltaX)) this.r.zoomAt(p.x, p.y, this.r.zoom * Math.exp(-e.deltaY * 0.0022));
      else this.r.panBy(-e.deltaX, 0);
    }
  }

  // Ambient world particles on a background canvas (~30 fps, paused when hidden).
  class Ambient {
    constructor(canvas) {
      this.canvas = canvas; this.ctx = canvas.getContext('2d');
      this.type = 'none'; this.parts = []; this.raf = 0; this.last = 0; this.enabled = true; this.visible = true;
    }
    resize(w, h) {
      this.w = w; this.h = h;
      const dpr = Math.min(root.devicePixelRatio || 1, 1.5);
      this.dpr = dpr;
      this.canvas.width = Math.round(w * dpr); this.canvas.height = Math.round(h * dpr);
      this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
    }
    setType(type) {
      this.type = type; this.parts = [];
      const n = { leaves: 14, petals: 22, maple: 16, mist: 6, fireflies: 22, dust: 26, clouds: 5, motes: 20, snow: 40, sparks: 24, stars: 30, bubbles: 20, embers: 24, lotus: 14 }[type] || 0;
      for (let i = 0; i < n; i++) this.parts.push(this._spawn(true));
      this._kick();
    }
    _spawn(init) {
      const w = this.w || 400, h = this.h || 700, R = Math.random;
      const p = { x: R() * w, y: init ? R() * h : -20, s: 0.6 + R() * 0.8, a: R() * Math.PI * 2, va: (R() - 0.5) * 1.5, ph: R() * 10 };
      switch (this.type) {
        case 'mist': case 'clouds': p.y = R() * h; p.vx = 4 + R() * 8; p.vy = 0; p.s = 1 + R() * 1.5; break;
        case 'fireflies': case 'motes': case 'stars': p.y = R() * h; p.vx = (R() - 0.5) * 8; p.vy = (R() - 0.5) * 8; break;
        case 'bubbles': case 'embers': case 'sparks': p.y = init ? R() * h : h + 20; p.vx = (R() - 0.5) * 10; p.vy = -(12 + R() * 22); break;
        case 'snow': p.vx = (R() - 0.5) * 10; p.vy = 14 + R() * 20; break;
        default: p.vx = 6 + R() * 12; p.vy = 14 + R() * 18;
      }
      return p;
    }
    setEnabled(on) { this.enabled = on; if (!on) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); this._kick(); }
    setVisible(v) { this.visible = v; this._kick(); }
    _kick() {
      if (this.raf || !this.enabled || !this.visible || !this.parts.length) return;
      this.last = now();
      this.raf = root.requestAnimationFrame((t) => this._frame(t));
    }
    _frame() {
      this.raf = 0;
      if (!this.enabled || !this.visible) return;
      const t = now();
      if (t - this.last < 30) { this.raf = root.requestAnimationFrame((tt) => this._frame(tt)); return; }
      const dt = Math.min(0.1, (t - this.last) / 1000);
      this.last = t;
      const c = this.ctx, dpr = this.dpr, w = this.w, h = this.h;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, w, h);
      for (let i = 0; i < this.parts.length; i++) {
        const p = this.parts[i];
        p.ph += dt;
        p.x += (p.vx + Math.sin(p.ph * 0.8) * 6) * dt; p.y += p.vy * dt; p.a += p.va * dt;
        if (p.y > h + 30 || p.y < -40 || p.x > w + 80 || p.x < -80) { this.parts[i] = this._spawn(false); if (this.type === 'mist' || this.type === 'clouds') this.parts[i].x = -100; continue; }
        this._paint(c, p);
      }
      this.raf = root.requestAnimationFrame((tt) => this._frame(tt));
    }
    _paint(c, p) {
      const T = this.type;
      c.save(); c.translate(p.x, p.y); c.rotate(p.a);
      if (T === 'petals' || T === 'lotus') {
        c.fillStyle = 'rgba(248,170,195,0.85)';
        c.beginPath(); c.ellipse(0, 0, 5 * p.s, 3 * p.s, 0, 0, Math.PI * 2); c.fill();
      } else if (T === 'leaves') {
        c.fillStyle = 'rgba(70,150,90,0.75)';
        c.beginPath(); c.ellipse(0, 0, 7 * p.s, 2.2 * p.s, 0, 0, Math.PI * 2); c.fill();
      } else if (T === 'maple') {
        c.fillStyle = p.s > 1 ? 'rgba(220,90,40,0.85)' : 'rgba(240,160,60,0.85)';
        c.beginPath(); for (let k = 0; k < 5; k++) { const a = k * 1.2566; c.lineTo(Math.cos(a) * 6 * p.s, Math.sin(a) * 6 * p.s); c.lineTo(Math.cos(a + 0.63) * 2.5 * p.s, Math.sin(a + 0.63) * 2.5 * p.s); } c.fill();
      } else if (T === 'mist' || T === 'clouds') {
        c.rotate(-p.a);
        const g = c.createRadialGradient(0, 0, 0, 0, 0, 90 * p.s);
        g.addColorStop(0, 'rgba(255,255,255,0.22)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g; c.fillRect(-90 * p.s, -90 * p.s, 180 * p.s, 180 * p.s);
      } else if (T === 'fireflies' || T === 'motes') {
        const a = 0.35 + 0.65 * Math.abs(Math.sin(p.ph * 1.7));
        c.fillStyle = T === 'motes' ? `rgba(210,255,230,${a * 0.7})` : `rgba(220,255,140,${a})`;
        c.shadowColor = c.fillStyle; c.shadowBlur = 8;
        c.beginPath(); c.arc(0, 0, 1.8 * p.s, 0, Math.PI * 2); c.fill();
      } else if (T === 'stars') {
        const a = 0.2 + 0.8 * Math.abs(Math.sin(p.ph * 1.3));
        c.fillStyle = `rgba(255,255,255,${a})`;
        c.fillRect(-0.6, -3 * p.s, 1.2, 6 * p.s); c.fillRect(-3 * p.s, -0.6, 6 * p.s, 1.2);
      } else if (T === 'snow') {
        c.fillStyle = 'rgba(255,255,255,0.9)'; c.beginPath(); c.arc(0, 0, 2 * p.s, 0, Math.PI * 2); c.fill();
      } else if (T === 'bubbles') {
        c.strokeStyle = 'rgba(220,250,255,0.6)'; c.lineWidth = 1; c.beginPath(); c.arc(0, 0, 3 * p.s, 0, Math.PI * 2); c.stroke();
      } else if (T === 'embers' || T === 'sparks') {
        const hue = T === 'sparks' ? (p.ph * 40) % 360 : 30;
        c.fillStyle = T === 'sparks' ? `hsla(${hue},90%,70%,0.85)` : 'rgba(255,170,70,0.8)';
        c.shadowColor = c.fillStyle; c.shadowBlur = 6;
        c.beginPath(); c.arc(0, 0, 1.6 * p.s, 0, Math.PI * 2); c.fill();
      } else if (T === 'dust') {
        c.fillStyle = 'rgba(255,240,200,0.6)'; c.beginPath(); c.arc(0, 0, 1.3 * p.s, 0, Math.PI * 2); c.fill();
      }
      c.restore();
    }
  }

  // One-shot celebration overlay (confetti / golden rays).
  class Celebration {
    constructor(canvas) { this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.parts = []; this.raf = 0; }
    start(grand) {
      const w = this.canvas.clientWidth || 400, h = this.canvas.clientHeight || 700;
      const dpr = Math.min(root.devicePixelRatio || 1, 2);
      this.canvas.width = w * dpr; this.canvas.height = h * dpr; this.dpr = dpr; this.w = w; this.h = h;
      const cols = ['#ffd36b', '#ff8fab', '#7fe0c0', '#8fc7ff', '#ffffff', '#f2a23a'];
      const n = grand ? 160 : 80;
      this.parts = [];
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.8, sp = 300 + Math.random() * 420;
        this.parts.push({ x: w / 2 + (Math.random() - 0.5) * 60, y: h * 0.62, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: Math.random() * 6, vr: (Math.random() - 0.5) * 12, col: cols[i % cols.length], s: 3 + Math.random() * 4, life: 0 });
      }
      this.grand = grand; this.t0 = now();
      if (!this.raf) this.raf = root.requestAnimationFrame(() => this._frame());
    }
    stop() { if (this.raf) root.cancelAnimationFrame(this.raf); this.raf = 0; this.parts = []; this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); }
    _frame() {
      this.raf = 0;
      const c = this.ctx, dt = 1 / 60, el = (now() - this.t0) / 1000;
      c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      c.clearRect(0, 0, this.w, this.h);
      if (this.grand && el < 2.5) {
        c.save(); c.translate(this.w / 2, this.h * 0.32); c.rotate(el * 0.3);
        for (let k = 0; k < 12; k++) {
          c.rotate(Math.PI / 6);
          c.fillStyle = `rgba(255,215,120,${0.12 * (1 - el / 2.5)})`;
          c.beginPath(); c.moveTo(0, 0); c.lineTo(-30, -this.h); c.lineTo(30, -this.h); c.fill();
        }
        c.restore();
      }
      let alive = 0;
      for (const p of this.parts) {
        p.life += dt;
        if (p.life > 3.2) continue;
        alive++;
        p.vy += 520 * dt; p.vx *= 0.985; p.vy *= 0.985; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
        c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.globalAlpha = Math.max(0, 1 - p.life / 3.2);
        c.fillStyle = p.col; c.fillRect(-p.s / 2, -p.s * 0.3, p.s, p.s * 0.6);
        c.restore();
      }
      if (alive || (this.grand && el < 2.5)) this.raf = root.requestAnimationFrame(() => this._frame());
      else c.clearRect(0, 0, this.w, this.h);
    }
  }

  root.MJRender = { BoardRenderer, InputManager, Ambient, Celebration };
}(typeof globalThis !== 'undefined' ? globalThis : this));
