# FOOTBALL WARS — kaynak kodu

Teslim edilen dosya: `../football-wars.html` (tek dosya, çevrimdışı, harici bağımlılık yok).

- `src/` — motor (`engine.js`), sprite/arma üretimi (`sprites.js`), çizim (`render.js`), pixel font (`font.js`), ses (`audio.js`), video dışa aktarma (`export.js`), arayüz (`app.js`), HTML/CSS şablonu.
- `data/` — ZIP'teki `football_wars_master_2026_27.json` ve `battle_engine_config.json` (HTML'e gömülür).
- `assets/flags.json` — Wikimedia Commons'tan derleme anında indirilen ulusal bayrak küçük resimleri (`tools_fetch_flags.py`).
- `vendor/` — mp4-muxer 5.2.2 ve webm-muxer 5.1.4 (MIT, lisans dosyalarıyla).
- `build.py` — her şeyi `football-wars.html` içine gömer: `python3 build.py`
- `tests/` — Node denge/determinizm testleri (`balance.js`, `power.js`, `arch.js`, `sudden.js`) ve Playwright tarayıcı testleri (`smoke.js`, `e2e.js`, `ui.js`, `stage.js`).
