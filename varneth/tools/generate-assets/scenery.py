"""Parallax backgrounds (tileable horizontally), item/material/skill icons, effects and UI art."""
import math
import random
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from pix import new, Pen, hexc, shade, mix, outline, dither_gradient, sheet

BW, BH = 640, 360


def wrap_draw(fn):
    """Draw element at x, x-640 and x+640 so the layer tiles seamlessly."""
    for off in (-BW, 0, BW):
        fn(off)


def silhouette_hills(img, base_y, amp, col, seed, freq=3, rough=6):
    rnd = random.Random(seed)
    pen = Pen(img)
    phases = [rnd.random() * math.tau for _ in range(4)]
    pts = [(0, BH)]
    for x in range(0, BW + 1, 2):
        t = x / BW * math.tau
        y = base_y - amp * (0.6 * math.sin(t * freq / 3 + phases[0]) + 0.3 * math.sin(t * freq + phases[1]) + 0.1 * math.sin(t * freq * 3 + phases[2]))
        y += rnd.uniform(-rough, rough) * 0.15
        pts.append((x, y))
    pts.append((BW, BH))
    pen.poly(pts, col)


THEMES = {
    'meadow': dict(sky=('#2a2440', '#8a5a6a'), far='#3a3450', mid='#2e3a3a', near='#1e2a22', ground='#3a4a2a', ground2='#2a3420', fog=(170, 140, 200), accent='#b060ff'),
    'forest': dict(sky=('#0e1a1a', '#2a4a3a'), far='#13261e', mid='#0f1e18', near='#0a140f', ground='#24341e', ground2='#182414', fog=(110, 170, 130), accent='#9aff6a'),
    'forge': dict(sky=('#140c10', '#4a1e14'), far='#2a1a18', mid='#221614', near='#160e0e', ground='#3a2a24', ground2='#2a1e1a', fog=(220, 110, 60), accent='#ff7a2a'),
    'dungeon': dict(sky=('#0a0a10', '#2a1430'), far='#1a1220', mid='#140e18', near='#0c0a10', ground='#2a2230', ground2='#1e1824', fog=(160, 220, 90), accent='#aaff40'),
    'hub': dict(sky=('#1a1630', '#d08a5a'), far='#2a2440', mid='#22203a', near='#16142a', ground='#4a3e34', ground2='#3a3028', fog=(255, 190, 140), accent='#ffc060'),
}


