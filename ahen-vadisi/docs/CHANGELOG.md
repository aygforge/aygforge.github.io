# Değişiklik Günlüğü

## 3.0.0 — «Kayıp Krallığın Mirası» (Lv. 31–40)
Ayrıntılar, denge tablosu ve bilinen sınırlamalar: [`V3_NOTLARI.md`](V3_NOTLARI.md).

**Kayıt ve ilerleme**
- Şema 3. V2 (ve V1) kayıtları otomatik, kayıpsız açılır; geçişten önceki kayıt `v2_backup` olarak saklanır ve Ayarlar →
  Yedekler'den geri yüklenebilir. Yeni görevler "yapılmamış" görünür; hiçbir alan sıfırlanmaz.
- Seviye sınırı 40 (30→40: 64.880 … 142.450 EXP, toplam 1.006.820). Her seviyede +3 stat, +1 beceri puanı devam eder.

**Dünya** (8 → 11 harita)
- **Ölü Krallık** (120×88, Lv.30–35): Yas Mezarlığı, Kırık Okçular Mevzii, Harap Garnizon, Sessiz Şapel; Sisli Meydan'ın
  terk edilmiş evleri, Yas Şapeli (güvenli), Komutanın Mezarı, Siyah Kapı, 2 gizli sandık, Karanlık Cevher / Yas Otu, Yol Taşı.
- **Kara Taht** (124×92, Lv.35–40): Kara Nöbet Avlusu, Gölgeli Geçit, Cellat Meydanı, Hiçlik Mabedi; Son Nöbet Yeri (güvenli),
  Kraliyet Avlusu heykelleri, üç kraliyet mührü, Taht Basamakları, 2 gizli sandık, Ruh Kristali / Obsidyen Damarı, Yol Taşı.
- **Karanlık Mahzen** (solo zindan, Lv.38–40): Kırık Taç Kapısı → Sessiz Zindan (dar koridorlar, 2 kapı mekanizması) →
  Kraliyet Mühürleri (3 savunma karşılaşması) → Kayıp Kral'ın Tahtı. Sınırsız giriş; ölümde kontrol noktası.
- Yeni zemin/kütle/dekor/damga çizimleri, sis ve hiçlik parçacıkları, üç yeni müzik/ortam teması.

**Yaratıklar**: 8 normal (Kefen Sürüngeni, Kemik Okçu, Lanetli Muhafız, Mezar Büyücüsü, Obsidyen Nöbetçi, Gölge Avcısı,
Taht Celladı, Hiçlik Rahibi), 2 elit (Kefen Avcısı, Obsidyen Celladı), 2 boss (Mezar Komutanı, Kayıp Kral) — her biri ayrı
davranış ve telegraflı yeteneklerle. Lanet etkisi (kısa süreli alınan hasar artışı). Oyuncunun toplam hasar azaltması %60 ile sınırlı.

**Eşyalar ve ekonomi**: 36 yeni ekipman (toplam 126); Kralın Son Emri ve Sonsuz Hüküm yalnız Kayıp Kral'ın %0,4 Legendary
çekilişinden (pity/garanti/craft yok). Komutan'ın iki özel Epic silahı. 19 yeni materyal, Lv.31+ yükseltme kademesi
(Kara Çelik, Ruh Özü, Taht Çekirdeği), Kadim HP/MP iksirleri, 8 kullanım eşyası (Temizleyici Merhem, Isıtıcı Tonik,
Dönüş Parşömeni, Kamp Erzağı, Maden Lambası, İzci Pusulası, Arındırma Tuzu, Kraliyet Mürekkebi), simya ve tedarik dükkânları.

**Görevler** (40 → 80 tek seferlik): 24 erken yan görev (Lv.2–30), 10 ana görev (212.000 EXP), 6 yan görev (39.000 EXP);
yeni görev türleri: refakat, savunma, sıralı iz sürme, gerçek üretim, onarım/arındırma, özel av. 13 yeni NPC.
Görevler ekipman vermez.

