"""Vasa drawings: stern-quarter view, cross-section, side view."""
from lib import *

WOOD = '#8B5A3A'
WOOD_D = '#5E3B28'
WOOD_L = '#B07A4E'
RED = '#B8443A'
GOLD = '#E3B13A'
GOLD_D = '#B98522'
BLUE = '#3C64A8'
SAIL = '#F3E8CF'
SAIL_SH = '#D9C7A0'
DARKPORT = '#2A2238'
SWE_B = '#2F64B0'
SWE_Y = '#F2C531'
PRES = '#5A4030'      # preserved dark wood
PRES_D = '#3E2C22'
PRES_L = '#76563F'


def sparkle(cv, x, y, s, alpha=1.0, color='#FFF6C8'):
    if alpha <= 0.01 or s <= 0.5:
        return
    pts = []
    for i in range(8):
        a = i * math.pi / 4
        r = s if i % 2 == 0 else s * 0.28
        pts.append((x + math.cos(a) * r, y + math.sin(a) * r))
    shape(cv, pts, color, GOLD_D, 1.6, seed=('sp', int(x), int(y)), amp=0.3, alpha=alpha, double=False, step=4, tex=False)


def pennant(cv, x, y, length, t, color=SWE_B, color2=SWE_Y, wind=0.0, seed=0, width=16, droop=0.0):
    """long streamer flag waving; attached at (x,y), flowing to the right(+) by default"""
    n = 14
    top = []; bot = []
    for i in range(n + 1):
        u = i / n
        amp = (6 + 16 * u) * (1 - 0.5 * wind)
        wv = math.sin(t * (7 + 6 * wind) - u * 6.0 + seed) * amp
        px = x + length * u * (0.85 + 0.15 * wind)
        py = y + wv + droop * u * u * length * 0.5
        wdt = width * (1 - u * 0.85)
        top.append((px, py - wdt / 2)); bot.append((px, py + wdt / 2))
    pts = top + bot[::-1]
    shape(cv, pts, color, INK, 2.6, seed=('pen', seed), amp=0.8, double=False, step=8)
    # yellow stripe
    mid = [((a[0] + b[0]) / 2, (a[1] + b[1]) / 2) for a, b in zip(top, bot)]
    line(cv, mid[:-2], 3.2, color2, seed=('penm', seed), amp=0.4)


def swedish_flag(cv, x, y, w, h, t, wind=0.0, seed=0, side=1):
    """flag attached at (x,y) top-left, waving"""
    n = 8
    top = []; bot = []
    for i in range(n + 1):
        u = i / n
        wv = math.sin(t * (6 + 8 * wind) - u * 4 + seed) * (3 + 7 * u) * (1 - 0.3 * wind)
        top.append((x + side * w * u, y + wv)); bot.append((x + side * w * u, y + h + wv * 1.1))
    pts = top + bot[::-1]
    shape(cv, pts, SWE_B, INK, 2.6, seed=('fl', seed), amp=0.6, double=False, step=6)
    # cross
    cx_u = 0.36
    vx = [(top[int(cx_u * n)][0], top[int(cx_u * n)][1]), (bot[int(cx_u * n)][0], bot[int(cx_u * n)][1])]
    line(cv, vx, h * 0.22, SWE_Y, seed=('fc', seed), amp=0.3)
    hz = [((a[0] + b[0]) / 2, (a[1] + b[1]) / 2) for a, b in zip(top, bot)]
    line(cv, hz, h * 0.22, SWE_Y, seed=('fh', seed), amp=0.3)


def person(cv, x, y, s, color, hat=None, arms=0.0, lean=0.0, seed=0, face=False, skin='#F0C9A0', back=True, hold=None):
    """tiny storybook person; (x,y) = feet center; s = height scale (1 -> 100px)
    arms: 0 down, 0.5 hands to head, 1 raised"""
    cv.save()
    cv.translate(x, y)
    cv.rotate(lean)
    cv.scale(s / 100.0, s / 100.0)
    # body
    body = [(-17, 0), (-20, -40), (-14, -62), (0, -66), (14, -62), (20, -40), (17, 0)]
    shape(cv, body, color, INK, 3.4, seed=('pb', seed), amp=0.8, double=False, step=8)
    # arms
    for sgn in (-1, 1):
        sx, sy = sgn * 13, -58
        if arms < 0.5:
            k = arms / 0.5
            hx = lerp(sgn * 20, sgn * 10, k); hy = lerp(-25, -84, k)
        else:
            k = (arms - 0.5) / 0.5
            hx = lerp(sgn * 10, sgn * 26, k); hy = lerp(-84, -112, k)
        line(cv, [(sx, sy), ((sx + hx) / 2 + sgn * 6, (sy + hy) / 2), (hx, hy)], 6, color, seed=('pa', seed, sgn), amp=0.5)
        line(cv, [(sx, sy), ((sx + hx) / 2 + sgn * 6, (sy + hy) / 2), (hx, hy)], 2.2, INK, seed=('pa2', seed, sgn), amp=0.5, alpha=0.6)
        circle(cv, hx, hy, 5, skin, INK, 2, seed=('ph', seed, sgn), double=False)
    # head
    circle(cv, 0, -78, 13, skin if not back else '#8C6A4A', INK, 3, seed=('hd', seed), double=False)
    if not back:
        circle(cv, 0, -78, 13, skin, INK, 3, seed=('hd2', seed), double=False)
    if hat == 'wide':
        shape(cv, [(-24, -84), (24, -84), (14, -88), (10, -100), (-10, -100), (-14, -88)], '#3B3346', INK, 2.8, seed=('ht', seed), amp=0.6, double=False, step=6)
    elif hat == 'bonnet':
        shape(cv, ellipse_pts(0, -84, 15, 11, 14, math.pi, 2 * math.pi) + [(15, -80), (-15, -80)], '#F4F0E6', INK, 2.6, seed=('hb', seed), amp=0.5, double=False, step=6)
    elif hat == 'cap':
        shape(cv, ellipse_pts(0, -86, 13, 8, 12, math.pi, 2 * math.pi), '#A33B33', INK, 2.6, seed=('hc', seed), amp=0.5, double=False, step=6)
    cv.restore()


