"""Backgrounds & effects: Stockholm harbor, crowd, water, wind, underwater, recovery rig."""
from ship import *

HZ = 1000          # horizon (screen y at camera scale 1)
WL = 1230          # harbor water surface level used for the ship

SKY_TOP = '#BFD8E6'
SKY_BOT = '#EEF0E0'
WATER_TOP = '#9FC4DA'
WATER_BOT = '#5F93BD'


def gradient_rect(cv, x0, y0, x1, y1, c0, c1, bands=14, alpha=1.0):
    p = skia.Paint(AntiAlias=False)
    for i in range(bands):
        a = i / bands; b = (i + 1) / bands
        p.setColor(C(mix_color(c0, c1, (a + b) / 2)))
        p.setAlphaf(alpha)
        cv.drawRect(skia.Rect.MakeLTRB(x0, y0 + (y1 - y0) * a, x1, y0 + (y1 - y0) * b + 1), p)


def tex_rect(cv, x0, y0, x1, y1, color, alpha=0.25, variant=0):
    path = skia.Path(); path.addRect(skia.Rect.MakeLTRB(x0, y0, x1, y1))
    fill_path(cv, path, color, alpha, True, variant, opaque=False)


def cloud(cv, x, y, s, seed, alpha=1.0):
    pts = []
    bumps = [(-70, 0, 38), (-30, -26, 44), (18, -34, 48), (60, -14, 40), (82, 6, 28), (-90, 10, 26)]
    # outline built from circle arcs of the bumps (approximate with union of ellipses)
    path = skia.Path()
    for bx, by, r in bumps:
        path.addOval(skia.Rect.MakeXYWH(x + (bx - r) * s, y + (by - r) * s, 2 * r * s, 2 * r * s * 0.82))
    path.addRect(skia.Rect.MakeLTRB(x - 92 * s, y - 6 * s, x + 100 * s, y + 24 * s))
    p = skia.Paint(AntiAlias=True); p.setColor(C('#FBF7EC')); p.setAlphaf(alpha)
    cv.drawPath(path, p)
    # pencil outline: only the top bumps
    for k_, (bx, by, r) in enumerate(bumps[:5]):
        a0 = math.pi * 1.05; a1 = math.pi * 1.95
        line(cv, ellipse_pts(x + bx * s, y + by * s, r * s, r * s * 0.82, 10, a0, a1), 2.6, INK_SOFT, seed=(seed, k_), amp=0.6, alpha=0.55 * alpha)
    line(cv, [(x - 95 * s, y + 24 * s), (x + 100 * s, y + 24 * s)], 2.2, INK_SOFT, seed=(seed, 'b'), amp=0.6, alpha=0.35 * alpha)


def tree(cv, x, y, s, bend, t, seed, color='#6E9B4E'):
    sway = math.sin(t * 2.4 + seed) * 0.03 + bend * 0.32 + math.sin(t * 9 + seed) * 0.05 * bend
    line(cv, [(x, y), (x + math.sin(sway) * 30 * s, y - 34 * s)], 6 * s, WOOD_D, seed=('tt', seed), amp=0.4)
    cx = x + math.sin(sway) * 44 * s; cy = y - 52 * s
    pts = ellipse_pts(cx, cy, 30 * s * (1 + 0.15 * bend), 26 * s, 16)
    pts = [(px + (py - (y)) * -sway * 0.15, py) for px, py in pts]
    shape(cv, pts, color, INK, 2.6, seed=('tr', seed), amp=1.2, double=False)
    hatch(cv, pts, '#466E33', spacing=8, angle=-0.9, lw=1.8, alpha=0.35, seed=('trh', seed))


