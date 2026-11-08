# Kayıp Ufuk — Üretim Planı (GDD v2.0)

Kaynak: `Kayip_Ufuk_GDD_v2_0/` (değiştirilmez). Kod `src/`, üretici `tools/`, testler `tests/`, çıktı `dist/`.

## Mimari kararlar
- Saf ES modülleri (derleme bağımlılığı yok). `node tools/build.mjs` → `dist/` (kod kopyası + paketlenmiş DB/harita kopyası + 24 atlas PNG).
- Simülasyon çekirdeği DOM'dan bağımsız (`src/core`, `src/systems`, `src/world`) → Node'da `node --test` ile deterministik test edilir.
- Tek dünya koordinatı: 512×384 deniz atlası; MAIN/LIGHTHOUSE/WRECK/FERTILE RLE ızgaraları `originAtlas` konumlarına basılır. Mağaralar ayrı ızgaralar.
- Kullanıcı arayüzü DOM katmanı (dokunma hedefleri ≥48 CSS px), dünya Canvas2D (imageSmoothing kapalı).
- Görseller: `tools/assetgen/` Node piksel-sanat üreticisi → `AtlasLayout.json` koordinatlarına birebir 24×1024² RGBA PNG.
- Ses: `src/audio/SynthBank.js` saf JS DSP ile 63 tetikleyiciyi özgün sentezler (Web Audio, ilk dokunuştan sonra).
- Kayıt: IndexedDB `kayip_ufuk` v5 şema; stores `saves/snapshots/backups/pendingTransactions/leases`.

## Kilometre taşları (IntegrationMilestones M01–M08)
| M | İçerik | Doğrulama |
|---|---|---|
| M01 | ContentRegistry (31 DB, 7 harita), RNG, GameLoop 30 Hz, GameClock, StateStore, arazi/çarpışma/A*, menü, karakter, sahneler | tests/unit/boot, nav |
| M02 | Envanter, 183 tarif, escrow, istasyon+10 karo sandık, 58 yapı, 4 hazır ev, yükseltmeler | tests/unit/craft |
| M03 | İhtiyaçlar, hava, su, 12 ürün, kaynak yenilenmesi, günlük idempotans | tests/unit/survival |
| M04 | 25 tür, balıkçılık, tuzak, evcil, 8 ustalık | tests/unit/eco |
| M05 | 38 POI, 12 bulmaca, 15 kayıt, 20 plan, 3 mağara | tests/unit/explore |
| M06 | Sal + 3 rota, tekne finali, güneş/jeneratör telsiz finali | tests/unit/endings |
| M07 | IndexedDB v5, yedek, göç, içe/dışa aktarma, çoklu sekme | tests/e2e (Chromium) |
| M08 | Atlaslar, ses, HUD, dist + ZIP | validate_delivery + e2e ekran görüntüleri |
