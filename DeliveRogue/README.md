# DeliveRogue

Portrait mobile action roguelite — HTML5 Canvas, ES modules, Vite. **AYG FORGE**

Current state: **Phase 02 — Premium Scene Framework** complete (on top of Phase 01 Core Migration).
Coffee District gameplay (12 chapters) is unchanged; the UI is now 8 independent scenes with a persistent
TopBar / NavigationBar, transitions and a premium cartoon art direction. See `docs/MIGRATION.md` (Phase 01)
and `docs/SCENES.md` (Phase 02).

## Commands
```bash
npm install          # Vite (dev dependency only)
npm run dev          # dev server: http://localhost:5173  (window.__DR debug hook is available in dev)
npm run build        # production web build -> dist/ (offline, no CDN / remote fonts / APIs)
npm run preview      # serve dist/
npm test             # unit tests (node --test) against the real runtime modules
npm run test:smoke   # real-browser smoke test (Playwright + Chromium) against dist/
node tests/smoke/baseline.mjs reference/DeliveRogue.html > a.json && node tests/smoke/baseline.mjs dist > b.json && cmp a.json b.json
```
`npm run test:smoke` needs Playwright + Chromium available (`npm i -D playwright` + `npx playwright install chromium`
on a fresh machine). Debug/test mode: append `?debug=1` (separate save namespace `debug__deliverogue_save`).

## Layout
```
index.html                 page shell (canvas + DOM UI layer)
src/main.js                entry: data validation -> GameEngine.init()
src/core/                  GameEngine (fixed 60 Hz loop), DistrictRuntimeCore (simulation authority),
                           InputManager, SaveManager, EventBus, AudioManager, Art + AssetManager, rng, i18n, DataValidator
src/systems/               Nav, MapBuilder, SkillMgr, Fx, Progression
src/render/Render.js       canvas world + HUD renderer
src/core/SceneManager.js   scene lifecycle, transitions, input lock, back routing
src/scenes/                Boot, MainMenu, Garage, MetaHub, RunPrep, FightScene, RunSummary, Settings
src/ui/                    App (composition root), Chrome (TopBar + NavigationBar), Overlays, SceneArt,
                           RoutePreview, UITheme widgets, icons (inline SVG)
src/data/                  packages, player, enemies (+ canonical 100-enemy catalog), skills, garage, cosmetics,
                           chapters, episodes, quests, segments, ids
src/platform/              PlatformAdapter (browser: ads/billing unavailable), StorageAdapter, Haptics
src/locales/tr.js          TR source strings
src/styles/main.css, scenes.css
tests/unit, tests/smoke    unit + browser tests
docs/                      AssetManifest.json, MIGRATION.md, screenshots/
reference/                 legacy HTML5 source backup, enemy catalog JSON, 5 UI reference images
```

## Android WebView
`dist/` is static and relative-path (`base: './'`). It uses `<script type="module">`, so serve it over
http(s) (e.g. Android `WebViewAssetLoader` with `https://appassets.androidplatform.net/`), not raw `file://`.
