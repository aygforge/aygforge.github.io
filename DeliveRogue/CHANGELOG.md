# Changelog

## 0.3.0-phase02 — Premium Scene Framework
- 8 independent scene modules (Boot, MainMenu, Garage, MetaHub, RunPrep, FightScene, RunSummary, Settings) with
  enter/update/exit lifecycle and scene-scoped cleanup (`core/SceneManager.js`).
- Persistent TopBar (portrait, level, rank, XP, coins with count-up) and NavigationBar (Home | Garage | RunPrep |
  MetaHub | Settings) with real-state badges; hidden in Boot / FightScene / RunSummary.
- Transitions (slide/fade/launch/result), input lock, single-target navigation, 180 ms debounce, reduced motion.
- Back routing for ESC / hardware / browser back (overlay → sub-view → hub → MainMenu; pause inside a run).
- Layouts from the 5 references: Garage (88176), RunPrep (88174), MetaHub (88175 + 88173 milestone chain),
  RunSummary (88172); MainMenu / Settings / Boot in the same art direction.
- Procedural scene backdrops (`ui/SceneArt.js`), inline SVG icon set, premium cartoon CSS components.
- RunPrep real route preview: the actual built chapter world with hazards, pickup, checkpoint and drop, auto-panned.
- Settings: reduced motion, low graphics, fullscreen, save export / validated import (with backup + confirm),
  tutorial reset; corrupt saves are backed up on load instead of being silently overwritten.
- Boot: real save load / validation / asset warm-up progress; `#ui.compact` layout for short screens.
- Legacy single-module DOM UI removed (`ui/UI.js` is now a compatibility re-export of `ui/App.js`).

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
