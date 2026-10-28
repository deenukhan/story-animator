#!/bin/bash
# Render a few frames of the film and tile them into one image (4 per row), so you can LOOK at
# the film before and after the full render.
# usage (run inside the film project):  bash contact_sheet.sh out/sheet.jpg 30 300 600 900 1200 1500
# Each frame takes a few seconds to render; 8-12 frames per sheet is plenty.
set -e
OUT="$1"; shift
TMP="$(mktemp -d)"; i=0
for fr in "$@"; do
  if ! npx remotion still src/index.ts Film "$TMP/raw_$i.png" --frame="$fr" --log=error > "$TMP/log_$i.txt" 2>&1; then
    echo "Rendering frame $fr failed:"; cat "$TMP/log_$i.txt"; exit 1
  fi
  ffmpeg -v error -y -i "$TMP/raw_$i.png" -vf "scale=480:-2" "$TMP/$(printf 'seq_%03d' $i).png"
  i=$((i+1))
done
COLS=$(( i < 4 ? i : 4 )); ROWS=$(( (i + COLS - 1) / COLS ))
mkdir -p "$(dirname "$OUT")"
ffmpeg -v error -y -framerate 1 -i "$TMP/seq_%03d.png" -vf "tile=${COLS}x${ROWS}:padding=6:color=white" -frames:v 1 "$OUT"
echo "-> $OUT ($i frames: $*)"
