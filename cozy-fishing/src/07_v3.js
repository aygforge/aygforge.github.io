/* =====================================================================
   07_v3.js : Cozy Fishing v3.0 sistemleri
   FishingMethods, Dayparts, Trips (çok duraklı sefer + sefer raporu), TownProjects,
   Wildlife, Guests, Fleet (yevmiyeli balıkçılar). Mevcut S / Tx / Inv / Selector / Boats / Orders
   yapıları genişletilir; ikinci bir ekonomi, envanter veya kayıt sistemi yoktur.
   ===================================================================== */
const V3 = {
  methods: {
    float: { name: 'Şamandıralı Av', short: 'Şamandıra', icon: 'm_float', desc: 'Mevcut klasik yöntem. Atış, bekleme ve tasma aynen korunur; kıyı, küçük ve orta boy türlerde dengelidir.' },
    bottom: { name: 'Dip Oltası', short: 'Dip', icon: 'm_bottom', desc: 'Yem dibe iner, şamandıra yerine kamış ucunu izlersin. Uç sallanır, balık gelince belirgin bükülür. Dip türlerinde avantajlı.' },
    spin: { name: 'Spin Avcılığı', short: 'Spin', icon: 'm_spin', desc: 'Atıştan sonra yem durduğunda kısa dokunuşlarla oynat (2–3 iyi hareket yeterli). Hareketli yırtıcılarda avantajlı; en iyisi Metal Sahte Yem.' }
  },
  /* her türün uygun yöntemleri (birinci öğe en uygunu). Yöntem çarpanı yalnızca göreli ağırlıktır; hiçbir tür kapanmaz. */
  fishMethods: {
    sardalya: ['float'], gumus_baligi: ['float'], istavrit: ['float', 'spin'], izmarit: ['float', 'bottom'], kefal: ['float'], zargana: ['spin', 'float'],
    hamsi: ['float'], kaya_baligi: ['bottom', 'float'], sarpan: ['float'], iskorpit: ['bottom'],
    isparoz: ['float', 'bottom'], melanur: ['float'], karagoz: ['float', 'bottom'], cipura: ['bottom', 'float'], sargoz: ['float', 'bottom'], levrek: ['float', 'spin'],
    kupes: ['float'], mirmir: ['bottom'], dil_baligi: ['bottom'], minakop: ['bottom'],
    tekir: ['bottom'], barbun: ['bottom'], eskina: ['bottom'], mercan: ['bottom'], fangri: ['bottom'], sinarit: ['spin', 'bottom'], hanos: ['bottom', 'float'],
    kirlangic: ['bottom'], lahoz: ['bottom'], orfoz: ['bottom'],
    kolyoz: ['float', 'spin'], uskumru: ['spin', 'float'], lufer: ['spin'], palamut: ['spin'], yazili_orkinos: ['spin'], akya: ['spin'], tirsi: ['float'],
    dulger: ['bottom'], kalkan: ['bottom'], sarikuyruk: ['spin'],
    ringa: ['float'], mezgit: ['bottom'], pisi_baligi: ['bottom'], morina: ['bottom'], komur_baligi: ['bottom', 'spin'], halibut: ['bottom'], kapelin: ['float'],
    topak_baligi: ['bottom'], kizil_levrek: ['bottom'], kurt_baligi: ['bottom'],
    ucan_balik: ['float'], sari_kuyruklu_fusilier: ['float'], mavi_yuzgecli_trevally: ['spin'], kirmizi_snapper: ['bottom'], lambuka: ['spin'], barrakuda: ['spin'],
    mavi_cerrah: ['float'], papagan_baligi: ['float'], mercan_hanisi: ['bottom'], dev_trevally: ['spin'],
    albakor: ['spin'], sari_yuzgecli_orkinos: ['spin'], wahoo: ['spin'], buyuk_gozlu_orkinos: ['spin', 'bottom'], kilic_baligi: ['spin'], yelken_baligi: ['spin'],
    cizgili_orkinos: ['spin'], pervane_baligi: ['bottom'], opah: ['bottom'], mavi_marlin: ['spin']
  },
  dayparts: {
    morning: { name: 'Sabah', icon: 'dp_morning', desc: 'Pembe-altın gün doğumu. Sürü balıkları ve sabah beslenen türler biraz daha sık görülür.' },
    day: { name: 'Gündüz', icon: 'dp_day', desc: 'Standart aydınlatma ve mevcut av dengesi (çarpan yok).' },
    evening: { name: 'Akşamüstü', icon: 'dp_evening', desc: 'Turuncu-mor gün batımı. Akşam avlanan yırtıcı ve dip türleri biraz daha sık görülür.' }
  },
  dpFish: {
    morning: ['sardalya', 'hamsi', 'istavrit', 'gumus_baligi', 'levrek', 'cipura', 'karagoz', 'isparoz', 'tekir', 'barbun', 'kolyoz', 'uskumru', 'tirsi', 'ringa', 'kapelin', 'mezgit', 'ucan_balik', 'mavi_yuzgecli_trevally', 'sari_kuyruklu_fusilier', 'albakor', 'cizgili_orkinos'],
    evening: ['iskorpit', 'kefal', 'minakop', 'mirmir', 'sinarit', 'orfoz', 'lahoz', 'lufer', 'palamut', 'kalkan', 'dulger', 'morina', 'kurt_baligi', 'komur_baligi', 'kirmizi_snapper', 'barrakuda', 'lambuka', 'dev_trevally', 'wahoo', 'kilic_baligi', 'opah']
  },
  projects: [
    { id: 'pier', name: 'İskele Yenilemesi', cost: 3500, icon: 'proj_pier', look: 'Yeni ahşaplar, banklar, küçük fenerler ve balıkçı süsleri.', perk: 'Yalnızca Sakin Liman iskele avlarında balığın vurma olasılığına %5 göreli bonus (ör. %88 → %92,4; üst sınır %95).' },
    { id: 'market', name: 'Balık Pazarı Düzenlemesi', cost: 12000, icon: 'proj_market', look: 'Yeni gölgelikler, tezgâh süsleri, çiçekler ve kasalar.', perk: 'Sipariş panosunda +1 aktif alış ilanı kapasitesi (kısmi teslim ve cezasız süre aynen).' },
    { id: 'lighthouse', name: 'Liman Feneri Yenilemesi', cost: 28000, icon: 'proj_lighthouse', look: 'Mevcut fener taş yüzey ve güçlü ışıkla yenilenir; akşamüstü ışık huzmesi.', perk: 'Seçtiğin iki bölgenin ertesi gün hava tahmini (mevcut deterministik hava sistemiyle aynı sonuç).' },
    { id: 'terrace', name: 'Deniz Seyir Terası', cost: 55000, icon: 'proj_terrace', look: 'İskele ucunda ahşap seyir platformu, oturma yerleri ve dürbün.', perk: 'Deniz canlısı gözlem karşılaşmalarının göreli ihtimali %10 artar (balık av olasılığını etkilemez).' }
  ],
  /* 24 gözlem: yedi bölgenin iklim ve habitatına uygun gerçek canlılar. kind = animasyon türü */
  wildlife: [
    { id: 'gumus_marti', rid: 'sakin_liman', name: 'Gümüş Martı', kind: 'sky', w: 5, info: 'Sarı bacaklı kıyı martısı; balıkçı teknelerini ve iskeleleri yakından izler.' },
    { id: 'karabatak', rid: 'sakin_liman', name: 'Karabatak', kind: 'dive', w: 3, info: 'Suya dalıp balık avlayan koyu tüylü kuş; kanatlarını kurutmak için açar.' },
    { id: 'kiyi_yengeci', rid: 'sakin_liman', name: 'Kıyı Yengeci', kind: 'crab', w: 3, info: 'Taşların arasında yan yan yürüyen küçük yeşil yengeç.' },
    { id: 'gri_balikcil', rid: 'sakin_liman', name: 'Gri Balıkçıl', kind: 'wade', w: 2, info: 'Sığlıkta sabırla bekleyip ani bir hamleyle balık yakalayan uzun bacaklı kuş.' },
    { id: 'caretta', rid: 'yesil_koy', name: 'Caretta Kaplumbağası', kind: 'surface', w: 2, info: 'İri başlı deniz kaplumbağası; nefes almak için yüzeye çıkar, kumsallara yumurta bırakır.' },
    { id: 'ay_denizanasi', rid: 'yesil_koy', name: 'Ay Denizanası', kind: 'under', w: 4, info: 'Yarı saydam, dört halkalı zararsız denizanası; akıntıyla süzülür.' },
    { id: 'deniz_ati', rid: 'yesil_koy', name: 'Deniz Atı', kind: 'under', w: 2, info: 'Deniz çayırlarında kuyruğuyla tutunan küçük, dik duruşlu balık akrabası.' },
    { id: 'akdeniz_foku', rid: 'kayalik_adalar', name: 'Akdeniz Foku', kind: 'surface', w: 1, info: 'Nadir görülen fok; kayalık mağaralarda yaşar, başını sudan çıkarıp etrafa bakar.' },
    { id: 'deniz_yildizi', rid: 'kayalik_adalar', name: 'Deniz Yıldızı', kind: 'bed', w: 4, info: 'Kayalık dipte yavaşça ilerleyen beş kollu derisi dikenli canlı.' },
    { id: 'ahtapot', rid: 'kayalik_adalar', name: 'Ahtapot', kind: 'under', w: 3, info: 'Renk değiştirerek kayalara karışan zeki, sekiz kollu yumuşakça.' },
    { id: 'afalina', rid: 'serin_akintilar', name: 'Afalina Yunus Sürüsü', kind: 'leap', w: 3, info: 'Akıntı boylarında sürüyle yüzen, teknelerin yanında zıplamayı seven yunuslar.' },
    { id: 'sumsuk', rid: 'serin_akintilar', name: 'Sümsük Kuşu', kind: 'dive', w: 3, info: 'Yüksekten ok gibi suya dalan, beyaz gövdeli iri deniz kuşu.' },
    { id: 'pusula_denizanasi', rid: 'serin_akintilar', name: 'Pusula Denizanası', kind: 'under', w: 2, info: 'Şemsiyesinde pusula gülünü andıran kahverengi çizgiler taşır.' },
    { id: 'liman_foku', rid: 'sisli_kuzey', name: 'Liman Foku', kind: 'surface', w: 3, info: 'Benekli kürklü kuzey foku; meraklı gözlerle teknelere bakar.' },
    { id: 'puffin', rid: 'sisli_kuzey', name: 'Deniz Papağanı', kind: 'sky', w: 3, info: 'Renkli gagalı küçük kuzey kuşu; gagasında birkaç küçük balık taşır.' },
    { id: 'orka', rid: 'sisli_kuzey', name: 'Orka Sürüsü', kind: 'fin', w: 1, info: 'Siyah-beyaz deniz memelileri; uzun sırt yüzgeçleri sisin içinde belirir.' },
    { id: 'fulmar', rid: 'sisli_kuzey', name: 'Fulmar', kind: 'sky', w: 3, info: 'Dalgaların hemen üstünde süzülen, martıya benzeyen tüp burunlu deniz kuşu.' },
    { id: 'ucan_balik_suru', rid: 'gunes_adalari', name: 'Uçan Balık Sürüsü', kind: 'skim', w: 4, info: 'Göğüs yüzgeçlerini açıp yüzeyin üstünde metrelerce süzülen balık sürüsü.' },
    { id: 'manta', rid: 'gunes_adalari', name: 'Manta Vatozu', kind: 'leap', w: 1, info: 'Kanat gibi yüzgeçleriyle süzülen dev vatoz; bazen sudan sıçrar.' },
    { id: 'yesil_kaplumbaga', rid: 'gunes_adalari', name: 'Yeşil Deniz Kaplumbağası', kind: 'surface', w: 2, info: 'Deniz çayırlarıyla beslenen, mercanların arasında dinlenen kaplumbağa.' },
    { id: 'firkateyn', rid: 'gunes_adalari', name: 'Fırkateyn Kuşu', kind: 'sky', w: 2, info: 'Kırmızı gırtlak kesesi olan, rüzgârda hiç kanat çırpmadan süzülen kuş.' },
    { id: 'kambur_balina', rid: 'derin_mavi', name: 'Kambur Balina', kind: 'spout', w: 1, info: 'Uzakta su püskürten dev balina; şarkılarıyla bilinir.' },
    { id: 'donen_yunus', rid: 'derin_mavi', name: 'Dönen Yunus', kind: 'leap', w: 3, info: 'Sudan sıçrayıp kendi ekseninde dönen ince gagalı açık deniz yunusu.' },
    { id: 'ay_baligi', rid: 'derin_mavi', name: 'Ay Balığı', kind: 'fin', w: 2, info: 'Yüzeyde yan yatıp güneşlenen, yuvarlak ve kocaman zararsız balık.' }
  ],
  guestNpcs: ['efe', 'ali', 'mert', 'elif', 'bora'],
  guestLines: {
    greet: { efe: 'Rüzgârı kokla evlat; deniz bugün ne istediğini söyler.', ali: 'Teknen ferahmış! Yaşlı kemiklerim iyi bir gezi istiyordu.', mert: 'Sonunda! Tekneyle açılmayı hep hayal etmiştim.', elif: 'Defterimi getirdim; gördüğümüz her şeyi çizeceğim.', bora: 'Motoru dinliyorum… tıkır tıkır, iyi bakmışsın.' },
    region: {
      sakin_liman: 'Bu koyda dedemle ilk istavritimi tutmuştum.', yesil_koy: 'Yeşil Koy\'un sabahları zeytin kokar, çipuralar da bunu bilir.', kayalik_adalar: 'Kayalıklarda bir kez dev bir lahoz görmüştüm, iskeleye sığmazdı!',
      serin_akintilar: 'Akıntı lüferi getirir; martılar toplanınca hazırlan.', sisli_kuzey: 'Sis çökünce fener sesini dinle, yolunu kaybetmezsin.', gunes_adalari: 'Burada su öyle berrak ki balıkla göz göze gelirsin.', derin_mavi: 'Derin Mavi\'de sabır her şeydir; büyükler acele etmez.'
    },
    weather: { sunny: 'Güneş parlak, ama gölge arayan balıklar dibe yakın olur.', cloudy: 'Bulutlu hava balığı cesaretlendirir, şansımız açık.', rain: 'Yağmur suyu karıştırır; birazdan iştahları açılır.', fog: 'Sis yumuşak bir örtü gibi; sesleri dikkatle dinle.', wind: 'Rüzgârlı gün misinayı zorlar, gerilimi iyi kolla.' },
    big: 'Vay canına, bu bir canavar! Kasabada herkes duyacak.', fresh: 'Bunu daha önce hiç görmemiştim! Hemen deftere yazalım.', any: 'Güzel av! Elin iyice alıştı.', farewell: 'Güzel bir geziydi, beni de çağırdığın için sağ ol.'
  },
  fleetNpc: [
    { id: 'tuna', name: 'Tuna', title: 'Kıyı Uzmanı', mult: 0.90, desc: 'Sakin ve sabırlı; küçük ve kıyı balıklarına yatkın.', look: { skin: 1, hair: 1, hairColor: 2, body: 0, outfit: { shirt: '#4f86c6', shirt2: '#2e5a8a', pants: '#3a3a44', shoes: '#2a2226', pat: 'stripes' }, hat: 'bere' } },
    { id: 'bselin', name: 'Balıkçı Selin', title: 'Dengeli Balıkçı', mult: 1.00, desc: 'Her bölgede dengeli tür dağılımıyla döner. (Butik sahibi Selin ile karıştırma.)', look: { skin: 3, hair: 4, hairColor: 1, body: 0, outfit: { shirt: '#5fc46a', shirt2: '#3a8a42', pants: '#4a3a2a', shoes: '#3a2a22', pat: 'plain' }, hat: 'hasir' } },
    { id: 'ozan', name: 'Ozan', title: 'Kayalık ve Dip Avcısı', mult: 1.10, desc: 'Kayalık diplerin ustası; dip türlerini tercih eder.', look: { skin: 4, hair: 0, hairColor: 0, body: 1, outfit: { shirt: '#7a5a3a', shirt2: '#5a3e24', pants: '#2a2a3a', shoes: '#1a1a22', pat: 'vest' }, hat: 'kasket', beard: true } },
    { id: 'melis', name: 'Melis', title: 'Sürü Balıkçısı', mult: 1.05, desc: 'Küçük sürü balıklarını bulur; 4 balıkla dönme ihtimali biraz yüksek.', look: { skin: 0, hair: 7, hairColor: 4, body: 0, outfit: { shirt: '#f2c230', shirt2: '#c89a20', pants: '#3a4a6a', shoes: '#2a2226', pat: 'flower' }, hat: 'none' } },
    { id: 'riza', name: 'Rıza', title: 'Ekonomik Balıkçı', mult: 0.85, desc: 'Ucuza çalışır ama güçlü türlerde daha az verimlidir.', look: { skin: 2, hair: 2, hairColor: 6, body: 1, outfit: { shirt: '#8a8a7a', shirt2: '#6a6a5a', pants: '#4a4a3a', shoes: '#3a2a22', pat: 'buttons' }, hat: 'klasik', mustache: true } },
    { id: 'duru', name: 'Duru', title: 'Akıntı Uzmanı', mult: 1.15, desc: 'Hareketli deniz balıklarında başarılı; Serin Akıntılar\'da daha verimli.', look: { skin: 1, hair: 3, hairColor: 0, body: 0, outfit: { shirt: '#2fa39a', shirt2: '#1e7a72', pants: '#2a3a4a', shoes: '#2a2226', pat: 'knit' }, hat: 'denizci_bere' } },
    { id: 'kemal', name: 'Kemal', title: 'Açık Deniz Uzmanı', mult: 1.20, desc: 'Kabinli veya Açık Deniz teknesiyle güç 4 türlere ulaşabilir.', look: { skin: 3, hair: 0, hairColor: 6, body: 1, outfit: { shirt: '#2a3a5a', shirt2: '#1a2440', pants: '#2a2a2a', shoes: '#1a1a22', pat: 'buttons' }, hat: 'kaptan', beard: true, beardColor: '#9a9a9a' } },
    { id: 'nil', name: 'Nil', title: 'Tropik Deniz Uzmanı', mult: 1.15, desc: 'Tropik ve resif balıklarını tercih eder; Güneş Adaları\'nda daha verimli.', look: { skin: 5, hair: 5, hairColor: 0, body: 0, outfit: { shirt: '#f26a8a', shirt2: '#c84a6a', pants: '#f4f0e4', shoes: '#c8a070', pat: 'flower' }, hat: 'cicek_taci' } }
  ],
  fleetDays: { yesil_koy: 2, kayalik_adalar: 2, serin_akintilar: 2, sisli_kuzey: 3, gunes_adalari: 3, derin_mavi: 3 },
  fleetWage: { yesil_koy: 55, kayalik_adalar: 110, serin_akintilar: 145, sisli_kuzey: 170, gunes_adalari: 230, derin_mavi: 460 },
  maxStops: { coastal_skiff: 1, motorboat: 2, cabin: 2, offshore: 2 }
};
const PROJ = Object.fromEntries(V3.projects.map(p => [p.id, p]));
const WILD = Object.fromEntries(V3.wildlife.map(w => [w.id, w]));
const FLEETNPC = Object.fromEntries(V3.fleetNpc.map(n => [n.id, n]));
const METHOD_IDS = ['float', 'bottom', 'spin'], DAYPART_IDS = ['morning', 'day', 'evening'];
const DP_SET = { morning: new Set(V3.dpFish.morning), evening: new Set(V3.dpFish.evening) };

