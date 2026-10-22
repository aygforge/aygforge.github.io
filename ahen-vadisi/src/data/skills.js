// Beceri tablosu — belge §4.3. Rank dizileri [R1..R5] (aktif) / [R1..R3] (pasif).
// Aktifler Lv.1/5/10/15 (V2: +Lv.25), pasifler Lv.4/9/14'te ücretsiz Rank 1 açılır.
// V2: ekranda 4 beceri düğmesi vardır; 5 aktif beceriden hangi 4'ünün kullanılacağı Beceriler ekranında seçilir.
// V3: Lv.35'te 6. aktif beceri; düğme sayısı yine 4 (kuşanma düzeni kayıtta). Lv.40 Ustalık II pasifleri (sınıf görevi).
// V4: Lv.45'te 7. aktif; Okçu ve Ölü Çağıran (7 aktif, 3 pasif, Ustalık I/II/III); dört sınıfa Lv.50 Ustalık III.
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

  // ---------------- V4 Lv.45 (Warrior / Mage) ----------------
  thunder_rift: {
    id: 'thunder_rift', cls: 'warrior', kind: 'active', slot: 6, unlock: 45,
    name: 'Yıldırım Yarığı', target: 'front_aoe', dmg: 'phys', reach: 2.2, radius: 2.6, maxTargets: 6, castTime: 0.35, warn: 0.35,
    coef: [2.20, 2.32, 2.46, 2.60, 2.75], cd: [24, 24, 23, 23, 22], mp: [55, 57, 59, 61, 63],
    desc: (r, s) => `Kısa bir uyarıdan sonra önündeki alanı yarar: en çok 6 hedefe ×${s.coef[r - 1].toFixed(2)} fiziksel hasar.`,
  },
  astral_burst: {
    id: 'astral_burst', cls: 'mage', kind: 'active', slot: 6, unlock: 45,
    name: 'Astral Patlama', target: 'ground', dmg: 'magic', range: 8, radius: 2.8, maxTargets: 6, castTime: 0.35,
    coef: [2.00, 2.12, 2.24, 2.37, 2.51], cd: [24, 24, 23, 23, 22], mp: [90, 92, 95, 98, 100],
    desc: (r, s) => `Hedef çevresindeki en çok 6 düşmana ×${s.coef[r - 1].toFixed(2)} büyü hasarı.`,
  },

  // ---------------- V4 ARCHER (Okçu) ----------------
  aimed_shot: {
    id: 'aimed_shot', cls: 'archer', kind: 'active', slot: 0, unlock: 1,
    name: 'İsabetli Ok', target: 'single', dmg: 'phys', range: 7.5, castTime: 0.3,
    coef: [1.70, 1.80, 1.90, 2.02, 2.14], cd: [6, 6, 5.5, 5.5, 5], mp: [9, 9, 10, 10, 11],
    desc: (r, s) => `Tek hedefe ×${s.coef[r - 1].toFixed(2)} fiziksel hasar.`,
  },
  multi_shot: {
    id: 'multi_shot', cls: 'archer', kind: 'active', slot: 1, unlock: 5,
    name: 'Çoklu Atış', target: 'cone', dmg: 'phys', range: 6.5, cone: 0.62, maxTargets: 5, castTime: 0.3,
    coef: [1.05, 1.11, 1.18, 1.25, 1.32], cd: [10, 10, 9.5, 9, 8.5], mp: [14, 15, 15, 16, 17],
    desc: (r, s) => `Önündeki konide en çok 5 hedefe ×${s.coef[r - 1].toFixed(2)} fiziksel hasar.`,
  },
  agile_step: {
    id: 'agile_step', cls: 'archer', kind: 'active', slot: 2, unlock: 10,
    name: 'Çevik Adım', target: 'self', castTime: 0.15,
    speed: [0.20, 0.20, 0.21, 0.22, 0.23], evade: [0.08, 0.09, 0.10, 0.11, 0.12], dur: [7, 7.5, 8, 8.5, 9],
    cd: [22, 22, 21, 20, 19], mp: [15, 15, 16, 16, 17],
    desc: (r, s) => `${s.dur[r - 1]} sn boyunca hareket hızı +%${Math.round(s.speed[r - 1] * 100)}, kaçınma +%${Math.round(s.evade[r - 1] * 100)} (yalnız normal saldırılara).`,
  },
  piercing_arrow: {
    id: 'piercing_arrow', cls: 'archer', kind: 'active', slot: 3, unlock: 15,
    name: 'Delici Ok', target: 'single', dmg: 'phys', range: 7.5, castTime: 0.35, defIgnore: 0.20,
    coef: [1.90, 2.01, 2.12, 2.25, 2.38], cd: [13, 13, 12.5, 12, 11.5], mp: [18, 19, 19, 20, 21],
    desc: (r, s) => `Tek hedefe ×${s.coef[r - 1].toFixed(2)} fiziksel hasar; hedefin DEF'inin %20'sini yok sayar.`,
  },
  arrow_rain: {
    id: 'arrow_rain', cls: 'archer', kind: 'active', slot: 4, unlock: 25,
    name: 'Ok Yağmuru', target: 'ground', dmg: 'phys', range: 8, radius: 2.6, maxTargets: 6, castTime: 0.3, delay: 0.45,
    coef: [1.40, 1.48, 1.57, 1.66, 1.75], cd: [18, 18, 17, 17, 16], mp: [32, 33, 35, 36, 38],
    desc: (r, s) => `Hedef çevresine ok yağdırır: en çok 6 düşmana ×${s.coef[r - 1].toFixed(2)} fiziksel hasar.`,
  },
  hunter_mark: {
    id: 'hunter_mark', cls: 'archer', kind: 'active', slot: 5, unlock: 35,
    name: 'Avcı İşareti', target: 'single', range: 9, castTime: 0.2,
    bonus: [0.10, 0.10, 0.11, 0.11, 0.12], dur: [10, 10, 10.5, 10.5, 11], cd: [25, 25, 24, 24, 23], mp: [30, 30, 31, 31, 32],
    desc: (r, s) => `${s.dur[r - 1]} sn boyunca işaretli hedefe Okçu'nun bütün hasarı +%${Math.round(s.bonus[r - 1] * 100)}.`,
  },
  eagle_storm: {
    id: 'eagle_storm', cls: 'archer', kind: 'active', slot: 6, unlock: 45,
    name: 'Kartal Fırtınası', target: 'cone', dmg: 'phys', range: 7, cone: 0.7, maxTargets: 5, castTime: 0.4,
    coef: [2.15, 2.27, 2.40, 2.54, 2.68], cd: [24, 24, 23, 23, 22], mp: [55, 57, 59, 61, 63],
    desc: (r, s) => `Fırtına okları konideki en çok 5 hedefe ×${s.coef[r - 1].toFixed(2)} fiziksel hasar verir.`,
  },

  // ---------------- V4 NECROMANCER (Ölü Çağıran) ----------------
  soul_arrow: {
    id: 'soul_arrow', cls: 'necromancer', kind: 'active', slot: 0, unlock: 1,
    name: 'Ruh Oku', target: 'single', dmg: 'magic', range: 7, castTime: 0.3,
    coef: [1.65, 1.75, 1.85, 1.96, 2.08], cd: [6, 6, 5.5, 5.5, 5], mp: [14, 15, 16, 17, 18],
    desc: (r, s) => `Tek hedefe ×${s.coef[r - 1].toFixed(2)} büyü hasarı.`,
  },
  summon_skeleton: {
    id: 'summon_skeleton', cls: 'necromancer', kind: 'active', slot: 1, unlock: 5,
    name: 'İskelet Çağır', target: 'self', castTime: 0.4,
    power: [1.0, 1.05, 1.10, 1.16, 1.22], cd: [20, 20, 19, 18, 17], mp: [25, 26, 27, 28, 30],
    desc: (r, s) => `Yanında savaşan bir iskelet çağırır (zaten varsa canını yeniler). İskelet gücü ×${s.power[r - 1].toFixed(2)}. Yalnız senin seçtiğin hedefe saldırır.`,
  },
  curse_seal: {
    id: 'curse_seal', cls: 'necromancer', kind: 'active', slot: 2, unlock: 10,
    name: 'Lanet Mührü', target: 'single', range: 7.5, castTime: 0.25,
    weaken: [0.12, 0.13, 0.14, 0.15, 0.16], bossFactor: 0.5, dur: [8, 8, 8.5, 8.5, 9],
    cd: [18, 18, 17, 17, 16], mp: [22, 23, 24, 25, 26],
    desc: (r, s) => `${s.dur[r - 1]} sn boyunca hedefin verdiği hasar −%${Math.round(s.weaken[r - 1] * 100)} (bosslarda yarısı).`,
  },
  life_drain: {
    id: 'life_drain', cls: 'necromancer', kind: 'active', slot: 3, unlock: 15,
    name: 'Can Sömürüsü', target: 'single', dmg: 'magic', range: 6.5, castTime: 0.3,
    coef: [1.35, 1.43, 1.51, 1.60, 1.70], heal: [0.20, 0.21, 0.22, 0.23, 0.24], healCap: 0.05,
    cd: [12, 12, 11.5, 11, 10.5], mp: [26, 27, 28, 30, 31],
    desc: (r, s) => `×${s.coef[r - 1].toFixed(2)} büyü hasarı; verilen gerçek hasarın %${Math.round(s.heal[r - 1] * 100)}'i kadar HP (en çok maks. HP'nin %5'i).`,
  },
  bone_burst: {
    id: 'bone_burst', cls: 'necromancer', kind: 'active', slot: 4, unlock: 25,
    name: 'Kemik Patlaması', target: 'ground', dmg: 'magic', range: 7, radius: 2.5, maxTargets: 5, castTime: 0.3,
    coef: [1.40, 1.48, 1.57, 1.66, 1.75], cd: [16, 16, 15, 15, 14], mp: [40, 42, 44, 46, 48],
    desc: (r, s) => `Hedef çevresindeki en çok 5 düşmana ×${s.coef[r - 1].toFixed(2)} büyü hasarı.`,
  },
  army_of_dead: {
    id: 'army_of_dead', cls: 'necromancer', kind: 'active', slot: 5, unlock: 35,
    name: 'Ölüler Ordusu', target: 'self', castTime: 0.4,
    dur: [12, 12, 13, 13, 14], cd: [35, 35, 34, 33, 32], mp: [50, 51, 52, 53, 55],
    desc: (r, s) => `${s.dur[r - 1]} sn boyunca ikinci bir iskelet çağırır (aynı anda en çok 2 iskelet).`,
  },
  soul_apocalypse: {
    id: 'soul_apocalypse', cls: 'necromancer', kind: 'active', slot: 6, unlock: 45,
    name: 'Ruh Kıyameti', target: 'ground', dmg: 'magic', range: 8, radius: 3.0, maxTargets: 6, castTime: 0.4, delay: 0.6,
    coef: [2.10, 2.22, 2.35, 2.49, 2.63], cd: [26, 26, 25, 25, 24], mp: [80, 82, 85, 88, 90],
    desc: (r, s) => `Alan içindeki en çok 6 hedefe ×${s.coef[r - 1].toFixed(2)} büyü hasarı.`,
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

  // V4 Okçu pasifleri
  sharpshooter: {
    id: 'sharpshooter', cls: 'archer', kind: 'passive', unlock: 4, name: 'Keskin Nişancı',
    physDmg: [0.03, 0.06, 0.09],
    desc: (r, s) => `Menzilli fiziksel hasar +%${Math.round(s.physDmg[r - 1] * 100)}.`,
  },
  agile_reflex: {
    id: 'agile_reflex', cls: 'archer', kind: 'passive', unlock: 9, name: 'Çevik Refleks',
    evade: [0.02, 0.03, 0.04], moveSpd: [0.03, 0.05, 0.07],
    desc: (r, s) => `Kaçınma +%${Math.round(s.evade[r - 1] * 100)} (normal saldırılara), hareket hızı +%${Math.round(s.moveSpd[r - 1] * 100)}.`,
  },
  hunter_instinct: {
    id: 'hunter_instinct', cls: 'archer', kind: 'passive', unlock: 14, name: 'Avcı İçgüdüsü',
    crit: [0.015, 0.03, 0.045],
    desc: (r, s) => `Kritik şansı +%${(s.crit[r - 1] * 100).toFixed(1).replace('.0', '')} (toplam üst sınır %45).`,
  },
  // V4 Ölü Çağıran pasifleri
  dark_knowledge: {
    id: 'dark_knowledge', cls: 'necromancer', kind: 'passive', unlock: 4, name: 'Karanlık Bilgi',
    magicDmg: [0.03, 0.06, 0.09],
    desc: (r, s) => `Büyü hasarı +%${Math.round(s.magicDmg[r - 1] * 100)}.`,
  },
  bone_bond: {
    id: 'bone_bond', cls: 'necromancer', kind: 'passive', unlock: 9, name: 'Kemik Bağı',
    minionHp: [0.10, 0.20, 0.30], minionDef: [0.10, 0.20, 0.30],
    desc: (r, s) => `Çağrılan iskeletin HP'si ve savunması +%${Math.round(s.minionHp[r - 1] * 100)}.`,
  },
  soul_harvest: {
    id: 'soul_harvest', cls: 'necromancer', kind: 'passive', unlock: 14, name: 'Ruh Hasadı',
    mpOnHit: [2, 3, 4],
    desc: (r, s) => `Senin isabetli normal saldırıların ${s.mpOnHit[r - 1]} MP yeniler (iskeletin vuruşları sayılmaz).`,
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
  wind_rhythm: {
    id: 'wind_rhythm', cls: 'archer', kind: 'mastery', unlock: 20, name: 'Rüzgâr Ritmi',
    atkSpd: 0.12, dur: 4, icd: 12,
    desc: () => 'Kritik vuruştan sonra 4 sn saldırı hızı +%12 (toplam üst sınır %35; 12 sn bekleme).',
  },
  bone_armor: {
    id: 'bone_armor', cls: 'necromancer', kind: 'mastery', unlock: 20, name: 'Kemik Zırh',
    threshold: 0.30, reduce: 0.15, dur: 6, minionHeal: 0.20, icd: 45,
    desc: () => 'HP %30 altına düştüğünde 6 sn hasar azaltma %15 ve iskelet canının %20\'si yenilenir (45 sn bekleme).',
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
  // V4 Okçu / Ölü Çağıran Ustalık II (Lv.40 + Kayıp Kral)
  hunter_legacy: {
    id: 'hunter_legacy', cls: 'archer', kind: 'mastery2', unlock: 40, name: 'Avcının Mirası',
    physDmg: 0.05, crit: 0.02, evade: 0.02,
    desc: () => 'Fiziksel hasar +%5, kritik +%2, kaçınma +%2 (normal saldırılara).',
  },
  soul_lore: {
    id: 'soul_lore', cls: 'necromancer', kind: 'mastery2', unlock: 40, name: 'Ruh İlmi',
    magicDmg: 0.05, minionHp: 0.10, costRed: 0.05,
    desc: () => 'Büyü hasarı +%5, iskelet HP +%10, beceri MP maliyeti −%5.',
  },
  // ---------------- USTALIK III (V4: Lv.50 + Göğün Mahkûmu; dört sınıf) ----------------
  // Küçük, tekil, kalıcı pasif: sınıfı değiştirmez; toplam azaltma/kritik/hız üst sınırları geçerli kalır.
  sky_might: {
    id: 'sky_might', cls: 'warrior', kind: 'mastery3', unlock: 50, name: 'Göğün Kudreti',
    physDmg: 0.04, defPct: 0.05,
    desc: () => 'Fiziksel hasar +%4, DEF +%5.',
  },
  astral_mind: {
    id: 'astral_mind', cls: 'mage', kind: 'mastery3', unlock: 50, name: 'Astral Zihin',
    magicDmg: 0.04, mpPct: 0.05,
    desc: () => 'Büyü hasarı +%4, maks. MP +%5.',
  },
  storm_eye: {
    id: 'storm_eye', cls: 'archer', kind: 'mastery3', unlock: 50, name: 'Fırtına Gözü',
    physDmg: 0.04, crit: 0.02,
    desc: () => 'Fiziksel hasar +%4, kritik +%2.',
  },
  soul_dominion: {
    id: 'soul_dominion', cls: 'necromancer', kind: 'mastery3', unlock: 50, name: 'Ruh Hâkimiyeti',
    magicDmg: 0.04, minionDmg: 0.08,
    desc: () => 'Büyü hasarı +%4, iskelet hasarı +%8.',
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
  // V4
  aimed_shot: { name: 'Ölümcül Nişan', desc: 'İsabetli Ok kritik vurduğunda ×1,5 yerine ×1,8 hasar verir.', critMult: 1.8 },
  multi_shot: { name: 'Yelpaze Atış', desc: 'Çoklu Atış hasarı +%8.', dmgMult: 1.08 },
  agile_step: { name: 'Rüzgâr Adımı', desc: 'Çevik Adım süresi +2 sn.', durAdd: 2 },
  piercing_arrow: { name: 'Zırh Delen', desc: 'Delici Ok DEF\'in %25\'ini yok sayar.', ignoreAdd: 0.05 },
  arrow_rain: { name: 'Ok Seli', desc: 'Ok Yağmuru en çok 7 hedefe vurur.', targetsAdd: 1 },
  soul_arrow: { name: 'Ruh Mızrağı', desc: 'Ruh Oku kritik vurduğunda ×1,5 yerine ×1,8 hasar verir.', critMult: 1.8 },
  summon_skeleton: { name: 'Kemik Lejyoneri', desc: 'İskeletin saldırı gücü +%8.', minionAtk: 1.08 },
  curse_seal: { name: 'Derin Lanet', desc: 'Lanet Mührü süresi +2 sn.', durAdd: 2 },
  life_drain: { name: 'Kan Bağı', desc: 'Can Sömürüsü %3 daha fazla iyileştirir (üst sınır değişmez).', healAdd: 0.03 },
  bone_burst: { name: 'Kemik Fırtınası', desc: 'Kemik Patlaması en çok 6 hedefe vurur.', targetsAdd: 1 },
};
export const MASTERY_BOOK_LEVEL = 30;

// V4: her sınıfta 7 aktif (Lv.1/5/10/15/25/35/45); ekranda 4 düğme (kuşanma düzeni kayıtta).
export const CLASS_SKILLS = {
  warrior: {
    actives: ['heavy_strike', 'whirlwind', 'iron_skin', 'war_charge', 'blade_rain', 'iron_fury', 'thunder_rift'],
    passives: ['weapon_discipline', 'hard_skin', 'battle_rhythm'],
    mastery: 'unyielding_will',
    mastery2: 'war_legacy',
    mastery3: 'sky_might',
  },
  mage: {
    actives: ['fireball', 'ice_blast', 'mana_shield', 'meteor', 'chain_lightning', 'time_freeze', 'astral_burst'],
    passives: ['elemental_mastery', 'mana_control', 'frozen_target'],
    mastery: 'arcane_resonance',
    mastery2: 'arcane_lore',
    mastery3: 'astral_mind',
  },
  archer: {
    actives: ['aimed_shot', 'multi_shot', 'agile_step', 'piercing_arrow', 'arrow_rain', 'hunter_mark', 'eagle_storm'],
    passives: ['sharpshooter', 'agile_reflex', 'hunter_instinct'],
    mastery: 'wind_rhythm',
    mastery2: 'hunter_legacy',
    mastery3: 'storm_eye',
  },
  necromancer: {
    actives: ['soul_arrow', 'summon_skeleton', 'curse_seal', 'life_drain', 'bone_burst', 'army_of_dead', 'soul_apocalypse'],
    passives: ['dark_knowledge', 'bone_bond', 'soul_harvest'],
    mastery: 'bone_armor',
    mastery2: 'soul_lore',
    mastery3: 'soul_dominion',
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