**Beceriler**: Sarsılmaz Öfke (Warrior Lv.35) ve Donmuş Zaman (Mage Lv.35); 6 aktif beceri, 4 düğmelik çubuk.
Ustalık II (Lv.40 + ana hikâye, Gezgin Bilge): Savaşın Mirası / Kadim Büyü Bilgisi.

**Arayüz**: Görev günlüğü (Ana / Yan / Sınıf / Sözleşme, bölge filtresi, en çok 3 HUD takibi, tamamlananlar, hedef türü
açıklamaları), mini haritada NPC görev işaretleri, eşya kartında "Kullan", İzci Pusulası / Maden Lambası işaretleri.

**Araçlar ve testler**: `tools/map-preview.mjs`; `tests/unit/v3.test.js`, `tests/unit/v3balance.test.js`,
`tests/e2e/run-e2e-v3.mjs`.

## 2.0.2
- **Yeni kurt çizimi:** Boz Kurt, Sürü Kurdu, Alfa Kurt ve Ayaz Kurdu eklemli bacaklarla yeniden çizildi
  (`src/art/wolf.js`): 4 karelik bekleme (nefes, kuyruk, kulak), 6 karelik tırıs koşusu (çapraz bacak çiftleri),
  çömel → sıçra → ısır → toparlan saldırısı, darbe alma ve yan yatarak ölüm. Yürüme animasyonu olmayan Skullwolf paketi kaldırıldı.
- **Çantada sürükle-bırak:** eşyayı basılı tutup (farede hafifçe sürükleyip) başka yuvaya bırak; dolu yuvada yer
  değiştirir, aynı istifler birleşir. Kısa dokunma eşya kartını açmaya devam eder, basılı tutmadan kaydırma listeyi kaydırır.
- **Ekran ortasındaki karartı giderildi:** karanlık/vinyet katmanı kamera yakınlaştırması 1'in altındayken (telefonda,
  "uzak" görüşte) ekranı tam kaplamıyor, ortada dikdörtgen bırakıyordu; artık yakınlaştırmaya göre boyutlanır.
- **Stat sıfırlama Karakter ekranında:** dağıtılmış bütün puanlar geri gelir ve yeniden dağıtılabilir. Karakter başına
  ilk sıfırlama ücretsiz, sonrakiler seviyeye göre (Lv.5 375 · Lv.10 1.000 · Lv.20 3.000 · Lv.30 6.000 Gold).
  Gezgin Bilge'deki stat sıfırlama da aynı kuralı kullanır. Taslağı temizleyen düğmenin adı "Geri al" oldu.
- **Daha büyük saldırı (kılıç) düğmesi:** ekran yüksekliğine göre ~80–113 px (önceden ~64–87 px).

## 2.0.1 — Görsel güncelleme (hazır sprite ve ikon paketleri)
- Çayır Sıçanı ve Mağara Yarasası artık LuizMelo "Monsters Creatures Fantasy 2" paketinin Rat / Bat animasyonlarıyla
  çizilir (bekleme, koşma/uçma, ısırma/saldırı, darbe alma, ölüm). Statlar ve davranışlar değişmedi.
- Hazır sprite paketli yaratıklar da ayrı darbe alma animasyonunu oynatır.
- `tools/import-sprites.py` artık klasörde bulunmayan paketlerin önceki çıktısını korur (paketler tek tek eklenebilir).
- Orman Yağmacısı (Bandits — Light Bandit) ve Boz Kurt/Sürü Kurdu (Skullwolf) hazır sprite paketleriyle çizilir.
- LuizMelo Monster Creatures Fantasy: Kazmacı Goblin = Goblin, Diken Kökçüsü = Mushroom, Çürük Muhafız = Skeleton,
  Kızıl Damar Gözcüsü ve Güçlendirilmiş Gözcü = kızıla boyanmış Flying Eye (havada süzülür). Bataklık Balçığı
  (eski adı Bataklık Sülüğü; materyali Balçık Özü) = MCF2 Slime, Kızıl Akrep = kızıla boyanmış "Scorpian".
  Statlar ve davranışlar değişmedi; eski kayıtlar etkilenmez.
