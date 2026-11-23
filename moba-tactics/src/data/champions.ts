export type ChampClass = 'tank' | 'fighter' | 'mage' | 'assassin' | 'marksman' | 'summoner';
export type Position = 'top' | 'jungle' | 'bot';
export type Fit = 'high' | 'mid' | 'low';

export interface ChampionData {
  id: string;
  num: number;
  name: string;
  title: string;
  cls: ChampClass;
  look: string;
  pos: Record<Position, Fit>;
  ranged: boolean;
  range: number;
  passive: { name: string; desc: string };
  s1: { name: string; desc: string };
  s2: { name: string; desc: string };
  ult: { name: string; desc: string };
  ai: string;
}

export const CLASS_NAMES: Record<ChampClass, string> = {
  tank: 'Tank', fighter: 'Savaşçı', mage: 'Büyücü', assassin: 'Suikastçı', marksman: 'Nişancı', summoner: 'Çağırıcı',
};

export interface BaseStats { hp: number; hpL: number; ad: number; adL: number; ap: number; apL: number; armor: number; armorL: number; mr: number; mrL: number; as: number; asL: number; ms: number; regen: number }
export const CLASS_STATS: Record<ChampClass, BaseStats> = {
  tank: { hp: 860, hpL: 92, ad: 50, adL: 3.6, ap: 0, apL: 0, armor: 32, armorL: 3.4, mr: 28, mrL: 2, as: 0.68, asL: 0.012, ms: 172, regen: 4 },
  fighter: { hp: 760, hpL: 84, ad: 58, adL: 4.6, ap: 0, apL: 0, armor: 26, armorL: 3, mr: 24, mrL: 1.8, as: 0.75, asL: 0.015, ms: 176, regen: 3.5 },
  mage: { hp: 580, hpL: 64, ad: 42, adL: 2.6, ap: 32, apL: 6.5, armor: 18, armorL: 2.4, mr: 26, mrL: 1.6, as: 0.66, asL: 0.012, ms: 168, regen: 2.5 },
  assassin: { hp: 640, hpL: 72, ad: 60, adL: 4.6, ap: 0, apL: 0, armor: 22, armorL: 2.8, mr: 22, mrL: 1.6, as: 0.78, asL: 0.015, ms: 186, regen: 3 },
  marksman: { hp: 580, hpL: 66, ad: 56, adL: 5, ap: 0, apL: 0, armor: 18, armorL: 2.5, mr: 22, mrL: 1.5, as: 0.8, asL: 0.025, ms: 170, regen: 2.5 },
  summoner: { hp: 620, hpL: 68, ad: 44, adL: 3, ap: 26, apL: 5.5, armor: 22, armorL: 2.6, mr: 24, mrL: 1.6, as: 0.7, asL: 0.012, ms: 170, regen: 2.8 },
};

const c = (d: Omit<ChampionData, 'ranged'>): ChampionData => ({ ...d, ranged: d.range > 150 });

