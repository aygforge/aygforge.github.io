/* =====================================================================
   07_v4.js : Cozy Fishing v4.0 — The Cozy Adventure Update
   AvTemposu (Akıcı/Klasik) · FishingOpportunities · TrophyFishing · AnglerGuild · TownStories
   ShoreCollection (Kıyı Keşfi verisi) · Binoculars · Unlocks. Mevcut S / Tx / Inv / Selector / Catch / Wildlife yapıları kullanılır.
   ===================================================================== */
const V4 = {
  flowWait: [1.5, 3.5],
  schoolFish: ['sardalya', 'hamsi', 'istavrit', 'gumus_baligi', 'izmarit', 'isparoz', 'kupes', 'uskumru', 'kolyoz', 'tirsi', 'ringa', 'kapelin', 'ucan_balik', 'sari_kuyruklu_fusilier', 'mavi_cerrah'],
  oppTypes: {
    school: { name: 'Balık Sürüsü', icon: 'op_school', hint: 'Yüzeyde sıçramalar! Sürünün mesafesine atış yaparsan sürü balıkları ×1,30 daha sık gelir.' },
    big: { name: 'Büyük Balık İzleri', icon: 'op_big', hint: 'Suyun altında iri bir gölge. Gölgenin mesafesine atış yaparsan iri balık ihtimali artar (garanti değil).' },
    bottom: { name: 'Dip Hareketliliği', icon: 'op_bottom', hint: 'Dipte kabarcıklar ve kum bulutları. Dip Oltası ile dip türleri ×1,30 daha sık gelir.' },
    predator: { name: 'Avcı Balık Takibi', icon: 'op_predator', hint: 'Hızlı bir gölge yem arıyor. Spin ile ritimli yem hareketleri vurma şansını biraz artırır.' }
  },
  trophies: [
    { id: 't_zargana', fid: 'zargana', rid: 'sakin_liman', name: 'Kıyının Oku', specials: ['side', 'run'], jumps: 1, speed: 0.56, dur: [6, 9], desc: 'Yüzeye yakın hızlı kaçış, kısa sıçrama ve bir ani yön değişikliği.', reward: { kind: 'decor', id: 'tr_zargana', name: 'Zargana Trofesi' } },
    { id: 't_levrek', fid: 'levrek', rid: 'yesil_koy', name: 'Koyun Avcısı', specials: ['run', 'run', 'lift'], speed: 0.64, dur: [9, 13], desc: 'İki ani kaçış, kısa sakinleşme ve doğru anda çekişte avantaj.', reward: { kind: 'ornament', id: 'orn_tr_levrek', name: 'Levrek Desenli Tekne Bayrağı' } },
    { id: 't_sinarit', fid: 'sinarit', rid: 'kayalik_adalar', name: 'Kayaların Hâkimi', specials: ['run', 'side'], speed: 0.8, dur: [12, 16], desc: 'Kayalıklara dalış, misinayı germe ve karşı yönlü çekiş fırsatı.', reward: { kind: 'charm', id: 'charm_sinarit', name: 'Kayalık Adalar Olta Süsü' } },
    { id: 't_akya', fid: 'akya', rid: 'serin_akintilar', name: 'Akıntının Gücü', specials: ['run', 'lift'], speed: 0.7, dur: [14, 19], desc: 'Akıntı yönünde güçlü kaçış, kısa yavaşlama ve güçlü çekiş fırsatı.', reward: { kind: 'color', id: 'akinti', name: 'Akıntı Desenli Gövde Boyası' } },
    { id: 't_halibut', fid: 'halibut', rid: 'sisli_kuzey', name: 'Derinliğin Devi', specials: ['lift', 'run', 'lift'], speed: 0.6, dur: [14, 20], desc: 'Dibe doğru ağır direnç ve belirli aralıklarla kaldırma fırsatı.', reward: { kind: 'decor', id: 'tr_halibut', name: 'Kuzey Denizleri Balık Tablosu' } },
    { id: 't_barrakuda', fid: 'barrakuda', rid: 'gunes_adalari', name: 'Tropik Avcı', specials: ['side', 'side', 'run'], speed: 0.76, dur: [12, 17], desc: 'Yüksek hızlı ani hareketler ve iki yön arasında hızlı geçiş; spin yemini takip eder.', reward: { kind: 'ornament', id: 'orn_tr_barrakuda', name: 'Tropik Deniz Flaması' } },
    { id: 't_yelken', fid: 'yelken_baligi', rid: 'derin_mavi', name: 'Açık Denizin Şampiyonu', specials: ['run', 'jump', 'lift'], speed: 0.72, dur: [18, 25], desc: 'Uzun ilk kaçış, sudan sıçrama ve son çekiş mücadelesi.', reward: { kind: 'decor', id: 'tr_yelken', name: 'Yelken Balığı Altın Kupası' } }
  ],
  /* Balıkçı Birliği: 24 şablon (A: av becerisi, B: deniz keşfi, C: kasaba ve ticaret, D: koleksiyon ve yönetim) */
  guild: [
    { id: 'A01', name: 'Şamandıra Ustası', desc: 'Şamandıralı yöntemle 3 balık yakala.', need: 3, slot: 1 },
    { id: 'A02', name: 'Dip Avcısı', desc: 'Dip Oltası ile 3 balık yakala.', need: 3, slot: 1 },
    { id: 'A03', name: 'Spin Deneyimi', desc: 'Spin yöntemiyle 3 balık yakala.', need: 3, slot: 1 },
    { id: 'A04', name: 'Üç Yöntem', desc: 'Üç farklı av yöntemiyle birer balık yakala.', need: 3, slot: 1 },
    { id: 'A05', name: 'Kusursuz Tasma', desc: '3 mükemmel tasma gerçekleştir.', need: 3, slot: 1 },
    { id: 'A06', name: 'Büyük Mücadele', desc: 'Güç 3 veya üzeri bir balık yakala.', need: 1, slot: 1 },
    { id: 'B01', name: 'Kıyı Gezgini', desc: 'Bir seferde veya iskele avında 2 farklı av noktasını ziyaret et.', need: 2, slot: 2 },
    { id: 'B02', name: 'Denizler Arası', desc: 'Tek seferde 2 farklı ana bölgeye git.', need: 1, slot: 2 },
    { id: 'B03', name: 'Sabah Balıkçısı', desc: 'Sabah atmosferinde 2 başarılı av gerçekleştir.', need: 2, slot: 2 },
    { id: 'B04', name: 'Gün Batımı Avı', desc: 'Akşamüstü atmosferinde 2 başarılı av gerçekleştir.', need: 2, slot: 2 },
    { id: 'B05', name: 'Doğa Gözlemcisi', desc: 'Dürbünle Gözlem etkinliğini 1 kez tamamla (yeni canlı şart değil).', need: 1, slot: 2, nonFish: true },
    { id: 'B06', name: 'Trofe İzinde', desc: 'Aktif trofe hedefinde özel karşılaşma fırsatı bul (yakalamak şart değil).', need: 1, slot: 2 },
    { id: 'C01', name: 'Balık Hali Ziyareti', desc: 'Balık haline en az 3 balık sat.', need: 3, slot: 3, nonFish: true },
    { id: 'C02', name: 'Sipariş Teslimatı', desc: 'Bir siparişe en az bir geçerli teslimat yap.', need: 1, slot: 3, nonFish: true },
    { id: 'C03', name: 'Çay Molası', desc: 'Çay bahçesine günün balığından en az 1 tane sat.', need: 1, slot: 3, nonFish: true },
    { id: 'C04', name: 'Kasaba Dostu', desc: '2 farklı kasabalıyla konuş.', need: 2, slot: 3, nonFish: true },
    { id: 'C05', name: 'Misafir Kaptan', desc: 'Bir NPC misafiriyle tekne seferi tamamla.', need: 1, slot: 3, nonFish: true },
    { id: 'C06', name: 'Kasaba Yatırımı', desc: 'Açık bir kasaba projesine toplam en az 100 para bağışla.', need: 100, slot: 3, nonFish: true },
    { id: 'D01', name: 'Akvaryum Düzenle', desc: 'Bir akvaryuma balık ekle veya akvaryumlar arasında balık aktar.', need: 1, slot: 3, nonFish: true },
    { id: 'D02', name: 'Kıyı Koleksiyoncusu', desc: 'Kıyı Keşfi etkinliğini 1 kez tamamla.', need: 1, slot: 3, nonFish: true },
    { id: 'D03', name: 'Deniz Fotoğrafçısı', desc: 'Fotoğraf modunda bir deniz/doğa sahnesinin önizlemesini oluştur.', need: 1, slot: 3, nonFish: true },
    { id: 'D04', name: 'Filo İşletmecisi', desc: 'Bir NPC filo görevinden dönen balıkları teslim al.', need: 1, slot: 3, nonFish: true },
    { id: 'D05', name: 'Olta Hazırlığı', desc: 'Farklı bir kayıtlı ekipman setini uygula ve onunla bir başarılı av gerçekleştir.', need: 1, slot: 2 },
    { id: 'D06', name: 'Günlük İnceleme', desc: 'En az iki farklı av noktasını ziyaret ettiğin bir sefer tamamla ve raporunu görüntüle.', need: 1, slot: 2 }
  ],
  stories: {
    efe: { title: 'Efe\'nin Eski Av Defteri', unlock: 'İlk başarılı manuel av', stages: [
      { goal: 'Efe ile konuş: kayıp defter sayfasının ipucunu al.', talk: 'Gençken bir defter tutardım. Bir sayfası Dalgakıran\'ın taşları arasında kaldı… Belki hâlâ oradadır.' },
      { goal: 'İskeledeki Dalgakıran noktasına git ve hatırayı incele (balık tutman gerekmez).', inspect: 'liman_dalgakiran', found: 'Taşların arasında, yağmurdan korunmuş eski bir sayfa: “Fırtınadan sonraki sabah, ilk lüferim.”' },
      { goal: 'Efe\'ye dön ve hikâyesini dinle.', talk: 'O sabah babamla çıkmıştık… Bu sayfayı sen sakla; fotoğrafımı da al. Denizi senin gibi seven birine yakışır.' }
    ], reward: { album: 'efe_photo', decor: 'efe_foto', name: 'Efe\'nin Eski Fotoğrafı' } },
    mert: { title: 'Mert\'in İlk Açık Deniz Yolculuğu', unlock: 'İlk tekne', stages: [
      { goal: 'Mert ile konuş ve onu tekne gezisine davet et.', talk: 'Bir gün tekneyle açılmak en büyük hayalim! Beni de götürür müsün?' },
      { goal: 'Mert misafirinle Sakin Liman dışındaki bir bölgeye sefer yap ve limana dön.' },
      { goal: 'Geziden sonra Mert ile konuş.', talk: 'Ufukta martıların ardından gittiğimiz an… Hiç unutmayacağım. Bu küçük pusulayı hatıra olarak al!' }
    ], reward: { album: 'mert_trip', name: 'İlk Yolculuk Hatırası' } },
    elif: { title: 'Elif\'in Deniz Çizimleri', unlock: 'İlk tekne', stages: [
      { goal: 'Elif ile konuş: çizim defterindeki iki manzaranın ipucunu öğren.', talk: 'Defterimde iki manzara yarım kaldı. O noktaları görüp bana anlatır mısın?' },
      { goal: 'Tekneyle iki manzara noktasını ziyaret et ve oradan manzarayı incele.' },
      { goal: 'Elif\'e dön ve çizimleri gör.', talk: 'Anlattıkların sayesinde tamamladım! Bu iki çizim senin; evin için küçük bir pano da hazırladım.' }
    ], reward: { album: 'elif_drawings', decor: 'elif_pano', name: 'İki Deniz Çizimi ve Çizim Panosu' } },
    kerem: { title: 'Kerem\'in Deniz Koleksiyonu', unlock: 'İlk Kıyı Keşfi', stages: [
      { goal: 'Kerem ile konuş: deniz koleksiyonu fikrini öğren.', talk: 'Kıyıda bulduğun kabuklar ve camlar dükkânımda harika bir sergi olur!' },
      { goal: 'Kıyı Koleksiyonu\'nda üç farklı nesne bulunsun (önceden bulduklarını da sayarım).' },
      { goal: 'Kerem\'e dön ve sergi köşesini aç.', talk: 'Sergi köşesi hazır! Bir benzerini de evin için yaptım.' }
    ], reward: { album: 'kerem_exhibit', decor: 'deniz_sergisi', name: 'Kalıcı Deniz Sergisi' } },
    bora: { title: 'Bora\'nın Eski Teknesi', unlock: 'İlk tekne', stages: [
      { goal: 'Bora ile konuş: eski kıyı rotasını öğren.', talk: 'İlk teknemle hep iki noktayı dolaşırdım. Senin teknenle o rotayı bir dene!' },
      { goal: 'Teknenle iki farklı av noktasını ziyaret et.' },
      { goal: 'Limana dön ve Bora\'ya yolculuğu anlat.', talk: 'Demek rota hâlâ güzel… Eski teknemin levhasını sana veriyorum, onu sen yaşat.' }
    ], reward: { album: 'bora_plate', decor: 'bora_levha', name: 'Bora\'nın Hatıra Levhası' } }
  },
  /* Kıyı koleksiyonu: 24 nesne; env = bulunabildiği ortamlar (sand / rocks / tide) */
  shore: [
    { id: 'midye', cat: 'Kabuk', name: 'Midye Kabuğu', env: ['sand', 'rocks', 'tide'], info: 'Mor-siyah iki parçalı kabuğun bir yarısı.' },
    { id: 'tarak', cat: 'Kabuk', name: 'Deniz Tarağı', env: ['sand', 'tide'], info: 'Yelpaze biçimli, çizgili kabuk.' },
    { id: 'spiral', cat: 'Kabuk', name: 'Spiral Kabuk', env: ['sand', 'tide'], info: 'Kıvrılarak büyüyen küçük salyangoz kabuğu.' },
    { id: 'istiridye', cat: 'Kabuk', name: 'Çizgili İstiridye Kabuğu', env: ['rocks', 'tide'], info: 'Pürüzlü dış yüzü, sedefli içi var.' },
    { id: 'minare', cat: 'Kabuk', name: 'Küçük Deniz Minaresi', env: ['sand', 'rocks'], info: 'İnce, uzun ve sivri helezon kabuk.' },
    { id: 'sedef', cat: 'Kabuk', name: 'Sedefli Kabuk', env: ['tide'], info: 'Işıkta gökkuşağı gibi parlayan nadir kabuk.' },
    { id: 'cam_yesil', cat: 'Deniz Camı', name: 'Yeşil Deniz Camı', env: ['sand', 'tide'], info: 'Dalgalarla yumuşamış eski şişe camı.' },
    { id: 'cam_mavi', cat: 'Deniz Camı', name: 'Mavi Deniz Camı', env: ['sand', 'tide'], info: 'Koyu mavi, buzlu yüzeyli cam parçası.' },
    { id: 'cam_beyaz', cat: 'Deniz Camı', name: 'Buz Beyazı Cam', env: ['sand', 'rocks'], info: 'Süt beyazı, yuvarlak kenarlı cam.' },
    { id: 'cam_amber', cat: 'Deniz Camı', name: 'Amber Deniz Camı', env: ['sand'], info: 'Bal renginde sıcak tonlu cam.' },
    { id: 'cam_turkuaz', cat: 'Deniz Camı', name: 'Turkuaz Deniz Camı', env: ['tide'], info: 'Denizin rengini taşıyan parlak cam.' },
    { id: 'cam_mor', cat: 'Deniz Camı', name: 'Mor Deniz Camı', env: ['rocks', 'tide'], info: 'Güneşte zamanla morarmış çok eski cam.' },
    { id: 'cakil', cat: 'Kıyı Taşı', name: 'Yuvarlak Çakıl', env: ['sand', 'rocks'], info: 'Pürüzsüz, avuç içine sığan gri çakıl.' },
    { id: 'kuvars', cat: 'Kıyı Taşı', name: 'Beyaz Kuvars', env: ['rocks', 'sand'], info: 'Yarı saydam beyaz mineral.' },
    { id: 'bazalt', cat: 'Kıyı Taşı', name: 'Siyah Bazalt', env: ['rocks'], info: 'Volkanik, koyu ve ağır taş.' },
    { id: 'benekli', cat: 'Kıyı Taşı', name: 'Benekli Taş', env: ['rocks', 'tide'], info: 'Üzeri küçük açık renk beneklerle dolu.' },
    { id: 'delikli', cat: 'Kıyı Taşı', name: 'Delikli Sahil Taşı', env: ['rocks'], info: 'Dalgaların açtığı bir deliği olan uğurlu taş.' },
    { id: 'cizgili_tas', cat: 'Kıyı Taşı', name: 'Çizgili Mineral Taşı', env: ['rocks', 'sand'], info: 'Katman katman renkli damarlar taşıyor.' },
    { id: 'dugme', cat: 'Deniz Hatırası', name: 'Eski Denizci Düğmesi', env: ['sand', 'tide'], info: 'Üzerinde çapa işlenmiş pirinç düğme.' },
    { id: 'seramik', cat: 'Deniz Hatırası', name: 'Küçük Seramik Parçası', env: ['sand', 'rocks'], info: 'Mavi desenli eski bir tabaktan kalma.' },
    { id: 'capa_sus', cat: 'Deniz Hatırası', name: 'Paslı Çapa Süsü', env: ['rocks'], info: 'Bir tekne anahtarlığından düşmüş minik çapa.' },
    { id: 'jeton', cat: 'Deniz Hatırası', name: 'Minik Gemi Jetonu', env: ['tide'], info: 'Eski vapur iskelesinden kalma pirinç jeton.' },
    { id: 'ahsap', cat: 'Deniz Hatırası', name: 'Oyulmuş Ahşap Parçası', env: ['sand', 'tide'], info: 'Bir balıkçının oyduğu küçük balık figürü.' },
    { id: 'duduk', cat: 'Deniz Hatırası', name: 'Eski Denizci Düdüğü', env: ['rocks', 'tide'], info: 'Hâlâ ince bir ses çıkaran gümüş düdük.' }
  ],
  shoreEnv: { sand: { name: 'Kumluk Sahil', desc: 'Kumun üzerindeki ipuçlarını (farklı renk, parıltı, dalga izi, taş dizilimi) bul ve kaz.' }, rocks: { name: 'Kayalık Kıyı', desc: 'Kabarcıkları ve küçük izleri takip et, doğru kayayı kaldır.' }, tide: { name: 'Gelgit Havuzları', desc: 'Su çekildiğinde havuzlarda beliren nesneyi seç; su tekrar çekilir, acele yok.' } }
};
const TROPHY = Object.fromEntries(V4.trophies.map(t => [t.id, t]));
const TROPHY_BY_FISH = Object.fromEntries(V4.trophies.map(t => [t.fid, t]));
const GUILDT = Object.fromEntries(V4.guild.map(g => [g.id, g]));
const SHORE = Object.fromEntries(V4.shore.map(s => [s.id, s]));
const STORY_NPCS = Object.keys(V4.stories);
const hr = (...a) => hash32(S.seed, ...a) / 4294967296;