def house(cv, x, y, w, h, color, roof, seed, gable='step', win_rows=2):
    """x,y bottom-left"""
    if gable == 'step':
        st = w / 6
        pts = [(x, y), (x, y - h), (x + st, y - h), (x + st, y - h - st * 0.9), (x + 2 * st, y - h - st * 0.9), (x + 2 * st, y - h - st * 1.8),
               (x + 4 * st, y - h - st * 1.8), (x + 4 * st, y - h - st * 0.9), (x + 5 * st, y - h - st * 0.9), (x + 5 * st, y - h), (x + w, y - h), (x + w, y)]
        shape(cv, pts, color, INK, 2.6, seed=('h', seed), amp=0.7, double=False, step=8)
    else:
        shape(cv, [(x, y), (x, y - h), (x + w, y - h), (x + w, y)], color, INK, 2.6, seed=('h', seed), amp=0.7, double=False, step=8)
        shape(cv, [(x - 4, y - h), (x + w / 2, y - h - w * 0.55), (x + w + 4, y - h)], roof, INK, 2.6, seed=('r', seed), amp=0.7, double=False, step=8)
    cols = max(1, int(w / 22))
    for r in range(win_rows):
        for c in range(cols):
            wx = x + (c + 0.5) * w / cols
            wy = y - h * (0.3 + 0.38 * r)
            shape(cv, [(wx - 4, wy - 6), (wx + 4, wy - 6), (wx + 4, wy + 6), (wx - 4, wy + 6)], '#3E4A6A', None, 0, seed=('w', seed, r, c), amp=0.3, tex=False, step=6)


def church(cv, x, y, s, seed, color='#D9B98A'):
    shape(cv, [(x - 26 * s, y), (x - 26 * s, y - 150 * s), (x + 26 * s, y - 150 * s), (x + 26 * s, y)], color, INK, 2.8, seed=('ch', seed), amp=0.8, double=False)
    shape(cv, [(x - 30 * s, y - 150 * s), (x, y - 260 * s), (x + 30 * s, y - 150 * s)], '#6FA58E', INK, 2.8, seed=('cs', seed), amp=0.8, double=False)
    line(cv, [(x, y - 260 * s), (x, y - 285 * s)], 2.4, INK, seed=('cx', seed))
    for r in range(3):
        shape(cv, [(x - 6 * s, y - (40 + r * 38) * s), (x + 6 * s, y - (40 + r * 38) * s), (x + 6 * s, y - (58 + r * 38) * s), (x - 6 * s, y - (58 + r * 38) * s)],
              '#3E4A6A', None, 0, seed=('cw', seed, r), tex=False, step=6)


def castle(cv, x, y, s, seed):
    """Tre Kronor castle: block + tower with three crowns"""
    shape(cv, [(x - 90 * s, y), (x - 90 * s, y - 70 * s), (x + 60 * s, y - 70 * s), (x + 60 * s, y)], '#E6D3AE', INK, 2.8, seed=('cb', seed), amp=0.8, double=False)
    shape(cv, [(x - 94 * s, y - 70 * s), (x - 15 * s, y - 112 * s), (x + 64 * s, y - 70 * s)], '#8E3B2F', INK, 2.8, seed=('cr', seed), amp=0.8, double=False)
    shape(cv, [(x + 18 * s, y - 60 * s), (x + 18 * s, y - 190 * s), (x + 50 * s, y - 190 * s), (x + 50 * s, y - 60 * s)], '#E9D9B6', INK, 2.8, seed=('ct', seed), amp=0.8, double=False)
    shape(cv, [(x + 14 * s, y - 190 * s), (x + 34 * s, y - 250 * s), (x + 54 * s, y - 190 * s)], '#6FA58E', INK, 2.8, seed=('ctr', seed), amp=0.8, double=False)
    for k_ in range(3):
        circle(cv, x + 34 * s, y - (262 + k_ * 14) * s, 5 * s, GOLD, INK, 1.6, seed=('cc', seed, k_), double=False)
    for r in range(2):
        for c in range(5):
            wx = x - 75 * s + c * 26 * s; wy = y - (22 + r * 26) * s
            shape(cv, [(wx - 4, wy - 6), (wx + 4, wy - 6), (wx + 4, wy + 6), (wx - 4, wy + 6)], '#3E4A6A', None, 0, seed=('caw', seed, r, c), tex=False, step=6)


