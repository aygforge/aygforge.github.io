// CombatSystem çalışma zamanı: hasar tek yerden uygulanır (systems/combat formülleri),
// öldürme ödülleri tek yerden verilir (systems/rewards), görsel/ses geri bildirimi burada üretilir.
import Phaser from 'phaser';
import { app } from '../core/app.js';
import { bus } from '../core/events.js';
import { playerHit, enemyHit, poisonTick } from '../systems/combat.js';
import { applyKill } from '../systems/rewards.js';
import { claimBossLoot, bossKillId, dungeonOfBoss } from '../systems/dungeon.js';
import { ITEMS } from '../data/items.js';
import { STACKABLES } from '../data/materials.js';
import { SKILLS } from '../data/skills.js';
import { MINION } from '../systems/stats.js';
import { RARITY_INFO, TILE, WARRIOR_MP_ON_HIT, TG_SQUASH, CRIT_MULT } from '../data/constants.js';
import { iconPB } from '../art/icons.js';
import { sound } from '../audio/sound.js';

const RARITY_TINT = { N: 0xd6d2c4, U: 0x5fd068, R: 0x4f9bff, E: 0xc070ff, L: 0xff9b2e };

// V4 Legendary etkileri (belge: Legendary oranları değişmez; etkiler eski silahlarla aynı ölçekte, zincirlenmez)
export const LEGEND_PROCS = {
  ore_volley: { on: 'normal', chance: 0.10, icd: 8, coef: 1.2, label: 'Cevher Oku', color: '#90e8ff', fx: 'shatter', tint: 0x5ae0ff, sound: 'ice' },
  frost_hunt: { on: 'normal', chance: 0.10, icd: 8, coef: 1.25, label: 'Ayaz Avı', color: '#c8f0ff', fx: 'shatter', tint: 0xc8f0ff, sound: 'ice', slow: { pct: 0.2, dur: 1.5 } },
  king_hunt: { on: 'normal', chance: 0.10, icd: 8, coef: 1.3, label: 'Kralın Avı', color: '#e0c8ff', fx: 'shatter', tint: 0xa070e0 },
  storm_oath: { on: 'normal', chance: 0.10, icd: 8, coef: 1.35, label: 'Fırtına Yemini', color: '#fff0a0', fx: 'shatter', tint: 0x9ad0ff },
  sky_verdict: { on: 'normal', chance: 0.10, icd: 8, coef: 1.35, label: 'Göğün Hükmü', color: '#e8f0ff', fx: 'shatter', tint: 0xe8f0ff },
  mine_souls: { on: 'spell', chance: 0.08, icd: 10, pct: 0.6, label: 'Maden Ruhları', color: '#90e8ff', fx: 'spirit', tint: 0x5ae0ff, sound: 'ice' },
  frozen_bones: { on: 'spell', chance: 0.08, icd: 10, pct: 0.6, label: 'Donmuş Kemikler', color: '#c8f0ff', fx: 'shatter', tint: 0xc8f0ff, sound: 'ice', slow: { pct: 0.25, dur: 2 } },
  lost_souls: { on: 'spell', chance: 0.09, icd: 10, pct: 0.65, label: 'Kayıp Ruhlar', color: '#e0c8ff', fx: 'spirit', tint: 0xc080ff },
  last_call: { on: 'spell', chance: 0.09, icd: 10, pct: 0.7, label: 'Son Çağrı', color: '#d0c8ff', fx: 'spirit', tint: 0xb0a0ff },
  astral_doom: { on: 'spell', chance: 0.09, icd: 10, pct: 0.7, label: 'Astral Kıyamet', color: '#fff4c0', fx: 'spirit', tint: 0xffe8a0 },
};

