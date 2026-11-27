# TEST REPORT — Phase 05 Garage & Save System

Environment: Linux container, Node 22.23, Vite 5, Playwright Chromium (headless). **No physical Android device.**
FPS / memory **not measured**.

## Commands actually run
| Command | Result |
|---|---|
| `npm run build` | OK |
| `npm test` | **44/44 pass** (incl. 11 new Save 2.0 / garage / ledger / migration tests with an in-memory storage) |
| `node tests/smoke/garage_save.mjs dist` | **17/17 pass** (real UI + real page reloads) |
| `node tests/smoke/smoke.mjs dist` | **49/49 pass** |
| `node tests/smoke/skills_runtime.mjs dist` | **28/28 pass** |
| `node tests/smoke/coffee_runtime.mjs dist` | **44/44 pass** |
| `baseline.mjs --geometry` legacy vs `dist` | C1–C6, C8–C10 identical (unchanged) |

## Acceptance (Master Prompt Faz 05)
| Criterion | Evidence |
|---|---|
| Purchase / equip | UI: each of the 8 categories bought once at the exact price (110/100/120/150/130/110/100/150); unit: all 8 × 20 levels bought with exactly `garageTotalCost()` coins, max level and unaffordable refused. Skin bought (500, equips), re-equip free, 6 skins = 5000 total, no level gate |
| Stat cap / linear stats | unit: at level 20 speed ×1.15, HP 140, DR 20 %, card damage ×1.5, package HP ×1.4, slip −40 %, impact package damage −40 %, interval .6/1.3 s; caps DR 80 % / interval .12 s / crit 100 % (Phase 03 tests) ; in-run garage change ignored (run snapshot) |
| Old save preserved | HTML5 v1: level / unlocks / stars / mastery / settings / 4 garage levels kept, 4 new categories at 0, purchased legacy skins (mint 300, golden 700 / barista 350, midnight 450) refunded once, old quest & milestone claims recorded in the ledger (cannot pay again), raw backup written, legacy key kept, second boot does not migrate again. GDevelop DR_SAVE_V1 migrated (level / xp / coins / skins); with both present HTML5 is chosen and GDevelop is recorded, not merged |
| Save recover | corrupt active slot → previous valid revision (`recovered`, boot message), corrupt data backed up; garbage pointer → best valid slot; crash between slot write and pointer commit → still a valid state |
| Reload duplicate reward none | C1 completed in the real UI, page reloaded on RunSummary, same run re-settled → wallet and run sequence unchanged; unit: same run sequence rejected after reload even with the id list cleared; one-time keys never pay twice |
| Save failure | storage throws on write → upgrade rolled back (coins / level unchanged), toast shown, last valid slot untouched, reload loads it |

## Known limitations / deferred
- The 6 original skin bitmaps (GDevelop resource paths) were not supplied: skins use procedural palettes; files are
  listed in `docs/AssetManifest.json` and can be dropped in later without code changes.
- Checksums detect corruption only; local storage offers no security against deliberate edits (no anti-cheat claim).
- Endless / Boss Rush chain resume and pending-choice persistence arrive with those modes (Phase 10).
- Browser storage is per-origin: moving to a new host/origin needs Settings → Export / Import.

## Screenshots (`docs/screenshots/phase05/`, real build)
01 Garage with 8 live categories and extended stats · 02 Skin Shop (6 originals, Coffee bought + equipped) ·
03 save-failure toast · 04 RunSummary before reload · 05 Boot migration notice · 06 Settings save info
(revision, slot, source, refund) · `flow/` full UI flow.
