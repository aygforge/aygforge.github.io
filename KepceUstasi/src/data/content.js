// Kepçe Ustası — Alpha 0.1 içerik verisi.
// Tüm sayılar GDD v1.0 tablolarından alınmıştır (ALPHA VARSAYIMI). Değişiklikler CHANGELOG.md'de raporlanır.

export const OILS = {
  normal: { id: 'normal', name: 'Normal yağ topçuğu', load: 1, damage: 1, radius: 12 },
  big: { id: 'big', name: 'Büyük yağ küresi', load: 2, damage: 3, radius: 16.5 },
};

// Battle field is normalised: x,y ∈ [0,1].
export const FIELD = {
  chefX: 0.13,
  contactX: 0.2,
  spawnXMin: 0.86,
  spawnXMax: 0.93,
  spawnYMin: 0.2,
  spawnYMax: 0.8,
  step: 0.1,
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

export const SKILL_WAVES = [1, 3, 5, 6];
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

// 16 Alpha abilities. eligibleTags: chapter must contain ALL of these enemy tags. requires: extra predicate id.
export const ABILITIES = [
  { id: 'wide_ladle', name: 'Geniş Kepçe', cat: 'catch', max: 3, desc: (s) => `Kepçe ağzı +%12 genişler (toplam +%${12 * s}).` },
  { id: 'deep_ladle', name: 'Derin Kepçe', cat: 'catch', max: 3, desc: () => 'Kepçe yük kapasitesi +1.' },
  { id: 'slow_swing', name: 'Yavaş Salınım', cat: 'catch', max: 2, desc: () => 'Salınım hızı -%12.' },
  { id: 'stable_rim', name: 'Sağlam Kenar', cat: 'catch', max: 2, desc: () => 'Kepçe kenarı %10 yükselir, çıkışta daha az top dökülür.' },
  { id: 'double_shot', name: 'Çifte Atış', cat: 'attack', max: 2, desc: (s) => `Her ${s >= 2 ? 4 : 5}. normal yağ isabetinde 1 hasarlı bonus mermi.` },
  { id: 'heavy_oil', name: 'Büyük Lokma', cat: 'attack', max: 2, desc: () => 'Büyük yağ küresi hasarı +1.' },
  { id: 'power_shot', name: 'Güçlü Yağ', cat: 'attack', max: 3, desc: (s) => (s === 1 ? 'Her 4. normal atış +1 hasar.' : s === 2 ? 'Her 3. normal atış +1 hasar.' : 'Her 3. normal atış +2 hasar.') },
  { id: 'last_drop', name: 'Son Damla', cat: 'attack', max: 1, desc: () => 'Salvodaki son normal yağ +2 hasar.' },
  { id: 'first_bite', name: 'İlk Lokma', cat: 'attack', max: 2, desc: () => 'Her turun ilk isabeti +1 hasar.' },
  { id: 'thick_apron', name: 'Kalın Önlük', cat: 'defense', max: 2, desc: () => 'Maksimum can +1 ve mevcut can +1.' },
  { id: 'first_aid', name: 'İlk Yardım', cat: 'defense', max: 1, requires: 'injured', desc: () => '2 can iyileştirir (maksimumu aşmaz).' },
  { id: 'salt_shield', name: 'Tuz Kalkanı', cat: 'defense', max: 2, desc: () => 'Sıradaki Şef temas hasarını 1 azaltır.' },
  { id: 'pan_burst', name: 'Tava Patlaması', cat: 'pan', max: 2, desc: (s) => `Bir turda her 3. öldürmede yakına ${s} alan hasarı.` },
  { id: 'tomato_splash', name: 'Sos Sıçraması', cat: 'pan', max: 2, eligibleTags: ['tomato'], desc: (s) => `Pişen domates yakındaki ${s} canlıya 1 hasar verir.` },
  { id: 'chain_cooking', name: 'Zincir Pişirme', cat: 'pan', max: 1, desc: () => 'Bir turda 3+ öldürme: sonraki salvoya 1 bonus normal yağ.' },
  { id: 'pan_echo', name: 'Tava Yankısı', cat: 'pan', max: 1, desc: () => 'Dalganın ilk öldürmesi yakındaki bir canlıya 1 hasar verir.' },
];
export const ABILITY_BY_ID = Object.fromEntries(ABILITIES.map((a) => [a.id, a]));
export const ABILITY_CATS = { catch: 'Yakalama', attack: 'Saldırı', defense: 'Savunma', pan: 'Tava' };

export const SECONDARY_EVENT_CAP = 12;
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
