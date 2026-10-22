// V4 boss mekanikleri.
// Fırtına Tiranı (açık dünya, Lv.45): Yıldırım Çekici (ön darbe), Fırtına Halkası (3 dilimi boş halka),
//   Yıldırım Yağmuru (oyuncu çevresine düşen yıldırımlar), Kristal Çağrısı (%60 altı: 2 Enerji Kristali — ayaktayken
//   Tiran hasar azaltır; ikisi de kırılınca zırhı çatlar: 15 sn savunma −%35), Son Gök Gürültüsü (%25 altı: hızlanır,
//   ardışık yıldırım yağmuru ve kısa süreli fırtına izleri; en çok 3 iz).
// Göğün Mahkûmu (Gökyarık Mabedi, Lv.50): I. faz Göğün Zincirleri (hat zinciri + çekme) ve Zincir Savuruşu (koni);
//   II. faz (%65) Kırılan Mühürler: kalkan + 2 Gök Mührü (en çok 30 sn); III. faz (%30) Yıldızların Sonu: hızlanır,
//   güvenli boşluklu yıldız halkaları ve en çok 4 kalıcı yıldız alanı.
// Bütün büyük saldırılar ≥1,2 sn telegraflanır; telegraf alanı = isabet alanı; güvenli bölge daima vardır.
import Phaser from 'phaser';
import { TILE } from '../data/constants.js';
import { sound } from '../audio/sound.js';
import { inTelegraphCircle, pointInBeam } from './Enemy.js';

const STORM = 0x9ad0ff, STAR = 0xfff0c0, ASTRAL = 0xb0a0ff;

function announce(e, text, color = '#9ad0ff') {
  e.scene.fx.text(e.x, e.y - e.height - 20, text, { color, size: 16, rise: 26, dur: 1800 });
  e.scene.events.emit('bossAnnounce', text);
}

function coneHit(e, p, ang, r) {
  const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy);
  const da = Math.abs(Phaser.Math.Angle.Wrap(Math.atan2(dy, dx) - ang));
  return !p.dead && d <= r && da <= Math.PI / 3;
}

// bossun çevresinde n dilimli halka; ardışık `gapN` dilim boş (güvenli bölge)
function ringSpots(e, n, R, gapN) {
  const gap = Math.floor(Math.random() * n), spots = [];
  for (let i = 0; i < n; i++) {
    if ((i - gap + n) % n < gapN) continue;
    const a = (i / n) * Math.PI * 2;
    spots.push({ x: e.x + Math.cos(a) * R, y: e.y + Math.sin(a) * R * 0.75 });
  }
  return spots;
}

export const TYRANT_CRYSTAL_SEC = 25;
export const TYRANT_CRACK = { sec: 15, defMult: 0.65 };
const MAX_STORM_TRAILS = 3;

