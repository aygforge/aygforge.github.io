"""Scene choreography for the Boston LED-board story."""
import math, random
import skia
from lib import *
from props import *

FX, FY = 540, 1200   # screen focus for camera

def cam(c, x, y, z, rot=0.0):
    c.translate(FX, FY); c.rotate(rot); c.scale(z, z); c.translate(-x, -y)

def bg(c):
    c.drawImage(paper_image(), 0, 0)

def dr(t, amp=8, sp=0.22, seed=0):
    return amp * vnoise(t * sp + seed * 3.1, seed)

def zexp(z0, z1, u):
    return math.exp(lerp(math.log(z0), math.log(z1), u))

def bubble(c, x, y, r, drawfn, bgcol='#F6EFE0', w=6, seed=0):
    if r < 2: return
    path = wob_circle(x, y, r, seed=seed, amp=0.025)
    flat(c, wob_circle(x + 10, y + 12, r, seed=seed, amp=0.025), '#000000', 0.12)
    c.save(); c.clipPath(path, skia.ClipOp.kIntersect, True)
    flat(c, path, bgcol)
    c.save(); c.translate(x, y); drawfn(c); c.restore()
    c.restore()
    ink(c, path, w, seed=seed)

def tape_piece(c, x, y, rot=0, w=110, h=34):
    c.save(); c.translate(x, y); c.rotate(rot)
    fill(c, R(-w / 2, -h / 2, w, h, 2), '#E8DDB8', a=0.8, off=None)
    c.restore()

def card(c, x, y, w, h, drawfn, rot=0.0, seed=0, bgcol='#F6EFE0'):
    c.save(); c.translate(x, y); c.rotate(rot)
    rect = R(-w / 2, -h / 2, w, h, 10)
    flat(c, R(-w / 2 + 14, -h / 2 + 18, w, h, 10), '#000000', 0.13)
    c.save(); c.clipPath(rect, skia.ClipOp.kIntersect, True)
    flat(c, rect, bgcol)
    drawfn(c)
    c.restore()
    ink(c, rect, 6, seed=seed)
    tape_piece(c, -w / 2 + 40, -h / 2 + 6, -28); tape_piece(c, w / 2 - 40, -h / 2 + 6, 26)
    c.restore()

# ================================================================ maps
def ribbon(pts, widths):
    L, Rr = [], []
    n = len(pts)
    for i in range(n):
        a = pts[max(0, i - 1)]; b = pts[min(n - 1, i + 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]; d = math.hypot(dx, dy) or 1
        nx, ny = -dy / d, dx / d
        w = widths[i] / 2
        L.append((pts[i][0] + nx * w, pts[i][1] + ny * w))
        Rr.append((pts[i][0] - nx * w, pts[i][1] - ny * w))
    return S(L + Rr[::-1])

CHARLES = [(-400, 1500), (0, 1450), (300, 1520), (560, 1430), (820, 1500), (1050, 1420), (1280, 1300), (1450, 1220), (1600, 1180), (1780, 1150)]
CH_W = [90, 95, 110, 130, 200, 260, 240, 180, 150, 160]
MYSTIC = [(600, 400), (900, 520), (1200, 640), (1450, 700), (1700, 760), (1900, 820)]
MY_W = [70, 80, 110, 130, 150, 190]
HARBOR = [(1750, 300), (2900, 200), (2900, 2900), (2050, 2900), (1980, 2300), (1850, 1950), (1900, 1700), (1760, 1450), (1820, 1300), (1730, 1060), (1880, 950), (1800, 700)]

def _streets(seed=11):
    rr = random.Random(seed)
    segs = []
    zones = [((200, 1600, 1250, 2500), 8), ((100, 600, 1100, 1350), -18), ((1100, 400, 1750, 1000), 30),
             ((1150, 1450, 1850, 2200), -5), ((-300, 300, 600, 1300), 3), ((-300, 1700, 300, 2500), 20)]
    for (x0, y0, x1, y1), ang in zones:
        a = math.radians(ang)
        ca, sa = math.cos(a), math.sin(a)
        cxm, cym = (x0 + x1) / 2, (y0 + y1) / 2
        hw, hh = (x1 - x0) / 2, (y1 - y0) / 2
        step = rr.uniform(80, 120)
        k = -hw
        while k < hw:
            p0 = (k, -hh); p1 = (k, hh)
            segs.append([(cxm + p[0] * ca - p[1] * sa, cym + p[0] * sa + p[1] * ca) for p in (p0, p1)])
            k += step * rr.uniform(0.8, 1.2)
        k = -hh
        while k < hh:
            p0 = (-hw, k); p1 = (hw, k)
            segs.append([(cxm + p[0] * ca - p[1] * sa, cym + p[0] * sa + p[1] * ca) for p in (p0, p1)])
            k += step * rr.uniform(0.8, 1.3)
    return segs
STREETS = _streets()
HIGHWAY = [(1380, -200), (1400, 300), (1460, 700), (1500, 1100), (1520, 1500), (1480, 1900), (1420, 2600)]
HIGHWAY2 = [(-400, 1650), (200, 1640), (700, 1600), (1200, 1580), (1500, 1550)]
BRIDGES = [(560, 1430), (820, 1500), (1050, 1420), (1280, 1300), (1450, 1220), (1100, 640), (1450, 700)]
TLINES = [('#D9822B', [(1300, -200), (1340, 400), (1420, 900), (1450, 1300), (1400, 1800), (1250, 2600)]),
          ('#C9443A', [(-300, 1100), (300, 1250), (900, 1380), (1350, 1320), (1600, 1700), (1700, 2600)]),
          ('#3E8E58', [(-300, 1900), (400, 1800), (900, 1750), (1350, 1500), (1500, 1250)]),
          ('#3E6AB0', [(1500, 1350), (1700, 1000), (1900, 600), (2100, 300)])]

def boston_map(c, t=0.0, a=1.0, streets=True, transit=True, stopped=0.0):
    land = R(-1200, -1200, 4800, 4800)
    fill(c, land, '#EFE4CC', a=a, off=None)
    fill(c, S(HARBOR), WATER, a=a, off=None); ink(c, S(HARBOR), 4, a=0.8 * a)
    for pts, ws in ((CHARLES, CH_W), (MYSTIC, MY_W)):
        rp = ribbon(pts, ws)
        fill(c, rp, WATER, a=a, off=None); ink(c, rp, 4, a=0.8 * a)
    # parks
    fill(c, S([(900, 1700), (1050, 1650), (1120, 1760), (980, 1840)]), GRASS, a=0.8 * a, off=None)
    fill(c, S([(300, 1900), (500, 1850), (560, 2000), (360, 2060)]), GRASS, a=0.8 * a, off=None)
    if streets:
        sp = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=3, Color=C('#7E7A80', 0.45 * a), StrokeCap=skia.Paint.kRound_Cap)
        sp.setPathEffect(skia.DiscretePathEffect.Make(16, 1.4, G.seed))
        for sg in STREETS:
            c.drawLine(sg[0][0], sg[0][1], sg[1][0], sg[1][1], sp)
        line(c, HIGHWAY, 12, '#C9BFAE', a, smooth=True); ink(c, S(HIGHWAY, False), 3, a=0.8 * a)
        line(c, HIGHWAY2, 10, '#C9BFAE', a, smooth=True); ink(c, S(HIGHWAY2, False), 3, a=0.7 * a)
    for (bx, by) in BRIDGES:
        line(c, [(bx - 20, by - 130), (bx + 20, by + 130)], 12, '#D6CDBD', a)
        ink(c, P([(bx - 32, by - 128), (bx + 8, by + 132)], False), 3, a=a)
        ink(c, P([(bx - 8, by - 132), (bx + 32, by + 128)], False), 3, a=a)
    if transit:
        for col, pts in TLINES:
            pth = S(pts, False)
            p = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=9, Color=C(col, 0.85 * a), StrokeCap=skia.Paint.kRound_Cap)
            if stopped > 0:
                ph = (t * 2.0) % 1
                p.setPathEffect(skia.DashPathEffect.Make([38, 18], 0))
                p.setAlphaf(0.85 * a * (1 - 0.45 * stopped * (0.5 + 0.5 * math.sin(t * 6))))
            c.drawPath(pth, p)
            ink(c, pth, 2, a=0.5 * a, double=False)

def map_car(c, x, y, ang, t, s=1.0, seed=0):
    c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s)
    shape(c, R(-22, -12, 44, 24, 6), '#F4F2EC', 3)
    fill(c, R(-6, -10, 10, 20, 2), POLICE, off=None)
    on = int(t * 6 + seed) % 2 == 0
    glow(c, 0, 0, 22, SIREN_R if on else SIREN_B, 0.75)
    c.restore()

def along(pts, u):
    tot = sum(math.dist(pts[i], pts[i + 1]) for i in range(len(pts) - 1))
    want = tot * max(0, min(1, u)); acc = 0
    for i in range(len(pts) - 1):
        d = math.dist(pts[i], pts[i + 1])
        if acc + d >= want:
            k = (want - acc) / d
            return (lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k),
                    math.degrees(math.atan2(pts[i + 1][1] - pts[i][1], pts[i + 1][0] - pts[i][0])))
        acc += d
    return pts[-1][0], pts[-1][1], 0

