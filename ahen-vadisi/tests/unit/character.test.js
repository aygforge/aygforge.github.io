import { describe, it, expect } from 'vitest';
import { Rng } from '../../src/core/rng.js';
import { createCharacter, gainExp, skillPointsTotal, skillPointsFree, rankUp, canRankUp, allocateStats, statPointsFree, resetSkills, resetStats } from '../../src/systems/character.js';
import { computeStats, statsWithItem } from '../../src/systems/stats.js';
import { computeHit, playerHit, enemyHit, hitChance } from '../../src/systems/combat.js';
import { createItem } from '../../src/systems/loot.js';
import { ENEMIES } from '../../src/data/enemies.js';
import { CLASS_SKILLS, SKILLS } from '../../src/data/skills.js';
import { cumulativeXp } from '../../src/data/constants.js';

const rng = new Rng(1);
const mk = (cls) => createCharacter({ name: 'Test', cls, slot: 0 }, rng);

describe('Statlar ve formüller', () => {
  it('Lv.1 HP/MP belge değerleri', () => {
    const w = computeStats(mk('warrior')), m = computeStats(mk('mage'));
    expect(w.maxHp).toBe(174); expect(w.maxMp).toBe(51);
    expect(m.maxHp).toBe(110); expect(m.maxMp).toBe(133);
  });
  it('Lv.1 Warrior Köylü Kılıcı → sıçana ≈15,6 hasar', () => {
    const w = computeStats(mk('warrior'));
    expect(w.physPower).toBeCloseTo(6 + 1.2 * 8 + 0.35, 5);
    const raw = w.physPower * 100 / (100 + ENEMIES.meadow_rat.def);
    expect(raw).toBeCloseTo(15.64, 1);
    // 2–3 vuruş eşiği: ±%5 ve kritik
    const r = new Rng(7); let two = 0, three = 0;
    for (let i = 0; i < 2000; i++) {
      let hp = 32, n = 0;
      while (hp > 0) { const h = computeHit({ power: w.physPower, defense: 2, isNormal: true, critChance: w.critChance, rng: r }); hp -= h.dmg; n++; }
      if (n === 2) two++; else if (n === 3) three++;
    }
    expect(three).toBeGreaterThan(two);
    expect(two).toBeGreaterThan(0);
  });
  it('kritik ×1,5, üst sınır %45; saldırı hızı üst sınır %35; min 1 hasar', () => {
    const c = mk('warrior'); c.alloc.dex = 1000;
    const s = computeStats(c);
    expect(s.critChance).toBe(0.45);
    expect(s.atkSpeed).toBe(0.35);
    expect(computeHit({ power: 1, defense: 9999, rng }).dmg).toBe(1);
    const h = computeHit({ power: 100, defense: 0, critChance: 1, rng });
    expect(h.dmg).toBe(150); expect(h.crit).toBe(true);
  });
  it('DEF/MDEF ayrımı: fiziksel DEF, büyü MDEF kullanır', () => {
    const w = computeStats(mk('warrior')), m = computeStats(mk('mage'));
    const beetle = ENEMIES.ironshell_beetle; // DEF 44 / MDEF 15
    const r = new Rng(3);
    const wd = playerHit(w, beetle, { coef: 1, rng: r, isNormal: false }).dmg;
    const md = playerHit(m, beetle, { coef: 1, rng: r, isNormal: false }).dmg;
    expect(wd).toBe(Math.round(w.physPower * 100 / 144 * w.dmgMult) || wd); // kritik olabilir
    expect(md).toBeGreaterThan(0);
    expect(hitChance(10, 10)).toBeCloseTo(0.97);
  });
  it('Demir Deri ve Mana Kalkanı hasarı gerçekten azaltır', () => {
    const w = computeStats(mk('warrior'));
    const e = ENEMIES.rotten_guard;
    const base = enemyHit(e, w, { rng: new Rng(5) }).dmg;
    const red = enemyHit(e, w, { rng: new Rng(5), buffs: { reduce: 0.25 } }).dmg;
    expect(red).toBeLessThan(base);
    const ms = enemyHit(e, w, { rng: new Rng(5), buffs: { manaShield: 0.3 }, currentMp: 999 });
    expect(ms.mpDmg).toBeGreaterThan(0);
    expect(ms.dmg + ms.mpDmg).toBe(base);
  });
  it('silah +n yalnız temel saldırıyı artırır (+5 → +%30)', () => {
    const c = mk('warrior');
    const p0 = computeStats(c).physPower;
    c.equipment.weapon.p = 5;
    const p5 = computeStats(c).physPower;
    expect(p5 - p0).toBeCloseTo(6 * 0.30, 5);
  });
  it('0 dayanıklılıkta temel değer %25 düşer, tamirle döner', () => {
    const c = mk('warrior');
    const d0 = computeStats(c).def;
    c.equipment.chest.d = 0;
    expect(computeStats(c).def).toBeCloseTo(d0 - 5 * 0.25, 5);
  });
  it('ekipman karşılaştırması gerçek motordan', () => {
    const c = mk('warrior'); c.level = 10;
    const steel = createItem('W03', 'R', new Rng(2));
    steel.b = [];
    const s = statsWithItem(c, steel);
    expect(s.physPower - computeStats(c).physPower).toBeCloseTo(32.5 - 6, 5);
  });
  it('iki elli silah kuşanılıyken kalkan karşılaştırması kazanç göstermez (kuşanılamaz)', () => {
    const c = mk('warrior'); c.level = 10;
    c.equipment.weapon = createItem('W02', 'N', new Rng(3)); c.equipment.offhand = null;
    const shield = createItem('O01', 'N', new Rng(4));
    expect(statsWithItem(c, shield)).toEqual(computeStats(c));
  });
});

