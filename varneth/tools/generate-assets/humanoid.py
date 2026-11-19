"""Layered hero sprites for the three classes.
A skeletal pose is computed per (class, animation, frame); every layer (body, armor,
hair, helmet, weapons, cape, face) is rasterised from the SAME pose so the layers
stack perfectly in-game and equipment visibly changes the character."""
import math
from pix import new, Pen, hexc, shade, mix, outline, rot, lerp, lerp2, ease

W, H = 48, 64
ANIMS = [('idle', 6), ('run', 8), ('attack', 8), ('cast', 10), ('hit', 4), ('death', 8), ('victory', 6)]
FRAME_COUNT = sum(n for _, n in ANIMS)
COLS = 10

UPPER, LOWER = 7.0, 7.0
THIGH, SHIN = 10.0, 10.5


def ik(root, target, a, b, bend=1):
    dx, dy = target[0] - root[0], target[1] - root[1]
    d = math.hypot(dx, dy)
    d = max(0.01, min(d, a + b - 0.05))
    base = math.atan2(dy, dx)
    cosv = max(-1, min(1, (a * a + d * d - b * b) / (2 * a * d)))
    ang = base + bend * math.acos(cosv)
    mid = (root[0] + a * math.cos(ang), root[1] + a * math.sin(ang))
    end_ang = math.atan2(target[1] - mid[1], target[0] - mid[0])
    end = (mid[0] + b * math.cos(end_ang), mid[1] + b * math.sin(end_ang))
    return mid, end


def build(hip, chest, head, hF, hB, fF, fB, wAng=-1.0, oAng=0.0, **extra):
    sF = (chest[0] + 2, chest[1] + 1)
    sB = (chest[0] - 2, chest[1] + 1)
    eF, hF2 = ik(sF, hF, UPPER, LOWER, bend=1)
    eB, hB2 = ik(sB, hB, UPPER, LOWER, bend=1)
    hipF = (hip[0] + 1.5, hip[1])
    hipB = (hip[0] - 1.5, hip[1])
    kF, fF2 = ik(hipF, fF, THIGH, SHIN, bend=-1)
    kB, fB2 = ik(hipB, fB, THIGH, SHIN, bend=-1)
    p = dict(hip=hip, chest=chest, head=head, sF=sF, eF=eF, hF=hF2, sB=sB, eB=eB, hB=hB2,
             hipF=hipF, hipB=hipB, kF=kF, fF=fF2, kB=kB, fB=fB2, wAng=wAng, oAng=oAng,
             draw=0.0, glow=0.0, rotate=0.0, alpha=1.0)
    p.update(extra)
    return p


