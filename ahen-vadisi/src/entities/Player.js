// Oyuncu varlığı — kilitli B kontrolü:
// Düşmana dokun → hedef seç → engel yoksa yol bularak yaklaş → menzile girince otomatik normal saldırı.
// Joystick hareketi otomatik yaklaşmayı anında keser; bırakınca kendiliğinden yeniden başlamaz.
// Hedef ölünce yeni hedef otomatik seçilmez. Aktif beceriler manueldir.
import Phaser from 'phaser';
import { app } from '../core/app.js';
import { bus } from '../core/events.js';
import { TILE, PLAYER_SPEED_TILES, POTION_CD, REGEN_DELAY, REGEN_HP_PCT, MP_REGEN_COMBAT, MP_REGEN_IDLE } from '../data/constants.js';
import { SKILLS, CLASS_SKILLS } from '../data/skills.js';
import { ITEMS } from '../data/items.js';
import { POTION_LIST } from '../data/materials.js';
import { countStack, removeStack } from '../systems/inventory.js';
import { ensurePlayerTexture } from '../scenes/textures.js';
import { handAnchor } from '../art/characters.js';
import { sound } from '../audio/sound.js';

const INTERACT_RANGE = 1.5 * TILE;
const APPROACH_TIMEOUT = 10;

export class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.kind = 'player';
    this.x = x; this.y = y;
    this.radius = 9;
    this.facing = 1;
    this.target = null;
    this.interact = null;
    this.approaching = false;
    this.path = null; this.pathTimer = 0;
    this.approachT = 0; this.progress = { t: 0, d: Infinity };
    this.attackTimer = 0;
    this.swing = null;      // { t, dur }
    this.busy = 0;          // animasyon kilidi (sn)
    this.gcd = 0;
    this.cooldowns = {};
    this.potionCd = { hp: 0, mp: 0 };
    this.buffs = {};        // ironSkin, manaShield, will, resonance: { until, value }
    this.castLog = [];
    this.icd = { crimson: 0, spirit: 0, will: 0, resonance: 0 };
    this.lastHurtAt = -99999; this.lastCombatAt = -99999;
    this.stunUntil = 0; this.slowUntil = 0; this.slowPct = 0;
    this.poison = null;
    this.dead = false;
    this.channel = null;
    this.moving = false;

    const c = scene.add.container(x, y);
    this.shadow = scene.add.image(0, 0, 'obj_shadow').setScale(1.4, 1.2).setAlpha(0.7);
    this.offhand = scene.add.image(0, 0, 'fx_px').setVisible(false);
    this.body = scene.add.sprite(0, 0, 'fx_px').setOrigin(0.5, 28.5 / 30);
    this.weapon = scene.add.image(0, 0, 'fx_px').setVisible(false);
    this.aura = scene.add.sprite(0, 6, 'fx_aura_iron', 0).setOrigin(0.5, 1).setVisible(false).setBlendMode(Phaser.BlendModes.ADD);
    c.add([this.shadow, this.offhand, this.body, this.weapon, this.aura]);
    this.container = c;
    this.refreshLook();
  }

  get char() { return app.char; }
  get stats() { return app.stats(); }
  get alive() { return !this.dead; }

  refreshLook() {
    const ch = this.char;
    const key = ensurePlayerTexture(this.scene, ch.cls, ch.equipment);
    this.texKey = key;
    this.body.setTexture(key, 'idle0');
    this.body.play(key + '_idle');
    const w = ch.equipment.weapon;
    if (w) {
      const tk = 'wpn_' + w.tid;
      const cd = this.scene.textures.get(tk).customData || { ox: 0.5, oy: 0.85 };
      this.weapon.setTexture(tk).setOrigin(cd.ox, cd.oy).setVisible(true);
      if (ITEMS[w.tid].rarity === 'L') this.weapon.setTint(0xffffff);
    } else this.weapon.setVisible(false);
    const o = ch.equipment.offhand;
    if (o) this.offhand.setTexture('off_' + o.tid).setVisible(true);
    else this.offhand.setVisible(false);
  }

  // ---------------------------------------------------------------- girdiler
  selectTarget(enemy) {
    if (this.dead || !enemy || enemy.dead) return;
    if (this.target && this.target !== enemy) this.target.drawBar?.();
    this.target = enemy;
    this.interact = null;
    this.startApproach();
    enemy.drawBar();
    bus.emit('target', enemy);
  }

  selectInteract(obj) {
    if (this.dead) return;
    this.interact = obj;
    this.startApproach();
  }

  clearTarget() {
    const t = this.target;
    this.target = null;
    if (!this.interact) this.approaching = false;
    t?.drawBar?.();
    bus.emit('target', null);
  }

  startApproach() {
    this.approaching = true;
    this.path = null; this.pathTimer = 0;
    this.approachT = 0;
    this.progress = { t: 0, d: Infinity };
    this.cancelChannel();
  }

  stopApproach(msg) {
    this.approaching = false;
    this.path = null;
    if (msg) {
      bus.emit('toast', { text: msg, kind: 'warn' });
      sound.play('error');
      // erişilemeyen hedefin kilidini güvenle çöz
      if (this.interact) this.interact = null;
      else this.clearTarget();
    }
  }

  // ---------------------------------------------------------------- güncelleme
  update(dt) {
    if (this.dead) return;
    const sc = this.scene;
    const now = sc.clock;
    this._dt = dt;
    const st = this.stats;
    for (const k of Object.keys(this.cooldowns)) this.cooldowns[k] = Math.max(0, this.cooldowns[k] - dt);
    this.potionCd.hp = Math.max(0, this.potionCd.hp - dt);
    this.potionCd.mp = Math.max(0, this.potionCd.mp - dt);
    this.gcd = Math.max(0, this.gcd - dt);
    this.attackTimer = Math.max(0, this.attackTimer - dt);
    this.busy = Math.max(0, this.busy - dt);

    // hedef geçerliliği
    if (this.target && this.target.dead) { this.target = null; bus.emit('target', null); if (!this.interact) this.approaching = false; }

    const vec = sc.inputCtl.vector();
    const joy = Math.hypot(vec.x, vec.y) > 0.18;
    const stunned = now < this.stunUntil;
    let moved = false;
    let speed = PLAYER_SPEED_TILES * TILE * (now < this.slowUntil ? 1 - this.slowPct : 1);

    if (joy) {
      // Joystick en yüksek önceliktir: otomatik yaklaşma derhal iptal
      if (this.approaching) { this.approaching = false; this.path = null; this.interact = null; }
      this.cancelChannel();
      if (!stunned && !this.dashing) {
        const m = Math.min(1, Math.hypot(vec.x, vec.y));
        const n = Math.hypot(vec.x, vec.y);
        moved = sc.grid.move(this, vec.x / n * speed * m * dt, vec.y / n * speed * m * dt);
        this.face(vec.x);
      }
    } else if (this.approaching && !stunned && !this.dashing) {
      moved = this.updateApproach(dt, speed);
    }

    // normal saldırı döngüsü (hedef korunur; menzildeyse joystick sırasında da sürer)
    if (this.target && sc.autoAttack && !stunned && this.busy <= 0 && this.attackTimer <= 0 && !this.channel) {
      if (this.inAttackRange(this.target)) this.normalAttack(this.target);
    }

    // kanal (toplama / etkileşim)
    if (this.channel) {
      this.channel.t -= dt;
      bus.emit('channel', this.channel);
      if (this.channel.t <= 0) { const ch = this.channel; this.channel = null; bus.emit('channel', null); ch.done(); }
    }

    // animasyon
    this.moving = moved;
    if (this.busy <= 0 && !this.dead) {
      const want = moved ? '_walk' : '_idle';
      if (this.body.anims.currentAnim?.key !== this.texKey + want) this.body.play(this.texKey + want);
    }

    this.updateVitals(dt, now, st);
    this.updateBuffs(now);
    this.syncVisual(now);
  }

  updateApproach(dt, speed) {
    const sc = this.scene;
    const goal = this.interact || this.target;
    if (!goal || goal.dead || goal.gone) { this.approaching = false; return false; }
    const d = Math.hypot(goal.x - this.x, goal.y - this.y);
    this.approachT += dt;
    // menzil kontrolü
    if (this.interact) {
      const r = (goal.interactRange || INTERACT_RANGE);
      if (d <= r && sc.grid.los(this.x, this.y, goal.x, goal.y)) {
        this.approaching = false; this.path = null;
        this.face(goal.x - this.x);
        const obj = this.interact; this.interact = null;
        obj.interact(this);
        return false;
      }
    } else if (this.inAttackRange(goal)) {
      this.approaching = false; this.path = null;
      return false;
    }
    if (this.approachT > APPROACH_TIMEOUT) { this.stopApproach('Hedefe ulaşılamıyor'); return false; }
    // ilerleme kontrolü (sıkışma)
    this.progress.t += dt;
    if (this.progress.t > 1.6) {
      if (d > this.progress.d - 10) { this.stopApproach('Hedefe ulaşılamıyor'); return false; }
      this.progress = { t: 0, d };
    }
    // doğrudan yürünebiliyorsa düz git
    let tx = goal.x, ty = goal.y;
    if (!sc.grid.walkLine(this.x, this.y, goal.x, goal.y, this.radius)) {
      this.pathTimer -= dt;
      if (!this.path || this.pathTimer <= 0) {
        this.path = sc.grid.findPath(this.x, this.y, goal.x, goal.y, 3500);
        this.pathTimer = 0.5;
        if (!this.path) { this.stopApproach('Hedefe ulaşılamıyor'); return false; }
      }
      // kestirme: görünen en uzak düğüm
      while (this.path.length > 1 && sc.grid.walkLine(this.x, this.y, this.path[1].x, this.path[1].y, this.radius)) this.path.shift();
      const n = this.path[0];
      if (n) {
        tx = n.x; ty = n.y;
        if (Math.hypot(n.x - this.x, n.y - this.y) < 5) this.path.shift();
      }
    } else this.path = null;
    const dx = tx - this.x, dy = ty - this.y, dd = Math.hypot(dx, dy);
    if (dd < 0.5) return false;
    const step = Math.min(dd, speed * dt);
    this.face(dx);
    return sc.grid.move(this, dx / dd * step, dy / dd * step);
  }

  inAttackRange(t, extraTiles = 0) {
    const st = this.stats;
    const range = (st.attackRange + extraTiles) * TILE + (t.radius || 10);
    const d = Math.hypot(t.x - this.x, t.y - this.y);
    return d <= range && this.scene.grid.los(this.x, this.y - 6, t.x, t.y - 6);
  }

  face(dx) {
    if (Math.abs(dx) < 0.3) return;
    this.facing = dx > 0 ? 1 : -1;
  }

  // ---------------------------------------------------------------- saldırılar
  normalAttack(t) {
    const st = this.stats;
    this.attackTimer = st.attackInterval;
    this.face(t.x - this.x);
    this.lastCombatAt = this.scene.clock;
    if (st.damageType === 'phys') {
      this.playAction('_atk', 0.3);
      this.swing = { t: 0, dur: 0.26 };
      sound.play('swing');
      this.scene.time.delayedCall(140, () => {
        if (this.dead || t.dead) return;
        if (!this.inAttackRange(t, 0.4)) return;
        this.scene.combat.playerNormalHit(t);
      });
    } else {
      this.playAction('_cast', 0.25);
      this.scene.time.delayedCall(120, () => {
        if (this.dead || t.dead) return;
        sound.play('bolt');
        this.scene.combat.projectile(this, t, 'arcane_bolt', 520, () => this.scene.combat.playerNormalHit(t));
      });
    }
  }

  playAction(suffix, dur) {
    this.busy = dur;
    this.body.play(this.texKey + suffix, true);
  }

  skillCost(id) {
    const s = SKILLS[id], r = this.char.skills[id];
    let c = s.mp[r - 1] * (1 - this.stats.costRed);
    if (this.buffs.resonance && this.scene.clock < this.buffs.resonance.until) c *= 0.5;
    return Math.round(c);
  }

  useSkill(slot) {
    const sc = this.scene;
    const ch = this.char;
    const id = CLASS_SKILLS[ch.cls].actives[slot];
    const s = SKILLS[id];
    const rank = ch.skills[id] || 0;
    const fail = (m) => { bus.emit('toast', { text: m, kind: 'warn', short: true }); sound.play('error'); return false; };
    if (this.dead) return false;
    if (!rank) return fail(`${s.name} Lv.${s.unlock}'te açılır`);
    if (sc.clock < this.stunUntil) return fail('Sersemledin!');
    if (this.cooldowns[id] > 0) return fail(`${s.name} hazır değil`);
    if (this.gcd > 0 || this.busy > 0.05) return false;
    const cost = this.skillCost(id);
    if (ch.mp < cost) return fail('Yetersiz MP');
    const t = this.target && !this.target.dead ? this.target : null;
    const rangePx = (s.range || 0) * TILE + (t?.radius || 0);
    const dist = t ? Math.hypot(t.x - this.x, t.y - this.y) : Infinity;
    const los = t ? sc.grid.los(this.x, this.y - 6, t.x, t.y - 6) : false;
    if (s.target === 'single') {
      if (!t) return fail('Hedef yok');
      if (dist > rangePx) return fail('Menzil dışında');
      if (!los) return fail('Görüş engelli');
    }
    if (id === 'meteor' && !t) return fail('Hedef yok');
    if (s.target === 'ground' && t && (dist > rangePx || !los)) return fail(dist > rangePx ? 'Menzil dışında' : 'Görüş engelli');
    if (id === 'war_charge' && !this.chargeLine(t)) return fail('Atılma yolu kapalı');

    // kaynakları uygula
    ch.mp -= cost;
    this.cooldowns[id] = s.cd[rank - 1];
    this.gcd = 0.5;
    this.lastCombatAt = sc.clock;
    if (t) this.face(t.x - this.x);
    this.execSkill(id, s, rank, t);
    if (ch.cls === 'mage' && s.dmg) this.trackResonance();
    bus.emit('skillUsed', id);
    return true;
  }

  chargeLine(t) {
    const d = Math.hypot(t.x - this.x, t.y - this.y);
    const stop = Math.max(0, d - (t.radius + this.radius + 6));
    const ang = Math.atan2(t.y - this.y, t.x - this.x);
    const ex = this.x + Math.cos(ang) * stop, ey = this.y + Math.sin(ang) * stop;
    if (!this.scene.grid.walkLine(this.x, this.y, ex, ey, this.radius)) return null;
    return { ex, ey };
  }

  execSkill(id, s, rank, t) {
    const sc = this.scene;
    const coef = s.coef ? s.coef[rank - 1] : 1;
    switch (id) {
      case 'heavy_strike':
        this.playAction('_atk', 0.35);
        this.swing = { t: 0, dur: 0.3 };
        sound.play('swing');
        sc.time.delayedCall(150, () => {
          if (this.dead || t.dead) return;
          sc.fx.sprite('slash', t.x, t.y - 16, { scale: 1.6, rotation: this.facing > 0 ? 0 : Math.PI });
          sc.combat.playerSkillHit(t, { coef, skill: id });
          sc.fx.shake(0.003, 90);
        });
        break;
      case 'whirlwind':
        this.playAction('_atk', 0.4);
        this.swing = { t: 0, dur: 0.38, spin: true };
        sound.play('swing');
        sc.fx.sprite('slash', this.x, this.y - 14, { scale: 2.6 });
        sc.time.delayedCall(90, () => sc.fx.sprite('slash', this.x, this.y - 14, { scale: 2.6, rotation: Math.PI }));
        sc.time.delayedCall(170, () => {
          if (this.dead) return;
          const hits = sc.combat.enemiesInRadius(this.x, this.y, s.radius * TILE, s.maxTargets, true);
          hits.forEach((e) => sc.combat.playerSkillHit(e, { coef, skill: id }));
        });
        break;
      case 'iron_skin':
        this.playAction('_cast', 0.25);
        this.buffs.ironSkin = { until: sc.clock + s.dur[rank - 1] * 1000, value: s.reduce[rank - 1] };
        sound.play('shield');
        break;
      case 'war_charge': {
        const line = this.chargeLine(t);
        this.dashing = true;
        this.playAction('_atk', 0.35);
        sc.tweens.add({
          targets: this, x: line.ex, y: line.ey, duration: 180, ease: 'Quad.in',
          onUpdate: () => this.syncVisual(sc.clock),
          onComplete: () => {
            this.dashing = false;
            if (this.dead || t.dead) return;
            sc.fx.sprite('spark', t.x, t.y - 16, { scale: 2.5 });
            sc.combat.playerSkillHit(t, { coef, skill: id });
            t.stunUntil = sc.clock + s.stun[rank - 1] * 1000;
            sc.combat.stunFx(t, s.stun[rank - 1]);
            sc.fx.shake(0.005, 140);
          },
        });
        sound.play('swing');
        break;
      }
      case 'fireball':
        this.playAction('_cast', 0.35);
        sc.time.delayedCall(140, () => {
          if (this.dead) return;
          sound.play('fire');
          sc.combat.projectile(this, t, 'fireball', 460, () => {
            sc.fx.sprite('explosion', t.x, t.y - 14, { scale: 0.6 });
            sc.combat.playerSkillHit(t, { coef, skill: id, spell: true });
          });
        });
        break;
      case 'ice_blast': {
        this.playAction('_cast', 0.35);
        const cx = t ? t.x : this.x, cy = t ? t.y : this.y;
        sc.time.delayedCall(150, () => {
          if (this.dead) return;
          sound.play('ice');
          sc.fx.sprite('ice', cx, cy - 10, { scale: 2.2 });
          const hits = sc.combat.enemiesInRadius(cx, cy, s.radius * TILE, s.maxTargets, true, t ? { x: cx, y: cy } : null);
          hits.forEach((e, i) => {
            sc.combat.playerSkillHit(e, { coef, skill: id, spell: i === 0 });
            e.slowUntil = sc.clock + s.slowDur * 1000; e.slowPct = s.slow[rank - 1];
            if (!e.dead) e.sprite.setTint(0xa0d8ff);
            sc.time.delayedCall(s.slowDur * 1000, () => { if (!e.dead && !e.isSlowed()) { e.sprite.clearTint(); if (e.baseTint) e.sprite.setTint(e.baseTint); if (e.furyTint) e.sprite.setTint(e.furyTint); } });
          });
        });
        break;
      }
      case 'mana_shield':
        this.playAction('_cast', 0.25);
        this.buffs.manaShield = { until: sc.clock + s.dur[rank - 1] * 1000, value: s.absorb[rank - 1] };
        sound.play('shield');
        break;
      case 'meteor': {
        this.playAction('_cast', 0.45);
        const tx = t.x, ty = t.y;
        const r = s.radius * TILE;
        sc.fx.telegraph({ kind: 'circle', x: tx, y: ty, r }, s.delay * 1000, 0xffa040);
        const m = sc.fx.sprite('meteor', tx + 60, ty - 220, { scale: 2 });
        sc.tweens.add({ targets: m, x: tx, y: ty - 20, duration: s.delay * 1000, ease: 'Quad.in', onComplete: () => m.destroy() });
        sc.time.delayedCall(s.delay * 1000, () => {
          sound.play('explosion');
          sc.fx.sprite('explosion', tx, ty - 10, { scale: 1.8 });
          sc.fx.shake(0.008, 220);
          const hits = sc.combat.enemiesInRadius(tx, ty, r, s.maxTargets, false);
          hits.forEach((e, i) => sc.combat.playerSkillHit(e, { coef, skill: id, spell: i === 0 }));
        });
        break;
      }
      default: break;
    }
  }

  trackResonance() {
    if (!this.char.mastery) return;
    const now = this.scene.clock;
    this.castLog = this.castLog.filter((t) => now - t < 6000);
    this.castLog.push(now);
    if (this.castLog.length >= 3 && now >= this.icd.resonance) {
      this.castLog = [];
      this.icd.resonance = now + 20000;
      this.buffs.resonance = { until: now + 5000, value: 0.5 };
      this.scene.fx.text(this.x, this.y - 70, 'Arcane Resonance!', { color: '#d0a0ff', size: 14 });
      sound.play('buff');
    }
  }

  // ---------------------------------------------------------------- iksirler
  bestPotion(kind) {
    const list = POTION_LIST.filter((p) => p.kind === kind && p.lv <= this.char.level).sort((a, b) => b.lv - a.lv);
    return list.find((p) => countStack(this.char.bag, p.id) > 0) || null;
  }

  usePotion(kind, auto = false) {
    const ch = this.char, st = this.stats;
    if (this.dead) return false;
    if (this.potionCd[kind] > 0) { if (!auto) bus.emit('toast', { text: 'İksir beklemede', kind: 'warn', short: true }); return false; }
    const full = kind === 'hp' ? ch.hp >= st.maxHp : ch.mp >= st.maxMp;
    if (full) { if (!auto) bus.emit('toast', { text: kind === 'hp' ? 'HP zaten dolu' : 'MP zaten dolu', kind: 'warn', short: true }); return false; }
    const p = this.bestPotion(kind);
    if (!p) { if (!auto) bus.emit('toast', { text: kind === 'hp' ? 'HP iksirin yok' : 'MP iksirin yok', kind: 'warn', short: true }); return false; }
    removeStack(ch.bag, p.id, 1);
    if (kind === 'hp') ch.hp = Math.min(st.maxHp, ch.hp + p.amount); else ch.mp = Math.min(st.maxMp, ch.mp + p.amount);
    this.potionCd[kind] = POTION_CD;
    sound.play('potion');
    this.scene.fx.sprite('heal', this.x, this.y - 30, { tint: kind === 'hp' ? 0x7af070 : 0x7ab0ff });
    this.scene.fx.text(this.x, this.y - 50, `+${p.amount} ${kind.toUpperCase()}`, { color: kind === 'hp' ? '#7af070' : '#7ab0ff', size: 13 });
    bus.emit('changed', 'potion');
    app.requestSave('potion');
    return true;
  }

  // ---------------------------------------------------------------- can, mana, buff
  updateVitals(dt, now, st) {
    const ch = this.char;
    const outOfCombat = now - this.lastHurtAt > REGEN_DELAY * 1000;
    if (outOfCombat && ch.hp < st.maxHp) ch.hp = Math.min(st.maxHp, ch.hp + st.maxHp * REGEN_HP_PCT * dt);
    const mpRate = (outOfCombat && now - this.lastCombatAt > REGEN_DELAY * 1000) ? MP_REGEN_IDLE : MP_REGEN_COMBAT;
    if (ch.mp < st.maxMp) ch.mp = Math.min(st.maxMp, ch.mp + st.maxMp * mpRate * dt);
    // zehir
    if (this.poison) {
      this.poison.tick -= dt;
      if (this.poison.tick <= 0) {
        const pz = this.poison;
        pz.tick = 1;
        pz.left -= 1;
        if (pz.left <= 0) this.poison = null;
        this.scene.fx.sprite('poison', this.x, this.y - 40, {});
        // zehir öldürürse die() durumu temizler; bu karede başka durum okunmaz
        this.scene.combat.damagePlayerRaw(pz.dmg, { poison: true });
        if (this.dead) return;
      }
    }
    // otomatik iksir (yalnız iksir tüketir; otomatik savaş değildir)
    const ap = ch.autoPotion;
    if (ap?.hpOn && ch.hp / st.maxHp * 100 < ap.hpPct && this.potionCd.hp <= 0) this.usePotion('hp', true);
    if (ap?.mpOn && ch.mp / st.maxMp * 100 < ap.mpPct && this.potionCd.mp <= 0) this.usePotion('mp', true);
  }

  updateBuffs(now) {
    let auraKey = null;
    for (const [k, b] of Object.entries(this.buffs)) {
      if (now >= b.until) { delete this.buffs[k]; continue; }
      if (k === 'ironSkin') auraKey = 'aura_iron';
      if (k === 'manaShield') auraKey = 'aura_mana';
      if (k === 'will') auraKey = 'aura_will';
    }
    if (auraKey) {
      if (!this.aura.visible || this.aura.texture.key !== 'fx_' + auraKey) { this.aura.setVisible(true); this.aura.play('fx_' + auraKey + '_a'); }
    } else if (this.aura.visible) this.aura.setVisible(false);
  }

  buffState() {
    const now = this.scene.clock;
    const on = (k) => this.buffs[k] && now < this.buffs[k].until;
    return {
      reduce: on('ironSkin') ? this.buffs.ironSkin.value : 0,
      manaShield: on('manaShield') ? this.buffs.manaShield.value : 0,
      willDef: on('will') ? 0.3 : 0,
      willReduce: on('will') ? 0.15 : 0,
    };
  }

  // Sarsılmaz İrade (Lv.20 ustalık)
  checkWill() {
    if (!this.char.mastery || this.char.cls !== 'warrior') return;
    const now = this.scene.clock;
    if (this.char.hp / this.stats.maxHp < 0.3 && now >= this.icd.will) {
      this.icd.will = now + 45000;
      this.buffs.will = { until: now + 6000, value: 0.3 };
      this.scene.fx.text(this.x, this.y - 70, 'Sarsılmaz İrade!', { color: '#ffd060', size: 14 });
      sound.play('buff');
    }
  }

  stun(sec) {
    this.stunUntil = this.scene.clock + sec * 1000;
    this.scene.combat.stunFx(this, sec);
    this.cancelChannel();
  }

  slow(pct, sec) {
    this.slowPct = pct; this.slowUntil = this.scene.clock + sec * 1000;
    this.body.setTint(0xa0c8ff);
    this.scene.time.delayedCall(sec * 1000, () => this.body.clearTint());
  }

  knockback(ang, px) {
    this.scene.grid.move(this, Math.cos(ang) * px, Math.sin(ang) * px);
  }

  startChannel(label, sec, done) {
    this.channel = { label, t: sec, total: sec, done };
    bus.emit('channel', this.channel);
  }

  cancelChannel() {
    if (this.channel) { this.channel = null; bus.emit('channel', null); }
  }

  // ---------------------------------------------------------------- görsel
  syncVisual(now) {
    const c = this.container;
    c.setPosition(Math.round(this.x), Math.round(this.y));
    c.setDepth(100 + this.y);
    c.scaleX = this.facing;
    const frameName = this.body.frame?.name || 'idle0';
    const [hx, hy] = handAnchor(typeof frameName === 'string' ? frameName : 'idle0', true);
    const [bx, by] = handAnchor(typeof frameName === 'string' ? frameName : 'idle0', false);
    const ox = (hx - 12) * 2, oy = (hy - 28.5) * 2;
    this.weapon.setPosition(ox, oy);
    const cls = this.char.cls;
    let ang = cls === 'warrior' ? 0.45 : -0.1;
    if (this.swing) {
      this.swing.t += this._dt || 0.016;
      const k = Math.min(1, this.swing.t / this.swing.dur);
      ang = this.swing.spin ? -1.6 + k * Math.PI * 2 : -1.9 + k * 3.2;
      if (k >= 1) this.swing = null;
    } else if (typeof frameName === 'string' && frameName.startsWith('cast')) ang = cls === 'mage' ? -0.35 : 0.2;
    this.weapon.setRotation(ang);
    this.weapon.setDepth(1);
    this.offhand.setPosition((bx - 12) * 2, (by - 28.5) * 2);
    const twoH = this.stats.twoHanded;
    this.offhand.setVisible(!!this.char.equipment.offhand && !twoH);
    if (now < this.stunUntil) c.setAngle(Math.sin(now / 60) * 3); else c.setAngle(0);
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    this.approaching = false; this.target = null; this.interact = null; this.channel = null;
    this.poison = null; this.buffs = {};
    this.body.stop();
    this.scene.tweens.add({ targets: this.container, angle: this.facing > 0 ? -85 : 85, duration: 500, ease: 'Quad.in' });
    this.body.setTint(0x806070);
    sound.play('death');
  }

  revive() {
    this.dead = false;
    this.container.setAngle(0);
    this.body.clearTint();
    this.stunUntil = 0; this.slowUntil = 0;
    this.lastHurtAt = -99999;
    this.refreshLook();
  }
}
