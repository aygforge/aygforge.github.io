# DeliveRogue

Portrait mobile action roguelite — HTML5 Canvas, ES modules, Vite. **AYG FORGE**

Current state: **Phase 01 — Core Migration** complete. The working single-file HTML5 build
(`reference/DeliveRogue.html`) is now a modular project with identical Coffee District gameplay
(12 chapters). See `docs/MIGRATION.md` for the module map and the short list of intentional changes.

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
src/ui/UI.js               legacy DOM screens (replaced by 8 scenes in Phase 02)
src/data/                  packages, player, enemies (+ canonical 100-enemy catalog), skills, garage, cosmetics,
                           chapters, episodes, quests, segments, ids
src/platform/              PlatformAdapter (browser: ads/billing unavailable), StorageAdapter, Haptics
src/locales/tr.js          TR source strings
src/styles/main.css
tests/unit, tests/smoke    unit + browser tests
docs/                      AssetManifest.json, MIGRATION.md, screenshots/
reference/                 legacy HTML5 source backup, enemy catalog JSON, 5 UI reference images
```

## Android WebView
`dist/` is static and relative-path (`base: './'`). It uses `<script type="module">`, so serve it over
http(s) (e.g. Android `WebViewAssetLoader` with `https://appassets.androidplatform.net/`), not raw `file://`.
