import Phaser from 'phaser';
import { JSON_DATA, MANIFEST, PNG } from './assets';
import { VFX_FOR, ZONE_FOR } from './vfxMap';
import { sfx } from './audio';
import type { Match } from '../match';
import type { Unit } from '../core/unit';
import type { GameEvent } from '../core/types';
import { DT } from '../core/config';
import { CELL, GH, GW, WORLD_H, WORLD_W } from '../core/map';

export interface BattleBridge {
  match: Match;
  team: 0 | 1;
  quality: 'high' | 'low';
  damageNumbers: boolean;
  speed: number;
  paused: boolean;
  selectedSlot: number;
  camMode: 'overview' | 'close';
  camFocus: { x: number; y: number } | null;
  onEvents(evts: GameEvent[]): void;
  onHud(): void;
  onSelect(slot: number): void;
  onReady(): void;
}

interface UV {
  spr: Phaser.GameObjects.Sprite;
  key: string;
  anim: string;
  lock: number;
  over: Record<string, Phaser.GameObjects.Sprite>;
  label?: Phaser.GameObjects.Text;
  dead?: boolean;
  structure?: boolean;
  scale: number;
}

const DIR = ['down', 'up', 'left', 'right'];

export class BattleScene extends Phaser.Scene {
  b!: BattleBridge;
  private acc = 0;
  private views = new Map<number, UV>();
  private projs = new Map<number, Phaser.GameObjects.Sprite>();
  private zones = new Map<number, Phaser.GameObjects.Sprite>();
  private bars!: Phaser.GameObjects.Graphics;
  private rings!: Phaser.GameObjects.Graphics;
  private fogTex!: Phaser.Textures.CanvasTexture;
  private fogImg!: Phaser.GameObjects.Image;
  private fogData!: ImageData;
  private lastFogTick = -1;
  private ghosts = new Map<number, Phaser.GameObjects.Image>();
  private dmgPool: Phaser.GameObjects.Text[] = [];
  private hudT = 0;
  private drag: { x: number; y: number; cx: number; cy: number; moved: boolean } | null = null;
  private zoomClose = 1;

  constructor() { super('battle'); }

  init(data: { bridge: BattleBridge }) { this.b = data.bridge; }

  preload() {
    const w = this.scale.width, h = this.scale.height;
    const bar = this.add.graphics();
    this.load.once('complete', () => bar.destroy());
    this.load.on('progress', (p: number) => { bar.clear(); bar.fillStyle(0x223044); bar.fillRect(w * 0.2, h / 2 - 6, w * 0.6, 12); bar.fillStyle(0x60b0ff); bar.fillRect(w * 0.2, h / 2 - 6, w * 0.6 * p, 12); });
    for (const a of MANIFEST.atlases) this.load.atlas(a, PNG[a], JSON_DATA[a]);
    this.load.image('map', PNG.map);
  }