# US outline (lon, lat)
US = [(-124.7, 48.4), (-124.0, 46.3), (-124.1, 43.0), (-124.3, 40.4), (-123.7, 38.9), (-122.4, 37.6), (-121.9, 36.6), (-120.6, 34.6), (-118.5, 34.0), (-117.1, 32.5),
      (-114.7, 32.7), (-111.0, 31.3), (-108.2, 31.3), (-106.5, 31.8), (-104.5, 29.6), (-103.0, 29.0), (-101.4, 29.8), (-99.5, 27.5), (-97.4, 25.9),
      (-97.4, 27.8), (-95.0, 29.3), (-93.8, 29.7), (-91.0, 29.2), (-89.2, 29.2), (-89.6, 30.2), (-88.0, 30.6), (-86.5, 30.4), (-85.0, 29.6), (-83.6, 29.9),
      (-82.7, 27.7), (-81.8, 26.1), (-80.9, 25.2), (-80.1, 26.0), (-80.6, 28.5), (-81.4, 30.7), (-81.1, 32.0), (-79.2, 33.2), (-77.9, 34.0), (-75.5, 35.3),
      (-76.0, 36.9), (-75.6, 37.9), (-75.1, 38.8), (-74.1, 39.8), (-74.0, 40.6), (-72.6, 40.9), (-71.4, 41.5), (-70.0, 41.7), (-70.6, 42.1), (-70.8, 42.6),
      (-70.2, 43.7), (-69.0, 44.2), (-67.0, 44.8), (-67.8, 47.1), (-69.2, 47.4), (-70.0, 46.0), (-71.5, 45.0), (-74.7, 45.0), (-76.3, 44.2), (-79.0, 43.3),
      (-79.0, 42.6), (-82.4, 41.7), (-83.0, 42.1), (-82.4, 43.6), (-83.5, 45.9), (-84.6, 46.5), (-88.0, 48.0), (-89.6, 48.0), (-95.2, 49.0), (-123.3, 49.0)]
CITIES = {'boston': (-71.06, 42.36), 'nyc': (-74.0, 40.7), 'phl': (-75.16, 39.95), 'atl': (-84.39, 33.75), 'chi': (-87.63, 41.88),
          'sea': (-122.33, 47.61), 'pdx': (-122.68, 45.52), 'sf': (-122.42, 37.77), 'la': (-118.24, 34.05), 'aus': (-97.74, 30.27)}

def albers(lon, lat):
    p1, p2, p0, l0 = map(math.radians, (29.5, 45.5, 37.5, -96.0))
    n = (math.sin(p1) + math.sin(p2)) / 2
    Cc = math.cos(p1) ** 2 + 2 * n * math.sin(p1)
    r0 = math.sqrt(Cc - 2 * n * math.sin(p0)) / n
    r = math.sqrt(Cc - 2 * n * math.sin(math.radians(lat))) / n
    th = n * (math.radians(lon) - l0)
    return r * math.sin(th), r0 - r * math.cos(th)

def _us_fit():
    pts = [albers(*q) for q in US]
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    k = 1000 / (max(xs) - min(xs))
    cx = (max(xs) + min(xs)) / 2; cy = (max(ys) + min(ys)) / 2
    return k, cx, cy
_K, _UCX, _UCY = _us_fit()
def us_xy(lon, lat, ox=540, oy=1000):
    x, y = albers(lon, lat)
    return ox + (x - _UCX) * _K, oy - (y - _UCY) * _K

# ================================================================ scene 1: hook
def s1(c, t, d):
    bg(c)
    push = ease_in(seg(t, d - 0.9, d + 0.3))
    z = 1.05 - 0.05 * ease(seg(t, 0, 2.5)) + 0.9 * push
    cx = 540 + dr(t, 6); cy = lerp(1200, 950, ease(seg(t, d - 1.1, d + 0.3))) + dr(t, 5, seed=2)
    c.save(); cam(c, cx, cy, z)
    sky(c, '#D3DCE2', '#EEE6D4', 300, 1290)
    skyline(c, -60, 1290, 1.05, col='#AAB3C1', lights=0.15, t=t, seed=4)
    fill(c, R(-600, 1280, 2300, 240), '#BDB6A8', off=None)
    ground(c, 1500, '#ABA69E', road=True)
    # car passing far behind
    car(c, lerp(1400, -500, (t * 0.18) % 1), 1300, 0.32, '#5C6E8A', t)
    overpass(c, -300, 1400, 600, deck=130, pillar_xs=(110, 970), ground=1500)
    ph = (t * 3.2) % 1.0
    soft_light(c, 300, 1400, 700, SIREN_R if ph < 0.5 else SIREN_B, 0.22 * ease(seg(t, 0.2, 0.8)))
    line(c, [(430, 732), (430, 790)], 5, '#E8E4D8'); line(c, [(650, 732), (650, 790)], 5, '#E8E4D8')
    # flashlight beam from the tech
    beam = ease(seg(t, 1.6, 2.1))
    if beam > 0:
        bp = skia.Paint(AntiAlias=True)
        bp.setShader(skia.GradientShader.MakeLinear([skia.Point(700, 1330), skia.Point(560, 950)], [C('#FFF4C8', 0.0), C('#FFF4C8', 0.35 * beam)]))
        c.drawPath(P([(690, 1330), (712, 1336), (700, 820), (420, 900)]), bp)
    board(c, 540, 950, 0.95, t, LED_G, glowamt=1.25, seed=1)
    police_tape(c, [(-40, 1470), (540, 1505), (1120, 1466)], prog=ease(seg(t, 0.8, 1.6)))
    car(c, 1010, 1650, 0.82, '#F2F0EA', t + 0.3, police=True, flip=True, seed=3)
    bx = lerp(1020, 720, ease_out(seg(t, 0.0, 1.35)))
    bomb_tech(c, bx, 1712, 0.84, t, walk=(t * 1.5 if t < 1.35 else 0), arm_up=0.55 * ease(seg(t, 1.4, 1.9)))
    px = lerp(-60, 280, ease_out(seg(t, 0.0, 0.9)))
    car(c, px, 1760, 0.98, '#F2F0EA', t, police=True, bounce=-3 * math.sin(seg(t, 0.85, 1.1) * math.pi))
    c.restore()
    # callout: back of the board -> wires + batteries
    u = ease_out(seg(t, 1.45, 1.85)) * (1 - ease(seg(t, 3.55, 3.95)))
    if u > 0.01:
        ink(c, P([(700, 1000), (lerp(700, 735, u), lerp(1000, 1120, u))], False), 4, a=u)
        bubble(c, 845, 1250, 175 * u, lambda cc: board_back(cc, 10, 0, 0.66, t, seed=5), bgcol='#2B2D35', seed=3)

# ================================================================ scene 2: boards around the city
def _card_pole(c, t):
    sky(c, '#D8E0E4', '#EDE6D6', -500, 330)
    skyline(c, -470, 330, 0.7, col='#B3BBC7', seed=8)
    ground(c, 330, '#B9B2A5', road=False)
    shape(c, R(-190, -520, 44, 860), '#7A5A3E', 4)
    board(c, -10, -40, 0.82, t, LED_G, seed=11)
    for yy in (-150, 70):
        fill(c, R(-200, yy, 100, 18, 3), '#8C8C92', off=None)
    person(c, 260 - (t * 70) % 700, 470, 0.95, COATS[1], SKIN[0], t, walk=t * 1.2, facing=-1, hat=MUSTARD, seed=3)

def _card_bridge(c, t):
    sky(c, '#D8E0E4', '#EDE6D6', -500, 300)
    fill(c, R(-500, 230, 1000, 300), WATER, off=None)
    shape(c, R(-500, -440, 1000, 150), '#6E7C78', 5)
    for k in range(-5, 6):
        c.drawCircle(k * 80, -360, 5, skia.Paint(AntiAlias=True, Color=C('#3E4844')))
        line(c, [(k * 80 - 40, -290), (k * 80, -440)], 3, '#55625E', 0.8)
    shape(c, R(-500, -300, 1000, 40), '#55625E', 4)
    for px in (-330, 330):
        shape(c, R(px - 40, -260, 80, 520), CONCR, 4)
    board(c, 0, -60, 0.78, t, LED_C, seed=12)
    line(c, [(-110, -262), (-110, -212)], 4, '#E8E4D8'); line(c, [(110, -262), (110, -212)], 4, '#E8E4D8')
    ground(c, 330, '#A8A39B', road=True, lane_off=-t * 200)
    car(c, -500 + (t * 380) % 1100, 470, 0.6, '#7A3F3A', t)

def _card_transit(c, t):
    sky(c, '#D8E0E4', '#EDE6D6', -500, 300)
    skyline(c, -470, 280, 0.6, col='#B3BBC7', seed=9)
    shape(c, R(-500, -260, 1000, 70), '#6F6A66', 5)
    train(c, -900 + (t * 420) % 1600, -262, 0.55, t, cars=3, stripe='#D9822B', faces=False)
    shape(c, R(30, -190, 90, 560), CONCR, 4.5)
    shape(c, R(-420, -190, 70, 560), CONCR, 4.5)
    board(c, 75, 60, 0.66, t, LED_G, seed=13)
    ground(c, 360, '#B5AFA4', road=False)
    shape(c, P([(-330, 360), (-160, 120), (-120, 120), (-290, 360)]), '#8E8880', 4)
    for k in range(6):
        line(c, [(-320 + k * 30, 360 - k * 40), (-282 + k * 30, 360 - k * 40)], 3)
    person(c, -230 + (t * 50) % 300, 480, 0.9, COATS[3], SKIN[2], t, walk=t * 1.1, hat=None, seed=5, bag=True)

