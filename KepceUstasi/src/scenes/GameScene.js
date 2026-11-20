// GameScene — ÜST: Şef + düşmanlar (savaş), ALT: fiziksel tencere + kepçe.
// Bu sahne oyun sonucu HESAPLAMAZ: RunController olaylarını oynatır ve token ile "bitti" bildirir.
import Phaser from 'phaser';
import { app } from '../game/AppState.js';
import { computeLayout, fieldToScreen } from '../config/layout.js';
import { RunController, PHASE } from '../systems/RunController.js';
import { permStats, applyRunResult } from '../systems/Progression.js';
import { living, nextSteps } from '../systems/EnemyDirector.js';
import { CHAPTERS, ENEMIES, RECIPE_LABELS, ABILITY_BY_ID, ABILITY_CATS, NORMAL_WAVES, FIELD } from '../data/content.js';
import { recipeComplete } from '../systems/RecipeTracker.js';
import { audio } from '../platform/AudioService.js';
import { adService } from '../platform/AdService.js';
import { lifecycle } from '../platform/Lifecycle.js';
import { text, panel, button, blocker, COLORS } from '../ui/widgets.js';

const CAT_COLORS = { catch: 0x3a7de0, attack: 0xe8582f, defense: 0x4caf3a, pan: 0xf2b11c };
const SOURCE_LABEL = { pan_burst: 'Tava Patlaması', tomato_splash: 'Sos Sıçraması', pan_echo: 'Tava Yankısı' };

