// Sunucu tarafı yaratık: istemcideki Enemy (src/entities/Enemy.js) yapay zekâsının görüntüsüz kopyası.
// Fark: birden çok oyuncu var — hedef, yakınlık + tehdit (verilen hasar) ile seçilir; alan yetenekleri bölgedeki
// herkesi vurur. Görsel/ses yalnız olay olarak yayınlanır (z.ev / z.telegraph / z.fx), hasarı istemci kendi
// istatistikleriyle hesaplar (z.hit → 'eh' mesajı).
// Kapsam (S1): normal yaratıklar + elitler (V1–V4 yetenekleri). Boss'lar ve dungeon'lar istemcide (kişisel) kalır.
import { TILE } from '../../src/data/constants.js';
import { inCircle, inBeam, inCone } from './geom.mjs';

const STORM = 0x9ad0ff, VOID = 0xa070e0;
let NEXT_ID = 1;

export class SEnemy {
  constructor(z, tpl, x, y, opts = {}) {
    this.z = z;
    this.id = NEXT_ID++;
    this.tpl = tpl;
    this.x = x; this.y = y;
    this.home = { x, y };
    this.maxHp = tpl.hp; this.hp = tpl.hp;
    this.radius = Math.max(8, tpl.radius * TILE * 0.8);
    this.state = 'idle';
    this.attackTimer = 0.6 + Math.random() * 0.6;
    this.wanderTimer = Math.random() * 3;
    this.wanderGoal = null;
    this.path = null; this.pathTimer = 0;
    this.slowUntil = 0; this.slowPct = 0; this.stunUntil = 0;
    this.reduce = 0; this.reduceUntil = 0;
    this.speedMult = 1; this.atkMult = 1;
    this.dead = false;
    this.spawnRef = opts.spawnRef || null;
    this.facing = 1;
    this.windup = null; this.casting = null;
    this.abilityCd = 5 + Math.random() * 3;
    this.lastHitAt = -99999;
    this.engaged = false;
    this.leashR = (opts.leashR) || (tpl.leash || 12) * TILE;
    this.target = null;          // uid
    this.threat = new Map();     // uid → hasar
    this.dmgBy = new Map();      // uid → toplam hasar (ödül paylaşımı)
    this.moving = false;
    this.hidden = false;         // Çatlak Kanat dalışı (yarı saydam)
    this.tint = 0;               // öfke / kalkan rengi (istemci boyar)
  }

  get now() { return this.z.clock; }
  speed() {
    let s = this.tpl.speed * TILE * this.speedMult;
    if (this.now < this.slowUntil) s *= 1 - this.slowPct;
    return s;
  }
  distTo(p) { return Math.hypot(p.x - this.x, p.y - this.y); }
  canSee(p) { return this.z.grid.los(this.x, this.y - 4, p.x, p.y - 4); }
  setFacing(dx) { if (Math.abs(dx) >= 0.5) this.facing = dx > 0 ? 1 : -1; }
  anim(a) { this.z.ev({ k: 'a', e: this.id, a }, this.x, this.y); }

  // ---------------------------------------------------------------- hedef
  validTarget(p) { return !!p && !p.dead && !this.z.isSafeAt(p.x, p.y); }
  targetPlayer() { return this.target ? this.z.player(this.target) : null; }

  aggro(p, alertPack = true) {
    if (this.dead || this.state === 'return' || this.tpl.ai === 'static' || !p) return;
    if (this.state === 'idle') { this.state = 'chase'; this.engaged = true; }
    if (!this.target) this.target = p.uid;
    if (alertPack && this.tpl.ai === 'pack') {
      const near = this.z.enemies
        .filter((e) => e !== this && !e.dead && e.tpl.id === this.tpl.id && e.state === 'idle' && e.distTo(this) < 5 * TILE)
        .sort((a, b) => a.distTo(this) - b.distTo(this)).slice(0, 2);
      for (const e of near) e.aggro(p, false);
    }
  }

