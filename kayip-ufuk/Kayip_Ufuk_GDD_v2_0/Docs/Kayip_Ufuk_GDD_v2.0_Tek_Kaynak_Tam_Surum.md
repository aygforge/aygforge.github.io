# KAYIP UFUK — GDD v2.0 | TEK KAYNAK TAM SÜRÜM TASARIMI

**Belge durumu:** Tasarım/veri üretim sözleşmesi. Oynanabilir oyun, sprite veya ses paketi değildir.
**Kaynak seçimi:** `ProductionTruth_v2.0.json` ve `ContentIndex_v2.0.json`; alt sürümler yalnızca tarihçedir.
**İçerik kilidi:** 179 eşya, 183 tarif (114 eşya + 60 yapı + 9 yükseltme), 58 yapı, 38 POI, 12 bulmaca, 15 hikâye, 20 özel plan, 25 canlı, 12 ürün, 8 ustalık, 2 kaçış.
**Sanat:** Canlı modern pixel art. 3.180 planlı sprite kaydı, 24 planlı atlas, sıfır teslim edilmiş render edilmiş PNG.
**Test durumu:** Statik veri kontrolü dışında HTML5, mobil, performans, ses ve gerçek oynanış kabul testleri yapılmamıştır.

## 0. Kesinleştirilmiş kararlar ve sürüm hiyerarşisi

1. **Yaşayan insan NPC yok.** Ada yalnız, başka insanlarla telsiz diyaloğu yok. İki bağımsız final var; devam kaydı saklanır.
2. **Yatay mobil HTML5 Canvas2D** ana platform; PC klavye/fare ikincil.
3. **Hazır dört ev modeli,** modüler duvar/çatı yok. İç mekânlar aynı dünyadadır.
4. **Hibrit sabit harita:** 9 ana ada bölgesi + 3 adacık, 38 sabit POI; ikincil ganimet seed'e bağlı.
5. **Görsel referans v1.9:** `Art/ArtDirection.json`; eski `DB/ArtSpec.json` yalnız tarihsel alanlar için kullanılabilir, çelişirse v1.9 geçerli.
6. **Tarif ve görsel kimlikleri v1.8:** `DB/RecipeDB.json` ve `DB/AssetManifest.json`; diğer `DB` dosyaları v1.7 birleşik değerlerinin birebir kopyasıdır.
7. **Asset erişimi v1.9:** `spriteId` → `Art/AtlasLayout.json` → atlas. `assets/generated/...` şablonlarından doğrudan dosya beklenmez.
8. **İlk kamp güvenliği:** 63 garanti lif, dört nadir mahsulün sabit ilk tohumu. Yükseltmeler var olan entity UID'yi korur.
9. **Gün/ekonomi:** 18 dk oyun günü; açlık −32, susuzluk −42; hava, kaynak ve depolama simülasyonu oyun saatinden ilerler.
10. **Uyku:** üretim/tarımı ilerletir, arka planda offline ilerleme yok.
11. Bu belgede tarif listeleri doğrudan `DB/RecipeDB.json` üzerinden yeniden üretildi; eski GDD'deki yükseltme sınıflandırması kullanılmaz.

---
## 1. Tam sürüm oyun tasarımı — birleşik ana metin

## 0. GDD sözleşmesi ve kesin kararlar

Kayıp Ufuk, mobilde yatay oynanan, tek oyunculu, 2D canlı modern pixel art ada survival/keşif/crafting oyunudur. Odak kaynak toplayarak yaşam kurmak, zamanla gelişmiş üretim altyapısı oluşturmak, çevresel hikâyeyi keşfetmek ve iki farklı biçimde adadan kurtulmaktır. Ana hikâye bitince aynı dünyada devam edilir. MVP’ye indirme yok; nihai prompt henüz yazılmıyor.

- **Dünya:** 256×256 karo ana ada, 9 biyom ve 3 adet 64×64 karo adacık; 512×384 deniz atlası, 32 px karo.

- **Ev inşaatı:** A modeli: hazır ev şablonları + serbest mobilya/tezgâh konumlandırma. Serbest duvar, zemin, çatı veya oda çizimi yok.

- **Hikâye:** A modeli: adada yaşayan başka insan, tüccar, görev veren NPC veya radyo üzerinden insan konuşması yok.

- **Tarif açılışı:** C hibrit; keşfedilen malzemeler, inşa edilen istasyonlar ve 20 sabit yan keşif planı.

- **Karakter ustalığı:** 8 beceri × 5 rütbe; XP eşikleri 0/80/220/450/800. Gerekli bölge veya hikâye kilidi ustalık seviyesine bağlanmaz.

- **Ekosistem:** 12 kara, 10 balık ve 3 deniz canlısı = 25 tür; papağan ve maymun dostluk varyantı.

- **Bulmacalar:** B modeli, toplam 12 bulmaca; kısa, tekrar denenebilir.

- **Kurtuluş:** Tekne ve telsiz. İki yol açık kalır; yan planlar zorunlu değildir.


## 1. Teknik hedef ve sahneler

HTML5 Canvas + JavaScript; mobil öncelikli yatay 16:9 referans, güvenli alan uyumu, fare-klavye ikincil kontrol. Tercih edilen üretim yapısı çok modüllü geliştirme kodu, dağıtımda index.html’den başlayan paket. Ana sahneler: başlat/kayıt seçimi, karakter görünüm seçimi, ana dünya, küçük ada, deniz, üç mağara, envanter/crafting, inşaat, harita, Ada Günlüğü, hayvan dostları, bulmaca paneli, iki finale ait kısa akış. Oyun arka planda ve kapalıyken zaman ilerlemez.

**Rendering:** Dünya 16×16 tile chunk’larla kameraya göre çizilir; su/çatı/nesneler katmanlı, ağacın gövdesi çarpışmalı ama tepe yaprakları gerektiğinde saydamdır. Animasyon ve dekor objelerinin sprite atlasları önceden üretilir; her karede sıfırdan pahalı vektör çizim tekrarı yapılmaz. Pixel art’da image smoothing kapalı, orijinal görsel ölçüsü korumalı.

**Karakter:** 32×48 sprite alanı, ayak odaklı ~18×14 çarpışma, dört yön. Özelleştirme: 2 vücut, 4 ten tonu, 6 saç, 5 saç rengi, 3 başlangıç kıyafeti, oyuncu adı. Görünüm katmanları vücut, saç, kıyafet, çanta, alet. 16 temel animasyon grubu: idle, yürüme, koşma, toplama, balta, kazma, mızrak, yay, olta atma/bekleme/sarma, yüzme, darbe, yeme-içme, uyku, inşa. Kare kare eşleştirme ArtSpec/AssetManifest ve implementasyon sırasında test edilmelidir.


## 2. Oynanış çekirdeği ve zaman

Temel ihtiyaçlar HP/açlık/susuzluk/dinlenme/dayanıklılık = 0–100. Bir gün 18 gerçek dakika: 11 dakika gündüz, 2 dakika alacakaranlık, 5 dakika gece. Açlık −32/gün, susuzluk −42/gün, dinlenme −35/gün. Koşu −6 stamina/sn; normal stamina yenilenmesi ~+10/sn. Örnek yiyecek: Hindistan cevizi +10 açlık/+8 susuzluk; pişmiş balık +26; pişmiş et +35; temiz su +25 susuzluk. Uyku gün zamanını ilerletir ama günlük olaylar yalnızca bir kez işlenir.

Ölümde son güvenli yatakta yeniden doğma; hikâye/özel eşyalar, beceriler ve ana inşaatlar kalıcı; bazı normal materyaller geri alınabilir düşen çantaya gider. Yeni oyuncunun ilk iki günü yüksek tehdit baskısı olmadan öğrenmesi hedeflenir.


## 3. Dünya ve arazi

| Bölge | Temel işlev | Ana kaynaklar |
|---|---|---|

| Gemi Kazası Sahili | SAFE / keşif | MAT_STONE, MAT_BRANCH, MAT_FIBER, MAT_PALM_LEAF, MAT_LOG, FOOD_COCONUT |

| Palmiye Koruluğu | SAFE / keşif | MAT_BAMBOO, MAT_LOG, MAT_RESIN, MAT_VINE, MAT_FIBER, FOOD_BANANA |

| Tatlısu Vadisi | LOW / keşif | MAT_CLAY, MAT_STONE, MAT_BAMBOO, MAT_REED, MAT_FIBER, MAT_WORM |

| Yoğun Orman | MEDIUM / keşif | MAT_HARDWOOD, MAT_LOG, MAT_RESIN, MAT_VINE, MAT_TREE_BARK, MAT_MED_HERB |

| Mangrov Bataklığı | HIGH / keşif | MAT_CLAY, MAT_REED, MAT_MED_HERB, MAT_WORM, MAT_SEAWEED, MAT_SAP |

| Kızıl Kayalıklar | MEDIUM / keşif | MAT_STONE, MAT_COAL, MAT_COPPER_ORE, MAT_FLINT, MAT_QUARTZ, MAT_CLAY |

| Kuzey Dağı ve Mağaralar | MEDIUM / keşif | MAT_IRON_ORE, MAT_COPPER_ORE, MAT_QUARTZ, MAT_COAL, MAT_STONE, MAT_SULFUR |

| Terk Edilmiş Yerleşim | LOW / keşif | MAT_BRANCH, MAT_FIBER, MAT_LOG, MAT_STONE, MAT_CLAY |

| Doğu Lagünü | LOW / keşif | MAT_SEAWEED, MAT_SEASHELL, MAT_SAND, MAT_SEA_SALT, MAT_BAMBOO, FOOD_COCONUT |

| Fener Adacığı | LOW / keşif | MAT_STONE, MAT_REED, MAT_SEASHELL, MAT_BRANCH |

| Batık Adası | LOW / keşif | MAT_SEASHELL, MAT_SAND, MAT_SEAWEED, MAT_STONE |

| Bereket Adası | SAFE / keşif | FOOD_BANANA, MAT_MED_HERB, MAT_FIBER, MAT_BAMBOO, SEED_PINEAPPLE, SEED_CANE |

Ana adanın 9 kara bölgesi yürüme yoluyla erişilebilir. Fener, Batık ve Bereket adacıkları küçük sal ile açılır. Deniz rotaları üç adet ve su karolarından geçer. 20 arazi tipi, nehir geçitleri, A* otomatik yaklaşma, yataklı dört kayıtlı kamp, hazır ev çarpışması ve kapı erişimi TerrainDB/NavigationDB/CollisionNavDB/BuildPlacementDB’ye bağlıdır. Tırmanma, köprü ve mekanik kestirmeler avantajdır; ana ada için tek zorunlu koridor değildir.

**Başlangıç:** (122,220), başlangıç enkazı (123,215). 50 sabit kaynak düğümü toplamda en az 21 taş, 30 dal, 35 yaprak, 63 lif sağlar. Bu 63 lif v1.5 düzeltmesidir ve dünya tohumundan bağımsızdır. İlk 8 temel üretim 42 lif ister; 21 lif güvenlik payı kalır.


## 4. Doğal ilerleme ve 0–20 saat hedefi

| Süre hedefi | Oyuncu döngüsü |
|---|---|
| 0–0,5 saat | Enkaz, ilk alet, ateş, yatak, barınak |
| 0,5–2 saat | Çalışma tezgâhı, su/yiyecek, sandık ve kulübe |
| 2–4 saat | Tarım, olta, kurutma rafı, dost hayvan keşfi |
| 4–7 saat | Metal, maden ve ilk mağara seferleri |
| 7–11 saat | Sal ve küçük adalar |
| 11–15 saat | Navigasyon veya haberleşme teknoloji zinciri |
| 15–20 saat | Kurtuluş projesi ve final; serbest devam |

Bu zamanlar üretim maliyeti ve varsayımsal seyahat senaryolarından gelen hedeftir; çalışan oyunun süre ölçümü değildir. V1.5 dengeli profil karşılaştırmasında tekne 16,0 saat, güneş radyo 16,4 saat ve jeneratör radyo 17,1 saat medyandır. Hedef odaklı profil daha kısa; üs/keşif odaklı profil daha uzun olabilir.


## 5. Envanter, tarif ve üretim

ItemDB’de 179 item, RecipeDB’de 183 tarif, BuildDB’de 58 yapı vardır. Tariflerin 114 tanesi eşya, 59 tanesi inşa ve 10 tanesi yükseltmedir. İlk çanta 24 slot, yükseltmeler 32 ve 40; hızlı çubuk 6 slot.

Temel istasyonlar: kamp ateşi, çalışma tezgâhı, kurutma rafı, seramik fırını, marangoz tezgâhı, dokuma tezgâhı, deri işleme rafı, metal ocağı, denizcilik masası, mekanik tezgâh. Depo/tezgâh yaklaşık 10 karo menzilinde malzeme paylaşır; projelere teslim edilmiş girdiler escrow olarak ayrılır. Öğe miktarları asla negatif, kopya veya sahipsiz kalamaz.

**Tarif örneği:** 3 lif -> ip; 1 kütük -> 3 tahta; 2 bakır cevheri + 1 kömür -> bakır külçesi; 8 kütük + 6 tahta + 6 kalın halat + 2 reçine -> küçük sal. **Suyun hayatta kalma reçetesi:** 1 kirli su + 1 dal -> 1 temiz su (kamp ateşi). **Alternatif özel filtre:** 1 kirli su -> 1 temiz su (verimli filtre; isteğe bağlı özel plan).

**Yükseltme semantiği:** R_HULL_FIT, R_STORM_ANCHOR_FIT, R_CHEST_REINFORCE, R_ADV_COOKER ve R_BED_SPECIAL mevcut yapı varlığına uygulanır; yeni yapı klonlamaz, kap/iş kuyruğunu korur. R_SEA_CHEST alternatif yeni sandık tarifidir. Haberleşmenin güneş ve jeneratör varyantları tek BUILD_SIGNAL_STATION üretir, ikisi aynı anda gerekmez.


## 6. Hazır evler, yaşam ve kamp

| Yapı | Alan (karo) | Temel özellik |
|---|---:|---|

| Bambu kulübe | 3×3 | Küçük eve girme, iç mekân, çatı gizleme |

| Balıkçı evi | 5×5 | Kıyıda ev ve iskele önü |

| Büyük ada evi | 7×6 | Geniş iç mekân ve veranda |

| Yaprak barınak | 3×2 | Yağmur koruması, basit kamp |

| Ahşap kulübe | 5×4 | Yatak ve mobilya alanı, iç mekân, çatı gizleme |

Modüler duvar/floor/roof parçaları oyundan çıkarılmıştır. Hazır evler 3×3, 5×4, 7×6, 5×5 gibi belirli boyutlarda; aşamalı yapım planı olarak yere konur. İç mobilyalar serbestçe yerleştirilir; oyuncu eve girince çatı saydamlaşır. Haritada en fazla bir ana ve üç ileri kamp kayıtlıdır. Zorunlu yollar, POI girişleri ve mağara çıkışları yapı koyularak bloke edilemez.

Kamp konforu 4 seviyedir: ilkel kamp, düzenli kamp, yerleşik ev, gelişmiş yerleşim. Rahatlık daha verimli dinlenme/yaşam kolaylığı sağlar; kritik teknoloji veya hikâye kilidi oluşturmaz.


