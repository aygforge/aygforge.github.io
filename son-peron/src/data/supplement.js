// JSON'da bulunmayan, GDD metninden türetilen tamamlayıcı tablolar.
// (Çelişki/yorum kayıtları README "Uzlaştırma notları" bölümünde.)

// kind: table | seat | storage | decor | floor | wall | bed | partition
// place: floor (iç zemin) | wall (duvar yüzü) | tile (zemin kaplaması, engel değil) | outdoor | ceiling
export const FURNITURE_META = {
  simple_table: { kind: 'table', place: 'floor', solid: true },
  wooden_chair: { kind: 'seat', seats: 1, place: 'floor', solid: true, comfort: 0 },
  stool: { kind: 'seat', seats: 1, place: 'floor', solid: true, comfort: 0, anyFacing: true },
  small_chest: { kind: 'storage', storage: 12, place: 'floor', solid: true },
  wooden_shelf: { kind: 'storage', storage: 12, place: 'floor', solid: true },
  small_plant: { kind: 'decor', comfort: 1, place: 'floor', solid: true, plant: true },
  wooden_fence: { kind: 'decor', place: 'outdoor', solid: true },
  stone_path: { kind: 'floor', place: 'outdoor', solid: false, tile: true },
  garden_bed: { kind: 'bed_plot', place: 'outdoor', solid: false, plot: true },
  large_table: { kind: 'table', place: 'floor', solid: true },
  round_table: { kind: 'table', place: 'floor', solid: true },
  comfort_chair: { kind: 'seat', seats: 1, comfort: 1, place: 'floor', solid: true },
  double_bench: { kind: 'seat', seats: 2, comfort: 0, place: 'floor', solid: true },
  large_chest: { kind: 'storage', storage: 24, place: 'floor', solid: true },
  kitchen_shelf: { kind: 'storage', storage: 16, place: 'floor', solid: true },
  bar_bottle_shelf: { kind: 'decor', comfort: 1, place: 'floor', solid: true },
  small_rug: { kind: 'decor', comfort: 1, place: 'tile', solid: false },
  framed_picture: { kind: 'decor', comfort: 1, place: 'wall', solid: false },
  garden_bench: { kind: 'decor', comfort: 1, place: 'outdoor', solid: true },
  wood_floor: { kind: 'floor', place: 'tile', solid: false, tile: true },
  cushioned_sofa: { kind: 'seat', seats: 2, comfort: 2, place: 'floor', solid: true },
  banquet_table: { kind: 'table', place: 'floor', solid: true },
  pantry_cabinet: { kind: 'storage', storage: 24, place: 'floor', solid: true },
  floor_lamp: { kind: 'decor', comfort: 1, place: 'floor', solid: true, light: true },
  // Perde: 1×2 görsel yükseklik; duvar yüzünde tek hücre kaplar (ayak izi ≠ görsel)
  curtain: { kind: 'decor', comfort: 1, place: 'wall', solid: false, footW: 1, footH: 1 },
  coat_rack: { kind: 'decor', comfort: 1, place: 'floor', solid: true },
  wood_partition: { kind: 'decor', comfort: 0, place: 'floor', solid: true },
  large_plant: { kind: 'decor', comfort: 1, place: 'floor', solid: true, plant: true },
  bookshelf: { kind: 'decor', comfort: 1, place: 'floor', solid: true },
  flower_bed: { kind: 'decor', comfort: 1, place: 'outdoor', solid: true, plant: true },
  woodshed: { kind: 'storage', storage: 8, place: 'outdoor', solid: true },
  stone_floor: { kind: 'floor', place: 'tile', solid: false, tile: true },
  ornate_chair: { kind: 'seat', seats: 1, comfort: 2, place: 'floor', solid: true },
  wall_clock: { kind: 'decor', comfort: 1, place: 'wall', solid: false },
  chandelier: { kind: 'decor', comfort: 3, place: 'ceiling', solid: false, light: true },
  garden_lamppost: { kind: 'decor', comfort: 1, place: 'outdoor', solid: true, light: true },
  ornate_sign: { kind: 'decor', comfort: 2, place: 'outdoor', solid: true },
  // Duvar kâğıdı paketi: 4 yatay duvar yüzü hücresini kaplar (JSON 1×4 → duvar boyunca 4×1)
  wallpaper_pack: { kind: 'decor', comfort: 2, place: 'wall', solid: false, footW: 4, footH: 1 }
};