def pose(cls, anim, f, n):
    t = f / n
    ph = 2 * math.pi * t
    X = 23
    if anim == 'idle':
        b = math.sin(ph) * 0.7
        hip = (X, 40 + b * 0.3)
        chest = (X + 1, 27 + b)
        head = (X + 2, 19 + b)
        if cls == 'warrior':
            return build(hip, chest, head, (X + 8, 37 + b), (X - 4, 36 + b), (X + 5, 60), (X - 4, 60), wAng=-1.05 + b * 0.05, oAng=0)
        if cls == 'ranger':
            return build(hip, chest, head, (X + 8, 38 + b), (X - 2, 39 + b), (X + 5, 60), (X - 3, 60), wAng=-1.45, draw=0)
        return build(hip, chest, head, (X + 7, 36 + b), (X - 2, 39 + b), (X + 4, 60), (X - 3, 60), wAng=-1.57, glow=0.35 + 0.25 * math.sin(ph))
    if anim == 'run':
        s = math.sin(ph)
        c = math.cos(ph)
        bob = abs(math.sin(ph)) * 1.6
        lean = 2.5
        hip = (X + 1, 39 - bob)
        chest = (X + 1 + lean, 27 - bob)
        head = (X + 2.5 + lean, 19 - bob)
        fF = (X + 1 + 7 * s, 60 - max(0, 4 * c))
        fB = (X + 1 - 7 * s, 60 - max(0, -4 * c))
        armF = (X + 6 + lean - 4 * s, 37 - bob)
        armB = (X - 2 + lean + 4 * s, 37 - bob)
        if cls == 'warrior':
            return build(hip, chest, head, armF, armB, fF, fB, wAng=-0.6 - 0.15 * s)
        if cls == 'ranger':
            return build(hip, chest, head, armF, armB, fF, fB, wAng=-1.3)
        return build(hip, chest, head, armF, armB, fF, fB, wAng=-1.25, glow=0.3)
    if anim == 'attack':
        if cls == 'warrior':
            keys = [-1.0, -1.9, -2.45, -2.55, -0.9, 0.55, 0.85, -0.2]
            leans = [0, -1, -1.5, -1.5, 2, 3.5, 3, 1]
            a = keys[f]
            lean = leans[f]
            sF = (X + 3 + lean, 28)
            hand = (sF[0] + 11 * math.cos(a * 0.85 + 0.25), sF[1] + 11 * math.sin(a * 0.85 + 0.25))
            hip = (X + lean * 0.4, 40 + (1 if f in (5, 6) else 0))
            return build(hip, (X + 1 + lean, 27 + (1 if f in (5, 6) else 0)), (X + 2 + lean, 19 + (1 if f in (5, 6) else 0)), hand, (X - 3 + lean * 0.5, 35),
                         (X + 6 + (3 if f >= 4 else 0), 60), (X - 4, 60), wAng=a, trail=(f in (4, 5)))
        if cls == 'ranger':
            draw = [0, 0.2, 0.6, 1.0, 1.0, 0.0, 0.0, 0.0][f]
            hF = (X + 13, 29)
            hB = lerp2((X + 10, 29), (X + 1, 27), draw)
            if f >= 5:
                hB = (X - 2 + (f - 5), 30)
            return build((X, 40), (X + 1, 27), (X + 2, 19), hF, hB, (X + 6, 60), (X - 4, 60), wAng=0.0, draw=draw, release=(f == 5))
        # mage: thrust staff forward
        k = [0, 0.3, 0.7, 1, 1, 0.8, 0.4, 0.1][f]
        hF = (X + 7 + 6 * k, 35 - 5 * k)
        return build((X - k, 40), (X + 1 + k, 27), (X + 2 + k, 19), hF, (X - 2, 38), (X + 5 + k * 2, 60), (X - 3, 60), wAng=-1.57 + 0.9 * k, glow=0.3 + 0.7 * k)
    if anim == 'cast':
        if cls == 'warrior':
            # leap slam
            ys = [0, 2, 3, -3, -7, -6, 3, 3, 1, 0][f]
            a = [-1.0, -2.0, -2.5, -2.6, -2.7, -2.2, 0.9, 1.0, 0.7, -0.4][f]
            hip = (X, 40 + ys)
            chest = (X + 1 + (2 if f >= 6 else 0), 27 + ys + (1 if f in (1, 2, 6, 7) else 0))
            sF = (chest[0] + 2, chest[1] + 1)
            hand = (sF[0] + 10 * math.cos(a * 0.85 + 0.2), sF[1] + 10 * math.sin(a * 0.85 + 0.2))
            hB = (hand[0] - 2, hand[1] + 1)
            fy = 60 + min(0, ys + 2) if 3 <= f <= 5 else 60
            return build(hip, chest, (chest[0] + 1, chest[1] - 8), hand, hB, (X + 5, fy), (X - 4, fy), wAng=a, trail=(f == 6), impact=(f == 6))
        if cls == 'ranger':
            ys = [0, 2, -2, -6, -8, -7, -5, -2, 1, 0][f]
            xs = [0, 0, -1, -3, -4, -5, -5, -5, -4, -3][f]
            draw = [0, 0.3, 0.6, 1, 1, 0, 1, 0, 0, 0][f]
            hF = (X + 13 + xs, 27 + ys)
            hB = lerp2((X + 10 + xs, 27 + ys), (X + 1 + xs, 25 + ys), draw)
            fy = 60 + min(0, ys + 1) if 2 <= f <= 7 else 60
            return build((X + xs, 40 + ys), (X + 1 + xs, 27 + ys), (X + 2 + xs, 19 + ys), hF, hB, (X + 5 + xs, fy), (X - 4 + xs, fy - (2 if 2 <= f <= 7 else 0)),
                         wAng=-0.35 if 2 <= f <= 7 else 0, draw=draw, release=(f in (5, 7)))
        k = [0, 0.25, 0.55, 0.85, 1, 1, 1, 1, 0.6, 0.2][f]
        hF = (X + 6 + 2 * k, 36 - 16 * k)
        hB = (X - 2 - 2 * k, 38 - 14 * k)
        return build((X, 40), (X + 1, 27 - k), (X + 2, 19 - k), hF, hB, (X + 4, 60), (X - 3, 60), wAng=-1.57 + (0.7 if f >= 8 else 0.1),
                     glow=0.4 + 0.6 * k, circle=k)
    if anim == 'hit':
        k = [1, 0.8, 0.4, 0][f]
        hip = (X - k, 40)
        chest = (X - 2 * k, 27 + k * 0.5)
        head = (X - 3 * k, 19 + k * 0.5)
        if cls == 'warrior':
            return build(hip, chest, head, (X + 6 - 2 * k, 37), (X - 5, 34), (X + 5, 60), (X - 4, 60), wAng=-0.7 - 0.5 * k)
        if cls == 'ranger':
            return build(hip, chest, head, (X + 7 - 2 * k, 38), (X - 3, 38), (X + 5, 60), (X - 4, 60), wAng=-1.3)
        return build(hip, chest, head, (X + 6 - 2 * k, 37), (X - 3, 38), (X + 4, 60), (X - 3, 60), wAng=-1.4, glow=0.2)
    if anim == 'death':
        k = ease(min(1, f / 6))
        base = pose(cls, 'hit', 0, 4)
        base['rotate'] = -k * 1.45
        base['alpha'] = 1.0 if f < 7 else 0.85
        base['fall'] = k
        return base
    if anim == 'victory':
        b = abs(math.sin(ph)) * 2
        hip = (X, 40 - b * 0.4)
        chest = (X + 1, 27 - b)
        head = (X + 2, 19 - b)
        if cls == 'warrior':
            return build(hip, chest, head, (X + 5, 12 - b), (X - 4, 36 - b), (X + 5, 60), (X - 4, 60), wAng=-1.57)
        if cls == 'ranger':
            return build(hip, chest, head, (X + 6, 13 - b), (X - 3, 38 - b), (X + 5, 60), (X - 4, 60), wAng=-1.57)
        return build(hip, chest, head, (X + 6, 12 - b), (X - 3, 37 - b), (X + 4, 60), (X - 3, 60), wAng=-1.57, glow=1.0)
    raise ValueError(anim)