def _card_wall(c, t):
    brick_wall(c, -500, -520, 1000, 860, seed=4)
    for (wx, wy) in ((-330, -400), (230, -400)):
        shape(c, R(wx, wy, 130, 170, 6), '#C6D6DE', 4)
        line(c, [(wx + 65, wy), (wx + 65, wy + 170)], 3)
    board(c, 0, -20, 0.8, t, LED_C, seed=14)
    ground(c, 340, '#C4BDB0', road=False)
    person(c, -420 + (t * 90) % 900, 480, 0.95, COATS[0], SKIN[1], t, walk=t * 1.3, scarf=BRICK, seed=6)

CARDS = [_card_pole, _card_bridge, _card_transit, _card_wall]

def s2(c, t, d):
    bg(c)
    slot = d / 4.0
    k = min(3, int(t / slot)); fr = (t - k * slot) / slot
    pos = k + (ease_io(seg(fr, 0.62, 1.0)) if k < 3 else 0)
    camx = 540 + 1150 * pos + dr(t, 10)
    camy = 1180 + 70 * math.sin(pos * math.pi) + dr(t, 8, seed=3)
    z = 0.92 + 0.04 * math.sin(t * 0.7)
    if t > d - 0.6: z *= 1 + 0.5 * ease_in(seg(t, d - 0.6, d + 0.3))
    # moving background map
    c.save(); cam(c, 900 + camx * 0.32, 1250 + camy * 0.1, 0.7, rot=-6 + t * 0.6)
    boston_map(c, t, a=0.5)
    for i in range(4):
        if t > i * slot - 0.2:
            mx, my = [(700, 1700), (1050, 1420), (1400, 1000), (1200, 1900)][i]
            sc = pop(t, i * slot - 0.2)
            board_icon(c, mx, my, 1.4 * sc, t, LED_G if i % 2 == 0 else LED_C, seed=i)
            radio_waves(c, mx, my, t + i, LED_G, n=2, r1=120, a=0.5)
    c.restore()
    c.save(); cam(c, camx, camy, z)
    # dotted route
    dp = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=6, Color=C(INK, 0.55), StrokeCap=skia.Paint.kRound_Cap)
    dp.setPathEffect(skia.DashPathEffect.Make([2, 22], -t * 40))
    route = S([(540 + 1150 * i, 1180 + (60 if i % 2 else -40)) for i in range(4)], False)
    c.drawPath(route, dp)
    for i in range(4):
        if abs(i - pos) < 1.4:
            cxk = 540 + 1150 * i; cyk = 1180 + (60 if i % 2 else -40)
            ap = pop(t, i * slot - 0.45, 0.5) if i > 0 else 1.0
            c.save(); c.translate(cxk, cyk); c.scale(ap, ap); c.translate(-cxk, -cyk)
            card(c, cxk, cyk, 860, 1040, lambda cc, i=i: CARDS[i](cc, t), rot=[-2, 1.5, -1.2, 2][i], seed=i)
            c.restore()
    c.restore()

# ================================================================ scene 3: it was an ad campaign
def _poster(c, t, seed=0):
    rect = R(-180, -260, 360, 520, 6)
    shape(c, rect, '#2E2450', 5)
    c.save(); c.clipPath(rect, skia.ClipOp.kIntersect, True)
    for k in range(3):
        ang = -20 + k * 20 + math.sin(t * 1.2 + k) * 8
        bp = skia.Paint(AntiAlias=True)
        bp.setShader(skia.GradientShader.MakeLinear([skia.Point(0, 260), skia.Point(0, -260)], [C('#FFF2B0', 0.35), C('#FFF2B0', 0)]))
        c.save(); c.translate(-120 + k * 120, 260); c.rotate(ang)
        c.drawPath(P([(-14, 0), (14, 0), (70, -560), (-70, -560)]), bp)
        c.restore()
    rr = random.Random(5)
    for i in range(26):
        sx, sy = rr.uniform(-170, 170), rr.uniform(-250, 250)
        tw = 0.5 + 0.5 * math.sin(t * 4 + i)
        c.drawCircle(sx, sy, 2.5 + tw * 1.5, skia.Paint(AntiAlias=True, Color=C('#FFF6D0', 0.5 + 0.5 * tw)))
    board(c, 0, -10, 0.62, t, LED_G, wires=False, seed=21)
    c.restore()
    fill(c, R(-140, -235, 280, 34, 12), MUSTARD, off=None)
    fill(c, R(-100, -192, 200, 16, 8), LED_C, a=0.85, off=None)
    fill(c, R(-130, 160, 260, 26, 10), MUSTARD, off=None)
    scribble_lines(c, -120, 196, 240, 50, 3, '#D9D2E8', 2.5, seed=seed + 3, a=0.7)
    film_strip(c, -180, 270, 360, t=t, seed=seed)

def _concept_sheet(c, t, prog):
    rect = R(-200, -250, 400, 500, 4)
    shape(c, rect, '#FBF8F0', 4.5)
    gp = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=1.2, Color=C('#8FB3CF', 0.6))
    for k in range(-9, 10):
        c.drawLine(k * 21, -240, k * 21, 240, gp); c.drawLine(-190, k * 25, 190, k * 25, gp)
    # pencil pixel sketch, filling cell by cell
    px = []
    for r, row in enumerate(ALIEN):
        for cc, ch in enumerate(row):
            if ch in '#w': px.append((r, cc))
    n = int(len(px) * prog)
    sk = skia.Paint(AntiAlias=True, Color=C('#6A6E7E', 0.55))
    sk.setPathEffect(skia.DiscretePathEffect.Make(6, 1.2, G.seed))
    for (r, cc) in px[:n]:
        c.drawRect(skia.Rect.MakeXYWH(-140 + cc * 21 + 2, -200 + r * 21 + 2, 17, 17), sk)
    ink(c, R(-150, -210, 13 * 21 + 20, 14 * 21 + 20, 8), 3, '#6A6E7E', 0.7 * min(1, prog * 3))
    # arrows + notes (illegible)
    if prog > 0.6:
        a = seg(prog, 0.6, 1.0)
        line(c, [(160, -160), (190, -120), (172, -70)], 3, BRICK, a)
        scribble_lines(c, -170, 120, 330, 100, 3, '#6A6E7E', 2.5, seed=31, a=0.8 * a)
        glow(c, 150, -190, 14, LED_G, 0.6 * a)
        shape(c, O(150, -190, 9), LED_G, 2.5, a=a)

def s3(c, t, d):
    bg(c)
    # camera choreography: sheet -> poster -> pull back -> bench
    keys = [(0.0, 300, 860, 1.75), (1.9, 330, 870, 1.65), (2.4, 760, 860, 1.55), (4.0, 760, 880, 1.45), (5.3, 540, 1210, 0.98), (d, 560, 1300, 1.1)]
    for i in range(len(keys) - 1):
        if keys[i][0] <= t <= keys[i + 1][0] or (i == len(keys) - 2 and t > keys[-1][0]) or (i == 0 and t < 0):
            a, b = keys[i], keys[i + 1]
            u = ease_io(seg(t, a[0], b[0]))
            cx, cy, z = lerp(a[1], b[1], u), lerp(a[2], b[2], u), zexp(a[3], b[3], u)
            break
    if t > d - 0.5: z *= 1 + 0.4 * ease_in(seg(t, d - 0.5, d + 0.3))
    c.save(); cam(c, cx + dr(t, 6), cy + dr(t, 6, seed=2), z)
    # wall + corkboard
    fill(c, R(-600, 0, 2300, 1180), '#E6DCC8', off=None)
    shape(c, R(40, 540, 1000, 640, 8), '#C9A27A', 6)
    rr = random.Random(2)
    dp = skia.Paint(AntiAlias=True, Color=C('#9C7650', 0.5))
    for i in range(260):
        c.drawCircle(rr.uniform(50, 1030), rr.uniform(550, 1170), rr.uniform(1, 2.6), dp)
    c.save(); c.translate(300, 860); c.rotate(-3)
    _concept_sheet(c, t, ease(seg(t, -0.2, 2.2)))
    c.restore()
    shape(c, O(300, 622, 12), '#D23E33', 3)
    # sticky notes
    for (nx, ny, rt, col) in ((110, 1080, -6, '#F4E27A'), (520, 1090, 5, '#9ED7C9'), (980, 600, 8, '#F4E27A')):
        c.save(); c.translate(nx, ny); c.rotate(rt)
        shape(c, R(-50, -50, 100, 100, 3), col, 3)
        scribble_lines(c, -38, -36, 76, 70, 3, '#5A5E70', 2.2, seed=nx, a=0.7)
        c.restore()
    # poster slides in
    pu = ease_out(seg(t, 1.95, 2.55))
    if pu > 0:
        c.save(); c.translate(lerp(1400, 770, pu), 860); c.rotate(lerp(12, 2, pu))
        _poster(c, t)
        c.restore()
        shape(c, O(770, 600, 12), '#3E6AB0', 3)
        if t > 2.4:
            c.save(); c.translate(915, 1095); c.rotate(-12)
            clapper(c, 0, 0, 0.55, 0, open_=0.5 * (1 - ease(seg(t, 3.0, 3.15))) + 0.5 * ease(seg(t, 3.2, 3.6)))
            c.restore()
    # workbench
    shape(c, R(-600, 1180, 2300, 900), '#C29466', 6)
    line(c, [(-600, 1200), (1700, 1200)], 3, '#8A6440', 0.8)
    for k in range(5):
        line(c, [(-600, 1300 + k * 120), (1700, 1310 + k * 120)], 2, '#A47A52', 0.6, smooth=False)
    # loose batteries + tape roll
    for i in range(5):
        c.save(); c.translate(90 + i * 34, 1700 + (i % 2) * 20); c.rotate(70 + i * 8)
        shape(c, R(-16, -40, 32, 80, 10), '#26262B', 3)
        fill(c, R(-16, -40, 32, 18, 8), '#C9893A', off=None)
        c.restore()
    shape(c, O(140, 1500, 62), '#8D8D93', 4); shape(c, O(140, 1500, 28), '#C29466', 3)
    # board being assembled
    cnt = 20 + int(ease(seg(t, 4.2, d)) * 90)
    board(c, 470, 1520, 0.72, t, LED_G, wires=False, count=cnt, seed=22, glowamt=0.9)
    hx = 640 + 26 * math.sin(t * 5); hy = 1520 + 20 * math.cos(t * 5)
    hand(c, hx + 70, hy + 140, 0.85, rot=-30, skin=SKIN[0], pinch=0.5, sleeve='#5B6B4A')
    glow(c, hx - 4, hy - 12, 12, LED_G, 0.7)
    # box of finished boards
    for i in range(3):
        board(c, 870 + i * 26 - 26, 1520 - i * 18, 0.4, t + i * 0.3, LED_C if i == 1 else LED_G, wires=False, seed=30 + i, glowamt=0.8)
    shape(c, P([(740, 1560), (1010, 1560), (990, 1800), (760, 1800)]), '#C9A06C', 5)
    shape(c, P([(740, 1560), (700, 1500), (760, 1500), (790, 1560)]), '#B98F5C', 4)
    line(c, [(800, 1650), (950, 1650)], 3, '#8A6440', 0.6)
    c.restore()