// station: tarif istasyon ID'si. foodSlots/drinkSlots: fiziksel bar modülü slotları.
export const EQUIPMENT_META = {
  second_stove: { w: 2, h: 1, station: 'stove' },
  kettle: { w: 1, h: 1, station: 'kettle' },
  basic_oven: { w: 2, h: 1, station: 'basic_oven' },
  better_prep: { w: 2, h: 1, prepBonus: 1 },
  food_bar_2: { w: 2, h: 1, foodSlots: 1, barModule: true },
  drink_bar_2: { w: 2, h: 1, drinkSlots: 1, barModule: true },
  fireplace: { w: 2, h: 1, fireplace: true, light: true },
  large_pan: { w: 1, h: 1, station: 'large_pan' },
  coffee_machine: { w: 1, h: 1, station: 'coffee_machine' },
  juicer: { w: 1, h: 1, station: 'juicer' },
  refrigerator: { w: 1, h: 1, fridge: true },
  food_bar_3: { w: 2, h: 1, foodSlots: 1, barModule: true },
  advanced_stove: { w: 2, h: 1, station: 'advanced_stove' },
  food_bar_4: { w: 2, h: 1, foodSlots: 1, barModule: true }
};

// Lokantanın başlangıç demirbaşları (hepsi B modunda serbestçe taşınabilir).
export const FIXTURES = {
  old_table: { name: 'Eski masa', w: 2, h: 2, kind: 'table' },
  old_chair: { name: 'Eski sandalye', w: 1, h: 1, kind: 'seat', seats: 1, comfort: 0 },
  bar_counter: { name: 'Bar tezgâhı', w: 3, h: 1, kind: 'equipment', foodSlots: 1, drinkSlots: 1, barModule: true },
  starter_stove: { name: 'Eski ocak', w: 2, h: 1, kind: 'equipment', station: 'stove', repair: 'repair_stove' },
  prep_counter: { name: 'Hazırlık tezgâhı', w: 2, h: 1, kind: 'equipment', readyShelf: true },
  workbench: { name: 'Marangoz tezgâhı', w: 2, h: 1, kind: 'equipment', workbench: true, repair: 'repair_workbench' },
  player_bed: { name: 'Yatak', w: 2, h: 3, kind: 'bed' },
  depot_crate: { name: 'Depo sandığı', w: 2, h: 2, kind: 'storage', storage: 0, depotAccess: true },
  old_chest: { name: 'Tozlu sandık', w: 1, h: 1, kind: 'decor', starterChest: true },
  letter_desk: { name: 'Yazı masası', w: 1, h: 1, kind: 'decor', letter: true },
  wardrobe: { name: 'Kişisel dolap', w: 2, h: 1, kind: 'decor', wardrobe: true },
  cleaning_cupboard: { name: 'Temizlik dolabı', w: 1, h: 1, kind: 'decor', cleaning: true },
  project_board: { name: 'Restorasyon panosu', w: 2, h: 1, kind: 'decor', projectBoard: true }
};

export const COSMETIC_META = {
  recipe_book_podium: { comfort: 3 }, autumn_harvest_basket: { comfort: 2 }, winter_lantern: { comfort: 3 }, final_plaque: { comfort: 4 }
};

export const HAND_TOOLS = {
  axe: { name: 'Balta', desc: 'Ağaç keser (F)' },
  pickaxe: { name: 'Kazma', desc: 'Kaya kırar (F)' },
  hoe: { name: 'Çapa', desc: 'Tarım yatağını çapalar (F)' },
  watering_can: { name: 'Sulama kabı', desc: 'Ekili yatağı sular (F)' },
  fishing_rod: { name: 'Olta', desc: 'Dere kenarında balık tutar', buy: 75 }
};

// Kullanıcı kararı (v1.1): günde 5 sefer. GDD'deki 09/15/21 yerine bu tarife geçerlidir (girdi JSON değiştirilmez).
// Kullanıcı kararı (v1.1): restorasyon eşikleri GDD'deki 12/70/220/500 yerine (günde 5 tren nedeniyle).
// GDD'nin özgün eşikleri artık "ün kademesi"ni (tren başına misafir yoğunluğu) belirler; bkz. trains.demandTier.
export const EXPANSION_PAID = { salon_expansion_1: 90, salon_expansion_2: 380, salon_expansion_3: 950, salon_expansion_4: 1900 };
export const TRAIN_SCHEDULE = ['09:00', '12:00', '15:00', '18:00', '21:00'];
// Hedef restoran ziyaretçisi aralıkları [min,max]; sıra TRAIN_SCHEDULE ile aynı.
// 09/15/21 değerleri GDD §17'den; 12:00 ve 18:00 ara seferleri daha küçük dalgalar getirir.
export const VISITOR_TARGETS = {
  1: [[2, 3], [1, 2], [2, 4], [1, 3], [2, 3]],
  2: [[3, 4], [2, 3], [4, 5], [3, 4], [3, 4]],
  3: [[4, 6], [3, 4], [5, 7], [4, 5], [4, 5]],
  4: [[5, 7], [4, 5], [6, 8], [5, 6], [4, 6]],
  5: [[6, 8], [4, 6], [7, 9], [5, 7], [5, 6]]
};

