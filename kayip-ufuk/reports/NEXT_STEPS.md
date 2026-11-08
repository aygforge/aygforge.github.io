# NEXT_STEPS (çalışma notu — güncel)
- Kod: src/ (core, data, world, scenes, systems, render, ui, persistence, audio), tools/assetgen (atlas üretici), tools/build.mjs → dist/.
- Atlaslar: `node tools/assetgen/generate.mjs` → public/assets (24 sayfa, 3180/3180, 0 hata).
- Ses: src/audio/SynthBank.js (63 cue) → reports/audio-provenance.json.
- Tarayıcı açılışı: tests/e2e/smoke.mjs (dist http://localhost:8000).
- Sırada: tests/unit/*.test.mjs (92 kabul testi eşlemesi), tests/e2e/run-e2e.mjs (IndexedDB, mobil, ekran görüntüsü), reports/test-results.json, STATUS.md, spec-issues.md, ZIP.
