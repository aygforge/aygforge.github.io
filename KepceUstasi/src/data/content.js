// Kepçe Ustası — Alpha 0.2 içerik verisi.
// Temel tablolar GDD v1.0'dan; Alpha 0.2 yetenek/denge revizyonu "Alpha 0.2 Yetenek ve Denge GDD"den.
// Denge değişiklikleri BALANCE_REPORT_ALPHA02.md ve CHANGELOG_ALPHA02.md'de raporlanır.

export const OILS = {
  normal: { id: 'normal', name: 'Normal yağ topçuğu', load: 1, damage: 1, radius: 12 },
  big: { id: 'big', name: 'Büyük yağ küresi', load: 2, damage: 3, radius: 16.5 },
  // Alpha 0.2: Soğuk Sos yeteneğiyle tencereye giren gerçek fiziksel topçuk (1 yük, 1 hasar, dondurur)
  cold: { id: 'cold', name: 'Soğuk sos küresi', load: 1, damage: 1, radius: 12, special: true },
};
export const COLD_OIL_RATE = 0.07; // share of NEW pot balls once Soğuk Sos is owned

// Battle field is normalised: x,y ∈ [0,1].
export const FIELD = {
  chefX: 0.13,
  contactX: 0.2,
  spawnXMin: 0.86,
  spawnXMax: 0.93,
  spawnYMin: 0.2,
  spawnYMax: 0.8,
  step: 0.1,
  knockbackMaxX: 0.93, // Güçlü Püskürtme cannot push an enemy further right than this
  activeEnemyCap: 8,
};

// move pattern: function of the enemy's own move-opportunity index (1-based) -> steps to the LEFT.
export const ENEMIES = {
  tomato: { id: 'tomato', name: 'Domates', hp: 4, shield: 0, move: 'one', recipe: 'tomato', speed: 1, contactDamage: 1 },
  pepper: { id: 'pepper', name: 'Yeşil Biber', hp: 3, shield: 0, move: 'pepper', recipe: 'pepper', speed: 2, contactDamage: 1 },
  egg: { id: 'egg', name: 'Yumurta', hp: 2, shield: 0, move: 'one', recipe: 'egg', speed: 1, contactDamage: 1 },
  potato: { id: 'potato', name: 'Patates', hp: 3, shield: 0, move: 'one', recipe: 'potato', speed: 1, contactDamage: 1 },
  armored_potato: { id: 'armored_potato', name: 'Zırhlı Patates', hp: 7, shield: 2, move: 'odd', recipe: 'potato', speed: 0.5, contactDamage: 1 },
  salt: { id: 'salt', name: 'Tuz', hp: 2, shield: 0, move: 'one', recipe: 'salt', speed: 1, contactDamage: 1 },
  tomato_minion: { id: 'tomato_minion', name: 'Küçük Domates', hp: 2, shield: 0, move: 'one', recipe: 'tomato', speed: 1, contactDamage: 1, sprite: 'tomato', scale: 0.8 },
  giant_tomato: {
    id: 'giant_tomato', name: 'Dev Domates', hp: 24, shield: 0, move: 'one', recipe: null, speed: 1, boss: true,
    contactDamage: 1, retreatX: 0.55,
    summonAt: 0.6, summonCount: 2, guardEvery: 3,
  },
  potato_king: {
    id: 'potato_king', name: 'Patates Kral', hp: 36, shield: 4, move: 'odd', recipe: null, speed: 0.5, boss: true,
    contactDamage: 2, retreatX: 0.6,
    hasteAt: 0.5,
  },
};