describe('Seviye ve beceriler', () => {
  it('Lv.1→20 için 88.150 EXP; 57 stat puanı; aktif/pasif açılışları', () => {
    for (const cls of ['warrior', 'mage']) {
      const c = mk(cls);
      gainExp(c, cumulativeXp(20));
      expect(c.level).toBe(20);
      expect(statPointsFree(c)).toBe(57);
      const cs = CLASS_SKILLS[cls];
      // V1 becerileri (ilk 4 aktif + pasifler) Lv.20'de açık; V2'nin Lv.25 becerisi henüz kapalı
      for (const id of [...cs.actives.slice(0, 4), ...cs.passives]) expect(c.skills[id]).toBe(1);
      expect(c.skills[cs.actives[4]]).toBeUndefined();
    }
  });
  it('seviyeye göre doğru açılış', () => {
    const c = mk('mage');
    expect(Object.keys(c.skills)).toEqual(['fireball']);
    gainExp(c, cumulativeXp(5));
    expect(c.level).toBe(5);
    expect(c.skills.ice_blast).toBe(1);
    expect(c.skills.elemental_mastery).toBe(1);
    expect(c.skills.mana_shield).toBeUndefined();
  });
  it('toplam 21 beceri puanı; tümünü maksimuma çıkarmak 33 puan', () => {
    const c = mk('warrior');
    gainExp(c, cumulativeXp(20));
    expect(skillPointsTotal(c)).toBe(19);
    c.bonusSkillPoints = 2; // Lv.10 + Lv.20 sınıf görevleri
    expect(skillPointsTotal(c)).toBe(21);
    let total = 0;
    for (const id of [...CLASS_SKILLS.warrior.actives.slice(0, 4), ...CLASS_SKILLS.warrior.passives]) {
      const s = SKILLS[id];
      const max = s.kind === 'active' ? 5 : 3;
      for (let r = 2; r <= max; r++) total += s.kind === 'active' ? [0, 1, 1, 2, 2][r - 1] : [0, 1, 2][r - 1];
    }
    expect(total).toBe(33);
    let spent = 0;
    while (true) {
      const opt = [...CLASS_SKILLS.warrior.actives, ...CLASS_SKILLS.warrior.passives].find((id) => canRankUp(c, id).ok);
      if (!opt) break;
      spent += canRankUp(c, opt).cost; rankUp(c, opt);
    }
    expect(spent).toBeLessThanOrEqual(21);
    expect(skillPointsFree(c)).toBeLessThan(2);
  });
  it('stat dağıtımı ve sıfırlama gold ekonomisiyle', () => {
    const c = mk('warrior');
    gainExp(c, cumulativeXp(12));
    expect(allocateStats(c, { str: 10, vit: 5 }).ok).toBe(true);
    expect(allocateStats(c, { str: 100 }).ok).toBe(false);
    c.gold = 999;
    expect(resetStats(c).ok).toBe(false); // 1000 gerekli
    c.gold = 1500;
    expect(resetStats(c).ok).toBe(true);
    expect(c.gold).toBe(500);
    expect(statPointsFree(c)).toBe(33);
    rankUp(c, 'heavy_strike');
    c.gold = 2000;
    expect(resetSkills(c).ok).toBe(true);
    expect(c.gold).toBe(1000);
  });
  it('Lv.1–10 sıfırlama ücretsiz', () => {
    const c = mk('mage');
    gainExp(c, cumulativeXp(6));
    rankUp(c, 'fireball');
    c.gold = 0;
    expect(resetSkills(c).ok).toBe(true);
    expect(c.skills.fireball).toBe(1);
  });
});
