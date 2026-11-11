// Sunucu tarafı boss davranışları: istemcideki bosses*.js'nin (V1–V4) görüntüsüz kopyası. Süre/şekil/katsayılar aynı.
// Fark: alan saldırıları alandaki HER oyuncuyu vurur; hedef p = boss'un o anki hedefi (yakınlık + tehdit).
// Oyuncuya etkiler isabet mesajında gider: kb (geri itme), stun (sersemletme), pslow (doğrudan yavaşlatma).
import { TILE } from '../../src/data/constants.js';
import { inCircle, inBeam, inCone } from './geom.mjs';

const STORM = 0x9ad0ff, STAR = 0xfff0c0, ASTRAL = 0xb0a0ff;
const MAX_FISSURES = 3, MAX_GRAVE_HAZARDS = 3, BANNER_R = 6 * TILE, MAX_KING_ZONES = 4, MAX_STORM_TRAILS = 3, MAX_STAR_ZONES = 4;
export const TYRANT_CRYSTAL_SEC = 25;
export const TYRANT_CRACK = { sec: 15, defMult: 0.65 };
export const PRISONER_SHIELD = { below: 0.65, reduce: 0.85, sec: 30 };

export function makeBossBehavior(e) {
  const ai = e.tpl.ai;
  if (ai === 'boss_alpha') return alpha(e);
  if (ai === 'boss_golem') return shieldBoss(e, { kind: 'golem' });
  if (ai === 'boss_ash') return ashGiant(e);
  if (ai === 'boss_frost') return shieldBoss(e, { kind: 'frost' });
  if (ai === 'boss_commander') return graveCommander(e);
  if (ai === 'boss_king') return shieldBoss(e, { kind: 'king' });
  if (ai === 'boss_tyrant') return stormTyrant(e);
  if (ai === 'boss_prisoner') return shieldBoss(e, { kind: 'prisoner' });
  return null;
}

const ann = (e, text, color) => e.z.announce(e, text, color);
const alive = (list) => list.filter((s) => !s.dead);
const fighting = (e) => e.state === 'chase' || e.state === 'attack';

function ringSpots(e, n, R, gapN) {
  const gap = Math.floor(Math.random() * n), spots = [];
  for (let i = 0; i < n; i++) {
    if ((i - gap + n) % n < gapN) continue;
    const a = (i / n) * Math.PI * 2;
    spots.push({ x: e.x + Math.cos(a) * R, y: e.y + Math.sin(a) * R * 0.75 });
  }
  return spots;
}
function scatter(z, p, n, dMin, dSpan) {
  const spots = [{ x: p.x, y: p.y }];
  for (let i = 1; i < n; i++) {
    for (let k = 0; k < 10; k++) {
      const a = Math.random() * Math.PI * 2, d = (dMin + Math.random() * dSpan) * TILE;
      const x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
      if (!z.grid.blockedAt(x, y)) { spots.push({ x, y }); break; }
    }
  }
  return spots;
}
function fury(e, b, below, { speed, atk, tint, text, color = '#ff9a4a' }) {
  if (b.fury || e.hp / e.maxHp >= below) return false;
  b.fury = true; e.speedMult = speed; e.atkMult = atk; e.tint = tint;
  ann(e, text, color); e.z.fx('none', e.x, e.y, { snd: 'roar', shake: 1 });
  return true;
}
function resetBase(e, b) {
  b.fury = false; e.speedMult = 1; e.atkMult = 1; e.tint = 0; e.aura = 0; e.reduce = 0;
}
function tickCd(b, dt, mult) { for (const k of Object.keys(b.cd)) b.cd[k] -= dt * mult; }
function summon(e, b, id, n, rx, ry) {
  const need = n - alive(b.summons).length;
  for (let i = 0; i < need; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = e.z.spawnSummon(id, e.x + Math.cos(a) * rx * TILE, e.y + Math.sin(a) * ry * TILE, e);
    if (s) b.summons.push(s);
  }
}