export const CHAMPIONS: ChampionData[] = [
  c({ id: 'boran', num: 1, name: 'Boran', title: 'Sur Muhafızı', cls: 'tank', look: 'Ağır zırhlı, büyük kalkanlı insan şövalye.', pos: { top: 'high', bot: 'mid', jungle: 'low' }, range: 80,
    passive: { name: 'Siper', desc: 'Önünden gelen hasarın %12\'sini azaltır (seviyeyle artar).' },
    s1: { name: 'Kalkan Duvarı', desc: '3 sn boyunca hasar emen kalkan oluşturur.' },
    s2: { name: 'Muhafız Hücumu', desc: 'Rakibe atılır, fiziksel hasar verir ve sersemletir.' },
    ult: { name: 'Yürüyen Hisar', desc: 'Etrafında 5 sn savunma alanı kurar; içindeki dostlar daha az hasar alır.' },
    ai: 'Ön safta savaşır; savunmacıda kuleyi tutar, agresifte rakibi yakalar.' }),
  c({ id: 'korruk', num: 2, name: 'Korruk', title: 'Granit Kalpli', cls: 'tank', look: 'Büyük antik kaya devi.', pos: { top: 'high', jungle: 'mid', bot: 'low' }, range: 85,
    passive: { name: 'Taş Katmanları', desc: 'Hasar aldıkça zırh ve büyü direnci katmanları biriktirir (en fazla 6).' },
    s1: { name: 'Yer Sarsıntısı', desc: 'Çevresine büyü hasarı verir ve düşmanları yavaşlatır.' },
    s2: { name: 'Kaya Derisi', desc: '2,5 sn boyunca %40 hasar azaltımı.' },
    ult: { name: 'Tektonik Çöküş', desc: 'Geniş alanda deprem: hasar ve havaya savurma.' },
    ai: 'Kalabalık hedeflere ve dar alandaki savaşlara öncelik verir.' }),
  c({ id: 'tharok', num: 3, name: 'Tharok', title: 'Zincir Muhafızı', cls: 'tank', look: 'Lanetli ağır zırhlı zincir savaşçısı.', pos: { top: 'high', jungle: 'mid', bot: 'mid' }, range: 85,
    passive: { name: 'Zincir Damgası', desc: 'Kontrol altındaki hedeflere %15 ek hasar.' },
    s1: { name: 'Demir Kanca', desc: 'Zincir fırlatır; isabet eden ilk rakibi kendine çeker ve kısa sersemletir.' },
    s2: { name: 'Lanetli Bağ', desc: 'Rakibe büyü hasarı verir ve 2 sn yavaşlatır.' },
    ult: { name: 'Demir Çember', desc: 'Yakındaki rakipleri merkeze çeker ve sersemletir.' },
    ai: 'Savunmasız arka hat hedeflerini yakalamaya çalışır.' }),
  c({ id: 'rovan', num: 4, name: 'Rovan', title: 'Kızıl Balta', cls: 'fighter', look: 'Büyük balta taşıyan berserker.', pos: { top: 'high', jungle: 'high', bot: 'low' }, range: 85,
    passive: { name: 'Öfke', desc: 'Saldırdıkça ve hasar aldıkça öfke biriktirir; her yük saldırı hızını artırır.' },
    s1: { name: 'Yarma', desc: 'Önündeki alana geniş balta hasarı.' },
    s2: { name: 'Kanlı Atılım', desc: 'Hedefe atılır ve yavaşlatır.' },
    ult: { name: 'Kızıl Çılgınlık', desc: 'Geçici yüksek saldırı hızı ve can çalma.' },
    ai: 'Öfke arttığında daha agresif oynar; uzun savaşları sever.' }),
  c({ id: 'selda', num: 5, name: 'Selda', title: 'Çelik Düellocu', cls: 'fighter', look: 'İnce kılıçlı, çevik kadın savaşçı.', pos: { top: 'high', bot: 'mid', jungle: 'low' }, range: 80,
    passive: { name: 'Zayıf Nokta', desc: 'Aynı hedefe ardışık saldırılar zırhın %6\'sını yok sayar (en fazla %30).' },
    s1: { name: 'Karşılama', desc: 'Gelen ilk saldırıyı savuşturup karşı saldırı yapar.' },
    s2: { name: 'Keskin Hamle', desc: 'Kısa ileri atılım ve tek hedef hasarı.' },
    ult: { name: 'Son Düello', desc: 'Bir rakibi işaretler; ona karşı daha fazla hasar verir, daha az hasar alır.' },
    ai: 'Tek hedefli düelloları tercih eder, kalabalık savaşlardan sakınır.' }),
  c({ id: 'malvek', num: 6, name: 'Malvek', title: 'Kan Yeminli', cls: 'fighter', look: 'Kızıl lanetlerle güçlenmiş savaşçı.', pos: { top: 'high', jungle: 'mid', bot: 'low' }, range: 85,
    passive: { name: 'Kan Borcu', desc: 'Canı azaldıkça verdiği hasar artar (en fazla %40).' },
    s1: { name: 'Kan Kesisi', desc: 'Kendi canından harcayıp vurur ve kanama uygular.' },
    s2: { name: 'Yaşam Sömürüsü', desc: 'Rakibi işaretler ve ondan can çalar.' },
    ult: { name: 'Kan Ayini', desc: 'Geçici olarak verdiği hasarın büyük kısmı kadar iyileşir.' },
    ai: 'Kazanılabilir riskli düellolara girer; iyileştirme azaltmadan zarar görür.' }),
  c({ id: 'asira', num: 7, name: 'Aşira', title: 'Kor Cadısı', cls: 'mage', look: 'Turuncu-kızıl ateş büyücüsü.', pos: { bot: 'high', top: 'mid', jungle: 'mid' }, range: 370,
    passive: { name: 'Kor Birikimi', desc: 'Yetenekleri kor yükü bırakır; üç yük patlama oluşturur.' },
    s1: { name: 'Ateş Küresi', desc: 'Hedef alanda patlayan ateş topu.' },
    s2: { name: 'Alev Yolu', desc: 'Zeminde geçici yanma alanı.' },
    ult: { name: 'Kızıl Yağmur', desc: 'Bölgeye çoklu ateş patlamaları yağdırır.' },
    ai: 'Minyonları ve bir arada duran rakipleri hedefler.' }),
  c({ id: 'liris', num: 8, name: 'Liris', title: 'Ayaz Dokumacısı', cls: 'mage', look: 'Mavi-beyaz buz büyücüsü.', pos: { bot: 'high', top: 'mid', jungle: 'low' }, range: 370,
    passive: { name: 'Soğuk Mühür', desc: 'Üç soğuk yükü hedefi kısa süre köklendirir.' },
    s1: { name: 'Buz Mızrağı', desc: 'Rakipleri delip geçen buz büyüsü.' },
    s2: { name: 'Donmuş Zemin', desc: 'Alanı yavaşlatan buz zemini.' },
    ult: { name: 'Kış Hapishanesi', desc: 'Güçlü yavaşlatma ve ardından dondurma alanı.' },
    ai: 'Rakiplerle mesafesini korur, kaçış yollarını kontrol eder.' }),
  c({ id: 'orun', num: 9, name: 'Orun', title: 'Yarık Bilgesi', cls: 'mage', look: 'Mor boşluk büyücüsü.', pos: { bot: 'high', top: 'mid', jungle: 'low' }, range: 370,
    passive: { name: 'Yankı Mührü', desc: 'Farklı büyüleri aynı hedefe kısa sürede isabet ederse ek hasar.' },
    s1: { name: 'Yarık İşareti', desc: 'Gecikmeli patlayan, rakipleri işaretleyen büyülü işaret.' },
    s2: { name: 'Boşluk Akımı', desc: 'Rakipleri iten ve yavaşlatan enerji dalgası.' },
    ult: { name: 'Mühür Kırılması', desc: 'Aktif işaretleri yüksek alan hasarıyla patlatır.' },
    ai: 'Rakip hareketlerini tahmin eder, kombinasyonları zamanlar.' }),
  c({ id: 'nyra', num: 10, name: 'Nyra', title: 'Gölge Bıçağı', cls: 'assassin', look: 'Mor-siyah, çift hançerli gölge suikastçısı.', pos: { jungle: 'high', top: 'mid', bot: 'low' }, range: 80,
    passive: { name: 'Gölgeden Çıkış', desc: 'Görüş dışından yapılan ilk saldırı ek hasar verir.' },
    s1: { name: 'Gölge Sıçrayışı', desc: 'Görünen hedefe ani atılım.' },
    s2: { name: 'Duman Perdesi', desc: 'Kısa süre gizlenme ve hız.' },
    ult: { name: 'Son Fısıltı', desc: 'Canı azalmış rakibe yüksek infaz hasarı.' },
    ai: 'Pusu yollarını kullanır, düşük canlı hedefleri seçer.' }),
  c({ id: 'zereth', num: 11, name: 'Zereth', title: 'Zehir Kaması', cls: 'assassin', look: 'Yeşil zehir efektli hançer ustası.', pos: { jungle: 'high', bot: 'mid', top: 'mid' }, range: 85,
    passive: { name: 'Kara Toksin', desc: 'Saldırılar zehir yükü uygular (en fazla 5).' },
    s1: { name: 'Zehirli Bıçak', desc: 'Uzaktan zehirli hançer fırlatır.' },
    s2: { name: 'Zehir Bulutu', desc: 'Süreli alan zehri.' },
    ult: { name: 'Veba Hasadı', desc: 'Birikmiş zehir yüklerini patlatır.' },
    ai: 'Hedefi takip eder, zehir yüklerini korumaya çalışır.' }),
  c({ id: 'vaelis', num: 12, name: 'Vaelis', title: 'Yarık Avcısı', cls: 'assassin', look: 'Boyutlar arasında hareket eden çevik avcı.', pos: { jungle: 'high', bot: 'mid', top: 'mid' }, range: 85,
    passive: { name: 'Yarık Darbesi', desc: 'Işınlanma sonrası ilk normal saldırı güçlenir.' },
    s1: { name: 'Boyut Adımı', desc: 'Kısa mesafe ışınlanma.' },
    s2: { name: 'Yankı Kesiği', desc: 'Kesik ve gecikmeli ikinci kesik.' },
    ult: { name: 'Üç Yarık', desc: 'Görünen rakipler arasında art arda üç atılım.' },
    ai: 'Rakibin arka hattına ulaşır, kaçış olanağını korur.' }),
  c({ id: 'edrin', num: 13, name: 'Edrin', title: 'Ufuk Okçusu', cls: 'marksman', look: 'Yeşil pelerinli, uzun yaylı elf.', pos: { bot: 'high', top: 'mid', jungle: 'low' }, range: 400,
    passive: { name: 'Sabit Nişan', desc: '1 sn sabit kalınca menzil ve hasarı artar.' },
    s1: { name: 'Delici Ok', desc: 'Birden fazla hedefi delerek geçen ok.' },
    s2: { name: 'Şahin Gözü', desc: 'Uzak bir alanın görüşünü 5 sn açar.' },
    ult: { name: 'Şafak Oku', desc: 'Çok uzun menzilli, güçlü ok.' },
    ai: 'Maksimum güvenli menzili korur, yakın dövüşten kaçar.' }),
  c({ id: 'tessa', num: 14, name: 'Tessa', title: 'İkiz Arbalet', cls: 'marksman', look: 'Çift arbaletli hızlı avcı.', pos: { bot: 'high', top: 'mid', jungle: 'low' }, range: 370,
    passive: { name: 'Seri Atış', desc: 'Ardışık saldırılar saldırı hızını artırır.' },
    s1: { name: 'Çifte Delici', desc: 'Hızlı çift atış.' },
    s2: { name: 'Kaçınma Taklası', desc: 'Kısa yuvarlanma; sonraki saldırı güçlenir.' },
    ult: { name: 'Ok Yağmuru', desc: 'Geçici çok yüksek atış hızı.' },
    ai: 'Hareket ederek saldırır; uzaklaşırken ateşi sürdürür.' }),
  c({ id: 'dorn', num: 15, name: 'Dorn', title: 'Barut Ustası', cls: 'marksman', look: 'Cüce patlayıcı uzmanı.', pos: { bot: 'high', top: 'mid', jungle: 'low' }, range: 360,
    passive: { name: 'Patlayıcı Mühimmat', desc: 'Her üçüncü saldırı alan hasarı verir.' },
    s1: { name: 'Barut Bombası', desc: 'Gecikmeli patlayan bomba.' },
    s2: { name: 'Yapışkan Fünye', desc: 'Hedefe yapışan patlayıcı (kulelere ek hasar).' },
    ult: { name: 'Büyük Barut Fıçısı', desc: 'Geniş alan patlaması.' },
    ai: 'Minyon kümelerine ve kuşatmaya öncelik verir.' }),
  c({ id: 'rughan', num: 16, name: 'Rughan', title: 'Kurt Ahdi', cls: 'summoner', look: 'Kurt yoldaşıyla dolaşan canavar ustası.', pos: { jungle: 'high', top: 'mid', bot: 'low' }, range: 90,
    passive: { name: 'Sürü Bağı', desc: 'Kalıcı bir kurt yoldaşıyla savaşır.' },
    s1: { name: 'Av Komutu', desc: 'Kurdu hedefe atlatır, hasar ve yavaşlatma.' },
    s2: { name: 'Savaş Uluması', desc: 'Kendisinin ve kurdunun saldırı hızını artırır.' },
    ult: { name: 'Vahşi Çağrı', desc: 'Geçici güçlü bir savaş ayısı çağırır.' },
    ai: 'Kurtla kamp temizler; baskınlarda yoldaşını öne gönderir.' }),
  c({ id: 'nekmar', num: 17, name: 'Nekmar', title: 'Kül Nekromantı', cls: 'summoner', look: 'Kemik zırhlı nekromant.', pos: { top: 'high', jungle: 'mid', bot: 'mid' }, range: 340,
    passive: { name: 'Ruh Kalıntısı', desc: 'Yakındaki ölümler çağırma bekleme sürelerini azaltır.' },
    s1: { name: 'Kemik Askerler', desc: 'En fazla iki iskelet savaşçı çağırır.' },
    s2: { name: 'Mezar Laneti', desc: 'Hedefin zırhını ve büyü direncini azaltır.' },
    ult: { name: 'Kemik Devi', desc: 'İskeletleri tüketerek büyük bir kemik devi çağırır.' },
    ai: 'Koridoru minyonlarla iter, yaratıklarını stratejik kullanır.' }),
  c({ id: 'ilvara', num: 18, name: 'İlvara', title: 'Rün Dökümcüsü', cls: 'summoner', look: 'Büyülü yapılar üreten rün mühendisi.', pos: { bot: 'high', top: 'mid', jungle: 'low' }, range: 350,
    passive: { name: 'Rün Birikimi', desc: 'Nöbetçiler saldırdıkça enerji biriktirir; dolunca Enerji Diski güçlenir.' },
    s1: { name: 'Rün Nöbetçisi', desc: 'Otomatik saldıran büyülü nöbetçi kurar (en fazla 2).' },
    s2: { name: 'Enerji Diski', desc: 'Delip geçen büyülü disk.' },
    ult: { name: 'Aşırı Yükleme', desc: 'Nöbetçilerin saldırı kapasitesini geçici artırır.' },
    ai: 'Savunmada kuleye yakın, saldırıda minyon arkasına yapı yerleştirir.' }),
];

export const CHAMP_BY_ID: Record<string, ChampionData> = Object.fromEntries(CHAMPIONS.map((c) => [c.id, c]));

export interface SynergyDef { a: string; b: string; name: string; desc: string }
export const SYNERGIES: SynergyDef[] = [
  { a: 'liris', b: 'nyra', name: 'Buz ve Gölge', desc: 'Durdurulmuş (kök/sersem) hedeflere %3 ek hasar.' },
  { a: 'tharok', b: 'dorn', name: 'Zincir ve Barut', desc: 'Kontrol altındaki hedeflere %3 ek hasar.' },
  { a: 'boran', b: 'edrin', name: 'Kalkan ve Ok', desc: 'Birbirine yakınken Edrin %3 fazla hasar verir, Boran %3 az hasar alır.' },
  { a: 'korruk', b: 'asira', name: 'Taş ve Kor', desc: 'Yavaşlatılmış hedeflere %3 ek hasar.' },
  { a: 'rughan', b: 'zereth', name: 'Sürü ve Zehir', desc: 'Zehirli hedeflere %3 ek hasar.' },
  { a: 'nekmar', b: 'ilvara', name: 'Kemik ve Rün', desc: 'Çağrılan birimler %3 fazla hasar verir.' },
];
