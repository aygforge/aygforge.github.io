"""The 12 scenes of 'Büyük Kanada Akçaağaç Şurubu Soygunu'."""
from objects import *

BEAT = 0.566  # music beat period (~106 bpm)

# sentence starts (narration master timeline) and speech ends
T = [0.0, 6.83, 13.78, 19.09, 26.32, 30.81, 34.20, 41.06, 48.34, 56.21, 63.00, 68.03]
TEND = [5.89, 12.98, 18.18, 25.36, 30.12, 33.25, 40.08, 47.49, 55.17, 62.04, 67.00, 71.09]
END = 73.54
BAND = 470  # caption band bottom


def cam(cv, s, fx, fy, ax=540, ay=1200, rot=0.0):
    cv.translate(ax, ay)
    if rot:
        cv.rotate(rot)
    cv.scale(s, s)
    cv.translate(-fx, -fy)


def drift(t, amp=6, f=0.23):
    return amp * math.sin(t * f * math.tau), amp * 0.6 * math.cos(t * f * 0.8 * math.tau)


def fill_bg(cv, c):
    cv.drawRect(skia.Rect(-3000, -3000, 6000, 6000), fillp(c))


# ------------------------------------------------------------------ shared backgrounds
def interior_bg(cv, t, x0=-300, x1=1380, top=380, horizon=1350, bottom=2200, lamps=True, windows=True, leaves=False):
    cv.drawRect(skia.Rect(x0, top, x1, horizon), skia.Paint(AntiAlias=True, Shader=lin_grad(0, top, 0, horizon, [mix(WALL, INK, 0.12), WALL, WALL_D])))
    # wall ribs
    x = x0 - (x0 % 90)
    i = 0
    while x < x1:
        line(cv, [(x, top), (x, horizon)], mix(WALL_D, INK, 0.25), 2.2, jit=1.0, a=0.55)
        x += 90
        i += 1
    if leaves:
        for k, (lx, ly) in enumerate([(160, 900), (540, 820), (920, 900), (-200, 860), (1280, 860)]):
            maple_leaf(cv, lx, ly, 120, None, mix(WALL_D, INK, 0.2), 3, alpha=0.35, rot=0.1 * math.sin(t * 0.5 + k))
    if windows:
        wins = skia.Path()
        for wx in range(int(x0) + 40, int(x1), 240):
            wins.addRect(skia.Rect(wx, top + 140, wx + 150, top + 250))
        cv.save()
        cv.clipPath(wins, doAntiAlias=True)
        cv.drawRect(skia.Rect(x0, top + 140, x1, top + 250), skia.Paint(Shader=lin_grad(0, top + 140, 0, top + 250, ['#9FB3C8', '#D9E2EA'])))
        snow(cv, t, 60, 3, a=0.95, area=(x0, top + 120, x1, top + 260), size=0.6)
        cv.restore()
        for wx in range(int(x0) + 40, int(x1), 240):
            rect(cv, wx, top + 140, 150, 110, None, INK, 3.5)
            line(cv, [(wx + 75, top + 140), (wx + 75, top + 250)], INK, 2.5)
    # trusses
    line(cv, [(x0, top + 70), (x1, top + 70)], INK, 5, smooth=False)
    for xx in range(int(x0), int(x1), 160):
        line(cv, [(xx, top + 70), (xx + 80, top + 10), (xx + 160, top + 70)], INK2, 3, smooth=False, a=0.7)
    # floor
    cv.drawRect(skia.Rect(x0, horizon, x1, bottom), skia.Paint(Shader=lin_grad(0, horizon, 0, bottom, [FLOOR, mix(FLOOR, '#FFFFFF', 0.25)])))
    line(cv, [(x0, horizon), (x1, horizon)], INK, 4.5)
    vx = 540
    for k in range(-8, 9):
        line(cv, [(vx + k * 70, horizon), (vx + k * 260, bottom)], mix(FLOOR, INK, 0.25), 2, jit=1, a=0.45)
    line(cv, [(x0, horizon + 140), (x1, horizon + 140)], AMBER, 7, jit=1.2, a=0.6)
    if lamps:
        for lx in range(int(x0) + 120, int(x1), 300):
            light_cone(cv, lx, top + 110, 380, horizon - top, a=0.18)
            lamp(cv, lx, top + 110)


def rack(cv, x0, floor_y, cols, rows, sc, alpha=1.0, missing=(), view=None, post=GREEN):
    slot = 130 * sc
    lvl = 190 * sc
    w = cols * slot
    for r in range(rows + 1):
        by = floor_y - r * lvl
        line(cv, [(x0 - 6 * sc, by), (x0 + w + 6 * sc, by)], post, 9 * sc + 1.5, jit=0.8, a=alpha)
    for c in range(0, cols + 1, 3):
        px = x0 + c * slot
        line(cv, [(px, floor_y + 4), (px, floor_y - rows * lvl - 10 * sc)], post, 11 * sc + 1.5, jit=0.6, a=alpha)
    for r in range(rows):
        by = floor_y - r * lvl - 5 * sc
        for c in range(cols):
            if (c, r) in missing:
                continue
            bx = x0 + (c + 0.5) * slot
            if view is not None:
                vx0, vy0, vx1, vy1 = view
                if bx + slot < vx0 or bx - slot > vx1 or by < vy0 or by - lvl > vy1:
                    continue
            barrel_sprite(cv, bx, by, sc * 0.95, alpha)


def night_sky(cv, y0, y1):
    cv.drawRect(skia.Rect(-400, y0, 1500, y1), skia.Paint(Shader=lin_grad(0, y0, 0, y1, ['#1F2246', SKY_N, '#4B4C72'])))


def dolly(cv, x, y, s=1.0, wrot=0.0, cargo=True, tilt=-14, alpha=1.0):
    """hand truck carrying a drum; origin at wheel ground; handle toward -x."""
    cv.save()
    cv.translate(x, y)
    cv.scale(s, s)
    cv.rotate(tilt)
    if cargo:
        barrel(cv, 40, -18, 110, 150, sw=3.5, alpha=alpha)
    line(cv, [(-8, -10), (-8, -200), (-30, -225)], '#4A4A5C', 9, smooth=False, a=alpha)
    line(cv, [(-8, -10), (92, -10)], '#4A4A5C', 9, smooth=False, a=alpha)
    cv.restore()
    wheel(cv, x, y - 22 * s, 22 * s, wrot, alpha)


def cart(cv, x, y, s=1.0, wrot=0.0, alpha=1.0):
    cv.save()
    cv.translate(x, y)
    cv.scale(s, s)
    rect(cv, -95, -50, 190, 22, WOOD, INK, 4, alpha=alpha, spacing=7)
    line(cv, [(-95, -45), (-130, -150)], '#4A4A5C', 8, smooth=False, a=alpha)
    cv.restore()
    wheel(cv, x - 60 * s, y - 22 * s, 20 * s, wrot, alpha)
    wheel(cv, x + 60 * s, y - 22 * s, 20 * s, wrot, alpha)


