# Bu Gerçekten Yaşandı — Tay (2016) vertical short

1080×1920, 30 fps animated documentary short. The ElevenLabs narration is the master timeline; captions are word-for-word.

- `tay_16_saat.mp4` — final video
- `src/` — canvas animation (`lib.js` hand-drawn toolkit, `anim.js` scenes + caption timing)
- `render.js` — frame-by-frame renderer (headless Chromium → ffmpeg)
- `audio.py` — mix: narration (untouched) + supplied music (extended by repeating a matching section, ducked) + synthesized SFX
- `assets/real/tay_profile_2016.jpg` — authentic Tay Twitter profile image (© Microsoft, via en.wikipedia.org `File:Tay_bot_logo.jpg`, non-free / fair-use); `_up.png` is a plain upscale

## Rebuild
```
npm install            # fonts (Kalam); Playwright + Chromium must be available
pip install numpy scipy
mkdir -p build
node render.js 0 2616 build/video.mp4
python3 audio.py audio/narration.mp3 audio/music.mp3 build/mix.wav
ffmpeg -i build/video.mp4 -i build/mix.wav -c:v libx264 -preset slow -crf 22 -maxrate 6M -bufsize 12M -c:a aac -b:a 224k -movflags +faststart tay_16_saat.mp4
```