  // oyuncudan gelen vuruş (istemci hesapladı; sunucu yalnız sınırlar ve uygular)
  takeHit(uid, dmg) {
    if (this.dead) return false;
    const d = Math.max(0, Math.min(dmg, this.hp));
    this.hp -= d;
    this.dmgBy.set(uid, (this.dmgBy.get(uid) || 0) + d);
    this.threat.set(uid, (this.threat.get(uid) || 0) + d);
    this.lastHitAt = this.now;
    const p = this.z.player(uid);
    if (this.state === 'idle' && p) this.aggro(p);
    // daha çok vuran oyuncuya dön (mevcut hedefin tehdidinin 1,3 katı)
    const cur = this.target ? this.threat.get(this.target) || 0 : 0;
    if (p && (!this.validTarget(this.targetPlayer()) || this.threat.get(uid) > cur * 1.3)) this.target = uid;
    // küçük geri itme (istemcideki gibi; boss/sabit hariç)
    if (p && this.tpl.ai !== 'static' && this.tpl.kind !== 'boss') {
      const a = Math.atan2(this.y - p.y, this.x - p.x);
      this.z.grid.move(this, Math.cos(a) * 3, Math.sin(a) * 3);
    }
    return this.hp <= 0;
  }

  // hedef geçersizse tehdit listesinden (yakın, canlı) yenisini seç
  retarget() {
    let best = null, bestT = -1;
    for (const [uid, t] of this.threat) {
      const p = this.z.player(uid);
      if (!this.validTarget(p) || this.distTo(p) > (this.tpl.aggro + 9) * TILE) continue;
      if (t > bestT) { best = p; bestT = t; }
    }
    if (!best) {
      for (const p of this.z.players.values()) {
        if (!this.validTarget(p)) continue;
        const d = this.distTo(p);
        if (d < this.tpl.aggro * TILE && this.canSee(p) && (!best || d < this.distTo(best))) best = p;
      }
    }
    this.target = best ? best.uid : null;
    return best;
  }