export const CHAPTERS = [
  {
    id: 'menemen', index: 1, name: 'Menemen', customer: 'İlk müşteri', tags: ['tomato', 'pepper', 'egg'],
    recipe: { tomato: 3, pepper: 2, egg: 1 },
    boss: 'giant_tomato', baseTip: 60, firstClearBonus: 30,
    bigOilRate: 0.05,
    // Alpha 0.2 balance (simulation-tuned, see BALANCE_REPORT_ALPHA02.md). Base HP stays in ENEMIES;
    // spawned HP = round(base * hpScale). Boss HP is set explicitly. spawnX = where a wave appears.
    balance: { hpScale: 1.7, bossHp: 42, spawnXMin: 0.58, spawnXMax: 0.64, bossX: 0.7 },
    waves: [
      { tomato: 2 },
      { tomato: 1, pepper: 1 },
      { tomato: 2, pepper: 1 },
      { tomato: 1, pepper: 2 },
      { tomato: 1, pepper: 2, egg: 1 },
      { tomato: 1, pepper: 1, egg: 2 },
    ],
  },
  {
    id: 'fries', index: 2, name: 'Patates Kızartması', customer: 'Acıkmış öğrenci', tags: ['potato', 'armored_potato', 'salt'],
    recipe: { potato: 6, salt: 2 },
    boss: 'potato_king', baseTip: 80, firstClearBonus: 35,
    bigOilRate: 0.12,
    balance: { hpScale: 2.8, bossHp: 62, spawnXMin: 0.56, spawnXMax: 0.62, bossX: 0.7 },
    waves: [
      { potato: 2 },
      { potato: 2, salt: 1 },
      { potato: 1, armored_potato: 1, salt: 1 },
      { potato: 2, armored_potato: 1, salt: 1 },
      { potato: 2, armored_potato: 1, salt: 1 },
      { potato: 2, armored_potato: 1, salt: 2 },
    ],
  },
];

export const RECIPE_LABELS = { tomato: 'Domates', pepper: 'Biber', egg: 'Yumurta', potato: 'Patates', salt: 'Tuz' };

export const SKILL_WAVES = [1, 2, 3, 4, 5, 6]; // Alpha 0.2: every normal wave, none after the boss
export const NORMAL_WAVES = 6;

export const POT = {
  startCount: 30,
  minTarget: 24,
  maxCount: 36,
  minAdd: 6,
};

export const LADLE = {
  capacity: 7,
  radius: 44, // physical mouth radius at 100 % width (px)
  swingPeriod: 2.0, // seconds for a full left-right-left swing
  swingWidthRatio: 0.8, // of the reachable pot width
  openAngleDeg: 72,
  rimBase: 0.3, // rim lip height as fraction of radius (sin of the lip angle)
  rimPerStack: 0.1, // stable_rim +10 %
  dropSteps: 30, // fixed steps @60 Hz -> 0.50 s
  closeSteps: 22, // 0.37 s
  liftSteps: 36, // 0.60 s
  holdSteps: 8, // 0.13 s
  // total drop+close+lift+hold = 96 steps = 1.6 s (GDD 1.2–1.6 s)
  returnSteps: 24,
};

export const CHEF = { baseHp: 5 };

