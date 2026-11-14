// Özel eventler (GDD Bölüm 10), tayfa toplama eventleri EVT_CREW_01–05 (KARAR: GDD'de yazılmamıştı)
// ve hayvanlara özel eventler.

export const SPECIAL_EVENTS = [
  {
    id: 'EVT_SPECIAL_ZIPIR_TARCIN', cat: 'special', pool: false, title: 'Rıhtımın Ortasında', tier: 1, tags: ['special'],
    art: { sky: 'fog', sea: 'calm', obj: ['dock', 'dockPets'], fx: ['mist'] },
    text: `Sabah sisi rıhtımın tahtalarını ıslatmıştı. İskelenin ortasında kırmızı bandanalı siyah bir köpekle gri bir kedi yan yana oturuyordu. Köpek kuyruğunu salladı; kedinin gözleri kapalıydı ama başını tam sana çevirdi.`,
    options: [
      { label: "Tarçın'ı al", icon: 'dog',
        win: { text: `Köpeğe elini uzattın. Hemen yanına koştu, bandanası rüzgârda dalgalandı. Adının Tarçın olduğunu boynundaki küçük madalyondan öğrendin. Gri kedi rıhtımda kaldı ve sessizce arkanızdan baktı.`, fx: { pet: 'PET_TARCIN', special: 'tookTarcin' } } },
      { label: "Zıpır'ı al", icon: 'cat',
        win: { text: `Gri kediyi kucağına aldın. Hiç ürkmedi; sanki seni çoktan tanıyordu. Tasmasındaki isim Zıpır'dı. Siyah köpek rıhtımda kaldı ve kuyruğunu yavaşça sallayarak arkanızdan baktı.`, fx: { pet: 'PET_ZIPIR', special: 'tookZipir' } } },
      { label: 'Geç git', icon: 'no', hint: 'Bazen en zor şey devam etmektir.', tags: ['pass'],
        win: { text: `Bir süre ikisine baktın, sonra gemine döndün. Bazen en zor şey devam etmektir.`, fx: { special: 'skipped' } } },
    ],
  },
  {
    id: 'EVT_SPECIAL_ZIPIR_ALONE', cat: 'special', pool: false, title: "Zıpır'ı Bulma", tier: 1, tags: ['special', 'night'],
    art: { sky: 'night', sea: 'calm', obj: ['moon', 'catBoat'] },
    text: `Gece, ay ışığı denizi gümüşe boyamıştı. Tarçın birden pruvaya koştu ve havlamaya başladı. Sürüklenen küçük bir sandalın içinde gri bir kedi oturuyordu; gözleri kapalıydı ama yüzünü tam size çevirmişti.`,
    options: [
      { label: 'Sandala uzan', icon: 'hand',
        win: { text: `Sandala uzanıp kediyi kucağına aldın. Tarçın kuyruğunu öyle hızlı salladı ki bütün gövdesi sallandı. Gri kedi, Zıpır, onun yanına kıvrıldı.`, fx: { pet: 'PET_ZIPIR', special: 'reunite' } } },
      { label: 'Geç', icon: 'no', tags: ['pass'], hint: "Bu rota boyunca Tarçın'ın Erken Uyarısı çalışmaz",
        win: { text: `Sandal karanlıkta uzaklaştı. Tarçın bütün gece pruvada oturdu ve o rota boyunca kimseyi uyarmadı.`, fx: { warnOff: true, special: 'declinedSecond' } } },
    ],
  },
  {
    id: 'EVT_SPECIAL_TARCIN_ALONE', cat: 'special', pool: false, title: "Tarçın'ı Bulma", tier: 1, tags: ['special', 'fog'],
    art: { sky: 'fog', sea: 'calm', obj: ['dogRocks'], fx: ['fog'] },
    text: `Sisli bir koyun girişindeydin. Zıpır güvertenin ortasına oturmuş, kıpırdamadan bekliyordu. Kıyıdaki kayalıkta siyah bir köpek oturuyordu; boynunda solmuş kırmızı bir bandana vardı.`,
    options: [
      { label: 'Köpeği al', icon: 'dog',
        win: { text: `Bir sandal indirdin. Köpek suya atlayıp yüzerek sana geldi. Güverteye çıkar çıkmaz Zıpır'ın yanına koştu ve onu kokladı. Zıpır gözlerini açmadan başını ona yasladı.`, fx: { pet: 'PET_TARCIN', special: 'reunite' } } },
      { label: 'Geç', icon: 'no', tags: ['pass'], hint: 'Bu rotada Şans eventi ağırlığı −%5',
        win: { text: `Koydan ayrılırken köpek arkanızdan uzun uzun baktı. Zıpır o gün hiç kıpırdamadı.`, fx: { fortunePenalty: 5, special: 'declinedSecond' } } },
    ],
  },
];

