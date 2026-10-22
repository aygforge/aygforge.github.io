// Düşman varlığı: durum makinesi (boşta/kovala/saldır/dön), aggro, leash, menzilli kaçış, sürü çağırma,
// elit yetenekleri (telegraflı) ve boss davranış bağlantısı.
import Phaser from 'phaser';
import { TILE, TG_SQUASH } from '../data/constants.js';
import { sound } from '../audio/sound.js';
import { makeBossBehavior } from './bosses.js';
import { spritePack, animDuration } from '../art/spriteRuntime.js';
import { V2_SCALE } from '../art/monstersV2.js';
import { V3_SCALE } from '../art/monstersV3.js';
import { V4_SCALE } from '../art/monstersV4.js';
import { V4_NORMAL_ABILITIES, V4_ELITE_ABILITIES, normalAbilityV4, eliteAbilityV4 } from './enemyV4.js';

let NEXT_ID = 1;
const SCALE = { captain: 1.2, executioner: 1.35, ...V2_SCALE, ...V3_SCALE, ...V4_SCALE };

export class Enemy {
  constructor(scene, tpl, x, y, opts = {}) {
    this.scene = scene;
    this.uid = NEXT_ID++;
    this.tpl = tpl;
    this.kind = 'enemy';
    this.x = x; this.y = y;
    this.home = { x, y };
    this.maxHp = tpl.hp; this.hp = tpl.hp;
    this.level = tpl.level; this.def = tpl.def; this.mdef = tpl.mdef; this.atk = tpl.atk;
    this.species = tpl.species; this.dmgType = tpl.dmgType;
    this.radius = Math.max(8, tpl.radius * TILE * 0.8);
    this.state = 'idle';
    this.attackTimer = 0.6 + Math.random() * 0.6;
    this.wanderTimer = Math.random() * 3;
    this.wanderGoal = null;
    this.path = null; this.pathTimer = 0;
    this.slowUntil = 0; this.slowPct = 0; this.stunUntil = 0;
    this.reduce = 0;
    this.speedMult = 1; this.atkMult = 1;
    this.dead = false;
    this.spawnRef = opts.spawnRef || null;
    this.summoned = !!opts.summoned;
    this.questSpawn = !!opts.questSpawn;     // V3: görev olayı yaratığı (ödül/sayaç yok)
    this.objective = null;                   // V3: saldırılacak korunan hedef (kervan, kamp…)
    this.stage = opts.stage || 0;
    this.facing = 1;
    this.windup = null;
    this.casting = null;
    this.abilityCd = 5 + Math.random() * 3;
    this.lastHitAt = -99;
    this.engaged = false;
    this.leashR = (tpl.leash || 12) * TILE;
    if (opts.leashR) this.leashR = opts.leashR;

    // hazır sprite paketi (ör. mon_ore_priest) varsa onu, yoksa procedural dokuyu kullan
    this.pack = spritePack(tpl.packId || 'mon_' + tpl.id);
    const key = this.pack ? this.pack.id : 'mon_' + tpl.sprite;
    const c = scene.add.container(x, y);
    this.shadow = scene.add.image(0, 0, 'obj_shadow').setScale(Math.max(1, tpl.radius * 3.2), Math.max(1, tpl.radius * 2.6)).setAlpha(0.6);
    if (this.pack) this.sprite = scene.add.sprite(0, tpl.flying ? -8 : 0, `${key}:idle`, 0).setOrigin(this.pack.ox, this.pack.oy);
    else {
      this.sprite = scene.add.sprite(0, tpl.flying ? -8 : 0, key, 'idle0').setOrigin(0.5, 1);
      this.sprite.setScale(SCALE[tpl.sprite] || 1);
    }
    if (tpl.tint) this.sprite.setTint(tpl.tint);
    this.baseTint = tpl.tint || null;
    this.sprite.play(key + '_idle');
    this.sprite.anims.setProgress(Math.random());
    c.add([this.shadow, this.sprite]);
    this.height = this.pack ? this.pack.body : this.sprite.displayHeight;
    // can çubuğu
    this.bar = scene.add.graphics();
    c.add(this.bar);
    if (tpl.kind === 'elite' || tpl.kind === 'boss' || tpl.kind === 'hunt') {
      const col = tpl.kind === 'boss' ? '#ff9a4a' : tpl.kind === 'hunt' ? '#ffd060' : '#d890ff';
      this.label = scene.add.text(0, -this.height - 14, tpl.name, { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '11px', fontStyle: 'bold', color: col, stroke: '#000', strokeThickness: 3 }).setOrigin(0.5, 1);
      c.add(this.label);
    }
    this.container = c;
    this.animKey = key;
    // ayrı darbe alma animasyonu: V2 procedural yaratıklar ve hurt şeridi olan hazır paketler (sıçan, yarasa…)
    this.hasHurt = scene.anims.exists(key + '_hurt');
    this.hurtUntil = 0;
    this.behavior = makeBossBehavior(this);
    this.drawBar();
  }

  get alive() { return !this.dead; }
  get tileRange() { return this.tpl.attackRange * TILE; }