// ------------------------------------------------------------------------------------------ Alfa Kurt
function alpha(e) {
  const b = {
    lungeCd: 5, howl70: false, howl40: false, howlCd: 0, fury: false, dash: null, summons: [],
    phase() { return b.fury ? 2 : 1; },
    update(dt, p) {
      const z = e.z;
      if (!fighting(e)) return false;
      const hpp = e.hp / e.maxHp;
      fury(e, b, 0.25, { speed: 1.25, atk: 0.75, tint: 0xff9090, text: 'SON ÖFKE!' });
      if (b.dash) {
        const d = b.dash, step = 7.5 * TILE * dt;
        const moved = z.grid.move(e, Math.cos(d.ang) * step, Math.sin(d.ang) * step);
        d.left -= step; e.moving = true;
        for (const q of z.players.values()) {
          if (q.dead || d.hit.has(q.uid)) continue;
          if (Math.hypot(q.x - e.x, q.y - e.y) < e.radius + 9 + 10) { d.hit.add(q.uid); z.hit(q.uid, e, { coef: 1.8, label: 'Yırtıcı Atılım', kb: [d.ang, 30] }); }
        }
        if (d.left <= 0 || !moved) {
          for (const q of z.players.values()) if (!q.dead && !d.hit.has(q.uid) && inBeam(q.x, q.y, d.ox, d.oy, d.ang, d.len, d.w)) { d.hit.add(q.uid); z.hit(q.uid, e, { coef: 1.8, label: 'Yırtıcı Atılım' }); }
          b.dash = null;
        }
        return true;
      }
      if (e.casting || e.windup) return false;
      b.summons = alive(b.summons);
      b.howlCd -= dt;
      if ((hpp < 0.7 && !b.howl70) || (hpp < 0.4 && !b.howl40) || (b.fury && b.howlCd <= 0 && b.summons.length === 0)) {
        if (hpp < 0.7) b.howl70 = true;
        if (hpp < 0.4) b.howl40 = true;
        b.howlCd = 30;
        z.telegraph({ kind: 'ring', x: e.x, y: e.y, r: 2.2 * TILE }, 1200, 0xffb040);
        e.cast(1200, () => { z.fx('none', e.x, e.y, { snd: 'howl' }); ann(e, 'Sürü Uluması!', '#ffd080'); summon(e, b, 'pack_wolf', 2, 2, 2); });
        return false;
      }
      b.lungeCd -= dt;
      const dP = Math.hypot(p.x - e.x, p.y - e.y);
      if (b.lungeCd <= 0 && dP > 1.6 * TILE && dP < 8 * TILE && e.canSee(p)) {
        b.lungeCd = b.fury ? 6 : 9;
        const ang = Math.atan2(p.y - e.y, p.x - e.x), len = Math.min(7.5 * TILE, dP + 2 * TILE), w = 1.4 * TILE, dur = 1400;
        z.telegraph({ kind: 'rect', x: e.x, y: e.y, len, width: w, angle: ang }, dur);
        e.setFacing(Math.cos(ang));
        const ox = e.x, oy = e.y;
        e.cast(dur, () => { b.dash = { ang, left: len, len, w, ox, oy, hit: new Set() }; });
      }
      return false;
    },
    reset() { b.summons.forEach((s) => e.z.despawn(s)); b.summons = []; b.howl70 = b.howl40 = false; b.dash = null; b.lungeCd = 5; resetBase(e, b); },
    onDeath() { b.summons.forEach((s) => e.z.despawn(s)); b.summons = []; },
  };
  return b;
}

// ------------------------------------------------------------------- kalkanlı boss'lar (Golem, Muhafız, Kral, Mahkûm)
// Ortak: eşikte kalkan + 2 kristal/mühür (crystalSpawns), kristaller kırılınca ya da süre dolunca kalkan söner, öfke fazı.
const SHIELD = {
  golem: { below: 0.5, reduce: 0.85, sec: 25, crystal: 'shield_crystal', aura: 0x7ae0ff, text: 'KRİSTAL KALKANI! İki kristali kır!', c: '#7ae0ff', broke: 'Kalkan kırıldı!', faded: 'Kalkan söndü.', furyAt: 0.25, furyTint: 0xffa0a0, furyText: 'SON ÖFKE!', speed: 1.25, atk: 0.75, cdMult: 1 / 0.7 },
  frost: { below: 0.65, reduce: 0.8, sec: 25, crystal: 'frost_seal_crystal', aura: 0x9fe8ff, text: 'BUZ MÜHRÜ! İki kristali kır!', c: '#9fe8ff', broke: 'Buz Mührü kırıldı!', faded: 'Mühür söndü.', furyAt: 0.3, furyTint: 0xc8e8ff, furyText: 'KIŞIN ÖFKESİ!', furyColor: '#c8f0ff', speed: 1.2, atk: 0.8, cdMult: 1 / 0.75 },
  king: { below: 0.65, reduce: 0.85, sec: 30, crystal: 'king_seal', aura: 0xa070e0, text: 'KIRIK TAÇ! İki kadim mührü kır!', c: '#e0c8ff', broke: 'Kadim mühürler kırıldı!', faded: 'Taç kalkanı söndü.', furyAt: 0.3, furyTint: 0xd8b0ff, furyText: 'SON HÜKÜM!', furyColor: '#ff9a8a', speed: 1.2, atk: 0.75, cdMult: 1 / 0.75 },
  prisoner: { below: PRISONER_SHIELD.below, reduce: PRISONER_SHIELD.reduce, sec: PRISONER_SHIELD.sec, crystal: 'sky_seal', aura: ASTRAL, text: 'KIRILAN MÜHÜRLER! İki Gök Mührünü kır!', c: '#e0d8ff', broke: 'Gök Mühürleri kırıldı!', faded: 'Gök kalkanı söndü.', furyAt: 0.3, furyTint: 0xe0d8ff, furyText: 'YILDIZLARIN SONU!', furyColor: '#ff9a8a', speed: 1.2, atk: 0.75, cdMult: 1 / 0.75 },
};
const CD0 = {
  golem: { crush: 4, burst: 7, quake: 10 },
  frost: { spear: 4, smash: 3, ring: 9 },
  king: { judge: 3.5, lunge: 8, missiles: 6, ring: 6 },
  prisoner: { chains: 5, swing: 3.5, stars: 7, ring: 6 },
};

