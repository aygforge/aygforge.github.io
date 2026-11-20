# CHANGELOG — Alpha 0.3 (Yakalama Hissi ve Build Dengesi)

Temel: Alpha 0.2 (commit `202fd77`). Sıfırdan yazılmadı. Tek Şef, portrait iki yarı, gerçek Matter.js yakalama,
hibrit tencere, 2 chapter / 2 boss, 24 yetenek / 6 seçim, 6 kalıcı geliştirme, kayıt, offline/service worker,
ekonomi ve reklam/IAP köprüleri korundu. Yeni chapter, karakter, animasyon seti veya UI paneli eklenmedi.

## Başlangıçta doğrulanan durum
* Alpha 0.2 raporundaki sayılar kodla eşleşiyor: Menemen ×1,7 / boss 42, Patates ×2,8 / boss 62, spawn
  0,58–0,64 / 0,56–0,62; `SECONDARY_EVENT_CAP` 40; 78 birim + 23 E2E.
* **Merkez baskınlığı ölçüldü** (ALPHA03_FEEL_REPORT.md): merkezin ±82 px'i 133 ms hatayla bile ≥5,2/7 yük.
  Kök neden topçuk yoğunluğu (kepçe hacmi ≈10 topçuk > kapasite 7).
* **1 yıldız neden yoktu:** Kural "1★ boss, 2★ tam tarif" idi ama tarifi kaçırmak için Menemen'de ~6 domatesin
  kaçması gerekiyor. Her kaçış Şef'e 1 can (5 can) kaybettirdiği için Şef önce ölüyordu. Yani 1★ zafer kural gereği
  değil, **kompozisyon nedeniyle pratikte imkânsızdı**.
* **Delici Yağ** yalnız boss kaldığında arkada düşman olmadığı için sessizce boşa gidiyordu (`pierceMiss`).

## Dosya bazında değişiklikler

| Dosya | Değişiklik |
|---|---|
| `src/data/content.js` | `POT` 30/24/36/6 → **24/20/30/5**; `LADLE.radius` 44 → **42**; `swingPeriod` 2,0 → **1,7 sn**; Patates dengesi: genel ×2,8 yerine **tür bazlı can** (patates 6, zırhlı 14 + 2 kalkan, tuz 4), **tuz biber gibi hareket eder**, dalga x 0,52–0,58, boss 54 / x 0,64. Menemen değerleri değişmedi. Delici Yağ kart metni. |
| `src/systems/PotPhysics.js` | Taban profiline **ridges** (±72 px, 26 px) ve 48 parçalı zemin; **kümeli döküm** (`pourX`, tohumlu, ±34 px); parametreler `POT_GEOM` üzerinden. Hibrit formül, kimlik koruma, karıştırma, snapshot aynı. |
| `src/systems/EnemyDirector.js` | Chapter dengesinde **tür bazlı can** (`balance.hp`) ve **hareket paterni geçersiz kılma** (`balance.move`, düşmana `e.move` olarak yazılır, snapshot'a girer). Tuz Kalkanı etki sayacı. |
| `src/systems/CombatResolver.js` | **Delici Yağ:** arkada canlı yoksa (ör. tek boss) mermi hedefi "delip geçer": **hedefe +1 hasar** (`drill: true`). Artık sessiz kayıp yok. Kart etkilerinin gerçekten tetiklendiğini sayan `run.stats.procs`. Hız önceliği hızlı tuzu tanır. |
| Yetenek eşikleri (veri: `ABILITY_VALUES`) | 200 tohumlu ölçümde hiç tetiklenmeyen kartlar düzeltildi: **Tava Patlaması** her 3. → **her 2. öldürmede** (etkisiz %92 → %20), **Zincir Pişirme** 3+ → **2+ öldürme** (%86 → %19). **Tencereyi Karıştır** artık topçukları yukarı ve **orta havuza doğru** savuruyor (Alpha 0.2: rastgele yana; zayıf tencereyi dağıtıyordu). Kart metinleri aynı veriden. |
| `src/systems/RecipeTracker.js` | **Yıldız kuralı:** 2★ = tam tarif **ve** can kaybı ≤ 3 (`STAR2_MAX_HP_LOSS`); 3★ değişmedi (≤1). Böylece zorlu ama kazanılmış koşu 1★ olabiliyor. Kayıtlı en yüksek yıldızlar korunur. |
| `src/systems/Abilities.js`, `RunController.js` | Etki sayaçları (Kalın Önlük/İlk Yardım uygulanınca, yakalama kartları her yakalamada, Karıştır kullanılınca). |
| `src/scenes/GameScene.js` | Okunurluk: kart açıklaması 19 → 21 px, kart 168 → 178 px; **ÇİFTE YAĞ!** etiketi (salvo başına bir kez); **donmuş düşmanın can çubuğu buz mavisi**; Delici Yağ'ın "Delip geçti" etiketi; yıldız kuralı metni; ağız yüzdesi yeni tabana göre. |
| `public/assets/kitchen/pot.png` | Aynı `floorY` profilinden yeniden üretildi (sırtlar görünür). Diğer varlıklar birebir aynı. |
| `tests/unit/*` | 78 test korunup güncellendi (yeni taban sayıları, ağız 42, 1,7 sn periyot, Patates tür bazlı can, Delici Yağ boss davranışı, en geniş kepçeyle 5 topluk yığın). **Yeni `alpha03.test.mjs` (11 test).** Toplam 89. |
| `tests/sim/simlib.mjs` | `perfect/good/average` artık **tencereyi okuyan** oyuncu (görünür en dolu noktaya nişan, 0/67/133 ms hata); Karıştır kartı varsa zayıf tencerede kullanır; bilinçli build kart seçimleri `dmg`, `control`, `sustain`. |
| `tests/sim/feel.mjs` (yeni), `ability-bench.mjs` (yeni), `batch.mjs` | Yakalama hissi ölçümü; 24 kartın senaryo tezgâhı; yük histogramı, etkisiz kart, NaN / çift sonuç sayaçları. |
| `tests/e2e/e2e.mjs` | Yeni kart konumu. |
| `MenuScene.js`, `index.html`, `package.json` | Sürüm 0.3. |

## Kayıt uyumluluğu
Kayıt şeması değişmedi (`schemaVersion` 1). Alpha 0.1/0.2 dalga snapshot'ları açılır. Eski düşmanlarda `move`
alanı yoksa tür varsayılanı kullanılır, `procs` yoksa boş başlar. Tencere topçuk sayısı eski snapshot'ta 36'ya
kadar olabilir: yenileme formülü kalanları korur, yeni üst sınır 30'a kadar ekleme yapmaz. Hiçbir topçuk silinmez.

## Varsayımlar / öneriler
* Bot modelleri gerçek oyuncu değildir; zamanlama hatası Gauss 67 / 133 ms olarak varsayıldı.
* Delici Yağ için seçilen yol: "boss için sınırlı alternatif etki" (+1 hasar, kartta yazıyor). Teklif kurallarını
  değiştirmek yerine bunu seçtim, çünkü kart boss dalgasından önce de her koşulda bir şey yapmalı.
* Yıldız eşiği (can kaybı ≤ 3) bir öneridir; değeri `STAR2_MAX_HP_LOSS` sabitinden ayarlanır.
* Menemen dengesine dokunulmadı; orta oyuncu için hedef bandın üstünde kalıyor (ALPHA03_BALANCE_REPORT.md).