def bg_layers(key, theme, variant, seed):
    th = THEMES[theme]
    rnd = random.Random(seed)
    sky = dither_gradient(BW, BH, hexc(th['sky'][0]), hexc(th['sky'][1]), steps=10)
    deco = new(BW, BH)
    sp = Pen(deco)
    # stars / embers / spores in the sky
    for _ in range(80):
        x, y = rnd.randrange(BW), rnd.randrange(int(BH * 0.55))
        sp.px(x, y, (255, 255, 255, rnd.randrange(60, 200)) if theme != 'forge' else (255, 150, 80, rnd.randrange(40, 160)))
    if theme in ('meadow', 'hub'):
        # broken moon with violet crack (Kadim Ocak leak)
        cx, cy = 470 + variant * 60, 80
        sp.circle(cx, cy, 30, hexc('#e8d8c8'))
        sp.circle(cx + 8, cy - 4, 26, mix(hexc(th['sky'][0]), hexc('#e8d8c8'), 0.15))
        sp.line((cx - 20, cy - 10), (cx + 5, cy + 22), hexc(th['accent']), 2)
    if theme == 'forge':
        for i in range(5):
            x = rnd.randrange(BW)
            sp.line((x, 0), (x + rnd.randrange(-20, 20), 140), (255, 120, 40, 40), 6)
    sky.alpha_composite(deco)
    # far layer
    far = new(BW, BH)
    silhouette_hills(far, 200 if theme != 'forest' else 170, 40, hexc(th['far']), seed + 1)
    fp = Pen(far)
    if theme == 'meadow':
        def ruin(off):
            for x in (80, 300, 520):
                xx = x + off + variant * 37
                fp.rect(xx, 140, xx + 16, 200, hexc(th['far']))
                fp.rect(xx - 4, 136, xx + 20, 142, hexc(th['far']))
                fp.rect(xx + 4, 150, xx + 8, 158, hexc(th['accent'])[:3] + (90,))
        wrap_draw(ruin)
    elif theme == 'forest':
        def trunks(off):
            for i in range(14):
                x = (i * 47 + variant * 13) % BW + off
                fp.rect(x, 40, x + 10 + (i % 3) * 4, 220, hexc(th['far']))
        wrap_draw(trunks)
    elif theme in ('forge', 'dungeon'):
        def pillars(off):
            for i in range(6):
                x = (i * 110 + 30 + variant * 20) % BW + off
                fp.rect(x, 0, x + 26, 230, hexc(th['far']))
                fp.rect(x - 6, 60, x + 32, 70, shade(hexc(th['far']), 1.3))
        wrap_draw(pillars)
    elif theme == 'hub':
        def town(off):
            for i in range(10):
                x = i * 64 + off + 6
                hgt = 50 + (i * 37) % 60
                fp.rect(x, 210 - hgt, x + 46, 230, hexc(th['far']))
                fp.poly([(x - 4, 210 - hgt), (x + 23, 186 - hgt), (x + 50, 210 - hgt)], shade(hexc(th['far']), 0.8))
                for wy in range(215 - hgt, 220, 14):
                    fp.rect(x + 10, wy, x + 15, wy + 6, hexc('#ffc060')[:3] + (200,))
                    fp.rect(x + 30, wy, x + 35, wy + 6, hexc('#ffc060')[:3] + (140,))
        wrap_draw(town)
    # mid layer
    mid = new(BW, BH)
    silhouette_hills(mid, 250, 25, hexc(th['mid']), seed + 2, freq=6)
    mp = Pen(mid)
    if theme == 'meadow' and variant == 1:
        def mill(off):
            x = 360 + off
            mp.poly([(x, 250), (x + 40, 250), (x + 32, 150), (x + 8, 150)], shade(hexc(th['mid']), 1.4))
            mp.poly([(x + 6, 152), (x + 34, 152), (x + 20, 130)], shade(hexc(th['mid']), 1.1))
            for a in (0.3, 1.9, 3.5, 5.1):
                mp.line((x + 20, 160), (x + 20 + math.cos(a) * 55, 160 + math.sin(a) * 55), shade(hexc(th['mid']), 1.8), 3)
                mp.line((x + 20 + math.cos(a) * 20, 160 + math.sin(a) * 20), (x + 20 + math.cos(a + 0.2) * 55, 160 + math.sin(a + 0.2) * 55), shade(hexc(th['mid']), 1.5), 2)
        wrap_draw(mill)
    if theme == 'meadow':
        def grass(off):
            for i in range(80):
                x = (i * 8 + (i * 13) % 7) + off
                mp.line((x, 252), (x + 2, 240 - (i * 7) % 10), shade(hexc(th['mid']), 1.3), 1)
        wrap_draw(grass)
    if theme == 'forest':
        def roots(off):
            for i in range(7):
                x = (i * 95 + variant * 40) % BW + off
                mp.rect(x, 60, x + 22, 260, hexc(th['mid']))
                mp.poly([(x - 20, 262), (x, 220), (x + 22, 220), (x + 44, 262)], hexc(th['mid']))
                for k in range(3):
                    mp.circle(x + 11 + (k - 1) * 30, 60 + k * 9, 30, shade(hexc(th['mid']), 1.25))
                # glowing mushrooms
                mp.circle(x + 30, 255, 3, hexc(th['accent']))
                mp.circle(x - 8, 258, 2, hexc('#6af0ff'))
        wrap_draw(roots)
    if theme == 'forge':
        def gears(off):
            for i in range(3):
                x = (i * 230 + 90 + variant * 50) % BW + off
                y = 170 + (i % 2) * 30
                r = 34 + (i % 2) * 10
                for k in range(10):
                    a = k / 10 * math.tau
                    mp.rect(x + math.cos(a) * r - 4, y + math.sin(a) * r - 4, x + math.cos(a) * r + 4, y + math.sin(a) * r + 4, shade(hexc(th['mid']), 1.6))
                mp.circle(x, y, r, shade(hexc(th['mid']), 1.5))
                mp.circle(x, y, r * 0.4, hexc(th['mid']))
            if variant == 1:
                for i in range(2):
                    x = 150 + i * 320 + off
                    mp.rect(x, 180, x + 70, 255, shade(hexc(th['mid']), 1.3))
                    mp.rect(x + 18, 205, x + 52, 240, hexc('#ff7a2a'))
                    mp.rect(x + 22, 210, x + 48, 236, hexc('#ffd060'))
        wrap_draw(gears)
    if theme == 'dungeon':
        def tendrils(off):
            for i in range(10):
                x = (i * 64 + 10) + off
                pts = [(x + math.sin(k * 0.6 + i) * 8, k * 26) for k in range(10)]
                for a, b in zip(pts, pts[1:]):
                    mp.line(a, b, shade(hexc(th['mid']), 1.6), 5)
                mp.circle(pts[4][0], pts[4][1], 3, hexc(th['accent']))
        wrap_draw(tendrils)
    if theme == 'hub':
        def stalls(off):
            for i in range(4):
                x = i * 160 + 40 + off
                mp.rect(x, 230, x + 70, 262, shade(hexc(th['mid']), 1.5))
                cols = ['#9a3a3a', '#3a6a9a', '#9a8a3a', '#5a3a8a']
                for k in range(7):
                    mp.rect(x - 6 + k * 12, 214, x + 4 + k * 12, 232, hexc(cols[i]) if k % 2 == 0 else hexc('#d8d0c0'))
            mp.rect(300 + off, 120, 312 + off, 262, shade(hexc(th['mid']), 1.3))
            mp.circle(306 + off, 116, 9, hexc('#ffb040'))
            mp.circle(306 + off, 116, 16, (255, 180, 60, 60))
        wrap_draw(stalls)
    # ground / near layer
    near = new(BW, BH)
    np_ = Pen(near)
    gy = 268
    np_.rect(0, gy, BW, BH, hexc(th['ground2']))
    np_.rect(0, gy, BW, gy + 6, hexc(th['ground']))
    rnd2 = random.Random(seed + 9)
    for _ in range(260):
        x, y = rnd2.randrange(BW), rnd2.randrange(gy + 4, BH)
        np_.px(x, y, shade(hexc(th['ground2']), rnd2.choice([0.75, 1.2, 1.35])))
    def stones(off):
        for i in range(12):
            x = (i * 53 + variant * 17) % BW + off
            np_.ellipse(x, gy + 3, 6 + (i % 3) * 3, 2 + (i % 2), shade(hexc(th['ground']), 1.25))
        if theme == 'meadow':
            for i in range(40):
                x = i * 16 + off
                np_.line((x, gy), (x - 2, gy - 5 - (i * 5) % 6), shade(hexc(th['ground']), 1.3), 1)
            for i in range(3):
                x = (i * 211 + 50) % BW + off
                np_.line((x, gy + 10), (x + 40, gy + 30), hexc(th['accent']), 1)  # magical cracks
                np_.line((x + 40, gy + 30), (x + 70, gy + 22), hexc(th['accent']), 1)
        if theme == 'forge':
            for i in range(2):
                x = (i * 320 + 120) % BW + off
                np_.rect(x, gy + 40, x + 90, gy + 52, hexc('#ff5a1a'))
                np_.rect(x + 6, gy + 43, x + 84, gy + 49, hexc('#ffc040'))
            for i in range(10):
                x = i * 64 + off
                np_.rect(x, gy - 2, x + 3, gy + 6, hexc('#5a4a40'))
        if theme == 'forest' or theme == 'dungeon':
            for i in range(6):
                x = (i * 109 + 20) % BW + off
                np_.line((x, gy + 2), (x + 30, gy + 20), shade(hexc(th['ground']), 0.7), 3)
                np_.line((x + 30, gy + 20), (x + 55, gy + 16), shade(hexc(th['ground']), 0.7), 2)
    wrap_draw(stones)
    # fog strip (separate layer, scrolled faster)
    fog = new(BW, BH)
    a = np.array(fog)
    fc = th['fog']
    for y in range(180, 300):
        for x in range(BW):
            v = 0.5 + 0.5 * math.sin(x / BW * math.tau * 3 + y * 0.05) * math.sin(x / BW * math.tau * 2)
            alpha = max(0, int((1 - abs(y - 245) / 60) * 50 * v))
            a[y, x] = (fc[0], fc[1], fc[2], alpha)
    fog = Image.fromarray(a)
    return {'sky': sky, 'far': far, 'mid': mid, 'near': near, 'fog': fog}