function shieldBoss(e, { kind }) {
  const S = SHIELD[kind];
  const b = {
    cd: { ...CD0[kind] }, shieldDone: false, shieldUntil: 0, crystals: [], fury: false, zones: [], freezeAt: new Map(),
    phase() { return b.fury ? 3 : e.hp / e.maxHp > S.below ? 1 : 2; },
    update(dt, p) {
      const z = e.z;
      if (!fighting(e)) return false;
      const hpp = e.hp / e.maxHp, now = z.clock;
      b.zones = b.zones.filter((h) => !h.dead);
      if (!b.shieldDone && hpp < S.below) {
        b.shieldDone = true;
        e.reduce = S.reduce; e.aura = S.aura;
        b.shieldUntil = now + S.sec * 1000;
        b.crystals = (z.def.crystalSpawns || []).map((c) => z.spawnSummon(S.crystal, c.x * TILE + 16, c.y * TILE + 16, e)).filter(Boolean);
        ann(e, S.text, S.c); z.fx('none', e.x, e.y, { snd: 'shield' });
      }
      if (e.reduce > 0 && b.shieldDone) {
        b.crystals = alive(b.crystals);
        if (!b.crystals.length || now > b.shieldUntil) b.dropShield(b.crystals.length ? S.faded : S.broke);
      }
      if (fury(e, b, S.furyAt, { speed: S.speed, atk: S.atk, tint: S.furyTint, text: S.furyText, color: S.furyColor })) b.cd.ring = 2;
      if (e.casting || e.windup) return false;
      tickCd(b, dt, b.fury ? S.cdMult : 1);
      const dP = Math.hypot(p.x - e.x, p.y - e.y), ph = b.phase();
      return ATTACKS[kind](e, b, p, dP, ph), false;
    },
    dropShield(msg) {
      e.reduce = 0; e.aura = 0;
      b.crystals.forEach((c) => e.z.despawn(c)); b.crystals = [];
      ann(e, msg, S.c);
    },
    reset() {
      b.crystals.forEach((c) => e.z.despawn(c)); b.crystals = [];
      e.z.clearHazards(e); b.zones = [];
      b.shieldDone = false; b.cd = { ...CD0[kind] }; b.freezeAt.clear();
      resetBase(e, b);
    },
    onDeath() { b.crystals.forEach((c) => e.z.despawn(c)); b.crystals = []; e.z.clearHazards(e); },
  };
  return b;
}