def all_poses(cls):
    out = []
    for name, n in ANIMS:
        for f in range(n):
            out.append(pose(cls, name, f, n))
    return out


def transform(p, pt):
    """Apply death rotation (pivot at feet) to a point."""
    if not p.get('rotate'):
        return pt
    piv = (24, 61)
    q = rot(pt, p['rotate'], piv)
    return (q[0] + p['fall'] * 20, q[1] + p['fall'] * 1.5)


def T(p, key):
    return transform(p, p[key])


# ------------------------------------------------------------------------- layers
SKIN = hexc('#f3d9c4')  # light base; tinted at runtime to the chosen skin tone
HAIR = hexc('#e8e8e8')  # light base; tinted at runtime


def draw_body(p):
    img = new(W, H)
    pen = Pen(img)
    sk = SKIN
    # back arm & leg
    pen.limb(T(p, 'sB'), T(p, 'eB'), 3, shade(sk, 0.85))
    pen.limb(T(p, 'eB'), T(p, 'hB'), 3, shade(sk, 0.85))
    pen.limb(T(p, 'hipB'), T(p, 'kB'), 4, shade(sk, 0.85))
    pen.limb(T(p, 'kB'), T(p, 'fB'), 3, shade(sk, 0.85))
    # torso
    c, h = T(p, 'chest'), T(p, 'hip')
    pen.poly([(c[0] - 4, c[1]), (c[0] + 4, c[1]), (h[0] + 3.5, h[1]), (h[0] - 3.5, h[1])], shade(sk, 0.8))
    pen.poly([(c[0] - 3, c[1] + 0.5), (c[0] + 3, c[1] + 0.5), (h[0] + 2.5, h[1] - 0.5), (h[0] - 2.5, h[1] - 0.5)], sk)
    # front leg
    pen.limb(T(p, 'hipF'), T(p, 'kF'), 4, sk)
    pen.limb(T(p, 'kF'), T(p, 'fF'), 3, sk)
    # neck & head
    hd = T(p, 'head')
    pen.limb((c[0] + 0.5, c[1]), (hd[0] - 0.5, hd[1] + 4), 3, shade(sk, 0.9))
    pen.shaded_ellipse(hd[0], hd[1], 4.6, 5.2, sk)
    # face (facing right): eye, brow, nose
    pen.px(hd[0] + 2.5, hd[1] - 0.5, hexc('#2a1c22'))
    pen.px(hd[0] + 2.5, hd[1] - 1.8, shade(sk, 0.6))
    pen.px(hd[0] + 4.6, hd[1] + 0.8, shade(sk, 0.8))
    pen.px(hd[0] + 3, hd[1] + 2.8, shade(sk, 0.65))
    # front arm
    pen.limb(T(p, 'sF'), T(p, 'eF'), 3, sk)
    pen.limb(T(p, 'eF'), T(p, 'hF'), 3, sk)
    pen.circle(*T(p, 'hF'), 1.3, sk)
    return outline(img)


ARMOR_PALETTES = {
    'plate_iron':   dict(kind='plate', main='#7c8590', trim='#4a4f58', accent='#a88a4a', cloth='#5a4636', boot='#3c3a40'),
    'plate_steel':  dict(kind='plate', main='#b7c0cc', trim='#5c6878', accent='#d8b45a', cloth='#3a3f6a', boot='#4a4e5a'),
    'plate_blood':  dict(kind='plate', main='#7a2028', trim='#2a1216', accent='#e0b050', cloth='#40141a', boot='#2a1418'),
    'leather_brown': dict(kind='leather', main='#7a5232', trim='#4a3020', accent='#b08a50', cloth='#5c6a3a', boot='#3e2a1c'),
    'leather_dark': dict(kind='leather', main='#3e3a44', trim='#24202a', accent='#8a7a60', cloth='#2e3a2e', boot='#221e24'),
    'leather_green': dict(kind='leather', main='#3e6a34', trim='#1e3a1c', accent='#c0d070', cloth='#2a4a28', boot='#2a3a20'),
    'cloth_blue':   dict(kind='cloth', main='#3a4f8a', trim='#22305a', accent='#c8b060', cloth='#2a3a6a', boot='#3a2a24'),
    'cloth_violet': dict(kind='cloth', main='#5a2f7a', trim='#2e1a44', accent='#e0c070', cloth='#3a1e52', boot='#2a1e2a'),
    'cloth_arcane': dict(kind='cloth', main='#1e5a6a', trim='#0e2a36', accent='#7ff0ff', cloth='#16404c', boot='#1a2228'),
}


