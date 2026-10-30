# Kadavra Sinodu — build

1. Frames (Chromium + Playwright, 30 fps, 1782 frames = 59.4 s):
   `mkdir frames && node render.js frames 0 1782`
2. SFX bed: `python3 sfx.py sfx.wav`
3. Mix (narration +3 dB, music −15 dB, SFX −5 dB, limiter −1 dBTP):
   ```
   ffmpeg -i audio/narration.mp3 -i audio/music.mp3 -i sfx.wav -filter_complex "[0:a]aresample=48000,aformat=channel_layouts=stereo,volume=3dB,apad=whole_dur=59.4[n];[1:a]aresample=48000,atrim=0:59.4,asetpts=N/SR/TB,volume=-15dB,afade=t=in:d=0.15,afade=t=out:st=57.4:d=2[m];[2:a]volume=-5dB[s];[n][m][s]amix=inputs=3:normalize=0:duration=first,alimiter=limit=0.89:level=false,atrim=0:59.4[out]" -map "[out]" -c:a pcm_s16le mix.wav
   ```
4. Encode: `ffmpeg -framerate 30 -i frames/f_%05d.jpg -i mix.wav -c:v libx264 -b:v 8M -maxrate 10M -bufsize 16M -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 256k -shortest kadavra_sinodu.mp4`

Scene boundaries and caption timings come from the narration's sentence pauses (see `B` in scenes.js and `CAPS` in main.js).