# ================================================================ scene 4: reported
def face_closeup(c, t, skin=SKIN[3]):
    sky(c, '#F0D9C8', '#F5E8D6', -300, 300)
    breath = (t * 0.7) % 1.0
    shape(c, R(-260, 170, 520, 200, 60), COATS[2], 5)
    shape(c, R(-150, 120, 300, 80, 30), BRICK, 4.5)
    shape(c, O(-10, 10, 150, 165), skin, 5)
    shape(c, S([(-165, -30), (-150, -130), (-60, -185), (60, -185), (150, -130), (165, -30), (0, -80)]), MUSTARD, 5)
    for k in range(6):
        line(c, [(-130 + k * 50, -150 + abs(k - 2.5) * 6), (-120 + k * 50, -60)], 2.5, '#B7862E', 0.6)
    look = 8 * math.sin(t * 0.8)
    for ex in (-65, 45):
        shape(c, O(ex, 10, 30, 34), '#FFFFFF', 4)
        c.drawCircle(ex + 10 + look * 0.3, 0, 13, skia.Paint(AntiAlias=True, Color=C(INK)))
        c.drawCircle(ex + 14, -4, 4, skia.Paint(AntiAlias=True, Color=C('#FFFFFF')))
    raise_ = 6 * math.sin(t * 2.4)
    line(c, [(-100, -40), (-40, -58 - raise_)], 7)
    line(c, [(20, -58 - raise_), (80, -40)], 7)
    line(c, [(-40, 95), (-20, 88), (0, 95), (20, 88)], 5, smooth=True)
    shape(c, O(-150, 40, 22, 30), skin, 4)
    if breath < 0.6:
        bu = breath / 0.6
        cloud(c, -110 - bu * 90, 120 - bu * 30, 0.35 + bu * 0.3, a=0.7 * (1 - bu), col='#FFFFFF')
    # hand + flip phone at right ear
    flip_phone(c, 160, 20, 0.95, t, rot=12)
    shape(c, S([(110, 120), (150, 70), (205, 80), (215, 140), (170, 200)]), skin, 4.5)
    radio_waves(c, 210, -150, t, POLICE, n=3, r0=10, r1=110, speed=1.2, a=0.8)

def dispatch_view(c, t):
    fill(c, R(-400, -400, 800, 800), '#33405A', off=None)
    shape(c, R(-300, -230, 360, 230, 10), '#1E2433', 5)
    c.save(); c.clipPath(R(-290, -220, 340, 210, 6), skia.ClipOp.kIntersect, True)
    c.save(); c.translate(-120, -115); c.scale(0.18, 0.18); c.translate(-1200, -1300)
    boston_map(c, t, a=0.9, transit=False)
    c.restore()
    on = int(t * 4) % 2 == 0
    glow(c, -100, -110, 24 if on else 14, SIREN_R, 0.9)
    c.restore()
    shape(c, R(-310, 10, 620, 300, 10), '#5A5E6A', 5)
    for k in range(8):
        shape(c, R(-260 + k * 40, 60, 28, 16, 3), ['#E0473A', '#F2B233', '#72C27A', '#E9E4D8'][k % 4], 2)
    # dispatcher
    shape(c, R(90, -40, 240, 300, 80), POLICE, 5)
    shape(c, O(200, -120, 78, 84), SKIN[1], 5)
    shape(c, S([(122, -140), (140, -205), (210, -215), (275, -170), (280, -120), (230, -170)]), '#2A1E1A', 4)
    ink(c, S([(120, -130), (200, -230), (282, -130)], False), 8, '#22252E')
    shape(c, O(122, -118, 18, 26), '#22252E', 3)
    line(c, [(122, -100), (150, -60), (178, -54)], 4, '#22252E')
    c.drawCircle(170, -118, 6, skia.Paint(AntiAlias=True, Color=C(INK)))
    radio_waves(c, -230, -300, t, POLICE_L, n=3, r0=10, r1=140, speed=1.0, a=0.9, w=6)
    line(c, [(-230, -300), (-230, -230)], 6, '#22252E')

def s4(c, t, d):
    bg(c)
    zoom_in = ease_io(seg(t, 1.45, 2.5))
    back_off = ease_io(seg(t, 3.0, 3.8))
    z = zexp(1.0, 2.15, zoom_in) * zexp(1.0, 0.82, back_off)
    cx = lerp(540, 540, zoom_in) + dr(t, 6)
    cy = lerp(1200, 905, zoom_in) + dr(t, 6, seed=1) + 90 * back_off
    shake = 0
    c.save(); cam(c, cx, cy, z)
    sky(c, '#EBD6C4', '#F4E7D2', 300, 1400)
    sun(c, 880, 1180, 70, t, a=0.7)
    skyline(c, -80, 1400, 1.0, col='#B8B6C4', lights=0.25, t=t, seed=6)
    fill(c, R(-600, 1390, 2300, 260), '#C3BBAE', off=None)
    overpass(c, -300, 1400, 650, deck=125, pillar_xs=(150, 930), ground=1650, col='#B9B3AA')
    line(c, [(470, 775), (470, 820)], 5, '#E8E4D8'); line(c, [(610, 775), (610, 820)], 5, '#E8E4D8')
    board_back(c, 540, 1000, 0.82, t, seed=41, leak=1.0)
    ground(c, 1650, '#BFB8AB', road=False)
    # commuters
    walkers = [(0, 1.0, 0.95, COATS[0], SKIN[0], None, 1), (1, -1.0, 0.88, COATS[4], SKIN[2], '#3A3A40', 2), (2, 1.0, 0.8, COATS[5], SKIN[1], None, 3),
               (3, -1.0, 1.0, COATS[6], SKIN[4], MUSTARD, 4)]
    for (i, dirn, sp, coat, skn, hat, sd) in walkers:
        xx = ((t * 110 * sp + i * 430 + 600) % 1700) - 300
        if dirn < 0: xx = 1380 - xx
        person(c, xx, 1680 + i * 14, 0.9 + 0.05 * i, coat, skn, t, walk=t * 1.25 * sp + i, facing=int(dirn), hat=hat, seed=sd, bag=(i == 1))
    # main person: walks in, stops, looks up
    mx = lerp(-150, 330, ease_out(seg(t, -0.3, 1.0)))
    walking = t < 1.0
    person(c, mx, 1790, 1.2, COATS[2], SKIN[3], t, walk=t * 1.3 if walking else 0, pose='walk' if walking else ('point' if t < 2.9 else 'phone'),
           hat=MUSTARD, scarf=BRICK, look=ease(seg(t, 1.0, 1.4)), seed=9)
    c.restore()
    # face + phone call
    fu = ease_out(seg(t, 2.95, 3.4)) * (1 - ease_in(seg(t, 4.55, 4.85)))
    if fu > 0.01:
        bubble(c, 540, 1440, 330 * fu, lambda cc: face_closeup(cc, t), seed=4)
    du = ease_out(seg(t, 4.6, 5.05))
    if du > 0.01:
        bubble(c, 540, 1420, 340 * du, lambda cc: dispatch_view(cc, t), bgcol='#33405A', seed=6)
        # signal path
        for k in range(3):
            u = ((t * 1.4 + k / 3) % 1)
            glow(c, lerp(200, 480, u), lerp(1900, 1500, u), 10, POLICE_L, 0.6 * du)