const ATTACKS = {
  golem(e, b, p, dP, ph) {
    const z = e.z;
    if (ph >= 2 && b.cd.quake <= 0 && dP < 6 * TILE) {
      b.cd.quake = 16;
      const r = 5 * TILE;
      z.telegraph({ kind: 'circle', x: e.x, y: e.y, r }, 1800, 0xff7a30);
      ann(e, 'Yer Sarsıntısı!', '#ffb070');
      e.cast(1800, () => {
        z.fx('burst', e.x, e.y, { tint: 0xa08060, snd: 'slam', shake: 2 });
        e.areaHit((q) => inCircle(q.x, q.y, e.x, e.y, r), { coef: 1.5, label: 'Yer Sarsıntısı', pslow: [0.4, 3] });
      });
    } else if (b.cd.crush <= 0 && dP < 3.8 * TILE) {
      b.cd.crush = 10;
      const ang = Math.atan2(p.y - e.y, p.x - e.x);
      const cx = e.x + Math.cos(ang) * 1.4 * TILE, cy = e.y + Math.sin(ang) * 1.4 * TILE, r = 2.3 * TILE;
      z.telegraph({ kind: 'circle', x: cx, y: cy, r }, 1500);
      e.setFacing(Math.cos(ang));
      e.cast(1500, () => {
        e.anim('atk');
        z.fx('explosion', cx, cy, { scale: 1.2, tint: 0xb0a090, snd: 'slam', shake: 1 });
        e.areaHit((q) => inCircle(q.x, q.y, cx, cy, r), { coef: 2.2, label: 'Ezici Darbe', stun: 1.0 });
      });
    } else if (b.cd.burst <= 0 && dP < 10 * TILE) {
      b.cd.burst = 13;
      const r = 1.5 * TILE, spots = scatter(z, p, ph >= 2 ? 5 : 3, 1.5, 3);
      for (const s of spots) z.telegraph({ kind: 'circle', x: s.x, y: s.y, r }, 1600, 0x5ac8ff);
      e.cast(1600, () => {
        for (const s of spots) z.fx('ice', s.x, s.y, { scale: 1.1, snd: s === spots[0] ? 'ice' : null });
        e.areaHit((q) => spots.some((s) => inCircle(q.x, q.y, s.x, s.y, r)), { coef: 1.6, dt: 'magic', label: 'Kristal Patlaması' });
      });
    }
  },
  frost(e, b, p, dP, ph) {
    const z = e.z;
    if (ph >= 2 && b.cd.ring <= 0 && dP < 7 * TILE) {
      b.cd.ring = b.fury ? 11 : 14;
      const r = 1.15 * TILE, spots = ringSpots(e, 12, 3.6 * TILE, 3);
      for (const s of spots) z.telegraph({ kind: 'circle', x: s.x, y: s.y, r }, 1700, 0x5ac8ff);
      ann(e, 'Buz Çemberi!', '#9fe8ff');
      e.cast(1700, () => {
        for (const s of spots) z.fx('ice', s.x, s.y, { scale: 0.9, snd: s === spots[0] ? 'ice' : null });
        e.areaHit((q) => spots.some((s) => inCircle(q.x, q.y, s.x, s.y, r)), { coef: 1.6, dt: 'magic', label: 'Buz Çemberi', slow: [0.3, 1.5] });
      });
    } else if (b.cd.smash <= 0 && dP < 3.4 * TILE) {
      b.cd.smash = 8;
      const r = 3 * TILE, dur = b.fury ? 1250 : 1450;
      z.telegraph({ kind: 'circle', x: e.x, y: e.y, r }, dur, 0x7ad8ff);
      e.cast(dur, () => {
        e.anim('atk');
        z.fx('shatter', e.x, e.y - 8, { scale: 3.4, snd: 'slam', shake: 1 });
        for (const q of z.players.values()) {
          if (q.dead || !inCircle(q.x, q.y, e.x, e.y, r)) continue;
          const canFreeze = b.fury && z.clock >= (b.freezeAt.get(q.uid) || 0);
          if (canFreeze) { b.freezeAt.set(q.uid, z.clock + 12000); z.hit(q.uid, e, { coef: 1.7, label: 'Donuk Darbe', stun: 0.6, say: 'Dondun!' }); }
          else z.hit(q.uid, e, { coef: 1.7, label: 'Donuk Darbe', slow: [0.3, 1.5] });
        }
      });
    } else if (b.cd.spear <= 0 && dP < 9 * TILE && e.canSee(p)) {
      b.cd.spear = 9;
      const ang = Math.atan2(p.y - e.y, p.x - e.x), len = 8.5 * TILE, w = 1.3 * TILE, dur = b.fury ? 1300 : 1600;
      const ox = e.x, oy = e.y - 10;
      z.telegraph({ kind: 'rect', x: ox, y: oy, len, width: w, angle: ang }, dur, 0x7ad8ff);
      e.setFacing(Math.cos(ang));
      e.cast(dur, () => {
        e.anim('atk');
        z.fx('beam_line', ox, oy, { angle: ang, len, width: w * 0.5, tint: 0xc8f0ff, snd: 'ice' });
        e.areaHit((q) => inBeam(q.x, q.y - 8, ox, oy, ang, len, w), { coef: 2.0, dt: 'magic', label: 'Buz Mızrağı' });
      });
    }
  },
  king(e, b, p, dP, ph) {
    const z = e.z;
    if (ph === 3 && b.cd.ring <= 0 && dP < 8 * TILE) {
      b.cd.ring = 11;
      const r = 1.15 * TILE, spots = ringSpots(e, 12, 3.6 * TILE, 3);
      for (const s of spots) z.telegraph({ kind: 'circle', x: s.x, y: s.y, r }, 1600, 0xa070e0);
      ann(e, 'Son Hüküm!', '#ff9a8a');
      e.cast(1600, () => {
        for (const s of spots) z.fx('shatter', s.x, s.y, { scale: 1.1, tint: 0xa070e0, snd: s === spots[0] ? 'bolt' : null });
        e.areaHit((q) => spots.some((s) => inCircle(q.x, q.y, s.x, s.y, r)), { coef: 1.6, dt: 'magic', label: 'Son Hüküm' });
        if (b.zones.length < MAX_KING_ZONES && p && !p.dead) b.zones.push(z.hazard({ x: p.x, y: p.y, r: 1.4 * TILE, dur: 12, tick: 0.6, coef: 0.24, src: e, key: 'void_ground', label: 'Karanlık Alan', warn: 1.4 }));
      });
    } else if (b.cd.judge <= 0 && dP < 4.2 * TILE) {
      b.cd.judge = 7;
      const ang = Math.atan2(p.y - e.y, p.x - e.x), r = 3.9 * TILE, dur = b.fury ? 1250 : 1500;
      z.telegraph({ kind: 'cone', x: e.x, y: e.y - 6, r, angle: ang }, dur, 0xa070e0);
      e.setFacing(Math.cos(ang));
      e.cast(dur, () => {
        e.anim('atk');
        z.fx('slash', e.x + Math.cos(ang) * 40, e.y - 14 + Math.sin(ang) * 40, { scale: 3.8, rotation: ang, tint: 0xc8a0ff, snd: 'slam', shake: 1 });
        e.areaHit((q) => inCone(q.x, q.y, e.x, e.y, ang, r), { coef: 2.0, label: 'Kraliyet Yargısı' });
      });
    } else if (b.cd.lunge <= 0 && dP > 3 * TILE && dP < 9 * TILE && e.canSee(p)) {
      b.cd.lunge = ph >= 2 ? 9 : 11;
      e.dashAt(p, { len: Math.min(dP + TILE, 9 * TILE), w: 1.5 * TILE, dur: b.fury ? 900 : 1100, coef: 1.6, label: 'Ani Hamle', tint: 0xa070e0 });
    } else if (b.cd.missiles <= 0 && dP < 11 * TILE) {
      b.cd.missiles = ph >= 2 ? 9 : 11;
      ann(e, 'Kara Mermiler!', '#c8a0ff');
      e.anim('atk');
      const spots = [[0, 0], [1.6, 0.6], [-1.5, 0.7], [0.4, -1.5], [-0.6, 1.6]].slice(0, ph >= 2 ? 5 : 3);
      const px = p.x, py = p.y;
      spots.forEach(([ox, oy], i) => z.later(i * 140, () => { if (!e.dead) z.shard({ x: px + ox * TILE, y: py + oy * TILE, r: 0.95 * TILE, delay: 1.4, coef: 1.1, src: e, style: 'dark' }); }));
      e.cast(600, () => {});
    }
  },
  prisoner(e, b, p, dP, ph) {
    const z = e.z;
    if (ph === 3 && b.cd.ring <= 0 && dP < 8 * TILE) {
      b.cd.ring = 11;
      const r = 1.15 * TILE, spots = ringSpots(e, 12, 3.6 * TILE, 3);
      for (const s of spots) z.telegraph({ kind: 'circle', x: s.x, y: s.y, r }, 1600, STAR);
      ann(e, 'Yıldızların Sonu!', '#ff9a8a');
      e.cast(1600, () => {
        for (const s of spots) z.fx('shatter', s.x, s.y, { scale: 1.1, tint: STAR, snd: s === spots[0] ? 'bolt' : null });
        e.areaHit((q) => spots.some((s) => inCircle(q.x, q.y, s.x, s.y, r)), { coef: 1.6, dt: 'magic', label: 'Yıldızların Sonu' });
        if (b.zones.length < MAX_STAR_ZONES && p && !p.dead) b.zones.push(z.hazard({ x: p.x, y: p.y, r: 1.4 * TILE, dur: 12, tick: 0.6, coef: 0.24, src: e, key: 'void_ground', tint: ASTRAL, label: 'Yıldız Alanı', warn: 1.4 }));
      });
    } else if (b.cd.swing <= 0 && dP < 4.2 * TILE) {
      b.cd.swing = 7;
      const ang = Math.atan2(p.y - e.y, p.x - e.x), r = 4 * TILE, dur = b.fury ? 1250 : 1500;
      z.telegraph({ kind: 'cone', x: e.x, y: e.y - 6, r, angle: ang }, dur, ASTRAL);
      e.setFacing(Math.cos(ang));
      e.cast(dur, () => {
        e.anim('atk');
        z.fx('slash', e.x + Math.cos(ang) * 40, e.y - 14 + Math.sin(ang) * 40, { scale: 4, rotation: ang, tint: ASTRAL, snd: 'slam', shake: 1 });
        e.areaHit((q) => inCone(q.x, q.y, e.x, e.y, ang, r), { coef: 2.0, label: 'Zincir Savuruşu' });
      });
    } else if (b.cd.chains <= 0 && dP > 2.5 * TILE && dP < 10 * TILE && e.canSee(p)) {
      b.cd.chains = ph >= 2 ? 9 : 11;
      const ang = Math.atan2(p.y - e.y, p.x - e.x), len = 10 * TILE, w = 1.3 * TILE, dur = b.fury ? 1150 : 1350;
      const ox = e.x, oy = e.y - 10;
      z.telegraph({ kind: 'rect', x: ox, y: oy, len, width: w, angle: ang }, dur, ASTRAL);
      ann(e, 'Göğün Zincirleri!', '#e0d8ff');
      e.setFacing(Math.cos(ang));
      e.cast(dur, () => {
        e.anim('atk');
        z.fx('beam_line', ox, oy, { angle: ang, len, width: w * 0.5, tint: ASTRAL, snd: 'bolt' });
        e.areaHit((q) => inBeam(q.x, q.y - 8, ox, oy, ang, len, w), { coef: 1.7, dt: 'magic', label: 'Göğün Zincirleri', kb: [ang + Math.PI, 40] });
      });
    } else if (b.cd.stars <= 0 && dP < 11 * TILE) {
      b.cd.stars = ph >= 2 ? 9 : 11;
      ann(e, 'Gök Yargısı!', '#fff0c0');
      e.anim('atk');
      const spots = [[0, 0], [1.6, 0.6], [-1.5, 0.7], [0.4, -1.5], [-0.6, 1.6]].slice(0, ph >= 2 ? 5 : 3);
      const px = p.x, py = p.y;
      spots.forEach(([ox, oy], i) => z.later(i * 140, () => { if (!e.dead) z.shard({ x: px + ox * TILE, y: py + oy * TILE, r: 0.95 * TILE, delay: 1.4, coef: 1.1, src: e, style: 'star', label: 'Düşen Yıldız' }); }));
      e.cast(600, () => {});
    }
  },
};

