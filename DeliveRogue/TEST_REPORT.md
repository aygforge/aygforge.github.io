# TEST REPORT — Phase 03 Combat & Skill Expansion

Environment: Linux container, Node 22.23, Vite 5, Playwright Chromium (headless), mobile emulation 412×870 @2x
with touch; multi-touch via Chrome DevTools Protocol touch events. **No physical Android device was used.**
FPS / memory **not measured**.

## Commands actually run
| Command | Result |
|---|---|
| `npm run build` | OK |
| `npm test` | **27/27 pass** (core 11, UI 5, skills/XP 11) |
| `node tests/smoke/smoke.mjs dist` | **49/49 pass** |
| `node tests/smoke/skills_runtime.mjs dist` | **28/28 pass** |
| `baseline.mjs` legacy HTML vs `dist` (12 chapters, map + spawn + HP) | **byte-identical** |

## Acceptance (Master Prompt Faz 03)
| Criterion | Evidence |
|---|---|
| Multi-touch | CDP: joystick + FIRE touched together → courier moved 29 px and fired 2 shots; releasing the joystick touch kept FIRE held; both clear on release |
| No idle fire | target locked in range, no fire input for 1.2 s → 0 shots, 0 projectiles |
| Target / cooldown | real pointer tap = exactly 1 shot; hold 1.3 s at .60 s interval = 3 shots; release → 0 more; Space fires; pause clears fire and freezes shooting |
| Existing 20 regression | the 20 preserved ids/order are asserted; every one runs in the engine; legacy semantics (e.g. Payment / Pierce / Ricochet falloffs, element exclusivity, shield) kept; baseline worlds identical |
| New skills / evolutions runtime + cap | all 60 skills and all 20 evolutions apply and run 1.5 s in the engine without errors or non-finite state, each changes the derived modifiers; targeted checks: Power +15 %, Extended range, Rapid, Overcharged 5th shot, Explosive AoE, Electric chain, Frozen/Frostbite slow, Burn DoT, Flame Burst, Venom Spread, Heavy Armor −20 %, Last Stand, Time Extension, Second Choice, Fast Learner, checkpoint skills, Golden Receipt (success only), Payment Storm, Infinity Receipt, Iron Courier; caps DR 80 % / interval .12 s / crit 100 %; worst-case proc build peaks at 13 ≤ 14 procs per window |
| Deterministic choices | same seed → identical offer sequence (12 picks); free reroll replaces the offer from the engine stream; a choice not in the offer is rejected |

## Other checks
Rarity class frequencies over 6000 offers ≈ 55/30/12/3 · filters (prerequisites, single base element, checkpoint /
boss / package context) never violated over 200 seeds · evolution exclusivity (Ricochet used by Infinity Receipt
blocks Chain Reaction) · utility fallback only when nothing is valid · Run XP budget: route-only XP reaches the
minimum pick target on all 12 chapters, full XP stays within target · C1 real run: route 120 + combat 80 XP →
run level 3, 3 skills, delivered.

## Known limitations / deferred (stated honestly)
- Context-gated skills exist and work but are **not offered in this build** because their context does not exist
  yet: Boss Invoice (boss chapters, Phase 04), Insulated Box / Cooling System (Hot/Frozen packages, Phase 04),
  Smooth Rider (Fizzy package, Phase 04). Consequently **Titan Breaker** and **Thermal Master** become reachable in
  Phase 04 (their reachability is verified in unit tests with the intended context).
- Ad reroll (extra_skill_reroll placement) not shown: browser build has no ads (PlatformAdapter unavailable).
- Endless-length selection budget not tested (Endless arrives in Phase 10).
- Evolution icons are a star badge placeholder; skill icons for the 40 new skills are procedural glyphs.
- Balance numbers are starting values from Ek B; tuning happens in later phases.

## Screenshots (`docs/screenshots/phase03/`, real build)
Full flow 01–18 (as Phase 02) plus: 05 skill choice with rarity + reroll · 07a reticle without firing ·
07b FIRE held · 21 Settings control options · 22 left-handed layout with large FIRE · 23 level-up offer with an
evolution.
