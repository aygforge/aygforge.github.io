// TOP-DOWN dünya sahnesi. Dünya koordinatı: bizim geminin merkezi (0,0); +y kıç yönü (ekranın altı).
// Gemi kuzeye ilerler: okyanus aşağı akar. Karşılaşmalar aynı sahnede, gemi görünür kalarak oynar.
import { makeCanvas, rect, px, disc, line } from '../pixel.js';
import { topShip } from './TopShip.js';
import { Ocean } from './Ocean.js';
import { Deck2D } from './Deck2D.js';
import { DRAW, cargoSprite, drawTown, drawPier, drawCoastHint } from './Props.js';
import './Props2.js';
import { npcSprite, petSprite, CS } from './TopChars.js';
import { iconCanvas } from '../icons.js';

const lerp = (a, b, t) => a + (b - a) * t;

export class World {
  constructor() {
    this.ocean = new Ocean();
    this.deck = new Deck2D();
    this.mode = 'menu';
    this.t = 0;
    this.ship = { level: 1, damage: 'healthy', crew: [], pets: [], cargo: [], x: 0, y: 0, rot: 0, sway: 0, alpha: 1, sink: 0 };
    this.speed = 30; // px/sn (okyanus akışı)
    this.targetSpeed = 30;
    this.sails = 'full';
    this.entities = [];
    this.fx = [];
    this.texts = [];
    this.cam = { x: 0, y: 0, tx: 0, ty: 0, zoom: 1, tzoom: 1, shake: 0 };
    this.cargoOverride = null;
    this.harbor = null; // { type, offY }
    this.coast = null; // { type, y }
    this.region = 1;
    this.shipCanvas = null;
    this.zoomCanvas = null;
    this.idSeq = 1;
  }

  /** Oyun durumunu sahneye yansıt (tayfa/hayvan/kargo/gemi) */
  syncFromRun(run, damage) {
    const s = this.ship;
    s.level = run.ship.level;
    s.damage = damage;
    s.crew = run.crew;
    s.pets = run.pets;
    const units = [];
    for (const lot of run.cargo) for (let i = 0; i < lot.qty; i++) units.push({ good: lot.good, spoiled: lot.spoiled });
    s.cargo = units;
  }

  layout() {
    return topShip(this.ship.level, this.ship.damage);
  }

  // ───────── Varlıklar ─────────
  spawn(e) {
    const ent = { id: e.id || 'e' + this.idSeq++, x: 0, y: 0, rot: 0, alpha: 1, scale: 1, t: 0, drift: true, ...e };
    this.entities.push(ent);
    return ent;
  }

  get(id) {
    return this.entities.find((e) => e.id === id);
  }

  remove(id) {
    this.entities = this.entities.filter((e) => e.id !== id);
  }

  clearEncounter() {
    this.entities = this.entities.filter((e) => e.persist);
    this.cargoOverride = null;
    this.deck.temp = [];
  }

  /** Gemi içi (sprite) koordinatını dünya koordinatına çevir */
  shipToWorld(lx, ly) {
    const L = this.layout();
    const dx = lx - L.center.x, dy = ly - L.center.y;
    const r = this.ship.rot;
    return { x: this.ship.x + dx * Math.cos(r) - dy * Math.sin(r), y: this.ship.y + dx * Math.sin(r) + dy * Math.cos(r) };
  }

  worldToShip(x, y) {
    const L = this.layout();
    const r = -this.ship.rot;
    const dx = x - this.ship.x, dy = y - this.ship.y;
    return { x: L.center.x + dx * Math.cos(r) - dy * Math.sin(r), y: L.center.y + dx * Math.sin(r) + dy * Math.cos(r) };
  }

  /** Ekrandaki merkez (tampon koordinatı) */
  screenOrigin(W, H) {
    const base = this.mode === 'harbor' ? { x: W * 0.3, y: H * 0.5 } : { x: W / 2, y: H * 0.56 };
    return { x: base.x + this.cam.x, y: base.y + this.cam.y - (this.liftNow || 0) };
  }