# ================================================================== SCENE 1: hook
def scene1(cv, t):
    fill_bg(cv, WALL)
    cv.save()
    s = lerp(1.22, 1.0, ease_out(seg(t, 0, 2.2))) + 0.015 * t
    dx, dy = drift(t, 5)
    cam(cv, s, 540 + dx, 1260 + dy, 540, 1260)
    interior_bg(cv, t, horizon=1390)
    # towering stacks left & right
    rack(cv, -170, 1390, 5, 5, 0.66)
    rack(cv, 830, 1390, 5, 5, 0.66)
    rack(cv, 300, 1240, 6, 2, 0.4, alpha=0.9)
    # exit door far right-center with snow light
    rect(cv, 610, 1060, 120, 180, '#DCE6EE', INK, 4, hatch_on=False)
    cv.save()
    cv.clipPath(skia.Path().addRect(skia.Rect(610, 1060, 730, 1240)))
    snow(cv, t, 14, 9, area=(600, 1040, 740, 1250), size=0.6)
    cv.restore()
    # shadowy figures pushing barrel cart, sneaking toward the exit
    cx = lerp(150, 1010, ease_io(seg(t, 0, 6.8)) * 0.6 + seg(t, 0, 6.8) * 0.4)
    wp = t / BEAT * math.pi
    bob = abs(math.sin(wp)) * 4
    fy = 1505
    # syrup drip trail
    for k in range(14):
        tx = cx - 60 - k * 46
        if tx > 40:
            ellipse(cv, tx, fy + 4 + (k % 2) * 6, 10 - k * 0.3, 4, AMBER, INK, 1.5, n=8, hatch_on=False, alpha=0.85)
    soft_shadow(cv, cx, fy + 2, 140, 10)
    cart(cv, cx, fy, 1.0, wrot=t * 5)
    barrel(cv, cx, fy - 48 - bob * 0.3, 125, 170, sw=3.8, crack=1.0)
    person(cv, cx - 165, fy, 0.92, lean=22, walk=wp, hands=[(80, -150), (75, -142)], head_tilt=-10)
    person(cv, cx + 150, fy - bob, 0.86, lean=-8, walk=wp + 1.2, facing=-1, hands=[(40, -120), (30, -150)], head_tilt=8)
    # the vault -> barrel
    bx, by = 540, 1700
    BW, BH = 330, 430
    open_v = 0.42 + 0.58 * ease_io(seg(t, 0.1, 0.6))
    frame_a = 1 - seg(t, 0.75, 1.15)
    reveal = seg(t, 0.15, 0.6)
    vc = (540, 1440)
    if frame_a > 0:
        # dark vault recess
        cv.save()
        p = skia.Path()
        p.addCircle(vc[0], vc[1], 300)
        cv.clipPath(p, doAntiAlias=True)
        cv.drawRect(skia.Rect(0, 1000, W, 1900), fillp(mix(INK, AMBER_D, 0.25), frame_a))
        glow(cv, 540, 1320, 260, AMBER_L, 0.45 * frame_a)
        cv.restore()
    glow(cv, bx, by - BH, 200, AMBER_L, 0.35 * (1 - 0.5 * frame_a))
    barrel(cv, bx, by, BW, BH, lid='open', open_amt=0.35 + 0.65 * ease_out(seg(t, 0.3, 0.9)), crack=seg(t, 0.4, 1.3), sw=5.5)
    # drip on side
    dl = seg(t, 1.0, 2.6)
    if dl > 0:
        shape(cv, [(bx - 120, by - BH + 20), (bx - 100, by - BH + 20), (bx - 102, by - BH + 40 + dl * 140), (bx - 112, by - BH + 52 + dl * 140), (bx - 120, by - BH + 40 + dl * 140)], AMBER, INK, 3, jit=0.8)
    # banknotes drifting up out of the syrup (million-dollar contrast)
    for k in range(9):
        st = 2.5 + k * 0.32
        if t > st:
            pt = (t - st) / 3.2
            if pt < 1:
                nx = bx + (hsh(k, 4) * 260) + math.sin(t * 2 + k) * 40
                ny = by - BH - 40 - pt * 640
                banknote(cv, nx, ny, 150 * (0.7 + 0.3 * pt), 70 * (0.7 + 0.3 * pt), rot=hsh(k, 9) * 0.6 + math.sin(t * 3 + k) * 0.3, alpha=min(1, (1 - pt) * 2.5, pt * 8))
    if frame_a > 0:
        # vault frame + door
        cv.save()
        cv.saveLayerAlpha(None, int(255 * frame_a))
        ring = skia.Path()
        ring.addCircle(vc[0], vc[1], 360)
        ring.addCircle(vc[0], vc[1], 300)
        ring.setFillType(skia.PathFillType.kEvenOdd)
        cv.drawPath(ring, fillp('#8D96A3'))
        hatch(cv, ring, INK, 99, 8)
        ellipse(cv, vc[0], vc[1], 360, 360, None, INK, 6)
        ellipse(cv, vc[0], vc[1], 300, 300, None, INK, 5)
        for k in range(12):
            a = k * math.tau / 12
            ellipse(cv, vc[0] + 330 * math.cos(a), vc[1] + 330 * math.sin(a), 9, 9, STEEL_D, INK, 2.5, n=8, hatch_on=False)
        # door swinging open around left hinge
        sx = math.cos(open_v * math.pi * 0.5)
        if sx > 0.02:
            cv.save()
            cv.translate(vc[0] - 300, vc[1])
            cv.scale(sx, 1)
            cv.translate(-(vc[0] - 300), -vc[1])
            sh = skia.GradientShader.MakeRadial(skia.Point(vc[0] - 80, vc[1] - 90), 420, [col('#C4CBD3'), col('#8C95A1')])
            ellipse(cv, vc[0], vc[1], 296, 296, '#A8B0BA', INK, 6, fill_shader=sh, n=30)
            ellipse(cv, vc[0], vc[1], 230, 230, None, INK2, 3, n=26)
            wr = t * 6
            for k in range(3):
                a = wr + k * math.tau / 3
                line(cv, [(vc[0], vc[1]), (vc[0] + 120 * math.cos(a), vc[1] + 120 * math.sin(a))], INK, 12)
                ellipse(cv, vc[0] + 120 * math.cos(a), vc[1] + 120 * math.sin(a), 16, 16, STEEL_D, INK, 3, n=8, hatch_on=False)
            ellipse(cv, vc[0], vc[1], 40, 40, STEEL, INK, 5, n=12)
            for k in range(8):
                a = k * math.tau / 8
                ellipse(cv, vc[0] + 265 * math.cos(a), vc[1] + 265 * math.sin(a), 11, 11, STEEL_L, INK, 2.5, n=8, hatch_on=False)
            cv.restore()
        cv.restore()
        cv.restore()
    cv.restore()


# ================================================================== SCENE 2: the reserve
S2_TARGET = None


def scene2(cv, t):
    fill_bg(cv, WALL)
    e = ease_io(seg(t, 0.0, 4.4))
    s = math.exp(lerp(math.log(5.5), math.log(1.0), e)) - 0.04 * seg(t, 4.4, 7.2)
    # target barrel in the front rack: col 4, row 1
    sc = 0.8
    fx0 = 40 + (4 + 0.5) * 130 * sc
    fy0 = 1700 - 1 * 190 * sc - 5 * sc - 70 * sc
    k = ease_io(seg(t, 0.8, 4.6))
    fx, fy = lerp(fx0, 540, k), lerp(fy0, 1220, k)
    dx, dy = drift(t, 4)
    cv.save()
    cam(cv, s, fx + dx, fy + dy, 540, 1220)
    vw = 1080 / s / 2 + 150
    vh = 1500 / s / 2 + 250
    view = (fx - vw, fy - vh, fx + vw, fy + vh)
    interior_bg(cv, t, x0=-500, x1=1580, top=300, horizon=1160, bottom=2400, leaves=True, lamps=False)
    rack(cv, -420, 1080, 34, 9, 0.36, alpha=0.75, view=view)
    for lx in range(-180, 1400, 300):
        light_cone(cv, lx, 410, 380, 900, a=0.14)
        lamp(cv, lx, 410)
    rack(cv, -470, 1330, 22, 6, 0.55, alpha=0.9, view=view)
    rack(cv, 40, 1700, 8, 5, 0.8, view=view)
    rack(cv, -1100, 1700, 7, 5, 0.8, view=view)
    rack(cv, 1000, 1700, 7, 5, 0.8, view=view)
    # inventory sheet pinned on post
    rect(cv, 30, 1290, 70, 92, '#FBF6EA', INK, 3, hatch_on=False)
    scribble_lines(cv, 40, 1310, 50, 4, 16, sw=2.2)
    # floor life: forklift + workers
    fxp = lerp(-300, 1300, seg(t, 1.5, 7.0))
    forklift(cv, fxp, 1890, 0.95, fork_h=20 + 20 * math.sin(t * 2), wrot=t * 4)
    ph = t / BEAT * math.pi * 0.5
    person(cv, 860 - t * 18, 1880, 0.95, body=GREEN, head=SKIN, hat='hardhat', vest=AMBER_L, clipboard=True,
           hands=[(34, -128), (-6, -112)], walk=ph, facing=-1)
    person(cv, 150 + t * 10, 1870, 0.9, body='#5C6B8A', head=SKIN, hat='hardhat', hat_col=STEEL_L, clipboard=True,
           hands=[(34, -128), (-6, -112)], walk=ph + 1)
    cv.restore()
    # gradual night falls toward scene 3
    d = seg(t, 5.8, 7.0)
    if d > 0:
        cv.drawRect(skia.Rect(0, 0, W, H), fillp(SKY_N, 0.55 * d))