## 7. Balık, av, tarım, tuzak, dost hayvan

10 balık: oltayla 4–12 sn yaygın bekleme, nadir av 7–20 sn; mini oyunda misina geriliminin güvenli aralığı %25–75, kolay av 4–8 sn, zor av 10–18 sn. Balon balığı yiyecek değildir. Yakalanan tür/boy kayıt altına alınır; mutfakta çiğ balık porsiyonuna dönüştürülür.

12 mahsul 2–4 oyun gününde büyür. Sulama yoksa gelişme durur ama bitki ölmez. Her olgun hasat en az bir geri tohum sağlar. Lif bitkisi 3 günde ürün verir ve büyük tekne/ev projeleri için sürdürülebilir lif sağlar. 4 ilk tohum v1.5’te sabit POI kaynaklarına bağlanmıştır: SEED_FIBER, SEED_PEPPER, SEED_PUMPKIN, SEED_SWEET_POTATO.

Kara canlıları yön/ses algısı, alarm, kaçış, savunma ve dinlenme durumlarıyla hareket eder. Kalıcı üsler yıpratılmaz, tehlikeli canlılar etkin yatağın/kamp ateşinin 12 karo yakınında doğmaz. En fazla 6 aktif tuzak; tavşan kapanı, yengeç kapanı, balık sepeti. Papağan ve maymun dostluk sistemi güven puanı 0–100; aynı anda tek takipçi, ölüm/kalıcı kayıp yok; papağan gizli yan ganimetleri işaretler, maymun var olan meyveyi getirir.


## 8. Hava, su, kaynak, dayanıklılık

| Hava | Ham üretim ağırlığı | Küçük toplayıcı | Büyük toplayıcı |
|---|---:|---:|---:|

| Açık | bkz. WeatherDB | 0 | 0 |

| Hafif yağmur | bkz. WeatherDB | 2 | 5 |

| Yağmur | bkz. WeatherDB | 4 | 10 |

| Şiddetli yağmur | bkz. WeatherDB | 6 | 16 |

| Tropik fırtına | bkz. WeatherDB | 6 | 16 |

Sadece hava ham ağırlıkları açık %38 / hafif yağmur %24 / yağmur %20 / sağanak %13 / fırtına %5 olarak tasarlanmıştır; kuraklık en fazla 3 ardışık gün. Küçük toplayıcı 6, büyük toplayıcı 16 temiz su kapasitesine, depo 30 temiz veya ham su kapasitesine sahiptir. İçme suyu ve sulama suyu ayrıdır; sulama yağmur/ham suyla olur, Tarım Lv5 su tüketimi %15 azaltır. Deniz finali için en fazla üç günde bir uygun hava penceresi sağlanır.

Doğal kaynaklar yeniden doğar: lif 2, dal 1, kütük 6, sert kütük 8, reçine 4, bambu 4, taş/kil 4, bakır 8, demir 10, kömür 8, kuvars 12 oyun gününde. **Not:** v1.5 ile eklenen özel 6 sabit başlangıç lif düğümü özel tanımında 4 gün; sıradan doğal lif düğümlerinde 2 gün korunur (düğüm-özel kural önceliklidir).

Alet dayanıklılıkları ItemDB sınırına bağlıdır; taş/bakır/demir balta örneği 30/65/120. Sıfıra düşen alet silinmez; onarılır veya yeniden üretilir.


## 9. Keşif, bulmaca ve çevresel hikâye

38 özel POI: 14 büyük, 24 yan. 20 sabit yan keşif planı, 15 Türkçe hikâye kaydı ve 12 bulmaca. Görev veren NPC ve zorunlu quest listesi yok. Ada Günlüğü, çevresel ipuçları, isteğe bağlı işaretlenmiş hedefler bulunur. Terk edilmiş araştırma yerleşiminin yaklaşık 12 yıl önceki tahliyesi fırtınayla ilişkilidir; fener bekçisinin son notları kurtuluş temasıyla bağ kurar. Bilgiler farklı sırayla bulunabilir.

**Bulmaca entegrasyonu:** PuzzleDB v1.3 alanı `startCondition` yanlış yorumlanmaya uygundu; v1.7 `startCondition` yalnızca bulmacayı açmak için gerekli koşulları taşır. `completionEffects` yalnızca bulmaca doğru çözülünce uygulanır. Fener frekans ayarı kurulu ve enerjili haberleşme istasyonu + hikâye kayıtları gerektirir, istasyonun kurulması için bu ayarı çözmek gerekmez. Hiçbir yanlış deneme kritik malzeme tüketmez.


## 10. Mağaralar

| Mağara | Karo | Özellik |
|---|---:|---|

| Kızıl Maden Galerisi | 48×40 | MAT_COPPER_ORE, MAT_COAL, MAT_STONE |

| Yarasa Mağarası | 44×48 | MAT_QUARTZ, MAT_FLINT, MAT_SULFUR |

| Yeraltı Göleti Mağarası | 48×48 | MAT_CLAY, MAT_QUARTZ, MAT_STONE |

Kızıl Maden Galerisi bakır/kömür; Yarasa Mağarası kuvars/karanlık; Yeraltı Göleti özel balık/dalış. Her mağara girişten geri çıkışı, maden/sandık durumunu ve ekin/sağlık/saat ilerlemesini kaydeder. Üç gerçek CaveGrid JSON’u pakete dahildir. Meşalesiz çıkış mümkün, yan gizli alan için ekstra ekipman gerekebilir.


## 11. İki kaçış rotası

**A) Tekne:** Ahşap, reçine, kumaş, halat ve metal işleme zinciri; 4 gövde segmenti + 1 yelken + 1 dümen + 1 navigasyon seti + 6 erzak + 8 temiz su. Navigasyon için kıyı balıkçı kulübesi/gözlem tepesi/kaptan kamarası üç sabit kaynaktan ikisi. Üç bölümlü kısa oynanabilir deniz finali. Başarısızlıkta tekne ve hikâye parçaları kaybolmaz.

**B) Telsiz:** Radyo Atölyesi’nden verici modülü, Röle Sığınağı’ndan frekans notu, Fener Adacığı’nda anten ve enerji sistemi. Güneş paneli veya jeneratörden yalnızca biri yeterli. Son frekans ayarı sistem kurulduktan sonra yapılır. Otomatik SOS yayınlanır, insanla telsiz konuşması olmaz. İki oyun günü sonra kurtarma teknesi finalde belirir. Oyuncu binerse başarı tamamlanır, önceki dünyaya devam seçeneği vardır.

v1.5 maliyet karşılaştırmasında gerekli altyapı dahil tekne 289 lif, güneş telsiz 203 lif, jeneratör telsiz 213 lif; günlük hayatta kalma tüketimleri hariçtir. Nihai sürelerin doğrulanması için gerçek oyunda test gerekir.


## 12. Mobil UI/UX

Sol sanal joystick; sağda bağlamsal Eylem, saldırı ve koşma; altta 6 slot. Envanter, crafting, inşaat, harita, Ada Günlüğü, karakter, hayvan dostları, koleksiyon ve ayarlar ayrı paneller. Uzak nesneye dokunup otomatik yaklaşma; joystick otomatik yürümeyi iptal eder. Dokunma hedefleri pratikte ≥48 CSS px. Tam ekran API desteklenirse çalışır; desteklenmiyorsa uygun ölçekli tarayıcı görünümü. Dikey telefonda döndürme yönlendirmesi.


## 13. Kayıt sistemi ve sürümleme

Üç kayıt slotu, IndexedDB sürümlü atomik snapshot ve önceki sağlam revizyon, 60 saniyede bir + önemli anlarda otomatik kayıt, manuel kayıt, JSON dışa/içe aktarma. Sekme arka plana alınırsa dünya zamanı durur. İkinci sekme için tek-yazıcı kilidi. Gerçek tarayıcı depolama kalıcılığı garanti değildir; yedekleme kullanıcıya sunulur.

Birleşik kayıt biçimi **v5**: v1.4’teki v4 şeması korunarak hava, depo centi-porsiyonları, günlük işlenmiş yağmur/crop bayrakları, düğüm yenilenmesi ve alet onarımları eklendi. v4→v5 dönüşüm tanımı pakette; gerçek tarayıcı migrasyon kodu henüz uygulanmadı. Sandık ödülleri/özel itemler idempotent, projelerin malzemeleri escrow, yelkenli ve sal konumu kayıtta sabittir. Mağara/deniz geçişleri güvenli koordinat garantisine sahiptir.


## 14. Veri ve geliştirme kabul kriterleri

**Zorunlu kabul testleri:** Tüm yeni dünya tohumlarında 9 kara bölgesine yürüyüş, 3 adacığa sal erişimi, 38 POI’nin geçerli yaklaşım karosu, 50 başlangıç sabit düğümü, 183 tarif referansı, 20 plan kaynağı, 12 çözülebilir bulmaca, su/üretim/tarım günlük idempotans, tüm unique lootun tekil teslimi, iki alternatif kaçış, kayıt-yükleme/mağara/sal/ölüm/uyku, sonrasında serbest oyun.

**Performans hedefleri:** uygun mobil cihazda 60 FPS hedef, düşük kalitede 30 FPS kabul sınırı; gerçek donanım testi ve cihaz profili ölçümü gerekir. **Sınırlar:** Bu paket statik veri ve tasarım doğrulamasıdır, oynanabilir HTML5 yürütmesi, ses dosyası, özgün sprite PNG’leri veya kanıtlanmış oyun süresi içermez.




---
## 2. Güncel ItemDB — 179 eşya (kimlik ve yığınlar)