// GDD §16 altı müşteri profili. patience/tip çarpanları ılımlı tutulur. w: sefer başına ağırlık (09,12,15,18,21).
export const PROFILES = {
  regular: { name: 'Yolcu', patience: 1.0, tip: 1.0, group: [1, 2], w: [3, 3, 3, 3, 3] },
  railworker: { name: 'Demiryolu çalışanı', patience: 0.9, tip: 0.9, group: [1, 2], w: [4, 3, 2, 3, 2] },
  tourist: { name: 'Turist', patience: 1.1, tip: 1.2, group: [1, 3], w: [1, 3, 4, 2, 1] },
  elder: { name: 'Yaşlı yolcu', patience: 1.3, tip: 1.0, group: [1, 2], w: [3, 3, 2, 2, 1] },
  business: { name: 'İş insanı', patience: 0.85, tip: 1.4, group: [1, 1], w: [3, 4, 2, 3, 3] },
  family: { name: 'Aile', patience: 1.15, tip: 1.0, group: [3, 4], w: [1, 2, 3, 3, 2] }
};
// GDD §16 rahat müşteri sabrı (oyun dakikası)
export const PATIENCE = { door: [50, 70], order: [60, 85], serve: [75, 110], pay: [60, 90] };
export const EAT_MINUTES = [15, 25];
export const DRINK_CHANCE = 0.45;
export const SATISFACTION_WEIGHTS = { speed: 0.4, clean: 0.2, ambiance: 0.15, variety: 0.15, comfort: 0.1 };
export const REPUTATION_TITLES = [[85, 'Son Peron Efsanesi'], [75, 'Ünlü Gar Restoranı'], [65, 'Kasabanın Sevilen Lokantası'], [55, 'Yeniden Keşfedilen Mekân'], [0, 'Unutulmuş Lokanta']];

// Düzenli müşteriler (sadakat 0–3)
export const REGULARS = ['Halil Usta', 'Müzeyyen Hanım', 'Postacı Selim', 'Öğretmen Nalan', 'Makinist Yaşar', 'Terzi Gülsüm', 'Doktor Ferit', 'Kitapçı Leyla'];

// Bakkal: sınırlı ürün listesi (posta fiyatı ×1,25 yukarı yuvarlanır); satın aldığı ürünler
export const SHOPS = {
  Feriha: { title: 'Feriha\'nın Bakkalı', sells: ['potato', 'carrot', 'onion', 'tomato', 'flour', 'egg', 'milk', 'butter', 'sugar', 'salt', 'bottled_juice', 'bottled_lemonade'], buys: ['wood', 'stone', 'potato', 'carrot', 'onion', 'tomato', 'pepper', 'mushroom', 'wild_berries', 'fish', 'apple', 'egg', 'milk'] },
  'Rıza': { title: 'Rıza Usta\'nın Atölyesi', sells: ['metal_part', 'fabric', 'glass'], buys: ['wood', 'stone'] },
  'Şirin': { title: 'Şirin\'in Serası', sells: ['potato_seed', 'carrot_seed', 'onion_seed', 'tomato_seed', 'pepper_seed'], buys: ['potato', 'carrot', 'onion', 'tomato', 'pepper'] }
};
export const SHOP_MARKUP = 1.25;