export class CombatRuntime {
  constructor(scene) {
    this.scene = scene;
    this.dpsLog = [];
    this.hazards = [];
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
  // V4 Avcı İşareti: işaretli hedefe okçunun hasarı artar
  markBonus(t) {
    return t.mark && this.scene.clock < t.mark.until ? t.mark.bonus : 0;
  }

  playerNormalHit(t) {
    if (t.dead) return;
    const st = app.stats();
    const res = playerHit(st, t, { isNormal: true, rng: this.rng, targetSlowed: t.isSlowed(), extraMult: this.scene.player.dmgBuffMult(st.damageType), markBonus: this.markBonus(t) });
    this.applyToEnemy(t, res, { normal: true });
    // Savaş Nefesi: Warrior'ın isabetli normal vuruşu MP yeniler
    if (!res.miss && st.cls === 'warrior') app.char.mp = Math.min(st.maxMp, app.char.mp + WARRIOR_MP_ON_HIT);
    // V4 Ruh Hasadı: Ölü Çağıran'ın kendi isabetli normal vuruşu MP yeniler (iskeletinki sayılmaz)
    if (!res.miss && st.mpOnHit) app.char.mp = Math.min(st.maxMp, app.char.mp + st.mpOnHit);
    if (res.crit) this.scene.player.onCrit?.();
    if (!res.miss && !t.dead) this.legendProc(st, t, 'normal', res);
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
    // Buzun Hükmü (V2): normal vuruşta %10, 8 sn iç bekleme, ek buz hasarı + kısa yavaşlatma (zincirlenmez)
    if (!res.miss && st.legendaryEffect === 'frost_verdict' && !t.dead && this.scene.clock >= p.icd.frost && this.rng.float() < 0.10) {
      p.icd.frost = this.scene.clock + 8000;
      const extra = playerHit(st, t, { coef: 1.25, isNormal: false, dmgType: 'magic', rng: this.rng });
      this.scene.fx.sprite('shatter', t.x, t.y - 18, { scale: 1.8 });
      this.scene.fx.text(t.x, t.y - 64, 'Buzun Hükmü', { color: '#9fe8ff', size: 12 });
      sound.play('ice');
      if (t.tpl.kind !== 'boss') { t.slowUntil = this.scene.clock + 1500; t.slowPct = Math.max(t.slowPct, 0.2); }
      this.applyToEnemy(t, extra, { legend: true });
    }
    // Kralın Son Emri (V3): normal vuruşta %10, 8 sn iç bekleme, ek karanlık hasar (büyü savunmasına karşı); zincirlenmez
    if (!res.miss && st.legendaryEffect === 'kings_command' && !t.dead && this.scene.clock >= p.icd.king && this.rng.float() < 0.10) {
      p.icd.king = this.scene.clock + 8000;
      const extra = playerHit(st, t, { coef: 1.3, isNormal: false, dmgType: 'magic', rng: this.rng });
      this.scene.fx.sprite('shatter', t.x, t.y - 18, { scale: 1.8, tint: 0xa070e0 });
      this.scene.fx.text(t.x, t.y - 64, 'Son Emir', { color: '#c8a0ff', size: 12 });
      sound.play('bolt');
      this.applyToEnemy(t, extra, { legend: true });
    }
  }

  playerSkillHit(t, { coef, skill, spell = false, critMult = null, burn = null, defIgnore = 0 }) {
    if (t.dead) return null;
    const st = app.stats();
    const dmgType = SKILLS[skill]?.dmg || st.damageType;
    const res = playerHit(st, t, { coef, isNormal: false, dmgType, rng: this.rng, targetSlowed: t.isSlowed(), extraMult: this.scene.player.dmgBuffMult(dmgType), defIgnore, markBonus: this.markBonus(t) });
    // Ustalık Kitabı: kritik çarpanı (×1,5 → kitap değeri)
    if (critMult && res.crit && !res.miss) res.dmg = Math.round(res.dmg * critMult / CRIT_MULT);
    this.applyToEnemy(t, res, {});
    if (res.crit) this.scene.player.onCrit?.();
    if (spell && !res.miss && !t.dead) this.legendProc(st, t, 'spell', res);
    // Ustalık Kitabı: yanma (vuruş hasarının küçük bir yüzdesi, saniyede bir; zincirlenmez/yenilenir)
    if (burn && !res.miss && !t.dead) {
      const tick = Math.max(1, Math.round(res.dmg * burn.pct));
      t.burn?.remove();
      t.burn = this.scene.time.addEvent({ delay: 1000, repeat: burn.dur - 1, callback: () => {
        if (t.dead) return;
        this.scene.fx.sprite('fireball', t.x + (Math.random() - 0.5) * 10, t.y - t.height * 0.6, { scale: 0.5, life: 300 });
        this.applyToEnemy(t, { dmg: tick, crit: false, miss: false }, { legend: false });
      } });
    }
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
    // Sonsuz Kış Asası (V2): aktif hasar büyüsünde %8, 10 sn iç bekleme, ek buz hasarı; yankı tekrar tetiklemez
    if (spell && st.legendaryEffect === 'endless_winter' && !t.dead && this.scene.clock >= p.icd.winter && this.rng.float() < 0.08) {
      p.icd.winter = this.scene.clock + 10000;
      const chill = { dmg: Math.max(1, Math.round(res.dmg * 0.6)), crit: false, miss: false };
      this.scene.time.delayedCall(200, () => {
        if (t.dead) return;
        this.scene.fx.sprite('shatter', t.x, t.y - 18, { scale: 2 });
        this.scene.fx.text(t.x, t.y - 64, 'Sonsuz Kış', { color: '#c8f0ff', size: 12 });
        sound.play('ice');
        if (t.tpl.kind !== 'boss') { t.slowUntil = this.scene.clock + 2000; t.slowPct = Math.max(t.slowPct, 0.25); }
        this.applyToEnemy(t, chill, { legend: true });
      });
    }
    // Sonsuz Hüküm (V3): aktif hasar büyüsünde %9, 10 sn iç bekleme, ek ruh hasarı; yankı tekrar tetiklemez
    if (spell && st.legendaryEffect === 'eternal_verdict' && !t.dead && this.scene.clock >= p.icd.verdict && this.rng.float() < 0.09) {
      p.icd.verdict = this.scene.clock + 10000;
      const soul = { dmg: Math.max(1, Math.round(res.dmg * 0.65)), crit: false, miss: false };
      this.scene.time.delayedCall(200, () => {
        if (t.dead) return;
        this.scene.fx.sprite('spirit', t.x, t.y - 18, { scale: 2, blend: Phaser.BlendModes.ADD, tint: 0xc080ff });
        this.scene.fx.text(t.x, t.y - 64, 'Sonsuz Hüküm', { color: '#e0c8ff', size: 12 });
        sound.play('ice');
        this.applyToEnemy(t, soul, { legend: true });
      });
    }
    return res;
  }

  // V4 Legendary etkileri (dört yeni sınıf silahı + W/M Lv.50): tek tablo, iç bekleme ve zincirlenmezlik eski etkilerle aynı.
  //  normal: normal vuruşta şans → ek hasar (büyü savunmasına karşı); spell: aktif hasar büyüsünde şans → yankı (vuruşun yüzdesi)
  legendProc(st, t, on, res) {
    const L = LEGEND_PROCS[st.legendaryEffect];
    if (!L || L.on !== on) return;
    const p = this.scene.player, now = this.scene.clock;
    if (now < (p.icd[st.legendaryEffect] || 0) || this.rng.float() >= L.chance) return;
    p.icd[st.legendaryEffect] = now + L.icd * 1000;
    const extra = on === 'normal'
      ? playerHit(st, t, { coef: L.coef, isNormal: false, dmgType: 'magic', rng: this.rng })
      : { dmg: Math.max(1, Math.round(res.dmg * L.pct)), crit: false, miss: false };
    this.scene.time.delayedCall(on === 'normal' ? 0 : 200, () => {
      if (t.dead) return;
      this.scene.fx.sprite(L.fx, t.x, t.y - 18, { scale: 2, blend: Phaser.BlendModes.ADD, tint: L.tint });
      this.scene.fx.text(t.x, t.y - 64, L.label, { color: L.color, size: 12 });
      sound.play(L.sound || 'bolt');
      if (L.slow && t.tpl.kind !== 'boss') { t.slowUntil = this.scene.clock + L.slow.dur * 1000; t.slowPct = Math.max(t.slowPct, L.slow.pct); }
      this.applyToEnemy(t, extra, { legend: true });
    });
  }

  // ------------------------------------------------------------- iskelet (V4) → düşman
  // Tek öldürme yolu: applyToEnemy → killEnemy. EXP/ganimet/görev sayacı oyuncuya bir kez; iskelet ayrıca ödül üretmez.
  minionHit(t, m) {
    if (t.dead || m.dead) return;
    // ruh bağı: iskelet hasarı Ölü Çağıran'ınki gibi büyü savunmasına göre hesaplanır (katkı yaratık türünden bağımsız ~%30)
    const ms = { power: m.power, damageType: MINION.dmgType, dmgMult: 1, species: {}, critChance: m.critChance, level: m.level, slowedDmg: 0 };
    const res = playerHit(ms, t, { isNormal: true, rng: this.rng, dmgType: MINION.dmgType });
    m.scene.fx.sprite('slash', t.x, t.y - 14, { scale: 0.9, tint: 0xd8f0d0 });
    this.applyToEnemy(t, res, { normal: true, fromMinion: true });
    // normal yaratık kısa süre iskelete yönelebilir; elit daha seyrek; boss asla (mekanikleri iskeletle atlatılamaz)
    if (!res.miss && !t.dead && t.tpl.ai !== 'static') {
      const k = t.tpl.kind;
      const chance = k === 'normal' || k === 'hunt' ? 0.45 : k === 'elite' ? 0.2 : 0;
      if (chance && this.rng.float() < chance) { t.taunt = m; t.tauntUntil = this.scene.clock + 3000; }
    }
  }

  // düşman → iskelet (savunma formülü; kaçınma/lanet yok)
  enemyHitsMinion(e, m, { coef = 1 } = {}) {
    if (m.dead) return;
    const magic = e.dmgType === 'magic';
    const weaken = e.weakenUntil > this.scene.clock ? e.weakenPct : 0;
    const dmg = e.atk * coef * (100 / (100 + Math.max(0, magic ? m.mdef : m.def))) * (1 - weaken);
    m.takeHit(dmg);
  }

  applyToEnemy(t, res, { normal = false, legend = false, fromMinion = false } = {}) {
    const fx = this.scene.fx;
    if (res.miss) { fx.damage(t.x, t.y - t.height, 0, { miss: true }); if (!fromMinion) sound.play('miss'); return; }
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

  // blockable (V4 ok/ruh mermisi): mermi her karede duvar kontrolü yapar; görüşü kapatan karoya çarpınca kırılır
  projectile(from, to, key, speed, onHit, { blockable = false, tint = null, scale = 1 } = {}) {
    const sc = this.scene;
    const s = sc.fx.sprite(key, from.x + from.facing * 16, from.y - 30, { depth: 59000, tint, scale });
    const proj = { s, to, speed, onHit, alive: true, blockable };
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
        if (pr.blockable) {
          const tx0 = Math.floor(pr.s.x / TILE), ty0 = Math.floor((pr.s.y + 22) / TILE);
          const ttx = Math.floor(pr.to.x / TILE), tty = Math.floor(pr.to.y / TILE);
          if ((tx0 !== ttx || ty0 !== tty) && sc.grid.opaque(tx0, ty0)) {
            pr.alive = false; pr.s.destroy();
            sc.fx.sprite('spark', pr.s.x, pr.s.y, { scale: 0.8 });
          }
        }
      }
    }
    sc.projectiles = sc.projectiles.filter((p) => p.alive);
  }