def draw_armor(p, key):
    pal = {k: (hexc(v) if isinstance(v, str) and v.startswith('#') else v) for k, v in ARMOR_PALETTES[key].items()}
    kind = pal['kind']
    img = new(W, H)
    pen = Pen(img)
    main, trim, acc, cloth, boot = pal['main'], pal['trim'], pal['accent'], pal['cloth'], pal['boot']
    c, h = T(p, 'chest'), T(p, 'hip')
    # back sleeve
    pen.limb(T(p, 'sB'), T(p, 'eB'), 4, shade(main if kind != 'cloth' else cloth, 0.8))
    pen.limb(T(p, 'eB'), lerp2(T(p, 'eB'), T(p, 'hB'), 0.7), 4 if kind == 'plate' else 3, shade(trim, 0.9))
    # legs (pants)
    legc = cloth if kind != 'plate' else main
    pen.limb(T(p, 'hipB'), T(p, 'kB'), 5, shade(legc, 0.8))
    pen.limb(T(p, 'kB'), lerp2(T(p, 'kB'), T(p, 'fB'), 0.55), 4, shade(legc, 0.8))
    pen.limb(lerp2(T(p, 'kB'), T(p, 'fB'), 0.5), T(p, 'fB'), 4, shade(boot, 0.85))
    pen.line(T(p, 'fB'), (T(p, 'fB')[0] + 2.5, T(p, 'fB')[1]), shade(boot, 0.85), 3)
    # robe skirt for mages (behind front leg)
    if kind == 'cloth':
        hp = h
        k1 = T(p, 'kF'); k2 = T(p, 'kB')
        bottom = max(k1[1], k2[1]) + 5
        pen.poly([(hp[0] - 4.5, hp[1] - 2), (hp[0] + 4.5, hp[1] - 2), (max(k1[0], k2[0]) + 4, bottom), (min(k1[0], k2[0]) - 4, bottom)], shade(main, 0.85))
        pen.line((min(k1[0], k2[0]) - 4, bottom), (max(k1[0], k2[0]) + 4, bottom), acc, 1)
    # front leg
    pen.limb(T(p, 'hipF'), T(p, 'kF'), 5, legc)
    pen.limb(T(p, 'kF'), lerp2(T(p, 'kF'), T(p, 'fF'), 0.55), 4, legc)
    if kind == 'plate':
        pen.circle(*T(p, 'kF'), 2, shade(main, 1.15))
    pen.limb(lerp2(T(p, 'kF'), T(p, 'fF'), 0.5), T(p, 'fF'), 4, boot)
    pen.line(T(p, 'fF'), (T(p, 'fF')[0] + 2.5, T(p, 'fF')[1]), boot, 3)
    # torso
    if kind == 'plate':
        pen.shaded_poly([(c[0] - 5, c[1] - 0.5), (c[0] + 5, c[1] - 0.5), (h[0] + 4.5, h[1] + 1), (h[0] - 4.5, h[1] + 1)], main)
        pen.line((c[0] - 1, c[1] + 2), (h[0] - 1, h[1] - 2), trim, 1)
        pen.line((h[0] - 4.5, h[1] - 1), (h[0] + 4.5, h[1] - 1), acc, 2)
        pen.poly([(h[0] - 4, h[1] + 1), (h[0] + 4, h[1] + 1), (h[0] + 3, h[1] + 5), (h[0] - 3, h[1] + 5)], shade(cloth, 1.0))
    elif kind == 'leather':
        pen.shaded_poly([(c[0] - 4.5, c[1]), (c[0] + 4.5, c[1]), (h[0] + 4, h[1] + 2), (h[0] - 4, h[1] + 2)], main)
        pen.line((c[0] - 4, c[1] + 1), (h[0] + 3, h[1] - 1), trim, 1)
        pen.line((h[0] - 4, h[1] - 0.5), (h[0] + 4, h[1] - 0.5), shade(trim, 1.1), 2)
        pen.px(h[0], h[1] - 0.5, acc)
        pen.poly([(c[0] - 3, c[1] - 1), (c[0] + 3, c[1] - 1), (c[0] + 1.5, c[1] + 2), (c[0] - 1.5, c[1] + 2)], shade(cloth, 1.0))
    else:
        pen.shaded_poly([(c[0] - 4, c[1]), (c[0] + 4, c[1]), (h[0] + 4.5, h[1] + 1), (h[0] - 4.5, h[1] + 1)], main)
        pen.line((c[0], c[1] + 1), (h[0], h[1]), acc, 1)
        pen.line((h[0] - 4, h[1] - 0.5), (h[0] + 4, h[1] - 0.5), trim, 2)
        pen.px(h[0], h[1] - 0.5, acc)
    # shoulders
    if kind == 'plate':
        pen.shaded_ellipse(T(p, 'sF')[0], T(p, 'sF')[1] + 0.5, 3.4, 2.8, shade(main, 1.05))
        pen.line((T(p, 'sF')[0] - 3, T(p, 'sF')[1] + 2.5), (T(p, 'sF')[0] + 3, T(p, 'sF')[1] + 2.5), acc, 1)
    elif kind == 'leather':
        pen.shaded_ellipse(T(p, 'sF')[0], T(p, 'sF')[1] + 0.5, 2.6, 2.2, shade(main, 1.0))
    # front sleeve + glove
    sl = main if kind != 'cloth' else main
    pen.limb(T(p, 'sF'), T(p, 'eF'), 4, sl)
    pen.limb(T(p, 'eF'), lerp2(T(p, 'eF'), T(p, 'hF'), 0.75), 4 if kind == 'plate' else 3, trim if kind != 'cloth' else shade(main, 1.1))
    if kind == 'cloth':
        e = T(p, 'eF'); hh = T(p, 'hF')
        pen.line(lerp2(e, hh, 0.55), lerp2(e, hh, 0.8), acc, 2)
    gl = boot if kind != 'cloth' else hexc('#d8c0a8')
    pen.circle(*T(p, 'hF'), 1.6, gl)
    pen.circle(*T(p, 'hB'), 1.4, shade(gl, 0.85))
    return outline(img)


