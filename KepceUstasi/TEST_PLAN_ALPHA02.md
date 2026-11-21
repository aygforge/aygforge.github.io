# TEST PLAN & SONUÇLAR — Alpha 0.2

Tarih: 20 Kasım 2026 · Ortam: Linux container, Node 22, Chromium (Playwright, başsız, yazılım GL).
Loglar: `reports/alpha02/` (`npm_test.log`, `build.log`, `e2e.log`, denge JSON'ları,
`alpha01_baseline_npm_test.log`, `alpha01_baseline/`).

## Çalıştırılan komutlar

| Komut | Sonuç |
|---|---|
| Alpha 0.1 (`0cd3e26`) çalışma ağacında `npm test` (başlangıç doğrulaması) | 56/56 geçti |
| Alpha 0.1 çalışma ağacında 100 tohum × {random, good, average, perfect, bad} × 2 chapter | 1 000 koşu, 0 hata |
| `npm test` (Alpha 0.2) | **78/78 geçti** (56 eski, güncellenmiş + 22 yeni) |
| `npm run build` | Başarılı (`dist/`, service worker) |
| `npm run test:e2e` (son `dist/` ile) | Aşağıdaki tablo |
| `node tests/sim/balance.mjs 100 final random,good,bad,perfect none` + `upg` + `average` + `a01enemies` | 1 800 koşu, 0 hata (kilit, NaN, çift sonuç yok); sonuçlar BALANCE_REPORT_ALPHA02.md |
| Denge araması (A–E adayları, 30–40 tohum) | ~800 koşu, 0 hata |

Gerçek Android/iOS cihazda test **YAPILMADI**. Dokunma Chromium mobil emülasyonuyla denendi.

## Prompt kabul testleri

