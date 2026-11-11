// V4 beceri uygulamaları: Okçu (7), Ölü Çağıran (7), Warrior Yıldırım Yarığı, Mage Astral Patlama.
// Hasar her zaman combat.playerSkillHit üzerinden (tek formül, tek öldürme yolu). Oklar duvara çarpınca kırılır.
import Phaser from 'phaser';
import { TILE } from '../data/constants.js';
import { app } from '../core/app.js';
import { sound } from '../audio/sound.js';
import { fxPackLoaded } from '../art/spriteRuntime.js';

const ARROW_SPEED = 680;

// yön: hedef varsa ona, yoksa bakılan yöne
function aim(pl, t) {
  return t ? Math.atan2(t.y - pl.y, t.x - pl.x) : (pl.facing > 0 ? 0 : Math.PI);
}

// koni içindeki görünür düşmanlar (en yakından)
export function enemiesInCone(sc, pl, ang, range, half, max) {
  return sc.enemies
    .filter((e) => {
      if (e.dead) return false;
      const dx = e.x - pl.x, dy = e.y - pl.y, d = Math.hypot(dx, dy);
      if (d > range + e.radius) return false;
      const da = Math.abs(Phaser.Math.Angle.Wrap(Math.atan2(dy, dx) - ang));
      return da <= half && sc.grid.los(pl.x, pl.y - 6, e.x, e.y - 6);
    })
    .sort((a, b) => Math.hypot(a.x - pl.x, a.y - pl.y) - Math.hypot(b.x - pl.x, b.y - pl.y))
    .slice(0, max);
}

// zemin hedefi: seçili hedef (menzildeyse) ya da önündeki nokta
function groundPoint(pl, s, t) {
  if (t) return { x: t.x, y: t.y };
  const d = Math.min(3, s.range || 3) * TILE;
  return { x: pl.x + pl.facing * d, y: pl.y };
}

export function fireArrow(pl, t, onHit, { tint = null, scale = 1 } = {}) {
  const sc = pl.scene;
  return sc.combat.projectile(pl, t, 'arrow', ARROW_SPEED, onHit, { blockable: true, tint, scale });
}

