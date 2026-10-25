// V3 boss mekanikleri.
// Mezar Komutanı: Mezar Darbesi (telegraflı ön darbe), Mezar Çatlağı (en çok 3 etkin yer tehlikesi),
//   Kemik Çağrısı (%70 ve %40: 2 Kemik Asker — EXP/loot yok), Lanetli Bayrak (%80 altı: yakındaki çağrılmışları güçlendirir,
//   kırılabilir; 25 sn sonra yeniden dikilir), Son Nöbet (%25 altı: saldırılar hızlanır).
// Kayıp Kral: I. faz Kraliyet Yargısı (geniş kılıç) + Ani Hamle + Kara Mermiler; II. faz (%65) Kırık Taç kalkanı ve
//   2 kadim mühür; III. faz (%30) Son Hüküm: hızlanır, yerde güvenli boşluklu karanlık halkalar ve kalıcı karanlık alanlar.
// Bütün büyük saldırılar ≥1,2 sn telegraflanır; telegraf alanı = isabet alanı; güvenli bölge daima vardır.
import Phaser from 'phaser';
import { TILE } from '../data/constants.js';
import { sound } from '../audio/sound.js';
import { inTelegraphCircle } from './Enemy.js';

function announce(e, text, color = '#c8a0ff') {
  e.scene.fx.text(e.x, e.y - e.height - 20, text, { color, size: 16, rise: 26, dur: 1800 });
  e.scene.events.emit('bossAnnounce', text);
}

// ön koni: telegraf dokusunun açısı ±60°
function coneHit(e, p, ang, r) {
  const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy);
  const da = Math.abs(Phaser.Math.Angle.Wrap(Math.atan2(dy, dx) - ang));
  return !p.dead && d <= r && da <= Math.PI / 3;
}

const MAX_GRAVE_HAZARDS = 3;
const BANNER_R = 6 * TILE;

