# Test Report — Football Wars: Complete Career Edition

All results below were produced in this development environment (Linux, Node 22.23, 4 CPU cores, Playwright
Chromium headless). Nothing here is estimated; where something was **not** tested it is listed under *Not tested*.

## 1. Automated suite — `npm test` (node:test): **21 / 21 pass**

| Suite | Test | Result |
|---|---|---|
| engine.regression | 24 reference battles recorded from the **unmodified V4 engine** (6 team pairs × classic/fusion × 2 seeds) reproduced bit-for-bit: winner, end tick, event hash, event count, goals | pass |
| engine.regression | same 24 battles in **headless** mode (FX skipped, no event log) — identical | pass |
| battle | lineup: exactly 100 units, exactly 1 captain, max 5 stars, stars replace standard units; 104 registered → 100 play; injured / not-yet-registered stars replaced | pass |
| battle | live 100 v 100: real ball (shots, passes), star units individually stronger with real modifiers, last team standing, KO events = eliminations | pass |
| battle | **Auto Coach (rendered, events logged) == Quick Simulate (headless)**: same hash, winner, end tick; coaches actually issued commands | pass |
| battle | commands: pending/cooldown rejection, style cooldown, 3-use limit, replay of the logged user commands reproduces hash/winner/end tick | pass |
| battle | ATTACK+FAST BREAK moves the team forward, DEFEND+HOLD LINE keeps it deeper (measured mean position) | pass |
| battle | time-limit rule: more players standing wins even when the other side has more health | pass |
| career | 200 unique clubs, 199 AI, player in D10, 10×20, D10 average start quality 37–38.2, 1,600 C, 100 players, 0 stars, level-1 facilities, 5 new AI clubs, no star at two clubs | pass |
| career | D10 base week = +240 −130 −40 = **+70 C**; finance never applied twice | pass |
| career | full season structure: **2,850 league + 190 Division Cup + 63 Grand Club Cup + 15 Champions + 9 play-offs = 3,127**; no fixture/pairing twice; 19/38 league games per club; home split 9/10 (D6–10) and 19/19 (D1–5); every cup has a champion; 10×20 after the season | pass |
| career | promotion (champion + play-off winner), play-off loser stays, 19th/20th relegated, D10 bottom stays; 3 seasons stable (200 clubs, 10×20, star ownership consistent, ≤ 8 stars) | pass |
| career | week cannot end without all results; a result applied twice pays nothing; week end not repeatable | pass |
| career | star transfer is atomic (money + ownership), one club per star, level/XP/ovr/potential/specs preserved, limited offers, closed window blocks, new signing registered next week | pass |
| career | 2 actions/week, packages replace weakest units (squad stays 100), duplicate purchase blocked, facility cost 300/400… | pass |
| systems | save envelope roundtrip; tampered data (checksum), foreign JSON, non-JSON, broken division, broken star ownership all **rejected** | pass |
| systems | XP 50+25L, specialisation slots at 4/9/15, signature+spec compiled into battle modifiers, transfer keeps progress, veterans retire by 39 | pass |
| systems | AI management: actions within 0..2, total money in the world never increases from AI actions | pass |
| systems | economy safety: blocked spending does not consume an action, advance once/season with repayment, base week positive in every division, cost formula | pass |
| systems | club creation validation (empty, too long, HTML injection, identical colours, short-name format) | pass |
| systems | ambition: a quality-80+ star refuses a Division 10 club | pass |

Structural season tests use a clearly labelled **test-only result stub** for speed. Every real game path uses the
battle engine; the real-engine season is verified separately below.

## 2. Real-engine world seasons — `node tools/season-bench.mjs` (worker_threads)

Every match is a full 100 v 100 Football Fusion battle (no stub). Player club on its assistant coach, no management.

| Run | Matches | Wall time | ms / match (wall, 4 workers) | Slowest week | Avg battle | Avg goals |
|---|---|---|---|---|---|---|
| 1 season (initial build) | 3,127 | 127.9 s | 40.9 | 5.1 s | 46.8 s | 1.67 |
| 3 seasons (after economy fixes) | 9,381 | 381.4 s | 40.7 | 5.4 s | 47.0 s | 1.67 |
| 2 seasons (final balance) | 6,254 | 279.1 s | 44.6 | 6.0 s | 48.3 s | 1.50 |

Single-thread cost is ~120–180 ms per battle (calibration runs). Time-limit decisions never occurred; ~0.5% of
battles ended in the V4 simultaneous-elimination sudden-death rule.

