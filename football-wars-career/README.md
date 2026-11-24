# Football Wars — Complete Career Edition

Found your own football club, start at the bottom of a 200-club world in **Division 10**, and climb ten divisions while
managing standard squads, star players, transfers, scouting, an academy, facilities and finances. Every match — yours
and all 3,127 official matches of a world season — is a real **100 vs 100 Football Fusion battle** on the V4 engine
(real ball, passes, shots, saves, goals with a short goal advantage; the last team standing wins).

## Deliverables (`release/`)

| File | What it is |
|---|---|
| `FootballWarsCareer.html` | Standalone offline game: all JavaScript/CSS inlined, no network needed. Double-click to play. |
| `FootballWarsCareer_itch.zip` | itch.io HTML5 upload: `index.html` at the ZIP root. Upload as "HTML", tick "playable in the browser". Suggested viewport 1280×800 (mobile friendly). |
| `FootballWarsCareer_source.zip` | Modular source, data, tools and tests. |
| `README.md`, `TEST_REPORT.md`, `LICENSES.md` | Docs, real test results, licences/attribution. |

## Run / build from source

```bash
npm install            # Vite + single-file plugin (build tools only)
npm run dev            # dev server with hot reload (http://localhost:5173)
npm test               # Node test suite (engine regression, battle, career, systems)
npm run build          # vite build -> dist/index.html, then tools/release.mjs -> release/*
npm run build:engine   # regenerate src/battle/engine.js from the V4 engine + tools/engine-career.js
node tools/season-bench.mjs 1 4   # real-engine world season benchmark (1 season, 4 worker threads)
node tools/calibrate.mjs 40       # win-rate vs power gap / tactic match-ups
```

Requires Node 18+ (tested on Node 22). Browser smoke tests use Playwright/Chromium (`tools/smoke.cjs`).

## How to play

1. **New Career** → name your club, city, stadium, colours, kit pattern and crest → **Starter Squad Builder**: split
   100 amateurs over 7 roles (exactly one captain; default 16/14/12/34/8/15/1).
2. **Each world week** you have **2 management actions**: buy a standard-player package, open star talks, start a
   scouting mission, train a group/star, retrain roles, upgrade a facility. Free: squad view, active stars, tactics,
   tables/reports, specialisation picks, renewals, listing, accepting bids, playing matches.
3. **Match day** → *Prepare match*: main tactic (High Press / Defensive Fortress / Counter Strike / Total Football),
   starting style, up to 5 stars. Then:
   * **Play Match** — live battle; you switch **Attack / Balanced / Defend** (8 s cooldown, free) and fire up to
     **3 coach commands** per match: **FULL PRESS**, **HOLD LINE**, **FAST BREAK** (4 s effect, 8 s cooldown).
   * **Auto Coach** — watch while your assistant (as good as the managers of your division) uses the same AI policy as the AI clubs.
   * **Quick Simulate** — the same battle computed without drawing (identical to Auto Coach for the same seed).
4. **Next week** — the rest of the world (all divisions + cups) is simulated in Web Workers in the background.

**Season**: 38 world weeks. Divisions 10–6 play 19 league games (even weeks), Divisions 5–1 play 38 (every week).
Win = 3 points, no draws. Divisions 2–10: champion promoted + play-off final (2nd v 3rd) winner promoted.
Divisions 1–9: 19th and 20th relegated. Cups (Division Cups ×10, Grand Club Cup, Champions Tournament) pay prize
money and glory but never promote. Transfer windows: weeks 1–8 and 21–28.

### Controls

| | Mobile | Desktop |
|---|---|---|
| Styles | tap Attack / Balanced / Defend | `1` `2` `3` |
| Commands | tap FULL PRESS / HOLD LINE / FAST BREAK | `Q` `W` `E` |
| Camera (Smart / Full Field / Football Focus) | selector | `C` |
| Sound / speed (1×, 2×) | buttons | `M` / `Space` |

## Saves

* Three independent career slots in **IndexedDB** (localStorage fallback). Autosave after club creation, every
  management action, transfer, match result, week and season transition.
* Each save is a versioned, checksummed envelope; the previous good save is kept as a backup and restored
  automatically if the latest one is damaged.
* **Export JSON / Import JSON** (Menu) for backups or moving between browsers; imports are schema-validated.
* A match result is applied exactly once; a live match abandoned mid-way is completed by the assistant coach on
  the next load (no re-rolling).
* `file://`: tested in Chromium — IndexedDB and Web Workers both work. If a browser blocks storage for local files,
  the game says so on the title screen; use Export JSON.

## Project layout

```
src/battle     engine.js (generated V4 engine + career ruleset), adapter.js (club -> exactly 100 units),
               run.js (headless runs), sim.worker.js + simPool.js (parallel world simulation)
src/career     world.js (200 clubs), schedule.js (fixtures/cups), season.js (weekly flow, results, promotion),
               economy.js, management.js (actions, transfers, scouting, academy), stars.js, sim.js, validate.js
src/ai         manager.js (season management + pre-match AI; live tactical AI lives in the engine: coachDecide)
src/ui         app.js (shell, flow, creation, dashboard, finance), screens.js, match.js (prep, battle, report, replay)
src/persist    save.js (slots, envelope, validation, import/export)
src/data       balance.js (all tunable numbers), profiles.js (anonymised balance profiles), names.js
src/legacy     V4 presentation modules (font, sprites, renderer, director, V3 visuals, procedural audio)
tests          node:test suites; fixtures/v4-baseline.json recorded from the unmodified V4 engine
tools          build-engine.py, engine-career.js, record-v4-baseline.cjs, extract-profiles.cjs, release.mjs,
               season-bench.mjs, calibrate.mjs, smoke.cjs
```

## Design notes

* **Legacy rulesets stay bit-identical**: the engine is produced from the original V4 source by asserted, minimal
  patches; every career behaviour is gated by `w.career` / per-unit modifiers. The regression test replays 24 V4
  reference battles (classic + fusion, normal and headless) and compares winner, end tick and event hash.
* **Career ruleset (`career-v1`)**: stars are individual units (quality, signature ability, specialisations compiled
  into real modifiers: shot accuracy, save chance, tackle/interception chance, heal radius, aura radius, armour…);
  tactics change positioning depth, chasers/supporters, team specials; styles and commands change movement, pressing,
  defensive shape and attacking intent. Time-limit decision: more players standing → health share → seeded rule.
* **Determinism**: seeds come from the career seed + fixture id; commands are applied on the next tick and logged
  with their tick, so live play, Auto Coach, Quick Simulate and replays produce the same battle.
* **Same rules for AI**: AI clubs get 2 actions/week, pay real prices, respect windows/limits, see only visible
  information, and get no hidden bonuses. Division strength only changes AI decision quality.
