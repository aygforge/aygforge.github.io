# Bu Gerçekten Yaşandı — "Balloon Boy" (2009, Colorado)

`balloon_boy_final.mp4`: 1080×1920, 30 fps, H.264 High, AAC 256 kbps / 48 kHz, 68.0 s.
Audio is mastered to −14.2 LUFS integrated with a −1.5 dBTP peak ceiling.

The ElevenLabs narration is the master timeline. It runs untouched: no speed change, no cuts. It plays from 0.00 s to 64.99 s. After the last word, the music plays on for about 3 s before a cosine fade-out.

## Narration timeline (measured onsets → on-screen sentence)

| # | Speech | Scene |
|---|--------|-------|
| 1 | 0.00 – 8.26 | Hook: silver balloon, imagined child (dashed sketch + "?"), helicopters, TVs. Then a quiet house with a dark attic window and a tiny silhouette |
| 2 | 9.27 – 16.45 | Backyard lift-off, worried family, belief bubble (imagined only), police arrive |
| 3 | 17.46 – 24.94 | Live chase: countryside → balloon reflection → living-room TV → helicopter window → street + news camera → lens |
| 4 | 25.95 – 31.42 | Lens → clock (minute hand sweeps 90 min), TVs multiplying, viewers leaning in |
| 5 | 32.42 – 34.41 | Slow descent onto farmland, rescuers approach |
| 6 | 35.10 – 36.82 | Box opens: EMPTY. Music pulls back for clarity, confused responders |
| 7 | 37.84 – 45.09 | Dark opening → attic hatch → Falcon sitting calmly → house cut-away → split screen (huge search vs quiet attic) |
| 8 | 46.15 – 53.63 | Panels become evidence photos, red strings, "?", folder with a planned-sequence diagram, stamp |
| 9 | 54.70 – 60.75 | One TV → TV wall → newspapers → 2009 laptop/browser + message-board panels |
| 10 | 61.59 – 64.99 | Final composition. "İnanması güç ama" (light) / "bu gerçekten yaşandı." (dark, bold) |

Every caption is the exact narration sentence, shown only in the top band (y ≤ 446 px of 1920). The renderer asserts that the wrapped lines rebuild the sentence character for character. The only other text is `@bugercektenyasandi` in the bottom-right corner.

## Rebuild

```
cd src
# inputs: narr.mp3 (ElevenLabs), music.mp3 (supplied track) in src/
ffmpeg -i narr.mp3 -ar 48000 -ac 1 -f f32le narr.f32
ffmpeg -i music.mp3 -ar 48000 -ac 2 -f f32le music.f32
python3 audio.py                       # music automation + SFX -> mix.f32
python3 render.py video 0 2040 v.mp4   # frames (skia-python); split into ranges to parallelise
```

Fonts: Kalam, Caveat, Caveat Brush (SIL Open Font License, Google Fonts).
