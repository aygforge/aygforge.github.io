#!/bin/bash
# Render all frames in 4 parallel chunks, then join them.
# usage: ./render_all.sh <workdir>
set -e
OUT=${1:-out}; mkdir -p "$OUT"
TOTAL=$(node -e "console.log(Math.round(require('./timeline').END*30))")
J=4; STEP=$(( (TOTAL + J - 1) / J ))
for i in $(seq 0 $((J-1))); do
  A=$((i*STEP)); B=$(( (i+1)*STEP < TOTAL ? (i+1)*STEP : TOTAL ))
  node render.js --frames $A $B "$OUT/seg$i.mp4" 2> "$OUT/seg$i.log" &
done
wait
: > "$OUT/list.txt"; for i in $(seq 0 $((J-1))); do echo "file 'seg$i.mp4'" >> "$OUT/list.txt"; done
ffmpeg -v error -y -f concat -safe 0 -i "$OUT/list.txt" -c copy "$OUT/video.mp4"
echo done
