"""Procedural monster sprite sheets. Each creature has its own silhouette and rig.
Animations (31 frames): idle 4, move 6, attack 6, hit 3, death 6, special 6."""
import math
from pix import new, Pen, hexc, shade, mix, outline, rot, lerp, lerp2, ease
import humanoid as HU

ANIMS = [('idle', 4), ('move', 6), ('attack', 6), ('hit', 3), ('death', 6), ('special', 6)]
COLS = 8


def frames_for(fn, cw, ch):
    out = []
    for name, n in ANIMS:
        for f in range(n):
            img = new(cw, ch)
            pen = Pen(img)
            fade = 1.0
            fn(pen, name, f, n, cw, ch)
            img = outline(img)
            if name == 'death' and f >= 4:
                a = img.split()[3].point(lambda v: int(v * (0.75 if f == 4 else 0.45)))
                img.putalpha(a)
            out.append(img)
    return out


# ----------------------------------------------------------------- humanoid monsters
HMAP = {'idle': ('idle', 6, [0, 1, 3, 4]), 'move': ('run', 8, [0, 1, 3, 4, 5, 7]), 'attack': ('attack', 8, [1, 2, 3, 4, 5, 6]),
        'hit': ('hit', 4, [0, 1, 2]), 'death': ('death', 8, [1, 2, 3, 5, 6, 7]), 'special': ('cast', 10, [1, 2, 4, 5, 6, 8])}


def hpose(anim, f):
    a, n, idx = HMAP[anim]
    return HU.pose('warrior', a, idx[f], n)


def S(p, key, s, ox, oy):
    pt = HU.T(p, key)
    return ((pt[0] - 23) * s + ox, (pt[1] - 61) * s + oy)


