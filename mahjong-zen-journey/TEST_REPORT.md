# Test Report — Mahjong: Zen Journey v1.0.0

All results below come from real runs on the final build (`index.html`). The game's interface is in Turkish; the browser tests check the Turkish on-screen text (for example "Bölüm Tamamlandı", "Dünya Tamamlandı", "Yolculuk Tamamlandı", "Tam ekran kullanılamıyor"). English labels below describe the same screens. Every suite can be re-run, and the raw output is in `tools/out/*.json`.

| Suite | Command | Result |
|---|---|---|
| Level validation (500 levels) | `node tools/validate-levels.js index.html` | **500 / 500 valid** |
| Engine + progression tests | `node tools/test-engine.js` | **20 / 20 passed** |
| Browser end-to-end tests (headless Chromium) | `node tools/test-browser.js` | **21 / 21 passed** |
| In-browser validation (`?debug=1` → Validate) | run inside the e2e suite | **500 / 500 valid, 500 unique hashes** |

## 1. Level tests (16.1)

Each check was run on the level data extracted from the built `index.html`:

| # | Check | Passed |
|---|---|---|
| 1 | Level data present and decodable | 500 / 500 |
| 2 | Tile count even | 500 / 500 |
| 3 | Geometry rules: inside the 9×10 grid, ≤ 8 layers, every raised tile fully supported | 500 / 500 |
| 4 | No overlapping or duplicate tile positions | 500 / 500 |
| 5 | At least one valid opening match | 500 / 500 |
| 6 | Board fully clearable | 500 / 500 |
| 7 | Stored solution certificate removes every tile (each step: both tiles free and matching) | 500 / 500 |
| 8 | No duplicate geometry (canonical, translation- and mirror-invariant) | 500 unique hashes / 500 unique geometries |
| 9 | Fits a phone: smallest tile on a 360×640 screen is 33 CSS px wide, and pinch-zoom takes it up to ~90 px | 500 / 500 |
| — | Face distribution valid (pairs per class, flowers/seasons unique) | 500 / 500 |
| — | Tile count inside the brief's curve for that level | 500 / 500 |

Additional verification:

- **Independent exact solve** of every initial board. This uses a DFS solver with memoisation that does *not* use the certificate. Result: solved 500, unknown 0, unsolvable 0. Each found solution was replayed and checked.
- **Near-duplicate scan** over all 124,750 level pairs: the highest Jaccard similarity of aligned tile sets is 0.86 (levels 374/484). Generation rejects anything above that.
- During generation, 0 geometries were rejected as unclearable. Every layout family produced clearable stacks.
- **Families:** each of the 20 families is used 23–27 times. Each world's 25th level is a Final Challenge, and level 500 is a twin-dragon layout.

Difficulty by segment (measured):

| Levels | Curve (brief) | Actual tiles | Avg layers | Avg open pairs at start | Random-play clear rate |
|---|---|---|---|---|---|
| 1–25 | 24–40 | 24–40 | 2.08 | 5.8 | 0.95 |
| 26–75 | 40–56 | 40–56 | 2.60 | 8.9 | 0.85 |
| 76–150 | 48–72 | 48–72 | 2.65 | 12.6 | 0.76 |
| 151–250 | 56–80 | 56–80 | 3.11 | 14.1 | 0.67 |
| 251–350 | 64–88 | 64–88 | 3.28 | 17.0 | 0.57 |
| 351–450 | 72–96 | 72–96 | 3.41 | 19.7 | 0.47 |
| 451–500 | 80–96 | 80–96 | 3.60 | 20.6 | 0.42 |

"Random-play clear rate" is the share of playthroughs that pick uniformly among available matches and still clear the board. It falls steadily, so later levels punish careless choices more, while every start stays provably solvable.

## 2. Game-system tests (16.2)

**Engine tests** (`tools/test-engine.js`, DOM-free `GameSession` + progression rules):

- Free-tile rules: covered, partially covered, side-blocked, half-offset neighbours, half-tile gaps.
- Tapping the selected tile again deselects it.
- A wrong match moves the selection and removes nothing.
- Blocked tiles can't be selected, and the current selection survives a blocked tap.
- Removing an upper-layer pair reveals the tiles beneath (reported as `revealed`).
- Matching the last two tiles wins and locks the board (no taps, no undo).
- Flowers match any flower and seasons any season, but never each other.
- A no-moves state is detected and reported unsolvable. Shuffle then yields a solvable deal.
- Shuffle refuses geometry that no deal can clear (a tile buried under its only partner), and rewind returns to a provably solvable board.
- Undo and 6× undo restore tiles, counters and exact freeness. Undo also reverts a shuffle's faces.
- Shuffle keeps the tile multiset. Its returned order is a valid certificate for the new deal (28 shuffles checked).
- Restart gives back the identical deterministic start, which also matches a fresh decode.
- Hints always point at a valid free pair, and hint-only play clears levels 1, 13, 60, 140, 260, 380, 470 and 500.
- Star rules: 3 / 2 / 1.
- **All 500 levels were won through the real `tap()` API.**
- **Dead ends after a solvable start:** random play dead-ended 158 times across 21 sampled levels. Every stuck board was reported unsolvable, rewinding reached a solvable state, and shuffle (when possible) produced a solvable deal.
- Save/restore of a game in progress, including a shuffle and hints: every move is replayed and validated, and corrupted or wrong-level data is rejected.
- Progression: sequential unlocks for levels 1→500, 19 world transitions, best stars and time kept on replay, **level 500 reports game complete with no level 501**, and achievements (including All 1500 Stars).
- Export/import: round trip, wrong game id, newer version, garbage and hostile values (clamped).
- Continue prefers the game in progress.

