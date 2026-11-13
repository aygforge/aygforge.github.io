# SON PERON: MİRAS LOKANTASI
## Tam Sürüm Oyun Tasarım Belgesi (GDD) — v1.0

**Tarih:** 11 Kasım 2026  
**Durum:** TASARIM REFERANSI — üretim/kodlama yapılmadı  
**Dil:** Türkçe  
**Platform:** PC öncelikli, tek oyunculu, tarayıcıda çalışan HTML5  
**Hedef teknoloji:** Phaser 3 + JavaScript + Vite; yerel, çevrimdışı çalışabilen dağıtım  
**Görsel stil:** Özgün klasik 16-bit pixel art  
**Ekler:** `Son_Peron_v1_0_Birlesik_Oyun_Verileri.json` + v0.7/v0.8/v0.9 kaynak verileri

> **Kapsam uyarısı:** Bu belge nihai Claude Fable üretim promptu değildir. Buradaki değerler tasarım kurallarıdır; test raporu veya tamamlanmış oyun çıktısı olarak yorumlanmamalıdır. Çelişki durumunda bu GDD'nin «Uzlaştırma ve öncelik» bölümündeki kurallar geçerlidir.

## 1. Yönetici özeti ve tasarım ilkeleri

**Kısa tanım:** Oyuncuya Peronova kasabasındaki tren garının hemen yanındaki köhne bir restoran miras kalır. Birinci gün dört temel el aletiyle onarım yapar, ormandan odun ve taş toplar, mobilya üretir, posta yoluyla ilk malzemelerini sipariş eder. Sonraki sabah çorba pişirir, barda satışa koyar ve 09:00 treniyle gelen ilk yolcuları karşılar. Restoran zamanla genişler; yemek, içecek, personel, tarım, kaynak toplama, kasaba ilişkileri, festivaller ve mevsimler tek döngüde birleşir.

**Dört vazgeçilmez sütun:** (i) oyuncu fiziksel olarak restoranda çalışır; (ii) bar stoğu menünün tek belirleyicisidir; (iii) trenlerin görünür, saatli yolcu akışı restoran ekonomisini besler; (iv) harap lokanta, oyuncunun serbest mobilya yerleşimi sayesinde görsel olarak dönüşür.

**Hissettirmesi gereken duygu:** sıcak, sakin, başarı hissi yüksek, fakat zaman ve stok planlaması anlamlı. *A — rahat/cozy* ekonomide kira, vergi, kredi, faiz, stamina ve temel alet bozulması yoktur. Oyuncu iflas edebilir ama oyun kilitlenmez ve game over olmaz. Para kazanmak için restoran işletmek her zaman en güçlü yol olmalıdır; odun/taş satışı güvenli çıkış yoludur.

**Özgünlük:** Tür ve kamera hissi için benzer cozy simülasyonlar referans alınabilir; hiçbir mevcut oyunun karakterleri, haritası, görselleri, müzikleri veya arayüzü kopyalanmaz.

**Başarı koşulu:** İlk iki gün eksiksiz tutorial + tekrarlanabilir tam günlük restoran döngüsü + bütün tablolanmış tarif ve geliştirmeler + tüm mevsimler/festivaller + güvenilir kayıt/yükleme. Hikâye bitebilir, sandbox bitmez.

## 2. Kesinleşmiş tasarım kararları ve kapsam sınırı

| Alan | Bağlayıcı karar |
|---|---|
| Platform | PC öncelikli HTML5; WASD ve fare; 16:9 referans |
| Assetler | Klasik 16-bit estetiği, 32×32 karo mantığı, özgün sprite ve animasyonlar |
| Yerleştirme | Tamamen serbest: masalar, sandalyeler, tezgâhlar, ocaklar ve dekorlar uygun tüm açılmış hücrelere konabilir |
| Personel | **A — yardımcı personel:** oyuncu karşılama/masa seçme/sipariş/son servis/tahsilatı daima yapar |
| Hikâye | **C — hikâye + sandbox:** görevler ödül ve öykü sunar; restorasyon ana hikâye yüzünden kilitlenmez |
| Ekonomi | **A — rahat/cozy**: yüksek makul kâr, esnek sabır, düşük baskı, kira/vergi/borç yok |
| Seferler | 09:00, 15:00 ve 21:00, her oyun günü |
| Gün / yıl | 06:00–23:00, yaklaşık 20 gerçek dakika; 4×28 gün = 112 gün/yıl |
| Ticaret | Posta ile satın alınanlar ertesi sabah 06:00'da gelir; bakkalda seçili ürünler anlık ama pahalıdır |
| Menü | Fiziksel bar slotlarında stok bulunan ve süresi dolmamış ürünler otomatik menüye girer |
| Ana karakter | Odalarda yürüme, kaynak toplama, crafting, yemek, servis, temizlik, ödeme ve dekorasyonda etkin rol |

**Kapsam dışı:** multiplayer/online hesap, rekabetçi ekonomi, kira-vergi-kredi sistemi, stamina/alet dayanıklılığı, tamamen serbest duvar inşası, tek tek fizik simülasyonlu sıhhi tesisat, tam ölçek balıkçılık kariyeri, tam otomatik restoran, harici ücretli API ve telifli hazır asset zorunluluğu.

## 3. Temel oynanış döngüsü

1. **06:00 uyanış:** Yeni hava durumu, teslimatlar, çalışan vardiyaları ve olay takvimi kesinleşir. Oyuncu posta kutusundan teslimatı alır.
2. **Hazırlık:** Depodaki malzemelerden yemekler hazırlanır; gerçek pişirme süresi akar. Hazır yemek fiziksel olarak bar slotuna taşınır; içecekler yerleştirilir.
3. **Restoranı açma:** Kapıdaki AÇIK/KAPALI tabelası yeni müşteri kabulünü yönetir. Kapatmak mevcut müşterileri yok etmez.
4. **09 / 15 / 21 trenleri:** Gerçek tren hareketi, kapıların açılması, yolcuların inmesi; yalnız bir bölümü restoranı seçer. Oyuncu müşteriyi karşılar ve uygun fiziksel masa-sandalye düzenine yerleştirir.
5. **Sipariş–servis–ödeme:** Oyuncu masa bazlı panelden siparişi alır; stok rezerve edilir; barından tabağı/şişeyi alıp müşteriye götürür; yeme tamamlandığında ödemeyi toplar.
6. **Temizlik, stok yenileme, diğer işler:** Müşteriler giderken masa kirlenir. Mutfak pişerken oyuncu servis, tarım, orman, kasaba, crafting yapabilir; ancak dışarıdayken restoran kendiliğinden para kazanmamalıdır.
7. **Kapanış ve uyku:** 23:00'te yeni müşteri alımı durur; içerideki servisler tamamlanır. Yatakta gün sonu raporu açılır; siparişler, gelirler, stok ve gelişim korunarak yeni gün başlar.

**Kullanıcı deneyimi:** Basit görevler tek bir tuşa basılarak değil, uygun fiziksel animasyonla icra edilir. Oyuncu zorunlu kaynak/servis mini oyunlarıyla sürekli kilitlenmez. Büyük UI menüleri açıkken ortak oyun saati ve ilgili bütün sayaçlar durur.

## 4. Oyun saati, tren takvimi ve kapanış

- Simülasyonun tek «game clock» kaynağı vardır: **1020 oyun dakikası / 1200 gerçek saniye**. Buna göre 1 oyun dakikası ≈ 1,17647 gerçek saniyedir. 30 oyun dakikalık çorba ≈ 35,3 gerçek saniyede pişer; 4 oyun dakikalık hazırlık ≈ 4,7 saniyedir.
- Simülasyon duraklatıldığında pişirme, müşteri sabrı, trenler, çalışanlar, büyüme ve zamanlı görevler birlikte durur. Panel kapanınca aynı durumdan devam ederler. Dekoratif UI efektleri istenirse duraklatma sırasında da oynayabilir.
- **Tren 09:00 / 15:00 / 21:00** gelir; planlanan gelişten 10 oyun dakikası önce yaklaşıyor efekti başlar; **12 oyun dakikası** peronda durur. Her normal tren için 2–4 kişilik inen yolcu paketleri kontrollü olarak oluşturulur; bunların yalnız bir kısmı restoranı seçer.
- 23:00 sonrası yeni müşteri, tren, yemek üretimi, crafting ve kaynak toplama yoktur. Kapanış modu oyun saatini 23:00'te tutarken içerideki servis, yeme, ödeme ve temizlik işlemlerini ayrı kapanış zamanlayıcısıyla tamamlatır. Bu zamanlayıcı duraklatılan menülerde durur. Zorunlu olarak yeni ürün üretmek gerekmez; servis imkânsızsa müşteri güvenli şekilde ayrılır.
- **Erken uyku:** Aktif rezervasyon ve tahsilat varsa `İşletmeye dön` / `Günü bitir` onayı gösterilir. `Günü bitir` seçildiğinde servis edilmemiş rezerve stok, tazelik kurallarına uygun olarak serbest bırakılır; servis edilmiş, tahsil edilmemiş ürün satış geliri yazılmaz; tamamlanmış ödeme ikinci kez sayılmaz.
- 1. gün restorana müşteri girmez. 2. gün zorunlu çorba/bar tutorialı sırasında oyun saati durabilir; fakat tren seferi *değiştirilmez*: oyuncu hazırlığı bitirince 09:00 akışına devam edilir.

**Oyun içi HUD:** Gün/mevsim, hava, saat, sıradaki tren, altın, itibar, açık/kapalı tabelası, aktif sipariş özetleri, görev ve 8 hızlı erişim slotu. Tren yaklaşınca küçük uyarı ve düdük duyulur.

## 5. Tutorial: gün gün tamamlanabilir sözleşme

### Gün 1 — Eski miras

1. Restorana gir; miras mektubunu oku. Kırık mobilyalar, eski mutfak, depo, bar ve yatak odasını incele.
2. Başlangıç sandığını aç; **balta, kazma, çapa, sulama kabı** envantere eklenir.
3. Ormana gidip **en az 15 odun ve 5 taş** topla. Başlangıçta yeterli kaynak noktası ve hatayı telafi edecek ek kaynak bulunmalıdır.
4. **Kapı onarımı:** 2 odun + 1 taş. **Marangoz tezgâhı onarımı:** 3 odun + 1 taş.
5. **Basit masa:** 4 odun; **iki sandalye:** toplam 4 odun. Masa ve sandalyeleri serbestçe yerleştir; mevcut eski 2 kişilik masa dahil **4 koltuk** hazır olsun.
6. **Ocak onarımı:** 2 odun + 3 taş. Onarım+crafting toplamı **15 odun + 5 taş**; aynı kaynaklar iki defa düşmez.
7. Posta kutusundan **4 patates (16 G) + 2 havuç (6 G) + 2 soğan (4 G) + 3 hazır meyve suyu (18 G)** sipariş et. Toplam **44 G**, başlangıç 100 G'den **56 G** kalır.
8. Yatakta ilk günü erkenden bitir; yapılmış onarımlar ve aktif teslimat kaydedilir.

