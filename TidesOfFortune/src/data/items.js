// GDD Bölüm 6: 15 item + açık sorulardaki 3 item (KARAR: fiyat/etki geçici).
// type: passive | active | consumable
// uses: dayanıklılık. Item etkisini her gösterdiğinde 1 hak gider; hak bitince item kırılır (denge: sınırsız pasif yok).
// where: item ancak listelenen koşullardan biri sağlanırsa limanda teklif edilir.
//   {regions:[..]} bölge şartı, {types:[..]} liman tipi şartı; ikisi birlikte = ikisi de.

const I = (o) => ({ rarity: 'common', where: [{}], ...o });

export const ITEM_CATEGORIES = { defense: 'Savunma', travel: 'Seyahat', trade: 'Ticaret', luck: 'Şans' };
export const ITEM_TYPES = { passive: 'Pasif', active: 'Aktif', consumable: 'Tek kullanım' };

export const ITEMS = [
  I({ id: 'ITEM_ROPES', uses: 3, name: 'Halatlar ve Zincir', cat: 'defense', type: 'passive', price: 60,
    effect: 'Korsan saldırısında kargo kaybını engeller.', events: ['Korsan Baskını', 'Kayalık Geçit'], icon: 'rope' }),
  I({ id: 'ITEM_REPAIR_KIT', name: 'Onarım Takımı', cat: 'defense', type: 'consumable', price: 80,
    effect: '+30 HP onarım. Tek kullanım; yolculukta istediğin an kullanılabilir.', events: ['Yangın Çıktı', 'Depo Sızıntısı'], icon: 'kit' }),
  I({ id: 'ITEM_CANNON', uses: 4, name: 'Güverte Topu', cat: 'defense', type: 'active', price: 150,
    effect: 'Savaş seçeneğini açar (40 hasar).', events: ['Korsan Baskını', 'Deniz Canavarı', 'Korsan Ablukası', 'Dev Mürekkep Balığı'], icon: 'cannon',
    where: [{ regions: [2, 3, 4, 5] }] }),
  I({ id: 'ITEM_SEXTANT', uses: 4, name: 'Sekstant', cat: 'travel', type: 'passive', price: 100,
    effect: 'Navigasyon seçeneklerinde başarı şansı +%30.', events: ['Sis Tuzağı', 'Kayalık Geçit', 'Sahte Liman Rehberi', 'Torpido Enkazı'], icon: 'sextant' }),
  I({ id: 'ITEM_LIGHT_SAIL', uses: 3, name: 'Hafif Yelken', cat: 'travel', type: 'passive', price: 120,
    effect: 'Kaçış şansı +%40 (Korsan Baskını\'nda +%30).', events: ['Korsan Baskını', 'Dev Dalga', 'Deniz Canavarı'], icon: 'sail',
    where: [{ regions: [1, 2, 3] }] }),
  I({ id: 'ITEM_SEA_CHART', uses: 3, name: 'Deniz Haritası', cat: 'travel', type: 'passive', price: 140, rarity: 'uncommon',
    effect: 'Sonraki 2 eventi önceden gösterir.', events: ['Dev Dalga', 'Sahte Liman Rehberi', 'Tsunami Dalgası'], icon: 'chart',
    where: [{ regions: [2, 3, 4, 5] }] }),
  I({ id: 'ITEM_MERCHANT_SEAL', uses: 3, name: 'Tüccar Mühürü', cat: 'trade', type: 'passive', price: 110,
    effect: 'Satış fiyatı +%15.', events: ['Rakip Tüccar'], icon: 'seal',
    where: [{ regions: [1, 2, 3] }] }),
  I({ id: 'ITEM_HIDDEN_SAFE', uses: 2, name: 'Gizli Kasa', cat: 'trade', type: 'passive', price: 130,
    effect: 'Eventlerdeki altın kaybı yarıya iner.', events: ['Korsan Baskını', 'Sahte Yardım Sinyali'], icon: 'safe' }),
  I({ id: 'ITEM_QUALITY_SEAL', uses: 3, name: 'Kalite Mühürü', cat: 'trade', type: 'passive', price: 90,
    effect: 'Kargo bozulmasını engeller.', events: ['Salgın Hastalık', 'Depo Sızıntısı', 'Dev Dalga'], icon: 'qseal',
    where: [{ regions: [1, 2, 3] }] }),
  I({ id: 'ITEM_SMUGGLER_HOLD', uses: 3, name: 'Kaçakçılık Bölmesi', cat: 'trade', type: 'passive', price: 160, rarity: 'uncommon',
    effect: 'Müsadere riski −%50, kaçak mal kârı +%30.', events: ['Askerî Denetim', 'Gümrük Rüşveti', 'Kaçakçı Ağı'], icon: 'hold',
    where: [{ types: ['pirate', 'fog'] }] }),
  I({ id: 'ITEM_AMULET', uses: 2, name: 'Deniz Tanrısı Muskası', cat: 'luck', type: 'passive', price: 200, rarity: 'rare',
    effect: 'Olumsuz sonuçların %25\'i olumluya döner.', events: ['Hayalet Gemi', 'Sisde Ses', 'Renk Değiştiren Deniz', 'Deniz Canavarı'], icon: 'amulet',
    where: [{ regions: [3, 4, 5] }] }),
  I({ id: 'ITEM_ANCIENT_MAP', name: 'Antik Harita', cat: 'luck', type: 'consumable', price: 180, rarity: 'rare',
    effect: 'Sonraki limanda nadir item garantisi (varışta harcanır).', events: ['Terk Edilmiş Ada', 'Batık Şehir', 'Hazine Peşinde'], icon: 'oldmap',
    where: [{ regions: [3, 4, 5] }] }),
  I({ id: 'ITEM_FISH_NET', uses: 3, name: 'Balık Ağı', cat: 'luck', type: 'active', price: 70,
    effect: 'Balık Sürüsü eventinde altın ×2; Açlık\'ta balık avı.', events: ['Balık Sürüsü', 'Açlık'], icon: 'net',
    where: [{ regions: [1, 2] }] }),
  I({ id: 'ITEM_BLACK_FLAG', uses: 2, name: 'Kara Bayrak', cat: 'defense', type: 'active', price: 170, rarity: 'uncommon',
    effect: 'Korsanlarla saygı seçeneği (%90).', events: ['Korsan Baskını', 'Korsan Ablukası', 'Korsan Filosu'], icon: 'flag',
    where: [{ types: ['pirate'] }] }),
  I({ id: 'ITEM_FLARE', name: 'Sinyal Fişeği', cat: 'defense', type: 'consumable', price: 100,
    effect: 'Askerî kurtarma çağrısı (%80). Tek kullanım.', events: ['Savaş Alanı', 'Korsan Baskını', 'Sis Tuzağı'], icon: 'flare',
    where: [{ types: ['military'] }, { regions: [3, 4] }] }),
  // GDD açık sorular — eksik itemler (KARAR)
  I({ id: 'ITEM_ICEBREAKER', uses: 3, name: 'Buz Kıran Pruva', cat: 'travel', type: 'passive', price: 190, rarity: 'rare', assumption: true,
    effect: 'Kutup Buzulları\'nda güvenli geçiş; buzul eventlerinde hasar −%50.', events: ['Kutup Buzulları'], icon: 'icebreaker',
    where: [{ types: ['ice'] }, { regions: [5], types: ['trade', 'volcanic'] }] }),
  I({ id: 'ITEM_HEAT_SHIELD', uses: 3, name: 'Isı Kalkanı', cat: 'defense', type: 'passive', price: 180, rarity: 'rare', assumption: true,
    effect: 'Volkanik Patlama\'da az hasar; yangın hasarı −%25.', events: ['Volkanik Patlama', 'Yangın Çıktı'], icon: 'heatshield',
    where: [{ types: ['volcanic'] }, { regions: [4, 5], types: ['military'] }] }),
  I({ id: 'ITEM_LOCKPICK', uses: 3, name: 'Hırsızlık Aleti', cat: 'luck', type: 'active', price: 120, rarity: 'uncommon', assumption: true,
    effect: 'Kilitli sandıkları açar (Korsanın Teklifi); sandık ve enkaz eventlerinde ek ganimet.', events: ['Korsanın Teklifi', 'Yüzen Sandık', 'Enkaz Alanı'], icon: 'lockpick',
    where: [{ types: ['pirate', 'fog'] }, { regions: [3, 4, 5], types: ['trade'] }] }),
];

export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
export const RARE_ITEMS = ITEMS.filter((i) => i.rarity === 'rare' || i.rarity === 'uncommon').map((i) => i.id);