  // ---------------------------------------------------------------- ana döngü
  update(dt) {
    if (this.dead) return;
    const now = this.now;
    if (this.reduceUntil && now >= this.reduceUntil) { this.reduce = 0; this.reduceUntil = 0; this.tint = this.enraged ? 0xff8a6a : 0; }
    this.moving = false;
    if (now < this.stunUntil) return;
    if (this.windup) { this.windup.t -= dt; if (this.windup.t <= 0) { const w = this.windup; this.windup = null; w.fn(); } return; }
    if (this.casting) { this.casting.t -= dt; if (this.casting.t <= 0) { const c = this.casting; this.casting = null; c.fn(); } return; }
    const ai = this.tpl.ai;
    if (ai === 'static') return;
    const dHome = Math.hypot(this.x - this.home.x, this.y - this.home.y);

    switch (this.state) {
      case 'idle': {
        if (ai !== 'passive') {
          let near = null;
          for (const p of this.z.players.values()) {
            if (!this.validTarget(p)) continue;
            const d = this.distTo(p);
            if (d < this.tpl.aggro * TILE && (!near || d < this.distTo(near)) && this.canSee(p)) near = p;
          }
          if (near) { this.target = near.uid; this.aggro(near); break; }
        }
        this.wanderTimer -= dt;
        if (this.wanderTimer <= 0) {
          this.wanderTimer = 2 + Math.random() * 4;
          const a = Math.random() * Math.PI * 2, r = Math.random() * 2.2 * TILE;
          this.wanderGoal = { x: this.home.x + Math.cos(a) * r, y: this.home.y + Math.sin(a) * r };
        }
        if (this.wanderGoal) {
          const moved = this.moveToward(this.wanderGoal.x, this.wanderGoal.y, dt, 0.45);
          if (!moved || Math.hypot(this.wanderGoal.x - this.x, this.wanderGoal.y - this.y) < 4) this.wanderGoal = null;
        }
        break;
      }
      case 'chase':
      case 'attack': {
        let p = this.targetPlayer();
        if (!this.validTarget(p)) p = this.retarget();
        const dP = p ? this.distTo(p) : Infinity;
        if (!p || dHome > this.leashR || (dP > (this.tpl.aggro + 9) * TILE && now - this.lastHitAt > 4000)) { this.startReturn(); break; }
        this.updateAbility(dt, p, dP);
        if (this.casting || this.windup) break;
        const range = this.tpl.attackRange * TILE + 9 * 0.5;
        const see = this.canSee(p);
        if (ai === 'skirmish' && now < (this.retreatUntil || 0)) {
          const a = Math.atan2(this.y - p.y, this.x - p.x);
          const ok = this.z.grid.move(this, Math.cos(a) * this.speed() * 1.1 * dt, Math.sin(a) * this.speed() * 1.1 * dt);
          if (ok) { this.moving = true; this.setFacing(p.x - this.x); this.attackTimer -= dt; break; }
          this.retreatUntil = 0;
        }
        if (ai === 'ranged' && dP < 2.4 * TILE && see) {
          const a = Math.atan2(this.y - p.y, this.x - p.x);
          const ok = this.z.grid.move(this, Math.cos(a) * this.speed() * 0.8 * dt, Math.sin(a) * this.speed() * 0.8 * dt);
          if (ok) { this.moving = true; this.setFacing(p.x - this.x); this.attackTimer -= dt * 0.5; break; }
        }
        if (dP <= range && see) {
          this.state = 'attack';
          this.setFacing(p.x - this.x);
          this.attackTimer -= dt;
          if (this.attackTimer <= 0) {
            this.attackTimer = this.tpl.attackInterval * this.atkMult;
            this.doAttack(p);
            if (ai === 'skirmish' && Math.random() < 0.5) this.retreatUntil = now + 700 + Math.random() * 400;
          }
        } else {
          this.state = 'chase';
          this.attackTimer = Math.max(this.attackTimer, 0.35);
          this.chase(p, dt, see);
        }
        break;
      }
      case 'return': {
        this.returnT = (this.returnT || 0) + dt;
        if (this.returnT > 7) { this.x = this.home.x; this.y = this.home.y; }
        const done = Math.hypot(this.home.x - this.x, this.home.y - this.y) < Math.max(8, this.radius);
        if (done) {
          this.returnT = 0;
          this.state = 'idle'; this.hp = this.maxHp; this.engaged = false; this.path = null;
          this.threat.clear(); this.dmgBy.clear(); this.target = null;
        } else {
          this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.2 * dt);
          if (!this.followPathTo(this.home.x, this.home.y, dt, 1.4)) { this.x = this.home.x; this.y = this.home.y; }
        }
        break;
      }
      default: break;
    }
  }

  startReturn() {
    this.state = 'return';
    this.returnT = 0;
    this.casting = null; this.windup = null;
    this.path = null;
    this.engaged = false;
    this.target = null;
  }

  chase(p, dt, see) {
    if (see && this.z.grid.walkLine(this.x, this.y, p.x, p.y, this.radius * 0.8)) {
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
    const moved = this.z.grid.move(this, dx / d * step, dy / d * step);
    this.setFacing(dx);
    if (moved) this.moving = true;
    return moved;
  }

  followPathTo(tx, ty, dt, mult) {
    this.pathTimer -= dt;
    if (!this.path || this.pathTimer <= 0) {
      if (this.z.pathBudget <= 0) return !!this.path;
      this.z.pathBudget--;
      this.path = this.z.grid.findPath(this.x, this.y, tx, ty, 900);
      this.pathTimer = 0.7 + Math.random() * 0.3;
      if (!this.path) return false;
    }
    if (!this.path.length) return this.moveToward(tx, ty, dt, mult);
    const n = this.path[0];
    if (Math.hypot(n.x - this.x, n.y - this.y) < 6) { this.path.shift(); return true; }
    return this.moveToward(n.x, n.y, dt, mult) || true;
  }

  // normal saldırı: yakın dövüşte 0,28 sn kalkış sonra menzil + görüş kontrolü; menzillide mermi
  doAttack(p) {
    const z = this.z;
    this.anim('atk');
    const coef = this.tpl.normalCoef ?? 1;
    const uid = p.uid;
    if (this.tpl.projectile) {
      this.windup = { t: 0.3, fn: () => {
        const tp = z.player(uid);
        if (this.dead || !tp || tp.dead) return;
        z.projectile(this, tp, this.tpl.projectile, () => this.normalHit(uid, coef));
      } };
    } else {
      this.windup = { t: 0.28, fn: () => {
        const tp = z.player(uid);
        if (this.dead || !tp || tp.dead) return;
        if (this.distTo(tp) <= this.tpl.attackRange * TILE * 1.25 + 9 && this.canSee(tp)) this.normalHit(uid, coef);
      } };
    }
  }

  normalHit(uid, coef) {
    const t = this.tpl;
    const extra = {};
    if (t.poison && Math.random() < t.poison.chance) extra.poison = t.poison;
    if (t.slow && Math.random() < t.slow.chance) extra.slow = [t.slow.pct, t.slow.dur];
    this.z.hit(uid, this, { coef, n: 1, ...extra });
  }

  // alan isabeti: bölgedeki her canlı oyuncu için test
  areaHit(test, opts) {
    for (const p of this.z.players.values()) if (!p.dead && test(p)) this.z.hit(p.uid, this, opts);
  }

  // ---------------------------------------------------------------- yetenekler (istemciyle aynı süre/şekil/katsayı)
  updateAbility(dt, p, dP) {
    if (!this.tpl.abilities) return;
    if (this.tpl.kind === 'normal' || this.tpl.kind === 'hunt') { this.updateNormalAbility(dt, p, dP); return; }
    if (this.tpl.kind !== 'elite') return;
    const z = this.z;
    const en = this.tpl.enrage;
    if (en && !this.enraged && this.hp < this.maxHp * en.below) {
      this.enraged = true;
      this.atkMult = en.atkSpd; this.speedMult = en.speed;
      this.tint = 0xff8a6a;
      z.text(this.x, this.y - 70, 'ÖFKE!', '#ff8a4a', 16, 'roar');
    }
    this.abilityCd -= dt;
    if (this.abilityCd > 0) return;
    const ab = this.tpl.abilities[0];
    if (ab === 'shroud_dash' || ab === 'obsidian_quake') { this.eliteV3(ab, p, dP); return; }
    if (ab === 'storm_field' || ab === 'void_guard') { this.eliteV4(ab, p, dP); return; }
    if (ab === 'spin_slash' && dP < 3 * TILE) {
      this.abilityCd = 9;
      const r = 2.6 * TILE, dur = 1300, x = this.x, y = this.y;
      z.telegraph({ kind: 'circle', x, y, r }, dur);
      this.anim('atk');
      this.cast(dur, () => {
        z.fx('slash', this.x, this.y - 10, { scale: 2.6, twin: 1, snd: 'swing' });
        this.areaHit((q) => inCircle(q.x, q.y, this.x, this.y, r), { coef: 1.5, label: 'Kasırga' });
      });
    } else if (ab === 'crystal_beam' && dP < 8 * TILE) {
      this.abilityCd = 8;
      const ang = Math.atan2(p.y - this.y, p.x - this.x), len = 7 * TILE, w = 1.3 * TILE, dur = 1400;
      const ox = this.x, oy = this.y - 10;
      z.telegraph({ kind: 'rect', x: ox, y: oy, len, width: w, angle: ang }, dur);
      this.cast(dur, () => {
        z.fx('beam_line', ox, oy, { angle: ang, len, width: w * 0.6, tint: 0xff4030, snd: 'bolt' });
        this.areaHit((q) => inBeam(q.x, q.y - 8, ox, oy, ang, len, w), { coef: 1.7, dt: 'magic', label: 'Kristal Işını' });
      });
    } else if (ab === 'execution_cleave' && dP < 4 * TILE) {
      this.abilityCd = 10;
      const ang = Math.atan2(p.y - this.y, p.x - this.x), r = 3.6 * TILE, dur = 1500;
      z.telegraph({ kind: 'cone', x: this.x, y: this.y - 6, r, angle: ang }, dur);
      this.cast(dur, () => {
        this.anim('atk');
        z.fx('slash', this.x + Math.cos(ang) * 30, this.y - 10 + Math.sin(ang) * 30, { scale: 3, rotation: ang, snd: 'slam', shake: 1 });
        this.areaHit((q) => inCone(q.x, q.y, this.x, this.y, ang, r), { coef: 2.0, label: 'İnfaz', poison: this.tpl.poison || null });
      });
    } else if (ab === 'butcher_cleave' && dP < 4.2 * TILE) {
      this.abilityCd = this.enraged ? 7 : 9;
      const ang = Math.atan2(p.y - this.y, p.x - this.x), r = 3.8 * TILE, dur = this.enraged ? 1250 : 1450;
      z.telegraph({ kind: 'cone', x: this.x, y: this.y - 6, r, angle: ang }, dur);
      this.cast(dur, () => {
        this.anim('atk');
        z.fx('slash', this.x + Math.cos(ang) * 34, this.y - 10 + Math.sin(ang) * 34, { scale: 3.4, rotation: ang, tint: 0xffa060, snd: 'slam', shake: 1 });
        this.areaHit((q) => inCone(q.x, q.y, this.x, this.y, ang, r), { coef: 1.9, label: 'Kasap Satırı' });
        for (let i = 1; i <= 3; i++) {
          z.hazard({ x: this.x + Math.cos(ang) * i * TILE * 1.1, y: this.y + Math.sin(ang) * i * TILE * 1.1, r: 0.75 * TILE, dur: 2.5, tick: 0.5, coef: 0.18, src: this, key: 'fire_ground', label: 'Ateş izi' });
        }
      });
    } else if (ab === 'ice_slam' && dP < 7 * TILE) {
      this.abilityCd = 8.5;
      if (dP < 3.2 * TILE) {
        const r = 3 * TILE, dur = 1500;
        z.telegraph({ kind: 'circle', x: this.x, y: this.y, r }, dur);
        this.cast(dur, () => {
          this.anim('atk');
          z.fx('shatter', this.x, this.y - 6, { scale: 3.2, snd: 'slam', shake: 1 });
          this.areaHit((q) => inCircle(q.x, q.y, this.x, this.y, r), { coef: 1.8, label: 'Buz Vuruşu', slow: [0.35, 1.5] });
        });
      } else {
        this.anim('atk');
        for (const [ox, oy] of [[0, 0], [1.4, 0.6], [-1.3, 0.7]]) z.shard({ x: p.x + ox * TILE, y: p.y + oy * TILE, r: 0.95 * TILE, delay: 1.4, coef: 1.1, src: this });
        this.cast(600, () => {});
      }
    } else this.abilityCd = 1.5;
  }

  cast(ms, fn) { this.casting = { t: ms / 1000, fn: () => { if (!this.dead) fn(); } }; }

  updateNormalAbility(dt, p, dP) {
    this.abilityCd -= dt;
    if (this.abilityCd > 0) return;
    const z = this.z, ab = this.tpl.abilities[0];
    if (ab === 'storm_pounce' && dP > 2.4 * TILE && dP < 6.5 * TILE && this.canSee(p)) {
      this.abilityCd = 7 + Math.random() * 2;
      this.dashAt(p, { len: Math.min(dP + TILE, 6.5 * TILE), w: 1.1 * TILE, dur: 850, coef: 1.2, label: 'Fırtına Sıçrayışı', tint: STORM, slow: 0.25 });
    } else if (ab === 'rift_strike' && dP < 7 * TILE && this.canSee(p)) {
      this.abilityCd = 9 + Math.random() * 2;
      const x = p.x, y = p.y, r = 1.5 * TILE, dur = 1150;
      z.telegraph({ kind: 'circle', x, y, r }, dur, STORM);
      this.hidden = true;
      this.casting = { t: dur / 1000, fn: () => {
        this.hidden = false;
        if (this.dead) return;
        if (!z.grid.blockedAt(x, y)) { this.x = x; this.y = y - 4; }
        this.anim('atk');
        z.fx('shatter', x, y - 8, { scale: 1.8, tint: STORM, snd: 'bolt' });
        this.areaHit((q) => inCircle(q.x, q.y, x, y, r), { coef: 1.3, dt: 'magic', label: 'Yarık Pençesi' });
      } };
    } else if (ab === 'star_fall' && dP < 8 * TILE && this.canSee(p)) {
      this.abilityCd = 10 + Math.random() * 2;
      this.anim('atk');
      const side = Math.random() < 0.5 ? -1 : 1;
      for (const [ox, oy] of [[0, 0], [1.5 * side, 0.6]]) z.shard({ x: p.x + ox * TILE, y: p.y + oy * TILE, r: 1 * TILE, delay: 1.3, coef: 1.0, src: this, style: 'star', label: 'Yıldız Düşüşü' });
      this.cast(500, () => {});
    } else if (ab === 'grave_curse' && dP < 6 * TILE && this.canSee(p)) {
      this.abilityCd = 10 + Math.random() * 2;
      const x = p.x, y = p.y, r = 1.6 * TILE, dur = 1200;
      z.telegraph({ kind: 'circle', x, y, r }, dur, 0xa070e0);
      this.anim('atk');
      this.cast(dur, () => {
        z.fx('spirit', x, y - 10, { scale: 1.8, tint: 0xa070e0, snd: 'bolt' });
        this.areaHit((q) => inCircle(q.x, q.y, x, y, r), { coef: 1.1, dt: 'magic', label: 'Mezar Laneti', curse: [0.12, 4] });
      });
    } else if (ab === 'heavy_slam' && dP < 2.6 * TILE) {
      this.abilityCd = 9 + Math.random() * 2;
      const r = 2.2 * TILE, dur = 1300, tint = this.tpl.abilityTint ?? 0xa070e0;
      z.telegraph({ kind: 'circle', x: this.x, y: this.y, r }, dur, tint);
      this.cast(dur, () => {
        this.anim('atk');
        z.fx('shatter', this.x, this.y - 6, { scale: 2.4, tint: this.tpl.abilityTint ?? 0x8a6ab0, snd: 'slam', shake: 1 });
        this.areaHit((q) => inCircle(q.x, q.y, this.x, this.y, r), { coef: 1.5, label: this.tpl.abilityLabel || 'Obsidyen Darbe' });
      });
    } else if (ab === 'shadow_dash' && dP > 2.6 * TILE && dP < 7 * TILE && this.canSee(p)) {
      this.abilityCd = 7 + Math.random() * 2;
      this.dashAt(p, { len: Math.min(dP + TILE, 7.5 * TILE), w: 1.1 * TILE, dur: 800, coef: 1.25, label: this.tpl.abilityLabel || 'Gölge Atılışı', tint: this.tpl.abilityTint ?? 0xa070e0 });
      this.retreatUntil = this.now + 800 + 900;
    } else if (ab === 'throne_cleave' && dP < 3.5 * TILE) {
      this.abilityCd = 9 + Math.random() * 2;
      const ang = Math.atan2(p.y - this.y, p.x - this.x), r = 3.2 * TILE, dur = 1400;
      z.telegraph({ kind: 'cone', x: this.x, y: this.y - 6, r, angle: ang }, dur, 0xff5050);
      this.cast(dur, () => {
        this.anim('atk');
        z.fx('slash', this.x + Math.cos(ang) * 30, this.y - 10 + Math.sin(ang) * 30, { scale: 2.8, rotation: ang, tint: 0xc8a0ff, snd: 'slam', shake: 1 });
        this.areaHit((q) => inCone(q.x, q.y, this.x, this.y, ang, r), { coef: 1.7, label: 'Taht Yarması' });
      });
    } else if (ab === 'void_ward' && this.hp < this.maxHp * 0.85) {
      this.abilityCd = 12 + Math.random() * 3;
      this.cast(400, () => this.shield(0.35, 3000, 0xc8a0ff, this.tpl.abilityLabel || 'Hiçlik Kalkanı'));
    } else this.abilityCd = 1.2;
  }

  shield(pct, ms, tint, label) {
    this.reduce = pct; this.reduceUntil = this.now + ms; this.tint = tint;
    this.z.text(this.x, this.y - 70, label, '#c8a0ff', 12, 'shield');
  }

  dashAt(p, { len, w, dur, coef, label, tint, curse = 0, slow = 0 }) {
    const z = this.z;
    const ang = Math.atan2(p.y - this.y, p.x - this.x), ox = this.x, oy = this.y - 10;
    z.telegraph({ kind: 'rect', x: ox, y: oy, len, width: w, angle: ang }, dur, tint);
    this.setFacing(Math.cos(ang));
    this.cast(dur, () => {
      this.anim('atk');
      const steps = 12, dx = Math.cos(ang) * len / steps, dy = Math.sin(ang) * len / steps;
      for (let i = 0; i < steps; i++) if (!z.grid.move(this, dx, dy)) break;
      z.fx('slash', this.x, this.y - 12, { scale: 1.8, rotation: ang, tint, snd: 'swing' });
      this.areaHit((q) => inBeam(q.x, q.y - 8, ox, oy, ang, len, w), { coef, label, curse: curse ? [curse, 4] : null, slow: slow ? [slow, 1.5] : null });
    });
  }

  eliteV3(ab, p, dP) {
    const z = this.z;
    this.v3n = (this.v3n || 0) + 1;
    if (ab === 'shroud_dash') {
      if (dP > 2.6 * TILE && dP < 8.5 * TILE && this.canSee(p)) {
        this.abilityCd = this.enraged ? 6 : 8;
        this.dashAt(p, { len: Math.min(dP + TILE, 8.5 * TILE), w: 1.3 * TILE, dur: 900, coef: 1.4, label: 'Kefen Atılışı', tint: 0xc0b8a8, curse: 0.15 });
      } else if (dP <= 3.2 * TILE) {
        this.abilityCd = this.enraged ? 6.5 : 9;
        const strong = this.enraged, r = (strong ? 3 : 2.5) * TILE, dur = strong ? 1300 : 1200;
        z.telegraph({ kind: 'circle', x: this.x, y: this.y, r }, dur, strong ? 0xff5050 : 0xc0b8a8);
        if (strong) z.text(this.x, this.y - 70, 'Kefen Biçişi!', '#ff8a8a', 14);
        this.cast(dur, () => {
          this.anim('atk');
          z.fx('slash', this.x, this.y - 10, { scale: 2.6, twin: 1, snd: 'swing' });
          this.areaHit((q) => inCircle(q.x, q.y, this.x, this.y, r), { coef: strong ? 2.2 : 1.5, label: strong ? 'Kefen Biçişi' : 'Tırpan', curse: [0.15, 4] });
        });
      } else this.abilityCd = 1.2;
      return;
    }
    const step = this.v3n % 3;
    if (step === 1 && dP < 4.5 * TILE) {
      this.abilityCd = 8.5;
      const r = 4 * TILE, dur = 1600;
      z.telegraph({ kind: 'circle', x: this.x, y: this.y, r }, dur, 0xa070e0);
      this.cast(dur, () => {
        this.anim('atk');
        z.fx('shatter', this.x, this.y - 6, { scale: 3.6, tint: 0xa070e0, snd: 'slam', shake: 1 });
        this.areaHit((q) => inCircle(q.x, q.y, this.x, this.y, r), { coef: 1.8, label: 'Obsidyen Sarsıntısı' });
      });
    } else if (step === 2 && dP < 9 * TILE) {
      this.abilityCd = 8;
      this.anim('atk');
      z.text(this.x, this.y - 70, 'Obsidyen Kırılması', '#c8a0ff', 13);
      for (const [ox, oy] of [[0, 0], [1.5, 0.7], [-1.4, 0.8], [0.2, -1.4]]) z.shard({ x: p.x + ox * TILE, y: p.y + oy * TILE, r: 0.95 * TILE, delay: 1.4, coef: 1.1, src: this, style: 'dark', label: 'Obsidyen Parçası' });
      this.cast(600, () => {});
    } else if (step === 0) {
      this.abilityCd = 9;
      this.cast(500, () => this.shield(0.3, 5000, 0xb090e0, 'Obsidyen Zırh'));
    } else this.abilityCd = 1.2;
  }

  eliteV4(ab, p, dP) {
    const z = this.z;
    this.v4n = (this.v4n || 0) + 1;
    const step = this.v4n % 3;
    if (ab === 'storm_field') {
      if (step === 1 && dP < 4.2 * TILE) {
        this.abilityCd = this.enraged ? 7 : 8.5;
        const r = 3.6 * TILE, dur = this.enraged ? 1300 : 1500;
        z.telegraph({ kind: 'circle', x: this.x, y: this.y, r }, dur, STORM);
        z.text(this.x, this.y - 70, 'Fırtına Alanı', '#9ad0ff', 13);
        this.cast(dur, () => {
          this.anim('atk');
          z.fx('shatter', this.x, this.y - 6, { scale: 3.4, tint: STORM, snd: 'slam', shake: 1 });
          this.areaHit((q) => inCircle(q.x, q.y, this.x, this.y, r), { coef: 1.8, label: 'Fırtına Alanı', slow: [0.3, 1.5] });
        });
      } else if (step === 2 && dP < 9 * TILE) {
        this.abilityCd = 8;
        this.anim('atk');
        z.text(this.x, this.y - 70, 'Yıldırım Zinciri', '#9ad0ff', 13);
        for (const [ox, oy] of [[0, 0], [1.6, 0.6], [-1.5, 0.7], [0.1, -1.5]]) z.shard({ x: p.x + ox * TILE, y: p.y + oy * TILE, r: 0.95 * TILE, delay: 1.4, coef: 1.05, src: this, style: 'storm', label: 'Yıldırım' });
        this.cast(600, () => {});
      } else if (step === 0 && dP < 4.5 * TILE) {
        this.abilityCd = 9;
        const ang = Math.atan2(p.y - this.y, p.x - this.x), r = 3.8 * TILE, dur = 1450;
        z.telegraph({ kind: 'cone', x: this.x, y: this.y - 6, r, angle: ang }, dur, STORM);
        this.cast(dur, () => {
          this.anim('atk');
          z.fx('slash', this.x + Math.cos(ang) * 32, this.y - 10 + Math.sin(ang) * 32, { scale: 3.2, rotation: ang, tint: STORM, snd: 'slam', shake: 1 });
          this.areaHit((q) => inCone(q.x, q.y, this.x, this.y, ang, r), { coef: 2.0, label: 'Cellat Yıldırımı' });
          for (let i = 1; i <= 2; i++) z.hazard({ x: this.x + Math.cos(ang) * i * TILE * 1.3, y: this.y + Math.sin(ang) * i * TILE * 1.3, r: 0.8 * TILE, dur: 3, tick: 0.5, coef: 0.16, src: this, key: 'storm_ground', label: 'Fırtına izi' });
        });
      } else this.abilityCd = 1.2;
      return;
    }
    // void_guard (Hiçlik Muhafızı)
    if (step === 1 && dP < 4.6 * TILE) {
      this.abilityCd = 8.5;
      const r = 4 * TILE, dur = 1600;
      z.telegraph({ kind: 'circle', x: this.x, y: this.y, r }, dur, VOID);
      this.cast(dur, () => {
        this.anim('atk');
        z.fx('shatter', this.x, this.y - 6, { scale: 3.6, tint: VOID, snd: 'slam', shake: 1 });
        this.areaHit((q) => inCircle(q.x, q.y, this.x, this.y, r), { coef: 1.9, label: 'Hiçlik Darbesi' });
      });
    } else if (step === 2 && dP < 9 * TILE) {
      this.abilityCd = 8;
      this.anim('atk');
      z.text(this.x, this.y - 70, 'Boşluk Yağmuru', '#c8a0ff', 13);
      for (const [ox, oy] of [[0, 0], [1.5, 0.7], [-1.4, 0.8], [0.2, -1.4]]) z.shard({ x: p.x + ox * TILE, y: p.y + oy * TILE, r: 0.95 * TILE, delay: 1.4, coef: 1.1, src: this, style: 'star', label: 'Boşluk Parçası' });
      this.cast(600, () => {});
    } else if (step === 0) {
      this.abilityCd = 9;
      this.cast(500, () => this.shield(0.35, 5000, 0xb0a0ff, 'Hiçlik Muhafazası'));
    } else this.abilityCd = 1.2;
  }

  // istemciye giden sıkıştırılmış durum: [id, x, y, hp, durum, yön, bayraklar]
  // bayrak bitleri: 1 hareket, 2 savaşta, 4 gizli (dalış), 8 sersem
  snap() {
    const fl = (this.moving ? 1 : 0) | (this.engaged ? 2 : 0) | (this.hidden ? 4 : 0) | (this.now < this.stunUntil ? 8 : 0);
    return [this.id, Math.round(this.x), Math.round(this.y), Math.max(0, Math.ceil(this.hp)), this.facing, fl, Math.round(this.reduce * 100), this.tint];
  }

  full() {
    return { id: this.id, tpl: this.tpl.id, x: Math.round(this.x), y: Math.round(this.y), hp: Math.ceil(this.hp), mhp: this.maxHp, f: this.facing };
  }
}
