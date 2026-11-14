// GDD Bölüm 3–4: 5 bölge, 45 liman, 8 liman tipi.

export const REGIONS = {
  1: { id: 1, name: 'Tanıdık Sular', desc: 'Balıkçı köyleri, küçük iskeleler, temel item havuzu, ucuz mal.', color: '#6fbf73' },
  2: { id: 2, name: 'Ticaret Yolları', desc: 'Ticaret şehirleri, ilk askerî limanlar, orta item havuzu.', color: '#e0b84a' },
  3: { id: 3, name: 'Belirsiz Denizler', desc: 'Karışık tipler, ilk korsan yuvaları ve sis limanları; nadir item şansı artar.', color: '#5aa6c8' },
  4: { id: 4, name: 'Tehlikeli Sular', desc: 'Volkanik adalar, yoğun sis, gizemli koylar, savaş lordları.', color: '#d0703c' },
  5: { id: 5, name: 'Bilinmeyenin Ucu', desc: 'Buzul limanları, hayalet adalar, en nadir itemler, tam event havuzu.', color: '#a78bd8' },
};

export const HARBOR_TYPES = {
  fishing: {
    id: 'fishing', name: 'Balıkçı Köyü', icon: 'fish',
    desc: 'Ucuz temel mal, düşük XP, tam tersane yok (acil yama), hayvan şansı %40.',
    fullShipyard: false, patch: true, petChance: 40,
  },
  trade: {
    id: 'trade', name: 'Ticaret Şehri', icon: 'coin',
    desc: 'Pahalı mal, yüksek kâr, tam tersane, geniş item havuzu.',
    fullShipyard: true, patch: true, petChance: 30, wideItemPool: true,
  },
  military: {
    id: 'military', name: 'Askerî Liman', icon: 'shield',
    desc: 'Güvenli ticaret, tam tersane, savunma itemleri. Askerî Denetim eventi çıkmaz.',
    fullShipyard: true, patch: true, petChance: 30, noInspection: true,
  },
  pirate: {
    id: 'pirate', name: 'Korsan Yuvası', icon: 'skull',
    desc: 'Gizli mallar, yüksek risk ve ödül, tam tersane yok, Kara Bayrak satışı, Diego burada garantili.',
    fullShipyard: false, patch: true, petChance: 30, guaranteedCrew: 'CREW_DIEGO', guaranteedItem: 'ITEM_BLACK_FLAG',
  },
  fog: {
    id: 'fog', name: 'Sis Limanı', icon: 'fog',
    desc: 'Ucuz ama olaylar sık, tersane yok, gizemli item havuzu.',
    fullShipyard: false, patch: false, petChance: 30,
  },
  mystery: {
    id: 'mystery', name: 'Gizemli Ada', icon: 'eye',
    desc: 'Nadir itemler, tehlikeli yol, hayvan şansı %50.',
    fullShipyard: false, patch: true, petChance: 50, locked: 'UPG_MYSTERY_MAPS',
  },
  volcanic: {
    id: 'volcanic', name: 'Volkanik Ada', icon: 'volcano',
    desc: 'Nadir mineral mallar, Isı Kalkanı satışı.',
    fullShipyard: true, patch: true, petChance: 30, guaranteedItem: 'ITEM_HEAT_SHIELD',
  },
  ice: {
    id: 'ice', name: 'Buzul Limanı', icon: 'snow',
    desc: 'Geç oyun, zor rota, tam tersane yok, Buz Kıran Pruva satışı.',
    fullShipyard: false, patch: true, petChance: 30, guaranteedItem: 'ITEM_ICEBREAKER', locked: 'UPG_ICE_ROUTES',
  },
};

const H = (id, name, type, region, extra = {}) => ({ id, name, type, region, ...extra });

