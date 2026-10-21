// V2 boss mekanikleri.
// Kül Devi: Kor Yumruğu (telegraflı ön darbe), Alev Yarıkları (en çok 3 etkin yer tehlikesi),
//           Kül Çağrısı (%55 altı: 2 yardımcı, EXP/loot yok), Son Kor (%20 altı: hızlanır, güvenli alan korunur).
// Donmuş Muhafız: I. faz (100–65%) Buz Mızrağı + Donuk Darbe; II. faz (65–30%) Buz Mührü kalkanı (2 kristal) +
//           Buz Çemberi (güvenli boşluklu halka); III. faz (<30%) hızlanır, kısa yavaşlatma/dondurma (zincirsiz).
// Bütün büyük saldırılar 1,2–1,8 sn telegraflanır; telegraf alanı = isabet alanı.
import Phaser from 'phaser';
import { TILE } from '../data/constants.js';
import { sound } from '../audio/sound.js';
import { pointInBeam, inTelegraphCircle } from './Enemy.js';

function announce(e, text, color = '#ff9a4a') {
  e.scene.fx.text(e.x, e.y - e.height - 20, text, { color, size: 16, rise: 26, dur: 1800 });
  e.scene.events.emit('bossAnnounce', text);
}

const MAX_FISSURES = 3;

export function ashGiantBehavior(e) {
  const b = {
    cd: { fist: 3.5, fissure: 6 }, called55: false, called30: false, fury: false, summons: [], fissures: [],
    phase() { return b.fury ? 3 : e.hp / e.maxHp < 0.55 ? 2 : 1; },
    update(dt, p) {
      const sc = e.scene;
      if (e.state !== 'chase' && e.state !== 'attack') return false;
      const hpp = e.hp / e.maxHp;
      b.summons = b.summons.filter((s) => !s.dead);
      b.fissures = b.fissures.filter((h) => h.alive);
      if (!b.fury && hpp < 0.2) {
        b.fury = true; e.speedMult = 1.15; e.atkMult = 0.8; e.furyTint = 0xffa080; e.sprite.setTint(0xffa080);
        announce(e, 'SON KOR!'); sound.play('roar'); sc.fx.shake(0.008, 300);
      }
      if (e.casting || e.windup) return false;
      if ((hpp < 0.55 && !b.called55) || (hpp < 0.3 && !b.called30 && b.summons.length === 0)) {
        if (hpp < 0.55) b.called55 = true;
        if (hpp < 0.3) b.called30 = true;
        return b.call(p), false;
      }
      const mult = b.fury ? 1 / 0.75 : 1;
      for (const k of Object.keys(b.cd)) b.cd[k] -= dt * mult;
      const dP = Math.hypot(p.x - e.x, p.y - e.y);
      if (b.cd.fist <= 0 && dP < 4 * TILE) return b.fist(p), false;
      if (b.cd.fissure <= 0 && dP < 11 * TILE && b.fissures.length < MAX_FISSURES) return b.fissure(p), false;
      return false;
    },
    fist(p) {
      const sc = e.scene;
      b.cd.fist = 8;
      const ang = Math.atan2(p.y - e.y, p.x - e.x);
      const cx = e.x + Math.cos(ang) * 1.6 * TILE, cy = e.y + Math.sin(ang) * 1.6 * TILE, r = 2.4 * TILE, dur = b.fury ? 1300 : 1600;
      sc.fx.telegraph({ kind: 'circle', x: cx, y: cy, r }, dur, 0xff6a1a);
      sound.play('warn');
      e.setFacing(Math.cos(ang));
      e.casting = { t: dur / 1000, fn: () => {
        if (e.dead) return;
        e.playAnim('atk');
        sound.play('slam'); sc.fx.shake(0.011, 240);
        sc.fx.sprite('explosion', cx, cy, { scale: 1.3, tint: 0xff8a40 });
        sc.fx.sprite('ash_puff', cx, cy - 10, { scale: 2.6 });
        if (!p.dead && inTelegraphCircle(p.x, p.y, cx, cy, r)) {
          sc.combat.enemyHitsPlayer(e, { coef: 2.0, label: 'Kor Yumruğu' });
          sc.player.knockback(ang, 36);
        }
      } };
    },
    fissure(p) {
      const sc = e.scene;
      b.cd.fissure = b.phase() >= 2 ? 9 : 12;
      const free = MAX_FISSURES - b.fissures.length;
      const n = Math.min(free, b.phase() >= 2 ? 2 : 1);
      const spots = [{ x: p.x, y: p.y }];
      for (let i = 1; i < n; i++) {
        for (let k = 0; k < 10; k++) {
          const a = Math.random() * Math.PI * 2, d = (2.5 + Math.random() * 2.5) * TILE;
          const x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
          if (!sc.grid.blockedAt(x, y)) { spots.push({ x, y }); break; }
        }
      }
      announce(e, 'Alev Yarıkları!', '#ffb070');
      sound.play('warn');
      e.playAnim('atk');
      for (const s of spots) {
        const hz = sc.combat.groundHazard({ x: s.x, y: s.y, r: 1.5 * TILE, dur: 7, tick: 0.6, coef: 0.24, src: e, key: 'fire_ground', label: 'Alev Yarığı', warn: 1.4 });
        b.fissures.push(hz);
      }
      e.casting = { t: 0.5, fn: () => {} };
    },
    call(p) {
      const sc = e.scene;
      const dur = 1300;
      sc.fx.telegraph({ kind: 'ring', x: e.x, y: e.y, r: 2.4 * TILE }, dur, 0xffb040);
      e.casting = { t: dur / 1000, fn: () => {
        if (e.dead) return;
        sound.play('roar');
        announce(e, 'Kül Çağrısı!', '#ffd080');
        const need = 2 - b.summons.length;
        for (let i = 0; i < need; i++) {
          const a = Math.random() * Math.PI * 2;
          const s = sc.spawner.spawnSummon('ember_spawn', e.x + Math.cos(a) * 2.5 * TILE, e.y + Math.sin(a) * 2 * TILE);
          if (s) { b.summons.push(s); s.aggro(p); }
        }
      } };
    },
    clearAll() {
      b.summons.forEach((s) => !s.dead && e.scene.spawner.despawn(s));
      b.summons = [];
      e.scene.combat.clearHazards();
      b.fissures = [];
    },
    reset() {
      b.clearAll();
      b.called55 = false; b.called30 = false; b.fury = false; b.cd = { fist: 3.5, fissure: 6 };
      e.speedMult = 1; e.atkMult = 1; e.furyTint = null; e.sprite.clearTint();
    },
    onDeath() { b.clearAll(); },
  };
  return b;
}

