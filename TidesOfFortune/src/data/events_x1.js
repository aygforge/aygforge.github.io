// YAŞAYAN DENİZLER (X1): 25 yeni bağımsız event + Dünya Hafızası takip sahneleri, Hikâye Yankıları
// ve sözleşme sahneleri. Etki sözlüğü EventSystem.applyFx ile aynıdır; yeni etkiler fx.x1 altındadır.
import { TRADE_GOODS } from './goods.js';

const ANY = TRADE_GOODS.filter((g) => g.group !== 'special').map((g) => g.id);
const PASS = ['pass'];

export const X1_EVENTS = [
  // ════════ A. DENİZ TEHLİKELERİ ════════
  {
    id: 'EVT_X1_D01', cat: 'danger', title: 'Güverteye Çıkan Dev Yengeç', tier: 1, regions: [1, 2, 3], tags: ['creature', 'boarding'], weight: 9,
    art: { sky: 'day', sea: 'choppy', obj: ['crab'] },
    text: `Sudan bir kabuk yükseldi; kıskaçları kayık büyüklüğünde bir yengeç küpeşteye tutundu ve güverteye tırmanmaya başladı.`,
    options: [
      { label: 'Balık at', icon: 'fish', req: { cargoGoods: ['GOOD_FISH', 'GOOD_GRAIN', 'GOOD_BISCUIT_CRATE'] }, hint: '1 birim erzak',
        win: { text: `Bir sandık balığı denize fırlattın. Yengeç kıskaçlarını şaklatıp ganimetin peşinden suya daldı.`, fx: { xp: 5, x1: { cargoUse: 1 } } } },
      { label: 'Bjorn ile savaş', icon: 'sword', req: { crew: 'CREW_BJORN' },
        win: { text: `Bjorn baltasını kaldırıp yengecin karşısına dikildi. Birkaç savuruştan sonra yaratık denize geri kaçtı; kabuğundan kopan parçalar iyi para eder.`, fx: { goldR: 55, xp: 10 } } },
      { label: 'Halatlarla denize it', icon: 'rope', chance: 70, tags: ['maneuver'],
        win: { text: `Dört kişi halatları yengecin bacaklarına geçirip onu küpeşteden aşağı yuvarladı.`, fx: { xp: 5 } },
        lose: { text: `Yengeç kıskacını güverteye indirdi; tahtalar yarıldı.`, fx: { hull: -12 } } },
    ],
  },
  {
    id: 'EVT_X1_D02', cat: 'danger', title: 'Dalgıç Hırsızlar', tier: 2, regions: [2, 3, 4, 5], tags: ['thief', 'night', 'boarding'], minCargo: 1, weight: 9,
    art: { sky: 'night', sea: 'calm', obj: ['divers'] },
    text: `Gece nöbetinde suda kabarcıklar belirdi. Karanlık sudan çıkan iki üç dalgıç ipe sarılıp sessizce gemine tırmanıyordu.`,
    options: [
      { label: 'Tayfaları alarma geçir', icon: 'bell', chance: 70, tags: ['combat'],
        win: { text: `Çan çaldı, fenerler yandı. Hırsızlar ellerindeki sandıkları bırakıp denize atladı. Birinin kemerinden düşen not bir korsan rotasını işaret ediyordu.`, fx: { xp: 10, x1: { mem: { pirateIntel: true } } } },
        lose: { text: `Hırsızlar sizden çevikti; sandıkları omuzlayıp karanlığa daldılar.`, fx: { cargoLoss: 20 } } },
      { label: 'Yara ile tespit et', icon: 'bow', req: { crew: 'CREW_YARA' },
        win: { text: `Yara karanlığa bir ok gönderdi; ok halatı kesti ve dalgıçlar suya düştü. Kaçarken bir harita parçası bıraktılar.`, fx: { xp: 10, x1: { mem: { pirateIntel: true } } } } },
      { label: 'Halatları kes', icon: 'rope', chance: 85, tags: ['maneuver'],
        win: { text: `Bıçaklar parladı; tırmanma halatları koptu ve hırsızlar suya geri düştü.`, fx: { xp: 5 } },
        lose: { text: `Halat koparken bir kanca gövdeyi yırttı.`, fx: { hull: -8 } } },
    ],
  },
  {
    id: 'EVT_X1_D03', cat: 'danger', title: 'Kopan Ana Direk', tier: 2, regions: [2, 3, 4, 5], tags: ['storm', 'mast', 'rigging'], weight: 8,
    art: { sky: 'storm', sea: 'rough', obj: ['mastBreak'], fx: ['rain'] },
    text: `Bir rüzgâr darbesiyle ana direğin bağlantısı çatırdadı. Direk yana yattı, yelkenler suya sarktı.`,
    options: [
      { label: 'Groot ile acil onarım', icon: 'hammer', req: { crew: 'CREW_GROOT' },
        win: { text: `Groot halatları gerdirdi, direği omzuyla kaldırdı ve kamaları çakıp yerine sabitledi.`, fx: { xp: 10 } } },
      { label: 'Profesyonel müdahale (60 altın)', icon: 'coin', cost: { gold: 60 },
        win: { text: `Yakındaki bir balıkçı teknesinden gelen marangozlar direği parayla ama ustaca yerine oturttu.`, fx: { x1: { mem: { mastBroken: false } } } } },
      { label: 'Hasarlı devam et', icon: 'sail', tags: ['reckless'],
        win: { text: `Yamalı bir direkle yola devam ettin. Gemi ağırlaştı, gövde zorlandı.`, fx: { hull: -12, x1: { delay: 25, mem: { mastBroken: true } } } } },
    ],
  },
  {
    id: 'EVT_X1_D04', cat: 'danger', title: 'Pruvadaki Dev Ağ', tier: 1, regions: [1, 2, 3], tags: ['net'], weight: 9,
    art: { sky: 'day', sea: 'calm', obj: ['bigNet'] },
    text: `Gemi aniden yavaşladı. Pruvaya terk edilmiş dev bir balık ağı dolanmıştı; içinde bir şeyler kıpırdıyordu.`,
    options: [
      { label: 'Ağı kesip kurtul', icon: 'sword', tags: PASS,
        win: { text: `Ağı kesip pruvayı serbest bıraktın.`, fx: {} } },
      { label: 'Ağı çekerek ganimet ara', icon: 'net', chance: 60, tags: ['loot'],
        win: { text: `Ağın içinden balıklar ve suyun dibinden toplanmış eski bir sandık çıktı.`, fx: { goldR: 45, xp: 5 } },
        lose: { text: `Ağ gerilip koptu; kopan halatlar gövdeyi kamçıladı.`, fx: { hull: -10 } } },
      { label: 'Mira ile çöz', icon: 'dive', req: { crew: 'CREW_MIRA' },
        win: { text: `Mira suya daldı, ağı pruvadan düğüm düğüm çözdü ve içindeki sandığı da yukarı gönderdi.`, fx: { xp: 10, goldR: 25 } } },
    ],
  },
  {
    id: 'EVT_X1_D05', cat: 'danger', title: 'Korsanların Sahte Ateşkesi', tier: 2, regions: [3, 4, 5], tags: ['pirate', 'trade'], weight: 8,
    art: { sky: 'dusk', sea: 'calm', obj: ['pirateShip', 'boat'] },
    text: `Beyaz bayrak taşıyan bir korsan sandalı yaklaştı. Elçi, ateşkes ve dostça bir ticaret önerdi. Gözleri gemindeki sandıklarda dolaşıyordu.`,
    options: [
      { label: 'Teklifi kabul et', icon: 'talk', chance: 55, tags: ['negotiate'],
        win: { text: `Gerçekten ticaret istiyorlardı. Elçi iyi bir fiyatla mal aldı ve Kızıl Kaptan adında birinden söz etti.`, fx: { goldR: 60, x1: { rep: { red: 1 }, mem: { redHint: true } } } },
        lose: { text: `Pusuydu! Elçinin işaretiyle korsanlar güverteye çıktı ve sandıkları taşıdı.`, fx: { cargoLoss: 20, hull: -10, x1: { mem: { redHint: true } } } } },
      { label: 'Diego ile işaretleri incele', icon: 'eye', req: { crew: 'CREW_DIEGO' },
        win: { text: `Diego bayrağın düğümüne baktı: "Bu ateşkes değil, av işareti." Elçi yakalandığını anlayıp çekildi; giderken Kızıl Kaptan'ın adını tükürdü.`, fx: { xp: 10, x1: { mem: { redHint: true } } } } },
      { label: 'Uyarı ateşi aç', icon: 'cannon', chance: 65, tags: ['combat'],
        win: { text: `Gülle sandalın önüne düştü. Korsanlar beyaz bayrağı fırlatıp uzaklaştı.`, fx: { xp: 5 } },
        lose: { text: `Korsan gemisi karşılık verdi; gülleler güverteye indi.`, fx: { hull: -20, x1: { rep: { red: -1 } } } } },
    ],
  },
  {
    id: 'EVT_X1_D06', cat: 'danger', title: 'Denizanası Sürüsü', tier: 1, regions: [1, 2, 3, 4], tags: ['night', 'jelly'], weight: 8,
    art: { sky: 'night', sea: 'dark', obj: ['jellyfish'] },
    text: `Gece deniz mavi ve mor ışıklarla doldu. Binlerce parlayan denizanası geminin etrafında süzülüyordu.`,
    options: [
      { label: 'Sürünün geçmesini bekle', icon: 'anchor', tags: PASS,
        win: { text: `Yelkenleri indirip bekledin. Işıklı sürü yavaşça geçti.`, fx: { x1: { delay: 20 } } } },
      { label: 'Örnek topla', icon: 'net', chance: 60, tags: ['loot'],
        win: { text: `Ağa takılan birkaç parlayan denizanası şifacılara iyi satılır.`, fx: { goldR: 60 } },
        lose: { text: `Dokunaçlar halatlara ve gövdeye yapıştı; yakıcı zehir tahtaları kararttı.`, fx: { hull: -10 } } },
      { label: 'Dikkatli ilerle', icon: 'compass', chance: 75, tags: ['navigate'],
        win: { text: `Işıkların arasından süzülerek geçtin.`, fx: { xp: 5 } },
        lose: { text: `Pervane suyu sürüye çarptı; dokunaçlar gövdeye sarıldı.`, fx: { hull: -10 } } },
    ],
  },

  // ════════ B. TİCARET VE FIRSATLAR ════════
  {
    id: 'EVT_X1_F01', cat: 'fortune', title: 'Açık Deniz Müzayedesi', tier: 2, regions: [2, 3, 4, 5], tags: ['trade', 'auction'], weight: 8,
    art: { sky: 'day', sea: 'calm', obj: ['auction'] },
    text: `Üç ticaret gemisi bir halka oluşturmuştu. Ortadaki sandalda bir tellal bağırıyordu: "Açık deniz müzayedesi! Teklifler bayrakla!"`,
    options: [
      { label: '80 altınlık mal lotuna katıl', icon: 'crate', chance: 70, req: { cargoFree: 1 }, tags: ['negotiate'],
        win: { text: `Bayrağın son kalkan bayraktı. Lot senin: bir sandık ipek.`, fx: { gold: -80, cargoAdd: { good: 'GOOD_SILK', qty: 2 } } },
        lose: { text: `Rakip gemi son anda teklifi yükseltti. Altının cebinde kaldı.`, fx: {} } },
      { label: '160 altınlık değerli lota katıl', icon: 'gift', chance: 55, tags: ['negotiate'],
        win: { text: `Lot kapandı ve değerli eşya sana teslim edildi. Tellal sandığın üstündeki eski lonca mührüne bakıp kaşlarını kaldırdı.`, fx: { gold: -160, item: 'rare', x1: { mem: { sealHint: true } } } },
        lose: { text: `Sisli bir galyon herkesin teklifini ezdi. Altın kesende kaldı.`, fx: { x1: { mem: { sealHint: true } } } } },
      { label: 'Yalnızca gözlemle', icon: 'eye', tags: PASS,
        win: { text: `Teklifleri, bayrakları, kimin kimle göz göze geldiğini izledin. Ticaret bir oyundu.`, fx: { xp: 5 } } },
    ],
  },
  {
    id: 'EVT_X1_F02', cat: 'fortune', title: 'Yüzen Bit Pazarı', tier: 1, regions: [1, 2, 3, 4], tags: ['trade', 'market'], weight: 9,
    art: { sky: 'day', sea: 'calm', obj: ['fleaMarket'] },
    text: `Birbirine bağlanmış onlarca küçük tekne, renkli tenteleriyle bir pazar kurmuştu. Satıcılar el sallıyordu.`,
    options: [
      { label: 'Bir malını takas et', icon: 'scale', req: { cargoGoods: ANY },
        win: { text: `Tezgâhtar malını tarttı, burnunu kırıştırdı ve karşılığında daha değerli bir sandık verdi.`, fx: { x1: { swap: 1 } } } },
      { label: 'Gizemli eşya (50 altın)', icon: 'gift', cost: { gold: 50 },
        win: { text: `Bir bez parçasının altından çıkan eşya beklediğinden iyiydi.`, fx: { item: 'random' } } },
      { label: 'Ticaret yapmadan ayrıl', icon: 'no', tags: PASS,
        win: { text: `Pazarın gürültüsü arkanda kaldı.`, fx: {} } },
    ],
  },
  {
    id: 'EVT_X1_F03', cat: 'fortune', title: 'Hasarlı Tüccarın Son Pazarlığı', tier: 2, regions: [2, 3, 4, 5], tags: ['trade', 'wreck'], weight: 8,
    art: { sky: 'overcast', sea: 'choppy', obj: ['halfSunk'] },
    text: `Yan yatmış bir ticaret gemisinin kaptanı el salladı: "Mallarımı yarı fiyatına alın, yeter ki dibe gitmesin!"`,
    options: [
      { label: 'Değerli malı %60 fiyatına al', icon: 'coin', req: { cargoFree: 1 },
        win: { text: `Porselen sandıkları halatla gemine aktardınız. Kaptan teşekkür etti.`, fx: { x1: { buyAt: { good: 'GOOD_PORCELAIN', qty: 2, pct: 60 } } } } },
      { label: 'Tamir yardımı (30 altın)', icon: 'hammer', cost: { gold: 30 },
        win: { text: `Tayfan karşı gemiye geçip deliği yamadı. Kaptan gözyaşlarıyla teşekkür etti.`, fx: { xp: 20, x1: { rep: { guild: 1 } } } } },
      { label: 'Riskli kargo kurtarma', icon: 'crate', chance: 60, tags: ['loot', 'maneuver'],
        win: { text: `Batmakta olan güverteden üç sandık kurtardın.`, fx: { cargoAdd: { good: 'GOOD_WINE', qty: 2 }, xp: 5 } },
        lose: { text: `Hasarlı güverte çöktü; tayfan güç bela geri döndü ve gemin bordaya sürtündü.`, fx: { hull: -15 } } },
    ],
  },
  {
    id: 'EVT_X1_F04', cat: 'fortune', title: 'Yanlış Teslimat', tier: 1, regions: [2, 3, 4, 5], tags: ['trade', 'chest'], weight: 8,
    art: { sky: 'day', sea: 'calm', obj: ['boat', 'chest'] },
    text: `Bir nakliye teknesi yanaştı. Kâtip seni başka bir tüccarla karıştırıp mühürlü, ağır bir sandığı güverteye bıraktı.`,
    options: [
      { label: 'Sandığı geri ver', icon: 'hand',
        win: { text: `Kâtibi geri çağırıp sandığı teslim ettin. Adam hem utandı hem minnettar kaldı.`, fx: { xp: 15, ach: 'ACH_X1_RETURNED', x1: { later: 'EVT_X1_F04_THANKS', rep: { guild: 1 } } } } },
      { label: 'Kabul et', icon: 'chest', req: { cargoFree: 1 },
        win: { text: `Sandığı sessizce ambara indirdin. İçinde değerli antikalar vardı.`, fx: { cargoAdd: { good: 'GOOD_ANTIQUE', qty: 1 }, x1: { later: 'EVT_X1_F04_GUARDS' } } } },
      { label: 'Mührü incele', icon: 'seal',
        win: { text: `Mühür bir lonca evinindi; mühürden fiyat listesinin bir parçası okunuyordu. Sandığı geri verdin ama bilgiyi aklında tuttun.`, fx: { goldR: 20, reveal: 1 } } },
    ],
  },
  {
    id: 'EVT_X1_F05', cat: 'repair', title: 'Denizin Ortasındaki Yüzer Tersane', tier: 2, regions: [2, 3, 4], tags: ['repair', 'shipyard'], weight: 8,
    art: { sky: 'day', sea: 'calm', obj: ['floatingYard'] },
    text: `Kalaslardan ve iskelelerden yapılmış devasa bir yüzer atölye yaklaştı. Ustalar çekiçlerini sallıyordu.`,
    options: [
      { label: '65 altına +30 hull', icon: 'hammer', cost: { gold: 65 },
        win: { text: `Ustalar köprüyü kurup gemine geçti ve hasarlı tahtaları değiştirdi.`, fx: { hull: 30 } } },
      { label: '90 altına gövde kaplaması', icon: 'shield', cost: { gold: 90 }, hint: 'Sonraki seyirde ilk hasarı 10 azaltır',
        win: { text: `Gövdeye ek bir kaplama çakıldı. Bir sonraki darbeyi o karşılayacak.`, fx: { x1: { once: 'hullGuard' } } } },
      { label: 'Direği yeniden kur (40 altın)', icon: 'sail', cost: { gold: 40 }, show: { flag: 'mastBroken' },
        win: { text: `Ustalar yamalı direğini söküp yenisini dikti. Gemi hafifledi.`, fx: { hull: 15, x1: { mem: { mastBroken: false } } } } },
      { label: 'Ayrıl', icon: 'no', tags: PASS,
        win: { text: `Ustalara iyi işler diledin.`, fx: {} } },
    ],
  },
  {
    id: 'EVT_X1_F06', cat: 'fortune', title: 'Gümrüksüz Ticaret Konvoyu', tier: 2, regions: [2, 3, 4, 5], tags: ['trade', 'convoy'], weight: 8,
    art: { sky: 'day', sea: 'calm', obj: ['convoy'] },
    text: `Dört geminin oluşturduğu bir konvoy paralel seyre geçti. Kaptan, gümrüksüz geçici bir pazar kurduklarını söyledi.`,
    options: [
      { label: 'İndirimli mal al', icon: 'crate', req: { cargoFree: 1 },
        win: { text: `İki tekne arasında sandıklar el değiştirdi; fiyat limandakinden %15 aşağıdaydı.`, fx: { x1: { buyAt: { good: 'GOOD_SPICE', qty: 2, pct: 85 } } } } },
      { label: 'Kargodan mal sat', icon: 'coin', req: { cargoGoods: ANY },
        win: { text: `Konvoy malını %10 avantajlı fiyatla aldı.`, fx: { x1: { sellBest: 1.1 } } } },
      { label: 'Katılmadan ilerle', icon: 'no', tags: PASS,
        win: { text: `Konvoya selam verip yoluna devam ettin.`, fx: {} } },
    ],
  },

  // ════════ C. GİZEM VE KEŞİF ════════
  {
    id: 'EVT_X1_M01', cat: 'mystery', title: 'Denizin Aynası', tier: 2, regions: [2, 3, 4, 5], tags: ['mirror'], weight: 7,
    art: { sky: 'eerie', sea: 'calm', obj: ['mirror'] },
    text: `Deniz cam gibi duruldu. Suyun yüzeyindeki geminin yansıması yavaşça… başka bir yöne döndü.`,
    options: [
      { label: 'Yansımaya dokun', icon: 'hand', chance: 60, tags: ['explore'],
        win: { text: `Parmakların suya değdiği an yansıma dağıldı ve derinlerden ışıklı bir eşya yükseldi.`, fx: { item: 'rare', xpExplore: 10 } },
        lose: { text: `Yansıma kırıldı; gemi sanki görünmez bir şeye çarpmış gibi sarsıldı.`, fx: { hull: -15 } } },
      { label: 'Uzaktan gözlemle', icon: 'eye', tags: PASS,
        win: { text: `Yansıma sana el sallayıp kayboldu. Gördüklerini seyir defterine yazdın.`, fx: { xp: 15 } } },
      { label: 'Suya bir işaret bırak', icon: 'amulet',
        win: { text: `Suya küçük bir gümüş bıraktın. Yansıma eğilip selam verdi.`, fx: { luckBuff: { add: 10, events: 1 } } } },
    ],
  },
  {
    id: 'EVT_X1_M02', cat: 'mystery', title: 'Haritasız Deniz Feneri', tier: 2, regions: [2, 3, 4, 5], tags: ['fog', 'lighthouse'], weight: 7,
    art: { sky: 'fog', sea: 'calm', obj: ['lighthouse'], fx: ['fog'] },
    text: `Yoğun sisin içinden hiçbir haritada olmayan bir fener çıktı. Işığı yavaşça dönüyordu.`,
    options: [
      { label: 'Feneri takip et', icon: 'compass', tags: ['navigate'],
        win: { text: `Işığın gösterdiği yönü izledin; önündeki suların sırlarını gördün.`, fx: { reveal: 2, xp: 5 } } },
      { label: 'Kıyıya yanaşıp araştır', icon: 'boat',
        win: { text: `Sandalla iskeleye çıktın. Kapının tokmağında üç kısa çizik vardı… biri yardım bekliyordu.`, fx: { xp: 20, startChain: 'CH_X1_LIGHTKEEPER' } } },
      { label: 'Uzaklaş', icon: 'no', tags: PASS,
        win: { text: `Fener sisin içinde söndü.`, fx: {} } },
    ],
  },
  {
    id: 'EVT_X1_M03', cat: 'mystery', title: 'Suyun Altındaki Orman', tier: 2, regions: [3, 4, 5], tags: ['deep', 'underwater'], weight: 7,
    art: { sky: 'day', sea: 'calm', obj: ['kelpForest'] },
    text: `Berrak suyun altında ağaçlara benzeyen, mavi mavi parlayan dev yapılar uzanıyordu.`,
    options: [
      { label: 'Mira ile dalış', icon: 'dive', req: { crew: 'CREW_MIRA' },
        win: { text: `Mira parlayan dalların arasında süzüldü ve kökler arasından bir eşya çıkardı.`, fx: { item: 'rare', xpExplore: 15, x1: { once: 'deepDone' } } } },
      { label: 'Riskli araştırma', icon: 'dive', chance: 55, tags: ['explore'],
        win: { text: `Dalgıç ipini dalların arasında gezdirdin; dibinden ışıklı bir kutu çıktı.`, fx: { item: 'random', xpExplore: 10, x1: { once: 'deepDone' } } },
        lose: { text: `Dallar halatı sardı ve gemiyi aşağı çekti; omurga sarsıldı.`, fx: { hull: -20 } } },
      { label: 'Derin araştırma ekipmanı', icon: 'book', req: {}, show: { upgrade: 'UPG_X1_DEEP_RESEARCH' }, tags: ['explore'],
        win: { text: `Derin deniz notlarına göre ormanın kalbini buldun.`, fx: { item: 'rare', xpExplore: 20, x1: { once: 'deepDone' } } } },
      { label: 'Gözlemle', icon: 'eye', tags: PASS,
        win: { text: `Işıklı ormanı yukarıdan çizdin.`, fx: { xp: 15 } } },
    ],
  },
  {
    id: 'EVT_X1_M04', cat: 'mystery', title: 'Gökyüzünden Düşen Yıldız', tier: 2, regions: [2, 3, 4, 5], tags: ['night', 'meteor'], weight: 7,
    art: { sky: 'night', sea: 'dark', obj: ['meteor'] },
    text: `Gece göğü yarıldı. Kuyruklu bir ışık topu geminin ilerisine, suya çakıldı.`,
    options: [
      { label: 'Parçaları topla', icon: 'net', chance: 65, tags: ['explore'],
        win: { text: `Ağla toplanan parçalar hâlâ sıcaktı ve tuhaf bir metalle parlıyordu.`, fx: { goldR: 120, xp: 15 } },
        lose: { text: `Kaynayan sudan yükselen bir patlama gövdeyi sarstı.`, fx: { hull: -15 } } },
      { label: 'Uzaktan gözlemle', icon: 'eye', tags: PASS,
        win: { text: `Suyun yüzeyindeki ışıklar sönene kadar izledin.`, fx: { xp: 15 } } },
      { label: 'Uzaklaş', icon: 'no', tags: PASS,
        win: { text: `Rotanı değiştirdin.`, fx: {} } },
    ],
  },
  {
    id: 'EVT_X1_M05', cat: 'mystery', title: 'Karanlıktaki Dev Göz', tier: 3, regions: [4, 5], tags: ['deep', 'eye'], weight: 6,
    art: { sky: 'night', sea: 'dark', obj: ['seaEye'] },
    text: `Geminin hemen altında, suyun derinliklerinde ev büyüklüğünde bir göz açıldı ve seni izlemeye başladı.`,
    options: [
      { label: 'Gözle iletişim kur', icon: 'talk', chance: 50, tags: ['explore'], bonus: [{ crew: 'CREW_MAGDA', add: 30 }],
        win: { text: `Göz yavaşça kırpıştı. Suya ışıktan bir iz çizdi ve derinliklere çekildi.`, fx: { xpExplore: 20, x1: { mem: { eyeSeen: true } } } },
        lose: { text: `Göz kapandı ve güçlü bir dalga gemiyi savurdu.`, fx: { hull: -20 } } },
      { label: 'Bir kargo birimi bırak', icon: 'crate', chance: 60, req: { cargoGoods: ANY },
        win: { text: `Sandık karanlığa gömüldü. Bir an sonra yerine ışıklı bir armağan yükseldi.`, fx: { item: 'rare', x1: { cargoUse: 1, mem: { eyeSeen: true } } } },
        lose: { text: `Sandık battı ve göz kayboldu. Armağan yoktu.`, fx: { x1: { cargoUse: 1 } } } },
      { label: 'Sessizce uzaklaş', icon: 'no', tags: PASS,
        win: { text: `Nefesinizi tutarak uzaklaştınız.`, fx: { xp: 5 } } },
    ],
  },

  // ════════ D. BÜYÜK FELAKETLER ════════
  {
    id: 'EVT_X1_DIS01', cat: 'disaster', title: 'Ters Akan Akıntı', tier: 2, regions: [3, 4, 5], tags: ['current'], weight: 6,
    art: { sky: 'overcast', sea: 'rough', obj: ['reverseCurrent'] },
    text: `Deniz aniden tersine aktı. Gemi geriye, kayalık bir kıyıya doğru sürüklenmeye başladı.`,
    options: [
      { label: 'Akıntıya karşı mücadele', icon: 'sail', chance: 65, tags: ['maneuver'],
        win: { text: `Tüm yelkenler ve tüm kollar! Gemi akıntıyı yenip açığa çıktı.`, fx: { xp: 10 } },
        lose: { text: `Akıntı kazandı; gemi kayalara sürtündü ve rotanı uzattı.`, fx: { hull: -15, extra: 1 } } },
      { label: 'Pusulayla güvenli yolu bul', icon: 'pocketCompass', req: { item: 'ITEM_SEXTANT' },
        win: { text: `Yıldızları okuyup akıntının zayıf kolunu buldun.`, fx: { xp: 10 } } },
      { label: 'Bekle', icon: 'anchor', tags: PASS,
        win: { text: `Demir attın; akıntı sakinleşene kadar bekledin.`, fx: { x1: { delay: 25 } } } },
    ],
  },
  {
    id: 'EVT_X1_DIS02', cat: 'disaster', title: 'Deniz Tabanından Gelen Kabarcıklar', tier: 2, regions: [3, 4, 5], tags: ['gas'], weight: 6,
    art: { sky: 'overcast', sea: 'rough', obj: ['gasBubbles'] },
    text: `Deniz kaynamaya başladı. Dipten yükselen dev kabarcıklar gemiyi bir yana bir yana yatırıyordu. Havada keskin bir koku vardı.`,
    options: [
      { label: 'Bütün ateşleri söndür ve bekle', icon: 'bucket', tags: PASS,
        win: { text: `Fenerler, ocaklar, pipolar… hepsi söndü. Gaz dağılana kadar beklediniz.`, fx: { x1: { delay: 20 } } } },
      { label: 'Hızla uzaklaş', icon: 'sail', chance: 65, tags: ['escape'],
        win: { text: `Yelkenler doldu; köpüren sulardan sıyrıldın.`, fx: { xp: 5 } },
        lose: { text: `Bir kıvılcım gazı tutuşturdu! Alev topu gövdeyi yaladı.`, fx: { hull: -30 } } },
      { label: 'Surge ile güvenli rota', icon: 'compass', req: { crew: 'CREW_SURGE' },
        win: { text: `Surge köpüğün sakin kalan şeridini gördü ve gemiyi oradan geçirdi.`, fx: { xp: 10 } } },
    ],
  },
  {
    id: 'EVT_X1_DIS03', cat: 'disaster', title: 'Siyah Yağmur', tier: 3, regions: [4, 5], tags: ['storm', 'blackrain'], weight: 5,
    art: { sky: 'ash', sea: 'dark', obj: ['blackRain'] },
    text: `Gökyüzünden yapışkan, siyah damlalar düşmeye başladı. Değdiği her şeyi kararttı.`,
    options: [
      { label: 'Kargoları ört', icon: 'crate',
        win: { text: `Branda ve yelken bezleriyle sandıkları örttünüz. Gövde kirlendi ama mallar kurtuldu.`, fx: { hull: -5, x1: { mem: { blackRain: true } } } } },
      { label: 'Kaçmaya çalış', icon: 'sail', chance: 60, tags: ['escape'],
        win: { text: `Siyah bulutun kenarından sıyrıldın.`, fx: { xp: 5 } },
        lose: { text: `Bulut peşini bırakmadı; çuvallar ve gövde siyaha boyandı.`, fx: { cargoSpoil: 2, hull: -15, x1: { mem: { blackRain: true } } } } },
      { label: 'Yolculuğa devam et', icon: 'no', chance: 45,
        win: { text: `Yağmur hafifti; şanslıydın.`, fx: {} },
        lose: { text: `Siyah yağmur kargoya ve gövdeye işledi.`, fx: { cargoSpoil: 2, hull: -15, x1: { mem: { blackRain: true } } } } },
    ],
  },
  {
    id: 'EVT_X1_DIS04', cat: 'disaster', title: 'Sürüklenen Alevli Enkaz', tier: 3, regions: [4, 5], tags: ['fire', 'wreck', 'mast'], weight: 5,
    art: { sky: 'night', sea: 'dark', obj: ['burningWreck'] },
    text: `Alevler içindeki dev bir savaş gemisi enkazı akıntıyla sana doğru sürükleniyordu. Güvertesinde biri el sallıyordu.`,
    options: [
      { label: 'Güverte Topu ile parçala', icon: 'cannon', req: { item: 'ITEM_CANNON' }, chance: 80, tags: ['combat'],
        win: { text: `Güllelerle enkazın pruvasını kopardın; alevli gövde rotasından çıktı.`, fx: { xp: 10 } },
        lose: { text: `Enkaz durmadı; yanan direk gövdene devrildi.`, fx: { hull: -25 } } },
      { label: 'Ani manevra', icon: 'sail', chance: 65, tags: ['maneuver'],
        win: { text: `Dümeni kırdın; enkaz bordanın birkaç kulaç ötesinden geçti.`, fx: { xp: 5 } },
        lose: { text: `Çarpışma! Alevler gemine sıçradı.`, fx: { hull: -35 } } },
      { label: 'Kazazedeyi kurtar', icon: 'rope', chance: 45, tags: ['maneuver'],
        win: { text: `Halatla karşı gemiye geçip yanık bir subayı kurtardın. Teşekkür olarak madalyasını verdi.`, fx: { xp: 40, item: 'rare', x1: { rep: { crown: 1 } } } },
        lose: { text: `Kazazedeyi çektin ama alevler gemini de sardı.`, fx: { hull: -30, xp: 20 } } },
    ],
  },

  // ════════ E. TAMİR VE DAYANIKLILIK ════════
  {
    id: 'EVT_X1_REPAIR01', cat: 'repair', title: 'Sürüklenen Katran Fıçıları', tier: 1, regions: [1, 2, 3, 4], tags: ['repair', 'barrels'], weight: 8,
    art: { sky: 'day', sea: 'calm', obj: ['barrels'] },
    text: `Suda reçine ve katranla dolu fıçılar sallanıyordu. Bir tersanenin kaybettiği malzeme olmalıydı.`,
    options: [
      { label: 'Topla ve onar', icon: 'hammer',
        win: { text: `Fıçıları çekip katranı kaynattınız; gövdenin çatlakları doldu.`, fx: { hull: 20 } } },
      { label: 'Groot ile onar', icon: 'hammer', req: { crew: 'CREW_GROOT' },
        win: { text: `Groot katranı ustaca işleyip gövdeyi yeniden kalafatladı.`, fx: { hull: 30 } } },
      { label: 'Siyah yağmur izlerini temizle', icon: 'bucket', show: { flag: 'blackRain' },
        win: { text: `Katranla siyah yağmurun kirini söküp gövdeyi baştan kaplamadınız.`, fx: { hull: 35, x1: { mem: { blackRain: false } } } } },
      { label: 'Malzemeyi sat', icon: 'coin',
        win: { text: `Fıçıları bir sonraki limanda satmak üzere ayırdın.`, fx: { gold: 40 } } },
    ],
  },
  {
    id: 'EVT_X1_REPAIR02', cat: 'repair', title: 'Denizci Kardeşliği Yardımı', tier: 2, regions: [2, 3, 4, 5], tags: ['repair', 'brotherhood'], weight: 8,
    art: { sky: 'day', sea: 'calm', obj: ['merchantShip'] },
    text: `Denizci Kardeşliği'nin mavi flamalı yardım gemisi yanaştı. Ustaları tahtalar ve aletlerle hazırdı.`,
    options: [
      { label: '70 altına +35 hull', icon: 'coin', cost: { gold: 70 },
        win: { text: `Ustalar köprüden geçip gövdeni sağlamlaştırdı.`, fx: { hull: 35 } } },
      { label: '1 Kereste karşılığında +25 hull', icon: 'crate', req: { cargoGood: 'GOOD_TIMBER' },
        win: { text: `Kerestene karşılık işçilik verdiler.`, fx: { hull: 25, cargoRemove: 'GOOD_TIMBER', cargoRemoveQty: 1 } } },
      { label: 'Onlara yardım et', icon: 'hand',
        win: { text: `Senin tayfan onların çatlak omurgasını yamadı. "Bunu unutmayacağız," dediler.`, fx: { xp: 20, x1: { later: 'EVT_X1_REPAIR02_RETURN' } } } },
    ],
  },

  // ════════ F. MÜRETTEBAT VE HAYVANLAR ════════
  {
    id: 'EVT_X1_CREW01', cat: 'fortune', title: 'Güvertede Kutlama', tier: 1, regions: [1, 2, 3, 4], tags: ['celebration'], minCrew: 2, weight: 7,
    art: { sky: 'dusk', sea: 'calm', obj: ['deckView'] },
    text: `Tayfalar başarılı geçen yolculuğu kutlamak istiyordu. Biri bir şişe çıkarmış, biri çoktan şarkıya başlamıştı.`,
    options: [
      { label: 'Yemekli kutlama (25 altın)', icon: 'pot', cost: { gold: 25 },
        win: { text: `Kazan kaynadı, şarkılar yükseldi. Gece boyunca güverte güldü.`, fx: { xp: 15, luckBuff: { add: 5, events: 2 } } } },
      { label: 'Sade kutlama', icon: 'talk',
        win: { text: `Birkaç şarkı, birkaç hikâye. Yetti de arttı.`, fx: { xp: 8 } } },
      { label: 'Ertele', icon: 'no', tags: PASS,
        win: { text: `"Limanda kutlarız," dedin. Homurtular yükseldi.`, fx: {} } },
    ],
  },
  {
    id: 'EVT_X1_PET01', cat: 'danger', title: "Zıpır'ın Sessiz Uyarısı", tier: 2, regions: [2, 3, 4, 5], tags: ['pet', 'underwater'], cond: { pet: 'PET_ZIPIR' }, weight: 7,
    art: { sky: 'overcast', sea: 'dark', obj: ['deckView'] },
    text: `Zıpır güvertenin ortasında durdu, gözlerini açıp suya baktı ve kıpırdamadan oturdu. Zıpır'ın gözlerini açması hiç iyiye işaret değildi.`,
    options: [
      { label: "Zıpır'a güven", icon: 'cat',
        win: { text: `Yelkenleri indirip rotayı değiştirdin. Az sonra az önce geçeceğin yerde dev bir girdap belirdi. Zıpır yeniden gözlerini kapattı.`, fx: { xp: 10, ach: 'ACH_X1_SILENT_FRIEND', x1: { mem: { zipirWarn: true } } } } },
      { label: 'Geminin altını araştır', icon: 'dive', chance: 60, tags: ['explore'],
        win: { text: `Dalgıç ipini salladın; geminin altındaki karanlık gölge eski bir hazine sandığıydı.`, fx: { goldR: 60 } },
        lose: { text: `Gölge kıpırdadı. Dev bir kuyruk gövdeye çarptı.`, fx: { hull: -12 } } },
      { label: 'Uyarıyı önemseme', icon: 'no',
        win: { text: `Zıpır'a gülüp geçtin. Az sonra gemi suyun altındaki bir şeye bindi.`, fx: { hull: -15 } } },
    ],
  },

  // ════════ Dünya Hafızası takip sahneleri (bağımsız event sayılmaz) ════════
  {
    id: 'EVT_X1_F04_THANKS', cat: 'fortune', pool: false, title: 'Teşekkür Hediyesi', tier: 1, tags: ['memory'],
    art: { sky: 'day', sea: 'calm', obj: ['boat'] },
    text: `Geçen sefer sandığını geri verdiğin nakliye teknesi yanına sokuldu. Kâtip bu kez bir hediye getirmişti.`,
    options: [{ label: 'Hediyeyi kabul et', icon: 'gift', win: { text: `"Dürüst tüccar bu denizlerde az bulunur," dedi ve bir kese uzattı.`, fx: { goldR: 50, xp: 10 } } }],
  },
  {
    id: 'EVT_X1_F04_GUARDS', cat: 'danger', pool: false, title: 'Muhafız Hesaplaşması', tier: 2, tags: ['inspection', 'memory'],
    art: { sky: 'dusk', sea: 'choppy', obj: ['warship'] },
    text: `Lonca muhafızlarının gemisi rotanı kesti. "Yanlış teslim edilen bir sandık arıyoruz," dedi subay.`,
    options: [
      { label: 'Sandığı ya da bedelini ver', icon: 'coin', win: { text: `Muhafızlar bedelini aldı ve kayıtlara "iade" yazdı.`, fx: { gold: -60 } } },
      { label: 'Kaç', icon: 'sail', chance: 55, tags: ['escape'],
        win: { text: `Muhafızları atlattın ama lonca adını not etti.`, fx: { x1: { rep: { guild: -1 } } } },
        lose: { text: `Yetiştiler; ceza ve hasarla ayrıldın.`, fx: { gold: -40, hull: -15, x1: { rep: { guild: -1 } } } } },
    ],
  },
  {
    id: 'EVT_X1_REPAIR02_RETURN', cat: 'repair', pool: false, title: 'Kardeşlik Geri Döndü', tier: 1, tags: ['memory', 'repair'],
    art: { sky: 'day', sea: 'calm', obj: ['merchantShip'] },
    text: `Mavi flamalı tanıdık bir gemi ufukta belirdi: omurgasını yamadığın Kardeşlik gemisi! Bu kez yardım etme sırası onlardaydı.`,
    options: [{ label: 'Yardımlarını kabul et', icon: 'hammer', win: { text: `Ustaları gemine geçip gövdeni baştan sona elden geçirdi.`, fx: { hull: 30, xp: 10 } } }],
  },

  // ════════ Hikâye Yankıları (önceki run'lardan izler) ════════
  {
    id: 'EVT_X1_ECHO_RED_CAPTAIN', cat: 'special', pool: false, title: 'Kızıl Amblem', tier: 1, tags: ['echo', 'pirate'],
    art: { sky: 'dusk', sea: 'calm', obj: ['pirateShip'] },
    text: `Uzaktan geçen bir korsan gemisinin yelkeninde tanıdık bir amblem vardı: Kızıl Kaptan'ın işareti. Gemi seni görünce bayrağını indirip selam verdi.`,
    options: [{ label: 'Selamı karşıla', icon: 'flag', win: { text: `Eski bir hikâyenin yankısı. Deniz bazı şeyleri unutmaz.`, fx: { xp: 10, x1: { echo: 'CH_X1_RED_CAPTAIN' } } } }],
  },
  {
    id: 'EVT_X1_ECHO_GUILD_SEAL', cat: 'special', pool: false, title: 'Eski Bir Mührün Hikâyesi', tier: 1, tags: ['echo', 'trade'],
    art: { sky: 'day', sea: 'calm', obj: ['merchantShip'] },
    text: `Bir ticaret gemisinin kaptanı bağırdı: "Sen o mühür işini çözen tüccar değil misin? Bütün loncalar hâlâ seni konuşuyor!"`,
    options: [{ label: 'Hikâyeyi dinle', icon: 'talk', win: { text: `Anlatılan hikâye seninkine benziyordu… ama biraz abartılmıştı.`, fx: { xp: 10, x1: { echo: 'CH_X1_GUILD_SEAL' } } } }],
  },
  {
    id: 'EVT_X1_ECHO_LIGHTKEEPER', cat: 'special', pool: false, title: 'Feneri Anlatan Denizci', tier: 1, tags: ['echo', 'fog'],
    art: { sky: 'fog', sea: 'calm', obj: ['boat'], fx: ['fog'] },
    text: `Sisin içinden bir sandal yaklaştı. Yaşlı bir denizci, bir zamanlar sönmüş bir feneri yeniden yakan bir kaptanın hikâyesini anlattı.`,
    options: [{ label: 'Dinle', icon: 'lantern', win: { text: `Sis dağılırken uzakta bir fenerin ışığı göz kırptı.`, fx: { xp: 10, x1: { echo: 'CH_X1_LIGHTKEEPER' } } } }],
  },
  {
    id: 'EVT_X1_ECHO_GROOT_LEGACY', cat: 'special', pool: false, title: 'Atölyenin Hatırası', tier: 1, tags: ['echo', 'repair'],
    art: { sky: 'day', sea: 'calm', obj: ['timber'] },
    text: `Dalgalar güverteye üzerinde eski bir ustanın işareti olan küçük, oyulmuş bir tahta parçası bıraktı.`,
    options: [{ label: 'Hatırayı sakla', icon: 'hammer', win: { text: `Tahtayı dümenin yanına çaktın. Bazı işaretler yolculuğa eşlik eder.`, fx: { xp: 10, x1: { echo: 'CH_X1_GROOT_LEGACY' } } } }],
  },

  // ════════ Sözleşme sahneleri (görev sunumu; event sayısına dahil değil) ════════
  {
    id: 'CT_X1_DELIVER', cat: 'special', pool: false, title: 'Sözleşme Teslimatı', tier: 1, tags: ['contract'],
    art: { sky: 'day', sea: 'calm', obj: ['dock'] },
    text: `Sözleşmenin temsilcisi rıhtımda seni bekliyordu.`,
    options: [
      { label: 'Teslim et', icon: 'crate', win: { text: `Temsilci mührü kontrol etti, teslimatı kayda geçirdi ve ödemeyi yaptı.`, fx: { x1: { contract: 'deliver' } } } },
      { label: 'Doc Vargas ile yardım dağıt', icon: 'heart', req: { crew: 'CREW_VARGAS' }, show: { contract: 'CONTRACT_X1_RELIEF' },
        win: { text: `Doc Vargas yardım sandığını bizzat açıp hastaları tek tek muayene etti. Ada halkı onu unutmayacak.`, fx: { xp: 15, x1: { contract: 'deliver' } } } },
    ],
  },
  {
    id: 'CT_X1_RENDEZVOUS', cat: 'special', pool: false, title: 'Teslimat Buluşması', tier: 1, tags: ['contract'],
    art: { sky: 'day', sea: 'calm', obj: ['merchantShip'] },
    text: `Sözleşmenin süresi dolmak üzereydi. Fraksiyonun bir teslimat gemisi buluşma noktasında bekliyordu.`,
    options: [
      { label: 'Yükü aktar (%70 ödül)', icon: 'crate', win: { text: `Sandık halatla karşı gemiye geçti. Ödemenin bir kısmı kesildi ama söz tutuldu.`, fx: { x1: { contract: 'deliverAlt' } } } },
      { label: 'Limana kadar dene', icon: 'sail', tags: PASS, win: { text: `Buluşmayı reddedip limana yetişmeye karar verdin.`, fx: {} } },
    ],
  },
  {
    id: 'CT_X1_SALVAGE', cat: 'special', pool: false, title: 'Batıktaki Kayıp Kayıtlar', tier: 1, tags: ['contract', 'wreck', 'deep'],
    art: { sky: 'overcast', sea: 'calm', obj: ['wreck'] },
    text: `Lonca haritasındaki işaret buradaydı: suyun altında yan yatmış bir ticaret gemisinin gölgesi.`,
    options: [
      { label: 'Dalgıç gönder', icon: 'dive', chance: 70, tags: ['explore'], bonus: [{ crew: 'CREW_MIRA', add: 30 }],
        win: { text: `Dalgıç batığın kamarasına girdi ve mühürlü kayıt sandığıyla yüzeye çıktı.`, fx: { x1: { contract: 'found' } } },
        lose: { text: `Batık çatırdayıp kaydı; dalgıç güç bela çıktı ve gemi sarsıldı.`, fx: { hull: -10 } } },
      { label: 'Halatla çek', icon: 'rope', chance: 55, tags: ['maneuver'],
        win: { text: `Kanca sandığın kulpuna takıldı; yavaşça yukarı çektiniz.`, fx: { x1: { contract: 'found' } } },
        lose: { text: `Halat koptu.`, fx: {} } },
      { label: 'Vazgeç', icon: 'no', tags: PASS, win: { text: `Sözleşmeden vazgeçtin.`, fx: { x1: { contract: 'fail' } } } },
    ],
  },
  {
    id: 'CT_X1_ESCORT_DONE', cat: 'special', pool: false, title: 'Konvoy Limanda', tier: 1, tags: ['contract'],
    art: { sky: 'day', sea: 'calm', obj: ['dock'] },
    text: `Eşlik ettiğin kraliyet nakliye gemisi limana güvenle girdi. Kaptanı sana doğru bayrağını kaldırdı.`,
    options: [{ label: 'Eskortu tamamla', icon: 'flag', win: { text: `Muhafız subayı ödemeyi yaptı ve selam verdi.`, fx: { x1: { contract: 'escortDone' } } } }],
  },
];

/** 25 bağımsız event kimliği (Hikâye Avcısı başarımı ve testler için) */
export const X1_STANDALONE = X1_EVENTS.filter((e) => e.id.startsWith('EVT_X1_') && e.pool !== false).map((e) => e.id);
