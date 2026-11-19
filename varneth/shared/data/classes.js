export const CLASSES = {
  warrior: {
    id: 'warrior', name: 'Savaşçı', nameEn: 'Warrior', resource: 'rage', resourceName: 'Öfke',
    resourceMax: 100, resourceStart: 0, resourceRegen: -1.5, resourceOnHit: 12, resourceOnHurt: 3,
    hpMult: 1.4, armorMult: 1.25, range: 26, moveSpeed: 70, preferredRange: 22,
    starterWeapon: 'w_sword_1', starterOff: 'w_shield_1', starterArmor: 'w_chest_1',
    desc: 'Dayanıklı yakın dövüşçü. Normal saldırılar öfke üretir; güçlü yetenekler öfke tüketir.',
  },
  ranger: {
    id: 'ranger', name: 'Avcı', nameEn: 'Ranger', resource: 'focus', resourceName: 'Odak',
    resourceMax: 100, resourceStart: 50, resourceRegen: 2, resourceOnHit: 6, resourceOnHurt: 0,
    hpMult: 1.0, armorMult: 1.0, range: 190, moveSpeed: 85, preferredRange: 150, kiteRange: 70,
    starterWeapon: 'r_bow_1', starterOff: null, starterArmor: 'r_chest_1',
    desc: 'Uzak menzilli, hızlı farm. Kritik vuruşlar ve zehir uzmanı.',
  },
  mage: {
    id: 'mage', name: 'Büyücü', nameEn: 'Mage', resource: 'mana', resourceName: 'Mana',
    resourceMax: 120, resourceStart: 120, resourceRegen: 5, resourceOnHit: 2, resourceOnHurt: 0,
    hpMult: 0.88, armorMult: 0.8, range: 170, moveSpeed: 72, preferredRange: 140, kiteRange: 60,
    starterWeapon: 'm_staff_1', starterOff: null, starterArmor: 'm_chest_1',
    desc: 'Elementlerle alan hasarı veren büyü ustası. Mana yönetimi ve kombinasyonlar.',
  },
};
export const CLASS_IDS = Object.keys(CLASSES);

export const APPEARANCE = {
  bodies: ['Sağlam', 'İnce'],
  skins: ['#f1c7a3', '#d9a27a', '#b07a52', '#7d5236', '#5a3a26'],
  hairStyles: ['Kısa', 'Uzun', 'At Kuyruğu', 'Kazınmış', 'Örgülü'],
  hairColors: ['#2a1d16', '#5b3a1e', '#a0672d', '#d9b45a', '#c9c9c9', '#8a2b2b', '#3b4a7a'],
  cosmetics: ['Yok', 'Yara İzi', 'Savaş Boyası', 'Pelerin'],
};
