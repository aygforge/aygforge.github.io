#!/usr/bin/env python3
"""VARNETH asset generator — reproducibly builds every sprite sheet, background,
icon atlas and effect used by the game into public/assets/ plus a manifest."""
import json, os, subprocess, sys, time
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from pix import sheet, new
import humanoid as HU
import monsters as MO
import scenery as SC

ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(ROOT, 'public', 'assets')


def save(img, rel):
    path = os.path.join(OUT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, optimize=True)
    return rel


def main():
    t0 = time.time()
    data = json.loads(subprocess.check_output(['node', os.path.join(HERE, 'export-data.mjs')], cwd=ROOT))
    man = {'hero': {'frameW': HU.W, 'frameH': HU.H, 'cols': HU.COLS, 'anims': [], 'classes': {}},
           'enemies': {}, 'backgrounds': {}, 'fx': {}, 'icons': {}}
    start = 0
    for name, n in HU.ANIMS:
        man['hero']['anims'].append({'key': name, 'start': start, 'count': n})
        start += n
    # ---- heroes
    for cls in ('warrior', 'ranger', 'mage'):
        poses = HU.all_poses(cls)
        layers = {}
        layers['body'] = save(sheet([HU.draw_body(p) for p in poses], HU.COLS), f'characters/{cls}/body.png')
        layers['cape'] = save(sheet([HU.draw_cape(p) for p in poses], HU.COLS), f'characters/{cls}/cape.png')
        for k in ('scar', 'paint'):
            layers['face_' + k] = save(sheet([HU.draw_face(p, k) for p in poses], HU.COLS), f'characters/{cls}/face_{k}.png')
        for st in HU.HAIR_STYLES:
            layers['hair_' + st] = save(sheet([HU.draw_hair(p, st) for p in poses], HU.COLS), f'characters/{cls}/hair_{st}.png')
        for a in HU.CLASS_ARMORS[cls]:
            layers['armor_' + a] = save(sheet([HU.draw_armor(p, a) for p in poses], HU.COLS), f'characters/{cls}/armor_{a}.png')
        for h in HU.CLASS_HELMETS[cls]:
            layers['helmet_' + h] = save(sheet([HU.draw_helmet(p, h) for p in poses], HU.COLS), f'characters/{cls}/helmet_{h}.png')
        for key, (fam, pal, off) in HU.CLASS_WEAPONS[cls].items():
            layers['weapon_' + key] = save(sheet([HU.draw_weapon(p, fam, pal, off) for p in poses], HU.COLS), f'characters/{cls}/weapon_{key}.png')
        man['hero']['classes'][cls] = layers
        print('hero', cls, len(layers), 'layers', flush=True)
    # ---- enemies
    for name in MO.MONSTERS:
        frames, cw, ch = MO.build_sheet(name)
        folder = 'bosses' if name in ('broken_horn', 'lord_of_roots', 'forge_warden', 'rot_heart') else 'enemies'
        rel = save(sheet(frames, MO.COLS), f'{folder}/{name}.png')
        anims, s = [], 0
        for a, n in MO.ANIMS:
            anims.append({'key': a, 'start': s, 'count': n}); s += n
        man['enemies'][name] = {'file': rel, 'frameW': cw, 'frameH': ch, 'anims': anims}
    print('enemies', len(MO.MONSTERS), flush=True)
    # ---- backgrounds
    for i, (key, (theme, var)) in enumerate(SC.BACKGROUNDS.items()):
        layers = SC.bg_layers(key, theme, var, 1000 + i * 17)
        man['backgrounds'][key] = {k: save(v, f'backgrounds/{key}_{k}.png') for k, v in layers.items()}
    print('backgrounds', len(SC.BACKGROUNDS), flush=True)
    # ---- icons
    items = [SC.icon_item(b) for b in data['bases']]
    man['icons']['items'] = {'file': save(sheet(items, 16), 'items/items.png'), 'size': 32, 'cols': 16, 'index': {b['id']: i for i, b in enumerate(data['bases'])}}
    mids = list(data['materials'].keys())
    mats = [SC.icon_material(m, data['materials'][m]) for m in mids]
    man['icons']['materials'] = {'file': save(sheet(mats, 8), 'items/materials.png'), 'size': 32, 'cols': 8, 'index': {m: i for i, m in enumerate(mids)}}
    sids = list(data['skills'].keys())
    sk = [SC.icon_skill(s, data['skills'][s]) for s in sids]
    man['icons']['skills'] = {'file': save(sheet(sk, 8), 'ui/skills.png'), 'size': 32, 'cols': 8, 'index': {s: i for i, s in enumerate(sids)}}
    # ---- effects
    for key, (frames, w, h) in SC.fx_sheets().items():
        man['fx'][key] = {'file': save(sheet(frames, max(1, len(frames))), f'effects/{key}.png'), 'frameW': w, 'frameH': h, 'count': len(frames)}
    # ---- ui
    man['ui'] = {'logo': save(SC.logo(), 'ui/logo.png'), 'panel': save(SC.ui_panel(), 'ui/panel.png')}
    with open(os.path.join(OUT, 'manifest.json'), 'w') as f:
        json.dump(man, f, indent=1)
    print('done in %.1fs' % (time.time() - t0))


if __name__ == '__main__':
    main()
