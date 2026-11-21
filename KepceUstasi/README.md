# Kepçe Ustası — Alpha 0.4A (HTML5)

**Stüdyo:** Ayg Forge · **Çalışma adı:** Kepçe Ustası · **Sürüm:** Alpha 0.3 (Menemen + Patates Kızartması; yakalama hissi ve build dengesi)

> **Alpha 0.4A:** 20 level kampanya (L1–L20, `src/data/alpha04/*.json`) + enerji (30 maks, giriş 10, 12 dk'da +1). Ayrıntı: `CHANGELOG_ALPHA04A.md`.
> **Alpha 0.3:** `CHANGELOG_ALPHA03.md` · `ALPHA03_FEEL_REPORT.md` (yakalama hissi) · `ALPHA03_BALANCE_REPORT.md` · `TEST_PLAN_ALPHA03.md`.
> Alpha 0.2 belgeleri: `CHANGELOG_ALPHA02.md`, `TEST_PLAN_ALPHA02.md`, `BALANCE_REPORT_ALPHA02.md`.
> Alpha 0.1 belgeleri (`CHANGELOG.md`, `TEST_PLAN.md`) tarihsel kayıt olarak duruyor.

Dikey (portrait) mobil oyun. Ekranın **alt yarısında** sağa-sola salınan kepçeyi doğru anda bırakıp
kaynayan tencereden **gerçek çarpışmalı** yağ topçukları yakalarsın; **üst yarıda** isimsiz Şef yakaladığın
her topçuğu sağdan sola, tur bazlı ilerleyen sebzelere otomatik fırlatır. Pişen sebzeler tavaya düşer,
tarif sayaçları dolar; boss yenilince yemek servis edilir.

## Hızlı başlangıç

Gereksinim: Node.js 18+ (20/22 önerilir), npm.

```bash
npm install          # Phaser 3.90, matter-js 0.20, Vite 6, Pixelify Sans fontu (yerel)
npm run dev          # geliştirme sunucusu: http://localhost:5173 (aynı ağdaki telefondan da açılabilir)
npm run build        # dist/ klasörüne statik web çıktısı (+ çevrimdışı service worker)
npm run preview      # dist/ çıktısını http://localhost:4173 adresinde sunar
```

`dist/` klasörü herhangi bir statik web sunucusuna (itch.io HTML5 oyunu, GitHub Pages, nginx…) olduğu gibi
yüklenebilir; tüm yollar görelidir (`base: './'`). Dış CDN, reklam veya analitik isteği yoktur.

> `dist/index.html` dosyasını doğrudan çift tıklayarak (`file://`) açmak tarayıcı güvenlik kuralları nedeniyle
> çalışmaz (ES modülleri ve ses/görüntü yükleme). Bir kez `npm run preview` veya basit bir statik sunucu kullanın.
> Sayfa bir kez açıldıktan sonra service worker sayesinde **internet olmadan** tekrar açılır.

### claude.ai Artifact önizleme derlemesi (isteğe bağlı)

`npm run build:artifact` → `artifact-dist/` (tek `game.js` + varlıklar; Phaser 3.90.0 ve matter-js 0.20.0 sabit
sürümle jsDelivr'den, font Google Fonts'tan yüklenir). Oyun kodu normal derlemeyle aynıdır; yalnızca
service worker yoktur. Asıl teslim/itch.io çıktısı `npm run build` → `dist/` klasörüdür.

### Varlıkları yeniden üretmek (isteğe bağlı)

Tüm sprite (PNG) ve ses (WAV) dosyaları `tools/gen-assets.mjs` ile prosedürel olarak çizilir/sentezlenir ve
`public/assets/` altına yazılır. Depoda hazır gelir; değiştirmek isterseniz:

```bash
npm run assets
```

## Kontroller

| Eylem | Telefon | Masaüstü |
|---|---|---|
| Kepçeyi bırak (yalnızca salınım sırasında, tur başına 1 kez) | Ekrana dokun (üst veya alt alan) | Fare tıklaması / **Space** |
| Duraklat / devam | Sağ üstteki **II** | **P** veya **Esc** |
| Geri (Android geri tuşu) | Tarayıcı geri hareketi → duraklatma / panel kapatma | Tarayıcı geri |
| Yetenek seçimi | Kartlardan birine dokun; koşuda 1 ücretsiz yeniden seçim | aynı |
| Tencereyi karıştır (kart varsa) | Salınım sırasında KARIŞTIR düğmesi, dalga başına 1 | aynı |

Oyun arka plana alınınca (sekme değişimi, uygulama küçültme) **otomatik duraklar**; geri dönüldüğünde
zaman ileri sarılmaz, devam için **DEVAM** gerekir.

## Oyun döngüsü (Alpha 0.1)

1. Restoran ana ekranı → **OYNA** (tek dokunuş: sıradaki açık tarif) ya da **TARİFLER**.
2. Her chapter = 6 normal dalga + 1 boss. Her kepçe hamlesi bir turdur:
   kepçe → mermi kuyruğu → isabetler → ölüm/tava/yetenek zinciri → boss zafer kapısı → düşman eylemi →
   sağdan sola tek hareket fazı → temas hasarı → dalga/boss geçişi → hibrit tencere yenileme → yeni kepçe.
3. Her normal dalga (1–6) sonunda 3 kartlık yetenek seçimi: koşu başına 6 seçim, 24 yetenek havuzu (çoklu atış,
   kritik, patlama, delme, geri itme, dondurma, can çalma, dikenli önlük, tencere karıştırma…), 1 ücretsiz yenileme.
4. Boss yenilince servis: 1–3 yıldız, bahşiş, ilk servis bonusu. Kaybedince tamamlanan dalgaya göre kısmi bahşiş.
5. **GELİŞTİR** ekranında 6 kalıcı geliştirme hattı (kapasite, genişlik, dayanıklılık, atış, tava, baharat).

## Kayıt

* Konum: tarayıcının `localStorage` alanı, anahtar `kepceUstasi.save.v1` (+ yedek `kepceUstasi.save.v1.bak`).
* İçerik: şema versiyonu, bahşiş, upgrade seviyeleri, açılan chapter, chapter başına en yüksek yıldız,
  ayarlar, eğitim durumu, ödülü verilmiş koşu kimlikleri ve **dalga başı koşu snapshot'ı**.
* Her kayıt sağlama toplamıyla yazılır; ana kayıt bozulursa yedek yüklenir, o da bozuksa kontrollü sıfırlama
  mesajı gösterilir.
* Koşu sırasında her dalganın ilk kepçe turunda güvenli checkpoint alınır. Tarayıcı/uygulama kapanırsa ana
  ekranda **DEVAM ET** çıkar ve o dalganın başından (aynı tencere topçukları, aynı yetenekler, aynı tarif
  sayaçları) devam edilir. Koşu ödülü `runId` ile **yalnızca bir kez** yazılır.
* Ayarlar → **KAYDI SIFIRLA** (iki aşamalı onay) tüm ilerlemeyi siler.

## Testler

```bash
npm test                         # 87 birim/entegrasyon testi (Node test runner, gerçek Matter.js fiziği)
npm run test:sim -- 100 random   # 100 tohumlu tam koşu simülasyonu (kilit/NaN/çift ödül taraması)
node tests/sim/balance.mjs 100 final random,average,good,perfect,bad none   # denge raporu (4 paralel süreç, uzun sürer)
node tests/sim/feel.mjs 12        # yakalama hissi: 9 konum × 3 zamanlama toleransı yük histogramı
node tests/sim/ability-bench.mjs  # 24 kartın senaryo karşılaştırması
npm run build && npm run test:e2e   # Playwright + Chromium ile dist/ üzerinde gerçek tıklamalı uçtan uca test
```

E2E testi için makinenizde Playwright yoksa: `npm i -D playwright && npx playwright install chromium`.
Sonuçlar ve ekran görüntüleri `tests/e2e/results.json` ve `tests/e2e/screenshots/` altına yazılır.
Ayrıntılı sonuçlar: **TEST_PLAN.md**.

### Geliştirici kısa yolları (normal arayüzde görünmez)

* `?seed=12345` — koşu tohumunu sabitler (tencere kompozisyonu, spawn, yetenek teklifleri).
* `?dev=1` veya `?test=1` — `window.__KEPCE__` üzerinden oyun durumunu okumaya izin verir (testler kullanır).

## Proje yapısı

```text
src/
  main.js                 Phaser oyun kurulumu, font yükleme, service worker kaydı
  config/layout.js        portrait yerleşim (üst savaş / alt tencere), ekran oranına göre esneme
  data/content.js         GDD tabloları: düşmanlar, boss'lar, dalgalar, tarifler, 16 yetenek, 6 upgrade, ekonomi
  core/rng.js             tohumlu deterministik RNG
  systems/
    RunController.js      tur durum makinesinin TEK otoritesi (faz, girdi kilidi, token, pause, snapshot)
    PotPhysics.js         Matter.js tencere: topçuklar, kavisli taban, hibrit yenileme, kepçe çarpıştırıcıları
    LadleController.js    salınım, tek dokunuş, iniş/kapanma/kaldırma, fiziksel yakalama + kapasite taşması
    CombatResolver.js     mermi kuyruğu, hedefleme, hasar/kalkan, ölüm, yetenek zincirleri, bonus mermiler
    EnemyDirector.js      spawn, sağdan sola tur hareketi, boss davranışları, temas
    RecipeTracker.js      tarif sayaçları ve yıldız şartları
    Abilities.js          16 geçici yetenek: uygunluk, teklif, etkiler, kepçe parametreleri
    Progression.js        bahşiş, kalıcı upgrade, chapter açılımı, tek seferlik ödül
    SaveService.js        sürümlü, sağlama toplamlı, yedekli kayıt
  scenes/                 BootScene (yükleme), MenuScene (restoran), GameScene (sunum)
  ui/widgets.js           pixel-stil buton/panel/metin
  platform/               AdService, PurchaseService (tarayıcıda "unavailable"), AudioService, Lifecycle
public/assets/            üretilmiş PNG sprite'lar ve WAV sesler (chefs, enemies, bosses, oils, kitchen, ui, audio)
tools/gen-assets.mjs      varlık üretici
tests/unit, tests/sim, tests/e2e
```

Oyun mantığı Phaser'dan bağımsızdır: `systems/` klasörü Node'da başsız çalışır, sahne yalnızca olayları
oynatır. Bu yüzden animasyon hızı (Ayarlar → 1x/2x) veya FPS tur sonucunu değiştirmez.

## Android / para kazanma hazırlığı

* `src/platform/AdService.js` ve `PurchaseService.js` soyut arabirimlerdir; tarayıcıda her çağrı
  `{ status: 'unavailable' }` döner ve **asla ödül vermez**. Ödüllü reklam düğmeleri "Android sürümünde"
  olarak devre dışı görünür. Capacitor ile paketlenirken bu iki sınıfın yerine gerçek SDK adaptörü bağlanır.
* `Lifecycle.js` geri tuşu/arka plan olaylarını tek yerde toplar (Capacitor `App` eklentisine taşınabilir).
* APK bu teslimatta **üretilmedi** (prompt gereği zorunlu değil).

## Bilinen sınırlamalar

* Alpha kapsamı: 2 chapter, 2 boss, 3 yağ türü (normal, büyük, soğuk sos), 24 yetenek, 6 upgrade. Chapter 3–8, özel yağlar,
  ek şefler bilinçli olarak yok.
* Denge (Alpha 0.3, bot simülasyonu): rastgele dokunan bot Menemen %76 / Patates %66; tencereyi okuyan orta ve
  iyi oyuncu modelleri %100 kazanıyor (Patates'te yıldız kaybıyla). Ayrıntı: ALPHA03_BALANCE_REPORT.md.
* Yakalama hissi (Alpha 0.3): daha az topçuk, 1,7 sn salınım, orta + iki yan havuz, kümeli döküm. Yalnız botlarla
  ölçüldü: ALPHA03_FEEL_REPORT.md.
* Gerçek telefon donanımında test **yapılmadı**; dokunmatik giriş Chromium'un mobil emülasyonu ile test edildi.
* Kayıttan devam, ilerlemeyi **dalga başına** geri alır (dalga içi ilerleme kasıtlı olarak saklanmaz).
* Müzik basit, özgün, döngüsel bir 8 ölçülük parçadır; ses efektleri kısa sentez seslerdir.
* `file://` ile doğrudan açılış desteklenmez (bkz. yukarı).

## Lisans / kaynaklar

* Kod, sprite ve sesler bu proje için özgün olarak üretildi (Ayg Forge). Başka oyunlardan sprite, kod, logo,
  UI çizimi veya ses kullanılmadı.
* Font: **Pixelify Sans** — SIL Open Font License 1.1 (`@fontsource/pixelify-sans` paketiyle yerel olarak gömülür).
* Kütüphaneler: Phaser 3 (MIT), matter-js (MIT), Vite (MIT).