// İsimli NPC programları: [başlangıç dk, sahne, x, y]. Sahne dışı da mantıksal olarak güncellenir.
export const NPC_SCHEDULES = {
  Kemal: { role: 'Gar müdürü', look: { skin: 1, hair: 5, style: 4, outfit: 6, hat: 'cap' }, plan: [[360, 'railway_outdoors', 22, 45], ...TRAIN_SCHEDULE.flatMap((t) => { const m = +t.slice(0, 2) * 60; return [[m - 30, 'railway_outdoors', 20, 53], [m + 30, 'railway_outdoors', 22, 45]]; })] },
  Feriha: { role: 'Bakkal', look: { skin: 0, hair: 2, style: 2, outfit: 3, apron: true }, plan: [[360, 'town_square', 10, 31], [480, 'town_square', 13, 14], [1080, 'town_square', 10, 31]] },
  'Rıza': { role: 'Marangoz', look: { skin: 2, hair: 4, style: 3, outfit: 2, beard: true }, plan: [[360, 'town_square', 50, 31], [540, 'town_square', 30, 14], [1080, 'town_square', 27, 24]] },
  'Şirin': { role: 'Bahçıvan', look: { skin: 1, hair: 3, style: 1, outfit: 1, hat: 'straw' }, plan: [[360, 'town_square', 52, 34], [480, 'town_square', 46, 14], [960, 'town_square', 33, 26]] },
  Sevim: { role: 'Emekli aşçı', look: { skin: 0, hair: 5, style: 2, outfit: 5, apron: true }, plan: [[360, 'town_square', 44, 34], [660, 'town_square', 23, 27], [960, 'town_square', 44, 34]] },
  Rana: { role: 'Gezgin gazeteci', look: { skin: 1, hair: 0, style: 1, outfit: 4, hat: 'beret' }, visitor: true, plan: [[900, 'railway_outdoors', 30, 47], [1200, 'railway_outdoors', 30, 47]] }
};

// Festival günü isteğe bağlı hedefler (kozmetik ödülü bir kez; sonraki yıl tekrar denenebilir)
export const FESTIVAL_GOALS = {
  flower_festival: { text: 'Bugün 4 müşteri ağırla ve lokantada en az 2 bitki/çiçek dekoru bulundur', serve: 4, plants: 2 },
  station_fair: { text: 'Bugün 6 müşteri ağırla', serve: 6 },
  harvest_fair: { text: 'Bugün 2 farklı yemek sat ve 4 müşteri ağırla', serve: 4, distinctFoods: 2 },
  lantern_night: { text: '18:00\'den sonra 3 müşteri ağırla', serveEvening: 3 }
};
export const FESTIVAL_PAX_MULT = 1.25;

// İsteğe bağlı renovasyonların somut etkileri (GDD yalnız maliyet verir)
export const RENOVATION_EFFECTS = {
  'façade_renewal': { ambiance: 6, attract: 0.05, desc: 'Dış cephe yenilenir; ortam +6, yolcu ilgisi +%5' },
  kitchen_expansion: { depot: 16, ambiance: 2, desc: 'Mutfağa gömme dolaplar; depo +16 slot' },
  storage_expansion: { depot: 24, zone: 'east_storage', desc: 'Depo odası doğuya genişler; depo +24 slot' },
  railway_sign_repair: { attract: 0.1, desc: 'Gar tabelası onarılır; yolcu ilgisi +%10' },
  terrace: { ambiance: 8, desc: 'Ön bahçeye teras; ortam +8' }
};

// Oyuncu eylem süreleri (oyun dakikası). 1 oyun dk ≈ 1,176 gerçek sn.
export const ACTION_MIN = { chop: 0.55, mine: 0.6, hoe: 0.55, water: 0.45, plant: 0.35, harvest: 0.4, gather: 0.4, clean_table: 1.28, clean_stain: 0.85, repair: 1.6, craft: 1.0 };
export const RESOURCE_NODES = {
  tree: { hits: 3, item: 'wood', qty: [6, 6], respawn: [3, 4], tool: 'axe', solid: true },
  rock: { hits: 2, item: 'stone', qty: [3, 3], respawn: [4, 5], tool: 'pickaxe', solid: true },
  mushroom: { hits: 1, item: 'mushroom', qty: [1, 2], respawn: [2, 3], tool: null, solid: false },
  berry: { hits: 1, item: 'wild_berries', qty: [1, 3], respawn: [2, 3], tool: null, solid: true }
};
export const SEASON_NAMES = { spring: 'İlkbahar', summer: 'Yaz', autumn: 'Sonbahar', winter: 'Kış' };
export const WEATHER_NAMES = { clear: 'Açık', cloudy: 'Bulutlu', rain: 'Yağmurlu', storm: 'Fırtına', snow: 'Karlı', blizzard: 'Tipi' };
export const SPEED = { walk: 110, run: 165, carry: 95, npcMin: 70, npcMax: 100 };
export const CLOSING_LIMIT_MIN = 150; // 23:00 sonrası sınırlı kapanış zamanlayıcısı
export const SAVE_VERSION = 1;
