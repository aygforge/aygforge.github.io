# Licences, sources and attributions

Football Wars — Complete Career Edition ships as a single offline HTML file. This document lists everything in it that
did not originate in this project's own source, and how the default content was kept free of third-party trademarks.

## Code

| Component | Origin | Licence / status |
|---|---|---|
| Battle engine (`src/battle/engine.js`) | Generated from the project owner's own *Football Wars V4* `FWEngine` (`tools/build-engine.py` + `tools/engine-career.js`) | Project owner's code |
| Pixel font, sprites, renderer, battle director, V3 visual layer, procedural audio (`src/legacy/*`) | Project owner's *Football Wars V4* modules (small, marked "career edition" patches for kit/crest choice and stadium crowd levels) | Project owner's code |
| Career, AI, UI, persistence (`src/career`, `src/ai`, `src/ui`, `src/persist`) | Written for this edition | Project owner's code |
| Vite 5, vite-plugin-singlefile | Build tools only (bundling/inlining) — not shipped as libraries | MIT |
| Playwright / Chromium | Test tooling only (not shipped) | Apache-2.0 / BSD |

The V4 file also embedded `mp4-muxer` and `webm-muxer` (MIT, © Vanilagy) for its video studio. **This edition does not include
them** because match-video export was not carried over (see TEST_REPORT.md, known limitations).

## Data

* **Club balance profiles** (`src/data/profiles.js`): 194 *anonymised* entries extracted from the V4 database by
  `tools/extract-profiles.cjs`. Only game-design values are kept (power index, archetype, inferred attribute shape,
  specials, aggression). Club names, ids, aliases, countries, colours and source ratings were removed.
  The power indices were derived in V4 from club ratings published by **beyondELO (https://beyondelo.com)**,
  licensed **CC BY 4.0** (https://creativecommons.org/licenses/by/4.0/). Attribution: *"Club strength reference
  derived from beyondELO club Elo ratings, CC BY 4.0."* The attributes/archetypes are game-design interpretations,
  not real-world measurements.
* The V4 database also contained national teams and national-flag images (Wikimedia Commons). **None of that is used**:
  there are no national teams anywhere in this edition.

## Names, crests, kits, players

* All 199 AI clubs, their cities and stadiums, and every star player have **original, procedurally generated names**
  (`src/data/names.js`: invented syllable combinations). They are not derived from real clubs or people by
  changing a few letters, and the balance profile a club receives has no link to any real name.
* Crests are generated pixel shields from 6 original templates; kits are generated from chosen colours and 6 patterns.
  No real logos, kits or player portraits are used.
* The player's club identity is user input and stays local to the browser.

## Audio and graphics

All sound effects and music are synthesised at runtime by the original procedural audio module; all graphics
(pixel font, sprites, pitch, crowd, crests) are drawn procedurally at runtime. No external audio/image assets.

## Replacing content with licensed material

Club identities live in data (`src/data/names.js`, generated at career start into the save). A licensed pack can
replace names/colours/crests at the data layer without touching game rules.