| ID | Ad | Kategori | Stack |
|---|---|---|---:|
| `CMP_ADV_BAIT` | Gelişmiş yem | `processed_material` | 40 |
| `CMP_ANTENNA` | Haberleşme anteni | `processed_material` | 40 |
| `CMP_ARROW` | Ok | `processed_material` | 40 |
| `CMP_BATTERY_PACK` | Pil paketi | `processed_material` | 40 |
| `CMP_BEARING` | Rulman parçası | `processed_material` | 40 |
| `CMP_BRICK` | Tuğla | `processed_material` | 40 |
| `CMP_CABLE_HARNESS` | Kablo demeti | `processed_material` | 40 |
| `CMP_CHARCOAL` | Odun kömürü | `processed_material` | 40 |
| `CMP_CLOTH` | Kumaş | `processed_material` | 40 |
| `CMP_COMPOST` | Kompost | `processed_material` | 40 |
| `CMP_COPPER_INGOT` | Bakır külçesi | `processed_material` | 40 |
| `CMP_COPPER_WIRE` | Bakır tel | `processed_material` | 40 |
| `CMP_FISH_BAIT` | Balık parçası yem | `processed_material` | 40 |
| `CMP_FISH_HOOK` | Balık iğnesi | `processed_material` | 40 |
| `CMP_FUSE` | Sigorta | `processed_material` | 40 |
| `CMP_GEAR` | Dişli | `processed_material` | 40 |
| `CMP_GENERATOR` | Jeneratör | `processed_material` | 40 |
| `CMP_HULL_REINFORCED` | Güçlendirilmiş gövde kiti | `processed_material` | 40 |
| `CMP_HULL_SEGMENT` | Tekne gövde parçası | `processed_material` | 40 |
| `CMP_IRON_INGOT` | Demir külçesi | `processed_material` | 40 |
| `CMP_LEATHER` | İşlenmiş deri | `processed_material` | 40 |
| `CMP_MECH_DRIVE` | Mekanik aktarım | `processed_material` | 40 |
| `CMP_METAL_FASTENER` | Metal bağlantı | `processed_material` | 40 |
| `CMP_NAV_CHART` | Birleştirilmiş seyir haritası | `processed_material` | 40 |
| `CMP_PLANK` | Tahta | `processed_material` | 40 |
| `CMP_ROPE` | İp | `processed_material` | 40 |
| `CMP_RUDDER` | Dümen seti | `processed_material` | 40 |
| `CMP_SAIL` | Yelken | `processed_material` | 40 |
| `CMP_SIGNAL_BOOSTER` | Sinyal güçlendirici | `processed_material` | 40 |
| `CMP_SIMPLE_BAIT` | Basit yem | `processed_material` | 40 |
| `CMP_SLING_STONE` | Sapan taşı | `processed_material` | 40 |
| `CMP_STORM_ANCHOR` | Fırtına çapası | `processed_material` | 40 |
| `CMP_THICK_ROPE` | Kalın halat | `processed_material` | 40 |
| `CMP_TREATED_PLANK` | Koruyucu tahta | `processed_material` | 40 |
| `CON_ADV_BANDAGE` | Gelişmiş sargı | `consumable` | 20 |
| `CON_ANTIDOTE` | Panzehir | `consumable` | 20 |
| `CON_BANDAGE` | Basit bandaj | `consumable` | 20 |
| `CROP_BANANA` | Muz hasadı | `crop` | 20 |
| `CROP_BEAN` | Fasulye | `crop` | 20 |
| `CROP_CANE` | Şeker kamışı | `crop` | 20 |
| `CROP_FIBER` | Lif demeti | `crop` | 20 |
| `CROP_GREENS` | Yeşillik | `crop` | 20 |
| `CROP_HERB` | Şifalı bitki hasadı | `crop` | 20 |
| `CROP_PEPPER` | Tropik biber | `crop` | 20 |
| `CROP_PINEAPPLE` | Ananas | `crop` | 20 |
| `CROP_PUMPKIN` | Kabak | `crop` | 20 |
| `CROP_ROOT` | Kök sebze | `crop` | 20 |
| `CROP_SPICE` | Baharat bitkisi hasadı | `crop` | 20 |
| `CROP_SWEET_POTATO` | Tatlı patates | `crop` | 20 |
| `EQ_BAG_LARGE` | Büyük çanta | `equipment` | 1 |
| `EQ_BAG_SMALL` | Küçük çanta | `equipment` | 1 |
| `EQ_EXPLORER_BAG` | Keşif çantası | `equipment` | 1 |
| `EQ_LEAF_HAT` | Yaprak şapka | `equipment` | 1 |
| `EQ_LEATHER_BOOTS` | Dayanıklı bot | `equipment` | 1 |
| `EQ_LEATHER_HAT` | Deri şapka | `equipment` | 1 |
| `EQ_LEATHER_VEST` | Deri yelek | `equipment` | 1 |
| `EQ_RAINCOAT` | Yağmurluk | `equipment` | 1 |
| `EQ_SANDALS` | Sandalet | `equipment` | 1 |
| `FOOD_BANANA` | Muz | `foraged_food` | 20 |
| `FOOD_BEAN_STEW` | Fasulye yemeği | `food` | 20 |
| `FOOD_BERRY` | Yabani meyve | `foraged_food` | 20 |
| `FOOD_COCONUT` | Hindistan cevizi | `foraged_food` | 20 |
| `FOOD_COOKED_FISH` | Pişmiş balık | `food` | 20 |
| `FOOD_COOKED_MEAT` | Pişmiş et | `food` | 20 |
| `FOOD_DRIED_FISH` | Kurutulmuş balık | `food` | 20 |
| `FOOD_DRIED_MEAT` | Kurutulmuş et | `food` | 20 |
| `FOOD_FEAST` | Tropikal ziyafet | `food` | 20 |
| `FOOD_FISH_SOUP` | Balık çorbası | `food` | 20 |
| `FOOD_FRUIT_SALAD` | Meyve salatası | `food` | 20 |
| `FOOD_GRILLED_CRAB` | Izgara yengeç | `food` | 20 |
| `FOOD_HERBAL_TEA` | Şifalı bitki çayı | `food` | 20 |
| `FOOD_MUSHROOM` | Yenilebilir mantar | `foraged_food` | 20 |
| `FOOD_PINEAPPLE_SNACK` | Ananas tabağı | `food` | 20 |
| `FOOD_RATION` | Keşif erzak paketi | `food` | 20 |
| `FOOD_ROAST_ROOT` | Közlenmiş kök sebze | `food` | 20 |
| `FOOD_SPICED_FISH` | Baharatlı balık | `food` | 20 |
| `FOOD_VEG_STEW` | Sebze yemeği | `food` | 20 |
| `FOOD_WARM_TEA` | Isıtıcı bitki çayı | `food` | 20 |
| `MAT_BAMBOO` | Bambu | `plant_material` | 50 |
| `MAT_BONE` | Kemik | `animal_material` | 50 |
| `MAT_BRANCH` | Dal | `plant_material` | 50 |
| `MAT_CLAY` | Kil | `mineral` | 50 |
| `MAT_COAL` | Taş kömürü | `mineral` | 50 |
| `MAT_COPPER_ORE` | Bakır cevheri | `mineral` | 50 |
| `MAT_CRAB_MEAT` | Yengeç eti | `animal_material` | 50 |
| `MAT_FAT` | Hayvansal yağ | `animal_material` | 50 |
| `MAT_FEATHER` | Tüy | `animal_material` | 50 |
| `MAT_FIBER` | Bitki lifi | `plant_material` | 50 |
| `MAT_FISH_OFFCUT` | Balık artığı | `animal_material` | 50 |
| `MAT_FLINT` | Çakmak taşı | `mineral` | 50 |
| `MAT_HARDWOOD` | Sert kütük | `plant_material` | 50 |
| `MAT_IRON_ORE` | Demir cevheri | `mineral` | 50 |
| `MAT_LOG` | Kütük | `plant_material` | 50 |
| `MAT_MED_HERB` | Şifalı ot | `plant_material` | 50 |
| `MAT_ORGANIC_WASTE` | Organik atık | `plant_material` | 50 |
| `MAT_PALM_LEAF` | Palmiye yaprağı | `plant_material` | 50 |
| `MAT_PEBBLE` | Küçük taş | `mineral` | 50 |
| `MAT_QUARTZ` | Kuvars | `mineral` | 50 |
| `MAT_RAW_FISH` | Çiğ balık porsiyonu | `animal_material` | 50 |
| `MAT_RAW_HIDE` | Ham deri | `animal_material` | 50 |
| `MAT_RAW_MEAT` | Çiğ et | `animal_material` | 50 |
| `MAT_REED` | Kamış | `plant_material` | 50 |
| `MAT_RESIN` | Reçine | `plant_material` | 50 |
| `MAT_SALT` | Tuz | `mineral` | 50 |
| `MAT_SAND` | Kum | `mineral` | 50 |
| `MAT_SAP` | Bitki özsuyu | `plant_material` | 50 |
| `MAT_SEASHELL` | Deniz kabuğu | `marine_material` | 50 |
| `MAT_SEAWEED` | Deniz yosunu | `marine_material` | 50 |
| `MAT_SEA_SALT` | Deniz tuzu | `marine_material` | 50 |
| `MAT_SHELL` | Sert kabuk | `animal_material` | 50 |
| `MAT_SPICE_HERB` | Baharat otu | `plant_material` | 50 |
| `MAT_STONE` | Taş | `mineral` | 50 |
| `MAT_SULFUR` | Kükürt | `mineral` | 50 |
| `MAT_TENDON` | Tendon | `animal_material` | 50 |
| `MAT_TREE_BARK` | Ağaç kabuğu | `plant_material` | 50 |
| `MAT_VINE` | Sarmaşık | `plant_material` | 50 |
| `MAT_WORM` | Solucan | `marine_material` | 50 |
| `SAL_BATTERY` | Pil hücresi | `salvage` | 50 |
| `SAL_BEARING` | Rulman | `salvage` | 50 |
| `SAL_BOTTLE` | Boş şişe | `salvage` | 50 |
| `SAL_CANVAS` | Yelken kumaşı hurdası | `salvage` | 50 |
| `SAL_CLOTH` | Bulunmuş kumaş | `salvage` | 50 |
| `SAL_FUSE` | Sağlam sigorta | `salvage` | 50 |
| `SAL_GEAR` | Paslı dişli | `salvage` | 50 |
| `SAL_GLASS` | Cam parçası | `salvage` | 50 |
| `SAL_NAIL` | Çivi | `salvage` | 50 |
| `SAL_PLASTIC` | Plastik parça | `salvage` | 50 |
| `SAL_ROPE` | Bulunmuş halat | `salvage` | 50 |
| `SAL_SCRAP` | Hurda metal | `salvage` | 50 |
| `SAL_TIN_CAN` | Boş konserve | `salvage` | 50 |
| `SAL_WIRE` | Bakır kablo hurdası | `salvage` | 50 |
| `SEED_BANANA` | Muz fidanı | `seed` | 50 |
| `SEED_BEAN` | Fasulye tohumu | `seed` | 50 |
| `SEED_CANE` | Şeker kamışı tohumu | `seed` | 50 |
| `SEED_FIBER` | Lif bitkisi tohumu | `seed` | 50 |
| `SEED_GREENS` | Yeşillik tohumu | `seed` | 50 |
| `SEED_HERB` | Şifalı ekin tohumu | `seed` | 50 |
| `SEED_PEPPER` | Tropik biber tohumu | `seed` | 50 |
| `SEED_PINEAPPLE` | Ananas tohumu | `seed` | 50 |
| `SEED_PUMPKIN` | Kabak tohumu | `seed` | 50 |
| `SEED_ROOT` | Kök sebze tohumu | `seed` | 50 |
| `SEED_SPICE` | Baharat ekini tohumu | `seed` | 50 |
| `SEED_SWEET_POTATO` | Tatlı patates tohumu | `seed` | 50 |
| `SPC_CHART_CAPTAIN` | Kaptanın seyir kaydı | `special` | 1 |
| `SPC_CHART_COAST` | Kıyı akıntı kaydı | `special` | 1 |
| `SPC_CHART_OBSERVATORY` | Gözlem rotası kaydı | `special` | 1 |
| `SPC_GEN_CORE` | Jeneratör gövdesi | `special` | 1 |
| `SPC_RADIO_NOTE` | Haberleşme frekans kaydı | `special` | 1 |
| `SPC_SOLAR_CORE` | Güneş paneli onarım çekirdeği | `special` | 1 |
| `SPC_TX_MODULE` | Özel verici modülü | `special` | 1 |
| `TOOL_BAMBOO_CUP` | Bambu su kabı | `tool` | 1 |
| `TOOL_BOW` | İlkel yay | `tool` | 1 |
| `TOOL_CLIMB_KIT` | Tırmanma kiti | `tool` | 1 |
| `TOOL_COMPASS` | Pusula | `tool` | 1 |
| `TOOL_COPPER_AXE` | Bakır balta | `tool` | 1 |
| `TOOL_COPPER_PICK` | Bakır kazma | `tool` | 1 |
| `TOOL_CROWBAR` | Levye | `tool` | 1 |
| `TOOL_DIVING_KIT` | Sığ su dalış seti | `tool` | 1 |
| `TOOL_DIVING_MASK` | Dalış maskesi | `tool` | 1 |
| `TOOL_FISH_ROD` | Olta | `tool` | 1 |
| `TOOL_FISH_ROD_ADV` | Güçlendirilmiş olta | `tool` | 1 |
| `TOOL_HUNTER_BOW` | Gelişmiş avcı yayı | `tool` | 1 |
| `TOOL_IRON_AXE` | Demir balta | `tool` | 1 |
| `TOOL_IRON_PICK` | Demir kazma | `tool` | 1 |
| `TOOL_IRON_SPEAR` | Metal mızrak | `tool` | 1 |
| `TOOL_MACHETE` | Metal pala | `tool` | 1 |
| `TOOL_NAV_KIT` | Navigasyon seti | `tool` | 1 |
| `TOOL_PORTABLE_LAMP` | Taşınabilir deniz feneri | `tool` | 1 |
| `TOOL_REPAIR_KIT` | Onarım seti | `tool` | 1 |
| `TOOL_SHOVEL` | Kürek | `tool` | 1 |
| `TOOL_SLING` | Sapan | `tool` | 1 |
| `TOOL_STONE_AXE` | Taş balta | `tool` | 1 |
| `TOOL_STONE_KNIFE` | Taş bıçak | `tool` | 1 |
| `TOOL_STONE_PICK` | Taş kazma | `tool` | 1 |
| `TOOL_TORCH` | Meşale | `tool` | 1 |
| `TOOL_WATERING_CAN` | Sulama kabı | `tool` | 1 |
| `TOOL_WOOD_SPEAR` | Basit mızrak | `tool` | 1 |
| `WATER_CLEAN` | Temiz su porsiyonu | `water` | 20 |
| `WATER_DIRTY` | Kirli su porsiyonu | `water` | 20 |

## 3. Güncel RecipeDB — 183 tarif (v1.8 sınıflandırması)

