#!/usr/bin/env bash
# Roguelite Reborn: regenerate the engine, build the single HTML, run node + browser tests. Usage: bash tools/run_rogue_tests.sh [--quick]
set -e
cd "$(dirname "$0")/.."
bash tools/build_engine_rogue.sh
node tools/build_rogue.js
node tools/test_rogue.js $1          # data, resolver, Campaign rules, 48 cards, draft, economy, save, critical levels (real engine)
SHOTS=${SHOTS:-} node tools/ui_rogue.js   # Playwright: HQ, map, draft, battle, Focus, pause, resume, results, campaign end, 3 portrait sizes
node tools/perf_rogue.js