# ================================================================== SCENE 3: the theft begins
def warehouse_wall(cv, x0, x1, top, ground, door, door_open, lit=True, t=0):
    rect(cv, x0, top, x1 - x0, ground - top, '#5A5878', INK, 5, spacing=12)
    for xx in range(int(x0) + 30, int(x1), 40):
        line(cv, [(xx, top + 8), (xx, ground - 4)], '#3E3C5E', 2.5, a=0.7)
    dx0, dx1, dtop = door
    hgt = ground - dtop
    oy = dtop + hgt * (1 - door_open)
    # interior
    cv.save()
    cv.clipPath(skia.Path().addRect(skia.Rect(dx0, dtop, dx1, ground)))
    cv.drawRect(skia.Rect(dx0, dtop, dx1, ground), skia.Paint(Shader=lin_grad(0, dtop, 0, ground, ['#C98A35', '#F1C26A'])))
    for r in range(3):
        for c in range(5):
            barrel_sprite(cv, dx0 + 50 + c * 80 + (r % 2) * 20, ground - 30 - r * 120, 0.62)
    cv.restore()
    rect(cv, dx0, dtop, dx1 - dx0, hgt, None, INK, 5)
    # roll-up door
    if door_open < 1:
        rect(cv, dx0, dtop, dx1 - dx0, oy - dtop, '#8C8AA8', INK, 4, spacing=10)
        y = dtop + 22
        while y < oy:
            line(cv, [(dx0 + 4, y), (dx1 - 4, y)], '#4D4B6E', 3, a=0.8)
            y += 26
    # light spill
    if door_open > 0.05 and lit:
        p = skia.Paint(AntiAlias=True, MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 20),
                       Color=col('#F6C76A'))
        p.setAlphaf(0.45 * door_open)
        pp = skia.Path()
        pp.moveTo(dx0, ground); pp.lineTo(dx1, ground); pp.lineTo(dx1 + 220, ground + 320); pp.lineTo(dx0 - 120, ground + 320); pp.close()
        cv.drawPath(pp, p)


def scene3(cv, t):
    fill_bg(cv, SKY_N)
    cv.save()
    dx, dy = drift(t, 5, 0.18)
    cam(cv, 1.0 + 0.02 * t, 540 + dx, 1200 + dy)
    night_sky(cv, 300, 1500)
    ellipse(cv, 860, 640, 62, 62, '#F4EBD0', INK, 3, hatch_on=False)
    glow(cv, 860, 640, 110, '#F4EBD0', 0.25)
    # far trees
    for k, x in enumerate(range(-40, 1200, 90)):
        pine(cv, x, 1210, 170 + (k % 3) * 30, c='#24413A')
    ground = 1520
    cv.drawRect(skia.Rect(-400, ground, 1500, 2300), skia.Paint(Shader=lin_grad(0, ground, 0, 2000, ['#C9CCDD', '#E9EAF1'])))
    line(cv, [(-400, ground), (1500, ground)], INK, 4)
    door_open = ease_io(seg(t, 0.5, 2.0))
    warehouse_wall(cv, -300, 640, 760, ground, (120, 560, 1060), door_open, t=t)
    shape(cv, [(-320, 770), (320, 600), (660, 770)], '#3E3C5E', INK, 5, smooth=False, spacing=12)
    # tire tracks
    for k in range(2):
        line(cv, [(600, ground + 60 + k * 50), (1300, ground + 110 + k * 70)], '#A7AAC0', 8, a=0.7)
    # truck backing in
    tx = lerp(1450, 860, ease_out(seg(t, 0.0, 1.9)))
    truck(cv, tx, ground + 80, 0.85, wrot=-tx / 30, lights=True, open_back=ease(seg(t, 1.8, 2.3)), exhaust_t=t)
    # sneaky loading rhythm: figures roll barrels from door to truck on hand trucks
    for j in range(2):
        st = 2.0 + j * 1.13
        if t > st - 0.3:
            ph = ((t - st) / 2.26) % 1.0
            x = lerp(250, 560, ease_io(ph))
            bob = abs(math.sin((t - st) / BEAT * math.pi)) * 6
            if ph < 0.85:
                dolly(cv, x + 70, ground + 60 - bob * 0.2, 0.78, wrot=x / 20)
                person(cv, x, ground + 64 - bob, 0.85, lean=16, walk=(t - st) / BEAT * math.pi, hands=[(52, -180), (50, -175)], head_tilt=-6 + 8 * math.sin(t * 2))
    # lookout figure near truck
    person(cv, 600, ground + 120, 0.8, walk=None, hands=[(14, -112), (-14, -114)], head_tilt=12 * math.sin(t * 1.7))
    snow(cv, t, 90, 5, a=0.85, area=(-200, 300, 1300, 2000), dark=True)
    cv.restore()


# ================================================================== SCENE 4: barrel swap operation
def building(cv, x, y, w, h, c, roof, alpha=1.0, door=True):
    rect(cv, x, y - h, w, h, c, INK, 4, alpha=alpha, spacing=11)
    shape(cv, [(x - 15, y - h + 5), (x + w / 2, y - h - h * 0.35), (x + w + 15, y - h + 5)], roof, INK, 4, smooth=False, alpha=alpha, spacing=9)
    if door:
        rect(cv, x + w * 0.3, y - h * 0.6, w * 0.4, h * 0.6, mix(c, INK, 0.35), INK, 3.5, alpha=alpha)
    line(cv, [(x - 5, y - h * 0.2), (x + w + 5, y - h * 0.2)], SNOW, 0.1, a=0)


def flatbed(cv, x, y, s, wrot, cargo_col=None, n=2, facing=1, alpha=1.0):
    cv.save()
    cv.translate(x, y)
    cv.scale(s * facing, s)
    soft_shadow(cv, 0, 2, 270, 12, 0.18)
    rect(cv, -265, -78, 345, 24, WOOD, INK, 4, spacing=8, alpha=alpha)
    for i in range(n):
        if cargo_col:
            barrel(cv, -200 + i * 120, -78, 100, 130, sw=3.5, tint=cargo_col, alpha=alpha)
        else:
            barrel(cv, -200 + i * 120, -78, 100, 130, sw=3.5, alpha=alpha)
    cabp = [(80, -205), (175, -205), (232, -130), (240, -55), (80, -55)]
    shape(cv, cabp, GREEN, INK, 4.5, smooth=False, spacing=9, alpha=alpha)
    shape(cv, [(100, -190), (168, -190), (210, -132), (100, -132)], '#CFE6EE', INK, 3.5, smooth=False, hatch_on=False, alpha=alpha)
    line(cv, [(-268, -52), (245, -52)], INK, 6, a=alpha)
    for wx in (-180, -100, 170):
        wheel(cv, wx, -30, 32, wrot, alpha)
    cv.restore()


NEW_BARREL = '#8E5B3F'