- `tools/import-sprites.py`: şeritten kare seçme (`strip` + `frames`) ve renk tonu çevirme (`hue`) seçenekleri.
- Silah, zırh, başlık, bot, yüzük ve iksir ikonları Clockwork Raven Studios ikon paketlerinden alındı.
- Kalkan, odak/ayna/küre, eldiven, kolye/madalyon, 47 materyal ve 18 beceri ikonu (aktif + pasif + ustalık; HUD düğmeleri
  dahil) "Raven Fantasy Icons" paketinden alındı. `tools/import-icons.py`'ye tek renge boyama (`mono`) uyarlaması eklendi;
  `tools/preview-art.mjs icons` materyal ve beceri ikonlarını da gösterir.

## 2.0.0 — Kül ve Ayaz Genişlemesi

V1 projesinin üzerine geliştirildi; V1 kayıtları, karakterleri, eşyaları, haritaları ve görevleri korunur.
V1'in değişmez kuralları (yatay mobil, joystick, Warrior/Mage, dokun → yaklaş → otomatik normal saldırı, joystick yaklaşmayı
keser, otomatik farm/görev/beceri yok, hardcore loot, Legendary yalnız bosslardan, pity/garanti/craft Legendary yok,
başarısız yükseltme asla kırmaz/düşürmez, premium/enerji/günlük sınır yok, Türkçe metin, pixel-art kimliği) aynen geçerlidir.

### V1.1 düzeltmeleri ve altyapı
- **Sürümlü kayıt geçişi:** şema 1 → 2. Eski kayıt ilk açılışta dokunulmadan `v1_backup` anahtarına bir kez kopyalanır
  (Ayarlar → Önceki kayıtlar → "V1 yedeği"). Geçiş yalnız yeni alan ekler: beceri çubuğu, Av Geçmişi, zindan koşuları,
  Ustalık Kitapları, dünya bayrakları/sandıklar. Daha yeni sürümden gelen kayıt reddedilir.
- **PWA güvenli güncelleme:** sayfa her açılışta önce ağdan istenir (eski JS önbellekte takılı kalmaz), yeni servis işçisi
  bekler ve oyuncuya "Yeni sürüm hazır — kaydet ve yenile" düğmesi gösterilir; dokununca oyun kaydedilir, sonra yenilenir.
  `sw.js` HTTP önbelleğinden okunmaz (`updateViaCache: 'none'`), açık oturumda 30 dakikada bir güncelleme denetlenir.
- **Eşya koruması:** Rare/Epic ya da yükseltilmiş eşya satılmadan önce ayrıca onay istenir (Legendary zaten satılamaz,
  kilitli eşya satılamaz/parçalanamaz). Gizli sandık, çanta dolu ise açılmaz (ödül kaybolmaz). Boss ödülü benzersiz
  kimlikle bir kez verilir (Kül Devi her doğuşta, zindan bossları koşu başına).
- **Ekipman görünümü:** Ayarlar → "Kahraman görünümü" ile hazır animasyonlu sprite yerine giyilen silah/kalkan/zırhı
  gösteren piksel kahraman seçilebilir; sprite modunda Rare/Epic/Legendary silah ayak altında renkli halka olarak görünür.
- **Mobil arayüz:** Görevler listesinde tamamlananlar katlanır (40 görevde kaydırma azalır), Harita sekmesindeki bölge
  listesi kaydırılabilir, kaydırılabilir sütunlarda kartlar sıkışmaz (uzun beceri kartları taşmaz), yeni "Av Geçmişi" sekmesi.