def windmill(cv, x, y, s, t, seed, speed=1.0):
    shape(cv, [(x - 16 * s, y), (x - 10 * s, y - 70 * s), (x + 10 * s, y - 70 * s), (x + 16 * s, y)], '#E2CFA6', INK, 2.4, seed=('wm', seed), amp=0.6, double=False)
    cx, cy = x, y - 66 * s
    a0 = t * 1.6 * speed
    for k_ in range(4):
        a = a0 + k_ * math.pi / 2
        ex, ey = cx + math.cos(a) * 52 * s, cy + math.sin(a) * 52 * s
        px, py = -math.sin(a) * 8 * s, math.cos(a) * 8 * s
        shape(cv, [(cx + math.cos(a) * 10 * s, cy + math.sin(a) * 10 * s), (ex, ey), (ex + px, ey + py), (cx + math.cos(a) * 10 * s + px, cy + math.sin(a) * 10 * s + py)],
              '#F3E8CF', INK, 1.8, seed=('wb', seed, k_), amp=0.3, double=False, step=8)


def far_shores(cv, t, bend=0.0, hz=HZ, crowd_shore=1.0, react=0.0):
    # distant islands
    isl = [(-50, hz + 4)] + [(x, hz - 18 - 14 * math.sin(x * 0.012 + 1) - 8 * math.sin(x * 0.031)) for x in range(-50, 1140, 60)] + [(1140, hz + 4)]
    shape(cv, isl, '#A9BCA6', INK_SOFT, 2.0, seed='isl', amp=1.0, double=False, alpha=0.8)
    # left shore: Gamla stan
    land = [(-60, hz + 50), (-60, hz - 40), (380, hz - 30), (420, hz + 4), (430, hz + 50)]
    shape(cv, land, '#B9A27A', INK, 3, seed='landL', amp=1.2)
    xs = [(-40, 64, 96, '#D9A45B', 'step'), (22, 56, 120, '#C4683F', 'step'), (78, 60, 88, '#EAD7B0', 'gable'), (150, 56, 104, '#D98E5B', 'step'),
          (300, 54, 82, '#E2C27A', 'gable'), (350, 46, 70, '#C4683F', 'step')]
    castle(cv, 210, hz - 30, 0.95, 'tk')
    church(cv, 120, hz - 112, 0.8, 'sk')
    for i, (x, w, h, c, g) in enumerate(xs):
        house(cv, x, hz - 30, w, h, c, '#8E3B2F', ('L', i), g)
    for i, x in enumerate([10, 140, 270, 330]):
        tree(cv, x, hz - 28, 0.8, bend, t, 10 + i)
    # right shore: Södermalm hills with windmill
    land = [(650, hz + 50), (680, hz - 20), (760, hz - 70), (900, hz - 110), (1030, hz - 120), (1140, hz - 110), (1140, hz + 50)]
    shape(cv, land, '#A6A876', INK, 3, seed='landR', amp=1.2)
    hatch(cv, land, '#7B8550', spacing=10, angle=-0.6, lw=1.6, alpha=0.25, seed='landRh')
    windmill(cv, 980, hz - 118, 1.0, t, 'wm1', 1 + 2.5 * bend)
    for i, (x, w, h, c, g) in enumerate([(700, 50, 60, '#EAD7B0', 'gable'), (760, 52, 74, '#C4683F', 'step'), (850, 46, 58, '#D9A45B', 'gable')]):
        yb = hz - 20 - (x - 680) * 0.45
        house(cv, x, yb + 18, w, h, c, '#8E3B2F', ('R', i), g, win_rows=1)
    for i, x in enumerate([730, 830, 910, 1060]):
        yb = hz - 20 - min(110, (x - 680) * 0.45)
        tree(cv, x, yb + 16, 0.85, bend, t, 30 + i)
    # tiny crowds on far quays
    if crowd_shore > 0:
        for i in range(16):
            x = 250 + i * 9 if i < 8 else 690 + (i - 8) * 10
            y = hz + 2 if i < 8 else hz - 8
            bob = math.sin(t * 5 + i) * 1.2
            col = ['#4E6A8E', '#9C4A3E', '#5D7A4A', '#6A5A8E'][i % 4]
            shape(cv, [(x - 3, y), (x - 3, y - 10 + bob), (x + 3, y - 10 + bob), (x + 3, y)], col, None, 0, seed=('fc', i), tex=False, step=6)
            circle(cv, x, y - 13 + bob, 2.8, '#8C6A4A', None, 0, seed=('fch', i), double=False)
            if react > 0.3:
                line(cv, [(x - 3, y - 9 + bob), (x - 5, y - 17 + bob)], 1.4, col, seed=('fca', i))
                line(cv, [(x + 3, y - 9 + bob), (x + 5, y - 17 + bob)], 1.4, col, seed=('fcb', i))