export function graveCommanderBehavior(e) {
  const b = {
    cd: { strike: 3.5, rift: 7, banner: 0 }, called70: false, called40: false, bannerOn: false, fury: false,
    summons: [], banner: null, hazards: [],
    phase() { return b.fury ? 3 : e.hp / e.maxHp < 0.7 ? 2 : 1; },
    update(dt, p) {
      const sc = e.scene;
      if (e.state !== 'chase' && e.state !== 'attack') return false;
      const hpp = e.hp / e.maxHp;
      b.summons = b.summons.filter((s) => !s.dead);
      b.hazards = b.hazards.filter((h) => h.alive);
      if (b.banner?.dead) { b.banner = null; b.cd.banner = 25; announce(e, 'Bayrak düştü!', '#e0d8c4'); }
      b.buffSummons();
      if (!b.fury && hpp < 0.25) {
        b.fury = true; e.atkMult = 0.75; e.speedMult = 1.15; e.furyTint = 0xd8b0ff; e.sprite.setTint(0xd8b0ff);
        announce(e, 'SON NÖBET!', '#ff9a8a'); sound.play('roar'); sc.fx.shake(0.008, 300);
      }
      if (e.casting || e.windup) return false;
      if ((hpp < 0.7 && !b.called70) || (hpp < 0.4 && !b.called40)) {
        if (hpp < 0.7) b.called70 = true;
        if (hpp < 0.4) b.called40 = true;
        return b.call(p), false;
      }
      const mult = b.fury ? 1 / 0.75 : 1;
      for (const k of Object.keys(b.cd)) b.cd[k] -= dt * mult;
      if (hpp < 0.8 && !b.banner && b.cd.banner <= 0) return b.plantBanner(), false;
      const dP = Math.hypot(p.x - e.x, p.y - e.y);
      if (b.cd.strike <= 0 && dP < 4 * TILE) return b.strike(p), false;
      if (b.cd.rift <= 0 && dP < 10 * TILE && b.hazards.length < MAX_GRAVE_HAZARDS) return b.rift(p), false;
      return false;
    },
    // Mezar Darbesi: ön alana güçlü kılıç darbesi
    strike(p) {
      const sc = e.scene;
      b.cd.strike = 7.5;
      const ang = Math.atan2(p.y - e.y, p.x - e.x), r = 3.6 * TILE, dur = b.fury ? 1250 : 1500;
      sc.fx.telegraph({ kind: 'cone', x: e.x, y: e.y - 6, r, angle: ang }, dur, 0xff5050);
      sound.play('warn');
      e.setFacing(Math.cos(ang));
      e.casting = { t: dur / 1000, fn: () => {
        if (e.dead) return;
        e.playAnim('atk');
        sc.fx.sprite('slash', e.x + Math.cos(ang) * 40, e.y - 14 + Math.sin(ang) * 40, { scale: 3.6, rotation: ang, tint: 0xe0d8c4 });
        sound.play('slam'); sc.fx.shake(0.01, 220);
        if (coneHit(e, p, ang, r)) { sc.combat.enemyHitsPlayer(e, { coef: 2.0, label: 'Mezar Darbesi' }); sc.player.knockback(ang, 30); }
      } };
    },
    // Mezar Çatlağı: oyuncunun altında açılan lanetli toprak (uyarı + kısa süreli alan)
    rift(p) {
      const sc = e.scene;
      b.cd.rift = b.phase() >= 2 ? 9 : 12;
      announce(e, 'Mezar Çatlağı!', '#c8a0ff');
      e.playAnim('atk');
      const hz = sc.combat.groundHazard({ x: p.x, y: p.y, r: 1.5 * TILE, dur: 6, tick: 0.6, coef: 0.22, src: e, key: 'void_ground', label: 'Mezar Çatlağı', warn: 1.4 });
      b.hazards.push(hz);
      e.casting = { t: 0.5, fn: () => {} };
    },
    // Kemik Çağrısı: iki ölümsüz asker (ödül vermez; savaş bitince dağılır)
    call(p) {
      const sc = e.scene;
      const dur = 1300;
      sc.fx.telegraph({ kind: 'ring', x: e.x, y: e.y, r: 2.4 * TILE }, dur, 0xe0d8c4);
      e.casting = { t: dur / 1000, fn: () => {
        if (e.dead) return;
        sound.play('roar');
        announce(e, 'Kemik Çağrısı!', '#e0d8c4');
        const need = 2 - b.summons.length;
        for (let i = 0; i < need; i++) {
          const a = Math.random() * Math.PI * 2;
          const s = sc.spawner.spawnSummon('bone_soldier', e.x + Math.cos(a) * 2.5 * TILE, e.y + Math.sin(a) * 2 * TILE);
          if (s) { s.baseAtk = s.atk; b.summons.push(s); s.aggro(p); }
        }
      } };
    },
    // Lanetli Bayrak: bossun yanına dikilir; yakındaki çağrılmışlar +%30 saldırı ve %30 hasar azaltma kazanır
    plantBanner() {
      const sc = e.scene;
      const a = Math.random() * Math.PI * 2;
      const s = sc.spawner.spawnSummon('cursed_banner', e.x + Math.cos(a) * 2 * TILE, e.y + Math.sin(a) * 1.6 * TILE);
      b.cd.banner = 25;
      if (!s) return;
      b.banner = s;
      announce(e, 'Lanetli Bayrak! Bayrağı kır.', '#c8a0ff');
      sound.play('shield');
      s.aura = sc.add.image(0, -10, 'light_white').setScale(1.4).setAlpha(0.35).setTint(0xa070e0).setBlendMode(Phaser.BlendModes.ADD);
      s.container.addAt(s.aura, 0);
    },
    buffSummons() {
      for (const s of b.summons) {
        const on = b.banner && !b.banner.dead && Math.hypot(s.x - b.banner.x, s.y - b.banner.y) < BANNER_R;
        if (on === !!s.bannerOn) continue;
        s.bannerOn = on;
        s.atk = Math.round((s.baseAtk || s.atk) * (on ? 1.3 : 1));
        s.reduce = on ? 0.3 : 0;
        if (on) s.sprite.setTint(0xc8a0ff); else { s.sprite.clearTint(); if (s.baseTint) s.sprite.setTint(s.baseTint); }
      }
    },
    clearAll() {
      b.summons.forEach((s) => !s.dead && e.scene.spawner.despawn(s));
      b.summons = [];
      if (b.banner && !b.banner.dead) e.scene.spawner.despawn(b.banner);
      b.banner = null;
      e.scene.combat.clearHazards();
      b.hazards = [];
    },
    reset() {
      b.clearAll();
      b.called70 = false; b.called40 = false; b.fury = false; b.cd = { strike: 3.5, rift: 7, banner: 0 };
      e.speedMult = 1; e.atkMult = 1; e.furyTint = null; e.sprite.clearTint();
    },
    onDeath() { b.clearAll(); },
  };
  return b;
}