### Gün 2 — İlk servis

1. 06:00'da uyanıp teslimat kutusunu **bir kere** teslim al; kutu ürünü tekrar vermesin.
2. Çorba tarifini seç; depo stoğundan 2 patates + 1 havuç + 1 soğan tüket, 4 oyun dakikası hazırlık + 30 oyun dakikası pişirme sonrası **4 porsiyon** kazan.
3. Çorbayı barın yemek slotuna, şişe meyve suyunu içecek slotuna yerleştir. Restoranı AÇIK yap.
4. 09:00 treniyle **iki tutorial müşterisi** gelir. Oyuncu karşılama, sandalyeye yönlendirme, sipariş alma, ürün taşıma, servis, ödeme ve masa temizliğini yapar.
5. Temizlik dolabı üzerinden süpürge ve bez tanıtılır; 15:00 ve 21:00 seferleri serbest döngüde sürer.

### Gün 3 — Serbest sandbox

Ana tutorial biter. Tarım yataklarını açma, yeni tarif öğrenme veya oturma kapasitesini artırma gibi **isteğe bağlı** görevler gösterilir. Hikâye görevleri oyunu tek çizgiye zorlamaz.

## 6. Dünya, haritalar ve sahne bağlantıları

**Sahne yaklaşımı:** Restoran içinin tüm odaları tek `restaurant_interior` haritası; dışarıdaki restoran/gar/orman/bahçe ortak `railway_outdoors` haritası; daha uzağa gidilen `town_square` ve `riverbank` ayrı sahne. Yakındaki kapı geçişlerinde kısa kararma olabilir, oda içi yükleme yoktur.

| Sahne ID | Karo boyutu | Piksel boyutu | İşlev |

| --- | --- | --- | --- |

| railway_outdoors | 116×82 | 3712×2624 | restoran, gar, orman, bahçe |

| restaurant_interior | 60×42 | 1920×1344 | odalar ve genişleme |

| town_square | 60×44 | 1920×1408 | NPC ve dükkânlar |

| riverbank | 48×32 | 1536×1024 | isteğe bağlı balıkçılık |



**Dış ana haritanın ana bölgeleri:**

| Bölge | Karo dikdörtgeni |

| --- | --- |

| Restoran dış kabuğu | [43, 24, 67, 45] |

| Gar ve istasyon binası | [7, 39, 37, 56] |

| Kuzey peronu | [8, 52, 38, 55] |

| Doğu-batı tren rayı | [0, 57, 115, 60] |

| Küçük orman | [35, 1, 99, 22] |

| Başlangıç bahçesi | [69, 27, 88, 45] |



**Etkileşim noktaları ve sahne bağlantıları:**

| Nokta | (x,y) karo | Bağlantı / görev |

| --- | --- | --- |

| restaurant_entrance | [54, 45] | restaurant_interior |

| mailbox | [68, 46] | catalogue |

| delivery_crate | [70, 46] | collect_parcels |

| station_platform_spawn | [25, 53] | train_disembark |

| train_stop | [24, 58] | train_stops_9_15_21 |

| town_exit | [0, 37] | town_square |

| river_exit | [115, 46] | riverbank |

| forest_entry | [54, 23] | path_from_restaurant |

| garden_entry | [69, 38] | farming |



**Çalışabilir harita için şartlar:** Tren peronundan restorana, restorandan orman girişine, bahçeye ve posta kutusuna en az bir sürekli yol kalmalı. Perondan restoran kapısına en makul yürüyüş yolu çok uzun olmamalı; yerleştirme validasyonu bu bağlantıları bozmayı reddetmeli. Oynanış hedefi: teslimat kutusu 5–8 sn, yakın orman 10–15 sn, peron yaklaşık 15–25 sn yürüyüş.

Dış dünyanın görece uzak köşelerini oyuncu ziyaret etmeden animasyonlarla zorla canlandırmak gerekmez. Sahne dışındaki oyun işlemleri tarih/saat tabanlı olarak güncellenir; tarlalar, stok, tren ve müşteri durumları durmaz.

## 7. Restoran planı, başlangıç odaları ve genişleme kanatları

**İç dünya:** 60×42 karo. Aşağıdaki `rect` değerleri `[sol,üst,sağ,alt]` hücre koordinatlarıdır. Zemin kaplamaları, sabit duvarlar, kapılar, mobilya, dekorasyon ve oyun nesneleri ayrı katmanlara bölünür. Portal geçişleri veriyle tanımlanır; odalar geçiş sırasında ayrı sahne olarak yeniden yüklenmez.

| Alan / oda | Karo dikdörtgeni | Başlangıç işlevi |

| --- | --- | --- |

| bedroom | [6, 5, 17, 14] | oyuncu yatağı ve kişisel dolap |

| dining | [6, 16, 29, 34] | başlangıç müşteri salonu |

| kitchen | [31, 14, 46, 31] | ocak ve hazırlık |

| storage | [34, 5, 45, 12] | başlangıç depo |

| bar | [24, 20, 29, 27] | salonla ortak zemindeki işlevsel servis bölgesi, ayrı kapalı oda değildir |



**Açılan bina kanatları:**

| Aşama | Teknik proje ID | Açılan kanat | Rect | Portal |

| --- | --- | --- | --- | --- |

| 2 | salon_expansion_1 | north_lounge | [18, 5, 29, 14] | [[23, 14], [23, 15], [23, 16]] |

| 3 | salon_expansion_2 | west_dining | [0, 18, 5, 34] | [[5, 25], [6, 25]] |

| 4 | salon_expansion_3 | east_kitchen | [47, 14, 58, 31] | [[46, 22], [47, 22]] |

| 5 | salon_expansion_4 | southeast_hall | [30, 33, 58, 40] | [[29, 33], [30, 33]] |



**Kritik uzlaştırma:** `salon_expansion_3` gibi eski teknik proje ID'leri v0.7 içeriğiyle uyum için korunur; üçüncü projeyle açılan fiziksel alan **doğu mutfak kanadıdır**. Oyuncuya mekanik olarak yanlış «salon» adlandırması gösterilmez. 4. proje güneydoğu büyük salonu açar.

**Serbest yerleşim ilkesi:** Duvarlar/taşıyıcı yapı/kapı eşikleri ve henüz kilitli kanatlar sabittir. Bunların dışındaki açılmış bütün uygun zeminlere masa, sandalye, ocak, üretim istasyonu, sandık ve dekor konulabilir; oda adı engel değildir. Duvar dekoru uygun mevcut duvar hücresine asılabilir, önceden tanımlanmış dekor slotlarına bağlı değildir.

**Genişlemeler:** Gereken altın ve malzemeler bir kez ödenir, kanat ertesi sabah açılır. Var olan mobilyalar asla silinmez; olası çakışma varsa geçici güvenli eşya deposuna alınır ve oyuncu bilgilendirilir.

## 8. Mobilya yerleştirme ve erişilebilirlik

`B` yerleştirme modudur; ızgara ve hayalet önizleme görünür. Sol tık yerleştir, `R` 90° döndür, sağ tık iptal. Geçerli hücreler yeşil, geçersizler kırmızı. Oyun saati yerleştirme modunda durur.

- En az bir yürünebilir çıkış, yatak, posta bağlantısı, depo ve temel ocak erişilebilir kalmalıdır. Barın erişim yüzü ve aktif masaların servis/oturma bağlantıları korunmalıdır.
- Tüm nesnelerde `footprint`, `visualAnchor`, `collisionMask`, `interactionCells`, `rotation` ayrı tanımlanır. Bir sprite resimde 3 hücre yüksek, zeminde 2×2 yer kaplıyor olabilir.
- Sandalyeler **masalardan bağımsız** yerleştirilir. Yakınlık ve baktığı yön doğrulanır; oturma noktaları masa ID'sine bağlanır. Grup boyutuna yetecek kadar boş ve erişilebilir sandalye olmadan grup oturtulamaz.
- Nesne konulmadan önce ilgili kapılar ve kritik servis yolları için topolojik bağlantı kontrolü yapılır. Tam harita A* her karede çalıştırılmaz; yerleşim değişince geçersizlik ve etkilenen ajanlar güncellenir.
- Kullanımdaki masa, stok taşıyan kritik istasyon veya aktif siparişe bağlı eşya taşınamaz. Boş mobilyayı yerinden kaldırıp taşımak ücretsizdir; satışla para yaratılmaz.
- Duvar ve zemin döşemeleri karakter/sandalyenin geometrisini bozmadan görünümü değiştirir.

**Yol bulma:** Grid üzerinde A*; hedef değişince veya çarpışma ağı değişince rota yeniden hesaplanır. Rota yoksa NPC güvenli geri dönüş/wait/exit davranışına geçer; sonsuza dek kilitlenmez.

## 9. Oyuncu hareketi, kontroller, kamera ve animasyon

| Kontrol | İşlev |
|---|---|
| WASD | 4 ana yöne ve köşegenlerde normalize yürüyüş |
| Shift | Koşma (stamina yok) |
| E | Bağlama duyarlı etkileşim, müşteri ve nesneler |
| F | Seçili araç/elde tutulan nesneyi kullanma |
| 1–8 | Hızlı slotlar |
| Tab / B / C / J / M | Envanter / mobilya / crafting / görev / kasaba haritası |
| R / Q | Yerleştirmede döndür / taşınanı uygun yere bırak |
| Sol tık / sağ tık | UI/yerleştirme, bağlama uygun iptal |
| Fare tekerleği / Esc / F11 | Zoom / panel-kapat-duraklat / tam ekran |

**Hız örnekleri:** Oyuncu yürüme 110 px/sn, koşma 165, yük taşıma 95; NPC 70–100. Kesin değerler oynanış testlerinde ayarlanabilir. Etkileşim menzili yaklaşık 1,5 karo; karakter yalnız duvar önünden veya uygun yaklaşım hücresinden etkileşir.

**Kamera:** Pürüzsüz takip, merkezde küçük serbest alan, %75–150 zoom, harita dışına çıkmama, karakteri kapatan üst duvarlarda saydamlık. Pixel art pikseller keskin ölçeklenir (`nearest-neighbor`), antialias/yumuşatma sprite'ları bulanıklaştırmaz.

