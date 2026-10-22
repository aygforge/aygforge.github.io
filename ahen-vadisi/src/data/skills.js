// Beceri tablosu — belge §4.3. Rank dizileri [R1..R5] (aktif) / [R1..R3] (pasif).
// Aktifler Lv.1/5/10/15 (V2: +Lv.25), pasifler Lv.4/9/14'te ücretsiz Rank 1 açılır.
// V2: ekranda 4 beceri düğmesi vardır; 5 aktif beceriden hangi 4'ünün kullanılacağı Beceriler ekranında seçilir.
// V3: Lv.35'te 6. aktif beceri; düğme sayısı yine 4 (kuşanma düzeni kayıtta). Lv.40 Ustalık II pasifleri (sınıf görevi).
// V2 Ustalık Kitapları (book): Lv.30 ve Rank 5 beceriye küçük, özel bir geliştirme (rank 6 değildir).

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
  // V2 — Lv.25
  blade_rain: {
    id: 'blade_rain', cls: 'warrior', kind: 'active', slot: 4, unlock: 25,
    name: 'Kılıç Yağmuru', target: 'front_aoe', dmg: 'phys', reach: 1.8, radius: 2.4, maxTargets: 5, castTime: 0.3,
    coef: [1.45, 1.53, 1.62, 1.71, 1.80], cd: [18, 18, 17, 17, 16], mp: [30, 31, 33, 34, 36],
    desc: (r, s) => `Önündeki alana kılıçlar yağdırır: en çok 5 hedefe ×${s.coef[r - 1].toFixed(2)} fiziksel hasar.`,
  },
  // V3 — Lv.35. Hasar artışı yalnız fiziksel hasara; azaltma diğer savunmalarla çarpımsal ve toplam %60 sınırına tabi.
  iron_fury: {
    id: 'iron_fury', cls: 'warrior', kind: 'active', slot: 5, unlock: 35,
    name: 'Sarsılmaz Öfke', target: 'self', castTime: 0.2,
    dmgUp: [0.15, 0.15, 0.15, 0.15, 0.15], reduce: [0.10, 0.10, 0.10, 0.10, 0.10], dur: [7, 7, 7.5, 7.5, 8],
    cd: [30, 30, 29, 29, 28], mp: [40, 40, 41, 41, 42],
    desc: (r, s) => `${s.dur[r - 1]} sn boyunca fiziksel hasar +%${Math.round(s.dmgUp[r - 1] * 100)}, alınan hasar −%${Math.round(s.reduce[r - 1] * 100)}.`,
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

  // V2 — Lv.25
  chain_lightning: {
    id: 'chain_lightning', cls: 'mage', kind: 'active', slot: 4, unlock: 25,
    name: 'Zincir Yıldırım', target: 'single', dmg: 'magic', range: 7, castTime: 0.3,
    jumps: 3, jumpRange: 4, falloff: 0.75,
    coef: [1.65, 1.74, 1.84, 1.95, 2.06], cd: [16, 16, 15, 15, 14], mp: [42, 44, 46, 48, 50],
    desc: (r, s) => `İlk hedefe ×${s.coef[r - 1].toFixed(2)} büyü hasarı; yıldırım en çok ${s.jumps} yakın hedefe sıçrar, her sıçramada hasar %25 azalır.`,
  },

  // V3 — Lv.35. Normal/elit yaratıkları güçlü yavaşlatır; bosslarda kısa ve zayıf (faz/özel saldırıyı durdurmaz).
  time_freeze: {
    id: 'time_freeze', cls: 'mage', kind: 'active', slot: 5, unlock: 35,
    name: 'Donmuş Zaman', target: 'self_aoe', dmg: 'magic', radius: 3.2, maxTargets: 5, castTime: 0.3,
    coef: [1.40, 1.47, 1.54, 1.62, 1.70], slow: 0.55, slowDur: 3, bossSlow: 0.2, bossSlowDur: 1.2,
    cd: [28, 28, 27, 27, 26], mp: [70, 71, 73, 74, 76],
    desc: (r, s) => `Çevrendeki en çok 5 düşmana ×${s.coef[r - 1].toFixed(2)} büyü hasarı; normal düşmanlar %55 yavaşlar (3 sn), bosslarda %20 (1,2 sn).`,
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
  // ---------------- USTALIK II (V3: Lv.40 + ana hikâye, Gezgin Bilge'nin sınıf görevi) ----------------
  war_legacy: {
    id: 'war_legacy', cls: 'warrior', kind: 'mastery2', unlock: 40, name: 'Savaşın Mirası',
    physDmg: 0.05, hpPct: 0.05, reduce: 0.04,
    desc: () => 'Fiziksel hasar +%5, maks. HP +%5, alınan hasar −%4 (toplam azaltma üst sınırı %60).',
  },
  arcane_lore: {
    id: 'arcane_lore', cls: 'mage', kind: 'mastery2', unlock: 40, name: 'Kadim Büyü Bilgisi',
    magicDmg: 0.05, costRed: 0.08, mpPct: 0.05,
    desc: () => 'Büyü hasarı +%5, beceri MP maliyeti −%8, maks. MP +%5.',
  },
};

// Ustalık Kitabı geliştirmeleri (her beceriye bir kez; büyük DPS artışı değil)
export const MASTERY_BOOKS = {
  heavy_strike: { name: 'Keskin Darbe', desc: 'Ağır Darbe kritik vurduğunda ×1,5 yerine ×1,8 hasar verir.', critMult: 1.8 },
  whirlwind: { name: 'Fırtına Kesimi', desc: 'Kasırga Kesimi hasarı +%8.', dmgMult: 1.08 },
  iron_skin: { name: 'Çelik Deri', desc: 'Demir Deri süresi +2 sn.', durAdd: 2 },
  war_charge: { name: 'Sarsıcı Hücum', desc: 'Savaş Hücumu sersemletmesi +0,5 sn (boss hariç).', stunAdd: 0.5 },
  blade_rain: { name: 'Kılıç Seli', desc: 'Kılıç Yağmuru en çok 6 hedefe vurur.', targetsAdd: 1 },
  fireball: { name: 'Yakıcı Küre', desc: 'Ateş Küresi hedefi 3 sn yakar: saniyede vuruş hasarının %8\'i.', burn: { pct: 0.08, dur: 3 } },
  ice_blast: { name: 'Derin Ayaz', desc: 'Buz Patlaması yavaşlatması +1,5 sn sürer.', slowAdd: 1.5 },
  mana_shield: { name: 'Mana Duvarı', desc: 'Mana Kalkanı emilimi +%5.', absorbAdd: 0.05 },
  meteor: { name: 'Geniş Çarpma', desc: 'Meteor alanı +0,4 tile.', radiusAdd: 0.4 },
  chain_lightning: { name: 'Fırtına Zinciri', desc: 'Zincir Yıldırım bir kez daha sıçrar.', jumpsAdd: 1 },
};
export const MASTERY_BOOK_LEVEL = 30;

export const CLASS_SKILLS = {
  warrior: {
    actives: ['heavy_strike', 'whirlwind', 'iron_skin', 'war_charge', 'blade_rain', 'iron_fury'],
    passives: ['weapon_discipline', 'hard_skin', 'battle_rhythm'],
    mastery: 'unyielding_will',
    mastery2: 'war_legacy',
  },
  mage: {
    actives: ['fireball', 'ice_blast', 'mana_shield', 'meteor', 'chain_lightning', 'time_freeze'],
    passives: ['elemental_mastery', 'mana_control', 'frozen_target'],
    mastery: 'arcane_resonance',
    mastery2: 'arcane_lore',
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