  // Zincir Yıldırım bağlantı çizgisi (görünür sıçrama)
  lightningLink(x0, y0, x1, y1) {
    const sc = this.scene;
    const g = sc.add.graphics().setDepth(59500).setBlendMode(Phaser.BlendModes.ADD);
    const pts = [[x0, y0]];
    const n = 6;
    for (let i = 1; i < n; i++) {
      const k = i / n;
      pts.push([x0 + (x1 - x0) * k + (Math.random() - 0.5) * 14, y0 + (y1 - y0) * k + (Math.random() - 0.5) * 14]);
    }
    pts.push([x1, y1]);
    g.lineStyle(4, 0x6a7aff, 0.5); g.strokePoints(pts.map(([x, y]) => ({ x, y })));
    g.lineStyle(2, 0xe8eeff, 1); g.strokePoints(pts.map(([x, y]) => ({ x, y })));
    sc.fx.sprite('spark', x1, y1, { scale: 1.4, tint: 0xb0c0ff });
    sc.tweens.add({ targets: g, alpha: 0, duration: 260, delay: 80, onComplete: () => g.destroy() });
  }

  stunFx(ent, sec) {
    const s = this.scene.fx.sprite('stun', 0, 0, { depth: 61000 });
    const follow = () => { if (!s.active) return; s.setPosition(ent.x, ent.y - (ent.height || 56) - 4); };
    follow();
    const ev = this.scene.time.addEvent({ delay: 30, loop: true, callback: follow });
    this.scene.time.delayedCall(sec * 1000, () => { ev.remove(); s.destroy(); });
  }