| Tarif | Tür | Çıktı | Girdiler | İstasyon | Açılma |
|---|---|---|---|---|---|
| `R_ADV_BAIT` | `item` | `CMP_ADV_BAIT` ×3 | `CMP_FISH_BAIT` ×2, `MAT_FAT` ×1, `MAT_SPICE_HERB` ×1 | `BUILD_WORKBENCH` | `MAT:MAT_SPICE_HERB` |
| `R_ADV_BANDAGE` | `item` | `CON_ADV_BANDAGE` ×2 | `CMP_CLOTH` ×1, `MAT_MED_HERB` ×2 | `BUILD_WORKBENCH` | `MAT:CMP_CLOTH` |
| `R_ADV_COOKER` | `upgrade` | `BUILD_CAMPFIRE` ×1 | `CMP_BRICK` ×6, `CMP_IRON_INGOT` ×2 | `BUILD_WORKBENCH` | `BP:BP_ADV_COOKER` |
| `R_ANIMAL_TRAP` | `build` | `BUILD_ANIMAL_TRAP` ×1 | `MAT_BRANCH` ×5, `CMP_ROPE` ×2 | `BUILD_WORKBENCH` | `MAT:CMP_ROPE` |
| `R_ANTENNA` | `item` | `CMP_ANTENNA` ×1 | `CMP_IRON_INGOT` ×4, `CMP_CABLE_HARNESS` ×2, `CMP_METAL_FASTENER` ×3 | `BUILD_MECHANICAL_BENCH` | `STATION:BUILD_MECHANICAL_BENCH` |
| `R_ANTIDOTE` | `item` | `CON_ANTIDOTE` ×1 | `MAT_MED_HERB` ×2, `CMP_CHARCOAL` ×1, `WATER_CLEAN` ×1 | `BUILD_CAMPFIRE` | `MAT:MAT_MED_HERB` |
| `R_ARROW` | `item` | `CMP_ARROW` ×3 | `MAT_BRANCH` ×2, `MAT_FLINT` ×1, `MAT_FEATHER` ×1 | `BUILD_WORKBENCH` | `MAT:MAT_FLINT` |
| `R_ARROW_FEATHERED` | `item` | `CMP_ARROW` ×4 | `MAT_BRANCH` ×2, `MAT_FLINT` ×1, `MAT_FEATHER` ×1 | `BUILD_WORKBENCH` | `MAT:MAT_FEATHER` |
| `R_BAG_LARGE` | `item` | `EQ_BAG_LARGE` ×1 | `CMP_LEATHER` ×5, `CMP_THICK_ROPE` ×4, `CMP_METAL_FASTENER` ×2 | `BUILD_TANNING_RACK` | `MAT:CMP_LEATHER` |
| `R_BAG_SMALL` | `item` | `EQ_BAG_SMALL` ×1 | `CMP_CLOTH` ×4, `CMP_THICK_ROPE` ×2 | `BUILD_LOOM` | `STATION:BUILD_LOOM` |
| `R_BAMBOO_CUP` | `item` | `TOOL_BAMBOO_CUP` ×1 | `MAT_BAMBOO` ×2, `CMP_ROPE` ×1 | `HAND` | `MAT:MAT_BAMBOO` |
| `R_BAMBOO_HUT` | `build` | `BUILD_BAMBOO_HUT` ×1 | `MAT_BAMBOO` ×12, `MAT_PALM_LEAF` ×16, `CMP_ROPE` ×6 | `BUILD_WORKBENCH` | `MAT:MAT_BAMBOO` |
| `R_BANDAGE` | `item` | `CON_BANDAGE` ×2 | `MAT_FIBER` ×3, `MAT_MED_HERB` ×1 | `HAND` | `MAT:MAT_MED_HERB` |
| `R_BATTERY_PACK` | `item` | `CMP_BATTERY_PACK` ×1 | `SAL_BATTERY` ×2, `CMP_COPPER_WIRE` ×2 | `BUILD_MECHANICAL_BENCH` | `STATION:BUILD_MECHANICAL_BENCH` |
| `R_BEAN_STEW` | `item` | `FOOD_BEAN_STEW` ×1 | `CROP_BEAN` ×2, `CROP_ROOT` ×1, `WATER_CLEAN` ×1 | `BUILD_CAMPFIRE` | `MAT:CROP_BEAN` |
| `R_BEARING` | `item` | `CMP_BEARING` ×2 | `CMP_IRON_INGOT` ×1, `MAT_FAT` ×1 | `BUILD_MECHANICAL_BENCH` | `STATION:BUILD_MECHANICAL_BENCH` |
| `R_BEARING_SALVAGE` | `item` | `CMP_BEARING` ×1 | `SAL_BEARING` ×1, `SAL_SCRAP` ×1 | `BUILD_MECHANICAL_BENCH` | `MAT:SAL_BEARING` |
| `R_BED_SPECIAL` | `upgrade` | `BUILD_COMFORT_BED` ×1 | `CMP_CLOTH` ×5, `CMP_LEATHER` ×2 | `BUILD_WORKBENCH` | `BP:BP_BED_SPECIAL` |
| `R_BENCH` | `build` | `BUILD_BENCH` ×1 | `CMP_PLANK` ×3, `MAT_LOG` ×1 | `BUILD_WORKBENCH` | `MAT:CMP_PLANK` |
| `R_BOW` | `item` | `TOOL_BOW` ×1 | `MAT_BAMBOO` ×3, `CMP_ROPE` ×3, `MAT_RESIN` ×1 | `BUILD_WORKBENCH` | `MAT:MAT_BAMBOO` |
| `R_BRICK` | `item` | `CMP_BRICK` ×2 | `MAT_CLAY` ×2 | `BUILD_KILN` | `STATION:BUILD_KILN` |
| `R_BRIDGE` | `build` | `BUILD_BRIDGE` ×1 | `CMP_PLANK` ×9, `CMP_ROPE` ×6, `MAT_LOG` ×3 | `BUILD_WORKBENCH` | `MAT:CMP_PLANK` |
| `R_BRIDGE_ADV` | `upgrade` | `BUILD_BRIDGE` ×1 | `CMP_TREATED_PLANK` ×5, `CMP_METAL_FASTENER` ×4 | `BUILD_CARPENTER_BENCH` | `BP:BP_BRIDGE_ADV` |
| `R_CABLE_HARNESS` | `item` | `CMP_CABLE_HARNESS` ×1 | `CMP_COPPER_WIRE` ×4, `CMP_CLOTH` ×1 | `BUILD_MECHANICAL_BENCH` | `STATION:BUILD_MECHANICAL_BENCH` |
| `R_CAMPFIRE` | `build` | `BUILD_CAMPFIRE` ×1 | `MAT_STONE` ×6, `MAT_BRANCH` ×4 | `HAND` | `MAT:MAT_STONE` |
| `R_CAMP_MARKER` | `build` | `BUILD_CAMP_MARKER` ×1 | `MAT_STONE` ×3, `MAT_BRANCH` ×3 | `HAND` | `MAT:MAT_BRANCH` |
| `R_CANE_FRUIT_SALAD` | `item` | `FOOD_FRUIT_SALAD` ×1 | `CROP_CANE` ×1, `FOOD_BERRY` ×1, `FOOD_BANANA` ×1 | `BUILD_CAMPFIRE` | `MAT:CROP_CANE` |
| `R_CARPENTER_BENCH` | `build` | `BUILD_CARPENTER_BENCH` ×1 | `CMP_PLANK` ×8, `MAT_HARDWOOD` ×2, `CMP_METAL_FASTENER` ×3 | `BUILD_WORKBENCH` | `MAT:CMP_METAL_FASTENER` |
| `R_CHAIR` | `build` | `BUILD_CHAIR` ×1 | `CMP_PLANK` ×2 | `BUILD_WORKBENCH` | `MAT:CMP_PLANK` |
| `R_CHARCOAL` | `item` | `CMP_CHARCOAL` ×1 | `MAT_LOG` ×2 | `BUILD_KILN` | `STATION:BUILD_KILN` |
| `R_CHARCOAL_COAL` | `item` | `CMP_CHARCOAL` ×1 | `MAT_COAL` ×1 | `BUILD_KILN` | `MAT:MAT_COAL` |
| `R_CHEST_LARGE` | `build` | `BUILD_CHEST_LARGE` ×1 | `CMP_PLANK` ×10, `CMP_ROPE` ×4 | `BUILD_WORKBENCH` | `MAT:CMP_PLANK` |
| `R_CHEST_REINFORCE` | `upgrade` | `BUILD_CHEST_LARGE` ×1 | `CMP_IRON_INGOT` ×2, `CMP_TREATED_PLANK` ×2 | `BUILD_WORKBENCH` | `BP:BP_CHEST_REINFORCE` |
| `R_CHEST_SMALL` | `build` | `BUILD_CHEST_SMALL` ×1 | `CMP_PLANK` ×4, `CMP_ROPE` ×2 | `BUILD_WORKBENCH` | `MAT:CMP_PLANK` |
| `R_CLIMB_KIT` | `item` | `TOOL_CLIMB_KIT` ×1 | `CMP_THICK_ROPE` ×2, `CMP_METAL_FASTENER` ×2, `CMP_LEATHER` ×1 | `BUILD_WORKBENCH` | `MAT:CMP_METAL_FASTENER` |
| `R_CLOTH` | `item` | `CMP_CLOTH` ×1 | `MAT_FIBER` ×5 | `BUILD_LOOM` | `STATION:BUILD_LOOM` |
| `R_CLOTH_SALVAGE` | `item` | `CMP_CLOTH` ×1 | `SAL_CLOTH` ×2 | `HAND` | `MAT:SAL_CLOTH` |
| `R_COMFORT_BED` | `build` | `BUILD_COMFORT_BED` ×1 | `CMP_PLANK` ×8, `CMP_CLOTH` ×5, `CMP_LEATHER` ×2 | `BUILD_WORKBENCH` | `MAT:CMP_LEATHER` |
| `R_COMPASS` | `item` | `TOOL_COMPASS` ×1 | `CMP_COPPER_INGOT` ×1, `CMP_IRON_INGOT` ×1, `SAL_GLASS` ×1 | `BUILD_NAV_TABLE` | `STATION:BUILD_NAV_TABLE` |
| `R_COMPOST` | `item` | `CMP_COMPOST` ×1 | `MAT_ORGANIC_WASTE` ×4 | `BUILD_COMPOST_BIN` | `STATION:BUILD_COMPOST_BIN` |
| `R_COMPOST_BIN` | `build` | `BUILD_COMPOST_BIN` ×1 | `CMP_PLANK` ×4, `CMP_ROPE` ×2 | `BUILD_WORKBENCH` | `MAT:CMP_PLANK` |
| `R_COOKED_FISH` | `item` | `FOOD_COOKED_FISH` ×1 | `MAT_RAW_FISH` ×1, `MAT_BRANCH` ×1 | `BUILD_CAMPFIRE` | `STATION:BUILD_CAMPFIRE` |
| `R_COOKED_MEAT` | `item` | `FOOD_COOKED_MEAT` ×1 | `MAT_RAW_MEAT` ×1, `MAT_BRANCH` ×1 | `BUILD_CAMPFIRE` | `STATION:BUILD_CAMPFIRE` |
| `R_COPPER_AXE` | `item` | `TOOL_COPPER_AXE` ×1 | `CMP_COPPER_INGOT` ×2, `CMP_PLANK` ×2, `CMP_ROPE` ×2 | `BUILD_WORKBENCH` | `MAT:CMP_COPPER_INGOT` |
| `R_COPPER_INGOT` | `item` | `CMP_COPPER_INGOT` ×1 | `MAT_COPPER_ORE` ×2, `CMP_CHARCOAL` ×1 | `BUILD_SMELTER` | `STATION:BUILD_SMELTER` |
| `R_COPPER_PICK` | `item` | `TOOL_COPPER_PICK` ×1 | `CMP_COPPER_INGOT` ×3, `CMP_PLANK` ×2, `CMP_ROPE` ×2 | `BUILD_WORKBENCH` | `MAT:CMP_COPPER_INGOT` |
| `R_COPPER_WIRE` | `item` | `CMP_COPPER_WIRE` ×3 | `CMP_COPPER_INGOT` ×1 | `BUILD_SMELTER` | `STATION:BUILD_SMELTER` |
| `R_CRAB_TRAP` | `build` | `BUILD_CRAB_TRAP` ×1 | `MAT_BAMBOO` ×4, `CMP_ROPE` ×2 | `BUILD_WORKBENCH` | `MAT:MAT_BAMBOO` |
| `R_CROWBAR` | `item` | `TOOL_CROWBAR` ×1 | `CMP_IRON_INGOT` ×2 | `BUILD_WORKBENCH` | `MAT:CMP_IRON_INGOT` |
| `R_DECOR_SET` | `upgrade` | `BUILD_TABLE` ×1 | `CMP_TREATED_PLANK` ×4, `CMP_CLOTH` ×2 | `BUILD_CARPENTER_BENCH` | `BP:BP_DECOR_SET` |
| `R_DECOR_SHELL_POT` | `upgrade` | `BUILD_PLANT_POT` ×1 | `MAT_SEASHELL` ×3, `MAT_CLAY` ×1 | `BUILD_KILN` | `MAT:MAT_SEASHELL` |
| `R_DIVING_KIT` | `item` | `TOOL_DIVING_KIT` ×1 | `TOOL_DIVING_MASK` ×1, `MAT_BAMBOO` ×2, `CMP_THICK_ROPE` ×2 | `BUILD_WORKBENCH` | `MAT:TOOL_DIVING_MASK` |
| `R_DIVING_MASK` | `item` | `TOOL_DIVING_MASK` ×1 | `SAL_GLASS` ×2, `CMP_LEATHER` ×2, `CMP_ROPE` ×1 | `BUILD_WORKBENCH` | `MAT:SAL_GLASS` |
| `R_DRIED_FISH` | `item` | `FOOD_DRIED_FISH` ×1 | `MAT_RAW_FISH` ×1 | `BUILD_DRYING_RACK` | `STATION:BUILD_DRYING_RACK` |
| `R_DRIED_MEAT` | `item` | `FOOD_DRIED_MEAT` ×1 | `MAT_RAW_MEAT` ×1, `MAT_SALT` ×1 | `BUILD_DRYING_RACK` | `STATION:BUILD_DRYING_RACK` |
| `R_DRYING_RACK` | `build` | `BUILD_DRYING_RACK` ×1 | `MAT_BRANCH` ×4, `MAT_BAMBOO` ×2, `CMP_ROPE` ×3 | `BUILD_WORKBENCH` | `MAT:MAT_BAMBOO` |
| `R_ESCAPE_BOAT` | `build` | `BUILD_ESCAPE_BOAT` ×1 | `CMP_HULL_SEGMENT` ×4, `CMP_SAIL` ×1, `CMP_RUDDER` ×1, `TOOL_NAV_KIT` ×1, `FOOD_RATION` ×6, `WATER_CLEAN` ×8 | `BUILD_NAV_TABLE` | `STORY:TWO_NAV_SOURCES` |
| `R_EXPLORER_BAG` | `item` | `EQ_EXPLORER_BAG` ×1 | `CMP_CLOTH` ×5, `CMP_LEATHER` ×3, `CMP_THICK_ROPE` ×2 | `BUILD_LOOM` | `BP:BP_EXPLORER_BAG` |
| `R_EXTRACT_FIBER` | `item` | `MAT_FIBER` ×2 | `CROP_FIBER` ×1 | `HAND` | `MAT:CROP_FIBER` |
| `R_EXTRACT_MED_HERB` | `item` | `MAT_MED_HERB` ×1 | `CROP_HERB` ×1 | `HAND` | `MAT:CROP_HERB` |
| `R_EXTRACT_SPICE_HERB` | `item` | `MAT_SPICE_HERB` ×1 | `CROP_SPICE` ×1 | `HAND` | `MAT:CROP_SPICE` |
| `R_FEAST` | `item` | `FOOD_FEAST` ×1 | `FOOD_COOKED_FISH` ×1, `FOOD_COOKED_MEAT` ×1, `CROP_PUMPKIN` ×1, `CROP_SPICE` ×1 | `BUILD_CAMPFIRE` | `MAT:CROP_SPICE` |
| `R_FEED_BOWL` | `build` | `BUILD_FEED_BOWL` ×1 | `MAT_CLAY` ×2 | `BUILD_KILN` | `MAT:MAT_CLAY` |
| `R_FENCE` | `build` | `BUILD_FENCE` ×1 | `CMP_PLANK` ×2, `MAT_BRANCH` ×1 | `BUILD_WORKBENCH` | `MAT:CMP_PLANK` |
| `R_FISH_BAIT` | `item` | `CMP_FISH_BAIT` ×2 | `MAT_FISH_OFFCUT` ×1 | `HAND` | `MAT:MAT_FISH_OFFCUT` |
| `R_FISH_HOOK_BONE` | `item` | `CMP_FISH_HOOK` ×2 | `MAT_BONE` ×1 | `HAND` | `MAT:MAT_BONE` |
| `R_FISH_HOOK_SCRAP` | `item` | `CMP_FISH_HOOK` ×2 | `SAL_SCRAP` ×1 | `HAND` | `MAT:SAL_SCRAP` |
| `R_FISH_HUT` | `build` | `BUILD_FISH_HUT` ×1 | `MAT_LOG` ×10, `CMP_PLANK` ×18, `CMP_THICK_ROPE` ×6, `MAT_BAMBOO` ×7 | `BUILD_WORKBENCH` | `STATION:BUILD_WORKBENCH` |
| `R_FISH_ROD` | `item` | `TOOL_FISH_ROD` ×1 | `MAT_BAMBOO` ×2, `CMP_ROPE` ×2, `CMP_FISH_HOOK` ×1 | `BUILD_WORKBENCH` | `MAT:MAT_BAMBOO` |
| `R_FISH_ROD_ADV` | `item` | `TOOL_FISH_ROD_ADV` ×1 | `TOOL_FISH_ROD` ×1, `CMP_COPPER_INGOT` ×1, `CMP_THICK_ROPE` ×1 | `BUILD_WORKBENCH` | `BP:BP_FISH_ROD_ADV` |
| `R_FISH_SOUP` | `item` | `FOOD_FISH_SOUP` ×1 | `MAT_RAW_FISH` ×1, `WATER_CLEAN` ×1, `CROP_ROOT` ×1 | `BUILD_CAMPFIRE` | `MAT:CROP_ROOT` |
| `R_FISH_TRAP` | `build` | `BUILD_FISH_TRAP` ×1 | `MAT_BAMBOO` ×4, `CMP_ROPE` ×2 | `BUILD_WORKBENCH` | `MAT:MAT_BAMBOO` |
| `R_FISH_TRAP_ADV` | `upgrade` | `BUILD_FISH_TRAP` ×1 | `MAT_BAMBOO` ×4, `CMP_THICK_ROPE` ×2, `CMP_CLOTH` ×2 | `BUILD_WORKBENCH` | `BP:BP_FISH_TRAP_ADV` |
| `R_FOOD_CHEST` | `build` | `BUILD_FOOD_CHEST` ×1 | `CMP_PLANK` ×5, `MAT_PALM_LEAF` ×4 | `BUILD_WORKBENCH` | `MAT:CMP_PLANK` |
| `R_FRUIT_SALAD` | `item` | `FOOD_FRUIT_SALAD` ×1 | `FOOD_BANANA` ×1, `FOOD_BERRY` ×1, `FOOD_COCONUT` ×1 | `HAND` | `MAT:FOOD_BANANA` |
| `R_FUSE` | `item` | `CMP_FUSE` ×1 | `CMP_COPPER_WIRE` ×1, `SAL_GLASS` ×1 | `BUILD_MECHANICAL_BENCH` | `STATION:BUILD_MECHANICAL_BENCH` |
| `R_FUSE_SALVAGE` | `item` | `CMP_FUSE` ×1 | `SAL_FUSE` ×1 | `BUILD_MECHANICAL_BENCH` | `MAT:SAL_FUSE` |
| `R_GATE` | `build` | `BUILD_GATE` ×1 | `CMP_PLANK` ×3, `CMP_ROPE` ×1 | `BUILD_WORKBENCH` | `MAT:CMP_PLANK` |
| `R_GEAR` | `item` | `CMP_GEAR` ×2 | `CMP_IRON_INGOT` ×1 | `BUILD_SMELTER` | `STATION:BUILD_SMELTER` |
| `R_GEAR_SALVAGE` | `item` | `CMP_GEAR` ×1 | `SAL_GEAR` ×2, `SAL_SCRAP` ×1 | `BUILD_WORKBENCH` | `MAT:SAL_GEAR` |
| `R_GENERATOR` | `item` | `CMP_GENERATOR` ×1 | `CMP_IRON_INGOT` ×4, `CMP_GEAR` ×3, `CMP_MECH_DRIVE` ×1, `CMP_CABLE_HARNESS` ×2 | `BUILD_MECHANICAL_BENCH` | `STORY:GENERATOR_CORE_FOUND` |
| `R_GRILLED_CRAB` | `item` | `FOOD_GRILLED_CRAB` ×1 | `MAT_CRAB_MEAT` ×1, `MAT_BRANCH` ×1 | `BUILD_CAMPFIRE` | `MAT:MAT_CRAB_MEAT` |
| `R_HARVEST_BANANA` | `item` | `FOOD_BANANA` ×1 | `CROP_BANANA` ×1 | `HAND` | `MAT:CROP_BANANA` |
| `R_HERBAL_TEA` | `item` | `FOOD_HERBAL_TEA` ×1 | `MAT_MED_HERB` ×1, `WATER_CLEAN` ×1 | `BUILD_CAMPFIRE` | `MAT:MAT_MED_HERB` |
| `R_HULL_FIT` | `upgrade` | `BUILD_ESCAPE_BOAT` ×1 | `CMP_HULL_REINFORCED` ×1, `CMP_METAL_FASTENER` ×2 | `BUILD_CARPENTER_BENCH` | `BP:BP_HULL_REINFORCED` |
| `R_HULL_REINFORCED` | `item` | `CMP_HULL_REINFORCED` ×1 | `CMP_TREATED_PLANK` ×6, `CMP_METAL_FASTENER` ×4, `MAT_RESIN` ×3 | `BUILD_CARPENTER_BENCH` | `BP:BP_HULL_REINFORCED` |
| `R_HULL_SEGMENT` | `item` | `CMP_HULL_SEGMENT` ×1 | `CMP_TREATED_PLANK` ×4, `MAT_RESIN` ×2, `CMP_METAL_FASTENER` ×2 | `BUILD_CARPENTER_BENCH` | `STATION:BUILD_CARPENTER_BENCH` |
| `R_HUNTER_BOW` | `item` | `TOOL_HUNTER_BOW` ×1 | `MAT_HARDWOOD` ×3, `CMP_THICK_ROPE` ×2, `CMP_LEATHER` ×1 | `BUILD_WORKBENCH` | `BP:BP_HUNTER_BOW` |
| `R_IRON_AXE` | `item` | `TOOL_IRON_AXE` ×1 | `CMP_IRON_INGOT` ×2, `CMP_PLANK` ×2, `CMP_THICK_ROPE` ×2 | `BUILD_WORKBENCH` | `MAT:CMP_IRON_INGOT` |
| `R_IRON_INGOT` | `item` | `CMP_IRON_INGOT` ×1 | `MAT_IRON_ORE` ×3, `CMP_CHARCOAL` ×2 | `BUILD_SMELTER` | `STATION:BUILD_SMELTER` |
| `R_IRON_PICK` | `item` | `TOOL_IRON_PICK` ×1 | `CMP_IRON_INGOT` ×3, `CMP_PLANK` ×2, `CMP_THICK_ROPE` ×2 | `BUILD_WORKBENCH` | `MAT:CMP_IRON_INGOT` |
| `R_IRON_SPEAR` | `item` | `TOOL_IRON_SPEAR` ×1 | `CMP_IRON_INGOT` ×2, `MAT_HARDWOOD` ×2, `CMP_THICK_ROPE` ×1 | `BUILD_WORKBENCH` | `MAT:CMP_IRON_INGOT` |
| `R_IRRIGATION` | `build` | `BUILD_IRRIGATION` ×1 | `MAT_BAMBOO` ×10, `CMP_PLANK` ×6, `CMP_METAL_FASTENER` ×3 | `BUILD_CARPENTER_BENCH` | `BP:BP_IRRIGATION` |
| `R_KILN` | `build` | `BUILD_KILN` ×1 | `MAT_STONE` ×10, `MAT_CLAY` ×6, `MAT_LOG` ×4 | `BUILD_WORKBENCH` | `MAT:MAT_CLAY` |
| `R_LAMP_POST` | `build` | `BUILD_LAMP_POST` ×1 | `MAT_LOG` ×2, `CMP_IRON_INGOT` ×1, `SAL_GLASS` ×1 | `BUILD_WORKBENCH` | `MAT:CMP_IRON_INGOT` |
| `R_LARGE_HOUSE` | `build` | `BUILD_LARGE_HOUSE` ×1 | `MAT_LOG` ×18, `CMP_PLANK` ×28, `CMP_TREATED_PLANK` ×8, `CMP_THICK_ROPE` ×12, `CMP_METAL_FASTENER` ×8 | `BUILD_CARPENTER_BENCH` | `STATION:BUILD_CARPENTER_BENCH` |
| `R_LEAF_BED` | `build` | `BUILD_LEAF_BED` ×1 | `MAT_PALM_LEAF` ×8, `MAT_BRANCH` ×4, `CMP_ROPE` ×2 | `HAND` | `MAT:MAT_PALM_LEAF` |
| `R_LEAF_HAT` | `item` | `EQ_LEAF_HAT` ×1 | `MAT_PALM_LEAF` ×4, `CMP_ROPE` ×1 | `HAND` | `MAT:MAT_PALM_LEAF` |
| `R_LEAF_SHELTER` | `build` | `BUILD_LEAF_SHELTER` ×1 | `MAT_PALM_LEAF` ×12, `MAT_BRANCH` ×6, `CMP_ROPE` ×4 | `HAND` | `MAT:MAT_PALM_LEAF` |
| `R_LEATHER` | `item` | `CMP_LEATHER` ×1 | `MAT_RAW_HIDE` ×2, `MAT_SALT` ×1 | `BUILD_TANNING_RACK` | `STATION:BUILD_TANNING_RACK` |
| `R_LEATHER_BOOTS` | `item` | `EQ_LEATHER_BOOTS` ×1 | `CMP_LEATHER` ×3, `CMP_THICK_ROPE` ×1 | `BUILD_TANNING_RACK` | `MAT:CMP_LEATHER` |
| `R_LEATHER_HAT` | `item` | `EQ_LEATHER_HAT` ×1 | `CMP_LEATHER` ×2, `CMP_CLOTH` ×1 | `BUILD_TANNING_RACK` | `MAT:CMP_LEATHER` |
| `R_LEATHER_VEST` | `item` | `EQ_LEATHER_VEST` ×1 | `CMP_LEATHER` ×4, `CMP_CLOTH` ×2 | `BUILD_TANNING_RACK` | `MAT:CMP_LEATHER` |
| `R_LOG_STORE` | `build` | `BUILD_LOG_STORE` ×1 | `MAT_LOG` ×5, `CMP_THICK_ROPE` ×2 | `BUILD_WORKBENCH` | `MAT:CMP_THICK_ROPE` |
| `R_LOOM` | `build` | `BUILD_LOOM` ×1 | `MAT_BAMBOO` ×6, `CMP_PLANK` ×3, `CMP_ROPE` ×4 | `BUILD_WORKBENCH` | `MAT:MAT_BAMBOO` |
| `R_MACHETE` | `item` | `TOOL_MACHETE` ×1 | `CMP_IRON_INGOT` ×2, `CMP_PLANK` ×1, `CMP_LEATHER` ×1 | `BUILD_WORKBENCH` | `BP:BP_MACHETE` |
| `R_MAP_TABLE` | `build` | `BUILD_MAP_TABLE` ×1 | `CMP_PLANK` ×6, `SAL_GLASS` ×2, `CMP_CLOTH` ×2 | `BUILD_CARPENTER_BENCH` | `BP:BP_MAP_TABLE` |
| `R_MATERIAL_SHELF` | `build` | `BUILD_MATERIAL_SHELF` ×1 | `CMP_PLANK` ×6, `SAL_NAIL` ×3 | `BUILD_WORKBENCH` | `MAT:SAL_NAIL` |
| `R_MECHANICAL_BENCH` | `build` | `BUILD_MECHANICAL_BENCH` ×1 | `CMP_PLANK` ×10, `CMP_IRON_INGOT` ×4, `CMP_GEAR` ×2 | `BUILD_WORKBENCH` | `MAT:CMP_GEAR` |
| `R_MECH_DRIVE` | `item` | `CMP_MECH_DRIVE` ×1 | `CMP_GEAR` ×2, `CMP_BEARING` ×1, `CMP_METAL_FASTENER` ×2 | `BUILD_MECHANICAL_BENCH` | `STATION:BUILD_MECHANICAL_BENCH` |
| `R_METAL_FASTENER` | `item` | `CMP_METAL_FASTENER` ×3 | `CMP_IRON_INGOT` ×1 | `BUILD_SMELTER` | `STATION:BUILD_SMELTER` |
| `R_MONKEY_PLATFORM` | `build` | `BUILD_MONKEY_PLATFORM` ×1 | `CMP_PLANK` ×4, `MAT_BAMBOO` ×2, `CMP_ROPE` ×2 | `BUILD_WORKBENCH` | `MAT:MAT_BAMBOO` |
| `R_NAV_CHART` | `item` | `CMP_NAV_CHART` ×1 | `MAT_TREE_BARK` ×1, `CMP_CLOTH` ×1 | `BUILD_NAV_TABLE` | `STORY:TWO_NAV_SOURCES` |
| `R_NAV_KIT` | `item` | `TOOL_NAV_KIT` ×1 | `TOOL_COMPASS` ×1, `CMP_NAV_CHART` ×1, `CMP_CLOTH` ×1 | `BUILD_NAV_TABLE` | `STORY:TWO_NAV_SOURCES` |
| `R_NAV_TABLE` | `build` | `BUILD_NAV_TABLE` ×1 | `CMP_PLANK` ×6, `SAL_GLASS` ×2, `CMP_COPPER_WIRE` ×2 | `BUILD_WORKBENCH` | `MAT:CMP_COPPER_WIRE` |
| `R_ORE_STORE` | `build` | `BUILD_ORE_STORE` ×1 | `MAT_STONE` ×10, `CMP_PLANK` ×4 | `BUILD_WORKBENCH` | `MAT:CMP_PLANK` |
| `R_PANTRY` | `build` | `BUILD_PANTRY` ×1 | `CMP_PLANK` ×8, `CMP_BRICK` ×4, `CMP_METAL_FASTENER` ×2 | `BUILD_WORKBENCH` | `BP:BP_PANTRY` |
| `R_PARROT_HOUSE` | `build` | `BUILD_PARROT_HOUSE` ×1 | `CMP_PLANK` ×3, `MAT_PALM_LEAF` ×2, `CMP_ROPE` ×1 | `BUILD_WORKBENCH` | `MAT:CMP_PLANK` |
| `R_PARROT_PERCH` | `build` | `BUILD_PARROT_PERCH` ×1 | `MAT_BRANCH` ×3, `CMP_ROPE` ×2 | `BUILD_WORKBENCH` | `MAT:MAT_BRANCH` |
| `R_PATH` | `build` | `BUILD_PATH` ×1 | `MAT_STONE` ×2 | `HAND` | `MAT:MAT_STONE` |
| `R_PIER` | `build` | `BUILD_PIER` ×1 | `MAT_LOG` ×6, `CMP_PLANK` ×8, `CMP_ROPE` ×4 | `BUILD_WORKBENCH` | `MAT:CMP_PLANK` |
| `R_PINEAPPLE_SNACK` | `item` | `FOOD_PINEAPPLE_SNACK` ×1 | `CROP_PINEAPPLE` ×1, `FOOD_COCONUT` ×1 | `HAND` | `MAT:CROP_PINEAPPLE` |
| `R_PLANK` | `item` | `CMP_PLANK` ×3 | `MAT_LOG` ×1 | `BUILD_WORKBENCH` | `MAT:MAT_LOG` |
| `R_PLANTER` | `build` | `BUILD_PLANTER` ×1 | `CMP_PLANK` ×3, `CMP_ROPE` ×1 | `BUILD_WORKBENCH` | `MAT:SEED_ROOT` |
| `R_PLANT_POT` | `build` | `BUILD_PLANT_POT` ×1 | `MAT_CLAY` ×2, `MAT_MED_HERB` ×1 | `BUILD_KILN` | `MAT:MAT_CLAY` |
| `R_PLAY_POST` | `build` | `BUILD_PLAY_POST` ×1 | `MAT_LOG` ×2, `CMP_ROPE` ×2 | `BUILD_WORKBENCH` | `MAT:CMP_ROPE` |
| `R_PORTABLE_LAMP` | `item` | `TOOL_PORTABLE_LAMP` ×1 | `CMP_COPPER_WIRE` ×2, `SAL_GLASS` ×1, `CMP_BATTERY_PACK` ×1 | `BUILD_MECHANICAL_BENCH` | `BP:BP_PORTABLE_LAMP` |
| `R_RAFT` | `build` | `BUILD_RAFT` ×1 | `MAT_LOG` ×8, `CMP_PLANK` ×6, `CMP_THICK_ROPE` ×6, `MAT_RESIN` ×2 | `BUILD_WORKBENCH` | `MAT:CMP_THICK_ROPE` |
| `R_RAINCOAT` | `item` | `EQ_RAINCOAT` ×1 | `CMP_CLOTH` ×4, `CMP_LEATHER` ×2, `MAT_RESIN` ×2 | `BUILD_LOOM` | `BP:BP_RAINCOAT` |
| `R_RAIN_CATCHER` | `build` | `BUILD_RAIN_CATCHER` ×1 | `MAT_BAMBOO` ×6, `MAT_PALM_LEAF` ×8, `CMP_ROPE` ×3 | `BUILD_WORKBENCH` | `MAT:MAT_BAMBOO` |
| `R_RAIN_CATCHER_L` | `build` | `BUILD_RAIN_CATCHER_L` ×1 | `MAT_BAMBOO` ×10, `CMP_PLANK` ×5, `CMP_CLOTH` ×4, `CMP_ROPE` ×4 | `BUILD_WORKBENCH` | `MAT:CMP_CLOTH` |
| `R_RATION` | `item` | `FOOD_RATION` ×1 | `FOOD_DRIED_FISH` ×1, `FOOD_BANANA` ×1, `CMP_CLOTH` ×1 | `BUILD_WORKBENCH` | `MAT:FOOD_DRIED_FISH` |
| `R_REPAIR_KIT` | `item` | `TOOL_REPAIR_KIT` ×1 | `CMP_METAL_FASTENER` ×2, `CMP_PLANK` ×2, `CMP_ROPE` ×1 | `BUILD_WORKBENCH` | `MAT:CMP_METAL_FASTENER` |
| `R_ROAST_ROOT` | `item` | `FOOD_ROAST_ROOT` ×1 | `CROP_ROOT` ×1, `MAT_BRANCH` ×1 | `BUILD_CAMPFIRE` | `MAT:CROP_ROOT` |
| `R_ROAST_SWEET_POTATO` | `item` | `FOOD_ROAST_ROOT` ×1 | `CROP_SWEET_POTATO` ×1, `MAT_BRANCH` ×1 | `BUILD_CAMPFIRE` | `MAT:CROP_SWEET_POTATO` |
| `R_ROPE` | `item` | `CMP_ROPE` ×1 | `MAT_FIBER` ×3 | `HAND` | `MAT:MAT_FIBER` |
| `R_ROPE_TENDON` | `item` | `CMP_ROPE` ×1 | `MAT_TENDON` ×1, `MAT_FIBER` ×1 | `HAND` | `MAT:MAT_TENDON` |
| `R_ROPE_VINE` | `item` | `CMP_ROPE` ×1 | `MAT_VINE` ×2, `MAT_FIBER` ×1 | `HAND` | `MAT:MAT_VINE` |
| `R_RUDDER` | `item` | `CMP_RUDDER` ×1 | `CMP_PLANK` ×4, `CMP_METAL_FASTENER` ×2, `CMP_THICK_ROPE` ×2 | `BUILD_CARPENTER_BENCH` | `STATION:BUILD_CARPENTER_BENCH` |
| `R_RUG` | `build` | `BUILD_RUG` ×1 | `CMP_CLOTH` ×3, `MAT_FIBER` ×2 | `BUILD_LOOM` | `MAT:CMP_CLOTH` |
| `R_SAIL` | `item` | `CMP_SAIL` ×1 | `CMP_CLOTH` ×6, `CMP_THICK_ROPE` ×4 | `BUILD_LOOM` | `STATION:BUILD_LOOM` |
| `R_SAIL_SALVAGE` | `item` | `CMP_SAIL` ×1 | `SAL_CANVAS` ×3, `CMP_THICK_ROPE` ×2 | `BUILD_LOOM` | `MAT:SAL_CANVAS` |
| `R_SALT_FROM_SEA` | `item` | `MAT_SALT` ×1 | `MAT_SEA_SALT` ×2 | `BUILD_KILN` | `MAT:MAT_SEA_SALT` |
| `R_SANDALS` | `item` | `EQ_SANDALS` ×1 | `MAT_PALM_LEAF` ×3, `MAT_FIBER` ×2 | `HAND` | `MAT:MAT_PALM_LEAF` |
| `R_SEAWEED_VEG_STEW` | `item` | `FOOD_VEG_STEW` ×1 | `MAT_SEAWEED` ×1, `CROP_ROOT` ×1, `WATER_CLEAN` ×1 | `BUILD_CAMPFIRE` | `MAT:MAT_SEAWEED` |
| `R_SEA_CHEST` | `build` | `BUILD_CHEST_LARGE` ×1 | `CMP_TREATED_PLANK` ×4, `CMP_METAL_FASTENER` ×2, `CMP_THICK_ROPE` ×1 | `BUILD_WORKBENCH` | `BP:BP_SEA_CHEST` |
| `R_SHELL_CHARM` | `item` | `EQ_LEAF_HAT` ×1 | `MAT_SHELL` ×2, `MAT_FIBER` ×2 | `HAND` | `MAT:MAT_SHELL` |
| `R_SHOVEL` | `item` | `TOOL_SHOVEL` ×1 | `CMP_IRON_INGOT` ×1, `CMP_PLANK` ×2 | `BUILD_WORKBENCH` | `MAT:CMP_IRON_INGOT` |
| `R_SIGNAL_BOOSTER` | `item` | `CMP_SIGNAL_BOOSTER` ×1 | `CMP_COPPER_WIRE` ×4, `MAT_QUARTZ` ×1, `CMP_FUSE` ×2 | `BUILD_MECHANICAL_BENCH` | `STATION:BUILD_MECHANICAL_BENCH` |
| `R_SIGNAL_STATION` | `build` | `BUILD_SIGNAL_STATION` ×1 | `CMP_ANTENNA` ×1, `CMP_SIGNAL_BOOSTER` ×1, `CMP_CABLE_HARNESS` ×2, `CMP_FUSE` ×2, `SAL_BATTERY` ×2 | `BUILD_MECHANICAL_BENCH` | `STORY:RADIO_STATION_DISCOVERED` |
| `R_SIGNAL_STATION_GENERATOR` | `build` | `BUILD_SIGNAL_STATION` ×1 | `CMP_ANTENNA` ×1, `CMP_SIGNAL_BOOSTER` ×1, `CMP_CABLE_HARNESS` ×2, `CMP_FUSE` ×2, `CMP_GENERATOR` ×1 | `BUILD_MECHANICAL_BENCH` | `STORY:RADIO_STATION_DISCOVERED` |
| `R_SIMPLE_BAIT` | `item` | `CMP_SIMPLE_BAIT` ×2 | `MAT_WORM` ×1, `FOOD_BERRY` ×1 | `HAND` | `MAT:MAT_WORM` |
| `R_SLING` | `item` | `TOOL_SLING` ×1 | `MAT_BRANCH` ×2, `CMP_ROPE` ×2, `MAT_RAW_HIDE` ×1 | `HAND` | `MAT:MAT_RAW_HIDE` |
| `R_SLING_STONE` | `item` | `CMP_SLING_STONE` ×3 | `MAT_PEBBLE` ×3 | `HAND` | `MAT:MAT_PEBBLE` |
| `R_SMELTER` | `build` | `BUILD_SMELTER` ×1 | `MAT_STONE` ×10, `CMP_BRICK` ×8, `SAL_SCRAP` ×3, `CMP_PLANK` ×2 | `BUILD_WORKBENCH` | `MAT:CMP_BRICK` |
| `R_SPICED_FISH` | `item` | `FOOD_SPICED_FISH` ×1 | `MAT_RAW_FISH` ×1, `CROP_PEPPER` ×1, `CROP_SPICE` ×1 | `BUILD_CAMPFIRE` | `MAT:CROP_PEPPER` |
| `R_SPICED_MUSHROOM` | `item` | `FOOD_VEG_STEW` ×1 | `FOOD_MUSHROOM` ×2, `CROP_ROOT` ×1, `WATER_CLEAN` ×1 | `BUILD_CAMPFIRE` | `MAT:FOOD_MUSHROOM` |
| `R_STONE_AXE` | `item` | `TOOL_STONE_AXE` ×1 | `MAT_STONE` ×3, `MAT_BRANCH` ×2, `CMP_ROPE` ×1 | `HAND` | `MAT:MAT_STONE` |
| `R_STONE_KNIFE` | `item` | `TOOL_STONE_KNIFE` ×1 | `MAT_STONE` ×2, `MAT_BRANCH` ×1, `CMP_ROPE` ×1 | `HAND` | `MAT:MAT_STONE` |
| `R_STONE_PICK` | `item` | `TOOL_STONE_PICK` ×1 | `MAT_STONE` ×4, `MAT_BRANCH` ×2, `CMP_ROPE` ×2 | `HAND` | `MAT:MAT_STONE` |
| `R_STORM_ANCHOR` | `item` | `CMP_STORM_ANCHOR` ×1 | `CMP_IRON_INGOT` ×3, `CMP_THICK_ROPE` ×2 | `BUILD_MECHANICAL_BENCH` | `BP:BP_STORM_ANCHOR` |
| `R_STORM_ANCHOR_FIT` | `upgrade` | `BUILD_ESCAPE_BOAT` ×1 | `CMP_STORM_ANCHOR` ×1, `CMP_THICK_ROPE` ×2 | `BUILD_NAV_TABLE` | `BP:BP_STORM_ANCHOR` |
| `R_TABLE` | `build` | `BUILD_TABLE` ×1 | `CMP_PLANK` ×4 | `BUILD_WORKBENCH` | `MAT:CMP_PLANK` |
| `R_TANNING_RACK` | `build` | `BUILD_TANNING_RACK` ×1 | `MAT_BRANCH` ×5, `CMP_PLANK` ×3, `CMP_ROPE` ×3 | `BUILD_WORKBENCH` | `MAT:MAT_RAW_HIDE` |
| `R_THICK_ROPE` | `item` | `CMP_THICK_ROPE` ×1 | `CMP_ROPE` ×2, `MAT_RESIN` ×1 | `BUILD_WORKBENCH` | `MAT:MAT_RESIN` |
| `R_TOOL_RACK` | `build` | `BUILD_TOOL_RACK` ×1 | `CMP_PLANK` ×4, `CMP_ROPE` ×2, `CMP_METAL_FASTENER` ×1 | `BUILD_WORKBENCH` | `MAT:CMP_METAL_FASTENER` |
| `R_TORCH` | `item` | `TOOL_TORCH` ×1 | `MAT_BRANCH` ×1, `MAT_RESIN` ×1, `MAT_FIBER` ×2 | `HAND` | `MAT:MAT_RESIN` |
| `R_TORCH_SULFUR` | `item` | `TOOL_TORCH` ×1 | `MAT_BRANCH` ×1, `MAT_RESIN` ×1, `MAT_SULFUR` ×1 | `HAND` | `MAT:MAT_SULFUR` |
| `R_TREATED_PLANK` | `item` | `CMP_TREATED_PLANK` ×2 | `CMP_PLANK` ×2, `MAT_RESIN` ×1 | `BUILD_CARPENTER_BENCH` | `STATION:BUILD_CARPENTER_BENCH` |
| `R_TREATED_PLANK_SAP` | `item` | `CMP_TREATED_PLANK` ×2 | `CMP_PLANK` ×2, `MAT_SAP` ×2 | `BUILD_CARPENTER_BENCH` | `MAT:MAT_SAP` |
| `R_VEG_STEW` | `item` | `FOOD_VEG_STEW` ×1 | `CROP_GREENS` ×1, `CROP_ROOT` ×1, `WATER_CLEAN` ×1 | `BUILD_CAMPFIRE` | `MAT:CROP_GREENS` |
| `R_WARM_TEA` | `item` | `FOOD_WARM_TEA` ×1 | `MAT_SPICE_HERB` ×1, `WATER_CLEAN` ×1 | `BUILD_CAMPFIRE` | `MAT:MAT_SPICE_HERB` |
| `R_WATERING_CAN` | `item` | `TOOL_WATERING_CAN` ×1 | `MAT_BAMBOO` ×2, `MAT_REED` ×2, `CMP_ROPE` ×1 | `BUILD_WORKBENCH` | `MAT:MAT_BAMBOO` |
| `R_WATER_CLEAN` | `item` | `WATER_CLEAN` ×1 | `WATER_DIRTY` ×1, `MAT_BRANCH` ×1 | `BUILD_CAMPFIRE` | `STATION:BUILD_CAMPFIRE` |
| `R_WATER_FILTER` | `build` | `BUILD_WATER_FILTER` ×1 | `MAT_SAND` ×4, `CMP_CHARCOAL` ×2, `CMP_CLOTH` ×2, `CMP_PLANK` ×3 | `BUILD_WORKBENCH` | `BP:BP_WATER_FILTER` |
| `R_WATER_FILTER_V16` | `item` | `WATER_CLEAN` ×1 | `WATER_DIRTY` ×1 | `BUILD_WATER_FILTER` | `STATION:BUILD_WATER_FILTER` |
| `R_WATER_TANK` | `build` | `BUILD_WATER_TANK` ×1 | `CMP_PLANK` ×8, `CMP_TREATED_PLANK` ×4, `CMP_METAL_FASTENER` ×2 | `BUILD_CARPENTER_BENCH` | `MAT:CMP_TREATED_PLANK` |
| `R_WINCH` | `build` | `BUILD_WINCH` ×1 | `CMP_IRON_INGOT` ×4, `CMP_GEAR` ×2, `CMP_THICK_ROPE` ×4 | `BUILD_MECHANICAL_BENCH` | `BP:BP_WINCH` |
| `R_WIRE_SALVAGE` | `item` | `CMP_COPPER_WIRE` ×2 | `SAL_WIRE` ×2 | `BUILD_WORKBENCH` | `MAT:SAL_WIRE` |
| `R_WOOD_BED` | `build` | `BUILD_WOOD_BED` ×1 | `CMP_PLANK` ×6, `CMP_CLOTH` ×3, `MAT_FIBER` ×3 | `BUILD_WORKBENCH` | `MAT:CMP_CLOTH` |
| `R_WOOD_HUT` | `build` | `BUILD_WOOD_HUT` ×1 | `MAT_LOG` ×10, `CMP_PLANK` ×15, `CMP_THICK_ROPE` ×5, `MAT_PALM_LEAF` ×12 | `BUILD_WORKBENCH` | `STATION:BUILD_WORKBENCH` |
| `R_WOOD_SPEAR` | `item` | `TOOL_WOOD_SPEAR` ×1 | `MAT_BRANCH` ×2, `MAT_STONE` ×1, `CMP_ROPE` ×1 | `HAND` | `MAT:MAT_BRANCH` |
| `R_WORKBENCH` | `build` | `BUILD_WORKBENCH` ×1 | `MAT_LOG` ×4, `MAT_BRANCH` ×4, `CMP_ROPE` ×4 | `HAND` | `MAT:MAT_LOG` |