/* ---------- yeni kozmetikler ---------- */
DECOR.push(
  { id: 'tr_zargana', name: 'Zargana Trofesi', slot: 'shelf', unlockTr: 'Trofe: Kıyının Oku' },
  { id: 'tr_halibut', name: 'Kuzey Denizleri Balık Tablosu', slot: 'wall', unlockTr: 'Trofe: Derinliğin Devi' },
  { id: 'tr_yelken', name: 'Yelken Balığı Altın Kupası', slot: 'shelf', unlockTr: 'Trofe: Açık Denizin Şampiyonu' },
  { id: 'efe_foto', name: 'Efe\'nin Eski Fotoğrafı', slot: 'wall', unlockTr: 'Hikâye: Efe\'nin Eski Av Defteri' },
  { id: 'elif_pano', name: 'Elif\'in Çizim Panosu', slot: 'board', unlockTr: 'Hikâye: Elif\'in Deniz Çizimleri' },
  { id: 'deniz_sergisi', name: 'Kalıcı Deniz Sergisi', slot: 'table', unlockTr: 'Hikâye: Kerem\'in Deniz Koleksiyonu' },
  { id: 'bora_levha', name: 'Bora\'nın Hatıra Levhası', slot: 'wall', unlockTr: 'Hikâye: Bora\'nın Eski Teknesi' },
  { id: 'kabuk_sergisi', name: 'Deniz Kabuğu Sergisi', slot: 'table', ach: 'shore12' },
  { id: 'poster_shore', name: 'Sahil Temalı Poster', slot: 'wall', ach: 'shore18' }
);
for (const d of DECOR) DECOR_BY[d.id] = d;
BOAT_COLORS.push({ id: 'akinti', name: 'Akıntı Deseni', price: 0, trophy: 't_akya', unlockTr: 'Trofe: Akıntının Gücü (Akya)', c: ['#2f8ab8', '#1e5c8a', '#8ad0f0'] });
ACHS.push(
  { id: 'trophy7', name: 'Yedi Denizin Ustası', condition_tr: 'Yedi bölgesel trofenin hepsini yakala', category: 'Trofeler' },
  { id: 'shore6', name: 'Kıyı Kaşifi', condition_tr: '6 farklı kıyı nesnesi bul', category: 'Kıyı Koleksiyonu' },
  { id: 'shore12', name: 'Kabuk Meraklısı', condition_tr: '12 farklı kıyı nesnesi bul', category: 'Kıyı Koleksiyonu' },
  { id: 'shore18', name: 'Sahil Gezgini', condition_tr: '18 farklı kıyı nesnesi bul', category: 'Kıyı Koleksiyonu' },
  { id: 'shore24', name: 'Kıyı Koleksiyoncusu', condition_tr: '24 kıyı nesnesinin hepsini bul', category: 'Kıyı Koleksiyonu' }
);
ACH_DEF.trophy7 = [() => Object.keys(S.trophy.done).length, V4.trophies.length];
ACH_DEF.shore6 = [() => Object.keys(S.shore.items).length, 6];
ACH_DEF.shore12 = [() => Object.keys(S.shore.items).length, 12];
ACH_DEF.shore18 = [() => Object.keys(S.shore.items).length, 18];
ACH_DEF.shore24 = [() => Object.keys(S.shore.items).length, V4.shore.length];
ACH_REWARD.trophy7 = { type: 'title', id: 'seven_seas', name: '“Yedi Denizin Ustası” Unvanı' };
ACH_REWARD.shore6 = { type: 'badge', id: 'shore_badge', name: 'Kıyı Kaşifi Rozeti' };
ACH_REWARD.shore12 = { type: 'decor', id: 'kabuk_sergisi', name: 'Deniz Kabuğu Sergisi' };
ACH_REWARD.shore18 = { type: 'decor', id: 'poster_shore', name: 'Sahil Temalı Poster' };
ACH_REWARD.shore24 = { type: 'title', id: 'shore_collector', name: '“Kıyı Koleksiyoncusu” Unvanı' };
CFG.npc_dialogues.mert = (CFG.npc_dialogues.mert || []).concat([{ trigger: 'mert_story', text_tr: 'Açık deniz yolculuğumuzdan beri her sabah ufka bakıyorum. Bir gün kendi teknem olacak!' }, { trigger: 'mert_story', text_tr: 'Pusulayı hâlâ taşıyor musun? Ben her gün o yolculuğu anlatıyorum.' }]);
NPC_TRIG.mert_story = [true, () => !!(S.stories.mert && S.stories.mert.stage === 4)];

