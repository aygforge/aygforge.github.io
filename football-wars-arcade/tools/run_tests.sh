#!/usr/bin/env bash
# Road to Glory test run against the current sources / built HTML. Usage: bash tools/run_tests.sh
set -e
cd "$(dirname "$0")/.."
bash tools/build_engine.sh
node tools/build.js
node tools/perf.js ../src/engine.js > /tmp/fwa_arc.txt; node tools/perf.js ../src/v4_engine.js > /tmp/fwa_v4.txt
tail -n +2 /tmp/fwa_arc.txt | diff - <(tail -n +2 /tmp/fwa_v4.txt) && echo "PASS V4 regression: 6 Fusion battles, identical hashes/winners/goals (current engine vs original V4)"
node tools/ref_freeze.js check           # Legacy (Reborn) / Mayhem / V4 frozen battles replay byte-identical
node tools/test_glory.js                 # Road to Glory logic + migration tests (real battles)
SHOTS=${SHOTS:-/tmp} node tools/ui_glory.js
SHOTS=${SHOTS:-/tmp} node tools/ui_fullscreen.js
SHOTS=${SHOTS:-/tmp} node tools/perf_ui.js
# optional, slower: node tools/balance_glory.js ; node tools/formation_probe.js '{}' 10 2 ; node tools/adv_probe.js