**Yükseltme yürütme standardı:** `UPGRADE_EXISTING` davranışı hedef nesnenin `uid` ve saklanan envanterini korur. Gerekli kaynaklar tek transaction içinde tüketilir; hedef yoksa işlem engellenir. `R_SEA_CHEST` yeni yapı üretir, yükseltme değildir.

## 4. Güncel BuildDB — 58 yapı

| ID | Ad | Kategori | Alan | Tarif |
|---|---|---|---|---|
| `BUILD_ANIMAL_TRAP` | Küçük hayvan kapanı | `trap` | [1, 1] | `R_ANIMAL_TRAP` |
| `BUILD_BAMBOO_HUT` | Bambu kulübe | `house` | [3, 3] | `R_BAMBOO_HUT` |
| `BUILD_BENCH` | Bank | `decor` | [2, 1] | `R_BENCH` |
| `BUILD_BRIDGE` | Ahşap köprü | `outdoor` | [3, 2] | `R_BRIDGE` |
| `BUILD_CAMPFIRE` | Kamp ateşi | `station` | [2, 2] | `R_CAMPFIRE` |
| `BUILD_CAMP_MARKER` | Kamp işareti | `camp` | [1, 1] | `R_CAMP_MARKER` |
| `BUILD_CARPENTER_BENCH` | Marangoz tezgâhı | `station` | [3, 2] | `R_CARPENTER_BENCH` |
| `BUILD_CHAIR` | Sandalye | `decor` | [1, 1] | `R_CHAIR` |
| `BUILD_CHEST_LARGE` | Büyük sandık | `storage` | [2, 1] | `R_CHEST_LARGE` |
| `BUILD_CHEST_SMALL` | Küçük sandık | `storage` | [1, 1] | `R_CHEST_SMALL` |
| `BUILD_COMFORT_BED` | Konforlu yatak | `sleep` | [2, 2] | `R_COMFORT_BED` |
| `BUILD_COMPOST_BIN` | Kompost kutusu | `farm` | [2, 2] | `R_COMPOST_BIN` |
| `BUILD_CRAB_TRAP` | Yengeç kapanı | `trap` | [1, 1] | `R_CRAB_TRAP` |
| `BUILD_DRYING_RACK` | Kurutma rafı | `station` | [2, 1] | `R_DRYING_RACK` |
| `BUILD_ESCAPE_BOAT` | Kaçış yelkenlisi | `escape` | [7, 3] | `R_ESCAPE_BOAT` |
| `BUILD_FEED_BOWL` | Besleme kabı | `pet` | [1, 1] | `R_FEED_BOWL` |
| `BUILD_FENCE` | Ahşap çit | `outdoor` | [1, 1] | `R_FENCE` |
| `BUILD_FISH_HUT` | Balıkçı evi | `house` | [5, 5] | `R_FISH_HUT` |
| `BUILD_FISH_TRAP` | Balık sepeti | `trap` | [1, 1] | `R_FISH_TRAP` |
| `BUILD_FOOD_CHEST` | Yiyecek sandığı | `storage` | [1, 1] | `R_FOOD_CHEST` |
| `BUILD_GATE` | Ahşap bahçe kapısı | `outdoor` | [1, 1] | `R_GATE` |
| `BUILD_IRRIGATION` | Gelişmiş sulama ünitesi | `farm` | [2, 2] | `R_IRRIGATION` |
| `BUILD_KILN` | Seramik fırını | `station` | [2, 2] | `R_KILN` |
| `BUILD_LAMP_POST` | Fener direği | `decor` | [1, 1] | `R_LAMP_POST` |
| `BUILD_LARGE_HOUSE` | Büyük ada evi | `house` | [7, 6] | `R_LARGE_HOUSE` |
| `BUILD_LEAF_BED` | Yaprak yatak | `sleep` | [2, 1] | `R_LEAF_BED` |
| `BUILD_LEAF_SHELTER` | Yaprak barınak | `shelter` | [3, 2] | `R_LEAF_SHELTER` |
| `BUILD_LOG_STORE` | Odun deposu | `storage` | [2, 2] | `R_LOG_STORE` |
| `BUILD_LOOM` | Dokuma tezgâhı | `station` | [2, 2] | `R_LOOM` |
| `BUILD_MAP_TABLE` | Harita masası | `decor` | [2, 2] | `R_MAP_TABLE` |
| `BUILD_MATERIAL_SHELF` | Malzeme rafı | `storage` | [2, 1] | `R_MATERIAL_SHELF` |
| `BUILD_MECHANICAL_BENCH` | Mekanik tezgâh | `station` | [3, 2] | `R_MECHANICAL_BENCH` |
| `BUILD_MONKEY_PLATFORM` | Maymun platformu | `pet` | [2, 2] | `R_MONKEY_PLATFORM` |
| `BUILD_NAV_TABLE` | Denizcilik masası | `station` | [2, 2] | `R_NAV_TABLE` |
| `BUILD_ORE_STORE` | Taş ve cevher deposu | `storage` | [2, 2] | `R_ORE_STORE` |
| `BUILD_PANTRY` | Gelişmiş kiler | `storage` | [2, 2] | `R_PANTRY` |
| `BUILD_PARROT_HOUSE` | Papağan evi | `pet` | [2, 1] | `R_PARROT_HOUSE` |
| `BUILD_PARROT_PERCH` | Papağan tüneği | `pet` | [1, 1] | `R_PARROT_PERCH` |
| `BUILD_PATH` | Taş patika | `outdoor` | [1, 1] | `R_PATH` |
| `BUILD_PIER` | Ahşap iskele | `outdoor` | [4, 2] | `R_PIER` |
| `BUILD_PLANTER` | Ekim yatağı | `farm` | [1, 1] | `R_PLANTER` |
| `BUILD_PLANT_POT` | Saksı | `decor` | [1, 1] | `R_PLANT_POT` |
| `BUILD_PLAY_POST` | Oyun direği | `pet` | [1, 1] | `R_PLAY_POST` |
| `BUILD_RAFT` | Küçük sal | `vehicle` | [3, 2] | `R_RAFT` |
| `BUILD_RAIN_CATCHER` | Yağmur toplayıcı | `water` | [2, 2] | `R_RAIN_CATCHER` |
| `BUILD_RAIN_CATCHER_L` | Büyük yağmur toplayıcı | `water` | [3, 2] | `R_RAIN_CATCHER_L` |
| `BUILD_RUG` | Hasır halı | `decor` | [2, 2] | `R_RUG` |
| `BUILD_SIGNAL_STATION` | Haberleşme onarımı | `escape` | [4, 4] | `R_SIGNAL_STATION` |
| `BUILD_SMELTER` | Metal eritme ocağı | `station` | [2, 2] | `R_SMELTER` |
| `BUILD_TABLE` | Ahşap masa | `decor` | [2, 1] | `R_TABLE` |
| `BUILD_TANNING_RACK` | Deri işleme rafı | `station` | [2, 2] | `R_TANNING_RACK` |
| `BUILD_TOOL_RACK` | Ekipman askılığı | `storage` | [2, 1] | `R_TOOL_RACK` |
| `BUILD_WATER_FILTER` | Verimli su filtresi | `water` | [2, 2] | `R_WATER_FILTER` |
| `BUILD_WATER_TANK` | Su deposu | `water` | [2, 2] | `R_WATER_TANK` |
| `BUILD_WINCH` | Tırmanma vinci | `outdoor` | [2, 2] | `R_WINCH` |
| `BUILD_WOOD_BED` | Ahşap yatak | `sleep` | [2, 1] | `R_WOOD_BED` |
| `BUILD_WOOD_HUT` | Ahşap kulübe | `house` | [5, 4] | `R_WOOD_HUT` |
| `BUILD_WORKBENCH` | Çalışma tezgâhı | `station` | [2, 2] | `R_WORKBENCH` |

