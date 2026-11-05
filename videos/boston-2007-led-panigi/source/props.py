"""Illustrated props."""
import math, random
import skia
from lib import *

# ================================================================ LED board
# generic pixel-art alien (original design): antennae, block head, big eyes, waving arm
ALIEN = [
    "...#.....#...",
    "....#...#....",
    "...#######...",
    "..#########..",
    "..#w.###w.#..",
    "..#..###..#..",
    "..#########..",
    "..##.....##..",
    "...#######...",
    ".....###.....",
    "....#####....",
    "....#####....",
    "....#...#....",
    "...##...##...",
]
ARM_L = [(10, 3), (11, 2), (12, 1)]
ARM_A = [(10, 9), (9, 10), (8, 11)]
ARM_B = [(10, 9), (10, 10), (10, 11)]

def _alien_pixels(t, wave=True):
    px = []
    for r, row in enumerate(ALIEN):
        for cidx, ch in enumerate(row):
            if ch == '#': px.append((r, cidx, 'b'))
            elif ch == 'w': px.append((r, cidx, 'w'))
    for (r, cc) in ARM_L: px.append((r, cc, 'b'))
    arm = ARM_A if (not wave or int(t * 2.2) % 2 == 0) else ARM_B
    for (r, cc) in arm: px.append((r, cc, 'b'))
    return px

def board(c, cx, cy, s=1.0, t=0.0, led=LED_G, glowamt=1.0, wave=True, wires=True, rot=0.0,
          seed=0, lit=1.0, batteries=True, count=None):
    """front of LED board, centered at cx,cy; s=1 -> ~340px wide"""
    p = 24.0
    cols, rows = 13, 14
    bw, bh = cols * p + 30, rows * p + 30
    c.save(); c.translate(cx, cy); c.rotate(rot); c.scale(s, s)
    x0, y0 = -bw / 2, -bh / 2
    if wires:
        # cables dangling to a taped battery pack under the board
        line(c, [(-bw * 0.28, bh / 2 - 4), (-bw * 0.32, bh / 2 + 30), (-bw * 0.18, bh / 2 + 62), (-bw * 0.1, bh / 2 + 70)], 4, '#B33A2E', smooth=True, seed=seed + 1)
        line(c, [(-bw * 0.2, bh / 2 - 4), (-bw * 0.24, bh / 2 + 26), (-bw * 0.06, bh / 2 + 58), (0, bh / 2 + 66)], 4, '#202024', smooth=True, seed=seed + 2)
        line(c, [(bw * 0.3, bh / 2 - 4), (bw * 0.36, bh / 2 + 22), (bw * 0.28, bh / 2 + 44), (bw * 0.36, bh / 2 + 64)], 3.5, '#B33A2E', smooth=True, seed=seed + 3)
        if batteries:
            for i in range(3):
                bx = -bw * 0.12 + i * 30
                shape(c, R(bx, bh / 2 + 58, 26, 44, 7), '#2B2B30', 3, seed=seed + 10 + i)
                fill(c, R(bx + 2, bh / 2 + 58, 22, 10, 4), '#C9893A', hatch=False, off=None)
            fill(c, R(-bw * 0.14, bh / 2 + 72, 96, 12, 2), '#9A9A9E', a=0.75, hatch=False, off=None)
    # board body
    body = R(x0, y0, bw, bh, 12)
    shape(c, body, BOARD, 5, seed=seed)
    # faint circuit traces
    tp = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=1.6, Color=C('#3E7A5C', 0.45))
    tp.setPathEffect(skia.DiscretePathEffect.Make(8, 0.8, abs(G.seed + seed)))
    for r in range(1, rows, 2):
        yy = y0 + 15 + r * p + p / 2
        c.drawLine(x0 + 10, yy, x0 + bw - 10, yy, tp)
    c.drawRect(skia.Rect.MakeXYWH(x0 + bw - 54, y0 + bh - 34, 36, 20), tp)
    # screws
    for (sx, sy) in [(x0 + 10, y0 + 10), (x0 + bw - 10, y0 + 10), (x0 + 10, y0 + bh - 10), (x0 + bw - 10, y0 + bh - 10)]:
        c.drawCircle(sx, sy, 3.2, skia.Paint(AntiAlias=True, Color=C('#8A8A90')))
    px = _alien_pixels(t, wave)
    if count is not None:
        holes = px[int(count):]
        px = px[:int(count)]
        hp_ = skia.Paint(AntiAlias=True, Color=C('#3A3D46'))
        for (r, cc, k) in holes:
            c.drawCircle(x0 + 15 + cc * p + p / 2, y0 + 15 + r * p + p / 2, p * 0.16, hp_)
    flick = 0.88 + 0.12 * vnoise(t * 9, seed + 5)
    if int(t * 7 + seed) % 23 == 0: flick *= 0.75
    L = lit * flick
    gpath, gpathw = skia.Path(), skia.Path()
    for (r, cc, k) in px:
        x = x0 + 15 + cc * p + p / 2; y = y0 + 15 + r * p + p / 2
        (gpathw if k == 'w' else gpath).addCircle(x, y, p * 0.5)
    if glowamt > 0 and L > 0.05:
        glow_path(c, gpath, led, p * 0.42, 0.6 * glowamt * L)
        glow_path(c, gpathw, LED_W, p * 0.42, 0.6 * glowamt * L)
    for i, (r, cc, k) in enumerate(px):
        x = x0 + 15 + cc * p + p / 2; y = y0 + 15 + r * p + p / 2
        col = LED_W if k == 'w' else led
        li = L * (0.9 + 0.1 * vnoise(t * 6 + i * 0.37, seed))
        c.drawCircle(x, y, p * 0.33, skia.Paint(AntiAlias=True, Color=C('#2E3A34')))
        c.drawCircle(x, y, p * 0.29, skia.Paint(AntiAlias=True, Color=C(col, max(0.15, li))))
        c.drawCircle(x, y, p * 0.17, skia.Paint(AntiAlias=True, Color=C('#F4FFF2', 0.75 * li)))
        c.drawCircle(x - 2, y - 2, p * 0.08, skia.Paint(AntiAlias=True, Color=C('#FFFFFF', 0.9 * li)))
    c.restore()
    return bw * s, bh * s