def scene4(cv, t):
    fill_bg(cv, '#DDE4EA')
    cv.save()
    dx, dy = drift(t, 4, 0.2)
    cam(cv, 1.0, 540 + dx, 1200 + dy)
    phi = t / 2.0 + 0.045 * t * t   # accelerating cycle count
    cyc = phi % 1.0
    # sky + snowy hills
    cv.drawRect(skia.Rect(-200, 300, 1300, 960), skia.Paint(Shader=lin_grad(0, 300, 0, 960, ['#C9D6E2', '#EEF1F3'])))
    shape(cv, [(-200, 900), (150, 820), (420, 880), (760, 800), (1300, 880), (1300, 1000), (-200, 1000)], SNOW, INK, 3.5, spacing=14)
    building(cv, 20, 930, 250, 170, STEEL_L, '#8C8AA8')
    building(cv, 800, 930, 250, 170, GREEN_L, GREEN)
    maple_leaf(cv, 925, 735, 22, RED, INK, 2)
    line(cv, [(-200, 958), (1300, 958)], '#8A8FA6', 14, a=0.8)
    line(cv, [(-200, 958), (1300, 958)], '#F6F1E1', 3, a=0.9)
    # truck 1: original warehouse -> separate warehouse
    tx = lerp(150, 900, ease_io(cyc / 0.8)) if cyc < 0.8 else lerp(900, 1500, (cyc - 0.8) / 0.2)
    flatbed(cv, tx, 975, 0.42, wrot=tx / 12, n=2)
    calendar(cv, 950, 590, 0.62, t * 0.9 + 0.08 * t * t)
    snow(cv, t, 30, 11, a=0.9, area=(-100, 380, 1200, 960), size=0.7)
    # middle: cutaway interior of the separate warehouse
    y0, y1 = 1010, 1560
    rect(cv, -20, y0, 1120, y1 - y0, mix(GREEN, INK, 0.35), INK, 5, spacing=13)
    for xx in range(0, 1100, 70):
        line(cv, [(xx, y0 + 6), (xx, y1 - 6)], mix(GREEN, INK, 0.55), 2.5, a=0.6)
    lamp(cv, 540, y0 + 110)
    light_cone(cv, 540, y0 + 110, 700, 440, a=0.25)
    # conveyor
    line(cv, [(-20, 1480), (1100, 1480)], '#4A4A5C', 12)
    for k in range(16):
        rx = (k * 75 - t * 60) % 1200 - 60
        ellipse(cv, rx, 1490, 12, 12, STEEL_D, INK, 2.5, n=8, hatch_on=False)
    slide = ease_io(seg(cyc, 0.78, 1.0))
    # original barrel (left) draining into new barrel (right)
    tr = seg(cyc, 0.12, 0.74)
    obx = 300 - slide * 420
    nbx = 780 + slide * 420
    # incoming next pair
    if slide > 0:
        barrel(cv, 300 + (1 - slide) * -420 + 0, 1478, 220, 290, sw=4.5, lid='closed')
        barrel(cv, 780 + (1 - slide) * 420, 1478, 220, 290, sw=4.5, tint=NEW_BARREL, cutaway=True, fill_level=0.0)
    barrel(cv, obx, 1478, 220, 290, sw=4.5, cutaway=True, fill_level=lerp(0.86, 0.06, ease_io(tr)))
    barrel(cv, nbx, 1478, 220, 290, sw=4.5, tint=NEW_BARREL, cutaway=True, fill_level=lerp(0.0, 0.84, ease_io(tr)))
    # lid lifted from original
    lid_up = seg(cyc, 0.0, 0.12) * (1 - seg(cyc, 0.74, 0.8))
    ellipse(cv, obx - 40 * lid_up, 1478 - 290 - 120 * lid_up, 110, 33, STEEL_L, INK, 4, hatch_on=False, alpha=lid_up)
    # transfer hose with flowing syrup
    if 0.1 < cyc < 0.78:
        hp = [(obx + 30, 1300), (obx + 60, 1110), (540, 1080), (nbx - 60, 1110), (nbx - 20, 1240)]
        line(cv, hp, INK, 22, jit=0.6)
        line(cv, hp, AMBER, 13, jit=0.6)
        path = mkpath(hp, closed=False)
        p = strokep(AMBER_L, 6, 0.95)
        p.setPathEffect(skia.DashPathEffect.Make([18, 22], -t * 220))
        cv.drawPath(path, p)
        # pour
        if tr > 0 and tr < 1:
            line(cv, [(nbx - 20, 1240), (nbx - 18, 1478 - 290 * lerp(0, 0.84, ease_io(tr)))], AMBER, 12, jit=0.8)
    # bottom: loaded truck with new barrels departs
    cv.drawRect(skia.Rect(-200, 1560, 1300, 2200), skia.Paint(Shader=lin_grad(0, 1560, 0, 1920, ['#E9EBEF', '#F7F6F1'])))
    line(cv, [(-200, 1560), (1300, 1560)], INK, 4)
    line(cv, [(-200, 1820), (1300, 1820)], '#8A8FA6', 18, a=0.8)
    c2 = (phi + 0.45) % 1.0
    bx = lerp(260, 1500, ease_in(seg(c2, 0.35, 1.0)))
    flatbed(cv, bx, 1840, 0.62, wrot=bx / 18, cargo_col=NEW_BARREL, n=2)
    snow(cv, t, 30, 12, a=0.9, area=(-100, 1560, 1200, 1920), size=0.7)
    cv.restore()


# ================================================================== SCENE 5: water replacement
def scene5(cv, t):
    fill_bg(cv, mix(GREEN, INK, 0.35))
    cv.save()
    pull = ease_io(seg(t, 3.35, 4.4))
    s = lerp(1.0, 0.42, pull)
    dx, dy = drift(t, 4, 0.25)
    cam(cv, s, 540 + dx, 1300 + dy - pull * 350, 540, 1300)
    # background interior (separate warehouse) -> original warehouse stack when pulling back
    cv.drawRect(skia.Rect(-2000, -800, 3000, 3600), fillp(mix(GREEN, INK, 0.35)))
    for xx in range(-2000, 3000, 70):
        line(cv, [(xx, -800), (xx, 1700)], mix(GREEN, INK, 0.55), 2.5, a=0.5)
    cv.drawRect(skia.Rect(-2000, 1700, 3000, 3600), fillp(mix(FLOOR, INK, 0.25)))
    line(cv, [(-2000, 1700), (3000, 1700)], INK, 5)
    if pull > 0:
        # surrounding stack of identical barrels (barrel slots back into a row)
        cv.saveLayerAlpha(None, int(255 * clamp(pull * 1.6)))
        cv.drawRect(skia.Rect(-2000, -800, 3000, 1700), skia.Paint(Shader=lin_grad(0, -800, 0, 1700, [WALL, WALL_D])))
        for xx in range(-2000, 3000, 140):
            line(cv, [(xx, -800), (xx, 1700)], mix(WALL_D, INK, 0.25), 3, a=0.5)
        cv.drawRect(skia.Rect(-2000, 1700, 3000, 3600), fillp(FLOOR))
        for r in range(5):
            line(cv, [(-2000, 1712 - r * 610), (3000, 1712 - r * 610)], GREEN, 22, a=0.9)
            for c in range(-6, 7):
                if r == 0 and c == 0:
                    continue
                barrel_sprite(cv, 540 + c * 460, 1700 - r * 610, 3.5)
        cv.restore()
    bx, by, bw, bh = 540, 1700, 420, 560
    drain = ease_io(seg(t, 0.15, 1.7))
    fillw = ease_io(seg(t, 1.9, 3.0))
    sealed = seg(t, 3.0, 3.3)
    if sealed < 1:
        if fillw <= 0:
            lvl = lerp(0.86, 0.0, drain)
            barrel(cv, bx, by, bw, bh, cutaway=True, fill_level=lvl, sw=6)
        else:
            barrel(cv, bx, by, bw, bh, cutaway=True, fill_level=lerp(0.0, 0.86, fillw), liquid=WATER, sw=6)
            # rising bubbles in water
            for k in range(10):
                ph = (t * 0.9 + k * 0.13) % 1
                yy = by - 20 - ph * bh * 0.86 * fillw
                ellipse(cv, bx - 150 + (k * 37) % 300, yy, 7, 7, None, '#FFFFFF', 2.5, n=8, alpha=0.8 * (1 - ph))
            # leftover amber traces dissolving
            ra = 1 - seg(t, 2.0, 2.9)
            if ra > 0:
                ellipse(cv, bx, by - 14, bw / 2 - 20, 14, AMBER, None, 0, alpha=0.6 * ra, hatch_on=False)
        # drain valve + stream out
        rect(cv, bx + bw / 2 - 6, by - 60, 46, 26, STEEL_D, INK, 3.5, hatch_on=False)
        if 0.05 < drain < 0.99:
            line(cv, [(bx + bw / 2 + 40, by - 47), (bx + bw / 2 + 90, by - 30), (bx + bw / 2 + 110, by + 140)], AMBER, 18 * (1 - drain * 0.5), jit=0.8)
        # water hose from above
        if 1.75 < t < 3.05:
            ha = seg(t, 1.75, 1.95) * (1 - seg(t, 2.95, 3.05))
            line(cv, [(bx - 520, 760), (bx - 260, 720), (bx - 90, 800), (bx - 70, 900)], '#4A6B8A', 30, a=ha)
            if 1.9 < t < 3.0:
                lvl_y = by - bh * lerp(0, 0.86, fillw)
                line(cv, [(bx - 70, 905), (bx - 65, lvl_y)], WATER, 20, a=0.95)
                line(cv, [(bx - 74, 905), (bx - 72, lvl_y)], '#FFFFFF', 5, a=0.8)
                # splash
                for k in range(5):
                    a = -math.pi / 2 + (k - 2) * 0.5
                    ph = (t * 3 + k * 0.2) % 1
                    cv.drawCircle(bx - 65 + math.cos(a) * 50 * ph, lvl_y + math.sin(a) * 60 * ph + 80 * ph * ph, 6 * (1 - ph), fillp(WATER_D, 0.9))
    # seal: lid drops & barrel closes
    if t > 2.95:
        if sealed >= 1:
            barrel(cv, bx, by, bw, bh, sw=6, lid='closed')
        else:
            ly = lerp(by - bh - 260, by - bh, ease_in(seg(t, 2.95, 3.25)))
            ellipse(cv, bx, ly, bw / 2, bw * 0.15, STEEL_L, INK, 6, hatch_on=False)
    cv.restore()


