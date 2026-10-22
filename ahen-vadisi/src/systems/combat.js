// Savaş matematiği — belge §4.2. Hasar tek bir yerde, tek sırayla hesaplanır:
// ham güç → beceri katsayısı → savunma → tür bonusu/direnç/azaltma → (normal vuruş) ±%5 → kritik ×1,5 → min 1 → yuvarlama
import { CRIT_MULT, NORMAL_VARIANCE, PLAYER_DR_CAP, EVADE_CAP } from '../data/constants.js';

export function defenseFactor(defense) {
  return 100 / (100 + Math.max(0, defense));
}

export function computeHit({ power, coef = 1, defense = 0, mult = 1, reduce = 0, isNormal = false, critChance = 0, rng, canCrit = true }) {
  let d = power * coef * defenseFactor(defense);
  d *= mult * (1 - Math.min(0.9, reduce));
  if (isNormal) d *= 1 + (rng.float() * 2 - 1) * NORMAL_VARIANCE;
  let crit = false;
  if (canCrit && critChance > 0 && rng.float() < critChance) {
    crit = true;
    d *= CRIT_MULT;
  }
  return { dmg: Math.max(1, Math.round(d)), crit };
}

// Normal saldırı isabeti: aynı seviyede %97, seviye farkı ile değişir
export function hitChance(attLv, defLv) {
  return Math.max(0.8, Math.min(0.99, 0.97 + 0.02 * (attLv - defLv)));
}

// Oyuncu → düşman
// opts: { coef, isNormal, skillHit (aktif skill: ıskalama yok), targetSlowed, rng }
export function playerHit(stats, enemy, opts) {
  const { rng } = opts;
  if (opts.isNormal && rng.float() > hitChance(stats.level, enemy.level)) return { dmg: 0, miss: true, crit: false };
  const magic = (opts.dmgType || stats.damageType) === 'magic';
  // V4 Delici Ok: hedef savunmasının bir kısmını yok sayar
  const defense = (magic ? enemy.mdef : enemy.def) * (1 - Math.min(0.5, opts.defIgnore || 0));
  let mult = stats.dmgMult;
  // V4 Avcı İşareti: işaretli hedefe okçunun bütün hasarı artar
  if (opts.markBonus) mult += opts.markBonus;
  if (enemy.species && stats.species[enemy.species]) mult += stats.species[enemy.species];
  if (opts.targetSlowed && stats.slowedDmg) mult += stats.slowedDmg;
  if (opts.extraMult) mult *= opts.extraMult;
  const r = computeHit({
    power: opts.power ?? stats.power, coef: opts.coef ?? 1, defense, mult, reduce: enemy.reduce || 0,
    isNormal: !!opts.isNormal, critChance: stats.critChance, rng,
  });
  return { ...r, miss: false };
}

// Düşman → oyuncu. buffs: { reduce (Demir Deri), manaShield (oran), willReduce, willDef, furyReduce (V3), passiveReduce (V3),
//   curse (V3: alınan hasar artışı), evade (V4) }. Toplam azaltma PLAYER_DR_CAP (%60) ile sınırlı; çarpımsal birleşir.
//   V4: evade (Okçu; yalnız telegrafsız normal saldırılara), weaken (Lanet Mührü: düşmanın verdiği hasar azalır).
export function enemyHit(enemy, pStats, opts) {
  const { rng } = opts;
  if (opts.isNormal && rng.float() > hitChance(enemy.level, pStats.level)) return { dmg: 0, miss: true, mpDmg: 0 };
  const evade = Math.min(EVADE_CAP, (pStats.evade || 0) + (opts.buffs?.evade || 0));
  if (opts.isNormal && evade > 0 && rng.float() < evade) return { dmg: 0, miss: true, evaded: true, mpDmg: 0 };
  const magic = (opts.dmgType || enemy.dmgType) === 'magic';
  let defense = magic ? pStats.mdef : pStats.def;
  const buffs = opts.buffs || {};
  if (buffs.willDef) defense *= 1 + buffs.willDef;
  const reduce = Math.min(PLAYER_DR_CAP, 1 - (1 - (buffs.reduce || 0)) * (1 - (buffs.willReduce || 0)) * (1 - (buffs.furyReduce || 0)) * (1 - (buffs.passiveReduce || 0)) * (1 - (buffs.boneReduce || 0)));
  const r = computeHit({
    power: enemy.atk, coef: opts.coef ?? 1, defense, mult: (opts.mult ?? 1) * (1 + (buffs.curse || 0)) * (1 - Math.min(0.5, opts.weaken || 0)), reduce,
    isNormal: !!opts.isNormal, critChance: 0, rng, canCrit: false,
  });
  let dmg = r.dmg, mpDmg = 0;
  if (buffs.manaShield && opts.currentMp > 0) {
    mpDmg = Math.min(opts.currentMp, Math.round(dmg * buffs.manaShield));
    dmg -= mpDmg;
  }
  return { dmg: Math.max(0, dmg), mpDmg, miss: false };
}

// Zehir: saniyelik hasar (ATK yüzdesi), direnç ile azalır
export function poisonTick(enemyAtk, pct, poisonRes) {
  return Math.max(1, Math.round(enemyAtk * pct * (1 - poisonRes)));
}

// Basit DPS tahmini (geliştirici paneli ve denge testleri için)
export function estimateNormalDps(stats, enemy) {
  const magic = stats.damageType === 'magic';
  const per = stats.power * defenseFactor(magic ? enemy.mdef : enemy.def) * stats.dmgMult;
  const critAvg = 1 + stats.critChance * 0.5;
  return (per * critAvg * hitChance(stats.level, enemy.level)) / stats.attackInterval;
}
