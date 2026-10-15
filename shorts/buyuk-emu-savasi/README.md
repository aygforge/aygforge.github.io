# Bu Gerçekten Yaşandı — Büyük Emu Savaşı (1932)

`buyuk-emu-savasi.mp4` — 1080×1920, 30 fps, 44.07 s (matches the full ElevenLabs narration), H.264 + AAC.

## Re-render

```bash
cd src && npm install
# frames → video (split across workers; 1322 frames total)
node render.js 0 331 s0.mp4 & node render.js 331 662 s1.mp4 & node render.js 662 993 s2.mp4 & node render.js 993 1322 s3.mp4 & wait
# audio: expects narr.wav (narration, 48 kHz mono) and music.wav (supplied track, 48 kHz stereo) in AUDIO_DIR
python3 mix.py AUDIO_DIR mix_raw.wav
ffmpeg -i mix_raw.wav -af "volume=2.5dB,alimiter=limit=0.83:attack=3:release=60:level=disabled" mix_final.wav
```

- `scenes.js` — narration-locked timeline (sentence start times measured from the narration), on-screen text, all 8 scenes.
- `chars.js` — hand-drawn characters/props (emu, soldiers, farmers, Lewis gun, 1930s truck, landscape).
- `engine.js` — colored-pencil look: paper grain, crayon texture fills, boiling navy outlines.
- `mix.py` — narration (untouched) + supplied music extended by one 32-beat loop with an equal-power crossfade, ducked under speech, plus synthesized SFX.