  create() {
    // animations
    for (const [id, c] of Object.entries(MANIFEST.champions)) this.makeAnims(c.atlas, c.anims);
    for (const [, c] of Object.entries(MANIFEST.units)) this.makeAnims(c.atlas, c.anims);
    for (const [k, v] of Object.entries(MANIFEST.vfx)) {
      this.anims.create({ key: 'vfx:' + k, frames: Array.from({ length: v.frames }, (_, i) => ({ key: 'vfx', frame: `${k}_${i}` })), frameRate: v.rate, repeat: v.loop ? -1 : 0 });
    }
    for (const t of [0, 1]) {
      this.anims.create({ key: `tower${t}:idle`, frames: [0, 1, 2, 3].map((i) => ({ key: 'structures', frame: `tower_${t}_idle_${i}` })), frameRate: 5, repeat: -1 });
      this.anims.create({ key: `tower${t}:attack`, frames: [0, 1].map((i) => ({ key: 'structures', frame: `tower_${t}_attack_${i}` })), frameRate: 10, repeat: 0 });
      this.anims.create({ key: `crystal${t}:idle`, frames: [0, 1, 2, 3, 4, 5].map((i) => ({ key: 'structures', frame: `crystal_${t}_idle_${i}` })), frameRate: 6, repeat: -1 });
    }
    this.anims.create({ key: 'brazier', frames: [0, 1, 2, 3].map((i) => ({ key: 'decor', frame: `brazier_${i}` })), frameRate: 8, repeat: -1 });

    this.add.image(0, 0, 'map').setOrigin(0).setScale(2).setDepth(-1000);
    for (const t of [0, 1]) this.add.image(t === 0 ? 80 : WORLD_W - 80, 900, 'structures', `fountain_${t}`).setScale(2).setDepth(-900);
    for (const d of MANIFEST.runtimeDecor) this.add.sprite(d.x, d.y, 'decor', 'brazier_0').setOrigin(0.5, 0.9).setScale(2).setDepth(d.y).play('brazier');

    this.rings = this.add.graphics().setDepth(-500);
    this.bars = this.add.graphics().setDepth(100000);
    // fog of war
    this.fogTex = this.textures.createCanvas('fog', GW, GH)!;
    this.fogTex.setFilter(Phaser.Textures.FilterMode.LINEAR);
    this.fogData = this.fogTex.context.createImageData(GW, GH);
    this.fogImg = this.add.image(0, 0, 'fog').setOrigin(0).setDisplaySize(WORLD_W, WORLD_H).setDepth(90000);
    this.cameras.main.setBounds(-200, -200, WORLD_W + 400, WORLD_H + 400);
    this.cameras.main.setBackgroundColor('#0b1410');

    // input: drag to pan in close mode, tap own champions to select
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => { this.drag = { x: p.x, y: p.y, cx: this.cameras.main.scrollX, cy: this.cameras.main.scrollY, moved: false }; });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.drag || !p.isDown) return;
      const dx = p.x - this.drag.x, dy = p.y - this.drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 12) this.drag.moved = true;
      if (this.drag.moved && this.b.camMode === 'close') {
        const z = this.cameras.main.zoom;
        this.cameras.main.scrollX = this.drag.cx - dx / z;
        this.cameras.main.scrollY = this.drag.cy - dy / z;
        const c = this.cameras.main.midPoint;
        this.b.camFocus = { x: c.x, y: c.y };
      }
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (this.drag && !this.drag.moved) {
        const wp = this.cameras.main.getWorldPoint(p.x, p.y);
        const w = this.b.match.world;
        let best = -1, bd = 70;
        for (const id of w.teams[this.b.team].champIds) {
          const u = w.get(id)!;
          const d = Math.hypot(u.x - wp.x, u.y - 30 - wp.y);
          if (u.alive && d < bd) { bd = d; best = u.champ!.slot; }
        }
        if (best >= 0) this.b.onSelect(best);
      }
      this.drag = null;
    });
    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => {
      if (this.b.camMode !== 'close') return;
      this.zoomClose = Phaser.Math.Clamp(this.zoomClose * (dy > 0 ? 0.9 : 1.1), 0.6, 1.8);
    });
    this.scale.on('resize', () => this.applyCamera(true));
    this.applyCamera(true);
    this.b.onReady();
  }

  private makeAnims(atlas: string, anims: Record<string, { frames: number; rate: number; repeat: number }>) {
    for (const [a, def] of Object.entries(anims)) for (const d of DIR) {
      this.anims.create({ key: `${atlas}:${a}_${d}`, frames: Array.from({ length: def.frames }, (_, i) => ({ key: atlas, frame: `${a}_${d}_${i}` })), frameRate: def.rate, repeat: def.repeat });
    }
  }

  // ------------------------------------------------------------------ camera
  private applyCamera(snap = false) {
    const cam = this.cameras.main;
    const w = this.scale.width, h = this.scale.height;
    const w0 = this.b.match.world;
    if (this.b.camMode === 'overview') {
      const z = Math.min(w / WORLD_W, h / WORLD_H) * 0.98;
      cam.setZoom(z);
      cam.centerOn(WORLD_W / 2, WORLD_H / 2 + (h < 500 ? 40 : 0));
      return;
    }
    const z = (h / 820) * this.zoomClose;
    cam.setZoom(z);
    let tx: number, ty: number;
    if (this.b.camFocus) { tx = this.b.camFocus.x; ty = this.b.camFocus.y; }
    else {
      const u = w0.get(w0.teams[this.b.team].champIds[this.b.selectedSlot]);
      if (!u) return;
      tx = u.x; ty = u.y - 30;
    }
    const c = cam.midPoint;
    if (snap) cam.centerOn(tx, ty);
    else cam.centerOn(c.x + (tx - c.x) * 0.12, c.y + (ty - c.y) * 0.12);
  }

  // ------------------------------------------------------------------ main loop
  update(_t: number, delta: number) {
    const m = this.b.match, w = m.world;
    if (!this.b.paused && !w.over) {
      this.acc += Math.min(0.25, delta / 1000) * this.b.speed;
      let n = 0;
      while (this.acc >= DT && n < 8) {
        m.step();
        const ev = w.drainEvents();
        this.handleEvents(ev);
        this.b.onEvents(ev);
        this.acc -= DT;
        n++;
        if (w.over) break;
      }
    } else if (w.over) {
      const ev = w.drainEvents();
      if (ev.length) { this.handleEvents(ev); this.b.onEvents(ev); }
    }
    const alpha = Math.min(1, this.acc / DT);
    this.syncUnits(alpha);
    this.syncProjectiles(alpha);
    this.syncZones();
    if (w.tick !== this.lastFogTick && w.tick % 2 === 0) this.updateFog();
    this.drawBars(alpha);
    this.applyCamera(false);
    this.hudT += delta;
    if (this.hudT > 120) { this.hudT = 0; this.b.onHud(); }
  }

  // ------------------------------------------------------------------ units
  private visKey(u: Unit): { key: string; scale: number } {
    switch (u.kind) {
      case 'champion': return { key: `champ_${u.sub}`, scale: 1.7 };
      case 'minion': return { key: `unit_minion_${u.sub}_${u.team}`, scale: u.sub === 'siege' ? 1.5 : 1.25 };
      case 'monster': return { key: `unit_${u.sub}`, scale: u.sub === 'golem' ? 2.0 : u.sub === 'alphawolf' ? 1.9 : u.sub === 'wisp' ? 1.2 : 1.6 };
      case 'boss': return { key: `unit_boss_${u.sub}`, scale: 1.45 };
      case 'summon': return { key: `unit_${u.sub}`, scale: u.sub === 'bonegiant' ? 2.3 : u.sub === 'beast' ? 2.0 : u.sub === 'skeleton' ? 1.3 : 1.5 };
      default: return { key: 'structures', scale: 1.7 };
    }
  }

  private ensureView(u: Unit): UV {
    let v = this.views.get(u.id);
    if (v) return v;
    const { key, scale } = this.visKey(u);
    let spr: Phaser.GameObjects.Sprite;
    if (u.kind === 'tower') { spr = this.add.sprite(u.x, u.y, 'structures', `tower_${u.team}_idle_0`).setOrigin(0.5, 0.92).play(`tower${u.team}:idle`); }
    else if (u.kind === 'crystal') { spr = this.add.sprite(u.x, u.y, 'structures', `crystal_${u.team}_idle_0`).setOrigin(0.5, 0.9).play(`crystal${u.team}:idle`); }
    else {
      const size = (u.kind === 'boss' ? 96 : 48);
      spr = this.add.sprite(u.x, u.y, key, `idle_${u.facing}_0`).setOrigin(0.5, (size === 96 ? 86 : 43) / size);
    }
    spr.setScale(scale);
    v = { spr, key, anim: '', lock: 0, over: {}, structure: u.isStructure, scale };
    if (u.kind === 'champion') {
      v.label = this.add.text(u.x, u.y, '', { fontFamily: 'monospace', fontSize: '15px', color: '#ffffff', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5, 1).setDepth(100001);
    }
    this.views.set(u.id, v);
    return v;
  }

  private play(u: Unit, v: UV, anim: string, force = false) {
    if (v.structure) return;
    const k = `${v.key}:${anim}_${u.facing}`;
    if (!force && v.anim === k) return;
    if (!this.anims.exists(k)) return;
    v.anim = k;
    v.spr.play(k);
  }

  private syncUnits(alpha: number) {
    const w = this.b.match.world;
    const now = this.time.now;
    const seen = new Set<number>();
    const team = this.b.team;
    for (const u of w.units) {
      seen.add(u.id);
      const v = this.ensureView(u);
      const vis = u.team === team || u.isStructure || (u.alive && w.isVisibleTo(u, team)) || (!u.alive && u.kind !== 'champion' && w.vision.cellVisible(team, u.x, u.y));
      let x = u.px + (u.x - u.px) * alpha, y = u.py + (u.y - u.py) * alpha;
      if (u.knockupUntil > w.time) y -= 26;
      v.spr.setPosition(x, y).setDepth(y);
      if (u.kind === 'champion' && !u.alive && w.time - u.deathTime > 1.2) v.spr.setVisible(false);
      else v.spr.setVisible(vis);
      // stealth
      const stealth = u.stealthUntil > w.time;
      v.spr.setAlpha(stealth ? 0.35 : u.untargetableUntil > w.time ? 0.6 : 1);
      if (u.isStructure) {
        if (!u.alive && !v.dead) {
          v.dead = true;
          v.spr.stop();
          v.spr.setFrame(u.kind === 'tower' ? `tower_${u.team}_ruin_0` : `crystal_${u.team}_ruin_0`);
        }
        continue;
      }
      if (!u.alive) {
        if (!v.dead) { v.dead = true; this.play(u, v, 'death', true); this.clearOver(v); }
        continue;
      }
      if (v.dead) { v.dead = false; v.anim = ''; }
      let anim = 'idle';
      if (now < v.lock) anim = v.anim.split(':')[1]?.split('_')[0] ?? 'idle';
      else if (u.champ && u.champ.recallUntil > 0) anim = 'recall';
      else if (u.moving || Math.abs(u.x - u.px) + Math.abs(u.y - u.py) > 0.3) anim = 'walk';
      if (now >= v.lock || !v.anim.includes(`_${u.facing}`)) this.play(u, v, anim);
      // slow tint
      if (u.isSlowed(w.time)) v.spr.setTint(0xa0c8ff); else if (u.grievous.some((g) => g.until > w.time)) v.spr.setTint(0xc8a0a0); else v.spr.clearTint();
      // overlays
      const showOver = vis && this.b.quality === 'high' || (vis && u.kind === 'champion');
      this.overlay(v, 'stun', showOver && u.stunUntil > w.time, x, y - 70 * (v.scale / 1.7), 1.6);
      this.overlay(v, 'frostRoot', showOver && u.rootUntil > w.time, x, y, 1.6);
      this.overlay(v, 'shieldBubble', showOver && u.shields.length > 0, x, y - 30, 1.4);
      this.overlay(v, 'recallRing', vis && !!u.champ && u.champ.recallUntil > 0, x, y - 40, 2);
      if (v.label) {
        v.label.setVisible(vis && u.alive && this.cameras.main.zoom > 0.45);
        v.label.setPosition(x, y - 86).setText(`${u.champ!.level}`);
      }
    }
    for (const [id, v] of this.views) if (!seen.has(id)) { v.spr.destroy(); v.label?.destroy(); this.clearOver(v); this.views.delete(id); }
    // last-seen ghosts for hidden enemy champions
    const T = w.teams[team];
    for (const e of w.champions((1 - team) as 0 | 1)) {
      const ls = T.lastSeen.get(e.id);
      let g = this.ghosts.get(e.id);
      const show = !!ls && e.alive && !w.isVisibleTo(e, team) && w.time - ls.t < 8;
      if (show && !g) { g = this.add.image(0, 0, 'portraits', e.sub).setScale(0.55).setDepth(95000); this.ghosts.set(e.id, g); }
      if (g) {
        g.setVisible(show);
        if (show) { g.setPosition(ls!.x, ls!.y - 30); g.setAlpha(0.85 * (1 - (w.time - ls!.t) / 8)); g.setTint(0xff9090); }
      }
    }
  }

  private overlay(v: UV, key: string, on: boolean, x: number, y: number, scale: number) {
    let s = v.over[key];
    if (!on) { if (s) s.setVisible(false); return; }
    if (!s) { s = this.add.sprite(x, y, 'vfx', `${key}_0`).setScale(scale).play('vfx:' + key); if (!MANIFEST.vfx[key].loop) s.anims.repeat = -1; v.over[key] = s; }
    s.setVisible(true).setPosition(x, y).setDepth(y + 5);
  }
  private clearOver(v: UV) { for (const s of Object.values(v.over)) s.destroy(); v.over = {}; }

  // ------------------------------------------------------------------ projectiles & zones
  private syncProjectiles(alpha: number) {
    const w = this.b.match.world;
    const live = new Map(w.projectiles.filter((p) => !p.dead).map((p) => [p.id, p]));
    for (const [id, s] of this.projs) {
      const p = live.get(id);
      if (!p) { s.destroy(); this.projs.delete(id); continue; }
      const px = s.getData('lx') ?? p.x, py = s.getData('ly') ?? p.y;
      const nx = px + (p.x - px) * Math.max(alpha, 0.5), ny = py + (p.y - py) * Math.max(alpha, 0.5);
      if (Math.hypot(nx - s.x, ny - s.y) > 0.5) s.setRotation(Math.atan2(ny - s.y, nx - s.x));
      s.setPosition(nx, ny).setDepth(ny + 40);
      s.setData('lx', p.x); s.setData('ly', p.y);
      s.setVisible(w.vision.cellVisible(this.b.team, p.x, p.y));
    }
  }
  private syncZones() {
    const w = this.b.match.world;
    const live = new Map(w.zones.filter((z) => !z.dead).map((z) => [z.id, z]));
    for (const [id, s] of this.zones) {
      const z = live.get(id);
      if (!z) { s.destroy(); this.zones.delete(id); continue; }
      s.setPosition(z.x, z.y).setVisible(z.team === this.b.team || w.vision.cellVisible(this.b.team, z.x, z.y));
    }
  }

  // ------------------------------------------------------------------ events → visuals
  private handleEvents(evts: GameEvent[]) {
    const w = this.b.match.world;
    const team = this.b.team;
    const low = this.b.quality === 'low';
    const zoomedOut = this.cameras.main.zoom < 0.55;
    for (const e of evts) {
      switch (e.t) {
        case 'attack': {
          const u = w.get(e.id!); const v = u && this.views.get(u.id);
          if (u && v && !v.structure) { this.play(u, v, 'attack', true); v.lock = this.time.now + Math.max(260, (e.dur ?? 0.2) * 1000 + 180); }
          if (u && v?.structure) { if (u.kind === 'tower') v.spr.play(`tower${u.team}:attack`).once('animationcomplete', () => v.spr.play(`tower${u.team}:idle`)); if (this.near(u.x, u.y)) sfx('tower', 200); }
          break;
        }
        case 'cast': {
          const u = w.get(e.id!); const v = u && this.views.get(u.id);
          if (u && v) {
            const anim = u.kind === 'champion' ? e.k! : 's1';
            this.play(u, v, anim, true);
            v.lock = this.time.now + ((e.dur ?? 0.3) * 1000 + 320);
            if (this.near(u.x, u.y) && w.isVisibleTo(u, team)) sfx(e.k === 'ult' ? 'ult' : 'cast', 90);
          }
          break;
        }
        case 'proj': {
          if (low && zoomedOut && (e.k?.startsWith('minion') ?? false)) break;
          const key = 'p_' + e.k;
          if (!MANIFEST.vfx[key]) break;
          const s = this.add.sprite(e.x!, e.y!, 'vfx', `${key}_0`).setScale(1.6);
          if (MANIFEST.vfx[key].frames > 1) s.play('vfx:' + key);
          s.setRotation(Math.atan2((e.y2 ?? e.y!) - e.y!, (e.x2 ?? e.x!) - e.x!));
          this.projs.set(e.id!, s);
          if (e.k !== 'minionBoltBlue' && e.k !== 'minionBoltRed' && this.near(e.x!, e.y!)) sfx('shot', 80);
          break;
        }
        case 'projHit': {
          if (low || zoomedOut) break;
          if (e.k && (e.k.startsWith('tower') || e.k === 'arrow' || e.k === 'bolt' || e.k === 'shot' || e.k === 'cannon')) this.fx('hitSpark', e.x!, e.y! - 20, 1.6);
          break;
        }
        case 'dmg': {
          const t = w.get(e.id!);
          if (!t || !(t.team === team || w.isVisibleTo(t, team) || t.isStructure)) break;
          const v = this.views.get(t.id);
          if (v && !v.structure && this.time.now >= v.lock && !t.moving && t.alive && t.kind !== 'boss') { this.play(t, v, 'hit', true); v.lock = this.time.now + 160; }
          else if (v && t.alive) { v.spr.setTintFill(0xffffff); this.time.delayedCall(60, () => v.spr.active && v.spr.clearTint()); }
          if (e.k === 'atk' && !low && !zoomedOut) this.fx('hitSpark', t.x + (Math.random() - 0.5) * 10, t.y - 30, 1.3);
          const src = w.get(e.tgt!);
          if (this.b.damageNumbers && !zoomedOut && (t.kind === 'champion' || src?.kind === 'champion' || t.kind === 'boss') && (e.v ?? 0) >= 5) this.dmgText(t.x, t.y - 70, `${e.v}`, e.k === 'magic' ? '#c8a0ff' : e.k === 'true' ? '#ffffff' : t.team === team && t.kind === 'champion' ? '#ff6060' : '#ffe080');
          if (this.near(t.x, t.y) && t.kind === 'champion') sfx('hit', 70);
          break;
        }
        case 'heal': { const t = w.get(e.id!); if (t && !low && (t.team === team || w.isVisibleTo(t, team))) { this.fx('heal', t.x, t.y - 40, 1.6); if (this.b.damageNumbers && (e.v ?? 0) > 30 && !zoomedOut) this.dmgText(t.x, t.y - 80, `+${e.v}`, '#70ff80'); } break; }
        case 'vfx': {
          const m = VFX_FOR[e.k!];
          if (!m) break;
          if (low && zoomedOut && !['bigExplosion', 'bloodNova', 'titanSlam', 'quake'].includes(m.key)) break;
          if (!w.vision.cellVisible(team, e.x!, e.y!)) break;
          const sz = MANIFEST.vfx[m.key]?.size ?? 48;
          const scale = e.r ? (e.r * 2) / sz : (m.base ?? 1) * 1.8;
          const s = this.fx(m.key, e.x!, e.y! - (e.r ? 0 : 30), scale * (e.r ? m.base ?? 1 : 1), m.tint, e.r ? -400 + e.y! : undefined);
          if (s && e.dur && MANIFEST.vfx[m.key].loop) { this.time.delayedCall(e.dur * 1000, () => s.destroy()); }
          if (['explosion', 'bigExplosion', 'fireExplosion', 'quake', 'titanSlam', 'bloodNova', 'iceBurst'].includes(m.key) && this.near(e.x!, e.y!)) sfx('boom', 120);
          if (s && e.id && m.key === 'shieldBubble') { const u = w.get(e.id); if (u) this.follow(s, u, -30, e.dur ?? 2); }
          break;
        }
        case 'zone': {
          const m = ZONE_FOR[e.k!];
          if (!m) break;
          const sz = MANIFEST.vfx[m.key]?.size ?? 64;
          const s = this.add.sprite(e.x!, e.y!, 'vfx', `${m.key}_0`).setDepth(m.key === 'p_bomb' ? e.y! + 50 : -400 + e.y!);
          if (MANIFEST.vfx[m.key].frames > 1) s.play('vfx:' + m.key);
          s.setScale(m.key === 'p_bomb' ? 1.6 : (e.r! * 2) / sz, m.key === 'p_bomb' ? 1.6 : (e.r! * 2 * 0.6) / (sz * 0.55));
          if (m.tint) s.setTint(m.tint);
          s.setAlpha(0.85);
          this.zones.set(e.id!, s);
          break;
        }
        case 'zoneEnd': { const s = this.zones.get(e.id!); if (s) { s.destroy(); this.zones.delete(e.id!); } break; }
        case 'death': {
          const u = w.get(e.id!);
          if (!u) break;
          const vis = u.team === team || w.vision.cellVisible(team, u.x, u.y);
          if (u.kind === 'tower' && vis) { this.fx('towerRubble', u.x, u.y - 40, 3); sfx('boom'); this.cameras.main.shake(250, 0.006); }
          else if (u.kind === 'crystal') { this.fx('crystalShatter', u.x, u.y - 60, 3); sfx('boom'); this.cameras.main.shake(600, 0.012); }
          else if (vis && !low) this.fx('deathPuff', u.x, u.y - 20, u.kind === 'boss' ? 3 : 1.5);
          if (u.kind === 'champion' && vis) sfx('death');
          break;
        }
        case 'levelUp': { const u = w.get(e.id!); if (u && u.team === team) { this.fx('levelUp', u.x, u.y - 40, 2); if (this.near(u.x, u.y)) sfx('level', 200); } break; }
        case 'gold': { const u = w.get(e.id!); if (u && u.team === team && !zoomedOut && this.b.damageNumbers) this.dmgText(e.x!, e.y! - 50, `+${e.v}`, '#ffd040', 14); break; }
        case 'recall': { const u = w.get(e.id!); if (u && e.k === 'done' && u.team === team) this.fx('levelUp', u.x, u.y - 40, 2, 0x60b0ff); break; }
        case 'dash': { if (!low && w.vision.cellVisible(team, e.x!, e.y!)) this.fx('shadowPuff', e.x!, e.y! - 20, 1.1, 0xc0c0ff); break; }
        case 'respawn': { const u = w.get(e.id!); const v = u && this.views.get(u.id); if (v) { v.dead = false; v.anim = ''; } break; }
      }
    }
  }

  private near(x: number, y: number) {
    const c = this.cameras.main;
    return c.worldView.contains(x, y);
  }

  private fx(key: string, x: number, y: number, scale: number, tint?: number, depth?: number) {
    if (!MANIFEST.vfx[key]) return null;
    const s = this.add.sprite(x, y, 'vfx', `${key}_0`).setScale(scale).setDepth(depth ?? y + 60);
    if (tint) s.setTint(tint);
    s.play('vfx:' + key);
    if (!MANIFEST.vfx[key].loop) s.once('animationcomplete', () => s.destroy());
    else if (key !== 'shieldBubble') this.time.delayedCall(1500, () => s.destroy());
    return s;
  }
  private follow(s: Phaser.GameObjects.Sprite, u: Unit, oy: number, dur: number) {
    const ev = this.time.addEvent({ delay: 30, loop: true, callback: () => { if (!s.active) { ev.remove(); return; } s.setPosition(u.x, u.y + oy).setDepth(u.y + 5); } });
    this.time.delayedCall(dur * 1000, () => { ev.remove(); s.destroy(); });
  }

  private dmgText(x: number, y: number, txt: string, color: string, size = 18) {
    let t = this.dmgPool.find((d) => !d.active);
    if (!t) { t = this.add.text(0, 0, '', { fontFamily: 'monospace', fontStyle: 'bold', fontSize: '18px', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5); this.dmgPool.push(t); }
    if (this.dmgPool.filter((d) => d.active).length > 40) return;
    t.setActive(true).setVisible(true).setText(txt).setColor(color).setFontSize(size).setPosition(x + (Math.random() - 0.5) * 20, y).setAlpha(1).setDepth(100002);
    this.tweens.add({ targets: t, y: y - 40, alpha: 0, duration: 750, onComplete: () => t!.setActive(false).setVisible(false) });
  }

  // ------------------------------------------------------------------ fog & bars
  private updateFog() {
    const w = this.b.match.world;
    this.lastFogTick = w.tick;
    const g = w.vision.grids[this.b.team];
    const d = this.fogData.data;
    for (let i = 0; i < GW * GH; i++) {
      d[i * 4] = 8; d[i * 4 + 1] = 12; d[i * 4 + 2] = 24;
      d[i * 4 + 3] = g[i] ? 0 : 150;
    }
    this.fogTex.context.putImageData(this.fogData, 0, 0);
    this.fogTex.refresh();
    void CELL;
  }

  private drawBars(alpha: number) {
    const w = this.b.match.world;
    const team = this.b.team;
    const g = this.bars;
    g.clear();
    this.rings.clear();
    const z = this.cameras.main.zoom;
    const big = z < 0.55 ? 1.8 : 1;
    for (const u of w.units) {
      if (!u.alive) continue;
      const vis = u.team === team || u.isStructure || w.isVisibleTo(u, team);
      if (!vis) continue;
      const x = u.px + (u.x - u.px) * alpha, y = u.py + (u.y - u.py) * alpha;
      const col = u.team === team ? 0x3ab0ff : u.team === 2 ? 0xf0c040 : 0xff4a4a;
      let bw = 30, oy = 46;
      switch (u.kind) {
        case 'champion': bw = 60; oy = 84; break;
        case 'minion': bw = 30; oy = u.sub === 'siege' ? 66 : 54; break;
        case 'monster': bw = 44; oy = 64; break;
        case 'boss': bw = 110; oy = 136; break;
        case 'summon': bw = 34; oy = u.sub === 'bonegiant' ? 100 : 56; break;
        case 'tower': bw = 80; oy = 150; break;
        case 'crystal': bw = 100; oy = 156; break;
      }
      if (u.kind === 'minion' && z < 0.55 && this.b.quality === 'low') continue;
      bw *= u.kind === 'champion' || u.isStructure ? big : 1;
      const bh = (u.kind === 'champion' ? 8 : u.isStructure || u.kind === 'boss' ? 9 : 5) * (u.kind === 'champion' || u.isStructure ? big : 1);
      const bx = x - bw / 2, by = y - oy;
      g.fillStyle(0x000000, 0.75).fillRect(bx - 1, by - 1, bw + 2, bh + 2);
      const pct = u.hp / u.stats.maxHp;
      g.fillStyle(col, 1).fillRect(bx, by, bw * pct, bh);
      const sh = u.shieldTotal;
      if (sh > 0) g.fillStyle(0xffffff, 0.85).fillRect(bx + bw * pct, by, Math.min(bw * (1 - pct), (bw * sh) / u.stats.maxHp), bh);
      if (u.kind === 'champion' && bw >= 60) for (let k = 1; k < u.stats.maxHp / 250; k++) g.fillStyle(0x000000, 0.5).fillRect(bx + (bw * k * 250) / u.stats.maxHp, by, 1, bh);
      if (u.isStructure && !this.b.match.world.units.length) continue;
      if (u.kind === 'champion') {
        this.rings.lineStyle(3, col, 0.9).strokeEllipse(x, y, 44, 18);
        if (u.team === team && u.champ!.slot === this.b.selectedSlot) this.rings.lineStyle(2, 0xffffff, 0.9).strokeEllipse(x, y, 54, 24);
        if (u.champ!.recallUntil > 0) {
          const p = 1 - (u.champ!.recallUntil - w.time) / 3;
          g.fillStyle(0x60b0ff, 1).fillRect(bx, by + bh + 2, bw * p, 3);
        }
      }
    }
  }
}