BACKGROUNDS = {
    'meadow_road': ('meadow', 0), 'meadow_mill': ('meadow', 1),
    'forest_path': ('forest', 0), 'forest_grove': ('forest', 1),
    'forge_mine': ('forge', 0), 'forge_core': ('forge', 1),
    'dungeon_roots': ('dungeon', 0), 'hub': ('hub', 0),
}


# ----------------------------------------------------------------- icons
ICON_PAL = {1: ('#9aa2aa', '#6a5038'), 2: ('#c8d0d8', '#3e3048'), 3: ('#e8c070', '#5a2a2a'), 'blood': ('#d04040', '#3a1010'),
            'green': ('#8ad070', '#2a4a1a'), 'arcane': ('#7ff0ff', '#1e3a4a'), 'storm': ('#bfe8ff', '#2a3a5a'), 'wood': ('#a07a40', '#3e5a2a'),
            'ember': ('#ff8a3a', '#4a1e10'), 'seal': ('#e0d8a0', '#5a3a6a'), 'stone': ('#b8b0a0', '#5a564e')}


def icon_item(base):
    img = new(32, 32)
    p = Pen(img)
    fam = base['family']
    hi, lo = ICON_PAL.get(base.get('palette'), ICON_PAL[1])
    hi, lo = hexc(hi), hexc(lo)
    slot = base.get('slot')
    if fam in ('sword', 'greatsword', 'dagger'):
        L = {'sword': 20, 'greatsword': 24, 'dagger': 13}[fam]
        p.line((7, 25), (7 + L * 0.7, 25 - L * 0.7), shade(hi, 0.6), 4 if fam == 'greatsword' else 3)
        p.line((7, 25), (7 + L * 0.7, 25 - L * 0.7), hi, 2)
        p.line((4, 21), (11, 28), hexc('#c8a050'), 2)
        p.line((3, 29), (6, 26), lo, 3)
    elif fam == 'axe':
        p.line((6, 28), (22, 8), hexc('#7a5230'), 3)
        p.shaded_poly([(18, 6), (28, 10), (26, 20), (20, 14)], hi)
    elif fam == 'shield':
        p.shaded_poly([(6, 5), (26, 5), (26, 16), (16, 28), (6, 16)], lo if base.get('palette') == 1 else hi)
        p.line((16, 6), (16, 26), hexc('#c8a050'), 2)
        p.circle(16, 13, 3, hi)
    elif fam == 'bow':
        pts = [(10 + math.sin(t / 10 * math.pi) * 10, 4 + t * 2.4) for t in range(11)]
        for a, b in zip(pts, pts[1:]):
            p.line(a, b, lo if base.get('palette') == 1 else hi, 3)
        p.line(pts[0], pts[-1], hexc('#e8e8e0'), 1)
    elif fam == 'crossbow':
        p.line((6, 24), (24, 10), hexc('#7a5230'), 4)
        p.line((14, 6), (28, 20), hi, 2)
    elif fam in ('staff', 'wand'):
        L = 26 if fam == 'staff' else 16
        p.line((6, 28), (6 + L * 0.65, 28 - L * 0.75), hexc('#6a4a2a'), 3)
        p.circle(6 + L * 0.65 + 2, 28 - L * 0.75 - 2, 4 if fam == 'staff' else 2.5, hi)
        p.px(6 + L * 0.65 + 1, 28 - L * 0.75 - 3, (255, 255, 255, 255))
    elif fam == 'tome':
        p.shaded_poly([(7, 6), (25, 6), (25, 26), (7, 26)], lo)
        p.line((11, 6), (11, 26), hi, 1)
        p.circle(18, 16, 3, hi)
    elif fam == 'orb':
        p.circle(16, 15, 10, hi[:3] + (70,))
        p.shaded_ellipse(16, 15, 7, 7, hi)
        p.rect(11, 24, 21, 28, lo)
    elif fam in ('plate', 'leather', 'cloth'):
        main = {'plate': '#8a929c', 'leather': '#7a5232', 'cloth': '#3a4f8a'}[fam]
        if base.get('palette') not in (1, 2, 3):
            main = ICON_PAL[base['palette']][0]
        elif base.get('tier') == 2:
            main = {'plate': '#c0c8d4', 'leather': '#3e3a44', 'cloth': '#5a2f7a'}[fam]
        m = hexc(main)
        if slot == 'head':
            if fam == 'cloth':
                p.shaded_poly([(5, 24), (27, 24), (14, 4), (10, 2)], m)
            elif fam == 'leather':
                p.shaded_poly([(7, 26), (6, 12), (16, 4), (26, 10), (24, 26)], m)
                p.rect(12, 14, 22, 22, hexc('#1a1414'))
            else:
                p.shaded_ellipse(16, 15, 10, 10, m)
                p.line((10, 15), (24, 15), hexc('#141014'), 2)
            if base.get('unique') == 'u_roots':
                img2 = new(32, 32); q = Pen(img2)
                for dx in (-8, -3, 2, 7):
                    q.line((16 + dx, 22), (16 + dx, 8 - abs(dx) * 0.4), hexc('#6a4a2a'), 2)
                    q.circle(16 + dx, 8 - abs(dx) * 0.4, 2, hexc('#7fd04f'))
                q.line((6, 22), (26, 22), hexc('#6a4a2a'), 3)
                return outline(img2)
        elif slot == 'chest':
            p.shaded_poly([(6, 6), (12, 4), (20, 4), (26, 6), (25, 27), (7, 27)], m)
            p.line((16, 6), (16, 26), shade(m, 0.7), 1)
            if fam == 'plate':
                p.circle(8, 8, 4, shade(m, 1.15)); p.circle(24, 8, 4, shade(m, 1.15))
        elif slot == 'gloves':
            p.shaded_poly([(9, 8), (21, 8), (24, 20), (20, 27), (10, 27), (8, 18)], m)
            p.line((10, 12), (22, 12), shade(m, 0.6), 1)
        elif slot == 'legs':
            p.shaded_poly([(8, 5), (24, 5), (25, 28), (18, 28), (16, 14), (14, 28), (7, 28)], m)
        elif slot == 'boots':
            p.shaded_poly([(9, 5), (18, 5), (18, 20), (27, 23), (27, 28), (9, 28)], m)
    elif fam == 'belt':
        p.shaded_poly([(3, 12), (29, 12), (29, 20), (3, 20)], lo if base['tier'] == 1 else hexc('#5a3a2a'))
        p.rect(13, 11, 19, 21, hi)
        p.rect(15, 13, 17, 19, shade(hi, 0.5))
    elif fam == 'amulet':
        for i in range(12):
            a = math.pi * (1.05 + i / 11 * 0.9)
            p.px(16 + math.cos(a) * 11, 12 + math.sin(a) * 8, hexc('#c8a050'))
        p.line((5, 12), (16, 20), hexc('#c8a050'), 1)
        p.line((27, 12), (16, 20), hexc('#c8a050'), 1)
        p.shaded_ellipse(16, 22, 5, 6, hi)
    elif fam == 'ring':
        p.ellipse(16, 18, 9, 8, hexc('#c8a050'))
        p.ellipse(16, 18, 6, 5, (0, 0, 0, 0))
        p.shaded_ellipse(16, 9, 4, 4, hi)
    return outline(img)