**Browser tests** (`tools/test-browser.js`, Playwright + headless Chromium, served over HTTP; screenshots in `tools/out/screens/`):

1. Boot: splash, then menu. No console errors and **no external network requests**.
2. Play shows the world intro, then level 1 with a tutorial coach mark. **WebAudio starts from the first gesture.**
3. Touch taps: select, deselect, blocked tile, mismatch.
4. Level 1 solved with real touch taps: win screen with 3 animated stars, level 2 unlocked, Next Level.
5. Layered hit-testing: a raised tile wins over the tile under it.
6. Hint, shuffle, triple undo, restart (with confirmation), pause (the timer stops).
7. Rapid taps, stray taps on vanishing tiles, and undo/shuffle during animations: state stays consistent and replayable.
8. Save, **reload** and Continue: same board and undo history.
9. Export Save downloads a valid JSON file (`mahjong-zen-journey-save-YYYYMMDD.json`).
10. Reset needs confirmation. Importing the exported file restores progress, and an invalid file is rejected with a message.
11. World map (20 cards) and level select (25 buttons).
12. Level 25 Final shows "World Complete!", then the Cherry Blossom intro, then level 26.
13. **Level 500 shows "Journey Complete!"**: no Next button, and the game stays on level 500.
14. Responsive layouts at 360×640, 375×667, 390×844, 412×915 and desktop 1366×768. The board fits, the toolbar is visible, the app fills the height, desktop shows a centred 9:16 column, and taps hit the right tile. On the densest late level, tiles are 34.5–41.6 px wide.
15. Portrait → landscape → portrait: the rotate notice appears, the timer pauses, and touch coordinates are still correct afterwards.
16. Pinch-to-zoom (CDP multi-touch), drag-to-pan (a pan is not a tap), an accurate tap while zoomed, and the Fit button.
17. **Fullscreen:** enter → icon switches → exit → re-enter. Change levels and open pause while fullscreen, then exit. Taps stay accurate afterwards.
18. **Cross-origin iframe** (itch.io-like):
    - Without `allowfullscreen`, the game reports fullscreen unavailable, offers "Open in new tab" and does not fake fullscreen. A level is fully playable inside the iframe.
    - With `allowfullscreen`, fullscreen enters and exits.
19. iPhone-like browser without element fullscreen: guidance appears (Add to Home Screen).
20. Debug mode is hidden without `?debug=1`. With it: hash and match list, overlays, in-browser 500-level validation (500/500), stored-solution playback.
21. Visual tour of 8 more worlds (screenshots).

## 3. Mobile portrait and fullscreen checklist

| Scenario | Status |
|---|---|
| Portrait play on Android Chrome | Verified in emulated Chromium (Pixel 7 profile, touch, DPR 2.6). Not tested on a physical device. |
| Portrait play on mobile Brave | Brave is Chromium-based, so the same code path applies. **Not tested on Brave itself.** |
| iPhone Safari behaviour | Code path verified with a simulated "no element fullscreen" browser. **Not tested on a real iPhone/Safari (WebKit).** |
| Enter / exit / re-enter fullscreen | Verified (Chromium) |
| Rotate to landscape and back | Verified (viewport change in emulation) |
| Running inside an itch.io-style iframe | Verified with cross-origin iframes, with and without `allowfullscreen`. Not tested on itch.io itself. |
| Changing level while fullscreen | Verified |
| Pause menu while fullscreen | Verified |
| Zooming the board while fullscreen | Pinch-zoom verified; zoom is kept across resizes/fullscreen changes |
| Buttons and touch coordinates after leaving fullscreen | Verified |

**Still needs a physical device:**

- Real iOS Safari: `100dvh`, safe areas with notch and home bar, and *Add to Home Screen*.
- Real Android Chrome/Brave: portrait lock after fullscreen, and the address bar appearing and disappearing.
- Audio output on real speakers.
- Frame rate on low-end phones.
- An actual itch.io page: its fullscreen button and "click to launch" mode.

Headless Chromium can't confirm these.