def board_back(c, cx, cy, s=1.0, t=0.0, seed=0, leak=1.0):
    """rear view: batteries, tape, wires - why it looked suspicious"""
    p = 24.0
    bw, bh = 13 * p + 30, 14 * p + 30
    c.save(); c.translate(cx, cy); c.scale(s, s)
    x0, y0 = -bw / 2, -bh / 2
    # light leaking around edges
    if leak > 0:
        glow_path(c, R(x0 - 6, y0 - 6, bw + 12, bh + 12, 16), LED_G, 18, 0.35 * leak * (0.85 + 0.15 * vnoise(t * 8, 3)))
    shape(c, R(x0, y0, bw, bh, 12), '#33353D', 5, seed=seed)
    # LED leads dotted on back
    lp = skia.Paint(AntiAlias=True, Color=C('#A6A8AE', 0.8))
    for r, row in enumerate(ALIEN):
        for cc, ch in enumerate(row):
            if ch in '#w':
                x = x0 + 15 + (12 - cc) * p + p / 2; y = y0 + 15 + r * p + p / 2
                c.drawCircle(x - 3, y, 1.8, lp); c.drawCircle(x + 3, y, 1.8, lp)
    # small PCB
    shape(c, R(x0 + 24, y0 + 26, 110, 70, 6), '#2F6B4A', 3.5, seed=seed + 4)
    for i in range(3):
        fill(c, R(x0 + 36 + i * 32, y0 + 44, 20, 30, 2), '#141418', hatch=False, off=None)
    # batteries (lying horizontal) with tape
    for i in range(4):
        by = y0 + 150 + i * 46
        shape(c, R(x0 + 70, by, 150, 38, 12), '#26262B', 3.5, seed=seed + 20 + i)
        fill(c, R(x0 + 70, by, 34, 38, 10), '#C9893A', hatch=True, off=None)
        fill(c, R(x0 + 220, by + 12, 8, 14, 2), '#B9B9BE', hatch=False, off=None)
    for k in range(2):
        tx = x0 + 120 + k * 70
        fill(c, R(tx, y0 + 140, 30, 200, 3), '#8D8D93', a=0.72, hatch=True, off=None)
        ink(c, R(tx, y0 + 140, 30, 200, 3), 2, '#5E5E66', 0.6)
    # wires
    wob = math.sin(t * 2.0) * 3
    line(c, [(x0 + 228, y0 + 170), (x0 + 280, y0 + 150 + wob), (x0 + 300, y0 + 90), (x0 + 134, y0 + 60)], 5, '#C23B2E', smooth=True, seed=seed + 31)
    line(c, [(x0 + 228, y0 + 262), (x0 + 300, y0 + 250 - wob), (x0 + 320, y0 + 120), (x0 + 134, y0 + 80)], 5, '#16161A', smooth=True, seed=seed + 32)
    line(c, [(x0 + 60, y0 + 96), (x0 + 30, y0 + 200), (x0 + 50, y0 + 300 + wob), (x0 + 90, y0 + bh + 40 + wob)], 4.5, '#C23B2E', smooth=True, seed=seed + 33)
    line(c, [(x0 + 70, y0 + 96), (x0 + 44, y0 + 210), (x0 + 66, y0 + 310 - wob), (x0 + 110, y0 + bh + 30)], 4.5, '#16161A', smooth=True, seed=seed + 34)
    # zip tie / mount
    for (mx, my) in [(x0 + 30, y0 - 6), (x0 + bw - 30, y0 - 6)]:
        line(c, [(mx, my), (mx, my - 40)], 4, '#E8E4D8', seed=seed + 40)
    c.restore()

