#!/bin/bash
# usage: sheet.sh out.jpg t1 t2 ... (renders stills and tiles them 6 per row)
out=$1; shift
d=$(mktemp -d -p /tmp/claude-0/-home-user-aygforge-github-io/1b40e2d0-f6ed-5c0d-b763-3e5983b3b77e/scratchpad)
node "$(dirname "$0")/preview.mjs" "$d" "$@" | grep -v "^[0-9]" 
ls "$d"/*.jpg | sort -t_ -k2 -g > "$d/list"
ffmpeg -hide_banner -loglevel error -y $(sed 's/^/-i /' "$d/list" | tr '\n' ' ') -filter_complex "$(n=$(wc -l < "$d/list"); for i in $(seq 0 $((n-1))); do printf "[%d]scale=360:-1[s%d];" $i $i; done; for i in $(seq 0 $((n-1))); do printf "[s%d]" $i; done; echo "xstack=inputs=$n:layout=$(for i in $(seq 0 $((n-1))); do printf "%d_%d|" $((i%6*360)) $((i/6*640)); done | sed 's/|$//'):fill=black")" "$out"
echo "$d"