**Zorunlu animasyonlar:** idle/walk dört yön, koşma (uygun yürüyüş türevi olabilir), balta, kazma, çapa, sulama, crafting, pişirme, taşıma, servis, temizlik, NPC oturma/yeme, uyuma; tren hareket-duruş, kapı, duman; ocak buharı, şömine ateşi. Araç vuruşlarının ses ve etki animasyonu gerçek kaynağın dayanıklılığıyla ilişkilidir.

**Karakter özelleştirme:** İsim, saç/renk, kıyafet/göz/ten kozmetiği; ortak rig üzerinde yön ve animasyonlar bozulmamalı. Başlangıçta sade menü ve sınırlı, tutarlı kombinasyonlar; özgün altı kasaba NPC'si belirgin siluet taşımalı.

## 10. Envanter, sandıklar, depo ve item işlemleri

- Başlangıç çantası **24 slot**, başlangıç restoran deposu **48 slot**. Çoğu hammaddenin stack üst sınırı **99**; mobilyalar bir adet/slot. Hızlı erişim barı sekiz slot.
- Depodaki sandık/raf/erzak dolapları **ortak depo havuzuna** kapasite ekler. Crafting ve mutfak tarifleri restoran stok havuzunu görür; oyuncunun malzemeleri her defasında elle taşıması gerekmez.
- Fiziksel servis ürünleri ayrıdır: yemek veya şişe/tencere tezgahtan alınır, karakterin eline veya tepsiye taşınır, yalnız doğru masa ve müşteri siparişine verilir.
- Eşya envantere eklenemiyorsa kaybolmaz; teslimat kutusunda bekler, üretim uygun yere bırakılmayı bekler veya işlem başlamaz.
- Sıralama, yığın birleştirme, sürükle-bırak, Shift+tık hızlı aktarım, Ctrl+tık tek adet gibi PC kolaylıkları sağlanır.
- Her eşya `itemId`, kategori, stack, satış alış fiyatı ve görsel varlık ID'sine bağlanır. İşlem atomik olmalı, aynı eşya iki farklı yerde aynı anda kayıtlı olamaz.

## 11. Ekonomi, posta siparişi, bakkal ve muhasebe

**Para birimi:** G, tam sayı; başlangıç **100 G**, ilk sipariş **44 G** ile **56 G** kalır. Kira, vergi, kredi/borç/faiz yoktur. Fiyat enflasyonu bulunmaz; etkinlik indirimleri makul olabilir.

**Posta siparişi:** Oyuncu fiziksel posta kutusunu açar; kategori kataloğundan gıda, hazır içecek, tohum, crafting kaynağı ve ekipman sipariş eder. Stok/alım tutarı ödeme anında tek kez düşer. Ertesi sabah **06:00** teslimat noktası kutusunda hazır olur. Ekipmanın altın ücreti katalogda ödenir; montaj malzemeleri yerleştirmede harcanır ve ikinci kez altın alınmaz.

**Bakkal:** Feriha'nın mağazasında temel gıdalar sınırlı ürün listesiyle aynı gün alınabilir; fiyatlar posta fiyatının **1,25 katı, yukarı yuvarlanmış** halidir. Bazı ürünler bakkalda satılabilir. Her alış/satış önce envanter ve para koşullarını kontrol eder.

**Ekonomik geri dönüş:** Ormandan toplanan odun/taş ve diğer satılabilir kaynaklar düşük fiyatla bakkala satılır. Para yokken de yeniden tedarik ve yemek yapma mümkündür. Ana oyunun ekonomik olarak kaçınılmaz çıkmazı bulunmaz.

**Muhasebe:** `cashGold` alım ve tahsilatta gerçek değişir. `grossProfit` = ödeme ile satılan ürünlerin geliri − bu satışlara atanan malzeme maliyeti. Önceden ödenmiş satın alma maliyeti kasadan rapor anında **ikinci kez düşülmez**. Gün raporu satış, bahşiş, sipariş alımı, personel ve net nakit değişimini ayrı verir.

## 12. Malzeme fiyat ve stok verileri

Aşağıdaki değerler birleşik JSON'daki aynı ID'lerle birebir eşleşir. Bütün alış ve satışlar G cinsindendir.

| ID | Malzeme | Posta alış (G) | Bakkala satış (G) |

| --- | --- | --- | --- |

| potato | Patates | 4 | 2 |

| carrot | Havuç | 3 | 1 |

| onion | Soğan | 2 | 1 |

| tomato | Domates | 4 | 2 |

| pepper | Biber | 5 | 2 |

| flour | Un | 4 | 2 |

| lentil | Mercimek | 5 | 2 |

| rice | Pirinç | 5 | 2 |

| pasta | Makarna | 6 | 3 |

| egg | Yumurta | 5 | 2 |

| milk | Süt | 5 | 2 |

| butter | Tereyağı | 6 | 3 |

| sugar | Şeker | 4 | 2 |

| salt | Tuz | 1 | 1 |

| chicken | Tavuk eti | 8 | 4 |

| minced_meat | Kıyma | 10 | 5 |

| beef | Dana eti | 13 | 6 |

| fish | Balık | 10 | 5 |

| apple | Elma | 5 | 2 |

| mushroom | Mantar | 7 | 3 |

| wild_berries | Orman meyvesi | 4 | 2 |

| tea_leaves | Çay yaprağı | 5 | 2 |

| coffee_beans | Kahve çekirdeği | 8 | 4 |



### Crafting kaynakları

| ID | Kaynak | Posta alış (G) | Satış (G) | Temin |

| --- | --- | --- | --- | --- |

| wood | Odun | — | 1 | forest |

| stone | Taş | — | 2 | forest |

| metal_part | Metal parça | 12 | 6 | mail |

| fabric | Kumaş | 10 | 5 | mail |

| glass | Cam | 8 | 4 | mail |



### Tohumlar ve hasat

| Tohum ID | Fiyat | Büyüme: sulanmış gün | Hasat | Posta fiyatıyla hasat değeri |

| --- | --- | --- | --- | --- |

| potato_seed | 3 | 3 | 3 Patates | 12 |

| carrot_seed | 2 | 3 | 2 Havuç | 6 |

| onion_seed | 2 | 4 | 2 Soğan | 4 |

| tomato_seed | 4 | 5 | 3 Domates | 12 |

| pepper_seed | 4 | 5 | 3 Biber | 15 |



**Tarım kuralları:** Başlangıçta 4 ekim alanı; toplam 20'ye kadar artırılabilir. Çapa→tohum→sulama→sulanmış gün sayısına göre olgunlaşma→hasat. Yağmur otomatik sular; sulanmayan gün bitki büyümez ama ölmez. Mevsimler büyüme temposunu en fazla ~1 gün değiştirir; hiçbir temel tarif kalıcı erişilemez hale gelmez. Hava her sabah mevsim ağırlıklarına göre belirlenir.

## 13. Yemek veritabanı: 15 tarif

**Ortak formül:** `materialCost = Σ(ingredient.qty × ingredient.mail_buy_g)`; `grossSales = yieldServings × sellPrice` ve `grossProfit = grossSales − materialCost`. Hazırlık süresi 4 oyun dakikasıdır; gelişmiş tezgâh ve mutfak yardımcısıyla 3 veya 2 dakikaya düşebilir. Pişirme süresi bitince yemek hazırdır; yanma/bozulma ancak saklama süresince işler, tencere yanması yoktur.

| Aşama | Tarif (ID) | Malzemeler | İstasyon | Pişirme dk | Porsiyon | Maliyet | Fiyat/pors. | Tam satış brüt |

| --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 1 | Sebze çorbası (`vegetable_soup`) | 2 Patates, 1 Havuç, 1 Soğan | stove | 30 | 4 | 13 G | 12 G | 35 G |

| 1 | Haşlanmış patates (`boiled_potatoes`) | 3 Patates, 1 Tuz | stove | 20 | 3 | 13 G | 13 G | 26 G |

| 1 | Kızarmış ekmek (`fried_bread`) | 2 Un, 1 Tereyağı | stove | 18 | 4 | 14 G | 10 G | 26 G |

| 2 | Mercimek çorbası (`lentil_soup`) | 2 Mercimek, 1 Soğan, 1 Havuç | stove | 40 | 5 | 15 G | 15 G | 60 G |

| 2 | Omlet (`omelet`) | 3 Yumurta, 1 Süt | stove | 20 | 3 | 20 G | 19 G | 37 G |

| 2 | Sebzeli pilav (`vegetable_rice`) | 2 Pirinç, 1 Havuç, 1 Soğan | stove | 35 | 4 | 15 G | 17 G | 53 G |

| 2 | Fırın patates (`baked_potato`) | 3 Patates, 1 Tereyağı | basic_oven | 35 | 3 | 18 G | 18 G | 36 G |

| 3 | Domatesli makarna (`tomato_pasta`) | 2 Makarna, 1 Domates | stove | 35 | 4 | 16 G | 20 G | 64 G |

| 3 | Tavuk yahni (`chicken_stew`) | 2 Tavuk eti, 1 Patates, 1 Soğan | stove | 55 | 4 | 22 G | 27 G | 86 G |

| 3 | Köfte tabağı (`meatballs`) | 2 Kıyma, 1 Soğan, 1 Un | large_pan | 45 | 3 | 26 G | 34 G | 76 G |

| 3 | Elmalı turta (`apple_pie`) | 2 Elma, 1 Un, 1 Şeker | basic_oven | 60 | 4 | 18 G | 23 G | 74 G |

| 4 | Mantarlı pilav (`mushroom_rice`) | 2 Pirinç, 2 Mantar, 1 Tereyağı | stove | 55 | 4 | 30 G | 33 G | 102 G |

| 4 | Balık tava (`fried_fish`) | 2 Balık, 1 Un | large_pan | 45 | 3 | 24 G | 36 G | 84 G |

| 4 | Gar kebabı (`station_kebab`) | 2 Dana eti, 1 Biber, 1 Soğan | advanced_stove | 75 | 4 | 33 G | 41 G | 131 G |

| 4 | Gecenin güveci (`night_stew`) | 2 Dana eti, 1 Patates, 1 Mantar | advanced_stove | 80 | 4 | 37 G | 46 G | 147 G |



### Tarif kilit koşulları

| Tarif | Minimum restoran aşaması | Ödemesi tamamlanan toplam müşteri | Cihaz / özel koşul |
|---|---:|---:|---|

| Sebze çorbası | 1 | 0 | Temel istasyon / tutorial |

| Haşlanmış patates | 1 | 1 | Temel istasyon |

| Kızarmış ekmek | 1 | 5 | Temel istasyon |

| Mercimek çorbası | 2 | 12 | Temel istasyon |

| Omlet | 2 | 20 | Temel istasyon |

| Sebzeli pilav | 2 | 30 | Temel istasyon |

| Fırın patates | 2 | 12 | basic_oven |

| Domatesli makarna | 3 | 70 | Temel istasyon |

