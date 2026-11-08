#!/usr/bin/env python3
"""Import "Farm RPG - Tiny Asset Pack" (EmanuelleDev, emanuelledev.itch.io) art into the generated atlases.

Run after tools/assetgen/generate.mjs (npm run assets does both). The pack itself is NOT in the repository
(its licence forbids redistribution); place it at vendor/farmpack/ or set FARMPACK_DIR.
Outputs: updated public/assets/atlases/*.png, public/assets/sprite_native.json, public/assets/farmpack_manifest.json
"""
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from core import Atlas, PACK, PUBLIC, PackError  # noqa: E402
import map_icons, map_crops  # noqa: E402

MODULES = [map_icons, map_crops]
for name in ['map_nature', 'map_terrain', 'map_builds', 'map_animals', 'map_avatar']:
    try:
        MODULES.append(__import__(name))
    except ModuleNotFoundError:
        pass


def main():
    if not (PACK / 'Documentation.txt').is_file():
        print(f'FARM PACK NOT FOUND at {PACK} — set FARMPACK_DIR or extract the pack to vendor/farmpack', file=sys.stderr)
        return 2
    t0 = time.time()
    atlas = Atlas()
    log = {}
    for m in MODULES:
        m.run(atlas, log)
    atlas.save()
    manifest = {
        'pack': 'Farm RPG - Tiny Asset Pack (All in One)', 'author': 'EmanuelleDev', 'url': 'https://emanuelledev.itch.io',
        'licence': 'Use in commercial/non-commercial projects allowed, modification allowed; resale/redistribution of the assets (even modified) NOT allowed; credit mandatory.',
        'importer': 'tools/farmpack/import_farmpack.py', 'summary': log, 'spritesReplaced': len(atlas.prov),
        'sprites': dict(sorted(atlas.prov.items())),
    }
    (PUBLIC / 'assets/farmpack_manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding='utf8')
    print(f'farmpack import: {len(atlas.prov)} sprites from the pack ({", ".join(f"{k}={v}" for k, v in log.items() if isinstance(v, int))}) in {time.time() - t0:.1f}s')
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except PackError as e:
        print('FARM PACK IMPORT FAILED:', e, file=sys.stderr)
        sys.exit(1)