# =====================================================================================
#  STERN-QUARTER VIEW (looking from behind; port side visible on the left)
#  origin = waterline at the transom centerline; y negative = up. ~ 900 tall.
# =====================================================================================
def port_positions():
    out = []
    for row, (y0, y1, sz) in enumerate([(-46, -38, 25), (-128, -116, 23)]):
        for i in range(6):
            u = i / 5.0
            x = -168 - 165 * (u ** 0.92)
            y = lerp(y0, y1, u)
            s = sz * (1 - 0.45 * u)
            out.append((row, i, x, y, s))
    return out


def ship_stern(cv, t, sail=0.5, gust=0.0, sparkle_a=0.0, crew_brace=0.0, preserved=False, flag_wind=0.3,
               draw_sails=True, lids_open=1.0, seed=0):
    gid = ('st', seed)
    hull_c = PRES if preserved else WOOD
    # ---------------- masts (back to front: fore, main, mizzen)
    masts = [('fore', -178, -795, 300, 225, -470, -695, 0.86),
             ('main', -92, -885, 380, 285, -530, -775, 1.0),
             ('mizzen', -22, -650, 0, 0, 0, 0, 0.92)]
    sway = math.sin(t * 1.3) * 0.004
    for name, mx, top, cw, tw, cy, ty, k in masts:
        # shrouds
        for sx in (-1, 1):
            base_x = mx + sx * (70 if name != 'mizzen' else 50) * k
            for j in range(3):
                line(cv, [(mx, top * 0.72 + j * 30), (base_x + sx * j * 12, -250 if name != 'mizzen' else -330)], 1.4, INK_SOFT,
                     seed=(gid, name, sx, j), amp=0.6, alpha=0.65)
        # mast
        shape(cv, [(mx - 7 * k, -200), (mx - 5 * k, top), (mx + 5 * k, top), (mx + 7 * k, -200)], WOOD_D, INK, 3.0,
              seed=(gid, 'm', name), amp=0.8, double=False)
        # crow's nest
        if name != 'mizzen':
            shape(cv, [(mx - 26 * k, cy - 175 * k), (mx + 26 * k, cy - 175 * k), (mx + 20 * k, cy - 150 * k), (mx - 20 * k, cy - 150 * k)],
                  WOOD, INK, 2.6, seed=(gid, 'cn', name), amp=0.6, double=False)
        if not draw_sails:
            continue
        if name == 'mizzen':
            # lateen sail seen from behind: slim triangle
            b = 22 + 30 * sail + 40 * gust
            pts = [(mx, -620), (mx - 70 - b * 0.6, -420), (mx + 8, -405)]
            pts = bez(pts[0], (mx - 30 - b, -520), pts[1], 10) + [pts[2]]
            shape(cv, pts, SAIL, INK, 3.2, seed=(gid, 'lat'), amp=1.0)
            line(cv, [(mx + 15, -650), (mx - 95 - b * 0.6, -400)], 3.4, WOOD_D, seed=(gid, 'laty'), amp=0.5)
            continue
        for (yy, ww, hh, tag) in [(cy, cw, 170, 'c'), (ty, tw, 200, 't')]:
            ww *= k; hh *= k
            bulge = (10 + 26 * sail + 40 * gust) * k
            side = -1.0  # gust pushes sails to the left (port)
            shift = side * (8 * sail + 45 * gust) * k
            x0, x1 = mx - ww / 2, mx + ww / 2
            yb = yy + hh
            # yard
            top_pts = [(x0, yy), (x1, yy)]
            # sail outline: top edge straight, sides bow out, bottom curves down
            L = bez((x0, yy), (x0 - bulge * 0.35 + shift * 0.5, yy + hh * 0.5), (x0 + 10 + shift, yb), 8)
            R = bez((x1 - 10 + shift, yb), (x1 + bulge * 0.35 + shift * 0.5, yy + hh * 0.5), (x1, yy), 8)
            B = bez((x0 + 10 + shift, yb), (mx + shift, yb + bulge * 0.55), (x1 - 10 + shift, yb), 10)
            pts = L + B[1:] + R[1:]
            flap = math.sin(t * 9 + hsh(name, tag) * 6) * (1.2 + 3 * gust)
            pts = [(p[0] + flap * ((p[1] - yy) / hh) * 0.5, p[1]) for p in pts]
            shape(cv, pts, SAIL, INK, 3.4, seed=(gid, 'sail', name, tag), amp=1.3)
            # seams + shadow fold
            for q in (0.33, 0.66):
                xq = lerp(x0, x1, q)
                line(cv, [(xq, yy + 4), (xq + shift * 0.9, yb + bulge * 0.4 * (1 - abs(q - 0.5)))], 1.6, SAIL_SH,
                     seed=(gid, 'seam', name, tag, q), amp=0.8, alpha=0.9)
            hatch(cv, pts, SAIL_SH, spacing=13, angle=-0.9, lw=2.4, alpha=0.38, seed=(gid, 'sh', name, tag))
            # yard
            line(cv, [(x0 - 14 * k, yy), (x1 + 14 * k, yy)], 7 * k, WOOD_D, seed=(gid, 'yard', name, tag), amp=0.5)
            line(cv, [(x0 - 14 * k, yy), (x1 + 14 * k, yy)], 2.2, INK, seed=(gid, 'yardi', name, tag), amp=0.6, alpha=0.8)
        # pennant at mast top
        if not preserved:
            pennant(cv, mx, top + 6, 120 * k, t, wind=flag_wind, seed=hsh(name) * 5, width=14 * k)

    # ---------------- flank (port side) behind transom
    flank = [(-150, -335), (-232, -262), (-300, -228), (-338, -246), (-356, -236), (-348, -196),
             (-338, -20), (-300, 30), (-200, 55), (-100, 90), (-60, 110)]
    shape(cv, flank, hull_c, INK, 4.2, seed=(gid, 'flank'), amp=1.4)
    hatch(cv, flank, WOOD_D if not preserved else PRES_D, spacing=12, angle=-0.25, lw=2.0, alpha=0.30, seed=(gid, 'fh'))
    # wales / stripes
    for j, (ya, yb, col) in enumerate([(-78, -80, GOLD if not preserved else PRES_L), (-160, -150, RED if not preserved else PRES_L), (-15, -16, WOOD_D)]):
        line(cv, [(-150, ya), (-250, (ya + yb) / 2 + 2), (-345, yb)], 5 if j < 2 else 3, col, seed=(gid, 'wale', j), amp=0.6)
    # bulwark top rail
    line(cv, [(-150, -335), (-232, -262), (-300, -228), (-338, -246)], 6, GOLD if not preserved else PRES_L, seed=(gid, 'rail'), amp=0.6)
    # gun ports
    for row, i, x, y, s in port_positions():
        hs = s / 2
        lid_open = lids_open
        if not preserved:
            # red lid raised (hinged on top) - perspective parallelogram
            ly = y - hs
            lid = [(x - hs, ly), (x + hs, ly), (x + hs - 2, ly - s * 0.85 * lid_open), (x - hs - 2, ly - s * 0.85 * lid_open)]
            shape(cv, lid, RED, INK, 2.2, seed=(gid, 'lid', row, i), amp=0.4, double=False, step=6)
        port = [(x - hs, y - hs), (x + hs, y - hs), (x + hs, y + hs), (x - hs, y + hs)]
        shape(cv, port, DARKPORT, INK, 2.4, seed=(gid, 'port', row, i), amp=0.4, double=False, step=6)
        if not preserved:
            # cannon muzzle
            circle(cv, x - s * 0.08, y + s * 0.05, s * 0.28, '#4B4655', INK, 1.8, seed=(gid, 'muz', row, i), double=False)
            circle(cv, x - s * 0.08, y + s * 0.05, s * 0.12, '#141018', None, 0, seed=(gid, 'muzi', row, i), double=False)

    # ---------------- transom (stern face)
    tr = [(-62, 112), (-118, 4), (-150, -120), (-166, -262), (-150, -362), (-112, -420), (-62, -456), (0, -470),
          (62, -456), (112, -420), (150, -362), (166, -262), (150, -120), (118, 4), (62, 112)]
    base = PRES if preserved else RED
    shape(cv, tr, base, INK, 4.6, seed=(gid, 'tr'), amp=1.5)
    # lower part wood
    low = [(-62, 112), (-118, 4), (-138, -70), (138, -70), (118, 4), (62, 112)]
    shape(cv, low, hull_c, INK, 3.4, seed=(gid, 'trl'), amp=1.0, double=False)
    hatch(cv, low, WOOD_D if not preserved else PRES_D, spacing=11, angle=0.0, lw=2.0, alpha=0.28, seed=(gid, 'trh'))
    # rudder
    shape(cv, [(-14, -90), (14, -90), (16, 120), (-16, 120)], WOOD_D if not preserved else PRES_D, INK, 3, seed=(gid, 'rud'), amp=0.6, double=False)
    dec = GOLD if not preserved else PRES_L
    dec_d = GOLD_D if not preserved else PRES_D
    # gold inner border
    inner = [(p[0] * 0.86, (p[1] + 40) * 0.88 - 40) for p in tr[3:12]]
    line(cv, inner, 5, dec, seed=(gid, 'tib'), amp=0.8)
    # windows row (stern gallery)
    for k_ in range(4):
        wx = -84 + k_ * 56
        win = [(wx - 17, -232), (wx - 17, -262)] + ellipse_pts(wx, -262, 17, 14, 8, math.pi, 2 * math.pi) + [(wx + 17, -262), (wx + 17, -232)]
        shape(cv, win, '#33507E' if not preserved else '#2A2026', INK, 2.6, seed=(gid, 'win', k_), amp=0.5, double=False, step=6)
        line(cv, [(wx, -276), (wx, -232)], 1.6, dec, seed=(gid, 'wm', k_), amp=0.3)
    # balcony rail under windows
    line(cv, [(-128, -222), (128, -222)], 6, dec, seed=(gid, 'bal'), amp=0.7)
    for k_ in range(9):
        bx = -112 + k_ * 28
        line(cv, [(bx, -222), (bx, -200)], 3, dec_d, seed=(gid, 'bp', k_), amp=0.3)
    # coat of arms (blue shield, gold sheaf) high on the transom
    shield = [(-38, -380), (38, -380), (40, -340), (28, -312), (0, -298), (-28, -312), (-40, -340)]
    shape(cv, shield, BLUE if not preserved else PRES_D, INK, 3, seed=(gid, 'sh'), amp=0.6)
    for k_ in range(5):
        sx_ = -12 + k_ * 6
        line(cv, [(sx_, -365), (sx_ * 0.4, -335), (sx_ * 0.9, -318)], 2.6, dec, seed=(gid, 'sheaf', k_), amp=0.3)
    # crowns / lions (gold blobs)
    for sx_ in (-1, 1):
        lion = ellipse_pts(sx_ * 105, -330, 24, 34, 14)
        shape(cv, lion, dec, INK, 2.6, seed=(gid, 'lion', sx_), amp=0.9, double=False)
        circle(cv, sx_ * 105, -356, 12, dec, INK, 2.2, seed=(gid, 'lh', sx_), double=False)
        # small cherubs on the lower panel
        circle(cv, sx_ * 70, -150, 13, dec, INK, 2.2, seed=(gid, 'ch', sx_), double=False)
        line(cv, [(sx_ * 58, -150), (sx_ * 40, -140), (sx_ * 30, -150)], 3, dec, seed=(gid, 'chw', sx_), amp=0.4)
        # columns
        line(cv, [(sx_ * 140, -110), (sx_ * 150, -300)], 6, dec, seed=(gid, 'col', sx_), amp=0.6)
    # crown on top
    crown = [(-34, -455), (-26, -486), (-14, -470), (0, -494), (14, -470), (26, -486), (34, -455)]
    shape(cv, crown, dec, INK, 2.6, seed=(gid, 'crown'), amp=0.5, double=False, step=6)
    # lanterns
    for lx, ly in [(-96, -432), (96, -432), (0, -505)]:
        shape(cv, [(lx - 9, ly), (lx + 9, ly), (lx + 7, ly - 26), (lx, ly - 34), (lx - 7, ly - 26)], dec, INK, 2.4,
              seed=(gid, 'lan', lx), amp=0.4, double=False, step=5)
    # stern flagstaff + flag
    if not preserved:
        line(cv, [(30, -470), (52, -600)], 3.5, WOOD_D, seed=(gid, 'fs'), amp=0.4)
        swedish_flag(cv, 52, -600, 78, 48, t, wind=flag_wind, seed=2)
    # crew near gunwale (tiny)
    if not preserved:
        for j, (cx_, cy_) in enumerate([(-205, -278), (-255, -248), (-300, -232), (-60, -462), (60, -462)]):
            sc = 30 if j < 3 else 26
            ln = -0.35 * crew_brace if j < 3 else 0.25 * crew_brace
            person(cv, cx_, cy_ + 8, sc, ['#4E6A8E', '#9C4A3E', '#5D7A4A', '#6A5A8E', '#8E6A3E'][j], hat='cap' if j % 2 else 'wide',
                   arms=0.0 + 0.45 * crew_brace, lean=ln, seed=('crew', j), back=True)
    # sparkles on gold
    if sparkle_a > 0:
        for j, (sx_, sy_) in enumerate([(-105, -360), (105, -340), (0, -485), (-70, -150), (128, -222), (-140, -200), (0, -340)]):
            ph = (t * 2.2 + j * 0.37) % 1.0
            sparkle(cv, sx_, sy_, 14 * math.sin(ph * math.pi) * sparkle_a, alpha=sparkle_a)


