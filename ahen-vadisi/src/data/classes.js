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
};

export const CLASS_IDS = Object.keys(CLASSES);
