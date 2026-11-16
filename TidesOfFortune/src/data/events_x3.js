// GENİŞLEME PAKETİ 3 — EFSANEVİ DENİZLER VE RAKİP KAPTANLAR: 25 bağımsız olay (EVT_X3_*).
// Dağılım: danger 6 (D01–D05, CREW01), fortune 8 (F01–F05, CREW02, CREW03, PET01),
// mystery 6 (M01–M04, L01, L03), disaster 4 (DIS01–DIS03, L02), repair 1 (REPAIR01).
// x3cap: olaydaki rakip kaptan(lar) — bir seferde bir karşılaşma, 2 liman bekleme (X3System).
// legend: efsane (kategori içi düşük ağırlık, run'da tekrar yok, Sonsuz Deniz'de 4 limanlık dilimde en fazla bir).
// Etiketler: parley (Kaptanlar Masası), rescue/bridge (Kurtarma İskelesi), sound/shallows/pillars/depth (İskandil),
// collision/keel (Kıç Destek Kirişi). prism: İşaret Prizması güvenli seçeneği. x2variant: Sonsuz Deniz derinlik varyantı.
const PASS = ['pass'];
const X = (o) => ({ x3: true, ...o });
const NAV = ['CREW_COMPASS', 'CREW_SURGE', 'CREW_FINN', 'CREW_TOBIAS'];