/* ---------------- Av yöntemleri ---------------- */
const Methods = {
  PREF: { bottom: 1.22, spin: 1.2 }, MISS: 0.88,
  of(fid) { return V3.fishMethods[fid] || ['float']; },
  /* manuel atışta geçerli yöntem: yarışmada her zaman standart şamandıra */
  cur() { if (Comp.active() && Game.sceneName === 'PierFishing') return 'float'; return METHOD_IDS.includes(S.method) ? S.method : 'float'; },
  factor(m, fid, bait) {
    if (!m || m === 'float') return 1;
    const ok = this.of(fid).includes(m);
    if (m === 'bottom') return ok ? this.PREF.bottom : this.MISS;
    if (!ok) return this.MISS;
    return bait === 'lure' ? this.PREF.spin : (bait && bait !== 'basic' ? 1.12 : 1.06);
  },
  set(m) {
    if (!METHOD_IDS.includes(m)) return { ok: false };
    if (Fishing.ctx && Fishing.phase !== 'READY') return { ok: false, msg: 'Atış veya mücadele sürerken yöntem değiştirilemez.' };
    if (Comp.active() && Game.sceneName === 'PierFishing') return { ok: false, msg: 'Yarışmada standart şamandıralı av kullanılır.' };
    S.method = m; Save.soon(); return { ok: true };
  }
};
/* ---------------- Gün ışığı ---------------- */
const Dayparts = {
  BONUS: 1.12,
  cur() { if (Comp.active() && Game.sceneName === 'PierFishing') return 'day'; if (S.trip && S.trip.daypart) return S.trip.daypart; return DAYPART_IDS.includes(S.daypart) ? S.daypart : 'day'; },
  /* sahne çizimi için: yalnız av sahneleri ve deniz haritası gün ışığını yansıtır */
  scene() { return S && ['PierFishing', 'BoatFishing'].includes(Game.sceneName) ? this.cur() : 'day'; },
  factor(dp, fid) { return dp && DP_SET[dp] && DP_SET[dp].has(fid) ? this.BONUS : 1; },
  set(dp) {
    if (!DAYPART_IDS.includes(dp)) return { ok: false };
    if (S.trip) return { ok: false, msg: 'Seferde gün ışığı sefer boyunca sabittir. Limana dönünce değiştirebilirsin.' };
    if (Fishing.ctx && Fishing.phase !== 'READY') return { ok: false, msg: 'Atış sürerken değiştirilemez.' };
    S.daypart = dp; Save.soon(); return { ok: true };
  }
};
/* Selector.weights: isteğe bağlı yöntem ve gün ışığı çarpanları (temel × yem × mevsim × hava × mesafe × olay × gün ışığı × yöntem), yeniden normalize */
{
  const _w = Selector.weights.bind(Selector);
  Selector.weights = function (spotId, o) {
    const r = _w(spotId, o); o = o || {};
    if (o.auto || (!o.method && !o.daypart)) return r;
    for (const x of r.list) { x.fac.method = Methods.factor(o.method, x.id, o.bait); x.fac.daypart = Dayparts.factor(o.daypart, x.id); x.w *= x.fac.method * x.fac.daypart; }
    r.total = sum(r.list.map(x => x.w)); r.list.forEach(x => x.p = r.total > 0 ? x.w / r.total : 0);
    return r;
  };
}