// 24 run abilities (Alpha 0.1's 16 ids kept + 8 new). desc(level) = what that level gives (shown on the card).
// eligibleTags: chapter must contain ALL of these enemy tags. requires: extra predicate id.
// tier values used by the combat code live in ABILITY_VALUES so the card text and the mechanics share one source.
export const ABILITY_VALUES = {
  wide_ladle: [0.12, 0.24, 0.36],
  deep_ladle: [1, 2, 3],
  slow_swing: [0.12, 0.2256],
  stable_rim: [0.1, 0.2],
  double_shot: [2, 1], // a bonus oil after every Nth real normal shot
  heavy_oil: [1, 2],
  power_shot: [{ every: 4, bonus: 1 }, { every: 3, bonus: 1 }, { every: 3, bonus: 2 }],
  last_drop: [2],
  first_bite: [1, 2],
  thick_apron: [1, 2],
  first_aid: [2],
  salt_shield: [1, 2],
  pan_burst: [1, 2],
  tomato_splash: [1, 2],
  chain_cooking: [1],
  pan_echo: [1],
  critical_fry: [0.15, 0.25], // crit chance, crit = 2x damage
  explosive_oil: [4, 3], // every Nth real hit: 1 damage to up to 2 nearby enemies
  oil_knockback: [5, 4], // every Nth real hit: push a normal enemy 1 step right / +1 damage on a boss
  tasty_heal: [10, 8], // +1 HP per N real HP damage, max 1 heal per volley
  spiked_apron: [2, 3], // reflect damage on contact
  cold_oil: [0.07],
  pot_shuffle: [1],
  piercing_oil: [4, 3], // every Nth real shot also hits 1 enemy behind the target for 1
};
const V = ABILITY_VALUES;
const pct = (x) => `%${Math.round(x * 100)}`;
export const ABILITIES = [
  { id: 'wide_ladle', name: 'Geniş Kepçe', cat: 'catch', max: 3, desc: (l) => `Kepçe ağzı fiziksel olarak ${pct(V.wide_ladle[l - 1])} geniş.` },
  { id: 'deep_ladle', name: 'Derin Kepçe', cat: 'catch', max: 3, desc: (l) => `Taşıma kapasitesi +${V.deep_ladle[l - 1]} yük.` },
  { id: 'slow_swing', name: 'Ağırbaşlı Kepçe', cat: 'catch', max: 2, desc: (l) => `Salınım ${pct(V.slow_swing[l - 1])} yavaş.` },
  { id: 'stable_rim', name: 'Sağlam Kenar', cat: 'catch', max: 2, desc: (l) => `Kepçe kenarı ${pct(V.stable_rim[l - 1])} yüksek: çıkışta daha az dökülür.` },
  { id: 'pot_shuffle', name: 'Tencereyi Karıştır', cat: 'catch', max: 1, desc: () => 'Salınım sırasında KARIŞTIR düğmesi: dalga başına 1 kez topçukları fiziksel olarak savurur.' },
  { id: 'double_shot', name: 'Çifte Yağ Atışı', cat: 'attack', max: 2, desc: (l) => (V.double_shot[l - 1] === 1 ? 'Her gerçek normal atıştan sonra +1 bonus yağ.' : `Her ${V.double_shot[l - 1]}. gerçek normal atıştan sonra +1 bonus yağ.`) },
  { id: 'heavy_oil', name: 'Büyük Lokma', cat: 'attack', max: 2, desc: (l) => `Büyük yağ hasarı +${V.heavy_oil[l - 1]} (toplam ${3 + V.heavy_oil[l - 1]}).` },
  { id: 'power_shot', name: 'Kızgın Yağ Ustalığı', cat: 'attack', max: 3, desc: (l) => `Her ${V.power_shot[l - 1].every}. normal atış +${V.power_shot[l - 1].bonus} hasar.` },
  { id: 'last_drop', name: 'Son Damla', cat: 'attack', max: 1, desc: () => 'Salvodaki son gerçek normal yağ +2 hasar.' },
  { id: 'first_bite', name: 'İlk Lokma', cat: 'attack', max: 2, desc: (l) => `Salvodaki ilk gerçek isabet +${V.first_bite[l - 1]} hasar.` },
  { id: 'critical_fry', name: 'Kritik Kızartma', cat: 'attack', max: 2, desc: (l) => `Gerçek atışlar ${pct(V.critical_fry[l - 1])} şansla KRİTİK: 2x hasar.` },
  { id: 'piercing_oil', name: 'Delici Yağ', cat: 'attack', max: 2, desc: (l) => `Her ${V.piercing_oil[l - 1]}. gerçek atış, hedefin arkasındaki düşmana da 1 hasar verir.` },
  { id: 'thick_apron', name: 'Kalın Önlük', cat: 'defense', max: 2, desc: () => 'Maksimum can +1 ve mevcut can +1.' },
  { id: 'first_aid', name: 'İlk Yardım', cat: 'defense', max: 1, requires: 'injured', desc: () => '2 can iyileştirir (maksimumu aşmaz).' },
  { id: 'salt_shield', name: 'Tuz Kalkanı', cat: 'defense', max: 2, desc: () => 'Sıradaki temas hasarını 1 azaltan +1 kalkan yükü.' },
  { id: 'spiked_apron', name: 'Dikenli Önlük', cat: 'defense', max: 2, desc: (l) => `Sana çarpan düşmana (boss dahil) ${V.spiked_apron[l - 1]} karşılık hasarı.` },
  { id: 'tasty_heal', name: 'Lezzetli Lokma', cat: 'defense', max: 2, desc: (l) => `Her ${V.tasty_heal[l - 1]} gerçek can hasarında +1 can (salvo başına en fazla 1).` },
  { id: 'pan_burst', name: 'Tava Patlaması', cat: 'pan', max: 2, desc: (l) => `Bir turda her 3. öldürmede yakına ${V.pan_burst[l - 1]} alan hasarı.` },
  { id: 'tomato_splash', name: 'Sos Sıçraması', cat: 'pan', max: 2, eligibleTags: ['tomato'], desc: (l) => `Pişen domates yakındaki ${V.tomato_splash[l - 1]} canlıya 1 hasar verir.` },
  { id: 'chain_cooking', name: 'Zincir Pişirme', cat: 'pan', max: 1, desc: () => 'Bir turda 3+ öldürme: sonraki salvoya 1 bonus normal yağ.' },
  { id: 'pan_echo', name: 'Tava Yankısı', cat: 'pan', max: 1, desc: () => 'Dalganın ilk öldürmesi yakındaki bir canlıya 1 hasar verir.' },
  { id: 'explosive_oil', name: 'Patlayan Yağ', cat: 'pan', max: 2, desc: (l) => `Her ${V.explosive_oil[l - 1]}. gerçek isabet patlar: yakındaki en fazla 2 düşmana 1 hasar.` },
  { id: 'oil_knockback', name: 'Güçlü Püskürtme', cat: 'control', max: 2, desc: (l) => `Her ${V.oil_knockback[l - 1]}. gerçek isabet düşmanı 1 adım geri iter. Boss itilmez: +1 hasar alır.` },
  { id: 'cold_oil', name: 'Soğuk Sos', cat: 'control', max: 1, desc: () => `Tencereye ${pct(V.cold_oil[0])} oranla soğuk sos küresi gelir: vurduğu düşman sonraki hareketini atlar (boss en fazla 3 eylemde 1).` },
];
export const ABILITY_BY_ID = Object.fromEntries(ABILITIES.map((a) => [a.id, a]));
export const ABILITY_CATS = { catch: 'Yakalama', attack: 'Saldırı', defense: 'Savunma', pan: 'Tava/Alan', control: 'Kontrol' };
// cards that directly add combat damage (used to guarantee a combat card in the first two offers)
export const COMBAT_CARD_CATS = ['attack', 'pan'];

