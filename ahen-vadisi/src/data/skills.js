// Beceri tablosu — belge §4.3. Rank dizileri [R1..R5] (aktif) / [R1..R3] (pasif).
// Aktifler Lv.1/5/10/15, pasifler Lv.4/9/14'te ücretsiz Rank 1 açılır.

export const ACTIVE_RANK_COST = [0, 1, 1, 2, 2];   // Rank2..5 maliyeti 1/1/2/2 → 6
export const PASSIVE_RANK_COST = [0, 1, 2];        // Rank2..3 maliyeti 1/2 → 3

export const SKILLS = {
  // ---------------- WARRIOR ----------------
  heavy_strike: {
    id: 'heavy_strike', cls: 'warrior', kind: 'active', slot: 0, unlock: 1,
    name: 'Ağır Darbe', target: 'single', dmg: 'phys', range: 1.9, castTime: 0.28,
    coef: [1.70, 1.80, 1.90, 2.02, 2.14], cd: [6, 6, 5.5, 5.5, 5], mp: [8, 8, 9, 9, 10],
    desc: (r, s) => `Tek hedefe ×${s.coef[r - 1].toFixed(2)} fiziksel hasar.`,
  },
  whirlwind: {
    id: 'whirlwind', cls: 'warrior', kind: 'active', slot: 1, unlock: 5,
    name: 'Kasırga Kesimi', target: 'self_aoe', dmg: 'phys', radius: 2.4, maxTargets: 5, castTime: 0.3,
    coef: [1.05, 1.11, 1.18, 1.25, 1.32], cd: [10, 10, 9.5, 9, 8.5], mp: [12, 13, 13, 14, 15],
    desc: (r, s) => `Çevrendeki en çok 5 hedefe ×${s.coef[r - 1].toFixed(2)} fiziksel hasar.`,
  },
  iron_skin: {
    id: 'iron_skin', cls: 'warrior', kind: 'active', slot: 2, unlock: 10,
    name: 'Demir Deri', target: 'self', castTime: 0.2,
    reduce: [0.25, 0.27, 0.29, 0.32, 0.35], dur: [8, 8.5, 9, 9.5, 10],
    cd: [25, 25, 24, 23, 22], mp: [14, 14, 15, 15, 16],
    desc: (r, s) => `${s.dur[r - 1]} sn boyunca alınan hasar %${Math.round(s.reduce[r - 1] * 100)} azalır.`,
  },
  war_charge: {
    id: 'war_charge', cls: 'warrior', kind: 'active', slot: 3, unlock: 15,
    name: 'Savaş Hücumu', target: 'single', dmg: 'phys', range: 6, castTime: 0.15,
    coef: [1.35, 1.43, 1.51, 1.61, 1.70], stun: [1.0, 1.1, 1.2, 1.35, 1.5],
    cd: [16, 16, 15, 15, 14], mp: [15, 16, 16, 17, 18],
    desc: (r, s) => `Hedefe atılır, ×${s.coef[r - 1].toFixed(2)} hasar ve ${s.stun[r - 1]} sn sersemletme.`,
  },
  // ---------------- MAGE ----------------
  fireball: {
    id: 'fireball', cls: 'mage', kind: 'active', slot: 0, unlock: 1,
    name: 'Ateş Küresi', target: 'single', dmg: 'magic', range: 7, castTime: 0.32,
    coef: [1.75, 1.85, 1.96, 2.08, 2.21], cd: [5, 5, 4.5, 4.5, 4], mp: [16, 17, 18, 19, 20],
    desc: (r, s) => `Tek hedefe ×${s.coef[r - 1].toFixed(2)} büyü hasarı.`,
  },
  ice_blast: {
    id: 'ice_blast', cls: 'mage', kind: 'active', slot: 1, unlock: 5,
    name: 'Buz Patlaması', target: 'ground', dmg: 'magic', range: 7, radius: 2.5, maxTargets: 5, castTime: 0.3,
    coef: [1.15, 1.22, 1.29, 1.37, 1.45], slow: [0.35, 0.37, 0.40, 0.42, 0.45], slowDur: 3,
    cd: [10, 10, 9.5, 9, 8.5], mp: [28, 29, 31, 33, 35],
    desc: (r, s) => `Hedef çevresindeki en çok 5 düşmana ×${s.coef[r - 1].toFixed(2)} büyü hasarı ve %${Math.round(s.slow[r - 1] * 100)} yavaşlatma (3 sn).`,
  },
  mana_shield: {
    id: 'mana_shield', cls: 'mage', kind: 'active', slot: 2, unlock: 10,
    name: 'Mana Kalkanı', target: 'self', castTime: 0.2,
    absorb: [0.30, 0.33, 0.36, 0.39, 0.42], dur: [8, 8.5, 9, 9.5, 10],
    cd: [24, 24, 23, 22, 21], mp: [30, 31, 33, 35, 37],
    desc: (r, s) => `${s.dur[r - 1]} sn boyunca alınan hasarın %${Math.round(s.absorb[r - 1] * 100)}'ı MP'den karşılanır.`,
  },
  meteor: {
    id: 'meteor', cls: 'mage', kind: 'active', slot: 3, unlock: 15,
    name: 'Meteor', target: 'ground', dmg: 'magic', range: 8, radius: 2.6, maxTargets: 5, castTime: 0.25, delay: 0.9,
    coef: [2.30, 2.44, 2.58, 2.74, 2.90], cd: [20, 20, 19, 18, 17], mp: [55, 57, 60, 63, 66],
    desc: (r, s) => `0,9 sn hazırlıktan sonra en çok 5 hedefe ×${s.coef[r - 1].toFixed(2)} büyü hasarı.`,
  },

  // ---------------- PASİFLER ----------------
  weapon_discipline: {
    id: 'weapon_discipline', cls: 'warrior', kind: 'passive', unlock: 4, name: 'Silah Disiplini',
    physDmg: [0.03, 0.06, 0.09],
    desc: (r, s) => `Fiziksel hasar +%${Math.round(s.physDmg[r - 1] * 100)}.`,
  },
  hard_skin: {
    id: 'hard_skin', cls: 'warrior', kind: 'passive', unlock: 9, name: 'Sert Deri',
    defPct: [0.03, 0.06, 0.09], hpPct: [0.02, 0.04, 0.06],
    desc: (r, s) => `DEF +%${Math.round(s.defPct[r - 1] * 100)}, maks. HP +%${Math.round(s.hpPct[r - 1] * 100)}.`,
  },
  battle_rhythm: {
    id: 'battle_rhythm', cls: 'warrior', kind: 'passive', unlock: 14, name: 'Savaş Ritmi',
    atkSpd: [0.03, 0.06, 0.09],
    desc: (r, s) => `Saldırı hızı +%${Math.round(s.atkSpd[r - 1] * 100)} (toplam üst sınır %35).`,
  },
  elemental_mastery: {
    id: 'elemental_mastery', cls: 'mage', kind: 'passive', unlock: 4, name: 'Element Ustalığı',
    magicDmg: [0.03, 0.06, 0.09],
    desc: (r, s) => `Büyü hasarı +%${Math.round(s.magicDmg[r - 1] * 100)}.`,
  },
  mana_control: {
    id: 'mana_control', cls: 'mage', kind: 'passive', unlock: 9, name: 'Mana Kontrolü',
    mpPct: [0.03, 0.06, 0.09], costRed: [0.03, 0.06, 0.09],
    desc: (r, s) => `Maks. MP +%${Math.round(s.mpPct[r - 1] * 100)}, beceri MP maliyeti −%${Math.round(s.costRed[r - 1] * 100)}.`,
  },
  frozen_target: {
    id: 'frozen_target', cls: 'mage', kind: 'passive', unlock: 14, name: 'Donmuş Hedef',
    slowedDmg: [0.03, 0.06, 0.09], crit: [0.01, 0.02, 0.03],
    desc: (r, s) => `Yavaşlamış hedeflere hasar +%${Math.round(s.slowedDmg[r - 1] * 100)}, kritik +%${Math.round(s.crit[r - 1] * 100)}.`,
  },

  // ---------------- USTALIK I (Lv.20 sınıf görevi) ----------------
  unyielding_will: {
    id: 'unyielding_will', cls: 'warrior', kind: 'mastery', unlock: 20, name: 'Sarsılmaz İrade',
    threshold: 0.30, defBonus: 0.30, reduce: 0.15, dur: 6, icd: 45,
    desc: () => 'HP %30 altına düştüğünde 6 sn boyunca DEF +%30 ve hasar azaltma %15 (45 sn bekleme).',
  },
  arcane_resonance: {
    id: 'arcane_resonance', cls: 'mage', kind: 'mastery', unlock: 20, name: 'Arcane Resonance',
    chain: 3, window: 6, dur: 5, costRed: 0.5, icd: 20,
    desc: () => '6 sn içinde ardışık 3 büyüden sonra 5 sn boyunca beceri MP maliyeti %50 azalır (20 sn bekleme).',
  },
};

export const CLASS_SKILLS = {
  warrior: {
    actives: ['heavy_strike', 'whirlwind', 'iron_skin', 'war_charge'],
    passives: ['weapon_discipline', 'hard_skin', 'battle_rhythm'],
    mastery: 'unyielding_will',
  },
  mage: {
    actives: ['fireball', 'ice_blast', 'mana_shield', 'meteor'],
    passives: ['elemental_mastery', 'mana_control', 'frozen_target'],
    mastery: 'arcane_resonance',
  },
};

export function maxRank(skill) {
  return skill.kind === 'active' ? 5 : skill.kind === 'passive' ? 3 : 1;
}

export function rankUpCost(skill, toRank) {
  if (skill.kind === 'active') return ACTIVE_RANK_COST[toRank - 1] ?? Infinity;
  if (skill.kind === 'passive') return PASSIVE_RANK_COST[toRank - 1] ?? Infinity;
  return Infinity;
}