| Tavuk yahni | 3 | 90 | Temel istasyon |

| Köfte tabağı | 3 | 70 | large_pan |

| Elmalı turta | 3 | 130 | basic_oven |

| Mantarlı pilav | 4 | 220 | Temel istasyon |

| Balık tava | 4 | 220 | large_pan |

| Gar kebabı | 4 | 220 | advanced_stove |

| Gecenin güveci | 4 | 300 | advanced_stove |



**Tarif alternatif yolu:** Ana hikâyedeki belirli özel tarif ödülleri yalnız müşteri eşiğini **erken karşılayabilir**; asgari restoran aşamasını ve fiziksel olarak kurulu istasyon gereksinimini kaldıramaz. Böylece hikâye koşulu olmayan sandbox oyuncusu tüm tariflere erişebilir.

**Üretim/istasyon:** `stove` başlangıç onarılan ocak; `basic_oven` 2. aşama; `large_pan` 3. aşama; `advanced_stove` 4. aşama. Tarif verisindeki istasyonla üretimde kullanılan kurulu eşyanın station ID'si eşleşmelidir. Aynı istasyonda ancak bir aktif pişirme sırası; birden çok farklı istasyon paralel kullanılabilir.

## 14. İçecek veritabanı: 6 ürün

Hazır şişe satın alınan ürün doğrudan bar slotuna taşınır ve bozulmaz. Çay, kahve ve meyve suları ilgili alette pişirilir/hazırlanır; porsiyonlar normal bar kapasitesine ve tazelik kurallarına uyar.

| İçecek (ID) | Malzemeler / hazır ürün | İstasyon | Süre dk | Porsiyon | Maliyet | Fiyat | Brüt |

| --- | --- | --- | --- | --- | --- | --- | --- |

| Şişe meyve suyu (`bottled_juice`) | Hazır şişe: 6 G | ready | 0 | 1 | 6 G | 10 G | 4 G |

| Şişe limonata (`bottled_lemonade`) | Hazır şişe: 5 G | ready | 0 | 1 | 5 G | 9 G | 4 G |

| Çay (`tea`) | 1 Çay yaprağı, 1 Şeker | kettle | 20 | 4 | 9 G | 9 G | 27 G |

| Kahve (`coffee`) | 1 Kahve çekirdeği, 1 Süt | coffee_machine | 25 | 3 | 13 G | 14 G | 29 G |

| Taze elma suyu (`apple_juice`) | 2 Elma | juicer | 30 | 3 | 10 G | 12 G | 26 G |

| Orman meyvesi suyu (`berry_juice`) | 2 Orman meyvesi, 1 Şeker | juicer | 35 | 3 | 12 G | 13 G | 27 G |



**İçecekler:** Şişelenmiş meyve suyu ve limonata gün 1'de katalogda; üretilen içecekler çaydanlık (`kettle`), kahve makinesi (`coffee_machine`), pres (`juicer`) kurulduğunda açılır. Ortalama müşterilerin yaklaşık %40–50'si menüde varsa yemekten ayrıca içecek ister. İçecek yoksa olmayan ürüne sipariş oluşturulmaz.

## 15. Bar, menü, porsiyon ve tazelik

- Başlangıçta **1 yemek + 1 içecek slotu**, son sınır **4 yemek + 2 içecek slotu**. Her slot **12 porsiyon**; toplam fiziksel üst kapasite 72 fakat bir müşteri dalgasında 72 satış garantisi yoktur.
- Bir slot bir ürün tipi gösterir. Aynı tür ikinci partiyle doldurulabilir; kapasite aşılacaksa artan kısım kaybolmaz, hazır mutfak bekleme stokunda kalır. Başka tür ürün ancak boş ve uygun slota yerleştirilir.
- **Menü = fiziksel barda bulunan, taze, satışa uygun porsiyon**. `available = physicalOnBar − reserved − alreadyPickedUp` mantığı tek merkezden hesaplanır. Müşteri yalnız `available > 0` olan ürünlerden sipariş verir. Sipariş, miktarı bir kere ayırır.
- Rezerve porsiyon «satılabilir stok»tan düşer; servis edildiğinde rezervasyondan doğru masanın tabağına taşınır. Tahsilat yalnız müşteri öderken gerçekleşir; bir kez `paymentTransactionId` oluşturulur.
- Pişmiş yemek ve hazırlanmış içecekler normalde **2 tam oyun günü**, soğutma koşullarında **4 gün**; çiğ malzemeler ve hazır şişeler ilk sürümde bozulmaz. FIFO parti (`batchId`, `createdGameTime`, `expiryGameTime`) düzeyinde uygulanır.
- Aktif siparişe rezerve edilen porsiyon gün sonundaki hizmet veya iptal kararı verilene kadar korunur; iptalde ancak tazeyse satışa döner. Servis edilmiş yiyecek tekrar satılmaz.
- Menü çeşidi arttıkça küçük konfor/çeşitlilik katkısı vardır; menü çeşit sayısı müşteri talebini aşırı artırmaz.

## 16. Müşteri AI, masa, sipariş ve hizmet

**6 müşteri profili:** sıradan yolcu, demiryolu çalışanı, turist, yaşlı yolcu, iş insanı, aile grubu. Sabır, bahşiş, grup boyutu ve saat tercihleri farklı fakat aşırı olmayan çarpanlar kullanır. Bazı kasaba NPC'leri düzenli müşteri olur; sadakat 0–3 kademeyle küçük sabır/bahşiş bonusu, özel görev ve tekrar ziyaret ihtimali sunar.

**Durum makinesi:** `TRAIN_EXIT → WALK_TO_RESTAURANT → ENTRY_QUEUE → GREET_BY_PLAYER → TABLE_RESERVED → WALK_TO_SEAT → ORDER_READY → PLAYER_TAKES_ORDER → STOCK_RESERVED → PLAYER_PICKUP → PLAYER_DELIVERY → EATING → WAIT_PAYMENT → PLAYER_COLLECT_PAYMENT → LEAVING → TABLE_DIRTY → CLEAN`. İmkânsız stok/oturma/rota için `CANCEL/LEAVE` güvenli yan yol vardır. Bir müşteri aynı anda yalnız bir durumdadır.

**Karşılama:** Kapıdaki müşteri veya grup için oyuncu `E` basar, sistem o anda boş ve erişilebilir masaları vurgular, oyuncu masa seçer. Grup birden çok masaya bölünmez. Grup için gereken sandalyeler aynı masaya bağlı ve boş olmalıdır. En fazla **2 grup** kısa süre kapı kuyruğunda bekler.

**Sipariş:** Masadaki bütün grup üyeleri tek panelden alınır, fakat her ürün ayrı `lineItemId`, her müşteri ayrı aidiyet taşır. Yiyecek kendi stok ve bar slotundan ayrılır; içecek yalnız mevcutsa teklif edilir. Sipariş verildikten sonra menü sıfırlansa bile ayrılmış mevcut ürün teslim edilebilir.

**Teslimat:** Oyuncu bar tezgâhından servisi alır. Tepsisiz 1 ürün, 1. tepsi ile 2, gelişmiş tepsi ile 3 ürün taşır. Yanlış masaya veya mükerrer teslimat kabul edilmez. Grup üyelerinden biri ürününü alınca hemen yemeye başlayabilir; hepsinin servisini beklemez.

**Yemek ve ödeme:** Yeme animasyonu yaklaşık 15–25 oyun dakikası; tahsilat masada oyuncu tarafından yapılır. Tam ödeme bir kere kasaya geçer, bahşiş ayrı kaydedilir. Sonrasında müşteri görünür şekilde çıkar. Temizlik yapılmadan masa yeni müşteriye hazır sayılmaz.

**Temizlik:** Masa temizliği yaklaşık 1,5 gerçek saniye, leke temizliği ~1 saniye; zemin lekesi normal günde yaklaşık %20 olasılık, yağmurda giriş bölgesinde biraz fazla. Temizlik görevlisi ve oyuncu aynı kirli nesne üzerinde aynı anda işlem yapamaz.

**Rahat müşteri sabrı (oyun dakikası aralıkları):** kapıda 50–70, masada sipariş 60–85, serviste 75–110, ödemede 60–90. İlk tutorial müşterileri daha toleranslıdır. Tek kötü yorum büyük itibar cezasına dönüşmez.

## 17. Trenler, dalga yoğunluğu ve gar iş birliği

Trenler **09:00 / 15:00 / 21:00**; üç sefer dışında ek tren üretilmez. Tren 10 oyun dakikası önce görünür yaklaşır, 12 dk durur, kapılar açılır, yolcular gruplar halinde iner, bazıları kasabaya gider.

**Hedef restoran ziyaretçisi aralıkları:**

| Restoran aşaması | 09:00 | 15:00 | 21:00 |

| --- | --- | --- | --- |

| 1 | 2–3 | 2–4 | 2–3 |

| 2 | 3–4 | 4–5 | 3–4 |

| 3 | 4–6 | 5–7 | 4–5 |

| 4 | 5–7 | 6–8 | 4–6 |

| 5 | 6–8 | 7–9 | 5–6 |



Bu sayılar *potansiyel restoran ziyareti* hedefidir. Gerçek giriş fiziki oturma kapasitesi, kuyruğun iki grup sınırı, restoranın açık olması, hizmet limiti ve menü stokuyla sınırlanır. İleri aşamada 30+ sandalye olsa bile sürekli 30 aktif müşteri yaratılmak zorunda değildir; hedef yoğun dönemde yaklaşık 12–16 eşzamanlı oturandır.

**Gar İş Birliği:** 1 tanışıklık: sefer panosu; 2 güvenilir işletme: özel tren duyuruları ve görevler; 3 resmî ortak: prestijli gar kutlamaları ve dekor. Gar iş birliği ana tarif ilerlemesi için zorunlu değildir. Günlük yoğunluk bir gün önceden tahmini olarak panoda görülebilir.

**Özel tren etkinliği:** Haftanın 7, 14, 21. günlerinde seçilebilir; 28. gün festival önceliklidir; ilk 3 gün etkinlik yoktur; etkinlik bir gün önce duyurulur ve yalnız normal trenlerden birini güçlendirir.

| Etkinlik | Gerekli aşama | Mevsim | Hedef tren | Yolcu çarpanı | Bahşiş çarpanı |

| --- | --- | --- | --- | --- | --- |

| Turist Ekspresi | 2 | spring, summer, autumn | 15:00 | 1.35 | 1.15 |

| Demiryolu Çalışanları Günü | 1 | spring, summer, autumn, winter | 09:00 | 1.25 | 1.0 |

| Birinci Sınıf Yolcular | 3 | spring, summer, autumn, winter | 15:00 | 1.15 | 1.25 |

| Tatil Seferi | 2 | summer | 15:00 | 1.4 | 1.0 |

