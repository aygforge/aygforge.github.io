# Bu Gerçekten Yaşandı — Mona Lisa (1911)

Vertical 1080×1920 / 30 fps / 65.5 s short. The final file is `out/mona-lisa-1911_bu-gercekten-yasandi.mp4`.

The ElevenLabs narration (`assets/narration_tr.mp3`) is the master timeline. Sentence timings come from its pauses,
and each on-screen sentence (top 22% of the frame) matches the narration word for word.

## Rebuild

```sh
NODE_PATH=/opt/node-tools/node_modules node render.js video out/video_noaudio.mp4 4   # canvas frames -> H.264
python3 sfx.py                                                                         # synthesized SFX -> out/sfx.wav
./mix.sh                                                                               # narration + music (-16.5 dB, ducked) + SFX
ffmpeg -i out/video_noaudio.mp4 -i out/mix.wav -map 0:v -map 1:a -c:v libx264 -b:v 8M -c:a aac -b:a 192k \
  -movflags +faststart out/mona-lisa-1911_bu-gercekten-yasandi.mp4
```

Stills for review: `node render.js still out/stills 0 5.9 25.4`.

- `src/engine.js`: colored-pencil engine (wobbly boiling strokes, crayon hatching, paper and tooth textures)
- `src/art.js`: characters, props and sets
- `src/scenes.js`: the 10 scenes and the frame-to-frame transformations between them
- `src/main.js`: compositing, captions, the @bugercektenyasandi handle

Fonts: Kalam (SIL Open Font License).
