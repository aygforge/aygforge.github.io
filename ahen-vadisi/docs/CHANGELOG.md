# Değişiklik Günlüğü

## 4.5.0 — Ortak boss'lar, parti dungeon'ları (raid), ortak görev olayları ve ticaret
Oyun sunucusu da güncellenir (Render depo güncellenince kendisi kurar). Ayrıntı: [`OYUN_SUNUCUSU.md`](OYUN_SUNUCUSU.md).
- **Boss'lar sunucuda:** 8 boss'un tamamı (Alfa Kurt, Maden Golemi, Kül Devi, Donmuş Muhafız, Mezar Komutanı, Kayıp Kral,
  Fırtına Tiranı, Göğün Mahkûmu) sunucuya taşındı. Bütün mekanikleri (çağrılar, kalkan kristalleri/mühürleri, Lanetli
  Bayrak, çatlak zırh, halkalar, düşen mermiler, kalıcı alanlar, öfke fazları) ortak; alandaki herkesi vurur. Geri itme,
  sersemletme ve dondurma da isabetle gelir. Boss çubuğu faz ve kalkanı sunucudan gösterir. Açık dünya boss'ları herkes
  için tek; ödül parti payıyla ve tek seferlik ödül kimliğiyle verilir.
- **Parti dungeon'ları (raid):** her parti için dungeon'ın ayrı bir örneği. Bölüm yaratıkları, kapılar, mühürler,
  mekanizmalar, muhafız dalgaları ve boss ortak; bir üye bölümü temizleyince herkesin koşusu ilerler ve kapı herkeste
  açılır. Parti penceresinden "Bölgesine git" ile dungeon'daki arkadaşının yanına girilir. Boss ganimeti herkese kendi
  koşusunda bir kez düşer.
- **Ortak görev olayları:** refakat, alan savunması ve sunak dalgaları sunucuda koşar; biri başlatınca bölgedeki herkes
  görür ve yardım edebilir. Tamamlanınca görevi olan herkesin hedefi işler. Görev avları (özel hedefler) bölgede tek ve
  ortak doğar.
- **Ticaret:** çevrimiçi oyuncularla eşya, malzeme ve altın takası (Parti penceresi → Çevrimiçi oyuncular → Ticaret).
  Kilitle/Onayla. Takas iki tarafta hep-ya-hiç uygulanır ve hemen kaydedilir. Kilitli eşyalar ve görev eşyaları takas
  edilemez.


## 4.4.1 — Ortak dünya sunucusu oyuna bağlandı
- `online.json`: `"gameServer": "wss://ahen-vadisi-sunucu.onrender.com"` (Render, ücretsiz plan). Giriş yapmış oyuncular
  hiçbir ayar yapmadan ortak dünyaya bağlanır.


## 4.4.0 — Ortak dünya oyun sunucusu (MMO, 1. aşama)
Kurulum: [`OYUN_SUNUCUSU.md`](OYUN_SUNUCUSU.md) (Render ücretsiz plan ya da Docker).
- **Tek sunucu, tek dünya:** açık haritalardaki kamp yaratıkları ve elitler artık sunucuda yaşar. Bağlanan herkes aynı
  yaratıkları aynı yerde görür, kimin saldırdığını, canın düştüğünü ve ölümü birlikte görür. Yaratık yakındaki ya da
  ona en çok vuran oyuncuya saldırır; elit yeteneklerinin alanı içindeki **herkesi** vurur. Hasar, vurulan oyuncunun
  kendi savunmasıyla hesaplanır.
- **Birlikte avlanma ve EXP paylaşımı:** partide yakındaki üyeler EXP ve altını bonuslu paylaşır (2 kişi ×0,6,
  4 kişi ×0,4), ganimet herkese ayrı düşer, görev öldürme sayacı herkese işler. Ekranda "Parti payı ×0,60 (2 kişi)".
- **Herkes görünür:** bölgedeki tüm oyuncular haritada (parti üyeleri yeşil, diğerleri mavi etiketle).
- **Elit doğuşu** sunucuda (kampında yeterli öldürme + süre) ve herkese duyurulur.
- Parti ve davetler sunucu ayarlıysa oyun sunucusu üzerinden gider (Supabase Realtime kotası harcanmaz).
- Sunucuya ulaşılamazsa ya da bağlantı koparsa oyun tek oyunculu devam eder, sunucu dönünce kendiliğinden ortak dünyaya
  geçer. HUD: "● N çevrimiçi · sunucu" / "○ sunucuya bağlanıyor…".