### Seviye 21–30
- Maks. seviye 30. 20→21 … 29→30 EXP: 19.280 / 22.310 / 25.640 / 29.280 / 33.260 / 37.580 / 42.260 / 47.320 / 52.760 / 58.610
  (toplam 368.300; V1 formülü aynen sürer). Her seviye +3 stat, +1 beceri puanı, HP/MP artışı. Lv.20'de biriken EXP geriye
  dönük verilmez (Lv.20 karakter 0 EXP'den başlar). Sıfırlama ücreti Lv.21–30: 5.000 Gold.

### Yeni bölgeler
- **Kül Yaylaları** (112×80, Lv.20–25): Küllü Düzlük (Kül Cini), Yanmış Kervan Yolu (Kül Avcısı), Akrep Yarıkları
  (Kızıl Akrep), Kızıl Harabeler (Yanık Savaşçı + Kül Kasabı elit), Kor Kalderası (Kül Devi), Kor Kampı (güvenli kamp,
  Kâşif Demre, Seyyar Demirci Yaren), Yol Taşı, 11 Kül Cevheri damarı, 2 gizli sandık, lav gölleri, kül parçacıkları.
  Kırık Damar Madeni'nin doğu göçüğünden girilir; geçit "Kırılan Ufuk" görevi alınmadan (V1 finali) açılmaz.
- **Ayaz Geçidi** (116×88, Lv.25–30): Beyaz Patika (Ayaz Kurdu), Kristal Vadisi (Buz Ruhçuk), Donuk Karakol (Buz Zırhlı
  Nöbetçi + Buz Gardiyanı elit), Şaman Tepeleri (Kar Şamanı), Ayaz Konağı (güvenli kamp, Komutan İlgar, Avcı Sena),
  Yol Taşı, 12 Ayaz Kristali, 2 gizli sandık, donmuş göl, kar parçacıkları, Buz Mabedi girişi.
- **Buz Mabedi** (100×76, Lv.28–30): Buzdan Geçit → Donuk Salon → Mühür Galerisi (3 mühür; her mühür kısa bir
  karşılaşma başlatır, üçü kırılınca boss kapısı açılır) → Donmuş Taht. Sınırsız giriş, ölümde boss tam cana döner ve
  temizlenen bölümler korunur, istemsiz kapanmada kontrol noktasından devam, gönüllü çıkış koşuyu bitirir.
- Yeni tile'lar (kül, kavrulmuş toprak, bazalt, lav, kar, buz, ayaz taşı, donmuş su, mabet zemini), kütleler (bazalt yamaç,
  karlı çam ormanı, buz duvarı), 12 dekor, 15 damga (yanık ağaç, bazalt kaya, lav ağzı, yanmış araba, harabe kule,
  obsidyen sütun, donmuş çam, buz kristali, buz kayası, donmuş heykel, buz sütunu, kar çadırı, gözetleme kulesi…).

### Yaratıklar, elitler, bosslar
- 8 normal yaratık (belge statlarıyla): Kül Cini, Kül Avcısı (ateş oku), Kızıl Akrep (kısa zehir), Yanık Savaşçı,
  Ayaz Kurdu (sürü), Buz Ruhçuk, Buz Zırhlı Nöbetçi, Kar Şamanı (buz oku + yavaşlatma). Her biri ayrı silüetli procedural
  sprite: bekleme, yürüme, saldırı, darbe alma ve küle/buza dağılan ölüm animasyonu.
- **Kül Kasabı** (elit): geniş ön satır (telegraflı) + ardında kısa ateş izi, %30 altında öfke.
- **Buz Gardiyanı** (elit): buz yer vuruşu (çember + kısa yavaşlatma), uzaktaki oyuncuya düşen buz kıymıkları.
- **Kül Devi** (boss, 35.000 HP): Kor Yumruğu, Alev Yarıkları (en çok 3 etkin), Kül Çağrısı (%55 altında 2 yardımcı;
  EXP/loot vermez), Son Kor (%20 altında hızlanır). Rare %22 / Epic %2 / Legendary %0.
