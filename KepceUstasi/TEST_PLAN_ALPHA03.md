# TEST PLAN & SONUÇLAR — Alpha 0.3

Tarih: 20 Kasım 2026 · Linux container, Node 22, Chromium (Playwright, başsız, yazılım GL).
Loglar: `reports/alpha03/` (`npm_test.log`, `build.log`, `e2e.log`, `e2e_results.json`, simülasyon JSON'ları,
`feel/`, `ability-bench.*`).

## Çalıştırılan komutlar

| Komut | Sonuç |
|---|---|
| `npm test` | **89/89 geçti** (Alpha 0.2'nin 78 testi korunup güncellendi + 11 yeni Alpha 0.3 testi) |
| `npm run build` | Başarılı |
| `npm run test:e2e` (son `dist/`) | **23/23 geçti** |
| `node tests/sim/feel.mjs` (27 aday, 10–16 tencere, 9 konum × 3 tolerans) | ALPHA03_FEEL_REPORT.md |
| `tests/sim/batch.mjs` × 26 kombinasyon × 200 tohum, Alpha 0.2 ve 0.3 | 10 400 koşu, 0 hata / NaN / çift sonuç |
| Son yapıyla doğrulama, 8 kombinasyon × 200 tohum | 1 600 koşu, 0 hata |
| `node tests/sim/ability-bench.mjs` | 24 kart × 6 senaryo, `reports/alpha03/ability-bench.md` |

**Test edilmeyenler:** Gerçek Android/iOS cihaz, gerçek dokunma gecikmesi, safe-area çentiği, ses çıkışı,
gerçek cihazda 30/60 FPS performansı **test edilmedi**. Başsız Chromium (yazılım GL) salınım sırasında 53,9 fps
ölçtü; bu cihaz performansını temsil etmez. Yakalama hissi yalnız bot modelleriyle ölçüldü; gerçek oyuncu hissi
doğrulanmadı.

## Prompt kabul maddeleri

| Madde | Kanıt | Durum |
|---|---|---|
| Merkez baskınlığını ölç (9 konum × ≥3 tolerans, histogram, dağılım) | ALPHA03_FEEL_REPORT.md: konum tabloları, yük histogramları, topçuk dağılımı, en iyi noktanın yeri | Yapıldı |
| Merkezde sürekli ~6/7 yakalamayı azalt, fizik/hibrit/tek dokunuş korunarak | Okuyan good 6,35 → 6,05, average 5,85 → 4,58; koşularda 7+ payı %59 → %40 | Yapıldı |
| Parametreleri ayrı ayrı küçük adımlarla dene | 27 aday, tek değişken tabloları | Yapıldı |
| Birden fazla anlamlı küme; yanlarda da kazançlı yakalama | En iyi nokta %35 yan kümede; `alpha03.test` taban sırtları ve döküm kümeleri | Yapıldı |
| Deterministik, FPS'den bağımsız, snapshot uyumlu | `alpha03.test` döküm determinizmi, okuyan bot aynı tohumda aynı koşu; `alpha02.test` snapshot/restore ve 0.1 kayıt geçişi (`e.move`/`procs` alanları silinerek) | GEÇTİ |
| Düşman/boss yeniden dengesi, tür bazında | Patates tür bazlı can + hızlı tuz + yakın dalga; Menemen değişmedi; ×2,8 süngeri ölçüldü (tur −4/−4/−4) | Yapıldı; orta oyuncu bantları **karşılanmadı** (rapor) |
| Boss 4–7 etkili tur (iyi oyun) | Menemen 6,2 · Patates 7,1 | Karşılandı (Patates sınırda) |
| Boss ölünce gecikmiş saldırı yok | `combat.test` zafer kapısı, `alpha02.test` Dikenli Önlük zaferi, `runflow.test` sonuç sonrası olay yok | GEÇTİ |
| 24 kart + 6 seçim korunuyor, tooltip = mekanik | `abilities.test`, `alpha02.test` kart metni ↔ değerler; Tava Patlaması/Zincir Pişirme/Delici Yağ/Karıştır metinleri yeni kurallarla aynı kaynaktan | GEÇTİ |
| Etkilerin fark edilirliği | ÇİFTE YAĞ! etiketi, KRİTİK yazısı/parlama, patlama halkası, itme tween'i, buz mavisi can çubuğu, "Delip geçti", can çalma metni | Yapıldı (görsel) |
| Delici Yağ boss'ta boşa gitmesin | Arkada kimse yoksa hedefe +1 (`drill`), kartta yazıyor; `alpha02.test` güncellendi | GEÇTİ |
| Karıştır yeniden değerlendirildi | Ortaya toplayan fiziksel savurma; test: orta havuza ≥ +4 topçuk, kimlikler aynı | GEÇTİ |
| 3 bilinçli build botu | `dmg`, `control`, `sustain` (ALPHA03_BALANCE_REPORT.md) | Yapıldı |
| Zincir korumaları regresyon testi | `alpha03.test` tüm kartlar maks + kalabalık: sonlanıyor, ≤40 ikincil olay, tek ölüm/tek tarif, bonuslar `canProc:false`, negatif can yok | GEÇTİ |
| 1★ zafer erişilebilir | Kural incelendi (kompozisyon nedeniyle imkânsızdı); 2★ için can kaybı ≤ 3 şartı; `alpha03.test`; simülasyonda Menemen rastgele 52/200 1★ | GEÇTİ |
| Kart seçimi ritmi ve okunurluk | Son salvo animasyonundan 0,42 sn sonra kart paneli; seçimden sonra 0,76 sn dalga girişi (kod ölçümü). Kart açıklaması 21 px (360×640'ta ≈14 px); E2E A21 3 ekranda sığıyor | Yapıldı |
| 200 tohum × 2 chapter × 5 politika × 2 profil, Alpha 0.2 karşılaştırma, build botları | ALPHA03_BALANCE_REPORT.md | Yapıldı |
| Mevcut 78 birim ve 23 E2E kontrolünü kaybetme | 89 birim, 23 E2E | GEÇTİ |

## E2E sonuçları (2026-11-20T21:30:03.026Z)

| ID | Kontrol | Sonuç | Ayrıntı |
|---|---|---|---|
| A01 | portrait layout 360x640 | GEÇTİ | canvas 360×640 @(0,0) in 360×640, game H=960, scale 0.667, battle h=410 |
| A22 | shuffle button 360x640: shuffles once, never drops the ladle | GEÇTİ | {"taps":0,"sh":1,"phase":"SWING_WAIT"} |
| A21 | 3 cards + reroll fit on 360x640 | GEÇTİ | y 58–840 of 960, x 32–508 |
| A01 | portrait layout 390x844 | GEÇTİ | canvas 390×844 @(0,0) in 390×844, game H=1169, scale 0.722, battle h=511 |
| A22 | shuffle button 390x844: shuffles once, never drops the ladle | GEÇTİ | {"taps":0,"sh":1,"phase":"SWING_WAIT"} |
| A21 | 3 cards + reroll fit on 390x844 | GEÇTİ | y 162–945 of 1169, x 32–508 |
| A01 | portrait layout 412x915_20-9 | GEÇTİ | canvas 412×915 @(0,0) in 412×915, game H=1199, scale 0.763, battle h=526 |
| A22 | shuffle button 412x915_20-9: shuffles once, never drops the ladle | GEÇTİ | {"taps":0,"sh":1,"phase":"SWING_WAIT"} |
| A21 | 3 cards + reroll fit on 412x915_20-9 | GEÇTİ | y 177–960 of 1199, x 32–508 |
| A01 | portrait layout 1080x1920 | GEÇTİ | canvas 1080×1920 @(0,0) in 1080×1920, game H=960, scale 2.000, battle h=410 |
| A01 | portrait layout desktop_1280x720 | GEÇTİ | canvas 405×720 @(437,0) in 1280×720, game H=960, scale 0.750, battle h=410 |
| A02 | tap spam → one drop / one turn | GEÇTİ | taps +1, catches 1 |
| A15 | pause spam + background auto-pause + resume | GEÇTİ | even toggles→running:true, hidden→PAUSED:true, stays paused on return:true, resume:true |
| PERF | frame rate while swinging (headless Chromium, software GL) | GEÇTİ | 53.9 fps |
| A12 | six skill picks in a full run, none after the boss | GEÇTİ | picks {"spiked_apron":1,"chain_cooking":1,"explosive_oil":1,"cold_oil":1,"thick_apron":1,"stable_rim":1} |
| A14 | Menemen played to the boss and served | GEÇTİ | stars 3, attempts 1, tips 108, unlocked 2 |
| A13 | upgrade purchase by click (atomic, persisted) | GEÇTİ | toughness Sv2, spent 45, tips 63 |
| A14b | Patates Kızartması played to Patates Kral and served (upgrade active) | GEÇTİ | chapter fries, chef max HP 6, stars 3, attempts 1, tips 202 |
| SAVE | close/reopen keeps tips, upgrades, stars, unlocks | GEÇTİ | tips 202, stars M3/F3 |
| A15b | wave checkpoint resume after reload: no double kill/wave/reward | GEÇTİ | wave 3, recipe {"tomato":3,"pepper":1,"egg":0}, result victory 3★, +78 tips once |
| A16 | offline: reload with network off, menu + a real turn work | GEÇTİ | service worker cache |
| NET | no request to any external host (no CDN/ads/analytics) | GEÇTİ | only localhost |
| ERR | no page errors / console errors | GEÇTİ |  |

## Bilinen eksikler
* Orta oyuncu modeli iki chapter'da da %100 kazanıyor (hedef %75–95 / %55–90). Neden ve öneri ALPHA03_BALANCE_REPORT.md'de.
* Patates rastgele %66,5, bandın (%35–65) 1,5 puan üstünde.
* Tam koşularda good − average yük farkı ~0,35'te kaldı (his ölçümünde 1,47).
* Perfect/bad/upg/build kombinasyonları kart eşik düzeltmesinden önceki yapıyla ölçüldü (ana 8 kombinasyon son yapıyla yeniden doğrulandı).
* Gerçek cihaz testi yapılmadı.