| # | Madde | Kanıt | Sonuç |
|---|---|---|---|
| 1 | 24 yeteneğin her biri ve her seviyesi için otomatik davranış testi | `abilities.test.mjs` (16 eski, her biri ölçülebilir etki; Çifte Atış Sv I/II) + `alpha02.test.mjs` (Kritik Sv I/II, Patlama Sv I/II, Püskürtme Sv I/II, Lezzetli Lokma Sv I/II, Dikenli Önlük Sv I/II + boss, Delici Sv I/II, Soğuk Sos + boss sınırı, Karıştır); maks seviye ve aşım reddi tüm 24 kart için | GEÇTİ |
| 2 | 6 dalga → 6 seçim, boss öncesi 6. seçim, boss sonrası yok, çift seçim yok | `runflow.test` (dalgalar [1..6], toplam 6 seviye, 7 teklif olayı = 6 + 1 yenileme, son seçim boss dalgasından önce, teklif dışı ve eskimiş kart reddi) + E2E `A12` (gerçek tıklamalı koşuda 6 seçim) | GEÇTİ |
| 3 | Çoklu atış fiziksel topları çoğaltmaz; `source`/`isBonus` doğru | `alpha02.test` multi-shot (3 fiziksel top → 3 gerçek + 2 bonus, `source: double_shot`), `combat.test` (Sv II: 12 gerçek → tam 12 bonus, hepsi `canProc:false`, kritik değil, `parentShotId` gerçek mermiyi gösteriyor) | GEÇTİ |
| 4 | Aynı tohum + kararlar → aynı kritik, soğuk top oranı, hedefleme; snapshot/restore deterministik | Kritik dizisi iki ayrı koşuda birebir aynı; aynı snapshot'tan iki kez oynanan koşunun sonucu, istatistikleri, kritik RNG durumu ve tarifi aynı | GEÇTİ |
| 5 | Dondurma yalnızca hareket fazını etkiler; geri itme yalnızca vuruşta; normal yürüyüş sola | `alpha02.test` (donmuş düşman bir hareket fırsatını atlar, sayaç ilerlemez, sonraki faz yürür; boss 12 turda en fazla 4 kez donar) + `runflow.test` (tam koşuda her konum değişimi olaya bağlandı: sola yalnız `enemyAction`, sağa yalnız `knockback` vuruş olayı veya boss geri çekilmesi) | GEÇTİ |
| 6 | Patlama/delme/dikenli önlük: tarif iki kez artmaz, HP negatif olmaz, boss zaferden sonra saldırmaz | Dikenli Önlük ile ölen düşman tarif +1 (bir kez), kaçmış sayılmaz; boss karşılık hasarıyla ölünce son olay `victory` ve sonraki temas işlenmez; ikincil zincir testi ve 1 800 koşuda negatif HP / çift ölüm yok | GEÇTİ |
| 7 | Karıştırma kimlikleri korur, tur tüketmez, yalnızca kartla ve uygun fazda | `alpha02.test` (kartsız red, kimlik/tür kümesi aynı, hız impulsu var, tur/dokunuş sayısı değişmez, dalgada 2. kez red, SWING_WAIT dışında red) + E2E `A22` (düğmeye 2 gerçek dokunuş → 1 karıştırma, 0 kepçe inişi) | GEÇTİ |
| 8 | Kartın yazdığı değer = uygulanan değer | Kart metni ve mekanik aynı `ABILITY_VALUES` verisinden; test kart metnindeki sayıları ve `cardInfo` şimdiki/sonraki seviyesini kontrol ediyor; her yetenek testi aynı sayıları oynanışta ölçüyor | GEÇTİ |
| 9 | 360×640 ve uzun ekranlarda 3 kart + yenileme + KARIŞTIR taşmaz; düğme kepçe bırakmaz | E2E `A21` (360×640, 390×844, 412×915: kart paneli sınırları ekran içinde), `A22`; ekran görüntüleri `tests/e2e/screenshots/cards_*`, `shuffle_*` | GEÇTİ |
| 10 | random ve good, eski sürümle karşılaştırma; galibiyet, can kaybı, yük, tur, yıldız, yetenek dağılımı | BALANCE_REPORT_ALPHA02.md | GEÇTİ (rapor). Denge hedeflerinin bir kısmı karşılanmadı, aşağıda |
| 11 | `npm test`, `npm run build`, `npm run test:e2e`, simülasyon raporları | Yukarıdaki tablo | GEÇTİ |
| 12 | Gerçek Android cihaz | — | **TEST EDİLMEDİ** |

## Uçtan uca (E2E) sonuçları

