# Phase 01 — Core Migration notes

Source: `reference/DeliveRogue.html` (single-file HTML5 build, one IIFE, ~2750 lines of JS).
The JS was split **verbatim** into ES modules by a one-shot tool (acorn AST): every top-level declaration
got `export`, and each module's `import` list was generated from the identifiers it actually references.
No gameplay function bodies were rewritten. Behaviour equivalence is verified by `tests/smoke/baseline.mjs`
(all 12 Coffee chapters: world rows, path length, hazards, timers, packages, HP and every spawned enemy
id/position/HP are byte-identical between the legacy HTML and the modular build for the same seed).

| Legacy section | Module |
|---|---|
| Util / RNG | `src/core/util.js`, `src/core/rng.js` (re-export + cosmetic RNG) |
| STR / T() | `src/core/i18n.js`, `src/locales/tr.js` |
| DB | `src/data/{packages,player,enemies,skills,garage,cosmetics,chapters,episodes,quests,segments}.js` |
| Save | `src/core/SaveManager.js` (v1 schema & key `deliverogue_save` unchanged) |
| Audio / Haptic | `src/core/AudioManager.js`, `src/platform/Haptics.js` |
| Input | `src/core/InputManager.js` |
| Art | `src/core/Art.js` (+ `src/core/AssetManager.js` adapter) |
| Nav / MapBuilder | `src/systems/Nav.js`, `src/systems/MapBuilder.js` |
| View / Bus / G | `src/core/state.js` (Bus = `core/EventBus.js`) |
| SkillMgr / Fx | `src/systems/SkillMgr.js`, `src/systems/Fx.js` |
| Game | `src/core/DistrictRuntimeCore.js` (single simulation authority, exported as `Game`) |
| Render | `src/render/Render.js` |
| Progression | `src/systems/Progression.js` |
| UI | `src/ui/UI.js` (legacy DOM screens; replaced by 8 real scenes in Phase 02) |
| Main | `src/core/GameEngine.js` + `src/main.js` |

## Intentional changes in Phase 01 (all behaviour-neutral for map/spawn/economy)
1. **Fixed 60 Hz simulation tick** (`GameEngine.js`): accumulator with max 4 catch-up steps per frame
   (old: one variable step per frame clamped to 50 ms). Render once per frame.
2. **Gameplay RNG**: crit / electric-chain / cashback procs use a run-owned seeded stream `run.crng`
   (old: `Math.random`). Map/spawn stream `run.rng` untouched → identical layouts/spawns. Particles,
   shake and other visuals stay cosmetic random.
3. **EventBus**: same `on/emit` API; listener exceptions are isolated; typed canonical event catalog
   (`EV.*`) with unique eventIds prepared for quests/contracts/book (not yet emitted by gameplay).
4. **Debug namespace**: `?debug=1` exposes `window.__DR` and stores saves under `debug__deliverogue_save`;
   production build without the flag uses the legacy key and exposes no debug hook.
5. **New foundations (inactive / data-only)**: `data/enemyCatalog.js` (100 canonical enemies, validated),
   `data/ids.js` (episode/scene/skin IDs, legacy aliases), `core/DataValidator.js`,
   `platform/PlatformAdapter.js` (browser: ads/billing unavailable, no fake grants),
   `platform/StorageAdapter.js`, `core/AssetManager.js`.

## Kept as-is on purpose (scheduled phases)
- Auto-fire (until Phase 03 Manual Fire + Auto Aim), 20 skills, legacy garage 4×20 with 1.30 curve,
  5 legacy cosmetics, HEAVY_ORDER 150 / FRAGILE_ORDER 70 HP, RUSH/FINAL_RUSH as packages, legacy quests/milestones,
  single-slot v1 save. The modular UI still is the legacy DOM menu set (Phase 02 builds the 8 scenes).

## Source mapping notes
- GDevelop `DR2(21).json` (v0.4.15) has 8 layouts (Boot, MainMenu, MetaHub, RunPrep, FightScene, RunSummary,
  Settings, Garage) and resource paths for the 6 original skins; bitmaps are not in the package.
  The 9.4 MB JSON is kept out of the repo (reference only); the HTML5 Coffee data stays authoritative.