- Henüz kişisel kalanlar: açık dünya boss'ları, dungeon'lar, görev olayları/avları, sunak dalgaları.
- `server/` (Node.js + ws), `render.yaml` (Render Blueprint), `server/Dockerfile`. Ayar: `online.json` → `gameServer`
  ya da oyunda Ayarlar → Çevrimiçi → Oyun sunucusu.


## 4.3.0 — Parti: birlikte görünme, gezme ve sohbet (çok oyunculu Faz 1)
Supabase Realtime (ücretsiz katman) ile; ek sunucu yok. Çevrimiçi giriş gerekir.
- **Parti kur / kodla katıl / davet et:** HUD'da mini haritanın altında **Parti** düğmesi. Parti 6 karakterli bir kodla
  kurulur (en çok 4 kişi, ilk kuran lider ★). Çevrimiçi oyuncular listesinden **Davet et**; davet edilen oyuncuya pencere
  açılır (Katıl / Reddet), davet edene sonuç bildirilir.
- **Haritada birlikte:** aynı bölgedeki parti arkadaşları kendi sınıf sprite'ıyla, ad + seviye + can çubuğuyla görünür,
  yürüyüşü yumuşatılarak çizilir. Mini haritada yeşil nokta, sol üstte parti çerçevesi (ad, seviye, can, başka
  bölgedeyse bölge adı). Arkadaşlar yalnız görünür: savaşa, düşmanlara ve ganimete etkileri yok (birlikte savaş Faz 3).
- **Birlikte gezme:** arkadaş bölge değiştirince bildirim. Parti penceresinde **Yanına git** (aynı bölgede ışınlanma) /
  **Bölgesine git** (keşfedilmiş Yol Taşı olan, dungeon olmayan bölgeye; savaş dışında, ücretsiz). **Lideri takip et**
  açıksa lider bölge değiştirince peşinden gidilir.
- **Parti sohbeti:** HUD'da **Sohbet**; mesajlar ekranın altında ve gönderenin başının üstünde konuşma balonu olarak.
- Sayfa yenilenir ya da ana menüye dönülürse 30 dk içinde oyuna girince aynı partiye kendiliğinden dönülür.
- **Mesaj bütçesi:** konum yalnız yürürken ve aynı bölgede arkadaş varken en sık 0,4 sn'de bir gider; durunca susar
  (15 sn'de bir yoklama). Ayrıntı: `ONLINE_KURULUM.md`.
- `kurulum.sql`: `online_players` görünümüne `user_id` (davet için) eklendi — **yeniden çalıştırılmalı** (güvenli).
- Anlık bağlantı kütüphanesi (`@supabase/realtime-js`) yalnız gerektiğinde yüklenir.


## 4.2.0 — Çevrimiçi oyuncular + kurulum hatası teşhisi
- **Çevrimiçi oyuncular:** oyundayken mini haritanın altında "● N çevrimiçi". Dokununca liste: takma ad, karakter, sınıf,
  seviye ve bulunduğu harita; kendi satırın "(sen)". Giriş yapmış oyuncu oyundayken yaklaşık 45 sn'de bir (ve harita
  değişince) "buradayım" der; son 90 sn'de görülenler çevrimiçi sayılır, zamanı sunucu yazar. Çıkış yapınca listeden hemen
  düşer; sekme arka plandayken gönderilmez. Ayarlar → Çevrimiçi kutusunda sayı ve "Çevrimiçi oyuncular" düğmesi.
