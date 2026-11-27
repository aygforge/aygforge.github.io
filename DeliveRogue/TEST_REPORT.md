# TEST REPORT — Phase 04 Coffee District Complete

Environment: Linux container, Node 22.23, Vite 5, Playwright Chromium (headless). **No physical Android device.**
FPS / memory **not measured**.

## Commands actually run
| Command | Result |
|---|---|
| `npm run build` | OK |
| `npm test` | **33/33 pass** (core, UI, skills/XP, Coffee data/maps/save) |
| `node tests/smoke/smoke.mjs dist` | **49/49 pass** (UI flow, manual fire, C1 real run, fail path) |
| `node tests/smoke/skills_runtime.mjs dist` | **28/28 pass** |
| `node tests/smoke/coffee_runtime.mjs dist` | **44/44 pass** |
| `baseline.mjs --geometry` legacy HTML vs `dist` (variants off) | C1–C6, C8–C10 **identical** geometry + spawns; C7 / C11 / C12 changed on purpose (customer segment / boss arena) |

## Acceptance (Master Prompt Faz 04)
| Criterion | Evidence |
|---|---|
| All Coffee chapters playable | engine sweep with steering + held fire: **C1–C12 delivered**, C4–C12 on **3 variant seeds each** (30 runs). Delivery times 31–84 s against 60–160 s timers; C12 boss killed in 58–85 s of the 90 s boss timer (random skill picks, no garage). Sweep uses debug invulnerability (traversal check); damage / fail paths are tested separately. |
| No kill gate on normal chapters | C1–C11 delivered **without firing one card** (0 shots) |
| Boss gate on the final | exit gate closed until the boss dies; standing in the final drop before that does nothing |
| Route-only XP sufficient | no-fire runs still gain extra picks on every chapter; unit test: route-only XP reaches the minimum pick target on all 12 chapters (C12 before the arena) |
| Map validation | every chapter canonical + each combat segment in variants B and C individually + 5 seeded combinations: pickup, each drop in order, checkpoint, arena gates, spawn clearance; failure falls back to canonical with a log |
| Real success / fail | success after boss + delivery; fails tested: courier HP, package rules (cold / melt / burst / vip), boss timer, delivery timer, plus Phase 02/03 paths |

## Boss (Latte Art Dragon)
Idle and untargetable before the arena · entry gate closes on entry · immune intro roar · delivery timer frozen, boss
timer running · phase-1 attacks telegraph warn → active → recover and land · phase 2 at 70 % (immune roar, reset) ·
helpers spawn with cap ≤ 4, helper kills give no XP and no kill stats · phase 3 at 30 % with its own patterns ·
death from a real card hit = one BOSS_DEFEATED event, exit opens, helpers removed · delivery timer resumes ·
boss + delivery = success, +400 first-clear coins once, episode complete · replay gives no second first-clear
reward · boss timer 0 = failure (`bossTime`).

## Packages
12 types with contract HP / speed · HOT starts only after pickup, decays on simulation time, frozen while paused,
fails under 25 % · FROZEN melts faster on steam, fails under 20 % · FIZZY pressure up on impact, down when calm,
bursts at 100 % · VIP fails under 80 % at delivery, succeeds at 85 % with +75 % · reward bonuses XL +25 %,
PREMIUM +50 %, HOT +20 %, STANDARD 0 · REINFORCED hazard −30 %, PREMIUM package damage +20 % · MYSTERY resolves to a
real rule, stays the same after abort/reopen, new attempt only after a real terminal result, never Hot/Frozen/Fizzy/
VIP on a boss final, reward +40 % once.

## Multi-drop
Final customer refuses before the first drop · first drop completes once (XP once), target advances · success only
after both drops.

## Save
Legacy save with all 12 chapters cleared: completions/stars/unlocks kept, `legacyFinalClear` true, episode **not**
marked complete (boss final must be played), migration idempotent; invalid Mystery entries dropped.

## Known limitations / deferred
- Dynamic route events (Blocked Passage, Spill Accident, Ambush, Express Shortcut, Emergency Station, Bonus Cache) are
  **not implemented** yet; the existing split segments provide the risky physical shortcut.
- Packages XL / LIGHTWEIGHT / REINFORCED / PREMIUM / VIP / FROZEN / MYSTERY are implemented and tested but not
  used in the Coffee table (themes Hot / Fizzy); they appear in later restaurants.
- Boss balance (1400 HP, 90 s) is a starting value: random-pick builds needed 58–85 s; tune in the balance phase.
- Boss art is procedural; star goals are still the HTML5 rule (pkg ≥ 70 %, time) until Phase 09.
- Real-time manual play of every chapter by a person was not done; the sweep is engine-driven.

## Screenshots (`docs/screenshots/phase04/`, real build)
01 RunPrep C12 (boss, type) · ch4/7/8/12 intros · 02 C4 Hot meter · 03 C8 Fizzy meter · 04 C7 multi-drop ·
05 boss arena: closed gate, boss bar, boss timer, rain telegraphs · 06 phase 3 sweeping breath · 07 C12 result with
first boss reward · `flow/` full UI flow.