export function stormTyrantBehavior(e) {
  const b = {
    cd: { hammer: 3.5, ring: 9, rain: 6 }, crystalsDone: false, crystals: [], crystalUntil: 0, crackUntil: 0, fury: false, trails: [], aura: null,
    phase() { return b.fury ? 3 : e.hp / e.maxHp < 0.6 ? 2 : 1; },
    update(dt, p) {
      const sc = e.scene;
      if (e.state !== 'chase' && e.state !== 'attack') return false;
      const hpp = e.hp / e.maxHp, now = sc.clock;
      b.trails = b.trails.filter((t) => t.alive);
      if (!b.crystalsDone && hpp < 0.6) b.callCrystals(p);
      if (b.crystals.length) {
        b.crystals = b.crystals.filter((c) => !c.dead);
        e.reduce = b.crystals.length ? 0.3 * b.crystals.length : 0;
        if (!b.crystals.length) b.crack(true);
        else if (now > b.crystalUntil) b.crystalBlast();
      }
      if (b.crackUntil && now > b.crackUntil) { b.crackUntil = 0; e.def = e.tpl.def; e.mdef = e.tpl.mdef; e.furyTint = b.fury ? 0xb0e0ff : null; if (!b.fury) e.sprite.clearTint(); e.drawBar(); }
      if (!b.fury && hpp < 0.25) {
        b.fury = true; e.atkMult = 0.75; e.speedMult = 1.15; e.furyTint = 0xb0e0ff; e.sprite.setTint(0xb0e0ff);
        announce(e, 'SON GÖK GÜRÜLTÜSÜ!', '#ff9a8a'); sound.play('roar'); sc.fx.shake(0.009, 320);
        b.cd.rain = 1.5;
      }
      if (e.casting || e.windup) return false;
      const mult = b.fury ? 1 / 0.75 : 1;
      for (const k of Object.keys(b.cd)) b.cd[k] -= dt * mult;
      const dP = Math.hypot(p.x - e.x, p.y - e.y);
      if (b.cd.ring <= 0 && dP < 6.5 * TILE) return b.stormRing(p), false;
      if (b.cd.hammer <= 0 && dP < 4.2 * TILE) return b.hammer(p), false;
      if (b.cd.rain <= 0 && dP < 11 * TILE) return b.rain(p), false;
      return false;
    },
    // Yıldırım Çekici: ön koni darbe + geri itme
    hammer(p) {
      const sc = e.scene;
      b.cd.hammer = 7;
      const ang = Math.atan2(p.y - e.y, p.x - e.x), r = 3.8 * TILE, dur = b.fury ? 1250 : 1500;
      sc.fx.telegraph({ kind: 'cone', x: e.x, y: e.y - 6, r, angle: ang }, dur, STORM);
      sound.play('warn');
      e.setFacing(Math.cos(ang));
      e.casting = { t: dur / 1000, fn: () => {
        if (e.dead) return;
        e.playAnim('atk');
        sc.fx.sprite('slash', e.x + Math.cos(ang) * 40, e.y - 14 + Math.sin(ang) * 40, { scale: 3.8, rotation: ang, tint: STORM });
        sound.play('slam'); sc.fx.shake(0.01, 220);
        if (coneHit(e, p, ang, r)) { sc.combat.enemyHitsPlayer(e, { coef: 2.0, label: 'Yıldırım Çekici' }); sc.player.knockback(ang, 30); }
      } };
    },
    // Fırtına Halkası: bossun çevresinde 12 dilim, ardışık 3 dilim güvenli
    stormRing(p) {
      const sc = e.scene;
      b.cd.ring = b.phase() >= 2 ? 11 : 13;
      const r = 1.15 * TILE, dur = 1600;
      const spots = ringSpots(e, 12, 3.4 * TILE, 3);
      for (const s of spots) sc.fx.telegraph({ kind: 'circle', x: s.x, y: s.y, r }, dur, STORM);
      announce(e, 'Fırtına Halkası!');
      sound.play('warn');
      e.casting = { t: dur / 1000, fn: () => {
        if (e.dead) return;
        sound.play('bolt');
        let hit = false;
        for (const s of spots) {
          sc.fx.sprite('shatter', s.x, s.y, { scale: 1.1, tint: STORM });
          if (!hit && !p.dead && inTelegraphCircle(p.x, p.y, s.x, s.y, r)) hit = true;
        }
        if (hit) { sc.combat.enemyHitsPlayer(e, { coef: 1.6, dmgType: 'magic', label: 'Fırtına Halkası' }); sc.combat.slowPlayer(0.3, 1.5); }
      } };
    },
    // Yıldırım Yağmuru: I: 3, II: 4, III: 5 yıldırım (her biri ayrı uyarılı); III. fazda kısa fırtına izi
    rain(p) {
      const sc = e.scene;
      const phase = b.phase();
      b.cd.rain = phase === 3 ? 7 : phase === 2 ? 9 : 10;
      announce(e, phase === 3 ? 'Son Gök Gürültüsü!' : 'Yıldırım Yağmuru!', phase === 3 ? '#ff9a8a' : '#9ad0ff');
      sound.play('warn');
      e.playAnim('atk');
      const spots = [[0, 0], [1.6, 0.6], [-1.5, 0.7], [0.4, -1.5], [-0.6, 1.6]].slice(0, phase + 2);
      spots.forEach(([ox, oy], i) => sc.time.delayedCall(i * 140, () => {
        if (e.dead) return;
        sc.combat.fallingShard({ x: p.x + ox * TILE, y: p.y + oy * TILE, r: 0.95 * TILE, delay: 1.4, coef: 1.05, src: e, style: 'storm', label: 'Yıldırım' });
      }));
      if (phase === 3 && b.trails.length < MAX_STORM_TRAILS && !p.dead) {
        b.trails.push(sc.combat.groundHazard({ x: p.x, y: p.y, r: 1.3 * TILE, dur: 8, tick: 0.6, coef: 0.2, src: e, key: 'storm_ground', label: 'Fırtına İzi', warn: 1.4 }));
      }
      e.casting = { t: 0.6, fn: () => {} };
    },
    // Kristal Çağrısı: Tiran'ın iki yanında iki Enerji Kristali (her biri hasar alımını %30 azaltır)
    callCrystals(p) {
      const sc = e.scene;
      b.crystalsDone = true;
      b.crystalUntil = sc.clock + TYRANT_CRYSTAL_SEC * 1000;
      for (const side of [-1, 1]) {
        const c = sc.spawner.spawnSummon('tyrant_crystal', e.x + side * 3.2 * TILE, e.y + 0.8 * TILE);
        if (c) b.crystals.push(c);
      }
      e.reduce = 0.3 * b.crystals.length;
      b.aura = sc.add.image(0, -e.height / 2, 'light_white').setScale(2).setAlpha(0.5).setTint(STORM).setBlendMode(Phaser.BlendModes.ADD);
      e.container.addAt(b.aura, 0);
      announce(e, 'KRİSTAL ÇAĞRISI! Kristalleri kır!');
      sound.play('shield');
      void p;
    },
    // Süre dolarsa kristaller patlar (uyarılı çember) ve kalkan söner; zırh çatlamaz
    crystalBlast() {
      const sc = e.scene;
      const list = b.crystals.slice();
      b.crystals = [];
      e.reduce = 0;
      b.aura?.destroy(); b.aura = null;
      announce(e, 'Kristaller patlıyor!', '#ff9a8a');
      for (const c of list) {
        const x = c.x, y = c.y, r = 2.6 * TILE;
        sc.fx.telegraph({ kind: 'circle', x, y, r }, 1400, STORM);
        sc.time.delayedCall(1400, () => {
          if (!c.dead) sc.spawner.despawn(c);
          sc.fx.sprite('shatter', x, y - 8, { scale: 2.6, tint: STORM });
          sound.play('bolt');
          const pl = sc.player;
          if (!pl.dead && inTelegraphCircle(pl.x, pl.y, x, y, r)) sc.combat.enemyHitsPlayer(e, { coef: 1.5, dmgType: 'magic', label: 'Kristal Patlaması' });
        });
      }
    },
    // İki kristal de kırıldı: kalkan söner, savunma 15 sn düşer
    crack(broken) {
      const sc = e.scene;
      e.reduce = 0;
      b.aura?.destroy(); b.aura = null;
      if (!broken) return;
      e.def = Math.round(e.tpl.def * TYRANT_CRACK.defMult); e.mdef = Math.round(e.tpl.mdef * TYRANT_CRACK.defMult);
      b.crackUntil = sc.clock + TYRANT_CRACK.sec * 1000;
      e.furyTint = 0x7a8aa0; e.sprite.setTint(0x7a8aa0);
      announce(e, 'Zırh çatladı! Savunma düştü.', '#e0f4ff');
      sound.play('altar');
      e.drawBar();
    },
    clearAll() {
      b.crystals.forEach((c) => !c.dead && e.scene.spawner.despawn(c));
      b.crystals = [];
      b.aura?.destroy(); b.aura = null;
      e.scene.combat.clearHazards();
      b.trails = [];
    },
    reset() {
      b.clearAll();
      b.crystalsDone = false; b.crackUntil = 0; b.fury = false; b.cd = { hammer: 3.5, ring: 9, rain: 6 };
      e.reduce = 0; e.def = e.tpl.def; e.mdef = e.tpl.mdef;
      e.speedMult = 1; e.atkMult = 1; e.furyTint = null; e.sprite.clearTint();
    },
    onDeath() { b.clearAll(); },
  };
  return b;
}