| ID | Kontrol | Sonuç | Ayrıntı |
|---|---|---|---|
| A01 | portrait layout 360x640 | GEÇTİ | canvas 360×640 @(0,0) in 360×640, game H=960, scale 0.667, battle h=410 |
| A22 | shuffle button 360x640: shuffles once, never drops the ladle | GEÇTİ | {"taps":0,"sh":1,"phase":"SWING_WAIT"} |
| A21 | 3 cards + reroll fit on 360x640 | GEÇTİ | y 58–820 of 960, x 32–508 |
| A01 | portrait layout 390x844 | GEÇTİ | canvas 390×844 @(0,0) in 390×844, game H=1169, scale 0.722, battle h=511 |
| A22 | shuffle button 390x844: shuffles once, never drops the ladle | GEÇTİ | {"taps":0,"sh":1,"phase":"SWING_WAIT"} |
| A21 | 3 cards + reroll fit on 390x844 | GEÇTİ | y 162–925 of 1169, x 32–508 |
| A01 | portrait layout 412x915_20-9 | GEÇTİ | canvas 412×915 @(0,0) in 412×915, game H=1199, scale 0.763, battle h=526 |
| A22 | shuffle button 412x915_20-9: shuffles once, never drops the ladle | GEÇTİ | {"taps":0,"sh":1,"phase":"SWING_WAIT"} |
| A21 | 3 cards + reroll fit on 412x915_20-9 | GEÇTİ | y 177–940 of 1199, x 32–508 |
| A01 | portrait layout 1080x1920 | GEÇTİ | canvas 1080×1920 @(0,0) in 1080×1920, game H=960, scale 2.000, battle h=410 |
| A01 | portrait layout desktop_1280x720 | GEÇTİ | canvas 405×720 @(437,0) in 1280×720, game H=960, scale 0.750, battle h=410 |
| A02 | tap spam → one drop / one turn | GEÇTİ | taps +1, catches 1 |
| A15 | pause spam + background auto-pause + resume | GEÇTİ | even toggles→running:true, hidden→PAUSED:true, stays paused on return:true, resume:true |
| PERF | frame rate while swinging (headless Chromium, software GL) | GEÇTİ | 45.4 fps |
| A12 | six skill picks in a full run, none after the boss | GEÇTİ | picks {"spiked_apron":1,"cold_oil":1,"thick_apron":1,"tasty_heal":1,"power_shot":1,"pot_shuffle":1} |
| A14 | Menemen played to the boss and served | GEÇTİ | stars 3, attempts 1, tips 108, unlocked 2 |
| A13 | upgrade purchase by click (atomic, persisted) | GEÇTİ | toughness Sv2, spent 45, tips 63 |
| A14b | Patates Kızartması played to Patates Kral and served (upgrade active) | GEÇTİ | chapter fries, chef max HP 6, stars 3, attempts 1, tips 202 |
| SAVE | close/reopen keeps tips, upgrades, stars, unlocks | GEÇTİ | tips 202, stars M3/F3 |
| A15b | wave checkpoint resume after reload: no double kill/wave/reward | GEÇTİ | wave 3, recipe {"tomato":3,"pepper":1,"egg":0}, result victory 3★, +78 tips once |
| A16 | offline: reload with network off, menu + a real turn work | GEÇTİ | service worker cache |
| NET | no request to any external host (no CDN/ads/analytics) | GEÇTİ | only localhost |
| ERR | no page errors / console errors | GEÇTİ |  |

**23/23 kontrol geçti** — 2026-11-20T16:16:58.925Z, teslim edilen `dist/` ile. Tam oynanışta animasyon 2x; bot kaybederse 'Tekrar Oyna' ile yeniden dener (deneme sayısı ayrıntıda).

## Alpha 0.1'den korunan regresyon kapsamı
Fizik (9 test), savaş (14), ilerleme/kayıt (7), durum makinesi (8) testleri korunup çalıştı. Yalnızca tasarımı
değişen beklentiler güncellendi: yetenek sayısı 16 → 24, Çifte Atış eşikleri, seçim dalgaları [1,3,5,6] → [1..6],
bonus/güvence mermilerinde `canProc:false` alanı, spawn aralığı ve HP ölçeği, sağa itme istisnası, tam chapter
testinde `perfect` bot (Alpha 0.2'de rastgele bot artık her zaman kazanmıyor). Hiçbir test silinmedi.

## Bilinen eksikler / açık konular
- **Denge:** rastgele bot hedef bantlarında (Menemen %79, Patates %44), ama merkeze nişan alan oyuncu modelleri
  (good / average / perfect) %100 kazanıyor. GDD'nin "good" hedefleri (%80–95 / %65–90) **karşılanmadı**. Neden ve
  öneri: BALANCE_REPORT_ALPHA02.md.
- Tahmini chapter süresi botlarla 2–3,7 dk; gerçek oyuncu süresi ölçülmedi.
- Botlar kartları rastgele seçiyor; bilinçli build'lerin gücü ayrıca ölçülmedi.
- Soğuk Sos oranı (%7) ve Güçlü Püskürtme'nin boss etkisi (+1 hasar) varsayımdır (CHANGELOG_ALPHA02.md).
- Gerçek cihaz, ses kulak kontrolü, uzun süreli bellek testi yapılmadı.
