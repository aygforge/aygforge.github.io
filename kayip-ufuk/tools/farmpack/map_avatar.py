"""Player avatar from the pack's layered character (skin, eyes, clothes, hair, weapons).

Fits the existing runtime avatar system (src/render/SpriteAtlas.js avatarFrame / WorldRenderer.drawPlayer):
- body_a / body_b: pack skin layer (+ male / female eyes, + the clip's tool baked in), skin colours remapped to the
  exact SKIN_RAMP so the runtime can recolour; the four pack skin palettes become the four selectable skin tones
  (sprite_native.__meta.skinTones).
- clothing_mask: pack "Farm" outfit converted to grayscale (runtime tints it with the chosen outfit colour).
- hair/<0..5>/<dir>: six pack hairstyles (idle pose), grayscale for runtime tinting, placed by per-frame head anchors.
Frames are 32x32 pack cells placed bottom-aligned in the 32x48 rects, drawn at native x2.
Pack strips are ordered down, up, right, left. Our frame counts are resampled from the pack's per-direction counts.
Not used: horse, bicycle, bear, broom, umbrella, mage, flute, carrying, accessories (no such mechanics in the GDD)."""
import json
from PIL import Image
from core import load, PACK, PUBLIC, trim

C = 'Character/Character/PNG/'
PACK_DIRS = ['down', 'up', 'right', 'left']
# our clip: (pack folder, weapon strip or None, mirror?)
CLIPS = {
    'idle': ('1. Idle', None), 'walk': ('2. Walk', None), 'run': ('3. Run', None),
    'chop': ('5. Axe and Sickle', 'Weapons/Axe/1.png'), 'mine': ('4. Pickaxe, Hoe and Catching insects', 'Weapons/Pickaxe/1.png'),
    'build': ('6. Shovel', 'Weapons/Shovel/1.png'), 'gather': ('13.3 Carrying - Pick Up', None), 'eat': ('20. Petting', None),
    'fish_cast': ('12. Fishing - Cast', 'Weapons/1.png'), 'fish_idle': ('12.1. Fishing - Wait', 'Weapons/1.png'),
    'fish_reel': ('12.3. Fishing - Reel', 'Weapons/1.png'), 'bow': ('9. Archer', 'Weapons/Bow and Arrow/1.png'),
    'spear': ('8. SwordAttack', 'Weapons/Sword/1.png'), 'swim': ('24.3 Swim - Swim', None), 'hurt': ('10. Damage', None),
    'sleep': ('19. Sleep', None),
}
HAIRS = ['Standard', 'Josh', 'Sebastian', 'Lyria', 'Iridessa', 'Fawn']
SKIN_RAMP = [(0xf1, 0xc8, 0xa4), (0xd9, 0xa8, 0x86), (0xb9, 0x87, 0x6a)]  # tools/assetgen/avatar.mjs (exact, recoloured at runtime)
GRAY = lambda v: (v, v, v)