- **Donmuş Muhafız** (boss, 55.000 HP): I. faz Buz Mızrağı + Donuk Darbe; II. faz Buz Mührü kalkanı (2 kristal) +
  Buz Çemberi (güvenli boşluklu halka); III. faz hızlanma, kısa yavaşlatma/12 sn'de en çok bir kez kısa dondurma.
  Rare %30 / Epic %7 / Legendary toplam %0,4 (Buzun Hükmü / Sonsuz Kış Asası, %80 kendi sınıfı).

### Eşyalar, materyaller, ekonomi
- 30 yeni şablon (toplam 90) belgedeki değerlerle; Legendary etkileri: Buzun Hükmü (normal vuruşta %10, 8 sn iç bekleme,
  ek buz hasarı), Sonsuz Kış Asası (aktif büyüde %8, 10 sn iç bekleme, ek buz hasarı); zincirlenmez. V1 eşyaları değişmedi.
- 18 yeni materyal (8 yaratık, 2 elit, 2 boss, 2 toplama, 3 işlenmiş + Ustalık Kitabı), 2 yeni iksir (Yoğun HP/MP),
  15 yeni tarif. Kül Çeliği / Ayaz Özü / Kor Çekirdeği tariflerinde Demir, Sunak Tozu, Kadim Çekirdek kullanılır;
  Rare/Epic ekipman tariflerinde Gözcü Mührü, Golem Parçası, Sertleştirme Taşı, Zehirli Kristal vb. de istenir.
- Lv.21+ eşya yükseltmesi: aynı başarı oranları (+1 %100 … +5 %35), Gold ×1,8; +1/+2 Kül Çeliği, +3 Sertleştirme Taşı + Ayaz Özü,
  +4 Sunak Kristali + Ayaz Özü, +5 Kor Çekirdeği. +5 sınırı ve "asla kırılmaz/düşmez" kuralı aynı.

### Beceriler
- Lv.25: **Kılıç Yağmuru** (Warrior, önündeki alanda en çok 5 hedef, ×1,45, 18 sn, 30 MP) ve **Zincir Yıldırım**
  (Mage, ×1,65 ilk hedef, en çok 3 sıçrama, her sıçramada %25 azalan hasar, görünür bağlantılar, 16 sn, 42 MP).
- 5 aktif beceri, 4 düğme: Beceriler ekranında "Beceri çubuğu" (yuvaya dokun → beceri seç, yer değiştirir). Kayıtta tutulur;
  eski kayıtlar V1 düzeniyle (ilk 4 aktif) başlar.
- **Ustalık Kitapları** (Lv.30, Rank 5 beceri, her beceriye bir kez): küçük özel geliştirmeler (ör. Ağır Darbe kritik ×1,8,
  Demir Deri +2 sn, Ateş Küresi yanma, Buz Patlaması +1,5 sn yavaşlatma, Zincir Yıldırım +1 sıçrama). Rank 6 yok.
  Bosslardan/elitlerden düşük oranda düşer veya Demirci'de pahalı tarifle üretilir.

### Görevler ve Av Geçmişi
- 10 ana görev (Kırılan Ufuk → Donmuş Muhafız) + 4 yan görev (Kül Madencisi, Kayıp Gözcü, Ayaz Avcısı, Donmuş Hatıralar);
  toplam 40 tek seferlik görev. Görev eşyaları RNG'ye bağlı değildir; güçlü Rare garanti ödülü yoktur.
- **Av Geçmişi** sekmesi: toplam/türe göre öldürme, boss zaferleri, bulunan Rare/Epic/Legendary, tamamlanan zindanlar.
  V1 karakterlerinde V2'den itibaren sayılır; sayaçlar ganimet şansını etkilemez.

### Ses ve atmosfer
- Kül, ayaz ve mabet temaları için procedural müzik dizileri ve ortam sesleri (kor çıtırtısı, buz çınlaması, rüzgâr).
- Kül/kar parçacık havuzları (düşük performans modunda azaltılır), lav ağzı ve buz kristali ışıltıları.

## 1.0.0 — V1
İlk sürüm: Lv.1–20, Warrior/Mage, 5 harita, Derin Ocak, Maden Golemi, 60 eşya, 26 görev.