- `supabase/kurulum.sql`: `presence` tablosu, sunucu zamanı tetikleyicisi, `online_players` görünümü ve satır güvenliği;
  sonda `notify pgrst, 'reload schema'` (yeni tablolar Veri API'sinde hemen görünsün). **Yeniden çalıştırılmalı** (güvenli).
- Hata mesajları sunucu kodunu ve tabloyu söyler (ör. `Sunucuda "players" tablosu yok [PGRST205]`, `Sunucu izni yok [42501]`).
- Tablolar kurulmadan kayıt olunduysa takma ad, kurulumdan sonraki ilk girişte hesaptaki takma addan otomatik onarılır.


## 4.1.1 — Test sunucusu oyuna bağlandı
- `online.json`: test grubunun Supabase projesi (adres + herkese açık "publishable" anahtar). Oyuncular hiçbir ayar yapmadan
  Çevrimiçi → Kayıt ol diyebilir. Gizli anahtar oyunda yoktur.
- Çevrimiçi e2e testi gerçek projeye hiç istek atmaz (servis işçisi kapalı, `online.json` boş ayarla değiştirilir).


## 4.1.0 — Çevrimiçi test katmanı (isteğe bağlı, ücretsiz Supabase)
Kurulum: [`ONLINE_KURULUM.md`](ONLINE_KURULUM.md). Oyun tek oyunculu kalır ve sunucu ayarı olmadan aynen çalışır.
- **Bulut kaydı:** e-posta + şifre hesabıyla; elle "Buluta kaydet" ve yerel kayıttan sonra otomatik (en sık 3 dk). Bulutta
  oyunun yedek kodunun aynısı (sıkıştırılmış + checksum'lı) saklanır. Boş profil buluta yazılmaz; bulutta bu cihazda olmayan
  ya da daha ileri bir karakter varsa otomatik yükleme durur, elle yüklemede uyarılır (her yüklemeden önce bulut yeniden okunur).
- **Buluttan yükle:** bulut ve cihaz yan yana gösterilir; yalnız onayla, mevcut profilin kurtarma kopyası alınarak (içe aktarma
  yolu). Boş cihazda girişte önerilir.
- **Liderlik tablosu** (karakter, sınıf, takma ad, seviye, öldürme, boss, görev) ve **hata/öneri bildirimi** (sürüm, harita,
  sınıf, seviye ve tarayıcı bilgisiyle; giriş yapmadan da gönderilebilir).
- Ana menüde **Çevrimiçi** düğmesi; oyun içinde Ayarlar → Çevrimiçi. Sunucu ayarı: oyunla gelen `online.json` ya da oyunda
  elle / `AHO1:` sunucu kodu ile. Gizli (`service_role` / `sb_secret_`) anahtar reddedilir.
- Supabase kurulumu: `supabase/kurulum.sql` (4 tablo, satır güvenliği; yerel PostgreSQL 16'da politikalar denendi).
- Servis işçisi başka kökene (çevrimiçi sunucu) giden istekleri artık önbellekten geçirmez.
- Ana menüde "Ayarlar ve Yedek" ile "Çevrimiçi" yan yana (alçak ekranlara sığması için).


## 4.0.1 — Okçu, Ölü Çağıran ve iskelet sprite'ları
- **Okçu** artık Huntress 2 (LuizMelo, CC0) sprite'ıyla görünür: bekleme, koşu, yay çekme, darbe ve ölüm animasyonları;
  ok mermisi paketin okudur ve yayın bırakıldığı karede çıkar.
- **Ölü Çağıran** Evil Wizard 3 (LuizMelo, CC0) sprite'ıyla görünür; Ruh Mermisi ve Ruh Oku paketin mor mermisini,
  isabette paketin patlama efektini kullanır.
- **İskeletler** (İskelet Çağır ve Ölüler Ordusu) Skeleton Sprite Pack ile: bekleme, yürüme, saldırı ve dağılma animasyonu.
- Karakter oluşturma ekranı ve HUD portresi yeni sprite'ları gösterir. "Ekipman görünür (piksel)" ayarı ve paket
  yüklenemediğinde procedural çizime dönülür. Oyun mantığı, denge ve kayıt değişmedi.
- `tools/import-sprites.py`: animasyon başına kare boyu, sol-alt hizalama ve paket efektleri (`FX_PACKS`).


## 4.0.0 — «Gökyarık Genişlemesi» (Lv. 41–50)
Ayrıntılar, denge tablosu ve bilinen sınırlamalar: [`V4_NOTLARI.md`](V4_NOTLARI.md). **Mevcut kayıtlar aynen açılır:**
şema 3 → 4 geçişi yalnız alan ekler; geçişten önceki kayıt `v3_backup` olarak saklanır.

**Kayıt ve kayıt güvenliği**
- Şema 4: 3 karakter yuvası doğrulamadan **önce** 5'e genişler (sıra, kimlik, seviye, eşya, gold, stat ve görevler aynen).
- Depolama açılamazsa (kota, engellenmiş, kapalı, meşgul, eksik) oyun boş profili "yüklendi" saymaz ve hiçbir kaydın üzerine
  yazmaz: hata türü gösterilir, yedekler ve önceki kayıtlar aranır, kurtarılabilir kayıtlar listelenir, yalnız bellekte
  çalışılıyorsa açık uyarı verilir, JSON dışa aktarma önerilir.
- Ayarlar → **Kayıt Güvenliği:** son başarılı kalıcı kayıt zamanı, kayıt teknolojisi, kalıcı depolama izni, son yedek, şimdi
  kaydet, yedek kodu kopyala/yapıştır, JSON dışa/içe aktar, önceki kayıtlar, kayıp karakter ara. Ana menüde de açılır.
- Mevcut karakteri olan oyuncuya V4'te bir kez yedek hatırlatması.

**Yeni sınıflar (Lv.1'den)**
- **Okçu:** menzilli fiziksel; görünür oklar duvara çarpar, cephane yok. İsabetli Ok, Çoklu Atış, Çevik Adım, Delici Ok,
  Ok Yağmuru, Avcı İşareti, Kartal Fırtınası; pasifler Keskin Nişancı, Çevik Refleks, Avcı İçgüdüsü.
- **Ölü Çağıran:** Ruh Mermisi (MP harcamaz); Ruh Oku, İskelet Çağır, Lanet Mührü, Can Sömürüsü (en çok %5 can), Kemik
  Patlaması, Ölüler Ordusu, Ruh Kıyameti; pasifler Karanlık Bilgi, Kemik Bağı, Ruh Hasadı.
- **İskelet:** en çok 2; yalnız seçili hedefe saldırır (AFK farm yok); tek öldürme / tek ödül / görev sayacı bir kez; kayda
  yalnız güvenli durum; harita değişimi, ölüm ve kapat-aç çoğaltmaz; bosslar iskeleti hedeflemez, telegraflar iskelete de vurur.
- Lv.1–40 içeriği dört sınıfla oynanır; yeni sınıf ekipmanı Lv.1 yaratıklarından düşer; Ustalık I/II/III.
- Savaşçı **Yıldırım Yarığı** (×2,20, 24 sn), Büyücü **Astral Patlama** (×2,00, en çok 6 hedef, 24 sn) — Lv.45.

**Dünya, yaratıklar, bosslar**
- **Gökyarık Ovası** (124×88, Lv.40–45): Fırtına Çayırı, Yarık Tepeleri, Yağmacı Yolu, Yıldırım Ocağı; Fırtına Celladı;
  Fırtına Tiranı'nın Çemberi; Keşif Kampı (Atlas, yol taşı); Kırık Gözcü Kulesi; 2 gizli sandık; Fırtına Cevheri, Yıldız Çiçeği.
- **Yıldız Mezarı** (128×92, Lv.45–50): Düşen Taşlar, Astral İzler, Boşluk Meydanı, Kâhin Harabeleri; Hiçlik Muhafızı;
  Gözlemci Kampı (Leyla, yol taşı); 3 gözlem noktası; Mabet Basamakları (Tufan); 2 gizli sandık; Astral Kristal.
- **Gökyarık Mabedi** (Lv.48–50, 5 bölüm, sınırsız giriş): kapı mührü → enerji düğümleri (yanlış düğüm zararsız ipucu) →
  koridor savaşları → 3 gök mührü (ikişer savunma dalgası) → **Göğün Mahkûmu**. Kontrol noktaları, ölümde boss sıfırlanır,
  ödül koşu başına bir kez.
- 8 yaratık, 2 elit (Epic %0,75, Legendary yok), **Fırtına Tiranı** (Kristal Çağrısı, Son Gök Gürültüsü) ve **Göğün Mahkûmu**
  (Göğün Zincirleri, Kırılan Mühürler, Yıldızların Sonu). Fırtına/yıldız ortam sesleri, müzik ve parçacıkları.

**Eşya, loot, ekonomi**
- 84 yeni eşya (toplam 210): Okçu/Ölü Çağıran silah, zırh, sadak/tılsım; Savaşçı/Büyücü Lv.44–50; aksesuarlar; 4 sınıfa
  Lv.50 Legendary. Golem, Donmuş Muhafız ve Kayıp Kral havuzlarına Okçu/Ölü Çağıran Legendary'leri eklendi; **oran değişmedi**
  (toplam %0,4; %80 kendi sınıfı, %20 diğer üç sınıf). Normal Rare %0,25 ve elit Epic %0,75 değişmedi.
- Yeni materyaller, işleme tarifleri, yeni sınıfların erken eşyaları için eski materyallerle üretim, Yıldız HP/MP iksirleri,
  Lv.41+ yükseltme kademesi. Yeni para birimi yok, Legendary üretimi yok.

**NPC ve görevler**
- 5 NPC: Usta Okçu Duru ve Ruhbilge Selim (köy; eski NPC'ler yerinde), İzci Atlas, Yıldız Yorumcusu Leyla, Gökyarık Bekçisi Tufan.
- 12 ana görev (m47–m58, 512.000 EXP), 10 yan görev (s43–s52, 132.000 EXP) → toplam 102 ana/yan görev; eski görev kimlikleri
  aynı. Ustalık II (Okçu/Ölü Çağıran), Ustalık III (dört sınıf, Lv.50, hikâyeden sonra), sayım dışı 4 rehber görevi.
  Hiçbir görev Legendary vermez ya da Legendary'ye bağlı değildir.

**Testler**
- `tests/unit/v4save.test.js`, `v4content.test.js`, `v4balance.test.js`; `tests/e2e/run-e2e-v4.mjs` (`npm run test:e2e:v4`).
  Eski testler V4 verisine göre güncellendi (davranış aynı). Sonuçlar: [`TEST_RAPORU.md`](TEST_RAPORU.md).

## 3.0.1 — Kayıt sağlamlaştırma
Oyuncu bildirimi: itch.io sürümü aralıklarla oynanırken bir süre sonra karakterlerin silinip profilin sıfırlanması.
**Mevcut kayıtlar aynen açılır** — şema değişmedi (3), hiçbir eski anahtar silinmez ya da dönüştürülmez; 3.0.0 ve öncesinin
bütün kayıtları (IndexedDB `profile` / `snap_*` / `v1_backup` / `v2_backup`, localStorage modu) okunmaya devam eder.

**Bulunan nedenler**
- Kayıttaki *tek bir* alan doğrulamayı geçemezse (ör. tek bir eşya) bütün profil reddediliyor, oyun boş profille açılıyordu;
  ardından otomatik kayıtlar önce ana kaydın, birkaç dakika içinde iki yedeğin de üzerine boş profil yazıyordu.
- IndexedDB o an açılamazsa (itch.io iframe'i, gizlilik ayarı, geçici hata) oyun boş localStorage'a düşüyor ve orada
  sıfırdan başlıyordu; asıl kayıt IndexedDB'de dururken yeni ilerleme ayrı bir yere yazılıyordu.
- Önbellekte kalan eski sürüm, daha yeni sürümün kaydını "okunamaz" sayıp sıfırlıyor ve üzerine yazabiliyordu.
- Mobil Safari'de arka plandan dönünce kopan IndexedDB bağlantısı kayıtların sessizce başarısız olmasına yol açabiliyordu.
- Tarayıcının site verisini silmesi (önbellek temizleme, gizli sekme, depolama baskısı, Safari'nin 7 günlük kuralı) kodla
  engellenemez — bunun için yedek kodu eklendi.

**Değişiklikler**
- **Onarım:** doğrulamayı geçemeyen kayıt artık atılmaz; yalnız sorunlu alan onarılır (bilinmeyen eşya çıkarılır, çift uid
  yenilenir, sayı sınırları, konum, beceri çubuğu, konteyner boyutu). Onarılmadan önceki ham kopya `rescue_*` olarak saklanır,
  oyuncuya bildirilir.
- **Çift yazım:** her kayıt IndexedDB'ye ve localStorage aynasına yazılır; yüklemede bütün kopyalar karşılaştırılır,
  en yeni sağlam olan seçilir. Karaktersiz bir kopya, karakterli bir kopyanın yerine kendiliğinden geçmez.
- **İlerleme koruması:** bir kayıt önceki kayıttaki bir karakteri kaybettirecekse (bilinçli silme hariç) önceki kayıt ayrıca
  saklanır. Oturum başı ve 15 dakikada bir 5'li kayıt geçmişi (`hist_*`).
- **Kayıp karakter kurtarma:** açılışta, cihazdaki kopyalarda bulunup profilde olmayan (ya da daha ileri) karakterler
  listelenir, tek dokunuşla geri yüklenir. Ayarlar → "Kayıp karakter ara" ile istenildiğinde de aranır.
- **Daha yeni sürüm kaydı** salt okunur açılır ve üzerine yazılmaz; oyuncuya sayfayı yenilemesi söylenir.
- **Yedek kodu:** Ayarlar ve Yedek → "Yedek kodunu kopyala / yapıştır" (sıkıştırılmış metin; itch.io'da dosya indirme
  engellense de çalışır, başka cihaza taşınabilir). JSON dosyası yedeği de sürüyor. Karakteri olan ve 3 gündür yedek
  almamış oyuncuya nazik hatırlatma.
- IndexedDB bağlantısı koparsa yeniden açılır; tarayıcıdan kalıcı depolama izni istenir (`navigator.storage.persist`).
- Ayarlar'da kayıt durumu satırı (son kayıt, depolama, kalıcı depolama), genişletilmiş "Önceki kayıtlar" listesi; yedek
  yükleme / geri dönme öncesinde mevcut profil kurtarma kopyasına alınır.
- Küçük düzeltme: çanta sıralamasında kullanılabilir eşya ve görev eşyası kategorileri tanımsızdı.
- Ana menüdeki sürüm yazısı güncel sürümü gösterir.

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