# ================================================================== SCENE 6: returned empty
def scene6(cv, t):
    fill_bg(cv, WALL)
    cv.save()
    dx, dy = drift(t, 4, 0.2)
    lift = ease_io(seg(t, 2.35, 3.2))
    cam(cv, 1.0, 540 + dx, 1250 + dy - lift * 120, 540, 1250)
    interior_bg(cv, t, horizon=1330, lamps=True)
    # giant stack with one empty slot
    for r in range(4):
        for c in range(-1, 8):
            if r == 2 and c == 3:
                continue
            barrel_sprite(cv, c * 150 + 75, 1330 - r * 200, 1.15)
    for r in range(5):
        line(cv, [(-100, 1330 - r * 200 + 4), (1200, 1330 - r * 200 + 4)], GREEN, 10, a=0.9)
    floor = 1760
    # roll phase
    rx = lerp(-160, 540, ease_out(seg(t, 0.0, 1.35)))
    if t < 1.35:
        hop = abs(math.sin(t * 9)) * 26 * (1 - seg(t, 0.9, 1.35))
        wob = math.sin(t * 13) * 6
        soft_shadow(cv, rx, floor + 4, 100, 10)
        cv.save()
        cv.translate(rx, floor - hop)
        cv.rotate(wob)
        barrel_lying(cv, 0, 0, 240, 170, rot=rx / 60)
        cv.restore()
        for k in range(3):
            line(cv, [(rx - 150 - k * 30, floor - 60 - k * 40), (rx - 230 - k * 30, floor - 60 - k * 40)], INK2, 3, a=0.5)
        person(cv, rx - 230, floor + 4, 1.1, lean=24, walk=t / BEAT * math.pi * 1.2, hands=[(110, -120), (100, -110)])
    else:
        # stand it up, reveal emptiness, then lift into slot
        up = ease_out(seg(t, 1.35, 1.6))
        cut = seg(t, 1.55, 1.75) * (1 - seg(t, 2.25, 2.4))
        bxx, byy = 540, lerp(floor, 1330 - 2 * 200 + 2, lift)
        sc = lerp(1.0, 1.15 * 120 / 240, lift)
        bw, bh = 240 * sc, 320 * sc
        soft_shadow(cv, bxx, byy + 4, bw * 0.55, 10)
        if cut > 0.5:
            barrel(cv, bxx, byy, bw, bh, cutaway=True, fill_level=0.0, sw=5)
            # dust motes in the empty drum
            for k in range(8):
                ph = (t * 0.5 + k * 0.17) % 1
                cv.drawCircle(bxx - bw * 0.35 + (k * 41) % (bw * 0.7), byy - bh * 0.15 - ph * bh * 0.6, 3, fillp('#E8E2D2', 0.8 * math.sin(ph * math.pi)))
            line(cv, [(bxx - bw * 0.4, byy - bh * 0.8), (bxx - bw * 0.2, byy - bh * 0.92)], '#B9B4C8', 1.5, a=0.6)
        else:
            barrel(cv, bxx, byy, bw, bh, sw=5 if lift < 0.5 else 3.6)
        if t < 2.4:
            person(cv, 260, floor + 4, 1.1, walk=None, hands=[(30, -110), (-10, -110)], head_tilt=-8 * up)
    cv.restore()


