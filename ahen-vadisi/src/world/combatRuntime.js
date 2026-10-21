// CombatSystem çalışma zamanı: hasar tek yerden uygulanır (systems/combat formülleri),
// öldürme ödülleri tek yerden verilir (systems/rewards), görsel/ses geri bildirimi burada üretilir.
import Phaser from 'phaser';
import { app } from '../core/app.js';
import { bus } from '../core/events.js';
import { playerHit, enemyHit, poisonTick } from '../systems/combat.js';
import { applyKill } from '../systems/rewards.js';
import { claimBossLoot, bossKillId } from '../systems/dungeon.js';
import { ITEMS } from '../data/items.js';
import { STACKABLES } from '../data/materials.js';
import { SKILLS } from '../data/skills.js';
import { RARITY_INFO, TILE, WARRIOR_MP_ON_HIT } from '../data/constants.js';
import { iconPB } from '../art/icons.js';
import { sound } from '../audio/sound.js';

const RARITY_TINT = { N: 0xd6d2c4, U: 0x5fd068, R: 0x4f9bff, E: 0xc070ff, L: 0xff9b2e };

export class CombatRuntime {
  constructor(scene) {
    this.scene = scene;
    this.dpsLog = [];
  }

  get rng() { return app.rng; }

  logDps(dmg) {
    const now = this.scene.clock;
    this.dpsLog.push([now, dmg]);
    while (this.dpsLog.length && now - this.dpsLog[0][0] > 10000) this.dpsLog.shift();
  }
  dps() {
    if (!this.dpsLog.length) return 0;
    const now = this.scene.clock;
    const span = Math.max(1, (now - this.dpsLog[0][0]) / 1000);
    return this.dpsLog.reduce((a, [, d]) => a + d, 0) / span;
  }

  // ------------------------------------------------------------- oyuncu → düşman
  playerNormalHit(t) {
    if (t.dead) return;
    const st = app.stats();
    const res = playerHit(st, t, { isNormal: true, rng: this.rng, targetSlowed: t.isSlowed() });
    this.applyToEnemy(t, res, { normal: true });
    // Savaş Nefesi: Warrior'ın isabetli normal vuruşu MP yeniler
    if (!res.miss && st.cls === 'warrior') app.char.mp = Math.min(st.maxMp, app.char.mp + WARRIOR_MP_ON_HIT);
    // Kızıl Hüküm: normal vuruşta %10, 8 sn iç bekleme, ek ateş hasarı (büyü savunmasına karşı)
    const p = this.scene.player;
    if (!res.miss && st.legendaryEffect === 'crimson_strike' && !t.dead && this.scene.clock >= p.icd.crimson && this.rng.float() < 0.10) {
      p.icd.crimson = this.scene.clock + 8000;
      const extra = playerHit(st, t, { coef: 1.2, isNormal: false, dmgType: 'magic', rng: this.rng });
      this.scene.fx.sprite('crimson', t.x, t.y - 18, { scale: 2, blend: Phaser.BlendModes.ADD });
      this.scene.fx.text(t.x, t.y - 64, 'Kızıl Darbe', { color: '#ff6a40', size: 12 });
      sound.play('fire');
      this.applyToEnemy(t, extra, { legend: true });
    }
  }

  playerSkillHit(t, { coef, skill, spell = false }) {
    if (t.dead) return;
    const st = app.stats();
    const dmgType = SKILLS[skill]?.dmg || st.damageType;
    const res = playerHit(st, t, { coef, isNormal: false, dmgType, rng: this.rng, targetSlowed: t.isSlowed() });
    this.applyToEnemy(t, res, {});
    // Kadim Ruh Asası: aktif hasar büyüsünde %8, 10 sn iç bekleme; Ruh Yankısı zincirlenmez
    const p = this.scene.player;
    if (spell && st.legendaryEffect === 'spirit_echo' && !t.dead && this.scene.clock >= p.icd.spirit && this.rng.float() < 0.08) {
      p.icd.spirit = this.scene.clock + 10000;
      const echo = { dmg: Math.max(1, Math.round(res.dmg * 0.6)), crit: false, miss: false };
      this.scene.time.delayedCall(220, () => {
        if (t.dead) return;
        this.scene.fx.sprite('spirit', t.x, t.y - 18, { scale: 2, blend: Phaser.BlendModes.ADD });
        this.scene.fx.text(t.x, t.y - 64, 'Ruh Yankısı', { color: '#90e8ff', size: 12 });
        sound.play('ice');
        this.applyToEnemy(t, echo, { legend: true });
      });
    }
  }