| Kış Yolculuğu | 2 | winter | 21:00 | 1.25 | 1.1 |



## 18. İtibar, memnuniyet, sadakat ve yorumlar

Başlangıç **itibar 50/100**. Müşterinin memnuniyet puanı ağırlıklar: **servis hızı %40**, **temizlik %20**, **ortam/dekor %15**, **menü çeşitliliği %15**, **mevsim konforu %10**. Şömine gerekmeyen havalarda sıcaklık kriteri nötr sayılır. Günlük itibar değişimi **−2 ile +2** aralığında; müşterisiz gün sahte kazanç veya kayıp üretmez.

**Unvan eşikleri:** 0–54 Unutulmuş Lokanta, 55–64 Yeniden Keşfedilen Mekân, 65–74 Kasabanın Sevilen Lokantası, 75–84 Ünlü Gar Restoranı, 85–100 Son Peron Efsanesi. Bunlar *fiziksel restoran gelişim aşamalarından ayrı* bir sistemdir.

**Yolcu Defteri:** Yorum şablonları gerçek deneyim olaylarından seçilir (yavaş servis, temiz salon, iyi dekor, soğuk ortam vb.); dış yapay zekâ API'si zorunlu değil. Düzenli müşteri sadakatinde küçük tekrar ziyaret, sabır, bahşiş veya özel görev etkileri olur; menüde olmayan özel yemek talebi oluşturulmaz.

## 19. Personel: sadece yardımcı roller

**Kesin yasak:** Çalışan oyuncunun yerine müşteriyi nihai olarak karşılayamaz, masayı kendisi seçemez, sipariş alamaz, masaya son servisi yapamaz, hesap tahsil edemez veya oyuncu başlatmadan kendi tarifini pişirip tamamlayamaz. Otomatik aşçı özelliği bu sürümden **çıkarılmıştır**.

**Roller:**

| Rol ID | Görünen ad | Temel günlük ücret | Yalnız izinli görevler |

| --- | --- | --- | --- |

| cleaner | Temizlik görevlisi | 15 | masa temizliği, zemin temizliği |

| service_helper | Servis yardımcısı | 18 | pişmiş ürünü bara taşıma, boş tabakları toplama |

| kitchen_helper | Mutfak yardımcısı | 22 | hazırlık süresini azaltma, depo düzenleme |

| host_helper | Karşılama yardımcısı | 18 | kapı kuyruğunu düzenleme, oyuncunun seçtiği masaya yönlendirme |



**Personel yer sınırı:** Restoran aşamaları **1/2/3/4/5 → 0/1/2/3/4 aktif personel**. İş ilanları aşama 2'de açılır. Listede aynı anda 5 aday, **7 günde bir** yenilenme; 12 kişilik havuz. Başlatılan vardiyanın ücreti **vardiya başında bir kez** ödenir; para yetmiyorsa vardiya pasif kalır. Aday görevlendirmesi serbest; çalışan devre dışı bırakmak ücretsizdir.

**Mutfak yardımcısı:** Oyuncu tarif üretimini başlatırken hazırlık süresini azaltır veya depodaki gerekli malzemenin hazır oluşunu kolaylaştırır, pişirme zamanlayıcısını başlatma kararı oyuncudadır. **Servis yardımcısı** sadece oyuncunun önceden belirlediği bar slotuna aynı ürün tipinden hazır porsiyon taşır; yeni menü türü seçmez.

**Örnek adayların tamamı:**

| Aday ID | İsim | Rol | Günlük ücret | Özellik |

| --- | --- | --- | --- | --- |

| cleaner_nermin | Nermin | cleaner | 15 G | hızlı masa temizliği |

| cleaner_duru | Duru | cleaner | 16 G | hızlı zemin temizliği |

| cleaner_tahir | Tahir | cleaner | 14 G | istikrarlı temizlik |

| service_mert | Mert | service_helper | 18 G | bar taşımacılığı |

| service_elif | Elif | service_helper | 19 G | tabak toplama |

| service_arda | Arda | service_helper | 17 G | ekonomik yardımcı |

| kitchen_sevimay | Sevimay | kitchen_helper | 22 G | malzeme hazırlama |

| kitchen_cem | Cem | kitchen_helper | 21 G | depo düzeni |

| kitchen_asli | Aslı | kitchen_helper | 23 G | hızlı ön hazırlık |

| host_irem | İrem | host_helper | 18 G | kapı düzeni |

| host_omer | Ömer | host_helper | 17 G | sıra takibi |

| host_pelin | Pelin | host_helper | 19 G | grup yönlendirme |



## 20. Crafting: mobilya, alet ve fiziksel onarım

Crafting, malzemeleri tek kez tüketir, bir ürün verir; tarifler ayrı `furniture` verisiyle açıklanır. Ürün envanterde bir adet/slot olur; alan uygunsa `B` ile serbestçe yerleştirilir. Artan malzeme varken ekstra altın ücreti istenmez. Üretim istasyonu etkileşimle açılır ve ana simülasyon menüde durur.

**38 mobilya/yapı parçası:**

| Aşama | Mobilya (ID) | Ayak izi (karo) | Malzemeler | Etki |

| --- | --- | --- | --- | --- |

| 1 | Basit ahşap masa (`simple_table`) | 2×2 | 4 Odun | 2-4 sandalyeye uygun masa |

| 1 | Ahşap sandalye (`wooden_chair`) | 1×1 | 2 Odun | 1 koltuk |

| 1 | Ahşap tabure (`stool`) | 1×1 | 2 Odun | 1 koltuk |

| 1 | Küçük sandık (`small_chest`) | 2×1 | 5 Odun | +12 depo slotu |

| 1 | Ahşap raf (`wooden_shelf`) | 1×2 | 6 Odun, 2 Taş | +12 depo slotu |

| 1 | Küçük saksı (`small_plant`) | 1×1 | 1 Odun, 2 Taş | dekorasyon |

| 1 | Ahşap çit (`wooden_fence`) | 1×1 | 2 Odun | dış mekân sınırı |

| 1 | Taş yürüyüş yolu (`stone_path`) | 1×1 | 2 Taş | zemin |

| 1 | Tarım yatağı (`garden_bed`) | 2×2 | 4 Odun, 2 Taş | +1 ekim alanı; toplam 20 |

| 2 | Büyük yemek masası (`large_table`) | 3×2 | 10 Odun, 3 Taş | kalabalık grup masası |

| 2 | Yuvarlak masa (`round_table`) | 2×2 | 6 Odun, 2 Metal parça | alternatif masa |

| 2 | Konforlu sandalye (`comfort_chair`) | 1×1 | 3 Odun, 1 Kumaş | 1 koltuk, +1 konfor |

| 2 | İkili bank (`double_bench`) | 2×1 | 5 Odun, 2 Metal parça | 2 oturma noktası |

| 2 | Büyük sandık (`large_chest`) | 2×2 | 10 Odun, 2 Metal parça | +24 depo slotu |

| 2 | Mutfak rafı (`kitchen_shelf`) | 2×1 | 7 Odun, 2 Metal parça | +16 depo slotu |

| 2 | Bar şişe rafı (`bar_bottle_shelf`) | 2×1 | 6 Odun, 2 Cam | dekorasyon; bar slotu eklemez |

| 2 | Küçük halı (`small_rug`) | 2×2 | 2 Kumaş | +1 konfor |

| 2 | Çerçeveli tablo (`framed_picture`) | 1×1 | 3 Odun, 1 Cam | duvar dekorasyonu |

| 2 | Bahçe bankı (`garden_bench`) | 2×1 | 6 Odun, 2 Taş | dış mekân dekorasyonu |

| 2 | Ahşap zemin döşemesi (`wood_floor`) | 1×1 | 1 Odun | zemin kaplama |

| 3 | Döşemeli ikili koltuk (`cushioned_sofa`) | 2×1 | 5 Odun, 2 Kumaş | 2 koltuk; konfor |

| 3 | Uzun ziyafet masası (`banquet_table`) | 4×2 | 12 Odun, 4 Metal parça | kalabalık grup masası |

| 3 | Büyük erzak dolabı (`pantry_cabinet`) | 2×2 | 12 Odun, 3 Metal parça | +24 depo slotu |

| 3 | Ayaklı lamba (`floor_lamp`) | 1×1 | 4 Odun, 1 Metal parça, 1 Cam | ışık ve dekor |

| 3 | Pencere perdesi (`curtain`) | 1×2 | 1 Odun, 2 Kumaş | duvar dekorasyonu |

| 3 | Askılık (`coat_rack`) | 1×1 | 5 Odun, 1 Metal parça | dekorasyon |

| 3 | Ahşap bölme (`wood_partition`) | 2×1 | 7 Odun, 1 Kumaş | salon bölme |

| 3 | Büyük saksı (`large_plant`) | 2×1 | 3 Odun, 5 Taş | +1 konfor |

| 3 | Kitaplık (`bookshelf`) | 2×1 | 8 Odun, 2 Metal parça | dekorasyon |

| 3 | Çiçek yatağı (`flower_bed`) | 2×1 | 4 Odun, 2 Taş | dış mekân |

| 3 | Odunluk (`woodshed`) | 2×1 | 5 Odun | depolama ve dekorasyon |

| 3 | Taş zemin döşemesi (`stone_floor`) | 1×1 | 2 Taş | zemin kaplama |

| 4 | İşlemeli sandalye (`ornate_chair`) | 1×1 | 4 Odun, 1 Kumaş, 1 Metal parça | 1 koltuk, +2 konfor |

| 4 | Duvar saati (`wall_clock`) | 1×1 | 4 Odun, 2 Metal parça, 1 Cam | duvar dekorasyonu |

| 4 | Büyük avize (`chandelier`) | 2×2 | 8 Odun, 3 Metal parça, 2 Cam | ışık ve dekor |

| 4 | Bahçe lambası (`garden_lamppost`) | 1×1 | 5 Odun, 2 Metal parça, 2 Cam | dış aydınlatma |

| 4 | İşlemeli restoran tabelası (`ornate_sign`) | 2×1 | 8 Odun, 2 Metal parça, 1 Cam | dış mekân tabela |

| 4 | Duvar kâğıdı paketi (`wallpaper_pack`) | 1×4 | 1 Kumaş | 4 duvar hücresi kaplama |



**Servis taşıma aletleri:**

| Alet | Aşama | Malzemeler | Taşıma kapasitesi |

| --- | --- | --- | --- |

| Servis tepsisi | 2 | 4 Odun, 1 Metal parça | 2 |

| Gelişmiş servis tepsisi | 3 | 6 Odun, 2 Metal parça | 3 |