export const SECONDARY_EVENT_CAP = 40; // Alpha 0.2: raised from 12; overflow is counted and reported (capReached)
export const AREA_RADIUS = 0.22; // normalised distance for "yakın"

// Permanent upgrades (GDD §12). values[level-1]
export const UPGRADES = [
  {
    id: 'capacity', name: 'Kepçe Kapasitesi', costs: [55, 90, 150, 230, 340],
    values: [7, 8, 9, 10, 11, 12], fmt: (v) => `${v} birim`,
  },
  {
    id: 'width', name: 'Kepçe Genişliği', costs: [60, 100, 165, 250, 370],
    values: [1.0, 1.05, 1.1, 1.15, 1.2, 1.25], fmt: (v) => `%${Math.round(v * 100)} ağız`,
  },
  {
    id: 'toughness', name: 'Şef Dayanıklılığı', costs: [45, 80, 130, 200, 300],
    values: [{ hp: 5, shield: 0 }, { hp: 6, shield: 0 }, { hp: 6, shield: 1 }, { hp: 7, shield: 1 }, { hp: 7, shield: 2 }, { hp: 8, shield: 2 }],
    fmt: (v) => `${v.hp} can${v.shield ? ` + ${v.shield} kalkan` : ''}`,
  },
  {
    id: 'mastery', name: 'Atış Ustalığı', costs: [60, 105, 175, 270, 400],
    values: [null, { every: 5, bonus: 1 }, { every: 4, bonus: 1 }, { every: 3, bonus: 1 }, { every: 3, bonus: 2 }, { every: 2, bonus: 2 }],
    fmt: (v) => (v ? `her ${v.every}. normal atış +${v.bonus}` : 'bonus yok'),
  },
  {
    id: 'pan', name: 'Tava Ustalığı', costs: [70, 115, 190, 300, 450],
    values: [null, 8, 7, 6, 5, 4],
    fmt: (v) => (v ? `her ${v} öldürmede +1 yağ` : 'bonus yok'),
  },
  {
    id: 'spice', name: 'Baharat Bilgisi', costs: [90, 145, 230, 345, 500],
    values: [0, 0.01, 0.02, 0.03, 0.04, 0.05],
    fmt: (v) => (v ? `büyük yağ +${Math.round(v * 100)} puan` : 'chapter taban oranı'),
  },
];
export const UPGRADE_BY_ID = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));
export const MAX_UPGRADE_LEVEL = 6;
export const BIG_OIL_RATE_CAP = 0.18;

export const ECONOMY = {
  star2Bonus: 0.15,
  star3Bonus: 0.3,
  failFactor: 0.7,
};
