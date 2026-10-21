# Ahen Vadisi V1 — Test Raporu

Tarih: 21 Ekim 2026 · Ortam: Linux, Node 22, Chromium 141 (Playwright 1.56, headless, mobil dokunmatik emülasyonu,
**yazılımsal WebGL / SwiftShader**). Gerçek Android/iOS cihazında test **yapılamadı** (ortamda cihaz yok).

Komutlar: `npm test` (birim) · `npm run build && npm run test:e2e` (uçtan uca). E2E ekran görüntüleri: `tests/e2e/screens/`,
makine okunur sonuç: `tests/e2e/report.json`.

## Özet

| Paket | Sonuç |
|---|---|
| Birim testleri (Vitest, 8 dosya) | **72 / 72 geçti** |
| Uçtan uca testler (Playwright) | **49 / 49 geçti** |
| Üretim derlemesi (Vite) | Başarılı — toplam ~1,6 MB (Phaser 332 KB gzip, oyun 115 KB gzip) |

## Birim testleri (tests/unit)

| Alan | Doğrulanan |
|---|---|
| Veri | Tam 60 eşya; nadirlik 14/15/18/11/2; slot sayıları; her sınıf için her slotta eşya; 12 normal / 3 elit / 2 boss ve belge statları; loot tabloları toplam %100; tarif ID'leri; EXP tablosu (Lv1→20 = 88.150); 26 görev, EXP 16.550+5.500 ve Gold 5.365+1.590; görev hedeflerinin gerçek yaratık/konum/nesne/NPC'ye bağlılığı; köyde 7 NPC |
| Haritalar | 5 haritanın belge ölçüleri; her girişten tüm nesne/kamp/konumlara erişim (otomatik onarım gerekmeden); açık bölgelerde 4 farm kampı + 1 elit; çift yönlü geçitler; dungeon kapılarının gerçekten koridoru kapatması |
| Formüller | Lv1 HP/MP (174/51, 110/133); Lv1 Warrior→sıçan ≈15,6 hasar ve 2–3 vuruş eşiği; kritik ×1,5, %45 / hız %35 üst sınırları, min 1 hasar; DEF/MDEF ayrımı; Demir Deri ve Mana Kalkanı; +5 = temel saldırı +%30; 0 dayanıklılık −%25; karşılaştırmanın gerçek motordan gelmesi |
| Sınıflar | İki sınıf Lv1→20; 57 stat puanı; açılış seviyeleri (aktif 1/5/10/15, pasif 4/9/14); 21 beceri puanı, tümü maksimum için 33 puan; stat/beceri sıfırlama ücretleri |
| Loot RNG | Boz Kurt **200.000** öldürme: N/U/R oranları (%0,25 Rare dahil) 4σ içinde; Gözcü **150.000**: Epic %0,75; Maden Golemi **1.000.000** kesim: Legendary %0,397 (beklenen %0,4), Rare %28, Epic %6, sınıf ağırlığı %80; en uzun Legendary kuraklığı 2.492 kesim (pity yok); **Golem dışındaki her kaynak 100.000 öldürme: 0 Legendary**; havuzlar boş değil ve seviye uygun; bonus sayısı/aralık/tekrarsızlık/sınıf-slot uygunluğu (20.000 eşya); materyal %28; Kadim Çekirdek %25 |
| Envanter/ekonomi | 36 slot; çift el yardımcı eli kapatır; sınıf/seviye kontrolü; çanta doluyken Rare+ bekleyen ganimete gider; istif/sıralama; ortak depo aktarımı; alım/satım; Legendary satılamaz/parçalanamaz; kilitli eşya; crafting'in tek seferlik ve eksik materyalde hiç değişmemesi; 20 tarifin tamamı; **sınırsız gold döngüsü yok** (al→sat, craft→sat, al→parçala→sat, craft→parçala); tamir ve ölüm dayanıklılığı; çanta 36→42→48, depo 60→90 |
| Demirci | +1..+5 başarı oranları 20.000'er deneme (±%1,5); başarısızlıkta eşya kırılmaz/silinmez/seviye düşmez; materyal+gold tüketimi; maliyet çarpanları; yüzük/kolye yükseltilmez; N/U +5 için 3 Sunak Kristali |
| Görevler | 26 görevin + 2 sınıf görevinin her iki sınıfla gerçek olaylarla (öldürme, ulaşma, etkileşim, teslim, dungeon) alınıp tamamlanması; ödülün bir kez verilmesi; ön koşul ve seviye kilitleri; yanlış yaratık sayacı artırmaz; aynı nesne iki kez sayılmaz; Av Sözleşmeleri ayrı ve tekrarlanabilir |
| Dungeon | Kilit; koşu; kontrol noktaları; istemsiz kapanmada devam; tek boss loot'u (aynı killId ikinci kez ödül vermez); gönüllü çıkış ve yeni koşu |
| Kayıt | IndexedDB (fake-indexeddb) kapat-aç; checksum bozulunca snapshot'tan kurtarma; JSON dışa/içe aktarma, sürüm ve bütünlük kontrolü; geçersiz veri reddi (bilinmeyen eşya, çift uid); simüle edilmiş yazma hatası ve sonraki başarılı kayıt |
| Denge simülasyonu | Aşağıdaki tablo |

