# TEST REPORT — Phase 02 Premium Scene Framework

Environment: Linux container, Node 22.23, Vite 5, Playwright Chromium (headless). Mobile emulation 412×870 @2x
with touch; extra viewport checks at 360×640 and 1280×720. **No physical Android device was used.**
FPS / memory were **not measured**.

## Commands actually run
| Command | Result |
|---|---|
| `npm run build` | OK — 1 JS (219.5 kB), 1 CSS (48.7 kB), offline, no external requests |
| `npm test` | **16/16 pass** (11 core from Phase 01 + 5 UI/i18n) |
| `node tests/smoke/smoke.mjs dist --shots docs/screenshots/phase02` | **41/41 pass** |
| `baseline.mjs` legacy HTML vs `dist` (12 chapters) | **byte-identical** (gameplay unchanged) |
| viewport check 360×640 + 1280×720 (MainMenu, RunPrep, Garage, MetaHub) | no horizontal overflow, no errors |
| production `dist/` without `?debug=1` | no debug hook, no console errors |

## Browser smoke — what is exercised (real UI clicks / keys)
Scene framework: Boot is the first scene → MainMenu · 8 scenes registered · hub bars on MainMenu ·
MainMenu canvas atmosphere · **4 rapid navbar taps → one target, one scene root** · one root after many
transitions · hub bars hidden in FightScene and RunSummary, back after quit.
Flow: Play → RunPrep (route preview canvas, START, C2 locked) → START → FightScene · **C1 world identical to
the Phase 01 baseline** · intro → skill pick → play · **pointer joystick drag moves courier through the scene
layer** · **ESC = pause (timer frozen, still FightScene)**, ESC again resumes · pickup · **C1 delivered** ·
RunSummary shows the real settled coins · forced re-settle pays nothing · Continue → RunPrep with C2 selected.
Meta: Garage badge from real affordability · upgrade buys exactly one level (−110) · TopBar coins follow the
wallet · Skin Shop / Trophy Room sub-views · **back closes sub-view first, then hub → MainMenu** · MetaHub collect
claims every unlocked milestone once · repeat claim pays nothing · milestone chain / board / book sub-views.
Settings: reduced motion applies + persists and makes transitions instant · **save import needs confirmation,
edited file flagged by checksum, applied, previous save backed up** · invalid file rejected without changes.
Failure / lifecycle: C2 start · courier HP 0 → failure summary with reason · failure counted, no unlock ·
Retry re-enters FightScene **without leaking Bus listeners** · visibility hidden → auto-pause ·
confirmed quit → RunPrep, run cleared · **0 console/page errors**.

## Unit (`tests/unit/ui.test.mjs`)
Every literal `T()` key used by scenes/UI exists in the TR locale · dynamic key families (ranks, modes, settings,
nav) complete · 8 scene modules follow the contract and exactly 5 are hub scenes · rank bands 1/10/20/35/50/75/100 ·
no energy / gems / fuel / premium-currency wording in visible text.

## Not run / limitations
- Physical Android/WebView, real touch hardware, FPS and memory: not tested / not measured.
- Audio is procedural; headless runs cannot verify audible output or scene music crossfades (not added yet).
- Only TR locale exists; text overflow was checked for TR only.
- Locked by design until later phases (shown with reason, no fake progress): Endless / Time Attack / Daily /
  Boss Rush / Nightmare modes, restaurants 2–10, Daily / Weekly tasks, Special Events, 4 new garage categories,
  6 original skins, joystick/fire layout options, extra languages, purchase restore.
- Full C2–C12 playthroughs not run in this phase (gameplay code unchanged; baseline comparison identical).

## Screenshots (`docs/screenshots/phase02/`, real build)
01 boot · 02 main menu · 03 run prep · 04 chapter intro · 05 skill pick · 06 pause · 07/08 fight C1 ·
09 run summary · 10 garage · 11 skin shop · 12 trophy room · 13 metahub · 14 milestone chain ·
15 delivery board · 16 courier book · 17 settings · 18 run failed · 19 small-phone (360×640) and desktop
(1280×720) variants · 20 production desktop letterbox. Phase 01 shots kept in `docs/screenshots/phase01/`.

## Open blockers
None for Phase 02. Real art (6 skins, scene art) still not supplied — procedural placeholders in the final art direction are used.
