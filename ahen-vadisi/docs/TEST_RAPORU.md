# Ahen Vadisi — Test Raporu

## V2.0 «Kül ve Ayaz» (21 Ekim 2026)

Ortam V1 ile aynı (Linux, Node 22, Playwright headless Chromium, yazılımsal WebGL). Gerçek Android/iOS cihazında test
**yapılamadı**. Komutlar: `npm test` · `npm run build && npm run test:e2e` (V1 regresyonu + V2 senaryoları).

| Paket | Sonuç |
|---|---|
| Birim testleri (Vitest, 9 dosya) | **103 / 103 geçti** (V1'in 75 testi V2 için güncellendi + 23 V2 testi + 5 V2 denge/veri testi) |
| V1 uçtan uca regresyon (`run-e2e.mjs`) | **61 / 61 geçti** — V1 kontrolleri, kayıt, PWA, Derin Ocak ve Golem değişmeden çalışıyor |
| V2 uçtan uca (`run-e2e-v2.mjs`) | **32 / 32 geçti** |
| Üretim derlemesi | Başarılı |

### V2 birim testleri (`tests/unit/v2.test.js` ve güncellenen dosyalar)

| Alan | Doğrulanan |
|---|---|
| Kayıt geçişi | Şema 1 zarfı açılır; seviye, gold, Legendary M08+3, görevler aynen; beceri çubuğu (V1 düzeni), Av Geçmişi (`fromV1`), koşu/kitap alanları eklenir; doğrulama geçer; V1 legendary etkisi aynı; daha yeni şema reddedilir; geçiş idempotent; depo `v1_backup`'ı bir kez yazar, sonraki açılışta yeniden yazmaz |
| Seviye | 20→21 ve 29→30 eşikleri tam EXP ile; Lv.30 sınırı (fazla EXP 0); 87 stat, 29 (+2 sınıf görevi) beceri puanı; her seviyede HP/MP artışı; Lv.25 becerisinin açılması; EXP tablosu 19.280 … 58.610 (toplam 368.300) |
| Haritalar | 112×80 ve 116×88 ölçüleri; 4 farm kampı (≥150 spawn hücresi), 1 elit, boss arenası, güvenli kamp, 2 gizli sandık, Yol Taşı, ≥10 toplama düğümü, NPC'ler; her girişten tüm hedeflere onarımsız erişim (V1 harita testleri V2 haritalarını da kapsar); gerçek ve çift yönlü geçitler; Maden→Kül (m27) ve Kül→Ayaz (m33) hikâye kilitleri; Buz Mabedi 4 bölüm, 3 mühür galeride, kapılar koridorları kapatır |
| Loot | **Donmuş Muhafız 1.000.000 kesim: Legendary %0,4 toplam (4σ), Rare %30, Epic %7, kendi sınıfı %80, 1000+ kesimlik kuraklık (pity yok)**; Kül Devi 300.000 kesim: Rare %22, Epic %2, **0 Legendary**; V2 elitleri Epic havuzlu, Legendary'siz; **30 V2 eşyasının tamamı bir kaynaktan elde edilebilir**; boss kanonik havuzları belgeyle aynı; Golem Legendary/Rare havuzu V1 ile birebir aynı; Golem ve Muhafız dışında hiçbir kaynakta Legendary yok (her kaynak 100.000 öldürme); hiçbir tarif Legendary üretmez; Av Geçmişi sayaçları ganimeti etkilemez (aynı tohum → aynı sonuç) |
| Buz Mabedi | Ayrı kilit ve koşu (V1 Derin Ocak etkilenmez); mühür bir kez sayılır; ölüm noktaları cp1/cp2/checkpoint; devam; koşu kimlikli tek boss ödülü; çıkış ve yeni koşu; "Buz Mabedinin Sırrı" kapı mührünü önce şamanlar yenilince açar |
| Beceriler | Kılıç Yağmuru / Zincir Yıldırım belge değerleri; beceri çubuğu (4 yuva, kilitli beceri konamaz, yer değiştirme, kayıtta kalır); Ustalık Kitabı (Lv.30 + Rank 5 + kitap, her beceriye bir kez, sıfırlamada kalır) |
| Ekonomi | Lv.21+ yükseltmeler aynı başarı oranı / daha yüksek maliyet; +3/+4 V1 materyali (Sertleştirme Taşı, Sunak Kristali) gerekir; +5 Kor Çekirdeği (Kadim Çekirdek'ten üretilir); başarısızlık eşyayı kırmaz/düşürmez; +5 sınırı; V2 tarifleri V1 materyallerini (Golem Parçası) tüketir; sınırsız gold döngüsü testi tüm 35 tarifi kapsar |
| Denge | Aşağıdaki tablo |

### V2 denge simülasyonu (gerçek stat/hasar formülleri; V2 senaryolarında rastgele bonuslu eşya ve bütün beceri puanları)

| Senaryo | Sonuç | Hedef |
|---|---|---|
| Warrior Lv.26 Rare+3 → Kül Devi | ~4,2 dk | 3–5 dk |
| Mage Lv.26 Rare+2 → Kül Devi | ~3,3 dk | 3–5 dk |
| Warrior Lv.30 Rare/Epic+4 → Donmuş Muhafız (+2 kristal) | ~5,4 dk | 4–6 dk |
| Mage Lv.30 Rare/Epic+3 → Donmuş Muhafız (+2 kristal) | ~4,0 dk | 4–6 dk |
| V2 normal yaratık öldürme süresi (seviyeye uygun donanım) | Warrior 1,6–5,4 sn · Mage 1,5–3,3 sn | ≤ 20 sn (120 öldürme/saat bütçesi) |
| 20→30 toplam süre | ~5,8 sa farm + ~3 sa görev/boss/zindan ≈ **8,8 sa** | 8–12 sa |

Hareket payı (telegraflardan kaçma) Warrior ×1,2, Mage ×1,3 olarak modellenir; gerçek oynanışla ölçülmemiştir.

### V2 uçtan uca testleri (`tests/e2e/run-e2e-v2.mjs`, gerçek oyun içinde)

| Test | Sonuç |
|---|---|
| Tarayıcı deposuna yazılan V1 zarfı açılır, V2'ye geçer, seviye/gold korunur, V1 yedeği saklanır | ✔ |
| Lv.20→26 gerçek EXP ile; V1 finali olmadan Kül Yaylaları geçidi kapalı (uyarı); "Kırılan Ufuk" sonrası geçiş ve görev hedefleri | ✔ |
| Kül Yaylaları: 4 yaratık + Kül Devi doğar; parçacıklar, NPC, sandık, Yol Taşı, cevher; V2 öldürme ödülleri ve Av Geçmişi | ✔ |
| V2 sprite'larının darbe/ölüm animasyonları | ✔ |
| Kül Devi gerçek AI ile: telegraflı saldırılar, ≤3 alev yarığı, %55'te 2 yardımcı; yardımcılar EXP vermez; ölümde tehlikeler temizlenir; yeniden doğma zamanlanır | ✔ |
| Kül Kasabı öfke + telegraflı satır + garantili nişan; gizli sandık tek seferlik | ✔ |
| Ayaz Geçidi: 4 yaratık, kar, mabet kapısı; Buz Gardiyanı telegrafları; mabet görev olmadan mühürlü | ✔ |
| Buz Mabedi: bölümler, mühürsüz galeri kapanmaz, 3 mühür karşılaşması → boss kapısı; Buz Mührü + 2 kristal; ölüm → boss tam can, bölümler korunur; tek boss ödülü; ikinci ödül yok; gönüllü çıkış | ✔ |
| Beceri çubuğu UI ile 5. beceri yerleşir; Ustalık Kitabı UI ile uygulanır (tam 1 kitap); Av Geçmişi ekranı | ✔ |
| Kılıç Yağmuru çok hedef; Mage Lv.25 Zincir Yıldırım ≥3 hedefe sıçrar; iki turda da konsol hatası yok | ✔ |

Performans (yazılımsal WebGL, 844×390): V1 ölçümleri değişmedi (orman ~26 FPS, dungeon ~19 FPS); V2 ekran görüntülerinde
Kül Yaylaları ~31 FPS, Ayaz Geçidi ~19 FPS, Buz Mabedi ~20 FPS. Yalnız etkin haritanın yaratıkları güncellenir; parçacıklar
sabit havuzdur. Gerçek telefonda ölçülmedi.

---

# Ahen Vadisi V1 — Test Raporu

Tarih: 21 Ekim 2026 · Ortam: Linux, Node 22, Chromium 141 (Playwright 1.56, headless, mobil dokunmatik emülasyonu,
**yazılımsal WebGL / SwiftShader**). Gerçek Android/iOS cihazında test **yapılamadı** (ortamda cihaz yok).

Komutlar: `npm test` (birim) · `npm run build && npm run test:e2e` (uçtan uca). E2E ekran görüntüleri: `tests/e2e/screens/`,
makine okunur sonuç: `tests/e2e/report.json`.

## Özet

| Paket | Sonuç |
|---|---|
| Birim testleri (Vitest, 8 dosya) | **75 / 75 geçti** |
| Uçtan uca testler (Playwright) | **61 / 61 geçti** |
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
| Görevler | Her hedefin harita işaretinin hedefin yapılabildiği haritayı göstermesi (çok haritalı görevde ipucu ilerler); 26 görevin + 2 sınıf görevinin her iki sınıfla gerçek olaylarla (öldürme, ulaşma, etkileşim, teslim, dungeon) alınıp tamamlanması; ödülün bir kez verilmesi; ön koşul ve seviye kilitleri; yanlış yaratık sayacı artırmaz; aynı nesne iki kez sayılmaz; Av Sözleşmeleri ayrı ve tekrarlanabilir |
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
| Zehir tiki oyuncuyu öldürünce oyun döngüsü hatasız; ölüm penceresi ve yeniden doğma | ✔ |
| Görev yön okları aktif görevin hedefine giden gerçek yürüme yolu üzerinde görünür | ✔ |
| Joystick halkasının çevresine (halkanın dışına) dokunmak da yürütür | ✔ |
| Stat puanı 0'ın altına inmez (devre dışı butona zorla dokunulsa bile); onaylanınca kaydedilir | ✔ |
| Karakter panelinde 4 stat ve Onayla butonu kaydırmadan ekrana sığar (844×390) | ✔ |
| Harita geçişi okun tam üstü değil, geçidin 2 tile yanından da olur | ✔ |
| Tüccar: gold ve çanta doluluğu panel başlığında her zaman görünür | ✔ |
| Satın alma onay penceresi ister; Vazgeç ile gold değişmez, onayla düşer | ✔ |
| Kırmızı OTO butonu kapalıyken hedef kendiliğinden vurulmaz; büyük kılıç her basışta en yakın hedefe vurur | ✔ |
| Hazır sprite paketleri yüklenir: Warrior (Fantasy Warrior), Mage (Wizard Pack), Cevher Rahibi (Evil Wizard 2) | ✔ |

### Performans (SwiftShader yazılım GPU, 844×390)

| Senaryo | Oyun adımı / sn | Yaratık | JS bellek |
|---|---|---|---|
| Orman, normal yoğunluk | ~38–45 | 28 | ~35–65 MB |
| Orman + 30 saldırgan kurt | ~37–41 | 52 | ~35–65 MB |
| Düşük performans modu (30 FPS sınırı) | 23 (ekran 57 FPS'te yenilenirken) — **sınır uygulanıyor** | 52 | — |
| Derin Ocak (karanlık + ışıklar) | ~28–31 | 20 | — |

"Oyun adımı" WorldScene.update çağrı sayısıdır (Phaser'ın `actualFps` değeri ham ekran karelerini sayar ve FPS
sınırını göstermez; test bu yüzden adım sayacına göre yapılır).

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

Hayatta kalma (yalnız düşmanın telegrafsız normal saldırıları, iksirsiz, oyuncu hiç kaçmadan):

| Senaryo | Ölüm süresi |
|---|---|
| Warrior / Mage Lv10 → Kazmacı Goblin | 28,4 / 15,6 sn |
| Warrior Lv10 → Haydut Kaptanı (elit) | 28,8 sn |
| Warrior / Mage Lv11 → Alfa Kurt | 43,1 / 24,3 sn |
| Warrior / Mage Lv20 → Maden Golemi | 42 / 21,9 sn |
| Warrior Lv19 → Çürük Muhafız | 30,2 sn |

Değerlendirme: Yaratık HP/ATK/DEF değerleri ve hasar formülleri belgedeki kanonik değerlerdir ve değiştirilmedi.
Bu değerlerle beceri patlaması (ilk 0,5 sn'de iki beceri + normal vuruş) erken/orta seviye normal yaratıkları hedeften
hızlı öldürüyor. Yalnız normal saldırı ve Uncommon/Normal ekipmanla süreler belge bandına (≈4–6 sn) giriyor.
Golem süreleri hedef aralıkta. Simülasyon üzerine yapılan V1 denge ayarları (belgede sabitlenmemiş parametreler):
aktif beceri rank artışı ~%6/rank, Warrior MP maliyetleri düşürüldü, Mage maliyetleri artırıldı, savaş içi MP
yenilenmesi %0,8/sn ve Warrior "Savaş Nefesi" (isabetli normal vuruş +2 MP).

Oynanış botu (aşağıda) bulguları üzerine yapılan ek ayarlar — **kanonik ATK değerleri değiştirilmedi**, yalnız
belgede sabitlenmemiş "telegrafsız normal saldırı katsayısı" eklendi: elitler ×0,7, Alfa Kurt ×0,35 (saldırı aralığı
2,0 sn), Maden Golemi ×0,5. Telegraflı büyük saldırılar (Yırtıcı Atılım ×1,8, Ezici Darbe ×2,2 vb.) tam güçte kaldı;
böylece hasarın çoğu kaçınılabilir saldırılardan gelir (belge §5: "boss hasarı kaçınılmaz tek vuruş ölümüne dönüşmemeli").
Alfa'nın çağırdığı Sürü Kurdu HP 160 / ATK 18'e indirildi ve 30 sn ömürlü yapıldı (belgede statı yok). Sürü uyarısı en yakın 2 boştaki
aynı tür yaratıkla, 5 tile ile sınırlandı; Yağmacı/Goblin/Yarasa/Cüce/Cevher Rahibi/Sis Cadısı algılama yarıçapları 4–5 tile'a düşürüldü. Sonraki denge turu için öneri:
normal/elit yaratık HP'lerinde ×1,5–1,8 artış veya Lv.1–12 aralığında beceri katsayılarının yumuşatılması.

## Oynanış botu (src/dev/bot.js · tools/bot-run.mjs)

Ana görev zincirini gerçek oyun kodu ve gerçek dokunmatik hedefleme API'si üzerinden oynayan bir Warrior botu
(Chromium + SwiftShader, oyun hızı ×4). Bot görev alır/teslim eder, hedefe dokunur, becerileri kullanır, telegraf
alanlarından kaçar, iksir/ekipman alır, çöpü parçalayıp Avcı Palası üretir, ot toplayıp iksir yapar, çok ölünce
seviye kasar ve her ölümde son 20 sn'nin hasar kaynaklarını yazar. Bot kiting yapmaz; bu yüzden insan oyuncudan
daha çok ölmesi beklenir.

**Bot sayesinde bulunup düzeltilen hatalar**

| Bulgu | Düzeltme |
|---|---|
| **Zehir tiki oyuncuyu öldürünce oyun döngüsü çöküyordu** (`poison.left` null) — oyun tamamen donuyordu | Sıra düzeltildi; e2e testi eklendi (zehirle ölüm → hatasız yeniden doğma); ayrıca dünya döngüsü varlık bazında korumalı: beklenmeyen bir hata konsola raporlanır ama oyunu dondurmaz |
| Elit sayacı haritadaki **tüm** öldürmeleri sayıyordu; Haydut Kaptanı (Lv10) görev 6'dan önce kampta beliriyordu | Belgedeki "alan-kesim katkısı" kuralı: yalnız elitin kendi kampındaki öldürmeler sayılır |
| Büyük boss gövdesi ev noktasına oturamayınca "dönüş" durumunda takılı kalıyor, iyileşiyor ve Sürü Kurtları haritada kalıcı tehlike olarak kalıyordu | Dönüşe 7 sn sınır; çağrılan yaratıklar savaş bitince dağılır; Sürü Kurdu 30 sn ömürlü |
| Görev 15 "Mührün Gücü"nün harita işareti Maden kapısını gösteriyordu, oysa ilk hedef (Çürük Muhafız) Bataklık'ta | Hedef bazlı ipucu: işaret önce Bataklık mezarlığını, sonra Maden kapısını gösterir; tüm görevler için birim testi |
| İki elli silah kuşanılıyken kalkan karşılaştırması sahte kazanç gösteriyordu (kalkan kuşanılamaz) | Karşılaştırma gerçek sonucu (değişiklik yok) gösterir; birim testi |
| Kalabalık kamplarda (Yağmacı, Cevher Rahibi, Sis Cadısı) uzak algılama 4–6 yaratığı aynı anda çekiyordu | Algılama yarıçapları 4–5 tile |
| **Daire telegrafları ekranda elips (dikey ×0,75) çiziliyor ama isabet testi tam daireydi** — oyuncu çizili alanın hemen üstünde/altında da vuruluyordu | İsabet testi görünen elipsle aynı (`inTelegraphCircle`; Ezici Darbe, Kristal Patlaması, Yer Sarsıntısı, Kasırga) |

**Son tam koşu (Warrior, ×4 hız):**

| Aşama | Seviye | Oyun içi süre | Toplam ölüm |
|---|---|---|---|
| Görev 6 Terk Edilmiş Kamp | 8 | 11,6 dk | 1 |
| Görev 7 Alfa'nın İni (Alfa Kurt) | 11 | 38,2 dk | 6 |
| Görev 10 Sert Kabuk | 12 | 48,3 dk | 6 |
| Görev 12 Sislerin Ardında | 15 | 83,4 dk | 17 |
| Görev 15 Mührün Gücü (dungeon kilidi) | 18 | 110,2 dk | 19 |
| Görev 16 Derinlere İniş (dungeon bölüm 1–3) | 19 | 129,9 dk | 26 |
| Lv.20'ye ulaşma, görev 17 (Madenin Kalbi) alındı | 20 | 150,2 dk | 30 |

Bot görev 1–16'yı tamamladı ve Lv.20'ye ulaştı. **Golem'i bu koşuda yenemedi:** bot, iksirleri bitince dungeon'dan
çıkıp ikmal yapmayı bilmediği için kontrol noktasından iksirsiz tekrar tekrar girdi (bot eksikliği). Ölümlerin çoğu
Cevher Rahibi (görev 11) ve Sis Cadısı (Lv.18–19 farmı) gruplarında; bunun üzerine bu menzilli yaratıkların algı
yarıçapı tekrar düşürüldü. Oyun içi 150 dk'da Lv.20 hızı, kiting yapmayan otomatik oyuncu içindir; insan oyuncuda
keşif, okuma ve ekonomi ile belgedeki 5–8 saatlik hedefin gerçekçiliği **ayrıca ölçülmedi**.

**Hedefli Golem denemesi** (`tools/golem-trial.mjs`; Lv.20, her denemeden önce 15 Büyük HP İksiri, bot telegraflardan
kaçar, gerçek oyun döngüsü, ×2 hız):

| Sınıf / donanım | Sonuç |
|---|---|
| Warrior, Rare +3 (6 slot) | 1. koşu: **181 sn'de yendi** (13 iksir). Telegraf düzeltmesinden sonra 2. koşu: 1. deneme Golem %9'dayken öldü (173 sn), 2. deneme **181 sn'de yendi** (12 iksir) — belge bandı 180–300 sn ✔ |
| Mage, Rare +0 | 3 denemede yenemedi; en iyi: Golem %54'te (71 sn). Ölümlerin çoğu Ezici Darbe (1,5 sn telegraf) — bot büyücü bu saldırıdan güvenilir kaçamıyor; Mage'in saf DPS'i Warrior'dan yüksek. **İnsan oyuncuyla Mage–Golem dengesi doğrulanmadı.** |

Golem savaşı iksir tüketimi yüksek (Warrior ~12–13 Büyük HP İksiri ≈ 1.700–1.800 Gold); Golem gold/loot getirisiyle
birlikte bir sonraki denge turunda değerlendirilmeli.

## Görsel inceleme

`tools/scenario.mjs`, `tools/panels.mjs`, `dev/gallery.html` ile 5 harita, tüm paneller, NPC hizmetleri,
karakter/yaratık/ikon/efekt sayfaları tarayıcıda çalıştırılıp ekran görüntüleriyle incelendi; konsol hatası yok.

## Kalan sınırlamalar (dürüst bildirim)

- **Gerçek cihaz testi yok:** Android/iOS donanımında FPS, dokunmatik his, ses gecikmesi ve tam ekran davranışı doğrulanmadı.
  Safari/WebKit motoru ortamda bulunmadığından test edilmedi. iPhone Safari tam ekran API'sini desteklemez; oyun
  "Ana Ekrana Ekle" ipucu ve yatay çevirme ekranıyla geri düşer.
- **Lv1→20 tam manuel (insan) oynanış (5–8 saat) yapılmadı.** Yerine oynanış botu gerçek oyun kodu üzerinden görev
  1–16'yı tamamlayıp Lv.20'ye ulaştı (yukarıda); Golem ayrıca hedefli denemeyle Warrior'la yenildi. Mage–Golem dengesi
  ve görev 17–18'in bot tarafından uçtan uca oynanması doğrulanmadı (görev zinciri birim testlerinde olay bazlı tamamlanıyor).
- **Denge:** yukarıdaki tabloda belge hedeflerinden sapmalar açıkça gösterildi; kanonik statlar korunduğu için ince ayar sonraki tura bırakıldı.
- **Görseller:** oyuncu karakterleri ve Cevher Rahibi hazır CC0 sprite paketleri (LuizMelo), diğerleri procedural. Hazır sprite'larda kuşanılan ekipman karakter üzerinde görünmez (statlara etkisi sürer). Karakterler 2 yönlü (sağ/sol). Su derin ve geçilmez.
- **Ses:** WebAudio sentezi; basit efekt/ortam/müzik döngüleri.
- **Kayıt güvenliği:** yerel kayıt bilerek düzenlenmeye karşı tam güvenli değildir (belge §1.3); checksum yalnız bozulmayı yakalar.
