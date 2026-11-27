// i18n — anahtar tabanlı TR/EN katmanı. TR tam ve varsayılan; EN eksikse TR'ye düşer; ekranda asla ham anahtar gösterilmez.
const TR = {
  'menu.play': 'OYNA', 'menu.continue': 'DEVAM ET', 'menu.levels': 'LEVEL SEÇ', 'menu.upgrade': 'GELİŞTİR', 'menu.shop': 'MAĞAZA',
  'menu.equipment': 'EKİPMAN', 'menu.dungeon': 'DUNGEON', 'menu.quests': 'GÖREVLER', 'menu.settings': 'AYARLAR', 'menu.close': 'KAPAT',
  'ui.chefPower': 'Şef Gücü', 'ui.recommended': 'önerisi', 'ui.chapter': 'Bölüm', 'ui.locked': 'KİLİT', 'ui.open': 'açık',
  'ui.energy': 'ENERJİ', 'ui.adRefill': 'Reklam dolumu', 'ui.gameComplete': 'TEBRİKLER! 120 level tamamlandı — Büyük Şef!',
  'ui.victory': 'SERVİS EDİLDİ!', 'ui.defeat': 'MUTFAK KAPANDI', 'ui.wave': 'Dalga', 'ui.final': 'FİNAL', 'ui.dualFinal': 'ÇİFT FİNAL',
  'ui.tripleFinal': 'ÜÇLÜ FİNAL', 'ui.language': 'Dil', 'ui.claim': 'AL', 'ui.claimed': 'Alındı', 'ui.daily': 'Günlük', 'ui.weekly': 'Haftalık',
  'ui.enter': 'GİR', 'ui.seals': 'Boss mührü', 'ui.parts': 'Parça', 'ui.tips': 'Bahşiş', 'ui.enhance': 'GÜÇLENDİR', 'ui.craft': 'ÜRET',
  'ui.tower': 'Kazan Kulesi', 'ui.bossKitchen': 'Boss Mutfağı', 'ui.floor': 'Kat',
};
const EN = {
  'menu.play': 'PLAY', 'menu.continue': 'CONTINUE', 'menu.levels': 'LEVELS', 'menu.upgrade': 'UPGRADE', 'menu.shop': 'SHOP',
  'menu.equipment': 'GEAR', 'menu.dungeon': 'DUNGEON', 'menu.quests': 'QUESTS', 'menu.settings': 'SETTINGS', 'menu.close': 'CLOSE',
  'ui.chefPower': 'Chef Power', 'ui.recommended': 'recommended', 'ui.chapter': 'Chapter', 'ui.locked': 'LOCKED', 'ui.open': 'open',
  'ui.energy': 'ENERGY', 'ui.adRefill': 'Ad refills', 'ui.gameComplete': 'CONGRATS! All 120 levels cleared — Grand Chef!',
  'ui.victory': 'ORDER SERVED!', 'ui.defeat': 'KITCHEN CLOSED', 'ui.wave': 'Wave', 'ui.final': 'FINAL', 'ui.dualFinal': 'DOUBLE FINAL',
  'ui.tripleFinal': 'TRIPLE FINAL', 'ui.language': 'Language', 'ui.claim': 'CLAIM', 'ui.claimed': 'Claimed', 'ui.daily': 'Daily', 'ui.weekly': 'Weekly',
  'ui.enter': 'ENTER', 'ui.seals': 'Boss seals', 'ui.parts': 'Parts', 'ui.tips': 'Tips', 'ui.enhance': 'ENHANCE', 'ui.craft': 'CRAFT',
  'ui.tower': 'Cauldron Tower', 'ui.bossKitchen': 'Boss Kitchen', 'ui.floor': 'Floor',
};
// chapter + boss names in English (level names fall back to Turkish — documented)
const NAMES_EN = {
  menemen: 'Menemen', fries: 'French Fries', omelet: 'Mushroom Omelet', pasta: 'Veggie Pasta', pizza: 'Pan Pizza', noodle: 'Spicy Noodles',
  stew: 'Veggie Stew', special_pan: "Chef's Special Pan", borek: 'Crispy Börek', wrap: 'Street Wrap', curry: 'Spicy Curry', feast: 'Grand Chef Feast',
};
const TR_CH = { menemen: 'Menemen', fries: 'Patates Kızartması', omelet: 'Mantarlı Omlet' };
const DICTS = { tr: TR, en: EN };
let lang = 'tr';
export const LANGS = ['tr', 'en'];
export function setLanguage(l) {
  lang = LANGS.includes(l) ? l : 'tr';
}
export const getLanguage = () => lang;
export function t(key) {
  return DICTS[lang][key] ?? TR[key] ?? ''; // never the raw key
}
export function chapterName(stage) {
  const id = stage?.chapterId;
  if (lang === 'en' && NAMES_EN[id]) return NAMES_EN[id];
  return stage?.chapterName || TR_CH[id] || '';
}
export const _dicts = { TR, EN };
