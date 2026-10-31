# Bu Gerçekten Yaşandı — Nicholas Alkemade (5,5 km, paraşütsüz)

Vertical 1080×1920, 30 fps short (≈67.8 s). The ElevenLabs narration is the master timeline: it is unedited and starts at 0:00.

**Output:** `nicholas-alkemade-short.mp4`

## Sentence timeline (from pause detection on the narration)

| # | Narration / on-screen text | Spoken |
|---|---|---|
| 1 | 1944’te bir İngiliz havacı, paraşütsüz yaklaşık 5,5 kilometreden düştü… ve hayatta kaldı. | 0.00–8.35 |
| 2 | Nicholas Alkemade, İkinci Dünya Savaşı sırasında bir Lancaster bombardıman uçağında arka nişancıydı. | 9.37–15.88 |
| 3 | Uçak Almanya üzerinde saldırıya uğrayınca alev almaya başladı. | 16.77–20.66 |
| 4 | Alkemade paraşütüne ulaşmaya çalıştı ama paraşütü de yangında kullanılamaz hale gelmişti. | 21.66–27.40 |
| 5 | Önünde iki seçenek vardı: yanan uçakta kalmak ya da paraşütsüz atlamak. | 28.37–33.53 |
| 6 | Alkemade yaklaşık 5,5 kilometre yükseklikten kendini boşluğa bıraktı. | 34.54–39.55 |
| 7 | Aşağıdaki çam ağaçlarının dalları düşüşünü yavaşlattı ve derin kar da darbeyi büyük ölçüde emdi. | 40.53–47.11 |
| 8 | Alman askerleri onun paraşütsüz düştüğüne inanmayınca olay yerini araştırdı ve paraşütünün uçak enkazında kaldığını gördü. | 48.11–56.33 |
| 9 | Alkemade gerçekten de bu inanılmaz düşüşten sağ kurtulmuştu. | 57.26–61.37 |
| 10 | İnanması güç ama bu gerçekten yaşandı. | 62.19–65.30 |

Captions are word-for-word and stay in the top band (y 104–470 px, the upper ~24% of the frame). The only other text is `@bugercektenyasandi`, at the bottom right.

## Rebuild

1. Put the narration and music in a folder, for example `audio/`, and convert both to 48 kHz WAV:
   ```
   ffmpeg -i alkamade.mp3 -ar 48000 -ac 1 audio/narr.wav
   ffmpeg -i The_Impossible_Fall.mp3 -map 0:a -ar 48000 -ac 2 audio/music.wav
   ```
2. Build the audio mix (procedural sound effects, music at about −15.5 dB, narration on top): `python3 src/audio.py audio`
3. Render the frames (Playwright + Chromium; the canvas is drawn in `src/*.js`):
   `for w in 0 1 2 3; do node src/render.js frames 30 --range 0 2034 $w 4 & done; wait`
4. Encode:
   ```
   ffmpeg -framerate 30 -i frames/%05d.jpg -i audio/mix.wav \
     -af "volume=4.3dB,alimiter=limit=0.84:level=false" \
     -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart out.mp4
   ```

`index.html` loads the font from `../fonts/`, so keep the `src/` and `fonts/` layout. The font is Caveat (SIL OFL, see `fonts/OFL.txt`).
