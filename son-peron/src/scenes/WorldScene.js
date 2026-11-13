// Tek dünya sahnesi: aktif haritayı (4 haritadan biri) çizer, simülasyon durumunu sprite'lara eşler,
// oyuncu girdisini simülasyon eylemlerine çevirir. Oyun mantığı burada DEĞİL, src/systems altındadır.
import Phaser from 'phaser';
import { T } from '../world/maps.js';
import { tileIndex, VARIANTS } from '../art/tiles.js';
import { charSheet, lookKey, ANIM, DIRS, FRAMES } from '../art/chars.js';
import { trainX, TRAIN_LEN } from '../systems/trains.js';
import { DIRV } from '../systems/sim.js';

const TS = 32;
const OBJ_FRAME = { mailbox: 'o/mailbox', timetable: 'o/timetable', station_sign: 'o/station_sign', bench: 'o/bench', lamppost: 'o/lamppost', fence: 'o/fence', well: 'o/well', fountain: 'o/fountain', festival_stall: 'o/festival_stall', town_board: 'o/town_board', rod_stand: 'o/rod_stand', fishing_spot: 'o/fishing_spot', grand_celebration_board: 'o/celebration_board', shop_grocer: 'b/shop_grocer', shop_carpenter: 'b/shop_carpenter', shop_greenhouse: 'b/shop_greenhouse', house_a: 'b/house_a', house_b: 'b/house_b', house_c: 'b/house_c' };
const BUSY_TOOL = { repair: 'hammer', craft: 'hammer', prep: 'spoon', clean_table: 'cloth', clean_stain: 'cloth' };

export default class WorldScene extends Phaser.Scene {
  constructor() { super('World'); }
  create() {
    this.app = this.registry.get('app'); this.sim = this.app.sim; this.views = new Map(); this.used = new Set(); this.parts = []; this.rot = 0; this.placeSel = -1; this.stepT = 0; this.time0 = 0;
    this.atlasData = this.cache.json.get('atlasData').frames;
    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SHIFT');
    this.input.keyboard.on('keydown', (e) => this.onKey(e));
    this.input.on('wheel', (p, o, dx, dy) => { if (!this.app.ui.blocking()) this.app.setZoom(this.app.userZoom - Math.sign(dy) * 0.125); });
    this.input.on('pointerdown', (p) => this.onPointer(p));
    this.input.mouse?.disableContextMenu();
    this.gfx = this.add.graphics().setDepth(900001);
    this.night = this.add.rectangle(0, 0, 6000, 6000, 0xffffff).setScrollFactor(0).setDepth(900000).setBlendMode(Phaser.BlendModes.MULTIPLY);
    this.weatherPool = []; for (let i = 0; i < 90; i++) this.weatherPool.push(this.add.image(0, 0, 'atlas', 'fx/rain').setScrollFactor(0).setDepth(900002).setVisible(false));
    this.target = this.add.rectangle(0, 0, 2, 2, 0, 0); this.cameras.main.startFollow(this.target, true, 0.14, 0.14).setDeadzone(70, 50).setRoundPixels(true);
    this.buildScene(); this.scale.on('resize', () => this.app.setZoom(this.app.userZoom));
    this.app.setZoom(this.app.userZoom); this.cameras.main.fadeIn(400);
  }
  setSim(sim) { this.sim = sim; this.clearViews(); this.buildScene(); }
  clearViews() { for (const v of this.views.values()) v.destroy(); this.views.clear(); for (const p of this.parts) p.img.destroy(); this.parts = []; }

