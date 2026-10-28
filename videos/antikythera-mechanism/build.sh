#!/bin/bash
# Rebuilds the short from source.
# usage: build.sh narration.mp3 music.mp3 [out.mp4]
# needs: node + playwright (Chromium), ffmpeg, python3 with numpy/scipy/soundfile
set -e
cd "$(dirname "$0")"
N=$1; M=$2; OUT=${3:-antikythera_mekanizmasi_tr.mp4}
TMP=$(mktemp -d)
node render.mjs "$TMP/video_silent.mp4" 4 30
python3 sfx.py "$TMP/sfx.wav" "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$TMP/video_silent.mp4")"
./mix.sh "$TMP/video_silent.mp4" "$N" "$M" "$TMP/sfx.wav" "$OUT"
rm -rf "$TMP"
echo "done: $OUT"