HAIR_STYLES = ['short', 'long', 'ponytail', 'shaved', 'braided']


def draw_hair(p, style):
    img = new(W, H)
    pen = Pen(img)
    hd = T(p, 'head')
    x, y = hd
    base = HAIR
    dark = shade(base, 0.75)
    if style == 'shaved':
        pen.ellipse(x - 0.8, y - 2.6, 4.2, 2.6, shade(base, 0.6))
        pen.rect(x - 4, y - 0.8, x + 3, y + 0.2, (0, 0, 0, 0))
        return outline(img)
    # cap of hair (top & back of head)
    pen.ellipse(x - 0.8, y - 2.2, 5.2, 3.8, dark)
    pen.ellipse(x - 0.4, y - 2.8, 4.6, 3.0, base)
    pen.px(x + 2, y - 4.5, shade(base, 1.2))
    pen.px(x + 3, y - 3.8, shade(base, 1.2))
    # fringe
    pen.line((x + 3.5, y - 3.2), (x + 4.6, y - 1.2), base, 2)
    # back of head down
    pen.poly([(x - 5, y - 2), (x - 1, y - 2), (x - 1.5, y + 2), (x - 5, y + 3)], dark)
    if style == 'long':
        sway = (T(p, 'chest')[0] - T(p, 'hip')[0]) * 0.3
        pen.poly([(x - 5.2, y - 1), (x - 1, y), (x - 2 - sway, y + 11), (x - 6 - sway, y + 10)], dark)
        pen.line((x - 4, y), (x - 4.5 - sway, y + 9), base, 2)
    elif style == 'ponytail':
        pen.circle(x - 5, y - 2, 1.6, base)
        pen.line((x - 6, y - 1), (x - 8, y + 5), dark, 3)
        pen.line((x - 6.5, y - 0.5), (x - 8.5, y + 4), base, 1)
    elif style == 'braided':
        for i in range(4):
            pen.circle(x - 5 - i * 0.4, y + 1 + i * 2.6, 1.5, dark if i % 2 else base)
    return outline(img)


HELMETS = {
    'helm_iron':  dict(kind='helm', main='#7c8590', trim='#3a3e46', accent='#a88a4a'),
    'helm_steel': dict(kind='helm', main='#b7c0cc', trim='#56606e', accent='#d8b45a', plume='#9a2a2a'),
    'helm_blood': dict(kind='helm', main='#7a2028', trim='#2a1216', accent='#e0b050', horns=True),
    'hood_brown': dict(kind='hood', main='#6a4a2e', trim='#3e2a1a'),
    'hood_dark':  dict(kind='hood', main='#34303a', trim='#1c1a20'),
    'hood_green': dict(kind='hood', main='#3e6a34', trim='#1e3a1c', accent='#c0d070'),
    'hat_blue':   dict(kind='hat', main='#3a4f8a', trim='#22305a', accent='#c8b060'),
    'hat_violet': dict(kind='hat', main='#5a2f7a', trim='#2e1a44', accent='#e0c070'),
    'hat_arcane': dict(kind='hat', main='#1e5a6a', trim='#0e2a36', accent='#7ff0ff'),
    'crown_roots': dict(kind='crown', main='#5a3a1e', trim='#2e1c0e', accent='#7fd04f'),
}