  // ---------------------------------------------------------------- harita
  buildScene() {
    const s = this.sim.s, scene = s.player.scene, m = this.sim.map(scene); this.sceneId = scene; this.mapRef = m; this.season = this.sim.season();
    this.clearViews(); if (this.tilemap) this.tilemap.destroy();
    const map = this.make.tilemap({ tileWidth: TS, tileHeight: TS, width: m.w, height: m.h }); const ts = map.addTilesetImage('tiles_' + this.season, 'tiles_' + this.season, TS, TS, 0, 0);
    const layer = map.createBlankLayer('ground', ts); layer.setDepth(0);
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) layer.putTileAt(tileIndex(m.ground[y * m.w + x], (x * 7 + y * 13 + ((x * y) % 5)) % VARIANTS), x, y);
    this.tilemap = map; this.cameras.main.setBounds(0, 0, m.w * TS, m.h * TS); this.cameras.main.setBackgroundColor(scene === 'restaurant_interior' ? '#1b1413' : '#3a5a3a');
    this.statics = [];
    for (const o of m.objects) { if (o.kind === 'restaurant_ext' || o.kind === 'station_ext' || o.kind === 'delivery_crate' || o.kind === 'old_gar_noticeboard' || o.kind === 'festival_stall') continue; const fr = o.kind === 'pine' ? 'o/pine/' + this.season : OBJ_FRAME[o.kind]; if (!fr) continue; const img = this.objImage(o, fr); this.views.set('static:' + this.statics.length, img); this.statics.push(img); if (o.light) img.light = true; }
    const p = s.player; this.target.setPosition(p.x * TS, p.y * TS); this.cameras.main.centerOn(p.x * TS, p.y * TS);
    this.app.audio.setAmbient(scene === 'restaurant_interior' ? 'indoor' : ['rain', 'storm'].includes(s.weather) ? 'rain' : ['snow', 'blizzard'].includes(s.weather) ? 'snow' : 'forest');
  }
  objImage(o, fr) { const wide = o.w === 1 && this.textures.getFrame('atlas', fr).width > TS; const img = this.add.image(wide ? (o.x + 0.5) * TS : o.x * TS, (o.y + o.h) * TS, 'atlas', fr).setOrigin(wide ? 0.5 : 0, 1); img.setDepth(o.solid === false ? 3 : (o.y + o.h) * TS - 2); img.tall = img.height > 70 && o.w === 1; return img; }
  view(key, make) { let v = this.views.get(key); if (!v) { v = make(); this.views.set(key, v); } this.used.add(key); return v; }
  img(key, frame, x, y, depth, ox = 0, oy = 0) { const v = this.view(key, () => this.add.image(x, y, 'atlas', frame).setOrigin(ox, oy)); if (v.frame.name !== frame) v.setFrame(frame); v.setPosition(x, y).setDepth(depth); return v; }

  // ---------------------------------------------------------------- karakterler
  charKey(look) {
    const key = lookKey(look); if (this.textures.exists(key)) return key;
    const sheet = charSheet(look); const cv = document.createElement('canvas'); cv.width = sheet.w; cv.height = sheet.h; cv.getContext('2d').putImageData(new ImageData(sheet.d, sheet.w, sheet.h), 0, 0);
    const tex = this.textures.addCanvas(key, cv); for (let d = 0; d < 4; d++) for (let f = 0; f < FRAMES; f++) tex.add(d * FRAMES + f, 0, f * 32, d * 48, 32, 48);
    for (const [name, fr] of Object.entries(ANIM)) DIRS.forEach((dir, d) => this.anims.create({ key: `${key}_${name}_${dir}`, frames: fr.map((f) => ({ key, frame: d * FRAMES + f })), frameRate: name === 'walk' || name === 'carry' ? 8 : name === 'work' ? 9 : name === 'eat' ? 3 : 2, repeat: -1 }));
    return key;
  }
  char(key, e, anim, opt = {}) {
    const tk = this.charKey(e.look); const v = this.view(key, () => this.add.sprite(0, 0, tk, 0).setOrigin(0.5, 0.9));
    if (v.texture.key !== tk) v.setTexture(tk);
    const ak = `${tk}_${anim}_${e.dir || 'down'}`; if (v.anims.currentAnim?.key !== ak) v.play(ak); v.anims.timeScale = opt.fast ? 1.5 : 1;
    const sc = e.look.small ? 0.82 : 1; v.setScale(sc).setPosition(Math.round(e.x * TS), Math.round(e.y * TS + (opt.dy || 0))).setDepth(e.y * TS + (opt.dz || 0)).setAlpha(opt.alpha ?? 1);
    return v;
  }

  // ---------------------------------------------------------------- girdi
  onKey(e) {
    const app = this.app, ui = app.ui, k = e.key.length === 1 ? e.key.toLowerCase() : e.key; app.audio.unlock();
    if (k === 'F11') { e.preventDefault(); if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.(); return; }
    if (k === 'Tab') e.preventDefault();
    if (ui.blocking()) { if (k === 'Escape' || (k === 'Tab' && ui.panel === 'inventory') || (ui.hotkey && k === ui.hotkey)) ui.close(); else ui.key?.(k, e); return; }
    if (this.placing) { if (k === 'Escape' || k === 'b') this.setPlacing(false); else if (k === 'r') { this.rot = (this.rot + 1) % 4; app.audio.sfx('ui'); } return; }
    const s = this.sim.s;
    if (k >= '1' && k <= '8') { s.player.sel = Number(k) - 1; app.audio.sfx('ui'); return; }
    switch (k) {
      case 'e': case 'ı': case ' ': this.doInteract(); break;
      case 'f': { const r = this.sim.ia.useTool(this.sim); if (r.ui) ui.open(r.ui, r); break; }
      case 'q': this.sim.ia.dropCarried(this.sim); break;
      case 'Tab': ui.open('inventory'); break;
      case 'b': this.setPlacing(true); break;
      case 'c': if (this.nearType((d) => d.workbench, 3)) { if (s.flags.repair_workbench) ui.open('craft'); else ui.toast('Önce marangoz tezgâhını onar', 'error'); } else ui.toast('Üretim için marangoz tezgâhına yaklaş', 'error'); break;
      case 'j': ui.open('quests'); break;
      case 'm': ui.open('map'); break;
      case 'Escape': ui.open('pause'); break;
    }
  }
  nearType(pred, r) { const p = this.sim.s.player; return this.sim.s.furniture.find((f) => f.scene === p.scene && pred(this.sim.def(f)) && Math.hypot(f.x + 1 - p.x, f.y + 0.5 - p.y) < r); }
  doInteract(t) {
    t = t || this.sim.ia.nearest(this.sim); if (!t) return;
    const r = this.sim.ia.interact(this.sim, t); if (r?.ui) this.app.ui.open(r.ui, r);
  }
  onPointer(p) {
    const app = this.app; app.audio.unlock(); if (app.ui.blocking()) return; const w = p.positionToCamera(this.cameras.main); const cx = Math.floor(w.x / TS), cy = Math.floor(w.y / TS);
    if (this.placing) {
      if (p.rightButtonDown()) { if (this.placeSel >= 0) { this.placeSel = -1; app.ui.refresh(); } else this.setPlacing(false); return; }
      const s = this.sim.s;
      if (this.placeSel >= 0 && s.player.inv[this.placeSel]) { const r = this.sim.build.place(this.sim, this.placeSel, cx, cy, this.rot); if (r.ok) { app.audio.sfx('place'); if (!s.player.inv[this.placeSel]) this.placeSel = -1; app.ui.refresh(); } }
      else { const f = [...s.furniture].reverse().find((x) => { if (x.scene !== s.player.scene) return false; const [fw, fh] = this.sim.fp(x); return cx >= x.x && cx < x.x + fw && cy >= x.y && cy < x.y + fh; }); if (f) { const r = this.sim.build.pickUp(this.sim, f.id); if (r.ok) { this.placeSel = r.slot; this.rot = f.rot; app.audio.sfx('pick'); app.ui.refresh(); } } }
      return;
    }
    if (p.rightButtonDown()) return;
    // Fare ile etkileşim: tıklanan hedef oyuncunun menzilindeyse
    const near = this.sim.ia.targets(this.sim).filter((t) => w.x / TS >= t.x - 0.2 && w.x / TS <= t.x + t.w + 0.2 && w.y / TS >= t.y - 0.8 && w.y / TS <= t.y + t.h + 0.2 && this.sim.ia.label(this.sim, t));
    const pl = this.sim.s.player; const t = near.find((x) => Math.hypot(Math.max(x.x, Math.min(pl.x, x.x + x.w)) - pl.x, Math.max(x.y, Math.min(pl.y, x.y + x.h)) - pl.y) <= 1.6);
    if (t) this.doInteract(t); else if (near.length) app.ui.toast('Biraz daha yaklaş', 'info');
  }
  setPlacing(on) { this.placing = on; this.placeSel = -1; this.app.ui.setPlacing(on); this.app.audio.sfx('open'); }

  // ---------------------------------------------------------------- döngü
  update(time, delta) {
    const app = this.app, sim = this.sim, s = sim.s, C = sim.C; const dt = Math.min(0.1, delta / 1000); this.time0 += dt;
    const paused = app.ui.blocking() || this.placing || app.frozen; sim.paused = paused;
    if (!paused) {
      const k = this.keys; const dx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0), dy = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
      if (!sim.movePlayer(dx, dy, dt * Math.min(app.speed, 3), k.SHIFT.isDown)) s.player.moving = false;
      else { this.stepT -= dt * (k.SHIFT.isDown ? 1.5 : 1); if (this.stepT <= 0) { this.stepT = 0.3; app.audio.sfx('step'); } }
      if (app.auto) app.auto(dt); else sim.tick((dt / C.realSecPerGameMin) * app.speed);
    }
    if (s.player.scene !== this.sceneId || sim.season() !== this.season || this.zonesKey !== s.zones.join()) { this.zonesKey = s.zones.join(); this.buildScene(); this.cameras.main.fadeIn(220); }
    this.handleFx(); this.used.clear(); for (let i = 0; i < this.statics.length; i++) this.used.add('static:' + i);
    this.syncWorld(); this.syncEntities(); this.syncOverlay(dt);
    for (const [key, v] of this.views) if (!this.used.has(key)) { v.destroy(); this.views.delete(key); }
    this.updateParts(dt); app.ui.tick(dt);
  }
  handleFx() {
    const app = this.app, a = app.audio, sim = this.sim; const here = (ev) => this.sceneId === 'railway_outdoors';
    for (const ev of sim.fx.splice(0)) {
      switch (ev.type) {
        case 'toast': app.ui.toast(ev.text, ev.kind); if (ev.kind === 'error') a.sfx('error'); break;
        case 'node_hit': a.sfx(ev.kind === 'tree' ? 'chop' : ev.kind === 'rock' ? 'mine' : 'pick'); if (here()) { this.burst((ev.x + 0.5) * TS, (ev.y + 0.3) * TS, ev.kind === 'rock' ? 'fx/shard' : ev.kind === 'tree' ? 'fx/chip' : 'fx/leaf', 7); const v = this.views.get('node:' + ev.id); if (v) this.tweens.add({ targets: v, angle: { from: -5, to: 5 }, duration: 60, yoyo: true, repeat: 1, onComplete: () => v.setAngle(0) }); } break;
        case 'gathered': a.sfx('pick'); this.floatText(`+${ev.qty} ${sim.C.items[ev.item].name}`, sim.s.player.x * TS, sim.s.player.y * TS - 40, '#fff2c0'); if (ev.kind === 'tree' && here()) this.burst((ev.x + 0.5) * TS, (ev.y - 1) * TS, 'fx/leaf', 14); break;
        case 'harvested': a.sfx('pick'); this.floatText(`+${ev.qty} ${sim.C.items[ev.item].name}`, sim.s.player.x * TS, sim.s.player.y * TS - 40, '#c8f0a0'); break;
        case 'tilled': a.sfx('dig'); break; case 'watered': a.sfx('water'); break; case 'planted': a.sfx('dig'); break;
        case 'repaired': case 'crafted': a.sfx('craft'); break; case 'placed': a.sfx('place'); break;
        case 'cook_start': a.sfx('sizzle'); break; case 'cooked': a.sfx('ding'); app.ui.toast(`${sim.C.recipes[ev.recipe].name} hazır! Ocağa E ile al, bara taşı.`, 'good'); break;
        case 'pot_taken': case 'picked_service': case 'served': case 'plates_collected': a.sfx('plate'); break;
        case 'bar_stocked': a.sfx('place'); break;
        case 'paid': a.sfx('coin'); this.floatText(`+${ev.total}${ev.tip ? ` (+${ev.tip} bahşiş)` : ''} G`, sim.s.player.x * TS, sim.s.player.y * TS - 44, '#ffe27a'); this.burst(sim.s.player.x * TS, sim.s.player.y * TS - 30, 'fx/coin', 6); break;
        case 'table_cleaned': case 'stain_cleaned': a.sfx('clean'); break;
        case 'train_approach': a.sfx('whistle'); app.ui.toast(`${sim.cal.fmtTime(ev.time)} treni yaklaşıyor!`, 'info'); break;
        case 'train_stop': a.sfx('brake'); break; case 'train_depart': a.sfx('whistle'); a.sfx('chug'); break;
        case 'group_arrived': a.sfx('door'); app.ui.toast(`Kapıda ${ev.size} kişilik bir grup bekliyor.`, 'info'); break;
        case 'ready_to_order': case 'wants_to_pay': a.sfx('ui'); break;
        case 'quest_done': a.sfx('quest'); break; case 'daily_done': case 'side_done': case 'festival_done': a.sfx('quest'); break;
        case 'sign': a.sfx('door'); break; case 'scene_change': a.sfx('door'); break;
        case 'fish_cast': case 'fish_caught': a.sfx('splash'); break; case 'fire_lit': a.sfx('fire'); break;
        case 'shop_buy': case 'shop_sell': case 'mail_ordered': a.sfx('coin'); break;
        case 'morning': app.onMorning(); break; case 'slept': a.sfx('sleep'); break;
        case 'stage_up': a.sfx('quest'); break;
      }
    }
  }
  floatText(text, x, y, color) { const t = this.add.text(x, y, text, { fontFamily: 'Verdana, sans-serif', fontSize: '15px', fontStyle: 'bold', color, stroke: '#2a1d1a', strokeThickness: 4 }).setOrigin(0.5).setDepth(900003); this.tweens.add({ targets: t, y: y - 36, alpha: 0, duration: 1500, onComplete: () => t.destroy() }); }
  burst(x, y, frame, n) { for (let i = 0; i < n; i++) this.part(x, y, frame, (Math.random() - 0.5) * 120, -40 - Math.random() * 90, 0.5 + Math.random() * 0.4, 300, y + 40); }
  part(x, y, frame, vx, vy, life, grav = 0, depth = 0, alpha = 1) { if (this.parts.length > 260) return; const img = this.add.image(x, y, 'atlas', frame).setDepth(depth || y + 20).setAlpha(alpha); this.parts.push({ img, vx, vy, life, max: life, grav, a: alpha }); }
  updateParts(dt) { for (let i = this.parts.length - 1; i >= 0; i--) { const p = this.parts[i]; p.life -= dt; if (p.life <= 0) { p.img.destroy(); this.parts.splice(i, 1); continue; } p.vy += p.grav * dt; p.img.x += p.vx * dt; p.img.y += p.vy * dt; p.img.setAlpha(p.a * Math.min(1, p.life / (p.max * 0.5))); } }

  // ---------------------------------------------------------------- dünya eşleme
  syncWorld() {
    const sim = this.sim, s = sim.s, scene = this.sceneId, m = this.mapRef, t = this.time0;
    if (scene === 'railway_outdoors') {
      const rest = m.objects.find((o) => o.kind === 'restaurant_ext'), stn = m.objects.find((o) => o.kind === 'station_ext');
      this.img('b:rest', 'b/restaurant/' + (s.renovations.includes('façade_renewal') ? 'new' : 'old'), rest.x * TS, rest.y * TS, (rest.y + rest.h) * TS - 34);
      this.img('b:stn', 'b/station/' + (s.renovations.includes('railway_sign_repair') ? 'new' : 'old'), stn.x * TS, stn.y * TS, (stn.y + stn.h) * TS - 2);
      this.img('sign', !s.flags.repair_entrance ? 'o/sign/none' : s.open ? 'o/sign/open' : 'o/sign/closed', (m.doorCell[0] + 1.15) * TS, (m.doorCell[1] - 0.35) * TS, (m.doorCell[1] + 1) * TS + 2);
      if (s.renovations.includes('terrace')) for (let x = 46; x <= 62; x += 4) { if (x >= 53 && x <= 56) continue; this.img('terr:' + x, 'f/garden_bench/0', x * TS, 45.2 * TS, 46 * TS, 0, 0); }
      const cr = m.objects.find((o) => o.kind === 'delivery_crate'); this.img('crate', s.crate.length ? 'o/crate/full' : 'o/crate/empty', cr.x * TS, (cr.y + 1) * TS, (cr.y + 1) * TS - 2, 0, 1);
      const nb = m.objects.find((o) => o.kind === 'old_gar_noticeboard'); this.img('nb', s.flags.noticeboard ? 'o/noticeboard/fixed' : 'o/noticeboard/broken', nb.x * TS, (nb.y + 1) * TS, (nb.y + 1) * TS - 2, 0, 1);
      for (const n of m.nodes) {
        const st = sim.farm.nodeState(sim, n); const fr = n.kind === 'tree' ? (st.alive ? 'o/tree/' + this.season : 'o/stump') : n.kind === 'rock' ? (st.alive ? 'o/rock' : 'o/rubble') : n.kind === 'mushroom' ? (st.alive ? 'o/mushroom' : null) : (st.alive ? 'o/berry/' : 'o/bush/') + this.season;
        if (!fr) continue; const v = this.img('node:' + n.id, fr, (n.x + 0.5) * TS, (n.y + 1) * TS, (n.y + 1) * TS - 2, 0.5, 1); v.tall = n.kind === 'tree' && st.alive;
      }
      this.syncTrain();
    }
    if (scene === 'town_square' && s.festival) m.objects.filter((o) => o.kind === 'festival_stall').forEach((o, i) => this.img('stall:' + i, 'o/festival_stall', o.x * TS, (o.y + 1) * TS, (o.y + 1) * TS, 0, 1));
    for (const f of s.furniture) {
      if (f.scene !== scene) continue; const d = sim.def(f); const [fw, fh] = sim.fp(f);
      let st = ''; if (d.station || d.workbench) { if (d.repair && !s.flags[d.repair]) st = 'broken'; else if (f.cook) st = f.cook.phase === 'done' ? 'done' : 'cook'; }
      if (d.fireplace && s.fire > 0) st = Math.floor(t * 6) % 2 ? 'lit' : 'lit2'; if (d.starterChest && s.flags.chest) st = 'open'; if (d.plot) st = f.watered ? 'wet' : f.tilled || f.crop ? 'tilled' : '';
      if (d.kind === 'bed' && this.app.sleeping) st = 'sleep';
      const rot = d.place === 'wall' ? 0 : f.rot; const fr = `f/${f.type}/${rot}${st ? '/' + st : ''}`; const extra = this.atlasData[fr]?.extra || 0;
      const layer = d.place === 'tile' || d.tile || d.plot ? 1 : d.place === 'wall' ? 2 : d.place === 'ceiling' ? 800000 : (f.y + fh) * TS - 3;
      const v = this.img('f:' + f.id, fr, f.x * TS, f.y * TS - extra, layer); v.setAlpha(d.place === 'ceiling' ? 0.85 : 1);
      if (f.cook && f.cook.phase !== 'done' && Math.random() < 0.12) this.part((f.x + 0.5) * TS + Math.random() * 10, f.y * TS - 6, 'fx/steam', (Math.random() - 0.5) * 14, -26, 1.1, 0, (f.y + fh) * TS + 40, 0.8);
      if (d.fireplace && s.fire > 0 && Math.random() < 0.1) this.part((f.x + fw / 2) * TS, (f.y + fh) * TS - 8, 'fx/flame', (Math.random() - 0.5) * 20, -30, 0.6, 0, (f.y + fh) * TS + 2);
      if (f.cook) { const c = f.cook; const pct = c.phase === 'done' ? 1 : c.phase === 'prep' ? (c.t / c.prep) * 0.12 : 0.12 + (c.t / c.cook) * 0.88; this.bar('ck:' + f.id, (f.x + fw / 2) * TS, f.y * TS - extra - 10, pct, c.phase === 'done' ? 0x6aa84f : 0xe08a3c); }
      if (f.slots) f.slots.forEach((sl, i) => { if (!sl.item) return; const n = sim.kitchen.slotFill(sim, f.id, i); const px = f.x * TS + (fw >= fh ? 6 + i * (fw * TS - 44) / Math.max(1, f.slots.length - 1 || 1) : 0), py = f.y * TS - 14 + (fw >= fh ? 0 : i * 30); this.img(`sl:${f.id}:${i}`, (sim.C.recipes[sl.item].ready ? 'i/' : 'pot/') + sl.item, px, py, layer + 1); this.label(`sln:${f.id}:${i}`, String(n), px + 26, py + 22, layer + 2); });
      if (d.readyShelf && sim.kitchen.readyBatches(sim, f.id).length) this.img('rs:' + f.id, 'pot/' + sim.kitchen.readyBatches(sim, f.id)[0].item, f.x * TS + 16, f.y * TS - 16, layer + 1);
      if (d.plot && f.crop) { const info = sim.farm.plotInfo(sim, f); this.img('crop:' + f.id, `crop/${f.crop.seed}/${info.stage === 'ripe' ? 3 : Math.min(2, Math.floor(info.pct * 3))}`, f.x * TS, f.y * TS, (f.y + 2) * TS - 4); }
      if (s.dirty[f.id]) { if (s.dirty[f.id].plates) this.img('dirty:' + f.id, 'fx/plates', (f.x + fw / 2) * TS, (f.y + fh / 2) * TS - 12, layer + 1, 0.5, 0.5); else this.img('dirty:' + f.id, 'fx/stain', (f.x + fw / 2) * TS, (f.y + fh / 2) * TS - 12, layer + 1, 0.5, 0.5); }
      v.light = !!d.light || (d.fireplace && s.fire > 0);
    }
    for (const st of s.stains) if (scene === 'restaurant_interior') this.img('stain:' + st.id, 'fx/stain', st.x * TS, st.y * TS, 2);
  }
  label(key, text, x, y, depth) { const v = this.view(key, () => this.add.text(0, 0, '', { fontFamily: 'Verdana, sans-serif', fontSize: '11px', fontStyle: 'bold', color: '#fff7dd', stroke: '#2a1d1a', strokeThickness: 3 }).setOrigin(1, 1)); if (v.text !== text) v.setText(text); v.setPosition(x, y).setDepth(depth); return v; }
  bar(key, x, y, pct, color) { const g = this.gfx; g.fillStyle(0x2a1d1a, 1).fillRect(x - 15, y - 3, 30, 6); g.fillStyle(color, 1).fillRect(x - 14, y - 2, 28 * Math.max(0, Math.min(1, pct)), 4); }
  syncTrain() {
    const sim = this.sim, s = sim.s; const tr = s.trains.find((t) => trainX(sim, t) !== null); if (!tr) return; const x = trainX(sim, tr) * TS; const y = 60 * TS - 14;
    const moving = tr.phase !== 'stopped' && s.minute < tr.time || s.minute > tr.time + sim.C.train.dwell; const f = moving ? Math.floor(this.time0 * 10) % 2 : 0; const open = !moving && s.minute >= tr.time + 0.4 && s.minute < tr.time + sim.C.train.dwell - 0.6;
    this.img('tr:loco', 't/loco/' + f, x, y, y + 1, 0, 1);
    for (let i = 0; i < 3; i++) this.img('tr:w' + i, `t/wagon/${f}/${open ? 'open' : 'closed'}`, x + 208 * (i + 1), y, y + 1, 0, 1);
    if (Math.random() < (moving ? 0.5 : 0.12)) this.part(x + 44, y - 96, 'fx/smoke', 30 + Math.random() * 30, -50 - Math.random() * 30, 1.6, -10, y + 5, 0.85);
    void TRAIN_LEN;
  }
  syncEntities() {
    const sim = this.sim, s = sim.s, scene = this.sceneId, p = s.player;
    // oyuncu
    const busy = p.busy; let anim = busy ? 'work' : (p.pot || p.carry.length) ? (p.moving ? 'carry' : 'carry') : p.moving ? 'walk' : 'idle';
    const pv = this.char('player', p, anim, { fast: p.running && p.moving }); if (!p.moving && !busy && (p.pot || p.carry.length)) pv.anims.pause(pv.anims.currentAnim.frames[0]); else pv.anims.resume();
    pv.setVisible(!this.app.sleeping); if (Math.hypot(this.target.x - p.x * TS, this.target.y - p.y * TS) > 320) this.cameras.main.centerOn(p.x * TS, p.y * TS); this.target.setPosition(p.x * TS, p.y * TS);
    const tool = busy ? (busy.tool || BUSY_TOOL[busy.kind] || (busy.kind === 'farm' ? null : null)) : null;
    if (tool) { const v = DIRV[p.dir]; const tv = this.img('ptool', 'h/' + (tool === 'fishing_rod' ? 'rod' : tool), p.x * TS + v[0] * 14 + (v[0] === 0 ? 12 : 0), p.y * TS - 26 + v[1] * 8, p.y * TS + (p.dir === 'up' ? -1 : 1), 0.2, 0.9); const sw = Math.sin(this.time0 * 16) * 45; tv.setAngle(p.dir === 'left' ? -40 - sw : 40 + sw).setFlipX(p.dir === 'left'); }
    if (p.pot) { const b = sim.kitchen.batch(sim, p.pot); if (b) this.img('ppot', 'pot/' + b.item, p.x * TS, p.y * TS - 52, p.y * TS + 2, 0.5, 0.5); }
    p.carry.forEach((c, i) => { this.img('pcar' + i, 'fx/plate', p.x * TS + (i - (p.carry.length - 1) / 2) * 20, p.y * TS - 46, p.y * TS + 2, 0.5, 0.5); this.img('pcari' + i, 'i/' + c.item, p.x * TS + (i - (p.carry.length - 1) / 2) * 20, p.y * TS - 54, p.y * TS + 3, 0.5, 0.5).setScale(0.75).setAlpha(c.orphan ? 0.55 : 1); });
    if (busy) this.bar('pbusy', p.x * TS, p.y * TS - 56, busy.t / busy.total, 0xf0cf5a);
    // müşteriler
    for (const c of s.customers) {
      if (c.scene !== scene || c.st === 'hidden') continue; const seated = !!c.seat && ['sit', 'eat', 'done'].includes(c.st);
      this.char('c:' + c.id, c, c.st === 'eat' ? 'eat' : seated ? 'sit' : c.path && !(c.wait > 0) ? 'walk' : 'idle', { dy: seated ? -6 : 0, dz: seated ? (c.dir === 'up' ? -20 : 6) : 0 });
      if (c.st === 'eat') { const l = s.orders.find((o) => o.lines.some((x) => x.cust === c.id))?.lines.find((x) => x.cust === c.id && x.status === 'served'); if (l) { const v = DIRV[c.dir]; this.img('food:' + c.id, 'i/' + l.item, c.x * TS + v[0] * 26, c.y * TS + v[1] * 22 - 22, (c.y + v[1]) * TS + 30, 0.5, 0.5).setScale(0.8); } }
    }
    for (const g of s.groups) {
      const c0 = sim.service.members(sim, g)[0]; if (!c0 || c0.scene !== scene) continue;
      const fr = g.state === 'ENTRY_QUEUE' ? 'fx/b_wait' : g.state === 'ORDER_READY' ? 'fx/b_order' : g.state === 'WAIT_PAYMENT' ? 'fx/b_pay' : g.state === 'WAITING_FOR_SERVE' && g.pat < g.patMax * 0.35 ? 'fx/b_angry' : null;
      if (fr) { const bob = Math.sin(this.time0 * 4) * 2; this.img('bub:' + g.id, fr, c0.x * TS, c0.y * TS - 62 + bob, 850000, 0.5, 0.5); this.bar('pat:' + g.id, c0.x * TS, c0.y * TS - 84, g.pat / g.patMax, g.pat / g.patMax > 0.5 ? 0x6aa84f : g.pat / g.patMax > 0.25 ? 0xe9b93f : 0xc5443b); }
    }
    for (const x of s.passers) if (x.scene === scene && !(x.t > 0)) this.char('ps:' + x.id, x, x.path ? 'walk' : 'idle');
    for (const a of Object.values(s.staff.agents)) if (a.scene === scene) { this.char('st:' + a.id, a, a.working ? 'work' : a.carry ? 'carry' : a.path ? 'walk' : 'idle'); if (a.carry) this.img('stc:' + a.id, 'pot/' + a.carry, a.x * TS, a.y * TS - 52, a.y * TS + 2, 0.5, 0.5); this.label('stn:' + a.id, sim.C.staff.candidates[a.id].name, a.x * TS + 18, a.y * TS - 48, 850000); }
    for (const n of Object.values(s.npcs)) if (n.scene === scene) { this.char('n:' + n.name, n, n.path ? 'walk' : 'idle'); this.label('nn:' + n.name, n.name, n.x * TS + 6 + n.name.length * 3.4, n.y * TS - 48, 850000); if (sim.quests.sideFor(sim, n.name)?.offer) this.img('nq:' + n.name, 'fx/b_talk', n.x * TS, n.y * TS - 68 + Math.sin(this.time0 * 4) * 2, 850000, 0.5, 0.5); }
    // uzun nesnelerin arkasında kalınca saydamlaştır
    for (const [key, v] of this.views) if (v.tall !== undefined && (key.startsWith('node:') || key.startsWith('static:'))) { const behind = v.tall && Math.abs(v.x - p.x * TS) < 26 && p.y * TS < v.y - 6 && p.y * TS > v.y - 86; v.setAlpha(behind ? 0.45 : 1); }
  }
  syncOverlay(dt) {
    const sim = this.sim, s = sim.s, g = this.gfx, p = s.player, cam = this.cameras.main; g.clear(); this.barsDrawn = true;
    // çubuklar syncWorld/syncEntities sırasında çizildiği için gfx.clear önce çağrılmalıydı: yeniden çiz
    this.redrawBars();
    // etkileşim göstergesi
    const t = this.app.ui.blocking() || this.placing ? null : sim.ia.nearest(sim); this.app.ui.setHint(t ? sim.ia.label(sim, t) : null);
    if (t) this.img('ekey', 'fx/ekey', (t.x + t.w / 2) * TS, t.y * TS - 26 + Math.sin(this.time0 * 5) * 2, 880000, 0.5, 1);
    // görev oku
    const mk = sim.quests.nextMark(sim);
    if (mk) { let pos = null; if (mk[0] === this.sceneId) pos = [mk[1], mk[2]]; else if (this.sceneId === 'restaurant_interior') pos = [16, 35]; else if (this.sceneId === 'railway_outdoors') pos = mk[0] === 'restaurant_interior' ? this.mapRef.doorCell : mk[0] === 'town_square' ? [0, 37] : [115, 47]; else pos = this.sceneId === 'town_square' ? [59, 21] : [0, 15];
      if (pos) { const ax = Math.max(cam.worldView.x + 20, Math.min(cam.worldView.right - 20, (pos[0] + 0.5) * TS)), ay = Math.max(cam.worldView.y + 40, Math.min(cam.worldView.bottom - 20, pos[1] * TS - 34 + Math.sin(this.time0 * 5) * 4)); this.img('qarrow', 'fx/arrow', ax, ay, 880001, 0.5, 1); } }
    // masa seçimi vurgusu
    for (const id of this.app.ui.highlightTables || []) { const f = sim.furn(id); if (!f) continue; const [w, h] = sim.fp(f); g.lineStyle(3, 0x7fe07f, 0.6 + 0.4 * Math.sin(this.time0 * 6)).strokeRect(f.x * TS - 2, f.y * TS - 8, w * TS + 4, h * TS + 10); }
    // yerleştirme modu
    if (this.placing) {
      const ptr = this.input.activePointer; const w = ptr.positionToCamera(cam); const cx = Math.floor(w.x / TS), cy = Math.floor(w.y / TS); const m = this.mapRef;
      g.lineStyle(1, 0xffffff, 0.12); for (let y = Math.max(0, cy - 7); y <= Math.min(m.h, cy + 8); y++) g.lineBetween(Math.max(0, cx - 9) * TS, y * TS, Math.min(m.w, cx + 10) * TS, y * TS); for (let x = Math.max(0, cx - 9); x <= Math.min(m.w, cx + 10); x++) g.lineBetween(x * TS, Math.max(0, cy - 7) * TS, x * TS, Math.min(m.h, cy + 8) * TS);
      const sl = this.placeSel >= 0 ? p.inv[this.placeSel] : null;
      if (sl && sim.C.placeables[sl.id]) { const d = sim.C.placeables[sl.id]; const rot = d.place === 'wall' ? 0 : this.rot; const fw = rot % 2 ? d.h : d.w, fh = rot % 2 ? d.w : d.h; const ok = sim.build.canPlace(sim, sl.id, this.sceneId, cx, cy, rot); const fr = `f/${sl.id}/${rot}`; const extra = this.atlasData[fr]?.extra || 0; this.img('ghost', fr, cx * TS, cy * TS - extra, 880002).setAlpha(0.7).setTint(ok.ok ? 0xaaffaa : 0xff8888); g.fillStyle(ok.ok ? 0x55dd55 : 0xdd4444, 0.35).fillRect(cx * TS, cy * TS, fw * TS, fh * TS); g.lineStyle(2, ok.ok ? 0x55dd55 : 0xdd4444, 1).strokeRect(cx * TS, cy * TS, fw * TS, fh * TS); this.app.ui.setPlaceMsg(ok.ok ? 'Sol tık: yerleştir · R: döndür · Sağ tık: bırak' : ok.msg); }
      else { const f = [...s.furniture].reverse().find((x) => { if (x.scene !== this.sceneId) return false; const [fw, fh] = sim.fp(x); return cx >= x.x && cx < x.x + fw && cy >= x.y && cy < x.y + fh; }); if (f) { const [fw, fh] = sim.fp(f); g.lineStyle(2, 0xffe27a, 1).strokeRect(f.x * TS, f.y * TS, fw * TS, fh * TS); this.app.ui.setPlaceMsg(`${sim.def(f).name}: sol tıkla kaldır/taşı (ücretsiz)`); } else this.app.ui.setPlaceMsg('Alttan bir eşya seç ya da dünyadaki bir eşyaya tıkla · Esc/B: çık'); }
    }
    // gün/gece ve hava
    const min = s.minute, indoor = this.sceneId === 'restaurant_interior'; let r = 255, gg = 255, b = 255;
    const lerp = (a, c, k) => Math.round(a + (c - a) * Math.max(0, Math.min(1, k)));
    if (min < 420) { const k = (min - 360) / 60; r = lerp(190, 255, k); gg = lerp(190, 255, k); b = lerp(225, 255, k); }
    else if (min > 1050) { const k = (min - 1050) / 150; r = lerp(255, indoor ? 150 : 95, k); gg = lerp(255, indoor ? 125 : 105, k); b = lerp(255, indoor ? 120 : 165, k); if (min < 1140) { r = lerp(255, 255, 1); gg = lerp(255, 205, (min - 1050) / 90); b = lerp(255, 170, (min - 1050) / 90); } }
    if (!indoor && ['cloudy', 'rain', 'storm', 'snow', 'blizzard'].includes(s.weather)) { r = Math.round(r * 0.88); gg = Math.round(gg * 0.9); b = Math.round(b * 0.94); }
    this.night.setFillStyle((r << 16) | (gg << 8) | b); const dark = min > 1110 || min < 380;
    this.app.audio.setMood(min < 660 ? 'morning' : min < 1020 ? 'noon' : min < 1230 ? 'evening' : 'night');
    let li = 0; if (dark) for (const v of this.views.values()) if (v.light && cam.worldView.contains(v.x, v.y)) { this.img('glow:' + li++, 'fx/glow', v.x + (v.originX === 0 ? v.width / 2 : 0), v.y + (v.originY === 0 ? 10 : -v.height + 14), 900002, 0.5, 0.5).setBlendMode(Phaser.BlendModes.ADD).setScale(2.2).setAlpha(0.75); }
    const kind = indoor ? null : ['rain', 'storm'].includes(s.weather) ? 'rain' : ['snow', 'blizzard'].includes(s.weather) ? 'snow' : null; const W = this.scale.width, H = this.scale.height; const z = cam.zoom; const heavy = s.weather === 'storm' || s.weather === 'blizzard';
    this.weatherPool.forEach((im, i) => { if (!kind || (!heavy && i > 55)) { im.setVisible(false); return; } if (!im.visible || im.kind !== kind) { im.setVisible(true).setFrame('fx/' + kind); im.kind = kind; im.x = Math.random() * W; im.y = Math.random() * H; } const sp = kind === 'rain' ? 620 : 70 + (i % 5) * 14; im.y += sp * dt; im.x += (kind === 'rain' ? -90 : Math.sin(this.time0 + i) * 24) * dt; if (im.y > H / 2 + H / (2 * z) + 10) { im.y = H / 2 - H / (2 * z) - 10; im.x = W / 2 + (Math.random() - 0.5) * (W / z + 100); } im.setAlpha(kind === 'rain' ? 0.7 : 0.9); });
  }
  // gfx her karede temizlendiği için çubuk çağrıları kuyruklanır
  redrawBars() { const q = this.barQ || []; for (const b of q) { this.gfx.fillStyle(0x2a1d1a, 1).fillRect(b[0] - 15, b[1] - 3, 30, 6); this.gfx.fillStyle(b[3], 1).fillRect(b[0] - 14, b[1] - 2, 28 * Math.max(0, Math.min(1, b[2])), 4); } this.barQ = []; }
}
// bar(): çizimi bir sonraki syncOverlay'e ertele (gfx.clear sonrası)
WorldScene.prototype.bar = function (key, x, y, pct, color) { (this.barQ ||= []).push([x, y, pct, color]); };