def humanoid_monster(spec):
    s = spec['s']

    def fn(pen, anim, f, n, cw, ch):
        p = hpose(anim, f)
        ox, oy = cw / 2 - 2 * s, ch - 3
        P = lambda k: S(p, k, s, ox, oy)
        skin = hexc(spec['skin']); cloth = hexc(spec['cloth']); dark = hexc(spec.get('dark', '#2a2028'))
        lw = max(2, round(3 * s * spec.get('limb', 1)))
        legw = max(2, round(4 * s * spec.get('leg', 1)))
        hunch = spec.get('hunch', 0) * s
        chest = P('chest'); chest = (chest[0] + hunch, chest[1] + hunch * 0.6)
        hip = P('hip'); head = P('head'); head = (head[0] + hunch * 1.3, head[1] + hunch)
        # back limbs
        pen.limb(P('sB'), P('eB'), lw, shade(skin, 0.8))
        pen.limb(P('eB'), P('hB'), lw, shade(skin, 0.8))
        pen.limb(P('hipB'), P('kB'), legw, shade(cloth, 0.75))
        pen.limb(P('kB'), P('fB'), legw - 1, shade(skin if spec.get('barelegs') else dark, 0.8))
        # torso
        bw = spec.get('bw', 5) * s
        belly = spec.get('belly', 0) * s
        pen.shaded_poly([(chest[0] - bw, chest[1]), (chest[0] + bw, chest[1]), (hip[0] + bw * 0.85 + belly, (chest[1] + hip[1]) / 2), (hip[0] + bw * 0.8, hip[1] + 1), (hip[0] - bw * 0.8, hip[1] + 1)], cloth)
        if spec.get('core'):
            g = 0.6 + 0.4 * math.sin(f * 1.7)
            cc = hexc(spec['core'])
            mid = lerp2(chest, hip, 0.4)
            pen.circle(mid[0] + 1, mid[1], 3.2 * s * g + 1, cc[:3] + (90,))
            pen.circle(mid[0] + 1, mid[1], 1.6 * s, cc)
        if spec.get('rivets'):
            for i in range(3):
                pen.px(chest[0] - bw * 0.5 + i * bw * 0.5, chest[1] + 2 * s, hexc('#d8c890'))
        if spec.get('apron'):
            pen.poly([(hip[0] - bw * 0.6, chest[1] + 4 * s), (hip[0] + bw * 0.9, chest[1] + 4 * s), (hip[0] + bw, hip[1] + 6 * s), (hip[0] - bw * 0.7, hip[1] + 6 * s)], hexc(spec['apron']))
            pen.line((hip[0] - bw * 0.3, chest[1] + 8 * s), (hip[0] + bw * 0.5, chest[1] + 11 * s), hexc('#6a1a1a'), max(1, round(s)))
        if spec.get('moss'):
            for i in range(4):
                pen.circle(chest[0] - bw + i * bw * 0.6, chest[1] + 1, 1.2 * s, hexc('#4a7a2a'))
        # front leg
        pen.limb(P('hipF'), P('kF'), legw, cloth)
        pen.limb(P('kF'), P('fF'), legw - 1, skin if spec.get('barelegs') else dark)
        # head
        hk = spec['head']
        hs = spec.get('hs', 1) * s
        if hk == 'goblin':
            pen.shaded_ellipse(head[0], head[1] + 1 * s, 5 * hs, 4.5 * hs, skin)
            pen.poly([(head[0] - 3 * hs, head[1] - 1 * hs), (head[0] - 11 * hs, head[1] - 5 * hs), (head[0] - 4 * hs, head[1] + 2 * hs)], shade(skin, 0.9))
            pen.poly([(head[0] + 3 * hs, head[1] + 1 * hs), (head[0] + 7 * hs, head[1] + 2.5 * hs), (head[0] + 3 * hs, head[1] + 3 * hs)], shade(skin, 0.85))
            pen.px(head[0] + 2.5 * hs, head[1] - 0.5 * hs, hexc(spec.get('eye', '#ffd040')))
            pen.px(head[0] + 3.5 * hs, head[1] + 3 * hs, hexc('#f0f0d0'))
            if spec.get('hood'):
                pen.poly([(head[0] - 6 * hs, head[1] + 4 * hs), (head[0] - 5 * hs, head[1] - 4 * hs), (head[0] + 1 * hs, head[1] - 6 * hs), (head[0] + 5 * hs, head[1] - 2 * hs), (head[0] + 1 * hs, head[1] - 2.5 * hs), (head[0] - 2 * hs, head[1] + 4 * hs)], hexc(spec['hood']))
        elif hk == 'sack':
            pen.shaded_ellipse(head[0], head[1], 6 * hs, 6.5 * hs, hexc('#a08a62'))
            pen.line((head[0] - 5 * hs, head[1] + 4 * hs), (head[0] + 5 * hs, head[1] + 4 * hs), hexc('#5a3a22'), max(1, round(s)))
            pen.px(head[0] + 2.5 * hs, head[1] - 1 * hs, hexc('#ff3030')); pen.px(head[0] - 0.5 * hs, head[1] - 1 * hs, hexc('#ff3030'))
            pen.line((head[0] + 1 * hs, head[1] + 1.5 * hs), (head[0] + 4 * hs, head[1] + 2 * hs), hexc('#3a2a1a'), 1)
        elif hk == 'box':
            pen.shaded_poly([(head[0] - 4.5 * hs, head[1] - 5 * hs), (head[0] + 5 * hs, head[1] - 5 * hs), (head[0] + 5 * hs, head[1] + 4 * hs), (head[0] - 4.5 * hs, head[1] + 4 * hs)], hexc(spec.get('metal', '#8a5a3a')))
            pen.line((head[0] - 1 * hs, head[1] - 0.5 * hs), (head[0] + 5 * hs, head[1] - 0.5 * hs), hexc(spec.get('eye', '#ffb040')), max(1, round(s * 0.8)))
            pen.line((head[0] - 4.5 * hs, head[1] - 5 * hs), (head[0] + 5 * hs, head[1] - 5 * hs), hexc('#2a1a14'), 1)
        elif hk == 'hood_exec':
            pen.poly([(head[0] - 5 * hs, head[1] + 5 * hs), (head[0] - 5 * hs, head[1] - 3 * hs), (head[0] - 1 * hs, head[1] - 9 * hs), (head[0] + 5 * hs, head[1] - 3 * hs), (head[0] + 5 * hs, head[1] + 5 * hs)], hexc('#1e1a22'))
            pen.px(head[0] + 2 * hs, head[1] - 1 * hs, hexc('#ff4a2a')); pen.px(head[0] + 4 * hs, head[1] - 1 * hs, hexc('#ff4a2a'))
        elif hk == 'bull':
            pen.shaded_ellipse(head[0] + 1 * hs, head[1], 6 * hs, 5.5 * hs, skin)
            pen.shaded_poly([(head[0] + 3 * hs, head[1] - 1 * hs), (head[0] + 10 * hs, head[1] + 1 * hs), (head[0] + 9 * hs, head[1] + 5 * hs), (head[0] + 3 * hs, head[1] + 5 * hs)], shade(skin, 0.9))
            pen.px(head[0] + 8.5 * hs, head[1] + 2 * hs, hexc('#1a1010'))
            pen.circle(head[0] + 9 * hs, head[1] + 4 * hs, 1.2 * hs, hexc('#e0c060'))
            horn = hexc('#e8dcc0')
            pen.line((head[0] - 2 * hs, head[1] - 4 * hs), (head[0] - 8 * hs, head[1] - 10 * hs), horn, max(2, round(2.5 * s)))
            pen.line((head[0] - 8 * hs, head[1] - 10 * hs), (head[0] - 6 * hs, head[1] - 14 * hs), horn, max(1, round(1.6 * s)))
            pen.line((head[0] + 1 * hs, head[1] - 4 * hs), (head[0] + 4 * hs, head[1] - 7 * hs), horn, max(2, round(2.5 * s)))  # broken horn
            pen.px(head[0] + 4 * hs, head[1] - 7.5 * hs, hexc('#8a7a60'))
            pen.circle(head[0] + 4 * hs, head[1] - 1 * hs, 1 * hs, hexc('#ff3a2a'))
        elif hk == 'tree':
            pen.shaded_poly([(head[0] - 5 * hs, head[1] + 5 * hs), (head[0] - 6 * hs, head[1] - 6 * hs), (head[0] + 5 * hs, head[1] - 7 * hs), (head[0] + 6 * hs, head[1] + 5 * hs)], hexc(spec['cloth']))
            for i, (dx, dy) in enumerate([(-6, -14), (-1, -17), (4, -13), (8, -9)]):
                pen.line((head[0] + dx * 0.4 * hs, head[1] - 6 * hs), (head[0] + dx * hs, head[1] + dy * hs * 0.8), shade(hexc(spec['cloth']), 0.8), max(1, round(1.5 * s)))
                if spec.get('leaves'):
                    pen.circle(head[0] + dx * hs, head[1] + dy * hs * 0.8, 2.2 * hs, hexc(spec['leaves']))
            gc = hexc(spec.get('eye', '#a0ff60'))
            pen.circle(head[0] + 2 * hs, head[1] - 1 * hs, 1.2 * hs, gc)
            pen.circle(head[0] - 1.5 * hs, head[1] - 1 * hs, 1.0 * hs, gc)
            pen.line((head[0] - 1 * hs, head[1] + 3 * hs), (head[0] + 3 * hs, head[1] + 3 * hs), hexc('#120a06'), max(1, round(s)))
            if spec.get('crown'):
                for dx in (-4, 0, 4):
                    pen.line((head[0] + dx * hs, head[1] - 7 * hs), (head[0] + dx * hs, head[1] - 11 * hs), hexc('#c0a040'), max(1, round(s)))
        elif hk == 'furnace':
            pen.shaded_poly([(head[0] - 6 * hs, head[1] - 4 * hs), (head[0] + 6 * hs, head[1] - 4 * hs), (head[0] + 5 * hs, head[1] + 5 * hs), (head[0] - 5 * hs, head[1] + 5 * hs)], hexc('#5a5a62'))
            g = 0.5 + 0.5 * math.sin(f * 1.3)
            pen.rect(head[0] - 1 * hs, head[1] - 1 * hs, head[0] + 5 * hs, head[1] + 1 * hs, mix(hexc('#ff6a1a'), hexc('#ffe060'), g))
            pen.line((head[0] - 3 * hs, head[1] - 4 * hs), (head[0] - 3 * hs, head[1] - 9 * hs), hexc('#3a3a40'), max(2, round(2 * s)))
            pen.circle(head[0] - 3 * hs, head[1] - 11 * hs, 1.5 * hs, (120, 120, 120, 120))
        # weapon
        wk = spec.get('weapon')
        hand = P('hF')
        a = p['wAng'] + p.get('rotate', 0)
        dx, dy = math.cos(a), math.sin(a)
        nx, ny = -dy, dx
        mc = hexc(spec.get('wmetal', '#9a9aa2'))
        if wk == 'dagger':
            pen.line(hand, (hand[0] + dx * 6 * s, hand[1] + dy * 6 * s), mc, max(1, round(1.5 * s)))
        elif wk == 'club':
            pen.line(hand, (hand[0] + dx * 9 * s, hand[1] + dy * 9 * s), hexc('#6a4a2a'), max(2, round(2.5 * s)))
            pen.circle(hand[0] + dx * 9 * s, hand[1] + dy * 9 * s, 2 * s, hexc('#7a5a32'))
        elif wk == 'spear':
            pen.line((hand[0] - dx * 6 * s, hand[1] - dy * 6 * s), (hand[0] + dx * 13 * s, hand[1] + dy * 13 * s), hexc('#6a4a2a'), max(1, round(1.4 * s)))
            pen.poly([(hand[0] + dx * 13 * s + nx * 1.5 * s, hand[1] + dy * 13 * s + ny * 1.5 * s), (hand[0] + dx * 17 * s, hand[1] + dy * 17 * s), (hand[0] + dx * 13 * s - nx * 1.5 * s, hand[1] + dy * 13 * s - ny * 1.5 * s)], mc)
        elif wk in ('cleaver', 'greataxe', 'hammer', 'halberd'):
            L = {'cleaver': 8, 'greataxe': 16, 'hammer': 14, 'halberd': 18}[wk]
            top = (hand[0] + dx * L * s, hand[1] + dy * L * s)
            pen.line((hand[0] - dx * 3 * s, hand[1] - dy * 3 * s), top, hexc('#4a3a2a'), max(2, round(1.8 * s)))
            if wk == 'cleaver':
                pen.shaded_poly([(hand[0] + dx * 2 * s, hand[1] + dy * 2 * s), top, (top[0] + nx * 6 * s, top[1] + ny * 6 * s), (hand[0] + dx * 2 * s + nx * 6 * s, hand[1] + dy * 2 * s + ny * 6 * s)], mc)
                pen.px(top[0] + nx * 3 * s, top[1] + ny * 3 * s, hexc('#7a1a1a'))
            elif wk == 'greataxe':
                pen.shaded_poly([(top[0] - dx * 7 * s, top[1] - dy * 7 * s), top, (top[0] - dx * 2 * s + nx * 8 * s, top[1] - dy * 2 * s + ny * 8 * s), (top[0] - dx * 9 * s + nx * 7 * s, top[1] - dy * 9 * s + ny * 7 * s)], mc)
            elif wk == 'hammer':
                pen.shaded_poly([(top[0] + nx * 5 * s - dx * 2 * s, top[1] + ny * 5 * s - dy * 2 * s), (top[0] + nx * 5 * s + dx * 4 * s, top[1] + ny * 5 * s + dy * 4 * s), (top[0] - nx * 5 * s + dx * 4 * s, top[1] - ny * 5 * s + dy * 4 * s), (top[0] - nx * 5 * s - dx * 2 * s, top[1] - ny * 5 * s - dy * 2 * s)], mc)
            else:
                pen.shaded_poly([(top[0] - dx * 5 * s, top[1] - dy * 5 * s), top, (top[0] - dx * 3 * s + nx * 5 * s, top[1] - dy * 3 * s + ny * 5 * s)], mc)
        elif wk == 'bucket':
            pen.shaded_poly([(hand[0] - 3 * s, hand[1]), (hand[0] + 3 * s, hand[1]), (hand[0] + 2.5 * s, hand[1] + 5 * s), (hand[0] - 2.5 * s, hand[1] + 5 * s)], hexc('#5a4a40'))
            pen.circle(hand[0], hand[1], 2 * s, hexc('#ff8a2a'))
        # front arm
        pen.limb(P('sF'), P('eF'), lw, skin)
        pen.limb(P('eF'), P('hF'), lw, skin)
        if spec.get('fists'):
            pen.shaded_ellipse(*P('hF'), 2.6 * s, 2.6 * s, skin)
        if spec.get('pauldron'):
            pen.shaded_ellipse(P('sF')[0], P('sF')[1], 3.5 * s, 3 * s, hexc(spec['pauldron']))
    return fn