## 5. POIDB — 38 sabit keşif

| ID | Ad | Bölge | Tür | Yerel karo | Sabit ödül / plan | Bulmaca |
|---|---|---|---|---|---|---|
| `POI_CRASH_BOAT` | Parçalanmış Tekne | `REG_BEACH` | `MAJOR` | [123, 215] | MAT_BRANCH×6,MAT_STONE×5,MAT_FIBER×6,FOOD_COCONUT×2 | `—` |
| `POI_WATERPROOF_BAG` | Su Geçirmez Seyir Çantası | `REG_BEACH` | `MAJOR` | [133, 209] | CMP_ROPE×2,TOOL_BAMBOO_CUP×1 | `—` |
| `POI_SHORE_CRATE` | Kıyı Sandığı | `REG_BEACH` | `SIDE` | [109, 222] | — | `—` |
| `POI_BROKEN_LOOKOUT` | Kırık Gözetleme Noktası | `REG_BEACH` | `SIDE` | [155, 206] | BP_MAP_TABLE | `—` |
| `POI_FISHER_HUT` | Eski Balıkçı Kulübesi | `REG_GROVE` | `MAJOR` | [164, 187] | SPC_CHART_COAST | `—` |
| `POI_FRUIT_HILL` | Meyve Tepesi | `REG_GROVE` | `SIDE` | [165, 168] | SEED_FIBER×6 | `—` |
| `POI_VINE_TUNNEL` | Sarmaşık Tüneli | `REG_GROVE` | `SIDE` | [145, 160] | — | `—` |
| `POI_WATER_STATION` | Terk Edilmiş Su İstasyonu | `REG_VALLEY` | `MAJOR` | [105, 150] | MAT_CLAY×5,MAT_BAMBOO×3 | `PZ_WATER_VALVES` |
| `POI_STONE_BRIDGE` | Eski Taş Köprü | `REG_VALLEY` | `SIDE` | [117, 140] | BP_BRIDGE_ADV | `—` |
| `POI_WATERFALL_CAVE` | Şelale Arkası | `REG_VALLEY` | `SIDE` | [121, 117] | BP_WATER_FILTER | `PZ_WATERFALL_WHEEL` |
| `POI_FORESTER_HUT` | Ormancı Kulübesi | `REG_FOREST` | `MAJOR` | [137, 113] | MAT_LOG×4,CMP_PLANK×6 | `—` |
| `POI_TREEHOUSE` | Yüksek Ağaç Evi | `REG_FOREST` | `SIDE` | [160, 102] | BP_EXPLORER_BAG | `—` |
| `POI_HUNTER_CAMP` | Eski Avcı Kampı | `REG_FOREST` | `SIDE` | [110, 102] | BP_HUNTER_BOW | `—` |
| `POI_SWAMP_MEASURE` | Araştırma Ölçüm Barakası | `REG_SWAMP` | `MAJOR` | [59, 150] | MAT_MED_HERB×3,MAT_CLAY×4 | `—` |
| `POI_FLOODED_STORE` | Su Basan Depo | `REG_SWAMP` | `SIDE` | [50, 171] | BP_CHEST_REINFORCE | `PZ_FLOODED_LOCK` |
| `POI_MANGROVE_COVE` | Mangrov Koyu | `REG_SWAMP` | `SIDE` | [46, 186] | BP_FISH_TRAP_ADV | `—` |
| `POI_COPPER_MINE` | Eski Bakır Ocağı | `REG_RED_CLIFF` | `MAJOR` | [80, 86] | MAT_COPPER_ORE×8,MAT_COAL×5,SAL_SCRAP×4 | `—` |
| `POI_CABLE_CAR` | Kırık Teleferik | `REG_RED_CLIFF` | `SIDE` | [99, 70] | BP_WINCH | `PZ_CABLE_GEARS` |
| `POI_MINE_SHELTER` | Maden Sığınağı | `REG_RED_CLIFF` | `SIDE` | [62, 105] | BP_MACHETE | `—` |
| `POI_OBSERVATORY` | Gözlem Tepesi | `REG_MOUNTAIN` | `MAJOR` | [149, 50] | SPC_CHART_OBSERVATORY | `PZ_OBSERVATION_ALIGN` |
| `POI_RELAY_SHELTER` | Dağ Röle Sığınağı | `REG_MOUNTAIN` | `MAJOR` | [181, 75] | SPC_RADIO_NOTE | `PZ_RELAY_POWER` |
| `POI_BAT_CAVERN` | Yarasa Galerisi | `REG_MOUNTAIN` | `SIDE` | [130, 77] | BP_PORTABLE_LAMP | `—` |
| `POI_UNDERGROUND_POND` | Yeraltı Göleti | `REG_MOUNTAIN` | `SIDE` | [169, 91] | — | `—` |
| `POI_RESEARCH_SQUARE` | Araştırma Meydanı | `REG_SETTLEMENT` | `MAJOR` | [199, 112] | SPC_GEN_CORE | `—` |
| `POI_RADIO_WORKSHOP` | Radyo Atölyesi | `REG_SETTLEMENT` | `MAJOR` | [219, 130] | SPC_TX_MODULE | `PZ_RADIO_REPAIR` |
| `POI_OLD_KITCHEN` | Eski Mutfak | `REG_SETTLEMENT` | `SIDE` | [194, 135] | BP_ADV_COOKER | `—` |
| `POI_LOCKED_WAREHOUSE` | Kilitli Ambar | `REG_SETTLEMENT` | `SIDE` | [219, 107] | BP_PANTRY | `PZ_WAREHOUSE_PIN` |
| `POI_SHALLOW_WRECK` | Sığ Su Batığı | `REG_LAGOON` | `MAJOR` | [204, 195] | SAL_SCRAP×2,SAL_GLASS×2 | `—` |
| `POI_REEF_FISSURE` | Resif Yarığı | `REG_LAGOON` | `SIDE` | [228, 180] | BP_FISH_ROD_ADV | `—` |
| `POI_SAND_SPIT` | Kum Dili | `REG_LAGOON` | `SIDE` | [229, 211] | BP_STORM_ANCHOR | `PZ_SAND_SPIT_MARKERS` |
| `POI_LIGHTHOUSE` | Fener İstasyonu | `REG_LIGHTHOUSE` | `MAJOR` | [29, 27] | SPC_SOLAR_CORE | `PZ_LIGHTHOUSE_TUNE` |
| `POI_LIGHTHOUSE_KEEPER` | Fener Bekçisinin Kulübesi | `REG_LIGHTHOUSE` | `SIDE` | [39, 38] | BP_RAINCOAT | `—` |
| `POI_CAPTAIN_CABIN` | Kaptan Kamarası | `REG_WRECK` | `MAJOR` | [20, 34] | SPC_CHART_CAPTAIN | `—` |
| `POI_ENGINE_ROOM` | Makine Bölmesi | `REG_WRECK` | `SIDE` | [29, 42] | BP_HULL_REINFORCED | `PZ_ENGINE_VALVES` |
| `POI_CORAL_CHEST` | Mercan Sandığı | `REG_WRECK` | `SIDE` | [41, 29] | BP_SEA_CHEST | `—` |
| `POI_ABANDONED_GARDEN` | Terk Edilmiş Bahçe | `REG_FERTILE` | `SIDE` | [27, 35] | BP_IRRIGATION | `PZ_GARDEN_CHANNEL` |
| `POI_HERB_GREENHOUSE` | Şifalı Bitki Serası | `REG_FERTILE` | `SIDE` | [43, 29] | BP_DECOR_SET | `—` |
| `POI_ROCK_SHELTER` | Kaya Sığınağı | `REG_FERTILE` | `SIDE` | [18, 21] | BP_BED_SPECIAL | `—` |