/* ---------- Av temposu ---------- */
const Tempo = {
  cur() { return S && S.tempo === 'classic' ? 'classic' : 'flow'; },
  wait(t) { return t === 'classic' ? RC.wait_sec_range : V4.flowWait; },
  set(t) { if (!['flow', 'classic'].includes(t)) return { ok: false }; S.tempo = t; Save.soon(); return { ok: true, note: Fishing.ctx && Fishing.phase !== 'READY' ? 'Sonraki atıştan itibaren geçerli.' : '' }; }
};

/* ---------- Özel av fırsatları ---------- */
const Opp = {
  CHANCE: 0.12, PER_SESSION: 2, CASTS: 2, MUL: 1.3,
  key() { return S.trip ? 't' + S.trip.id : 'p' + S.day; },
  sess() { const k = this.key(); const p = S.opp.per[k] || (S.opp.per[k] = { casts: 0, n: 0 }); const ks = Object.keys(S.opp.per); while (ks.length > 12) delete S.opp.per[ks.shift()]; return p; },
  active() { const a = S.opp.active; return a && a.status === 'active' ? a : null; },
  /* tür havuzu: yalnız bu noktada gerçekten bulunan türler */
  set(type, spotId) {
    const ws = Object.keys(SPOTS[spotId].weights);
    if (type === 'school') return ws.filter(f => V4.schoolFish.includes(f));
    if (type === 'bottom') return ws.filter(f => Methods.of(f).includes('bottom'));
    if (type === 'predator') return ws.filter(f => Methods.of(f).includes('spin'));
    return ws;
  },
  endIfMoved(rid) { const a = this.active(); if (a && a.rid !== rid) { a.status = 'ended'; } },
  /* tamamlanan her geçerli manuel atıştan sonra (Tx içinde) */
  roll(pc) {
    if (!pc || pc.comp || pc.mode === 'auto') return null; const rid = SPOTS[pc.spotId].region_id; this.endIfMoved(rid);
    const ss = this.sess(); ss.casts++;
    if (ss.casts < this.CASTS || ss.n >= this.PER_SESSION || this.active()) return null;
    if (hr('opp', S.stats.manualCasts) >= this.CHANCE) return null;
    const types = Object.keys(V4.oppTypes).filter(t => t === 'big' || this.set(t, pc.spotId).length);
    const type = types[Math.floor(hr('oppT', S.stats.manualCasts) * types.length)];
    const band = ['near', 'mid', 'far'][Math.floor(hr('oppB', S.stats.manualCasts) * 3)];
    S.opp.seq = (S.opp.seq || 0) + 1;
    const ev = { id: 'op' + S.opp.seq, type, day: S.day, trip: S.trip ? S.trip.id : null, rid, spot: pc.spotId, band, left: 2, status: 'active' };
    S.opp.active = ev; ss.n++; S.opp.log.push({ id: ev.id, type, day: S.day, rid }); while (S.opp.log.length > 20) S.opp.log.shift();
    return ev;
  },
  /* iniş anında (Tx içinde): hakkı tüketir, şartı sağlayan atışa etki döndürür */
  consume(pc, blocked) {
    const a = this.active(); if (!a) return null; const rid = SPOTS[pc.spotId].region_id; if (a.rid !== rid) { a.status = 'ended'; return null; }
    a.left--; if (a.left <= 0) a.status = 'used';
    let matched = false;
    if (a.type === 'school' || a.type === 'big') matched = pc.band === a.band;
    else if (a.type === 'bottom') matched = pc.method === 'bottom';
    else if (a.type === 'predator') matched = pc.method === 'spin';
    if (blocked) matched = false;
    return { id: a.id, type: a.type, matched, set: matched && a.type !== 'big' && a.type !== 'predator' ? this.set(a.type, pc.spotId) : null };
  }
};