def icon_material(mid, info):
    img = new(32, 32)
    p = Pen(img)
    c = hexc(info.get('color', '#aaaaaa'))
    if info.get('consumable'):
        p.shaded_poly([(12, 4), (20, 4), (20, 10), (26, 18), (24, 28), (8, 28), (6, 18), (12, 10)], hexc('#d8e0e8'))
        p.poly([(8, 18), (24, 18), (23, 27), (9, 27)], c)
        p.rect(12, 2, 20, 5, hexc('#7a5230'))
    elif info.get('herb'):
        p.line((16, 28), (16, 10), hexc('#3a6a2a'), 2)
        for k in range(4):
            a = -0.8 + k * 0.55
            p.shaded_ellipse(16 + math.cos(a) * 7, 12 + k * 3, 4, 2.5, c)
    elif 'dust' in mid:
        for k in range(14):
            p.circle(10 + (k * 7) % 13, 12 + (k * 5) % 13, 2, shade(c, 0.8 + (k % 3) * 0.15))
    elif mid in ('mystic_essence',):
        p.circle(16, 16, 11, c[:3] + (60,))
        p.shaded_ellipse(16, 16, 7, 9, c)
    elif mid in ('void_crystal', 'starfire_shard', 'ember_core'):
        p.shaded_poly([(16, 3), (25, 13), (20, 28), (12, 28), (7, 13)], c)
        p.line((16, 3), (16, 28), shade(c, 1.3), 1)
    elif mid == 'rust_gear':
        for k in range(8):
            a = k / 8 * math.tau
            p.rect(16 + math.cos(a) * 10 - 2, 16 + math.sin(a) * 10 - 2, 16 + math.cos(a) * 10 + 2, 16 + math.sin(a) * 10 + 2, c)
        p.shaded_ellipse(16, 16, 9, 9, c)
        p.circle(16, 16, 3, (0, 0, 0, 0))
    elif mid == 'meadow_fang':
        p.shaded_poly([(10, 4), (20, 4), (22, 12), (16, 29), (10, 12)], c)
    elif mid == 'venom_sac':
        p.shaded_ellipse(16, 18, 10, 9, c)
        p.circle(13, 15, 2, hexc('#e0ffd0'))
    elif mid == 'heartwood':
        p.shaded_poly([(5, 10), (27, 6), (28, 22), (6, 26)], c)
        p.ellipse(16, 16, 5, 4, shade(c, 1.35))
    else:
        p.shaded_poly([(6, 8), (26, 6), (24, 26), (8, 24)], c)
    return outline(img)