# ================================================================ scene 5: bomb squad
FRAGS = [  # polygons in board-local coords (board ~342x366, centered)
    [(-171, -183), (30, -183), (10, -40), (-60, 10), (-171, -20)],
    [(30, -183), (171, -183), (171, 10), (60, 30), (10, -40)],
    [(-171, -20), (-60, 10), (-20, 183), (-171, 183)],
    [(-60, 10), (10, -40), (60, 30), (171, 10), (171, 183), (-20, 183)],
]
FRAG_OFF = [(-70, -30, -18), (80, -50, 14), (-110, 60, -30), (60, 40, 22)]

def s5(c, t, d):
    bg(c)
    boom_t = 5.0
    z = 1.0 + 0.02 * math.sin(t * 0.8)
    cx, cy = 540 + dr(t, 8), 1200 + dr(t, 6, seed=2)
    post = ease_io(seg(t, boom_t + 0.4, d))
    z *= zexp(1.0, 2.0, post)
    cx = lerp(cx, 560, post); cy = lerp(cy, 1430, post)
    shake = 6 * math.exp(-(t - boom_t) * 9) * math.sin(t * 90) if t > boom_t else 0
    c.save(); cam(c, cx + shake, cy, z)
    sky(c, '#D3DCE2', '#EEE6D4', 300, 1300)
    skyline(c, -60, 1300, 1.0, col='#AAB3C1', t=t, seed=7)
    fill(c, R(-600, 1290, 2300, 300), '#BDB6A8', off=None)
    overpass(c, -300, 1400, 690, deck=120, pillar_xs=(70, 1010), ground=1560)
    # traffic held on the deck
    for i in range(5):
        car(c, 180 + i * 200, 690, 0.42, ['#7A3F3A', '#4E5E7A', '#8A7A5A', '#5B6B4A', '#6B5A7A'][i], t, brake=0.8 + 0.2 * math.sin(t * 3 + i), seed=50 + i)
    ground(c, 1560, '#ABA69E', road=True)
    # perimeter tape on posts
    for px_ in (130, 950):
        line(c, [(px_, 1560), (px_, 1440)], 6, '#3A3A40')
    police_tape(c, [(130, 1450), (540, 1470), (950, 1450)], w=22, prog=ease(seg(t, 0.0, 0.8)))
    # device + cones
    if t < boom_t + 0.05:
        board(c, 560, 1520, 0.4, t, LED_G, rot=-6, seed=51, glowamt=1.1)
    else:
        for (poly, (ox, oy, rot)) in zip(FRAGS, FRAG_OFF):
            k = ease_out(seg(t, boom_t, boom_t + 0.35))
            c.save(); c.translate(560 + ox * 0.4 * k * 0.9, 1560 + oy * 0.25 * k); c.rotate(rot * k)
            c.scale(0.4, 0.4)
            c.translate(0, -100)
            pp = P(poly)
            c.save(); c.clipPath(pp, skia.ClipOp.kIntersect, True)
            board(c, 0, 0, 1.0, t, LED_G, wires=False, seed=51, lit=0.55 + 0.35 * vnoise(t * 3, 9), glowamt=0.7)
            c.restore()
            ink(c, pp, 5)
            c.restore()
    for (cx_, cy_) in ((420, 1610), (700, 1610), (380, 1550), (740, 1550)):
        cone(c, cx_, cy_, 0.75)
    rx = lerp(-260, 300, ease_out(seg(t, 0.9, 3.6)))
    robot(c, rx, 1660, 0.62, t, reach=ease(seg(t, 3.4, 4.3)) * (1 - ease(seg(t, boom_t + 0.2, boom_t + 1.0))))
    bomb_tech(c, 880, 1690, 0.72, t, walk=t * 1.2 if t < 1.6 else 0, arm_up=0.3 * ease(seg(t, 2.0, 2.6)))
    car(c, lerp(-400, 120, ease_out(seg(t, -0.2, 0.9))), 1790, 0.9, '#F2F0EA', t, police=True, seed=7)
    barricade(c, 1000, 1830, 0.9, t, seed=3)
    c.restore()
    # stylized controlled disposal: paper burst (no fire, no debris)
    if boom_t - 0.02 < t < boom_t + 0.5:
        u = seg(t, boom_t, boom_t + 0.5)
        sx = (560 - cx) * z + FX; sy = (1520 - cy) * z + FY
        fl = skia.Paint(Color=C('#FFFDF4', 0.55 * (1 - ease_out(u))))
        c.drawRect(skia.Rect.MakeWH(W, H), fl)
        r = 50 + 240 * ease_out(u)
        pts = []
        for i in range(18):
            an = i / 18 * 2 * math.pi + 0.1
            rr_ = r * (1.0 if i % 2 == 0 else 0.62)
            pts.append((sx + math.cos(an) * rr_, sy + math.sin(an) * rr_))
        shape(c, P(pts), '#FFF6DA', 6, a=1 - ease_in(u))
        ink(c, O(sx, sy, r * 1.15), 5, '#E8B54A', 0.8 * (1 - u))
        ink(c, O(sx, sy, r * 0.6), 4, '#E8B54A', 0.6 * (1 - u))

# ================================================================ scene 6: more devices
PINS = [(1300, 1240, 0.15), (1080, 1460, 0.9), (1500, 930, 1.55), (700, 1520, 1.7), (1640, 1500, 2.25), (900, 1050, 2.4), (1250, 700, 2.55),
        (500, 1180, 2.7), (1150, 1780, 2.85), (1720, 1150, 3.0), (820, 1820, 3.1), (1420, 1950, 3.2), (420, 1600, 3.3), (1000, 800, 3.4)]
CAR_ROUTES = [[(1300, 2300), (1380, 1800), (1300, 1260)], [(200, 1640), (800, 1600), (1060, 1480)], [(1460, 300), (1480, 700), (1500, 950)],
              [(2000, 1500), (1700, 1500)], [(300, 900), (600, 1000), (880, 1060)]]

def s6(c, t, d):
    bg(c)
    zu = ease_io(seg(t, 0.3, 3.9))
    z = zexp(1.45, 0.66, zu)
    cx = lerp(1300, 1130, zu) + dr(t, 12); cy = lerp(1240, 1330, zu) + dr(t, 12, seed=4)
    if t > d - 0.5: z *= 1 + 0.4 * ease_in(seg(t, d - 0.5, d + 0.3))
    c.save(); cam(c, cx, cy, z, rot=-4 + t * 1.2)
    boston_map(c, t, a=1.0)
    for i, rt in enumerate(CAR_ROUTES):
        u = seg(t, 0.6 + i * 0.35, 3.6 + i * 0.3)
        if u > 0:
            x, y, an = along(rt, ease_io(u))
            map_car(c, x, y, an, t, 1.6, seed=i)
    for i, (x, y, t0) in enumerate(PINS):
        if t > t0:
            sc = pop(t, t0, 0.4)
            radio_waves(c, x, y, t + i * 0.3, POLICE, n=3, r0=30, r1=260, speed=0.9, a=0.85, w=6)
            board_icon(c, x, y, 2.0 * sc, t, LED_G if i % 3 else LED_C, seed=i)
    c.restore()
    # quick location vignettes popping at a few pins
    vign = [(0.95, 1.85, 250, 760, 'bridge'), (1.75, 2.65, 830, 820, 'transit'), (2.5, 3.4, 260, 1690, 'corner')]
    for (a0, a1, vx, vy, kind) in vign:
        u = ease_out(seg(t, a0, a0 + 0.3)) * (1 - ease_in(seg(t, a1, a1 + 0.3)))
        if u > 0.01:
            def dv(cc, kind=kind):
                cc.save(); cc.scale(0.42, 0.42)
                if kind == 'bridge': _card_bridge(cc, t)
                elif kind == 'transit': _card_transit(cc, t)
                else: _card_wall(cc, t)
                cc.restore()
            bubble(c, vx, vy, 175 * u, dv, seed=hash(kind) % 7)

# ================================================================ scene 7: city disruption
def _platform(c, t):
    # underground station, world y 1700..2700
    fill(c, R(-600, 1560, 2300, 1300), '#E7DFCB', off=None)
    tp = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=1.5, Color=C('#BDB3A0', 0.7))
    for k in range(40):
        c.drawLine(-600, 1600 + k * 40, 1700, 1600 + k * 40, tp)
    fill(c, R(-600, 1820, 2300, 40), BRICK, off=None)
    for k in range(5):
        lx = 40 + k * 260
        shape(c, R(lx, 1640, 140, 18, 6), '#FFF6D8', 3)
        glow(c, lx + 70, 1660, 60, '#FFF6D8', 0.25)
    train(c, -40, 2290, 0.92, t, cars=3, stripe='#D9822B', faces=True, seed=71, lights=True)
    fill(c, R(-600, 2290, 2300, 30), '#5A5A60', off=None)
    shape(c, R(-600, 2320, 2300, 400), '#BDB7AC', 5)
    fill(c, R(-600, 2320, 2300, 24), MUSTARD, off=None)
    on = int(t * 2.5) % 2 == 0
    shape(c, O(980, 1760, 22), '#F2B233' if on else '#9A7428', 3)
    if on: glow(c, 980, 1760, 60, '#FFC23A', 0.5)
    people = [(130, COATS[0], SKIN[0], MUSTARD, 'stand'), (300, COATS[1], SKIN[2], None, 'phone'), (520, COATS[3], SKIN[1], BRICK, 'stand'),
              (720, COATS[4], SKIN[4], None, 'stand'), (900, COATS[6], SKIN[3], '#3A3A40', 'phone')]
    for i, (px_, co, sk, hat, pose) in enumerate(people):
        person(c, px_, 2500 + (i % 2) * 30, 1.05, co, sk, t, pose=pose, hat=hat, look=0.4 + 0.4 * math.sin(t * 1.3 + i), facing=1 if i % 2 else -1, seed=80 + i)