const MAX_KING_ZONES = 4;

export function lostKingBehavior(e) {
  const b = {
    cd: { judge: 3.5, lunge: 8, missiles: 6, ring: 6 }, shieldDone: false, shieldUntil: 0, seals: [], fury: false, aura: null, zones: [],
    phase() {
      if (b.fury) return 3;
      return e.hp / e.maxHp > 0.65 ? 1 : 2;
    },
    update(dt, p) {
      const sc = e.scene;
      if (e.state !== 'chase' && e.state !== 'attack') return false;
      const hpp = e.hp / e.maxHp;
      const now = sc.clock;
      b.zones = b.zones.filter((z) => z.alive);
      if (!b.shieldDone && hpp < 0.65) {
        b.shieldDone = true;
        e.reduce = 0.85;
        b.shieldUntil = now + 30000;
        b.seals = (sc.mapDef.crystalSpawns || []).map((c) => sc.spawner.spawnSummon('king_seal', c.x * TILE + 16, c.y * TILE + 16)).filter(Boolean);
        b.aura = sc.add.image(0, -e.height / 2, 'light_white').setScale(2).setAlpha(0.55).setTint(0xa070e0).setBlendMode(Phaser.BlendModes.ADD);
        e.container.addAt(b.aura, 0);
        announce(e, 'KIRIK TAÇ! İki kadim mührü kır!', '#e0c8ff');
        sound.play('shield');
      }
      if (e.reduce > 0) {
        b.seals = b.seals.filter((c) => !c.dead);
        if (!b.seals.length || now > b.shieldUntil) b.dropShield(b.seals.length ? 'Taç kalkanı söndü.' : 'Kadim mühürler kırıldı!');
      }
      if (!b.fury && hpp < 0.3) {
        b.fury = true; e.speedMult = 1.2; e.atkMult = 0.75; e.furyTint = 0xd8b0ff; e.sprite.setTint(0xd8b0ff);
        announce(e, 'SON HÜKÜM!', '#ff9a8a'); sound.play('roar'); sc.fx.shake(0.009, 320);
        b.cd.ring = 2;
      }
      if (e.casting || e.windup) return false;
      const mult = b.fury ? 1 / 0.75 : 1;
      for (const k of Object.keys(b.cd)) b.cd[k] -= dt * mult;
      const dP = Math.hypot(p.x - e.x, p.y - e.y);
      const phase = b.phase();
      if (phase === 3 && b.cd.ring <= 0 && dP < 8 * TILE) return b.verdictRing(p), false;
      if (b.cd.judge <= 0 && dP < 4.2 * TILE) return b.judge(p), false;
      if (b.cd.lunge <= 0 && dP > 3 * TILE && dP < 9 * TILE && e.canSee(p)) {
        b.cd.lunge = phase >= 2 ? 9 : 11;
        e.dashAt(p, { len: Math.min(dP + TILE, 9 * TILE), w: 1.5 * TILE, dur: b.fury ? 900 : 1100, coef: 1.6, label: 'Ani Hamle', tint: 0xa070e0 });
        return false;
      }
      if (b.cd.missiles <= 0 && dP < 11 * TILE) return b.missiles(p), false;
      return false;
    },
    dropShield(msg) {
      e.reduce = 0;
      b.seals.forEach((c) => !c.dead && e.scene.spawner.despawn(c));
      b.seals = [];
      b.aura?.destroy(); b.aura = null;
      announce(e, msg, '#e0c8ff');
    },
    // Kraliyet Yargısı: geniş ön kılıç savurması
    judge(p) {
      const sc = e.scene;
      b.cd.judge = 7;
      const ang = Math.atan2(p.y - e.y, p.x - e.x), r = 3.9 * TILE, dur = b.fury ? 1250 : 1500;
      sc.fx.telegraph({ kind: 'cone', x: e.x, y: e.y - 6, r, angle: ang }, dur, 0xa070e0);
      sound.play('warn');
      e.setFacing(Math.cos(ang));
      e.casting = { t: dur / 1000, fn: () => {
        if (e.dead) return;
        e.playAnim('atk');
        sc.fx.sprite('slash', e.x + Math.cos(ang) * 40, e.y - 14 + Math.sin(ang) * 40, { scale: 3.8, rotation: ang, tint: 0xc8a0ff });
        sound.play('slam'); sc.fx.shake(0.01, 220);
        if (coneHit(e, p, ang, r)) sc.combat.enemyHitsPlayer(e, { coef: 2.0, label: 'Kraliyet Yargısı' });
      } };
    },
    // Kara Mermiler: oyuncunun çevresine düşen mermiler (I: 3, II–III: 5); her biri ayrı uyarılı
    missiles(p) {
      const sc = e.scene;
      const phase = b.phase();
      b.cd.missiles = phase >= 2 ? 9 : 11;
      announce(e, 'Kara Mermiler!', '#c8a0ff');
      sound.play('warn');
      e.playAnim('atk');
      const spots = [[0, 0], [1.6, 0.6], [-1.5, 0.7], [0.4, -1.5], [-0.6, 1.6]].slice(0, phase >= 2 ? 5 : 3);
      spots.forEach(([ox, oy], i) => sc.time.delayedCall(i * 140, () => {
        if (e.dead) return;
        sc.combat.fallingShard({ x: p.x + ox * TILE, y: p.y + oy * TILE, r: 0.95 * TILE, delay: 1.4, coef: 1.1, src: e, dark: true });
      }));
      e.casting = { t: 0.6, fn: () => {} };
    },
    // Son Hüküm: bossun çevresinde ardışık 3 dilimi boş bırakan karanlık halka + en çok 4 kalıcı karanlık alan
    verdictRing(p) {
      const sc = e.scene;
      b.cd.ring = 11;
      const n = 12, R = 3.6 * TILE, r = 1.15 * TILE, dur = 1600;
      const gap = Math.floor(Math.random() * n);
      const spots = [];
      for (let i = 0; i < n; i++) {
        if ((i - gap + n) % n < 3) continue;
        const a = (i / n) * Math.PI * 2;
        spots.push({ x: e.x + Math.cos(a) * R, y: e.y + Math.sin(a) * R * 0.75 });
      }
      for (const s of spots) sc.fx.telegraph({ kind: 'circle', x: s.x, y: s.y, r }, dur, 0xa070e0);
      announce(e, 'Son Hüküm!', '#ff9a8a');
      sound.play('warn');
      e.casting = { t: dur / 1000, fn: () => {
        if (e.dead) return;
        sound.play('bolt');
        let hit = false;
        for (const s of spots) {
          sc.fx.sprite('shatter', s.x, s.y, { scale: 1.1, tint: 0xa070e0 });
          if (!hit && !p.dead && inTelegraphCircle(p.x, p.y, s.x, s.y, r)) hit = true;
        }
        if (hit) sc.combat.enemyHitsPlayer(e, { coef: 1.6, dmgType: 'magic', label: 'Son Hüküm' });
        // kalıcı karanlık alan: oyuncunun bulunduğu yerde (uyarılı); toplam en çok 4 — arena hep geniş kalır
        if (b.zones.length < MAX_KING_ZONES && !p.dead) {
          b.zones.push(sc.combat.groundHazard({ x: p.x, y: p.y, r: 1.4 * TILE, dur: 12, tick: 0.6, coef: 0.24, src: e, key: 'void_ground', label: 'Karanlık Alan', warn: 1.4 }));
        }
      } };
    },
    reset() {
      if (e.reduce > 0 || b.seals.length) { b.seals.forEach((c) => !c.dead && e.scene.spawner.despawn(c)); b.seals = []; b.aura?.destroy(); b.aura = null; e.reduce = 0; }
      e.scene.combat.clearHazards();
      b.zones = [];
      b.shieldDone = false; b.fury = false; b.cd = { judge: 3.5, lunge: 8, missiles: 6, ring: 6 };
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
