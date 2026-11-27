# Phase 02 — Premium Scene Framework

## Scene graph
| Scene | Hub bars | Canvas | Layout authority | Notes |
|---|---|---|---|---|
| Boot | no | — | — | AYG FORGE logo; real steps: save load/recovery → data validation → asset warm-up (progress = completed jobs) |
| MainMenu | yes | live world (menu) | art direction | logo, Coffee District progress, Play/Continue, animated restaurant world + active courier |
| Garage | yes | — | 88176.png | equipment column (4 live + 4 locked until Phase 05), lit platform, Trophy Room, stats, Skin Shop |
| RunPrep | yes | — | 88174.png | mode / restaurant chips (locked with reason), 3 stacked chapter cards, real route preview, obstacles, package rule, star goals, mastery, START, loadout |
| MetaHub | yes | — | 88175.png + 88173.png | milestone hologram station + node chain, Delivery Board, Courier Book; Daily/Weekly/Events locked until Phase 11 |
| Settings | yes | — | art direction | audio, shake, vibe, reduced motion, low graphics, fullscreen, export/import, tutorial reset, reset |
| FightScene | no | game | — | preserved runtime; intro / skill / pause / confirm overlays; ESC/back = pause; quit only via confirm |
| RunSummary | no | — | 88172.png | banner, XP bar, kills / package / coins / time cards, grade + mastery, badges, Next / Retry / Continue |

## Framework rules (src/core/SceneManager.js)
- One active scene gets `update`; each scene has its own root `<section>` and a scoped `ctx` whose
  listeners / timeouts / intervals are disposed on exit.
- Incoming scene mounts before the outgoing one is removed (no black frame); input is locked during the
  transition; extra requests are ignored (single target); taps within 180 ms are debounced.
- Durations: hub slide 280 ms (direction from tab order), back 300, boot fade 700, run launch 500, result 600;
  reduced motion = instant.
- Back (ESC / hardware / browser back): overlay first → scene sub-view → hub → MainMenu; in FightScene back = pause.
- TopBar + NavigationBar stay mounted; only centre content transitions. Badges: Garage = affordable upgrades,
  MetaHub = claimable quests + milestones. Store "+" is shown only if billing is available (never in browser).
- Canvas renders only for scenes that use it (MainMenu menu world, FightScene game), union during transitions.

## Art
All scene art is procedural in the final direction (no copied reference bitmaps, no text baked into art except
the DELIVEROGUE brand mark): `ui/SceneArt.js` backdrops (operations room, run-prep room, workshop, control room),
`ui/icons.js` SVG icon set, CSS bevel/outline components. Replaceable via AssetManager logical ids later.
Reference energy / gems / fuel / crates / blueprints / Safe-Normal-Risky are intentionally NOT implemented.