def sky(cv, t, hz=HZ, cloud_speed=1.0, top=0):
    gradient_rect(cv, -200, top - 400, W + 200, hz + 10, SKY_TOP, SKY_BOT, 16)
    tex_rect(cv, -200, top - 400, W + 200, hz + 10, '#9CC0D6', 0.16)
    for i, (x0, y0, s) in enumerate([(160, 640, 1.0), (760, 560, 1.25), (520, 800, 0.8), (1000, 760, 0.7)]):
        x = (x0 + t * 14 * cloud_speed * (1 + i * 0.2)) % 1500 - 210
        cloud(cv, x, y0, s, ('cl', i))


def water_back(cv, t, hz=HZ, bottom=H + 400):
    gradient_rect(cv, -200, hz, W + 200, bottom, WATER_TOP, WATER_BOT, 18)
    tex_rect(cv, -200, hz, W + 200, bottom, '#4D84B0', 0.22, 1)
    wave_strokes(cv, t, hz + 30, bottom, density=1.0)


def wave_strokes(cv, t, y0, y1, density=1.0, alpha=0.7, speed=1.0, seed=0, x0=-100, x1=W + 100, color='#EAF3F7'):
    rows = int((y1 - y0) / 46 * density)
    for r in range(rows):
        yy = y0 + (r + 0.5) * (y1 - y0) / rows
        depth = (yy - y0) / max(1, (y1 - y0))
        n = 3 + int(depth * 3)
        sc = 0.6 + depth * 1.2
        for k_ in range(n):
            ph = hsh(seed, r, k_)
            xx = x0 + ((ph * (x1 - x0) + t * 18 * speed * (1 + ph)) % (x1 - x0))
            yo = math.sin(t * 2 + ph * 6) * 3
            a = 0.5 + 0.5 * math.sin(t * 1.5 + ph * 10)
            pts = [(xx - 22 * sc, yy + yo), (xx - 8 * sc, yy - 6 * sc + yo), (xx + 6 * sc, yy + yo), (xx + 20 * sc, yy - 5 * sc + yo)]
            line(cv, pts, 2.2 + depth, color, seed=(seed, 'ws', r, k_), amp=0.5, alpha=alpha * (0.4 + 0.6 * a), step=6)