// ------------------------------------------------------------------------------------------ Kül Devi
function ashGiant(e) {
  const b = {
    cd: { fist: 3.5, fissure: 6 }, called55: false, called30: false, fury: false, summons: [], fissures: [],
    phase() { return b.fury ? 3 : e.hp / e.maxHp < 0.55 ? 2 : 1; },
    update(dt, p) {
      const z = e.z;
      if (!fighting(e)) return false;
      const hpp = e.hp / e.maxHp;
      b.summons = alive(b.summons);
      b.fissures = b.fissures.filter((h) => !h.dead);
      fury(e, b, 0.2, { speed: 1.15, atk: 0.8, tint: 0xffa080, text: 'SON KOR!' });
      if (e.casting || e.windup) return false;
      if ((hpp < 0.55 && !b.called55) || (hpp < 0.3 && !b.called30 && b.summons.length === 0)) {
        if (hpp < 0.55) b.called55 = true;
        if (hpp < 0.3) b.called30 = true;
        z.telegraph({ kind: 'ring', x: e.x, y: e.y, r: 2.4 * TILE }, 1300, 0xffb040);
        e.cast(1300, () => { z.fx('none', e.x, e.y, { snd: 'roar' }); ann(e, 'Kül Çağrısı!', '#ffd080'); summon(e, b, 'ember_spawn', 2, 2.5, 2); });
        return false;
      }
      tickCd(b, dt, b.fury ? 1 / 0.75 : 1);
      const dP = Math.hypot(p.x - e.x, p.y - e.y);
      if (b.cd.fist <= 0 && dP < 4 * TILE) {
        b.cd.fist = 8;
        const ang = Math.atan2(p.y - e.y, p.x - e.x);
        const cx = e.x + Math.cos(ang) * 1.6 * TILE, cy = e.y + Math.sin(ang) * 1.6 * TILE, r = 2.4 * TILE, dur = b.fury ? 1300 : 1600;
        z.telegraph({ kind: 'circle', x: cx, y: cy, r }, dur, 0xff6a1a);
        e.setFacing(Math.cos(ang));
        e.cast(dur, () => {
          e.anim('atk');
          z.fx('explosion', cx, cy, { scale: 1.3, tint: 0xff8a40, snd: 'slam', shake: 1 });
          z.fx('ash_puff', cx, cy - 10, { scale: 2.6 });
          e.areaHit((q) => inCircle(q.x, q.y, cx, cy, r), { coef: 2.0, label: 'Kor Yumruğu', kb: [ang, 36] });
        });
      } else if (b.cd.fissure <= 0 && dP < 11 * TILE && b.fissures.length < MAX_FISSURES) {
        b.cd.fissure = b.phase() >= 2 ? 9 : 12;
        const n = Math.min(MAX_FISSURES - b.fissures.length, b.phase() >= 2 ? 2 : 1);
        ann(e, 'Alev Yarıkları!', '#ffb070');
        e.anim('atk');
        for (const s of scatter(z, p, n, 2.5, 2.5)) b.fissures.push(z.hazard({ x: s.x, y: s.y, r: 1.5 * TILE, dur: 7, tick: 0.6, coef: 0.24, src: e, key: 'fire_ground', label: 'Alev Yarığı', warn: 1.4 }));
        e.cast(500, () => {});
      }
      return false;
    },
    reset() { b.summons.forEach((s) => e.z.despawn(s)); b.summons = []; e.z.clearHazards(e); b.fissures = []; b.called55 = b.called30 = false; b.cd = { fist: 3.5, fissure: 6 }; resetBase(e, b); },
    onDeath() { b.summons.forEach((s) => e.z.despawn(s)); b.summons = []; e.z.clearHazards(e); },
  };
  return b;
}