SKILL_COL = {'warrior': '#c04a3a', 'ranger': '#4a9a4a', 'mage': '#4a6ad0'}


def icon_skill(sid, sk):
    img = Image.new('RGBA', (32, 32), hexc('#14101a'))
    p = Pen(img)
    c = hexc(SKILL_COL[sk['cls']])
    p.rect(1, 1, 30, 30, shade(c, 0.35))
    p.rect(2, 2, 29, 29, shade(c, 0.22))
    w = (255, 240, 220, 255)
    fx = sk.get('fx', '')
    if sk.get('passive'):
        p.circle(16, 16, 9, shade(c, 0.9))
        p.circle(16, 16, 5, shade(c, 1.4))
        p.px(16, 16, w)
    elif fx.startswith('slash'):
        for k in range(3):
            p.line((6 + k * 3, 26), (26, 6 + k * 3), w if k == 1 else shade(c, 1.4), 2)
        if fx == 'slash_blood':
            p.circle(10, 10, 3, hexc('#ff2a2a'))
    elif fx == 'whirl':
        for k in range(16):
            a = k / 16 * math.tau
            p.px(16 + math.cos(a) * (6 + k * 0.5), 16 + math.sin(a) * (6 + k * 0.5), w)
    elif fx == 'iron':
        p.shaded_poly([(8, 6), (24, 6), (24, 16), (16, 27), (8, 16)], hexc('#9aa2aa'))
    elif fx == 'slam':
        p.line((4, 24), (28, 24), w, 2)
        for x in (8, 16, 24):
            p.line((x, 22), (x + (x - 16) * 0.3, 10), shade(c, 1.5), 2)
    elif fx in ('arrows', 'rain'):
        for k in range(3):
            y = 8 + k * 7
            p.line((6, y + (6 if fx == 'rain' else 0)), (24, y), w, 1)
            p.px(25, y, hexc('#d0d8e0'))
    elif fx == 'poison':
        p.line((6, 24), (24, 8), w, 1)
        p.circle(24, 8, 3, hexc('#7aff4a'))
        p.circle(10, 22, 2, hexc('#7aff4a'))
    elif fx == 'leap':
        p.line((24, 26), (10, 10), w, 2)
        p.poly([(6, 6), (14, 8), (8, 14)], w)
    elif fx == 'trap':
        for k in range(6):
            a = k / 6 * math.tau
            p.line((16, 16), (16 + math.cos(a) * 10, 16 + math.sin(a) * 10), shade(c, 1.4), 1)
        p.circle(16, 16, 3, hexc('#d0d8e0'))
    elif fx == 'heal':
        p.rect(13, 6, 19, 26, hexc('#ff6a6a'))
        p.rect(6, 13, 26, 19, hexc('#ff6a6a'))
    elif fx == 'fire':
        p.circle(16, 18, 8, hexc('#ff6a1a'))
        p.circle(15, 17, 5, hexc('#ffd040'))
    elif fx == 'lightning':
        p.line((20, 3), (12, 15), hexc('#bfe8ff'), 2)
        p.line((12, 15), (20, 16), hexc('#bfe8ff'), 2)
        p.line((20, 16), (11, 29), hexc('#ffffff'), 2)
    elif fx == 'ice':
        for k in range(6):
            a = k / 6 * math.tau
            p.line((16, 16), (16 + math.cos(a) * 11, 16 + math.sin(a) * 11), hexc('#bfe8ff'), 2)
    elif fx == 'drain':
        p.circle(16, 16, 9, hexc('#5a3aa0'))
        p.circle(16, 16, 4, hexc('#c0a0ff'))
    elif fx == 'shield':
        p.circle(16, 16, 11, hexc('#6ab0ff')[:3] + (120,))
        p.circle(16, 16, 8, (0, 0, 0, 0))
        p.circle(16, 16, 5, hexc('#bfe8ff'))
    elif fx == 'meteor':
        p.circle(20, 12, 6, hexc('#ff6a1a'))
        p.line((4, 28), (16, 16), hexc('#ffb040'), 3)
    return img


