#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
manifest_path=$(mktemp)
trap 'rm -f "$manifest_path"' EXIT
./node_modules/.bin/tsx scripts/export-dsa-video-manifest.ts "$manifest_path"
python3 scripts/render-dsa-videos.py "$manifest_path" public/videos/dsa "$@"