/* ---------- Trofe avları ---------- */
const Trophy = {
  unlocked(id) { const t = TROPHY[id]; return !!(t && S.ency[t.fid] && S.ency[t.fid].caught > 0); },
  chance(id) { return Math.min(0.85, 0.08 + 0.06 * (S.trophy.miss[id] || 0)); },
  setTarget(id) { if (id && !this.unlocked(id)) return { ok: false, msg: 'Önce bu türü kendin keşfetmelisin.' }; S.trophy.target = id || null; Save.soon(); return { ok: true }; },
  eligible(pc) {
    const id = S.trophy.target; if (!id || !this.unlocked(id) || pc.comp) return null; const t = TROPHY[id]; const sp = SPOTS[pc.spotId];
    if (sp.region_id !== t.rid || !sp.weights[t.fid]) return null; if (FISH[t.fid].power > rodOf().power + 1) return null; return t;
  },
  /* iniş anında (Tx içinde) — deterministik, 4–6 atışta bir anlamlı fırsat hedefi */
  roll(pc) {
    const t = this.eligible(pc); if (!t) return null;
    if (hr('tro', S.stats.manualCasts, t.id) < this.chance(t.id)) { S.trophy.miss[t.id] = 0; S.trophy.enc = (S.trophy.enc || 0) + 1; Guild.ev('trophyEnc', {}); return t; }
    S.trophy.miss[t.id] = (S.trophy.miss[t.id] || 0) + 1; return null;
  },
  size(t) { const f = FISH[t.fid]; const k = 0.75 + hr('trs', S.stats.manualCasts) * 0.25; const [l0, l1] = f.size_game_range.length_cm, [w0, w1] = f.size_game_range.weight_kg; return { cls: k >= 0.9 ? 'exceptional' : 'large', t: k, cm: Math.round(l0 + k * (l1 - l0)), kg: round2(w0 + Math.pow(k, 3) * (w1 - w0)), trophy: t.id }; },
  /* Tx içinde: trofe yakalandı → ilk ödül bir kez */
  onCatch(id, size) {
    const t = TROPHY[id]; const b = S.trophy.best[id]; if (!b || size.kg > b.kg) S.trophy.best[id] = { cm: size.cm, kg: size.kg };
    if (S.trophy.done[id]) return false;
    S.trophy.done[id] = { day: S.day, cm: size.cm, kg: size.kg }; this.grant(t.reward); if (!S.album.some(a => a.id === id)) S.album.push({ id, day: S.day });
    return true;
  },
  grant(r) {
    if (r.kind === 'decor' && !S.home.owned.includes(r.id)) S.home.owned.push(r.id);
    if (r.kind === 'ornament') { S.cosmetics.ornaments = S.cosmetics.ornaments || []; if (!S.cosmetics.ornaments.includes(r.id)) S.cosmetics.ornaments.push(r.id); }
    if (r.kind === 'charm') { S.cosmetics.charms = S.cosmetics.charms || []; if (!S.cosmetics.charms.includes(r.id)) S.cosmetics.charms.push(r.id); if (!S.cosmetics.charm) S.cosmetics.charm = r.id; }
    if (r.kind === 'color' && !S.cosmetics.boatColors.includes(r.id)) S.cosmetics.boatColors.push(r.id);
  }
};