## 6. PuzzleDB — 12 bulmaca

| ID | Konum | UI | İpucu metni | Bitiş bayrağı |
|---|---|---|---|---|
| `PZ_WATER_VALVES` | `POI_WATER_STATION` | `THREE_TOGGLE` | Birinci ve üçüncü hat açık, tahliye hattı kapalı. | `WATER_STATION_FIXED` |
| `PZ_WATERFALL_WHEEL` | `POI_WATERFALL_CAVE` | `TWO_ROTATORS` | Oyulmuş iki ok suyun kaynağına ve çıkışına bakmalı. | `WATERFALL_PASSAGE_OPEN` |
| `PZ_FLOODED_LOCK` | `POI_FLOODED_STORE` | `THREE_PINS` | Kapağın üstündeki çizikler: kısa, uzun, orta. | `FLOODED_STORE_OPEN` |
| `PZ_CABLE_GEARS` | `POI_CABLE_CAR` | `THREE_ROTATORS` | Dişli şeması: ilk sola, orta sağa, son sola dönmeli. | `CABLE_CAR_REPAIRED` |
| `PZ_OBSERVATION_ALIGN` | `POI_OBSERVATORY` | `THREE_ROTATORS` | Sıra: kuzey fener, doğu kaya, güneydoğu ada. | `OBSERVATORY_CHART_FOUND` |
| `PZ_RELAY_POWER` | `POI_RELAY_SHELTER` | `FOUR_CONNECTORS` | Sol giriş → güvenlik → ana çıkış; terminal dört test hattı. | `RELAY_REPAIRED` |
| `PZ_RADIO_REPAIR` | `POI_RADIO_WORKSHOP` | `THREE_STEP_SEQUENCE` | Önce mandal, sonra kablo halkası, ardından test kolu. | `RADIO_MODULE_RETRIEVED` |
| `PZ_WAREHOUSE_PIN` | `POI_LOCKED_WAREHOUSE` | `THREE_PINS` | Kilitte soldan sağa 2, 1 ve 3 çizik var. | `WAREHOUSE_OPEN` |
| `PZ_SAND_SPIT_MARKERS` | `POI_SAND_SPIT` | `THREE_SEQUENCE` | Yengeç kabuğu, dalga, pusula oku sırası izlenmeli. | `SAND_SPIT_CHEST_FOUND` |
| `PZ_LIGHTHOUSE_TUNE` | `POI_LIGHTHOUSE` | `THREE_DIALS` | Frekans kartının işaretleri: 2, 4, 1. Verici ve enerji kurulmadan ayarlama yapılamaz. | `SIGNAL_TUNED` |
| `PZ_ENGINE_VALVES` | `POI_ENGINE_ROOM` | `THREE_TOGGLE` | Sol ve orta vana açık, sağ kapalı. | `ENGINE_ROOM_OPEN` |
| `PZ_GARDEN_CHANNEL` | `POI_ABANDONED_GARDEN` | `THREE_ROTATORS` | Su soldaki girişten orta dala, oradan en sağdaki fidana gitmeli. | `GARDEN_IRRIGATION_FIXED` |

