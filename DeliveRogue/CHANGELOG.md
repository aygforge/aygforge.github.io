# Changelog

## 0.2.0-phase01 — Core Migration
- Split the single-file HTML5 game into 37 ES modules (verbatim code, generated imports/exports).
- Vite dev/build/preview; offline static `dist/` build with relative base.
- Fixed 60 Hz simulation tick with bounded catch-up (max 4 steps/frame); render once per frame.
- Seeded combat RNG stream (`run.crng`) for crit / electric chain / cashback; map & spawn RNG unchanged.
- EventBus with legacy API, isolated listener errors, typed canonical event catalog.
- Canonical 100-enemy catalog (`data/enemyCatalog.js`) + DataValidator (catalog, chapters, map reachability).
- Stable ID registry (`data/ids.js`), AssetManager adapter, PlatformAdapter / StorageAdapter skeletons.
- Debug hook `window.__DR` and debug save namespace only with `?debug=1` or the dev server.
- TR strings moved to `src/locales/tr.js`.
- Tests: 11 unit tests, 20-step browser smoke test, 12-chapter legacy-vs-modular baseline comparison.