def board_icon(c, x, y, s, t, led=LED_G, seed=0, a=1.0):
    """tiny glowing board icon for maps"""
    c.save(); c.translate(x, y); c.scale(s, s)
    glow(c, 0, 0, 40, led, 0.35 * a * (0.8 + 0.2 * vnoise(t * 5, seed)))
    shape(c, R(-22, -24, 44, 48, 5), BOARD, 3, a=a, seed=seed)
    pt = skia.Paint(AntiAlias=True, Color=C(led, a))
    for (r, cc) in [(0, 1), (0, 4), (1, 0), (1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (2, 0), (2, 2), (2, 3), (2, 5), (3, 0), (3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (4, 1), (4, 2), (4, 3), (4, 4), (5, 2), (5, 3)]:
        c.drawCircle(-15 + cc * 6, -16 + r * 6.5, 2.4, pt)
    c.restore()

# ================================================================ vehicles
def car(c, x, y, s=1.0, col='#8A3E36', t=0.0, police=False, flip=False, brake=0.0, seed=0, flash_speed=3.2, lights_on=True, bounce=0.0):
    c.save(); c.translate(x, y + bounce); c.scale(-s if flip else s, s)
    if police and lights_on:
        ph = (t * flash_speed + seed * 0.37) % 1.0
        colL = SIREN_R if ph < 0.5 else SIREN_B
        soft_light(c, 0, -120, 260, colL, 0.32)
    body = S([(-172, -30), (-170, -64), (-128, -72), (-74, -76), (-44, -112), (54, -114), (96, -78), (160, -68), (176, -52), (176, -30)], True)
    shadow = O(0, 0, 175, 10)
    flat(c, shadow, '#000000', 0.18)
    shape(c, body, col, 4.5, seed=seed)
    if police:
        fill(c, P([(-170, -58), (176, -50), (176, -40), (-170, -46)]), POLICE, hatch=True, off=None)
        # badge star
        st = []
        for i in range(10):
            a = -math.pi / 2 + i * math.pi / 5; rr = 11 if i % 2 == 0 else 5
            st.append((-60 + math.cos(a) * rr, -60 + math.sin(a) * rr))
        shape(c, P(st), MUSTARD, 2)
    shape(c, P([(-36, -104), (2, -106), (2, -80), (-60, -78)]), '#B9CCD8', 3, seed=seed + 1)
    shape(c, P([(10, -106), (50, -106), (84, -80), (10, -80)]), '#B9CCD8', 3, seed=seed + 2)
    line(c, [(6, -108), (6, -34)], 3, seed=seed + 3)
    line(c, [(-80, -74), (-80, -34)], 2.5, a=0.6, seed=seed + 4)
    for wx in (-112, 112):
        shape(c, O(wx, -28, 29), '#1E1E22', 4, seed=seed + 5)
        shape(c, O(wx, -28, 12), '#A8A8AE', 2.5, seed=seed + 6)
    # lights
    glow(c, 170, -56, 9, '#FFF2B0', 0.9)
    tail = 0.6 + brake * 0.4
    fill(c, R(-174, -62, 9, 14, 2), '#D4372E', a=1, hatch=False, off=None)
    if brake > 0:
        glow(c, -176, -55, 22 * brake, '#FF3B2A', 0.55 * brake)
    if police:
        ph = (t * flash_speed + seed * 0.37) % 1.0
        shape(c, R(-34, -128, 68, 14, 4), '#2A2A30', 3)
        on_r = (ph < 0.5) and lights_on
        on_b = (ph >= 0.5) and lights_on
        fill(c, R(-32, -127, 31, 12, 3), SIREN_R if on_r else '#7A2A26', hatch=False, off=None)
        fill(c, R(1, -127, 31, 12, 3), SIREN_B if on_b else '#22346A', hatch=False, off=None)
        if on_r: glow(c, -16, -121, 34, SIREN_R, 0.75)
        if on_b: glow(c, 16, -121, 34, SIREN_B, 0.75)
    c.restore()

def helicopter(c, x, y, s=1.0, t=0.0, light=True, seed=0):
    c.save(); c.translate(x, y); c.scale(s, s)
    if light:
        sp = skia.Paint(AntiAlias=True)
        sp.setShader(skia.GradientShader.MakeLinear([skia.Point(0, 20), skia.Point(0, 420)], [C('#FFF6D0', 0.38), C('#FFF6D0', 0)]))
        c.drawPath(P([(-20, 20), (20, 20), (110, 420), (-130, 420)]), sp)
    shape(c, S([(-60, -10), (-20, -38), (40, -36), (66, -8), (50, 18), (-40, 20)]), '#31406A', 4, seed=seed)
    shape(c, P([(-58, -8), (-160, -22), (-162, -10), (-60, 8)]), '#31406A', 3.5, seed=seed + 1)
    shape(c, S([(10, -30), (40, -28), (58, -8), (14, -8)]), '#BFD3E0', 3, seed=seed + 2)
    line(c, [(-40, 30), (50, 30)], 4, seed=seed + 3)
    line(c, [(-26, 18), (-30, 30)], 3); line(c, [(34, 18), (38, 30)], 3)
    ph = t * 30
    rx = 120 * abs(math.cos(ph))
    line(c, [(-rx, -46), (rx, -46)], 4, a=0.8)
    line(c, [(5, -38), (5, -46)], 4)
    flat(c, O(0, -46, 125, 7), INK, 0.12)
    ry = 26 * abs(math.sin(ph * 1.3))
    line(c, [(-160, -16 - ry), (-160, -16 + ry)], 3, a=0.7)
    if int(t * 2) % 2 == 0: glow(c, -160, -24, 8, SIREN_R, 0.9)
    c.restore()

def train(c, x, y, s=1.0, t=0.0, cars=2, stripe='#D9822B', faces=True, seed=0, lights=True):
    """subway train side view; (x,y) = left bottom of rails"""
    c.save(); c.translate(x, y); c.scale(s, s)
    L = 420
    for k in range(cars):
        ox = k * (L + 14)
        shape(c, R(ox, -230, L, 200, 22), '#C9CCD0', 4.5, seed=seed + k)
        fill(c, R(ox + 2, -120, L - 4, 18, 0), stripe, hatch=True, off=None)
        # windows w/ passengers
        for i in range(5):
            wx = ox + 22 + i * 80
            shape(c, R(wx, -200, 58, 62, 8), '#D9E6EA', 3, seed=seed + 10 + i + k * 7)
            if faces and (i + k) % 2 == 0:
                rr = random.Random(seed + i + k * 11)
                hx = wx + 18 + rr.uniform(0, 20)
                look = math.sin(t * 1.3 + i) * 3
                flat(c, O(hx + look, -160, 12, 13), rr.choice(SKIN))
                flat(c, R(hx - 15, -148, 30, 12, 6), rr.choice(COATS))
                ink(c, O(hx + look, -160, 12, 13), 2)
        # doors
        line(c, [(ox + L / 2 - 2, -228), (ox + L / 2 - 2, -34)], 2.5, a=0.6)
        for wx in (ox + 60, ox + L - 60):
            shape(c, O(wx, -24, 18), '#2A2A2E', 3)
    if lights:
        glow(c, cars * (L + 14) - 16, -70, 16, '#FFF2B8', 0.9)
    c.restore()
    # rails
    line(c, [(x - 40, y + 2), (x + (cars * (L + 14) + 80) * s, y + 2)], 5, '#5A5A60')

# ================================================================ people
def person(c, x, y, s=1.0, coat='#3E4F72', skin='#E8B994', t=0.0, walk=0.0, facing=1, pose='walk',
           hat=None, scarf=None, seed=0, look=0.0, hair='#3A2A22', bag=False, a=1.0):
    """simple hand-drawn commuter. (x,y)=feet center; height ~ 210*s"""
    c.save(); c.translate(x, y); c.scale(s * facing, s)
    ph = walk * math.pi * 2
    sw = math.sin(ph) if pose == 'walk' else 0.0
    bob = abs(math.cos(ph)) * 4 if pose == 'walk' else 0.0
    c.translate(0, -bob)
    # legs
    for k, sg in enumerate((1, -1)):
        ang = sg * sw * 0.42
        hx, hy = sg * 9, -92
        kx = hx + math.sin(ang) * 46; ky = hy + math.cos(ang) * 46
        fx = kx + math.sin(ang * 0.6) * 44; fy = ky + math.cos(ang * 0.6) * 44
        line(c, [(hx, hy), (kx, ky), (fx, fy)], 13, '#2B2C38', seed=seed + k)
        shape(c, O(fx + 7, fy - 2, 11, 6), '#1D1D22', 2.5)
    # coat
    coatp = S([(-26, -170), (26, -170), (34, -120), (36, -84), (-36, -84), (-34, -120)])
    shape(c, coatp, coat, 4, seed=seed + 3)
    if bag:
        shape(c, R(-50, -128, 26, 34, 5), '#6A4A34', 3)
        line(c, [(-37, -128), (14, -168)], 3)
    # arms
    def arm(sg, target):
        sx, sy = sg * 22, -162
        line(c, [(sx, sy), target[0], target[1]], 11, coat, seed=seed + 10 + sg)
        ink(c, S([(sx, sy), target[0], target[1]], False), 2.5, a=0.7)
        flat(c, O(target[1][0], target[1][1], 7), skin)
    if pose == 'walk':
        arm(1, ((24 - sw * 14, -128), (22 - sw * 24, -96)))
        arm(-1, ((-24 + sw * 14, -128), (-22 + sw * 24, -96)))
    elif pose == 'phone':
        arm(-1, ((-26, -128), (-24, -98)))
        arm(1, ((34, -150), (14, -194)))
    elif pose == 'point':
        arm(-1, ((-26, -128), (-24, -98)))
        arm(1, ((40, -180), (62, -226)))
    else:
        arm(1, ((28, -128), (26, -98)))
        arm(-1, ((-28, -128), (-26, -98)))
    # head
    hy = -196
    c.save(); c.translate(0, hy); c.rotate(-18 * look)
    if scarf: shape(c, R(-22, 14, 44, 14, 6), scarf, 3)
    head = O(0, 0, 22, 24)
    shape(c, head, skin, 3.5, seed=seed + 20)
    if hat:
        shape(c, S([(-24, -4), (-20, -24), (0, -32), (20, -24), (24, -4)]), hat, 3.5)
    else:
        shape(c, S([(-23, -2), (-18, -22), (4, -28), (22, -16), (22, -6), (6, -14)]), hair, 3)
    c.drawCircle(11, 0, 2.6, skia.Paint(AntiAlias=True, Color=C(INK)))
    if pose == 'phone':
        shape(c, R(14, -8, 10, 22, 3), '#9EA4AE', 2.5)
    c.restore()
    c.restore()

def bomb_tech(c, x, y, s=1.0, t=0.0, walk=0.0, visor=LED_G, seed=0, kneel=0.0, arm_up=0.0):
    """EOD suit figure, (x,y)=feet"""
    c.save(); c.translate(x, y); c.scale(s, s)
    suit = '#56624C'; suit2 = '#6E7A62'
    ph = walk * math.pi * 2
    sw = math.sin(ph) * 0.3
    flat(c, O(0, 0, 70, 10), '#000000', 0.15)
    for k, sg in enumerate((1, -1)):
        a = sg * sw
        shape(c, P([(sg * 22 - 18, -120), (sg * 22 + 18, -120), (sg * 22 + 18 + a * 40, -10), (sg * 22 - 18 + a * 40, -10)]), suit, 4.5, seed=seed + k)
        shape(c, R(sg * 22 - 22 + a * 40, -22, 46, 22, 8), '#26262A', 3.5)
    shape(c, R(-62, -250, 124, 140, 34), suit, 5, seed=seed + 3)
    shape(c, R(-42, -232, 84, 92, 16), suit2, 3.5, seed=seed + 4)
    for sg in (1, -1):
        up = arm_up if sg == 1 else 0.0
        ex = sg * 80; ey = -170 - up * 40
        hx = sg * 84 + sg * up * 20; hy = -112 - up * 110
        line(c, [(sg * 54, -232), (ex, ey), (hx, hy)], 30, suit, smooth=True, seed=seed + 5 + k)
        ink(c, S([(sg * 54, -232), (ex, ey), (hx, hy)], False), 3, a=0.5)
        shape(c, O(hx, hy, 16), '#2A2A2E', 3)
    shape(c, R(-46, -268, 92, 30, 12), suit2, 4)
    shape(c, O(0, -310, 52, 50), suit, 5, seed=seed + 8)
    vis = R(-38, -336, 76, 46, 18)
    shape(c, vis, '#1C2430', 3.5)
    glow_path(c, R(-30, -330, 26, 30, 10), visor, 6, 0.45)
    flat(c, R(-30, -330, 10, 26, 5), '#FFFFFF', 0.35)
    c.restore()

def robot(c, x, y, s=1.0, t=0.0, seed=0, reach=0.0):
    c.save(); c.translate(x, y); c.scale(s, s)
    flat(c, O(0, 0, 110, 10), '#000000', 0.15)
    shape(c, R(-100, -50, 200, 46, 22), '#2D2E33', 4.5, seed=seed)
    for i in range(5):
        shape(c, O(-78 + i * 39, -27, 14), '#55565C', 2.5)
    shape(c, R(-70, -110, 120, 62, 8), '#D8B23A', 4, seed=seed + 1)
    ang = -40 + reach * 25 + math.sin(t * 1.5) * 4
    c.save(); c.translate(30, -100); c.rotate(ang)
    shape(c, R(0, -10, 130, 20, 8), '#46474D', 3.5)
    c.translate(130, 0); c.rotate(60 - reach * 40)
    shape(c, R(0, -8, 90, 16, 6), '#46474D', 3.5)
    c.translate(90, 0)
    line(c, [(0, 0), (22, -12)], 6); line(c, [(0, 0), (22, 12)], 6)
    c.restore()
    shape(c, R(-60, -150, 40, 40, 6), '#3A3B41', 3.5)
    shape(c, O(-40, -130, 11), '#141418', 2.5)
    glow(c, -40, -130, 6, '#7FD8FF', 0.8)
    line(c, [(-60, -150), (-70, -196)], 3)
    if int(t * 3) % 2 == 0: glow(c, -70, -198, 7, SIREN_R, 0.9)
    c.restore()

# ================================================================ city stuff
def sky(c, top=SKY, bottom='#EFE6D2', y0=380, y1=1500, a=1.0):
    p = skia.Paint()
    p.setShader(skia.GradientShader.MakeLinear([skia.Point(0, y0), skia.Point(0, y1)], [C(top, a), C(bottom, a)]))
    c.drawRect(skia.Rect.MakeLTRB(-3000, y0 - 2000, 4000, y1), p)
    hp = hatch_paint(1.4, 'sky'); hp.setBlendMode(skia.BlendMode.kMultiply); hp.setAlphaf(0.35 * a)
    c.drawRect(skia.Rect.MakeLTRB(-3000, y0 - 2000, 4000, y1), hp); hp.setBlendMode(skia.BlendMode.kSrcOver)

def skyline(c, x, y, s=1.0, col='#A3ADBD', a=1.0, t=0.0, lights=0.0, seed=0, zakim=True):
    """Boston-ish skyline silhouette; (x,y) = base left"""
    c.save(); c.translate(x, y); c.scale(s, s)
    rr = random.Random(seed)
    blds = []
    xx = 0
    for i in range(16):
        w = rr.uniform(40, 90); h = rr.uniform(80, 220)
        blds.append((xx, w, h)); xx += w * rr.uniform(0.7, 1.0)
    for (bx, w, h) in blds:
        shape(c, R(bx, -h, w, h), col, 2.5, a=0.75 * a, seed=seed + int(bx))
    # landmarks: tall slab with antenna, glass tower, clock tower
    shape(c, P([(260, 0), (260, -430), (330, -430), (330, 0)]), '#8F9BAE', 3, a=a)
    line(c, [(295, -430), (295, -500)], 3, a=a)
    shape(c, P([(420, 0), (420, -470), (448, -480), (470, -470), (470, 0)]), '#9DB4C8', 3, a=a)
    line(c, [(448, -478), (448, 0)], 2, '#FFFFFF', 0.5 * a)
    shape(c, P([(560, 0), (560, -300), (575, -340), (590, -300), (590, 0)]), '#B2ABA0', 3, a=a)
    if zakim:
        for zx in (700, 880):
            line(c, [(zx - 16, 0), (zx, -260), (zx + 16, 0)], 4, '#7D8696', a)
            for k in range(6):
                line(c, [(zx, -250 + k * 20), (zx + (k + 2) * 26 * (1 if zx == 700 else -1), -40)], 1.6, '#7D8696', 0.7 * a)
        line(c, [(620, -40), (980, -40)], 5, '#7D8696', a)
    if lights > 0:
        lp = skia.Paint(AntiAlias=True, Color=C('#FFE9A8', 0.8 * lights * a))
        for i in range(70):
            lx = rr.uniform(0, 640); ly = -rr.uniform(10, 420)
            if int(t * 0.7 + i) % 9 != 0:
                c.drawRect(skia.Rect.MakeXYWH(lx, ly, 5, 7), lp)
    c.restore()

def overpass(c, x0, x1, ytop, deck=120, pillar_xs=(), ground=1500, seed=0, col=CONCR):
    """concrete overpass deck + pillars"""
    for i, px in enumerate(pillar_xs):
        shape(c, P([(px - 46, ytop + deck), (px + 46, ytop + deck), (px + 54, ground), (px - 54, ground)]), col, 4.5, seed=seed + 10 + i)
        fill(c, P([(px + 14, ytop + deck), (px + 46, ytop + deck), (px + 54, ground), (px + 18, ground)]), CONCR_D, a=0.6, off=None)
        for k in range(3):
            line(c, [(px - 30, ytop + deck + 120 + k * 180), (px - 14, ytop + deck + 150 + k * 180)], 2, CONCR_D, 0.7)
    shape(c, R(x0, ytop + deck - 26, x1 - x0, 40), CONCR_D, 4, seed=seed + 1)   # underside girder
    shape(c, R(x0, ytop, x1 - x0, deck - 22), col, 5, seed=seed)
    shape(c, R(x0, ytop - 22, x1 - x0, 24), '#CFCAC0', 4, seed=seed + 2)        # parapet
    for k in range(int((x1 - x0) / 160) + 1):
        xx = x0 + 80 + k * 160
        line(c, [(xx, ytop + 4), (xx, ytop + deck - 26)], 2, CONCR_D, 0.8)

def ground(c, y, col='#C9C2B4', y1=2600, road=True, seed=0, lane_off=0.0):
    shape(c, R(-2000, y, 5000, y1 - y), col, 0, line=False)
    line(c, [(-2000, y), (3000, y)], 4.5, seed=seed)
    if road:
        for k in range(-12, 22):
            xx = k * 140 + (lane_off % 140)
            line(c, [(xx, y + 70), (xx + 70, y + 70)], 6, '#F2EEE2', 0.9, seed=seed + k)

def barricade(c, x, y, s=1.0, t=0.0, seed=0, light=True):
    c.save(); c.translate(x, y); c.scale(s, s)
    line(c, [(-60, 0), (-44, -100)], 6); line(c, [(60, 0), (44, -100)], 6)
    bar = R(-80, -100, 160, 34, 4)
    shape(c, bar, '#F4F0E6', 4, seed=seed)
    c.save(); c.clipPath(bar, skia.ClipOp.kIntersect, True)
    for k in range(-2, 7):
        fill(c, P([(-80 + k * 36, -66), (-62 + k * 36, -100), (-44 + k * 36, -100), (-62 + k * 36, -66)]), '#E07A2E', hatch=True, off=None)
    c.restore()
    ink(c, bar, 4)
    if light:
        on = int(t * 2.5 + seed) % 2 == 0
        shape(c, O(-50, -110, 10), '#F2B233' if on else '#9A7428', 2.5)
        if on: glow(c, -50, -110, 22, '#FFC23A', 0.6)
    c.restore()

def police_tape(c, pts, w=26, t=0.0, seed=0, prog=1.0, a=1.0):
    """yellow tape with diagonal dark bands (no text) along polyline"""
    # build ribbon
    if prog <= 0: return
    tot = 0; segs = []
    for i in range(len(pts) - 1):
        d = math.dist(pts[i], pts[i + 1]); segs.append(d); tot += d
    want = tot * prog; acc = 0
    q = [pts[0]]
    for i, d in enumerate(segs):
        if acc + d >= want:
            u = (want - acc) / d
            q.append((lerp(pts[i][0], pts[i + 1][0], u), lerp(pts[i][1], pts[i + 1][1], u))); break
        q.append(pts[i + 1]); acc += d
    for i in range(len(q) - 1):
        (ax, ay), (bx, by) = q[i], q[i + 1]
        L = math.dist(q[i], q[i + 1])
        if L < 1: continue
        c.save(); c.translate(ax, ay); c.rotate(math.degrees(math.atan2(by - ay, bx - ax)))
        rb = R(0, -w / 2, L, w)
        fill(c, rb, '#F1CF3B', a=a, hatch=True, off=None)
        c.save(); c.clipPath(rb, skia.ClipOp.kIntersect, True)
        k = 0
        while k * 60 < L + 60:
            fill(c, P([(k * 60, w / 2), (k * 60 + 16, -w / 2), (k * 60 + 32, -w / 2), (k * 60 + 16, w / 2)]), '#2A2A2E', a=0.85 * a, hatch=False, off=None)
            k += 1
        c.restore()
        ink(c, P([(0, -w / 2), (L, -w / 2)], False), 2.5, a=a)
        ink(c, P([(0, w / 2), (L, w / 2)], False), 2.5, a=a)
        c.restore()

def radio_waves(c, x, y, t, col=POLICE, n=3, r0=20, r1=150, speed=0.8, a=0.9, w=4):
    for k in range(n):
        u = ((t * speed + k / n) % 1.0)
        r = lerp(r0, r1, u)
        ink(c, O(x, y, r), w * (1 - u * 0.5), col, a * (1 - u), double=False)

def brick_wall(c, x, y, w, h, seed=0, col=BRICK):
    shape(c, R(x, y, w, h), col, 4, seed=seed)
    rr = random.Random(seed)
    bh = 26
    lp = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=2, Color=C('#E9D8C4', 0.55))
    lp.setPathEffect(skia.DiscretePathEffect.Make(10, 1.0, abs(G.seed + seed)))
    for r in range(int(h / bh)):
        yy = y + r * bh
        c.drawLine(x, yy, x + w, yy, lp)
        off = 0 if r % 2 == 0 else 30
        for k in range(int(w / 60) + 1):
            xx = x + off + k * 60
            if x < xx < x + w: c.drawLine(xx, yy, xx, yy + bh, lp)

def lamp(c, x, y, h=420, t=0.0, on=0.0):
    line(c, [(x, y), (x, y - h), (x + 50, y - h - 12)], 7, '#4A4C58')
    shape(c, R(x + 40, y - h - 14, 36, 14, 5), '#4A4C58', 3)
    if on > 0: glow(c, x + 58, y - h, 50, '#FFE6A0', 0.5 * on)

def flip_phone(c, x, y, s=1.0, t=0.0, rot=0.0):
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s)
    shape(c, R(-30, -120, 60, 110, 12), '#B9BEC6', 4)
    shape(c, R(-22, -110, 44, 52, 5), '#6FB7E8', 3)
    glow(c, 0, -84, 26, '#8FD1FF', 0.35)
    shape(c, R(-32, 0, 64, 120, 12), '#A9AFB8', 4)
    for r in range(4):
        for k in range(3):
            shape(c, O(-16 + k * 16, 26 + r * 22, 6), '#E7E9EC', 2)
    line(c, [(22, -118), (26, -150)], 6, '#55585E')
    c.restore()

