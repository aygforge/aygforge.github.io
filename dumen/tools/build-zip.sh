#!/usr/bin/env bash
# itch.io / statik barındırma için tek ZIP üretir: dist/DUMEN_html5.zip (index.html kökte).
set -euo pipefail
cd "$(dirname "$0")/.."
node tools/embed-sources.js
rm -rf dist && mkdir -p dist
zip -qr dist/DUMEN_html5.zip index.html style.css src assets README.md CANON_GAPS.md DATA_INTEGRITY_REPORT.md DUMEN_Tam_Surum_GDD_v1.0.md
ls -la dist
