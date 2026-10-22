#!/usr/bin/env bash
# Render an episode. draft = 3D at half resolution, 720p-class quality, for review;
# final = full quality 1080p master. Both write renders/ (git-ignored) and a keyframe
# board with one frame per scene (shots.js) for review.
# Usage: bash scripts/render_episode.sh episodes/<slug> draft|final [workers]
set -euo pipefail
EP="$(cd "${1:?episode dir}" && pwd)"
MODE="${2:?draft|final}"
W="${3:-4}"
SLUG="$(basename "$EP")"
HERE="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$EP/renders"
case "$MODE" in
  draft) Q=draft; VQ=draft; OUT="$EP/renders/$SLUG-draft.mp4" ;;
  final) Q=delivery; VQ=final; OUT="$EP/renders/$SLUG-final-1080p.mp4" ;;
  *) echo "mode must be draft or final" >&2; exit 1 ;;
esac
cd "$EP"
START=$(date +%s)
npx --yes hyperframes@0.8.162 render -q "$Q" -w "$W" --variables "{\"quality\":\"$VQ\"}" -o "$OUT"
echo "rendered in $(( ($(date +%s) - START) / 60 )) min → $OUT"
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate -of compact "$OUT"

# keyframe board: middle of every scene, labelled with the scene id
ITEMS=$(node -e '
  global.window = {};
  eval(require("fs").readFileSync("assets/js/data.js", "utf8"));
  eval(require("fs").readFileSync("assets/js/shots.js", "utf8"));
  console.log(window.SHOTS.list.map(s => ((s.a + Math.min(s.b, s.a + 12)) / 2).toFixed(2) + "|" + s.id).join("\n"));')
mapfile -t ARR <<< "$ITEMS"
python3 "$HERE/keyframe_sheet.py" "$OUT" "$EP/renders/keyframes-$MODE.jpg" "${ARR[@]}"