/* ---------------- Kasaba projeleri ---------------- */
const Projects = {
  st(id) { return S.projects[id] || (S.projects[id] = { paid: 0, done: 0 }); },
  done(id) { return !!(S && S.projects && S.projects[id] && S.projects[id].done); },
  left(id) { return Math.max(0, PROJ[id].cost - this.st(id).paid); },
  mask() { return V3.projects.map(p => this.done(p.id) ? 1 : 0).join(''); },
  donate(id, amount) {
    let fin = false;
    const r = Tx.run('projectDonate', () => {
      const P = PROJ[id]; if (!P) return { ok: false }; const st = this.st(id);
      if (st.done) return { ok: false, msg: 'Bu proje zaten tamamlandı.' };
      const amt = Math.min(Math.floor(+amount || 0), this.left(id), S.cash);
      if (amt <= 0) return { ok: false, msg: S.cash <= 0 ? 'Bağış için paran yok.' : 'Geçersiz miktar.' };
      spend(amt, 'project'); st.paid += amt; S.stats.donated = (S.stats.donated || 0) + amt;
      if (st.paid >= P.cost) { st.paid = P.cost; st.done = S.day; fin = true; if (id === 'market') Orders.refresh(S.day, null); if (id === 'lighthouse' && !(st.fc && st.fc.length)) st.fc = ['sakin_liman', 'yesil_koy']; }
      Sound.sfx(fin ? 'fanfare' : 'coin'); return { ok: true, amt, done: fin };
    });
    if (r.ok && fin) { Atlas.drop('pier:'); Game.projectFx = { id, t: Game.t }; Bus.toast(PROJ[id].name + ' tamamlandı! Kasaba yenilendi.', 'ach', PROJ[id].icon); }
    return r;
  },
  setForecast(i, rid) { const st = this.st('lighthouse'); if (!st.done || !REGION[rid]) return; st.fc = (st.fc || []).slice(0, 2); st.fc[i] = rid; Save.soon(); },
  /* yarının hava tahmini: World.weatherFor ile aynı deterministik sonuç */
  forecast() { if (!this.done('lighthouse')) return []; return (this.st('lighthouse').fc || []).filter(r => REGION[r]).slice(0, 2).map(rid => ({ rid, wx: World.weatherFor(rid, S.day + 1) })); }
};
{ const _slots = Orders.slots.bind(Orders); Orders.slots = function () { return _slots() + (Projects.done('market') ? 1 : 0); }; }

