#!/usr/bin/env bash
# Regenerates src/engine_rogue.js (Roguelite Reborn) from the untouched V4 engine.
set -e; cd "$(dirname "$0")/../src"; python3 ../tools/patch_rogue.py v4_engine.js engine_rogue.js
