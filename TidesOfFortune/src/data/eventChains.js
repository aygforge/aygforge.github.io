// GDD Bölüm 8 "Zincir eventler": 10 zincir + Hayalet Gemi + İsadora'nın Kayıp Prenses zinciri.
// Her düğüm bir eventtir (cat: 'chain'). fx.next bir sonraki düğümü kuyruğa enjekte eder:
//   nextAt: 'now' (varsayılan, bir sonraki slot) | 'route' (sonraki rotanın ilk slotu) | 'arrival' (limana varışta)
// fx.flag zincir hafızasına yazar; options[].show / cases[].when zincir bayraklarını okuyabilir.

export const CHAINS = {
  CH_PIRATE_OFFER: { id: 'CH_PIRATE_OFFER', name: 'Korsanın Teklifi', steps: 3, start: 'CH_PIRATE_OFFER_1', regions: [2, 3, 4, 5], pool: true },
  CH_HALF_SUNK: { id: 'CH_HALF_SUNK', name: 'Yarı Batmış Gemi', steps: 2, start: 'CH_HALF_SUNK_1', regions: [1, 2, 3, 4, 5], pool: true },
  CH_STORM: { id: 'CH_STORM', name: 'Fırtına Öncesi', steps: 3, start: 'CH_STORM_1', regions: [1, 2, 3, 4, 5], pool: true },
  CH_PASSENGER: { id: 'CH_PASSENGER', name: 'Gizemli Yolcu', steps: 3, start: 'CH_PASSENGER_1', regions: [2, 3, 4, 5], pool: true },
  CH_TREASURE: { id: 'CH_TREASURE', name: 'Hazine Peşinde', steps: 4, start: 'CH_TREASURE_1', regions: [2, 3, 4, 5], pool: true },
  CH_SMUGGLER: { id: 'CH_SMUGGLER', name: 'Kaçakçı Ağı', steps: 3, start: 'CH_SMUGGLER_1', regions: [2, 3, 4, 5], pool: true },
  CH_CURSE: { id: 'CH_CURSE', name: "Deniz Tanrısı'nın Laneti", steps: 3, start: 'CH_CURSE_1', regions: [2, 3, 4, 5], pool: true },
  CH_WAR: { id: 'CH_WAR', name: 'İki Liman Arasında Savaş', steps: 2, start: 'CH_WAR_1', regions: [3, 4, 5], pool: true },
  CH_LOST_CREW: { id: 'CH_LOST_CREW', name: 'Kayıp Mürettebat', steps: 3, start: 'CH_LOST_CREW_1', regions: [1, 2, 3, 4, 5], pool: true },
  CH_TRADE_WAR: { id: 'CH_TRADE_WAR', name: 'Ticaret Savaşı', steps: 2, start: 'CH_TRADE_WAR_1', regions: [2, 3, 4, 5], pool: true, cond: { notCrew: 'CREW_SELENE' } },
  CH_GHOST: { id: 'CH_GHOST', name: 'Hayalet Gemi', steps: 3, start: 'EVT_M_11', regions: [2, 3, 4, 5], pool: false },
  CH_PRINCESS: { id: 'CH_PRINCESS', name: 'Kayıp Prenses', steps: 3, start: 'CH_PRINCESS_1', regions: [1, 2, 3, 4, 5], pool: false },
};

const END = { endChain: true };
const PASS = ['pass'];