def draw_helmet(p, key):
    pal = {k: (hexc(v) if isinstance(v, str) and v.startswith('#') else v) for k, v in HELMETS[key].items()}
    img = new(W, H)
    pen = Pen(img)
    x, y = T(p, 'head')
    m, tr = pal['main'], pal['trim']
    if pal['kind'] == 'helm':
        pen.shaded_ellipse(x - 0.3, y - 1.2, 5.6, 5.0, m)
        pen.rect(x - 5.5, y + 0.5, x - 1, y + 4, shade(m, 0.85))
        pen.line((x + 0.5, y - 0.6), (x + 5, y - 0.6), hexc('#140c10'), 1)  # visor slit
        pen.line((x - 5.5, y + 0.8), (x + 5.2, y + 0.8), pal['accent'], 1)
        pen.line((x + 1.5, y - 6), (x + 1.5, y + 0.5), shade(m, 1.2), 1)
        if pal.get('plume'):
            pen.line((x - 1, y - 6), (x - 6, y - 8), pal['plume'], 3)
        if pal.get('horns'):
            pen.line((x - 2, y - 4), (x - 6, y - 9), hexc('#e8dcc0'), 2)
            pen.line((x + 2, y - 5), (x + 3, y - 10), hexc('#e8dcc0'), 2)
    elif pal['kind'] == 'hood':
        pen.poly([(x - 6, y + 5), (x - 6.5, y - 2), (x - 2, y - 6.5), (x + 3.5, y - 5.5), (x + 5.5, y - 1), (x + 3, y - 1.5), (x + 1, y + 2), (x + 1, y + 6)], m)
        pen.poly([(x - 5.5, y + 4), (x - 5.5, y - 1.5), (x - 2, y - 5)], shade(m, 0.8))
        pen.line((x + 3.5, y - 5), (x + 5.5, y - 1), tr, 1)
        if pal.get('accent'):
            pen.px(x - 1, y + 5, pal['accent'])
    elif pal['kind'] == 'hat':
        pen.ellipse(x, y - 3.2, 7.5, 1.6, shade(m, 0.8))
        pen.poly([(x - 4.5, y - 3.5), (x + 4, y - 3.5), (x - 2, y - 12), (x - 6, y - 15)], m)
        pen.line((x - 4, y - 4.5), (x + 3.5, y - 4.5), pal['accent'], 1)
        pen.px(x - 6, y - 15, pal['accent'])
    elif pal['kind'] == 'crown':
        pen.line((x - 5, y - 3), (x + 4.5, y - 3), m, 2)
        for dx, hh in [(-4, 4), (-1.5, 6), (1, 5), (3.5, 3.5)]:
            pen.line((x + dx, y - 3), (x + dx - 0.5, y - 3 - hh), m, 1)
            pen.px(x + dx - 0.5, y - 3 - hh, pal['accent'])
        pen.px(x - 1, y - 4, pal['accent'])
    return outline(img)


def draw_cape(p):
    img = new(W, H)
    pen = Pen(img)
    c, h = T(p, 'chest'), T(p, 'hip')
    sway = (c[0] - h[0]) * 1.2
    col = hexc('#e2e2e2')
    pen.poly([(c[0] - 3, c[1]), (c[0] + 1, c[1]), (h[0] - 1 - sway, h[1] + 12), (h[0] - 8 - sway * 1.5, h[1] + 10)], shade(col, 0.8))
    pen.poly([(c[0] - 2, c[1] + 1), (c[0], c[1] + 1), (h[0] - 2 - sway, h[1] + 10), (h[0] - 6 - sway * 1.5, h[1] + 9)], col)
    return outline(img)


def draw_face(p, kind):
    img = new(W, H)
    pen = Pen(img)
    x, y = T(p, 'head')
    if kind == 'scar':
        pen.line((x + 1.5, y - 2.5), (x + 3.5, y + 1.5), hexc('#9a3a3a'), 1)
    else:
        pen.line((x + 1, y + 0.5), (x + 4.4, y + 0.5), hexc('#2a6ad0'), 1)
        pen.line((x + 1, y + 1.5), (x + 3.5, y + 1.5), hexc('#2a6ad0'), 1)
    return img


# ------------------------------------------------------------------------- weapons
WEAPON_PAL = {
    'a': dict(metal='#a9b0b8', dark='#5a6068', grip='#5a3a22', gold='#9a7a3a', wood='#7a5230', gem='#6ab0ff', glow='#8ad0ff'),
    'b': dict(metal='#d8e0e8', dark='#6a7480', grip='#3a2a3a', gold='#e0b850', wood='#4a3424', gem='#ff7a3a', glow='#ffb060'),
    'blood': dict(metal='#c03038', dark='#501018', grip='#2a1010', gold='#e0b050', wood='#3a1a14', gem='#ff3b3b', glow='#ff5050'),
    'green': dict(metal='#8ad070', dark='#2a5a24', grip='#2a3a1a', gold='#c0d070', wood='#3e6a2a', gem='#7aff7a', glow='#9aff7a'),
    'storm': dict(metal='#9ad8ff', dark='#2a4a6a', grip='#2a2a3a', gold='#d0e8ff', wood='#3a3a5a', gem='#e0f4ff', glow='#bfe8ff'),
    'stone': dict(metal='#9a9488', dark='#5a564e', grip='#5a3a22', gold='#c8b070', wood='#7a6a50', gem='#c8c0a8', glow='#e0d8c0'),
}


def wdir(p, extra=0.0):
    a = p['wAng'] + p.get('rotate', 0) + extra
    return math.cos(a), math.sin(a)


