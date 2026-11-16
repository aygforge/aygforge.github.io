# Tides of Fortune — 3/4 (üst-karşı) bakış çizim kaynakları

`TidesOfFortune.html` içindeki tüm oyun-içi görseller kodla (canvas) çizilir. Bu klasör, eski
tam-üstten çizim kodunun yerine geçen yeni **3/4 bakış** çizim modüllerini içerir.

| Dosya | İçerik |
| --- | --- |
| `art/chars.js` | Mürettebat + NPC karakterleri (4 yön, yürüme/çalışma/oturma/tepki, şapkalar, aletler) |
| `art/pets.js` | Hayvanlar (kedi, köpek, papağanlar, maymun, martı, kaplumbağa, gelincik, ahtapot) |
| `art/ship.js` | Gemi: gövde, kıç aynası, direkler, yelkenler; 4 yön (kıçtan, pruvadan, yandan) |
| `art/cargo.js` | Kargo sandıkları, çuvallar, fıçılar… |
| `art/props1.js`, `art/props2.js` | Olay sahnelerindeki tüm objeler (adalar, sandallar, canavarlar, enkaz…) |
| `art/harbor.js`, `art/dock.js` | Liman kasabası, iskele, kıyı |
| `art/worlddraw.js`, `art/deckdraw.js`, `art/deckbub.js`, `art/ocean_*.js` | Y-sıralı çizim, yelken saydamlaşması, uzak gemiler, martılar |
| `art/portraits.js` | Menülerdeki portreler (oyun-içi sprite'lardan üretilir) |

## Yeniden derleme

1. Orijinal tek-dosya oyunu `orig/game.html` olarak koyun.
2. Betiği (HTML'in 568–569. satırları) `game.js` olarak çıkarıp biçimlendirin:
   `npx prettier@3.3.3 --parser babel --print-width 160 game.js > game.pretty.js`
3. `node build.mjs` → `out/TidesOfFortune.html` (`--dev` hata ayıklama kancaları ekler).

`build.mjs`, `game.pretty.js` içindeki eski çizim bölümlerini satır aralıklarıyla bu modüllerle değiştirir
ve esbuild ile küçültür.
