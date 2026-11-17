// TOP-DOWN dünya sahnesi. Dünya koordinatı: bizim geminin merkezi (0,0); +y kıç yönü (ekranın altı).
// Gemi kuzeye ilerler: okyanus aşağı akar. Karşılaşmalar aynı sahnede, gemi görünür kalarak oynar.
import { makeCanvas, rect, px, disc, line, hline, vline } from '../pixel.js';
import { topShip, shipCompose } from './TopShip.js';
import { Ocean } from './Ocean.js';
import { Deck2D } from './Deck2D.js';
import { DRAW, cargoSprite, drawTown, drawPier, drawCoastHint } from './Props.js';
import './Props2.js';
import './Props4.js';
import './Props5.js';
import { X3FX } from './Props6.js';
import './Props7.js';
import { npcSprite, petSprite, CS, dS } from './TopChars.js';
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
      // Piksel sanatı en yakın komşu ile küçük açılarla döndürülünce gövdede kayan bir kırılma çizgisi oluşur;
      // bu yüzden sürekli yalpa yalnızca yana kayma olarak verilir, döndürme sadece olaylardaki bilinçli yatma içindir.
      s.rot = this.extraRot || 0;
      s.x = lerp(s.x, (this.shipTargetX || 0) + s.sway, Math.min(1, dt * 2));
    } else if (this.mode === 'harbor') {
      s.rot = 0;
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
    if (this.mode !== 'harbor') this.ocean.emitWake(o.x + s.x, 0, L.beam, this.speed, o.y + s.y + L.len / 2 + (L.sternH || 0) - 2, o.y + s.y - L.len / 2 + 4);
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
      // uzaklaşırken (zoom < 1) kenarlarda önceki karenin artığı kalmasın: kenarları deniz zemini doldurur
      if (z < 1) this.ocean.drawBase(ctx, W, H);
      ctx.drawImage(this.zoomCanvas, Math.round(W / 2 - (W * z) / 2), Math.round(H / 2 - (H * z) / 2), Math.round(W * z), Math.round(H * z));
    }
  }

      drawOurShip(e, a) {
        var o, l;
        let r = this.layout(),
          n = this.ship;
        (!this.shipCanvas || this.shipCanvas.width !== r.w || this.shipCanvas.height !== r.h) && (this.shipCanvas = makeCanvas(r.w, r.h));
        let i = this.shipCanvas.getContext("2d");
        i.clearRect(0, 0, r.w, r.h);
        let items = [];
        (this.cargoOverride || n.cargo).forEach((d, p) => {
          if (!d) return;
          let f = r.cargoSlots[p % r.cargoSlots.length],
            y = Math.floor(p / r.cargoSlots.length);
          items.push({ y: f.y + 4 + y * 0.01, fn: () => dS(i, cargoSprite(d.good, d.spoiled), f.x, f.y + 6 - y * 6) });
        });
        items.push(...this.deck.items(i, "deck"));
        for (let d of this.entities)
          d.local &&
            DRAW[d.kind] &&
            items.push({
              y: d.local.y + 0.2,
              fn: () => {
                let g = i.globalAlpha;
                (i.globalAlpha = g * d.alpha), DRAW[d.kind](i, Math.round(d.local.x), Math.round(d.local.y), this.t, { W: this.W || 640, H: this.H || 360, ...(d.opts || {}) }), (i.globalAlpha = g);
              },
            });
        this.sailA = this.sailA || [];
        let acts = [...this.deck.actors.values(), ...this.deck.temp],
          custom = ((o = this.cosmetics) != null && o.flag) || this.flagUp;
        shipCompose(i, r, this.sails, items, this.t, {
          noFlag: custom,
          sailAlpha: (k, M) => {
            if (this.sails !== "full") return (this.sailA[k] = 1), 1;
            let B = M.spr.box,
              hid = acts.some(
                (A) => !A.hidden && A.kind !== "parrot" && !A.z && A.y < M.y - 3 && A.x > M.x + B.x0 - 4 && A.x < M.x + B.x1 + 4 && A.y - 18 < M.y + B.y1 && A.y > M.y + B.y0,
              ),
              tg = hid ? 0.42 : 0.86,
              c = this.sailA[k] == null || this.sailA[k] === 1 ? 0.86 : this.sailA[k];
            return (c += (tg - c) * 0.1), (this.sailA[k] = c), c;
          },
        });
        if ((o = this.cosmetics) != null && o.flag && !this.flagUp) {
          let d = r.masts[r.masts.length - 1],
            p = Math.sin(this.t * 4) > 0 ? 1 : 0,
            fy = d.y - d.h - 1;
          vline(i, d.x, fy - 10, fy + 1, "#3a2412"),
            rect(i, d.x + 1, fy - 10, 9, 4, "#24508a"),
            rect(i, d.x + 1, fy - 6, 7 + p, 2, "#24508a"),
            rect(i, d.x + 4, fy - 9, 2, 2, "#f2c14e"),
            px(i, d.x + 10 + p, fy - 9, "#24508a"),
            hline(i, d.x + 1, d.x + 7, fy - 4, "#1a3a66");
        }
        if ((l = this.cosmetics) != null && l.stern) {
          let d = r.top + r.len + 1;
          rect(i, r.cx - 8, d, 16, 3, "#8a6a20"),
            rect(i, r.cx - 7, d, 14, 2, "#f2c14e"),
            px(i, r.cx, d - 1, "#fff0a0"),
            px(i, r.cx - 1, d - 1, "#f2c14e"),
            px(i, r.cx + 1, d - 1, "#f2c14e"),
            px(i, r.cx - 5, d + 1, "#c89030"),
            px(i, r.cx + 5, d + 1, "#c89030"),
            px(i, r.cx, d + 3, "#f2c14e");
        }
        if (this.flagUp) {
          let d = r.masts[0],
            fy = d.y - d.h - 1,
            p = Math.sin(this.t * 4) > 0 ? 1 : 0,
            c = this.flagColor || "#0a0a0a";
          vline(i, d.x, fy - 11, fy + 1, "#3a2412"), rect(i, d.x + 1, fy - 11, 6, 7, c), rect(i, d.x + 7, fy - 11 + p, 5, 7, c);
          this.flagColor || (rect(i, d.x + 4, fy - 9, 3, 2, "#ffffff"), px(i, d.x + 5, fy - 7, "#ffffff"), px(i, d.x + 3, fy - 6, "#ffffff"), px(i, d.x + 7, fy - 6, "#ffffff"));
        }
        if (
          (this.deck.draw(i, "air"),
          (this.ocean.night || this.ocean.dark) && (disc(i, r.cx, r.helm.y - 10, 13, "rgba(255,220,140,0.14)"), disc(i, r.cx, r.helm.y - 10, 7, "rgba(255,220,140,0.12)")),
          e.save(),
          (e.globalAlpha = n.alpha),
          e.translate(Math.round(a.x + n.x), Math.round(a.y + n.y + n.sink)),
          e.rotate(n.rot),
          e.drawImage(this.shipCanvas, -Math.round(r.center.x), -Math.round(r.center.y)),
          e.restore(),
          this.speed > 6)
        ) {
          for (let d = 0; d < 7; d++) px(e, a.x + n.x + Math.sin(this.t * 7 + d) * (3 + d), a.y + n.y - r.len / 2 - 1 + d, "#ffffff");
          // kıç aynasının altında köpük
          let sy = a.y + n.y + r.len / 2 + (r.sternH || 0) - 1;
          for (let d = -6; d <= 6; d++) Math.sin(this.t * 9 + d * 1.7) > -0.2 && px(e, a.x + n.x + d * (r.beam / 16), sy + (Math.abs(d) % 2), "rgba(240,250,255,0.8)");
        }
      }
      drawEntity(e, a, r) {
        if (a.local && DRAW[a.kind] && !a.screen) return;
        let n = Math.round(a.screen ? a.x : r.x + a.x),
          i = Math.round(a.screen ? a.y : r.y + a.y);
        if ((e.save(), (e.globalAlpha = a.alpha), a.kind === "npc")) {
          let o = a.lx != null && Math.abs(a.x - a.lx) + Math.abs(a.y - a.ly) > 0.02;
          if (o) {
            let l = a.x - a.lx,
              d = a.y - a.ly;
            a.dir = Math.abs(l) > Math.abs(d) ? (l > 0 ? "right" : "left") : d > 0 ? "down" : "up";
          }
          (a.lx = a.x),
            (a.ly = a.y),
            dS(e, npcSprite(a.npc || "sailor", a.dir || "down", o ? "walk" : a.state || "idle", Math.floor(a.t * 6) % 4), n, i + 2),
            a.carry && dS(e, cargoSprite(a.carry), n, i - 22),
            e.restore();
          return;
        }
        if (a.kind === "pet") {
          dS(e, petSprite(a.pet, a.dir || "down", a.pose || "sit"), n, i + 2), e.restore();
          return;
        }
        if (a.kind === "ship") {
          let PI = Math.PI,
            rr = ((((a.rot || 0) + PI) % (2 * PI)) + 2 * PI) % (2 * PI) - PI,
            ori = Math.abs(rr) <= PI / 4 ? "up" : Math.abs(rr) >= (3 * PI) / 4 ? "down" : rr > 0 ? "right" : "left",
            base = { up: 0, right: PI / 2, down: PI, left: -PI / 2 }[ori],
            res = ((((rr - base + PI) % (2 * PI)) + 2 * PI) % (2 * PI)) - PI,
            tilt = Math.max(-0.3, Math.min(0.3, res * 0.6)),
            o = topShip(a.level || 2, a.damage || "healthy", a.style, ori),
            cv = a._cv && a._cv.width === o.w && a._cv.height === o.h ? a._cv : (a._cv = makeCanvas(o.w, o.h)),
            c2 = cv.getContext("2d"),
            items = [],
            toUs = a.x > this.ship.x ? "left" : "right";
          c2.clearRect(0, 0, o.w, o.h);
          a.crewNpc &&
            a.crewNpc.forEach((l, d) => {
              let p = o.stations[(d * 3 + 1) % o.stations.length];
              items.push({ y: p.y, fn: () => dS(c2, npcSprite(l, d % 3 === 2 ? "down" : toUs, a.agitated ? "react" : "idle"), p.x, p.y + 2) });
            });
          a.loot &&
            a.loot.forEach((l, d) => {
              let p = o.cargoSlots[d % o.cargoSlots.length];
              items.push({ y: p.y + 4, fn: () => dS(c2, cargoSprite(l), p.x, p.y + 6) });
            });
          shipCompose(c2, o, a.sails === "furled" ? "furled" : "full", items, this.t + (a.x || 0), { sailAlpha: () => (a.sails === "furled" ? 1 : 0.9) });
          if (
            (e.translate(n, i),
            e.rotate(tilt),
            e.scale(a.scale, a.scale),
            e.drawImage(cv, -Math.round(o.center.x), -Math.round(o.center.y)),
            e.restore(),
            a.fire && DRAW.fire(e, n + (a.fire.dx || 0), i + (a.fire.dy || 0), this.t, { n: 14, w: 20, h: 14 }),
            a.hooks)
          )
            for (let l of a.hooks)
              if (l.plank) {
                for (let d = -2; d <= 2; d++) line(e, r.x + l.x0, r.y + l.y0 + d, r.x + l.x1, r.y + l.y1 + d, Math.abs(d) === 2 ? "#3a2412" : d === -1 ? "#c89a62" : "#a87a4a");
                line(e, r.x + l.x0, r.y + l.y0 + 3, r.x + l.x1, r.y + l.y1 + 3, "rgba(20,10,4,0.3)");
              } else line(e, r.x + l.x0, r.y + l.y0, r.x + l.x1, r.y + l.y1, "#3a2a1a"), line(e, r.x + l.x0, r.y + l.y0 - 1, r.x + l.x1, r.y + l.y1 - 1, "#c8a070");
          if (a.walkers)
            for (let l of [...a.walkers].sort((A, B) => A.y - B.y))
              (e.fillStyle = "rgba(20,10,4,0.22)"),
                e.fillRect(Math.round(r.x + l.x - 4), Math.round(r.y + l.y), 8, 2),
                dS(e, npcSprite(l.npc, l.dir || "down", l.path && l.path.length ? "walk" : "idle", Math.floor((l.ft || 0) * 6) % 4), r.x + l.x, r.y + l.y + 2),
                l.carry && dS(e, cargoSprite(l.carry), r.x + l.x, r.y + l.y - 22);
          return;
        }
        if (a.kind === "wave") {
          e.restore(), DRAW.wave(e, 0, i, this.t, { W: this.W });
          return;
        }
        if (a.kind === "flag") {
          e.restore();
          return;
        }
        let s = DRAW[a.kind];
        if (s) {
          let o = { W: this.W || 640, H: this.H || 360, ...(a.opts || {}) };
          a.scale !== 1 ? (e.translate(n, i), e.scale(a.scale, a.scale), s(e, 0, 0, this.t, o)) : s(e, n, i, this.t, o);
        }
        e.restore();
      }
      drawFx(e, a, r) {
        var l;
        if (a.type === "p") {
          (e.globalAlpha = Math.max(0, a.life / a.max)),
            (e.fillStyle = a.col),
            e.fillRect(Math.round(r.x + a.x), Math.round(r.y + a.y), a.size, a.size),
            (e.globalAlpha = 1);
          return;
        }
        let n = Math.max(0, Math.min(1, a.t / a.dur));
        if (a.t < 0) return;
        let i = r.x + a.from.x + (a.to.x - a.from.x) * n,
          s = r.y + a.from.y + (a.to.y - a.from.y) * n,
          o = Math.sin(n * Math.PI) * ((l = a.arc) != null ? l : 14);
        if (a.type === "proj") {
          a.kind !== "rope" && ((e.fillStyle = "rgba(0,0,0,0.22)"), e.fillRect(Math.round(i - 2), Math.round(s + 2), 4, 2));
          a.kind === "ball"
            ? (disc(e, i, s - o - 2, 2, "#141418"), px(e, i - 1, s - o - 3, "#6a6a76"), px(e, i - 3 * Math.sign(a.to.x - a.from.x || 1), s - o - 2, "rgba(200,200,200,0.5)"))
            : a.kind === "arrow"
              ? (line(e, i - 3, s - o - 2, i + 3, s - o - 2, "#e8e0c8"), px(e, i + (a.to.x > a.from.x ? 4 : -4), s - o - 2, "#9aa1a8"), px(e, i + (a.to.x > a.from.x ? -4 : 4), s - o - 3, "#c8423b"))
              : a.kind === "chest"
                ? dS(e, cargoSprite("GOOD_GOLD_BAR"), i, s - o)
                : a.kind === "crate"
                  ? dS(e, cargoSprite(a.good || "GOOD_SPICE"), i, s - o)
                  : a.kind === "rope"
                    ? (line(e, r.x + a.from.x, r.y + a.from.y - 6, i, s - 2, "#c8a070"), line(e, r.x + a.from.x, r.y + a.from.y - 5, i, s - 1, "#8a6a40"))
                    : X3FX.proj(e, a.kind, i, s - o, this.t) ? 0 : a.kind === "flare" && (disc(e, i, s - o - 2, 2, "#ff6040"), px(e, i, s - o - 2, "#fff0a0"), px(e, i - 1, s - o + 1, "rgba(255,200,120,0.6)"), px(e, i + 1, s - o + 3, "rgba(255,200,120,0.4)"));
        } else
          a.type === "coin"
            ? (rect(e, i - 1, s - o * 0.8 - 2, 2, 3, a.col), px(e, i, s - o * 0.8 - 1, "#b8862b"), px(e, i - 1, s - o * 0.8 - 2, "#fff6c0"))
            : a.type === "icon" && e.drawImage(iconCanvas(a.icon), Math.round(i - 8), Math.round(s - o - 13));
      }

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