def draw_weapon(p, family, pal_key, offhand=False):
    pal = {k: hexc(v) for k, v in WEAPON_PAL[pal_key].items()}
    img = new(W, H)
    pen = Pen(img)
    hand = T(p, 'hB' if offhand else 'hF')
    dx, dy = wdir(p)
    nx, ny = -dy, dx
    hx, hy = hand
    if family in ('sword', 'greatsword', 'dagger'):
        L = {'sword': 14, 'greatsword': 20, 'dagger': 7}[family]
        wv = 3 if family == 'greatsword' else 2
        if offhand:
            dx, dy = math.cos(0.9 + p.get('rotate', 0)), math.sin(0.9 + p.get('rotate', 0))
            nx, ny = -dy, dx
        tip = (hx + dx * L, hy + dy * L)
        pen.line((hx - dx * 3, hy - dy * 3), (hx, hy), pal['grip'], 2)
        pen.line((hx + dx, hy + dy), tip, pal['dark'], wv + 1)
        pen.line((hx + dx, hy + dy), (tip[0] - dx, tip[1] - dy), pal['metal'], wv)
        pen.line((hx + dx * 2 - nx * 0.6, hy + dy * 2 - ny * 0.6), (tip[0] - dx * 2 - nx * 0.6, tip[1] - dy * 2 - ny * 0.6), shade(pal['metal'], 1.2), 1)
        pen.line((hx + nx * 2.5, hy + ny * 2.5), (hx - nx * 2.5, hy - ny * 2.5), pal['gold'], 2)
        if pal_key in ('b', 'blood'):
            pen.px(hx - dx * 3, hy - dy * 3, pal['gem'])
        if p.get('trail') and not offhand:
            for i in range(1, 4):
                a = p['wAng'] - 0.35 * i
                pen.line((hx + math.cos(a) * L * 0.6, hy + math.sin(a) * L * 0.6), (hx + math.cos(a) * L, hy + math.sin(a) * L), (255, 255, 255, 140 - i * 35), 1)
    elif family == 'axe':
        L = 13
        top = (hx + dx * L, hy + dy * L)
        pen.line((hx - dx * 3, hy - dy * 3), top, pal['wood'], 2)
        head = [(top[0] - dx * 1, top[1] - dy * 1), (top[0] - dx * 6, top[1] - dy * 6),
                (top[0] - dx * 7 + nx * 5, top[1] - dy * 7 + ny * 5), (top[0] + nx * 5.5, top[1] + ny * 5.5)]
        pen.shaded_poly(head, pal['metal'])
        pen.line(head[2], head[3], shade(pal['metal'], 1.25), 1)
    elif family == 'shield':
        cx, cy = hx - 1, hy - 1
        if pal_key == 'stone':
            pen.shaded_ellipse(cx, cy, 6.5, 6.5, pal['metal'])
            pen.circle(cx, cy, 1.5, pal['dark'])
        else:
            pts = [(cx - 5, cy - 7), (cx + 5, cy - 7), (cx + 5, cy + 2), (cx, cy + 8), (cx - 5, cy + 2)]
            pen.shaded_poly(pts, pal['wood'] if pal_key == 'a' else pal['metal'])
            pen.line((cx, cy - 6), (cx, cy + 6), pal['gold'], 1)
            pen.line((cx - 4, cy - 2), (cx + 4, cy - 2), pal['gold'], 1)
            pen.circle(cx, cy - 2, 1.2, pal['gem'] if pal_key != 'a' else pal['dark'])
    elif family in ('bow', 'crossbow'):
        aim = p['wAng'] + p.get('rotate', 0)
        ax, ay = math.cos(aim), math.sin(aim)
        px_, py_ = -ay, ax
        if family == 'bow':
            r = 11
            draw = p.get('draw', 0)
            tips = []
            pts = []
            for i in range(-5, 6):
                s = i / 5
                bend = (1 - s * s) * 3.5
                pt = (hx + px_ * s * r + ax * bend, hy + py_ * s * r + ay * bend)
                pts.append(pt)
            for a1, a2 in zip(pts, pts[1:]):
                pen.line(a1, a2, pal['wood'], 2)
            pen.line(pts[4], pts[6], pal['grip'], 2)
            tips = [pts[0], pts[-1]]
            string_mid = T(p, 'hB') if draw > 0.05 else (hx - ax * 1, hy - ay * 1)
            pen.line(tips[0], string_mid, (230, 230, 220, 255), 1)
            pen.line(tips[1], string_mid, (230, 230, 220, 255), 1)
            if draw > 0.05:
                sm = string_mid
                pen.line(sm, (sm[0] + ax * 16, sm[1] + ay * 16), hexc('#c8b090'), 1)
                pen.px(sm[0] + ax * 16, sm[1] + ay * 16, hexc('#e0e8f0'))
                pen.px(sm[0] + ax * 15, sm[1] + ay * 15, hexc('#e0e8f0'))
            if pal_key == 'green':
                pen.px(hx + ax * 2, hy + ay * 2, pal['glow'])
        else:
            front = (hx + ax * 9, hy + ay * 9)
            pen.line((hx - ax * 5, hy - ay * 5), front, pal['wood'], 3)
            pen.line((front[0] + px_ * 6, front[1] + py_ * 6), (front[0] - px_ * 6, front[1] - py_ * 6), pal['metal'], 2)
            pen.line((front[0] + px_ * 6, front[1] + py_ * 6), (hx + ax * 3, hy + ay * 3), (220, 220, 210, 255), 1)
            pen.line((front[0] - px_ * 6, front[1] - py_ * 6), (hx + ax * 3, hy + ay * 3), (220, 220, 210, 255), 1)
            pen.circle(hx - ax * 2, hy - ay * 2 + 1, 1.2, pal['gold'])
    elif family in ('staff', 'wand'):
        L1, L2 = (10, 17) if family == 'staff' else (3, 9)
        top = (hx + dx * L2, hy + dy * L2)
        bot = (hx - dx * L1, hy - dy * L1)
        pen.line(bot, top, shade(pal['wood'], 0.7), 3 if family == 'staff' else 2)
        pen.line(bot, top, pal['wood'], 2 if family == 'staff' else 1)
        g = p.get('glow', 0.3)
        gc = pal['glow']
        if family == 'staff':
            pen.line((top[0] - nx * 2.5, top[1] - ny * 2.5), (top[0] + dx * 2 - nx * 1, top[1] + dy * 2 - ny * 1), pal['gold'], 1)
            pen.line((top[0] + nx * 2.5, top[1] + ny * 2.5), (top[0] + dx * 2 + nx * 1, top[1] + dy * 2 + ny * 1), pal['gold'], 1)
            orb = (top[0] + dx * 2, top[1] + dy * 2)
            if g > 0.5:
                pen.circle(*orb, 2 + g * 2.2, gc[:3] + (int(90 * g),))
            pen.circle(*orb, 1.8, pal['gem'])
            pen.px(orb[0] - 0.6, orb[1] - 0.6, (255, 255, 255, 255))
        else:
            if g > 0.4:
                pen.circle(*top, 1 + g * 2, gc[:3] + (int(110 * g),))
            pen.px(*top, pal['gem'])
        if p.get('circle', 0) > 0.3 and not offhand:
            k = p['circle']
            c = T(p, 'chest')
            for i in range(10):
                a = i / 10 * math.tau + k * 2
                pen.px(c[0] + math.cos(a) * 13 * k, 61 + math.sin(a) * 2.2, gc[:3] + (180,))
    elif family == 'tome':
        cx, cy = hx, hy - 1
        pen.rect(cx - 3.5, cy - 3, cx + 3.5, cy + 3, shade(pal['wood'], 0.8))
        pen.rect(cx - 3, cy - 2.5, cx + 3, cy + 2.5, pal['wood'] if pal_key == 'a' else hexc('#5a2a3a'))
        pen.line((cx, cy - 2.5), (cx, cy + 2.5), pal['gold'], 1)
        pen.px(cx + 1.5, cy, pal['gem'])
    elif family == 'orb':
        g = p.get('glow', 0.3)
        cx, cy = hx + 1, hy - 5 + math.sin(g * 6) * 0.5
        pen.circle(cx, cy, 3 + g, pal['glow'][:3] + (70,))
        pen.shaded_ellipse(cx, cy, 2.4, 2.4, pal['gem'])
    return outline(img)


