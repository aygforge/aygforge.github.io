// Sınıf tanımları — belge §4.1 / §4.2
export const CLASSES = {
  warrior: {
    id: 'warrior',
    name: 'Savaşçı',
    latin: 'Warrior',
    desc: 'Yakın dövüş ustası. Yüksek can ve savunma; isabetli normal vuruşları MP yeniler (Savaş Nefesi).',
    base: { str: 8, dex: 5, int: 2, vit: 7 },
    attackInterval: 1.1,
    attackRange: 1.6,          // tile (yakın / kılıç)
    damageType: 'phys',
    hp: (L, vit) => 90 + 13 * (L - 1) + 12 * vit,
    mp: (L, int) => 45 + 3 * (L - 1) + 3 * int,
    starterKit: ['W01', 'C01'],
    suggested: 'STR ve VIT ağırlıklı; biraz DEX kritik sağlar.',
  },
  mage: {
    id: 'mage',
    name: 'Büyücü',
    latin: 'Mage',
    desc: 'Uzak menzilli büyü ustası. Normal büyü mermileri MP harcamaz; alan büyüleriyle sürüleri eritir.',
    base: { str: 2, dex: 4, int: 9, vit: 5 },
    attackInterval: 1.4,
    attackRange: 6.5,          // tile (uzak / büyü mermisi)
    damageType: 'magic',
    hp: (L, vit) => 60 + 9 * (L - 1) + 10 * vit,
    mp: (L, int) => 70 + 6 * (L - 1) + 7 * int,
    starterKit: ['M01', 'C05'],
    suggested: 'INT ağırlıklı; VIT hayatta kalmayı artırır.',
  },
  // V4 — Okçu: fiziksel menzilli DPS. Güç = yay + 1,05 DEX + 0,35 STR + 0,35 L (Warrior'ın STR formülünden ayrı).
  // Kritik ve saldırı hızı mevcut DEX kurallarıyla (üst sınırlar %45 / %35). Normal saldırı ok tüketmez.
  archer: {
    id: 'archer',
    name: 'Okçu',
    latin: 'Archer',
    desc: 'Uzak menzilli fiziksel saldırgan. Yayıyla tek hedefi hızla eritir; kritik vuruşlar ve çeviklikle öne çıkar.',
    base: { str: 4, dex: 9, int: 3, vit: 5 },
    attackInterval: 1.25,
    attackRange: 7,            // tile (yay)
    damageType: 'phys',
    ranged: true,              // normal saldırı ok mermisi (duvarlar engeller)
    hp: (L, vit) => 80 + 10 * (L - 1) + 10 * vit,
    mp: (L, int) => 55 + 4 * (L - 1) + 4 * int,
    physPower: (a, L) => 1.05 * a.dex + 0.35 * a.str + 0.35 * L,
    starterKit: ['Y01', 'YC01', 'YH01'],
    suggested: 'DEX ağırlıklı (güç, kritik, saldırı hızı); biraz STR ve VIT.',
  },
  // V4 — Ölü Çağıran: büyü, lanet, can emme ve sınırlı iskelet yardımcı. Güç = silah + 1,35 INT + 0,30 L.
  necromancer: {
    id: 'necromancer',
    name: 'Ölü Çağıran',
    latin: 'Necromancer',
    desc: 'Ruh büyüleri, lanetler ve can emmeyle savaşır; yanında çağırdığı bir iskelet savaşçı dövüşür.',
    base: { str: 2, dex: 4, int: 9, vit: 5 },
    attackInterval: 1.6,
    attackRange: 6,            // tile (Ruh Mermisi)
    damageType: 'magic',
    hp: (L, vit) => 65 + 9 * (L - 1) + 10 * vit,
    mp: (L, int) => 90 + 7 * (L - 1) + 8 * int,
    magicPower: (a, L) => 1.35 * a.int + 0.30 * L,
    starterKit: ['K01', 'KC01', 'KH01'],
    suggested: 'INT ağırlıklı; VIT hem seni hem iskeletini korur.',
  },
};

export const CLASS_IDS = Object.keys(CLASSES);