def cone(c, x, y, s=1.0):
    c.save(); c.translate(x, y); c.scale(s, s)
    shape(c, P([(-14, -70), (14, -70), (34, 0), (-34, 0)]), '#E8732E', 3.5)
    fill(c, P([(-22, -40), (22, -40), (26, -26), (-26, -26)]), '#F5F2EA', hatch=False, off=None)
    shape(c, R(-44, -6, 88, 10, 3), '#E8732E', 3)
    c.restore()

def tv_camera(c, x, y, s=1.0, t=0.0, flip=False):
    c.save(); c.translate(x, y); c.scale(-s if flip else s, s)
    line(c, [(0, -120), (-50, 0)], 5); line(c, [(0, -120), (50, 0)], 5); line(c, [(0, -120), (0, 0)], 5)
    shape(c, R(-50, -170, 100, 52, 8), '#2C2D33', 4)
    shape(c, R(50, -160, 36, 32, 4), '#3A3B42', 3.5)
    shape(c, O(86, -144, 14), '#56708A', 3)
    if int(t * 1.5) % 2 == 0: glow(c, -36, -164, 7, SIREN_R, 0.9)
    c.restore()

def news_van(c, x, y, s=1.0, t=0.0, flip=False):
    c.save(); c.translate(x, y); c.scale(-s if flip else s, s)
    shape(c, P([(-170, -30), (-170, -170), (90, -170), (150, -110), (170, -60), (170, -30)]), '#ECE8DE', 4.5)
    fill(c, R(-168, -110, 336, 22, 0), BRICK, off=None)
    shape(c, P([(96, -160), (140, -112), (96, -112)]), '#B9CCD8', 3)
    line(c, [(-80, -170), (-80, -260)], 5)
    shape(c, S([(-130, -260), (-80, -300), (-30, -260), (-80, -246)]), '#D9D6CE', 4)
    line(c, [(-80, -270), (-60, -300)], 3)
    for wx in (-110, 110):
        shape(c, O(wx, -28, 28), '#1E1E22', 4)
        shape(c, O(wx, -28, 11), '#A8A8AE', 2.5)
    c.restore()

