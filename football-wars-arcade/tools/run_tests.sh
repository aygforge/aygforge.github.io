#!/usr/bin/env bash
# Runs every test suite against the current sources / built HTML. Usage: bash tools/run_tests.sh
set -e
cd "$(dirname "$0")/.."
bash tools/build_engine.sh
node tools/build.js
node tools/perf.js ../src/engine.js > /tmp/fwa_arc.txt; node tools/perf.js ../src/v4_engine.js > /tmp/fwa_v4.txt
tail -n +2 /tmp/fwa_arc.txt | diff - <(tail -n +2 /tmp/fwa_v4.txt) && echo "PASS V4 regression: 6 Fusion battles, identical hashes/winners/goals (current engine vs original V4)"
node tools/test_mayhem.js
node tools/energy_budget.js
node tools/test_core.js
node tools/test_career.js
SHOTS=${SHOTS:-/tmp} node tools/ui_mayhem.js
SHOTS=${SHOTS:-/tmp} node tools/ui_test.js
SHOTS=${SHOTS:-/tmp} node tools/ui_season.js
SHOTS=${SHOTS:-/tmp} node tools/ui_fullscreen.js
SHOTS=${SHOTS:-/tmp} node tools/perf_ui.js
