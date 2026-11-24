#!/usr/bin/env bash
# Regenerates src/engine.js from the untouched V4 engine: stage 1 Arcade Reborn, stage 2 Arcade Mayhem, stage 3 Road to Glory.
set -e; cd "$(dirname "$0")/../src"; cp v4_engine.js engine.js; python3 ../tools/patch_engine.py; python3 ../tools/patch_mayhem.py; python3 ../tools/patch_glory.py