  // ------------------------------------------------------------- yer tehlikeleri (V2)
  // Geçici alan hasarı (ateş izi, alev yarığı): telegraf alanı = isabet alanı, tik başına küçük hasar
  groundHazard({ x, y, r, dur, tick = 0.5, coef = 0.2, src, key = 'fire_ground', label = null, warn = 0, dmgType = 'magic', tint = null }) {
    const sc = this.scene;
    const hz = { x, y, r, left: dur, tick, t: warn > 0 ? 0 : tick, coef, src, label, warn, dmgType, alive: true, sprites: [] };
    if (warn > 0) sc.fx.telegraph({ kind: 'circle', x, y, r }, warn * 1000, key === 'void_ground' ? 0xa070e0 : key === 'storm_ground' ? 0x9ad0ff : 0xff6a1a);
    const show = () => {
      const s = sc.fx.sprite(key, x, y, { depth: 41, scale: (r * 2) / 64 * 2, tint });
      s.setDisplaySize(r * 2.2, r * 2.2 * TG_SQUASH * 0.9);
      hz.sprites.push(s);
    };
    if (warn > 0) sc.time.delayedCall(warn * 1000, show); else show();
    this.hazards.push(hz);
    return hz;
  }

  // Düşen buz kıymığı: telegraf (gecikme), sonra tek vuruş
  // V3: dark = true → Kayıp Kral / Obsidyen Celladı'nın kara mermisi (aynı telegraf ve isabet kuralı)
  // V4: style = 'storm' (yıldırım) / 'star' (düşen yıldız); isabet kuralı aynı
  fallingShard({ x, y, r, delay = 1.4, coef = 1, src, dark = false, label = null, style = null }) {
    const sc = this.scene;
    const st = style || (dark ? 'dark' : 'ice');
    const look = { ice: ['ice_spike', 0x7ad8ff, null, 'ice'], dark: ['dark_missile', 0xa070e0, 0xa070e0, 'bolt'],
      storm: ['storm_bolt', 0x9ad0ff, 0x9ad0ff, 'bolt'], star: ['star_bolt', 0xfff0c0, 0xfff0c0, 'bolt'] }[st];
    sc.fx.telegraph({ kind: 'circle', x, y, r }, delay * 1000, look[1]);
    sc.time.delayedCall(delay * 1000 - 260, () => {
      const s = sc.fx.sprite(look[0], x, y - 140, { depth: 59000, origin: [0.5, 1], scale: 1.4 });
      sc.tweens.add({ targets: s, y, duration: 260, ease: 'Quad.in', onComplete: () => {
        s.destroy();
        sc.fx.sprite('shatter', x, y - 8, { scale: 1.6, tint: look[2] });
        sound.play(look[3], { vol: 0.6 });
        const p = sc.player;
        if (!p.dead && Math.hypot((p.x - x) / r, (p.y - y) / (r * TG_SQUASH)) <= 1) this.enemyHitsPlayer(src, { coef, dmgType: 'magic', label: label || (dark ? 'Kara Mermi' : 'Buz Kıymığı') });
      } });
    });
  }