# visual families per class (key -> (family, palette, offhand))
CLASS_WEAPONS = {
    'warrior': {
        'sword_a': ('sword', 'a', False), 'sword_b': ('sword', 'b', False),
        'axe_a': ('axe', 'a', False), 'axe_b': ('axe', 'b', False),
        'greatsword_a': ('greatsword', 'a', False), 'greatsword_b': ('greatsword', 'b', False), 'greatsword_blood': ('greatsword', 'blood', False),
        'off_sword_a': ('sword', 'a', True), 'off_sword_b': ('sword', 'b', True), 'off_axe_a': ('axe', 'a', True), 'off_axe_b': ('axe', 'b', True),
        'shield_a': ('shield', 'a', True), 'shield_b': ('shield', 'b', True), 'shield_stone': ('shield', 'stone', True),
    },
    'ranger': {
        'bow_a': ('bow', 'a', False), 'bow_b': ('bow', 'b', False), 'bow_green': ('bow', 'green', False),
        'crossbow_a': ('crossbow', 'a', False), 'crossbow_b': ('crossbow', 'b', False),
        'dagger_a': ('dagger', 'a', False), 'dagger_b': ('dagger', 'b', False),
        'off_dagger_a': ('dagger', 'a', True), 'off_dagger_b': ('dagger', 'b', True),
    },
    'mage': {
        'staff_a': ('staff', 'a', False), 'staff_b': ('staff', 'b', False), 'staff_storm': ('staff', 'storm', False),
        'wand_a': ('wand', 'a', False), 'wand_b': ('wand', 'b', False),
        'tome_a': ('tome', 'a', True), 'tome_b': ('tome', 'b', True), 'orb_a': ('orb', 'a', True),
    },
}
CLASS_ARMORS = {'warrior': ['plate_iron', 'plate_steel', 'plate_blood'], 'ranger': ['leather_brown', 'leather_dark', 'leather_green'], 'mage': ['cloth_blue', 'cloth_violet', 'cloth_arcane']}
CLASS_HELMETS = {'warrior': ['helm_iron', 'helm_steel', 'helm_blood', 'crown_roots'], 'ranger': ['hood_brown', 'hood_dark', 'hood_green', 'crown_roots'], 'mage': ['hat_blue', 'hat_violet', 'hat_arcane', 'crown_roots']}
