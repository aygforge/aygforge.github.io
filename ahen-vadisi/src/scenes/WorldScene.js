// WorldManager: tilemap katmanları, varlıklar, kamera, dokunma girdisi, harita geçişleri,
// dungeon kapıları/bölümleri, ölüm-yeniden doğma, keşif ve aktif oyun süresi.
import Phaser from 'phaser';
import { app } from '../core/app.js';
import { bus } from '../core/events.js';
import { MAPS } from '../data/maps/index.js';
import { TILE } from '../data/constants.js';
import { SKILLS } from '../data/skills.js';
import { ENEMIES } from '../data/enemies.js';
import { buildMap } from '../world/mapBuilder.js';
import { Grid } from '../world/grid.js';
import { FX } from '../world/fx.js';
import { Fog } from '../world/fog.js';
import { InputController } from '../world/input.js';
import { CombatRuntime } from '../world/combatRuntime.js';
import { Spawner } from '../world/spawner.js';
import { Player } from '../entities/Player.js';
import { NpcObj, WaystoneObj, GatherObj, QuestObj, AltarObj, DungeonGateObj, PortalObj, FxObj, CheckpointObj, ChestObj, SealObj } from '../entities/Interactables.js';
import { onReach, onDungeonStage } from '../systems/quests.js';
import { guideTarget, nextGateway } from '../world/questGuide.js';
import { clearStage, respawnEntry, startOrResumeRun, exitRun, getRun, breakSeal, sealsBroken, DUNGEON_INFO } from '../systems/dungeon.js';
import { applyDeathDurability } from '../systems/economy.js';
import { MINIMAP_COLORS, MASS_COLORS } from '../art/tiles.js';
import { sound } from '../audio/sound.js';

const builtCache = {};
export function getBuilt(id) {
  return builtCache[id] || (builtCache[id] = buildMap(MAPS[id]));
}

const ZOOM_TILES = { yakin: 10, normal: 12.5, uzak: 15.5 };

export class WorldScene extends Phaser.Scene {
  constructor() { super('world'); }

  init(data) {
    this.mapId = data.mapId;
    this.entryName = data.entry || null;
  }