  updateHazards(dt) {
    const p = this.scene.player;
    for (const hz of this.hazards) {
      if (hz.warn > 0) { hz.warn -= dt; continue; }
      hz.left -= dt;
      if (hz.left <= 0) { hz.alive = false; hz.sprites.forEach((s) => this.scene.tweens.add({ targets: s, alpha: 0, duration: 250, onComplete: () => s.destroy() })); continue; }
      hz.t -= dt;
      if (hz.t <= 0) {
        hz.t = hz.tick;
        if (!p.dead && Math.hypot((p.x - hz.x) / hz.r, (p.y - hz.y) / (hz.r * TG_SQUASH)) <= 1) {
          this.enemyHitsPlayer(hz.src, { coef: hz.coef, dmgType: hz.dmgType, label: hz.label });
          hz.label = null;   // etiket yalnız ilk tikte
        }
      }
    }
    this.hazards = this.hazards.filter((h) => h.alive);
  }

  clearHazards() {
    for (const hz of this.hazards) hz.sprites.forEach((s) => s.destroy());
    this.hazards = [];
  }

  // V3 Lanet: kısa süreli alınan hasar artışı. Zincirlenmez — süre uzatılmaz, en güçlü oran geçerli.
  cursePlayer(pct, sec) {
    const p = this.scene.player;
    if (p.dead) return;
    const now = this.scene.clock, cur = p.buffs.curse;
    if (cur && now < cur.until && cur.value >= pct) return;
    p.buffs.curse = { until: now + sec * 1000, value: pct };
    this.scene.fx.text(p.x, p.y - 70, 'Lanetlendin', { color: '#c080ff', size: 12 });
    this.scene.fx.sprite('spirit', p.x, p.y - 30, { scale: 1.4, tint: 0xa070e0 });
  }