// ------------------------------------------------------------------------------------------ Mezar Komutanı
function graveCommander(e) {
  const b = {
    cd: { strike: 3.5, rift: 7, banner: 0 }, called70: false, called40: false, fury: false, summons: [], banner: null, hazards: [],
    phase() { return b.fury ? 3 : e.hp / e.maxHp < 0.7 ? 2 : 1; },
    update(dt, p) {
      const z = e.z;
      if (!fighting(e)) return false;
      const hpp = e.hp / e.maxHp;
      b.summons = alive(b.summons);
      b.hazards = b.hazards.filter((h) => !h.dead);
      if (b.banner?.dead) { b.banner = null; b.cd.banner = 25; ann(e, 'Bayrak düştü!', '#e0d8c4'); }
      for (const s of b.summons) {
        const on = !!b.banner && Math.hypot(s.x - b.banner.x, s.y - b.banner.y) < BANNER_R;
        s.dmgMult = on ? 1.3 : 1; s.reduce = on ? 0.3 : 0; s.tint = on ? 0xc8a0ff : 0;
      }
      fury(e, b, 0.25, { speed: 1.15, atk: 0.75, tint: 0xd8b0ff, text: 'SON NÖBET!', color: '#ff9a8a' });
      if (e.casting || e.windup) return false;
      if ((hpp < 0.7 && !b.called70) || (hpp < 0.4 && !b.called40)) {
        if (hpp < 0.7) b.called70 = true;
        if (hpp < 0.4) b.called40 = true;
        z.telegraph({ kind: 'ring', x: e.x, y: e.y, r: 2.4 * TILE }, 1300, 0xe0d8c4);
        e.cast(1300, () => { z.fx('none', e.x, e.y, { snd: 'roar' }); ann(e, 'Kemik Çağrısı!', '#e0d8c4'); summon(e, b, 'bone_soldier', 2, 2.5, 2); });
        return false;
      }
      tickCd(b, dt, b.fury ? 1 / 0.75 : 1);
      if (hpp < 0.8 && !b.banner && b.cd.banner <= 0) {
        const a = Math.random() * Math.PI * 2;
        b.cd.banner = 25;
        const s = z.spawnSummon('cursed_banner', e.x + Math.cos(a) * 2 * TILE, e.y + Math.sin(a) * 1.6 * TILE, e);
        if (s) { b.banner = s; s.aura = 0xa070e0; ann(e, 'Lanetli Bayrak! Bayrağı kır.', '#c8a0ff'); z.fx('none', e.x, e.y, { snd: 'shield' }); }
        return false;
      }
      const dP = Math.hypot(p.x - e.x, p.y - e.y);
      if (b.cd.strike <= 0 && dP < 4 * TILE) {
        b.cd.strike = 7.5;
        const ang = Math.atan2(p.y - e.y, p.x - e.x), r = 3.6 * TILE, dur = b.fury ? 1250 : 1500;
        z.telegraph({ kind: 'cone', x: e.x, y: e.y - 6, r, angle: ang }, dur, 0xff5050);
        e.setFacing(Math.cos(ang));
        e.cast(dur, () => {
          e.anim('atk');
          z.fx('slash', e.x + Math.cos(ang) * 40, e.y - 14 + Math.sin(ang) * 40, { scale: 3.6, rotation: ang, tint: 0xe0d8c4, snd: 'slam', shake: 1 });
          e.areaHit((q) => inCone(q.x, q.y, e.x, e.y, ang, r), { coef: 2.0, label: 'Mezar Darbesi', kb: [ang, 30] });
        });
      } else if (b.cd.rift <= 0 && dP < 10 * TILE && b.hazards.length < MAX_GRAVE_HAZARDS) {
        b.cd.rift = b.phase() >= 2 ? 9 : 12;
        ann(e, 'Mezar Çatlağı!', '#c8a0ff');
        e.anim('atk');
        b.hazards.push(z.hazard({ x: p.x, y: p.y, r: 1.5 * TILE, dur: 6, tick: 0.6, coef: 0.22, src: e, key: 'void_ground', label: 'Mezar Çatlağı', warn: 1.4 }));
        e.cast(500, () => {});
      }
      return false;
    },
    clearAll() { b.summons.forEach((s) => e.z.despawn(s)); b.summons = []; if (b.banner) e.z.despawn(b.banner); b.banner = null; e.z.clearHazards(e); b.hazards = []; },
    reset() { b.clearAll(); b.called70 = b.called40 = false; b.cd = { strike: 3.5, rift: 7, banner: 0 }; resetBase(e, b); },
    onDeath() { b.clearAll(); },
  };
  return b;
}