  create() {
    app.world = this;
    const ch = app.char;
    const def = MAPS[this.mapId];
    this.mapDef = def;
    this.built = getBuilt(this.mapId);
    this.grid = new Grid(this.built);
    this.fx = new FX(this);
    this.combat = new CombatRuntime(this);
    this.inputCtl = new InputController(this);
    this.enemies = []; this.objects = []; this.projectiles = []; this.lights = [];
    this.pathBudget = 4;
    this.clock = 0; // oyun saati (ms): duraklatmada durur, geliştirici hızlandırmasına uyar
    this.darkness = null; this.vignette = null; this.playerLight = null; this.mists = null; this.fireflies = null;
    this.gates = null; this.changing = false;
    this.lowPerf = !!app.settings.lowPerf;
    this.reachT = 0; this.fogT = 0; this.markT = 0;

    this.buildTilemap();

    // oyuncu konumu
    let pos;
    if (this.entryName && def.entries[this.entryName]) {
      const e = def.entries[this.entryName];
      pos = { x: e.x * TILE + TILE / 2, y: e.y * TILE + TILE / 2 };
    } else {
      pos = { x: ch.world.x * TILE + TILE / 2, y: ch.world.y * TILE + TILE / 2 };
      if (this.grid.blockedAt(pos.x, pos.y)) { const e = def.entries.respawn || Object.values(def.entries)[0]; pos = { x: e.x * TILE + TILE / 2, y: e.y * TILE + TILE / 2 }; }
    }
    this.player = new Player(this, pos.x, pos.y);
    ch.world.map = this.mapId;

    // nesneler
    for (const o of def.objects || []) {
      let obj = null;
      switch (o.type) {
        case 'npc': obj = new NpcObj(this, o); break;
        case 'waystone': obj = new WaystoneObj(this, o); break;
        case 'gather': obj = new GatherObj(this, o); break;
        case 'qobj': obj = new QuestObj(this, o); break;
        case 'altar': obj = new AltarObj(this, o); break;
        case 'dungeon_gate': obj = new DungeonGateObj(this, o); break;
        case 'portal': obj = new PortalObj(this, o); break;
        case 'checkpoint': obj = new CheckpointObj(this, o); break;
        case 'chest': obj = new ChestObj(this, o); break;
        case 'seal': obj = new SealObj(this, o); break;
        case 'fx': new FxObj(this, o); break;
        default: break;
      }
      if (obj) this.objects.push(obj);
    }

    if (def.dungeon) this.setupGates();
    this.spawner = new Spawner(this);
    this.spawner.init();

    // keşif
    this.fog = new Fog(this.mapId, def.w, def.h, ch.world.discovered[this.mapId]);
    if (def.safe) { this.fog.cells.fill(1); this.fog.dirty = true; } // başlangıç köyü tamamen bilinir
    this.fog.reveal(this.player.x, this.player.y);
    this.buildMinimapImage();

    // kamera
    const cam = this.cameras.main;
    cam.setBounds(0, 0, def.w * TILE, def.h * TILE);
    cam.startFollow(this.player.container, true, 0.18, 0.18);
    cam.setRoundPixels(true);
    this.applyZoom();
    cam.fadeIn(300, 0, 0, 0);
    this.scale.on('resize', this.onResize, this);

    this.setupAtmosphere();
    this.setupTapInput();
    this.setupGuide();

    this.autoAttack = app.settings.autoAttack !== false;
    sound.setTheme(def.theme === 'village' ? 'village' : def.theme);

    this.offs = [
      bus.on('changed', (what) => this.onChanged(what)),
      bus.on('modal', (open) => this.setModal(open)),
      bus.on('settings', (s) => { this.applyZoom(); this.applyPerf(s); }),
      bus.on('heroLook', () => this.player?.refreshLook()),
    ];
    this.events.once('shutdown', () => { this.offs.forEach((f) => f()); this.scale.off('resize', this.onResize, this); });
    this.applyPerf(app.settings);
    this.refreshMarks();
    bus.emit('worldReady', this);
    bus.emit('mapEnter', def);
    app.requestSave('mapEnter', true);
  }

  // ------------------------------------------------------------- tilemap
  buildTilemap() {
    const b = this.built;
    const map = this.make.tilemap({ tileWidth: TILE, tileHeight: TILE, width: b.w, height: b.h });
    const ts = map.addTilesetImage('tiles', 'tiles', TILE, TILE, 0, 0);
    const to2d = (arr) => {
      const out = [];
      for (let y = 0; y < b.h; y++) out.push(Array.from(arr.subarray(y * b.w, (y + 1) * b.w)));
      return out;
    };
    const mk = (name, arr, depth) => {
      const l = map.createBlankLayer(name, ts, 0, 0);
      l.putTilesAt(to2d(arr), 0, 0);
      l.setDepth(depth);
      l.setCullPadding(2, 2);
      return l;
    };
    this.layers = {
      ground: mk('ground', b.ground, 0),
      decor: mk('decor', b.decor, 1),
      lower: mk('lower', b.lower, 2),
      upper: mk('upper', b.upper, 50000),
    };
    this.tilemap = map;
  }