export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  init(data) {
    this.startData = data || {};
  }

  get speed() {
    return app.save.settings.animSpeed || 1;
  }

  get lowMotion() {
    return app.save.settings.lowMotion;
  }

  create() {
    const { height: H } = this.scale;
    const L = (this.L = computeLayout(H));
    this.views = new Map();
    this.ballSprites = new Map();
    this.flying = new Set();
    this.overlay = null;
    this.pauseOverlay = null;
    this.rewardApplied = false;
    this.ended = false;

    const snapshot = this.startData.snapshot || null;
    const chapterId = snapshot ? snapshot.chapterId : this.startData.chapterId || 'menemen';
    this.chapter = CHAPTERS.find((c) => c.id === chapterId);
    this.tutorial = !app.save.tutorialDone && this.chapter.id === 'menemen';

    this.buildBattle();
    this.buildPot();
    this.buildHud();

    const seed = app.forcedSeed ?? ((Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0);
    this.controller = new RunController({
      chapterId,
      perm: permStats(app.save),
      seed,
      runId: `${Date.now().toString(36)}-${seed.toString(36)}`,
      snapshot,
    });
    this.controller.on((e) => this.onEvent(e));

    // Tap surface: the whole play area (top + bottom). HUD buttons sit above it.
    this.tapZone = this.add.zone(0, L.hud, L.W, H - L.hud).setOrigin(0).setInteractive();
    this.tapZone.setDepth(5);
    this.tapZone.on('pointerdown', () => this.tryTap());
    this.input.keyboard?.on('keydown-SPACE', () => this.tryTap());
    this.input.keyboard?.on('keydown-ESC', () => this.togglePause());
    this.input.keyboard?.on('keydown-P', () => this.togglePause());

    const offHidden = lifecycle.on('hidden', () => this.pauseGame());
    const offBack = lifecycle.on('back', () => this.togglePause());
    this.events.once('shutdown', () => {
      offHidden();
      offBack();
    });

    this.controller.start();
    if (app.dev) {
      window.__KEPCE__.scene = this;
      window.__KEPCE__.controller = this.controller;
    }
  }

  // ======================================================== building
  buildBattle() {
    const L = this.L;
    const bg = this.add.image(0, L.battle.top, 'battle_bg').setOrigin(0).setScale(3);
    if (bg.displayHeight < L.battle.h) bg.setDisplaySize(L.W, L.battle.h + 4);
    const chefPos = fieldToScreen(L, FIELD.chefX, 0.52);
    this.chefPos = chefPos;
    this.chef = this.add.image(chefPos.x, chefPos.y, 'chef').setScale(4).setDepth(20);
    this.muzzle = { x: chefPos.x + 50, y: chefPos.y - 8 };
    this.panPos = { x: chefPos.x - 4, y: L.battle.bottom - 30 };
    this.pan = this.add.image(this.panPos.x, this.panPos.y, 'pan').setScale(3).setDepth(18);
    // contact line hint (subtle, not a lane)
    const cx = fieldToScreen(L, FIELD.contactX, 0).x;
    const g = this.add.graphics().setDepth(2);
    g.fillStyle(0xffffff, 0.08);
    for (let y = L.field.top; y < L.field.bottom; y += 14) g.fillRect(cx, y, 2, 7);
    this.bannerText = text(this, L.W / 2, (L.battle.top + L.battle.bottom) / 2 - 20, '', 34, COLORS.gold, { strokeThickness: 6 }).setDepth(60).setAlpha(0);
  }

  buildPot() {
    const L = this.L;
    this.add.rectangle(0, L.divider.top, L.W, L.H - L.divider.top, 0x2b2530).setOrigin(0).setDepth(0);
    // back wall tiles
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(0x342d3b, 1);
    for (let y = L.potArea.top; y < L.stove.top; y += 24) for (let x = (y / 24) % 2 ? 0 : 24; x < L.W; x += 48) g.fillRect(x, y, 24, 24);
    this.add.image(0, L.divider.top, 'counter').setOrigin(0).setScale(3, 2.9).setDepth(30);
    this.add.image(0, L.stove.top, 'stove').setOrigin(0).setScale(3, Math.max(1, L.stove.h / 60 + 0.05)).setDepth(3);
    // flames
    for (let i = 0; i < 5; i++) {
      const f = this.add.image(L.pot.x + 110 + i * 56, L.stove.top + 4, 'flame1').setOrigin(0.5, 1).setScale(3).setDepth(4);
      if (!this.lowMotion) this.time.addEvent({ delay: 140 + i * 17, loop: true, callback: () => f.setTexture(f.texture.key === 'flame1' ? 'flame2' : 'flame1') });
    }
    this.potImg = this.add.image(L.pot.x - 30, L.pot.y - 6, 'pot').setOrigin(0).setScale(3).setDepth(6);
    // rail + ladle graphics
    this.rail = this.add.graphics().setDepth(9);
    this.rail.fillStyle(0x1a1d22, 1);
    this.rail.fillRect(L.pot.x - 10, L.railY - 6, 464, 12);
    this.rail.fillStyle(0x9aa4ad, 1);
    this.rail.fillRect(L.pot.x - 8, L.railY - 4, 460, 8);
    this.rail.fillStyle(0xdfe4ea, 1);
    this.rail.fillRect(L.pot.x - 8, L.railY - 4, 460, 2);
    this.ladleG = this.add.graphics().setDepth(12);
    // bubbles (decor only)
    if (!this.lowMotion) {
      this.time.addEvent({
        delay: 420,
        loop: true,
        callback: () => {
          if (!this.controller || this.controller.paused) return;
          const b = this.add.image(L.pot.x + 60 + Math.random() * 320, L.pot.y + 214, 'bubble').setScale(2).setDepth(11).setAlpha(0.8);
          this.tweens.add({ targets: b, y: b.y - 40 - Math.random() * 30, alpha: 0, duration: 900, onComplete: () => b.destroy() });
        },
      });
    }
  }

  buildHud() {
    const L = this.L;
    const g = this.add.graphics().setDepth(40);
    g.fillStyle(0x1e1a26, 1);
    g.fillRect(0, 0, L.W, L.hud);
    g.fillStyle(0x3d3447, 1);
    g.fillRect(0, L.hud - 4, L.W, 4);
    this.hudDish = text(this, 12, 18, this.chapter.name, 18, COLORS.gold, { ox: 0 }).setDepth(41);
    this.hudWave = text(this, 12, 40, '', 15, COLORS.cream, { ox: 0 }).setDepth(41);
    this.hearts = [];
    this.pauseBtn = button(this, L.W - 34, 28, 52, 44, 'II', () => this.togglePause(), { size: 22, fill: COLORS.btnGrey, dark: COLORS.btnGreyDark, light: 0x9a92a6 });
    this.pauseBtn.setDepth(45);
    this.heartsC = this.add.container(0, 0).setDepth(41);
    // recipe counters row
    this.recipeC = this.add.container(0, 0).setDepth(25);
    // pot HUD (in divider strip)
    this.capText = text(this, 16, L.divider.top + 17, '', 17, COLORS.cream, { ox: 0 }).setDepth(31);
    this.potText = text(this, L.W - 16, L.divider.top + 17, '', 15, '#e9dcc4', { ox: 1 }).setDepth(31);
    this.hint = text(this, L.W / 2, L.pot.y + 40, '', 22, COLORS.gold, { strokeThickness: 5 }).setDepth(50).setAlpha(0);
    this.hintArrow = this.add.graphics().setDepth(13);
    this.ammoText = text(this, this.chefPos.x, this.chefPos.y - 84, '', 20, COLORS.gold).setDepth(26);
    // offline debug metrics (GDD §15/§20) — only with ?dev=1 / ?test=1, never in the normal player UI
    if (app.dev) this.debugText = text(this, 8, L.H - 8, '', 12, '#9ef0ff', { ox: 0, oy: 1, strokeThickness: 2 }).setDepth(200);
  }

  refreshDebug() {
    if (!this.debugText) return;
    const r = this.controller.run;
    const loads = r.stats.loads;
    const avg = loads.length ? (loads.reduce((a, b) => a + b, 0) / loads.length).toFixed(2) : '-';
    this.debugText.setText(`seed ${r.seed} · tur ${r.turn} · ort.yük ${avg} · boş ${r.stats.catches.filter((c) => c === 0).length} · hasar ${r.stats.damageDealt} · can kaybı ${r.stats.hpLost} · kaçan ${r.stats.escaped}`);
  }

  // ======================================================== HUD refresh
  refreshHud() {
    const run = this.controller.run;
    const L = this.L;
    this.hudWave.setText(run.wave > NORMAL_WAVES ? 'BOSS · Servis zamanı' : `Dalga ${run.wave}/${NORMAL_WAVES}`);
    this.heartsC.removeAll(true);
    const n = run.chef.maxHp;
    const x0 = L.W - 74 - n * 24;
    for (let i = 0; i < n; i++) this.heartsC.add(this.add.image(x0 + i * 24, 20, i < run.chef.hp ? 'heart' : 'heart_empty').setScale(2.2));
    let sx = x0;
    for (let i = 0; i < run.chef.shield; i++, sx += 22) this.heartsC.add(this.add.image(sx, 44, 'shield').setScale(1.7));
    for (let i = 0; i < run.chef.saltCharges; i++, sx += 22) this.heartsC.add(this.add.image(sx, 44, 'salt').setScale(1.2));
    this.refreshRecipe(run.recipe);
    this.refreshPotHud();
  }

  refreshRecipe(recipe) {
    const L = this.L;
    this.recipeC.removeAll(true);
    const entries = Object.entries(this.chapter.recipe);
    const bg = this.add.graphics();
    const w = entries.length * 108 + 12;
    bg.fillStyle(0x1e1a26, 0.72);
    bg.fillRect(L.W / 2 - w / 2, L.battle.top + 6, w, 40);
    this.recipeC.add(bg);
    entries.forEach(([k, need], i) => {
      const x = L.W / 2 - w / 2 + 30 + i * 108;
      const have = recipe[k] || 0;
      this.recipeC.add(this.add.image(x, L.battle.top + 26, k).setScale(k === 'pepper' ? 1.4 : 1.7));
      this.recipeC.add(text(this, x + 20, L.battle.top + 26, `${Math.min(have, need)}/${need}`, 18, have >= need ? COLORS.gold : COLORS.cream, { ox: 0 }));
    });
  }

  refreshPotHud(load) {
    const c = this.controller;
    if (!c.ladle?.params) return;
    const cap = c.ladle.params.capacity;
    this.capText.setText(`Kepçe yükü: ${load ?? 0}/${cap}`);
    const counts = c.pot.countByType();
    this.potText.setText(`Tencere: ${c.pot.count}  (büyük ${counts.big})`);
  }

  // ======================================================== enemies
  enemyScale(e) {
    if (ENEMIES[e.type].boss) return 3.4;
    return ENEMIES[e.type].scale ? 3 * ENEMIES[e.type].scale : 3;
  }

  createView(e, fromRight = false) {
    const L = this.L;
    const pos = fieldToScreen(L, e.x, e.y);
    const c = this.add.container(fromRight ? L.W + 60 : pos.x, pos.y).setDepth(15 + e.y * 2);
    const key = ENEMIES[e.type].sprite || e.type;
    const spr = this.add.image(0, 0, key).setScale(this.enemyScale(e));
    const bar = this.add.graphics();
    const half = spr.displayHeight / 2;
    const status = this.add.container(0, -half - 26);
    c.add([spr, bar, status]);
    const view = { id: e.id, c, spr, bar, status, half, boss: e.boss, maxHp: e.maxHp, maxShield: e.maxShield, dead: false };
    this.views.set(e.id, view);
    this.drawBar(view, e.hp, e.shield);
    if (!this.lowMotion) view.bob = this.tweens.add({ targets: spr, y: -3, duration: 500 + (e.id % 5) * 60, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    return view;
  }

  drawBar(view, hp, shield) {
    const w = view.boss ? 96 : 48;
    const y = -view.half - 12;
    const g = view.bar;
    g.clear();
    g.fillStyle(0x15111a, 1);
    g.fillRect(-w / 2 - 2, y - 2, w + 4, 10);
    g.fillStyle(0x4a3a44, 1);
    g.fillRect(-w / 2, y, w, 6);
    g.fillStyle(0xe8402e, 1);
    g.fillRect(-w / 2, y, Math.round((w * hp) / view.maxHp), 6);
    g.fillStyle(0xff8a7a, 1);
    g.fillRect(-w / 2, y, Math.round((w * hp) / view.maxHp), 2);
    if (view.maxShield > 0) {
      for (let i = 0; i < view.maxShield; i++) {
        g.fillStyle(i < shield ? 0x8fc6f0 : 0x3b4148, 1);
        g.fillRect(-w / 2 + i * 12, y - 9, 10, 5);
      }
    }
  }

  refreshStatuses() {
    const run = this.controller.run;
    for (const e of living(run)) {
      const v = this.views.get(e.id);
      if (!v) continue;
      v.status.removeAll(true);
      const icons = [];
      if (nextSteps(e) >= 2 || (e.type === 'potato_king' && e.hasted)) icons.push(this.add.image(0, 0, 'fast').setScale(2.2));
      if (e.guard) icons.push(this.add.image(0, 0, 'shield').setScale(2));
      if (e.guardWarn) icons.push(text(this, 0, 0, '!', 22, COLORS.gold));
      icons.forEach((ic, i) => {
        ic.x = (i - (icons.length - 1) / 2) * 24;
        v.status.add(ic);
      });
    }
  }

  syncViewsToLogic() {
    const run = this.controller.run;
    for (const e of run.enemies) {
      const v = this.views.get(e.id);
      if (!v) continue;
      if (e.dead || e.escaped) {
        if (!v.dead) this.removeView(v);
        continue;
      }
      const p = fieldToScreen(this.L, e.x, e.y);
      v.c.x = p.x;
      v.c.y = p.y;
      this.drawBar(v, e.hp, e.shield);
    }
    this.refreshStatuses();
  }

  removeView(v) {
    v.dead = true;
    v.bob?.stop();
    v.c.destroy(true);
    this.views.delete(v.id);
  }

  // ======================================================== event dispatcher
  onEvent(e) {
    switch (e.kind) {
      case 'runStart':
        this.refreshHud();
        break;
      case 'restored':
        for (const en of living(e.run)) this.createView(en);
        this.refreshHud();
        this.refreshStatuses();
        this.flash('Kayıttan devam: dalga başı', 1200);
        break;
      case 'phase':
        this.onPhase(e.phase);
        break;
      case 'wavePrep':
        this.playWavePrep(e);
        break;
      case 'checkpoint':
        app.save.activeRun = e.snapshot;
        app.persist();
        break;
      case 'potRefill':
        if (e.add > 0) this.floatText(this.L.W / 2, this.L.pot.y + 20, `+${e.add} yağ`, '#ffe9a0');
        this.refreshPotHud();
        break;
      case 'swing':
        this.refreshDebug();
        this.refreshPotHud(0);
        this.ammoText.setText('');
        break;
      case 'drop':
        audio.play('drop');
        break;
      case 'catch':
        this.playCatch(e);
        break;
      case 'volley':
        this.playVolley(e);
        break;
      case 'enemyAction':
        this.playEnemyAction(e);
        break;
      case 'contact':
        this.playContact(e);
        break;
      case 'waveCleared':
        if (e.wave === 1 && this.tutorial) {
          app.save.tutorialDone = true;
          app.persist();
        }
        this.flash(e.wave <= NORMAL_WAVES ? 'Dalga temizlendi!' : '', 900);
        break;
      case 'skillChoice':
        this.showSkillChoice(e);
        break;
      case 'skillPicked':
        this.closeOverlay();
        audio.play('skill');
        this.refreshHud();
        this.flash(ABILITY_BY_ID[e.id].name, 900);
        break;
      case 'result':
        this.onResult(e);
        break;
      default:
        break;
    }
  }

  onPhase(phase) {
    const swing = phase === PHASE.SWING_WAIT;
    if (swing && this.tutorial && this.controller.run.turn <= 2) {
      this.hint.setText('Kepçe topçukların üstündeyken DOKUN!');
      this.hint.setAlpha(1);
    } else if (!swing) {
      this.hint.setAlpha(0);
    }
    if (swing) audio.play('swing', { volume: 0.25 });
  }

  tryTap() {
    if (this.overlay || this.pauseOverlay) return;
    if (this.controller.tap()) lifecycle.vibrate(15);
  }

  // ======================================================== update loop
  update(time, delta) {
    if (!this.controller) return;
    this.controller.update(delta);
    this.syncBalls();
    this.drawLadle(time);
  }

  syncBalls() {
    const L = this.L;
    const pot = this.controller.pot;
    for (const [id, b] of pot.balls) {
      let s = this.ballSprites.get(id);
      if (!s) {
        s = this.add.image(0, 0, b.oilType === 'big' ? 'oil_big' : 'oil_normal').setScale(3).setDepth(10);
        this.ballSprites.set(id, s);
      }
      s.x = L.pot.x + b.position.x;
      s.y = L.pot.y + b.position.y;
      s.rotation = b.angle;
    }
    for (const [id, s] of this.ballSprites) {
      if (!pot.balls.has(id) && !this.flying.has(id)) {
        s.destroy();
        this.ballSprites.delete(id);
      }
    }
  }

  drawLadle(time) {
    const L = this.L;
    const pot = this.controller.pot;
    const g = this.ladleG;
    g.clear();
    const pose = pot.ladlePose;
    if (!pose) return;
    const px = L.pot.x + pose.x;
    const py = L.pot.y + pose.y;
    // wooden handle from the rail down to the hinge
    g.fillStyle(0x3b2612, 1);
    g.fillRect(px - 7, L.railY - 2, 14, py - L.railY - 4);
    g.fillStyle(0x9c6438, 1);
    g.fillRect(px - 5, L.railY - 2, 10, py - L.railY - 6);
    g.fillStyle(0xc08a52, 1);
    g.fillRect(px - 5, L.railY - 2, 3, py - L.railY - 6);
    g.fillStyle(0x6b747c, 1);
    g.fillRect(px - 12, L.railY - 9, 24, 12);
    // translucent perforated shell of each half (kevgir), drawn as a fan from the hinge
    for (const side of [-1, 1]) {
      const parts = pot.ladleParts.filter((p) => p.side === side);
      const pts = [{ x: px, y: py }, ...parts.map((p) => ({ x: L.pot.x + p.position.x, y: L.pot.y + p.position.y }))];
      g.fillStyle(0xcfd6dc, 0.22);
      g.fillPoints(pts, true);
      g.fillStyle(0x1a1d22, 0.35);
      for (let i = 2; i < parts.length; i += 2) {
        const q = parts[i].position;
        g.fillRect(L.pot.x + (q.x + pose.x) / 2 - 2, L.pot.y + (q.y + pose.y) / 2 - 2, 4, 4);
      }
    }
    // perforated ladle halves (each segment is a real collider)
    for (const part of pot.ladleParts) {
      const pts = part.vertices.map((v) => ({ x: L.pot.x + v.x, y: L.pot.y + v.y }));
      g.fillStyle(0x1a1d22, 1);
      g.fillPoints(pts.map((p) => ({ x: p.x + (p.x > px ? 1 : -1), y: p.y + 1 })), true);
      g.fillStyle(0xb9c2cc, 1);
      g.fillPoints(pts, true);
    }
    pot.ladleParts.forEach((part, i) => {
      if (i % 2) return;
      g.fillStyle(0x3b4148, 1);
      g.fillRect(L.pot.x + part.position.x - 2, L.pot.y + part.position.y - 2, 4, 4);
    });
    g.fillStyle(0xf2c230, 1);
    g.fillCircle(px, py, 7);
    g.fillStyle(0x8a5a10, 1);
    g.fillCircle(px, py, 3);
    // subtle tap cue above the ladle while swinging
    const a = this.hintArrow;
    a.clear();
    if (this.controller.phase === PHASE.SWING_WAIT && !this.overlay && !this.pauseOverlay) {
      const bob = this.lowMotion ? 0 : Math.sin(time / 160) * 3;
      a.fillStyle(0xffd84a, 0.85);
      a.fillTriangle(px - 9, L.railY + 14 + bob, px + 9, L.railY + 14 + bob, px, L.railY + 26 + bob);
    }
  }

  // ======================================================== presentation: wave
  playWavePrep(e) {
    const sp = this.speed;
    this.refreshHud();
    if (e.isBoss) {
      audio.play('warn');
      this.flash(`BOSS: ${ENEMIES[this.chapter.boss].name}`, 1100 / sp);
    } else {
      this.flash(`Dalga ${e.wave}/${NORMAL_WAVES}`, 800 / sp);
    }
    for (const en of e.enemies) {
      const v = this.createView(en, true);
      const p = fieldToScreen(this.L, en.x, en.y);
      this.tweens.add({ targets: v.c, x: p.x, duration: 520 / sp, ease: 'Quad.out' });
    }
    this.time.delayedCall((e.isBoss ? 1100 : 760) / sp, () => {
      this.refreshStatuses();
      this.controller.ack(e.token);
    });
  }

  // ======================================================== presentation: catch
  playCatch(e) {
    const L = this.L;
    const sp = this.speed;
    this.refreshPotHud(e.load);
    if (e.caught.length) audio.play('catch');
    e.caught.forEach((b, i) => {
      const s = this.ballSprites.get(b.id);
      if (!s) return;
      this.flying.add(b.id);
      s.setDepth(55);
      this.tweens.add({
        targets: s,
        x: this.muzzle.x - 30 + (i % 4) * 6,
        y: this.muzzle.y + 10,
        scale: 2,
        duration: 380 / sp,
        delay: i * 40,
        ease: 'Quad.in',
        onComplete: () => {
          s.destroy();
          this.flying.delete(b.id);
          this.ballSprites.delete(b.id);
        },
      });
    });
    const big = e.caught.filter((b) => b.type === 'big').length;
    const norm = e.caught.length - big;
    if (e.caught.length === 0) {
      this.floatText(L.W / 2, L.railY - 26, 'Boş kepçe! Güvence damlası +1', '#ffb35a');
    } else {
      this.floatText(L.W / 2, L.railY - 26, `${norm} normal${big ? ` + ${big} büyük` : ''}  (yük ${e.load}/${e.capacity})`, '#fff4dc');
    }
    if (e.spilled.length) this.floatText(L.W / 2, L.railY - 2, `Kapasite doldu: ${e.spilled.length} topçuk geri döküldü`, '#ffb35a');
    this.ammoText.setText(`x${Math.max(1, e.caught.length)}`);
  }

  // ======================================================== presentation: volley
  playVolley(e) {
    const sp = this.speed;
    const shotGap = 150 / sp;
    const travel = 230 / sp;
    let t = 0;
    let lastLand = 0;
    let remainingShots = e.events.filter((x) => x.type === 'shot').length;
    for (const ev of e.events) {
      if (ev.type === 'shot') {
        const at = t;
        this.time.delayedCall(at, () => {
          this.ammoText.setText(remainingShots > 1 ? `x${--remainingShots}` : '');
          this.fireShot(ev, travel);
        });
        lastLand = at + travel;
        t += shotGap;
      } else if (ev.type === 'kill') {
        this.time.delayedCall(lastLand + 20, () => this.killView(ev));
      } else if (ev.type === 'area') {
        const at = Math.max(t, lastLand + 30);
        this.time.delayedCall(at, () => this.areaFx(ev, 160 / sp));
        lastLand = at + 160 / sp;
        t = at + 60 / sp;
      } else if (ev.type === 'bonusReady') {
        this.time.delayedCall(lastLand + 60, () => this.floatText(this.chefPos.x + 40, this.chefPos.y - 90, ev.source === 'chain_cooking' ? 'Zincir Pişirme: +1 yağ' : 'Tava Ustalığı: +1 yağ', '#8be07a'));
      } else if (ev.type === 'fizzle') {
        // queue closes safely: no living target
      }
    }
    this.time.delayedCall(Math.max(t, lastLand) + 420 / sp, () => {
      this.ammoText.setText('');
      this.syncViewsToLogic();
      this.controller.ack(e.token);
    });
  }

  fireShot(ev, travel) {
    const v = this.views.get(ev.targetId);
    const start = { x: this.muzzle.x, y: this.muzzle.y };
    // recoil (transform only)
    if (!this.lowMotion) this.tweens.add({ targets: this.chef, x: this.chefPos.x - 5, duration: 50, yoyo: true });
    audio.play('shoot', { detune: ev.oil === 'big' ? -400 : 0 });
    const proj = this.add.image(start.x, start.y, ev.oil === 'big' ? 'oil_big' : 'oil_normal').setScale(ev.oil === 'big' ? 2.6 : 2.2).setDepth(50);
    if (ev.isBonus) proj.setTint(0xb8ffb0);
    const end = v ? { x: v.c.x, y: v.c.y } : { x: this.L.W - 40, y: start.y };
    const ctrl = { x: (start.x + end.x) / 2, y: Math.min(start.y, end.y) - 60 };
    const o = { t: 0 };
    this.tweens.add({
      targets: o,
      t: 1,
      duration: travel,
      onUpdate: () => {
        const k = o.t;
        proj.x = (1 - k) * (1 - k) * start.x + 2 * (1 - k) * k * ctrl.x + k * k * end.x;
        proj.y = (1 - k) * (1 - k) * start.y + 2 * (1 - k) * k * ctrl.y + k * k * end.y;
      },
      onComplete: () => {
        proj.destroy();
        audio.play('hit');
        const tv = this.views.get(ev.targetId);
        if (tv && !tv.dead) {
          this.drawBar(tv, ev.hp, ev.shield);
          tv.spr.setTintFill(0xffffff);
          this.time.delayedCall(70, () => tv.spr.active && tv.spr.clearTint());
          if (ev.shieldBroken) this.floatText(tv.c.x, tv.c.y - tv.half - 30, 'Kalkan kırıldı!', '#8fc6f0');
          if (ev.guarded) this.floatText(tv.c.x, tv.c.y - tv.half - 44, 'Savundu -1', '#8fc6f0');
        }
        const label = ev.shieldDmg && !ev.hpDmg ? `-${ev.shieldDmg}🛡` : `-${ev.damage}`;
        this.floatText(end.x + 10, end.y - 20, label.replace('🛡', ' kalkan'), ev.bonusParts.length ? '#ffd84a' : '#ffffff', 20);
      },
    });
  }

  areaFx(ev, dur) {
    const L = this.L;
    const from = fieldToScreen(L, ev.fromX, ev.fromY);
    const v = this.views.get(ev.targetId);
    const to = v ? { x: v.c.x, y: v.c.y } : from;
    const s = this.add.image(from.x, from.y, 'spark').setScale(3).setDepth(52);
    audio.play('sizzle', { volume: 0.4 });
    this.tweens.add({
      targets: s,
      x: to.x,
      y: to.y,
      duration: dur,
      onComplete: () => {
        s.destroy();
        if (v && !v.dead) {
          this.drawBar(v, ev.hp, ev.shield);
          v.spr.setTintFill(0xffd84a);
          this.time.delayedCall(70, () => v.spr.active && v.spr.clearTint());
        }
        this.floatText(to.x, to.y - 24, `-${ev.damage} ${SOURCE_LABEL[ev.source] || ''}`, '#ffd84a', 15);
      },
    });
  }

  killView(ev) {
    const v = this.views.get(ev.id);
    this.refreshRecipe(ev.recipe);
    if (!v || v.dead) return;
    v.dead = true;
    v.bob?.stop();
    v.bar.clear();
    v.status.removeAll(true);
    const sp = this.speed;
    const start = { x: v.c.x, y: v.c.y };
    const end = { x: this.panPos.x + 8, y: this.panPos.y - 6 };
    const ctrl = { x: (start.x + end.x) / 2, y: Math.min(start.y, end.y) - 120 };
    const o = { t: 0 };
    v.c.setDepth(54);
    this.tweens.add({
      targets: o,
      t: 1,
      duration: 480 / sp,
      ease: 'Quad.in',
      onUpdate: () => {
        const k = o.t;
        v.c.x = (1 - k) * (1 - k) * start.x + 2 * (1 - k) * k * ctrl.x + k * k * end.x;
        v.c.y = (1 - k) * (1 - k) * start.y + 2 * (1 - k) * k * ctrl.y + k * k * end.y;
        v.c.rotation = k * 4;
        v.c.setScale(1 - k * 0.55);
      },
      onComplete: () => {
        audio.play('sizzle');
        const s = this.add.image(end.x, end.y - 6, 'spark').setScale(3).setDepth(55);
        this.tweens.add({ targets: s, alpha: 0, y: s.y - 20, duration: 300, onComplete: () => s.destroy() });
        if (ev.counted) this.floatText(end.x + 20, end.y - 30, `+1 ${RECIPE_LABELS[ev.recipeKey]}`, '#8be07a', 15);
        if (this.tutorial && !this.tutKillShown) {
          this.tutKillShown = true;
          this.flash('Pişen sebze tavaya düştü → tarif +1', 1600);
        }
        this.views.delete(v.id);
        v.c.destroy(true);
      },
    });
  }

  // ======================================================== presentation: enemy action & contact
  playEnemyAction(e) {
    const sp = this.speed;
    let dur = 360 / sp;
    for (const ev of e.events) {
      const v = this.views.get(ev.id);
      if (ev.type === 'move' && v) {
        const to = fieldToScreen(this.L, ev.toX, 0).x;
        this.tweens.add({ targets: v.c, x: to, duration: (ev.steps > 1 ? 380 : 300) / sp, ease: 'Quad.inOut' });
        if (!this.lowMotion) this.tweens.add({ targets: v.spr, y: -8, duration: 140 / sp, yoyo: true });
      } else if (ev.type === 'summon') {
        audio.play('warn');
        if (v) this.shake(v.c, 6);
        for (const m of ev.minions) {
          const mv = this.createView(m);
          const p = { x: mv.c.x, y: mv.c.y };
          mv.c.setPosition(v ? v.c.x : p.x, v ? v.c.y : p.y).setScale(0.2);
          this.tweens.add({ targets: mv.c, x: p.x, y: p.y, scale: 1, duration: 420 / sp, ease: 'Back.out' });
        }
        this.floatText(v ? v.c.x : 400, v ? v.c.y - 90 : 200, 'İki küçük domates çağırdı!', '#ff8a7a', 16);
        dur = Math.max(dur, 520 / sp);
      } else if (ev.type === 'guardWarn' && v) {
        this.floatText(v.c.x, v.c.y - v.half - 50, 'Savunmaya hazırlanıyor!', '#ffd84a', 15);
      } else if (ev.type === 'guardUp' && v) {
        audio.play('shield');
        this.floatText(v.c.x, v.c.y - v.half - 50, 'Savunma: sonraki vuruş -1', '#8fc6f0', 15);
      } else if (ev.type === 'haste' && v) {
        audio.play('warn');
        this.shake(v.c, 6);
        this.floatText(v.c.x, v.c.y - v.half - 50, 'Patates Kral HIZLANDI!', '#ff8a7a', 17);
      }
    }
    this.time.delayedCall(dur + 60, () => {
      this.syncViewsToLogic();
      this.controller.ack(e.token);
    });
  }

  playContact(e) {
    const sp = this.speed;
    let t = 0;
    for (const ev of e.events) {
      if (ev.type !== 'contact') continue;
      const v = this.views.get(ev.id);
      this.time.delayedCall(t, () => {
        if (v && !v.dead) {
          this.tweens.add({
            targets: v.c,
            x: this.chefPos.x + 46,
            duration: 140 / sp,
            yoyo: !ev.escaped,
            onComplete: () => {
              if (ev.escaped) {
                this.tweens.add({ targets: v.c, x: -60, alpha: 0, duration: 260 / sp, onComplete: () => this.removeView(v) });
              } else if (ev.retreatX != null) {
                this.tweens.add({ targets: v.c, x: fieldToScreen(this.L, ev.retreatX, 0).x, duration: 300 / sp });
              }
            },
          });
        }
        if (ev.hpLoss > 0) {
          audio.play('hurt');
          lifecycle.vibrate(60);
          this.chef.setTintFill(0xff4040);
          this.time.delayedCall(90, () => this.chef.clearTint());
          if (!this.lowMotion) this.shake(this.chef, 5);
          this.floatText(this.chefPos.x, this.chefPos.y - 70, `-${ev.hpLoss} can`, '#ff6a6a', 20);
        }
        if (ev.salt || ev.shield) {
          audio.play('shield');
          this.floatText(this.chefPos.x, this.chefPos.y - 96, `Kalkan engelledi ${ev.salt + ev.shield}`, '#8fc6f0', 16);
        }
        if (ev.escaped) this.floatText(this.chefPos.x + 60, this.chefPos.y + 60, 'Kaçtı (tarife sayılmaz)', '#d8c9b0', 14);
        this.refreshHud();
      });
      t += 380 / sp;
    }
    this.time.delayedCall(t + 220 / sp, () => {
      this.syncViewsToLogic();
      this.refreshHud();
      this.controller.ack(e.token);
    });
  }

  // ======================================================== helpers
  flash(msg, dur) {
    if (!msg) return;
    this.bannerText.setScale(1).setText(msg);
    const fit = Math.min(1, (this.L.W - 24) / Math.max(1, this.bannerText.width)); // never wider than the screen
    this.bannerText.setAlpha(1).setScale(this.lowMotion ? fit : fit * 0.7);
    this.tweens.killTweensOf(this.bannerText);
    this.tweens.add({ targets: this.bannerText, scale: fit, duration: 160 });
    this.tweens.add({ targets: this.bannerText, alpha: 0, delay: dur, duration: 260 });
  }

  floatText(x, y, msg, color = '#ffffff', size = 17) {
    const t = text(this, x, y, msg, size, color).setDepth(58);
    if (t.x + t.width / 2 > this.L.W - 6) t.x = this.L.W - 6 - t.width / 2;
    if (t.x - t.width / 2 < 6) t.x = 6 + t.width / 2;
    this.tweens.add({ targets: t, y: y - 34, alpha: 0, delay: 500, duration: 700, onComplete: () => t.destroy() });
    return t;
  }

  shake(target, amp) {
    const x = target.x;
    this.tweens.add({ targets: target, x: x + amp, duration: 40, yoyo: true, repeat: 2, onComplete: () => (target.x = x) });
  }

  closeOverlay() {
    if (this.overlay) {
      this.overlay.destroy(true);
      this.overlay = null;
    }
  }

  // ======================================================== skill choice
  showSkillChoice(e) {
    this.closeOverlay();
    const L = this.L;
    const run = this.controller.run;
    const c = this.add.container(0, 0).setDepth(100);
    c.add(blocker(this, 0.72));
    const top = Math.max(40, L.H / 2 - 420);
    c.add(panel(this, 20, top, L.W - 40, 800));
    c.add(text(this, L.W / 2, top + 36, `YETENEK SEÇ (${e.choice}/4)`, 28, COLORS.gold));
    c.add(text(this, L.W / 2, top + 70, 'Koşu boyunca geçerli. Oyun seçim sırasında durur.', 14, '#e9dcc4'));
    e.offer.forEach((id, i) => {
      const ab = ABILITY_BY_ID[id];
      const stacks = run.abilities[id] || 0;
      const y = top + 100 + i * 172;
      const card = this.add.container(0, 0);
      const g = this.add.graphics();
      g.fillStyle(0x15111a, 1);
      g.fillRect(40, y, L.W - 80, 156);
      g.fillStyle(0x3d3447, 1);
      g.fillRect(43, y + 3, L.W - 86, 150);
      g.fillStyle(CAT_COLORS[ab.cat], 1);
      g.fillRect(43, y + 3, 12, 150);
      card.add(g);
      card.add(text(this, 72, y + 30, ab.name, 24, COLORS.cream, { ox: 0 }));
      card.add(text(this, L.W - 60, y + 30, `${ABILITY_CATS[ab.cat]} · Sv ${stacks + 1}/${ab.max}`, 14, '#d8c9b0', { ox: 1 }));
      card.add(text(this, 72, y + 84, ab.desc(stacks + 1), 17, '#e9dcc4', { ox: 0, wrap: L.W - 150 }));
      const hit = this.add.zone(40, y, L.W - 80, 156).setOrigin(0).setInteractive({ useHandCursor: true });
      hit.on('pointerup', () => this.controller.chooseSkill(id));
      card.add(hit);
      c.add(card);
    });
    const by = top + 100 + 3 * 172 + 40;
    c.add(button(this, L.W / 2, by, 330, 54, e.rerollAvailable ? 'YENİDEN SEÇ (ücretsiz)' : 'Ücretsiz yenileme kullanıldı', () => this.controller.rerollSkills(), { size: 18, enabled: e.rerollAvailable, fill: COLORS.btnGrey, dark: COLORS.btnGreyDark, light: 0x9a92a6 }));
    c.add(button(this, L.W / 2, by + 66, 330, 46, 'Reklamla yenile — Android sürümünde', () => {}, { size: 15, enabled: adService.isAvailable() }));
    this.overlay = c;
    if (this.tutorial && e.choice === 1) c.add(text(this, L.W / 2, top + 780, 'İpucu: Yakalama kartları kepçeyi fiziksel olarak değiştirir.', 14, COLORS.gold, { wrap: 460 }));
  }

  // ======================================================== pause
  togglePause() {
    if (this.pauseOverlay) this.resumeGame();
    else this.pauseGame();
  }

  pauseGame() {
    if (this.pauseOverlay || this.ended || !this.controller) return;
    if (!this.controller.pause()) return;
    this.tweens.pauseAll();
    this.time.paused = true;
    const L = this.L;
    const c = this.add.container(0, 0).setDepth(120);
    c.add(blocker(this, 0.75));
    const top = L.H / 2 - 330;
    c.add(panel(this, 40, top, L.W - 80, 660));
    c.add(text(this, L.W / 2, top + 40, 'DURAKLATILDI', 30, COLORS.gold));
    const run = this.controller.run;
    const abil = Object.entries(run.abilities).map(([id, n]) => `${ABILITY_BY_ID[id].name}${n > 1 ? ` x${n}` : ''}`);
    c.add(text(this, L.W / 2, top + 100, abil.length ? `Yetenekler: ${abil.join(', ')}` : 'Henüz yetenek yok', 15, '#e9dcc4', { wrap: L.W - 140 }));
    const lp = this.controller.ladle.params;
    c.add(text(this, L.W / 2, top + 156, `Kepçe: kapasite ${lp.capacity} · ağız %${Math.round((lp.radius / 44) * 100)} · salınım ${lp.period.toFixed(2)} sn`, 14, '#d8c9b0', { wrap: L.W - 140 }));
    c.add(button(this, L.W / 2, top + 230, 300, 64, 'DEVAM', () => this.resumeGame(), { size: 26, fill: COLORS.btnGreen, dark: COLORS.btnGreenDark, light: 0x8be07a }));
    const sb = button(this, L.W / 2, top + 314, 300, 54, `SES: ${app.save.settings.sound ? 'AÇIK' : 'KAPALI'}`, () => {
      app.setSetting('sound', !app.save.settings.sound);
      sb.setLabel(`SES: ${app.save.settings.sound ? 'AÇIK' : 'KAPALI'}`);
    }, { size: 20 });
    c.add(sb);
    c.add(button(this, L.W / 2, top + 392, 300, 54, 'KAYDET VE ÇIK', () => this.saveAndQuit(), { size: 20, fill: COLORS.btnGrey, dark: COLORS.btnGreyDark, light: 0x9a92a6 }));
    let confirm = false;
    const ab = button(this, L.W / 2, top + 470, 300, 54, 'SİPARİŞİ BIRAK', () => {
      if (!confirm) {
        confirm = true;
        ab.setLabel('EMİN MİSİN?');
        return;
      }
      this.abandon();
    }, { size: 20, fill: 0xb5341f, dark: 0x7a1f12, light: 0xe8582f });
    c.add(ab);
    c.add(text(this, L.W / 2, top + 540, 'Kaydet ve çık: bu dalganın başından devam edersin.\nBırakırsan tamamlanan dalgalara göre kısmi bahşiş alırsın.', 13, '#d8c9b0', { wrap: L.W - 120 }));
    this.pauseOverlay = c;
  }

  resumeGame() {
    if (!this.pauseOverlay) return;
    this.pauseOverlay.destroy(true);
    this.pauseOverlay = null;
    this.time.paused = false;
    this.tweens.resumeAll();
    this.controller.resume();
  }

  saveAndQuit() {
    // the last consistent wave checkpoint is already persisted (checkpoint event)
    this.ended = true;
    this.scene.start('Menu');
  }

  abandon() {
    this.pauseOverlay?.destroy(true);
    this.pauseOverlay = null;
    this.time.paused = false;
    this.tweens.resumeAll();
    this.controller.resume();
    this.controller.finish(false);
  }

  // ======================================================== result
  onResult(e) {
    this.ended = true;
    this.hint.setAlpha(0);
    const run = e.run;
    let out = null;
    if (!this.rewardApplied) {
      this.rewardApplied = true;
      out = applyRunResult(app.save, this.chapter, run, { victory: e.victory, stars: e.stars });
      app.persist(); // reward + cleared snapshot in ONE write
    }
    const sp = this.speed;
    if (e.victory) {
      audio.play('victory');
      // short serve effect: dish pops onto the counter
      const dish = this.add.image(this.L.W / 2, this.L.battle.bottom - 80, this.chapter.id === 'menemen' ? 'dish_menemen' : 'dish_fries').setScale(0.5).setDepth(70);
      this.tweens.add({ targets: dish, scale: 4, y: dish.y - 60, duration: 420 / sp, ease: 'Back.out' });
      this.flash('SERVİS EDİLDİ!', 1400);
    } else {
      audio.play('defeat');
      this.flash('Sipariş yandı…', 1400);
    }
    this.time.delayedCall(1300 / sp, () => this.showResult(e, out));
  }

  showResult(e, out) {
    this.closeOverlay();
    const L = this.L;
    const run = e.run;
    const c = this.add.container(0, 0).setDepth(110);
    c.add(blocker(this, 0.78));
    const top = Math.max(30, L.H / 2 - 400);
    c.add(panel(this, 24, top, L.W - 48, 800));
    c.add(text(this, L.W / 2, top + 40, e.victory ? 'SİPARİŞ TAMAM!' : 'SİPARİŞ YANDI', 32, e.victory ? COLORS.gold : '#ff8a7a'));
    c.add(text(this, L.W / 2, top + 78, this.chapter.name, 20, COLORS.cream));
    c.add(this.add.image(L.W / 2, top + 140, this.chapter.id === 'menemen' ? 'dish_menemen' : 'dish_fries').setScale(3.4).setAlpha(e.victory ? 1 : 0.45));
    for (let s = 0; s < 3; s++) {
      const st = this.add.image(L.W / 2 - 56 + s * 56, top + 218, s < e.stars ? 'star' : 'star_empty').setScale(3.4);
      c.add(st);
      if (s < e.stars && !this.lowMotion) {
        st.setScale(0.5);
        this.tweens.add({ targets: st, scale: 3.4, delay: 200 + s * 220, duration: 260, ease: 'Back.out', onStart: () => audio.play('coin') });
      }
    }
    const recipeLines = Object.entries(this.chapter.recipe)
      .map(([k, n]) => `${RECIPE_LABELS[k]} ${Math.min(run.recipe[k] || 0, n)}/${n}`)
      .join('   ');
    c.add(text(this, L.W / 2, top + 268, recipeLines, 17, recipeComplete(run, this.chapter) ? '#8be07a' : COLORS.cream));
    const starRules = ['1★ Boss yenildi', '2★ Tam tarif', `3★ Toplam can kaybı ≤ 1 (bu koşu: ${run.stats.hpLost})`];
    c.add(text(this, L.W / 2, top + 312, starRules.join('\n'), 14, '#d8c9b0', { lineSpacing: 4 }));
    let lines;
    if (out && !out.duplicate) {
      const r = out.reward;
      lines = e.victory
        ? [`Temel bahşiş: ${r.base}`, `Kalite bonusu: ${r.quality}`, `İlk servis bonusu: ${r.firstBonus}`]
        : [`Tamamlanan dalga: ${Math.min(6, run.wave > 6 ? 6 : run.stats.completedWaves)}/6`, `Kısmi bahşiş: ${r.failReward}`];
      lines.push(`TOPLAM: +${r.total}`);
    } else {
      lines = ['Bu koşunun ödülü zaten verildi.'];
    }
    c.add(text(this, L.W / 2, top + 418, lines.join('\n'), 18, COLORS.gold, { lineSpacing: 6 }));
    c.add(this.add.image(L.W / 2 - 100, top + 506, 'coin').setScale(2.2));
    c.add(text(this, L.W / 2 - 80, top + 506, `Toplam bahşiş: ${app.save.tips}`, 18, COLORS.cream, { ox: 0 }));
    c.add(button(this, L.W / 2, top + 560, 380, 44, 'Reklamla +%40 bahşiş — Android sürümünde', () => {}, { size: 14, enabled: adService.isAvailable() }));
    const next = CHAPTERS.find((ch) => ch.index === this.chapter.index + 1);
    let y = top + 624;
    if (e.victory && next && app.save.highestUnlocked >= next.index) {
      c.add(button(this, L.W / 2, y, 380, 58, `SONRAKİ: ${next.name.toUpperCase()}`, () => this.scene.start('Game', { chapterId: next.id }), { size: 20, fill: COLORS.btnGreen, dark: COLORS.btnGreenDark, light: 0x8be07a }));
      y += 70;
      c.add(button(this, L.W / 2 - 98, y, 180, 54, 'TEKRAR', () => this.scene.start('Game', { chapterId: this.chapter.id }), { size: 20 }));
      c.add(button(this, L.W / 2 + 98, y, 180, 54, 'RESTORAN', () => this.scene.start('Menu'), { size: 20, fill: COLORS.btnGrey, dark: COLORS.btnGreyDark, light: 0x9a92a6 }));
    } else {
      c.add(button(this, L.W / 2, y, 380, 58, 'TEKRAR OYNA', () => this.scene.start('Game', { chapterId: this.chapter.id }), { size: 22 }));
      c.add(button(this, L.W / 2, y + 70, 380, 54, 'RESTORANA DÖN', () => this.scene.start('Menu'), { size: 20, fill: COLORS.btnGrey, dark: COLORS.btnGreyDark, light: 0x9a92a6 }));
    }
    this.overlay = c;
  }
}