export const X3_EVENTS = [
  // ═══════════ TEHLİKE (6) ═══════════
  X({ id: 'EVT_X3_D01', cat: 'danger', title: 'Korsanların Rehine Sandalı', tier: 2, regions: [2, 3, 4, 5], tags: ['pirate', 'rescue'], weight: 8,
    art: { sky: 'day', sea: 'choppy', obj: ['pirateShip', 'boat'] },
    text: `Bir korsan gemisi, arkasına bağladığı küçük bir sandalı sürüklüyor. Sandaldaki iki denizci el sallıyor; korsan kaptan bağırıyor: "Fidyesini ödeyen alır!"`,
    options: [
      { label: '60 altın fidye öde', icon: 'coin', cost: { gold: 60 },
        win: { text: `Keseyi halatla korsan gemisine gönderdin. Sandalın halatı çözüldü; denizciler tayfana katılıp limana kadar yol arkadaşı oldu. Biri Boran'ın eski tayfasındanmış.`, fx: { xp: 15, x3: { relIfKnown: { boran: 1 } } } } },
      { label: 'Halatla kurtar', icon: 'rope', chance: 70, tags: ['rescue', 'tow'],
        win: { text: `Gece gibi sessiz bir manevrayla sandalın halatını kestin ve kendi halatını attın. Korsanlar fark ettiğinde sandal çoktan senin dümen suyundaydı. Denizciler cebindeki birikimi teşekkür olarak bıraktı.`, fx: { xp: 20, goldR: 60 } },
        lose: { text: `Korsanlar halatı fark etti; gülleler küpeşteni buldu. Sandal yine de koptu ve denizciler yüzerek gemine ulaştı.`, fx: { hull: -15 } } },
      { label: 'Uzaktan izle', icon: 'eye', tags: PASS,
        win: { text: `Mesafeni korudun. Korsanlar ufka doğru uzaklaşırken sandalın rotasını not ettin.`, fx: { xp: 5 } } },
    ] }),

  X({ id: 'EVT_X3_D02', cat: 'danger', title: 'Gezici Top Salı', tier: 2, regions: [2, 3, 4, 5], tags: ['attack', 'raft'], weight: 8,
    art: { sky: 'day', sea: 'choppy', obj: [] },
    text: `Akıntıda başıboş bir sal sürükleniyor; üstünde fitili yanmış iki eski top var. Sal döndükçe namlular sırayla gemine dönüyor.`,
    options: [
      { label: 'Etrafından dolaş', icon: 'compass', tags: PASS,
        win: { text: `Geniş bir yay çizdin. Biraz vakit kaybettin ama toplar boşa ateş etti.`, fx: { x1: { delay: 5 } } } },
      { label: 'Salı ele geçir', icon: 'hand', chance: 60, tags: ['bridge', 'brave'],
        win: { text: `Tayfa sala atladı, fitilleri söndürdü. Topları ve salın altındaki gizli sandığı limanda iyi paraya satacaksın.`, fx: { goldR: 115, xp: 10 } },
        lose: { text: `Fitil son anda ateş aldı; gülle gövdeyi sıyırdı.`, fx: { hull: -22 } } },
      { label: 'Topla bağlantıyı kopar', icon: 'cannon', chance: 85, tags: ['combat'], req: { item: 'ITEM_CANNON' },
        win: { text: `Güverte topu tek atışta salın bağlarını kopardı. Toplar suya gömüldü.`, fx: { xp: 15 } },
        lose: { text: `Atış ıskaladı; sal döndü ve gülle küpeşteyi yaladı.`, fx: { hull: -10 } } },
    ] }),

  X({ id: 'EVT_X3_D03', cat: 'danger', title: 'Sürüklenen Ağır Çapa', tier: 1, regions: [1, 2, 3, 4], tags: ['collision', 'depth'], weight: 9,
    art: { sky: 'day', sea: 'calm', obj: [] },
    text: `Kıç tarafından bir gıcırtı geldi. Batık bir gemiden kopmuş dev bir çapa zinciriyle birlikte dümen halatlarına takıldı ve gemiyi yana çekiyor.`,
    options: [
      { label: 'Manevrayla kurtul', icon: 'sail', chance: 75, tags: ['maneuver', 'keel'],
        win: { text: `Dümeni sert kırdın; zincir kaydı ve çapa derinlere düştü.`, fx: { xp: 10 } },
        lose: { text: `Çapa kıç tarafına çarptı; tahtalar inledi.`, fx: { hull: -12 } } },
      { label: 'Kıç halatlarını kes', icon: 'hammer', tags: PASS,
        win: { text: `Tayfa halatları kesti. Yedek halatlar bağlanana kadar biraz uğraştınız ama gemi güvende.`, fx: { xp: 8 } } },
      { label: 'Çapayı kurtar', icon: 'crate', chance: 60, tags: ['lift', 'keel'],
        win: { text: `Vinç ve palangalar iş gördü; dev çapa güverteye yatırıldı. Demirciler bunun için iyi öder.`, fx: { goldR: 65, xp: 10 } },
        lose: { text: `Zincir koptu; çapa savrulup kıça çarptı.`, fx: { hull: -18 } } },
    ] }),

  X({ id: 'EVT_X3_D04', cat: 'danger', title: 'Kara Dumanlı Devriye', tier: 2, regions: [3, 4, 5], tags: ['military', 'inspection'], weight: 8,
    art: { sky: 'day', sea: 'choppy', obj: ['warship'] },
    text: `Bacasından kara duman yükselen bir devriye gemisi yolunu kesti. Subay borazanla bağırıyor: "Ambar denetimi! Yelkenleri indir!"`,
    options: [
      { label: 'Denetime izin ver', icon: 'scroll',
        win: { text: `Muhafızlar ambarı aradı. Kurallar neyse o uygulandı; yasaklı ne varsa alındı.`, fx: { xp: 5, confiscate: 100 } } },
      { label: 'Muhafızlarla konuş', icon: 'crown', req: { x3: { repOr: { faction: 'crown', min: 2, items: ['ITEM_MERCHANT_SEAL', 'ITEM_QUALITY_SEAL'] } } }, hint: 'Muhafız itibarı +2 ya da tüccar mührü',
        win: { text: `Mührünü/selamını gören subay borazanı indirdi: "Tanınmış bir kaptan. Geçebilirsin."`, fx: { xp: 10 } } },
      { label: 'Riskli kaçış', icon: 'sail', chance: 65, tags: ['escape'],
        win: { text: `Rüzgârı arkana alıp kara dumanın içinden sıyrıldın.`, fx: { xp: 10 } },
        lose: { text: `Devriye ateş açtı; kaçabildin ama adın kayda geçti.`, fx: { hull: -20, x1: { rep: { crown: -1 } } } } },
    ] }),

  X({ id: 'EVT_X3_D05', cat: 'danger', title: 'Kül Yelkenli Avcı', tier: 2, regions: [2, 3, 4, 5], tags: ['wreck', 'rival'], weight: 9, x3cap: ['neris'],
    art: { sky: 'dusk', sea: 'calm', obj: ['halfSunk'] },
    x2variant: { minDepth: 3, label: 'Uzak gözcü', text: 'Ufukta turkuaz bir yelken de duruyor: Liora bu yarışı uzaktan izliyor.' },
    text: `Kömür renkli gövdesi, bakır çizgili yelkeni ve küçük kurtarma vinciyle "Kül Pusulası" aynı batığa yöneldi. Kaptanı Neris dürbününü indirdi: "Bu enkaz kimin, kaptan?"`,
    options: [
      { label: 'Ortak kurtarma öner', icon: 'hand', chance: 70, tags: ['parley', 'lift'],
        win: { text: `Neris'in vinciyle senin halatların birlikte çalıştı. Kurtarılan sandıkları adilce paylaştınız.`, fx: { goldR: 45, xp: 10, x3: { rel: { neris: 1 }, envoy: true } } },
        lose: { text: `Paylaşımda anlaşamadınız; Neris kaşlarını çatıp vincini topladı.`, fx: { xp: 5, x3: { relSoft: { neris: -1 } } } } },
      { label: 'İlk sen davran', icon: 'sail', chance: 60, tags: ['race'],
        win: { text: `Neris yanaşmadan önce batığın kamarasındaki kasayı aldın.`, fx: { gold: 100 } },
        lose: { text: `Gemiler batığın üstünde birbirine sürtündü; Neris öfkeyle uzaklaştı.`, fx: { hull: -12, x3: { relSoft: { neris: -1 } } } } },
      { label: 'Dostça çekil', icon: 'flag', tags: PASS,
        win: { text: `Bayrakla selam verip uzaklaştın. Neris şapkasını çıkardı: "Bunu unutmam."`, fx: { xp: 5, x3: { rel: { neris: 1 } } } } },
    ] }),

  X({ id: 'EVT_X3_CREW01', cat: 'danger', title: "Bjorn'un Kurtarma Halatı", tier: 1, tags: ['rescue', 'wave'], weight: 7, cond: { crew: 'CREW_BJORN' },
    art: { sky: 'day', sea: 'stormy', obj: ['boat'] },
    text: `Dev bir dalga küçük bir balıkçı teknesini devirdi. Bjorn kalın halatı omzuna aldı bile: "Kaptan, izin ver!"`,
    options: [
      { label: "Bjorn'a izin ver", icon: 'rope', req: { crew: 'CREW_BJORN' },
        win: { text: `Bjorn halatı attı ve tek başına çekti. Balıkçılar güverteye çıkınca Bjorn'a sarıldı.`, fx: { xp: 20 } } },
      { label: 'Birlikte çekin', icon: 'crew', chance: 75, tags: ['rescue'],
        win: { text: `Tayfa sıraya dizildi; halat gerildi, tekne doğruldu. Balıkçılar teşekkür olarak biriktirdiklerini verdi.`, fx: { xp: 15, gold: 40 } },
        lose: { text: `Halat küpeşteyi yardı ama balıkçılar kurtuldu.`, fx: { hull: -10 } } },
      { label: 'Risksiz yardım', icon: 'anchor', tags: PASS,
        win: { text: `Can simidi attınız; balıkçılar tutunup kendi teknelerini doğrulttu.`, fx: { xp: 5 } } },
    ] }),

  // ═══════════ ŞANS (8) ═══════════
  X({ id: 'EVT_X3_F01', cat: 'fortune', title: 'Gezgin Harita Matbaası', tier: 1, tags: ['trade', 'map'], weight: 9,
    art: { sky: 'day', sea: 'calm', obj: ['merchantShip'] },
    text: `Güvertesinde baskı makinesi olan bir gemi yanaştı. Mürekkep lekeli usta seslendi: "Taze haritalar! Ya da eski bir harita getir, takas edelim."`,
    options: [
      { label: '35 altına rota haritası', icon: 'coin', cost: { gold: 35 },
        win: { text: `Yeni basılmış haritada önündeki suların işaretleri var.`, fx: { reveal: 2 } } },
      { label: 'Baskıya yardım et', icon: 'hand',
        win: { text: `Tayfa makinenin kolunu çevirdi; usta sana ilk baskıyı imzaladı.`, fx: { xp: 15 } } },
      { label: 'Eski haritanı takas et', icon: 'oldmap', req: { x3: { anyOf: { items: ['ITEM_ANCIENT_MAP', 'ITEM_SEA_CHART'], goods: ['GOOD_ANTIQUE'] } } }, hint: 'Eski harita (item) ya da antika gerekli',
        win: { text: `Usta eski haritayı görünce gözlüğünü düzeltti: "Bunun aslı kayıptı!" Bedelini cömertçe ödedi.`, fx: { goldR: 85, x3: { tradeMap: true } } } },
    ] }),

  X({ id: 'EVT_X3_F02', cat: 'fortune', title: 'Denizci Posta Flotillası', tier: 1, tags: ['signal', 'mail'], weight: 9,
    art: { sky: 'day', sea: 'calm', obj: ['boat', 'boat'] },
    prism: { text: `Prizmayla flotillanın lider teknesine ışık kodu gönderdin; postacılar en hızlı rotalarını paylaştı.`, fx: { xp: 10, reveal: 2 } },
    text: `Üç küçük posta teknesi bayraklarla dizilmiş; biri mektup çuvalını sallıyor: "Bir sonraki limana mektup götürür müsün?"`,
    options: [
      { label: 'Mektubu taşı', icon: 'scroll',
        win: { text: `Mühürlü mektubu kamarana koydun. Bir sonraki limanda teslim edince ücretini alacaksın.`, fx: { xp: 10, x3: { courier: true } } } },
      { label: 'Kuryeyi doğru rotaya yönlendir', icon: 'compass',
        win: { text: `Kaybolmuş kurye teknesine doğru rotayı gösterdin; flotilla bayraklarıyla teşekkür etti.`, fx: { xp: 15 } } },
      { label: '25 altına söylenti al', icon: 'coin', cost: { gold: 25 },
        win: { text: `Postacılar her limanın dedikodusunu bilir.`, fx: { reveal: 1, x2: { laneIntel: 1 } } } },
    ] }),

  X({ id: 'EVT_X3_F03', cat: 'fortune', title: 'Yelken Dokumacıları', tier: 1, regions: [1, 2, 3, 4], tags: ['trade', 'sail'], weight: 8,
    art: { sky: 'day', sea: 'calm', obj: ['merchantShip'] },
    text: `Güvertesi rengârenk kumaş toplarıyla dolu bir dokumacı gemisi yanaştı: "Yelkenlerin yorgun görünüyor, kaptan!"`,
    options: [
      { label: '45 altına yelken bakımı', icon: 'coin', cost: { gold: 45 },
        win: { text: `Dokumacılar yırtıkları yamadı, yelkenleri yıkayıp güneşte kuruttu. Gemi yeni gibi parlıyor.`, fx: { hull: 12, x3: { flag: { sailCleaned: true } } } } },
      { label: 'Eski kumaşı sat', icon: 'crate', req: { cargoGood: 'GOOD_SILK' }, hint: '1 birim ipek',
        win: { text: `Dokumacılar ipeğini hemen aldı; ustalar parmaklarıyla kumaşı okşadı.`, fx: { goldR: 50, cargoRemove: 'GOOD_SILK', cargoRemoveQty: 1 } } },
      { label: 'Dokumaya yardım et', icon: 'hand',
        win: { text: `Tayfa tezgâhın başına geçti; akşam olunca yeni bir yelken bitmişti.`, fx: { xp: 15 } } },
    ] }),

  X({ id: 'EVT_X3_F04', cat: 'fortune', title: 'İki Kaptanın Ortak Pazarlığı', tier: 2, regions: [2, 3, 4, 5], tags: ['trade', 'rival'], weight: 8, x3cap: ['liora', 'boran'],
    art: { sky: 'day', sea: 'calm', obj: ['merchantShip', 'merchantShip'] },
    x2variant: { minDepth: 3, label: 'Üçüncü yelken', text: 'Derin sularda bakır çizgili bir yelken de yaklaşıyor: Neris pazarlığı uzaktan izliyor.' },
    prism: { text: `Prizmayla iki gemiye aynı anda işaret verdin; ikisi de güldü ve ortak bir teklif sundu.`, fx: { xp: 10, gold: 40, x3: { rel: { liora: 1, boran: 1 } } } },
    text: `Turkuaz yelkenli Liora ve koyu kırmızı yelkenli Boran iki yandan yanaştı. İkisi de aynı malı istiyor, ikisi de seninle anlaşmak istiyor.`,
    options: [
      { label: "Liora ile hızlı ticaret", icon: 'sail', tags: ['parley'],
        win: { text: `Liora'nın hızlı gemisi yüklerini sonraki limana senden önce duyuracak: satışların biraz daha iyi gidecek.`, fx: { xp: 5, x2: { tradeBoost: true }, x3: { rel: { liora: 1 } } } } },
      { label: 'Boran ile 60 altınlık anlaşma', icon: 'hammer', cost: { gold: 60 },
        win: { text: `Boran'ın marangozları gövdendeki yaraları sağlam meşeyle kapattı.`, fx: { hull: 20, x3: { rel: { boran: 1 } } } } },
      { label: 'İkisini dengele', icon: 'scale', chance: 70, tags: ['parley'],
        win: { text: `İkisine de aynı sözü verdin, ikisi de kazandı. Liora ve Boran ilk kez aynı anda güldü.`, fx: { xp: 10, x3: { rel: { liora: 1, boran: 1 } } } },
        lose: { text: `İki kaptan da kendini haklı gördü; pazarlık dağıldı ama kimse kırılmadı.`, fx: { xp: 5 } } },
    ] }),

  X({ id: 'EVT_X3_F05', cat: 'fortune', title: 'Balıkçıların Işık Ağı', tier: 1, regions: [1, 2, 3, 4], tags: ['fish', 'night'], weight: 9,
    art: { sky: 'night', sea: 'calm', obj: ['boat'] },
    text: `Karanlık suda yüzlerce küçük fener yanıyor: balıkçılar ışıklı ağlarını geriyor. Biri seslendi: "Bir el daha lazım!"`,
    options: [
      { label: 'Ağı çekmeye yardım et', icon: 'net',
        win: { text: `Ağ gümüş balıklarla doldu. Balıkçılar payını ambarına koydu.`, fx: { xp: 15, cargoAdd: { good: 'GOOD_FISH', qty: 1 } } } },
      { label: '35 altına ağ ve av al', icon: 'coin', cost: { gold: 35 },
        win: { text: `Taze avı ve eski bir ağı uygun fiyata aldın.`, fx: { cargoAdd: { good: 'GOOD_FISH', qty: 2 } } } },
      { label: 'Işıkları izle', icon: 'eye',
        win: { text: `Fenerler akıntının yönünü gösteriyor; önündeki sular hakkında bir fikir edindin.`, fx: { xp: 5, reveal: 1 } } },
    ] }),

  X({ id: 'EVT_X3_CREW02', cat: 'fortune', title: "Kalani'nin Rüzgâr Dersi", tier: 1, regions: [1, 2, 3, 4], tags: ['wind'], weight: 7, cond: { crew: 'CREW_KALANI' },
    art: { sky: 'day', sea: 'calm', obj: [] },
    text: `Kral Kalani güvertede bir tüyü havaya bıraktı: "Rüzgârı dinlemeyi bilen kaptan fırtınayı önceden duyar. Gel, göstereyim."`,
    options: [
      { label: 'Dersi dinle', icon: 'book',
        win: { text: `Kalani tüyün dönüşünden rüzgârın değişimini okumayı öğretti. Bir sonraki zor manevrada bunu kullanacaksın.`, fx: { xp: 15, x2: { chanceOnce: { add: 5, label: 'Kalani\'nin dersi', tags: ['navigate', 'maneuver', 'escape'] } } } } },
      { label: "Liora'ya da göster", icon: 'sail', show: { x3: { capSeen: 'liora' } },
        win: { text: `Liora'nın gemisine işaret verdin; Kalani dersini ona da anlattı. Liora "Bunu bana kimse öğretmemişti" dedi.`, fx: { xp: 10, x3: { rel: { liora: 1 } } } } },
      { label: 'Sonraya bırak', icon: 'no', tags: PASS,
        win: { text: `Kalani gülümsedi: "Rüzgâr bekler."`, fx: { xp: 5 } } },
    ] }),

  X({ id: 'EVT_X3_CREW03', cat: 'fortune', title: "Compass Rose'un Sessiz Kodu", tier: 2, regions: [2, 3, 4, 5], tags: ['signal'], weight: 7, cond: { crew: 'CREW_COMPASS' },
    art: { sky: 'day', sea: 'calm', obj: [] },
    text: `Compass Rose pusulanın kapağını üç kez açıp kapattı ve sana göz kırptı: eski haritacıların sessiz kodu. Bir şey görmüş.`,
    options: [
      { label: "Rose'a güven", icon: 'compass',
        win: { text: `Rose önündeki tehlikeleri tek tek işaretledi.`, fx: { xp: 20, reveal: 2 } } },
      { label: 'Kodu kendin çöz', icon: 'scroll', chance: 70,
        win: { text: `Kodu çözdün: eski bir haritacının sakladığı küçük bir kese!`, fx: { xp: 15, gold: 50 } },
        lose: { text: `Kod karışık geldi; Rose sabırla tekrar anlattı.`, fx: { xp: 5 } } },
      { label: 'Görmezden gel', icon: 'no', tags: PASS,
        win: { text: `Rose omuz silkti ve pusulayı kapattı.`, fx: { xp: 5 } } },
    ] }),

  X({ id: 'EVT_X3_PET01', cat: 'fortune', title: 'Gece Nöbetindeki İki Dost', tier: 2, regions: [2, 3, 4, 5], tags: ['pet', 'night'], weight: 7, cond: { pets: ['PET_TARCIN', 'PET_ZIPIR'] },
    art: { sky: 'night', sea: 'calm', obj: [] },
    text: `Gece nöbetinde Tarçın ve Zıpır aynı anda pruvaya koştu. Tarçın kulaklarını dikti, Zıpır kuyruğunu kabarttı; karanlıkta bir şey var.`,
    options: [
      { label: 'İkisini izle', icon: 'dog',
        win: { text: `İki dost seni karanlıktaki uzak bir fenere götürdü: bakır çizgili bir yelken. Neris'in rotası, ertesi gün Liora'nın da oradan geçeceğini söylüyor.`, fx: { xp: 15, reveal: 1 } } },
      { label: 'Alarm ver', icon: 'bell', chance: 75,
        win: { text: `Tayfa yerini aldı; karanlıktaki kayalık zamanında fark edildi.`, fx: { xp: 10 } },
        lose: { text: `Telaşla dümen kırılınca gemi bir şamandıraya sürtündü.`, fx: { hull: -8 } } },
      { label: 'Sakinleştirip dinlen', icon: 'heart', tags: PASS,
        win: { text: `Tarçın ve Zıpır kucağında uyuyakaldı. Gece sakin geçti.`, fx: { xp: 5 } } },
    ] }),

  // ═══════════ GİZEM (4 + 2 efsane) ═══════════
  X({ id: 'EVT_X3_M01', cat: 'mystery', title: 'Kayıp Günün Günlüğü', tier: 2, regions: [2, 3, 4, 5], tags: ['book', 'rival'], weight: 8, x3cap: ['neris'],
    art: { sky: 'fog', sea: 'calm', obj: [] },
    text: `Sisin içinde yüzen mühürlü bir gemi günlüğü buldun. Son sayfası boş; tarihi ise yarın. Kapağında bakır bir pusula işareti: Kül Pusulası'nın arması.`,
    options: [
      { label: 'Son sayfayı oku', icon: 'book', chance: 65, tags: ['explore'],
        win: { text: `Sayfa sen okudukça doldu: önündeki sulara dair kısa ve doğru bir kehanet.`, fx: { xp: 20, reveal: 1 } },
        lose: { text: `Sayfa karardı; sis gemiyi bir kayalığa doğru itti.`, fx: { hull: -8 } } },
      { label: "Codex'e kaydet", icon: 'scroll',
        win: { text: `Günlüğün her sayfasını kopyaladın; Codex'e tuhaf bir not düştün.`, fx: { xp: 15 } } },
      { label: 'Sahibine iade et', icon: 'boat', tags: ['parley'],
        win: { text: `Sisin içinden Kül Pusulası çıktı. Neris günlüğü alınca sustu: "Bunu kaybettiğim günü hatırlamıyorum." Sana minnetle baktı.`, fx: { xp: 10, x3: { rel: { neris: 1 } } } } },
    ] }),

  X({ id: 'EVT_X3_M02', cat: 'mystery', title: 'Denizde Beliren Yazılar', tier: 2, regions: [3, 4, 5], tags: ['symbol', 'atlas'], weight: 8,
    art: { sky: 'day', sea: 'calm', obj: [] },
    text: `Suyun yüzeyinde ışıktan harfler belirdi, dalgayla birlikte kayıp yeniden dizildi. Bir haritacının el yazısı gibi.`,
    options: [
      { label: 'Yazıyı çöz', icon: 'scroll', chance: 65, tags: ['explore'],
        win: { text: `Harfler bir adres gösteriyor: kayıp bir atlasın sayfaları denize dağılmış.`, fx: { xp: 20, x2: { hint: { chain: 'CH_X3_ATLAS', mult: 2 } } } },
        lose: { text: `Harfler dağıldı; yalnızca birkaçını not edebildin.`, fx: { xp: 5 } } },
      { label: 'Kadim işaretlerle oku', icon: 'book', show: { upgrade: 'UPG_X2_ANCIENT_SIGNS' },
        win: { text: `Atlas'taki eski işaretler suyun yazısıyla birebir örtüştü. Her şey açık.`, fx: { xp: 20, x2: { hint: { chain: 'CH_X3_ATLAS', mult: 2 } } } } },
      { label: 'Görmezden gel', icon: 'no', tags: PASS,
        win: { text: `Yazılar dalgaların arasında kayboldu.`, fx: { xp: 5 } } },
    ] }),

  X({ id: 'EVT_X3_M03', cat: 'mystery', title: 'Dalgasız Koridor', tier: 2, regions: [2, 3, 4, 5], tags: ['current', 'depth'], weight: 8,
    art: { sky: 'day', sea: 'calm', obj: [] },
    text: `Dalgalı denizin ortasında cam gibi düz, dar bir su koridoru uzanıyor. Kenarlarında dalgalar duvar gibi duruyor.`,
    options: [
      { label: 'Koridora gir', icon: 'sail', chance: 65, tags: ['explore', 'reckless'],
        win: [
          { w: 50, text: `Koridor seni dalgaların altında saklanmış bir batığa götürdü; küçük bir kasa buldun.`, fx: { goldR: 80 } },
          { w: 50, text: `Koridor seni hiç bilmediğin bir akıntıya taşıdı; tayfa hayranlıkla izledi.`, fx: { xp: 15 } },
        ],
        lose: { text: `Koridor kapandı; dalga duvarı gemiye çöktü.`, fx: { hull: -15 } } },
      { label: 'Kenarını incele', icon: 'eye', tags: ['sound'],
        win: { text: `Kenardaki dalgaları ölçtün; koridorun nasıl oluştuğuna dair ilginç notlar aldın.`, fx: { xp: 15 } } },
      { label: 'Akıntıyı ölç', icon: 'compass', chance: 90, tags: ['sound'], req: { crewAny: NAV }, show: { crewAny: NAV },
        win: { text: `Seyirci tayfan akıntının ritmini çözdü: koridor her saat başı açılıp kapanıyor.`, fx: { xp: 20 } },
        lose: { text: `Ölçüm şaştı; yine de bir şeyler öğrendiniz.`, fx: { xp: 5 } } },
    ] }),

  X({ id: 'EVT_X3_M04', cat: 'mystery', title: 'İsimsiz Taş Heykel', tier: 2, regions: [3, 4, 5], tags: ['statue', 'symbol'], weight: 8,
    art: { sky: 'dusk', sea: 'calm', obj: ['rocks'] },
    text: `Küçük bir kayalığın üstünde, yüzü denize dönük, adı silinmiş bir taş heykel duruyor. Kaidesinde yosun tutmuş bir sembol var.`,
    options: [
      { label: 'Sembolü araştır', icon: 'book',
        win: { text: `Sembol eski bir kaptanlar konseyinin işareti. Heykel o konseyin ilk başkanıymış.`, fx: { xp: 15 } } },
      { label: 'Kaideyi temizle', icon: 'hammer', chance: 70, tags: ['loot'],
        win: { text: `Yosunun altından eski sikkeler döküldü: denizcilerin adağı.`, fx: { goldR: 70 } },
        lose: { text: `Kaygan kayada sandal kaydı ve gövdeye çarptı.`, fx: { hull: -10 } } },
      { label: 'Selam ver ve geç', icon: 'flag', tags: PASS,
        win: { text: `Bayrağını indirip kaldırdın. Tayfa heykele başını eğdi.`, fx: { xp: 5 } } },
    ] }),

  // ── EFSANE 1: Sönmeyen Armada ──
  X({ id: 'EVT_X3_L01', cat: 'mystery', title: 'Sönmeyen Armada', tier: 3, regions: [3, 4, 5], tags: ['legend', 'fleet', 'signal'], weight: 3, legend: { minDepth: 2 },
    art: { sky: 'night', sea: 'calm', obj: [] },
    prism: { text: `Prizmanın ışığı üç fenere aynı anda değdi. Armada bir an çözüldü; bir denizci sana bir defter sayfası uzattı ve filo yeniden dondu.`, fx: { xp: 20, x3: { flag: { armadaEvidence: true } }, x2: { hint: { chain: 'CH_X3_ARMADA', mult: 2 } } } },
    text: `Ay ışığında üç gemi duruyor. Yelkenleri rüzgârla dolu ama kıpırdamıyorlar; tayfaları hareketin ortasında donmuş. Her geminin pruvasında sönmeyen bir fener yanıyor.`,
    options: [
      { label: 'Üç feneri eşzamanla', icon: 'lantern', chance: 70, tags: ['signal'],
        win: { text: `Fenerlerin ritmini yakaladın; üçü aynı anda parladı. Donmuş tayfa bir nefeslik çözüldü, sana selam verdi ve filo yeniden dondu. Kaptanın masasındaki belge artık sende.`, fx: { xp: 25, x3: { flag: { armadaEvidence: true } }, x2: { hint: { chain: 'CH_X3_ARMADA', mult: 2 } } } },
        lose: { text: `Ritmi kaçırdın; fenerler kör edici bir ışıkla parladı ve gemin donmuş bir gövdeye sürtündü.`, fx: { hull: -15 } } },
      { label: 'İlk gemiye çık, kayıt defterini kurtar', icon: 'rope', chance: 60, tags: ['bridge', 'loot'],
        win: { text: `İskeleden donmuş güverteye geçtin. Kaptan köşkündeki defter ve sandık soğuk ama sağlam. Geri dönerken arkanda donmuş bir denizci başını hafifçe çevirdi.`, fx: { goldR: 105, xp: 15 } },
        lose: { text: `Donmuş güverte buz gibi kaygandı; iskele kırıldı, gemiler birbirine sürtündü.`, fx: { hull: -18 } } },
      { label: 'Uzaktan kaydet', icon: 'eye', tags: PASS,
        win: { text: `Üç geminin adlarını, fenerlerin ritmini ve donmuş tayfaların duruşunu not ettin. Bu kayıt bir gün işe yarayacak.`, fx: { xp: 15, x2: { hint: { chain: 'CH_X3_ARMADA', mult: 2 } } } } },
    ] }),

  // ── EFSANE 3: Uyuyan Ada ──
  X({ id: 'EVT_X3_L03', cat: 'mystery', title: 'Uyuyan Ada', tier: 3, regions: [3, 4, 5], tags: ['legend', 'creature'], weight: 3, legend: { minDepth: 3 },
    art: { sky: 'day', sea: 'calm', obj: [] },
    x2variant: { minDepth: 5, label: 'Gece adası', text: 'Gecenin içinde adanın sırtındaki yosunlar mavi ışıkla nefes alıyor.' },
    prism: { text: `Prizmanın yumuşak ışığı adanın gözüne değdi. Dev yaratık bir an uyandı, seni tanıdı ve sakin bir dalga bıraktı.`, fx: { xp: 20 } },
    text: `Pruvanın önünde yosunlu, palmiyeli küçük bir ada… yavaşça yükselip alçalıyor. Ada nefes alıyor. Altında devasa bir yüzgeç kıpırdadı; yanında yüzlerce balık yüzüyor.`,
    options: [
      { label: 'Gözlemle', icon: 'eye', tags: PASS,
        win: { text: `Saatlerce izledin. Ada-yaratık uyurken sırtındaki kuşlar yuvalarına döndü. Tayfa bu gördüğünü torunlarına anlatacak.`, fx: { xp: 20 } } },
      { label: 'Eski izi incele', icon: 'dive', chance: 65, tags: ['explore', 'loot'],
        win: [
          { w: 60, text: `Yaratığın sırtındaki eski bir gemi kalıntısında küçük bir hazine buldun. Ada kıpırdamadı bile.`, fx: { goldR: 115 } },
          { w: 40, text: `Kabuğun arasına sıkışmış eski bir kaptan sandığı: içinde nadir bir alet.`, fx: { item: 'rare' } },
        ],
        lose: { text: `Ada döndü; dalga gemiyi geriye savurdu.`, fx: { hull: -15 } } },
      { label: 'Yol ver', icon: 'heart',
        win: { text: `Rotanı değiştirip yol verdin. Ada yavaşça önünden geçti ve derinlere süzüldü; sırtındaki kuşlar seni selamladı. Bir rakip kaptan bu nezaketi uzaktan gördü.`, fx: { xp: 25, x3: { rel: { best: 1 } } } } },
    ] }),

  // ═══════════ FELAKET (3 + 1 efsane) ═══════════
  X({ id: 'EVT_X3_DIS01', cat: 'disaster', title: 'Birleşen Sığlıklar', tier: 2, regions: [2, 3, 4, 5], tags: ['shallows', 'collision'], weight: 8,
    art: { sky: 'day', sea: 'calm', obj: ['rocks'] },
    text: `Gelgit çekildi; iki ayrı sığlık birleşip önünde tek bir kumul duvarı oluşturdu. Omurga kumu öpmek üzere.`,
    options: [
      { label: 'İskandil atarak ilerle', icon: 'compass', chance: 75, tags: ['sound', 'keel'],
        win: { text: `İskandil ipini her kulaçta yeniden attın; dar bir kanal buldun.`, fx: { xp: 10 } },
        lose: { text: `Omurga kuma oturdu; zorla kurtuldun.`, fx: { hull: -15 } } },
      { label: 'Etrafından dolaş', icon: 'anchor', tags: PASS,
        win: { text: `Uzun bir yay çizdin; zaman kaybettin ama gemi sağlam.`, fx: { x1: { delay: 6 } } } },
      { label: 'Hızla geç', icon: 'sail', chance: 60, tags: ['reckless', 'keel'],
        win: { text: `Gelgitin son suyuyla kumulun üstünden kaydın!`, fx: { xp: 10 } },
        lose: { text: `Gemi kumula sert çarptı.`, fx: { hull: -27 } } },
    ] }),

  X({ id: 'EVT_X3_DIS02', cat: 'disaster', title: 'Cam Gibi Kırılan Dalgalar', tier: 3, regions: [4, 5], tags: ['wave', 'glass'], weight: 7,
    art: { sky: 'dusk', sea: 'choppy', obj: [] },
    text: `Dalgalar dalga gibi değil, cam gibi kırılıyor: tepeleri parlak parçalara ayrılıp güverteye yağıyor. Aralarında sakin çukurlar var.`,
    options: [
      { label: 'Sakin çukurları izle', icon: 'compass', chance: 70, tags: ['navigate'],
        win: { text: `Çukurdan çukura geçtin; cam dalgalar arkanda çınladı.`, fx: { xp: 10 } },
        lose: { text: `Bir cam dalga pruvaya kırıldı.`, fx: { hull: -22 } } },
      { label: 'Bekle', icon: 'anchor', tags: PASS,
        win: { text: `Yelkenleri indirdin; olay geçene kadar bekledin.`, fx: { x1: { delay: 5 } } } },
      { label: 'Örnek kurtar', icon: 'crate', chance: 55, tags: ['loot'],
        win: [
          { w: 50, text: `Bir cam dalga parçası güvertede donup kaldı: eşi benzeri olmayan bir hazine.`, fx: { item: 'rare' } },
          { w: 50, text: `Parçayı yakalayamadın ama gördüklerin unutulmaz.`, fx: { xp: 15 } },
        ],
        lose: { text: `Cam dalgalar küpeşteyi parçaladı.`, fx: { hull: -28 } } },
    ] }),

  X({ id: 'EVT_X3_DIS03', cat: 'disaster', title: 'Göğü Kapatan Kuşlar', tier: 1, regions: [2, 3, 4, 5], tags: ['birds', 'dark'], weight: 8,
    art: { sky: 'day', sea: 'calm', obj: [] },
    text: `Ufuktan kara bir bulut yaklaştı… bulut değil: binlerce kuş. Gökyüzü karardı, pusula titriyor, yelkenler kuş tüyüyle doldu.`,
    options: [
      { label: 'Yelkenleri indir, bekle', icon: 'anchor', tags: PASS,
        win: { text: `Sürü geçene kadar bekledin. Güverte tüy içinde kaldı ama kimse yaralanmadı.`, fx: { xp: 5 } } },
      { label: 'Rotayı koru', icon: 'sail', chance: 75, tags: ['navigate'],
        win: { text: `Karanlıkta yıldızsız seyrettin ve sürünün öte yanına sağ salim çıktın.`, fx: { xp: 15 } },
        lose: { text: `Karanlıkta bir şamandıraya çarptın.`, fx: { hull: -10 } } },
      { label: 'Fenerle yol aç', icon: 'lantern', req: { x3: { anyOf: { items: ['ITEM_FLARE'], upgrades: ['UPG_X2_SIGNAL_LAMPS', 'UPG_X3_SIGNAL_PRISM'] } } }, hint: 'İşaret fişeği ya da işaret fenerleri',
        win: { text: `Işık sürünün ortasında bir tünel açtı; kuşlar ışığın etrafında dönerek yol verdi. Unutulmaz bir manzara.`, fx: { xp: 15, luckBuff: { add: 5, events: 1 } } } },
    ] }),

  // ── EFSANE 2: Denizin Üzerindeki Taş Yol ──
  X({ id: 'EVT_X3_L02', cat: 'disaster', title: 'Denizin Üzerindeki Taş Yol', tier: 3, regions: [4, 5], tags: ['legend', 'pillars', 'collision'], weight: 3, legend: { minDepth: 3 },
    art: { sky: 'dusk', sea: 'calm', obj: [] },
    x2variant: { minDepth: 4, label: 'Sert taş yol', chanceAdd: { slow: -5, sound: -5 }, text: 'Bu derinlikte sütunlar daha hızlı yükseliyor; geçit daralıyor.' },
    prism: { text: `Prizmanın ışığı taş yolun çizimlerine değdi; çizimler parladı ve sütunlar sana yol verecek şekilde sıralandı.`, fx: { xp: 20 } },
    text: `Deniz yarıldı: dipten taş sütunlar yükseliyor, üstleri birleşip denizin ortasında bir yol oluşturuyor. Taşların yüzünde ışıyan çizimler var.`,
    options: [
      { label: 'Yavaşça geç', icon: 'compass', chance: 75, tags: ['slow', 'sound', 'keel'],
        win: { text: `Sütunların arasından ağır ağır süzüldün; taş yol arkanda yeniden denize gömüldü.`, fx: { xp: 20 } },
        lose: { text: `Yükselen bir sütun omurgayı sıyırdı.`, fx: { hull: -20 } } },
      { label: 'Kadim işaretleri oku', icon: 'book', show: { any: [{ upgrade: 'UPG_X2_ANCIENT_SIGNS' }, { upgrade: 'UPG_X3_LEGEND_KEEPER' }] },
        win: { text: `Çizimler bir haritanın parçası: taş yol eski bir atlasın sayfasını denize çizmiş. Sütunlar sana güvenli bir yol açtı.`, fx: { xp: 25, x2: { hint: { chain: 'CH_X3_ATLAS', mult: 2 } } } } },
      { label: 'İşaretleri incele', icon: 'eye', chance: 65, tags: ['explore'], show: { all: [{ noUpgrade: 'UPG_X2_ANCIENT_SIGNS' }, { noUpgrade: 'UPG_X3_LEGEND_KEEPER' }] },
        win: { text: `Çizimlerin bir kısmını kopyaladın; bunlar bir haritaya benziyor.`, fx: { xp: 15, x2: { hint: { chain: 'CH_X3_ATLAS', mult: 2 } } } },
        lose: { text: `Taş yol sarsıldı; geri çekilirken gövde sütuna çarptı.`, fx: { hull: -10 } } },
      { label: 'Derin suya dön', icon: 'anchor', tags: PASS,
        win: { text: `Taş yoldan uzaklaştın. Sütunlar arkanda batarken çizimler son kez parladı.`, fx: { xp: 8 } } },
    ] }),

  // ═══════════ TAMİR (1) ═══════════
  X({ id: 'EVT_X3_REPAIR01', cat: 'repair', title: 'Gövde Altı Ustası', tier: 1, tags: ['repair', 'dive'], weight: 9,
    art: { sky: 'day', sea: 'calm', obj: ['boat'] },
    text: `Küçük bir sandaldaki yaşlı dalgıç usta gövdene vurdu: "Bu tahtaların altını kimse yoklamamış. İster misin?"`,
    options: [
      { label: '50 altına onar', icon: 'hammer', cost: { gold: 50 },
        win: { text: `Usta dalıp çıktı, kalafatı yeniledi; gövde sağlamlaştı.`, fx: { hull: 25 } } },
      { label: '20 altına ön kontrol', icon: 'eye', cost: { gold: 20 },
        win: { text: `Usta zayıf noktaları işaretledi; bir sonraki darbeye hazırlıklısın.`, fx: { x3: { preCheck: true } } } },
      { label: 'Ustaya yardım et', icon: 'hand',
        win: { text: `Halatları tuttun, aletleri uzattın; usta sana mesleğin sırlarını anlattı.`, fx: { xp: 15 } } },
    ] }),
];

