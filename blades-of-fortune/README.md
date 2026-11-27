# Blades of Fortune — AYG FORGE

Tides of Fortune motorundan türetilmiş, tek dosyalık, çevrimdışı çalışan Orta Çağ roguelite RPG.

- **Oyna:** `BladesOfFortune.html` dosyasını herhangi bir tarayıcıda aç (masaüstü veya Android; yatay ekran). İnternet gerekmez.
- **Kaynak:** `src/` (ES modülleri). `BladesOfFortune_Source.zip` aynı kaynağın paketidir.

## Derleme

```bash
npm install          # yalnızca esbuild
npm run build        # → BladesOfFortune.html (JS + CSS + gömülü yazı tipi tek dosyada)
npm test             # 174 düğüm doğrulaması + akış testleri (Node)
node tests/browser.mjs   # isteğe bağlı: Playwright ile gerçek tarayıcıda arayüz oynanışı
```

## Mimari

| Modül | Dosya | Tides karşılığı |
|---|---|---|
| Deterministik RNG | `src/engine/rng.js` | `Bt` hash + `Te` sınıfı (birebir taşındı) |
| Kayıt yöneticisi | `src/engine/save.js` | `Oi` sınıfı (`.bak` yedek, sürüm, dışa/içe aktarma); anahtarlar `bof.*` |
| Event Director | `src/engine/director.js` | `_s` sınıfı: aynı fazlar (`NORMAL_SAILING` … `DOCKED`), `beginEncounter/choose/playOutcome/continueAfter/toSail`, `runSteps/tickSteps/exec/flushInstant` |
| Koreografi dili | `src/engine/choreo.js` | `o()/d()` adım dili; dizi = paralel grup; `setup/approach/intro/action/outcome/exit` sahne kurucu |
| Ses | `src/engine/audio.js` | master/music/sfx/amb kanalları + zamanlayıcı; Orta Çağ sesleri sentezlenir |
| Oyun çekirdeği | `src/core/game.js` | çekirdek sınıf (`act/persist/newRun/depart/nextEvent/choose/continueEvent/finishRoute`) |
| Savaş | `src/core/combat.js` | yeni: 5 eylemli kısa tur tabanlı savaş (bekleyen karar modeli) |
| Rota/olay üretimi | `src/core/worldgen.js` | seed tabanlı rota ve olay seçimi, tekrar önleme |
| Dünya/çizim | `src/render/world.js`, `sprites.js` | okyanus → önbellekli prosedürel kara yolu parçaları; gemi → savaşçı |
| Arayüz | `src/ui/ui.js`, `style.css` | `#ui/#overlay/#bubbles` katmanları, ahşap/parşömen dili |
| İçerik | `src/data/events/*.js`, `chains_a.js`, `chains_b.js`, `final.js` | 100 olay + 20 zincir / 74 aşama + Kraliyet Sınavı |

Not: Kaynak Tides dosyası 1,3 MB'lık sıkıştırılmış tek bir paketti. Denizcilik dışı çekirdek alt sistemler okunabilir modüllere dönüştürülerek taşındı; gemiye ve denize özgü çizim, kargo ve mürettebat sistemleri bu oyunda yerlerini kara yolu, savaşçı, ekipman ve savaş sistemlerine bıraktı. Tides dosyası değiştirilmedi.

## Yeni olay ekleme

Bir olay; `setup` (aktörler/nesneler), `appr`, `intro`, seçenekler (`opts`), seçeneğe özgü `act` ve sonuca özgü `out` (`'anahtar.win'`, `'anahtar.lose'`, `'anahtar.flee'`) adımlarından oluşur. Altın/HP/eşya değişimleri `auto()` adımında otomatik olarak görselleştirilir. `npm test` her yeni olayı gerçek Director ile baştan sona oynatır.