# ----------------------------------------------------------------- quadrupeds
def quadruped(spec):
    def fn(pen, anim, f, n, cw, ch):
        s = spec['s']
        body = hexc(spec['body']); belly = hexc(spec.get('belly', spec['body']))
        gy = ch - 3
        t = f / n
        ph = t * math.tau
        L = spec['len'] * s
        bh = spec['bh'] * s
        leg = spec['leg'] * s
        cx = cw / 2 - 2
        lift = 0; tilt = 0; lean = 0; jaw = 0; rot_a = 0
        if anim == 'idle':
            lift = math.sin(ph) * 0.6
        elif anim == 'move':
            lift = abs(math.sin(ph)) * 2 * s
        elif anim == 'attack':
            k = [0, -0.4, -0.6, 1, 0.8, 0.2][f]
            lean = k * 6 * s; tilt = k * 0.2; jaw = max(0, k)
        elif anim == 'hit':
            lean = -[3, 2, 1][f] * s
        elif anim == 'special':
            k = [0, 0.5, 1, 1, 0.6, 0.2][f]
            tilt = -k * 0.35; lean = -k * 2 * s; jaw = k
        elif anim == 'death':
            rot_a = ease(min(1, f / 4)) * 1.2
        by = gy - leg - bh * 0.5 - lift
        bx = cx + lean

        def R(pt):
            if rot_a:
                q = rot(pt, rot_a, (bx, gy))
                return (q[0], min(gy - 1, q[1] + rot_a * 2))
            return rot(pt, tilt, (bx, by)) if tilt else pt
        # legs
        hips = [(bx - L * 0.38, by + bh * 0.25), (bx + L * 0.32, by + bh * 0.25)]
        for i, hp in enumerate(hips):
            for side in (0, 1):
                phase = ph + (math.pi if side else 0) + i * 1.3
                swing = math.sin(phase) * (5 * s if anim == 'move' else 0.6)
                up = max(0, math.cos(phase)) * (3 * s if anim == 'move' else 0)
                knee = (hp[0] + swing * 0.5 + (2 * s if i else -1 * s), hp[1] + leg * 0.5)
                foot = (hp[0] + swing, gy - up)
                col = shade(body, 0.7 if side == 0 else 0.95)
                pen.limb(R(hp), R(knee), max(2, round(spec.get('legw', 3) * s)), col)
                pen.limb(R(knee), R(foot), max(2, round(spec.get('legw', 3) * s * 0.8)), col)
        # tail
        if spec.get('tail'):
            tl = spec['tail'] * s
            sw = math.sin(ph * 2) * 3 * s
            pen.limb(R((bx - L * 0.5, by - bh * 0.1)), R((bx - L * 0.5 - tl, by - bh * 0.1 + sw - (2 * s if spec.get('tailup') else -tl * 0.4))), max(2, round(2 * s)), shade(body, 0.85))
        # body
        pts = [R((bx - L * 0.55, by - bh * 0.1)), R((bx - L * 0.35, by - bh * 0.55)), R((bx + L * 0.35, by - bh * 0.6)), R((bx + L * 0.55, by - bh * 0.1)),
               R((bx + L * 0.4, by + bh * 0.45)), R((bx - L * 0.4, by + bh * 0.45))]
        pen.shaded_poly(pts, body)
        pen.poly([R((bx - L * 0.3, by + bh * 0.3)), R((bx + L * 0.3, by + bh * 0.3)), R((bx + L * 0.25, by + bh * 0.45)), R((bx - L * 0.25, by + bh * 0.45))], belly)
        if spec.get('spikes'):
            for i in range(5):
                x0 = bx - L * 0.35 + i * L * 0.17
                pen.poly([R((x0, by - bh * 0.5)), R((x0 + 2 * s, by - bh * 0.5 - 4 * s)), R((x0 + 4 * s, by - bh * 0.5))], hexc(spec['spikes']))
        if spec.get('cracks'):
            cc = hexc(spec['cracks'])
            pen.line(R((bx - L * 0.2, by - bh * 0.3)), R((bx - L * 0.05, by)), cc, 1)
            pen.line(R((bx + L * 0.1, by - bh * 0.4)), R((bx + L * 0.2, by - bh * 0.05)), cc, 1)
        if spec.get('aura'):
            ac = hexc(spec['aura'])
            for i in range(6):
                a = ph + i
                pen.px(*R((bx + math.cos(a) * L * 0.6, by - bh * 0.6 + math.sin(a * 1.3) * bh * 0.4)), ac)
        # head
        hx, hy = bx + L * 0.55, by - bh * 0.35
        hs = spec['head'] * s
        pen.shaded_poly([R((hx - hs * 0.4, hy - hs * 0.6)), R((hx + hs * 0.5, hy - hs * 0.5)), R((hx + hs * 1.3, hy + hs * 0.0)), R((hx + hs * 1.3, hy + hs * 0.3 - jaw * hs * 0.1)), R((hx, hy + hs * 0.6))], body)
        if jaw:
            pen.poly([R((hx + hs * 0.2, hy + hs * 0.4)), R((hx + hs * 1.2, hy + hs * 0.4 + jaw * hs * 0.5)), R((hx + hs * 0.2, hy + hs * 0.7))], shade(body, 0.7))
            pen.px(*R((hx + hs * 1.0, hy + hs * 0.4)), hexc('#f0f0e0'))
        ec = hexc(spec.get('eye', '#c060ff'))
        pen.px(*R((hx + hs * 0.55, hy - hs * 0.15)), ec)
        pen.px(*R((hx + hs * 0.65, hy - hs * 0.15)), ec)
        if spec.get('ears'):
            pen.poly([R((hx - hs * 0.1, hy - hs * 0.5)), R((hx + hs * 0.05, hy - hs * 1.2)), R((hx + hs * 0.35, hy - hs * 0.5))], shade(body, 0.85))
        if spec.get('horns'):
            hc = hexc(spec['horns'])
            pen.line(R((hx + hs * 0.1, hy - hs * 0.5)), R((hx - hs * 0.5, hy - hs * 1.6)), hc, max(2, round(2 * s)))
            pen.line(R((hx - hs * 0.5, hy - hs * 1.6)), R((hx + hs * 0.2, hy - hs * 2.1)), hc, max(1, round(1.5 * s)))
            pen.line(R((hx + hs * 0.4, hy - hs * 0.5)), R((hx + hs * 0.6, hy - hs * 1.5)), hc, max(2, round(2 * s)))
        if spec.get('tusks'):
            pen.line(R((hx + hs * 1.1, hy + hs * 0.35)), R((hx + hs * 1.5, hy - hs * 0.2)), hexc('#f0e8d0'), max(1, round(1.4 * s)))
    return fn