// ═══════════ Paket dışı yardımcı olaylar (bağımsız olay sayılmaz) ═══════════
export const X3_SPECIAL_EVENTS = [
  // İlişkisi −2 olan rakip kaptanın takibi: her zaman kaçış / pahalı uzlaşma / çatışma yolu var
  { id: 'EVT_X3_PURSUIT', cat: 'danger', pool: false, x3: true, x3pursuit: true, tier: 2, title: 'Rakip Takibi', tags: ['rival', 'pursuit'],
    art: { sky: 'day', sea: 'choppy', obj: ['merchantShip'] },
    text: `{cap} gemisini ufukta gördün; doğrudan sana geliyor. Aranızdaki husumet bu sulara kadar uzandı.`,
    options: [
      { label: 'Tam yelkenle kaç', icon: 'sail', chance: 65, tags: ['escape'],
        win: { text: `Rüzgârı arkana aldın; rakip yelkeni ufukta küçüldü.`, fx: { xp: 10 } },
        lose: { text: `Rakip seni yakaladı; küpeşteler sürtündü.`, fx: { hull: -12 } } },
      { label: '60 altınla uzlaş', icon: 'coin', cost: { gold: 60 }, tags: ['pass'],
        win: { text: `Bir kese ve bir özürle gerginliği yumuşattın. Rakip kaptan başını salladı.`, fx: { x3: { rel: { pursuit: 1 } } } } },
      { label: 'Karşılık ver', icon: 'cannon', chance: 60, tags: ['combat'],
        win: { text: `Kararlı duruşun rakibi geri çekilmeye zorladı; kaçarken bir sandığı düşürdü.`, fx: { goldR: 60, xp: 10 } },
        lose: { text: `Çatışma pahalıya patladı.`, fx: { hull: -15 } } },
    ] },
  // Denizcilerin Mirası: üç efsane + iki yeni hikâye → kısa kutlama (ek XP yok)
  { id: 'EVT_X3_EPILOGUE', cat: 'special', pool: false, x3: true, tier: 1, title: 'Denizcilerin Mirası', tags: ['celebration'],
    art: { sky: 'dusk', sea: 'calm', obj: [] },
    text: `Limanda seni bekleyen bir kalabalık var: Sönmeyen Armada'yı, Taş Yol'u ve Uyuyan Ada'yı gören kaptanın hikâyesi senden önce gelmiş. Liora, Boran ve Neris'in gemileri rıhtımda yan yana.`,
    options: [{ label: 'Kutlamaya katıl', icon: 'star', win: { text: `Fenerler yandı, şarkılar söylendi. Bu gece, denizcilerin mirası senin hikâyendi.`, fx: { x3: { useOnce: 'epilogueShown' } } } }] },
];

export const X3_STANDALONE = X3_EVENTS.map((e) => e.id);