def _bridge_scene(c, t):
    sky(c, '#D0D9E0', '#ECE5D4', 300, 1300)
    skyline(c, -80, 1180, 0.95, col='#AAB3C1', lights=0.2, t=t, seed=3)
    fill(c, R(-600, 1180, 2300, 380), WATER, off=None)
    for k in range(8):
        yy = 1250 + k * 36
        line(c, [(-100 + (t * 30 + k * 70) % 200, yy), (60 + (t * 30 + k * 70) % 200, yy)], 3, '#E8F1F4', 0.7)
        line(c, [(560 + (t * 24 + k * 90) % 260, yy + 14), (700 + (t * 24 + k * 90) % 260, yy + 14)], 3, '#E8F1F4', 0.7)
    # arch truss
    for k in range(9):
        x = -120 + k * 170
        line(c, [(x, 1110), (x + 85, 1000 - 60 * math.sin(min(1, k / 8) * math.pi))], 5, '#6F7C86')
    ink(c, S([(-200, 1110), (150, 960), (540, 920), (930, 960), (1280, 1110)], False), 9, '#6F7C86')
    shape(c, R(-400, 1110, 1900, 70), CONCR, 5)
    for i in range(4):
        car(c, 0 + i * 190, 1112, 0.5, ['#7A3F3A', '#4E5E7A', '#8A7A5A', '#5B6B4A', '#46424E'][i], t, brake=1.0, seed=60 + i)
    bx = lerp(1300, 790, ease_out(seg(t, 0.15, 0.6)))
    barricade(c, bx, 1112, 0.62, t, seed=1)
    barricade(c, bx + 105, 1112, 0.62, t + 0.3, seed=2)
    car(c, 1010, 1112, 0.5, '#F2F0EA', t, police=True, flip=True, seed=9)
    for k in range(6):
        shape(c, R(-120 + k * 260, 1180, 50, 380), CONCR_D, 4)
    # cross-section ground between bridge and station
    fill(c, R(-600, 1440, 2300, 140), '#9C8468', off=None)
    ink(c, P([(-600, 1440), (1700, 1440)], False), 5)

def _wide_city(c, t):
    sky(c, '#CBD5DE', '#EAE3D2', 200, 1150)
    skyline(c, -260, 1150, 1.6, col='#A3ADBD', lights=0.6, t=t, seed=12, zakim=True)
    fill(c, R(-900, 1140, 2900, 260), WATER, off=None)
    ink(c, P([(-900, 1140), (2000, 1140)], False), 4)
    for (bx, bw) in ((-200, 330), (320, 300), (820, 360)):
        shape(c, R(bx, 1180, bw, 26), CONCR, 4)
        for k in range(3):
            car(c, bx + 50 + k * 90, 1180, 0.2, ['#7A3F3A', '#4E5E7A', '#8A7A5A'][k], t, brake=1, seed=k)
        barricade(c, bx + bw - 40, 1182, 0.25, t, seed=bx)
        on = int(t * 4 + bx) % 2 == 0
        glow(c, bx + bw - 10, 1170, 20, SIREN_R if on else SIREN_B, 0.8)
    fill(c, R(-900, 1400, 2900, 900), '#D9CFBC', off=None)
    ink(c, P([(-900, 1400), (2000, 1400)], False), 4)
    # streets with stopped cars and flashing dots
    for r in range(4):
        yy = 1470 + r * 130
        line(c, [(-900, yy), (2000, yy + 20)], 22, '#B8AE9C')
        for k in range(10):
            cx_ = -300 + k * 150 + (r * 50)
            car(c, cx_, yy + 12 + k * 2, 0.16, COATS[(k + r) % len(COATS)], t, brake=1, seed=k + r)
    rr = random.Random(4)
    for i in range(18):
        x, y = rr.uniform(-200, 1300), rr.uniform(1440, 1950)
        on = int(t * 4 + i) % 2 == 0
        glow(c, x, y, 18, SIREN_R if on else SIREN_B, 0.85)
    # elevated train line with stopped trains
    line(c, [(-900, 1350), (2000, 1330)], 12, '#6F6A66')
    train(c, -120, 1340, 0.18, t, cars=3, faces=False, lights=False)
    train(c, 760, 1336, 0.18, t, cars=3, stripe='#3E8E58', faces=False, lights=False)
    helicopter(c, lerp(-200, 1300, seg(t, 3.6, 7.8)), 760 + 20 * math.sin(t * 1.5), 0.7, t)

def s7(c, t, d):
    bg(c)
    if t < 4.05:
        pan = ease_io(seg(t, 1.75, 2.35))
        z = 1.0 + 0.03 * math.sin(t)
        cx = 540 + dr(t, 10) - 40 * seg(t, 0, 2)
        cy = lerp(1160, 2120, pan)
        c.save(); cam(c, cx, cy, z)
        _bridge_scene(c, t)
        _platform(c, t)
        c.restore()
    if t > 3.75:
        u = ease_io(seg(t, 3.75, 4.3))
        surf_draw = lambda cc: None
        zu = ease_io(seg(t, 3.9, d))
        z = zexp(1.75, 0.82, zu)
        cx = lerp(560, 560, zu) + dr(t, 8); cy = lerp(1600, 1330, zu)
        r = 1500 * u
        clip = wob_circle(540, 1500, max(1, r), seed=2, amp=0.03)
        c.save(); c.clipPath(clip, skia.ClipOp.kIntersect, True)
        bg(c)
        c.save(); cam(c, cx, cy, z)
        _wide_city(c, t)
        c.restore()
        c.restore()
        if u < 1: ink(c, clip, 6)

# ================================================================ scene 8: weeks
def s8(c, t, d):
    bg(c)
    cyc_t = max(0.0, t - 2.1)
    night = 0.0
    if t > 2.1:
        ph = cyc_t / 1.75
        night = 0.5 - 0.5 * math.cos(ph * 2 * math.pi)   # day->night->day->night
    z = 1.02 + 0.02 * math.sin(t * 0.5)
    if t > d - 0.5: z *= 1 + 0.4 * ease_in(seg(t, d - 0.5, d + 0.3))
    c.save(); cam(c, 540 + dr(t, 6), 1200 + dr(t, 5, seed=3), z)
    sky(c, '#D3DCE2', '#EEE6D4', 300, 1290)
    if t > 2.1:
        ph = (cyc_t / 1.75) % 1.0
        # sun in day half, moon in night half
        if night < 0.5:
            sun(c, lerp(150, 950, ph), 900 - 260 * math.sin(ph * math.pi), 55, t, a=1 - night * 2)
        else:
            moon(c, lerp(950, 150, ph), 880 - 200 * math.sin(ph * math.pi), 45, a=(night - 0.5) * 2)
    skyline(c, -60, 1290, 1.05, col='#AAB3C1', lights=0.15 + night, t=t, seed=4)
    fill(c, R(-600, 1280, 2300, 240), '#BDB6A8', off=None)
    ground(c, 1500, '#ABA69E', road=True)
    car(c, lerp(-500, 1500, (t * 0.22) % 1), 1300, 0.32, '#5C6E8A', t)
    overpass(c, -300, 1400, 600, deck=130, pillar_xs=(110, 970), ground=1500)
    line(c, [(430, 732), (430, 790)], 5, '#E8E4D8'); line(c, [(650, 732), (650, 790)], 5, '#E8E4D8')
    # fading police from the present
    pol = 1 - ease(seg(t, 0.0, 0.9))
    if pol > 0.01:
        soft_light(c, 300, 1400, 700, SIREN_R if int(t * 6) % 2 else SIREN_B, 0.25 * pol)
    board(c, 540, 950, 0.95, t, LED_G, glowamt=1.0 + 0.8 * night, seed=1)
    # pedestrians passing without reacting (past)
    if t > 2.0:
        walkers = [(0, 1, 1.0, COATS[0], SKIN[0], MUSTARD), (1, -1, 1.3, COATS[1], SKIN[2], None), (2, 1, 0.8, COATS[5], SKIN[4], BRICK),
                   (3, -1, 1.1, COATS[3], SKIN[1], None), (4, 1, 1.6, COATS[6], SKIN[3], None)]
        for (i, dirn, sp, coat, skn, hat) in walkers:
            xx = ((cyc_t * 150 * sp + i * 330) % 1600) - 260
            if dirn < 0: xx = 1340 - xx
            person(c, xx, 1640 + (i % 3) * 40, 0.95, coat, skn, t, walk=cyc_t * 1.2 * sp + i, facing=dirn, hat=hat, seed=90 + i, bag=(i == 3))
    c.restore()
    if night > 0:
        npaint = skia.Paint(Color=C('#1B2140', 0.42 * night)); npaint.setBlendMode(skia.BlendMode.kMultiply)
        c.drawRect(skia.Rect.MakeLTRB(0, 0, W, H), npaint)
        # re-light the board through the night
        bx_, by_ = (540 - (540 + dr(t, 6))) * z + FX, (950 - (1200 + dr(t, 5, seed=3))) * z + FY
        soft_light(c, bx_, by_, 260, LED_G, 0.35 * night)
        rr = random.Random(3)
        for i in range(30):
            sx, sy = rr.uniform(0, W), rr.uniform(500, 1000)
            c.drawCircle(sx, sy, 2.2, skia.Paint(AntiAlias=True, Color=C('#FFF8DC', 0.7 * night * (0.6 + 0.4 * math.sin(t * 5 + i)))))
    # calendar: flips backward
    cu = ease_out(seg(t, 0.55, 0.9))
    if cu > 0:
        shrink = ease_io(seg(t, 2.0, 2.6))
        cxp = lerp(540, 900, shrink); cyp = lerp(1240, 640, shrink); sc = lerp(1.35, 0.42, shrink) * cu
        flips = [0.95 + i * 0.17 for i in range(6)]
        cur_marks = 26
        for i, ft in enumerate(flips):
            if t > ft + 0.17: cur_marks = 26 - (i + 1) * 4
        extra = int(max(0, t - 2.6) / 0.45)
        cur_marks = max(0, cur_marks - extra)
        calendar(c, cxp, cyp, sc, seed=5, marks=cur_marks, rot=-3)
        for i, ft in enumerate(flips):
            if ft < t < ft + 0.3:
                u = seg(t, ft, ft + 0.3)
                calendar(c, cxp, cyp - 120 * u * sc, sc, seed=5, marks=26 - i * 4, rot=-3, flipu=ease_in(u), a=1 - u)