/* ---------- Balıkçı Birliği ---------- */
const Guild = {
  week(d) { return Math.floor(((d || S.day) - 1) / 7) + 1; },
  open() { return S.day >= 3; },
  stage() { return S.boats.owned.length >= 3 || S.day >= 45 ? 'late' : S.boats.owned.length ? 'mid' : 'early'; },
  reward(stage) { return stage === 'late' ? { cash: 69, bait: 'lure', n: 3 } : stage === 'mid' ? { cash: 28, bait: 'shrimp', n: 3 } : { cash: 12, bait: 'worm', n: 2 }; },
  value(r) { return r.cash + r.n * BAIT[r.bait].purchase_price; },
  ok(id) {
    const boat = S.boats.owned.length > 0;
    switch (id) {
      case 'A06': return SPOT_LIST.some(sp => S.world.unlocked[sp.region_id] && Object.keys(sp.weights).some(f => FISH[f].power >= 3 && FISH[f].power <= maxRodPower() + 1));
      case 'B02': return S.boats.owned.some(b => Trips.maxStops(b) > 1) && REGIONS.filter(r => r.id !== 'sakin_liman' && S.boats.owned.some(b => Boats.reach(r.id, b).ok)).length >= 2;
      case 'B05': case 'C05': case 'D06': return boat;
      case 'B06': return V4.trophies.some(t => Trophy.unlocked(t.id) && S.boats.owned.concat([null]).some(b => Boats.reach(t.rid, b).ok) && FISH[t.fid].power <= maxRodPower() + 1);
      case 'C06': return V3.projects.some(p => !Projects.done(p.id));
      case 'D01': return Object.keys(S.aq.owned).length > 0;
      case 'D02': return S.stats.manualCatches >= 1;
      case 'D04': return S.boats.owned.length >= 2;
      case 'D05': return S.gearSets.some(g => g.rod);
    }
    return true;
  },
  /* her hafta 3 görev: kayıtlı, deterministik; yeniden yükleme değiştirmez */
  ensure() {
    if (!this.open()) return null; const w = this.week();
    if (S.guild && S.guild.week === w) return S.guild;
    const prev = S.guild ? S.guild.tasks.map(t => t.id) : [];
    S.guild = { week: w, tasks: this.pick(w, prev, []), rerolled: false, prev, gen: S.day, sets: {} };
    return S.guild;
  },
  pick(w, prev, keep) {
    const out = keep.slice(); const used = new Set(out.map(t => t.id)); const stg = this.stage();
    for (const slot of [1, 2, 3]) {
      if (out.some(t => GUILDT[t.id].slot === slot)) continue;
      let pool = V4.guild.filter(g => g.slot === slot && !used.has(g.id) && this.ok(g.id));
      const fresh = pool.filter(g => !prev.includes(g.id)); if (fresh.length) pool = fresh;
      if (!pool.length) pool = V4.guild.filter(g => !used.has(g.id) && this.ok(g.id) && g.nonFish);
      const g = pool[Math.floor(hr('guild', w, slot, keep.length) * pool.length)]; used.add(g.id);
      out.push({ id: g.id, prog: 0, done: false, claimed: false, reward: this.reward(stg) });
    }
    if (!out.some(t => GUILDT[t.id].nonFish)) { const alt = V4.guild.filter(g => g.slot === 3 && g.nonFish && !used.has(g.id) && this.ok(g.id)); out[2] = { id: alt[0].id, prog: 0, done: false, claimed: false, reward: this.reward(stg) }; }
    return out.sort((a, b) => GUILDT[a.id].slot - GUILDT[b.id].slot);
  },
  reroll(id) {
    return Tx.run('guildReroll', () => {
      const G = this.ensure(); if (!G) return { ok: false }; if (G.rerolled) return { ok: false, msg: 'Bu hafta görev değiştirme hakkını kullandın.' };
      const i = G.tasks.findIndex(t => t.id === id); if (i < 0 || G.tasks[i].claimed || G.tasks[i].done) return { ok: false, msg: 'Tamamlanan görev değiştirilemez.' };
      const slot = GUILDT[id].slot; const used = new Set(G.tasks.map(t => t.id)); let pool = V4.guild.filter(g => g.slot === slot && !used.has(g.id) && this.ok(g.id) && !G.prev.includes(g.id));
      if (!pool.length) pool = V4.guild.filter(g => g.slot === slot && !used.has(g.id) && this.ok(g.id)); if (!pool.length) return { ok: false, msg: 'Uygun başka görev yok.' };
      const others = G.tasks.filter((t, k) => k !== i); let g = pool[Math.floor(hr('guildR', G.week) * pool.length)];
      if (!others.some(t => GUILDT[t.id].nonFish) && !g.nonFish) { const nf = pool.filter(x => x.nonFish); if (!nf.length) return { ok: false, msg: 'Bu görev haftanın tek balıkçılık dışı görevi; değiştirilemez.' }; g = nf[0]; }
      G.tasks[i] = { id: g.id, prog: 0, done: false, claimed: false, reward: G.tasks[i].reward }; G.rerolled = true; delete G.sets[id];
      return { ok: true, id: g.id };
    });
  },
  claim(id) {
    return Tx.run('guildClaim', () => {
      const G = this.ensure(); const t = G && G.tasks.find(x => x.id === id); if (!t || !t.done) return { ok: false, msg: 'Görev henüz tamamlanmadı.' }; if (t.claimed) return { ok: false, msg: 'Ödül zaten alındı.' };
      t.claimed = true; const r = t.reward; S.cash += r.cash; S.today.guildIncome = (S.today.guildIncome || 0) + r.cash; S.stats.guildIncome = (S.stats.guildIncome || 0) + r.cash; S.baitStock[r.bait] += r.n; S.stats.guildDone = (S.stats.guildDone || 0) + 1;
      Sound.sfx('coin'); return { ok: true, r };
    });
  },
  /* olay tabanlı ilerleme: yalnız görevin seçildiği haftada yapılan gerçek faaliyetler (çağrı Tx içinde de dışında da olabilir) */
  ev(type, d) {
    if (!S || !S.guild || S.guild.week !== this.week() || QA.noGuild) return; d = d || {}; const G = S.guild; let ch = false;
    for (const t of G.tasks) {
      if (t.done) continue; const before = t.prog; const set = k => { const s = G.sets[t.id] || (G.sets[t.id] = []); if (!s.includes(k)) s.push(k); t.prog = s.length; };
      switch (t.id) {
        case 'A01': if (type === 'catch' && d.method === 'float') t.prog++; break;
        case 'A02': if (type === 'catch' && d.method === 'bottom') t.prog++; break;
        case 'A03': if (type === 'catch' && d.method === 'spin') t.prog++; break;
        case 'A04': if (type === 'catch' && d.method) set(d.method); break;
        case 'A05': if (type === 'perfect') t.prog++; break;
        case 'A06': if (type === 'catch' && d.power >= 3) t.prog++; break;
        case 'B01': if (type === 'spots2') t.prog = Math.max(t.prog, d.n); break;
        case 'B02': if (type === 'stops2') t.prog++; break;
        case 'B03': if (type === 'catch' && d.daypart === 'morning') t.prog++; break;
        case 'B04': if (type === 'catch' && d.daypart === 'evening') t.prog++; break;
        case 'B05': if (type === 'binoc') t.prog++; break;
        case 'B06': if (type === 'trophyEnc') t.prog++; break;
        case 'C01': if (type === 'market') t.prog += d.n; break;
        case 'C02': if (type === 'order' && d.n > 0) t.prog++; break;
        case 'C03': if (type === 'tea' && d.n > 0) t.prog++; break;
        case 'C04': if (type === 'talk') set(d.npc); break;
        case 'C05': if (type === 'guestTrip') t.prog++; break;
        case 'C06': if (type === 'donate') t.prog += d.n; break;
        case 'D01': if (type === 'aq') t.prog++; break;
        case 'D02': if (type === 'shore') t.prog++; break;
        case 'D03': if (type === 'photo') t.prog++; break;
        case 'D04': if (type === 'fleet') t.prog++; break;
        case 'D05': if (type === 'catch' && G.gsReady) t.prog++; break;
        case 'D06': if (type === 'report2') t.prog++; break;
      }
      t.prog = Math.min(t.prog, GUILDT[t.id].need);
      if (t.prog !== before) ch = true;
      if (t.prog >= GUILDT[t.id].need && !t.done) { t.done = S.day; Bus.toast('Birlik görevi tamamlandı: ' + GUILDT[t.id].name, 'good', 'guild'); }
    }
    if (ch) Save.soon();
  }
};