/* ---------------- Sefer (çok duraklı) ve sefer raporu ---------------- */
const Trips = {
  maxStops(bid) { return V3.maxStops[bid] || 1; },
  active() { return !!S.trip; },
  cur() { return S.trip ? S.trip.stops[S.trip.stops.length - 1] : null; },
  canAddStop() { const t = S.trip; if (!t) return false; return t.stops.length < this.maxStops(t.boat); },
  legCost(rid) { return Math.round(REGION[rid].trip_fuel_cost * 0.9); },
  /* Tx içinde çağrılır (SeaMap.depart) */
  begin(rid, fuel) {
    S.tripSeq = (S.tripSeq || 0) + 1;
    S.trip = { id: S.tripSeq, day: S.day, boat: S.boats.active, stops: [rid], legs: [{ rid, fuel }], spots: [], daypart: DAYPART_IDS.includes(S.daypart) ? S.daypart : 'day', fuel,
      energy0: S.energy, bait0: Object.assign({}, S.baitStock), manual: 0, auto: 0, fish: {}, value: 0, newSp: [], recs: [], wild: [], guest: Guests.valid() ? S.guest.npc : null, wildRoll: {} };
  },
  addStop(rid) {
    return Tx.run('tripLeg', () => {
      const t = S.trip; if (!t) return { ok: false, msg: 'Aktif sefer yok.' };
      if (!this.canAddStop()) return { ok: false, msg: t.stops.length >= 2 ? 'Bir seferde en fazla iki ana bölge. Limana dönmelisin.' : BOAT[t.boat].name + ' tek bölgelik seferler yapabilir.' };
      if (rid === this.cur()) return { ok: false, msg: 'Zaten bu bölgedesin.' };
      if (t.stops.includes(rid)) return { ok: false, msg: 'Bu bölgeyi bu seferde zaten ziyaret ettin.' };
      const re = Boats.reach(rid, t.boat); if (!re.ok) return { ok: false, msg: 'Bu tekne oraya ulaşamaz: ' + re.miss.join(', ') };
      const c = this.legCost(rid); if (S.cash < c) return { ok: false, msg: 'Yakıt için paran yetmiyor (' + c + ').' };
      if (c) spend(c, 'fuel'); S.stats.fuelSpent += c; t.fuel += c; t.legs.push({ rid, fuel: c }); t.stops.push(rid);
      S.regionId = rid; S.spotId = REGION[rid].spot_ids[0]; S.stats.regionsVisited[rid] = true; S.scene = 'BoatFishing';
      return { ok: true, cost: c };
    });
  },
  onCatch(fid, size, auto, res) {
    const t = S.trip; if (!t) return;
    if (auto) t.auto++; else t.manual++; t.fish[fid] = (t.fish[fid] || 0) + 1; t.value += FISH[fid].base_price;
    if (res.isNew && !t.newSp.includes(fid)) t.newSp.push(fid); if (res.isRecord) t.recs.push({ fid, cm: size.cm });
  },
  onSpot(sid) { const t = S.trip; if (t && !t.spots.includes(sid)) t.spots.push(sid); },
  end() {
    const t = S.trip; if (!t) return null; let rep = null;
    Tx.run('tripEnd', () => {
      let bait = 0; for (const b of PAID_BAITS) { const used = Math.max(0, (t.bait0[b] || 0) - (S.baitStock[b] || 0)); bait += used * BAIT[b].purchase_price; }
      rep = { id: t.id, day: t.day, boat: t.boat, boatName: BOAT[t.boat] ? BOAT[t.boat].name : t.boat, stops: t.stops.slice(), spots: t.spots.slice(), daypart: t.daypart, manual: t.manual, auto: t.auto, fish: Object.assign({}, t.fish),
        energy: Math.max(0, t.energy0 - S.energy), baitCost: bait, fuel: t.fuel, value: t.value, newSp: t.newSp.slice(), recs: t.recs.slice(), wild: t.wild.slice(), guest: t.guest };
      S.tripLog.push(rep); while (S.tripLog.length > 10) S.tripLog.shift();
      if (t.guest) S.guestLog[t.guest] = (S.guestLog[t.guest] || 0) + 1;
      S.trip = null; if (S.guest && t.guest === S.guest.npc) S.guest = null; return { ok: true };
    });
    return rep;
  }
};

