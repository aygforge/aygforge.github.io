# Antikythera Mekanizması — "Bu Gerçekten Yaşandı" short

`antikythera_mekanizmasi_tr.mp4` — 1080×1920, 30 fps, 59.2 s (the full ElevenLabs narration, 57.7 s, plus a 1.5 s hold on the ending card).

Everything is procedurally drawn in colored-pencil style on a canvas (`src/`) and rendered frame by frame with headless Chromium.

- `src/captions.js` — on-screen text, word for word identical to the narration, timed from the narration's pauses
- `src/scenes.js`, `src/scenes2.js` — the 8 scenes and transitions
- `sfx.py` — synthesized SFX bed (underwater ambience, bubbles, bronze scrape, gear clicks/ticking, paper, soft reveal chimes)
- `mix.sh` — narration on top, music ~17 dB below with light ducking, SFX bed underneath
- `build.sh narration.mp3 music.mp3` — full rebuild; `preview.mjs` / `sheet.sh` render stills for checking

Font: Kalam (SIL Open Font License, `src/fonts/OFL-Kalam.txt`).