def calendar(c, x, y, s=1.0, seed=0, marks=0, rot=0.0, a=1.0, flipu=0.0):
    """wall calendar page, no numbers. flipu: 0..1 page flipping up"""
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s * (1 - flipu * 0.95))
    shape(c, R(-200, -150, 400, 330, 8), '#FBF7EE', 4.5, a=a, seed=seed)
    fill(c, R(-198, -148, 396, 70, 4), BRICK, a=a, off=None)
    scribble_lines(c, -110, -140, 220, 50, 1, '#F6E8DE', 7, seed=seed, a=0.9 * a)
    for k in range(5):
        line(c, [(-140 + k * 70, -168), (-140 + k * 70, -136)], 5, '#6A6A72', a)
    for r in range(5):
        for k in range(7):
            cx = -186 + k * 53.5; cy = -70 + r * 48
            ink(c, R(cx, cy, 50, 44), 1.8, GRAY, 0.7 * a, double=False)
            idx = r * 7 + k
            if idx < marks:
                line(c, [(cx + 10, cy + 8), (cx + 40, cy + 36)], 3.5, BRICK, a, seed=idx)
                line(c, [(cx + 40, cy + 8), (cx + 10, cy + 36)], 3.5, BRICK, a, seed=idx + 50)
    c.restore()

