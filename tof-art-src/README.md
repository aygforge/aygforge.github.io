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
| `art/icons.js` | Arayüz ikonları ve ticaret malı ikonları (16×16) |
| `art/ocean_tile.js`, `art/ocean_base.js` | Açık deniz su dokusu (3 katman, 2 kare animasyon) ve dümen suyu |
| `art/portraits.js` | Menülerdeki portreler (oyun-içi sprite'lardan üretilir) |

## Yeniden derleme

1. Orijinal tek-dosya oyunu `orig/game.html` olarak koyun.
2. Betiği (HTML'in 568–569. satırları) `game.js` olarak çıkarıp biçimlendirin:
   `npx prettier@3.3.3 --parser babel --print-width 160 game.js > game.pretty.js`
3. `node build.mjs` → `out/TidesOfFortune.html` (`--dev` hata ayıklama kancaları ekler).

`build.mjs`, `game.pretty.js` içindeki eski çizim bölümlerini satır aralıklarıyla bu modüllerle değiştirir
ve esbuild ile küçültür.

## Genişleme 3 sürümü (`expansion3/`)

Güncel oyun (`TidesOfFortune.html`) Genişleme 3 sürümünün üzerine kuruludur. Bu sürümde yeniden çizilenler:

- `expansion3/x3props.js` — Genişleme 2-3 ile gelen 35 sahne objesi (kale, zincir, taş sütunlar/geçit,
  yaşayan ada, tiyatro sahnesi, top salı, saat kulesi, cam dalga vb.), fırlatılan şişe ve can simidi,
  çan ikonu, yeni kaptan gemilerinin yelken armaları.
- `expansion3/patches.mjs` — bu modülü ve küçük bağlantı yamalarını (arma, fırlatma, `dusk`/`fog` deniz
  tonları) küçültülmüş oyuna uygular.
- `expansion3/build3.mjs` — Genişleme 3 HTML'inin betiğini (573–574. satırlar) prettier ile biçimlendirip
  `game.pretty.js` yaptıktan sonra `node build3.mjs` ile derler.

Not: modül, oyundaki küçültülmüş yardımcı adlarına (`m, p, x, R, Z…`) dosyanın son satırındaki çağrıyla
bağlanır; oyun yeniden küçültülürse yalnızca o satırın güncellenmesi gerekir.