export const CHAIN_EVENTS = [
  // ───────────── Korsanın Teklifi ─────────────
  {
    id: 'CH_PIRATE_OFFER_1', cat: 'chain', chain: 'CH_PIRATE_OFFER', step: 1, title: 'Korsanın Teklifi', tags: ['pirate'],
    art: { sky: 'day', sea: 'calm', obj: ['pirateShip', 'boat'] },
    text: `Bir korsan gemisi yolunu kesti ama topları susuyordu. Bir sandal yanaştı; içindeki kaptan şapkasını çıkarıp sana bir iş teklif etti.`,
    options: [
      { label: 'Teklifi dinle', icon: 'talk', win: { text: `Kaptanın sandalına geçip anlattıklarını dinledin.`, fx: { next: 'CH_PIRATE_OFFER_2A' } } },
      { label: 'Geri çevir', icon: 'no', win: { text: `Kaptan omuz silkti ve sandalına döndü. Ama gözleri bir şey vaat etmiyordu.`, fx: { next: 'CH_PIRATE_OFFER_2B' } } },
      { label: 'Hemen kaç', icon: 'sail', chance: 50, tags: ['escape'], hint: '%50 kargo kaybı riski',
        win: { text: `Rüzgârı arkana alıp uzaklaştın. Korsanlar peşine düşmedi.`, fx: { ...END } },
        lose: { text: `Korsanlar arkandan ateş açtı; ambardan sandıklar denize düştü.`, fx: { cargoLoss: 35, ...END } } },
    ],
  },
  {
    id: 'CH_PIRATE_OFFER_2A', cat: 'chain', chain: 'CH_PIRATE_OFFER', step: 2, title: 'Kilitli Sandık', tags: ['pirate', 'chest'],
    art: { sky: 'day', sea: 'calm', obj: ['pirateShip', 'chest'] },
    text: `Kaptan kilitli, ağır bir sandığı gösterdi. "Bunu bir sonraki limana ulaştır, sana 300 altın öderim," dedi. Sandığın içinden metal sesleri geliyordu.`,
    options: [
      { label: 'Kabul et', icon: 'chest', req: { cargoFree: 1 }, hint: 'Sandık kargoya girer',
        win: { text: `Sandığı ambara yerleştirdin. Korsan, limanda adamlarının seni bulacağını söyledi.`, fx: { cargoAdd: { good: 'GOOD_PIRATE_CHEST', qty: 1 }, next: 'CH_PIRATE_OFFER_3A', nextAt: 'arrival' } } },
      { label: 'Reddet', icon: 'no', hint: '40 HP hasar',
        win: { text: `Kaptanın yüzü karardı. Ayrılırken bir gülle gövdene veda etti.`, fx: { hull: -40, ...END } } },
      { label: 'Sandığı aç', icon: 'lockpick', req: { item: 'ITEM_LOCKPICK' }, hint: 'Nadir item',
        win: { text: `Kaptan bir anlığına arkasını döndüğünde kilidi açtın. İçinden nadir bir eşya ve mühürlü bir harita aldın, sonra sandığı kapatıp sessizce uzaklaştın.`, fx: { item: 'rare', next: 'CH_PIRATE_OFFER_3B', nextAt: 'route' } } },
    ],
  },
  {
    id: 'CH_PIRATE_OFFER_2B', cat: 'chain', chain: 'CH_PIRATE_OFFER', step: 2, title: 'Peşindeki Korsan', tags: ['pirate', 'attack', 'pursuit'],
    art: { sky: 'dusk', sea: 'choppy', obj: ['pirateShip'] },
    text: `Teklifi reddettiğin korsan kaptanı alay ederek güldü. Gemisi yelkenlerini açtı ve peşine düştü.`,
    options: [
      { label: 'Hızlan', icon: 'sail', chance: 45, tags: ['escape'], bonus: [{ item: 'ITEM_LIGHT_SAIL', add: 100 }], hint: 'Hafif Yelken ile garantili',
        win: { text: `Korsanları ufukta bıraktın.`, fx: { xp: 10, ...END } },
        lose: { text: `Korsanlar yetişti; kıçtan gelen gülleler gövdeyi dövdü.`, fx: { hull: -30, ...END } } },
      { label: 'Savaş', icon: 'cannon', req: { item: 'ITEM_CANNON' }, chance: 70, tags: ['combat'],
        win: { text: `Topun korsanın pruvasını parçaladı; kaptan beyaz bayrak çekti ve kesesini sana fırlattı.`, fx: { goldR: 120, xp: 15, ...END } },
        lose: { text: `Korsan seni topa tuttu ve kahkahalarla uzaklaştı.`, fx: { hull: -35, ...END } } },
      { label: 'Demir at', icon: 'anchor', hint: 'Bir olay geçer',
        win: { text: `Demir atıp beklediğin sürede korsan seni geçip gitti.`, fx: { extra: 1, ...END } } },
    ],
  },
  {
    id: 'CH_PIRATE_OFFER_3A', cat: 'chain', chain: 'CH_PIRATE_OFFER', step: 3, title: 'Rıhtımdaki Korsan', tags: ['pirate'],
    art: { sky: 'dusk', sea: 'calm', obj: ['dock', 'pirateShip'] },
    text: `Limana yanaştığında rıhtımda bir başka korsan seni bekliyordu. Sandığı sorunca gözleri parladı: "O, rakibimin hazinesi! Bana getirdin, değil mi?"`,
    options: [
      { label: 'Sandığı ona ver', icon: 'chest', show: { cargoGood: 'GOOD_PIRATE_CHEST' }, hint: '500 altın, nadir item',
        win: { text: `Korsan sandığı aldı ve sana 500 altın ile nadir bir eşya verdi. Korsan yuvalarında adın saygıyla anılacak.`, fx: { cargoRemove: 'GOOD_PIRATE_CHEST', gold: 500, item: 'rare', status: 'pirateRep', xp: 20, ...END } } },
      { label: 'Sözünü tut', icon: 'scroll', show: { cargoGood: 'GOOD_PIRATE_CHEST' }, hint: '300 altın',
        win: { text: `Anlaşmaya sadık kaldın; ilk korsanın adamları sözü edilen 300 altını ödedi.`, fx: { cargoRemove: 'GOOD_PIRATE_CHEST', gold: 300, xp: 15, ...END } } },
      { label: 'Sandığı kaybettim', icon: 'no', show: { noCargoGood: 'GOOD_PIRATE_CHEST' },
        win: { text: `Sandığı kaybettiğini duyan korsanlar öfkeyle gemine saldırdı.`, fx: { hull: -30, gold: -50, ...END } } },
    ],
  },
  {
    id: 'CH_PIRATE_OFFER_3B', cat: 'chain', chain: 'CH_PIRATE_OFFER', step: 3, title: 'Mühürlü Harita', tags: ['explore'],
    art: { sky: 'day', sea: 'calm', obj: ['mapScroll'] },
    text: `Sandıktan aldığın mühürlü haritayı açtın. Mühür eski bir korsan amiralinindi; harita ise unutulmuş bir yolu gösteriyordu.`,
    options: [
      { label: 'Haritayı incele', icon: 'oldmap', hint: 'Antik Harita; %60 takip riski',
        win: { text: `Antik Harita'yı sakladın. Ama mührün sahibi onu arıyor olabilirdi...`, fx: { item: 'ITEM_ANCIENT_MAP', xp: 15, spawnNextRoute: [60, 'EVT_CH_PURSUIT'], ...END } } },
    ],
  },
  // ───────────── Yarı Batmış Gemi ─────────────
  {
    id: 'CH_HALF_SUNK_1', cat: 'chain', chain: 'CH_HALF_SUNK', step: 1, title: 'Yarı Batmış Gemi', tags: ['wreck'],
    art: { sky: 'overcast', sea: 'calm', obj: ['halfSunk'] },
    text: `Yarısı suya gömülmüş bir ticaret gemisinin yanından geçiyordun ki enkazın içinde birinin kımıldadığını gördün.`,
    options: [
      { label: 'Kurtar', icon: 'hand', win: { text: `Halat atıp enkaza tırmandın.`, fx: { next: 'CH_HALF_SUNK_2A' } } },
      { label: 'Yağmala', icon: 'crate', win: { text: `Kurtarmak yerine ambara daldın.`, fx: { next: 'CH_HALF_SUNK_2B' } } },
      { label: 'Geç git', icon: 'no', tags: PASS, win: { text: `Enkazı arkanda bıraktın.`, fx: { ...END } } },
    ],
  },
  {
    id: 'CH_HALF_SUNK_2A', cat: 'chain', chain: 'CH_HALF_SUNK', step: 2, title: 'Kurtarılan Kartograf', tags: ['rescue'],
    art: { sky: 'day', sea: 'calm', obj: ['halfSunk', 'boat'] },
    text: `Kurtardığın adam, titreyen elleriyle deri bir çantaya sarıldı. Eski bir kartograftı ve hayatını sana borçluydu.`,
    options: [
      { label: 'Teşekkürünü kabul et', icon: 'gift', hint: 'Nadir item ve XP',
        win: { text: `Kartograf çantasından özenle sakladığı bir eşyayı çıkarıp sana verdi ve bildiği rotaları anlattı.`, fx: { item: 'rare', xp: 25, ...END } } },
      { label: 'Gemine davet et', icon: 'crew', hint: 'Compass Rose katılır',
        win: { text: `Kartograf gülümsedi: "Adım Compass Rose. Haritalarım artık senin."`, fx: { crewJoin: 'CREW_COMPASS', xp: 15, ...END } } },
    ],
  },
  {
    id: 'CH_HALF_SUNK_2B', cat: 'chain', chain: 'CH_HALF_SUNK', step: 2, title: 'Görülen Yağma', tags: ['wreck'],
    art: { sky: 'overcast', sea: 'calm', obj: ['halfSunk', 'boat'] },
    text: `Enkazdan değerli eşyaları topladın. Tam ayrılırken uzaktaki bir balıkçı teknesinin seni izlediğini fark ettin.`,
    options: [
      { label: 'Ganimeti al', icon: 'coin', hint: '150 altın; sonraki limanda kaçak statüsü',
        win: { text: `150 altın değerinde ganimet aldın. Ama haber limana senden önce ulaşacak: fiyatlar sana %20 pahalı olacak.`, fx: { gold: 150, status: 'contraband', ...END } } },
      { label: 'Sus payı ver', icon: 'coin', cost: { gold: 60 },
        win: { text: `Balıkçıya bir kese verdin; o hiçbir şey görmedi.`, fx: { gold: 150, ...END } } },
    ],
  },
  // ───────────── Fırtına Öncesi ─────────────
  {
    id: 'CH_STORM_1', cat: 'chain', chain: 'CH_STORM', step: 1, title: 'Fırtına Öncesi', tags: ['storm'],
    art: { sky: 'overcast', sea: 'choppy', obj: ['birds'] },
    text: `Gökyüzü kararmaya başladı; martılar sustu ve rüzgâr tuhaf biçimde dindi. Yaşlı denizciler bunun ne anlama geldiğini bilirdi.`,
    options: [
      { label: 'Hızlan', icon: 'sail', hint: 'Hafif Yelken ile güvenli',
        cases: [{ when: { item: 'ITEM_LIGHT_SAIL' }, text: `Hafif yelkenler rüzgârın son nefesini yakaladı; fırtına arkanda patladı.`, fx: { xp: 15, ...END } }],
        win: { text: `Hızlanmaya çalıştın ama fırtına daha hızlıydı.`, fx: { next: 'CH_STORM_2A' } } },
      { label: 'Koya sığın', icon: 'anchor', hint: 'Bir olay atlanır',
        win: { text: `En yakın koya dümen kırdın.`, fx: { skip: 1, next: 'CH_STORM_2B' } } },
      { label: 'Fırtınayı göğüsle', icon: 'wave',
        cases: [{ when: { crew: 'CREW_SURGE' }, text: `Surge gülümsedi: "Bu fırtına benim." Dümene geçti ve gemiyi fırtınanın gözüne sürdü.`, fx: { xp: 20, next: 'CH_STORM_2C' } }],
        win: { text: `Pruvayı fırtınaya çevirdin.`, fx: { next: 'CH_STORM_2C' } } },
    ],
  },
  {
    id: 'CH_STORM_2A', cat: 'chain', chain: 'CH_STORM', step: 2, title: 'Fırtınanın Pençesinde', tags: ['storm'],
    art: { sky: 'storm', sea: 'rough', obj: ['wave'], fx: ['rain', 'lightning'] },
    text: `Fırtına seni yakaladı. Dalgalar güverteyi dövdü, yelkenler yırtıldı.`,
    options: [
      { label: 'Dayan', icon: 'fist', hint: '25 hasar',
        win: { text: `Fırtına dindiğinde gemi yaralıydı. Ufukta, fırtınanın parçaladığı başka gemilerin enkazı görünüyordu.`, fx: { hull: -25, next: 'CH_STORM_3A' } } },
    ],
  },
  {
    id: 'CH_STORM_3A', cat: 'chain', chain: 'CH_STORM', step: 3, title: 'Enkaz Alanı', tags: ['wreck'],
    art: { sky: 'overcast', sea: 'choppy', obj: ['wreck', 'barrels', 'timber'] },
    text: `Fırtınanın ardında kalan enkaz alanına girdin. Kırık direkler ve yüzen fıçılar her yandaydı.`,
    options: [
      { label: 'Yağmala', icon: 'crate', chance: 55, tags: ['loot'],
        win: [
          { w: 60, text: `Bir sandık dolusu altın buldun!`, fx: { goldR: 120, ...END } },
          { w: 40, text: `Su geçirmez bir sandıkta işe yarar bir eşya buldun.`, fx: { item: 'random', ...END } },
        ],
        lose: { text: `Enkaz arasında bir direk gövdeye saplandı.`, fx: { hull: -20, ...END } } },
      { label: 'Kereste topla', icon: 'hammer', win: { text: `Sağlam keresteleri gemine çaktınız.`, fx: { hull: 15, ...END } } },
    ],
  },
  {
    id: 'CH_STORM_2B', cat: 'chain', chain: 'CH_STORM', step: 2, title: 'Sığınaktaki Gemi', tags: ['trade'],
    art: { sky: 'storm', sea: 'calm', obj: ['island', 'merchantShip'], fx: ['rain'] },
    text: `Sığındığın koyda başka bir gemi de demirlemişti. Kaptanı, fırtına dinene kadar küçük bir takas yapmayı teklif etti.`,
    options: [
      { label: 'Takas yap', icon: 'scale', hint: 'Mini ticaret (2 mal)',
        win: { text: `Kaptan ambarını açtı.`, fx: { trade: 'shelter', next: 'CH_STORM_3B' } } },
      { label: 'Dinlen', icon: 'heart', win: { text: `Fırtına boyunca dinlendiniz ve gövdeyi yamadınız.`, fx: { hull: 10, next: 'CH_STORM_3B' } } },
    ],
  },
  {
    id: 'CH_STORM_3B', cat: 'chain', chain: 'CH_STORM', step: 3, title: 'Fırtına Dindi', tags: [],
    art: { sky: 'dawn', sea: 'calm', obj: ['rainbow'] },
    text: `Sabah olduğunda fırtına dinmişti. Koydan çıkarken iki gemi birbirine selam verdi.`,
    options: [{ label: 'Yola devam', icon: 'sail', win: { text: `Temiz bir rüzgârla yola çıktın.`, fx: { xp: 20, luckBuff: { add: 5, events: 2 }, ...END } } }],
  },
  {
    id: 'CH_STORM_2C', cat: 'chain', chain: 'CH_STORM', step: 2, title: 'Haritada Olmayan Ada', tags: ['storm', 'island'],
    art: { sky: 'storm', sea: 'rough', obj: ['island'], fx: ['rain', 'lightning'] },
    text: `Dalgaların arasında, hiçbir haritada olmayan bir ada belirdi. Fırtınanın gözü tam üzerindeydi.`,
    options: [{ label: 'Adaya yanaş', icon: 'anchor', hint: '15 hasar, nadir ödül',
      win: { text: `Kıyıya vurduğunda gövde hasar aldı ama ada seni bekliyordu.`, fx: { hull: -15, next: 'CH_STORM_3C' } } }],
  },
  {
    id: 'CH_STORM_3C', cat: 'chain', chain: 'CH_STORM', step: 3, title: 'Fırtına Tapınağı', tags: ['island', 'explore'],
    art: { sky: 'eerie', sea: 'calm', obj: ['island', 'ruins'], fx: ['sparkle'] },
    text: `Adada, fırtınanın yıllardır sakladığı bir tapınak vardı. Sunakta parlayan eşyalar duruyordu.`,
    options: [{ label: 'Tapınağı keşfet', icon: 'compass', chance: 75, tags: ['explore'],
      win: { text: `Sunaktaki eşyaları ve bir kese altını aldın. Fırtına senden razıydı.`, fx: { item: 'rare', goldR: 100, xpExplore: 25, ...END } },
      lose: { text: `Tapınak çöktü; elinde yalnızca bir eşya kaldı.`, fx: { item: 'random', hull: -10, ...END } } }],
  },
  // ───────────── Gizemli Yolcu ─────────────
  {
    id: 'CH_PASSENGER_1', cat: 'chain', chain: 'CH_PASSENGER', step: 1, title: 'Gizemli Yolcu', tags: [],
    art: { sky: 'dusk', sea: 'calm', obj: ['boat', 'passenger'] },
    text: `Bir kayıkta pelerinine bürünmüş biri yolunu kesti. Yüzünü göstermeden bir kese altın uzattı ve gemine yolcu olarak binmek istedi.`,
    options: [
      { label: 'Kabul et', icon: 'hand', hint: '+50 altın',
        win: { text: `Yolcu tek kelime etmeden kamaraya çekildi.`, fx: { gold: 50, next: 'CH_PASSENGER_2', nextAt: 'route' } } },
      { label: 'Reddet', icon: 'no', tags: PASS, win: { text: `Kayık sisin içinde kayboldu.`, fx: { ...END } } },
    ],
  },
  {
    id: 'CH_PASSENGER_2', cat: 'chain', chain: 'CH_PASSENGER', step: 2, title: 'Gece Yarısı İşaretleri', tags: ['night'],
    art: { sky: 'night', sea: 'calm', obj: ['passenger'], fx: ['glow'] },
    text: `Gece yarısı, gizemli yolcunun kıç güvertede bir fenerle uzaktaki bir gemiye işaret verdiğini gördün.`,
    options: [
      { label: 'Yüzleş', icon: 'talk', chance: 70,
        win: { text: `Yolcu fenerini indirdi: "Peşimdekileri yanlış yöne gönderiyordum," dedi.`, fx: { flag: { confronted: true }, next: 'CH_PASSENGER_3', nextAt: 'route' } },
        lose: { text: `Yolcu bıçak çekti, ardından sakinleşip özür diledi. Kavgada bir fener devrildi ve küçük bir yangın çıktı.`, fx: { hull: -10, flag: { confronted: true }, next: 'CH_PASSENGER_3', nextAt: 'route' } } },
      { label: 'Güven ve bekle', icon: 'heart',
        win: { text: `Hiçbir şey söylemedin. Sabah yolcu sana minnetle baktı.`, fx: { flag: { trusted: true }, next: 'CH_PASSENGER_3', nextAt: 'route' } } },
      { label: 'Kamarasına kilitle', icon: 'lock',
        win: { text: `Yolcuyu kamarasına kilitledin. Kapının ardından tek bir ses gelmedi.`, fx: { flag: { locked: true }, next: 'CH_PASSENGER_3', nextAt: 'route' } } },
    ],
  },
  {
    id: 'CH_PASSENGER_3', cat: 'chain', chain: 'CH_PASSENGER', step: 3, title: 'Pelerinin Altında', tags: [],
    art: { sky: 'dawn', sea: 'calm', obj: ['passenger'] },
    text: `Bir sonraki limana yaklaşırken yolcu nihayet pelerinini çıkardı. Kim olduğunu görünce mürettebatın nefesi kesildi.`,
    options: [
      { label: 'Kimliğini öğren', icon: 'eye',
        cases: [
          { when: { flag: 'locked' }, text: `Kilitli kaldığı için sana kırgındı. Teşekkür etmeden indi ama kamarada bir kese bıraktı.`, fx: { goldR: 100, ...END } },
          { when: { crewAvailable: 'CREW_ISADORA' }, text: `Yolcu İsadora'ydı: kayıp prenses. "Bana güvendin," dedi. "Artık senin tayfanım."`, fx: { crewJoin: 'CREW_ISADORA', xp: 30, ...END } },
        ],
        win: { text: `Yolcu, adı denizlerde anılan biriydi ve sana katılmaya karar verdi.`, fx: { crewJoin: { cls: 'rare' }, xp: 30, ...END } } },
    ],
  },
  // ───────────── Hazine Peşinde ─────────────
  {
    id: 'CH_TREASURE_1', cat: 'chain', chain: 'CH_TREASURE', step: 1, title: 'Hazine Peşinde', tags: ['explore'],
    art: { sky: 'day', sea: 'calm', obj: ['mapScroll'] },
    text: `Elindeki parşömen, dört parçaya bölünmüş bir hazine haritasının ilkiydi. Kenarında bir adanın silüeti ve "Ay'ın Gözü" yazıyordu.`,
    options: [
      { label: 'Peşine düş', icon: 'oldmap', win: { text: `Haritayı kaptan kamarasına astın. Sonraki rotada Ay'ın Gözü'nü arayacaksın.`, fx: { xp: 5, next: 'CH_TREASURE_2', nextAt: 'route' } } },
      { label: 'Unut', icon: 'no', tags: PASS, win: { text: `Haritayı bir çekmeceye kaldırdın.`, fx: { ...END } } },
    ],
  },
  {
    id: 'CH_TREASURE_2', cat: 'chain', chain: 'CH_TREASURE', step: 2, title: "Ay'ın Gözü", tags: ['island', 'explore'],
    art: { sky: 'day', sea: 'calm', obj: ['island', 'rocks'] },
    text: `Haritadaki silüet ufukta belirdi. Ay'ın Gözü, adanın kayalığındaki yuvarlak bir mağaraydı.`,
    options: [
      { label: 'Mağarayı ara', icon: 'compass', chance: 55, tags: ['explore'], bonus: [{ item: 'ITEM_SEXTANT', add: 20 }, { crew: 'CREW_COMPASS', add: 40 }],
        win: { text: `Mağaranın tavanında ikinci harita parçası parlıyordu.`, fx: { xpExplore: 15, next: 'CH_TREASURE_3', nextAt: 'route' } },
        lose: { text: `Mağara çöktü; parçayı alırken yaralandın ama parçayı kurtardın.`, fx: { hull: -20, next: 'CH_TREASURE_3', nextAt: 'route' } } },
      { label: 'Vazgeç', icon: 'no', tags: PASS, win: { text: `Hazine başkasının olsun dedin.`, fx: { ...END } } },
    ],
  },
  {
    id: 'CH_TREASURE_3', cat: 'chain', chain: 'CH_TREASURE', step: 3, title: 'Şifreli Parçalar', tags: ['explore'],
    art: { sky: 'night', sea: 'calm', obj: ['mapScroll'], fx: ['sparkle'] },
    text: `Parçaları birleştirdin ama yazılar eski bir dildeydi. Hazineye giden son yol bir şifreyle saklanmıştı.`,
    options: [
      { label: 'Antik Harita ile çöz', icon: 'oldmap', req: { item: 'ITEM_ANCIENT_MAP' }, consume: 'ITEM_ANCIENT_MAP',
        win: { text: `Antik Harita'daki semboller şifrenin anahtarıydı.`, fx: { flag: { decoded: true }, next: 'CH_TREASURE_4' } } },
      { label: 'Compass Rose çözsün', icon: 'map', req: { crew: 'CREW_COMPASS' },
        win: { text: `Compass Rose bir gece boyunca çalıştı ve şifreyi çözdü.`, fx: { flag: { decoded: true }, next: 'CH_TREASURE_4' } } },
      { label: 'Kartografa öde', icon: 'coin', cost: { gold: 100 },
        win: { text: `Yolda rastladığın bir kartograf şifreyi çözdü.`, fx: { flag: { decoded: true }, next: 'CH_TREASURE_4' } } },
      { label: 'Kendin çöz', icon: 'book', chance: 40,
        win: { text: `Saatler süren uğraştan sonra şifre çözüldü!`, fx: { flag: { decoded: true }, next: 'CH_TREASURE_4' } },
        lose: { text: `Şifreyi çözdüğünü düşündün... ama emin değildin.`, fx: { next: 'CH_TREASURE_4' } } },
    ],
  },
  {
    id: 'CH_TREASURE_4', cat: 'chain', chain: 'CH_TREASURE', step: 4, title: 'Hazine Adası', tags: ['island', 'explore', 'chest'],
    art: { sky: 'dusk', sea: 'calm', obj: ['island', 'chest'], fx: ['sparkle'] },
    text: `Şifrenin gösterdiği ıssız adaya ulaştın. Kumların altında bir sandığın kenarı görünüyordu, ama etrafta tuzak işaretleri vardı.`,
    options: [
      { label: 'Dikkatle kaz', icon: 'chest', chance: 55, tags: ['explore'], bonus: [{ flag: 'decoded', add: 35 }],
        win: { text: `Sandık altın ve mücevherle doluydu! Hazine senindi.`, fx: { gold: 600, item: 'rare', xp: 50, ach: 'ACH_TREASURE', ...END } },
        lose: { text: `Tuzak tetiklendi! Yine de sandığın bir kısmını kurtardın.`, fx: { hull: -30, gold: 250, xp: 20, ...END } } },
      { label: 'Uzaktan bak', icon: 'no', tags: PASS, win: { text: `Tuzaklara güvenmedin ve adadan ayrıldın.`, fx: { ...END } } },
    ],
  },
  // ───────────── Kaçakçı Ağı ─────────────
  {
    id: 'CH_SMUGGLER_1', cat: 'chain', chain: 'CH_SMUGGLER', step: 1, title: 'Kaçakçı Ağı', tags: ['smuggle', 'night'],
    art: { sky: 'night', sea: 'calm', obj: ['boat', 'barrels'] },
    text: `Gece karanlığında fenersiz bir kayık yanaştı. Kaçakçılar, ambarına birkaç sandık tılsım tozu yüklemeyi ve teslimatta cömert ödeme yapmayı teklif etti.`,
    options: [
      { label: 'Kabul et', icon: 'crate', req: { cargoFree: 2 }, hint: '2 kaçak mal yüklenir',
        win: { text: `Sandıklar ambara yerleşti. "Limanda adamlarımız seni bulur," dediler.`, fx: { cargoAdd: { good: 'GOOD_CHARM_DUST', qty: 2, free: true }, next: 'CH_SMUGGLER_2' } } },
      { label: 'Derin anlaşma', icon: 'hold', req: { item: 'ITEM_SMUGGLER_HOLD', cargoFree: 2 }, hint: 'Kaçakçılık Bölmesi: ödeme artar',
        win: { text: `Bölmeni görünce kaçakçılar seni ağlarına kabul etti; ödeme neredeyse iki katına çıktı.`, fx: { cargoAdd: { good: 'GOOD_CHARM_DUST', qty: 2, free: true }, flag: { deep: true }, next: 'CH_SMUGGLER_2' } } },
      { label: 'Reddet', icon: 'no', tags: PASS, win: { text: `Kayık karanlığa karıştı.`, fx: { ...END } } },
    ],
  },
  {
    id: 'CH_SMUGGLER_2', cat: 'chain', chain: 'CH_SMUGGLER', step: 2, title: 'Devriye', tags: ['military', 'smuggle'],
    art: { sky: 'dawn', sea: 'calm', obj: ['warship'] },
    text: `Şafakla birlikte bir devriye gemisi ufukta belirdi ve doğrudan sana yöneldi. Ambarındaki kaçak mallar her an bulunabilirdi.`,
    auto: [
      { when: { all: [{ crew: 'CREW_REZA' }, { pet: 'PET_CUCE' }] }, text: `Cüce Kaptan devriyenin subayının şapkasını kapıp denize atladı; Reza herkes gülerken sandıkları çoktan gizlemişti.`, fx: { xp: 10, next: 'CH_SMUGGLER_3', nextAt: 'arrival' } },
      { when: { crew: 'CREW_ISADORA' }, text: `İsadora devriye kaptanına kraliyet yüzüğünü gösterdi. Devriye selam verip uzaklaştı.`, fx: { xp: 10, next: 'CH_SMUGGLER_3', nextAt: 'arrival' } },
    ],
    options: [
      { label: 'Malları gizle', icon: 'hood', chance: 45, tags: ['smuggle'], bonus: [{ crew: 'CREW_REZA', add: 30 }, { item: 'ITEM_SMUGGLER_HOLD', add: 30 }, { pet: 'PET_CUCE', add: 15 }],
        win: { text: `Devriye ambarı aradı ama hiçbir şey bulamadı.`, fx: { next: 'CH_SMUGGLER_3', nextAt: 'arrival' } },
        lose: { text: `Devriye sandıkları buldu! Mallara el konuldu ve ceza kesildi.`, fx: { confiscate: 100, gold: -60, ...END } } },
      { label: 'Kaçmaya çalış', icon: 'sail', chance: 50, tags: ['escape'],
        win: { text: `Devriyeyi atlattın.`, fx: { next: 'CH_SMUGGLER_3', nextAt: 'arrival' } },
        lose: { text: `Devriye yetişti; mallara el konuldu ve gövden kurşunlandı.`, fx: { confiscate: 100, hull: -15, ...END } } },
      { label: 'Malları denize at', icon: 'no',
        win: { text: `Kaçak sandıkları denize attın; devriye hiçbir şey bulamadı ama kaçakçılar bunu unutmayacak.`, fx: { cargoRemove: 'GOOD_CHARM_DUST', cargoRemoveQty: 2, ...END } } },
    ],
  },
  {
    id: 'CH_SMUGGLER_3', cat: 'chain', chain: 'CH_SMUGGLER', step: 3, title: 'Karanlık Rıhtım', tags: ['smuggle'],
    art: { sky: 'night', sea: 'calm', obj: ['dock', 'barrels'] },
    text: `Limanın karanlık bir köşesinde kaçakçıların adamları seni bekliyordu.`,
    options: [
      { label: 'Malları teslim et', icon: 'crate', show: { cargoGood: 'GOOD_CHARM_DUST' },
        cases: [{ when: { flag: 'deep' }, text: `Teslimat kusursuzdu. Kaçakçılar seni ağın ortağı saydı: 550 altın ve bir hediye.`, fx: { cargoRemove: 'GOOD_CHARM_DUST', cargoRemoveQty: 2, gold: 550, item: 'ITEM_LOCKPICK', xp: 25, ...END } }],
        win: { text: `Sandıkları teslim ettin ve 300 altın aldın.`, fx: { cargoRemove: 'GOOD_CHARM_DUST', cargoRemoveQty: 2, gold: 300, xp: 20, ...END } } },
      { label: 'Sözünü boz', icon: 'coin', show: { cargoGood: 'GOOD_CHARM_DUST' }, hint: 'Mallar sende kalır; liman sana düşman olur',
        win: { text: `Malları kendine sakladın. Kaçakçılar bunu öğrenince limanda adın kötüye çıktı.`, fx: { status: 'contraband', ...END } } },
      { label: 'Elim boş', icon: 'no', show: { noCargoGood: 'GOOD_CHARM_DUST' },
        win: { text: `Kaçakçılar mallarını göremeyince sana tehditler savurdu ve kesenden zorla aldılar.`, fx: { gold: -50, ...END } } },
    ],
  },
  // ───────────── Deniz Tanrısı'nın Laneti ─────────────
  {
    id: 'CH_CURSE_1', cat: 'chain', chain: 'CH_CURSE', step: 1, title: "Deniz Tanrısı'nın Laneti", tags: ['sea_god'],
    art: { sky: 'overcast', sea: 'calm', obj: ['shrine'] },
    text: `Kayalık bir adacıkta, deniz kabuklarıyla süslenmiş eski bir sunak buldun. Sunağın üstünde altın bir put parlıyordu.`,
    options: [
      { label: 'Adak bırak', icon: 'coin', cost: { gold: 30 },
        win: { text: `Sunağa birkaç altın bıraktın. Deniz bir an kıpırdadı, sanki teşekkür eder gibi.`, fx: { xp: 15, luckBuff: { add: 10, events: 2 }, ...END } } },
      { label: 'Putu al', icon: 'idol', hint: '+120 altın; Muska yoksa lanet',
        cases: [{ when: { item: 'ITEM_AMULET' }, text: `Putu aldın. Muskan ısındı ve laneti üzerinden attı.`, fx: { gold: 120, xp: 10, ...END } }],
        win: { text: `Putu aldın. Aynı anda gökyüzü karardı ve uzaktan bir gök gürültüsü yükseldi.`, fx: { gold: 120, next: 'CH_CURSE_2', nextAt: 'route' } } },
      { label: 'Uzak dur', icon: 'no', tags: PASS, win: { text: `Sunağa dokunmadan uzaklaştın.`, fx: { ...END } } },
    ],
  },
  {
    id: 'CH_CURSE_2', cat: 'chain', chain: 'CH_CURSE', step: 2, title: 'Lanetin Gölgesi', tags: ['sea_god', 'storm'],
    art: { sky: 'storm', sea: 'dark', obj: ['idol', 'ghostShip'], fx: ['lightning', 'rain'] },
    text: `Lanet seni takip etti. Geceleri ambardan inlemeler geldi, mallar küflendi, pusula durmadan döndü.`,
    options: [
      { label: 'Dayan', icon: 'fist', win: { text: `Gövde çatladı, mallar bozuldu. Lanet daha da güçleniyordu.`, fx: { hull: -20, cargoSpoil: 2, next: 'CH_CURSE_3' } } },
      { label: "Magda'ya danış", icon: 'spell', req: { crew: 'CREW_MAGDA' },
        win: { text: `Magda tütsüler yaktı: "Lanet bizi girdaba çağırıyor. Hazırlıklıyız."`, fx: { xp: 10, next: 'CH_CURSE_3' } } },
      { label: 'Putu geri ver', icon: 'idol', cost: { gold: 120 },
        win: { text: `Putu ve altınları denize bıraktın. Lanet hafifledi ama tamamen gitmedi.`, fx: { flag: { returned: true }, next: 'CH_CURSE_3' } } },
    ],
  },
  {
    id: 'CH_CURSE_3', cat: 'chain', chain: 'CH_CURSE', step: 3, title: 'Girdap', tags: ['sea_god', 'storm'],
    art: { sky: 'storm', sea: 'rough', obj: ['whirlpool'], fx: ['lightning'] },
    text: `Dev bir girdap belirdi ve sudan yükselen bir ses senden borcunu istedi.`,
    options: [
      { label: 'Muska ile yüzleş', icon: 'amulet', req: { item: 'ITEM_AMULET' },
        win: { text: `Muska girdabın gözüne düştü ve lanet kırıldı. Deniz sana bir hediye bıraktı.`, fx: { xp: 30, item: 'rare', ...END } } },
      { label: 'Magda', icon: 'spell', req: { crew: 'CREW_MAGDA' },
        win: { text: `Magda girdaba eski bir yemin okudu. Lanet çözüldü ve dalgalar bir armağan bıraktı.`, fx: { xp: 30, item: 'rare', ...END } } },
      { label: 'Her şeyi sun', icon: 'coin', hint: '200 altın ve kargonun yarısı',
        cases: [{ when: { flag: 'returned' }, text: `Putu zaten geri vermiştin; girdap küçük bir adakla yetindi.`, fx: { gold: -50, xp: 20, ...END } }],
        win: { text: `Altınlarını ve yükünün yarısını denize sundun. Girdap sakinleşti.`, fx: { gold: -200, cargoLoss: 50, xp: 20, ...END } } },
      { label: 'Girdaptan kaç', icon: 'sail', chance: 40, tags: ['escape'], bonus: [{ flag: 'returned', add: 25 }],
        win: { text: `Girdabın kıyısından sıyrıldın!`, fx: { xp: 20, ...END } },
        lose: { text: `Girdap gemiyi döndürdü ve fırlattı.`, fx: { hull: -50, cargoLoss: 30, ...END } } },
    ],
  },
  // ───────────── İki Liman Arasında Savaş ─────────────
  {
    id: 'CH_WAR_1', cat: 'chain', chain: 'CH_WAR', step: 1, title: 'İki Liman Arasında Savaş', tags: ['war'],
    art: { sky: 'dusk', sea: 'choppy', obj: ['warship', 'pirateShip'], fx: ['smoke'] },
    text: `İki liman şehri arasındaki savaşın filoları denizde karşı karşıyaydı. İki taraf da sana elçi gönderip destek istedi.`,
    options: [
      { label: 'Kraliyet filosu', icon: 'shield', hint: '+80 altın avans',
        win: { text: `Kraliyet subayı sana avans ödedi; erzak ve barut taşıyacaktın.`, fx: { gold: 80, flag: { side: 'crown' }, next: 'CH_WAR_2', nextAt: 'arrival' } } },
      { label: 'Asi filo', icon: 'flag', hint: '+120 altın avans',
        win: { text: `Asilerin lideri sana bir kese fırlattı: "Kazanırsak unutmayız."`, fx: { gold: 120, flag: { side: 'rebels' }, next: 'CH_WAR_2', nextAt: 'arrival' } } },
      { label: 'Aziz Mehmed ateşkes', icon: 'scroll', req: { crew: 'CREW_MEHMED' },
        win: { text: `Aziz Mehmed iki amirali aynı masaya oturttu. Ateşkes imzalandı ve iki liman da adını minnetle andı.`, fx: { xp: 60, status: 'hero', ...END } } },
      { label: 'Taraf tutma', icon: 'no', tags: PASS, win: { text: `Savaşın uzağından dolaştın.`, fx: { ...END } } },
    ],
  },
  {
    id: 'CH_WAR_2', cat: 'chain', chain: 'CH_WAR', step: 2, title: 'Savaşın Sonucu', tags: ['war'],
    art: { sky: 'day', sea: 'calm', obj: ['dock', 'warship'] },
    text: `Limana vardığında savaşın sonucu çoktan belli olmuştu. Rıhtımdaki herkes aynı şeyi konuşuyordu.`,
    options: [
      { label: 'Haberleri dinle', icon: 'talk', chance: 55,
        win: { text: `Desteklediğin taraf zafer kazandı! Limanda kahraman gibi karşılandın ve ödülün verildi.`, fx: { goldR: 150, status: 'hero', xp: 30, ...END } },
        lose: { text: `Desteklediğin taraf yenildi. Limanda sana kuşkuyla bakıyorlar; fiyatlar %20 pahalı.`, fx: { status: 'contraband', xp: 10, ...END } } },
    ],
  },
  // ───────────── Kayıp Mürettebat ─────────────
  {
    id: 'CH_LOST_CREW_1', cat: 'chain', chain: 'CH_LOST_CREW', step: 1, title: 'Kayıp Mürettebat', tags: ['storm', 'night'],
    art: { sky: 'night', sea: 'choppy', obj: ['deckView'], fx: ['rain'] },
    text: `Gece fırtınasında bir dalga güverteyi süpürdü. Sabah yoklamasında genç miço Can'ın yerinde olmadığını fark ettin.`,
    options: [
      { label: 'Geri dön ve ara', icon: 'back', hint: 'Ekstra olay',
        win: { text: `Dümeni kırıp rotanın gerisine döndün.`, fx: { extra: 1, next: 'CH_LOST_CREW_2' } } },
      { label: 'Filika indir', icon: 'boat',
        win: { text: `Bir filika indirip iki gönüllüyle aramaya gönderdin.`, fx: { flag: { boat: true }, next: 'CH_LOST_CREW_2' } } },
      { label: 'Devam et', icon: 'no', tags: PASS,
        win: { text: `Acı bir karar verdin. O gün güvertede kimse şarkı söylemedi.`, fx: { xp: -10, ...END } } },
    ],
  },
  {
    id: 'CH_LOST_CREW_2', cat: 'chain', chain: 'CH_LOST_CREW', step: 2, title: 'Sisteki Islık', tags: ['fog'],
    art: { sky: 'fog', sea: 'calm', obj: ['rocks'], fx: ['fog'] },
    text: `Sisin içinde saatlerce aradınız. Uzaktan, kayalıkların arasından zayıf bir ıslık sesi geldi.`,
    options: [
      { label: 'Sesi takip et', icon: 'compass', chance: 55, tags: ['navigate'], bonus: [{ crew: 'CREW_TOBIAS', add: 30 }, { crew: 'CREW_MIRA', add: 25 }, { flag: 'boat', add: 15 }],
        win: { text: `Kayalığa yaklaştınız; ses giderek netleşti.`, fx: { next: 'CH_LOST_CREW_3' } },
        lose: { text: `Sisin içinde kayalara sürtündünüz; Can'a ulaşmanız saatler sürdü.`, fx: { hull: -10, flag: { late: true }, next: 'CH_LOST_CREW_3' } } },
    ],
  },
  {
    id: 'CH_LOST_CREW_3', cat: 'chain', chain: 'CH_LOST_CREW', step: 3, title: 'Kayalıktaki Fıçı', tags: ['rescue'],
    art: { sky: 'dawn', sea: 'calm', obj: ['rocks', 'barrels'] },
    text: `Can, kayalığa vurmuş bir fıçıya sarılmış, titriyordu. Yanında batık bir geminin parçaları duruyordu.`,
    options: [
      { label: 'Onu kurtar', icon: 'hand',
        cases: [{ when: { flag: 'late' }, text: `Can'ı kurtardınız ama günlerce ateşler içinde yattı. Yine de yaşıyordu.`, fx: { xp: 25, ...END } }],
        win: { text: `Can'ı kurtardınız. Gözyaşları içinde sana sarıldı; kayalıkta bulduğu sandığı da sana getirdi.`, fx: { xp: 40, item: 'random', ...END } } },
    ],
  },
  // ───────────── Ticaret Savaşı ─────────────
  {
    id: 'CH_TRADE_WAR_1', cat: 'chain', chain: 'CH_TRADE_WAR', step: 1, title: 'Ticaret Savaşı', tags: ['trade', 'sabotage'],
    art: { sky: 'day', sea: 'calm', obj: ['merchantShip'] },
    text: `Loncanın kırmızı flamalı gemisi yanına yanaştı. Lonca temsilcisi, fiyat birliğine katılmazsan bir sonraki limanda malını kimsenin almayacağını söyledi.`,
    options: [
      { label: 'Loncaya katıl', icon: 'coin', cost: { gold: 80 },
        win: { text: `Aidatı ödedin; lonca seni koruyacağını söyledi.`, fx: { flag: { joined: true }, next: 'CH_TRADE_WAR_2', nextAt: 'arrival' } } },
      { label: 'Hamid pazarlık etsin', icon: 'beads', req: { crew: 'CREW_HAMID' },
        win: { text: `Hamid temsilciyi öyle bir sohbete boğdu ki aidat sıfırlandı ve lonca seni koruması altına aldı.`, fx: { flag: { joined: true }, next: 'CH_TRADE_WAR_2', nextAt: 'arrival' } } },
      { label: 'Tarık karşı hamle', icon: 'abacus', req: { crew: 'CREW_TARIK' },
        win: { text: `Tarık loncanın defterlerine göz attı ve bir plan kurdu.`, fx: { flag: { tarik: true }, next: 'CH_TRADE_WAR_2', nextAt: 'arrival' } } },
      { label: 'Reddet', icon: 'no',
        win: { text: `Temsilciyi gemiden kovdun. Lonca bunu unutmayacak.`, fx: { flag: { refused: true }, next: 'CH_TRADE_WAR_2', nextAt: 'arrival' } } },
    ],
  },
  {
    id: 'CH_TRADE_WAR_2', cat: 'chain', chain: 'CH_TRADE_WAR', step: 2, title: 'Loncanın Hamlesi', tags: ['trade'],
    art: { sky: 'day', sea: 'calm', obj: ['dock', 'merchantShip'] },
    text: `Limana girdiğinde loncanın adamları rıhtımdaydı ve pazarın havası değişmişti.`,
    options: [
      { label: 'Pazara çık', icon: 'scale',
        cases: [
          { when: { flag: 'tarik' }, text: `Tarık'ın yaydığı söylenti loncayı çökertti; tüccarlar senin mallarına koştu.`, fx: { status: 'boom', xp: 25, ...END } },
          { when: { flag: 'joined' }, text: `Lonca sözünü tuttu; fiyatlar senin lehineydi.`, fx: { status: 'boom', xp: 10, ...END } },
        ],
        win: { text: `Lonca sabotaj yaptı; bu limandaki satış fiyatların %20 düştü.`, fx: { status: 'fine', xp: 5, ...END } } },
    ],
  },
  // ───────────── Hayalet Gemi (EVT_M_11 ile başlar) ─────────────
  {
    id: 'EVT_M_11', cat: 'mystery', chain: 'CH_GHOST', step: 1, title: 'Yankılanan Çan', tier: 2, regions: [2, 3, 4, 5], tags: ['ghost', 'fog'],
    art: { sky: 'fog', sea: 'dark', obj: ['bell'], fx: ['fog'] },
    text: `Sisin içinden boğuk bir çan sesi yankılandı. Etrafta ne bir şamandıra ne de bir gemi vardı, ama çan çalmaya devam etti.`,
    options: [
      { label: 'Sesi takip et', icon: 'compass', win: { text: `Dümeni çan sesine çevirdin.`, fx: { next: 'CH_GHOST_2' } } },
      { label: 'Uzaklaş', icon: 'no', tags: PASS, win: { text: `Çan sesi arkanda giderek kısıldı.`, fx: { ...END } } },
    ],
  },
  {
    id: 'CH_GHOST_2', cat: 'chain', chain: 'CH_GHOST', step: 2, title: 'Hayalet Kaptan', tags: ['ghost', 'night'],
    art: { sky: 'night', sea: 'dark', obj: ['ghostShip', 'moon'], fx: ['glow', 'fog'] },
    text: `Çan, yeşil ışıklar saçan bir hayalet geminin direğindeydi. Güvertede yarı saydam bir kaptan sana el salladı.`,
    options: [
      { label: 'Gemiye çık', icon: 'hand', chance: 50, bonus: [{ crew: 'CREW_MAGDA', add: 50 }, { item: 'ITEM_AMULET', add: 30 }],
        win: { text: `Hayalet kaptan, sevdiğine ulaştırılmak üzere bir madalyon uzattı: "Bir sonraki limanda bekliyor," diye fısıldadı.`, fx: { next: 'CH_GHOST_3', nextAt: 'arrival' } },
        lose: { text: `Güverteye adım attığın anda buz gibi bir rüzgâr seni geri savurdu.`, fx: { hull: -25, ...END } } },
      { label: 'Uzaktan dua et', icon: 'heart', win: { text: `Hayalet gemi yavaşça sise karıştı.`, fx: { xp: 15, ...END } } },
    ],
  },
  {
    id: 'CH_GHOST_3', cat: 'chain', chain: 'CH_GHOST', step: 3, title: 'Madalyon', tags: ['ghost'],
    art: { sky: 'dusk', sea: 'calm', obj: ['dock', 'lightOrb'], fx: ['glow'] },
    text: `Limanın ucundaki fenerin dibinde yaşlı bir kadın denize bakıyordu. Madalyonu görünce gözleri doldu.`,
    options: [
      { label: 'Madalyonu ver', icon: 'heart',
        win: { text: `Kadın madalyonu göğsüne bastırdı. O gece limanın üzerinde yeşil bir ışık parladı ve sonsuza dek söndü. Ertesi sabah kapının önünde bir hediye buldun.`, fx: { xp: 50, item: 'rare', ach: 'ACH_GHOST', codexNote: 'ghostCaptain', ...END } } },
      { label: 'Madalyonu sat', icon: 'coin',
        win: { text: `Altın madalyonu sattın. O geceden sonra kamarana buz gibi bir soğuk çöktü.`, fx: { gold: 150, hullRaw: -20, ...END } } },
    ],
  },
  // ───────────── İsadora'nın Kayıp Prenses zinciri ─────────────
  {
    id: 'CH_PRINCESS_1', cat: 'chain', chain: 'CH_PRINCESS', step: 1, title: 'Prensesim', tags: [],
    cond: { crew: 'CREW_ISADORA' },
    art: { sky: 'day', sea: 'calm', obj: ['merchantShip', 'boat'] },
    text: `Bir ticaret gemisindeki yaşlı bir hizmetkâr İsadora'yı görünce dizlerinin üstüne çöktü. "Prensesim," diye fısıldadı. İsadora yüzünü pelerinine sakladı.`,
    options: [
      { label: "İsadora'ya sor", icon: 'talk', win: { text: `İsadora uzun süre sustu. "Henüz değil," dedi sadece.`, fx: { xp: 10, next: 'CH_PRINCESS_2', nextAt: 'route' } } },
      { label: 'Hizmetkârı dinle', icon: 'scroll', win: { text: `Hizmetkâr, Titan Çarşısı'nın tahtından kaçırılan bir prensesin hikâyesini anlattı.`, fx: { xp: 10, reveal: 1, next: 'CH_PRINCESS_2', nextAt: 'route' } } },
    ],
  },
  {
    id: 'CH_PRINCESS_2', cat: 'chain', chain: 'CH_PRINCESS', step: 2, title: 'Ödül Avcıları', tags: ['attack', 'pursuit'],
    cond: { crew: 'CREW_ISADORA' },
    art: { sky: 'dusk', sea: 'choppy', obj: ['warship'] },
    text: `Kara armalı bir gemi rotanı kesti. Ödül avcıları, İsadora'yı teslim etmen karşılığında 400 altın teklif etti.`,
    options: [
      { label: 'Kaç', icon: 'sail', chance: 55, tags: ['escape'],
        win: { text: `Ödül avcılarını atlattın. İsadora sana sessizce teşekkür etti.`, fx: { next: 'CH_PRINCESS_3', nextAt: 'route' } },
        lose: { text: `Avcılar gemini kurşunladı ama İsadora'yı alamadılar.`, fx: { hull: -30, next: 'CH_PRINCESS_3', nextAt: 'route' } } },
      { label: 'Savaş', icon: 'cannon', req: { item: 'ITEM_CANNON' }, chance: 65, tags: ['combat'],
        win: { text: `Avcıların gemisi alev alev kaçtı; ardında bir kese bıraktı.`, fx: { goldR: 100, next: 'CH_PRINCESS_3', nextAt: 'route' } },
        lose: { text: `Çatışma kanlı geçti ama İsadora güvendeydi.`, fx: { hull: -40, next: 'CH_PRINCESS_3', nextAt: 'route' } } },
      { label: "İsadora'yı teslim et", icon: 'coin', hint: '400 altın; İsadora ayrılır',
        win: { text: `Ödül avcıları İsadora'yı aldı. Son bakışını hiç unutmayacaktın.`, fx: { gold: 400, crewRemove: 'CREW_ISADORA', xp: -30, ...END } } },
    ],
  },
  {
    id: 'CH_PRINCESS_3', cat: 'chain', chain: 'CH_PRINCESS', step: 3, title: 'Kraliyet Mührü', tags: [],
    cond: { crew: 'CREW_ISADORA' },
    art: { sky: 'dawn', sea: 'calm', obj: ['dock', 'warship'], fx: ['sparkle'] },
    text: `İsadora sonunda gerçeği anlattı: o, tahttan sürülen Kraliçe Elena'nın kızıydı. Sadık bir amiral, ona ait olan mührü sana teslim etti.`,
    options: [
      { label: 'Mührü kabul et', icon: 'crown',
        win: { text: `Kraliyet mührünü taşıyan gemin artık her limanda kahraman gibi karşılanacaktı. İsadora tayfanda kalmaya karar verdi.`, fx: { gold: 500, xp: 60, status: 'hero', ach: 'ACH_PRINCESS', codexNote: 'princess', ...END } } },
    ],
  },
  // Korsanın Teklifi 3B sonrası olası takip eventi (zincir dışı, havuzda değil)
  {
    id: 'EVT_CH_PURSUIT', cat: 'danger', pool: false, title: 'Mührün Sahibi', tier: 2, tags: ['pirate', 'attack', 'pursuit'],
    art: { sky: 'dusk', sea: 'choppy', obj: ['pirateShip'] },
    text: `Ufukta tanıdık bir korsan bayrağı belirdi. Sandığını açtığın kaptan, mührünü geri almak için peşindeydi.`,
    options: [
      { label: 'Kaç', icon: 'sail', chance: 50, tags: ['escape'], bonus: [{ crew: 'CREW_OKSANA', add: 25 }],
        win: { text: `Korsanı bir kez daha atlattın.`, fx: { xp: 10 } },
        lose: { text: `Korsan yetişti ve öfkesini gövdenden çıkardı.`, fx: { hull: -25, gold: -80 } } },
      { label: 'Savaş', icon: 'cannon', req: { item: 'ITEM_CANNON' }, chance: 60, tags: ['combat'],
        win: { text: `Korsanı topa tuttun; bu sefer pes etti.`, fx: { goldR: 120, xp: 15 } },
        lose: { text: `Çatışma uzun sürdü.`, fx: { hull: -35 } } },
      { label: 'Haritayı geri ver', icon: 'oldmap', req: { item: 'ITEM_ANCIENT_MAP' },
        win: { text: `Haritayı ona fırlattın; kaptan sırıtıp geri döndü.`, fx: { loseItem: 'ITEM_ANCIENT_MAP', xp: 10 } } },
    ],
  },
];