**Kaynak toplama:** Küçük ağaç 3 vuruşta **6 odun**, 3–4 günde yenilenir; kaya 2 vuruşta **3 taş**, 4–5 günde yenilenir; mantar 1–2, yabani meyve 1–3 adet, 2–3 gün aralığında yenilenir. Kaynakların yeniden doğuşu sahne değişimlerinden bağımsız takip edilir.

## 21. Satın alınan üretim ekipmanları ve bar modülleri

Ekipman için para siparişte, kurulum malzemesi yerleştirmede düşer. Ekipman teslimat kutusunda bekler; yerleştirmeden tarif kilidi açılmaz. Ekipman uygun her erişilebilir zemine konabilir.

| Aşama | Ekipman ID / ad | Fiyat (G) | Kurulum kaynakları | İşlev |

| --- | --- | --- | --- | --- |

| 2 | second_stove — İkinci ocak | 120 | 6 Odun, 8 Taş | Yeni tekil pişirme istasyonu |

| 2 | kettle — Çaydanlık | 90 | 4 Odun, 3 Taş | Çay üretimi |

| 2 | basic_oven — Basit fırın | 260 | 8 Odun, 10 Taş | Fırın yemekleri |

| 2 | better_prep — Gelişmiş hazırlık tezgâhı | 180 | 12 Odun, 6 Taş | Tarif hazırlama süresini 4 dk -> 3 dk |

| 2 | food_bar_2 — İkinci yemek bar modülü | 150 | 10 Odun, 4 Taş | +1 yemek slotu |

| 2 | drink_bar_2 — İkinci içecek bar modülü | 130 | 8 Odun, 2 Cam | +1 içecek slotu |

| 2 | fireplace — Şömine | 220 | — | 1 odun 4 oyun saati ısı sağlar |

| 3 | large_pan — Büyük tava | 190 | 8 Odun, 4 Taş, 1 Metal parça | Köfte ve balık tava |

| 3 | coffee_machine — Kahve makinesi | 210 | 6 Odun, 2 Metal parça | Kahve üretimi |

| 3 | juicer — Meyve presi | 180 | 5 Odun, 2 Metal parça | Taze içecek üretimi |

| 3 | refrigerator — Soğutucu dolap | 380 | 10 Odun, 2 Metal parça, 2 Cam | Saklama süresi 2 günden 4 güne |

| 3 | food_bar_3 — Üçüncü yemek bar modülü | 270 | 14 Odun, 3 Metal parça | +1 yemek slotu |

| 4 | advanced_stove — Gelişmiş ocak | 480 | 10 Taş, 3 Metal parça | Gar kebabı ve gecenin güveci |

| 4 | food_bar_4 — Dördüncü yemek bar modülü | 450 | 18 Odun, 4 Metal parça | +1 yemek slotu |



**Bar sınırı:** Başlangıçta yemek 1, içecek 1; `food_bar_2` +1 yemek, `food_bar_3` +1 yemek, `food_bar_4` +1 yemek; `drink_bar_2` +1 içecek. Şömine 1 odunla yaklaşık dört oyun saati ısı verir, odun yoksa restoran çalışmaya devam eder. Ocak yakıtı başlangıçta ücretsizdir.

## 22. Restoran gelişimi ve restorasyon projeleri

İlerleme ana hikâye görevlerine değil **kümülatif ödemesi alınmış müşteri sayısı**, kaynak ve altın koşullarına bağlıdır. Projeyi tamamlamak, erişim alanını ve sonraki ekipmanları açar. İşler ertesi sabah görünür hale gelir. Aşama hedef günleri bağlayıcı değildir.

| Aşama sonrası | Proje ID | Ödemeli müşteri eşiği | Altın | Malzemeler | Açılan alan |

| --- | --- | --- | --- | --- | --- |

| 2 | salon_expansion_1 | 12 | 300 G | 20 Odun, 10 Taş | north_lounge |

| 3 | salon_expansion_2 | 70 | 950 G | 35 Odun, 18 Taş | west_dining |

| 4 | salon_expansion_3 | 220 | 2400 G | 55 Odun, 30 Taş, 4 Metal parça | east_kitchen |

| 5 | salon_expansion_4 | 500 | 5200 G | 80 Odun, 40 Taş, 8 Metal parça | southeast_hall |



**İsteğe bağlı renovasyonlar:**

| Gerekli aşama | Proje ID / ad | Altın | Kaynak |

| --- | --- | --- | --- |

| 2 | façade_renewal — Restoran dış cephe yenilemesi | 100 G | 8 Odun, 6 Taş |

| 3 | kitchen_expansion — Mutfak genişletme | 480 G | 18 Odun, 12 Taş |

| 3 | storage_expansion — Depo oda genişletme | 420 G | 15 Odun, 8 Taş |

| 3 | railway_sign_repair — İstasyon tabelası restorasyonu | 650 G | 22 Odun, 10 Taş |

| 4 | terrace — Bahçe terası | 720 G | 22 Odun, 12 Taş |



**Yapı aşamaları ve müşteri kapasitesi:** 1 Harabe Lokanta (4 oturma), 2 Yenilenen Restoran (8–10), 3 Büyüyen Lokanta (12–16), 4 Ünlü Gar Restoranı (20–24), 5 Son Peron (30+). Bunlar *hedef yerleşimlerdir*, yapay sert oturma sınırları değil; erişilebilir gerçek sandalye sayısı kullanılabilir kapasiteyi belirler.

**Tadilat çakışması:** Aynı alanı açan proje yalnız bir kez tamamlanır. Görev ödülü, restorasyon faturası veya sabah işleme aşamalarında proje ID'si idempotent ele alınır. Oyuncunun koyduğu nesneler silinemez.

## 23. Kasaba, NPC rutinleri, dükkân ve dere

**Peronova:** Restoran-orman-gar çevresi tek açık alan; kasaba meydanında bakkal/marangoz/bahçıvan, istasyon müdürü ve konuşulabilir NPC'ler; dere kenarı küçük yan faaliyet alanı. NPC'lerle yakınlıkta `E` ile konuşulur; önemli karakter konumları haritada gösterilebilir.

| Karakter | Rol | Günlük rutin | Görev teması |

| --- | --- | --- | --- |

| Kemal | gar müdürü | 06–08 ofis; 08:30/14:30/20:30 peron; kalan gündüz ofis | gar ve seferler |

| Feriha | bakkal | 08–18 dükkân; akşam ev/ara sıra lokanta | acil tedarik |

| Rıza | marangoz | 09–18 atölye; gün sonu meydan | mobilya planları |

| Şirin | bahçıvan | 08–16 bahçe/sera; akşam meydan | tarım |

| Sevim | emekli aşçı | 11–16 meydan/ev; bazı günler restoran | eski tarif defteri |

| Rana | gezgin gazeteci | belirli ziyaret günlerinde 15:00 treniyle gelir, meydan/restoran | itibar ve haber |



**Dere kenarı — kapsamı kontrollü:** Aşama 2 ile açılır. **Olta 75 G**, günde en fazla **4 atış**; `E` ile at → **2–4 gerçek saniye** bekle → **1 saniyelik** tepki penceresinde `E` → yaklaşık **%80** temel başarı → **1 fish** malzemesi. Başarısızlıkta yalnız günlük atış hakkı gider, olta kaybolmaz. Balık her zaman posta kataloğundan satın alınabilir; balıkçılık ana hikâye için zorunlu değildir.

## 24. Görevler ve beş bölümlük hikâye

**Hikâye + sandbox:** Beş bölümde toplam **15 ana görev**, ayrıca **10 yan görev şablonu**, **8 günlük görev şablonu**. Ana görev süre sınırı yok, ilerleme görev ID'siyle bir kez ödüllendirilir. Aktif sınır: 1 ana hikâye + 2 günlük + 2 kasaba/gar + 1 etkinlik görevi.

**Ana hikâye görevlerinin tamamı:**

| ID | Bölüm | Görev | Önkoşul | Hedefler | Ödül |

| --- | --- | --- | --- | --- | --- |

| story_01 | 1 | Miras Mektubu | — | read_heirloom_letter | 0 G |

| story_02 | 1 | Tozlu Sandık | story_01 | open_starter_chest, collect_wood_15, collect_stone_5 | 0 G |

| story_03 | 1 | İlk Onarım | story_02 | repair_entrance, repair_workbench, craft_table_1, craft_chairs_2, repair_stove, place_table_and_chairs, place_first_mail_order, sleep_day1 | 0 G + memory_photo |

| story_04 | 2 | İlk Misafirler | story_03 | collect_first_delivery, make_vegetable_soup, stock_bar, serve_first_2_customers, collect_payment_2, clean_first_table | 40 G |

| story_05 | 2 | Garın Dostları | story_04 | speak_stationmaster, inspect_timetable, complete_1_daily_task | 60 G |

| story_06 | 2 | Kaybolan Tarifler | story_05 | speak_sevim, cook_3_distinct_recipes | 80 G + recipe_book_podium |

| story_07 | 3 | Eski Fotoğraf | story_06 | visit_town_square, talk_to_3_named_npcs | 85 G + heirloom_clock |

| story_08 | 3 | Yolculardan Hikâyeler | story_07 | finish_25_paid_customers_after_quest_start | 110 G |

| story_09 | 3 | İstasyonun Anısı | story_08 | complete_one_station_request, repair_old_gar_noticeboard | 140 G + old_station_sign |

| story_10 | 4 | Gazetecinin Ziyareti | story_09 | meet_rana, reach_reputation_65 | 180 G |

| story_11 | 4 | Uzun Masa Günü | story_10 | serve_one_party_of_3_or_more, serve_2_different_foods_in_a_day | 220 G |

| story_12 | 4 | Özel Sefer | story_11 | successfully_serve_5_customers_during_1_train_event | 240 G |

| story_13 | 5 | Son Peron Hazırlığı | story_12 | reach_restoration_stage_4, serve_8_customers_in_one_day | 300 G |

| story_14 | 5 | Eski Lokanta, Yeni Hayat | story_13 | reach_reputation_80, complete_2_renovation_projects | 350 G |

| story_15 | 5 | Yeniden Açılış | story_14 | host_grand_station_celebration, finish_10_paid_customers_during_celebration_or_next_2_days | 500 G + final_plaque |



**Kasaba yan görevlerinin tamamı:**

| ID | NPC | Başlık | Tür | Hedef | Altın |

| --- | --- | --- | --- | --- | --- |

| side_grocer_supply | Feriha | Acil Malzeme | delivery | {'potato': 3} | 35 |

| side_carpenter_wood | Rıza | Marangozun Siparişi | delivery | {'wood': 10} | 30 |

| side_gardener_carrot | Şirin | Taze Hasat | harvest | {'carrot': 4} | 45 |

| side_sevim_soup | Sevim | Sıcak Bir Kâse | serve_product | {'vegetable_soup': 5} | 55 |