Final-balance world after 2 seasons: division quality 90.1 / 83.9 / 78.0 / 72.9 / 67.8 / 62.1 / 57.6 / 52.5 / 47.4 /
43.5 (D1→D10; division-relative training ceilings stop runaway inflation), 652 stars in the pool, lowest AI budget
−5,664 C (recovering via advance / sales), median 3,073 C. A passive player club finished 19th both seasons — the
AI clubs develop, so management matters.

## 3. Balance measurements (`tools/calibrate.mjs`, auto coaches, 50 battles each)

* Power gap → stronger team wins: 0 → 52%, 3 → 62%, 5 → 74%, 10 → 82%, 20 → 94%, 40 → 100%.
* Tactics head-to-head (equal power): all within 48–56% (High Press 54% v Total; Fortress 56% v High Press; Counter
  48% v Fortress…) — no dominant tactic.
* Blind commands (×3, fixed times, N=40): FULL PRESS 57%, HOLD LINE 60%, FAST BREAK 50% vs no commands.
* Live tactical AI levels (N=100, equal power): L1 beats no coach 62%; L6 beats L1 58%; L10 beats L6 56%.
* Player's starting club vs its 8 nearest D10 rivals: 51% (20 battles each, 10 per rival).

## 4. Browser tests (Playwright + Chromium)

| Test | Result |
|---|---|
| `tools/smoke.cjs` @ 390×844 and 1366×800: title → club creation (validation, preview) → squad builder → dashboard → squad → sponsor → transfers → facility upgrade → next week (world sim) → prep → **Quick Simulate** → report → 2 weeks → **Play Match** (style key `1`, command `Q`) → skip → report → **replay verified identical (hash match)** → tables → cups → **reload → Continue** (week preserved) | pass, 0 console/page errors, 0 px horizontal overflow |
| Pixel 7 emulation: every screen (12 views + squad builder) checked for horizontal overflow and buttons < 30 px | 0 overflow, 0 undersized |
| **Offline `file://`** standalone `FootballWarsCareer.html` (network disabled): new career, week 1→2 with world sim, reload & slot listing | pass; IndexedDB works; **3 Web Workers** run; week 1→2 in 5.7 s |
| **itch.io ZIP**: unzip → `index.html` at root → same offline test | pass |
| Full season in the browser (`season.cjs`, Quick Simulate for every player match, 1280×800): 38 weeks + play-off week, season-end screen, history | pass — earlier build: 2nd in D10, won the play-off, **promoted to D9**; **final build**: 3.0 min, 23 player matches (league + cup), finished 12th (no management), season 2 started, 0 errors |

Screenshots of these runs are in `screenshots/`.

## 5. Bugs found by testing and fixed

* Round-robin home/away imbalance (12/7) → Berger pairing rule; test enforces 9/10.
* Create-club screen not reachable (render order) → fixed; smoke test covers it.
* Module Web Workers fail from `file://` → classic (IIFE) inline workers; verified 3 workers offline.
* AI training/packages inflated D10 quality 37.5→49 in one season → division-relative ceilings.
* Academy intake ballooned the star pool to 1,243 → bounded intake/free-agent pool (~600–650 stable).
* AI wage spiral (one club −106k C) → AI wage budget, emergency release; worst now ≈ −5k and recovering.
* Higher-level tactical AI was *worse* than basic AI → ablations showed HOLD/FAST were too punishing and
  re-evaluating too often burned commands; commands rebalanced, policy rebuilt; ordering now L1 < L6 < L10.
* Legacy V4 role tables (40 defenders + 10 keepers) and amplified attribute extremes made many AI clubs lose
  almost every game → AI formations = standard shape + flavour, attribute spread softened.
* Week-transition race (background sim re-rendered mid-transition, a quick tap opened a screen that was then
  replaced) → transition guard.
* Star ambition hole (quality-88 free agent would join D10) → level-gap refusal rule.

## 6. Not tested / known limitations

* **Browsers:** only Chromium (desktop + Android-class emulation) was automated. Firefox, Safari/iOS and real phones
  were not tested. Audio could not be verified by ear (headless); the V4 procedural audio module is used unchanged and
  is muted at 2× speed.
* **Performance on real low-end phones** not measured. Without workers the world sim runs time-sliced on the main
  thread (≈100 battles/week × ~150 ms ≈ 15 s on a desktop CPU; slower phones proportionally longer, with progress).
* **Match video export** from V4 (MP4/WebM via WebCodecs) was **not carried over**; deterministic replays are
  provided instead.
* UI language is English only (V4's TR strings are not used in the career UI).
* Balance is tuned from the measurements above; long careers (10+ seasons) were exercised structurally (stub) for
  3 seasons and with the real engine for 3 seasons, not beyond.