  drawBar() {
    const g = this.bar;
    g.clear();
    const show = this.hp < this.maxHp || this.scene.player?.target === this;
    if (!show || this.dead || this.tpl.kind === 'boss') return;
    const w = Math.max(28, Math.min(54, this.radius * 3));
    const y = -this.height - 6;
    g.fillStyle(0x000000, 0.7).fillRect(-w / 2 - 1, y - 1, w + 2, 6);
    const col = this.tpl.kind === 'elite' ? 0xc070ff : 0xe04040;
    g.fillStyle(col, 1).fillRect(-w / 2, y, w * Math.max(0, this.hp / this.maxHp), 4);
    if (this.reduce > 0.5) g.lineStyle(1, 0x5ae0ff).strokeRect(-w / 2 - 1, y - 1, w + 2, 6);
  }

  setFacing(dx) {
    if (Math.abs(dx) < 0.5) return;
    this.facing = dx > 0 ? 1 : -1;
    // paket kareleri ayak noktasına göre hizalı: flipX görüntüyü kaydırır, orijin etrafında aynala
    if (this.pack) this.sprite.scaleX = this.facing;
    else this.sprite.setFlipX(this.facing < 0);
  }

  playAnim(name) {
    if (name !== 'atk' && this.scene.clock < this.hurtUntil) return;
    const k = this.animKey + '_' + name;
    if (this.sprite.anims.currentAnim?.key !== k || (name === 'atk')) this.sprite.play(k, name !== 'atk');
  }

  speed() {
    const now = this.scene.clock;
    let s = this.tpl.speed * TILE * this.speedMult;
    if (now < this.slowUntil) s *= 1 - this.slowPct;
    return s;
  }

  isSlowed() { return this.scene.clock < this.slowUntil; }

  distTo(p) { return Math.hypot(p.x - this.x, p.y - this.y); }

  canSee(p) { return this.scene.grid.los(this.x, this.y - 4, p.x, p.y - 4); }

  aggro(p, alertPack = true) {
    if (this.dead || this.state === 'return' || this.tpl.ai === 'static') return;
    if (this.state === 'idle') { this.state = 'chase'; this.engaged = true; }
    // Sürü çağırma: yakındaki (5 tile) en çok 2 aynı tür yardımcı
    if (alertPack && (this.tpl.ai === 'pack')) {
      const near = this.scene.enemies
        .filter((e) => e !== this && !e.dead && e.tpl.id === this.tpl.id && e.state === 'idle' && e.distTo(this) < 5 * TILE)
        .sort((a, b) => a.distTo(this) - b.distTo(this)).slice(0, 2);
      for (const e of near) e.aggro(p, false);
    }
  }