export const PRISONER_SHIELD = { below: 0.65, reduce: 0.85, sec: 30 };
const MAX_STAR_ZONES = 4;

export function skyPrisonerBehavior(e) {
  const b = {
    cd: { chains: 5, swing: 3.5, stars: 7, ring: 6 }, shieldDone: false, shieldUntil: 0, seals: [], fury: false, aura: null, zones: [],
    phase() {
      if (b.fury) return 3;
      return e.hp / e.maxHp > PRISONER_SHIELD.below ? 1 : 2;
    },
    update(dt, p) {
      const sc = e.scene;
      if (e.state !== 'chase' && e.state !== 'attack') return false;
      const hpp = e.hp / e.maxHp, now = sc.clock;
      b.zones = b.zones.filter((z) => z.alive);
      if (!b.shieldDone && hpp < PRISONER_SHIELD.below) {
        b.shieldDone = true;
        e.reduce = PRISONER_SHIELD.reduce;
        b.shieldUntil = now + PRISONER_SHIELD.sec * 1000;
        b.seals = (sc.mapDef.crystalSpawns || []).map((c) => sc.spawner.spawnSummon('sky_seal', c.x * TILE + 16, c.y * TILE + 16)).filter(Boolean);
        b.aura = sc.add.image(0, -e.height / 2, 'light_white').setScale(2.2).setAlpha(0.55).setTint(ASTRAL).setBlendMode(Phaser.BlendModes.ADD);
        e.container.addAt(b.aura, 0);
        announce(e, 'KIRILAN MÜHÜRLER! İki Gök Mührünü kır!', '#e0d8ff');
        sound.play('shield');
      }
      if (e.reduce > 0 && b.shieldDone) {
        b.seals = b.seals.filter((c) => !c.dead);
        if (!b.seals.length || now > b.shieldUntil) b.dropShield(b.seals.length ? 'Gök kalkanı söndü.' : 'Gök Mühürleri kırıldı!');
      }
      if (!b.fury && hpp < 0.3) {
        b.fury = true; e.speedMult = 1.2; e.atkMult = 0.75; e.furyTint = 0xe0d8ff; e.sprite.setTint(0xe0d8ff);
        announce(e, 'YILDIZLARIN SONU!', '#ff9a8a'); sound.play('roar'); sc.fx.shake(0.01, 340);
        b.cd.ring = 2;
      }
      if (e.casting || e.windup) return false;
      const mult = b.fury ? 1 / 0.75 : 1;
      for (const k of Object.keys(b.cd)) b.cd[k] -= dt * mult;
      const dP = Math.hypot(p.x - e.x, p.y - e.y);
      const phase = b.phase();
      if (phase === 3 && b.cd.ring <= 0 && dP < 8 * TILE) return b.starRing(p), false;
      if (b.cd.swing <= 0 && dP < 4.2 * TILE) return b.swing(p), false;
      if (b.cd.chains <= 0 && dP > 2.5 * TILE && dP < 10 * TILE && e.canSee(p)) return b.chains(p), false;
      if (b.cd.stars <= 0 && dP < 11 * TILE) return b.stars(p), false;
      return false;
    },
    dropShield(msg) {
      e.reduce = 0;
      b.seals.forEach((c) => !c.dead && e.scene.spawner.despawn(c));
      b.seals = [];
      b.aura?.destroy(); b.aura = null;
      announce(e, msg, '#e0d8ff');
    },
    // Zincir Savuruşu: geniş ön koni
    swing(p) {
      const sc = e.scene;
      b.cd.swing = 7;
      const ang = Math.atan2(p.y - e.y, p.x - e.x), r = 4 * TILE, dur = b.fury ? 1250 : 1500;
      sc.fx.telegraph({ kind: 'cone', x: e.x, y: e.y - 6, r, angle: ang }, dur, ASTRAL);
      sound.play('warn');
      e.setFacing(Math.cos(ang));
      e.casting = { t: dur / 1000, fn: () => {
        if (e.dead) return;
        e.playAnim('atk');
        sc.fx.sprite('slash', e.x + Math.cos(ang) * 40, e.y - 14 + Math.sin(ang) * 40, { scale: 4, rotation: ang, tint: ASTRAL });
        sound.play('slam'); sc.fx.shake(0.01, 220);
        if (coneHit(e, p, ang, r)) sc.combat.enemyHitsPlayer(e, { coef: 2.0, label: 'Zincir Savuruşu' });
      } };
    },
    // Göğün Zincirleri: oyuncuya uzanan zincir hattı; isabette bossa doğru çekilir
    chains(p) {
      const sc = e.scene;
      b.cd.chains = b.phase() >= 2 ? 9 : 11;
      const ang = Math.atan2(p.y - e.y, p.x - e.x), len = 10 * TILE, w = 1.3 * TILE, dur = b.fury ? 1150 : 1350;
      const ox = e.x, oy = e.y - 10;
      sc.fx.telegraph({ kind: 'rect', x: ox, y: oy, len, width: w, angle: ang }, dur, ASTRAL);
      announce(e, 'Göğün Zincirleri!', '#e0d8ff');
      sound.play('warn');
      e.setFacing(Math.cos(ang));
      e.casting = { t: dur / 1000, fn: () => {
        if (e.dead) return;
        e.playAnim('atk');
        const beam = sc.add.image(ox, oy, 'tg_rect').setOrigin(0, 0.5).setRotation(ang).setDisplaySize(len, w * 0.5).setTint(ASTRAL).setDepth(60000).setBlendMode(Phaser.BlendModes.ADD);
        sc.tweens.add({ targets: beam, alpha: 0, duration: 400, onComplete: () => beam.destroy() });
        sound.play('bolt');
        if (!p.dead && pointInBeam(p.x, p.y - 8, ox, oy, ang, len, w)) {
          sc.combat.enemyHitsPlayer(e, { coef: 1.7, dmgType: 'magic', label: 'Göğün Zincirleri' });
          sc.player.knockback(ang + Math.PI, 40);
        }
      } };
    },
    // Gök Yargısı: oyuncu çevresine düşen yıldızlar (I: 3, II–III: 5)
    stars(p) {
      const sc = e.scene;
      const phase = b.phase();
      b.cd.stars = phase >= 2 ? 9 : 11;
      announce(e, 'Gök Yargısı!', '#fff0c0');
      sound.play('warn');
      e.playAnim('atk');
      const spots = [[0, 0], [1.6, 0.6], [-1.5, 0.7], [0.4, -1.5], [-0.6, 1.6]].slice(0, phase >= 2 ? 5 : 3);
      spots.forEach(([ox, oy], i) => sc.time.delayedCall(i * 140, () => {
        if (e.dead) return;
        sc.combat.fallingShard({ x: p.x + ox * TILE, y: p.y + oy * TILE, r: 0.95 * TILE, delay: 1.4, coef: 1.1, src: e, style: 'star', label: 'Düşen Yıldız' });
      }));
      e.casting = { t: 0.6, fn: () => {} };
    },
    // Yıldızların Sonu: 12 dilimli yıldız halkası (ardışık 3 dilim güvenli) + en çok 4 kalıcı yıldız alanı
    starRing(p) {
      const sc = e.scene;
      b.cd.ring = 11;
      const r = 1.15 * TILE, dur = 1600;
      const spots = ringSpots(e, 12, 3.6 * TILE, 3);
      for (const s of spots) sc.fx.telegraph({ kind: 'circle', x: s.x, y: s.y, r }, dur, STAR);
      announce(e, 'Yıldızların Sonu!', '#ff9a8a');
      sound.play('warn');
      e.casting = { t: dur / 1000, fn: () => {
        if (e.dead) return;
        sound.play('bolt');
        let hit = false;
        for (const s of spots) {
          sc.fx.sprite('shatter', s.x, s.y, { scale: 1.1, tint: STAR });
          if (!hit && !p.dead && inTelegraphCircle(p.x, p.y, s.x, s.y, r)) hit = true;
        }
        if (hit) sc.combat.enemyHitsPlayer(e, { coef: 1.6, dmgType: 'magic', label: 'Yıldızların Sonu' });
        if (b.zones.length < MAX_STAR_ZONES && !p.dead) {
          b.zones.push(sc.combat.groundHazard({ x: p.x, y: p.y, r: 1.4 * TILE, dur: 12, tick: 0.6, coef: 0.24, src: e, key: 'void_ground', tint: ASTRAL, label: 'Yıldız Alanı', warn: 1.4 }));
        }
      } };
    },
    reset() {
      if (e.reduce > 0 || b.seals.length) { b.seals.forEach((c) => !c.dead && e.scene.spawner.despawn(c)); b.seals = []; b.aura?.destroy(); b.aura = null; e.reduce = 0; }
      e.scene.combat.clearHazards();
      b.zones = [];
      b.shieldDone = false; b.fury = false; b.cd = { chains: 5, swing: 3.5, stars: 7, ring: 6 };
      e.speedMult = 1; e.atkMult = 1; e.furyTint = null; e.sprite.clearTint();
    },
    onDeath() {
      b.seals.forEach((c) => !c.dead && e.scene.spawner.despawn(c));
      b.seals = [];
      b.aura?.destroy();
      e.scene.combat.clearHazards();
    },
  };
  return b;
}
