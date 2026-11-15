// YAŞAYAN DENİZLER (X1): 4 yeni hikâye zinciri, toplam 14 aşama ve 12 alternatif final.
// Mevcut zincir sistemiyle aynı yapı: fx.next / nextAt, fx.flag (zincir hafızası), cases (önceki karara göre).
// Finaller fx.x1.final ile kalıcı olarak Denizci Günlüğü'ne yazılır.
const END = { endChain: true };
const fin = (chain, id, extra = {}) => ({ ...END, x1: { final: { chain, id }, chainDone: chain, ...extra } });

export const X1_CHAINS = {
  CH_X1_RED_CAPTAIN: { id: 'CH_X1_RED_CAPTAIN', name: "Kızıl Kaptan'ın Borcu", steps: 4, start: 'CH_X1_RED_1', regions: [3, 4, 5], pool: true, memBoost: 'redHint', x1: true, finals: ['defeat', 'peace', 'alliance'] },
  CH_X1_GUILD_SEAL: { id: 'CH_X1_GUILD_SEAL', name: 'Yitik Tacirin Mührü', steps: 4, start: 'CH_X1_SEAL_1', regions: [2, 3, 4, 5], pool: true, memBoost: 'sealHint', x1: true, finals: ['expose', 'sell', 'guild'] },
  CH_X1_LIGHTKEEPER: { id: 'CH_X1_LIGHTKEEPER', name: 'Fenerin Son Bekçisi', steps: 3, start: 'CH_X1_LIGHT_1', regions: [2, 3, 4, 5], pool: true, memBoost: 'lightHint', x1: true, mystery: true, finals: ['rescue', 'relight', 'abandon'] },
  CH_X1_GROOT_LEGACY: { id: 'CH_X1_GROOT_LEGACY', name: "Groot'un Yarım Kalan Gemisi", steps: 3, start: 'CH_X1_GROOT_1', regions: [1, 2, 3, 4, 5], pool: true, needCrew: 'CREW_GROOT', cond: { crew: 'CREW_GROOT' }, x1: true, finals: ['restore', 'salvage', 'memorial'] },
};