// ------------------------------------------------------------------------------------------ Fırtına Tiranı
function stormTyrant(e) {
  const b = {
    cd: { hammer: 3.5, ring: 9, rain: 6 }, crystalsDone: false, crystals: [], crystalUntil: 0, crackUntil: 0, fury: false, trails: [],
    phase() { return b.fury ? 3 : e.hp / e.maxHp < 0.6 ? 2 : 1; },
    update(dt, p) {
      const z = e.z;
      if (!fighting(e)) return false;
      const hpp = e.hp / e.maxHp, now = z.clock;
      b.trails = b.trails.filter((t) => !t.dead);
      if (!b.crystalsDone && hpp < 0.6) {
        b.crystalsDone = true;
        b.crystalUntil = now + TYRANT_CRYSTAL_SEC * 1000;
        for (const side of [-1, 1]) { const c = z.spawnSummon('tyrant_crystal', e.x + side * 3.2 * TILE, e.y + 0.8 * TILE, e); if (c) b.crystals.push(c); }
        e.reduce = 0.3 * b.crystals.length; e.aura = STORM;
        ann(e, 'KRİSTAL ÇAĞRISI! Kristalleri kır!', '#9ad0ff'); z.fx('none', e.x, e.y, { snd: 'shield' });
      }
      if (b.crystals.length) {
        b.crystals = alive(b.crystals);
        e.reduce = b.crystals.length ? 0.3 * b.crystals.length : 0;
        if (!b.crystals.length) b.crack();
        else if (now > b.crystalUntil) b.blast();
      }
      if (b.crackUntil && now > b.crackUntil) { b.crackUntil = 0; e.defMult = 1; e.tint = b.fury ? 0xb0e0ff : 0; }
      if (fury(e, b, 0.25, { speed: 1.15, atk: 0.75, tint: 0xb0e0ff, text: 'SON GÖK GÜRÜLTÜSÜ!', color: '#ff9a8a' })) b.cd.rain = 1.5;
      if (e.casting || e.windup) return false;
      tickCd(b, dt, b.fury ? 1 / 0.75 : 1);
      const dP = Math.hypot(p.x - e.x, p.y - e.y), ph = b.phase();
      if (b.cd.ring <= 0 && dP < 6.5 * TILE) {
        b.cd.ring = ph >= 2 ? 11 : 13;
        const r = 1.15 * TILE, spots = ringSpots(e, 12, 3.4 * TILE, 3);
        for (const s of spots) z.telegraph({ kind: 'circle', x: s.x, y: s.y, r }, 1600, STORM);
        ann(e, 'Fırtına Halkası!', '#9ad0ff');
        e.cast(1600, () => {
          for (const s of spots) z.fx('shatter', s.x, s.y, { scale: 1.1, tint: STORM, snd: s === spots[0] ? 'bolt' : null });
          e.areaHit((q) => spots.some((s) => inCircle(q.x, q.y, s.x, s.y, r)), { coef: 1.6, dt: 'magic', label: 'Fırtına Halkası', slow: [0.3, 1.5] });
        });
      } else if (b.cd.hammer <= 0 && dP < 4.2 * TILE) {
        b.cd.hammer = 7;
        const ang = Math.atan2(p.y - e.y, p.x - e.x), r = 3.8 * TILE, dur = b.fury ? 1250 : 1500;
        z.telegraph({ kind: 'cone', x: e.x, y: e.y - 6, r, angle: ang }, dur, STORM);
        e.setFacing(Math.cos(ang));
        e.cast(dur, () => {
          e.anim('atk');
          z.fx('slash', e.x + Math.cos(ang) * 40, e.y - 14 + Math.sin(ang) * 40, { scale: 3.8, rotation: ang, tint: STORM, snd: 'slam', shake: 1 });
          e.areaHit((q) => inCone(q.x, q.y, e.x, e.y, ang, r), { coef: 2.0, label: 'Yıldırım Çekici', kb: [ang, 30] });
        });
      } else if (b.cd.rain <= 0 && dP < 11 * TILE) {
        b.cd.rain = ph === 3 ? 7 : ph === 2 ? 9 : 10;
        ann(e, ph === 3 ? 'Son Gök Gürültüsü!' : 'Yıldırım Yağmuru!', ph === 3 ? '#ff9a8a' : '#9ad0ff');
        e.anim('atk');
        const spots = [[0, 0], [1.6, 0.6], [-1.5, 0.7], [0.4, -1.5], [-0.6, 1.6]].slice(0, ph + 2);
        const px = p.x, py = p.y;
        spots.forEach(([ox, oy], i) => z.later(i * 140, () => { if (!e.dead) z.shard({ x: px + ox * TILE, y: py + oy * TILE, r: 0.95 * TILE, delay: 1.4, coef: 1.05, src: e, style: 'storm', label: 'Yıldırım' }); }));
        if (ph === 3 && b.trails.length < MAX_STORM_TRAILS) b.trails.push(z.hazard({ x: p.x, y: p.y, r: 1.3 * TILE, dur: 8, tick: 0.6, coef: 0.2, src: e, key: 'storm_ground', label: 'Fırtına İzi', warn: 1.4 }));
        e.cast(600, () => {});
      }
      return false;
    },
    blast() {
      const z = e.z, list = b.crystals.slice();
      b.crystals = []; e.reduce = 0; e.aura = 0;
      ann(e, 'Kristaller patlıyor!', '#ff9a8a');
      for (const c of list) {
        const x = c.x, y = c.y, r = 2.6 * TILE;
        z.telegraph({ kind: 'circle', x, y, r }, 1400, STORM);
        z.later(1400, () => {
          z.despawn(c);
          z.fx('shatter', x, y - 8, { scale: 2.6, tint: STORM, snd: 'bolt' });
          e.areaHit((q) => inCircle(q.x, q.y, x, y, r), { coef: 1.5, dt: 'magic', label: 'Kristal Patlaması' });
        });
      }
    },
    crack() {
      e.reduce = 0; e.aura = 0;
      e.defMult = TYRANT_CRACK.defMult;
      b.crackUntil = e.z.clock + TYRANT_CRACK.sec * 1000;
      e.tint = 0x7a8aa0;
      ann(e, 'Zırh çatladı! Savunma düştü.', '#e0f4ff'); e.z.fx('none', e.x, e.y, { snd: 'altar' });
    },
    clearAll() { b.crystals.forEach((c) => e.z.despawn(c)); b.crystals = []; e.aura = 0; e.z.clearHazards(e); b.trails = []; },
    reset() { b.clearAll(); b.crystalsDone = false; b.crackUntil = 0; b.cd = { hammer: 3.5, ring: 9, rain: 6 }; e.defMult = 1; resetBase(e, b); },
    onDeath() { b.clearAll(); },
  };
  return b;
}