/* ---------- Kasaba hikâyeleri ---------- */
const Stories = {
  st(npc) { return S.stories[npc] || (S.stories[npc] = { stage: 0, data: {} }); },
  /* 0 kilitli · 1..3 aktif aşama · 4 tamamlandı */
  cond(npc) { if (npc === 'efe') return S.stats.manualCatches >= 1; if (npc === 'kerem') return (S.shore.runs || 0) >= 1; return S.boats.owned.length > 0; },
  check() { for (const n of STORY_NPCS) { const s = this.st(n); if (s.stage === 0 && this.cond(n)) { s.stage = 1; s.unlocked = S.day; if (S.storyTrack.length < 2 && !S.storyTrack.includes(n)) S.storyTrack.push(n); } } this.auto(); },
  auto() {
    const k = S.stories.kerem; if (k && k.stage === 2 && Object.keys(S.shore.items).length >= 3) k.stage = 3;
  },
  goal(npc) { const s = this.st(npc); if (s.stage === 0) return 'Açılma: ' + V4.stories[npc].unlock; if (s.stage >= 4) return 'Tamamlandı'; let g = V4.stories[npc].stages[s.stage - 1].goal; if (npc === 'elif' && s.stage === 2 && s.data.spots) g += ' (' + s.data.spots.map(x => SPOTS[x].name + (s.data.seen && s.data.seen.includes(x) ? ' ✓' : '')).join(', ') + ')'; if (npc === 'bora' && s.stage === 2) g += ' (' + ((s.data.spots || []).length) + '/2)'; if (npc === 'kerem' && s.stage === 2) g += ' (' + Math.min(3, Object.keys(S.shore.items).length) + '/3)'; return g; },
  canTalk(npc) { const s = this.st(npc); return s.stage === 1 || s.stage === 3; },
  talk(npc) {
    let line = null;
    const r = Tx.run('storyTalk', () => {
      const s = this.st(npc); if (!this.canTalk(npc)) return { ok: false };
      line = V4.stories[npc].stages[s.stage - 1].talk;
      if (s.stage === 1) {
        if (npc === 'mert') { if (!S.boats.active) return { ok: false, msg: 'Aktif bir tekne gerekli.' }; if (Guests.valid() && S.guest.npc !== 'mert') return { ok: false, msg: 'Bugün zaten başka bir misafirin var.' }; S.guest = { npc: 'mert', day: S.day }; }
        if (npc === 'elif') s.data.spots = this.elifSpots();
        if (npc === 'bora') s.data.spots = [];
        s.stage = 2; s.start = S.day; this.auto();
      } else if (s.stage === 3) { s.stage = 4; s.done = S.day; this.reward(npc); }
      return { ok: true };
    });
    return r.ok ? { ok: true, line, done: this.st(npc).stage === 4 } : r;
  },
  elifSpots() {
    const regs = REGIONS.filter(r => r.id !== 'sakin_liman' && S.boats.owned.some(b => Boats.reach(r.id, b).ok)).map(r => r.id); if (!regs.length) regs.push('sakin_liman');
    const spots = []; regs.forEach(r => REGION[r].spot_ids.forEach(sp => spots.push(sp)));
    const a = spots[Math.floor(hr('elif', 1) * spots.length)]; const rest = spots.filter(x => x !== a); const b = rest[Math.floor(hr('elif', 2) * rest.length)];
    return [a, b];
  },
  /* özel inceleme noktası (Efe: Dalgakıran; Elif: iki manzara noktası) */
  inspectable(spotId) {
    const out = []; const e = S.stories.efe; if (e && e.stage === 2 && spotId === V4.stories.efe.stages[1].inspect && Game.sceneName === 'PierFishing') out.push('efe');
    const l = S.stories.elif; if (l && l.stage === 2 && l.data.spots && l.data.spots.includes(spotId) && !(l.data.seen || []).includes(spotId) && Game.sceneName === 'BoatFishing') out.push('elif');
    return out;
  },
  inspect(npc, spotId) {
    let text = null;
    const r = Tx.run('storyInspect', () => {
      const s = this.st(npc); if (!this.inspectable(spotId).includes(npc)) return { ok: false };
      if (npc === 'efe') { s.stage = 3; text = V4.stories.efe.stages[1].found; }
      if (npc === 'elif') { s.data.seen = (s.data.seen || []).concat([spotId]); text = 'Elif\'in çizdiği manzara: ' + SPOTS[spotId].name + '. Işığı ve kıyı çizgisini aklına kazıdın.'; if (s.data.spots.every(x => s.data.seen.includes(x))) s.stage = 3; }
      return { ok: true };
    });
    return r.ok ? { ok: true, text } : r;
  },
  onSpot(spotId) { const b = S.stories.bora; if (b && b.stage === 2 && Game.sceneName === 'BoatFishing') { b.data.spots = b.data.spots || []; if (!b.data.spots.includes(spotId)) b.data.spots.push(spotId); if (b.data.spots.length >= 2) b.stage = 3; } },
  onTripEnd(rep) { const m = S.stories.mert; if (m && m.stage === 2 && rep.guest === 'mert' && rep.stops.some(r => r !== 'sakin_liman')) m.stage = 3; },
  reward(npc) { const R = V4.stories[npc].reward; if (!S.album.some(a => a.id === R.album)) S.album.push({ id: R.album, day: S.day }); if (R.decor && !S.home.owned.includes(R.decor)) S.home.owned.push(R.decor); },
  track(npc) { const i = S.storyTrack.indexOf(npc); if (i >= 0) S.storyTrack.splice(i, 1); else { if (S.storyTrack.length >= 2) S.storyTrack.shift(); S.storyTrack.push(npc); } Save.soon(); }
};