export const CREW_EVENTS = [
  {
    id: 'EVT_CREW_01', cat: 'fortune', title: 'Kazazede', tier: 1, tags: ['crew', 'rescue'],
    art: { sky: 'day', sea: 'calm', obj: ['raft'] },
    text: `Tek başına bir salın üzerinde, güneşten kavrulmuş bir yabancı gördün. Seni görünce son gücüyle el salladı.`,
    options: [
      { label: 'Gemiye al', icon: 'hand', hint: 'Bedava tayfa adayı',
        win: { text: `Yabancıyı güverteye çektiniz. Kendine gelince becerilerini anlattı ve sana katılmayı teklif etti.`, fx: { crewOffer: 1, xp: 10 } } },
      { label: 'Su ve erzak ver', icon: 'heart',
        win: { text: `Ona su, erzak ve bir pusula verdin. Yabancı minnetle en yakın adaya kürek çekti.`, fx: { xp: 15 } } },
    ],
  },
  {
    id: 'EVT_CREW_02', cat: 'fortune', title: 'Yüzen Meyhane', tier: 1, regions: [1, 2, 3, 4], tags: ['crew', 'night'],
    art: { sky: 'night', sea: 'calm', obj: ['raft', 'barrels'], fx: ['fireflies'] },
    text: `Fenerlerle süslenmiş, salların birbirine bağlanmasıyla kurulmuş bir yüzen meyhaneye rastladın. İçeriden şarkılar ve zar sesleri geliyordu.`,
    options: [
      { label: 'Tayfa ara', icon: 'crew', cost: { gold: 40 }, hint: '3 aday, biri bedava katılır',
        win: { text: `Masalarda tayfalık arayan denizcilerle tanıştın. Rom parasını sen ödedin; içlerinden biri seninle gelmeye hazırdı.`, fx: { crewOffer: 3 } } },
      { label: 'Zar at', icon: 'dice', chance: 50,
        win: { text: `Zarlar senden yanaydı!`, fx: { goldR: 80 } },
        lose: { text: `Zarlar seni sevmedi.`, fx: { gold: -40 } } },
      { label: 'Geç', icon: 'no', tags: ['pass'], win: { text: `Şarkılar arkanda kaldı.`, fx: {} } },
    ],
  },
  {
    id: 'EVT_CREW_03', cat: 'mystery', title: 'Fener Adası', tier: 1, tags: ['crew', 'island'],
    art: { sky: 'dusk', sea: 'calm', obj: ['island', 'lighthouse'] },
    text: `Kayalık bir adadaki fenerin bekçisi seni el feneriyle çağırdı. Fenerini yakacak bir çırak bulduğunu, artık denize açılmak istediğini söyledi.`,
    options: [
      { label: 'Bekçiyi gemine al', icon: 'lantern', hint: 'Tobias katılır',
        win: { text: `Yaşlı bekçi fenerinin anahtarını çırağına bıraktı ve gemine çıktı: "Adım Tobias. Sisin içini senin için ben göreceğim."`, fx: { crewJoin: 'CREW_TOBIAS', xp: 10 } } },
      { label: 'Fener yağı bırak', icon: 'heart', cost: { gold: 20 }, hint: 'Sonraki 2 event görünür',
        win: { text: `Fenere yağ bıraktın. Bekçi teşekkür olarak önündeki suların tehlikelerini anlattı.`, fx: { xp: 15, reveal: 2 } } },
    ],
  },
  {
    id: 'EVT_CREW_04', cat: 'mystery', title: 'Kaçak Askerler', tier: 2, regions: [2, 3, 4, 5], tags: ['crew', 'military'],
    art: { sky: 'overcast', sea: 'choppy', obj: ['boat', 'warship'] },
    text: `Bir filika dolusu asker, zalim bir amiralin gemisinden kaçtıklarını söyleyerek sığınma istedi. Uzakta amiralin yelkenleri görünüyordu.`,
    options: [
      { label: 'Sığınma ver', icon: 'shield', hint: 'Savaşçı tayfa; sonraki limanda kaçak statüsü',
        win: { text: `Askerleri ambara sakladın. İçlerinden en yetenekli olanı sana katılmak istedi; ama limanda bu haber çoktan yayılmış olacaktı.`, fx: { crewOffer: { n: 2, cls: 'combat' }, status: 'contraband' } } },
      { label: 'Amirale teslim et', icon: 'coin', hint: 'Ödül; XP kaybı',
        win: { text: `Askerleri amirale teslim ettin ve ödülünü aldın. Gözlerindeki bakış aklından çıkmadı.`, fx: { goldR: 100, xp: -10 } } },
      { label: 'Erzak verip uzaklaş', icon: 'sail', win: { text: `Askerlere su ve erzak verip yollarına bıraktın.`, fx: { xp: 10 } } },
    ],
  },
  {
    id: 'EVT_CREW_05', cat: 'mystery', title: 'Ada Kabilesinin Sınavı', tier: 2, regions: [2, 3, 4, 5], tags: ['crew', 'island'],
    art: { sky: 'day', sea: 'calm', obj: ['island', 'villagers'] },
    text: `Bir adanın kabilesi seni davul sesleriyle karşıladı. Şef, en cesur savaşçısını ancak bir sınavı geçersen sana emanet edeceğini söyledi.`,
    options: [
      { label: 'Sınava gir', icon: 'fist', chance: 50, bonus: [{ crew: 'CREW_BJORN', add: 25 }, { crew: 'CREW_KENJI', add: 25 }, { crew: 'CREW_OKSANA', add: 25 }, { crew: 'CREW_BARAKA', add: 25 }],
        win: { text: `Kano yarışını da, halat çekmeyi de kazandın. Şef gülerek en iyi savaşçısını sana emanet etti.`, fx: { crewOffer: { n: 2, pool: ['CREW_BARAKA', 'CREW_KALANI', 'CREW_KENJI', 'CREW_OKSANA', 'CREW_YARA'] }, xp: 20 } },
        lose: { text: `Sınavı kaybettin. Kabile seni yine de ağırladı ama hediyeleri pahalıya patladı.`, fx: { gold: -30, hull: -5 } } },
      { label: 'Hediye ver', icon: 'gift', cost: { gold: 80 }, hint: 'Destek veya denizcilik tayfası',
        win: { text: `Hediyelerin şefi memnun etti; kabilenin şifacısı ve rehberi seninle gelmek istedi.`, fx: { crewOffer: { n: 2, cls: ['support', 'sailing'] } } } },
      { label: 'Ayrıl', icon: 'no', tags: ['pass'], win: { text: `Davullar arkanda sustu.`, fx: {} } },
    ],
  },
];