# =====================================================================================
#  CROSS-SECTION (front view) for the balance explanation
#  origin = keel tip (pivot). y up negative. hull ~ 520 wide at top.
# =====================================================================================
SEC_HULL = [(0, 0), (-44, -18), (-110, -80), (-170, -170), (-215, -270), (-238, -370), (-240, -440), (-222, -500),
            (222, -500), (240, -440), (238, -370), (215, -270), (170, -170), (110, -80), (44, -18)]
SEC_WATER_Y = -250


def cannon_profile(cv, x, y, s, facing=-1, seed=0, alpha=1.0, color='#3E3A4C'):
    """cannon on carriage, profile; (x,y) = floor contact center; facing -1 -> muzzle left"""
    cv.save(); cv.translate(x, y); cv.scale(facing * s / 100.0, s / 100.0)
    # carriage
    shape(cv, [(-40, -10), (40, -10), (34, -42), (-30, -38)], WOOD_D, INK, 3.2, seed=('car', seed), amp=0.6, alpha=alpha, double=False)
    for wx in (-26, 26):
        circle(cv, wx, -10, 13, WOOD, INK, 3, seed=('wh', seed, wx), alpha=alpha, double=False)
    # barrel (points to -x)
    barrel = [(-95, -58), (-95, -40), (-30, -34), (30, -38), (46, -46), (46, -60), (30, -66), (-30, -66)]
    shape(cv, barrel, color, INK, 3.4, seed=('bar', seed), amp=0.7, alpha=alpha, double=False)
    circle(cv, 52, -53, 9, color, INK, 2.6, seed=('kn', seed), alpha=alpha, double=False)
    line(cv, [(-70, -62), (-70, -38)], 2.4, '#6A6478', seed=('br1', seed), alpha=alpha)
    line(cv, [(-10, -64), (-10, -36)], 2.4, '#6A6478', seed=('br2', seed), alpha=alpha)
    cv.restore()