| side_stationmorning | Kemal | Sabah Seferi | successful_service_train | {'hour': '09:00', 'count': 4} | 65 |

| side_stationevening | Kemal | Gece Seferi | successful_service_train | {'hour': '21:00', 'count': 3} | 60 |

| side_rana_review | Rana | Güzel Bir Yazı | average_satisfaction | {'min': 80, 'customers': 5, 'within_days': 3} | 100 |

| side_grocer_berries | Feriha | Orman Meyveleri | delivery | {'wild_berries': 5} | 45 |

| side_carpenter_stone | Rıza | Duvar Tamiri | delivery | {'stone': 8} | 35 |

| side_gardener_beds | Şirin | İlk Bahçe | build | {'garden_bed': 2} | 60 |



**Günlük görevlerin tamamı:**

| ID | Görünür ad | Sayaç | Hedef | Altın |

| --- | --- | --- | --- | --- |

| daily_serve_3 | 3 müşteriye hizmet ver | serve_customers | 3 | 18 |

| daily_serve_6 | 6 müşteriye hizmet ver | serve_customers | 6 | 32 |

| daily_soup_4 | 4 çorba porsiyonu sat | sell_vegetable_soup | 4 | 24 |

| daily_drinks_3 | 3 içecek sat | sell_drinks | 3 | 20 |

| daily_clean_3 | 3 masa temizle | clean_tables | 3 | 18 |

| daily_harvest_2 | 2 ürün hasat et | harvest_crops | 2 | 24 |

| daily_chop_6 | 6 odun topla | gather_wood | 6 | 15 |

| daily_tip_2 | 2 bahşiş kazan | earn_tips | 2 | 25 |



Günlük iki görev yalnız oynanabilir/mevcut becerilerden seçilir; uyku sonrası yenilenir, aynı anda mükerrer olmaz. Teslimat ve satış görevleri gerçek ekonomik olaya bağlı güncellenir, aynı işleme iki kez sayaç eklenmez. Hikâyenin dekor ve tarif alternatifleri restorasyon için zorunlu değildir.

## 25. Mevsimler, hava, konfor ve festivaller

**Takvim:** 4 mevsim × 28 gün = 112 gün. İlkbahar→Yaz→Sonbahar→Kış→bir sonraki yılın İlkbaharı. Sabah hava türü mevsim ağırlıklarından seçilir. Hafif görsel değişim, tarımda sulama ve müşterilerin tercihleri/konforu üzerinde küçük etkiler yaratır; tren saatlerini değiştirmez.

| Mevsim | Açık | Bulutlu | Yağmur | Fırtına | Kar | Tipi |

| --- | --- | --- | --- | --- | --- | --- |

| spring | 45% | 25% | 25% | 5% | 0% | 0% |

| summer | 65% | 20% | 12% | 3% | 0% | 0% |

| autumn | 25% | 30% | 35% | 10% | 0% | 0% |

| winter | 15% | 30% | 0% | 0% | 45% | 10% |



**İklim etkileri:** İlkbaharda ılıman, yazın içecek ve turist eğilimi, sonbaharda yağmur/orman, kışın soğuk ve şömine. Isı, basitleştirilmiş bir konfor değeri olarak modellenir; konfor düşüşü oyunu kilitlemez. Yağmur tarımı otomatik sular. İç mekânın ışığı sabah/öğle/akşam/gece geçişlerini takip eder.

**Festivaller:** Dört mevsimin son günü (**28, 56, 84, 112. günler**); sonraki oyun yıllarında tekrar eder ve bir gün önce duyurulur. Gün 28 haftalık etkinlik yerine festival gelir. Katılmamak kalıcı kilit oluşturmaz.

| Festival | Mevsim / gün | Ödül kozmetik ID | Odak |

| --- | --- | --- | --- |

| Çiçek Festivali | spring / 28 | spring_flower_wreath | garden_and_decoration |

| Gar Şenliği | summer / 28 | summer_station_pennant | tourist_service |

| Hasat Panayırı | autumn / 28 | autumn_harvest_basket | farming_and_cooking |

| Fener Gecesi | winter / 28 | winter_lantern | warmth_and_evening_service |



**Özel kozmetik ödüllerin tamamı (38 üretilebilir mobilyaya ek 9 benzersiz nesne):**

| ID | Ad | Tür | Kaynak |

| --- | --- | --- | --- |

| memory_photo | Restoranın İlk Fotoğrafı | wall_decor | story_03 |

| recipe_book_podium | Eski Tarif Defteri Standı | floor_decor | story_06 |

| heirloom_clock | Miras Saat | wall_decor | story_07 |

| old_station_sign | Eski Gar Hatırası | wall_decor | story_09 |

| final_plaque | Son Peron Onur Plaketi | wall_decor | story_15 |

| spring_flower_wreath | Bahar Çelengi | wall_decor | flower_festival |

| summer_station_pennant | Gar Şenliği Flaması | wall_decor | station_fair |

| autumn_harvest_basket | Hasat Sepeti | floor_decor | harvest_fair |

| winter_lantern | Fener Gecesi Lambası | floor_light | lantern_night |



## 26. UI/UX, ses ve 16-bit varlık standardı

**HUD yerleşimi:** Sol üst tarih/mevsim/hava/saat; üst orta yaklaşan tren; sağ üst altın/itibar; sağda yalnız aktifken açılan sipariş listesi; altta 8 slot; küçük görev özeti ve AÇIK/KAPALI durumu. Bütün metinler Türkçe, Türkçe karakterler UTF-8 ile doğru gösterilir.

**Panel tasarım dili:** Koyu ahşap, soluk kâğıt, krem yazı, küçük metal vurgular, okunabilir piksel fontları. Envanter, yemek kitabı, crafting, posta, görevler, kasaba haritası, personel, restorasyon, gün sonu raporu ve ayarlar birbirleriyle tutarlı panel sistemi kullanır. Simgeler yalnız renge bağlı değildir.

**Görseller:** 32×32 zemin karo, yönlü karakter sprite atlasları, ayak iziyle ayrıştırılmış mobilya görselleri, 4 mevsim varyantları. Tren lokomotif + vagon + kapı + hareket/duman animasyonuna, ocak buhar animasyonuna, şömine alev animasyonuna sahiptir. Placeholder kare/renkli kutu kritik varlıkların teslim şekli olamaz.

**Ses:** Sabah/öğle/akşam/gece için özgün cozy melodik katmanlar; tren fren/düdük, tabak, ayak sesi, doğrama, yağmur, kar, orman, alet, para ve UI sesleri. Ücretli API veya telifli müzik zorunlu değil; özgün Web Audio üretimi kullanılabilir. Tarayıcı ses kilidi ilk kullanıcı etkileşimiyle açılır. Ana/müzik/ortam/efekt sesleri ayrı ayarlanabilir.

**Kalite:** 60 FPS hedefi; azaltılmış efekt modu, kapatılabilir sarsıntı, yeniden atanabilir kontroller (zaman uygunsa), yeterli kontrast ve ayarlanabilir metin. Sprite ölçeklemede en yakın komşu (nearest-neighbor) gerekir.

## 27. Teknik mimari ve tek simülasyon otoritesi

**Önerilen proje:** Phaser 3 + JavaScript (modern ES modülleri) + Vite. Kod `.js` modüllere bölünür, ürün veri tabloları `src/data`, dünya verisi `src/world`, temel simülasyon `src/systems`, UI `src/ui`, varlıklar `public/assets`, üretim betikleri `tools` altındadır. Tarayıcıda offline çalışabilir; üretimde internet/ücretli API zorunluluğu bulunmaz.

**İşlem sıralaması:** `GameClock` olayları dağıtır → dünya/sahne mantığı → yemek/teslimat/tren sistemleri → müşteri ve personel durum makinesi → ekran/animasyon. Tekil olay kimlikleri sipariş, teslimat, vardiya, görev ödülü ve bina tamamlama için bir kez işleme garantisi sağlar.

**Önerilen veri alanları:** `WorldState{day,minute,season,weather,scene,flags}`, `PlayerState{appearance,pos,inventory,equipped,carry}`, `StockBatch{batchId,itemId,qty,origin,createdAt,expiresAt,reservedBy}`, `Order{orderId,groupId,items,status,paymentTransactionId}`, `Customer{customerId,profile,patience,tableId,state}`, `FurnitureInstance{instanceId,typeId,scene,x,y,rotation,storageId}`, `StaffInstance{candidateId,activeShift,assignedTask}`, `Delivery{deliveryId,items,charged,received}`, `QuestProgress{questId,counters,claimed}`.

**Kayıt:** IndexedDB birincil, JSON dışa/içe aktarım ve sürüm bilgisi. Kayıt anında tutarlı dünya anlık görüntüsü; kayıt yüklenince öğeler/teslimatlar yeniden çoğaltılmaz. Bozuk sürüm veya hasarlı JSON güvenli hata verir. Sabah otomatik kayıt, uyku geçişi kaydı, menüden manuel kayıt. Kaydetme durumunda üretim, stok rezervasyonu, taşınan servis ve NPC durumları tamdır.

**Sahne dışı mantık:** Görünmeyen sahnelerde grafik sprite gerekmeksizin olay/zaman mantığı çalışır. A* yeni hedefte veya rota bozulduğunda; her kare tüm NPC'lerde aranmaz. Görünür varlıklar ve parçacıklar öncelikli çizilir; uzak sahne animasyonları azaltılır.

**Kod veri sözleşmesi:** Tarif, ürün, mobilya, ekipman, müşteri, görev, etkinlik ve fiyat tablosu sabit anahtarlarla okunur. Kod özel yemek ismine göre dallanmamalıdır. Asset manifesti aynı ID'leri kullanır.

## 28. İlk yıl ve uzun vadeli ilerleme hedefi

Aşağıdaki gün aralıkları **tasarım temposudur**, zorunlu koşul veya simülasyon sonucu değildir:

| Yaklaşık dönem | Hedef |
|---|---|
| Gün 1–3 | Tutorial, ilk çorba, ilk servis, serbest oynanışa geçiş |
| Gün 4–10 | Başlangıç tarifleri, serbest dekor, ilk salon genişlemesine yaklaşma |
| Gün 11–25 | Yeni ocak, bar/tezgâh, fırın, ilk yardımcı çalışan, ilk festival |
| Gün 26–50 | Orta seviye tarifler, daha büyük salon, özel seferler |
| Gün 51–80 | Gelişmiş yemekler, kasaba ilişkileri ve restorasyon |
| Gün 81–112 | Kış ısınması, Fener Gecesi, dekorasyon ve serbest hedefler |
| Gün 113+ | Süresiz sandbox, toplama, satış, festivaller, dekor ve rekorlar |

