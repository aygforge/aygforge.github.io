#!/usr/bin/env bash
# Renders "Domuz Savaşı" (Pig War) short. Usage: ./build.sh narration.mp3 music.mp3
# Narration is the master clock (sentence timings live in main.js SENT).
set -euo pipefail
cd "$(dirname "$0")"; NARR=$1; MUSIC=$2; mkdir -p out
ffmpeg -v error -y -i "$NARR" -ac 1 -ar 48000 out/narr.wav
ffmpeg -v error -y -i "$MUSIC" -ac 2 -ar 48000 out/music.wav
python3 sfx.py out/sfx.wav
# music: first pass ends before the standoff climax, restarts on the diplomacy release (45.35s)
ffmpeg -v error -y -i out/narr.wav -i out/music.wav -i out/sfx.wav -filter_complex "
[0:a]aformat=sample_rates=48000:channel_layouts=stereo,apad=whole_dur=59.7[n];
[1:a]atrim=0:43.6,afade=t=out:st=42.2:d=1.3,volume=-16.5dB,aformat=channel_layouts=stereo[ma];
[1:a]atrim=0:14.35,asetpts=PTS-STARTPTS,afade=t=out:st=12.2:d=2.15,volume=-16.5dB,adelay=45350|45350,aformat=channel_layouts=stereo[mb];
[2:a]aformat=sample_rates=48000:channel_layouts=stereo[s];
[n][ma][mb][s]amix=inputs=4:normalize=0:duration=first,atrim=0:59.7,volume=4.6dB,alimiter=limit=0.84:attack=3:release=60:level=disabled[m]" -map "[m]" out/final.wav
N=1791; for i in 0 1 2 3; do a=$((i*448)); b=$(((i+1)*448)); [ $b -gt $N ] && b=$N; node render.js range $a $b out/seg$i.mp4 & done; wait
printf "file 'seg%d.mp4'\n" 0 1 2 3 > out/list.txt
ffmpeg -v error -y -f concat -safe 0 -i out/list.txt -i out/final.wav -map 0:v -map 1:a -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -c:a aac -b:a 256k -movflags +faststart -shortest out/pigwar_final.mp4