  // Yavaşlatma: zincirlenmez — süre uzatılmaz, en güçlü oran geçerli
  slowPlayer(pct, sec) {
    const p = this.scene.player;
    if (p.dead) return;
    const now = this.scene.clock;
    // Isıtıcı Tonik: soğuk/yavaşlatma etkilerinin gücü ve süresi azalır
    const warm = p.buffs.warm && now < p.buffs.warm.until ? p.buffs.warm.value : 0;
    if (warm) { pct *= 1 - warm; sec *= 1 - warm; }
    if (now < p.slowUntil && p.slowPct >= pct) return;
    p.slow(pct, sec);
    this.scene.fx.text(p.x, p.y - 70, 'Yavaşladın', { color: '#9fe8ff', size: 12 });
  }

  // ------------------------------------------------------------- düşman → oyuncu
  enemyHitsPlayer(e, { coef = 1, isNormal = false, dmgType = null, label = null } = {}) {
    const p = this.scene.player;
    if (p.dead) return;
    const st = app.stats();
    const weaken = e.weakenUntil > this.scene.clock ? e.weakenPct : 0;
    const res = enemyHit(e, st, { coef, isNormal, dmgType, rng: this.rng, buffs: p.buffState(), currentMp: app.char.mp, weaken });
    if (res.miss) { this.scene.fx.damage(p.x, p.y - 56, 0, { miss: true, evaded: res.evaded }); return; }
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
    if (e.tpl.slow) {
      const orig = pr.onHit;
      pr.onHit = () => { orig(); if (Math.random() < e.tpl.slow.chance) this.slowPlayer(e.tpl.slow.pct, e.tpl.slow.dur); };
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
    // V3: görev olayı yaratığı — EXP/ganimet/görev sayacı/elit katkısı yok (farm çoğaltılamaz)
    if (e.questSpawn) {
      sc.spawner.onEnemyDeath(e);
      e.questEvent?.onEnemyDead?.(e);
      return;
    }
    let res;
    const dId = dungeonOfBoss(e.tpl.id);
    if (dId && sc.mapId === dId) {
      // zindan bossu: koşu başına tek loot (kimlik koşuya bağlı, çift ödül yok)
      const allowed = claimBossLoot(ch, dId);
      res = allowed ? applyKill(ch, e.tpl.id, { killId: bossKillId(ch, dId), unique: true }, this.rng) : { duplicate: true, quest: [], levelEvents: [], items: [], pending: [], lost: [], stacks: [], lostStacks: [], exp: 0, gold: 0 };
      if (allowed) { ch.history.dungeons[dId] = (ch.history.dungeons[dId] || 0) + 1; }
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
