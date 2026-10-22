#!/usr/bin/env bash
# Compressed 1080p copy that fits the chat upload limit (≈ 29 MB) — two-pass x264.
# The master stays the file to upload to YouTube.
# Usage: bash scripts/share_copy.sh <master.mp4> [target_MB]
set -euo pipefail
IN="${1:?master mp4}"
MB="${2:-28}"
OUT="${IN%.mp4}-share.mp4"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")
VK=$(python3 -c "print(max(300, int($MB * 8192 / $DUR - 96)))")
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
ffmpeg -v error -y -i "$IN" -c:v libx264 -preset slow -b:v "${VK}k" -pass 1 -passlogfile "$TMP/p" -an -f mp4 /dev/null
ffmpeg -v error -y -i "$IN" -c:v libx264 -preset slow -b:v "${VK}k" -pass 2 -passlogfile "$TMP/p" -c:a aac -b:a 96k -movflags +faststart "$OUT"
ls -la "$OUT"