def doc(c, x, y, s=1.0, rot=0.0, seed=0, kind='letter', prog=1.0, sign=0.0, stamp=0.0, a=1.0):
    """generic document; no readable text"""
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s)
    flat(c, R(-180 + 10, -240 + 12, 360, 480, 6), '#000000', 0.10 * a)
    shape(c, R(-180, -240, 360, 480, 6), '#FCFAF4', 4, a=a, seed=seed)
    # generic logo: circle + bar
    if kind in ('letter', 'corp', 'agree'):
        shape(c, O(-130, -190, 22), '#3E5C8A' if kind != 'agree' else BRICK, 3, a=a)
        fill(c, R(-96, -200, 120, 18, 6), '#9AA6B8', a=a, off=None)
    if kind == 'ledger':
        for r in range(9):
            line(c, [(-150, -170 + r * 40), (150, -170 + r * 40)], 1.8, GRAY, 0.6 * a)
        line(c, [(40, -190), (40, 190)], 2, GRAY, 0.7 * a)
        for r in range(8):
            if r / 8 < prog:
                scribble_lines(c, -140, -168 + r * 40, 150, 36, 1, INK, 3, seed=seed + r, a=0.7 * a)
                scribble_lines(c, 60, -168 + r * 40, 80, 36, 1, '#2E7D4F', 3.5, seed=seed + 40 + r, a=0.9 * a)
    else:
        n = 9
        k = int(n * prog + 0.999)
        scribble_lines(c, -140, -150, 280, 280 * min(1, k / n), max(1, k), '#6A6E80', 3.2, seed=seed, a=0.85 * a)
    if sign > 0:
        pts = []
        for i in range(int(40 * sign) + 2):
            u = i / 40
            pts.append((-10 + u * 140, 190 + math.sin(u * 19) * 14 - u * 10))
        line(c, pts, 4, '#1F2C6B', a, smooth=True)
        line(c, [(-20, 210), (140, 210)], 2, GRAY, 0.7 * a)
    if stamp > 0:
        sc = back_out(stamp)
        c.save(); c.translate(-90, 160); c.rotate(-14); c.scale(sc, sc)
        ink(c, O(0, 0, 50), 5, BRICK, 0.85 * a)
        ink(c, O(0, 0, 38), 3, BRICK, 0.7 * a)
        line(c, [(-26, 0), (-6, 18), (28, -20)], 6, BRICK, 0.85 * a)
        c.restore()
    c.restore()