/* ---------------- Deniz canlıları gözlemi ---------------- */
const Wildlife = {
  DAILY_MAX: 4, active: null,
  pool(rid) { return V3.wildlife.filter(w => w.rid === rid); },
  count() { return Object.keys(S.wild.seen).length; },
  /* oyun günü + av bağlamıyla deterministik karşılaşma; aynı sahneye girip çıkmak yeni gözlem üretmez */
  chanceMul() { return Projects.done('terrace') ? 1.1 : 1; },
  roll(rid, ctxKey, base) {
    if (!REGION[rid]) return null;
    if (S.wild.day !== S.day) { S.wild.day = S.day; S.wild.n = 0; S.wild.keys = {}; }
    S.wild.keys = S.wild.keys || {}; if (S.wild.keys[ctxKey]) return null; S.wild.keys[ctxKey] = 1;
    if (S.wild.n >= this.DAILY_MAX) return null;
    const r = mulberry(hash32(S.seed, 'wild', S.day, ctxKey)); if (r() >= base * this.chanceMul()) return null;
    const pool = this.pool(rid); const tot = sum(pool.map(w => w.w)); let x = r() * tot, pick = pool[0];
    for (const w of pool) { x -= w.w; if (x < 0) { pick = w; break; } }
    return pick.id;
  },
  /* Tx içinde: gözlemi kaydet (envanter, para, balık değişmez) */
  register(id, rid) {
    const e = S.wild.seen[id] || (S.wild.seen[id] = { first: S.day, rid, n: 0 }); const isNew = e.n === 0; e.n++; S.wild.n++;
    S.wild.log[S.day] = (S.wild.log[S.day] || 0) + 1; const days = Object.keys(S.wild.log); if (days.length > 30) delete S.wild.log[days[0]];
    if (S.trip && !S.trip.wild.includes(id)) S.trip.wild.push(id);
    return isNew;
  },
  trigger(rid, ctxKey, base) {
    const id = this.roll(rid, ctxKey, base); if (!id) { Save.soon(); return null; }
    let isNew = false; Tx.run('wildSeen', () => { isNew = this.register(id, rid); return { ok: true }; });
    this.active = { id, t: 0, rid, dir: hash32(S.day, ctxKey) % 2 ? 1 : -1 };
    Bus.toast((isNew ? 'Yeni gözlem: ' : 'Gözlem: ') + WILD[id].name + ' (' + this.count() + '/' + V3.wildlife.length + ')', isNew ? 'good' : 'info', 'wild_book');
    if (isNew) Sound.sfx('record');
    return id;
  },
  update(dt) { if (this.active) { this.active.t += dt; if (this.active.t > 6) this.active = null; } }
};
DECOR.push({ id: 'poster_wild', name: 'Deniz Yaşamı Posteri', slot: 'wall', ach: 'wild16' }); DECOR_BY.poster_wild = DECOR[DECOR.length - 1];
ACHS.push(
  { id: 'wild8', name: 'Doğa Gözlemcisi', condition_tr: '8 farklı deniz canlısı gözlemle', category: 'Deniz Yaşamı' },
  { id: 'wild16', name: 'Deniz Biyoloğu', condition_tr: '16 farklı deniz canlısı gözlemle', category: 'Deniz Yaşamı' },
  { id: 'wild24', name: 'Yedi Denizin Tanığı', condition_tr: '24 deniz canlısının hepsini gözlemle', category: 'Deniz Yaşamı' }
);
ACH_DEF.wild8 = [() => Object.keys(S.wild.seen).length, 8];
ACH_DEF.wild16 = [() => Object.keys(S.wild.seen).length, 16];
ACH_DEF.wild24 = [() => Object.keys(S.wild.seen).length, V3.wildlife.length];
ACH_REWARD.wild8 = { type: 'badge', id: 'wild_badge', name: 'Doğa Gözlemcisi Rozeti' };
ACH_REWARD.wild16 = { type: 'decor', id: 'poster_wild', name: 'Deniz Yaşamı Posteri' };
ACH_REWARD.wild24 = { type: 'title', id: 'naturalist', name: '“Yedi Denizin Tanığı” Unvanı' };