# ================================================================ scene 9: other cities
def s9(c, t, d):
    bg(c)
    zoomb = ease_io(seg(t, 5.0, 6.4))
    z = 1.0 + 0.03 * math.sin(t * 0.6)
    c.save(); cam(c, 540 + dr(t, 6), 1200 + dr(t, 6, seed=5), z)
    pts = [us_xy(*q, oy=1120) for q in US]
    draw = ease(seg(t, -0.3, 0.8))
    oa = 1.0 - 0.55 * zoomb
    us = S(pts)
    fill(c, R(-200, 600, 1500, 1100), '#CFE0E6', a=0.6 * oa, off=None)
    shape(c, us, '#EFE3C6', 6, a=oa)
    # loose state-ish lines
    for lon in (-114, -104, -94, -85):
        a_ = us_xy(lon, 48.5, oy=1120); b_ = us_xy(lon, 31.5, oy=1120)
        line(c, [a_, b_], 2, GRAY, 0.35 * oa)
    order = ['boston', 'nyc', 'phl', 'atl', 'chi', 'aus', 'la', 'sf', 'pdx', 'sea']
    for i, k in enumerate(order):
        x, y = us_xy(*CITIES[k], oy=1120)
        t0 = 0.8 + i * 0.22
        if t > t0:
            sc = pop(t, t0)
            c.drawCircle(x, y, 9 * sc, skia.Paint(AntiAlias=True, Color=C(INK, oa)))
        t1 = 1.9 + i * 0.25
        if t > t1 and k != 'boston':
            board_icon(c, x, y - 36, 0.9 * pop(t, t1), t, LED_G if i % 2 else LED_C, seed=i, a=oa)
        if k == 'boston' and t > 1.6:
            board_icon(c, x, y - 36, 0.9 * pop(t, 1.6), t, LED_G, seed=i, a=1.0)
    c.restore()
    # calm insets: people walk past boards
    calm = [(2.4, 4.6, 230, 1520, 'la'), (3.0, 5.0, 560, 1600, 'chi'), (3.6, 5.2, 860, 1500, 'atl')]
    for j, (a0, a1, vx, vy, k) in enumerate(calm):
        u = ease_out(seg(t, a0, a0 + 0.3)) * (1 - ease_in(seg(t, a1, a1 + 0.3)))
        if u > 0.01:
            x, y = us_xy(*CITIES[k], oy=1120)
            ink(c, P([(x, y), (vx, vy - 140 * u)], False), 3, a=0.7 * u)
            def dv(cc, j=j):
                cc.save(); cc.scale(0.38, 0.38)
                sky(cc, '#D8E0E4', '#EDE6D6', -400, 200)
                brick_wall(cc, -400, -360, 800, 560, seed=j, col=[BRICK, '#B98A5E', '#8E7F74'][j])
                board(cc, 0, -100, 0.7, t, LED_C if j % 2 else LED_G, seed=60 + j)
                ground(cc, 200, '#C4BDB0', road=False)
                person(cc, -380 + ((t * 140 + j * 200) % 760), 330, 1.0, COATS[j + 1], SKIN[j], t, walk=t * 1.3, seed=j)
                cc.restore()
            bubble(c, vx, vy, 150 * u, dv, seed=j)
    # Boston expands into the big security response
    bx, by = us_xy(*CITIES['boston'], oy=1120)
    bu = ease_io(seg(t, 5.2, 6.5))
    if bu > 0.001:
        r = lerp(14, 470, bu)
        cxp, cyp = lerp(bx, 540, bu), lerp(by, 1390, bu)
        def boston_resp(cc):
            cc.save(); s_ = r / 470.0; cc.scale(s_, s_)
            sky(cc, '#C7D1DA', '#E7E0CF', -480, 120)
            skyline(cc, -520, 60, 0.75, col='#9AA5B6', lights=0.5, t=t, seed=21)
            fill(cc, R(-600, 60, 1200, 600), '#AEA9A1', off=None)
            ph = (t * 3) % 1
            soft_light(cc, 0, 120, 600, SIREN_R if ph < 0.5 else SIREN_B, 0.3)
            helicopter(cc, -150 + 60 * math.sin(t * 0.8), -260, 0.7, t)
            police_tape(cc, [(-480, 150), (0, 175), (480, 150)], w=20)
            car(cc, -240, 330, 0.62, '#F2F0EA', t, police=True, seed=1)
            car(cc, 250, 300, 0.55, '#F2F0EA', t + 0.2, police=True, flip=True, seed=2)
            barricade(cc, -10, 400, 0.6, t, seed=3); barricade(cc, 150, 410, 0.6, t + 0.4, seed=4)
            bomb_tech(cc, 60, 330, 0.48, t)
            for (kx, ky) in ((-70, 150), (70, 150)): cone(cc, kx, ky, 0.45)
            board(cc, 0, 120, 0.2, t, LED_G, seed=5)
            cc.restore()
        bubble(c, cxp, cyp, r, boston_resp, seed=9, w=7)
        if bu > 0.6:
            radio_waves(c, cxp, cyp, t, SIREN_R, n=2, r0=r, r1=r + 70, speed=1.2, a=0.6 * (bu - 0.6) / 0.4, w=5)

# ================================================================ scene 10: aftermath
def s10(c, t, d):
    bg(c)
    z = zexp(1.12, 0.96, ease_io(seg(t, 0, d)))
    if t > d - 0.5: z *= 1 + 0.35 * ease_in(seg(t, d - 0.5, d + 0.3))
    c.save(); cam(c, 540 + dr(t, 8), 1200 + dr(t, 8, seed=6), z, rot=dr(t, 1.2, seed=8))
    fill(c, R(-600, 300, 2300, 1800), '#E2D3B8', a=0.55, off=None)
    # 1. board -> newspaper photo
    nu = ease_out(seg(t, 1.0, 1.6))
    bs = lerp(0.9, 0.36, ease_io(seg(t, 1.1, 1.9)))
    bxy = (lerp(540, 470, ease_io(seg(t, 1.1, 1.9))), lerp(1150, 1000, ease_io(seg(t, 1.1, 1.9))))
    if nu > 0:
        c.save(); c.translate(lerp(-600, 520, nu), 1080); c.rotate(-5)
        shape(c, R(-330, -380, 660, 760, 4), '#F2EEE4', 5)
        fill(c, R(-300, -350, 600, 60, 4), '#3A3A44', off=None)
        fill(c, R(-300, -270, 520, 34, 10), '#6A6E80', off=None)
        fill(c, R(-300, -222, 400, 26, 10), '#8A8E9C', off=None)
        shape(c, R(-300, -170, 280, 300, 4), '#E9E4DA', 3)
        for col_ in range(2):
            scribble_lines(c, 10 + col_ * 150, -170, 130, 500, 12, '#8A8E9C', 2.4, seed=col_ + 7, a=0.8)
        scribble_lines(c, -300, 150, 290, 190, 5, '#8A8E9C', 2.4, seed=17, a=0.8)
        c.restore()
    if t < 4.9:
        board(c, bxy[0], bxy[1], bs, t, LED_G, wires=t < 1.2, seed=101, glowamt=1.0 - 0.5 * ease(seg(t, 1.1, 2.0)))
    # 2. corporate document
    cu_ = ease_out(seg(t, 2.6, 3.2))
    if cu_ > 0:
        doc(c, lerp(1500, 760, cu_), 1280, 0.85, rot=7, seed=3, kind='corp')
    # 3. apology letter (signature)
    au = ease_out(seg(t, 4.4, 4.9))
    if au > 0:
        doc(c, lerp(540, 540, au), lerp(2300, 1180, au), 1.05, rot=-2, seed=8, kind='letter',
            prog=ease(seg(t, 4.6, 5.8)), sign=ease(seg(t, 5.4, 6.4)))
        if 5.3 < t < 6.6:
            sp = ease(seg(t, 5.4, 6.4))
            px_ = -10 + sp * 140; py_ = 190 + math.sin(sp * 19) * 14 - sp * 10
            c.save(); c.translate(540, 1180); c.rotate(-2); c.scale(1.05, 1.05)
            c.save(); c.translate(px_, py_); c.rotate(35)
            shape(c, R(-8, -150, 16, 150, 6), '#2D3A7A', 3); shape(c, P([(-8, 0), (8, 0), (0, 16)]), '#D8C9A8', 2.5)
            c.restore(); c.restore()
    # 4. agreement papers + money
    gu = ease_out(seg(t, 6.5, 7.1))
    if gu > 0:
        doc(c, lerp(-500, 330, gu), 1100, 0.78, rot=-6, seed=12, kind='agree', sign=ease(seg(t, 7.2, 7.9)))
        doc(c, lerp(1600, 760, gu), 1110, 0.78, rot=5, seed=14, kind='agree', sign=ease(seg(t, 7.5, 8.2)), stamp=seg(t, 9.4, 9.7))
        c.save(); c.translate(330, 1100); c.rotate(-6); c.scale(0.78, 0.78)
        if t > 9.0:
            sc_ = seg(t, 9.0, 9.3)
            c.save(); c.translate(-90, 160); c.rotate(-14); c.scale(back_out(sc_), back_out(sc_))
            ink(c, O(0, 0, 50), 5, BRICK, 0.85); ink(c, O(0, 0, 38), 3, BRICK, 0.7)
            line(c, [(-26, 0), (-6, 18), (28, -20)], 6, BRICK, 0.85)
            c.restore()
        c.restore()
    mu = seg(t, 7.9, 9.4)
    if mu > 0:
        for i, (mx, hmax) in enumerate(((300, 210), (540, 290), (780, 240))):
            h = hmax * ease_out(seg(mu, i * 0.15, 0.7 + i * 0.15))
            money_stack(c, mx, 1720, h, 0.9, seed=i)
        for i in range(7):
            ft = 8.1 + i * 0.25
            if t > ft:
                u = seg(t, ft, ft + 1.6)
                bill(c, 200 + i * 110 + 30 * math.sin(t * 2 + i), lerp(650, 1600, ease_out(u)), 0.6, rot=30 * math.sin(t * 3 + i), seed=i, a=1 - ease_in(seg(u, 0.75, 1)))
    c.restore()

