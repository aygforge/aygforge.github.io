# Kayıp Ufuk — Sürüm Durumu (GDD v2.0 tam sürüm)

**RELEASE_READY: HAYIR (false)**: tüm P0 testleri PASS, FAIL yok. Ancak `Contracts/AcceptanceTests.json` kuralı *"tüm P1'ler PASS veya belgelenmiş ve **onaylanmış** alternatif"* der. Fiziksel telefon gerektiren 5 P1 testi bu bulut konteynerinde çalıştırılamadı (NOT_RUN). Bunlar gerçek Android cihazda koşulmadan ya da ürün sahibi bir alternatifi onaylamadan RELEASE_READY denmez. Ayrıntılı liste aşağıda ve `reports/test-results.json → releaseReadyBlockers` alanında.

## Test özeti (gerçek çalıştırmalar)
| Küme | PASS | FAIL | NOT_RUN | Kaynak |
|---|---|---|---|---|
| 92 runtime kabul testi | **89** | 0 | 3 (P1, cihaz/performans) | unit + Chromium E2E |
| 28 görsel kabul testi | **26** | 0 | 2 (P1, cihaz profili) | PNG çözümleyici + Chromium görsel |
| P0 testleri | **hepsi PASS** | 0 | 0 | |
| Birim/sistem testleri (`npm test`) | 79 | 0 | – | `reports/evidence/unit-tap.txt` |
| Tarayıcı E2E senaryoları (`npm run test:e2e`) | 35 | 0 | 1 (AT_PERFORMANCE_01) | `reports/evidence/e2e-results.json`, 94 ekran görüntüsü |
| Tarayıcı görsel senaryoları (`npm run test:visual`) | 9 | 0 | – | `reports/evidence/visual-results.json`, 72 dosya |
| Konsol hatası (E2E + görsel) | 0 | | | |
| Statik teslim ön denetimi (`tools/validate_delivery.py`) | STATIC_CHECKS_OK | | | `reports/delivery-precheck.json` |
| Fiziksel atlas doğrulayıcı (`tools/validate_atlases.mjs`) | 24/24 sayfa, 3180/3180 kare, 0 hata | | | `reports/evidence/atlas-validation.json` |
| GDD statik denetimi (`audit_v20.py`) | 0 failed (yalnızca statik, runtime değil) | | | |

Manuel test sayısı: **0**. Tüm kanıtlar otomatik (Node `node --test`, Playwright Chromium headless). Gerçek telefonla el ile oynanış yapılmadı.

### NOT_RUN (RELEASE_READY engelleri, hepsi P1)
| ID | Neden | Elde olan referans kanıt |
|---|---|---|
| AT_PERFORMANCE_01 | Orta seviye Android gerekir | headless masaüstü: medyan 59,9 FPS, p95 16,8 ms, heap 43 MiB (`e2e/perf_desktop_headless.json`) |
| AT_PERFORMANCE_03 | Soğuk açılış cihazda ölçülmeli | Pixel 5 yatay emülasyonu + 4× CPU kısma: menü ≈1,2 s, Devam görünür (`mobile-reference.json`) |
| AT_PERFORMANCE_04 | En dar yatay ekranda 30 dk insan oyun testi gerekir | dokunma hedefi denetimi (AT_INPUT_UI_06) ve ilk barınak/aletler (AT_ITEM_CRAFT_01) PASS |
| VIS_22 | Çözülmüş asset belleği cihazda profillenmeli | önbellekler sınırlı; 24 sayfa sürekli yüklü (en kötü 96 MiB > 48 MiB hedef, sahne bazlı tahliye yok; SI-15) |
| VIS_23 | En düşük hedef Android gerekir | – |

## Tamamlanan sistemler (kod + test kanıtı)
- **Veri/çekirdek (M01):** 31 DB + 7 harita yükleyici ve doğrulayıcı (`src/data/ContentRegistry.js`), sfc32 RNG akışları, SHA-256/HMAC, 30 Hz sabit adım, 18 dakikalık gün, işlem/geri alma ve idempotent txId'li StateStore, 512×384 atlas dünyası, RLE ızgaralar, 8 yönlü A*, ayak kutusu çarpışması, gelgit/geçitler.
- **Ekonomi (M02):** 179 eşya, 183 tarif (114 eşya tarifi çalıştırıldı), escrow, istasyon + 10 karo sandık, kuyruk, dayanıklılık/tamir, 58 yapının tamamı dünyada kuruldu (VIS_08), 4 hazır ev, 9 yükseltme (UID korunur).
- **Survival/ekoloji (M03–M04):** ihtiyaçlar, hava geçmişi, yağmur suyu, 12 ürün (her evre görünür), yenilenen düğümler, 25 tür AI, 10 balık + olta gerilim oyunu, mızrak, 3 tuzak, evcil hayvanlar, 8 ustalık, uyku/yükleme idempotansı.
- **Keşif (M05):** 38 POI (hepsi ekran görüntülü), 12 bulmaca, 15 günlük, 20 plan, 3 mağara, kalıcı köprü/kestirmeler, sal + 3 adacık.
- **Finaller (M06):** yelkenli + resif geçişi ve güneş/jeneratör telsizle otomatik SOS; ikisi de oyundan uçtan uca oynatıldı (VIS_16), final sonrası ada yaşamı devam eder.
- **Kayıt (M07):** IndexedDB v5, 3 slot, checksum, 2 yedek, bozuk kayıttan kurtarma, v1→v5 göç, içe/dışa aktarma, çoklu sekme kilidi; mağara/sal/ev/yarım bulmaca kaydet-yeniden yükle (VIS_17).
- **Varlıklar (M08):** 24 atlas × 1024² PNG, 3180 kare; 2 px kenar uzatmalı dolgu; 63 ses Web Audio sentezi (`reports/audio-provenance.json`); emoji yok (VIS_07).
  - **Farm RPG – Tiny Asset Pack (EmanuelleDev) entegrasyonu:** 3180 karenin **1644**'ü paketten uyarlandı (`tools/farmpack/`, kaynak/hücre listesi `public/assets/farmpack_manifest.json`): 99 eşya/kodeks ikonu, 11 ekin × 4 evre + toprak, 14 kaynak düğümü × 2 durum, 21 bitki/dekor, 80 arazi dokusu + 48 kıyı/nehir/patika geçişi + 24 su dalgası karesi, 31 yapı (+hayalet ve ateş efektleri), 5 tür hayvan (244 kare), oyuncu karakteri (990 kare: 2 gövde × 16 klip × 4 yön, kıyafet maskesi, 6 saç). Kalan 1536 kare (ilgi noktaları, evler, tekneler, deniz canlılarının çoğu, sahne çizimleri, arayüz simgeleri) prosedürel üreticiden (`tools/assetgen/`).
  - Lisans gereği paket depoda yok (`vendor/` git-ignore); oyunda ana menü + ayarlar + "Emeği geçenler" panelinde ve `CREDITS.md`'de EmanuelleDev kredisi var. Kullanılmayan paket bölümleri ve gerekçeleri: `tools/farmpack/README.md`.