export const PET_EVENTS = [
  {
    id: 'EVT_PET_MONKEY', cat: 'pet', pool: false, title: 'Cüce Kaptan İş Başında', tier: 1, tags: ['pet'],
    art: { sky: 'day', sea: 'calm', obj: ['deckView', 'monkey'] },
    text: `Bir sabah tayfanın küçük eşyaları ortadan kaybolmaya başladı. Direğin tepesinde, kaptan şapkalı biri bir şeyleri saklıyordu.`,
    options: [
      { label: 'Cüce Kaptan\'ı kovala', icon: 'hand', chance: 50,
        win: { text: `Yakaladın! Zulasında tayfanın eşyalarının yanında kimsenin tanımadığı birkaç altın da vardı.`, fx: { goldR: 30 } },
        lose: { text: `Maymun direkten direğe atladı; kovalarken biri halata takılıp bir varili devirdi.`, fx: { hullRaw: -5, gold: -10 } } },
      { label: 'Bisküviyle kandır', icon: 'gift', cost: { gold: 5 },
        win: { text: `Bir bisküvi uzattın; Cüce Kaptan şapkasını çıkarıp eşyaları tek tek geri getirdi.`, fx: { xp: 5 } } },
      { label: 'Boş ver', icon: 'no',
        win: { text: `Eşyalar bir daha görülmedi. Tayfa homurdandı ama maymun pek mutluydu.`, fx: { gold: -15 } } },
    ],
  },
  {
    id: 'EVT_PET_PARROT', cat: 'fortune', title: 'Papağan Çığlığı', tier: 1, tags: ['pet'],
    cond: { pet: 'PET_KIRMIZI' },
    art: { sky: 'day', sea: 'calm', obj: ['parrot', 'merchantShip'] },
    text: `Kaptan Kırmızı direğe tünemiş, uzaktan geçen bir tüccar gemisinin tayfasını taklit ediyordu. Karşı gemiden kahkahalar yükseldi.`,
    options: [
      { label: 'Gösteriye devam', icon: 'parrot',
        win: { text: `Tüccarlar papağanın gösterisine bayıldı ve kesesini açtı. Bir de limanların fiyatlarını anlattılar.`, fx: { goldR: 50, xp: 5 } } },
      { label: 'Ufku tarasın', icon: 'eye', hint: 'Sonraki 2 event görünür',
        win: { text: `"Kara yelken! Kara yelken!" Kaptan Kırmızı önündeki rotayı senden önce gördü.`, fx: { reveal: 2 } } },
    ],
  },
  {
    id: 'EVT_PET_MIDNIGHT', cat: 'mystery', title: 'Ay Taşı', tier: 1, tags: ['pet', 'night'],
    cond: { pet: 'PET_GECEYARISI' },
    art: { sky: 'night', sea: 'calm', obj: ['moon', 'parrot'], fx: ['sparkle'] },
    text: `Gece Yarısı bütün gece ay ışığına bakıp tuhaf sesler çıkardı. Sabah kanadının altında parlayan bir taş vardı.`,
    options: [
      { label: 'Taşı al', icon: 'gift', win: { text: `Taş avucunda ısındı. Değerli bir eşya olduğu belliydi.`, fx: { item: 'random', xp: 10 } } },
      { label: 'Kehanetini dinle', icon: 'eye', win: { text: `Gece Yarısı üç kez öttü. Önündeki üç olayın gölgesini gördün.`, fx: { reveal: 3, luckBuff: { add: 10, events: 1 } } } },
    ],
  },
  {
    id: 'EVT_PET_TARCIN_NOSE', cat: 'fortune', title: 'Tarçın\'ın Burnu', tier: 1, tags: ['pet'],
    cond: { pet: 'PET_TARCIN' },
    art: { sky: 'day', sea: 'calm', obj: ['deckView', 'dog'] },
    text: `Tarçın ambarın köşesinde bir şeyi kokluyordu. Kuyruğu deli gibi sallanıyordu.`,
    options: [
      { label: 'Neyi bulduğuna bak', icon: 'dog',
        win: [
          { w: 50, text: `Tarçın eski bir kalasın arkasında unutulmuş bir kese buldu. Ödül olarak bir bisküvi hak etti.`, fx: { goldR: 50 } },
          { w: 30, text: `Tarçın, ambarda çürümeye başlamış bir sandığı erkenden fark etti. Malları kurtardınız.`, fx: { fixSpoiled: true, xp: 5 } },
          { w: 20, text: `Tarçın'ın bulduğu şey... bir bisküviydi. Hemen yedi ve mutlulukla yanına yattı.`, fx: { xp: 5 } },
        ] },
    ],
  },
];