def ship_section(cv, t, draw=1.0, cannons=(1, 1, 1, 1), upper=1.0, orn=1.0, water_in=0.0, shift=0.0,
                 show_waterline=1.0, ghost_rows=1.0, seed=0, sparkle_a=0.0, weights=0.0):
    gid = ('sec', seed)
    if draw <= 0:
        return
    # upper structure (stacked decks) grows from deck top (y=-500)
    if upper > 0:
        uh = 170 * upper
        up = [(-200, -500), (-206, -500 - uh * 0.55), (-180, -500 - uh), (180, -500 - uh), (206, -500 - uh * 0.55), (200, -500)]
        shape(cv, up, RED, INK, 4.2, seed=(gid, 'up'), amp=1.2, alpha=min(1, draw * 1.5))
        hatch(cv, up, '#7E2E28', spacing=12, angle=-0.8, lw=2, alpha=0.25, seed=(gid, 'uph'))
        # windows in upper structure
        for k_ in range(5):
            wx = -140 + k_ * 70
            wy = -500 - uh * 0.45
            if upper > 0.5:
                shape(cv, [(wx - 16, wy + 18), (wx - 16, wy - 14), (wx + 16, wy - 14), (wx + 16, wy + 18)], '#33507E', INK, 2.4,
                      seed=(gid, 'uw', k_), amp=0.4, double=False, alpha=smooth((upper - 0.5) * 2))
        line(cv, [(-206, -500 - uh * 0.55), (206, -500 - uh * 0.55)], 5, GOLD, seed=(gid, 'upg'), amp=0.6, alpha=upper)
        # second tier
        if upper > 0.4:
            u2 = smooth((upper - 0.4) / 0.6)
            h2 = 110 * u2
            tier = [(-140, -500 - uh), (-130, -500 - uh - h2), (130, -500 - uh - h2), (140, -500 - uh)]
            shape(cv, tier, '#C25A45', INK, 3.6, seed=(gid, 'up2'), amp=1.0)
            line(cv, [(-130, -500 - uh - h2), (130, -500 - uh - h2)], 5, GOLD, seed=(gid, 'up2g'), amp=0.6, alpha=u2)
    # hull
    sh = SEC_HULL
    if draw < 1:
        P = wobble_pts(sh, True, 1.5, (gid, 'hull'))
        path = path_from(P, True)
        eff = skia.PathEffect.MakeTrim if hasattr(skia.PathEffect, 'MakeTrim') else None
        p = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=5, StrokeCap=skia.Paint.kRound_Cap)
        p.setColor(C(INK))
        set_trim(p, draw)
        fill_path(cv, wpath(sh, True, 1.2, (gid, 'hullf')), WOOD, alpha=smooth((draw - 0.5) * 2) if draw > 0.5 else 0)
        cv.drawPath(path, p)
        return
    shape(cv, sh, WOOD, INK, 5, seed=(gid, 'hull'), amp=1.5)
    # interior (cut face): lighter wood inside walls
    inner = [(0, -40), (-90, -110), (-150, -200), (-192, -290), (-212, -380), (-214, -480), (214, -480), (212, -380), (192, -290), (150, -200), (90, -110)]
    shape(cv, inner, '#E9D3AE', INK_SOFT, 2.6, seed=(gid, 'in'), amp=1.0, double=False)
    hatch(cv, inner, '#C9A878', spacing=16, angle=0.0, lw=1.6, alpha=0.35, seed=(gid, 'inh'))
    # decks
    decks = [(-300, 186), (-400, 208)]  # (y, halfwidth at that y)
    for j, (dy, hw) in enumerate(decks):
        line(cv, [(-hw, dy), (hw, dy)], 7, WOOD_D, seed=(gid, 'deck', j), amp=0.8)
    line(cv, [(-214, -480), (214, -480)], 8, WOOD_D, seed=(gid, 'deckt'), amp=0.8)
    # ballast stones (tiny) at the bottom
    for k_ in range(5):
        circle(cv, -40 + k_ * 20, -60 - (k_ % 2) * 8, 11, '#8C8A86', INK, 2.2, seed=(gid, 'bl', k_), double=False)
    # gun ports in the hull sides (both decks)
    for dy, hw in decks:
        for sx_ in (-1, 1):
            px = sx_ * (hw + 20)
            shape(cv, [(px - 12, dy - 70), (px + 12, dy - 70), (px + 12, dy - 6), (px - 12, dy - 6)], DARKPORT, INK, 2.4,
                  seed=(gid, 'gp', dy, sx_), amp=0.4, double=False)
    # water inside lower deck
    if water_in > 0:
        wl = -300 - 0  # floor
        hgt = 46 * water_in
        tilt = 0
        wpts = [(-186, wl), (-186 + 6, wl - hgt), (186 * water_in, wl - hgt * 0.4), (186 * water_in, wl)]
        shape(cv, wpts, '#5C93C0', INK_SOFT, 2.2, seed=(gid, 'win'), amp=1.0, alpha=0.85, double=False)
    # cannons: rows (ghosts behind) + front
    slots = [(-300, -1, -100), (-300, 1, 100), (-400, -1, -110), (-400, 1, 110)]
    for idx, (dy, facing, cx_) in enumerate(slots):
        a = cannons[idx]
        if a <= 0:
            continue
        drop = (1 - back_out(a)) * -160
        if ghost_rows > 0:
            for g in (2, 1):
                cannon_profile(cv, cx_ + facing * -g * 30 + shift * 20, dy + drop - g * 12, 92 - g * 9, facing, seed=(idx, g),
                               alpha=0.35 * ghost_rows * clamp(a * 2), color='#6A6478')
        cannon_profile(cv, cx_ + shift * 26, dy + drop, 100, facing, seed=(idx, 0), alpha=clamp(a * 3))
    # weight arrows
    if weights > 0:
        for k_, (ax, ay) in enumerate([(-150, -760), (0, -800), (150, -760)]):
            a = smooth((weights - k_ * 0.15) * 2)
            if a <= 0:
                continue
            bob = math.sin(t * 6 + k_) * 6
            line(cv, [(ax, ay + bob), (ax, ay + 80 + bob)], 6, '#7A4FA0', seed=(gid, 'wa', k_), amp=0.8, alpha=a)
            shape(cv, [(ax - 18, ay + 66 + bob), (ax + 18, ay + 66 + bob), (ax, ay + 96 + bob)], '#7A4FA0', '#7A4FA0', 3,
                  seed=(gid, 'wh', k_), amp=0.5, alpha=a, double=False, step=6)
    # ornaments on top
    if orn > 0:
        top_y = -500 - 170 * upper - 110 * smooth((upper - 0.4) / 0.6)
        items = [(-120, 'lion'), (-40, 'crown'), (40, 'crown'), (120, 'lion'), (-200, 'scroll'), (200, 'scroll')]
        for k_, (ox, kind) in enumerate(items):
            a = back_out(clamp(orn * 1.6 - k_ * 0.12))
            if a <= 0.01:
                continue
            cv.save(); cv.translate(ox, top_y if kind != 'scroll' else -560); cv.scale(a, a)
            if kind == 'crown':
                shape(cv, [(-26, 0), (-30, -36), (-16, -22), (0, -44), (16, -22), (30, -36), (26, 0)], GOLD, INK, 3, seed=(gid, 'or', k_), amp=0.5, double=False, step=6)
            elif kind == 'lion':
                shape(cv, ellipse_pts(0, -30, 28, 30, 16), GOLD, INK, 3, seed=(gid, 'or', k_), amp=1.0, double=False)
                circle(cv, 0, -56, 15, GOLD, INK, 2.6, seed=(gid, 'orh', k_), double=False)
            else:
                shape(cv, ellipse_pts(0, 0, 16, 34, 14), GOLD, INK, 3, seed=(gid, 'or', k_), amp=0.8, double=False)
                line(cv, [(0, -20), (6, 0), (0, 20)], 2.4, GOLD_D, seed=(gid, 'ors', k_), amp=0.3)
            cv.restore()
        if sparkle_a > 0:
            for j, (sx_, sy_) in enumerate([(-120, top_y - 60), (40, top_y - 40), (200, -580), (-200, -540), (120, top_y - 70)]):
                ph = (t * 2.0 + j * 0.31) % 1.0
                sparkle(cv, sx_, sy_, 13 * math.sin(ph * math.pi) * sparkle_a, alpha=sparkle_a)
    # waterline marker (dashed blue)
    if show_waterline > 0:
        hw = 222
        xs = np.linspace(-hw - 30, hw + 30, 16)
        for k_ in range(0, 15, 2):
            line(cv, [(xs[k_], SEC_WATER_Y), (xs[k_ + 1], SEC_WATER_Y)], 4, '#3F7FB8', seed=(gid, 'wl', k_), amp=0.4, alpha=show_waterline)