/* ---------------- Misafir NPC gezileri (yalnızca sosyal) ---------------- */
const Guests = {
  bubble: null,
  valid() { return !!(S.guest && S.guest.day === S.day && V3.guestNpcs.includes(S.guest.npc)); },
  invite(npc) {
    return Tx.run('guestInvite', () => {
      if (!V3.guestNpcs.includes(npc)) return { ok: false, msg: 'Bu kişi şu an geziye katılamıyor.' };
      if (!S.boats.active) return { ok: false, msg: 'Misafir almak için bir teknen olmalı.' };
      if (S.trip) return { ok: false, msg: 'Sefer sürerken misafir alınamaz.' };
      if (this.valid() && S.guest.npc !== npc) return { ok: false, msg: 'Aynı anda yalnızca bir misafir alabilirsin (' + NPCS[S.guest.npc].name + ' zaten davetli).' };
      S.guest = { npc, day: S.day }; return { ok: true };
    });
  },
  cancel() { S.guest = null; Save.soon(); },
  say(kind, arg) {
    const t = S.trip; if (!t || !t.guest) return; const L = V3.guestLines; const g = t.guest;
    const text = kind === 'greet' ? L.greet[g] : kind === 'region' ? L.region[arg] : kind === 'weather' ? L.weather[arg] : L[kind];
    if (text) this.bubble = { text, t: 0, life: 4.5 };
  },
  update(dt) { if (this.bubble) { this.bubble.t += dt; if (this.bubble.t > this.bubble.life) this.bubble = null; } }
};

