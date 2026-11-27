// Bölgeler, yerleşim türleri, rota türleri, Sonsuz Macera koşulları.
export const REGIONS = {
  1: { id: 1, name: 'Yeşil Topraklar', grass: ['#5f9e46', '#538c3c', '#6eab50'], road: ['#a8845a', '#94724c'], deco: ['tree', 'tree', 'bush', 'flowers', 'fence', 'rock', 'haystack', 'sign'], sky: 'day', weather: ['clear', 'clear', 'rain'] },
  2: { id: 2, name: 'Unutulmuş Ormanlar', grass: ['#3d6e36', '#335f2e', '#46783e'], road: ['#7e6444', '#6c5539'], deco: ['pine', 'pine', 'tree', 'bush', 'mushroom', 'ruin', 'log', 'rock'], sky: 'dusk', weather: ['clear', 'fog', 'rain'] },
  3: { id: 3, name: 'Kırık Dağlar', grass: ['#7f7a6a', '#706b5c', '#8b8574'], road: ['#a59a82', '#958a72'], deco: ['rock', 'rock', 'boulder', 'pine', 'cliff', 'mine', 'snowpatch', 'sign'], sky: 'day', weather: ['clear', 'snow', 'fog'] },
  4: { id: 4, name: 'Lanetli Sınırlar', grass: ['#4d5240', '#434838', '#575c48'], road: ['#6a6050', '#5c5344'], deco: ['deadtree', 'deadtree', 'grave', 'ruin', 'swamp', 'bones', 'fence', 'rock'], sky: 'gloom', weather: ['fog', 'fog', 'rain', 'night'] },
  5: { id: 5, name: 'Taç Toprakları', grass: ['#6aa84f', '#5e9a46', '#77b55a'], road: ['#b8b0a0', '#a8a090'], deco: ['tree', 'banner', 'statue', 'hedge', 'flowers', 'tower', 'fence', 'lamp'], sky: 'day', weather: ['clear', 'clear', 'rain'], cobble: 1 },
};
export const TOWN_TYPES = {
  village: { name: 'Köy', icon: 'village', services: ['inn', 'market', 'board', 'healer'], buy: 0.95, healer: 1 },
  trade: { name: 'Ticaret Kasabası', icon: 'trade', services: ['smith', 'market', 'inn', 'board'], buy: 1.05, stock: 1 },
  fort: { name: 'Askerî Kale', icon: 'fort', services: ['smith', 'inn', 'board', 'market'], buy: 1.0, special: 1 },
  mountain: { name: 'Dağ Yerleşimi', icon: 'mountain', services: ['smith', 'inn', 'market', 'board'], buy: 1.1 },
  monastery: { name: 'Manastır', icon: 'monastery', services: ['healer', 'market', 'board', 'inn'], buy: 1.0, healer: 0.7 },
  city: { name: 'Büyük Şehir', icon: 'city', services: ['smith', 'market', 'inn', 'healer', 'board'], buy: 1.1, stock: 1, special: 1 },
  capital: { name: 'Krallığın Başkenti', icon: 'capital', services: ['smith', 'market', 'inn', 'healer', 'board'], buy: 1.15, stock: 1, special: 1 },
};
export const TOWN_TYPE_BY_REGION = {
  1: ['village', 'village', 'trade', 'monastery'],
  2: ['village', 'trade', 'monastery', 'fort'],
  3: ['mountain', 'mountain', 'fort', 'trade'],
  4: ['fort', 'monastery', 'village', 'city'],
  5: ['city', 'fort', 'trade', 'monastery'],
};
export const TOWN_NAMES = {
  1: ['Değirmenköy', 'Elmalıpınar', 'Sarıçayır', 'Kuzuyurdu', 'Bal Tepesi', 'Yeşilova', 'Gölbaşı', 'Kirazlı', 'Söğütlü', 'Taşharman'],
  2: ['Kuzgunyuvası', 'Yosunlu Köprü', 'Meşegöl', 'Karaağaç', 'Fısıltılı Çam', 'Avcılar Obası', 'Sisli Dere', 'Yaprakkale', 'Baykuşlu', 'Kökler'],
  3: ['Demirgeçit', 'Kartalkaya', 'Buzpınar', 'Örsdağ', 'Kızıl Ocak', 'Taşbudak', 'Rüzgârlı Sırt', 'Madenbaşı', 'Kayalık Hisar', 'Kurt Boğazı'],
  4: ['Külköy', 'Solgunsu', 'Karanlık Hisar', 'Kemikbayır', 'Sessiz Çan', 'Kara Bataklık', 'Yıkık Sur', 'Gölge Manastırı', 'Son Fener', 'Kuzgun Kalesi'],
  5: ['Gümüşkapı', 'Sancaklı', 'Altınsu', 'Kraliçe Köprüsü', 'Aslanburç', 'Taçlı Bahçeler', 'Mermer Hisar', 'Beyaz Kule', 'Şahin Yolu', 'Zafer Meydanı'],
};
export const CAPITAL_NAME = 'Altıntaç';
export const START_NAME = 'Çıraklar Köyü';

