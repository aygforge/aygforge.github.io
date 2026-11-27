# TEST REPORT — Phase 01 Core Migration

Environment: Linux container, Node 22.23, Vite 5, Playwright Chromium (headless), mobile emulation
412×870 @2x with touch. **No physical Android device was used.** FPS / memory were **not measured**.

## Commands actually run
| Command | Result |
|---|---|
| `npm install` | OK |
| `npm run build` | OK — `dist/index.html`, 1 CSS (13.3 kB), 1 JS (166.9 kB / 57.4 kB gzip) |
| `npm run dev` | OK — dev server served `index.html` + ES modules |
| `npm test` | **11/11 pass** |
| `node tests/smoke/smoke.mjs dist --shots docs/screenshots` | **20/20 pass** |
| `node tests/smoke/smoke.mjs reference/DeliveRogue.html` (legacy baseline) | 20/20 pass (same script) |
| `baseline.mjs` legacy vs `dist` (12 chapters) | **byte-identical** output |
| Production `dist/` without `?debug=1` (portrait + 1280×720) | no debug hook, no console errors |

## Unit (`tests/unit/core.test.mjs`, real modules)
PASS data validator (100-enemy catalog, archetype counts 20/19/16/15/10/9/6/5, 7N/2E/1B per district,
runtime COF enemies match catalog, 12 chapters, enemy counts / intro order, all 12 maps build, pickup
reachable and 48 px from start, drop reachable, checkpoints reachable) · PASS catalog untouched · PASS Ek C
Coffee table + PLAYER_BASE preserved · PASS deterministic map build · PASS seeded RNG + separate streams ·
PASS skill mods recomputed from scratch · PASS save repair (negative/NaN/∞, clamps, unknown fields, hostile
cosmetics, completed⇒unlock) · PASS settle idempotent, fail = no unlock · PASS legacy garage curve ·
PASS EventBus (legacy, typed ids, isolated errors) · PASS C1/C01 key alias.

## Browser smoke (`tests/smoke/smoke.mjs`, real UI clicks)
PASS boot/menu · RunPrep · C1 world (79 rows, 6 enemies) · chapter intro → start skill pick → play ·
**real pointer joystick drag moves courier** · pause freezes timer · package pickup · **C1 delivered
(≈31 s, 3★)** · RunSummary · reward settled once (+148 coins, +93 XP, C2 unlocked) · forced re-settle pays
nothing · save survives reload · Garage · MetaHub · C2 start · **fail path courier HP 0 → failure** ·
failure counted, no unlock · visibilitychange auto-pause · **0 console/page errors**.
Steering during the C1 run uses the game's own BFS flow field to set the joystick vector (no teleport,
no invulnerability); combat is the existing auto-fire.

## Behaviour baseline (legacy HTML vs modular build)
For all 12 Coffee chapters with the same seed: world rows, path length, jets, grates, carts, heal stations,
checkpoint, timer, package, courier/package HP and every enemy id/position/HP — identical.

## Not run / limitations
- Full manual playthrough of C2–C12 not run (map/spawn equivalence + C1 full run + C2 fail run only).
- Package-HP-0 and timer-0 fail paths not separately exercised in the browser (same `endRun` code path as HP 0).
- Audio is procedural Web Audio; headless run cannot verify audible output.
- Physical Android/WebView, FPS and memory: not tested / not measured.
- Real asset bitmaps (6 original skins etc.) were not in the package → listed as missing in `docs/AssetManifest.json`.

## Screenshots (real build, `docs/screenshots/`)
01 main menu · 02 run prep · 03 chapter intro · 04 skill pick · 05 pause · 06 fight C1 · 07 fight C1 combat ·
08 run summary · 09 menu after C1 · 10 garage · 11 metahub · 12 run failed · 13 desktop landscape letterbox.

## Open blockers for later phases
None for Phase 01. Phase 02 needs: the 8-scene framework against the 5 UI references (layout only from images);
real art files if they should replace procedural visuals.