# ================================================================== SCENE 7: 9,500 barrels' worth
def scene7(cv, t):
    fill_bg(cv, mix(FLOOR, INK, 0.08))
    cv.save()
    s = lerp(1.8, 0.62, ease_io(seg(t, 0, 4.2))) - 0.03 * seg(t, 4.2, 7)
    rot = lerp(-4, 3, ease_io(seg(t, 0, 7)))
    cam(cv, s, 540, 1200, 540, 1200, rot)
    d = 64
    cols, rows = 32, 42
    ox = 540 - (cols - 1) * d / 2
    oy = 1200 - (rows - 1) * d / 2
    cv.drawRect(skia.Rect(ox - 200, oy - 200, ox + cols * d + 200, oy + rows * d + 200), fillp(mix(FLOOR, INK, 0.05)))
    # aisles every 8 cols
    for c in range(0, cols + 1, 8):
        xx = ox + c * d - d / 2 - 14
        cv.drawRect(skia.Rect(xx - 16, oy - 200, xx + 16, oy + rows * d + 200), fillp(mix(FLOOR, '#FFFFFF', 0.3)))
        line(cv, [(xx, oy - 200), (xx, oy + rows * d + 200)], AMBER, 4, a=0.6)
    # removal count escalation: one -> dozens -> hundreds -> massive section
    n_rm = 0
    if t > 0.5:
        n_rm = 1
    n_rm += int(40 * ease(seg(t, 1.0, 2.2)))
    n_rm += int(260 * ease(seg(t, 2.2, 4.0)))
    n_rm += int(420 * ease(seg(t, 4.0, 6.2)))
    vw = 1200 / s
    for r in range(rows):
        for c in range(cols):
            x = ox + c * d + (8 * (c // 8))
            y = oy + r * d
            if abs(x - 540) > vw * 0.75 or abs(y - 1200) > vw * 1.25:
                continue
            rank = RANK[r][c]
            if rank < n_rm:
                # fade out
                rt = REM_T[min(rank, len(REM_T) - 1)]
                barrel_top(cv, x, y, d * 0.44, state='ghost')
                continue
            barrel_sprite(cv, x, y, d * 0.47 / 50, kind='top')
    # aisle forklift seen from above (small)
    cv.restore()


def _rank():
    rows, cols = 42, 32
    cx, cy = 13, 17
    lst = []
    for r in range(rows):
        for c in range(cols):
            dd = math.hypot((c - cx) * 1.0, (r - cy) * 0.85) + 2.2 * hsh(r * 41 + c, 3)
            lst.append((dd, r, c))
    lst.sort()
    R = [[0] * cols for _ in range(rows)]
    for i, (_, r, c) in enumerate(lst):
        R[r][c] = i
    return R


RANK = _rank()
REM_T = [0]


# ================================================================== SCENE 8: the inspection
def scene8(cv, t):
    fill_bg(cv, WALL)
    cv.save()
    push = ease_io(seg(t, 5.2, 7.3))
    s = 1.18 + 0.25 * push
    dx, dy = drift(t, 3, 0.2)
    cam(cv, s, 640 + dx + push * 10, 1440 + dy, 540, 1330)
    interior_bg(cv, t, horizon=1250)
    floor = 1740
    bw, bh = 170, 225
    # stacked barrels: back rows (pallet stack)
    for r, (n, y) in enumerate([(4, floor - 2 * bh - 8), (5, floor - bh - 4)]):
        for i in range(n):
            x = 560 + i * bw + (bw / 2 if r == 0 else 0) + 30
            barrel(cv, x, y, bw, bh, sw=4)
    # the light barrel (front-left, bottom row)
    tx = 560 + 30
    touch = seg(t, 2.9, 3.05)
    shift = 0
    wob = 0
    if t > 3.0:
        k = t - 3.0
        shift = 26 * ease_out(seg(k, 0, 0.35))
        wob = 7 * math.sin(k * 14) * math.exp(-k * 2.2)
    lift = abs(wob) * 1.2
    cv.save()
    cv.translate(tx + shift, floor - lift)
    cv.rotate(wob)
    barrel(cv, 0, 0, bw, bh, sw=4)
    cv.restore()
    for i in range(1, 4):
        barrel(cv, 560 + 30 + i * bw, floor, bw, bh, sw=4)
    # motion marks on shift
    if 3.0 < t < 4.0:
        a = 1 - seg(t, 3.4, 4.0)
        for k in range(3):
            line(cv, [(tx - bw / 2 - 20 - k * 8, floor - 160 + k * 50), (tx - bw / 2 - 45 - k * 8, floor - 150 + k * 50)], INK, 4, a=a)
    # hollow tap rings
    for tap in (4.45, 4.9):
        if tap < t < tap + 1.2:
            ph = (t - tap) / 1.2
            for j in range(3):
                pj = ph * 1.2 - j * 0.18
                if 0 < pj < 1:
                    r = 40 + pj * 230
                    line(cv, ellipse_pts(tx + shift, floor - bh * 0.5, r, r * 0.8, 20, -0.9, 0.9), INK2, 4, a=(1 - pj) * 0.8)
                    line(cv, ellipse_pts(tx + shift, floor - bh * 0.5, r, r * 0.8, 20, math.pi - 0.9, math.pi + 0.9), INK2, 4, a=(1 - pj) * 0.8)
    # inspector
    ix = lerp(-60, 410, ease_out(seg(t, 0.0, 2.3)))
    walking = t < 2.3
    react = seg(t, 3.1, 3.4)
    hands = None
    if t > 2.3:
        reach = ease_io(seg(t, 2.4, 2.95))
        hr = (lerp(20, (tx - bw / 2 - ix) / 1.15 + 6, reach), lerp(-110, -150, reach))
        if t > 3.1:
            back = ease_out(seg(t, 3.1, 3.5)) * (1 - seg(t, 4.2, 4.4))
            hr = (hr[0] - 40 * back, hr[1] - 30 * back)
        if t > 4.3:
            # knock-knock
            kk = max(0.0, math.sin((t - 4.3) * math.pi / 0.45)) if t < 5.2 else 0.0
            hr = ((tx - bw / 2 - ix) / 1.15 + 4 - 22 * kk, -170)
        hands = [hr, (-4, -150)]
    person(cv, ix, floor + 6, 1.15, body=GREEN, head=SKIN, hat='hardhat', vest=AMBER_L, clipboard=(t < 2.3 or t > 5.4),
           walk=(t / BEAT * math.pi) if walking else None, hands=hands if not (t < 2.3 or t > 5.4) else [(30, -125), (-10, -112)],
           brow=react, mouth='o' if 3.2 < t < 5.6 else None, head_tilt=-10 * react if t < 5.4 else 6, lean=-6 * react * (1 - seg(t, 4.2, 4.4)))
    if 3.2 < t < 4.8:
        a = seg(t, 3.2, 3.4) * (1 - seg(t, 4.5, 4.8))
        shape(cv, [(ix + 66, floor - 300), (ix + 74, floor - 284), (ix + 66, floor - 276), (ix + 58, floor - 284)], '#BFE2EC', INK, 2.5, alpha=a, hatch_on=False)
    cv.restore()
    # subtle vignette as tension rises
    v = seg(t, 4.2, 6.5) * 0.35
    if v > 0:
        p = skia.Paint(Shader=skia.GradientShader.MakeRadial(skia.Point(540, 1250), 1100, [col(INK, 0), col(INK, 0), col(INK, v)], [0, 0.55, 1]))
        cv.drawRect(skia.Rect(0, 0, W, H), p)


# ================================================================== SCENE 9: 18.7 million
def inventory_sheet(cv, x, y, w, h, t, strike, rot=0.0, alpha=1.0):
    cv.save()
    cv.translate(x, y)
    cv.rotate(rot)
    soft_shadow(cv, 10, h / 2 + 10, w / 2, 20, 0.2)
    rect(cv, -w / 2, -h / 2, w, h, '#FBF7EC', INK, 5, hatch_on=False, alpha=alpha)
    rect(cv, -w / 2, -h / 2, w, 70, mix(AMBER_L, PAPER, 0.4), INK, 4, alpha=alpha, spacing=8)
    maple_leaf(cv, -w / 2 + 45, -h / 2 + 35, 22, RED, INK, 2, alpha=alpha)
    scribble_lines(cv, -w / 2 + 90, -h / 2 + 30, 200, 1, sw=4, c=INK)
    n = 9
    rh = (h - 100) / n
    for i in range(n):
        yy = -h / 2 + 90 + i * rh
        line(cv, [(-w / 2 + 10, yy + rh - 6), (w / 2 - 10, yy + rh - 6)], '#BCC6D6', 2, a=alpha * 0.9)
        missing = strike * n * 1.3 > (i * 1.0 + (i % 3) * 0.6)
        barrel_sprite(cv, -w / 2 + 50, yy + rh - 12, 0.32, alpha=alpha * (0.25 if missing else 1))
        scribble_lines(cv, -w / 2 + 95, yy + rh * 0.45, w * 0.45, 1, sw=2.6, seed=i)
        rect(cv, w / 2 - 70, yy + 12, 34, 34, None, INK, 3, alpha=alpha)
        if missing:
            line(cv, [(w / 2 - 66, yy + 16), (w / 2 - 40, yy + 42)], RED, 5, a=alpha)
            line(cv, [(w / 2 - 40, yy + 16), (w / 2 - 66, yy + 42)], RED, 5, a=alpha)
            line(cv, [(-w / 2 + 20, yy + rh * 0.5), (w / 2 - 90, yy + rh * 0.5 + 4)], RED, 5, a=alpha * 0.9)
    cv.restore()


def pancakes(cv, x, y, s, pour, t):
    cv.save()
    cv.translate(x, y)
    cv.scale(s, s)
    ellipse(cv, 0, 0, 190, 40, '#F7F3EA', INK, 4, hatch_on=False)
    for k in range(5):
        ellipse(cv, 0, -18 - k * 28, 140, 34, '#E2B66C', INK, 4, spacing=7)
    ellipse(cv, 0, -18 - 4 * 28 - 6, 120, 26, AMBER, INK, 3, hatch_on=False)
    if pour > 0:
        for k in range(3):
            dl = clamp(pour * 1.5 - k * 0.2)
            xx = -90 + k * 80
            shape(cv, [(xx - 10, -140), (xx + 10, -140), (xx + 9, -140 + 90 * dl), (xx, -128 + 90 * dl), (xx - 9, -140 + 90 * dl)], AMBER, INK, 2.5, jit=0.6)
        # syrup jug pouring
        cv.save()
        cv.translate(170, -560)
        cv.rotate(-118)
        shape(cv, rrect_pts(-55, -90, 110, 190, 30), AMBER, INK, 4, spacing=8)
        rect(cv, -18, -150, 36, 64, AMBER, INK, 4, hatch_on=False)
        ellipse(cv, 0, 20, 40, 34, '#F8F1E1', INK, 3, hatch_on=False)
        maple_leaf(cv, 0, 22, 22, RED, INK, 2)
        cv.restore()
        pts = [(36 + 8 * math.sin(yy / 50 + t * 7), yy) for yy in np.linspace(-520, -150, 10)]
        line(cv, pts, INK, 26, jit=0.5, a=0.9)
        line(cv, pts, AMBER, 20, jit=0.5)
        line(cv, [(x - 4, y) for x, y in pts], AMBER_L, 5, jit=0.5)
    cv.restore()


def scene9(cv, t):
    fill_bg(cv, '#EFE5D0')
    cv.save()
    dx, dy = drift(t, 4, 0.2)
    zz = 1.0 + 0.04 * t
    cam(cv, zz, 540 + dx, 1200 + dy)
    # warm backdrop + leaf pattern
    for k, (lx, ly) in enumerate([(120, 640), (950, 760), (300, 1550), (900, 1700), (540, 1100)]):
        maple_leaf(cv, lx, ly, 110, None, mix(PAPER, INK, 0.2), 3, alpha=0.3, rot=0.2 * math.sin(t + k))
    # money pile phase
    m = ease_out(seg(t, 1.45, 3.1))
    ground = 1780
    if t > 1.3:
        # barrels stack (left) morph into bundles one by one
        pos = []
        for r in range(4):
            for i in range(4 - r):
                pos.append((170 + i * 110 + r * 55, ground - r * 120))
        for j, (px, py) in enumerate(pos):
            kk = seg(t, 1.5 + j * 0.12, 1.8 + j * 0.12)
            if kk < 1:
                barrel_sprite(cv, px, py, 0.72, alpha=1 - kk)
            if kk > 0:
                r_ = round((ground - py) / 120)
                money_bundle(cv, px, lerp(py, ground - r_ * 74, ease_out(kk)), 100, 60, alpha=kk)
        # enormous pile of currency on the right
        ph = 120 + 560 * m
        pile = [(560, ground), (640, ground - ph * 0.5), (760, ground - ph * 0.92), (850, ground - ph), (960, ground - ph * 0.82),
                (1080, ground - ph * 0.4), (1180, ground)]
        shape(cv, pile, MONEY, MONEY_D, 5, spacing=10, hangle=25)
        for k in range(26):
            u = (hsh(k, 21) + 1) / 2
            v = (hsh(k, 22) + 1) / 2
            bxp = 600 + u * 540
            top_y = ground - ph * max(0, 1 - abs(bxp - 850) / 330) * 0.95
            byp = lerp(top_y + 50, ground - 40, v)
            if byp > top_y + 30:
                money_bundle(cv, bxp, byp, 90 + 30 * u, 45 + 10 * v)
        # burst of notes
        for k in range(18):
            st = 1.7 + k * 0.08
            if t > st:
                pt = (t - st) / 2.8
                pt2 = pt % 1
                nx = 850 + hsh(k, 31) * 420 + math.sin(t * 2 + k) * 50
                ny = ground - ph - 40 - pt2 * 700 * (0.6 + 0.4 * (hsh(k, 32) + 1) / 2)
                banknote(cv, nx, ny, 130, 62, rot=hsh(k, 33) + t * 1.2 * hsh(k, 34), alpha=math.sin(pt2 * math.pi))
    # pancakes with syrup pour (pancake syrup worth millions)
    pin = ease_out(seg(t, 3.4, 4.2))
    if pin > 0:
        pancakes(cv, lerp(-250, 260, pin), 1810, 0.85, seg(t, 3.9, 5.5), t)
    # inventory sheet slides away as syrup streams pour
    sh_y = lerp(1060, -600, ease_in(seg(t, 1.3, 2.3)))
    if sh_y > -500:
        inventory_sheet(cv, 540, sh_y, 760, 1000, t, ease(seg(t, 0.2, 1.3)), rot=-0.03)
    streams = seg(t, 1.1, 1.5) * (1 - seg(t, 2.6, 3.0))
    if streams > 0:
        for k, sx in enumerate((300, 560, 800)):
            ln = ease_out(seg(t, 1.1 + k * 0.08, 1.9 + k * 0.08))
            yb = 380 + 1400 * ln
            pts = [(sx + 3 * math.sin(yy / 90 + t * 6 + k), yy) for yy in np.linspace(380, yb, 14)]
            line(cv, pts, INK, 36 * streams + 6, jit=0.6, a=0.9)
            line(cv, pts, AMBER, 36 * streams, jit=0.6)
            line(cv, [(x - 10, y) for x, y in pts], AMBER_L, 10 * streams, jit=0.8, a=0.9)
            if ln > 0.95:
                ellipse(cv, sx, 1785, 120 * streams, 22 * streams, AMBER, INK, 3, hatch_on=False)
    cv.restore()


# ================================================================== SCENE 10: investigation -> court
def board(cv, t):
    fill_bg(cv, '#DCCDB3')
    rect(cv, 40, 520, 1000, 1300, '#C89B6A', INK, 8, spacing=12)
    rect(cv, 40, 520, 1000, 1300, None, WOOD, 18, jit=1)
    # items
    items = [(220, 700, -0.06, 'barrel'), (520, 680, 0.04, 'truck'), (840, 720, -0.03, 'sheet'), (240, 1080, 0.05, 'person'),
             (560, 1140, -0.02, 'map'), (850, 1100, 0.06, 'person2'), (300, 1480, -0.04, 'sheet'), (760, 1500, 0.03, 'barrel2')]
    pins = []
    for i, (x, y, r, kind) in enumerate(items):
        app = seg(t, 0.0 + i * 0.08, 0.3 + i * 0.08)
        if app <= 0:
            continue
        cv.save()
        cv.translate(x, y)
        cv.rotate(math.degrees(r))
        cv.scale(lerp(1.15, 1, app), lerp(1.15, 1, app))
        if kind == 'map':
            rect(cv, -190, -150, 380, 300, '#E7EFE2', INK, 4, hatch_on=False)
            shape(cv, [(-190, 40), (-60, -10), (40, 60), (190, 20), (190, 150), (-190, 150)], '#C8DCC0', None, 0)
            pth = [(-150, 100), (-60, 20), (20, 50), (120, -60), (160, -110)]
            p = strokep(RED, 5)
            p.setPathEffect(skia.DashPathEffect.Make([14, 10], -t * 40))
            cv.drawPath(mkpath(jitter(pth, 1, 77), closed=False), p)
            ellipse(cv, -150, 100, 12, 12, AMBER, INK, 3, hatch_on=False)
            ellipse(cv, 160, -110, 12, 12, GREEN, INK, 3, hatch_on=False)
        elif kind == 'sheet':
            rect(cv, -110, -140, 220, 280, '#FBF7EC', INK, 4, hatch_on=False)
            scribble_lines(cv, -85, -100, 170, 9, 24, sw=2.4, seed=i)
        else:
            rect(cv, -120, -100, 240, 200, '#FBF7EC', INK, 4, hatch_on=False)
            rect(cv, -100, -80, 200, 150, '#D9D4C8', INK, 3)
            if kind.startswith('barrel'):
                barrel_sprite(cv, 0, 62, 0.72)
            elif kind == 'truck':
                truck(cv, 0, 60, 0.32)
            else:
                person(cv, 0, 74, 0.62, body=SHADOW, hat='beanie', eyes=False, hands=[(16, -110), (-16, -110)])
        cv.restore()
        pins.append((x + 0, y - 110 if kind != 'map' else y - 150))
        ellipse(cv, pins[-1][0], pins[-1][1], 12, 12, RED, INK, 2.5, hatch_on=False, n=8)
    # red string connecting pins progressively
    order = [0, 1, 2, 5, 4, 3, 6, 7, 4, 1]
    sl = seg(t, 0.6, 2.0) * (len(order) - 1)
    for j in range(len(order) - 1):
        if j >= sl or order[j + 1] >= len(pins) or order[j] >= len(pins):
            break
        a, b = pins[order[j]], pins[order[j + 1]]
        k = clamp(sl - j)
        line(cv, [a, ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 20), (lerp(a[0], b[0], k), lerp(a[1], b[1], k))], RED, 3.5, jit=0.5)


def interview(cv, t):
    fill_bg(cv, '#3D3A5C')
    cv.drawRect(skia.Rect(0, 400, W, 1500), skia.Paint(Shader=lin_grad(0, 400, 0, 1500, ['#3D3A5C', '#5B5779'])))
    cv.drawRect(skia.Rect(0, 1500, W, H), fillp('#4A4668'))
    light_cone(cv, 540, 640, 900, 1200, a=0.35, c='#FFE9B0')
    lamp(cv, 540, 640)
    # officer (left, cap) & person questioned (right)
    person(cv, 250, 1600, 1.35, body='#2E3A5E', head=SKIN, hat='cap', hands=[(110, -125), (60, -118)], eyes=True,
           head_tilt=4 * math.sin(t * 2))
    person(cv, 830, 1600, 1.35, body='#7A7F99', head=SKIN, hat=None, facing=-1, hands=[(70, -120), (40, -118)], eyes=True,
           mouth='flat', head_tilt=-4)
    # table
    rect(cv, 140, 1420, 800, 50, WOOD, INK, 5, spacing=8)
    line(cv, [(200, 1470), (200, 1720)], INK, 12)
    line(cv, [(880, 1470), (880, 1720)], INK, 12)
    # notepad + photo of barrel on the table
    rect(cv, 330, 1380, 120, 46, '#FBF7EC', INK, 3, hatch_on=False)
    scribble_lines(cv, 340, 1392, 90, 2, 14, sw=2.2)
    rect(cv, 560, 1372, 130, 54, '#FBF7EC', INK, 3, hatch_on=False)
    barrel_sprite(cv, 625, 1420, 0.25)
    # writing pencil motion
    px = 360 + 60 * ((t * 1.5) % 1)
    line(cv, [(px, 1395), (px + 30, 1350)], AMBER_L, 7)


def court(cv, t):
    fill_bg(cv, '#D9DEE6')
    cv.drawRect(skia.Rect(0, 400, W, 1700), skia.Paint(Shader=lin_grad(0, 400, 0, 1700, ['#B9C4D3', '#E8ECF0'])))
    g = 1650
    cv.drawRect(skia.Rect(0, g, W, H), fillp(SNOW))
    line(cv, [(0, g), (W, g)], INK, 4)
    # courthouse
    shape(cv, [(130, 900), (540, 640), (950, 900)], STEEL_L, INK, 6, smooth=False, spacing=12)
    maple_leaf(cv, 540, 820, 40, RED, INK, 2.5)
    rect(cv, 150, 900, 780, 60, STEEL, INK, 5)
    for k in range(6):
        x = 200 + k * 136
        rect(cv, x, 960, 60, 560, STEEL_L, INK, 4.5, spacing=10)
        line(cv, [(x + 20, 970), (x + 20, 1510)], STEEL_D, 3, a=0.8)
    for k in range(3):
        rect(cv, 110 - k * 30, 1520 + k * 44, 860 + k * 60, 44, STEEL, INK, 4.5)
    snow(cv, t, 50, 21, area=(0, 400, W, 1700), size=0.7)
    # gavel strike
    st = 0.75
    if t > 0.2:
        ang = 0
        if t < st:
            ang = -40 * ease_io(seg(t, 0.2, st - 0.15)) + 40 * ease_in(seg(t, st - 0.15, st))
        else:
            ang = -6 * math.exp(-(t - st) * 6) * math.sin((t - st) * 30)
        gx, gy = 760, 1820
        rect(cv, gx - 150, gy - 30, 300, 40, WOOD, INK, 4, spacing=7)
        cv.save()
        cv.translate(gx + 220, gy - 60)
        cv.rotate(ang)
        line(cv, [(0, 0), (-190, -20)], WOOD, 16)
        rrect(cv, -260, -70, 80, 110, 18, mix(WOOD, INK, 0.2), INK, 4, spacing=7)
        cv.restore()
        if t > st:
            a = 1 - seg(t, st, st + 0.5)
            for k in range(5):
                an = math.pi + k * 0.3 - 0.2
                line(cv, [(gx + math.cos(an) * 40, gy - 50 + math.sin(an) * 40), (gx + math.cos(an) * 90, gy - 50 + math.sin(an) * 80)], INK, 4, a=a)


def scene10(cv, t):
    # A: board 0-2.05 / B: interview 2.0-4.25 / C: court 4.2-
    def place(fn, lt, off):
        cv.save()
        cv.translate(off, 0)
        fn(cv, lt)
        cv.restore()
    kAB = ease_io(seg(t, 1.85, 2.3))
    kBC = ease_io(seg(t, 4.05, 4.5))
    dx, dy = drift(t, 4, 0.22)
    cv.save()
    cv.translate(dx, dy)
    if kAB < 1:
        place(board, t, -W * kAB)
    if kAB > 0 and kBC < 1:
        place(interview, t - 2.0, W * (1 - kAB) - W * kBC)
    if kBC > 0:
        place(court, t - 4.2, W * (1 - kBC))
    cv.restore()


# ================================================================== SCENE 11: heist legend + fingerprint
def fingerprint(cv, x, y, s, prog, c=AMBER_D, alpha=1.0):
    """draw whorl ridges progressively."""
    total = 13
    for i in range(total):
        k = clamp(prog * total * 1.2 - i * 0.9)
        if k <= 0:
            continue
        rx = (14 + i * 11) * s
        ry = (20 + i * 14.5) * s
        a0 = -math.pi / 2 + (0.5 if i % 3 == 0 else 0.25) * (1 if i % 2 else -1)
        span = (math.tau - 0.6 - (0.4 if i % 4 == 1 else 0)) * k
        pts = []
        n = 30
        for j in range(n + 1):
            a = a0 + span * j / n
            wv = 1 + 0.05 * math.sin(a * 3 + i)
            pts.append((x + rx * wv * math.cos(a), y + ry * wv * math.sin(a) + 6 * s * math.sin(a * 2)))
        line(cv, pts, c, 5.5 * s, jit=0.9, a=alpha)


def winter_landscape(cv, t, sky=('#C8D2E0', '#F2E4CC'), y_h=1220):
    cv.drawRect(skia.Rect(-400, 0, 1500, 1700), skia.Paint(Shader=lin_grad(0, 380, 0, 1400, list(sky))))
    shape(cv, [(-400, 1150), (-50, 1010), (300, 1100), (700, 980), (1100, 1080), (1500, 1020), (1500, 1400), (-400, 1400)],
          '#DCE3EC', INK, 3.5, spacing=14)
    for k, x in enumerate(range(-80, 1200, 75)):
        pine(cv, x + (k % 2) * 20, 1170 + (k % 3) * 25, 130 + (k * 37) % 70, alpha=0.9)
    cv.drawRect(skia.Rect(-400, y_h, 1500, 2400), skia.Paint(Shader=lin_grad(0, y_h, 0, 1920, [SNOW, '#FFFFFF'])))
    shape(cv, [(-400, y_h + 20), (200, y_h - 10), (700, y_h + 25), (1500, y_h - 5), (1500, y_h + 60), (-400, y_h + 60)], SNOW, INK, 3.5, hatch_on=False)


def scene11(cv, t):
    fill_bg(cv, '#E9E2D6')
    cv.save()
    dx, dy = drift(t, 4, 0.2)
    cam(cv, 1.0 + 0.025 * t, 540 + dx, 1200 + dy)
    winter_landscape(cv, t)
    # giant warehouse silhouette
    rect(cv, 140, 900, 820, 330, '#3E3C5E', INK, 5, spacing=12)
    shape(cv, [(110, 910), (540, 760), (990, 910)], '#2E2C4C', INK, 5, smooth=False, spacing=12)
    for k in range(7):
        rect(cv, 190 + k * 110, 980, 60, 44, '#F4C25A', INK, 3, hatch_on=False, alpha=0.9)
        glow(cv, 220 + k * 110, 1002, 40, AMBER_L, 0.3)
    # road + truck silhouette driving away
    line(cv, [(-100, 1330), (1200, 1290)], '#9AA0B5', 22, a=0.8)
    trx = lerp(380, 1250, seg(t, 0, 5.2))
    truck(cv, trx, 1330, 0.36, wrot=trx / 8, silhouette=True)
    # rolling barrel in foreground
    rx = lerp(1250, 150, ease_out(seg(t, 0.2, 3.4)))
    soft_shadow(cv, rx, 1806, 110, 10)
    barrel_lying(cv, rx, 1800, 260, 180, rot=-rx / 70)
    # maple leaf drifting (sparing red)
    lt_ = (t * 0.25) % 1
    maple_leaf(cv, 180 + lt_ * 300, 1350 + lt_ * 300, 26, RED, INK, 2, rot=t * 1.2)
    # giant syrup drop -> fingerprint
    fall = ease_out(seg(t, 0.0, 2.2))
    dyy = lerp(560, 1060, fall)
    morph = ease_io(seg(t, 2.3, 3.4))
    glow(cv, 540, dyy, 240, AMBER_L, 0.35)
    if morph < 1:
        r = 120
        pts = []
        for j in range(30):
            a = j / 30 * math.tau
            # teardrop: point at top
            rr = r * (1 - 0.0 * morph)
            px = math.cos(a) * rr
            py = math.sin(a) * rr * 1.05
            if py < 0:
                px *= (1 + py / (rr * 1.6)) ** (1.5 * (1 - morph))
                py *= 1 + 0.9 * (1 - morph)
            pts.append((540 + px, dyy + py))
        shd = skia.GradientShader.MakeRadial(skia.Point(500, dyy - 30), 220, [col(AMBER_L), col(AMBER), col(AMBER_D)])
        shape(cv, pts, AMBER, INK, 6, fill_shader=shd, alpha=1 - morph * 0.85)
        line(cv, ellipse_pts(505, dyy - 20, 55, 70, 10, math.pi * 1.05, math.pi * 1.5), '#FFF4D6', 9, a=0.8 * (1 - morph))
    if morph > 0:
        ellipse(cv, 540, dyy, 175, 230, mix(AMBER_L, PAPER, 0.5), None, 0, alpha=0.5 * morph, hatch_on=False)
        fingerprint(cv, 540, dyy, 1.15, seg(t, 2.4, 4.0))
    snow(cv, t, 60, 31, a=0.9, area=(-200, 380, 1300, 2000), size=0.8)
    cv.restore()


# ================================================================== SCENE 12: ending
def scene12(cv, t):
    fill_bg(cv, '#E9E2D6')
    cv.save()
    dx, dy = drift(t, 3, 0.18)
    cam(cv, 1.04 - 0.03 * seg(t, 0, 5.5), 540 + dx, 1250 + dy, 540, 1250)
    winter_landscape(cv, t, sky=('#C3CEDE', '#F4E6CC'), y_h=1300)
    truck(cv, lerp(-200, 420, seg(t, 0, 5.5)), 1300, 0.26, wrot=t * 5, silhouette=True)
    # warehouse (rows of barrels) fading into the landscape
    fade = 1 - 0.85 * ease_io(seg(t, 0.6, 4.0))
    cv.saveLayerAlpha(None, int(255 * fade))
    cv.drawRect(skia.Rect(-300, 380, 1400, 1360), skia.Paint(Shader=lin_grad(0, 380, 0, 1360, [WALL, WALL_D])))
    for r in range(5):
        for c in range(-1, 12):
            barrel_sprite(cv, c * 98 + 30 + (r % 2) * 40, 1360 - r * 190 + 20 * 0, 0.78)
        line(cv, [(-300, 1360 - r * 190 + 3), (1400, 1360 - r * 190 + 3)], GREEN, 8, a=0.9)
    cv.restore()
    # foreground floor & open barrel
    cv.drawRect(skia.Rect(-300, 1500, 1400, 2400), skia.Paint(Shader=lin_grad(0, 1500, 0, 1920, [mix(SNOW, FLOOR, fade * 0.7), SNOW])))
    line(cv, [(-300, 1500), (1400, 1500)], INK, 4, a=0.8)
    glow(cv, 540, 1380, 230, AMBER_L, 0.35)
    barrel(cv, 540, 1840, 400, 480, lid='open', open_amt=1.0, sw=6)
    # faint fingerprint reflected on syrup
    fa = 0.5 * (1 - seg(t, 0.0, 2.5))
    if fa > 0:
        cv.save()
        cv.translate(540, 1362)
        cv.scale(1, 0.3)
        fingerprint(cv, 0, 0, 0.6, 1.0, c=AMBER_D, alpha=fa)
        cv.restore()
    snow(cv, t, 70, 41, a=0.9, area=(-200, 380, 1300, 2000), size=0.8)
    cv.restore()


SCENES = [scene1, scene2, scene3, scene4, scene5, scene6, scene7, scene8, scene9, scene10, scene11, scene12]

# transition at boundary j (into scene j): (type, focus)
TRANS = {1: ('iris', (540, 1300)), 2: ('fade', None), 3: ('pushL', None), 4: ('iris', (300, 1300)),
         5: ('pushUp', None), 6: ('pushDown', None), 7: ('iris', (540, 1250)), 8: ('paper', None), 9: ('pushL', None),
         10: ('iris', (540, 1200)), 11: ('fade', None)}
TW0, TW1 = 0.5, 0.1