**Gelir tasarım aralıkları** (satış tutarı, kâr değil): aşama 1 günlük 70–130 G; aşama 2 130–250; aşama 3 250–500; aşama 4 500–900; aşama 5 800–1400. Bu rakamlar **ölçülmüş test sonucu değildir**. Nihai dengelemede gerçek müşteri sayısı × menü fiyatı × hizmet tamamlama oranıyla doğrulanmalıdır.

## 29. Veri tutarlılığı, teknik riskler ve uzlaştırma

**Kaynak önceliği:** (1) kullanıcının kesin kararları; (2) bu v1.0 belgesinin çelişki çözen kuralları; (3) v0.9 görev/etkinlik/özel sistemleri; (4) v0.8 harita/akış; (5) v0.7 ekonomi/içerik tabloları. Bir kaynakta bulunan tablo diğer kaynakta yok diye silinmez.

**Özel uzlaştırmalar:**

1. **Personel A:** Tam otomatik aşçı ve otomatik sipariş/ödeme yasaktır. `staff_system` yalnız destek rolleridir.
2. **Mobilya A:** Tamamen serbest mobilya/ekipman yerleşir, ancak sabit yapı duvarları ve açılmamış kanatlar düzenlenmez.
3. **Hikâye C:** Tarifin alternatif hikâye ödülü müşteri koşulunu esnetebilir, fiziksel ekipman/aşama koşulunu atlayamaz; ana restorasyon doğrudan hikâye görevine bağlanmaz.
4. **Gün 1 / tren:** Tren atmosferi çalışabilir, fakat ilk gün restoran kapalıdır. 2. gün pişirme tutorialı gerektiği kadar zamanı durdurur, normal sefer saatleri kaydırılmaz.
5. **Salon 3 ID / doğu mutfak:** `salon_expansion_3` teknik ID korunur, v0.8'in doğu mutfak kanadı fiziki açılım olarak uygulanır.
6. **İlk koltuklar:** Başlangıçta sağlam bir iki kişilik eski masa vardır; tutorialla ek masa ve iki sandalye → 4 oturma.
7. **Bakkal satış fiyatı:** Gıda kalemleri satılabilir olsa da bakkalda her gıda otomatik satılmaz; ayrı ürün listesi ve satış kuralları gerekir. Kaynak satışı oyunu yeniden başlatma yoludur.
8. **Menü ve iptaller:** Rezervasyon, stok ve para hareketi bir kez işlenir; stok teslim edilmeden paraya dönüşmez; servis edilip ödenmemiş yemek yeniden satılamaz.
9. **Gelişim takvimi:** 500 müşteri eşiği olan son aşamanın belirli bir güne kilitlenmesi yoktur; dönemler tavsiyedir.
10. **Görev ve festival:** Birden fazla ekranda aynı ödül bildirimi görünebilir, fakat ödeme/takvim ödülü işlem düzeyinde yalnız bir kez yapılır.
11. **Tazelik:** Aynı ürünün eski/yeni parti stoğu ayrı `batchId` ile izlenir. Ürün rezervasyonu/oyuncunun eline alma FIFO ve tazelik kontrolüyle tutarlı çalışır.
12. **Kapanış:** 23:00'te saat durur, ancak kapanışta devam eden müşteri animasyon/işlem saatleri ayrı, sınırlı gerçek zamanlı düzenle çözülür; yeni gelir üretmek için sonsuz yeni müşteri doğmaz.

**Tek sefer üretim riskleri:** çok sayıda özgün sprite, tutarlı 4 yön animasyon, serbest mobilya + yol bulma, stok rezervasyonları, sahne dışı simülasyon, kayıt tutarlılığı ve kapanış. Risk azaltma: modüler ortak sistemler, statik veri tabloları, yeniden kullanılabilir karakter rig'i, birim/integrasyon testleri. Eksik test geçen paket `tamamlandı` diye etiketlenemez.

## 30. Kabul testleri ve «tamamlandı» tanımı

Aşağıdaki 30 senaryo **tasarlanmıştır, çalıştırılmış test raporu değildir**. İleride oluşturulacak oyun üzerinde uygulanır.

1. T1: 1. gün en az 15 wood ve 5 stone toplayarak tüm başlangıç onarımları eksiksiz ve bir kez tamamlanır

2. T2: Tutorial 44 G siparişi 100 G başlangıç parayı 56 G yapar; 06:00 teslimatı çift oluşmaz

3. T3: 2. gün 2 müşteri ilk çorbadan sipariş verir, stok rezervasyonu, servis, ödeme bir kez olur

4. T4: Aynı son porsiyona iki müşteri eşzamanlı erişemez

5. T5: Yalnız menüdeki ürünler sipariş edilebilir; boş barda müşteri doğru şekilde ayrılır veya beklemez

6. T6: Yemek dolu bara getirildiğinde ürün kaybolmaz; taşıma ve mutfak hazır stoku tutarlı kalır

7. T7: Oturma yeri kapalı veya erişilemezse oyuncuya hata verilir, envanter kaybı yaşanmaz

8. T8: Mobilya serbest döndürme ve yerleştirme, dört yön çarpışma ve etkileşim noktalarını günceller

9. T9: Grup siparişi tek panelde alınır; her porsiyon ayrı servis edilir ve doğru masaya bağlanır

10. T10: 23:00 sonrası yeni tren ve müşteri doğmaz, serviste kalanlar kapanış modunda tamamlanır

11. T11: Erken uyku iptalinde sipariş rezervasyonu serbest kalır; servis edilmiş ama tahsil edilmemiş yemek bedeli gelir yazılmaz

12. T12: Personel hiçbir zaman son servis, sipariş alma, ödeme işlemi yapmaz; vardiya ücreti günde bir kez düşer

13. T13: Satın alınan mutfak ekipmanı yalnız kurulduktan sonra yeni tariflere izin verir

14. T14: Tarif kilitleri aşama/müşteri/eşya koşulları tamamlanınca ve yeniden kayıt açılınca tutarlı kalır

15. T15: 4 mevsim ve 112 gün sonunda yıl sayacı doğru ilerler, etkinlikler tekrarlanır

16. T16: Etkinlik bir gün önce duyurulur ve yalnız mevcut üç tren saatinden birini etkiler

17. T17: Restorasyon alanı açılırken içerideki mobilyalar kaybolmaz, kayıtlı konumlar korunur

18. T18: Kayıt döngüsü sipariş, ödeme ve envanter mükerrerliği oluşturmaz

19. T19: Bakkal/posta satın alma ve kaynak satışları negatife düşmeyen para, tekrar satılamayan eşya üretir

20. T20: İflastan kurtulmak için ücretsiz odun/taş toplanıp satışla temel sebze siparişi verilebilir

21. T21: 30 gün hızlandırılmış testte bekleyen sipariş ve müşteri nesneleri sonsuza dek takılmaz

22. T22: Kış şöminesi kısa süreli ısı sağlar, odunsuz durumda oyun devam eder

23. T23: Aktif müşteri siparişleri ve oyuncu taşıma durumu ekran değişimlerinde korunur

24. T24: Tarım ekim/sulama/yağmur/hasat döngüsü offscreen ve kayıt geri yükleme ile tutarlı işler

25. T25: Görev ödülleri bir defa verilir; gündelik görevler her uyku sonrası uygun listeden seçilir

26. T26: Festival görevleri kaçırıldığında temel oyun kilitlenmez, sonraki yıl yeniden görünür

27. T27: Dere kenarı balıkçılığı hiç yapılmadan balık tava, katalogdan alınan fish ile yapılabilir

28. T28: Kayıt JSON dışa/içe aktarımında sürüm doğrulaması ve bozuk dosya güvenli hata mekanizması çalışır

29. T29: Türkçe UTF-8 karakterleri bütün paneller ve kayıt dönüşümlerinde bozulmaz

30. T30: Eksik asset fallback ile raporlanır; teslimde kritik etkileşim ve animasyonlarda placeholder kalmaz



**İlave bütünleştirme kontrolleri (v1.0):**

31. Tüm 15 yemek ve 6 içecek için `input × fiyat = maliyet`, `porsiyon × satış = hasılat`, brüt kazanç ve station unlock otomatik testleri yeşil olmalı.
32. Tüm 38 mobilya, 14 ekipman, 2 araç ve 9 özel kozmetik için benzersiz ID, asset manifesti ve yere geçerli yerleştirme/rotasyon verisi olmalı.
33. Gün 1 → 2 → 3 kesintisiz oyuncu kontrolüyle, varsayılan stok/harita ile «oyun kilitlenmeden» tamamlanmalı.
34. Bir tren günü, yoğun restoran ve orman dış-sahne geçişleri sırasında müşteri/sipariş/aktif pişirme kaybolmamalı.
35. Kapanışta erken uyku, ödeme öncesi ayrılma ve grup siparişi iptallerinde para ve stok bütünlüğü korunmalı.
36. 112 gün sonra mevsimlerin devam ettiği ikinci yıl gün 1 ve festivaller doğrulanmalı.
37. Eksik PNG, ses veya atlas varsa sistem geliştirmede rapor etmeli; nihai teslimde kritik nesnelerde gerçek asset bulunmalı.
38. Ücretsiz/çevrimdışı kullanımda oyun; ücretli API, telifli sprite veya çevrimiçi hesaba zorunlu bağımlılık olmaksızın açılmalı.

**Tamamlanmış sayılma şartı:** `npm install` + `npm run dev` ile açılabilen tarayıcı oyunu, varlıkların doğru yüklenmesi, iki günlük tutorial, normal restoran döngüsü, tüm kilitli içeriklerin açılabilir olması, kayıt/yükleme ve ekonomik/AI bütünlük testlerinin raporlanması. Yapılamayan test «geçti» diye yazılmaz. Otomatik araçlara erişim yoksa doğrulanmayan bölüm açıkça bildirilir.

## 31. v1.0 veri sözleşmesi ve geliştiriciye notlar

`Son_Peron_v1_0_Birlesik_Oyun_Verileri.json` dosyası, v0.7 ekonomi + v0.8 harita + v0.9 görev/etkinlik bilgilerini **kaynakları silmeden** tek veri kökünde taşır. Belge, bu JSON ile birlikte kullanılmalı. `canonical` bölümündeki çelişki düzeltmeleri eski adlandırmaları yorumlamak içindir; ham kaynak dizilerinin aynen varlığı bu nedenle korunur.

**Plan tamamlandı, nihai üretim promptu HENÜZ hazırlanmadı.** GDD, kullanıcının bir sonraki isteğinde tek kapsamlı Claude Fable promptuna dönüştürülebilir. Bu aşamada yeni karmaşık sistem eklenmemeli; yalnız gerçek testte saptanan tutarsızlıklar düzeltilmelidir.