export const HARBORS = [
  // Bölge 1 — Tanıdık Sular (8)
  H('HARBOR_MARTI_KOYU', 'Martı Koyu', 'fishing', 1),
  H('HARBOR_TUZLU_BALIK', 'Tuzlu Balık İskelesi', 'fishing', 1),
  H('HARBOR_KEHRIBAR', 'Kehribar Rıhtımı', 'trade', 1),
  H('HARBOR_YESIL_BURUN', 'Yeşil Burun', 'fishing', 1),
  H('HARBOR_CIFT_DEGIRMEN', 'Çift Değirmen Limanı', 'trade', 1),
  H('HARBOR_BAKIR_KOY', 'Bakır Koy', 'trade', 1),
  H('HARBOR_ESKI_ISKELE', 'Eski İskele', 'fishing', 1),
  H('HARBOR_GUNDOGUMU', 'Gündoğumu Limanı', 'trade', 1),
  // Bölge 2 — Ticaret Yolları (8)
  H('HARBOR_BUYUK_CARSI', 'Büyük Çarşı', 'trade', 2),
  H('HARBOR_DEMIR_KAPI', 'Demir Kapı', 'military', 2),
  H('HARBOR_IPEK', 'İpek Limanı', 'trade', 2),
  H('HARBOR_GUMUS_KIYI', 'Gümüş Kıyı', 'trade', 2),
  H('HARBOR_KRALIYET', 'Kraliyet Rıhtımı', 'military', 2),
  H('HARBOR_BAHARAT', 'Baharat İskelesi', 'trade', 2),
  H('HARBOR_IKIZ_KULE', 'İkiz Kule Limanı', 'trade', 2),
  H('HARBOR_TUCCAR_KOYU', 'Tüccar Koyu', 'trade', 2),
  // Bölge 3 — Belirsiz Denizler (9)
  H('HARBOR_KARA_RESIF', 'Kara Resif', 'pirate', 3),
  H('HARBOR_KIRIK_CIPA', 'Kırık Çıpa', 'pirate', 3),
  H('HARBOR_KAFATASI', 'Kafatası Limanı', 'pirate', 3),
  H('HARBOR_SIS_AGZI', 'Sis Ağzı', 'fog', 3),
  H('HARBOR_SOLUK_SIGINAK', 'Soluk Sığınak', 'fog', 3),
  H('HARBOR_FISILTI', 'Fısıltı Koyu', 'mystery', 3),
  H('HARBOR_YOSUNLU', 'Yosunlu Harabeler', 'mystery', 3),
  H('HARBOR_SURUKLENTI', 'Sürüklenti İskelesi', 'trade', 3),
  H('HARBOR_KIZIL_LAGUN', 'Kızıl Lagün', 'pirate', 3),
  // Bölge 4 — Tehlikeli Sular (10)
  H('HARBOR_KOR_ADASI', 'Kor Adası', 'volcanic', 4),
  H('HARBOR_KUL', 'Kül Limanı', 'volcanic', 4),
  H('HARBOR_DERIN_SIS', 'Derin Sis', 'fog', 4),
  H('HARBOR_HAYALET_DEMIRYERI', 'Hayalet Demiryeri', 'mystery', 4),
  H('HARBOR_ANTIK_KOY', 'Antik Koy', 'mystery', 4),
  H('HARBOR_SAVAS_LORDU', 'Savaş Lordu İskelesi', 'military', 4),
  H('HARBOR_LANETLI_KOY', 'Lanetli Koy', 'mystery', 4),
  H('HARBOR_YILAN', 'Yılan Limanı', 'pirate', 4),
  H('HARBOR_FIRTINA_SIGINAGI', 'Fırtına Sığınağı', 'fog', 4),
  H('HARBOR_TITAN_RESIFI', 'Titan Resifi', 'mystery', 4),
  // Bölge 5 — Bilinmeyenin Ucu (10)
  H('HARBOR_DONMUS_ISKELE', 'Donmuş İskele', 'ice', 5),
  H('HARBOR_BUZ_KATEDRALI', 'Buz Katedrali', 'ice', 5),
  H('HARBOR_KUZEY_ISIGI', 'Kuzey Işığı Limanı', 'ice', 5),
  H('HARBOR_OBSIDYEN', 'Obsidyen Rıhtım', 'volcanic', 5),
  H('HARBOR_DUNYANIN_UCU', 'Dünyanın Ucu', 'mystery', 5),
  H('HARBOR_HAYALET_ADA', 'Hayalet Ada', 'mystery', 5),
  H('HARBOR_FIRTINA_LIMANI', 'Fırtına Limanı', 'fog', 5),
  H('HARBOR_TITAN_CARSISI', 'Titan Çarşısı', 'trade', 5),
  H('HARBOR_KAHIN_KOYU', 'Kahin Koyu', 'mystery', 5),
  H('HARBOR_GRAND_HARBOR', 'Büyük Liman', 'trade', 5, { final: true }),
];

export const HARBOR_BY_ID = Object.fromEntries(HARBORS.map((h) => [h.id, h]));
export const GRAND_HARBOR_ID = 'HARBOR_GRAND_HARBOR';
