# Changelog

## 0.6.0-phase05 — Garage & Save System
- Garage 8 × 20 (motor, helmet, jacket, POS, bag, tires, brakes, battery), linear stats only, price
  round(base × 1.20^level), all available from the start; run-start garage snapshot (no in-run changes).
  New effects: bag +2 % package HP, tires −2 % slip, brakes −2 % impact package damage, battery +1.5 % attack
  frequency (interval / frequency). Caps unchanged (DR 80 %, interval .12 s, crit 100 %).
- 6 original skins (Default 0, Coffee 500, Farmer 750, Hazardous 1000, MonsterTR 1250, Neon 1500 = 5000), visual
  only, no level gate, re-equip free; GDevelop asset paths recorded, procedural fallback palettes.
- Save System 2.0: A/B slots + revision + checksum + commit pointer; write inactive slot → verify → commit;
  recovery to the last valid revision on corrupt slot / pointer; corrupt data backed up; write failures roll back
  transactions and warn the user (last valid save untouched).
- Migration: HTML5 v1 (`deliverogue_save`) and GDevelop `DR_SAVE_V1`; HTML5 chosen explicitly if both exist
  (GDevelop recorded, not merged); raw backups kept, legacy keys never deleted; idempotent. Legacy temporary skins:
  classic → Default, purchased mint/barista/midnight/golden refunded once at their original price.
- Reward ledger: unique one-time grant keys (run / quest / milestone / boss / legacy skin) + monotonic settled-run
  sequence; already-paid legacy claims are recorded so they never pay twice; reload never duplicates a reward.
- Export v2 bundles; v1 bundles are migrated on import; import keeps a backup of the current save.

## 0.5.0-phase04 — Coffee District Complete
- 12-package system (STANDARD, HEAVY, FRAGILE, XL, LIGHTWEIGHT, REINFORCED, PREMIUM, VIP, HOT, FROZEN, FIZZY,
  MYSTERY) with HP / speed / hazard / impact / package-damage / reward modifiers and special rules (temperature,
  coldness, pressure, VIP 80 % gate, Mystery rule fixed per attempt). Rules run only after pickup on simulation
  time; HUD meter only when needed. HEAVY_ORDER (HTML5) aliases HEAVY_PACKAGE; RUSH/FINAL became chapter types.
- 6 chapter types; Coffee table keeps every HTML5 name, layout, obstacle set, enemy count and timer. Themes:
  Hot (C4, C9), Fizzy (C8); multi-drop C7 and C11 (one CUSTOMER segment each, sequential real drops, XP once).
- Mandatory boss final C12: Latte Art Dragon in a fixed arena (entry gate closes, delivery timer pauses, 90 s boss
  timer, 3 phases at 70 % / 30 %, telegraphed Coffee Breath fan, Steam Burst, Caffeine Rain, phase-3 sweeping
  breath + serial steam, phase-2 Sugar Sprite helpers with cap 4 and no rewards, single death event, exit opens,
  delivery). First boss clear +400 coins once; episode completion requires boss + delivery.
- Seeded A/B/C combat-segment route variants (C4+; canonical, mirrored columns, mirrored rows) with map validation
  and canonical fallback; same seed + config version = same geometry and spawns.
- Save: boss clear flags, legacy C12 clear kept as legacy record (no invented boss victory), Mystery attempts.
- Settlement: package reward bonus, boss first-clear reward, economy skills; Mystery resets only after a real result.

## 0.4.0-phase03 — Combat & Skill Expansion
- Manual Fire + Auto Aim: FIRE button (tap = one shot when ready, hold = repeat at attack interval, release
  stops), Space on desktop; aim auto-locks on the nearest live attackable target in range + line of sight
  (stable idx tie-break, small hysteresis), reticle on the target; with no target the shot follows the last aim /
  riding direction. No idle fire. Joystick and FIRE use independent pointerIds (multi-touch); pause, skill
  choice, blur, background and run end clear both.
- Settings: joystick size, FIRE size, control opacity, left-handed mode (all real).
- Hybrid Run XP (table §8): unique route segments + checkpoint share, normal/elite kills, one risky-route bonus;
  100 XP per run level; level-ups queue picks that open at the next safe frame (timer frozen). The checkpoint
  keeps its +15 HP heal and now grants XP instead of an extra independent pick.
- 60 skills (20 preserved + 40 new) and 20 evolutions, all with real runtime effects; rarity weights 55/30/12/3;
  filters for max rank, prerequisites, one base element, chapter context; evolution takes a slot when eligible;
  utility fallback when nothing is valid; 1 free reroll per run (+1 Second Choice); offers come from the
  engine-owned seeded stream `run.srng` and choices outside the offer are rejected.
- Caps: damage reduction 80 %, interval floor .12 s, crit 100 %, speed ×1.75; proc budget 14 per 0.5 s.
- Economy skills settle only on success, once, inside the existing settlement guard.
- HUD: Run XP bar + run level, FIRE button with cooldown ring, bottom skill / evolution strip.

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
