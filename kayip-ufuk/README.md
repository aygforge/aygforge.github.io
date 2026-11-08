# Kayıp Ufuk — HTML5 tam sürüm (GDD v2.0)

Mobil yatay ekran, tek oyunculu 2D tropikal ada survival / keşif / crafting oyunu. Saf ES modülleri ve Canvas2D kullanır; çalışma anında hiçbir harici kütüphaneye veya ağ isteğine ihtiyaç duymaz.

- **Oyna:** `npm run build && npm run serve` → http://localhost:8000 (veya `Kayip_Ufuk_HTML5_Tam_Surum.zip` dosyasını itch.io'ya HTML5 olarak yükleyin).
- **Kontroller:** sol joystick / WASD-oklar, bağlamsal eylem düğmesi (E), koşma (Shift), envanter (I), haritada dokunarak yürüme; yatay ekran zorunlu.
- **Tasarım kaynağı:** `Kayip_Ufuk_GDD_v2_0/` (değiştirilmez, `ProductionTruth_v2.0.json` önceliklidir).
- **Kod:** `src/core` (döngü, durum, saat), `src/data` (31 DB yükleyici), `src/world`, `src/scenes`, `src/systems` (envanter, üretim, inşa, survival, iklim, tarım, yaban hayatı, balıkçılık, tuzak, keşif, bulmaca, kaçış, sal), `src/render`, `src/ui`, `src/audio`, `src/persistence`.
- **Varlık üretici:** `tools/assetgen/` → `public/assets/atlases/*.png` (24 × 1024², 3180 kare). Sesler `src/audio/SynthBank.js` ile Web Audio sentezi.
- **Görseller:** 1644 kare “Farm RPG – Tiny Asset Pack” (EmanuelleDev, https://emanuelledev.itch.io) paketinden `tools/farmpack/` ile uyarlandı; paket lisansı gereği depoda değildir, kredi oyunda ve `CREDITS.md`'dedir. Ayrıntı: `tools/farmpack/README.md`.
- **Testler:** `npm test` (birim/sistem), `npm run test:e2e`, `npm run test:visual` (Playwright Chromium), `npm run report`.
- **Durum:** `reports/STATUS.md` (RELEASE_READY ve eksikler), `reports/test-results.json` (92 + 28 kabul testi), `reports/spec-issues.md`, `reports/NEXT_STEPS.md`.
