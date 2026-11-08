# NEXT_STEPS — RELEASE_READY için kalan işler

Kod tarafında P0 eksiği yok. Kalan işlerin tamamı fiziksel cihaz veya ürün sahibi kararı gerektiriyor.

| Sıra | Test ID | Yapılacak | Dosya / araç |
|---|---|---|---|
| 1 | AT_PERFORMANCE_01 | Orta seviye Android Chrome (yatay 16:9) üzerinde `dist/` statik HTTP'den açılır; 10 dk oyun, FPS medyan/p95 kaydı (hedef 60, alt sınır 30 FPS seçeneği) | `chrome://inspect` + Performance; ayarlar → FPS hedefi 30/60, grafik LOW/HIGH |
| 2 | AT_PERFORMANCE_02 | Konteyner sonucu `reports/evidence/perf-longsession.json` içinde; aynı döngü cihazda 60 dk | `tests/e2e/longsession.mjs` (DURATION_MIN) |
| 3 | AT_PERFORMANCE_03 | Telefonda soğuk açılış süresi + "Devam" görünürlüğü | referans: `reports/evidence/mobile-reference.json` |
| 4 | AT_PERFORMANCE_04 | En dar desteklenen yatay ekranda 30 dk insan oyun testi (ilk barınak/aletler) | — |
| 5 | VIS_22 | Cihazda plaj/orman/mağara geçişlerinde decoded image bellek profili. Gerekirse sahne bazlı atlas tahliyesi: `src/render/SpriteAtlas.js load()` sayfaları tembel yüklemeli, sahneye göre `img.src=''` ile boşaltmalı (SI-15) | `src/render/SpriteAtlas.js` |
| 6 | VIS_23 | En düşük hedef Android'de mağara + yağmur + sürü + kalabalık kamp | ayarlar: LOW + Hareket azalt |

Cihaz testleri bitince: `npm run report` → `reports/test-results.json` yeniden üretilir; manuel sonuçlar için ilgili kimliğe kanıt (video/ekran görüntüsü yolu) eklenmelidir. Sonra `npm run package`.

Alternatif: ürün sahibi bu P1'ler için konteyner/emülasyon kanıtını "onaylı alternatif" olarak kabul ederse (AcceptanceTests `blocking` kuralı), karar `reports/spec-issues.md` içine yazılıp `tools/make_test_report.mjs` içindeki onay listesine eklenmelidir.
