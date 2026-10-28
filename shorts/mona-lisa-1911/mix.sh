#!/bin/sh
# Mixes narration (master timeline), supplied music (~16 dB under, ducked under speech) and synthesized SFX.
set -e
cd "$(dirname "$0")"
ffmpeg -y -hide_banner -loglevel error \
  -i assets/narration_tr.mp3 -i assets/music.mp3 -i out/sfx.wav \
  -filter_complex "\
[0:a]aresample=48000,aformat=channel_layouts=stereo,volume=3dB,apad=whole_dur=65.5,asplit=2[nar][key];\
[1:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:65.5,asetpts=N/SR/TB,volume=-16.5dB,afade=t=in:d=0.25,afade=t=out:st=63.2:d=2.3[mus0];\
[mus0][key]sidechaincompress=threshold=0.04:ratio=2.5:attack=30:release=450:makeup=1[mus];\
[2:a]aresample=48000,aformat=channel_layouts=stereo,volume=5dB,apad=whole_dur=65.5[sfx];\
[nar][mus][sfx]amix=inputs=3:normalize=0:duration=first,alimiter=limit=0.95:level=false,atrim=0:65.5[out]" \
  -map "[out]" -c:a pcm_s16le out/mix.wav