export function execSkillV4(pl, id, s, rank, t, coef, bk) {
  const sc = pl.scene;
  switch (id) {
    // ================================================================ OKÇU
    case 'aimed_shot':
      pl.playAction('_cast', 0.35, 'atk');
      sc.time.delayedCall(150, () => {
        if (pl.dead || t.dead) return;
        sound.play('swing', { vol: 0.6 });
        fireArrow(pl, t, () => sc.combat.playerSkillHit(t, { coef, skill: id, critMult: bk?.critMult }), { tint: 0xffe8a0, scale: 1.2 });
      });
      return true;
    case 'piercing_arrow':
      pl.playAction('_cast', 0.4, 'atk');
      sc.time.delayedCall(170, () => {
        if (pl.dead || t.dead) return;
        sound.play('bolt', { vol: 0.6 });
        fireArrow(pl, t, () => {
          sc.fx.sprite('spark', t.x, t.y - 16, { scale: 1.8, tint: 0x9ad0ff });
          sc.combat.playerSkillHit(t, { coef, skill: id, defIgnore: s.defIgnore + (bk?.ignoreAdd || 0) });
        }, { tint: 0x9ad0ff, scale: 1.5 });
      });
      return true;
    case 'multi_shot':
    case 'eagle_storm': {
      const storm = id === 'eagle_storm';
      pl.playAction('_cast', 0.4, 'atk');
      const ang = aim(pl, t);
      pl.face(Math.cos(ang));
      sc.time.delayedCall(140, () => {
        if (pl.dead) return;
        sound.play(storm ? 'bolt' : 'swing', { vol: 0.7 });
        const hits = enemiesInCone(sc, pl, ang, s.range * TILE, s.cone, s.maxTargets + (bk?.targetsAdd || 0));
        if (!hits.length) {
          // boşa atış da görünür
          for (let i = -2; i <= 2; i++) {
            const a = ang + i * s.cone / 3;
            const ghost = { x: pl.x + Math.cos(a) * s.range * TILE * 0.8, y: pl.y + Math.sin(a) * s.range * TILE * 0.8, dead: false, height: 0 };
            fireArrow(pl, ghost, () => {}, { tint: storm ? 0x9ad0ff : null });
          }
        }
        hits.forEach((e, i) => sc.time.delayedCall(i * 40, () => {
          if (e.dead || pl.dead) return;
          fireArrow(pl, e, () => {
            if (storm) sc.combat.lightningLink(e.x, e.y - 90, e.x, e.y - e.height * 0.5);
            sc.combat.playerSkillHit(e, { coef, skill: id });
          }, { tint: storm ? 0x9ad0ff : null, scale: storm ? 1.3 : 1 });
        }));
      });
      return true;
    }
    case 'agile_step': {
      pl.playAction('_cast', 0.2, 'atk');
      const dur = s.dur[rank - 1] + (bk?.durAdd || 0);
      pl.buffs.agile = { until: sc.clock + dur * 1000, value: s.speed[rank - 1], evade: s.evade[rank - 1] };
      sc.fx.text(pl.x, pl.y - 70, 'Çevik Adım', { color: '#9ae0ff', size: 13 });
      sc.fx.burst(pl.x, pl.y - 10, 0x9ae0ff, 12, 80, 420);
      sound.play('buff');
      return true;
    }
    case 'arrow_rain': {
      pl.playAction('_cast', 0.4, 'atk');
      const c = groundPoint(pl, s, t);
      const r = s.radius * TILE;
      sc.fx.telegraph({ kind: 'circle', x: c.x, y: c.y, r }, s.delay * 1000, 0xffd070, { friendly: true });
      sound.play('swing');
      for (let i = 0; i < 12; i++) {
        const a = Math.random() * Math.PI * 2, d = Math.random() * r * 0.85;
        const bx = c.x + Math.cos(a) * d, by = c.y + Math.sin(a) * d * 0.75;
        const ar = sc.fx.sprite('arrow', bx, by - 170, { depth: 59000, rotation: Math.PI / 2 });
        sc.tweens.add({ targets: ar, y: by - 8, duration: s.delay * 1000 * 0.8, delay: i * 25, ease: 'Quad.in', onComplete: () => { sc.fx.sprite('spark', bx, by - 6, { scale: 0.8 }); ar.destroy(); } });
      }
      sc.time.delayedCall(s.delay * 1000, () => {
        if (pl.dead) return;
        sound.play('hit');
        const hits = sc.combat.enemiesInRadius(c.x, c.y, r, s.maxTargets + (bk?.targetsAdd || 0), false);
        hits.forEach((e) => sc.combat.playerSkillHit(e, { coef, skill: id }));
      });
      return true;
    }
    case 'hunter_mark': {
      pl.playAction('_cast', 0.25, 'atk');
      const dur = s.dur[rank - 1];
      t.mark = { until: sc.clock + dur * 1000, bonus: s.bonus[rank - 1] };
      sc.fx.text(t.x, t.y - t.height - 16, 'Avcı İşareti', { color: '#ffd060', size: 13 });
      const icon = sc.fx.sprite('mark', t.x, t.y - t.height - 10, { depth: 61000, tint: 0xffd060 });
      const follow = sc.time.addEvent({ delay: 30, loop: true, callback: () => { if (!icon.active) return; if (t.dead || sc.clock > t.mark?.until) { icon.destroy(); follow.remove(); return; } icon.setPosition(t.x, t.y - t.height - 10); } });
      sound.play('buff');
      return true;
    }
    // ================================================================ ÖLÜ ÇAĞIRAN
    case 'soul_arrow':
      pl.playAction('_cast', 0.35);
      sc.time.delayedCall(140, () => {
        if (pl.dead || t.dead) return;
        sound.play('bolt');
        sc.combat.projectile(pl, t, 'soul_bolt', 480, () => {
          if (fxPackLoaded('soul_burst')) sc.fx.sprite('soul_burst', t.x, t.y - (t.height || 40) * 0.5, { scale: 1.4 });
          else sc.fx.sprite('spirit', t.x, t.y - 16, { scale: 1.2, tint: 0x8ad0a0 });
          sc.combat.playerSkillHit(t, { coef, skill: id, spell: true, critMult: bk?.critMult });
        }, { blockable: true, scale: 1.4 });
      });
      return true;
    case 'summon_skeleton':
      pl.playAction('_cast', 0.45);
      sc.time.delayedCall(260, () => {
        if (pl.dead) return;
        sound.play('roar', { vol: 0.4 });
        sc.minions?.summonMain();
      });
      return true;
    case 'army_of_dead': {
      pl.playAction('_cast', 0.45);
      const dur = s.dur[rank - 1];
      sc.time.delayedCall(260, () => {
        if (pl.dead) return;
        sound.play('roar', { vol: 0.5 });
        const m = sc.minions?.summonTemp(dur);
        sc.fx.text(pl.x, pl.y - 70, m ? 'Ölüler Ordusu!' : 'En çok 2 iskelet', { color: '#9ae0b0', size: 13 });
      });
      return true;
    }
    case 'curse_seal': {
      pl.playAction('_cast', 0.3);
      const boss = t.tpl.kind === 'boss';
      const pct = s.weaken[rank - 1] * (boss ? s.bossFactor : 1);
      const dur = s.dur[rank - 1] + (bk?.durAdd || 0);
      // zincirlenmez: en güçlü oran geçerli, süre yenilenir
      if (!(t.weakenUntil > sc.clock && t.weakenPct > pct)) { t.weakenPct = pct; }
      t.weakenUntil = sc.clock + dur * 1000;
      sc.fx.sprite('spirit', t.x, t.y - t.height * 0.6, { scale: 1.8, tint: 0x6a3a8a });
      sc.fx.text(t.x, t.y - t.height - 16, `Lanet Mührü −%${Math.round(pct * 100)}`, { color: '#c080ff', size: 12 });
      sound.play('bolt', { vol: 0.5 });
      return true;
    }
    case 'life_drain':
      pl.playAction('_cast', 0.35);
      sc.time.delayedCall(140, () => {
        if (pl.dead || t.dead) return;
        sound.play('bolt');
        sc.combat.lightningLink(pl.x, pl.y - 40, t.x, t.y - t.height * 0.5);
        const res = sc.combat.playerSkillHit(t, { coef, skill: id, spell: true });
        if (res && !res.miss && !pl.dead) {
          const st = app.stats(), ch = app.char;
          const heal = Math.min(st.maxHp * s.healCap, res.dmg * (s.heal[rank - 1] + (bk?.healAdd || 0)));
          const before = ch.hp;
          ch.hp = Math.min(st.maxHp, ch.hp + heal);
          const got = Math.round(ch.hp - before);
          if (got > 0) { sc.fx.text(pl.x, pl.y - 60, `+${got} HP`, { color: '#7af070', size: 12 }); sc.fx.sprite('heal', pl.x, pl.y - 30, { tint: 0x8ad0a0 }); }
        }
      });
      return true;
    case 'bone_burst':
    case 'soul_apocalypse':
    case 'astral_burst': {
      const big = id !== 'bone_burst';
      pl.playAction('_cast', 0.45);
      const c = groundPoint(pl, s, t);
      const r = s.radius * TILE;
      const delay = (s.delay || 0.2) * 1000;
      const col = id === 'astral_burst' ? 0xffe8a0 : id === 'soul_apocalypse' ? 0xb0a0ff : 0xe0d8c4;
      if (big) sc.fx.telegraph({ kind: 'circle', x: c.x, y: c.y, r }, delay, col, { friendly: true });
      sc.time.delayedCall(delay, () => {
        if (pl.dead) return;
        sound.play(big ? 'explosion' : 'hit');
        sc.fx.sprite(id === 'bone_burst' ? 'ash_puff' : 'shatter', c.x, c.y - 8, { scale: big ? 3 : 2.2, tint: col });
        if (big) { sc.fx.sprite('spirit', c.x, c.y - 20, { scale: 2.6, tint: col, blend: Phaser.BlendModes.ADD }); sc.fx.shake(0.006, 180); }
        const hits = sc.combat.enemiesInRadius(c.x, c.y, r, s.maxTargets + (bk?.targetsAdd || 0), false);
        hits.forEach((e, i) => sc.combat.playerSkillHit(e, { coef, skill: id, spell: i === 0 }));
      });
      return true;
    }
    // ================================================================ WARRIOR Lv.45
    case 'thunder_rift': {
      pl.playAction('_cast', 0.5);
      const ang = aim(pl, t);
      const reach = s.reach * TILE;
      const cx = pl.x + Math.cos(ang) * reach, cy = pl.y + Math.sin(ang) * reach;
      const r = s.radius * TILE;
      sc.fx.telegraph({ kind: 'circle', x: cx, y: cy, r }, s.warn * 1000, 0x9ad0ff, { friendly: true });
      sc.time.delayedCall(s.warn * 1000, () => {
        if (pl.dead) return;
        pl.swing = { t: 0, dur: 0.3 };
        sound.play('slam'); sound.play('bolt', { vol: 0.6 });
        sc.fx.shake(0.008, 200);
        for (let i = 0; i < 3; i++) sc.combat.lightningLink(cx + (i - 1) * 24, cy - 160, cx + (i - 1) * 18, cy - 8);
        sc.fx.sprite('shatter', cx, cy - 6, { scale: 3, tint: 0x9ad0ff });
        const hits = sc.combat.enemiesInRadius(cx, cy, r, s.maxTargets, true);
        hits.forEach((e) => sc.combat.playerSkillHit(e, { coef, skill: id }));
      });
      return true;
    }
    default:
      return false;
  }
}
