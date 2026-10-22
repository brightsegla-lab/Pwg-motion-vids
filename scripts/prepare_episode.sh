#!/usr/bin/env bash
# Pflege-WG kit — data pipeline for one episode (run after new_episode.py, and again
# whenever cues.spec.json changes). Deterministic: everything the composition needs is
# precomputed into assets/js/data.js; nothing is analysed at render time.
#   1. speakers.json  — who speaks when (Nora / Ben), flagged turns listed for review
#   2. loudness.json  — one 0..1 value per video frame (30 fps), via ffmpeg
#   3. data.js        — named cues (spoken − 0.2 s) + turns + loudness
#   4. content check  — every on-screen word looked up in the transcript
# Usage: bash scripts/prepare_episode.sh episodes/<slug> [--skip-audio]
set -euo pipefail
EP="${1:?usage: prepare_episode.sh episodes/<slug> [--skip-audio]}"
EP="${EP%/}"
SLUG="$(basename "$EP")"
HERE="$(cd "$(dirname "$0")" && pwd)"

if [[ "${2:-}" != "--skip-audio" || ! -f "$EP/speakers.json" ]]; then
  echo "── speakers"
  python3 "$HERE/build_speakers.py" "$EP" "$SLUG" --opener Nora
  echo "── loudness"
  python3 "$HERE/build_loudness.py" "$EP/assets/audio/$SLUG.mp3" "$EP/loudness.json" 30
fi

echo "── cues"
python3 "$HERE/build_cues.py" "$EP" "$SLUG"

echo "── content check (on-screen text vs transcript)"
python3 "$HERE/check_content.py" "$EP" || true

echo
echo "next: review flagged speaker turns + content findings, then"
echo "      (cd $EP && npx --yes hyperframes@0.8.162 check)"
