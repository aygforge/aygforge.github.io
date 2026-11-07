# Bu Gerçekten Yaşandı — Max Headroom yayın korsanlığı (1987)

`max-headroom-1987.mp4` — 1080×1920, 30 fps, 76.5 s, H.264 + AAC 256k, mastered to -14 LUFS / -1.5 dBTP.

- Timeline = the supplied ElevenLabs narration (73.9 s), untouched (no cuts, no speed change), followed by a short music tail.
- On-screen captions are the 13 narration sentences, word-for-word, shown in the upper band while each one is spoken.
- Music: the supplied track, about 11 dB under the narration, with smooth automation (it rises during gaps and hijacks, and dips under dense lines).
- SFX (static, VHS tracking, hum, clicks, paper, ticks) are synthesized in `source/mix.py` and kept below the music.

## Rebuild
`source/` holds the procedural renderer (Canvas + rough.js, rendered with Playwright) and the audio mix script.
```
cd source && npm i roughjs@4.6.6 @fontsource/kalam@5.3.0 @fontsource/caveat@5.3.0
node render.js 2295 4      # -> chunk0..3.mp4
python3 mix.py             # needs narr.wav / mus.wav (48 kHz) beside it
```