export function frozenGuardianBehavior(e) {
  const b = {
    cd: { spear: 4, smash: 3, ring: 9 }, shieldDone: false, shieldUntil: 0, crystals: [], fury: false, aura: null, freezeReadyAt: 0,
    phase() {
      if (b.fury) return 3;
      return e.hp / e.maxHp > 0.65 ? 1 : 2;
    },
    update(dt, p) {
      const sc = e.scene;
      if (e.state !== 'chase' && e.state !== 'attack') return false;
      const hpp = e.hp / e.maxHp;
      const now = sc.clock;
      if (!b.shieldDone && hpp < 0.65) {
        b.shieldDone = true;
        e.reduce = 0.8;
        b.shieldUntil = now + 25000;
        b.crystals = (sc.mapDef.crystalSpawns || []).map((c) => sc.spawner.spawnSummon('frost_seal_crystal', c.x * TILE + 16, c.y * TILE + 16)).filter(Boolean);
        b.aura = sc.add.image(0, -e.height / 2, 'light_blue').setScale(1.8).setAlpha(0.6).setBlendMode(Phaser.BlendModes.ADD);
        e.container.addAt(b.aura, 0);
        announce(e, 'BUZ MÜHRÜ! İki kristali kır!', '#9fe8ff');
        sound.play('shield');
      }
      if (e.reduce > 0) {
        b.crystals = b.crystals.filter((c) => !c.dead);
        if (!b.crystals.length || now > b.shieldUntil) b.dropShield(b.crystals.length ? 'Mühür söndü.' : 'Buz Mührü kırıldı!');
      }
      if (!b.fury && hpp < 0.3) {
        b.fury = true; e.speedMult = 1.2; e.atkMult = 0.8; e.furyTint = 0xc8e8ff; e.sprite.setTint(0xc8e8ff);
        announce(e, 'KIŞIN ÖFKESİ!', '#c8f0ff'); sound.play('roar'); sc.fx.shake(0.008, 300);
      }
      if (e.casting || e.windup) return false;
      const mult = b.fury ? 1 / 0.75 : 1;
      for (const k of Object.keys(b.cd)) b.cd[k] -= dt * mult;
      const dP = Math.hypot(p.x - e.x, p.y - e.y);
      const phase = b.phase();
      if (phase >= 2 && b.cd.ring <= 0 && dP < 7 * TILE) return b.ring(p), false;
      if (b.cd.smash <= 0 && dP < 3.4 * TILE) return b.smash(p), false;
      if (b.cd.spear <= 0 && dP < 9 * TILE && e.canSee(p)) return b.spear(p), false;
      return false;
    },
    dropShield(msg) {
      e.reduce = 0;
      b.crystals.forEach((c) => !c.dead && e.scene.spawner.despawn(c));
      b.crystals = [];
      b.aura?.destroy(); b.aura = null;
      announce(e, msg, '#9fe8ff');
    },
    // Buz Mızrağı: düz hat, uzun menzil
    spear(p) {
      const sc = e.scene;
      b.cd.spear = 9;
      const ang = Math.atan2(p.y - e.y, p.x - e.x), len = 8.5 * TILE, w = 1.3 * TILE, dur = b.fury ? 1300 : 1600;
      const ox = e.x, oy = e.y - 10;
      sc.fx.telegraph({ kind: 'rect', x: ox, y: oy, len, width: w, angle: ang }, dur, 0x7ad8ff);
      sound.play('warn');
      e.setFacing(Math.cos(ang));
      e.casting = { t: dur / 1000, fn: () => {
        if (e.dead) return;
        e.playAnim('atk');
        const beam = sc.add.image(ox, oy, 'tg_rect').setOrigin(0, 0.5).setRotation(ang).setDisplaySize(len, w * 0.5).setTint(0xc8f0ff).setDepth(60000).setBlendMode(Phaser.BlendModes.ADD);
        sc.tweens.add({ targets: beam, alpha: 0, duration: 380, onComplete: () => beam.destroy() });
        sound.play('ice');
        if (!p.dead && pointInBeam(p.x, p.y - 8, ox, oy, ang, len, w)) sc.combat.enemyHitsPlayer(e, { coef: 2.0, dmgType: 'magic', label: 'Buz Mızrağı' });
      } };
    },
    // Donuk Darbe: yakın, geniş daire; III. fazda kısa dondurma (12 sn'de en çok bir kez — zincir yok)
    smash(p) {
      const sc = e.scene;
      b.cd.smash = 8;
      const r = 3 * TILE, dur = b.fury ? 1250 : 1450;
      sc.fx.telegraph({ kind: 'circle', x: e.x, y: e.y, r }, dur, 0x7ad8ff);
      sound.play('warn');
      e.casting = { t: dur / 1000, fn: () => {
        if (e.dead) return;
        e.playAnim('atk');
        sound.play('slam'); sc.fx.shake(0.01, 220);
        sc.fx.sprite('shatter', e.x, e.y - 8, { scale: 3.4 });
        if (!p.dead && inTelegraphCircle(p.x, p.y, e.x, e.y, r)) {
          sc.combat.enemyHitsPlayer(e, { coef: 1.7, label: 'Donuk Darbe' });
          if (b.fury && sc.clock >= b.freezeReadyAt && sc.clock >= sc.player.stunUntil) {
            b.freezeReadyAt = sc.clock + 12000;
            sc.player.stun(0.6);
            sc.fx.text(p.x, p.y - 84, 'Dondun!', { color: '#c8f0ff', size: 13 });
          } else sc.combat.slowPlayer(0.3, 1.5);
        }
      } };
    },
    // Buz Çemberi: bossun çevresinde halka; ardışık 3 dilim güvenli boşluk bırakır
    ring(p) {
      const sc = e.scene;
      b.cd.ring = b.fury ? 11 : 14;
      const n = 12, R = 3.6 * TILE, r = 1.15 * TILE, dur = 1700;
      const gap = Math.floor(Math.random() * n);
      const spots = [];
      for (let i = 0; i < n; i++) {
        if ((i - gap + n) % n < 3) continue;
        const a = (i / n) * Math.PI * 2;
        spots.push({ x: e.x + Math.cos(a) * R, y: e.y + Math.sin(a) * R * 0.75 });
      }
      for (const s of spots) sc.fx.telegraph({ kind: 'circle', x: s.x, y: s.y, r }, dur, 0x5ac8ff);
      announce(e, 'Buz Çemberi!', '#9fe8ff');
      sound.play('warn');
      e.casting = { t: dur / 1000, fn: () => {
        if (e.dead) return;
        sound.play('ice');
        let hit = false;
        for (const s of spots) {
          sc.fx.sprite('ice', s.x, s.y, { scale: 0.9 });
          if (!hit && !p.dead && inTelegraphCircle(p.x, p.y, s.x, s.y, r)) hit = true;
        }
        if (hit) { sc.combat.enemyHitsPlayer(e, { coef: 1.6, dmgType: 'magic', label: 'Buz Çemberi' }); sc.combat.slowPlayer(0.3, 1.5); }
      } };
    },
    reset() {
      if (e.reduce > 0 || b.crystals.length) { b.crystals.forEach((c) => !c.dead && e.scene.spawner.despawn(c)); b.crystals = []; b.aura?.destroy(); b.aura = null; e.reduce = 0; }
      b.shieldDone = false; b.fury = false; b.cd = { spear: 4, smash: 3, ring: 9 }; b.freezeReadyAt = 0;
      e.speedMult = 1; e.atkMult = 1; e.furyTint = null; e.sprite.clearTint();
    },
    onDeath() {
      b.crystals.forEach((c) => !c.dead && e.scene.spawner.despawn(c));
      b.crystals = [];
      b.aura?.destroy();
    },
  };
  return b;
}