/* ---------- Kıyı keşfi (veri ve kurallar; sahne 10_v4) ---------- */
const Shore = {
  unlocked() { return S.stats.manualCatches >= 1; },
  canStart() { return this.unlocked() && S.shore.day !== S.day; },
  count() { return Object.keys(S.shore.items).length; },
  session() { const s = S.shore.session; if (s && s.day !== S.day) { S.shore.session = null; return null; } return S.shore.session; },
  /* oturum kayıtlıdır: yarıda bırakılırsa aynı düzen ve aynı nesnelerle devam eder (yeniden zar atılmaz) */
  start(env) {
    if (!this.unlocked()) return { ok: false, msg: 'Kıyı Keşfi ilk başarılı avdan sonra açılır.' };
    if (S.shore.day === S.day) return { ok: false, msg: 'Bugünkü kıyı keşfini tamamladın. Yarın tekrar gel!' };
    const cur = this.session(); if (cur) return { ok: true, s: cur, resumed: true };
    if (!V4.shoreEnv[env]) return { ok: false };
    return Tx.run('shoreStart', () => {
      const r = mulberry(hash32(S.seed, 'shore', S.day, env)); const items = this.rollItems(env, r);
      const n = env === 'sand' ? 7 : env === 'rocks' ? 6 : 5; const idx = []; while (idx.length < items.length) { const k = Math.floor(r() * n); if (!idx.includes(k)) idx.push(k); }
      const clues = env === 'sand' ? ['color', 'glint', 'wave', 'stones'] : null;
      const spots = Array.from({ length: n }, (_, i) => ({ i, item: idx.includes(i) ? items[idx.indexOf(i)] : null, clue: clues ? clues[Math.floor(r() * 4)] : null, decoy: false, tapped: false }));
      const free = spots.filter(s => !s.item); if (free.length) free[Math.floor(r() * free.length)].decoy = true;
      S.shore.session = { day: S.day, env, spots, found: [], taps: 0, hints: 0, done: false };
      return { ok: true, s: S.shore.session };
    });
  },
  /* ilk keşifte yeni nesne garanti; iki tekrar sonrasında (yeni kaldıysa) yeni garanti */
  rollItems(env, r) {
    const all = V4.shore.filter(x => x.env.includes(env)); const fresh = all.filter(x => !S.shore.items[x.id]); const anyFresh = V4.shore.filter(x => !S.shore.items[x.id]);
    const mustNew = (S.shore.runs === 0 || S.shore.dup >= 2) && anyFresh.length > 0;
    let first; if (mustNew) { const pool = fresh.length ? fresh : anyFresh; first = pool[Math.floor(r() * pool.length)].id; } else first = all[Math.floor(r() * all.length)].id;
    const out = [first]; if (r() < 0.25) { const pool = all.filter(x => x.id !== first); out.push(pool[Math.floor(r() * pool.length)].id); }
    return out;
  },
  /* bir noktayı incele: yanlış seçim cezasız; doğru seçimde nesne bulunur */
  pick(i) {
    let got = null;
    const r = Tx.run('shorePick', () => {
      const s = this.session(); if (!s || s.done) return { ok: false }; const sp = s.spots[i]; if (!sp || sp.tapped) return { ok: false };
      sp.tapped = true; s.taps++; if (sp.item) { s.found.push(sp.item); got = sp.item; }
      if (s.spots.filter(x => x.item).every(x => x.tapped)) this.complete(s);
      return { ok: true };
    });
    return r.ok ? { ok: true, item: got, done: !!(S.shore.session && S.shore.session.done) } : r;
  },
  hint() { const s = this.session(); if (!s || s.done) return; s.hints++; Save.soon(); },
  /* Tx içinde: koleksiyona kaydet, günlük hak tüket */
  complete(s) {
    let anyNew = false; s.newItems = [];
    for (const id of s.found) { const e = S.shore.items[id]; if (!e) { S.shore.items[id] = { first: S.day, n: 1 }; anyNew = true; s.newItems.push(id); } else e.n++; }
    S.shore.dup = anyNew ? 0 : (S.shore.dup || 0) + 1; S.shore.runs = (S.shore.runs || 0) + 1; S.shore.day = S.day; s.done = true;
    Guild.ev('shore', {}); Stories.check();
  }
};

/* ---------- Dürbünle gözlem (sefer başına 1, 5 enerji) ---------- */
const Binoc = {
  ENERGY: 5, DUR: 40, FOCUS: 1.2,
  unlocked() { return S.boats.owned.length > 0; },
  reason() {
    if (!this.unlocked()) return 'İlk tekneyle açılır.'; if (Game.sceneName !== 'BoatFishing' || !S.trip) return 'Yalnızca tekne seferinde kullanılabilir.';
    if (S.trip.binoc) return 'Bu seferde dürbün etkinliği yapıldı.'; const sc = Game.scene; if (!sc.atSpot() || Math.abs(sc.v) > 4 || sc.arrive > 0) return 'Tekne bir av noktasında durmalı.';
    if (Fishing.phase !== 'READY') return 'Önce oltayı topla.'; if (S.energy < this.ENERGY) return 'Enerji yetmiyor (5 gerekli).'; return null;
  },
  start() {
    return Tx.run('binocStart', () => {
      const why = this.reason(); if (why) return { ok: false, msg: why };
      const rid = Game.scene.rid; const r = mulberry(hash32(S.seed, 'binoc', S.trip.id, rid)); const pool = Wildlife.pool(rid);
      const appear = r() < 0.7 * Wildlife.chanceMul(); const targets = [];
      if (appear && pool.length) { const n = r() < 0.35 ? 2 : 1; for (let i = 0; i < n; i++) { const tot = sum(pool.map(w => w.w)); let x = r() * tot, pick = pool[0]; for (const w of pool) { x -= w.w; if (x < 0) { pick = w; break; } } targets.push({ id: pick.id, x: -0.85 + r() * 1.7, t0: 3 + r() * 14 + i * 8, life: 9 + r() * 5 }); } }
      S.energy -= this.ENERGY; S.trip.binoc = { state: 'on', rid, targets, day: S.day };
      return { ok: true };
    });
  },
  /* odaklanılan canlıyı kaydet — mevcut günlük 4 gözlem sınırına dahil */
  finish(id) {
    let res = null;
    Tx.run('binocDone', () => {
      const b = S.trip && S.trip.binoc; if (!b || b.state !== 'on') return { ok: false };
      b.state = 'done'; b.found = id || null; res = { id: id || null, recorded: false, isNew: false, capped: false };
      if (id) { if (S.wild.day !== S.day) { S.wild.day = S.day; S.wild.n = 0; S.wild.keys = {}; } if (S.wild.n >= Wildlife.DAILY_MAX) res.capped = true; else { res.isNew = Wildlife.register(id, b.rid); res.recorded = true; } }
      S.stats.binoc = (S.stats.binoc || 0) + 1; Guild.ev('binoc', {});
      return { ok: true };
    });
    return res;
  }
};