// Rota türleri: kategori ağırlık çarpanları, dekor değişiklikleri.
export const LANE_TYPES = {
  royal: { name: 'Kraliyet Yolu', icon: 'crown', desc: 'Daha güvenli; askerler ve vergiciler sık görülür.', mult: { danger: 0.6, royal: 2.4, npc: 1.1, treasure: 0.7 }, danger: -1, decoBias: ['fence', 'sign', 'banner'] },
  forest: { name: 'Karanlık Orman', icon: 'tree', desc: 'Haydut ve yaratık riski yüksek; keşif ve ganimet fırsatları bol.', mult: { danger: 1.6, explore: 1.4, treasure: 1.4, royal: 0.3, mystic: 1.2 }, danger: 2, decoBias: ['pine', 'pine', 'tree', 'bush'] },
  mountain: { name: 'Dağ Geçidi', icon: 'peak', desc: 'Doğa tehlikeleri ve güçlü düşmanlar; nadir eşya fırsatları.', mult: { nature: 2.2, danger: 1.2, treasure: 1.2, npc: 0.6 }, danger: 1, rare: 1, decoBias: ['rock', 'boulder', 'cliff'] },
  trade: { name: 'Eski Ticaret Yolu', icon: 'cart', desc: 'Gezgin tüccarlar ve kervanlar sık sık geçer.', mult: { npc: 2, treasure: 1.1, danger: 0.9, absurd: 1.3 }, danger: 0, decoBias: ['cartwreck', 'sign', 'fence'] },
  wild: { name: 'Yaban Patika', icon: 'paw', desc: 'Az bilinen bir yol: tuhaf ve gizemli karşılaşmalar.', mult: { mystic: 2, absurd: 1.6, nature: 1.2, royal: 0.4 }, danger: 1, decoBias: ['mushroom', 'rock', 'bush'] },
};
export const DISTANCE_NAMES = { short: 'Kısa', medium: 'Orta', long: 'Uzun' };

export const ENDLESS_CONDITIONS = {
  banditInvasion: { name: 'Haydut İstilası', desc: 'Haydut olayları çok daha sık; haydutlar daha güçlü.', mult: { danger: 1.8 }, foe: { bandit: 1.2 } },
  hardWinter: { name: 'Sert Kış', desc: 'Kar fırtınaları; doğa olayları sık, han fiyatları yüksek.', mult: { nature: 2 }, weather: 'snow', inn: 1.5 },
  royalPressure: { name: 'Kraliyet Baskısı', desc: 'Vergiciler ve devriyeler her yerde; vergiler ağır.', mult: { royal: 2.4 }, tax: 1.5 },
  goldRush: { name: 'Altına Hücum', desc: 'Hazineler bol, ama fiyatlar da yüksek.', mult: { treasure: 2 }, price: 1.25, gold: 1.25 },
  plague: { name: 'Gizemli Salgın', desc: 'Şifa pahalı; gizemli olaylar artar.', mult: { mystic: 1.8 }, healer: 1.6, foe: { undead: 1.2 } },
  bounty: { name: 'Bereketli Yollar', desc: 'Yollar cömert: ödüller yüksek, tehlike az.', mult: { danger: 0.7, npc: 1.4 }, gold: 1.3 },
};