/* ---------------- Filo: yevmiyeli balıkçılar ---------------- */
const Fleet = {
  capacity() { return Math.min(3, Math.max(0, S.boats.owned.length - 1)); },
  missionOf(bid) { return S.fleet.missions.find(m => m.boat === bid) || null; },
  busyNpc(id) { return S.fleet.missions.some(m => m.npc === id); },
  onMission(bid) { return !!this.missionOf(bid); },
  status(bid) { if (bid === S.boats.active) return 'active'; const m = this.missionOf(bid); if (!m) return 'idle'; return m.status === 'out' ? 'out' : 'back'; },
  /* günlük 5 aday: tohum + gün + uygunluk ile deterministik, gün içinde sabit */
  candidates() {
    const c = S.fleet.cand;
    if (!c || c.day !== S.day) {
      const avail = V3.fleetNpc.map(n => n.id).filter(id => !this.busyNpc(id)); const r = mulberry(hash32(S.seed, 'fleetc', S.day));
      for (let i = avail.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [avail[i], avail[j]] = [avail[j], avail[i]]; }
      S.fleet.cand = { day: S.day, ids: avail.slice(0, 5) };
    }
    return S.fleet.cand.ids;
  },
  maxPower(npc, bid) { const tier = BOAT_INFO[bid] ? BOAT_INFO[bid].tier : 1; return npc === 'kemal' && tier >= 3 ? 4 : 3; },
  cost(npc, rid) { const wage = Math.round(V3.fleetWage[rid] * FLEETNPC[npc].mult); const fuel = REGION[rid].trip_fuel_cost; return { wage, fuel, total: wage + fuel }; },
  /* NPC'nin bu bölgede getirebileceği türler: yalnız oyuncunun keşfettiği, güç 5 asla */
  pool(npc, rid, bid) {
    const mp = this.maxPower(npc, bid); const m = {};
    for (const sid of REGION[rid].spot_ids) for (const fid in SPOTS[sid].weights) {
      const f = FISH[fid]; if (!f || f.power >= 5 || f.power > mp) continue; if (!(S.ency[fid] && S.ency[fid].caught > 0)) continue;
      m[fid] = (m[fid] || 0) + SPOTS[sid].weights[fid];
    }
    return Object.entries(m).map(([fid, w]) => ({ fid, w: w * this.spec(npc, fid, rid) }));
  },
  spec(npc, fid, rid) {
    const f = FISH[fid], meth = Methods.of(fid);
    switch (npc) {
      case 'tuna': return f.power <= 2 ? 1.15 : 1;
      case 'ozan': return meth.includes('bottom') ? 1.18 : 1;
      case 'melis': return f.power <= 2 ? 1.12 : 1;
      case 'riza': return f.power >= 3 ? 0.8 : 1;
      case 'duru': return meth.includes('spin') ? 1.15 : 1;
      case 'kemal': return f.power >= 3 ? 1.15 : 1;
      case 'nil': return f.home_region === 'gunes_adalari' ? 1.2 : 1;
    }
    return 1;
  },
  countDist(npc, rid) {
    if (npc === 'melis' || (npc === 'duru' && rid === 'serin_akintilar') || (npc === 'nil' && rid === 'gunes_adalari')) return [0.20, 0.55, 0.25];
    if (npc === 'riza') return [0.30, 0.55, 0.15];
    return [0.25, 0.55, 0.20];
  },
  check(bid, npc, rid) {
    if (!Boats.owned(bid)) return 'Bu tekneye sahip değilsin.';
    if (S.boats.owned.length < 2) return 'Filo görevi için en az iki tekne gerekir.';
    if (bid === S.boats.active) return 'Aktif teknen göreve gönderilemez. Önce başka bir tekneyi aktif yap.';
    if (this.onMission(bid)) return 'Bu tekne zaten bir görevde veya teslimatı bekliyor.';
    if (S.fleet.missions.length >= this.capacity()) return 'Filo kapasitesi dolu (' + this.capacity() + ').';
    if (Inv.total('boat:' + bid) > 0) return 'Göreve çıkmadan önce tekne deposu boşaltılmalı.';
    if (!FLEETNPC[npc]) return 'Balıkçı bulunamadı.';
    if (this.busyNpc(npc)) return FLEETNPC[npc].name + ' başka bir görevde.';
    if (!this.candidates().includes(npc)) return FLEETNPC[npc].name + ' bugün iş ilanlarında değil.';
    if (!REGION[rid] || !V3.fleetDays[rid]) return 'Geçersiz bölge.';
    const re = Boats.reach(rid, bid); if (!re.ok) return BOAT[bid].name + ' bu bölgeye ulaşamaz: ' + re.miss.join(', ');
    if (!this.pool(npc, rid, bid).length) return 'Bu bölgede henüz kendin keşfettiğin uygun bir tür yok. Önce bölgeyi kendin keşfetmelisin.';
    if (S.cash < this.cost(npc, rid).total) return 'Paran yetmiyor (' + this.cost(npc, rid).total + ').';
    return null;
  },
  start(bid, npc, rid) {
    return Tx.run('fleetStart', () => {
      const err = this.check(bid, npc, rid); if (err) return { ok: false, msg: err };
      const c = this.cost(npc, rid); spend(c.wage, 'fleet_wage'); spend(c.fuel, 'fleet_fuel');
      S.fleet.seq = (S.fleet.seq || 0) + 1; const days = V3.fleetDays[rid];
      S.fleet.missions.push({ id: 'm' + S.fleet.seq, boat: bid, npc, rid, start: S.day, ret: S.day + days, days, wage: c.wage, fuel: c.fuel, status: 'out', result: null, left: null, notified: false });
      S.fleet.stats.wages += c.wage; S.fleet.stats.fuel += c.fuel; this.anim = { bid, kind: 'leave', t: Game.t };
      Sound.sfx('horn'); return { ok: true };
    });
  },
  /* görev sonucu: görev tohumu ile deterministik ve üretildiği anda kalıcı */
  resolve(m) {
    const r = mulberry(hash32(S.seed, 'fleet', m.id, m.npc, m.rid)); const d = this.countDist(m.npc, m.rid); const u = r();
    const n = u < d[0] ? 2 : u < d[0] + d[1] ? 3 : 4; const pool = this.pool(m.npc, m.rid, m.boat); const fish = {};
    if (pool.length) { const tot = sum(pool.map(p => p.w)); for (let i = 0; i < n; i++) { let x = r() * tot, pick = pool[0].fid; for (const p of pool) { x -= p.w; if (x < 0) { pick = p.fid; break; } } fish[pick] = (fish[pick] || 0) + 1; } }
    const total = sum(Object.values(fish)); const value = sum(Object.entries(fish).map(([f, q]) => FISH[f].base_price * q));
    return { fish, n: total, value };
  },
  /* yalnızca oyun günü ilerlediğinde (World.startDay) çağrılır; aynı gün tekrar çağrı sonucu değiştirmez */
  onNewDay() {
    if (!S.fleet) return; const back = [];
    for (const m of S.fleet.missions) if (m.status === 'out' && S.day >= m.ret) { m.result = this.resolve(m); m.left = Object.entries(m.result.fish).map(([f, q]) => ({ f, q })); m.status = 'back'; m.backDay = S.day; back.push(m); }
    if (back.length) Bus.toast('BALIKÇI LİMANA DÖNDÜ! ' + back.map(m => FLEETNPC[m.npc].name + ' (' + m.result.n + ' balık)').join(', '), 'good', 'fleet_back');
  },
  leftN(m) { return m.left ? sum(m.left.map(x => x.q)) : 0; },
  destinations() { const d = ['bag', 'chest']; for (const b of S.boats.owned) if (!this.onMission(b)) d.push('boat:' + b); return d; },
  /* teslimat: seçilen depo (ya da öncelik sırası); sığmayanlar Liman Teslim Kasası'nda bekler */
  collect(mid, dest) {
    return Tx.run('fleetCollect', () => {
      const m = S.fleet.missions.find(x => x.id === mid); if (!m || m.status !== 'back' || !m.left) return { ok: false, msg: 'Teslim alınacak balık yok.' };
      if (Game.sceneName !== 'Town' && !QA.silent) return { ok: false, msg: 'Teslimat yalnızca limandan (kasabadan) alınabilir.' };
      const keys = dest ? [dest] : this.destinations(); let moved = 0;
      for (const it of m.left) { for (const k of keys) { if (it.q <= 0) break; if (k.startsWith('boat:') && this.onMission(k.slice(5)) && k.slice(5) !== m.boat) continue; const a = Inv.add(k, it.f, it.q); it.q -= a; moved += a; } }
      m.left = m.left.filter(x => x.q > 0);
      if (!moved) return { ok: false, msg: 'Seçilen depoda yer yok; balıklar teslim kasasında bekliyor.' };
      S.fleet.stats.fish += moved; S.today.fleetFish = (S.today.fleetFish || 0) + moved;
      let done = false;
      if (!m.left.length) { done = true; S.fleet.stats.missions++; S.fleet.stats.value += m.result.value; S.fleet.missions = S.fleet.missions.filter(x => x !== m);
        S.fleet.log.push({ id: m.id, npc: m.npc, boat: m.boat, rid: m.rid, start: m.start, ret: m.ret, n: m.result.n, value: m.result.value, fish: m.result.fish, wage: m.wage, fuel: m.fuel }); while (S.fleet.log.length > 10) S.fleet.log.shift(); this.anim = { bid: m.boat, kind: 'arrive', t: Game.t }; }
      Sound.sfx('coin'); return { ok: true, n: moved, done, left: this.leftN(m) };
    });
  }
};
{
  const _sd = World.startDay.bind(World);
  World.startDay = function () { _sd(); if (S.fleet) Fleet.onNewDay(); if (S.guest && S.guest.day !== S.day) S.guest = null; };
  /* aktif tekne: görevdeki tekne seçilemez; seferde tekne değişmez */
  const _sa = Boats.setActive.bind(Boats);
  Boats.setActive = function (id) { if (Fleet.onMission(id)) { Bus.toast(BOAT[id].name + ' şu an filo görevinde.', 'warn', 'fleet_out'); return { ok: false, msg: 'Tekne görevde.' }; } if (S.trip) return { ok: false, msg: 'Tekne değiştirme yalnızca limanda yapılabilir.' }; return _sa(id); };
  const _acc = Inv.accessible.bind(Inv);
  Inv.accessible = function () { return _acc().filter(k => !(k.startsWith('boat:') && Fleet.onMission(k.slice(5)))); };
  /* mount: görevdeki tekneye cihaz takılamaz */
  const _mount = Auto.mount.bind(Auto);
  Auto.mount = function (dev, bid) { if (Fleet.onMission(bid)) return { ok: false, msg: 'Tekne filo görevinde.' }; return _mount(dev, bid); };
}