def water_front(cv, t, yw, x0=-200, x1=W + 200, bottom=H + 400, alpha=0.9, hz=HZ, foam_x=None, foam_w=150):
    """water band in front of the ship starting at surface yw"""
    pts = [(x0, bottom)] + [(x, yw + math.sin(x * 0.03 + t * 2.4) * 3 + math.sin(x * 0.011 - t * 1.3) * 2) for x in range(int(x0), int(x1) + 1, 24)] + [(x1, bottom)]
    path = path_from(np.asarray(pts, float), True, False)
    # match background gradient: top color depends on yw depth
    k = clamp((yw - hz) / (H - hz))
    c0 = mix_color(WATER_TOP, WATER_BOT, k)
    cv.save(); cv.clipPath(path, doAntiAlias=True)
    gradient_rect(cv, x0, yw - 10, x1, bottom, c0, WATER_BOT, 12, alpha)
    tex_rect(cv, x0, yw - 10, x1, bottom, '#4D84B0', 0.2 * alpha, 1)
    wave_strokes(cv, t, yw + 30, min(bottom, H + 50), 1.0, 0.6 * alpha, seed='wf')
    cv.restore()
    line(cv, pts[1:-1], 3.2, '#3E6E9A', seed='wfl', amp=0.8, alpha=0.85 * alpha)
    if foam_x is not None:
        for k_ in range(5):
            fx = foam_x + (k_ - 2) * foam_w / 2.5
            fy = yw + math.sin(t * 3 + k_) * 3
            line(cv, [(fx - 24, fy + 2), (fx - 10, fy - 7), (fx + 4, fy + 1), (fx + 18, fy - 6), (fx + 30, fy + 2)], 3.6, '#FFFFFF', seed=('foam', k_), amp=0.6, alpha=0.9)


def ripples(cv, t, x, y, t0, n=3, alpha=1.0, scale=1.0):
    for k_ in range(n):
        age = t - t0 - k_ * 0.35
        if age <= 0:
            continue
        r = (40 + age * 160) * scale
        a = clamp(1 - age / 2.2) * alpha
        if a <= 0:
            continue
        line(cv, ellipse_pts(x, y, r, r * 0.16, 30), 3.2, '#EAF3F7', seed=('rip', k_), amp=0.8, alpha=a)
        line(cv, ellipse_pts(x, y + 3, r, r * 0.16, 30), 2, '#3E6E9A', seed=('ripd', k_), amp=0.8, alpha=a * 0.6)


def splash(cv, t, x, y, t0, size=1.0, alpha=1.0):
    age = t - t0
    if age < 0 or age > 1.6:
        return
    k = ease_out(age / 0.6)
    fall = clamp((age - 0.5) / 1.0)
    a = alpha * (1 - fall)
    for i in range(9):
        ang = math.pi * (0.15 + 0.7 * i / 8)
        hgt = (120 + 60 * hsh('sp', i)) * size * k * (1 - fall * 0.8)
        wdt = 18 * size
        bx = x + math.cos(ang) * 120 * size * (0.3 + 0.7 * k) * (1 if i % 2 else 0.8)
        tip = (bx + math.cos(ang) * hgt * 0.6, y - math.sin(ang) * hgt)
        pts = [(bx - wdt, y), (tip[0] - 4, tip[1] + 10), tip, (tip[0] + 4, tip[1] + 10), (bx + wdt, y)]
        shape(cv, pts, '#DCEEF7', '#3E6E9A', 2.6, seed=('spl', i), amp=0.8, alpha=a, double=False, step=8)
    for i in range(10):
        dx = (hsh('dr', i) - 0.5) * 300 * size
        dy = -(80 + 150 * hsh('dy', i)) * size * k + fall * 260 * size
        circle(cv, x + dx * k, y + dy, 7 * size, '#DCEEF7', '#3E6E9A', 1.8, seed=('drp', i), alpha=a, double=False)


def wind_line(cv, pts_fn, t, t0, t1, seed, lw=4.5, alpha=1.0, color=INK_SOFT, head=0.0, tail=0.0):
    """animated wind swoosh: pts_fn(u)->(x,y) for u in [0,1]; visible segment [tail, head]"""
    if head <= tail:
        return
    n = 40
    us = [tail + (head - tail) * i / n for i in range(n + 1)]
    pts = [pts_fn(u) for u in us]
    line(cv, pts, lw, color, seed=seed, amp=0.8, alpha=alpha, step=8)