  toScreen(x, y, W, H) {
    const o = this.screenOrigin(W, H);
    const z = this.cam.zoom;
    return { x: W / 2 + (o.x + x - W / 2) * z, y: H / 2 + (o.y + y - H / 2) * z };
  }

  fromScreen(sx, sy, W, H) {
    const o = this.screenOrigin(W, H);
    const z = this.cam.zoom;
    return { x: (sx - W / 2) / z + W / 2 - o.x, y: (sy - H / 2) / z + H / 2 - o.y };
  }

  // ───────── Efektler ─────────
  projectile(from, to, { dur = 0.8, arc = 16, kind = 'ball', onHit = null } = {}) {
    this.fx.push({ type: 'proj', from, to, dur, arc, kind, t: 0, onHit });
  }

  burst(x, y, kind = 'splash', n = 14) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 10 + Math.random() * 30;
      const col = kind === 'splash' ? (Math.random() < 0.5 ? '#ffffff' : '#bfe3ef') : kind === 'fire' ? ['#fff0a0', '#ffb040', '#e0502a'][i % 3] : kind === 'splinter' ? ['#8a5a2b', '#c8a070', '#5c3a1e'][i % 3] : kind === 'gold' ? '#f2c14e' : kind === 'spark' ? '#fff6c0' : '#8a8a8a';
      this.fx.push({ type: 'p', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.5 + Math.random() * 0.6, max: 1.1, col, size: kind === 'smoke' ? 3 : 1 });
    }
    if (kind === 'fire') for (let i = 0; i < 6; i++) this.fx.push({ type: 'p', x: x + (Math.random() - 0.5) * 6, y, vx: (Math.random() - 0.5) * 6, vy: -12 - Math.random() * 8, life: 1.5, max: 1.5, col: 'rgba(60,56,60,0.6)', size: 3 });
  }

  coins(from, to, n = 10, col = '#f2c14e') {
    for (let i = 0; i < n; i++) this.fx.push({ type: 'coin', from, to, t: -i * 0.06, dur: 0.8, col });
  }

  iconFly(name, from, to) {
    this.fx.push({ type: 'icon', icon: name, from, to, t: 0, dur: 1.1 });
  }

  floatText(x, y, text, color = '#ffffff') {
    this.texts.push({ x, y, text, color, t: 0 });
  }

  shake(amount = 4) {
    this.cam.shake = Math.max(this.cam.shake, amount);
  }

  // ───────── Güncelleme ─────────
  update(dt, opts = {}) {
    this.t += dt;
    const reduce = opts.reduceMotion;
    this.speed = lerp(this.speed, this.targetSpeed, Math.min(1, dt * 0.8));
    const s = this.ship;
    // yalpa ve rota düzeltme (top-down: hafif yan kayma + küçük açı)
    if (this.mode !== 'harbor' && !reduce) {
      s.sway = Math.sin(this.t * 0.45) * 3 + Math.sin(this.t * 0.17) * 4;
      s.rot = Math.sin(this.t * 0.45 + 0.6) * 0.022 + (this.extraRot || 0);
      s.x = lerp(s.x, (this.shipTargetX || 0) + s.sway, Math.min(1, dt * 2));
    } else if (this.mode === 'harbor') {
      s.rot = Math.sin(this.t * 0.6) * 0.004;
      s.x = lerp(s.x, this.shipTargetX || 0, Math.min(1, dt * 2));
    }
    s.y = lerp(s.y, this.shipTargetY || 0, Math.min(1, dt * 2));
    if (this.mode === 'summary' && this.sunk) {
      s.alpha = Math.max(0.12, s.alpha - dt * 0.12);
      s.sink = Math.min(20, s.sink + dt * 3);
      this.targetSpeed = 0;
      if (Math.random() < dt * 6) this.burst(s.x + (Math.random() - 0.5) * 40, s.y + (Math.random() - 0.5) * 80, 'splash', 3);
    } else if (this.mode !== 'summary') { s.alpha = 1; s.sink = 0; }
    const L = this.layout();
    this.deck.sync(s.crew, s.pets, L, this.mode !== 'summary');
    this.deck.update(dt);
    const W = this.W || 640, H = this.H || 360;
    this.ocean.update(dt, this.speed, W, H, { region: this.region, ambient: this.mode === 'sail' || this.mode === 'menu', fx: this.weatherFx || [] });
    // iz
    const o = this.screenOrigin(W, H);
    if (this.mode !== 'harbor') this.ocean.emitWake(o.x + s.x, 0, L.beam, this.speed, o.y + s.y + L.len / 2 - 4, o.y + s.y - L.len / 2 + 4);
    // kamera
    const c = this.cam;
    c.x = lerp(c.x, c.tx, Math.min(1, dt * 1.5));
    c.y = lerp(c.y, c.ty, Math.min(1, dt * 1.5));
    c.zoom = lerp(c.zoom, c.tzoom, Math.min(1, dt * 1.2));
    c.shake = Math.max(0, c.shake - dt * 8);
    // panel kaldırması: kamera zaten öndeki bir şeye odaklıysa (ty>0) gemiyi o kadar az kaldır, öndeki sahne ekranda kalsın
    this.liftNow = lerp(this.liftNow || 0, Math.max(0, (this.lift || 0) - Math.max(0, c.ty)), Math.min(1, dt * 2.5));
    // varlıklar
    for (const e of this.entities) {
      e.t += dt;
      if (e.tween) {
        const tw = e.tween;
        tw.t += dt;
        const f = Math.min(1, tw.t / tw.dur);
        const k = tw.ease === 'in' ? f * f : tw.ease === 'linear' ? f : 1 - (1 - f) * (1 - f);
        for (const key of Object.keys(tw.to)) e[key] = tw.from[key] + (tw.to[key] - tw.from[key]) * k;
        if (f >= 1) { e.tween = null; tw.done?.(); }
      } else if (e.drift) e.y += this.speed * dt;
      if (e.walkers) for (const w of e.walkers) this.updateWalker(w, dt);
    }
    this.entities = this.entities.filter((e) => !e.dead && (e.persist || e.y < H + 300));
    // efektler
    for (const f of this.fx) {
      if (f.type === 'proj' || f.type === 'coin' || f.type === 'icon') {
        f.t += dt;
        if (f.t >= f.dur && !f.hit) { f.hit = true; f.onHit?.(); }
      } else {
        f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= 0.94; f.vy *= 0.94; f.life -= dt;
      }
    }
    this.fx = this.fx.filter((f) => (f.type === 'p' ? f.life > 0 : f.t < f.dur + 0.05));
    for (const tx of this.texts) { tx.t += dt; tx.y -= 10 * dt; }
    this.texts = this.texts.filter((tx) => tx.t < 2.2);
  }

  updateWalker(w, dt) {
    if (!w.path || !w.path.length) return;
    const n = w.path[0];
    const dx = n.x - w.x, dy = n.y - w.y;
    const d = Math.hypot(dx, dy);
    const sp = (w.speed || 22) * dt;
    w.ft = (w.ft || 0) + dt;
    w.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    if (d <= sp) { w.x = n.x; w.y = n.y; w.path.shift(); if (!w.path.length) w.onDone?.(); }
    else { w.x += (dx / d) * sp; w.y += (dy / d) * sp; }
  }

  // ───────── Çizim ─────────
  draw(ctx, W, H) {
    this.W = W;
    this.H = H;
    const z = this.cam.zoom;
    let target = ctx;
    if (Math.abs(z - 1) > 0.01) {
      if (!this.zoomCanvas || this.zoomCanvas.width !== W || this.zoomCanvas.height !== H) this.zoomCanvas = makeCanvas(W, H);
      target = this.zoomCanvas.getContext('2d');
      target.imageSmoothingEnabled = false;
    }
    const sh = this.cam.shake;
    target.save();
    if (sh > 0) target.translate(Math.round((Math.random() - 0.5) * sh), Math.round((Math.random() - 0.5) * sh));
    this.ocean.drawBase(target, W, H);
    const o = this.screenOrigin(W, H);
    // kıyı ipucu (yaklaşırken)
    if (this.coast) drawCoastHint(target, W, Math.round(this.coast.y), this.t, this.coast.type);
    // liman (rıhtım + kasaba)
    if (this.harbor) {
      const L = this.layout();
      // rıhtım dünyaya sabit (geminin yalpasıyla birlikte kaymaz)
      const px0 = Math.round(o.x + L.beam / 2 + 4);
      target.save();
      target.translate(0, Math.round(this.harbor.offY || 0));
      drawTown(target, px0, H, this.harbor.type, this.t, this.harbor.seed);
      drawPier(target, px0, H);
      target.restore();
    }
    // su seviyesindeki varlıklar
    const ents = [...this.entities].sort((a, b) => (a.layer || 0) - (b.layer || 0));
    for (const e of ents) if ((e.layer || 0) <= 0) this.drawEntity(target, e, o);
    // bizim gemi
    this.drawOurShip(target, o);
    for (const e of ents) if ((e.layer || 0) > 0 && (e.layer || 0) < 3) this.drawEntity(target, e, o);
    // efektler
    for (const f of this.fx) this.drawFx(target, f, o);
    this.ocean.drawTop(target, W, H);
    // gökyüzü katmanı (aurora, yıldızlar, gökkuşağı): gece karartmasının üstünde parlar
    for (const e of ents) if ((e.layer || 0) >= 3) this.drawEntity(target, e, o);
    target.restore();
    if (target !== ctx) {
      ctx.drawImage(this.zoomCanvas, Math.round(W / 2 - (W * z) / 2), Math.round(H / 2 - (H * z) / 2), Math.round(W * z), Math.round(H * z));
    }
  }

  drawOurShip(ctx, o) {
    const L = this.layout();
    const s = this.ship;
    if (!this.shipCanvas || this.shipCanvas.width !== L.w || this.shipCanvas.height !== L.h) this.shipCanvas = makeCanvas(L.w, L.h);
    const c = this.shipCanvas.getContext('2d');
    c.clearRect(0, 0, L.w, L.h);
    c.drawImage(L.hull, 0, 0);
    // görünür kargo
    const cargo = this.cargoOverride || s.cargo;
    cargo.forEach((u, i) => {
      if (!u) return;
      const slot = L.cargoSlots[i % L.cargoSlots.length];
      const stack = Math.floor(i / L.cargoSlots.length);
      c.drawImage(cargoSprite(u.good, u.spoiled), Math.round(slot.x - 5), Math.round(slot.y - 5 - stack * 3));
    });
    this.deck.draw(c, 'deck');
    // yelkenler: altındaki karakterler görünsün diye yarı saydam
    c.globalAlpha = this.sails === 'full' ? 0.62 : 0.9;
    c.drawImage(this.sails === 'full' ? L.sailsFull : L.sailsFurled, 0, 0);
    c.globalAlpha = 1;
    if (this.flagUp) { const m = L.masts[0]; rect(c, m.x + 2, m.y - 16, 9, 6, this.flagColor || '#0a0a0a'); if (!this.flagColor) px(c, m.x + 6, m.y - 14, '#ffffff'); }
    this.deck.draw(c, 'air');
    if (this.ocean.night || this.ocean.dark) disc(c, L.cx, L.helm.y - 6, 10, 'rgba(255,220,140,0.18)');
    // dünyaya yerleştir
    ctx.save();
    ctx.globalAlpha = s.alpha;
    ctx.translate(Math.round(o.x + s.x), Math.round(o.y + s.y + s.sink));
    ctx.rotate(s.rot);
    ctx.drawImage(this.shipCanvas, -Math.round(L.center.x), -Math.round(L.center.y));
    ctx.restore();
    // pruva köpüğü
    if (this.speed > 6) for (let i = 0; i < 6; i++) px(ctx, o.x + s.x + Math.sin(this.t * 7 + i) * (4 + i), o.y + s.y - L.len / 2 - 2 + i, '#ffffff');
  }

  drawEntity(ctx, e, o) {
    const x = Math.round(e.screen ? e.x : o.x + e.x), y = Math.round(e.screen ? e.y : o.y + e.y);
    ctx.save();
    ctx.globalAlpha = e.alpha;
    if (e.kind === 'npc') {
      // sahnedeki yabancı figür (rıhtım, ada, sandal): hareket yönüne göre döner
      const mv = e.lx != null && Math.abs(e.x - e.lx) + Math.abs(e.y - e.ly) > 0.02;
      if (mv) { const dx = e.x - e.lx, dy = e.y - e.ly; e.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up'; }
      e.lx = e.x; e.ly = e.y;
      ctx.drawImage(npcSprite(e.npc || 'sailor', e.dir || 'down', mv ? 'walk' : e.state || 'idle', Math.floor(e.t * 6) % 4), x - CS / 2, y - CS / 2);
      if (e.carry) ctx.drawImage(cargoSprite(e.carry), x - 5, y - 14);
      ctx.restore();
      return;
    }
    if (e.kind === 'pet') {
      ctx.drawImage(petSprite(e.pet, e.dir || 'down', e.pose || 'sit'), x - CS / 2, y - CS / 2);
      ctx.restore();
      return;
    }
    if (e.kind === 'ship') {
      const L = topShip(e.level || 2, e.damage || 'healthy', e.style);
      ctx.translate(x, y);
      ctx.rotate(e.rot || 0);
      ctx.scale(e.scale, e.scale);
      ctx.drawImage(L.hull, -Math.round(L.center.x), -Math.round(L.center.y));
      // gemideki figürler
      if (e.crewNpc) e.crewNpc.forEach((k, i) => {
        const st = L.stations[(i * 3 + 1) % L.stations.length];
        ctx.drawImage(npcSprite(k, i % 2 ? 'left' : 'right', e.agitated ? 'react' : 'idle'), Math.round(st.x - L.center.x - CS / 2), Math.round(st.y - L.center.y - CS / 2));
      });
      if (e.loot) e.loot.forEach((g, i) => { const sl = L.cargoSlots[i % L.cargoSlots.length]; ctx.drawImage(cargoSprite(g), Math.round(sl.x - L.center.x - 5), Math.round(sl.y - L.center.y - 5)); });
      ctx.globalAlpha = e.alpha * (e.sails === 'furled' ? 0.95 : 0.8);
      ctx.drawImage(e.sails === 'furled' ? L.sailsFurled : L.sailsFull, -Math.round(L.center.x), -Math.round(L.center.y));
      ctx.restore();
      if (e.fire) DRAW.fire(ctx, x + (e.fire.dx || 0), y + (e.fire.dy || 0), this.t, { n: 14, w: 20, h: 14 });
      if (e.walkers) for (const w of e.walkers) {
        ctx.drawImage(npcSprite(w.npc, w.dir || 'down', w.path && w.path.length ? 'walk' : 'idle', Math.floor((w.ft || 0) * 6) % 4), Math.round(o.x + w.x - CS / 2), Math.round(o.y + w.y - CS / 2));
        if (w.carry) ctx.drawImage(cargoSprite(w.carry), Math.round(o.x + w.x - 5), Math.round(o.y + w.y - 14));
      }
      if (e.hooks) for (const hk of e.hooks) { if (hk.plank) { for (let k = -2; k <= 2; k++) line(ctx, o.x + hk.x0, o.y + hk.y0 + k, o.x + hk.x1, o.y + hk.y1 + k, Math.abs(k) === 2 ? '#3a2412' : '#a87a4a'); } else line(ctx, o.x + hk.x0, o.y + hk.y0, o.x + hk.x1, o.y + hk.y1, '#3a2a1a'); }
      return;
    }
    if (e.kind === 'wave') { ctx.restore(); DRAW.wave(ctx, 0, y, this.t, { W: this.W }); return; }
    if (e.kind === 'flag') { ctx.restore(); return; }
    const fn = DRAW[e.kind];
    if (fn) {
      const opts = { W: this.W || 640, H: this.H || 360, ...(e.opts || {}) };
      if (e.scale !== 1) { ctx.translate(x, y); ctx.scale(e.scale, e.scale); fn(ctx, 0, 0, this.t, opts); }
      else fn(ctx, x, y, this.t, opts);
    }
    ctx.restore();
  }

  drawFx(ctx, f, o) {
    if (f.type === 'p') {
      ctx.globalAlpha = Math.max(0, f.life / f.max);
      ctx.fillStyle = f.col;
      ctx.fillRect(Math.round(o.x + f.x), Math.round(o.y + f.y), f.size, f.size);
      ctx.globalAlpha = 1;
      return;
    }
    const k = Math.max(0, Math.min(1, f.t / f.dur));
    if (f.t < 0) return;
    const x = o.x + f.from.x + (f.to.x - f.from.x) * k;
    const y = o.y + f.from.y + (f.to.y - f.from.y) * k;
    const z = Math.sin(k * Math.PI) * (f.arc ?? 14);
    if (f.type === 'proj') {
      px(ctx, x + 2, y + 3, 'rgba(0,0,0,0.3)');
      if (f.kind === 'ball') { rect(ctx, x - 1, y - z - 1, 3, 3, '#141418'); px(ctx, x, y - z - 1, '#5a5a62'); }
      else if (f.kind === 'arrow') line(ctx, x - 3, y - z, x + 3, y - z, '#e8e0c8');
      else if (f.kind === 'chest') { rect(ctx, x - 4, y - z - 3, 8, 6, '#7a4a24'); rect(ctx, x - 4, y - z - 1, 8, 1, '#f2c14e'); }
      else if (f.kind === 'crate') ctx.drawImage(cargoSprite(f.good || 'GOOD_SPICE'), Math.round(x - 5), Math.round(y - z - 5));
      else if (f.kind === 'rope') line(ctx, o.x + f.from.x, o.y + f.from.y, x, y, '#c8a070');
      else if (f.kind === 'flare') { disc(ctx, x, y - z, 2, '#ff6040'); px(ctx, x, y - z, '#fff0a0'); }
    } else if (f.type === 'coin') {
      px(ctx, x, y - z * 0.8, f.col);
      px(ctx, x + 1, y - z * 0.8, '#b8862b');
    } else if (f.type === 'icon') {
      ctx.drawImage(iconCanvas(f.icon), Math.round(x - 5), Math.round(y - z - 5));
    }
  }

  /** DOM için: konuşma balonları ve süzülen yazılar (tampon koordinatı) */
  overlays(W, H) {
    const o = this.screenOrigin(W, H);
    const out = [];
    for (const b of this.deck.bubblePositions()) {
      const w = this.shipToWorld(b.x, b.y);
      out.push({ kind: 'bubble', text: b.text, ...this.toScreen(w.x, w.y, W, H) });
    }
    for (const e of this.entities) if (e.say && e.sayT > 0) out.push({ kind: 'bubble', text: e.say, ...this.toScreen(e.x + (e.sayDx || 0), e.y - 30, W, H) });
    for (const tx of this.texts) out.push({ kind: 'float', text: tx.text, color: tx.color, a: 1 - tx.t / 2.2, ...this.toScreen(tx.x, tx.y, W, H) });
    void o;
    return out;
  }
}