# ================================================================ scene 11: one ad, whole city
def s11(c, t, d):
    bg(c)
    zu = ease_io(seg(t, 0.15, d - 0.2))
    z = zexp(3.3, 0.40, zu)
    cx, cy = dr(t, 4), -30 + dr(t, 4, seed=2) + lerp(0, 120, zu)
    c.save(); cam(c, cx, cy, z)
    # far: sky + skyline
    sky(c, '#CBD5DE', '#ECE5D4', -2600, -1050)
    skyline(c, -1700, -1050, 3.4, col='#A3ADBD', lights=0.4, t=t, seed=31)
    fill(c, R(-3000, -1060, 6000, 5000), '#D6CEBE', off=None)
    ink(c, P([(-3000, -1060), (3000, -1060)], False), 6)
    # elevated train stopped
    shape(c, R(-2200, -930, 4400, 50), '#6F6A66', 6)
    train(c, -1250, -932, 1.1, t, cars=2, stripe='#D9822B', faces=True, seed=33)
    for k in range(7): shape(c, R(-1900 + k * 600, -880, 60, 260), CONCR_D, 5)
    # bridge closure
    shape(c, R(-2200, -560, 4400, 90), CONCR, 6)
    fill(c, R(-2200, -470, 4400, 200), WATER, off=None)
    for i in range(6):
        car(c, -1500 + i * 330, -562, 0.85, COATS[i % len(COATS)], t, brake=1, seed=110 + i)
    barricade(c, 600, -562, 1.0, t, seed=5); barricade(c, 800, -562, 1.0, t + 0.3, seed=6)
    car(c, 1150, -562, 0.85, '#F2F0EA', t, police=True, flip=True, seed=12)
    helicopter(c, 1050 + 100 * math.sin(t * 0.5), -1500, 1.6, t)
    # street ring
    fill(c, R(-2200, -270, 4400, 40), '#B8AE9C', off=None)
    car(c, -760, 330, 0.85, '#F2F0EA', t, police=True, seed=13)
    car(c, 760, 360, 0.85, '#F2F0EA', t + 0.2, police=True, flip=True, seed=14)
    car(c, -900, 620, 0.85, '#F2F0EA', t + 0.4, police=True, seed=15)
    car(c, 950, 640, 0.85, '#F2F0EA', t + 0.1, police=True, flip=True, seed=16)
    barricade(c, -420, 560, 0.95, t, seed=7); barricade(c, 440, 570, 0.95, t + 0.5, seed=8)
    barricade(c, -250, 590, 0.95, t + 0.2, seed=9); barricade(c, 260, 600, 0.95, t + 0.7, seed=10)
    tv_camera(c, 600, 60, 1.15, t, flip=True)
    person(c, 760, 80, 0.95, COATS[4], SKIN[1], t, pose='stand', seed=120)
    tv_camera(c, -620, 80, 1.15, t)
    person(c, -780, 100, 0.95, COATS[2], SKIN[3], t, pose='stand', facing=1, seed=121)
    news_van(c, -1250, 300, 1.1, t)
    news_van(c, 1300, 260, 1.0, t, flip=True)
    crowd = [(-560, 700, COATS[0], SKIN[0], 'stand'), (-460, 720, COATS[1], SKIN[2], 'point'), (-360, 700, COATS[5], SKIN[4], 'phone'),
             (300, 720, COATS[6], SKIN[3], 'stand'), (420, 700, COATS[3], SKIN[1], 'phone'), (540, 730, COATS[2], SKIN[0], 'point')]
    for i, (px_, py_, co, sk, pose) in enumerate(crowd):
        person(c, px_ * 1.25, py_ + 40, 0.95, co, sk, t, pose=pose, facing=1 if px_ < 0 else -1, look=0.3, seed=130 + i,
               hat=[MUSTARD, None, BRICK][i % 3])
    # stopped traffic far ring
    for r in range(2):
        for k in range(9):
            car(c, -2000 + k * 470 + r * 200, 1150 + r * 260, 0.8, COATS[(k + r) % len(COATS)], t, brake=1, seed=140 + k + r * 9)
    # subway
    fill(c, R(-2200, 1700, 4400, 600), '#9C8468', off=None)
    train(c, -900, 2060, 1.0, t, cars=3, faces=True, seed=150)
    # inner ring
    police_tape(c, [(math.cos(a_ / 14 * 2 * math.pi) * 250, 70 + math.sin(a_ / 14 * 2 * math.pi) * 150) for a_ in range(15)], w=14)
    for (cx_, cy_) in ((-140, 120), (140, 120), (-170, 30), (170, 30)):
        cone(c, cx_, cy_, 0.4)
    robot(c, -330, 220, 0.4, t)
    bomb_tech(c, 330, 230, 0.42, t)
    board(c, 0, 60, 0.26, t, LED_G, seed=160, glowamt=1.4)
    pulse = 0.5 + 0.5 * math.sin(t * 4)
    ring_a = ease(seg(t, 4.0, 5.0))
    if ring_a > 0:
        ink(c, wob_circle(0, 60, 90 + 12 * pulse, seed=3, amp=0.08), 5 / max(z, 0.5), BRICK, ring_a)
    c.restore()
    # sweeping lights everywhere at wide zoom
    if zu > 0.5:
        rr = random.Random(8)
        for i in range(14):
            sx, sy = rr.uniform(40, 1040), rr.uniform(700, 1800)
            on = int(t * 4 + i) % 2 == 0
            glow(c, sx, sy, 14, SIREN_R if on else SIREN_B, 0.5 * (zu - 0.5) * 2)

# ================================================================ scene 12: ending
def s12(c, t, d):
    bg(c)
    z = 1.0 + 0.04 * ease_io(seg(t, 0, d))
    c.save(); cam(c, 540 + dr(t, 5), 1200 + dr(t, 4, seed=3), z)
    sky(c, '#D3DCE2', '#EEE6D4', 300, 1320)
    skyline(c, -60, 1320, 1.05, col='#B4BCC8', lights=0.25, t=t, seed=4)
    fill(c, R(-600, 1310, 2300, 250), '#C3BCAE', off=None)
    for i in range(6):
        car(c, -120 + i * 230, 1360, 0.36, COATS[i % len(COATS)], t, brake=1.0, seed=200 + i)
    ph = (t * 3.2) % 1.0
    soft_light(c, 540, 1440, 600, SIREN_R if ph < 0.5 else SIREN_B, 0.16)
    car(c, 250, 1440, 0.42, '#F2F0EA', t, police=True, seed=210)
    car(c, 840, 1450, 0.42, '#F2F0EA', t + 0.25, police=True, flip=True, seed=211)
    barricade(c, 420, 1452, 0.4, t, seed=2); barricade(c, 660, 1452, 0.4, t + 0.4, seed=3)
    overpass(c, -300, 1400, 640, deck=130, pillar_xs=(90, 990), ground=1560)
    line(c, [(430, 772), (430, 830)], 5, '#E8E4D8'); line(c, [(650, 772), (650, 830)], 5, '#E8E4D8')
    board(c, 540, 1000, 0.95, t, LED_G, glowamt=1.25, seed=1)
    ground(c, 1560, '#ABA69E', road=True)
    c.restore()

SCENES = [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12]