## Bu turda bulunup düzeltilen hatalar
1. Düşürülen çantanın karosu yerine işlem nesnesi kaydediliyordu → kayıt `DataCloneError` (`src/main.js dropSelected`).
2. LOW kalitede yağmur dizisi kesirli uzunluk → `RangeError` (`WorldRenderer.weather`).
3. **Sal kıyıya kurulunca binildikten sonra hiç hareket edemiyordu** (çapa kara/su sınırında) → `SeaVehicleSystem.raftAnchor` + binerken suya kaydırma.
4. Sal, yüzülemeyen nehir kıyısına kurulabiliyordu → yerleşim kuralı (SI-13).
5. 2 günlük ürünler 2. evreyi atlıyordu (SI-14).
6. Sola bakan elde alet elden ~19 px kopuk çiziliyordu; giysi maskesi body_a'da taşıyordu; köpekbalığı bir kare var olmayan `idle` klibine geçiyordu.
7. Ev çatıları/kamp ateşi/yelkenli: görünmez çarpışma hücreleri vardı → kalça çatı, kamp ocağı ve 3/4 görünüm tekne çizimi.
8. Orman kuşu/martı silüetleri ve tahta/demir mızrak ikonları çok benzerdi → yeniden çizildi.
9. Dekor önbelleği sınırsızdı → 160 parça ile sınırlandı.
10. Erişilebilirlik: "Hareket azalt" ayarı artık dünyayı da etkiler; tehdit işareti eklendi (VIS_26).

## Bilinen eksikler / sınırlamalar
- Gerçek Android cihaz testi yapılmadı (yukarıdaki 5 P1).
- AT_PERFORMANCE_02 **PASS** (masaüstü Chromium, sözleşmedeki cihaz hedeflerinden biri): 60 dk gerçek süre, 448 ziyaret (9 bölge + 3 adacık + 3 mağara), heap 8,3 → 9,0 MiB (en çok 9,1), ikinci yarı eğimi 0,011 MiB/10 dk, önbellekler sınırlı, 0 hata (`reports/evidence/perf-longsession.json`). Telefonda tekrarlanmalı.
- Atlas sayfaları sahne bazında boşaltılmıyor (SI-15).
- `REED_PATCH` haritada yer almadığı için oyunda görünmez (SI-12, kaynak veri).
- Görsellerin 1644 karesi üçüncü taraf paketten (lisanslı, kredili), kalanı prosedürel; iki stil arasındaki geçişler (ör. evler, tekneler, deniz canlıları) insan gözüyle değerlendirilmelidir. Paket karakteri prosedürelden küçüktür (yaklaşık 22×36 ekran pikseli).
- Asset paketini yeniden içe aktarmak için paket yerelde gerekir (`vendor/farmpack` veya `FARMPACK_DIR`); depodaki atlaslar hazır derlenmiş haldedir.

## Çalıştırma komutları
```bash
cd kayip-ufuk
npm run assets          # 24 atlas PNG (tools/assetgen) + Farm RPG paketi içe aktarımı (tools/farmpack; paket yerelde gerekir)
npm run build           # dist/ (depodaki atlasları paketler; fiziksel doğrulama başarısızsa durur; --assets ile yeniden üretir)
npm run dev             # yerel geliştirme sunucusu
npm run serve           # python3 -m http.server 8000 -d dist
npm test                # 79 birim/sistem testi
npm run test:e2e        # Chromium E2E (IndexedDB, mobil, ekran görüntüleri)
npm run test:visual     # Chromium görsel kabul testleri
npm run test:longsession  # 60 dk bellek oturumu (DURATION_MIN ile ayarlanır)
npm run report          # reports/test-results.json (92 + 28 kimlik)
npm run package         # build + validate_delivery + Kayip_Ufuk_HTML5_Tam_Surum.zip
```
Dağıtım: `dist/index.html` (statik HTTP, göreli yollar, harici ağ isteği yok) ve `Kayip_Ufuk_HTML5_Tam_Surum.zip` (index.html arşiv kökünde).