def swirl_fn(x0, y0, x1, y1, curl=1.0, loopr=50, loopu=0.65, amp=40, phase=0.0):
    def f(u):
        x = lerp(x0, x1, u)
        y = lerp(y0, y1, u) + math.sin(u * 6.0 + phase) * amp * 0.4
        # loop near loopu
        d = (u - loopu) / 0.12
        if -1 < d < 1 and curl > 0:
            a = (d + 1) * math.pi
            x += math.sin(a) * loopr * curl * (1 if x1 > x0 else -1)
            y += (1 - math.cos(a)) * -loopr * 0.8 * curl
        return (x, y)
    return f


def gust_lines(cv, t, t0, strength=1.0, direction=-1, y_range=(560, 1150), n=6, seed='g', alpha=0.9):
    """sweeping wind lines from right to left (direction -1)"""
    for i in range(n):
        st = t0 + i * 0.12
        age = t - st
        if age < 0:
            continue
        dur = 1.1
        cyc = age % 1.6
        head = clamp(cyc / dur * 1.3)
        tail = clamp((cyc - 0.35) / dur * 1.3)
        y = y_range[0] + (y_range[1] - y_range[0]) * hsh(seed, i)
        x0, x1 = (W + 80, -80) if direction < 0 else (-80, W + 80)
        f = swirl_fn(x0, y, x1, y + 30, curl=1.0 if i % 2 == 0 else 0.0, loopr=36, loopu=0.4 + 0.3 * hsh(seed, 'l', i), amp=30, phase=i)
        wind_line(cv, f, t, st, st + dur, (seed, i), lw=4.2, alpha=alpha * strength, head=head, tail=tail)


def bubble(cv, x, y, r, alpha=1.0, seed=0):
    circle(cv, x, y, r, None, '#CFE8EE', 2.2, seed=('bb', seed), alpha=alpha, double=False)
    line(cv, ellipse_pts(x - r * 0.25, y - r * 0.25, r * 0.45, r * 0.45, 6, math.pi * 1.1, math.pi * 1.6), 1.8, '#FFFFFF', seed=('bbh', seed), alpha=alpha)


def seaweed(cv, x, y, h, t, seed, color='#4F8A5B', lw=7, sway=1.0, leaves=1.0):
    pts = []
    for i in range(14):
        u = i / 13
        pts.append((x + math.sin(t * 1.6 + u * 3 + seed) * 18 * u * sway, y - h * u))
    line(cv, pts, lw, color, seed=('sw', seed), amp=0.8)
    for i in range(3, 13, 3):
        if leaves <= 0.05:
            break
        u = i / 13
        px, py = pts[i]
        sgn = 1 if i % 2 else -1
        shape(cv, ellipse_pts(px + sgn * 12 * leaves, py, 12 * leaves, 5 * leaves, 8), color, INK_SOFT, 1.6, seed=('swl', seed, i), amp=0.4, double=False, alpha=leaves)


def calendar_page(cv, x, y, s, rot, alpha, seed, tear=0.0):
    cv.save(); cv.translate(x, y); cv.rotate(rot); cv.scale(s, s)
    pg = [(-40, -50), (40, -50), (40, 50), (-40, 50)]
    shape(cv, pg, '#FBF7EC', INK, 2.6, seed=('cp', seed), amp=0.8, alpha=alpha, double=False)
    shape(cv, [(-40, -50), (40, -50), (40, -30), (-40, -30)], '#C8483A', INK, 2.2, seed=('cpt', seed), amp=0.5, alpha=alpha, double=False)
    for k_ in (-22, 0, 22):
        circle(cv, k_, -50, 4, '#FBF7EC', INK, 1.6, seed=('cpr', seed, k_), alpha=alpha, double=False)
    # scribble lines only (no numbers / dates)
    for r in range(4):
        line(cv, [(-28, -14 + r * 15), (-6, -16 + r * 15), (12, -13 + r * 15), (28, -15 + r * 15)], 2.2, INK_SOFT, seed=('cpl', seed, r), amp=1.2, alpha=alpha * 0.6)
    cv.restore()