/* ---------- Açılış tanıtımları: aynı gün yalnızca en önemlisi bildirilir ---------- */
const Unlocks = {
  list: [
    { key: 'efe', name: 'Kasaba Hikâyesi: Efe\'nin Eski Av Defteri', ok: () => S.stats.manualCatches >= 1, icon: 'story' },
    { key: 'shore', name: 'Kıyı Keşfi açıldı! İskele yanındaki Sahil Patikası\'na göz at.', ok: () => S.stats.manualCatches >= 1, icon: 'shore' },
    { key: 'guild', name: 'Balıkçı Birliği panosu açıldı: haftalık üç görev.', ok: () => S.day >= 3, icon: 'guild' },
    { key: 'binoc', name: 'Dürbünle Gözlem açıldı (teknede, sefer başına bir kez).', ok: () => S.boats.owned.length > 0, icon: 'binoc' },
    { key: 'boatStories', name: 'Mert, Elif ve Bora\'nın hikâyeleri açıldı.', ok: () => S.boats.owned.length > 0, icon: 'story' },
    { key: 'kerem', name: 'Kasaba Hikâyesi: Kerem\'in Deniz Koleksiyonu', ok: () => (S.shore.runs || 0) >= 1, icon: 'story' },
    { key: 'trophy', name: 'Trofe Avı: Balıkçı Defteri\'nde yeni bir trofe hedefi açıldı.', ok: () => V4.trophies.some(t => Trophy.unlocked(t.id)), icon: 'trophy_t' }
  ],
  check() {
    if (!S || !S.unlocks) return; let first = null;
    for (const u of this.list) if (!S.unlocks[u.key] && u.ok()) { S.unlocks[u.key] = S.day; if (!first) first = u; }
    if (first && S.v4.introDay !== S.day) { S.v4.introDay = S.day; Bus.toast(first.name, 'good', first.icon); }
  },
  fresh(key) { return S.unlocks[key] && S.day - S.unlocks[key] <= 1; }
};
{
  const _cc = Cosmetics.check.bind(Cosmetics);
  Cosmetics.check = function () { _cc(); if (S.stories) { Stories.check(); Unlocks.check(); } };
  const _sd = World.startDay.bind(World);
  World.startDay = function () { _sd(); if (S.guild !== undefined) Guild.ensure(); };
}

/* ---------- olay bağlantıları (mevcut sistemlere ince sarmalayıcılar) ---------- */
{
  const wrapN = (obj, fn, type, nOf) => { const f = obj[fn].bind(obj); obj[fn] = function (...a) { const r = f(...a); const n = nOf(r); if (n > 0) Guild.ev(type, { n }); return r; }; };
  wrapN(Market, 'sell', 'market', r => r && r.ok ? r.n : 0); wrapN(Market, 'sellAll', 'market', r => r && r.ok ? r.n : 0);
  wrapN(SellIn, 'market', 'market', r => r ? r.n : 0); wrapN(SellIn, 'order', 'order', r => r ? r.n : 0); wrapN(SellIn, 'tea', 'tea', r => r ? r.n : 0);
  wrapN(Orders, 'deliver', 'order', r => r && r.ok ? r.n : 0); wrapN(Tea, 'sell', 'tea', r => r && r.ok ? r.n : 0);
  wrapN(Projects, 'donate', 'donate', r => r && r.ok ? r.amt : 0); wrapN(Aq, 'put', 'aq', r => r && r.ok ? 1 : 0); wrapN(Aq, 'move', 'aq', r => r && r.ok ? 1 : 0);
  wrapN(Fleet, 'collect', 'fleet', r => r && r.ok ? 1 : 0);
  const _ga = GearSets.apply.bind(GearSets);
  GearSets.apply = function (i) { const r = _ga(i); if (r.ok && S.guild) { if (S.guild.lastSet !== i) S.guild.gsReady = true; S.guild.lastSet = i; Save.soon(); } return r; };
  const _line = NPCDialog.line.bind(NPCDialog);
  NPCDialog.line = function (npc) { const l = _line(npc); Guild.ev('talk', { npc }); return l; };
  const _add = Trips.addStop.bind(Trips);
  Trips.addStop = function (rid) { const r = _add(rid); if (r.ok) { Opp.endIfMoved(rid); Guild.ev('stops2', {}); Save.soon(); } return r; };
  const _end = Trips.end.bind(Trips);
  Trips.end = function () {
    const rep = _end(); if (!rep) return rep;
    if (rep.guest) Guild.ev('guestTrip', {}); if (rep.spots.length >= 2) { S.guild && (S.guild.rep2 = rep.id); }
    Stories.onTripEnd(rep); const a = Opp.active(); if (a && a.trip === rep.id) a.status = 'ended'; Save.soon();
    return rep;
  };
}

/* ---------- Mali Günlük: Birlik ödülleri ayrı gelir kalemi ---------- */
Finance.close = function (rep) {
  const by = rep.expBy || {}; const gearC = (by.gear || 0) + (by.boat || 0) + (by.automation || 0);
  const fw = by.fleet_wage || 0, ff = by.fleet_fuel || 0, pj = by.project || 0;
  const income = (rep.marketIncome || 0) + (rep.orderIncome || 0) + (rep.teaIncome || 0) + (rep.prizeIncome || 0) + (rep.guildIncome || 0);
  const expense = rep.expenses || 0;
  const e = { day: rep.prevDay || rep.day, manual: rep.manualCatches, auto: rep.autoCatches, fleetFish: rep.fleetFish || 0, market: rep.marketIncome || 0, orders: rep.orderIncome || 0, tea: rep.teaIncome || 0, prize: rep.prizeIncome || 0, guild: rep.guildIncome || 0,
    bait: by.bait || 0, fuel: by.fuel || 0, gear: gearC, fleetWage: fw, fleetFuel: ff, project: pj, other: expense - (by.bait || 0) - (by.fuel || 0) - gearC - fw - ff - pj, income, expense, net: rep.endCash - rep.startCash, startCash: rep.startCash, endCash: rep.endCash };
  e.consistent = e.net === income - expense;
  S.fin.push(e); while (S.fin.length > 30) S.fin.shift();
  return e;
};

/* ---------- kayıt doğrulama (şema 5 alanları) ---------- */
V4.validate = function (st) {
  const e = [];
  if (!['flow', 'classic'].includes(st.tempo)) e.push('av temposu');
  if (!st.opp || typeof st.opp.per !== 'object' || !Array.isArray(st.opp.log)) e.push('fırsatlar'); else if (st.opp.active && (!V4.oppTypes[st.opp.active.type] || !(st.opp.active.left >= 0) || st.opp.active.left > 2)) e.push('aktif fırsat');
  if (!st.trophy || typeof st.trophy.done !== 'object') e.push('trofeler'); else { if (st.trophy.target && !TROPHY[st.trophy.target]) e.push('trofe hedefi'); for (const k in st.trophy.done) if (!TROPHY[k]) e.push('trofe ' + k); }
  if (st.guild) { if (!Array.isArray(st.guild.tasks) || st.guild.tasks.length !== 3 || st.guild.tasks.some(t => !GUILDT[t.id])) e.push('birlik görevleri'); else if (new Set(st.guild.tasks.map(t => t.id)).size !== 3) e.push('tekrarlı görev'); }
  if (!st.stories || typeof st.stories !== 'object') e.push('hikâyeler'); else for (const k in st.stories) if (!V4.stories[k] || !(st.stories[k].stage >= 0 && st.stories[k].stage <= 4)) e.push('hikâye ' + k);
  if (!st.shore || typeof st.shore.items !== 'object') e.push('kıyı koleksiyonu'); else for (const k in st.shore.items) if (!SHORE[k]) e.push('kıyı nesnesi ' + k);
  if (!Array.isArray(st.album) || !Array.isArray(st.storyTrack) || st.storyTrack.length > 2) e.push('albüm/takip');
  return e;
};
