// Boss mekanikleri — Alfa Kurt (Yırtıcı Atılım, Sürü Uluması, Son Öfke) ve
// Maden Golemi (Ezici Darbe, Kristal Patlaması, Yer Sarsıntısı, Kristal Kalkanı, Son Öfke).
// Tüm büyük saldırılar 1,2–1,8 sn telegraflanır ve gerçek hasar/durum etkisi üretir.
import Phaser from 'phaser';
import { TILE } from '../data/constants.js';
import { sound } from '../audio/sound.js';
import { pointInBeam } from './Enemy.js';

export function makeBossBehavior(e) {
  if (e.tpl.ai === 'boss_alpha') return alphaBehavior(e);
  if (e.tpl.ai === 'boss_golem') return golemBehavior(e);
  return null;
}

function announce(e, text, color = '#ff9a4a') {
  e.scene.fx.text(e.x, e.y - e.height - 20, text, { color, size: 16, rise: 26, dur: 1800 });
  e.scene.events.emit('bossAnnounce', text);
}

function alphaBehavior(e) {
  const b = {
    lungeCd: 5, howl70: false, howl40: false, howlCd: 0, fury: false, dash: null, summons: [],
    phase() { return b.fury ? 2 : 1; },
    update(dt, p) {
      const sc = e.scene;
      if (e.state !== 'chase' && e.state !== 'attack') return false;
      const hpp = e.hp / e.maxHp;
      if (!b.fury && hpp < 0.25) {
        b.fury = true; e.speedMult = 1.25; e.atkMult = 0.75; e.furyTint = 0xff9090; e.sprite.setTint(0xff9090);
        announce(e, 'SON ÖFKE!'); sound.play('roar'); sc.fx.shake(0.006, 250);
      }
      if (b.dash) {
        const d = b.dash;
        const step = 7.5 * TILE * dt;
        const moved = sc.grid.move(e, Math.cos(d.ang) * step, Math.sin(d.ang) * step);
        d.left -= step;
        e.playAnim('walk');
        if (!d.hit && !p.dead && Math.hypot(p.x - e.x, p.y - e.y) < e.radius + p.radius + 10) {
          d.hit = true;
          sc.combat.enemyHitsPlayer(e, { coef: 1.8, label: 'Yırtıcı Atılım' });
          sc.player.knockback(d.ang, 30);
        }
        if (d.left <= 0 || !moved) {
          if (!d.hit && !p.dead && pointInBeam(p.x, p.y, d.ox, d.oy, d.ang, d.len, d.w)) { d.hit = true; sc.combat.enemyHitsPlayer(e, { coef: 1.8, label: 'Yırtıcı Atılım' }); }
          b.dash = null;
        }
        e.sync();
        return true;
      }
      if (e.casting || e.windup) return false;
      b.summons = b.summons.filter((s) => !s.dead);
      b.howlCd -= dt;
      if ((hpp < 0.7 && !b.howl70) || (hpp < 0.4 && !b.howl40) || (b.fury && b.howlCd <= 0 && b.summons.length === 0)) {
        if (hpp < 0.7) b.howl70 = true;
        if (hpp < 0.4) b.howl40 = true;
        b.howlCd = 30;
        const dur = 1200;
        sc.fx.telegraph({ kind: 'ring', x: e.x, y: e.y, r: 2.2 * TILE }, dur, 0xffb040);
        e.casting = { t: dur / 1000, fn: () => {
          if (e.dead) return;
          sound.play('howl');
          announce(e, 'Sürü Uluması!', '#ffd080');
          const need = 2 - b.summons.length;
          for (let i = 0; i < need; i++) {
            const a = Math.random() * Math.PI * 2;
            const s = sc.spawner.spawnSummon('pack_wolf', e.x + Math.cos(a) * 2 * TILE, e.y + Math.sin(a) * 2 * TILE);
            if (s) { b.summons.push(s); s.aggro(p); }
          }
        } };
        return false;
      }
      b.lungeCd -= dt;
      const dP = Math.hypot(p.x - e.x, p.y - e.y);
      if (b.lungeCd <= 0 && dP > 1.6 * TILE && dP < 8 * TILE && e.canSee(p)) {
        b.lungeCd = b.fury ? 6 : 9;
        const ang = Math.atan2(p.y - e.y, p.x - e.x);
        const len = Math.min(7.5 * TILE, dP + 2 * TILE), w = 1.4 * TILE, dur = 1400;
        sc.fx.telegraph({ kind: 'rect', x: e.x, y: e.y, len, width: w, angle: ang }, dur);
        sound.play('warn');
        e.setFacing(Math.cos(ang));
        const ox = e.x, oy = e.y;
        e.casting = { t: dur / 1000, fn: () => { if (!e.dead) b.dash = { ang, left: len, len, w, ox, oy, hit: false }; } };
      }
      return false;
    },
    reset() {
      b.summons.forEach((s) => !s.dead && e.scene.spawner.despawn(s));
      b.summons = []; b.fury = false; b.howl70 = false; b.howl40 = false; b.dash = null; b.lungeCd = 5;
      e.speedMult = 1; e.atkMult = 1; e.furyTint = null; e.sprite.clearTint();
    },
    onDeath() {
      b.summons.forEach((s) => !s.dead && e.scene.spawner.despawn(s));
      b.summons = [];
    },
  };
  return b;
}