def time_circle(cv, x, y, r, rot, alpha, seed):
    """round 'calendar circle': ring with tick marks, no numbers"""
    circle(cv, x, y, r, '#E8F1EF', '#CFE8EE', 2.4, seed=('tc', seed), alpha=alpha * 0.55, double=False)
    for k_ in range(12):
        a = rot + k_ * math.pi / 6
        line(cv, [(x + math.cos(a) * r * 0.72, y + math.sin(a) * r * 0.72), (x + math.cos(a) * r * 0.92, y + math.sin(a) * r * 0.92)], 2, '#FFFFFF',
             seed=('tck', seed, k_), alpha=alpha)
    line(cv, [(x, y), (x + math.cos(rot * 3) * r * 0.6, y + math.sin(rot * 3) * r * 0.6)], 2.4, '#FFFFFF', seed=('tch', seed), alpha=alpha)


def pontoon(cv, x, y, w, h, seed, alpha=1.0):
    pts = [(x - w / 2 + h / 2, y - h / 2)] + ellipse_pts(x + w / 2 - h / 2, y, h / 2, h / 2, 10, -math.pi / 2, math.pi / 2) + \
          [(x - w / 2 + h / 2, y + h / 2)] + ellipse_pts(x - w / 2 + h / 2, y, h / 2, h / 2, 10, math.pi / 2, 1.5 * math.pi)
    shape(cv, pts, '#7D8C88', INK, 3.4, seed=('pt', seed), amp=0.8, alpha=alpha)
    hatch(cv, pts, '#4F5C5A', spacing=10, angle=0.0, lw=1.8, alpha=0.3 * alpha, seed=('pth', seed))
    for k_ in range(int(w / 40)):
        circle(cv, x - w / 2 + 30 + k_ * 40, y - h * 0.25, 3, '#4F5C5A', None, 0, seed=('rv', seed, k_), alpha=alpha, double=False)


def crane(cv, x, y, s, flip, seed, alpha=1.0, t=0.0):
    """simple lattice crane on a barge; (x,y) = deck base"""
    cv.save(); cv.translate(x, y); cv.scale(flip * s, s)
    shape(cv, [(-110, 0), (110, 0), (95, 40), (-95, 40)], '#6E7C78', INK, 3, seed=('bg', seed), amp=0.8, alpha=alpha)
    shape(cv, [(-30, 0), (-30, -60), (30, -60), (30, 0)], '#D9B14E', INK, 2.8, seed=('cab', seed), amp=0.6, alpha=alpha, double=False)
    jib = [(0, -60), (190, -300)]
    line(cv, jib, 9, '#D9B14E', seed=('jib', seed), alpha=alpha)
    for k_ in range(6):
        u0 = k_ / 6; u1 = (k_ + 1) / 6
        line(cv, [(lerp(-6, 184, u0), lerp(-66, -306, u0)), (lerp(6, 196, u1), lerp(-54, -294, u1))], 2, INK, seed=('lat', seed, k_), alpha=alpha * 0.7)
    line(cv, [(0, -60), (-60, -10)], 4, '#D9B14E', seed=('cbk', seed), alpha=alpha)
    cv.restore()