def bill(c, x, y, s=1.0, rot=0.0, seed=0, a=1.0):
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s)
    shape(c, R(-80, -36, 160, 72, 6), '#9CC49A', 3.5, a=a, seed=seed)
    ink(c, R(-70, -27, 140, 54, 4), 2, '#4E7A50', 0.8 * a, double=False)
    shape(c, O(0, 0, 20, 23), '#C9DEC4', 2.5, a=a)
    font = skia.Font(typeface('kalam-700.ttf'), 30)
    c.drawString('$', -8, 11, font, skia.Paint(AntiAlias=True, Color=C('#3E6B42', a)))
    c.restore()

def money_stack(c, x, y, h, s=1.0, seed=0, a=1.0):
    """stack of bills seen from the side, (x,y)=bottom center, h=pixel height"""
    c.save(); c.translate(x, y); c.scale(s, s)
    if h > 2:
        shape(c, R(-90, -h, 180, h, 4), '#8DB88B', 4, a=a, seed=seed)
        for k in range(int(h / 9)):
            line(c, [(-88, -k * 9 - 4), (88, -k * 9 - 4)], 1.5, '#4E7A50', 0.6 * a)
        shape(c, R(-26, -h, 52, h, 0), '#E8E0C8', 2.5, a=a, seed=seed + 1)
    bill(c, 0, -h - 4, 1.12, 0, seed, a)
    c.restore()