  onDamaged() {
    this.lastHitAt = this.scene.clock;
    if (this.state === 'idle') this.aggro(this.scene.player);
    if (this.hasHurt && !this.windup && !this.casting && this.tpl.kind !== 'boss') {
      this.sprite.play(this.animKey + '_hurt');
      this.hurtUntil = this.scene.clock + 180;
    }
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => { if (!this.dead) { this.sprite.clearTint(); if (this.baseTint) this.sprite.setTint(this.baseTint); if (this.furyTint) this.sprite.setTint(this.furyTint); } });
    if (this.tpl.kind !== 'boss' && this.tpl.ai !== 'static') {
      const p = this.scene.player;
      const a = Math.atan2(this.y - p.y, this.x - p.x);
      this.scene.grid.move(this, Math.cos(a) * 3, Math.sin(a) * 3);
    }
    this.drawBar();
  }

  // --------------------------------------------------------------- ana döngü
  update(dt) {
    if (this.dead) return;
    const sc = this.scene;
    const p = sc.player;
    const now = sc.clock;
    if (this.behavior?.update(dt, p)) { this.sync(); return; }
    if (now < this.stunUntil) { this.sync(); return; }
    if (this.windup) {
      this.windup.t -= dt;
      if (this.windup.t <= 0) { const w = this.windup; this.windup = null; w.fn(); }
      this.sync();
      return;
    }
    if (this.casting) { this.casting.t -= dt; if (this.casting.t <= 0) { const c = this.casting; this.casting = null; c.fn(); } this.sync(); return; }

    // V3: görev olayı yaratığı korunan hedefe saldırır; oyuncu ona vurup yakında kalırsa oyuncuya döner
    const obj = this.objective;
    if (obj && !obj.dead && obj.running && !(now - this.lastHitAt < 3500 && p && !p.dead && this.distTo(p) < 4.5 * TILE)) {
      this.updateVsObjective(dt, obj);
      this.sync();
      return;
    }

    const ai = this.tpl.ai;
    const pAlive = p && !p.dead;
    const pSafe = pAlive && sc.isSafeAt(p.x, p.y);
    const dP = pAlive ? this.distTo(p) : Infinity;
    const dHome = Math.hypot(this.x - this.home.x, this.y - this.home.y);

    if (ai === 'static') { this.sync(); return; }
    // süreli çağrılar (Sürü Kurdu) ömrü dolunca dağılır
    if (this.summoned && this.tpl.lifetime) {
      this.age = (this.age || 0) + dt;
      if (this.age > this.tpl.lifetime) { sc.fx.burst(this.x, this.y - 10, 0xb0a090, 10, 80, 400); sc.spawner.despawn(this); return; }
    }

    switch (this.state) {
      case 'idle': {
        // aggro
        if (pAlive && !pSafe && ai !== 'passive' && dP < this.tpl.aggro * TILE && this.canSee(p)) { this.aggro(p); break; }
        this.wanderTimer -= dt;
        if (this.wanderTimer <= 0) {
          this.wanderTimer = 2 + Math.random() * 4;
          const a = Math.random() * Math.PI * 2, r = Math.random() * 2.2 * TILE;
          this.wanderGoal = { x: this.home.x + Math.cos(a) * r, y: this.home.y + Math.sin(a) * r };
        }
        if (this.wanderGoal) {
          const moved = this.moveToward(this.wanderGoal.x, this.wanderGoal.y, dt, 0.45);
          if (!moved || Math.hypot(this.wanderGoal.x - this.x, this.wanderGoal.y - this.y) < 4) { this.wanderGoal = null; this.playAnim('idle'); }
        } else this.playAnim('idle');
        break;
      }
      case 'chase':
      case 'attack': {
        if (!pAlive || pSafe || dHome > this.leashR || (dP > (this.tpl.aggro + 9) * TILE && now - this.lastHitAt > 4000)) { this.startReturn(); break; }
        this.updateAbility(dt, p, dP);
        if (this.casting || this.windup) break;
        // V4: iskelet vurduysa kısa süre (3 sn) ona yönelebilir — yalnız normal saldırı; yetenekler hep oyuncuya
        const tg = this.taunt && !this.taunt.dead && now < this.tauntUntil && this.tpl.kind !== 'boss' ? this.taunt : p;
        if (tg === p) this.taunt = null;
        const dT = tg === p ? dP : this.distTo(tg);
        const range = this.tileRange + tg.radius * 0.5;
        const see = this.canSee(tg);
        // V3 Gölge Avcısı: vurduktan sonra kısa süre geri çekilir, sonra yeniden atılır
        if (ai === 'skirmish' && now < (this.retreatUntil || 0)) {
          const a = Math.atan2(this.y - p.y, this.x - p.x);
          const ok = this.scene.grid.move(this, Math.cos(a) * this.speed() * 1.1 * dt, Math.sin(a) * this.speed() * 1.1 * dt);
          if (ok) { this.playAnim('walk'); this.setFacing(p.x - this.x); this.attackTimer -= dt; break; }
          this.retreatUntil = 0;
        }
        if (ai === 'ranged' && dP < 2.4 * TILE && see) {
          // geri çekil
          const a = Math.atan2(this.y - p.y, this.x - p.x);
          const ok = this.scene.grid.move(this, Math.cos(a) * this.speed() * 0.8 * dt, Math.sin(a) * this.speed() * 0.8 * dt);
          if (ok) { this.playAnim('walk'); this.setFacing(p.x - this.x); this.attackTimer -= dt * 0.5; break; }
        }
        if (dT <= range && see) {
          this.state = 'attack';
          this.setFacing(tg.x - this.x);
          this.attackTimer -= dt;
          if (this.attackTimer <= 0) {
            this.attackTimer = this.tpl.attackInterval * this.atkMult;
            this.doAttack(tg);
            if (ai === 'skirmish' && Math.random() < 0.5) this.retreatUntil = now + 700 + Math.random() * 400;
          } else if (!this.sprite.anims.isPlaying || this.sprite.anims.currentAnim?.key.endsWith('_walk')) this.playAnim('idle');
        } else {
          this.state = 'chase';
          this.attackTimer = Math.max(this.attackTimer, 0.35);
          this.chase(tg, dt, see);
        }
        break;
      }
      case 'return': {
        // çağrılan yaratıklar (Sürü Kurdu vb.) savaş bitince dağılır; haritada kalıcı tehlike bırakmaz
        if (this.summoned && this.tpl.ai !== 'static') { sc.spawner.despawn(this); return; }
        // büyük gövdeler ev noktasına tam oturamayabilir: 7 sn sonra eve yerleştir (sonsuz dönüş yok)
        this.returnT = (this.returnT || 0) + dt;
        if (this.returnT > 7) { this.x = this.home.x; this.y = this.home.y; }
        const done = Math.hypot(this.home.x - this.x, this.home.y - this.y) < Math.max(8, this.radius);
        if (done) {
          this.returnT = 0;
          this.state = 'idle'; this.hp = this.maxHp; this.engaged = false; this.path = null;
          this.behavior?.reset?.();
          this.drawBar();
        } else {
          this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.2 * dt);
          if (!this.followPathTo(this.home.x, this.home.y, dt, 1.4)) {
            // sıkıştı: eve ışınlan
            this.x = this.home.x; this.y = this.home.y;
          }
          this.drawBar();
        }
        break;
      }
      default: break;
    }
    this.sync();
  }

  // Korunan hedefe yürü ve saldır (görev olayı yaratıkları)
  updateVsObjective(dt, obj) {
    const sc = this.scene;
    const d = Math.hypot(obj.x - this.x, obj.y - this.y) - obj.radius;
    const range = this.tpl.projectile ? Math.min(this.tileRange, 4 * TILE) : this.tileRange;
    if (d > range) {
      if (!this.followPathTo(obj.x, obj.y, dt, 1)) this.moveToward(obj.x, obj.y, dt, 1);
      return;
    }
    this.setFacing(obj.x - this.x);
    this.attackTimer -= dt;
    if (this.attackTimer > 0) { if (!this.sprite.anims.isPlaying || this.sprite.anims.currentAnim?.key.endsWith('_walk')) this.playAnim('idle'); return; }
    this.attackTimer = this.tpl.attackInterval * this.atkMult;
    this.playAnim('atk');
    this.windup = { t: 0.28, fn: () => {
      if (this.dead || obj.dead || !obj.running) return;
      const dmg = Math.max(1, Math.round(this.atk * (this.tpl.normalCoef ?? 1) * (0.45 + Math.random() * 0.15)));
      if (this.tpl.projectile) sc.combat.projectile(this, obj, this.tpl.projectile, 300, () => obj.takeHit(dmg, this));
      else obj.takeHit(dmg, this);
    } };
  }

  sync() {
    this.container.setPosition(Math.round(this.x), Math.round(this.y));
    this.container.setDepth(100 + this.y);
  }

  startReturn() {
    this.state = 'return';
    this.returnT = 0;
    this.casting = null; this.windup = null;
    this.path = null;
    this.engaged = false;
  }

  chase(p, dt, see) {
    // doğrudan yürünebiliyorsa düz git; değilse yol bul
    if (see && this.scene.grid.walkLine(this.x, this.y, p.x, p.y, this.radius * 0.8)) {
      this.path = null;
      this.moveToward(p.x, p.y, dt, 1);
    } else if (!this.followPathTo(p.x, p.y, dt, 1)) {
      this.moveToward(p.x, p.y, dt, 1);
    }
  }

  moveToward(tx, ty, dt, mult = 1) {
    const dx = tx - this.x, dy = ty - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 1) return false;
    const step = Math.min(d, this.speed() * mult * dt);
    const moved = this.scene.grid.move(this, dx / d * step, dy / d * step);
    this.setFacing(dx);
    if (moved) this.playAnim('walk');
    return moved;
  }

  followPathTo(tx, ty, dt, mult) {
    this.pathTimer -= dt;
    if (!this.path || this.pathTimer <= 0) {
      if (this.scene.pathBudget <= 0) { return !!this.path; }
      this.scene.pathBudget--;
      this.path = this.scene.grid.findPath(this.x, this.y, tx, ty, 900);
      this.pathTimer = 0.7 + Math.random() * 0.3;
      if (!this.path) return false;
    }
    if (!this.path.length) return this.moveToward(tx, ty, dt, mult);
    const n = this.path[0];
    if (Math.hypot(n.x - this.x, n.y - this.y) < 6) { this.path.shift(); return true; }
    return this.moveToward(n.x, n.y, dt, mult) || true;
  }

  doAttack(p) {
    const sc = this.scene;
    this.playAnim('atk');
    if (p.kind === 'minion') {
      // V4: iskelete normal saldırı (telegrafsız; zehir/yavaşlatma uygulanmaz)
      const coef = this.tpl.normalCoef ?? 1;
      this.windup = { t: this.tpl.projectile ? 0.3 : 0.28, fn: () => {
        if (this.dead || p.dead) return;
        if (this.tpl.projectile) sc.combat.projectile(this, p, this.tpl.projectile, 300, () => sc.combat.enemyHitsMinion(this, p, { coef }));
        else if (this.distTo(p) <= this.tileRange * 1.25 + p.radius) sc.combat.enemyHitsMinion(this, p, { coef });
      } };
      return;
    }
    if (this.tpl.projectile) {
      this.windup = {
        t: 0.3, fn: () => {
          if (this.dead || p.dead) return;
          sc.combat.enemyProjectile(this, p, this.tpl.projectile);
        },
      };
    } else {
      this.windup = {
        t: 0.28, fn: () => {
          if (this.dead || p.dead) return;
          if (this.distTo(p) <= this.tileRange * 1.25 + p.radius && this.canSee(p)) {
            sc.combat.enemyHitsPlayer(this, { coef: this.tpl.normalCoef ?? 1, isNormal: true });
            if (this.tpl.poison && Math.random() < this.tpl.poison.chance) sc.combat.poisonPlayer(this, this.tpl.poison);
            if (this.tpl.slow && Math.random() < this.tpl.slow.chance) sc.combat.slowPlayer(this.tpl.slow.pct, this.tpl.slow.dur);
          }
        },
      };
    }
  }

  // --------------------------------------------------------------- elit yetenekleri (telegraflı)
  updateAbility(dt, p, dP) {
    if (!this.tpl.abilities) return;
    if (this.tpl.kind === 'normal' || this.tpl.kind === 'hunt') { this.updateNormalAbility(dt, p, dP); return; }
    if (this.tpl.kind !== 'elite') return;
    // Öfke (Kül Kasabı): düşük canda daha hızlı saldırır ve koşar
    const en = this.tpl.enrage;
    if (en && !this.enraged && this.hp < this.maxHp * en.below) {
      this.enraged = true;
      this.atkMult = en.atkSpd; this.speedMult = en.speed;
      this.furyTint = 0xff8a6a; this.sprite.setTint(this.furyTint);
      this.scene.fx.text(this.x, this.y - this.height - 10, 'ÖFKE!', { color: '#ff8a4a', size: 16 });
      sound.play('roar');
    }
    this.abilityCd -= dt;
    if (this.abilityCd > 0) return;
    const ab = this.tpl.abilities[0];
    const sc = this.scene;
    if (ab === 'shroud_dash' || ab === 'obsidian_quake') { this.updateEliteV3(ab, p, dP); return; }
    if (V4_ELITE_ABILITIES.has(ab)) { eliteAbilityV4(this, ab, p, dP); return; }
    if (ab === 'spin_slash' && dP < 3 * TILE) {
      this.abilityCd = 9;
      const r = 2.6 * TILE, dur = 1300;
      sc.fx.telegraph({ kind: 'circle', x: this.x, y: this.y, r }, dur);
      sound.play('warn');
      this.playAnim('atk');
      this.casting = { t: dur / 1000, fn: () => {
        if (this.dead) return;
        sc.fx.sprite('slash', this.x, this.y - 10, { scale: 2.6 });
        sc.fx.sprite('slash', this.x, this.y - 10, { scale: 2.6, rotation: Math.PI });
        sound.play('swing');
        if (!p.dead && inTelegraphCircle(p.x, p.y, this.x, this.y, r)) sc.combat.enemyHitsPlayer(this, { coef: 1.5, label: 'Kasırga' });
      } };
    } else if (ab === 'crystal_beam' && dP < 8 * TILE) {
      this.abilityCd = 8;
      const ang = Math.atan2(p.y - this.y, p.x - this.x), len = 7 * TILE, w = 1.3 * TILE, dur = 1400;
      const ox = this.x, oy = this.y - 10;
      sc.fx.telegraph({ kind: 'rect', x: ox, y: oy, len, width: w, angle: ang }, dur);
      sound.play('warn');
      this.casting = { t: dur / 1000, fn: () => {
        if (this.dead) return;
        const beam = sc.add.image(ox, oy, 'tg_rect').setOrigin(0, 0.5).setRotation(ang).setDisplaySize(len, w * 0.6).setTint(0xff4030).setDepth(60000).setBlendMode(Phaser.BlendModes.ADD);
        sc.tweens.add({ targets: beam, alpha: 0, duration: 350, onComplete: () => beam.destroy() });
        sound.play('bolt');
        if (!p.dead && pointInBeam(p.x, p.y - 8, ox, oy, ang, len, w)) sc.combat.enemyHitsPlayer(this, { coef: 1.7, dmgType: 'magic', label: 'Kristal Işını' });
      } };
    } else if (ab === 'execution_cleave' && dP < 4 * TILE) {
      this.abilityCd = 10;
      const ang = Math.atan2(p.y - this.y, p.x - this.x), r = 3.6 * TILE, dur = 1500;
      sc.fx.telegraph({ kind: 'cone', x: this.x, y: this.y - 6, r, angle: ang }, dur);
      sound.play('warn');
      this.casting = { t: dur / 1000, fn: () => {
        if (this.dead) return;
        this.playAnim('atk');
        sc.fx.sprite('slash', this.x + Math.cos(ang) * 30, this.y - 10 + Math.sin(ang) * 30, { scale: 3, rotation: ang });
        sound.play('slam'); sc.fx.shake(0.006, 160);
        const dx = p.x - this.x, dy = p.y - this.y, d = Math.hypot(dx, dy);
        const da = Math.abs(Phaser.Math.Angle.Wrap(Math.atan2(dy, dx) - ang));
        if (!p.dead && d <= r && da <= Math.PI / 3) {
          sc.combat.enemyHitsPlayer(this, { coef: 2.0, label: 'İnfaz' });
          sc.combat.poisonPlayer(this, this.tpl.poison);
        }
      } };
    } else if (ab === 'butcher_cleave' && dP < 4.2 * TILE) {
      // geniş ön yarım ay kesik + arkasında kısa süreli ateş izi
      this.abilityCd = this.enraged ? 7 : 9;
      const ang = Math.atan2(p.y - this.y, p.x - this.x), r = 3.8 * TILE, dur = this.enraged ? 1250 : 1450;
      const half = Math.PI / 3;   // tg_cone dokusunun açısı (çizim = isabet alanı)
      sc.fx.telegraph({ kind: 'cone', x: this.x, y: this.y - 6, r, angle: ang }, dur);
      sound.play('warn');
      this.casting = { t: dur / 1000, fn: () => {
        if (this.dead) return;
        this.playAnim('atk');
        sc.fx.sprite('slash', this.x + Math.cos(ang) * 34, this.y - 10 + Math.sin(ang) * 34, { scale: 3.4, rotation: ang, tint: 0xffa060 });
        sound.play('slam'); sc.fx.shake(0.007, 180);
        const dx = p.x - this.x, dy = p.y - this.y, d = Math.hypot(dx, dy);
        const da = Math.abs(Phaser.Math.Angle.Wrap(Math.atan2(dy, dx) - ang));
        if (!p.dead && d <= r && da <= half) sc.combat.enemyHitsPlayer(this, { coef: 1.9, label: 'Kasap Satırı' });
        // ateş izi: kesik yönünde 3 kısa alev (2,5 sn, sn başına küçük hasar)
        for (let i = 1; i <= 3; i++) {
          const fx = this.x + Math.cos(ang) * i * TILE * 1.1, fy = this.y + Math.sin(ang) * i * TILE * 1.1;
          sc.combat.groundHazard({ x: fx, y: fy, r: 0.75 * TILE, dur: 2.5, tick: 0.5, coef: 0.18, src: this, key: 'fire_ground', label: 'Ateş izi' });
        }
      } };
    } else if (ab === 'ice_slam' && dP < 7 * TILE) {
      // yakında: buz yere vuruşu (çember, kısa yavaşlatma); uzakta: oyuncunun üstüne düşen buz kıymıkları
      this.abilityCd = 8.5;
      if (dP < 3.2 * TILE) {
        const r = 3 * TILE, dur = 1500;
        sc.fx.telegraph({ kind: 'circle', x: this.x, y: this.y, r }, dur);
        sound.play('warn');
        this.casting = { t: dur / 1000, fn: () => {
          if (this.dead) return;
          this.playAnim('atk');
          sc.fx.sprite('shatter', this.x, this.y - 6, { scale: 3.2 });
          sound.play('slam'); sc.fx.shake(0.008, 200);
          if (!p.dead && inTelegraphCircle(p.x, p.y, this.x, this.y, r)) {
            sc.combat.enemyHitsPlayer(this, { coef: 1.8, label: 'Buz Vuruşu' });
            sc.combat.slowPlayer(0.35, 1.5);
          }
        } };
      } else {
        sound.play('warn');
        this.playAnim('atk');
        const shards = [[0, 0], [1.4, 0.6], [-1.3, 0.7]];
        for (const [ox, oy] of shards) {
          const tx = p.x + ox * TILE, ty = p.y + oy * TILE;
          sc.combat.fallingShard({ x: tx, y: ty, r: 0.95 * TILE, delay: 1.4, coef: 1.1, src: this });
        }
        this.casting = { t: 0.6, fn: () => {} };
      }
    } else {
      this.abilityCd = 1.5;
    }
  }

  // ------------------------------------------------- V3 normal yaratık yetenekleri (hepsi telegraflı, ≥0,8 sn)
  updateNormalAbility(dt, p, dP) {
    this.abilityCd -= dt;
    if (this.abilityCd > 0) return;
    const sc = this.scene, ab = this.tpl.abilities[0];
    if (V4_NORMAL_ABILITIES.has(ab)) { normalAbilityV4(this, ab, p, dP); return; }
    if (ab === 'grave_curse' && dP < 6 * TILE && this.canSee(p)) {
      // Mezar Büyücüsü: oyuncunun altına küçük alan büyüsü; isabette kısa lanet (alınan hasar +%12, 4 sn)
      this.abilityCd = 10 + Math.random() * 2;
      const x = p.x, y = p.y, r = 1.6 * TILE, dur = 1200;
      sc.fx.telegraph({ kind: 'circle', x, y, r }, dur, 0xa070e0);
      this.playAnim('atk');
      this.casting = { t: dur / 1000, fn: () => {
        if (this.dead) return;
        sc.fx.sprite('spirit', x, y - 10, { scale: 1.8, tint: 0xa070e0 });
        sound.play('bolt', { vol: 0.6 });
        if (!p.dead && inTelegraphCircle(p.x, p.y, x, y, r)) {
          sc.combat.enemyHitsPlayer(this, { coef: 1.1, dmgType: 'magic', label: 'Mezar Laneti' });
          sc.combat.cursePlayer(0.12, 4);
        }
      } };
    } else if (ab === 'heavy_slam' && dP < 2.6 * TILE) {
      // Obsidyen Nöbetçi: yavaş ama ağır yer darbesi (kendi çevresinde)
      this.abilityCd = 9 + Math.random() * 2;
      const r = 2.2 * TILE, dur = 1300;
      sc.fx.telegraph({ kind: 'circle', x: this.x, y: this.y, r }, dur, this.tpl.abilityTint ?? 0xa070e0);
      sound.play('warn', { vol: 0.5 });
      this.casting = { t: dur / 1000, fn: () => {
        if (this.dead) return;
        this.playAnim('atk');
        sc.fx.sprite('shatter', this.x, this.y - 6, { scale: 2.4, tint: this.tpl.abilityTint ?? 0x8a6ab0 });
        sound.play('slam'); sc.fx.shake(0.005, 140);
        if (!p.dead && inTelegraphCircle(p.x, p.y, this.x, this.y, r)) sc.combat.enemyHitsPlayer(this, { coef: 1.5, label: this.tpl.abilityLabel || 'Obsidyen Darbe' });
      } };
    } else if (ab === 'shadow_dash' && dP > 2.6 * TILE && dP < 7 * TILE && this.canSee(p)) {
      // Gölge Avcısı: hedefe hızlı atılış (hat telegrafı), ardından geri çekilme
      this.abilityCd = 7 + Math.random() * 2;
      this.dashAt(p, { len: Math.min(dP + TILE, 7.5 * TILE), w: 1.1 * TILE, dur: 800, coef: 1.25, label: this.tpl.abilityLabel || 'Gölge Atılışı', tint: this.tpl.abilityTint ?? 0xa070e0 });
      this.retreatUntil = sc.clock + 800 + 900;
    } else if (ab === 'throne_cleave' && dP < 3.5 * TILE) {
      // Taht Celladı: uyarılı geniş ön yarma
      this.abilityCd = 9 + Math.random() * 2;
      const ang = Math.atan2(p.y - this.y, p.x - this.x), r = 3.2 * TILE, dur = 1400;
      sc.fx.telegraph({ kind: 'cone', x: this.x, y: this.y - 6, r, angle: ang }, dur, 0xff5050);
      sound.play('warn', { vol: 0.5 });
      this.casting = { t: dur / 1000, fn: () => {
        if (this.dead) return;
        this.playAnim('atk');
        sc.fx.sprite('slash', this.x + Math.cos(ang) * 30, this.y - 10 + Math.sin(ang) * 30, { scale: 2.8, rotation: ang, tint: 0xc8a0ff });
        sound.play('slam'); sc.fx.shake(0.005, 140);
        const dx = p.x - this.x, dy = p.y - this.y, d = Math.hypot(dx, dy);
        const da = Math.abs(Phaser.Math.Angle.Wrap(Math.atan2(dy, dx) - ang));
        if (!p.dead && d <= r && da <= Math.PI / 3) sc.combat.enemyHitsPlayer(this, { coef: 1.7, label: 'Taht Yarması' });
      } };
    } else if (ab === 'void_ward' && this.hp < this.maxHp * 0.85) {
      // Hiçlik Rahibi: kısa süreli hasar azaltma (3 sn, %35) — görünür mor halka; zincirlenmez
      this.abilityCd = 12 + Math.random() * 3;
      this.casting = { t: 0.4, fn: () => {
        if (this.dead) return;
        this.reduce = 0.35;
        this.furyTint = 0xc8a0ff; this.sprite.setTint(this.furyTint);
        sc.fx.text(this.x, this.y - this.height - 10, this.tpl.abilityLabel || 'Hiçlik Kalkanı', { color: '#c8a0ff', size: 12 });
        sound.play('shield', { vol: 0.5 });
        this.drawBar();
        sc.time.delayedCall(3000, () => { if (this.dead) return; this.reduce = 0; this.furyTint = null; this.sprite.clearTint(); this.drawBar(); });
      } };
    } else {
      this.abilityCd = 1.2;
    }
  }

  // Hat telegrafı ardından düz hatta atılış; telegraf dikdörtgeni = isabet alanı
  dashAt(p, { len, w, dur, coef, label, tint, curse = 0, slow = 0 }) {
    const sc = this.scene;
    const ang = Math.atan2(p.y - this.y, p.x - this.x), ox = this.x, oy = this.y - 10;
    sc.fx.telegraph({ kind: 'rect', x: ox, y: oy, len, width: w, angle: ang }, dur, tint);
    sound.play('warn', { vol: 0.5 });
    this.setFacing(Math.cos(ang));
    this.casting = { t: dur / 1000, fn: () => {
      if (this.dead) return;
      this.playAnim('atk');
      // duvara kadar (veya hat sonuna kadar) kay
      const steps = 12, dx = Math.cos(ang) * len / steps, dy = Math.sin(ang) * len / steps;
      for (let i = 0; i < steps; i++) if (!sc.grid.move(this, dx, dy)) break;
      sc.fx.sprite('slash', this.x, this.y - 12, { scale: 1.8, rotation: ang, tint });
      sound.play('swing');
      if (!p.dead && pointInBeam(p.x, p.y - 8, ox, oy, ang, len, w)) {
        sc.combat.enemyHitsPlayer(this, { coef, label });
        if (curse) sc.combat.cursePlayer(curse, 4);
        if (slow) sc.combat.slowPlayer(slow, 1.5);
      }
    } };
  }

  // ------------------------------------------------- V3 elit yetenekleri
  updateEliteV3(ab, p, dP) {
    const sc = this.scene;
    this.v3n = (this.v3n || 0) + 1;
    if (ab === 'shroud_dash') {
      // Kefen Avcısı: uzaktan hızlı yaklaşma (+lanet); yakında tırpan savurması; %30 altı öfke → güçlü Kefen Biçişi
      if (dP > 2.6 * TILE && dP < 8.5 * TILE && this.canSee(p)) {
        this.abilityCd = this.enraged ? 6 : 8;
        this.dashAt(p, { len: Math.min(dP + TILE, 8.5 * TILE), w: 1.3 * TILE, dur: 900, coef: 1.4, label: 'Kefen Atılışı', tint: 0xc0b8a8, curse: 0.15 });
      } else if (dP <= 3.2 * TILE) {
        this.abilityCd = this.enraged ? 6.5 : 9;
        const strong = this.enraged;
        const r = (strong ? 3 : 2.5) * TILE, dur = strong ? 1300 : 1200;
        sc.fx.telegraph({ kind: 'circle', x: this.x, y: this.y, r }, dur, strong ? 0xff5050 : 0xc0b8a8);
        sound.play('warn');
        if (strong) sc.fx.text(this.x, this.y - this.height - 10, 'Kefen Biçişi!', { color: '#ff8a8a', size: 14 });
        this.casting = { t: dur / 1000, fn: () => {
          if (this.dead) return;
          this.playAnim('atk');
          sc.fx.sprite('slash', this.x, this.y - 10, { scale: 2.6 }); sc.fx.sprite('slash', this.x, this.y - 10, { scale: 2.6, rotation: Math.PI });
          sound.play('swing');
          if (!p.dead && inTelegraphCircle(p.x, p.y, this.x, this.y, r)) {
            sc.combat.enemyHitsPlayer(this, { coef: strong ? 2.2 : 1.5, label: strong ? 'Kefen Biçişi' : 'Tırpan' });
            sc.combat.cursePlayer(0.15, 4);
          }
        } };
      } else this.abilityCd = 1.2;
      return;
    }
    // Obsidyen Celladı: sırayla geniş alan darbesi → obsidyen kırılması (düşen parçalar) → savunma yükseltme
    const step = this.v3n % 3;
    if (step === 1 && dP < 4.5 * TILE) {
      this.abilityCd = 8.5;
      const r = 4 * TILE, dur = 1600;
      sc.fx.telegraph({ kind: 'circle', x: this.x, y: this.y, r }, dur, 0xa070e0);
      sound.play('warn');
      this.casting = { t: dur / 1000, fn: () => {
        if (this.dead) return;
        this.playAnim('atk');
        sc.fx.sprite('shatter', this.x, this.y - 6, { scale: 3.6, tint: 0xa070e0 });
        sound.play('slam'); sc.fx.shake(0.009, 220);
        if (!p.dead && inTelegraphCircle(p.x, p.y, this.x, this.y, r)) sc.combat.enemyHitsPlayer(this, { coef: 1.8, label: 'Obsidyen Sarsıntısı' });
      } };
    } else if (step === 2 && dP < 9 * TILE) {
      this.abilityCd = 8;
      sound.play('warn');
      this.playAnim('atk');
      sc.fx.text(this.x, this.y - this.height - 10, 'Obsidyen Kırılması', { color: '#c8a0ff', size: 13 });
      for (const [ox, oy] of [[0, 0], [1.5, 0.7], [-1.4, 0.8], [0.2, -1.4]]) {
        sc.combat.fallingShard({ x: p.x + ox * TILE, y: p.y + oy * TILE, r: 0.95 * TILE, delay: 1.4, coef: 1.1, src: this, dark: true, label: 'Obsidyen Parçası' });
      }
      this.casting = { t: 0.6, fn: () => {} };
    } else if (step === 0) {
      this.abilityCd = 9;
      this.casting = { t: 0.5, fn: () => {
        if (this.dead) return;
        this.reduce = 0.3;
        this.furyTint = 0xb090e0; this.sprite.setTint(this.furyTint);
        sc.fx.text(this.x, this.y - this.height - 10, 'Obsidyen Zırh', { color: '#c8a0ff', size: 13 });
        sound.play('shield');
        this.drawBar();
        sc.time.delayedCall(5000, () => { if (this.dead) return; this.reduce = 0; this.furyTint = null; this.sprite.clearTint(); this.drawBar(); });
      } };
    } else this.abilityCd = 1.2;
  }

  die() {
    this.dead = true;
    this.bar.clear();
    this.behavior?.onDeath?.();
    this.label?.setVisible(false);
    this.shadow.setVisible(false);
    const sc = this.scene;
    if (this.tpl.deathFx === 'ash') sc.fx.sprite('ash_puff', this.x, this.y - 12, { scale: Math.max(1.5, this.radius / 10) });
    else if (this.tpl.deathFx === 'ice') sc.fx.sprite('shatter', this.x, this.y - 12, { scale: Math.max(1.5, this.radius / 10) });
    else if (this.tpl.deathFx === 'bone') sc.fx.sprite('ash_puff', this.x, this.y - 12, { scale: Math.max(1.5, this.radius / 10), tint: 0xe0d8c4 });
    else if (this.tpl.deathFx === 'void') sc.fx.sprite('shatter', this.x, this.y - 12, { scale: Math.max(1.5, this.radius / 10), tint: 0xa070e0 });
    else if (this.tpl.deathFx === 'storm') sc.fx.sprite('shatter', this.x, this.y - 12, { scale: Math.max(1.5, this.radius / 10), tint: 0x9ad0ff });
    else if (this.tpl.deathFx === 'astral') sc.fx.sprite('spirit', this.x, this.y - 12, { scale: Math.max(1.5, this.radius / 10), tint: 0xb0a0ff });
    if (!this.pack && sc.anims.exists(this.animKey + '_die')) {
      // V2: kendi ölüm animasyonu (küle/buza dağılma), ardından solma
      this.hurtUntil = 0;
      this.sprite.play(this.animKey + '_die');
      sc.tweens.add({ targets: this.sprite, alpha: 0, delay: 520, duration: 380, onComplete: () => this.destroy() });
      return;
    }
    if (this.pack) {
      // paketin ölüm animasyonu, ardından solarak kaybolur
      this.sprite.play(`${this.pack.id}_die`, false);
      sc.tweens.add({ targets: this.sprite, alpha: 0, delay: animDuration(this.pack.id, 'die') * 1000, duration: 400, onComplete: () => this.destroy() });
      return;
    }
    this.sprite.stop();
    sc.tweens.add({
      targets: this.sprite, angle: this.facing > 0 ? -80 : 80, alpha: 0, y: this.sprite.y + 4, duration: 550, ease: 'Quad.in',
      onComplete: () => this.destroy(),
    });
  }

  destroy() {
    this.container.destroy();
  }
}

// Daire telegrafları perspektif için dikeyde basık çizilir; isabet testi görünen elipsin aynısıdır
export function inTelegraphCircle(px, py, cx, cy, r) {
  const dx = (px - cx) / r, dy = (py - cy) / (r * TG_SQUASH);
  return dx * dx + dy * dy <= 1;
}

export function pointInBeam(px, py, ox, oy, ang, len, w) {
  const dx = px - ox, dy = py - oy;
  const along = dx * Math.cos(ang) + dy * Math.sin(ang);
  const perp = -dx * Math.sin(ang) + dy * Math.cos(ang);
  return along >= -8 && along <= len && Math.abs(perp) <= w / 2 + 6;
}