## Uçtan uca testler (tests/e2e/run-e2e.mjs)

| Test | Sonuç |
|---|---|
| HUD 640×360 (16:9), 780×360 (19,5:9), 800×360 (20:9), 844×390 (iPhone 14), 915×412 (Android 20:9): tüm kontroller ekran içinde, dokunma hedefleri ≥44 px, interaktif öğeler çakışmıyor, envanter paneli ekrana sığıyor, konsol hatası yok | ✔ (25 kontrol) |
| Dikey ekranda "telefonu yatay çevir" ekranı | ✔ |
| Düşmana dokunma (gerçek dokunmatik olay) → hedef seçimi ve yaklaşma | ✔ |
| Joystick sürükleme (CDP dokunmatik olayları) otomatik yaklaşmayı **1. karede** keser | ✔ |
| Joystick bırakılınca yaklaşma kendiliğinden başlamaz, hedef korunur | ✔ |
| Menzilde otomatik normal saldırı hedefi öldürür; hedef ölünce yeni hedef seçilmez | ✔ |
| Görüş hattı engelden geçmez; erişilemeyen hedefe sonsuz koşma yok | ✔ |
| Sayfa yeniden yüklenince karakter/gold/görev/harita/envanter korunur ve aynı haritaya dönülür | ✔ |
| Golem büyük saldırıyı telegrafla işaretler; Golem yenilir, bölüm 4 temizlenir; tek ölümden tek loot; gönüllü çıkış → yeni koşu ve yeni Golem | ✔ |
| PWA: servis işçisi etkin, **çevrimdışı yeniden açılış**, manifest | ✔ |
| Mage uzaktan (>3 tile) saldırır, normal büyü MP harcamaz | ✔ |

### Performans (SwiftShader yazılım GPU, 844×390)

| Senaryo | Ölçülen FPS | Yaratık | JS bellek |
|---|---|---|---|
| Orman, normal yoğunluk | 41–45 | 28 | ~69–78 MB |
| Orman + 30 saldırgan kurt | 37–41 | 58 | ~69–78 MB |
| Düşük performans modu (30 FPS sınırı) | sınır uygulanıyor | 58 | — |
| Derin Ocak (karanlık + ışıklar) | ~31 | 20 | — |

Not: Bu değerler GPU'suz sanal makinede yazılımsal render ile ölçülmüştür; donanım hızlandırmalı telefonlarda
60 FPS hedefine ulaşılması beklenir ancak **gerçek cihazda ölçülemedi**. Oyun 60 FPS hedefler, ayarlardan
30 FPS düşük performans modu seçilebilir (efekt yoğunluğu da azalır).

## Denge simülasyonu (tests/unit/balance.test.js)

Gerçek `computeStats` + `playerHit` formülleriyle; normal saldırı + bekleme süresi dolan beceriler, MP bütçesi.
Normal yaratıklarda 12 ardışık öldürme (aralarda 2 sn yürüme) ortalamasıdır.