# ----------------------------------------------------------------- effects
def fx_sheets():
    out = {}
    # slash arc
    frames = []
    for f in range(6):
        img = new(64, 64); p = Pen(img)
        a0 = -2.2 + f * 0.45
        for k in range(14):
            a = a0 + k * 0.12
            r = 26 - abs(k - 7) * 0.6
            alpha = int(255 * (1 - f / 6) * (k / 14))
            p.line((32 + math.cos(a) * (r - 6), 32 + math.sin(a) * (r - 6)), (32 + math.cos(a) * r, 32 + math.sin(a) * r), (255, 250, 230, alpha), 2)
        frames.append(img)
    out['fx_slash'] = (frames, 64, 64)
    # impact burst
    frames = []
    for f in range(6):
        img = new(48, 48); p = Pen(img)
        r = 4 + f * 4
        for k in range(10):
            a = k / 10 * math.tau + f * 0.2
            p.line((24 + math.cos(a) * r * 0.5, 24 + math.sin(a) * r * 0.5), (24 + math.cos(a) * r, 24 + math.sin(a) * r), (255, 230, 160, int(255 * (1 - f / 6))), 2)
        p.circle(24, 24, max(1, 6 - f), (255, 255, 230, int(255 * (1 - f / 6))))
        frames.append(img)
    out['fx_impact'] = (frames, 48, 48)
    # explosion (fire)
    frames = []
    for f in range(7):
        img = new(64, 64); p = Pen(img)
        r = 6 + f * 4
        p.circle(32, 32, r, (255, 90, 20, int(200 * (1 - f / 7))))
        p.circle(32, 32, r * 0.7, (255, 170, 40, int(230 * (1 - f / 7))))
        p.circle(32, 32, max(1, r * 0.4 - f), (255, 240, 160, int(255 * (1 - f / 7))))
        for k in range(8):
            a = k / 8 * math.tau + f
            p.circle(32 + math.cos(a) * r * 1.1, 32 + math.sin(a) * r * 1.1, 2, (80, 60, 60, int(200 * (1 - f / 7))))
        frames.append(img)
    out['fx_explosion'] = (frames, 64, 64)
    # poison cloud
    frames = []
    for f in range(6):
        img = new(64, 40); p = Pen(img)
        for k in range(7):
            x = 10 + k * 7 + math.sin(f + k) * 2
            p.circle(x, 26 - (k % 3) * 4 - f, 7, (120, 220, 60, 90 - f * 10))
        frames.append(img)
    out['fx_poison'] = (frames, 64, 40)
    # ice wave
    frames = []
    for f in range(6):
        img = new(96, 48); p = Pen(img)
        for k in range(12):
            x = 4 + k * 7
            if x > 20 + f * 16:
                continue
            h = 10 + (k * 7) % 14
            p.poly([(x, 46), (x + 3, 46 - h), (x + 6, 46)], (190, 235, 255, 230 - f * 20))
            p.line((x + 3, 46), (x + 3, 46 - h), (255, 255, 255, 200 - f * 20), 1)
        frames.append(img)
    out['fx_ice'] = (frames, 96, 48)
    # shield bubble
    frames = []
    for f in range(6):
        img = new(48, 64); p = Pen(img)
        p.ellipse(24, 36, 17 + f % 2, 25 + f % 2, (110, 180, 255, 70))
        p.ellipse(24, 36, 15, 23, (0, 0, 0, 0))
        for k in range(6):
            a = k / 6 * math.tau + f * 0.5
            p.px(24 + math.cos(a) * 16, 36 + math.sin(a) * 24, (200, 230, 255, 220))
        frames.append(img)
    out['fx_shield'] = (frames, 48, 64)
    # heal sparkles
    frames = []
    for f in range(6):
        img = new(32, 48); p = Pen(img)
        for k in range(5):
            y = 44 - ((f * 6 + k * 9) % 44)
            p.rect(6 + k * 5, y, 7 + k * 5, y + 2, (120, 255, 140, 220))
            p.rect(5 + k * 5, y + 1, 8 + k * 5, y + 1, (120, 255, 140, 220))
        frames.append(img)
    out['fx_heal'] = (frames, 32, 48)
    # loot beam (white; tinted per rarity)
    frames = []
    for f in range(6):
        img = new(24, 120); p = Pen(img)
        for y in range(120):
            a = int(200 * (y / 120) ** 1.5 * (0.7 + 0.3 * math.sin(f + y * 0.2)))
            p.rect(9, y, 14, y, (255, 255, 255, a))
            p.rect(7, y, 16, y, (255, 255, 255, a // 3))
        frames.append(img)
    out['fx_beam'] = (frames, 24, 120)
    # level up ring
    frames = []
    for f in range(8):
        img = new(64, 64); p = Pen(img)
        r = 8 + f * 3
        for k in range(24):
            a = k / 24 * math.tau
            p.px(32 + math.cos(a) * r, 52 + math.sin(a) * r * 0.3, (255, 220, 120, int(255 * (1 - f / 8))))
        for k in range(6):
            y = 52 - f * 6 - k * 2
            p.px(20 + k * 5, y, (255, 240, 180, int(255 * (1 - f / 8))))
        frames.append(img)
    out['fx_levelup'] = (frames, 64, 64)
    # meteor
    img = new(32, 32); p = Pen(img)
    p.line((2, 2), (18, 18), (255, 160, 60, 120), 6)
    p.circle(20, 20, 8, hexc('#ff5a1a')); p.circle(19, 19, 5, hexc('#ffd060'))
    out['fx_meteor'] = ([outline(img)], 32, 32)
    # projectiles
    def proj(name, w, h, draw):
        img = new(w, h); draw(Pen(img)); out[name] = ([img], w, h)
    proj('pr_arrow', 18, 5, lambda p: (p.line((0, 2), (14, 2), hexc('#c8b090'), 1), p.poly([(14, 0), (18, 2), (14, 4)], hexc('#e0e8f0')), p.line((0, 0), (3, 2), hexc('#e8e8e8'), 1), p.line((0, 4), (3, 2), hexc('#e8e8e8'), 1)))
    proj('pr_arrow_poison', 18, 5, lambda p: (p.line((0, 2), (14, 2), hexc('#8aa060'), 1), p.poly([(14, 0), (18, 2), (14, 4)], hexc('#7aff4a'))))
    proj('pr_bolt', 12, 12, lambda p: (p.circle(6, 6, 5, (160, 120, 255, 110)), p.circle(6, 6, 3, hexc('#c0a8ff')), p.px(6, 6, (255, 255, 255, 255))))
    proj('pr_fireball', 20, 14, lambda p: (p.ellipse(8, 7, 8, 5, (255, 100, 20, 120)), p.circle(12, 7, 5, hexc('#ff6a1a')), p.circle(13, 7, 3, hexc('#ffe070'))))
    proj('pr_ember', 10, 10, lambda p: (p.circle(5, 5, 4, (255, 120, 30, 140)), p.circle(5, 5, 2, hexc('#ffd060'))))
    proj('pr_spit', 10, 8, lambda p: (p.ellipse(5, 4, 4, 3, hexc('#8aff4a')), p.px(4, 3, (255, 255, 255, 255))))
    proj('pr_sap', 10, 8, lambda p: (p.ellipse(5, 4, 4, 3, hexc('#c09a3a')), p.px(4, 3, (255, 255, 200, 255))))
    proj('pr_spore', 12, 12, lambda p: (p.circle(6, 6, 5, (140, 255, 80, 100)), p.circle(6, 6, 3, hexc('#b8ff6a'))))
    proj('dot', 4, 4, lambda p: p.rect(0, 0, 3, 3, (255, 255, 255, 255)))
    proj('spark', 3, 3, lambda p: (p.rect(0, 1, 2, 1, (255, 255, 255, 255)), p.rect(1, 0, 1, 2, (255, 255, 255, 255))))
    proj('leaf', 5, 4, lambda p: p.ellipse(2.5, 2, 2.5, 1.5, (255, 255, 255, 255)))
    proj('shadow', 40, 8, lambda p: p.ellipse(20, 4, 19, 3.5, (0, 0, 0, 90)))
    return out


# ----------------------------------------------------------------- UI
FONT_SERIF = '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'


def logo():
    """Pixel logo: text rendered small without AA, then outlined + gradient."""
    f = ImageFont.truetype(FONT_SERIF, 26)
    img = Image.new('L', (220, 40), 0)
    d = ImageDraw.Draw(img)
    d.fontmode = '1'
    d.text((4, 2), 'VARNETH', font=f, fill=255)
    m = np.array(img) > 0
    a = np.zeros((40, 220, 4), dtype=np.uint8)
    for y in range(40):
        c = mix(hexc('#fff0c0'), hexc('#c0782a'), min(1, max(0, (y - 6) / 24)))
        a[y][m[y]] = c
    out = Image.fromarray(a)
    out = outline(out, (40, 12, 8, 255))
    out = outline(out, (110, 40, 160, 255))
    bb = out.getbbox()
    return out.crop(bb)


def ui_panel():
    img = new(24, 24); p = Pen(img)
    p.rect(0, 0, 23, 23, hexc('#3a2a1a'))
    p.rect(1, 1, 22, 22, hexc('#a8823e'))
    p.rect(2, 2, 21, 21, hexc('#2a1e14'))
    p.rect(3, 3, 20, 20, hexc('#161218'))
    for x, y in ((1, 1), (20, 1), (1, 20), (20, 20)):
        p.rect(x, y, x + 2, y + 2, hexc('#ffd77a'))
    return img
