# Farm RPG – Tiny Asset Pack importer

Imports art from **“Farm RPG – Tiny Asset Pack (All in One)” by EmanuelleDev** (https://emanuelledev.itch.io)
into the game's existing atlas pages. Sprite IDs and rectangles from `Kayip_Ufuk_GDD_v2_0/Art/AtlasLayout.json`
are never changed.

## Licence (from the pack's `Documentation.txt`)
- Use in commercial and non-commercial projects is allowed; modification is allowed.
- **The assets may not be resold or redistributed, even modified.** The pack is therefore **not** in this
  repository: `vendor/` is git-ignored. Only the game's packed atlases (which ship with the game) are committed.
- **Credit is mandatory**: shown on the main menu, in Settings and in the "Emeği geçenler" (Credits) panel, plus
  `CREDITS.md`.

## Usage
```bash
# extract the pack so that vendor/farmpack/Documentation.txt exists (or set FARMPACK_DIR)
npm run assets          # procedural generator, then this importer
npm run build           # packages the committed atlases (use `node tools/build.mjs --assets` to regenerate first)
node tools/validate_atlases.mjs public
```
Outputs: `public/assets/atlases/*.png`, `public/assets/sprite_native.json` (per-sprite native draw scale, content
bbox and `__meta` flags), `public/assets/avatar_anchors.json`, `public/assets/farmpack_manifest.json`
(source file and cell for every replaced sprite).

## How art is placed
- 16 px pack tiles become one 32 px game tile. Small art (icons, terrain) is stored at x2.
- Larger art (trees, builds, animals, crops, the character) is stored at x1 inside the existing rect and drawn by the
  renderer at an integer native x2 (`sprite_native.json`), so pixels stay crisp and footprints match.
- Terrain: base textures from the summer/spring grass, beach, water, cave and path sheets; edge transitions are
  matched automatically by `autotile.py`, which classifies each 16 px blob piece by which sides show the neighbouring
  material and picks one piece per 4-bit mask (all 15 masks found for sea, river and trail). In pack mode the
  renderer draws these pieces on the water/trail side.
- Builds: where one prop is smaller than the BuildDB footprint, a small vignette of props is composed. Every solid build
  is verified so that each footprint cell lies under visible art (no invisible walls); otherwise the procedural sprite
  is kept.
- Character: skin/eyes/outfit/hair layers map onto the runtime recolour system. The four pack skins become the four
  skin tones; outfit and hair become grayscale masks tinted at runtime; the tool layer is baked into each action frame.

## What was imported (see `public/assets/farmpack_manifest.json` for the full list)
| Category | Count | Notes |
|---|---|---|
| Item / codex icons | 99 | tools in wood/copper/iron tiers, bags, materials, ores/ingots, food, fish, sea creatures |
| Crop stages | 44 + 2 | 11 crops × 4 stages (stages auto-picked for maximal visual difference) + tilled/wet soil |
| Resource nodes | 28 | 14 nodes × ready/depleted (trees + their stumps, berry bush, grass, logs, rock, ore piles) |
| Foliage decor | 21 | palms, broadleaf trees, flower bushes, logs, reeds, coral clusters, rock spires |
| Terrain | 80 + 48 + 24 | 20 base textures × 4, sea/river/trail transitions × 16 masks, water ripple frames |
| Builds | 31 + ghosts + 2 fx | furniture, work benches, storage, lamp, fence, water tower, well, racks, rug, pier, planter |
| Animals | 244 | rabbit, frog, seagull, crow (forest bird), turtle (marine), all clips × 4 directions |
| Player character | 990 | 2 bodies × 16 clips × 4 directions, outfit masks, 6 hairstyles |

## Deliberately not used (and why)
- **Human NPCs** (chef, blacksmith, child, mermaid, pirate): GDD lock — no humans live on the island.
- **Enemies** (slimes, goblins, myconid, spike, venom bloom) and **farm animals / pets / deer / fox / capybara /
  hippo / penguin / dolphins / bugs**: not among the GDD's fixed 25 species.
- **Winter / autumn / snow variants**: tropical island without seasons.
- **Village, barn, temple, dungeon, mine buildings, vehicles (bus, train, ice-cream cart), playground**: no settlement
  content in the GDD; the four prefab houses keep their own art (interior/roof parts are part of the contract).
- **Horse, bicycle, bear, broomstick, umbrella, mage, flute, carrying animations**: no such mechanics.
- **Single beds** (vertical) for the horizontal 2×1 wood/leaf beds, **bridge/gate** pieces (orientation/size don't fit),
  **sugar cane** (no equivalent), sea creatures without a GDD species, **UI frames** (the game UI is DOM-based).
These sprites keep the procedural art from `tools/assetgen/`.