| Senaryo | Süre | Belge hedefi |
|---|---|---|
| Lv1 Warrior → Çayır Sıçanı vuruş başı | 15,64 hasar (2–3 vuruş) | ≈15,6 ✔ |
| Warrior Lv10 Rare +0/+3 → Kazmacı Goblin | ~2 sn | 4–9 sn |
| Warrior Lv19 Rare +3 → Çürük Muhafız | ~4 sn | 4–9 sn ✔ |
| Mage Lv19 Rare +2 → Çürük Muhafız | ~1,9 sn | 4–9 sn |
| Warrior / Mage Lv10 U+1 → Haydut Kaptanı | 20 / 13 sn | 25–50 sn |
| Warrior / Mage Lv11 U+2 → Alfa Kurt (saf DPS) | 79 / 59 sn | 90–150 sn |
| Warrior Lv20 Rare +4 / +3 → Maden Golemi | 185 / 189 sn | 180–300 sn ✔ |
| Mage Lv20 Rare +0 → Maden Golemi | 153 sn | 180–300 sn |
| Lv18–20 brüt farm geliri (120 öldürme/sa, iksir ve tamir öncesi) | ~1.800 G/sa | 900–1.400 net |

Değerlendirme: Yaratık HP/ATK/DEF değerleri ve hasar formülleri belgedeki kanonik değerlerdir ve değiştirilmedi.
Bu değerlerle beceri patlaması (ilk 0,5 sn'de iki beceri + normal vuruş) erken/orta seviye normal yaratıkları hedeften
hızlı öldürüyor. Yalnız normal saldırı ve Uncommon/Normal ekipmanla süreler belge bandına (≈4–6 sn) giriyor.
Golem süreleri hedef aralıkta. Simülasyon üzerine yapılan V1 denge ayarları (belgede sabitlenmemiş parametreler):
aktif beceri rank artışı ~%6/rank, Warrior MP maliyetleri düşürüldü, Mage maliyetleri artırıldı, savaş içi MP
yenilenmesi %0,8/sn ve Warrior "Savaş Nefesi" (isabetli normal vuruş +2 MP). Sonraki denge turu için öneri:
normal/elit yaratık HP'lerinde ×1,5–1,8 artış veya Lv.1–12 aralığında beceri katsayılarının yumuşatılması.

## Görsel inceleme

`tools/scenario.mjs`, `tools/panels.mjs`, `dev/gallery.html` ile 5 harita, tüm paneller, NPC hizmetleri,
karakter/yaratık/ikon/efekt sayfaları tarayıcıda çalıştırılıp ekran görüntüleriyle incelendi; konsol hatası yok.

## Kalan sınırlamalar (dürüst bildirim)

- **Gerçek cihaz testi yok:** Android/iOS donanımında FPS, dokunmatik his, ses gecikmesi ve tam ekran davranışı doğrulanmadı.
  Safari/WebKit motoru ortamda bulunmadığından test edilmedi. iPhone Safari tam ekran API'sini desteklemez; oyun
  "Ana Ekrana Ekle" ipucu ve yatay çevirme ekranıyla geri düşer.
- **Lv1→20 tam manuel oynanış (5–8 saat) gerçek zamanlı yapılmadı.** Görev zinciri, seviye ve ödüller birim testlerinde
  olay bazlı; harita geçişleri, savaş, bosslar ve dungeon tarayıcıda geliştirici araçlarıyla hızlandırılmış senaryolarla doğrulandı.
- **Denge:** yukarıdaki tabloda belge hedeflerinden sapmalar açıkça gösterildi; kanonik statlar korunduğu için ince ayar sonraki tura bırakıldı.
- **Görseller procedural:** el çizimi değil; karakterler 2 yönlü (sağ/sol çevirme) çizilir. Su derin ve geçilmez.
- **Ses:** WebAudio sentezi; basit efekt/ortam/müzik döngüleri.
- **Kayıt güvenliği:** yerel kayıt bilerek düzenlenmeye karşı tam güvenli değildir (belge §1.3); checksum yalnız bozulmayı yakalar.