export const X1_CHAIN_EVENTS = [
  // ═══════════ KIZIL KAPTAN'IN BORCU ═══════════
  {
    id: 'CH_X1_RED_1', cat: 'chain', chain: 'CH_X1_RED_CAPTAIN', step: 1, title: 'Kırmızı Yelkenler', tags: ['pirate', 'attack'],
    art: { sky: 'dusk', sea: 'choppy', obj: ['pirateShip'] },
    text: `Ufukta kan kırmızısı yelkenler belirdi. Kızıl Kaptan'ın gemisi rüzgârı arkasına alıp sana yöneldi. "Bana bir borcun var, tüccar!" diye bağırdı. Hangi borç?`,
    options: [
      { label: 'Savaş', icon: 'cannon', chance: 55, tags: ['combat'],
        win: { text: `Topların Kızıl Kaptan'ın pruvasını sıyırdı. Geri çekildi ama "Bu bitmedi!" diye haykırdı.`, fx: { flag: { hostile: true }, next: 'CH_X1_RED_2', nextAt: 'route', x1: { rep: { red: -1 } } } },
        lose: { text: `Karşılık gelen gülleler gövdeni dövdü. Kaptan kahkahayla uzaklaştı.`, fx: { hull: -20, flag: { hostile: true }, next: 'CH_X1_RED_2', nextAt: 'route' } } },
      { label: 'Konuş', icon: 'talk',
        win: { text: `Sandalla gemisine geçip kaptanı dinledin. Borç senin değil, yıllar önce bu gemiyi kullanan kaptanındı. Kızıl Kaptan şüpheyle baktı ama ateş etmedi.`, fx: { flag: { trust: true }, next: 'CH_X1_RED_2', nextAt: 'route' } } },
      { label: 'Kaç', icon: 'sail', chance: 60, tags: ['escape'],
        win: { text: `Rüzgâr seninleydi; kırmızı yelkenler ufukta küçüldü. Ama iz sürücüleri bırakmadı.`, fx: { next: 'CH_X1_RED_2', nextAt: 'route' } },
        lose: { text: `Kaçarken kıçına bir gülle yedin.`, fx: { hull: -15, next: 'CH_X1_RED_2', nextAt: 'route' } } },
    ],
  },
  {
    id: 'CH_X1_RED_2', cat: 'chain', chain: 'CH_X1_RED_CAPTAIN', step: 2, title: 'Kaptanın İz Sürücüleri', tags: ['pirate'],
    art: { sky: 'day', sea: 'choppy', obj: ['pirateFleet'] },
    text: `İki küçük korsan teknesi geminin iki yanından yaklaştı. Kızıl Kaptan'ın adamlarıydı.`,
    options: [
      { label: 'Karşıla', icon: 'talk',
        cases: [
          { when: { flag: 'trust' }, text: `Tekneler yanaştı; adamlar silah yerine bir sandık uzattı: "Kaptan, Korsan Koyu'nda konuşmak istiyor."`, fx: { goldR: 40, next: 'CH_X1_RED_3' } },
          { when: { flag: 'hostile' }, text: `Pusu! Adamlar halatlarla güverteye atladı; birkaç sandığı kapıp kaçtılar. Koyun yeri ağızlarından kaçtı.`, fx: { cargoLoss: 15, hull: -10, next: 'CH_X1_RED_3' } },
        ],
        win: { text: `Adamlar seni süzdü ve uzaklaştı. "Kaptan seni koyda bekliyor."`, fx: { next: 'CH_X1_RED_3' } } },
      { label: 'Teknelerin arasından kaç', icon: 'sail', chance: 65, tags: ['escape'],
        win: { text: `Teknelerin arasından sıyrıldın; peşinden bir şişe mesaj fırlattılar: koyun yeri.`, fx: { next: 'CH_X1_RED_3' } },
        lose: { text: `Tekneler seni sıkıştırdı; kaçarken gövde zarar gördü.`, fx: { hull: -15, next: 'CH_X1_RED_3' } } },
    ],
  },
  {
    id: 'CH_X1_RED_3', cat: 'chain', chain: 'CH_X1_RED_CAPTAIN', step: 3, title: "Korsan Koyu'ndaki Hesap", tags: ['pirate', 'island'],
    art: { sky: 'dusk', sea: 'calm', obj: ['island', 'pirateShip'] },
    text: `Kayalık bir koyda kırmızı yelkenli gemi demirliydi. Kıyıda muhafızlar bekliyordu. Kızıl Kaptan'ın gerçek amacı burada ortaya çıkacaktı.`,
    options: [
      { label: 'Borcu araştır', icon: 'book',
        win: { text: `Kaptanın defterleri, gemine ait eski bir kaptanın onu ihanetle batırdığını gösteriyordu. Borç gerçekti ama senin değildi.`, fx: { flag: { truth: true }, next: 'CH_X1_RED_4', nextAt: 'route' } } },
      { label: 'Kanıt topla', icon: 'eye', chance: 60, tags: ['explore'],
        win: { text: `Sandalla kıyıya çıkıp kaptanın gizli zulasını buldun: lonca ve korsan arasındaki eski bir anlaşma.`, fx: { goldR: 60, flag: { evidence: true }, next: 'CH_X1_RED_4', nextAt: 'route' } },
        lose: { text: `Muhafızlar fark etti; kıyıdan kaçarken sandal delindi.`, fx: { hull: -10, flag: { hostile: true }, next: 'CH_X1_RED_4', nextAt: 'route' } } },
      { label: 'Hesaplaş', icon: 'sword', chance: 50, tags: ['combat'],
        win: { text: `Muhafızları geri püskürttün. Kaptan, son karşılaşmanın açık denizde olacağını söyledi.`, fx: { flag: { hostile: true }, next: 'CH_X1_RED_4', nextAt: 'route' } },
        lose: { text: `Koydan ağır hasarla çıktın.`, fx: { hull: -25, flag: { hostile: true }, next: 'CH_X1_RED_4', nextAt: 'route' } } },
    ],
  },
  {
    id: 'CH_X1_RED_4', cat: 'chain', chain: 'CH_X1_RED_CAPTAIN', step: 4, title: 'Son Karşılaşma', tags: ['pirate', 'attack'],
    art: { sky: 'dusk', sea: 'choppy', obj: ['pirateShip'] },
    text: `Kırmızı yelkenler son kez yaklaştı. Kızıl Kaptan güvertesinde dimdik duruyordu. "Ya borç kapanır, ya biz."`,
    options: [
      { label: 'Kaptanı yen', icon: 'cannon', chance: 50, tags: ['combat'],
        win: { text: `Son gülle direğini devirdi. Kızıl Kaptan teslim oldu; ambarından 350 altınlık ganimet aldın.`, fx: { gold: 350, xp: 50, ...fin('CH_X1_RED_CAPTAIN', 'defeat', { ach: 'ACH_X1_NIGHTMARE', rep: { red: -2 } }) } },
        lose: { text: `Savaş ikinizi de yordu. Kaptan çekilip gitti; borç kapanmadı ama hikâye bitti.`, fx: { hull: -30, ...fin('CH_X1_RED_CAPTAIN', 'defeat') } } },
      { label: 'Barış yap (150 altın)', icon: 'hand', cost: { gold: 150 },
        win: { text: `Gemiler yanaştı; eski borcun bedelini ödedin. Kaptan elini uzattı: "Kardeşliğin önünde bir kez sözün geçer."`, fx: { xp: 60, ...fin('CH_X1_RED_CAPTAIN', 'peace', { ach: 'ACH_X1_OLD_DEBTS', rep: { red: 1 }, mem: { redPeace: true } }) } } },
      { label: 'İttifak kur', icon: 'flag', req: { cargoGoods: ['GOOD_SILK', 'GOOD_PORCELAIN', 'GOOD_GOLD_BAR', 'GOOD_ANTIQUE', 'GOOD_WINE', 'GOOD_SPICE'] }, hint: 'Bir değerli mal verilir',
        win: { text: `Değerli bir sandığı hediye ettin. Kızıl Kaptan gemisini yanına çekti: "Bu denizlerde bir kez seni ben korurum."`, fx: { xp: 40, ...fin('CH_X1_RED_CAPTAIN', 'alliance', { rep: { red: 2 }, mem: { redAlly: true }, cargoUseValuable: 1 }) } } },
    ],
  },

  // ═══════════ YİTİK TACİRİN MÜHRÜ ═══════════
  {
    id: 'CH_X1_SEAL_1', cat: 'chain', chain: 'CH_X1_GUILD_SEAL', step: 1, title: 'Mühürlü Boş Sandık', tags: ['chest', 'trade'],
    art: { sky: 'day', sea: 'calm', obj: ['chest'] },
    text: `Dalgalar boş ama üzerinde değerli bir lonca mührü taşıyan bir sandık getirdi. Mühür, yıllar önce kaybolan bir tacire aitti.`,
    options: [
      { label: 'Mührü sakla', icon: 'seal', win: { text: `Mührü kamarana kilitledin.`, fx: { flag: { kept: true }, next: 'CH_X1_SEAL_2', nextAt: 'route' } } },
      { label: 'Araştır', icon: 'book', win: { text: `Mührün altında kazınmış bir defter numarası buldun.`, fx: { xp: 10, flag: { researched: true }, next: 'CH_X1_SEAL_2', nextAt: 'route' } } },
      { label: 'Sat', icon: 'coin', win: { text: `Mührü bir koleksiyoncuya sattın… ama alıcı adını defterine yazdı.`, fx: { goldR: 60, flag: { sold: true }, next: 'CH_X1_SEAL_2', nextAt: 'route' } } },
    ],
  },
  {
    id: 'CH_X1_SEAL_2', cat: 'chain', chain: 'CH_X1_GUILD_SEAL', step: 2, title: 'Sahte Ticaret Kayıtları', tags: ['trade', 'inspection'],
    art: { sky: 'day', sea: 'calm', obj: ['merchantShip'] },
    text: `Bir lonca katibinin gemisi yanaştı. Mührün ait olduğu tacirin kayıtları sahteydi; biri loncanın defterleriyle oynuyordu.`,
    options: [
      { label: 'Belgeleri al', icon: 'scroll', win: { text: `Katip titreyen ellerle belgeleri uzattı.`, fx: { flag: { docs: true }, next: 'CH_X1_SEAL_3', nextAt: 'route' } } },
      { label: 'Yetkililere teslim et', icon: 'crown', win: { text: `Muhafızlar belgeleri mühürleyip aldı; sana gözcülük görevi verdiler.`, fx: { xp: 10, flag: { crown: true }, next: 'CH_X1_SEAL_3', nextAt: 'route', x1: { rep: { crown: 1 } } } } },
      { label: 'Gizle', icon: 'hold', win: { text: `Belgeleri ambarın dibine sakladın. Kimse görmedi… sanırım.`, fx: { flag: { hidden: true }, next: 'CH_X1_SEAL_3', nextAt: 'route' } } },
    ],
  },
  {
    id: 'CH_X1_SEAL_3', cat: 'chain', chain: 'CH_X1_GUILD_SEAL', step: 3, title: 'Konvoyun Gizli Anlaşması', tags: ['trade', 'convoy'],
    art: { sky: 'day', sea: 'calm', obj: ['convoy'] },
    text: `Bir ticaret konvoyu etrafını sardı. Sahte kayıtlarla para kazanmanı, karşılığında sessiz kalmanı teklif ettiler.`,
    options: [
      { label: 'Kabul et', icon: 'coin', win: { text: `Sandıklar ve keseler el değiştirdi.`, fx: { goldR: 80, flag: { deal: true }, next: 'CH_X1_SEAL_4', nextAt: 'route', x1: { rep: { guild: -1 } } } } },
      { label: 'Reddet', icon: 'no', win: { text: `Konvoy homurdanarak dağıldı.`, fx: { flag: { refused: true }, next: 'CH_X1_SEAL_4', nextAt: 'route' } } },
      { label: 'Kanıt topla', icon: 'eye', chance: 60, tags: ['explore'],
        win: { text: `Anlaşmayı kabul eder gibi yapıp gizlice imzalı bir sözleşme kopyası aldın.`, fx: { flag: { evidence: true }, next: 'CH_X1_SEAL_4', nextAt: 'route' } },
        lose: { text: `Fark edildin; konvoy gemileri gövdeni sıkıştırıp hırpaladı.`, fx: { hull: -15, flag: { refused: true }, next: 'CH_X1_SEAL_4', nextAt: 'route' } } },
    ],
  },
  {
    id: 'CH_X1_SEAL_4', cat: 'chain', chain: 'CH_X1_GUILD_SEAL', step: 4, title: 'Mührün Gerçek Sahibi', tags: ['trade'],
    art: { sky: 'day', sea: 'calm', obj: ['merchantShip', 'warship'] },
    text: `Mührün gerçek sahibi yaşıyordu: yıllar önce kendi loncası tarafından ihanete uğrayan yaşlı bir tacir. Şimdi karar senindi.`,
    options: [
      { label: 'Yolsuzluğu ortaya çıkar', icon: 'crown', win: { text: `Muhafız gemisi geldi; sahte kayıtları tutanlar zincirlendi. Tacir mührünü geri aldı ve sana loncanın şükran payını verdi.`, fx: { gold: 250, xp: 60, status: 'hero', ...fin('CH_X1_GUILD_SEAL', 'expose', { ach: 'ACH_X1_TRUTH', rep: { crown: 1, guild: -1 } }) } } },
      { label: 'Belgeleri yüksek bedelle sat', icon: 'coin', win: { text: `Yolsuz lonca üyeleri belgeler için servet ödedi. Vicdanın biraz ağır, keselerin çok ağır.`, fx: { gold: 500, xp: 35, ...fin('CH_X1_GUILD_SEAL', 'sell', { rep: { guild: -2, red: 1 } }) } } },
      { label: 'Loncanın tarafını tut', icon: 'compass', win: { text: `Belgeleri loncaya teslim ettin; meseleyi "aile içinde" çözdüler. Teşekkür olarak ticari ayrıcalık verdiler.`, fx: { gold: 300, xp: 45, status: 'boom', ...fin('CH_X1_GUILD_SEAL', 'guild', { rep: { guild: 2 } }) } } },
    ],
  },

  // ═══════════ FENERİN SON BEKÇİSİ ═══════════
  {
    id: 'CH_X1_LIGHT_1', cat: 'chain', chain: 'CH_X1_LIGHTKEEPER', step: 1, title: 'Üç Kısa Işık', tags: ['fog', 'lighthouse'],
    art: { sky: 'fog', sea: 'calm', obj: ['lighthouse'], fx: ['fog'] },
    text: `Sisli bir fenerden üç kısa ışık geldi. Sonra karanlık. Sonra yine üç kısa ışık. Bir yardım çağrısı.`,
    options: [
      { label: 'Işıkla cevap ver', icon: 'lantern', win: { text: `Fenerini kaldırıp üç kez yaktın. Uzaktaki ışık bir an dondu… sonra yaklaşman için işaret verdi.`, fx: { flag: { answered: true }, next: 'CH_X1_LIGHT_2' } } },
      { label: 'Araştır', icon: 'eye', tags: ['explore'], win: { text: `Dürbünle baktın: fenerin camı kırık, kapısı açıktı.`, fx: { xp: 10, next: 'CH_X1_LIGHT_2' } } },
      { label: 'Uzaklaş', icon: 'no', tags: ['pass'], win: { text: `Işıklar arkanda kaldı. Belki de bir gün geri dönersin.`, fx: { ...END } } },
    ],
  },
  {
    id: 'CH_X1_LIGHT_2', cat: 'chain', chain: 'CH_X1_LIGHTKEEPER', step: 2, title: 'Terk Edilmiş İskele', tags: ['fog', 'island'],
    art: { sky: 'fog', sea: 'calm', obj: ['island', 'lighthouse'], fx: ['fog'] },
    text: `Harap bir iskeleye yanaştın. Kapı aralık, merdivenler yosun tutmuştu. İçeriden bir öksürük sesi geldi.`,
    options: [
      { label: 'Araştır', icon: 'boat', chance: 70, tags: ['explore'],
        win: { text: `Tayfan kıyıda yürüyüp fenerin dibinde bitkin yaşlı bir bekçi buldu. Yanında son yağ şişesi duruyordu.`, fx: { xpExplore: 15, flag: { found: true }, next: 'CH_X1_LIGHT_3', nextAt: 'route' } },
        lose: { text: `Çürük iskele çöktü; sandal ve gövde zarar gördü. Yine de bekçiye ulaştınız.`, fx: { hull: -10, flag: { found: true }, next: 'CH_X1_LIGHT_3', nextAt: 'route' } } },
      { label: 'Bekle', icon: 'anchor', win: { text: `Sabaha kadar beklediniz. Fener hiç yanmadı.`, fx: { next: 'CH_X1_LIGHT_3', nextAt: 'route' } } },
      { label: 'Geri dön', icon: 'back', tags: ['pass'], win: { text: `Sis çok yoğundu. Geri döndün.`, fx: { ...END } } },
    ],
  },
  {
    id: 'CH_X1_LIGHT_3', cat: 'chain', chain: 'CH_X1_LIGHTKEEPER', step: 3, title: 'Son Nöbet', tags: ['fog', 'lighthouse'],
    art: { sky: 'night', sea: 'calm', obj: ['island', 'lighthouse'] },
    text: `Fener bekçisinin akıbeti belli olmuştu. Fener sönük, bekçi yorgun. Son nöbet senin elindeydi.`,
    options: [
      { label: 'Bekçiyi kurtar', icon: 'heart', win: { text: `Bekçiyi gemine aldın. Gözleri dolu dolu, feneri son kez seyretti. "Sen olmasaydın…"`, fx: { xp: 50, luckBuff: { add: 10, events: 2 }, ...fin('CH_X1_LIGHTKEEPER', 'rescue', { mysteryChain: true }) } } },
      { label: 'Feneri yeniden çalıştır', icon: 'lantern', win: { text: `Tayfan merdivenleri tırmandı, son yağı lambaya döktü. Fener yeniden yandı; ışık sislerin üstünde döndü ve yolları aydınlattı.`, fx: { xp: 60, reveal: 3, codexNote: 'lighthouse', ...fin('CH_X1_LIGHTKEEPER', 'relight', { ach: 'ACH_X1_LIGHT', mysteryChain: true }) } } },
      { label: 'Feneri terk et', icon: 'no', win: { text: `Bekçiye erzak bıraktın ve yola çıktın. Arkanda fener karanlıkta kaldı.`, fx: { xp: 30, ...fin('CH_X1_LIGHTKEEPER', 'abandon', { mysteryChain: true }) } } },
    ],
  },

  // ═══════════ GROOT'UN YARIM KALAN GEMİSİ ═══════════
  {
    id: 'CH_X1_GROOT_1', cat: 'chain', chain: 'CH_X1_GROOT_LEGACY', step: 1, title: 'Tanıdık Çivi', tags: ['timber', 'personal'], needCrew: 'CREW_GROOT', altClose: true,
    art: { sky: 'day', sea: 'calm', obj: ['timber'] },
    text: `Denizden çekilen bir kereste parçasında eski bir usta işareti vardı. Groot tahtayı elinde çevirdi; yüzü birden ciddileşti.`,
    options: [
      { label: 'Groot\'u dinle', icon: 'talk', show: { crew: 'CREW_GROOT' }, win: { text: `"Bu ustamın işareti," dedi Groot. "Yarım kalan son gemisi… hâlâ bir yerlerde olmalı."`, fx: { xp: 10, next: 'CH_X1_GROOT_2', nextAt: 'route' } } },
      { label: 'Tahtayı sakla', icon: 'hammer', show: { noCrew: 'CREW_GROOT' }, win: { text: `İşaretin anlamını bilen kimse gemide değildi. Tahtayı bir köşeye kaldırdın.`, fx: { ...END } } },
    ],
  },
  {
    id: 'CH_X1_GROOT_2', cat: 'chain', chain: 'CH_X1_GROOT_LEGACY', step: 2, title: 'Unutulmuş Atölye', tags: ['shipyard', 'island', 'personal'], needCrew: 'CREW_GROOT', altClose: true,
    art: { sky: 'overcast', sea: 'calm', obj: ['island', 'shipyard'] },
    text: `Ağaçlarla kaplı bir koyda çürümüş bir tersane duruyordu. Kızakta, yarısı bitmiş bir geminin iskeleti yatıyordu.`,
    options: [
      { label: 'Araştır', icon: 'eye', show: { crew: 'CREW_GROOT' }, win: { text: `Groot kıyıya indi, eski tezgâhları tek tek okşadı. Ustasının alet çantasını buldu.`, fx: { xp: 10, flag: { tools: true }, next: 'CH_X1_GROOT_3', nextAt: 'route' } } },
      { label: 'Malzemeleri al', icon: 'crate', show: { crew: 'CREW_GROOT' }, win: { text: `Sağlam keresteleri gemiye taşıdınız.`, fx: { hull: 15, flag: { took: true }, next: 'CH_X1_GROOT_3', nextAt: 'route' } } },
      { label: "Groot'un isteğini yerine getir", icon: 'heart', show: { crew: 'CREW_GROOT' }, win: { text: `Groot bir gece kızağın başında oturmak istedi. Sabah gözleri parlıyordu: "Onu bitirebilirim."`, fx: { xp: 15, flag: { wish: true }, next: 'CH_X1_GROOT_3', nextAt: 'route' } } },
      { label: 'Atölyeyi geride bırak', icon: 'no', show: { noCrew: 'CREW_GROOT' }, win: { text: `Groot artık gemide değildi. Atölyeyi uzaktan selamlayıp yola devam ettin.`, fx: { ...END } } },
    ],
  },
  {
    id: 'CH_X1_GROOT_3', cat: 'chain', chain: 'CH_X1_GROOT_LEGACY', step: 3, title: 'Son Çivi', tags: ['shipyard', 'island', 'personal', 'repair'], needCrew: 'CREW_GROOT', altClose: true,
    art: { sky: 'dawn', sea: 'calm', obj: ['island', 'shipyard'] },
    text: `Atölyeye son kez döndünüz. Yarım kalan gemi, Groot'un elinin değmesini bekliyordu.`,
    options: [
      { label: 'Eski gemiyi onar', icon: 'hammer', show: { crew: 'CREW_GROOT' }, win: { text: `Groot tahtaları yerleştirdi ve son çiviyi çaktı. Kızaktan kayan gemi, yıllar sonra ilk kez suya değdi ve yüzdü. Groot hiçbir şey söylemedi; söylemesine gerek yoktu.`, fx: { xp: 40, hull: 20, codexNote: 'grootShip', ...fin('CH_X1_GROOT_LEGACY', 'restore', { ach: 'ACH_X1_LAST_NAIL', personal: true }) } } },
      { label: 'Kullanılabilir parçaları kurtar', icon: 'crate', show: { crew: 'CREW_GROOT' }, win: { text: `Tayfalar sağlam kerestelerle usta aletlerini gemiye taşıdı. Groot son kez iskeletin omurgasına dokundu.`, fx: { xp: 40, hull: 30, ...fin('CH_X1_GROOT_LEGACY', 'salvage', { personal: true }) } } },
      { label: 'Gemiyi anısına bırak', icon: 'heart', show: { crew: 'CREW_GROOT' }, win: { text: `Mürettebat kızağın önünde kısa, sessiz bir tören yaptı. Groot ustasının çekicini kızağa bıraktı.`, fx: { xp: 40, luckBuff: { add: 10, events: 2 }, ...fin('CH_X1_GROOT_LEGACY', 'memorial', { personal: true }) } } },
      { label: 'Atölyeyi kapat', icon: 'no', show: { noCrew: 'CREW_GROOT' }, win: { text: `Groot olmadan bu hikâyeyi bitirmek doğru gelmedi. Atölyenin kapısını kapatıp ayrıldın.`, fx: { xp: 10, ...END } } },
    ],
  },
];