## 7. StoryDB — 15 Türkçe kayıt

### STORY_01 — Kıyıda Uyandığım Gün

Kaynak: `POI_CRASH_BOAT`. Tür: `PLAYER_NOTE`.

> Dalgaların sesine uyandım. Tekne parçalanmış, pusulam ıslanmış. Kıyıda birkaç sağlam eşya bulabildim. Şimdilik nereye düştüğümü bilmiyorum. Önce güvenli bir yer, temiz su ve ateş bulmalıyım. Güneş batmadan küçük bir barınak yaparsam yarını düşünmek için zamanım olacak.

### STORY_02 — Kıyı Akıntıları

Kaynak: `POI_FISHER_HUT`. Tür: `TECHNICAL_NOTE`.

> Kuzey rüzgârında doğu kıyısındaki akıntı güçlenir. Kıyıya paralel ilerleyen güvenli bir sığlık vardır ama resiflerin arasından geçiş kolay değildir. Balıkçı tekneleri genellikle gözlem tepesinden görülen koyu kayayı hizalayarak yön bulurdu. Kaptanın haritası bulunursa açık deniz rotası doğrulanabilir.

### STORY_03 — Ormancının Defteri

Kaynak: `POI_FORESTER_HUT`. Tür: `PERSONAL_DIARY`.

> Kuzey yamacında eski bir patika bulduk. Yağmurdan sonra sarmaşıklar geçidi kapatıyor ama keskin bir pala ya da balta işi görüyor. Dağdaki madenlere gidecek olanların vadiden değil orman sırtından yürümelerini söyledim. Dün işlediğimiz tahtalar, yeni iskele için ayrıldı. Yarın köyde marangozla konuşacağım.

### STORY_04 — Su Teknisyeninin Notu

Kaynak: `POI_WATER_STATION`. Tür: `TECHNICAL_NOTE`.

> Eski depoda üç vana var. Birinci ile üçüncü hat depoyu besler; ortadaki vana tahliye içindir ve kapalı tutulmalıdır. Yağmurdan sonra üst kanalda çamur birikiyor. Akış yeniden kurulduğunda depo süzülmüş su verebilir. Yalnızca su çıkışının temiz olduğunu doğrulayan işaret yanıyorsa içme kabını doldurun.

### STORY_05 — Fırtınanın İlk Gecesi

Kaynak: `POI_SWAMP_MEASURE`. Tür: `PERSONAL_DIARY`.

> Akşam saatlerinde basınç beklenmedik biçimde düştü. Ölçüm direği rüzgârdan sallanıyordu. Birkaç saat içinde yağmur bütün patikaları çamura çevirdi. Yerleşime haber göndermeye çalıştık ama dağdaki röle cevap vermedi. Önce bunun geçici bir kesinti olduğunu düşündük. Ertesi sabah bataklığa doğru giden yol tamamen su altındaydı.

### STORY_06 — Maden İşletme Kaydı

Kaynak: `POI_COPPER_MINE`. Tür: `TECHNICAL_NOTE`.

> Son vardiyada giriş kirişleri ağır hasar aldı. Bakır ve kömür depoları içeride kaldı. Yüzeye yakın damarlardan kısa süreli çalışma yapılabilir ama ana galeride destekler incelenmeden ilerlemeyin. Eldeki hurda bağlantıları yeni onarımlarda kullanılmak üzere işaretlendi. Yerleşimin metal ihtiyacı artıyor; fırtına geçince yolu temizlemek gerekecek.

### STORY_07 — Son Normal Gün

Kaynak: `POI_RESEARCH_SQUARE`. Tür: `PERSONAL_DIARY`.

> Bugün hava beklediğimizden daha sakindi. Balıkçılar öğleden önce döndü, bahçedeki muzlar nihayet olgunlaştı. Yarın kuzeydeki ölçüm cihazlarını kontrol edeceğiz. Burada geçen ayları düşündüğümde, bu küçük adanın ne kadar tanıdık geldiğine şaşırıyorum. Çocuklar için yaptığımız küçük ahşap bank hâlâ meydanda duruyor.

### STORY_08 — Tahliye Kararı

Kaynak: `POI_RESEARCH_SQUARE`. Tür: `OFFICIAL_LOG`.

> Fırtına gece boyunca durmadı. Güney iskelesi kullanılamaz hâlde. Dağdaki bağlantı da kesildi. Merkezden tahliye emri geldi. Yanımıza yalnızca gerekli kayıtları alacağız. Geri kalan ekipmanlar korunaklı depolara taşınacak. Kıyıdaki bütün tekneler kontrol edildi; son ekip fener sorumlusunu alarak adadan ayrılacak.

### STORY_09 — Röle Arızası

Kaynak: `POI_RELAY_SHELTER`. Tür: `TECHNICAL_NOTE`.

> Rölenin üst bağlantısında iki hat kopmuş. Sol giriş önce güvenlik şalterine, sonra ana çıkışa bağlanmalı. Dördüncü terminal yalnızca test içindir. Frekans kayıt kartını kuru kutuya bıraktım; doğru ayar fenerdeki vericinin yeniden çalışmasını sağlayabilir. Kutu açıldığında bağlantıların yönünü tekrar kontrol edin.

### STORY_10 — Gözlem Haritası

Kaynak: `POI_OBSERVATORY`. Tür: `TECHNICAL_NOTE`.

> Deniz işaretleri kuzeydeki fener, doğudaki tek kaya ve güneydoğudaki küçük ada üzerinden ölçüldü. Gözlem diski bu üç işarete hizalandığında güvenli rota şeridi beliriyor. Akıntılar aynı kalmayabilir; fırtına sırasında denize çıkmak risklidir. Bu kayıt kıyı defterinin yanına konursa açık deniz güzergâhı daha güvenli planlanabilir.

### STORY_11 — Verici Onarım Şeması

Kaynak: `POI_RADIO_WORKSHOP`. Tür: `TECHNICAL_NOTE`.

> Verici kutusu tamamen kayıp değil; ana modül koruyucu kabın içinde. Önce güvenlik mandalını kaldırın, sonra kablo halkasını sağ girişe oturtun ve son olarak test kolunu çevirin. Modül yerinden çıkarıldığında anten bağlantısı ve enerji kaynağı ayrı hazırlanmalıdır. Üretim masasındaki eski çizim parçaların sırasını gösteriyor.

### STORY_12 — Kaptanın Son Kaydı

Kaynak: `POI_CAPTAIN_CABIN`. Tür: `PERSONAL_DIARY`.

> Batıdaki resifler haritalarda göründüğünden daha geniş. Kuzey geçidi açık ama güneydoğudaki kayalıkların yakınından uzak durmak gerekiyor. Yola çıkacak olan herkes bu notları yanında taşımalı. Bu adaların kıyılarını iyi tanıyorum; doğru hava koşulunda küçük bir yelkenli bile açık deniz yoluna ulaşabilir.

### STORY_13 — Fener Bekçisinin İlk Notu

Kaynak: `POI_LIGHTHOUSE_KEEPER`. Tür: `PERSONAL_DIARY`.

> Tahliye günü geldiğinde ışığı hemen söndürmedim. Son teknenin gece kıyıyı bulması gerekiyordu. Yeniden başlamak için kabloları ve küçük güneş düzeneğini kontrol ettim. Büyük fırtınada antenin tepe bağlantısı kopmuştu. Kulübenin içine yağmurlukla birlikte birkaç sağlam eşya sakladım; belki bir gün burada yine birileri çalışır.

### STORY_14 — Son Işık

Kaynak: `POI_LIGHTHOUSE`. Tür: `PERSONAL_DIARY`.

> Bu gece feneri son kez yakıyorum. Son tekne yarın beni alacak. Atölyedeki verici hâlâ kullanılabilir durumda olabilir ama antenin bağlantıları onarılmalı. Bir gün buraya yolu düşen biri olursa, umarım ışığı yeniden yakabilir. Kıyıdaki gemilere yol gösteren bu yerin tamamen karanlık kalmasını istemiyorum.

### STORY_15 — Kurtuluş Hazırlıkları

Kaynak: `AUTOMATIC_JOURNAL`. Tür: `PLAYER_NOTE`.

> Artık adanın geçmişine ait yeterince iz buldum. Kendi yelkenlimi hazırlayıp güvenli resif geçişinden ayrılabilirim. Bir başka ihtimal de eski vericiyi ve fener antenini onarmak. İkisinden yalnızca birini seçmek zorunda değilim. Şimdilik hangi yolu deneyeceğime kendim karar vereceğim; adadaki evim ve bütün çalışmalarım yerinde kalacak.

## 8. Teknik çalışma ve sahne sözleşmesi — v1.8 etkin

- Ana giriş: `dist/index.html`, mobil yatay HTML5/Canvas2D; geliştirmede modüler JS.
- Sahneler ve alt sahne geçişleri `Contracts/SceneFlow.json` ile birebir eşleştirilir; ana ev içi ayrı yüklenen dünya değildir.
- `GameClock` tek simülasyon zamanı; `GameState/StateStore` tek yetkili oyun durumudur.
- Kontroller UI’dan komut olarak sisteme iletilir. Envanter, crafting, loot ve kayıt tek transaction mantığıyla çalışır.
- `DB/SaveSchema.json` referans şemadır, `Contracts/ImplementationContract.json` işlem sözleşmesini tamamlar.
- Canvas güncelleme, aktif chunk çizimi, AI LOD ve arka plan duraklatma ayrıntıları `Contracts/ImplementationContract.json` içerisinde sabitlenmiştir.
- Envanter, tarım, maden, mağara, sal ve bulmaca içi kaydetme geri yüklemede aynı dünyayı üretmelidir.
- Özel blueprint'ler 20 sabit POI ödülüdür; hiçbirisi kaçış rotası için zorunlu olmamalıdır.

## 9. Asset üretimi — v1.9 etkin

- **Gerçek görsel üretimi bu paketle yapılmamıştır.** `Art/SpriteCatalog.json` 3.180 mantıksal sprite/kare kimliği tanımlar.
- `Art/AtlasLayout.json` 24 adet 1024×1024 RGBA8 atlasın planlı kutularını içerir. PNG dosyaları yoktur.
- Varlık tekil anahtarı daima `spriteId`'dir. `DB/AssetManifest.json` içerisindeki legacy `filePattern` kaynak dosya üretiminde isteğe bağlıdır, runtime çözümleyici olarak kullanılmaz.
- Bölgeye göre atlas yükle; renderer olmayan atlas sayfasına erişirse hata kayıtlarına yaz; geçici placeholder nihai sürümde teslim edilemez.
- `Art/AvatarRig.json` 322 temel pozu ve ekipman katmanlarının kavramsal pivotlarını içerir. Çizim sonrası elle kalibrasyon gerektirir.
- Karakter, item, yapı ve POI ID'leri sabittir. 20 arazi türü 4+ varyasyon, dört hazır ev tam durum sprite'ı, 25 canlı türünün animasyonları gerekir.
- `Art/AudioManifest.json` 63 olay tanımlar; gerçek WAV/OGG bulunmaz. Tarayıcıda kullanıcı etkileşimi sonrası ses açılabilir.
- Telif koruması: hazır oyun sprite'ı, izinsiz görsel kopyalama veya ses kullanma yoktur.

## 10. Tam sürümden önce kalite kapıları

| Kapı | Gerekli kanıt | Şimdiki durum |
|---|---|---|
| G0 Veri referansları | QA betiği 0 hata | Gerçek statik kontrol sonucu raporda |
| G1 Oyun açılışı | Tarayıcı konsol kaydı, menü, bölüm açılışı | Yapılmadı |
| G2 Görseller | Üretilmiş 24+ atlas sayfası, animasyon kareleri, snapshot | Yapılmadı |
| G3 Oyun sistemleri | Envanter/crafting/IA/tarım/sal/mağara/save E2E | Yapılmadı |
| G4 Her iki kaçış | Bağımsız yeni kayıtlarla baştan sona oynanış | Yapılmadı |
| G5 Mobil performans | Orta sınıf telefonda 30/60 FPS, bellek, UI dokunma | Yapılmadı |
| G6 Kayıt bütünlüğü | Android tarayıcı yeniden açma, export/import, migration | Yapılmadı |
| G7 Tam sürüm kabulü | 92 runtime + 28 asset testi, kanıt ve hata raporu | Henüz hiçbirisi çalıştırılmadı |

## 11. Geliştirme ve teslim kararları

1. Oyun tüm veri tabanlarını `ContentIndex_v2.0.json` üzerinden yüklemeli; sürüm dosyalarını tekrar override etmemeli.
2. Tarihsel yamalar uygulanmış olduğu için eski `v1.5/v1.6` patch'leri yeniden çalıştırılmamalı.
3. Art dizinindeki atlas JSON tek kaynaktır. Gerçek atlaslar üretilip optimize edildiğinde `generated:false` gibi durum alanları yeniden düzenlenmelidir.
4. Asset sayfalarının çizilmemiş olması veya runtime testlerinin yapılmamış olması “tamamlandı” olarak raporlanamaz.
5. Oyun gereksiz kapsam azaltmasına gidilmeksizin tam sürüm hedefiyle geliştirilecek; geliştirme içi kilometre taşları oyuncuya MVP teslim etme talimatı değildir.
6. Son geliştirici talimatı (nihai Claude Opus promptu) **bu belgede bulunmaz**; kullanıcı ayrıca istediğinde hazırlanacaktır.

## 12. Açık risk ve takip listesi

| Risk | Neden | Kapatma koşulu |
|---|---|---|
| 3.180 çizilmemiş sprite | Atlas planı sanat değildir | Tüm PNG atlasları gerçek, görsel QA |
| Animasyon pivotları | Sadece planlı koordinatlar | Sprite üzerinde görsel kalibrasyon |
| 15–20 saat hedefi | Simülasyon varsayımsal | Gerçek oynanış süresi ölçümü |
| Dinamik bina/pathfinding | Karo statik haritası yeterli değil | Yapı yerleştirme sonrası yol bulma testleri |
| Kayıt bozulması | Sadece şema var | IndexedDB atomik kayıt ve kurtarma testleri |
| 183 tarifin tamamı | Sadece statik referans | Üret/eksilt/yükselt/kaydet E2E |
| Mobil performans | 24 atlasın açılmış hâli ~96 MiB | Yerel cihaz belleği ve FPS ölçümü |
| Hava/su dengesi | 600 tohum simülasyonu | Gerçek oyun içinde manuel/otomatik su üretimi |

### Kaynak dosyaları

`DB/` 31 güncel içerik veri tabanı; `Maps/` 7 gerçek RLE harita ve iki görsel teknik önizleme; `Contracts/` v1.8 uygulama ve kabul sözleşmeleri; `Art/` v1.9 katalog/atlas/ses/animasyon şemaları; `QA/` yeniden çalıştırılabilir kontroller; `ProductionTruth_v2.0.json` sürüm önceliği.