def frames_of(img, size):
    return [img.crop((i * size, 0, i * size + size, size)) for i in range(img.width // size)]


def by_dir(frames):
    """split a strip into the pack's 4 direction groups; direction-less strips (sleep) return the same list for all"""
    if len(frames) % 4:
        return {d: frames for d in PACK_DIRS}
    n = len(frames) // 4
    return {d: frames[i * n:(i + 1) * n] for i, d in enumerate(PACK_DIRS)}


def recolor(im, mapping):
    out = im.copy(); px = out.load()
    for y in range(im.height):
        for x in range(im.width):
            p = px[x, y]
            if p[3] and p[:3] in mapping:
                px[x, y] = mapping[p[:3]] + (p[3],)
    return out


def gray_ramp(im, keep_dark=60):
    """colour layer -> grayscale mask (lighter shade = lighter gray), keeps near-black outline colours untouched"""
    from collections import Counter
    cols = [c for c, _ in Counter(p[:3] for p in im.getdata() if p[3]).most_common()]
    lum = lambda c: (c[0] * 3 + c[1] * 6 + c[2]) / 10
    shades = sorted([c for c in cols if lum(c) > keep_dark], key=lum)
    levels = [int(120 + 110 * i / max(1, len(shades) - 1)) for i in range(len(shades))]
    return recolor(im, {c: GRAY(v) for c, v in zip(shades, levels)})


def keep_attached(im, min_px=6):
    """drop opaque islands (>= min_px) not connected to the largest one (the body); tiny specks are left as they are"""
    from core import components
    comps = components(im, 1, 1)
    if len(comps) <= 1:
        return im
    a = im.getchannel('A').load()
    def size(bb):
        return sum(1 for y in range(bb[1], bb[3]) for x in range(bb[0], bb[2]) if a[x, y])
    sized = sorted(((size(bb), bb) for bb in comps), reverse=True)
    out = im.copy()
    for n, bb in sized[1:]:
        if n >= min_px:
            out.paste((0, 0, 0, 0), bb)
    return out


def head_point(skin_frame):
    a = skin_frame.getchannel('A').load()
    for y in range(skin_frame.height):
        xs = [x for x in range(skin_frame.width) if a[x, y]]
        if xs:
            return (sum(xs) / len(xs), y)
    return (16, 8)


def run(atlas, log):
    layout = atlas.rects
    counts = {}
    for sid in layout:
        p = sid.split('/')
        if p[0] == 'avatar' and p[1] == 'body_a':
            counts[(p[2], p[3])] = counts.get((p[2], p[3]), 0) + 1
    skins = [load(C + '1. Idle/Skins/%d.png' % i) for i in range(1, 5)]
    from collections import Counter
    def skin_pal(im):
        cols = [c for c, _ in Counter(p[:3] for p in im.getdata() if p[3]).most_common(3)]
        tones = [c for c in cols if sum(c) > 200]
        return sorted(tones, key=lambda c: -sum(c))  # light, shade
    pal1 = skin_pal(skins[0])
    skin_map = {pal1[0]: SKIN_RAMP[0], pal1[1]: SKIN_RAMP[2]}
    tones = []
    for im in skins:
        l, s = skin_pal(im)
        mid = tuple((a + b) // 2 for a, b in zip(l, s))
        tones.append(['#%02x%02x%02x' % l, '#%02x%02x%02x' % mid, '#%02x%02x%02x' % s])

    anchors = {}
    n = 0
    for clip, (folder, weapon) in CLIPS.items():
        base = C + folder + '/'
        skin = by_dir(frames_of(load(base + 'Skins/1.png'), 32))
        eyes = {g: by_dir(frames_of(load(base + f'Eyes/{g}/{c}.png'), 32)) if (PACK / (base + f'Eyes/{g}/{c}.png')).is_file() else None
                for g, c in [('Male', 'Black'), ('Female', 'Brown')]}
        if eyes['Male'] is None and (PACK / (base + 'Eyes')).is_dir():
            only = next((PACK / (base + 'Eyes')).glob('*.png'), None)
            if only:
                e = by_dir(frames_of(Image.open(only).convert('RGBA'), 32)); eyes = {'Male': e, 'Female': e}
        cloth_path = base + 'Clothers/Farm/Blue.png'
        cloth = by_dir(frames_of(load(cloth_path), 32)) if (PACK / cloth_path).is_file() else None
        wpn = None
        if weapon:
            wimg = load(base + weapon)
            size = wimg.height
            wpn = (by_dir(frames_of(wimg, size)), size)
        ref = {d: head_point(skin[d][0]) for d in PACK_DIRS}
        idle_ref = {d: head_point(by_dir(frames_of(load(C + '1. Idle/Skins/1.png'), 32))[d][0]) for d in PACK_DIRS}
        for dir_ in ['down', 'left', 'right', 'up']:
            cnt = counts.get((clip, dir_), 0)
            if not cnt:
                continue
            src = skin[dir_]
            for i in range(cnt):
                k = min(len(src) - 1, round(i * len(src) / cnt))
                for body, g in [('body_a', 'Male'), ('body_b', 'Female')]:
                    rect = Image.new('RGBA', (32, 48))
                    layers = []
                    if wpn and dir_ == 'up':
                        layers.append(('w', None))
                    layers += [('s', None), ('e', None)]
                    if wpn and dir_ != 'up':
                        layers.append(('w', None))
                    for kind, _ in layers:
                        if kind == 's':
                            rect.alpha_composite(recolor(src[k], skin_map), (0, 16))
                        elif kind == 'e' and eyes.get(g):
                            ef = eyes[g][dir_]
                            rect.alpha_composite(ef[min(k, len(ef) - 1)], (0, 16))
                        elif kind == 'w':
                            wf, size = wpn[0][dir_], wpn[1]
                            fr = wf[min(k, len(wf) - 1)]
                            if size == 32:
                                rect.alpha_composite(fr, (0, 16))
                            else:  # 64x64 rod frames, character cell centred: keep the 32x48 window above/around the body
                                rect.alpha_composite(fr.crop((16, 0, 48, 48)), (0, 0))
                                rect = keep_attached(rect)  # cropping can leave floating rod/line fragments
                    atlas.put(f'avatar/{body}/{clip}/{dir_}/{i}', rect, scale=1, native=2, anchor=(0, 0), source=f'{base}Skins/1.png + Eyes/{g} + {weapon or "-"} frame {k}')
                    n += 1
                    hx, hy = head_point(src[k])
                    rx, ry = idle_ref[dir_]
                    # hair rect (32x22) is drawn at (head.x-16, head.y-12); idle reference hair sits at body (0,16)
                    head = [round(16 + hx - rx), round(28 + hy - ry)]
                    bb = rect.getchannel('A').getbbox() or (8, 24, 24, 48)
                    mid = (bb[1] + bb[3]) // 2
                    anchors[f'{body}/{clip}/{dir_}/{i}'] = {'head': head, 'leftHand': [bb[0] + 1, mid], 'rightHand': [bb[2] - 2, mid],
                                                           'backpack': [16, mid], 'effect': [16, mid], 'toolAngle': 0}
                mask = Image.new('RGBA', (32, 48))
                if cloth:
                    cf = cloth[dir_]
                    mask.alpha_composite(gray_ramp(cf[min(k, len(cf) - 1)]), (0, 16))
                if not mask.getbbox():  # clips without an outfit layer (swim, sleep): invisible 1px placeholder keeps the atlas contract
                    hx, hy = head_point(src[k]); mask.putpixel((int(hx), min(47, int(hy) + 24)), (128, 128, 128, 1))
                atlas.put(f'avatar/clothing_mask/{clip}/{dir_}/{i}', mask, scale=1, native=2, anchor=(0, 0), source=cloth_path if cloth else 'placeholder')
                n += 1
    # hair: idle pose per style and direction
    idle_hair = {}
    for s, style in enumerate(HAIRS):
        strip = by_dir(frames_of(load(C + f"1. Idle/Hair's/{style}/Blonde.png"), 32))
        for dir_ in ['down', 'left', 'right', 'up']:
            h = gray_ramp(strip[dir_][0], keep_dark=90).crop((0, 0, 32, 22))
            atlas.put(f'avatar/hair/{s}/{dir_}', h, scale=1, native=2, anchor=(0, 0), source=C + f"1. Idle/Hair's/{style}/Blonde.png")
            n += 1
    meta = atlas.native.setdefault('__meta', {})
    meta['avatar'] = 'pack'
    meta['skinTones'] = tones
    out = {'note': 'Farm RPG Tiny Asset Pack character (EmanuelleDev); anchors measured per frame from the pack skin layer', 'feetCenterPx': [16, 42], 'nativeScale': 2, 'anchors': anchors}
    (PUBLIC / 'assets/avatar_anchors.json').write_text(json.dumps(out), encoding='utf8')
    log['avatarSprites'] = n
