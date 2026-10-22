#!/usr/bin/env bash
# Clean 3D stills (no 2D text, no orbs) from an episode, e.g. for thumbnail backgrounds.
# Works on a throw-away copy of the episode so the real index.html is never touched.
# Usage: bash scripts/grab_world.sh episodes/<slug> <out_dir> <sec>[,<sec>...]
set -euo pipefail
EP="$(cd "${1:?episode dir}" && pwd)"
OUT="$(mkdir -p "${2:?out dir}" && cd "$2" && pwd)"
AT="${3:?comma-separated seconds}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cp -r "$EP" "$TMP/ep"
rm -rf "$TMP/ep/renders" "$TMP/ep/release" "$TMP/ep/.hyperframes"
sed -i 's#</head>#<style>\#stage,\#orb-clip{visibility:hidden !important}</style></head>#' "$TMP/ep/index.html"
grep -q 'orb-clip{visibility' "$TMP/ep/index.html" || { echo "could not hide the 2D layer" >&2; exit 1; }
(cd "$TMP/ep" && npx --yes hyperframes@0.8.162 snapshot . --at "$AT" --no-end --timeout 30000 --describe false -o "$OUT")
ls "$OUT"
