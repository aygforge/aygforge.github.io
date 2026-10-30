# Gimli Glider — "Bu Gerçekten Yaşandı" short

Vertical (1080×1920, 30 fps, 66.4 s) hand-drawn style short about Air Canada Flight 143.
Final video: `gimli_glider.mp4` (cover: `cover.jpg`).

The ElevenLabs narration is the master timeline. Sentence timings in `timeline.js` were taken from
the narration's pauses; every caption is the narration sentence verbatim.

## Rebuild

```
npm install
./render_all.sh out                                   # frames → out/video.mp4 (4 parallel workers)
python3 audio.py narration.mp3 music.mp3 out/mix.wav  # narration + ducked music + SFX, -14 LUFS
ffmpeg -i out/video.mp4 -i out/mix.wav -map 0:v -map 1:a -c:v libx264 -b:v 6500k -c:a aac -b:a 192k -shortest gimli_glider.mp4
```

- `lib.js` — paper, crayon textures, wobbly pencil primitives
- `parts.js` — 767 side/top views, engine fan, clouds, people, cars
- `scenes_a.js`, `scenes_b.js` — the 10 scenes
- `render.js` — transitions, captions, overlays, encoder pipe
- `audio.py` — music splice/ducking and synthesized SFX
