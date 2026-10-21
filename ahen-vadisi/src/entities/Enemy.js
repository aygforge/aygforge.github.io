// Düşman varlığı: durum makinesi (boşta/kovala/saldır/dön), aggro, leash, menzilli kaçış, sürü çağırma,
// elit yetenekleri (telegraflı) ve boss davranış bağlantısı.
import Phaser from 'phaser';
import { TILE, TG_SQUASH } from '../data/constants.js';
import { sound } from '../audio/sound.js';
import { makeBossBehavior } from './bosses.js';
import { spritePack, animDuration } from '../art/spriteRuntime.js';

let NEXT_ID = 1;
const SCALE = { captain: 1.2, executioner: 1.35 };

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
    this.pack = spritePack('mon_' + tpl.id);
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
    if (tpl.kind === 'elite' || tpl.kind === 'boss') {
      const col = tpl.kind === 'boss' ? '#ff9a4a' : '#d890ff';
      this.label = scene.add.text(0, -this.height - 14, tpl.name, { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '11px', fontStyle: 'bold', color: col, stroke: '#000', strokeThickness: 3 }).setOrigin(0.5, 1);
      c.add(this.label);
    }
    this.container = c;
    this.animKey = key;
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
        const range = this.tileRange + p.radius * 0.5;
        const see = this.canSee(p);
        if (ai === 'ranged' && dP < 2.4 * TILE && see) {
          // geri çekil
          const a = Math.atan2(this.y - p.y, this.x - p.x);
          const ok = this.scene.grid.move(this, Math.cos(a) * this.speed() * 0.8 * dt, Math.sin(a) * this.speed() * 0.8 * dt);
          if (ok) { this.playAnim('walk'); this.setFacing(p.x - this.x); this.attackTimer -= dt * 0.5; break; }
        }
        if (dP <= range && see) {
          this.state = 'attack';
          this.setFacing(p.x - this.x);
          this.attackTimer -= dt;
          if (this.attackTimer <= 0) {
            this.attackTimer = this.tpl.attackInterval * this.atkMult;
            this.doAttack(p);
          } else if (!this.sprite.anims.isPlaying || this.sprite.anims.currentAnim?.key.endsWith('_walk')) this.playAnim('idle');
        } else {
          this.state = 'chase';
          this.attackTimer = Math.max(this.attackTimer, 0.35);
          this.chase(p, dt, see);
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
          }
        },
      };
    }
  }

  // --------------------------------------------------------------- elit yetenekleri (telegraflı)
  updateAbility(dt, p, dP) {
    if (this.tpl.kind !== 'elite' || !this.tpl.abilities) return;
    this.abilityCd -= dt;
    if (this.abilityCd > 0) return;
    const ab = this.tpl.abilities[0];
    const sc = this.scene;
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
    } else {
      this.abilityCd = 1.5;
    }
  }

  die() {
    this.dead = true;
    this.bar.clear();
    this.behavior?.onDeath?.();
    this.label?.setVisible(false);
    this.shadow.setVisible(false);
    const sc = this.scene;
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