  // ------------------------------------------------------------- atmosfer: karanlık, ışık, sis, ateş böcekleri
  setupAtmosphere() {
    const def = this.mapDef;
    const cam = this.cameras.main;
    if (def.dark) {
      this.darkness = this.add.rectangle(0, 0, 10, 10, 0x05030c, def.dark * 0.55).setOrigin(0).setScrollFactor(0).setDepth(54000);
      this.vignette = this.add.image(0, 0, 'vignette').setOrigin(0).setScrollFactor(0).setDepth(54001).setAlpha(Math.min(1, def.dark + 0.35));
      this.playerLight = this.add.image(0, 0, 'light').setScale(3.2).setAlpha(0.28).setBlendMode(Phaser.BlendModes.ADD).setDepth(55001);
      // kristal parıltıları
      const b = this.built;
      let n = 0;
      for (const st of b.stamps) {
        if (st.name === 'crystal_big' && n++ < 60) {
          const l = this.add.image(st.x * TILE + 16, st.y * TILE + 20, 'light_blue').setScale(1.1).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD).setDepth(55000);
          this.tweens.add({ targets: l, alpha: 0.2, yoyo: true, repeat: -1, duration: 1200 + Math.random() * 800 });
        }
      }
    } else {
      this.vignette = this.add.image(0, 0, 'vignette_soft').setOrigin(0).setScrollFactor(0).setDepth(54001).setAlpha(0.7);
    }
    if (def.mist && !this.lowPerf) {
      this.mists = [];
      for (let i = 0; i < 7; i++) {
        const m = this.add.image(Math.random() * def.w * TILE, Math.random() * def.h * TILE, 'fx_mist').setScale(5 + Math.random() * 3).setAlpha(0.5).setDepth(53000);
        m.vx = 6 + Math.random() * 8;
        this.mists.push(m);
      }
    }
    if (def.theme === 'forest' && !this.lowPerf) {
      this.fireflies = [];
      for (let i = 0; i < 18; i++) {
        const f = this.add.sprite(0, 0, 'fx_firefly', 0).setDepth(52000).setBlendMode(Phaser.BlendModes.ADD);
        f.play('fx_firefly_a'); f.ph = Math.random() * 10; f.base = { x: 0, y: 0 };
        this.fireflies.push(f);
      }
    }
    this.layoutOverlays();
    void cam;
  }

  layoutOverlays() {
    const w = this.scale.width, h = this.scale.height;
    if (this.darkness) this.darkness.setSize(w, h);
    if (this.vignette) this.vignette.setDisplaySize(w, h);
  }

  applyZoom() {
    const tiles = ZOOM_TILES[app.settings.zoom] || ZOOM_TILES.normal;
    const z = Phaser.Math.Clamp(this.scale.height / (tiles * TILE), 0.75, 4);
    this.cameras.main.setZoom(z);
    this.layoutOverlays();
  }

  applyPerf(s) {
    const lp = !!s.lowPerf;
    this.lowPerf = lp;
    const loop = this.game.loop;
    const limit = lp ? 30 : 0;
    if (loop.fpsLimit !== limit) {
      loop.fpsLimit = limit; loop.hasFpsLimit = limit > 0; loop._limitRate = limit ? 1000 / limit : 0;
      loop.sleep(); loop.wake();
    }
  }

  onResize() { this.applyZoom(); }

  // ------------------------------------------------------------- görev yön okları
  // Takip edilen görevin hedefine (veya oraya götüren geçide) giden gerçek yürüme yolu
  // üzerinde, oyuncunun önünde zemine çizilen oklar.
  setupGuide() {
    if (!this.textures.exists('guide_arrow')) {
      const g = this.make.graphics({ add: false });
      const chev = (o) => [{ x: 1 + o, y: 1 }, { x: 9 + o, y: 1 }, { x: 17 + o, y: 9 }, { x: 9 + o, y: 17 }, { x: 1 + o, y: 17 }, { x: 9 + o, y: 9 }];
      g.fillStyle(0x1a0e04, 0.85); g.fillPoints(chev(1).map((p) => ({ x: p.x, y: p.y + 1 })), true);
      g.fillStyle(0xffd24a, 1); g.fillPoints(chev(0), true);
      g.fillStyle(0xfff0b0, 1); g.fillPoints([{ x: 3, y: 2 }, { x: 8, y: 2 }, { x: 14, y: 8 }, { x: 9, y: 8 }], true);
      g.generateTexture('guide_arrow', 20, 20);
      g.destroy();
    }
    this.guideArrows = Array.from({ length: 7 }, () => this.add.image(0, 0, 'guide_arrow').setDepth(3).setScale(1.35).setVisible(false));
    this.guideT = 0; this.guidePath = null; this.guideGoal = null;
  }

  updateGuide(dt) {
    const p = this.player, arrows = this.guideArrows;
    this.guideT -= dt;
    if (this.guideT <= 0) {
      this.guideT = 0.5;
      this.guideGoal = null;
      const tgt = app.settings.questGuide !== false && !p.dead ? guideTarget(app.char) : null;
      if (tgt) {
        let gx, gy, r = tgt.r;
        if (tgt.map === this.mapId) { gx = tgt.x; gy = tgt.y; } else {
          const gw = nextGateway(this.mapId, tgt.map);
          if (gw) { gx = Phaser.Math.Clamp(gw.x, 1, this.mapDef.w - 2); gy = Phaser.Math.Clamp(gw.y, 1, this.mapDef.h - 2); r = 1; }
        }
        if (gx !== undefined && Math.hypot(p.x / TILE - gx - 0.5, p.y / TILE - gy - 0.5) > r) {
          this.guideGoal = { x: gx * TILE + TILE / 2, y: gy * TILE + TILE / 2 };
          this.guidePath = this.grid.findPath(p.x, p.y, this.guideGoal.x, this.guideGoal.y, 30000);
        }
      }
      if (!this.guideGoal) this.guidePath = null;
    }
    if (!this.guideGoal) { for (const a of arrows) a.setVisible(false); return; }
    // yol: oyuncudan başlayan çoklu çizgi (yol bulunamadıysa düz çizgi)
    const pts = [{ x: p.x, y: p.y }];
    const path = this.guidePath;
    if (path && path.length) {
      let i0 = 0, bd = Infinity;
      for (let i = 0; i < Math.min(path.length, 14); i++) { const d = Math.hypot(path[i].x - p.x, path[i].y - p.y); if (d < bd) { bd = d; i0 = i; } }
      for (let i = i0 + 1; i < path.length && pts.length < 16; i++) pts.push(path[i]);
      if (i0 === path.length - 1) pts.push(path[i0]);
    } else pts.push(this.guideGoal);
    const pulse = this.clock / 220;
    let seg = 0, segStart = 0;
    for (let k = 0; k < arrows.length; k++) {
      const want = (1.3 + k * 1.3) * TILE;
      while (seg < pts.length - 1 && segStart + Math.hypot(pts[seg + 1].x - pts[seg].x, pts[seg + 1].y - pts[seg].y) < want) {
        segStart += Math.hypot(pts[seg + 1].x - pts[seg].x, pts[seg + 1].y - pts[seg].y); seg++;
      }
      const a = arrows[k];
      if (seg >= pts.length - 1) { a.setVisible(false); continue; }
      const A = pts[seg], B = pts[seg + 1], L = Math.hypot(B.x - A.x, B.y - A.y) || 1, t = (want - segStart) / L;
      a.setPosition(A.x + (B.x - A.x) * t, A.y + (B.y - A.y) * t + 6).setRotation(Math.atan2(B.y - A.y, B.x - A.x));
      a.setAlpha((1 - k * 0.07) * (0.75 + 0.25 * Math.sin(pulse - k * 0.9))).setVisible(true);
    }
  }

  // ------------------------------------------------------------- dokunma ile hedef seçimi
  setupTapInput() {
    // DOM düzeyinde dinlenir: ilk dokunuş dahil her dokunuş güvenilir şekilde işlenir
    const canvas = this.game.canvas;
    const onDown = (e) => {
      if (!this.player || this.player.dead || this.scene.isPaused()) return;
      sound.init();
      const r = canvas.getBoundingClientRect();
      const sx = (e.clientX - r.left) * (this.scale.width / r.width);
      const sy = (e.clientY - r.top) * (this.scale.height / r.height);
      const wp = this.cameras.main.getWorldPoint(sx, sy);
      const pick = this.pickAt(wp.x, wp.y);
      if (!pick) return;
      if (pick.kind === 'enemy') { this.player.selectTarget(pick); this.tapRing(pick.x, pick.y, 0xff5040); }
      else { this.player.selectInteract(pick); this.tapRing(pick.x, pick.y, 0xffe060); }
    };
    canvas.addEventListener('pointerdown', onDown);
    this.events.once('shutdown', () => canvas.removeEventListener('pointerdown', onDown));
  }

  tapRing(x, y, tint) {
    const r = this.add.image(x, y, 'tg_ring').setTint(tint).setDisplaySize(40, 30).setDepth(41).setAlpha(0.9);
    this.tweens.add({ targets: r, displayWidth: 64, displayHeight: 46, alpha: 0, duration: 380, onComplete: () => r.destroy() });
  }

  pickAt(wx, wy) {
    const zoom = this.cameras.main.zoom;
    const slack = 14 / zoom;
    let best = null, bd = Infinity;
    // önce düşmanlar (savaşta NPC/nesneyi yanlışlıkla seçmeyi önler)
    for (const e of this.enemies) {
      if (e.dead) continue;
      const hw = Math.max(20, e.radius + 12) + slack;
      const top = e.y - e.height - 6 - slack, bot = e.y + 12 + slack;
      if (Math.abs(wx - e.x) <= hw && wy >= top && wy <= bot) {
        const d = Math.hypot(wx - e.x, wy - (e.y - e.height / 2));
        if (d < bd) { bd = d; best = e; }
      }
    }
    if (best) return best;
    for (const o of this.objects) {
      if (o.kind === 'fx') continue;
      const d = Math.hypot(wx - o.x, wy - (o.y - (o.height || 30) / 2));
      if (d <= (o.tapRadius || 24) + slack && d < bd) { bd = d; best = o; }
    }
    return best;
  }

  // Aktif saldırı (kılıç butonu): mevcut hedef yakındaysa ona, değilse en yakın düşmana bir vuruş
  attackNearest() {
    const p = this.player;
    if (!p || p.dead || this.changing) return false;
    const dist = (e) => Math.hypot(e.x - p.x, e.y - p.y);
    let t = p.target && !p.target.dead && dist(p.target) < (app.stats().attackRange + 2.5) * TILE ? p.target : null;
    if (!t) {
      t = this.enemies.filter((e) => !e.dead && !e.gone && dist(e) < 9 * TILE && this.grid.los(p.x, p.y, e.x, e.y)).sort((a, b) => dist(a) - dist(b))[0];
      if (!t) { bus.emit('toast', { text: 'Yakında düşman yok', kind: 'info', short: true }); return false; }
    }
    if (t !== p.target) { p.selectTarget(t); this.tapRing(t.x, t.y, 0xff5040); }
    else if (!p.inAttackRange(t) && !p.approaching) p.startApproach();
    p.attackQueued = { t, at: this.clock };
    return true;
  }

  cycleTarget() {
    const p = this.player;
    const list = this.enemies.filter((e) => !e.dead && e.tpl.kind !== 'dummy' && Math.hypot(e.x - p.x, e.y - p.y) < 9 * TILE && this.grid.los(p.x, p.y, e.x, e.y))
      .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
    if (!list.length) { bus.emit('toast', { text: 'Yakında hedef yok', kind: 'info', short: true }); return; }
    const idx = list.indexOf(p.target);
    const next = list[(idx + 1) % list.length];
    p.selectTarget(next);
    this.tapRing(next.x, next.y, 0xff5040);
  }

  // ------------------------------------------------------------- dungeon kapıları
  setupGates() {
    const run = getRun(app.char, this.mapId);
    this.gates = [];
    for (const g of this.mapDef.gates) {
      const open = run?.cleared.includes(g.opensAfter);
      const sprites = [];
      for (let y = g.y0; y <= g.y1; y++) for (let x = g.x0; x <= g.x1; x++) {
        const i = y * this.grid.w + x;
        if (this.grid.solid[i]) continue;
        if (!open) {
          this.grid.dyn[i] = 1;
          sprites.push(this.add.image(x * TILE + 16, y * TILE + 16, 'obj_gate_bars').setDepth(100 + y * TILE + 30));
        }
      }
      this.gates.push({ g, sprites, open });
    }
  }

  openGates(stage) {
    for (const gt of this.gates || []) {
      if (gt.open || gt.g.opensAfter !== stage) continue;
      gt.open = true;
      for (let y = gt.g.y0; y <= gt.g.y1; y++) for (let x = gt.g.x0; x <= gt.g.x1; x++) this.grid.dyn[y * this.grid.w + x] = 0;
      for (const s of gt.sprites) this.tweens.add({ targets: s, y: s.y - 30, alpha: 0, duration: 700, onComplete: () => s.destroy() });
      sound.play('portal');
    }
  }

  // Mühür karşılaşması bitti mi? Biten karşılaşmanın mührü kırılır.
  checkSeals() {
    const ch = app.char, def = this.mapDef;
    for (const seal of def.seals || []) {
      const wave = this.spawner.sealWaves?.[seal.id];
      if (!wave || !wave.length || this.spawner.sealWaveAlive(seal.id)) continue;
      this.spawner.sealWaves[seal.id] = [];
      if (breakSeal(ch, this.mapId, seal.id)) {
        sound.play('altar');
        const n = sealsBroken(ch, this.mapId);
        bus.emit('toast', { text: `${seal.name} kırıldı (${n}/${def.seals.length})`, kind: n >= def.seals.length ? 'elite' : 'ok' });
        this.objects.find((o) => o.o?.id === seal.id)?.refresh?.();
        app.requestSave('seal', true);
      }
    }
  }

  checkStageCleared(stage) {
    if (stage === 3 && this.mapDef.seals) this.checkSeals();
    if (this.spawner.stageAlive(stage)) return;
    const ch = app.char;
    if (stage === 3 && this.mapDef.seals && sealsBroken(ch, this.mapId) < this.mapDef.seals.length) {
      if (!this._sealHint) { this._sealHint = true; bus.emit('toast', { text: 'Galeri sessiz... Boss kapısını açmak için üç mührü de kır.', kind: 'info' }); }
      return;
    }
    if (!clearStage(ch, stage, this.mapId)) return;
    this.openGates(stage);
    const area = this.mapDef.areas.find((a) => a.stage === stage);
    const ups = onDungeonStage(ch, stage, this.mapId);
    ups.forEach((u) => bus.emit('questProgress', u));
    if (stage === 4) {
      sound.play('victory');
      this.cameras.main.flash(600, 255, 230, 160);
      const boss = this.mapDef.boss || 'mine_golem';
      bus.emit('toast', { text: `${ENEMIES[boss].name.toLocaleUpperCase('tr-TR')} YENİLDİ! ${this.mapDef.name} temizlendi.`, kind: 'elite' });
      bus.emit('bossDefeated', boss);
    } else {
      bus.emit('toast', { text: `Bölüm temizlendi: ${area?.name || stage}. Kapı açıldı!`, kind: 'ok' });
    }
    bus.emit('dungeonProgress');
    app.requestSave('dungeonStage', true);
  }

  // ------------------------------------------------------------- harita geçişi
  changeMap(mapId, entry, opts = {}) {
    if (this.changing) return;
    const ch = app.char;
    this.changing = true;
    if (opts.exitDungeon) exitRun(ch, this.mapId);
    if (opts.enterDungeon) startOrResumeRun(ch, mapId);
    if (DUNGEON_INFO[mapId] && !entry) entry = respawnEntry(ch, mapId);
    const e = MAPS[mapId].entries[entry] || MAPS[mapId].entries.respawn;
    this.syncToChar();
    ch.world.map = mapId; ch.world.x = e.x; ch.world.y = e.y;
    sound.play('portal');
    app.requestSave('mapChange', true);
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.restart({ mapId, entry });
      this.changing = false;
    });
  }

  travelTo(mapId) {
    this.changeMap(mapId, 'waystone');
  }

  syncToChar() {
    const ch = app.char;
    if (!ch || !this.player || this.changing) return;
    ch.world.map = this.mapId;
    ch.world.x = Math.floor(this.player.x / TILE);
    ch.world.y = Math.floor(this.player.y / TILE);
    if (this.fog?.dirty) { ch.world.discovered[this.mapId] = this.fog.encode(); this.fog.dirty = false; }
  }

  // ------------------------------------------------------------- ölüm
  onPlayerDeath() {
    const ch = app.char;
    if (this.player.dead) return;
    this.player.die();
    ch.record.deaths++;
    applyDeathDurability(ch);
    app.changed('death');
    app.requestSave('death', true);
    bus.emit('playerDied', { map: this.mapDef, dungeon: !!this.mapDef.dungeon });
  }

  respawn() {
    const ch = app.char;
    const st = app.stats();
    let entry;
    this.combat.clearHazards();
    if (this.mapDef.dungeon) { entry = respawnEntry(ch, this.mapId); this.spawner.resetGolem(); }
    else entry = 'respawn';
    const e = this.mapDef.entries[entry] || this.mapDef.entries.respawn;
    this.player.x = e.x * TILE + TILE / 2; this.player.y = e.y * TILE + TILE / 2;
    ch.hp = st.maxHp; ch.mp = st.maxMp;
    this.player.revive();
    for (const en of this.enemies) if (!en.dead && en.state !== 'idle') en.startReturn();
    this.cameras.main.fadeIn(400);
    app.requestSave('respawn', true);
  }

  // ------------------------------------------------------------- olaylar
  onChanged(what) {
    if (['equip', 'inventory', 'stats', 'level', 'upgrade', 'repair', 'death'].includes(what)) this.player.refreshLook();
    if (['quest', 'level', 'kill', 'inventory'].includes(what)) this.refreshMarks();
  }

  refreshMarks() {
    for (const o of this.objects) if (o.kind === 'npc') o.refreshMark();
  }

  onLevelUp(ev) {
    const p = this.player;
    this.fx.levelUp(p.x, p.y);
    sound.play('levelup');
    bus.emit('toast', { text: `Seviye ${ev.level}! +3 stat, +1 beceri puanı`, kind: 'level' });
    for (const id of ev.unlocked) {
      bus.emit('toast', { text: `Yeni beceri: ${SKILLS[id].name}`, kind: 'level' });
      if (SKILLS[id].kind === 'active' && !app.char.skillBar?.includes(id)) bus.emit('toast', { text: 'Beceriler ekranından beceri çubuğuna yerleştirebilirsin (4 düğme).', kind: 'info' });
    }
    if (ev.level === 30) bus.emit('toast', { text: 'Seviye 30! Ustalık Kitapları artık Rank 5 becerilere uygulanabilir.', kind: 'elite' });
    app.changed('level');
    this.refreshMarks();
  }

  setModal(open) {
    if (open) { if (!this.scene.isPaused()) this.scene.pause(); }
    else if (this.scene.isPaused()) this.scene.resume();
  }

  isSafeAt(x, y) {
    if (this.mapDef.safe) return true;
    for (const a of this.mapDef.areas) {
      if (a.safePocket && Math.hypot(x / TILE - a.x, y / TILE - a.y) <= a.r) return true;
    }
    return false;
  }

  // ------------------------------------------------------------- mini harita verisi
  buildMinimapImage() {
    const b = this.built, def = this.mapDef;
    const c = document.createElement('canvas');
    c.width = b.w; c.height = b.h;
    const ctx = c.getContext('2d');
    const id = ctx.createImageData(b.w, b.h);
    const massCol = hexToRgb(MASS_COLORS[def.mass] || '#111');
    for (let i = 0; i < b.w * b.h; i++) {
      let col = hexToRgb(MINIMAP_COLORS[b.terrain[i]] || '#444');
      if (b.mass[i]) col = massCol;
      else if (b.sight[i]) col = shadeRgb(col, -0.45);
      id.data[i * 4] = col[0]; id.data[i * 4 + 1] = col[1]; id.data[i * 4 + 2] = col[2]; id.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(id, 0, 0);
    this.minimapImage = c;
  }

  guard(label, fn) {
    try { fn(); } catch (err) {
      this.guardErrors = this.guardErrors || {};
      if (!this.guardErrors[label]) { this.guardErrors[label] = true; console.error(`[Ahen] güncelleme hatası (${label}):`, err); }
    }
  }

  // ------------------------------------------------------------- ana döngü
  update(time, delta) {
    const speed = app.dev ? (app.timeScale || 1) : 1;
    if (this.time.timeScale !== speed) { this.time.timeScale = speed; this.tweens.timeScale = speed; this.anims.globalTimeScale = speed; }
    const dt = Math.min(0.05, delta / 1000) * speed;
    this.clock += dt * 1000;
    this.steps = (this.steps || 0) + 1;   // oyun adımı sayacı (FPS sınırı doğrulaması)
    const ch = app.char;
    if (!ch) return;
    ch.world.activeTime += dt;
    ch.record.playTime += dt;
    this.pathBudget = 4;

    // Tek bir varlıktaki beklenmeyen hata tüm oyun döngüsünü dondurmasın (hata konsola raporlanır)
    this.guard('oyuncu', () => this.player.update(dt));
    for (const e of this.enemies) this.guard(e.tpl.id, () => e.update(dt));
    this.separate();
    this.enemies = this.enemies.filter((e) => !e.dead || e.container.active);
    for (const o of this.objects) this.guard(o.kind || 'nesne', () => o.update(dt));
    this.guard('mermi', () => this.combat.updateProjectiles(dt));
    this.guard('tehlike', () => this.combat.updateHazards(dt));
    this.guard('spawn', () => this.spawner.update(dt));

    this.reachT -= dt;
    if (this.reachT <= 0) {
      this.reachT = 0.5;
      const p = this.player;
      for (const l of this.mapDef.locations || []) {
        if (Math.hypot(p.x / TILE - l.x, p.y / TILE - l.y) <= l.r) {
          const ups = onReach(ch, l.id);
          if (ups.length) { ups.forEach((u) => bus.emit('questProgress', u)); sound.play('quest'); app.changed('quest'); app.requestSave('reach', true); }
        }
      }
    }
    this.guard('rehber', () => this.updateGuide(dt));
    this.fogT -= dt;
    if (this.fogT <= 0) { this.fogT = 0.3; if (this.fog.reveal(this.player.x, this.player.y)) bus.emit('fog'); }

    // atmosfer
    if (this.playerLight) this.playerLight.setPosition(this.player.x, this.player.y - 20);
    if (this.mists) {
      const cam = this.cameras.main.worldView;
      for (const m of this.mists) {
        m.x += m.vx * dt;
        if (m.x > cam.right + 200) { m.x = cam.x - 200; m.y = cam.y + Math.random() * cam.height; }
        if (m.y < cam.y - 300 || m.y > cam.bottom + 300) m.y = cam.y + Math.random() * cam.height;
      }
    }
    if (this.fireflies) {
      const cam = this.cameras.main.worldView;
      for (const f of this.fireflies) {
        f.ph += dt;
        if (!f.base.x || Math.abs(f.base.x - cam.centerX) > cam.width) f.base = { x: cam.x + Math.random() * cam.width, y: cam.y + Math.random() * cam.height };
        f.setPosition(f.base.x + Math.sin(f.ph * 0.7) * 30, f.base.y + Math.cos(f.ph * 0.9) * 20);
        f.setAlpha(0.4 + Math.sin(f.ph * 3) * 0.4);
      }
    }
    bus.emit('tick', dt);
  }

  separate() {
    const list = this.enemies;
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      if (a.dead || a.tpl.ai === 'static' || a.tpl.kind === 'boss') continue;
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j];
        if (b.dead || b.tpl.ai === 'static') continue;
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), min = (a.radius + b.radius) * 0.9;
        if (d > 0.01 && d < min) {
          const push = (min - d) * 0.5;
          this.grid.move(a, -dx / d * push, -dy / d * push);
          if (b.tpl.kind !== 'boss') this.grid.move(b, dx / d * push, dy / d * push);
        }
      }
    }
  }
}

function hexToRgb(h) {
  h = h.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function shadeRgb(c, a) { return c.map((v) => Math.round(v * (1 + a))); }