function golemBehavior(e) {
  const b = {
    cd: { crush: 4, burst: 7, quake: 10 }, shieldDone: false, shieldUntil: 0, crystals: [], fury: false, aura: null,
    phase() {
      const h = e.hp / e.maxHp;
      if (b.fury) return 3;
      return h > 0.7 ? 1 : 2;
    },
    update(dt, p) {
      const sc = e.scene;
      if (e.state !== 'chase' && e.state !== 'attack') return false;
      const hpp = e.hp / e.maxHp;
      const now = sc.clock;
      if (!b.shieldDone && hpp < 0.5) {
        b.shieldDone = true;
        e.reduce = 0.85;
        b.shieldUntil = now + 25000;
        b.crystals = (sc.mapDef.crystalSpawns || []).map((c) => sc.spawner.spawnSummon('shield_crystal', c.x * TILE + 16, c.y * TILE + 16)).filter(Boolean);
        b.aura = sc.add.image(0, -e.height / 2, 'light_blue').setScale(1.6).setAlpha(0.55).setBlendMode(Phaser.BlendModes.ADD);
        e.container.addAt(b.aura, 0);
        announce(e, 'KRİSTAL KALKANI! İki kristali kır!', '#7ae0ff');
        sound.play('shield');
      }
      if (e.reduce > 0) {
        b.crystals = b.crystals.filter((c) => !c.dead);
        if (!b.crystals.length || now > b.shieldUntil) b.dropShield(b.crystals.length ? 'Kalkan söndü.' : 'Kalkan kırıldı!');
      }
      if (!b.fury && hpp < 0.25) {
        b.fury = true; e.speedMult = 1.25; e.atkMult = 0.75; e.furyTint = 0xffa0a0; e.sprite.setTint(0xffa0a0);
        announce(e, 'SON ÖFKE!'); sound.play('roar'); sc.fx.shake(0.008, 300);
      }
      if (e.casting || e.windup) return false;
      const mult = b.fury ? 1 / 0.7 : 1;
      for (const k of Object.keys(b.cd)) b.cd[k] -= dt * mult;
      const dP = Math.hypot(p.x - e.x, p.y - e.y);
      const phase = b.phase();
      if (phase >= 2 && b.cd.quake <= 0 && dP < 6 * TILE) return b.quake(p), false;
      if (b.cd.crush <= 0 && dP < 3.8 * TILE) return b.crush(p), false;
      if (b.cd.burst <= 0 && dP < 10 * TILE) return b.burst(p, phase), false;
      return false;
    },
    dropShield(msg) {
      e.reduce = 0;
      b.crystals.forEach((c) => !c.dead && e.scene.spawner.despawn(c));
      b.crystals = [];
      b.aura?.destroy(); b.aura = null;
      announce(e, msg, '#7ae0ff');
    },
    crush(p) {
      const sc = e.scene;
      b.cd.crush = 10;
      const ang = Math.atan2(p.y - e.y, p.x - e.x);
      const cx = e.x + Math.cos(ang) * 1.4 * TILE, cy = e.y + Math.sin(ang) * 1.4 * TILE, r = 2.3 * TILE, dur = 1500;
      sc.fx.telegraph({ kind: 'circle', x: cx, y: cy, r }, dur);
      sound.play('warn');
      e.setFacing(Math.cos(ang));
      e.casting = { t: dur / 1000, fn: () => {
        if (e.dead) return;
        e.playAnim('atk');
        sound.play('slam'); sc.fx.shake(0.01, 220);
        sc.fx.sprite('explosion', cx, cy, { scale: 1.2, tint: 0xb0a090 });
        if (!p.dead && Math.hypot(p.x - cx, p.y - cy) <= r) {
          sc.combat.enemyHitsPlayer(e, { coef: 2.2, label: 'Ezici Darbe' });
          sc.player.stun(1.0);
        }
      } };
    },
    burst(p, phase) {
      const sc = e.scene;
      b.cd.burst = 13;
      const n = phase >= 2 ? 5 : 3, r = 1.5 * TILE, dur = 1600;
      const spots = [{ x: p.x, y: p.y }];
      for (let i = 1; i < n; i++) {
        for (let k = 0; k < 10; k++) {
          const a = Math.random() * Math.PI * 2, d = (1.5 + Math.random() * 3) * TILE;
          const x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
          if (!sc.grid.blockedAt(x, y)) { spots.push({ x, y }); break; }
        }
      }
      for (const s of spots) sc.fx.telegraph({ kind: 'circle', x: s.x, y: s.y, r }, dur, 0x5ac8ff);
      sound.play('warn');
      e.casting = { t: dur / 1000, fn: () => {
        if (e.dead) return;
        sound.play('ice');
        let hit = false;
        for (const s of spots) {
          sc.fx.sprite('ice', s.x, s.y, { scale: 1.1 });
          if (!hit && !p.dead && Math.hypot(p.x - s.x, p.y - s.y) <= r) hit = true;
        }
        if (hit) sc.combat.enemyHitsPlayer(e, { coef: 1.6, dmgType: 'magic', label: 'Kristal Patlaması' });
      } };
    },
    quake(p) {
      const sc = e.scene;
      b.cd.quake = 16;
      const r = 5 * TILE, dur = 1800;
      sc.fx.telegraph({ kind: 'circle', x: e.x, y: e.y, r }, dur, 0xff7a30);
      sound.play('warn');
      announce(e, 'Yer Sarsıntısı!', '#ffb070');
      e.casting = { t: dur / 1000, fn: () => {
        if (e.dead) return;
        sound.play('slam'); sound.play('explosion'); sc.fx.shake(0.016, 450);
        sc.fx.burst(e.x, e.y, 0xa08060, 30, 220, 600);
        if (!p.dead && Math.hypot(p.x - e.x, p.y - e.y) <= r) {
          sc.combat.enemyHitsPlayer(e, { coef: 1.5, label: 'Yer Sarsıntısı' });
          sc.player.slow(0.4, 3);
        }
      } };
    },
    reset() {
      if (e.reduce > 0 || b.crystals.length) { b.crystals.forEach((c) => !c.dead && e.scene.spawner.despawn(c)); b.crystals = []; b.aura?.destroy(); b.aura = null; e.reduce = 0; }
      b.shieldDone = false; b.fury = false; b.cd = { crush: 4, burst: 7, quake: 10 };
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