# ----------------------------------------------------------------- arthropods
def arthropod(spec):
    def fn(pen, anim, f, n, cw, ch):
        s = spec['s']
        gy = ch - 3
        ph = f / n * math.tau
        body = hexc(spec['body'])
        cx = cw / 2
        lift = 0; lean = 0; rear = 0; sink = 0
        if anim == 'idle': lift = math.sin(ph) * 0.5
        elif anim == 'move': lift = abs(math.sin(ph * 2)) * 1.2
        elif anim == 'attack': lean = [0, -2, -3, 5, 4, 1][f] * s; rear = [0, 0.2, 0.4, 0, 0, 0][f]
        elif anim == 'hit': lean = -[3, 2, 1][f] * s
        elif anim == 'special': sink = [0, 2, 4, 4, 2, 0][f] * s
        elif anim == 'death': sink = f * 1.5 * s
        by = gy - spec['legh'] * s - spec['bh'] * s * 0.4 - lift + sink
        bx = cx + lean
        legs = spec['legs']
        for i in range(legs):
            side = i % 2
            k = i // 2
            base = (bx - spec['len'] * s * 0.25 + k * spec['len'] * s * 0.5 / max(1, legs // 2 - 1), by + spec['bh'] * s * 0.2)
            phase = ph * (2 if anim == 'move' else 0.3) + i * 1.7
            sw = math.sin(phase) * (4 * s if anim == 'move' else 1)
            if anim == 'death':
                knee = (base[0] + (k - legs / 4) * 4 * s, base[1] - 2 * s)
                foot = (knee[0] + (k - legs / 4) * 3 * s, base[1] + 1 * s)
            else:
                knee = (base[0] + (k - legs / 4 + 0.5) * 5 * s + sw * 0.4, base[1] - spec['legh'] * s * 0.6)
                foot = (base[0] + (k - legs / 4 + 0.5) * 8 * s + sw, gy - max(0, math.cos(phase)) * (2 * s if anim == 'move' else 0))
            col = shade(body, 0.6 if side == 0 else 0.9)
            pen.line(base, knee, col, max(1, round(spec.get('legw', 1.5) * s)))
            pen.line(knee, foot, col, max(1, round(spec.get('legw', 1.5) * s * 0.8)))
        if spec['kind'] == 'spider':
            ab = hexc(spec['abdomen'])
            pen.shaded_ellipse(bx - spec['len'] * s * 0.35, by - spec['bh'] * s * 0.3, spec['len'] * s * 0.35, spec['bh'] * s * 0.65, ab)
            mk = hexc(spec['mark'])
            pen.line((bx - spec['len'] * s * 0.45, by - spec['bh'] * s * 0.5), (bx - spec['len'] * s * 0.25, by - spec['bh'] * s * 0.2), mk, max(1, round(s)))
            pen.line((bx - spec['len'] * s * 0.25, by - spec['bh'] * s * 0.5), (bx - spec['len'] * s * 0.45, by - spec['bh'] * s * 0.2), mk, max(1, round(s)))
            pen.shaded_ellipse(bx + spec['len'] * s * 0.1, by, spec['len'] * s * 0.2, spec['bh'] * s * 0.4, body)
            hx = bx + spec['len'] * s * 0.3
            for i in range(3):
                pen.px(hx + i * 1.2 * s, by - 1.5 * s - (i % 2), hexc('#ff4040'))
            fang = (rear + (0.5 if anim == 'attack' and f in (3, 4) else 0)) * 2 * s
            pen.line((hx + 1 * s, by + 1 * s), (hx + 2 * s, by + 3 * s + fang), hexc('#e0e0c0'), 1)
            pen.line((hx + 2.5 * s, by + 1 * s), (hx + 3.5 * s, by + 3 * s + fang), hexc('#e0e0c0'), 1)
        else:  # beetle
            sh = hexc(spec['shell'])
            pen.shaded_ellipse(bx + spec['len'] * s * 0.32, by + 1 * s, spec['len'] * s * 0.18, spec['bh'] * s * 0.3, body)
            pen.line((bx + spec['len'] * s * 0.45, by - 1 * s), (bx + spec['len'] * s * 0.62 + rear * 4 * s, by - 5 * s - rear * 3 * s), hexc('#d8d0b0'), max(2, round(1.8 * s)))
            pen.px(bx + spec['len'] * s * 0.42, by - 0.5 * s, hexc('#ffb040'))
            pen.shaded_ellipse(bx - spec['len'] * s * 0.05, by - spec['bh'] * s * 0.15 + sink * 0.2, spec['len'] * s * 0.42, spec['bh'] * s * 0.55, sh)
            cc = hexc(spec['cracks'])
            pen.line((bx - spec['len'] * s * 0.2, by - spec['bh'] * s * 0.55), (bx - spec['len'] * s * 0.05, by - spec['bh'] * s * 0.1), cc, 1)
            pen.line((bx - spec['len'] * s * 0.05, by - spec['bh'] * s * 0.1), (bx + spec['len'] * s * 0.12, by - spec['bh'] * s * 0.4), cc, 1)
            pen.line((bx - spec['len'] * s * 0.42, by - spec['bh'] * s * 0.05), (bx + spec['len'] * s * 0.32, by - spec['bh'] * s * 0.05), shade(sh, 0.6), 1)
    return fn


# ----------------------------------------------------------------- unique rigs
def serpent(pen, anim, f, n, cw, ch):
    gy = ch - 3
    ph = f / n * math.tau
    body = hexc('#4a6a2a'); belly = hexc('#c8c070'); mark = hexc('#9a3ad0')
    strike = {'attack': [0, -0.3, -0.5, 1, 0.8, 0.2], 'special': [0, 0.4, 0.8, 1, 0.8, 0.3]}.get(anim, [0] * 6)[f] if anim in ('attack', 'special') else 0
    pts = []
    N = 14
    for i in range(N):
        t = i / (N - 1)
        x = 8 + t * (cw - 30)
        y = gy - 4 - math.sin(t * 6 + ph * (2 if anim == 'move' else 0.5)) * 2.5
        if anim == 'death':
            y = gy - 3
        pts.append((x, y))
    # raised neck
    neck_h = 18 + strike * 4 if anim != 'death' else 3
    hx = pts[-1][0] + 6 + strike * 8
    hy = gy - neck_h - (math.sin(ph) * 1 if anim == 'idle' else 0)
    if anim == 'hit':
        hx -= [4, 3, 1][f]
    pts += [(pts[-1][0] + 3, gy - 8), (hx - 3, hy + 6)]
    for i, (a, b) in enumerate(zip(pts, pts[1:])):
        w = 6 if i < len(pts) - 3 else 5
        pen.line(a, b, shade(body, 0.75), w + 1)
        pen.line(a, b, body, w)
        if i % 3 == 0:
            pen.px(a[0], a[1] - 1, mark)
    for a in pts[:-2]:
        pen.px(a[0], a[1] + 2, belly)
    pen.shaded_poly([(hx - 5, hy - 3), (hx + 4, hy - 4), (hx + 9, hy), (hx + 4, hy + 4), (hx - 4, hy + 4)], body)
    pen.px(hx + 3, hy - 2, hexc('#ff3aff'))
    if strike > 0.5 or anim == 'special':
        pen.line((hx + 6, hy + 2), (hx + 7, hy + 6), hexc('#f0f0e0'), 1)
        if anim == 'special':
            for i in range(5):
                pen.px(hx + 10 + i * 3, hy + 1 + i * 0.5, hexc('#8aff40'))


def molten_core(pen, anim, f, n, cw, ch):
    ph = f / n * math.tau
    cx, cy = cw / 2, ch / 2 - 2 + math.sin(ph) * 2
    r = 15
    if anim == 'death':
        r = 15 - f * 2
    if anim == 'special':
        r = 15 + [0, 2, 4, 5, 3, 1][f]
    hot = hexc('#ffb030'); core = hexc('#fff0a0'); crust = hexc('#4a2018')
    pen.circle(cx, cy, r + 3, (255, 120, 40, 60))
    pen.shaded_ellipse(cx, cy, r, r, hexc('#d04a14'))
    for i in range(6):
        a = i * 1.05 + ph * 0.5
        pen.poly([(cx + math.cos(a) * r * 0.9, cy + math.sin(a) * r * 0.9), (cx + math.cos(a + 0.4) * r, cy + math.sin(a + 0.4) * r), (cx + math.cos(a + 0.2) * r * 0.55, cy + math.sin(a + 0.2) * r * 0.55)], crust)
    pen.circle(cx, cy, r * 0.4, hot)
    pen.circle(cx - 1, cy - 1, r * 0.2, core)
    for i in range(3):
        a = ph + i * 2.1
        rx, ry = cx + math.cos(a) * (r + 8), cy + math.sin(a) * (r + 3) * 0.6
        pen.shaded_ellipse(rx, ry, 3, 2.5, hexc('#3a2a24'))
        pen.px(rx, ry, hot)


def sporeling(pen, anim, f, n, cw, ch):
    gy = ch - 3
    ph = f / n * math.tau
    hop = abs(math.sin(ph)) * (6 if anim == 'move' else 1)
    squash = 1 + (0.3 if anim == 'attack' and f in (2, 3) else 0)
    if anim == 'death':
        squash = 1 + f * 0.15
        hop = 0
    cx = cw / 2
    by = gy - 6 - hop
    stem = hexc('#d8cfb0'); cap = hexc('#6a2a5a'); spots = hexc('#b8ff6a')
    pen.line((cx - 3, gy - hop * 0.2), (cx - 2, by), shade(stem, 0.8), 2)
    pen.line((cx + 3, gy - hop * 0.2), (cx + 2, by), shade(stem, 0.8), 2)
    pen.shaded_ellipse(cx, by - 2, 5, 5 / squash, stem)
    pen.px(cx + 2, by - 3, hexc('#1a1010')); pen.px(cx + 4, by - 3, hexc('#1a1010'))
    pen.shaded_ellipse(cx, by - 8 / squash, 10 * squash, 6 / squash, cap)
    for dx in (-5, 0, 5):
        pen.circle(cx + dx * squash, by - 10 / squash, 1.2, spots)


def rot_heart(pen, anim, f, n, cw, ch):
    gy = ch - 3
    ph = f / n * math.tau
    pulse = 1 + 0.06 * math.sin(ph * 2)
    if anim == 'special':
        pulse = 1 + [0, 0.08, 0.16, 0.2, 0.1, 0][f]
    if anim == 'death':
        pulse = 1 - f * 0.08
    cx, cy = cw / 2, ch * 0.5
    root = hexc('#3a2a1a'); flesh = hexc('#7a1e3a'); vein = hexc('#a8ff4a'); rot_c = hexc('#4a5a1a')
    for i in range(7):
        a = math.pi * (0.15 + i * 0.12)
        sx = cx + math.cos(a) * 30
        pen.limb((cx + math.cos(a) * 18, cy + 18), (sx + math.cos(a) * 18, gy), 5, root)
    for i in range(4):
        a = ph + i * 1.6
        tx, ty = cx + math.cos(i * 1.7) * 44, cy - 30 + math.sin(a) * 6
        pen.limb((cx + math.cos(i * 1.7) * 20, cy - 10), (tx, ty), 3, shade(root, 1.2))
    r = 34 * pulse
    pen.shaded_poly([(cx - r, cy - r * 0.3), (cx - r * 0.55, cy - r * 0.95), (cx, cy - r * 0.6), (cx + r * 0.55, cy - r * 0.95), (cx + r, cy - r * 0.3), (cx + r * 0.2, cy + r * 0.95), (cx - r * 0.2, cy + r * 0.95)], flesh)
    for i in range(5):
        a = -0.8 + i * 0.4
        pen.line((cx, cy), (cx + math.cos(a + 1.57) * r * 0.8, cy + math.sin(a + 1.57) * r * 0.5 - r * 0.3), vein, 1)
    pen.circle(cx - r * 0.4, cy - r * 0.2, 4 * pulse, rot_c)
    pen.circle(cx + r * 0.35, cy + r * 0.25, 5 * pulse, rot_c)
    eye_open = 0.3 if anim == 'idle' else 1
    pen.ellipse(cx + 4, cy - 2, 6, 4 * eye_open, hexc('#f0e060'))
    pen.ellipse(cx + 5, cy - 2, 2, 3 * eye_open, hexc('#1a0a0a'))
    if anim in ('attack', 'special'):
        for i in range(8):
            a = i / 8 * math.tau + f
            pen.px(cx + math.cos(a) * (r + 6 + f * 2), cy + math.sin(a) * (r * 0.8 + f), vein)


# ----------------------------------------------------------------- registry (canvas size, fn)
def H(spec, cw, ch):
    return (cw, ch, humanoid_monster(spec))


MONSTERS = {
    'meadow_wolf': (68, 44, quadruped(dict(s=1.0, body='#5a6250', belly='#8a8a6a', len=34, bh=11, leg=11, head=8, tail=12, ears=True, cracks='#b060ff', eye='#d070ff'))),
    'raider_goblin': H(dict(s=0.72, skin='#6a9a3a', cloth='#6a4a30', dark='#3a2a20', head='goblin', weapon='club', hunch=2, eye='#ffd040', barelegs=True), 44, 48),
    'broken_shell': (64, 42, arthropod(dict(kind='beetle', s=1.0, body='#3a3a2a', shell='#6a6a3a', cracks='#c070ff', len=40, bh=18, legh=6, legs=6))),
    'meadow_butcher': H(dict(s=1.45, skin='#c89a7a', cloth='#4a3a32', dark='#2a2020', head='sack', weapon='cleaver', bw=7, belly=3, apron='#b8a888', hunch=1, limb=1.3, leg=1.2, wmetal='#b0b0b8'), 84, 98),
    'golden_horn': (84, 62, quadruped(dict(s=1.25, body='#6a4a2a', belly='#a07a4a', len=40, bh=16, leg=11, head=10, tail=6, tusks=True, horns='#ffd040', aura='#ffe070', eye='#ffd040', legw=4))),
    'forest_goblin': H(dict(s=0.75, skin='#3e6a3a', cloth='#2e4a2a', dark='#1e2a1a', head='goblin', hood='#2a4024', weapon='spear', hunch=1.5, eye='#f0ff40'), 52, 50),
    'venom_spider': (64, 40, arthropod(dict(kind='spider', s=1.0, body='#2a2230', abdomen='#3a2a40', mark='#7aff4a', len=34, bh=12, legh=9, legs=8, legw=1.4))),
    'corrupted_tree': H(dict(s=1.35, skin='#5a3e24', cloth='#4a3420', dark='#2e2014', head='tree', leaves='#3e5a2a', weapon=None, bw=7, limb=1.6, leg=1.5, eye='#c0ff50', fists=True, moss=True), 76, 90),
    'root_guardian': H(dict(s=1.7, skin='#4a3a26', cloth='#3a2e1e', dark='#24180e', head='tree', leaves='#2e6a2a', weapon=None, bw=8, belly=2, limb=2.0, leg=1.8, eye='#80ffb0', fists=True, moss=True, pauldron='#4a6a2a'), 96, 112),
    'ancient_fang': (88, 56, serpent),
    'rusty_guard': H(dict(s=1.15, skin='#7a5a40', cloth='#8a5a3a', dark='#4a3024', head='box', metal='#9a6a44', weapon='halberd', bw=6, rivets=True, eye='#ffb040', limb=1.2, pauldron='#9a6a44', wmetal='#a08068'), 64, 76),
    'ember_worker': H(dict(s=1.0, skin='#8a5a40', cloth='#4a3a34', dark='#2a2020', head='goblin', weapon='bucket', core='#ff8a2a', apron='#6a4a30', eye='#ff9a2a'), 52, 62),
    'mine_crawler': (56, 32, quadruped(dict(s=0.8, body='#6a5a4a', belly='#a08a6a', len=34, bh=8, leg=6, head=7, tail=16, spikes='#b0a090', eye='#ff7a2a', legw=2.5))),
    'iron_executioner': H(dict(s=1.75, skin='#9a8a80', cloth='#3a3a44', dark='#22222a', head='hood_exec', weapon='greataxe', bw=7, belly=2, limb=1.4, leg=1.3, pauldron='#5a5a66', wmetal='#c0c4cc'), 100, 116),
    'molten_core': (68, 68, molten_core),
    'broken_horn': H(dict(s=2.25, skin='#5a3a2a', cloth='#3a2a20', dark='#2a1a14', head='bull', weapon='hammer', bw=8, belly=3, limb=1.6, leg=1.5, hs=0.9, fists=True, wmetal='#7a7a80'), 140, 148),
    'lord_of_roots': H(dict(s=2.9, skin='#4a3420', cloth='#3a2a18', dark='#22160c', head='tree', leaves='#2a5a24', weapon=None, bw=8, belly=2, limb=2.2, leg=2.0, eye='#ffe060', fists=True, moss=True, crown=True, hs=0.9), 160, 190),
    'forge_warden': H(dict(s=3.0, skin='#5a5a62', cloth='#4a4a52', dark='#2a2a30', head='furnace', weapon='hammer', bw=9, belly=3, limb=2.0, leg=1.8, core='#ff7a1a', rivets=True, fists=True, pauldron='#6a6a74', wmetal='#8a8a94', hs=0.8), 176, 196),
    'rot_sporeling': (40, 36, sporeling),
    'rot_heart': (150, 140, rot_heart),
}


def build_sheet(name):
    cw, ch, fn = MONSTERS[name]
    return frames_for(fn, cw, ch), cw, ch