# =====================================================================================
#  SIDE VIEW (bow left). origin = waterline amidships. y up negative.
# =====================================================================================
SIDE_HULL = [(-470, -228), (-430, -205), (-392, -196), (-372, -150), (-356, -40), (-330, 40), (-280, 96), (-150, 118), (150, 118),
             (300, 100), (360, 40), (382, -60), (400, -230), (412, -345), (360, -350), (300, -312), (190, -300), (180, -240), (70, -228),
             (60, -165), (-250, -165), (-262, -200), (-392, -210)]


def ship_side(cv, t, preserved=False, sails=1.0, masts=1.0, mud=0.0, seed=0, lids=1.0, sparkle_a=0.0, flag_wind=0.3,
              stumps=False, drip=0.0, sail_wave=1.0, flags=True):
    gid = ('side', seed)
    hull_c = PRES if preserved else WOOD
    dec = PRES_L if preserved else GOLD
    mast_defs = [(-245, -720, 250, 190), (-20, -840, 300, 230), (230, -600, 0, 0)]
    for k_, (mx, top, cw, tw) in enumerate(mast_defs):
        if stumps:
            top = -360 - k_ * 10 if k_ != 1 else -420
        elif masts < 1:
            top = lerp(-300, top, masts)
        # rigging
        if not stumps:
            for j in range(4):
                line(cv, [(mx, top * 0.8), (mx - 90 + j * 60, -200)], 1.3, INK_SOFT, seed=(gid, 'rig', k_, j), amp=0.6, alpha=0.6)
        shape(cv, [(mx - 8, -160), (mx - 6, top), (mx + 6, top), (mx + 8, -160)], PRES_D if preserved else WOOD_D, INK, 3,
              seed=(gid, 'mast', k_), amp=0.8, double=False)
        if sails > 0 and cw > 0 and not stumps:
            for (yy, ww, hh, tag) in [(-480 if k_ else -430, cw, 170, 'c'), (top + 120, tw, 190, 't')]:
                b = 18 + 10 * math.sin(t * 2 + k_) * sail_wave
                x0, x1 = mx - ww / 2, mx + ww / 2
                yb = yy + hh * sails
                pts = [(x0, yy)] + bez((x0, yy), (x0 - b * 0.3, (yy + yb) / 2), (x0 + 6, yb), 6)[1:] + \
                      bez((x0 + 6, yb), (mx, yb + b), (x1 - 6, yb), 8)[1:] + bez((x1 - 6, yb), (x1 + b * 0.3, (yy + yb) / 2), (x1, yy), 6)[1:]
                shape(cv, pts, SAIL, INK, 3.2, seed=(gid, 'sl', k_, tag), amp=1.2)
                hatch(cv, pts, SAIL_SH, spacing=13, angle=-0.9, lw=2.2, alpha=0.3, seed=(gid, 'slh', k_, tag))
                line(cv, [(x0 - 12, yy), (x1 + 12, yy)], 6, WOOD_D, seed=(gid, 'yd', k_, tag), amp=0.5)
        if not preserved and not stumps and flags:
            pennant(cv, mx, top + 6, 110, t, wind=flag_wind, seed=k_ * 1.7, width=13)
    if k_ == 2 and not stumps and sails > 0:
        pass
    # bowsprit
    line(cv, [(-400, -215), (-560, -330)], 7, PRES_D if preserved else WOOD_D, seed=(gid, 'bsp'), amp=0.6)
    # hull
    shape(cv, SIDE_HULL, hull_c, INK, 5, seed=(gid, 'hull'), amp=1.6)
    hatch(cv, SIDE_HULL, WOOD_D if not preserved else PRES_D, spacing=13, angle=-0.15, lw=2, alpha=0.3, seed=(gid, 'hh'))
    # planks lines
    for j, yy in enumerate([-120, -78, -12, 30, 70]):
        line(cv, [(-350, yy), (0, yy + 4), (360, yy - 6)], 1.8, WOOD_D if not preserved else PRES_D, seed=(gid, 'pl', j), amp=1.0, alpha=0.55)
    # wales
    for j, (yy, col) in enumerate([(-100, dec), (-150, RED if not preserved else PRES_L), (-30, dec)]):
        line(cv, [(-370, yy - 6), (0, yy), (385, yy - 14)], 5, col, seed=(gid, 'wl', j), amp=0.7)
    # gun ports two rows
    for row, yy in enumerate([-60, -128]):
        n = 11 if row == 0 else 12
        for i in range(n):
            x = -300 + i * (560 / (n - 1)) + (row * 14)
            if row == 1 and x > 175:
                continue
            s = 26
            if not preserved:
                lid = [(x - s / 2, yy - s / 2), (x + s / 2, yy - s / 2), (x + s / 2 + 3, yy - s / 2 - s * 0.9 * lids), (x - s / 2 + 3, yy - s / 2 - s * 0.9 * lids)]
                shape(cv, lid, RED, INK, 2.2, seed=(gid, 'lid', row, i), amp=0.4, double=False, step=6)
            shape(cv, [(x - s / 2, yy - s / 2), (x + s / 2, yy - s / 2), (x + s / 2, yy + s / 2), (x - s / 2, yy + s / 2)], DARKPORT, INK, 2.2,
                  seed=(gid, 'gp', row, i), amp=0.4, double=False, step=6)
            if not preserved:
                line(cv, [(x, yy + 2), (x - 3, yy + 4)], 9, '#4B4655', seed=(gid, 'cm', row, i), amp=0.2)
    # stern castle decoration
    sc = [(190, -300), (300, -312), (360, -350), (412, -345), (400, -230), (382, -60), (330, -70), (300, -240), (190, -240)]
    shape(cv, sc, RED if not preserved else PRES_L, INK, 3.6, seed=(gid, 'sc'), amp=1.0, alpha=0.95)
    for k_ in range(3):
        wx = 250 + k_ * 45
        shape(cv, [(wx - 12, -255), (wx - 12, -285), (wx + 12, -285), (wx + 12, -255)], '#33507E' if not preserved else '#2A2026', INK, 2.2,
              seed=(gid, 'sw', k_), amp=0.4, double=False, step=6)
    # quarter gallery gold
    line(cv, [(330, -70), (350, -200), (395, -330)], 6, dec, seed=(gid, 'qg'), amp=0.8)
    for k_ in range(4):
        circle(cv, 360 + k_ * 9, -120 - k_ * 50, 10, dec, INK, 2.2, seed=(gid, 'qd', k_), double=False)
    # figurehead lion at the beakhead
    shape(cv, ellipse_pts(-440, -235, 34, 20, 14), dec, INK, 3, seed=(gid, 'fig'), amp=0.8, double=False)
    circle(cv, -470, -250, 14, dec, INK, 2.6, seed=(gid, 'figh'), double=False)
    # lanterns on stern
    for lx in (360, 400):
        shape(cv, [(lx - 8, -350), (lx + 8, -350), (lx + 6, -374), (lx, -382), (lx - 6, -374)], dec, INK, 2.2, seed=(gid, 'ln', lx), amp=0.4, double=False, step=5)
    if not preserved and flags:
        line(cv, [(410, -345), (440, -470)], 3.5, WOOD_D, seed=(gid, 'fst'), amp=0.4)
        swedish_flag(cv, 440, -470, 74, 46, t, wind=flag_wind, seed=3)
    # mud / sediment on hull
    if mud > 0:
        cv.save()
        cv.clipPath(path_from(np.asarray(SIDE_HULL, float), True, False), doAntiAlias=True)
        top = lerp(140, -160, mud)
        pts = [(-600, 200)] + [(x, top + math.sin(x * 0.03 + 1.3) * 14 + math.sin(x * 0.011) * 22) for x in range(-600, 620, 40)] + [(600, 200)]
        shape(cv, pts, '#6B5E3E', None, 0, seed=(gid, 'mud'), amp=2, alpha=0.75 * clamp(mud * 3))
        hatch(cv, pts, '#4A4028', spacing=9, angle=0.2, lw=2, alpha=0.4 * clamp(mud * 3), seed=(gid, 'mudh'))
        cv.restore()
    if drip > 0:
        for k_ in range(14):
            x = -330 + k_ * 50
            ph = (t * 1.4 + hsh(k_)) % 1.0
            y0 = 60 + ph * 120
            circle(cv, x, y0, 4.5, '#7FB3D9', '#3F6E9A', 1.6, seed=('dr', k_), alpha=drip * (1 - ph), double=False)
    if sparkle_a > 0:
        for j, (sx_, sy_) in enumerate([(-470, -250), (395, -330), (350, -200), (370, -170), (-100, -100), (200, -150)]):
            ph = (t * 2.1 + j * 0.29) % 1.0
            sparkle(cv, sx_, sy_, 14 * math.sin(ph * math.pi) * sparkle_a, alpha=sparkle_a)
