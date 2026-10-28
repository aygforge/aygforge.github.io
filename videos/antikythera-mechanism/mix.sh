#!/bin/bash
# usage: mix.sh silent_video.mp4 narration.mp3 music.mp3 sfx.wav out.mp4
# Narration is the master timeline and stays dominant; music sits ~15 dB under it
# with gentle ducking while the voice speaks; SFX are a quiet bed.
set -e
V=$1; N=$2; M=$3; X=$4; OUT=$5
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$V")
ffmpeg -hide_banner -loglevel error -y -i "$V" -i "$N" -i "$M" -i "$X" -filter_complex "
[1:a]aresample=48000,pan=stereo|c0=c0|c1=c0,volume=0dB,apad,atrim=0:$DUR,asplit=2[nar][key];
[2:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:$DUR,asetpts=PTS-STARTPTS,volume=-17dB,afade=t=in:d=0.25,afade=t=out:st=$(echo "$DUR-1.7" | bc):d=1.7[mus];
[mus][key]sidechaincompress=threshold=0.04:ratio=2.5:attack=40:release=600[musd];
[3:a]aresample=48000,atrim=0:$DUR[fx];
[nar][musd][fx]amix=inputs=3:normalize=0:duration=first,alimiter=limit=0.89:level=false[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 256k -ar 48000 -movflags +faststart -t "$DUR" "$OUT"