  applyToEnemy(t, res, { normal = false, legend = false } = {}) {
    const fx = this.scene.fx;
    if (res.miss) { fx.damage(t.x, t.y - t.height, 0, { miss: true }); sound.play('miss'); return; }
    t.hp -= res.dmg;
    this.logDps(res.dmg);
    fx.damage(t.x, t.y - t.height, res.dmg, { crit: res.crit, kind: legend ? 'legend' : '' });
    if (res.crit) { sound.play('crit'); fx.sprite('spark', t.x, t.y - t.height / 2, { scale: 1.6 }); fx.shake(0.0025, 70); }
    else { sound.play('hit'); if (normal) fx.sprite('spark', t.x + (Math.random() - 0.5) * 8, t.y - t.height / 2, { scale: 1 }); }
    t.onDamaged();
    this.scene.player.lastCombatAt = this.scene.clock;
    if (t.hp <= 0) this.killEnemy(t);
    bus.emit('enemyHp', t);
  }

  enemiesInRadius(x, y, r, max, requireLos) {
    const p = this.scene.player;
    return this.scene.enemies
      .filter((e) => !e.dead && Math.hypot(e.x - x, e.y - y) <= r + e.radius && (!requireLos || this.scene.grid.los(p.x, p.y - 6, e.x, e.y - 6)))
      .sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))
      .slice(0, max);
  }

  projectile(from, to, key, speed, onHit) {
    const sc = this.scene;
    const s = sc.fx.sprite(key, from.x + from.facing * 16, from.y - 30, { depth: 59000 });
    const proj = { s, to, speed, onHit, alive: true };
    sc.projectiles.push(proj);
    return proj;
  }

  updateProjectiles(dt) {
    const sc = this.scene;
    for (const pr of sc.projectiles) {
      if (!pr.alive) continue;
      const tx = pr.to.x, ty = pr.to.y - (pr.to.height ? pr.to.height * 0.5 : 24);
      const dx = tx - pr.s.x, dy = ty - pr.s.y, d = Math.hypot(dx, dy);
      if (pr.to.dead && pr.to !== sc.player) { pr.alive = false; pr.s.destroy(); continue; }
      const step = pr.speed * dt;
      pr.s.setRotation(Math.atan2(dy, dx));
      if (d <= step + 6) {
        pr.alive = false;
        pr.s.destroy();
        if (!(pr.to.dead)) pr.onHit();
      } else {
        pr.s.x += dx / d * step; pr.s.y += dy / d * step;
      }
    }
    sc.projectiles = sc.projectiles.filter((p) => p.alive);
  }

  stunFx(ent, sec) {
    const s = this.scene.fx.sprite('stun', 0, 0, { depth: 61000 });
    const follow = () => { if (!s.active) return; s.setPosition(ent.x, ent.y - (ent.height || 56) - 4); };
    follow();
    const ev = this.scene.time.addEvent({ delay: 30, loop: true, callback: follow });
    this.scene.time.delayedCall(sec * 1000, () => { ev.remove(); s.destroy(); });
  }

  // ------------------------------------------------------------- düşman → oyuncu
  enemyHitsPlayer(e, { coef = 1, isNormal = false, dmgType = null, label = null } = {}) {
    const p = this.scene.player;
    if (p.dead) return;
    const st = app.stats();
    const res = enemyHit(e, st, { coef, isNormal, dmgType, rng: this.rng, buffs: p.buffState(), currentMp: app.char.mp });
    if (res.miss) { this.scene.fx.damage(p.x, p.y - 56, 0, { miss: true }); return; }
    if (res.mpDmg) { app.char.mp -= res.mpDmg; this.scene.fx.text(p.x + 14, p.y - 56, `-${res.mpDmg} MP`, { color: '#7ab0ff', size: 12 }); }
    if (label) this.scene.fx.text(p.x, p.y - 80, label, { color: '#ffb060', size: 12, rise: 16 });
    // son alınan hasarlar (ölüm ekranı/geliştirici analizi için kısa halka)
    (this.hurtLog || (this.hurtLog = [])).push({ src: e.tpl.id, label: label || 'normal', dmg: res.dmg, t: this.scene.clock });
    if (this.hurtLog.length > 40) this.hurtLog.shift();
    this.damagePlayerRaw(res.dmg, {});
  }

  damagePlayerRaw(dmg, { poison = false } = {}) {
    const p = this.scene.player;
    const ch = app.char;
    if (p.dead) return;
    ch.hp -= dmg;
    p.lastHurtAt = this.scene.clock;
    this.scene.fx.damage(p.x, p.y - 56, dmg, { toPlayer: true });
    if (!poison) {
      sound.play('hurt');
      p.body.setTintFill(0xff4040);
      this.scene.time.delayedCall(80, () => { if (!p.dead) p.body.clearTint(); });
      p.onHurt?.();
      p.cancelChannel();
    }
    if (ch.hp <= 0) { ch.hp = 0; this.scene.onPlayerDeath(); return; }
    p.checkWill();
    bus.emit('playerHurt', dmg);
  }

  poisonPlayer(e, poison) {
    const p = this.scene.player;
    if (!poison || p.dead) return;
    const dmg = poisonTick(e.atk, poison.pct, app.stats().poisonRes);
    p.poison = { dmg, left: poison.dur, tick: 1 };
    this.scene.fx.text(p.x, p.y - 70, 'Zehirlendin', { color: '#8be06a', size: 12 });
  }

  enemyProjectile(e, p, key) {
    sound.play('bolt', { vol: 0.6 });
    const pr = this.projectile(e, p, key, 300, () => this.enemyHitsPlayer(e, { coef: e.tpl.normalCoef ?? 1, isNormal: true }));
    pr.s.setPosition(e.x + e.facing * 10, e.y - e.height * 0.6);
    if (e.tpl.poison) {
      const orig = pr.onHit;
      pr.onHit = () => { orig(); if (Math.random() < e.tpl.poison.chance) this.poisonPlayer(e, e.tpl.poison); };
    }
  }

  // ------------------------------------------------------------- öldürme ve ödüller
  killEnemy(e) {
    if (e.dead) return;
    const sc = this.scene;
    const ch = app.char;
    e.die();
    sound.play('enemy_die');
    const p = sc.player;
    if (p.target === e) { p.target = null; p.approaching = p.interact ? p.approaching : false; bus.emit('target', null); }
    let res;
    if (e.tpl.id === 'mine_golem') {
      const allowed = claimBossLoot(ch);
      res = allowed ? applyKill(ch, e.tpl.id, { killId: bossKillId(ch), unique: true }, this.rng) : { duplicate: true, quest: [], levelEvents: [], items: [], pending: [], lost: [], stacks: [], lostStacks: [], exp: 0, gold: 0 };
    } else if (e.tpl.kind === 'boss') {
      res = applyKill(ch, e.tpl.id, { killId: e.killId, unique: true }, this.rng);
    } else {
      res = applyKill(ch, e.tpl.id, {}, this.rng);
    }
    sc.spawner.onEnemyDeath(e);
    this.presentRewards(e, res);
    // dungeon bölüm temizliği
    if (sc.mapDef.dungeon && e.stage) sc.checkStageCleared(e.stage);
    const critical = res.levelEvents.length || e.tpl.kind === 'boss' || e.tpl.kind === 'elite' ||
      [...res.items, ...res.pending].some((i) => i.r !== 'N') || res.quest.length;
    app.changed('kill');
    app.requestSave('kill', !!critical);
  }

  presentRewards(e, res) {
    const sc = this.scene, fx = sc.fx, p = sc.player;
    if (res.duplicate) { fx.text(e.x, e.y - 40, 'Bu koşunun boss ödülü zaten alındı', { color: '#c0c0c0', size: 12, dur: 2000 }); return; }
    let delay = 0;
    if (res.exp) fx.text(e.x, e.y - e.height - 8, `+${res.exp} EXP`, { color: '#a0d0ff', size: 12, rise: 22, dur: 1100 });
    if (res.gold) { sc.time.delayedCall(120, () => fx.text(e.x + 14, e.y - e.height + 6, `+${res.gold} Gold`, { color: '#ffd040', size: 12, rise: 22, dur: 1100 })); sound.play('coin'); }
    const fly = (key, tint) => {
      delay += 140;
      sc.time.delayedCall(delay, () => {
        const texKey = this.iconTex(key);
        const s = sc.add.image(e.x, e.y - 10, texKey).setDepth(59500).setScale(0.6);
        if (tint) { const g = sc.add.image(e.x, e.y - 10, 'light_white').setTint(tint).setScale(0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(59400); sc.tweens.add({ targets: g, alpha: 0, scale: 1.2, duration: 900, onComplete: () => g.destroy() }); }
        sc.tweens.add({ targets: s, y: e.y - 46, duration: 260, ease: 'Quad.out' });
        sc.tweens.add({ targets: s, x: () => p.x, y: () => p.y - 30, scale: 0.3, alpha: 0.4, delay: 520, duration: 360, ease: 'Quad.in', onComplete: () => s.destroy() });
      });
    };
    for (const st of res.stacks) { fly(st.id); bus.emit('loot', { name: STACKABLES[st.id].name, qty: st.qty, icon: st.id, r: 'N' }); }
    for (const it of [...res.items, ...res.pending]) {
      const t = ITEMS[it.tid];
      const rare = it.r === 'R' || it.r === 'E' || it.r === 'L';
      fly(it.tid, rare ? RARITY_TINT[it.r] : null);
      if (rare) {
        fx.lootBeam(e.x, e.y, RARITY_TINT[it.r]);
        sound.play(it.r === 'L' ? 'drop_l' : it.r === 'E' ? 'drop_e' : 'drop_r');
        if (it.r === 'L') { fx.shake(0.01, 400); sc.cameras.main.flash(400, 255, 170, 60); }
      } else sound.play('drop_n');
      bus.emit('loot', { name: t.name, rarity: it.r, icon: it.tid, r: it.r, pending: res.pending.includes(it), uid: it.uid });
    }
    for (const it of res.lost) bus.emit('toast', { text: `Çanta dolu: ${ITEMS[it.tid].name} (${RARITY_INFO[it.r].name}) alınamadı`, kind: 'warn' });
    if (res.pending.length) bus.emit('toast', { text: 'Çanta dolu — nadir eşya bekleyen ganimete aktarıldı', kind: 'info' });
    for (const st of res.lostStacks) bus.emit('toast', { text: `Çanta dolu: ${STACKABLES[st.id].name} alınamadı`, kind: 'warn', short: true });
    for (const u of res.quest) {
      bus.emit('questProgress', u);
      if (u.p >= u.n) sound.play('quest');
    }
    for (const ev of res.levelEvents) sc.onLevelUp(ev);
  }

  iconTex(key) {
    const tk = 'icon_' + key;
    if (!this.scene.textures.exists(tk)) this.scene.textures.addCanvas(tk, iconPB(key).toCanvas(2));
    return tk;
  }
}

export { TILE };