def rope_border(cv, k, t, x0=34, y0=470, x1=W - 34, y1=H - 28, seed='rb', alpha=1.0):
    """cable that becomes the final frame border; k = drawn fraction"""
    if k <= 0:
        return
    pts = [(x0, y0), (x1, y0), (x1, y1), (x0, y1), (x0, y0)]
    P = wobble_pts(pts, False, 1.4, seed, 12)
    path = path_from(P, False)
    p = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=7, StrokeCap=skia.Paint.kRound_Cap, StrokeJoin=skia.Paint.kRound_Join)
    p.setColor(C('#8C6B45')); p.setAlphaf(alpha)
    set_trim(p, k)
    cv.drawPath(path, p)
    # twisted-rope look: short diagonal ticks along the drawn part
    meas = skia.PathMeasure(path, False)
    total = meas.getLength() * clamp(k)
    d = (t * 20) % 16
    while d < total:
        pos = meas.getPosTan(d)
        if pos:
            (px_, py_), (tx_, ty_) = pos[0], pos[1]
            nx, ny = -ty_, tx_
            q = skia.Paint(AntiAlias=True, StrokeWidth=2.2, StrokeCap=skia.Paint.kRound_Cap)
            q.setColor(C(INK)); q.setAlphaf(alpha * 0.7)
            cv.drawLine(px_ - nx * 4 - tx_ * 3, py_ - ny * 4 - ty_ * 3, px_ + nx * 4 + tx_ * 3, py_ + ny * 4 + ty_ * 3, q)
        d += 16


def quay(cv, y, t, seed='q'):
    pts = [(-40, y), (W + 40, y), (W + 40, H + 60), (-40, H + 60)]
    shape(cv, pts, '#A89A84', INK, 3.6, seed=seed, amp=1.2)
    for r in range(3):
        for c in range(9):
            x = -40 + c * 136 + (r % 2) * 68
            yy = y + 18 + r * 44
            shape(cv, [(x + 6, yy), (x + 128, yy), (x + 128, yy + 38), (x + 6, yy + 38)], '#B8AB94', INK_SOFT, 2.0, seed=(seed, r, c), amp=0.8, double=False)
    # mooring posts
    for x in (90, 990):
        shape(cv, [(x - 16, y + 6), (x - 16, y - 40), (x + 16, y - 40), (x + 16, y + 6)], WOOD_D, INK, 3, seed=(seed, 'post', x), amp=0.6, double=False)


CROWD = []
_r = np.random.default_rng(21)
for i in range(13):
    x = 40 + i * 82 + _r.uniform(-18, 18)
    CROWD.append(dict(x=x, s=_r.uniform(1.55, 1.95), col=['#4E6A8E', '#9C4A3E', '#5D7A4A', '#6A5A8E', '#8E6A3E', '#A0503A', '#3F6A6A'][i % 7],
                      hat=['wide', 'bonnet', 'cap', None, 'wide', 'bonnet', 'wide'][i % 7], ph=_r.uniform(0, 6.28), delay=_r.uniform(0, 0.4),
                      kind=i % 3))


def crowd(cv, t, y, react=0.0, react_t0=0.0, mode='raise', alpha=1.0, front_shift=0.0):
    """foreground spectators seen from behind. react 0..1"""
    for i, pd in enumerate(CROWD):
        x = pd['x'] + front_shift
        bob = math.sin(t * 3.2 + pd['ph']) * 3
        r = clamp(react - pd['delay'] * 0.6) if react > 0 else 0
        if mode == 'raise':
            arms = 0.0 + r * (0.75 + 0.2 * math.sin(t * 6 + pd['ph']))
        elif mode == 'head':
            arms = r * 0.5
        elif mode == 'wave':
            arms = r * (0.6 + 0.35 * math.sin(t * 7 + pd['ph']))
        else:
            arms = 0
        if pd['kind'] == 2 and mode == 'raise':
            arms = r * 0.5  # some put hands to head
        lean = math.sin(t * 1.3 + pd['ph']) * 0.03 - r * 0.05
        person(cv, x, y + 160 + bob * 0.5 + (i % 2) * 26, pd['s'] * 100, pd['col'], hat=pd['hat'], arms=arms, lean=lean, seed=('cr', i), back=True)