def hand(c, x, y, s=1.0, rot=0.0, skin='#E8B994', pinch=0.0, seed=0, sleeve='#3E4F72'):
    """cartoon hand, pointing up (fingers to -y); wrist at (x,y)"""
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s)
    shape(c, R(-38, 0, 76, 160, 14), sleeve, 4, seed=seed + 9)
    shape(c, S([(-34, 4), (-36, -50), (-20, -74), (22, -74), (36, -50), (34, 4)]), skin, 4, seed=seed)
    for i, fx in enumerate((-24, -8, 8, 24)):
        L = [58, 74, 70, 54][i] * (1 - pinch * 0.35)
        shape(c, R(fx - 8, -70 - L, 16, L + 8, 8), skin, 3.5, seed=seed + 1 + i)
    shape(c, R(-62 + pinch * 18, -66, 40, 15, 7), skin, 3.5, seed=seed + 7)
    c.restore()

def clapper(c, x, y, s=1.0, rot=0.0, open_=0.3, seed=0):
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s)
    shape(c, R(-90, -40, 180, 110, 6), '#26262B', 4, seed=seed)
    scribble_lines(c, -70, -20, 140, 70, 3, '#E9E4D8', 3, seed=seed, a=0.7)
    c.save(); c.translate(-90, -40); c.rotate(-open_ * 30)
    bar = R(0, -30, 180, 30, 3)
    shape(c, bar, '#F2EEE4', 4)
    c.save(); c.clipPath(bar, skia.ClipOp.kIntersect, True)
    for k in range(6):
        fill(c, P([(k * 36, 0), (k * 36 + 18, -30), (k * 36 + 36, -30), (k * 36 + 18, 0)]), '#26262B', hatch=False, off=None)
    c.restore(); ink(c, bar, 4)
    c.restore()
    c.restore()

def film_strip(c, x, y, w, s=1.0, t=0.0, seed=0, vertical=False):
    c.save(); c.translate(x, y)
    if vertical: c.rotate(90)
    shape(c, R(0, 0, w, 70), '#2B2B30', 3.5, seed=seed)
    off = (t * 60) % 40
    for k in range(int(w / 40) + 1):
        xx = k * 40 + off - 40
        if 0 < xx < w - 18:
            fill(c, R(xx, 8, 18, 12, 3), '#EDE7D8', hatch=False, off=None)
            fill(c, R(xx, 50, 18, 12, 3), '#EDE7D8', hatch=False, off=None)
    c.restore()

def star(c, x, y, r, col=MUSTARD, a=1.0, rot=0.0, w=3):
    pts = []
    for i in range(10):
        an = -math.pi / 2 + i * math.pi / 5 + rot; rr = r if i % 2 == 0 else r * 0.45
        pts.append((x + math.cos(an) * rr, y + math.sin(an) * rr))
    shape(c, P(pts), col, w, a=a)

def sun(c, x, y, r=60, t=0.0, a=1.0):
    glow(c, x, y, r * 1.8, '#FFD27A', 0.35 * a)
    shape(c, O(x, y, r), '#F6C451', 4, a=a)
    for i in range(10):
        an = i / 10 * 2 * math.pi + t * 0.3
        line(c, [(x + math.cos(an) * r * 1.25, y + math.sin(an) * r * 1.25), (x + math.cos(an) * r * 1.6, y + math.sin(an) * r * 1.6)], 4, '#E0A43A', a)

def moon(c, x, y, r=50, a=1.0):
    glow(c, x, y, r * 1.8, '#E8EEFF', 0.25 * a)
    p = skia.Path.MakeFromOp if False else None
    m = O(x, y, r); cut = O(x + r * 0.45, y - r * 0.2, r * 0.9)
    crescent = skia.Op(m, cut, skia.PathOp.kDifference_PathOp)
    shape(c, crescent, '#F4EFD8', 3.5, a=a)

def cloud(c, x, y, s=1.0, a=1.0, seed=0, col='#FBF8F0'):
    c.save(); c.translate(x, y); c.scale(s, s)
    shape(c, S([(-120, 20), (-110, -20), (-60, -40), (-20, -70), (40, -60), (80, -30), (130, -20), (140, 20)]), col, 3.5, a=a, seed=seed)
    c.restore()
