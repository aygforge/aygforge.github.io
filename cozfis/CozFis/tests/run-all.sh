#!/usr/bin/env bash
# Tüm doğrulamalar (sırayla). Çıktılar reports/ altında.  Kullanım: bash tests/run-all.sh
set -u; cd "$(dirname "$0")/.."; rc=0
step() { echo "=== $1"; shift; "$@" || { echo "!!! BAŞARISIZ: $*"; rc=1; }; }
step "çevrimdışı statik tarama" node tools/validate/offline-check.js
step "dağıtım (dist/)"           node tools/build/build.js
step "piksel doğrulama A/B/C"    node tools/validate/pixel-validate.js
step "ekran A/B (11 ekran × 6 dil)" node tests/screens-ab.js
step "QA 149 × 6 dil"            node tests/qa-langs.js
step "kayıt uyumluluğu"          node tests/save-compat.js
step "duman testleri"            node tests/smoke.js
step "performans"                node tests/perf.js --runs 3
exit $rc