/* ---------------- Catch.record: sefer raporu ve misafir tepkisi ---------------- */
{
  const _rec = Catch.record;
  Catch.record = function (fid, size, auto, meta) {
    const r = _rec(fid, size, auto, meta);
    if (S.trip) { Trips.onCatch(fid, size, auto, r); if (!auto && S.trip.guest) Guests.say(r.isNew ? 'fresh' : (size.cls === 'exceptional' || r.isRecord) ? 'big' : (Math.random() < 0.35 ? 'any' : null)); }
    return r;
  };
}

/* ---------------- Mali Günlük: filo ve proje kalemleri ---------------- */
Finance.close = function (rep) {
  const by = rep.expBy || {}; const gearC = (by.gear || 0) + (by.boat || 0) + (by.automation || 0);
  const fw = by.fleet_wage || 0, ff = by.fleet_fuel || 0, pj = by.project || 0;
  const income = (rep.marketIncome || 0) + (rep.orderIncome || 0) + (rep.teaIncome || 0) + (rep.prizeIncome || 0);
  const expense = rep.expenses || 0;
  const e = { day: rep.prevDay || rep.day, manual: rep.manualCatches, auto: rep.autoCatches, fleetFish: rep.fleetFish || 0, market: rep.marketIncome || 0, orders: rep.orderIncome || 0, tea: rep.teaIncome || 0, prize: rep.prizeIncome || 0,
    bait: by.bait || 0, fuel: by.fuel || 0, gear: gearC, fleetWage: fw, fleetFuel: ff, project: pj, other: expense - (by.bait || 0) - (by.fuel || 0) - gearC - fw - ff - pj, income, expense, net: rep.endCash - rep.startCash, startCash: rep.startCash, endCash: rep.endCash };
  e.consistent = e.net === income - expense;
  S.fin.push(e); while (S.fin.length > 30) S.fin.shift();
  return e;
};

/* ---------------- kayıt doğrulama (şema 4 alanları) ---------------- */
V3.validate = function (st) {
  const e = [];
  if (!METHOD_IDS.includes(st.method)) e.push('av yöntemi'); if (!DAYPART_IDS.includes(st.daypart)) e.push('gün ışığı');
  if (!st.projects || typeof st.projects !== 'object') e.push('projeler');
  else for (const p of V3.projects) { const x = st.projects[p.id]; if (!x || !(x.paid >= 0) || x.paid > p.cost || (x.done && x.paid !== p.cost)) e.push('proje ' + p.id); }
  if (!st.fleet || !Array.isArray(st.fleet.missions) || !Array.isArray(st.fleet.log)) e.push('filo');
  else {
    const boats = new Set(), npcs = new Set();
    for (const m of st.fleet.missions) {
      if (!st.boats.owned.includes(m.boat) || !FLEETNPC[m.npc] || !REGION[m.rid] || boats.has(m.boat) || npcs.has(m.npc) || m.boat === st.boats.active) e.push('filo görevi ' + m.id);
      boats.add(m.boat); npcs.add(m.npc);
      if (m.left) for (const x of m.left) if (!FISH[x.f] || !(x.q >= 1) || x.q !== (x.q | 0)) e.push('teslim kasası');
    }
    if (st.fleet.missions.length > Math.min(3, Math.max(0, st.boats.owned.length - 1))) e.push('filo kapasitesi');
  }
  if (!Array.isArray(st.tripLog) || st.tripLog.length > 10) e.push('sefer raporları');
  if (st.trip && (!Array.isArray(st.trip.stops) || st.trip.stops.length > 2 || !st.boats.owned.includes(st.trip.boat))) e.push('aktif sefer');
  if (!st.wild || typeof st.wild.seen !== 'object') e.push('gözlemler'); else for (const k in st.wild.seen) if (!WILD[k]) e.push('gözlem ' + k);
  return e;
};
