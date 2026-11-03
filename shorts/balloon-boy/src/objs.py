from lib import *

# =============================================================== balloon
_CRINK = [(random.Random(i).uniform(-190, 190), random.Random(i + 50).uniform(-130, -10)) for i in range(16)]

def balloon_path(sy_top=1.0):
    p = P()
    top = -150 * sy_top
    p.moveTo(-232, 0)
    p.cubicTo(-200, top * 0.55, -95, top, 0, top)
    p.cubicTo(95, top, 200, top * 0.55, 232, 0)
    p.cubicTo(170, 52, -170, 52, -232, 0)
    p.close()
    return p

def balloon(d, x, y, s=1.0, rot=0.0, ghost=0.0, squash=0.0, open_=0.0, empty_glow=0.0, box=True, shine=1.0):
    c = d.c
    c.save()
    c.translate(x, y)
    c.rotate(rot)
    c.scale(s, s)
    if squash:
        c.translate(0, 105)
        c.scale(1 + 0.12 * squash, 1 - 0.22 * squash)
        c.translate(0, -105)
    sy = 1.0 - 0.25 * squash
    body = balloon_path(sy)
    # strings + box
    if box:
        for (a, b) in [((-150, 22), (-40, 52)), ((150, 22), (40, 52)), ((-60, 32), (-28, 52)), ((60, 32), (28, 52))]:
            d.line([a, b], 2.5, INK, 0.85, rough=0.6)
    sh = skia.GradientShader.MakeLinear([skia.Point(-60, -165 * sy), skia.Point(40, 35)],
                                        [hexc(SILVER_L), hexc(SILVER), hexc(SILVER_D)], [0, 0.55, 1])
    d.shape(body, lw=5.5, shader=sh, hatch=0.22)
    # seams
    for sx in (-150, -78, 0, 78, 150):
        p = P(); p.moveTo(sx * 0.12, -160 * sy); p.quadTo(sx * 0.8, -110 * sy, sx * 1.0, 18 + abs(sx) * -0.05)
        c.drawPath(p, d.stroke_paint(SILVER_D, 2.2, 0.55, rough=1.0))
    # rim band
    rim = P(); rim.moveTo(-236, 0); rim.cubicTo(-170, 40, 170, 40, 236, 0); rim.cubicTo(170, 58, -170, 58, -236, 0)
    d.shape(rim, '#9AA1AD', lw=3.5, hatch=0.3)
    # crinkles
    for i, (cx, cy) in enumerate(_CRINK):
        cy2 = cy * sy
        d.line([(cx, cy2), (cx + 9, cy2 - 6), (cx + 15, cy2 + 2), (cx + 24, cy2 - 4)], 1.8,
               '#7E8594' if i % 2 else '#FFFFFF', 0.5, rough=0.5, curve=False)
    # highlight
    if shine > 0:
        hp = P(); hp.moveTo(-160, -70 * sy); hp.quadTo(-120, -142 * sy, -30, -150 * sy)
        c.drawPath(hp, d.stroke_paint('#FFFFFF', 13, 0.75 * shine, rough=1.0))
        c.drawPath(hp, d.stroke_paint('#FFFFFF', 4, 0.9 * shine, rough=0.6))
        d.glow(-95, -120 * sy, 26, '#FFFFFF', 0.35 * shine)
    if box:
        bx = rect(-44, 50, 44, 112)
        d.shape(bx, '#CDB792', lw=4.5, hatch=0.4)
        d.line([(-44, 66), (44, 66)], 2, WOOD_D, 0.6)
        if open_ > 0:
            # dark empty interior opening, front flap folds down
            inner = rect(-36, 58, 36, 106)
            d.shape(inner, '#221E30', lw=3, hatch=0.1)
            g = empty_glow
            # inside of the EMPTY box: back wall, side walls, bare floor lit by flashlight
            back = rect(-20, 66, 20, 92)
            d.shape(back, mixc('#221E30', '#8C7558', g), lw=2, hatch=0.15, misreg=(0, 0))
            for (ax, ay, bx2, by2) in [(-36, 58, -20, 66), (36, 58, 20, 66), (-36, 106, -20, 92), (36, 106, 20, 92)]:
                d.line([(ax, ay), (bx2, by2)], 1.8, '#B49A78', 0.6 * g + 0.2)
            floor = poly([(-20, 92), (20, 92), (36, 106), (-36, 106)])
            d.shape(floor, mixc('#221E30', '#C9AE84', g), lw=1.5, hatch=0.1, misreg=(0, 0))
            if g > 0:
                d.glow(0, 92, 26, '#FFF2BF', 0.35 * g)
            fl = open_
            flap = poly([(-38, 106), (38, 106), (38 + 6 * fl, 106 + 58 * fl), (-38 - 6 * fl, 106 + 58 * fl)])
            d.shape(flap, '#D8C4A0', lw=4, hatch=0.35)
    if ghost > 0:
        imagined_child(d, 0, -40 * sy, 0.95, ghost)
    c.restore()

def imagined_child(d, x, y, s, a, qmark=True):
    """Transparent dashed sketch: what people BELIEVED was inside."""
    c = d.c
    c.save(); c.translate(x, y); c.scale(s, s)
    head = circle(0, -62, 22)
    body = P()
    body.moveTo(-30, -32); body.cubicTo(-34, -10, -34, 18, -26, 34); body.lineTo(26, 34)
    body.cubicTo(34, 18, 34, -10, 30, -32); body.cubicTo(18, -42, -18, -42, -30, -32); body.close()
    d.glow(0, -20, 70, '#E8F4FF', 0.45 * a)
    fp = skia.Paint(Color=hexc('#FFFFFF', 0.42 * a * d.alpha), AntiAlias=True)
    c.drawPath(head, fp); c.drawPath(body, fp)
    ph = (d.t * 30) % 27
    d.dashed(head, 6, '#FFFFFF', 0.95 * a, 11, 7, ph)
    d.dashed(body, 6, '#FFFFFF', 0.95 * a, 11, 7, ph)
    d.dashed(head, 2.4, '#3C5FA8', 0.8 * a, 11, 7, ph)
    d.dashed(body, 2.4, '#3C5FA8', 0.8 * a, 11, 7, ph)
    if qmark:
        f = font('kalamb', 58)
        bob = math.sin(d.t * 4) * 4
        d.text('?', 46, -40 + bob, f, RED, a, stroke='#FFFFFF', sw=8)
    c.restore()

def thought_bubble(d, x0, y0, x1, y1, r, a, content=None, t=0.0, prog_=1.0):
    """Sketchy belief bubble with trailing dots from (x0,y0) to bubble center (x1,y1)."""
    n = 3
    for i in range(n):
        k = (i + 1) / (n + 1)
        if prog_ < k * 0.7:
            continue
        px = lerp(x0, x1, k * 0.75); py = lerp(y0, y1, k * 0.75)
        rr = 7 + 9 * k
        d.shape(circle(px, py, rr), CREAM, lw=3, hatch=0.0, a=a)
    if prog_ < 0.7:
        return
    k = eout((prog_ - 0.7) / 0.3)
    rr = r * (0.6 + 0.4 * k)
    pts = []
    for i in range(12):
        ang = i / 12 * math.tau
        rad = rr * (1 + 0.1 * (i % 2))
        pts.append((x1 + math.cos(ang) * rad * 1.15, y1 + math.sin(ang) * rad * 0.9))
    path = smooth(pts)
    d.shape(path, CREAM, lw=4, hatch=0.0, a=a * k)
    if content:
        d.c.save()
        d.c.clipPath(oval(x1, y1, rr * 1.05, rr * 0.8), skia.ClipOp.kIntersect, True)
        content(d, x1, y1, rr * k, a * k)
        d.c.restore()

# =============================================================== clouds
def cloud(d, x, y, s=1.0, a=1.0, col='#F7F4EE'):
    p = None
    for (cx, cy, r) in [(-70, 10, 42), (-25, -18, 55), (35, -10, 48), (75, 12, 36), (0, 18, 45)]:
        q = circle(cx, cy, r)
        p = q if p is None else skia.Op(p, q, skia.PathOp.kUnion_PathOp)
    flat = rect(-140, 24, 140, 200)
    p = skia.Op(p, flat, skia.PathOp.kDifference_PathOp)
    d.c.save(); d.c.translate(x, y); d.c.scale(s, s)
    d.shape(p, col, lw=3.5, hatch=0.08, a=a, ink=INK2, ink_a=0.55)
    d.c.restore()

# =============================================================== helicopter
def helicopter(d, x, y, s=1.0, kind='police', flip=False, tilt=-4.0, a=1.0):
    c = d.c
    t = d.t
    c.save(); c.translate(x, y); c.scale(-s if flip else s, s); c.rotate(tilt)
    body_col, stripe = (POLICE, '#F2F2F2') if kind == 'police' else ('#F1EEE8', RED)
    # tail boom
    d.shape(poly([(-62, -16), (-190, -24), (-190, -12), (-62, 8)]), body_col, lw=4, a=a)
    d.shape(poly([(-182, -22), (-200, -60), (-180, -56), (-170, -16)]), body_col, lw=4, a=a)
    # tail rotor
    ang = t * 40
    for k in (0, math.pi / 2):
        dx = math.cos(ang + k) * 24; dy = math.sin(ang + k) * 24
        d.line([(-190 - dx, -38 - dy), (-190 + dx, -38 + dy)], 3, INK, 0.6 * a, rough=0.4)
    # skids
    d.line([(-48, 50), (58, 50), (70, 42)], 4, INK, a, rough=0.6, curve=False)
    d.line([(-30, 30), (-36, 50)], 3.5, INK, a); d.line([(30, 30), (36, 50)], 3.5, INK, a)
    # body
    b = P()
    b.moveTo(-72, -18); b.cubicTo(-30, -50, 52, -50, 80, -6); b.cubicTo(88, 16, 62, 34, 22, 34)
    b.lineTo(-48, 30); b.cubicTo(-76, 24, -82, 0, -72, -18); b.close()
    d.shape(b, body_col, lw=5, a=a)
    # stripe
    c.save(); c.clipPath(b, skia.ClipOp.kIntersect, True)
    d.c.drawRect(skia.Rect(-90, 6, 100, 16), skia.Paint(Color=hexc(stripe, 0.95 * a * d.alpha), AntiAlias=True))
    c.restore()
    # window
    w = P(); w.moveTo(28, -40); w.cubicTo(60, -38, 80, -16, 80, -4); w.lineTo(30, -2); w.close()
    d.shape(w, '#BFDCEB', lw=3.5, a=a, hatch=0.1)
    d.line([(44, -32), (60, -14)], 3, '#FFFFFF', 0.8 * a)
    # mast + rotor
    d.line([(0, -42), (0, -56)], 5, INK, a)
    blur = skia.Paint(Color=hexc('#2A2350', 0.10 * a * d.alpha), AntiAlias=True)
    c.drawOval(skia.Rect(-165, -64, 165, -48), blur)
    ra = t * 21
    for k in (0, math.pi / 2):
        ex = math.cos(ra + k) * 160; ey = math.sin(ra + k) * 7
        d.line([(-ex, -56 - ey), (ex, -56 + ey)], 4.5, INK, 0.85 * a, rough=0.6)
    c.restore()

# =============================================================== TV
def tv(d, x, y, w, h, content=None, style='crt', lower=True, live=True, a=1.0, seed=0, scan=True):
    """x,y = top-left of SCREEN; content(d, w, h) draws in screen coords."""
    c = d.c
    t = d.t
    c.save(); c.translate(x, y)
    if style == 'crt':
        pad = 0.12 * w
        case = rrect(-pad, -pad * 0.8, w + pad * 1.6, h + pad * 0.9, 22)
        d.shape(case, '#B9AE9C', lw=5, a=a, hatch=0.3)
        # knobs
        d.shape(circle(w + pad * 0.85, h * 0.3, pad * 0.25), '#857A69', lw=3, a=a)
        d.shape(circle(w + pad * 0.85, h * 0.62, pad * 0.25), '#857A69', lw=3, a=a)
        # legs
        d.line([(w * 0.12, h + pad * 0.9), (w * 0.05, h + pad * 1.6)], 5, INK, a)
        d.line([(w * 0.95, h + pad * 0.9), (w * 1.02, h + pad * 1.6)], 5, INK, a)
        scr = rrect(0, 0, w, h, 26)
    else:
        pad = 0.05 * w
        case = rrect(-pad, -pad, w + pad, h + pad * 1.3, 8)
        d.shape(case, '#34364A', lw=5, a=a, hatch=0.2)
        d.shape(poly([(w * 0.42, h + pad * 1.3), (w * 0.58, h + pad * 1.3), (w * 0.64, h + pad * 3.2), (w * 0.36, h + pad * 3.2)]),
                '#34364A', lw=4, a=a)
        scr = rrect(0, 0, w, h, 6)
    c.save(); c.clipPath(scr, skia.ClipOp.kIntersect, True)
    c.drawRect(skia.Rect(0, 0, w, h), skia.Paint(Color=hexc(SKY, a * d.alpha)))
    if content:
        old = d.alpha; d.alpha = old * a
        content(d, w, h)
        d.alpha = old
    if lower:
        ly = h * 0.76
        c.drawRect(skia.Rect(0, ly, w * 0.84, h * 0.92), skia.Paint(Color=hexc(RED, 0.95 * a * d.alpha)))
        c.drawRect(skia.Rect(w * 0.84, ly, w, h * 0.92), skia.Paint(Color=hexc('#F2EEE6', 0.95 * a * d.alpha)))
        c.drawRect(skia.Rect(0, h * 0.92, w, h), skia.Paint(Color=hexc('#1F2238', 0.9 * a * d.alpha)))
        d.scribble(w * 0.05, ly + (h * 0.16) * 0.55, w * 0.62, h * 0.03, '#FFFFFF', max(1.5, w * 0.012), 0.9 * a, seed)
        # ticker dots move
        off = (t * w * 0.25) % (w * 0.3)
        for i in range(5):
            xx = w - off + i * w * 0.3 - w * 0.9
            d.line([(xx, h * 0.96), (xx + w * 0.18, h * 0.96)], max(1.2, w * 0.01), '#D9D9E0', 0.8 * a, rough=0.4)
    if live:
        blink = 0.55 + 0.45 * (math.sin(t * 6) > 0)
        c.drawCircle(w * 0.08, h * 0.1, max(4, w * 0.035), skia.Paint(Color=hexc(RED, blink * a * d.alpha), AntiAlias=True))
    if scan:
        sp = skia.Paint(Color=hexc('#1A1A30', 0.10 * a * d.alpha), StrokeWidth=max(1, h / 90))
        off = (t * 40) % 6
        yy = off
        while yy < h:
            c.drawLine(0, yy, w, yy, sp)
            yy += max(4, h / 45)
        # rolling bar
        by = (t * h * 0.4) % (h * 1.4) - h * 0.2
        c.drawRect(skia.Rect(0, by, w, by + h * 0.12), skia.Paint(Color=hexc('#FFFFFF', 0.06 * a * d.alpha)))
    # glare
    g = poly([(w * 0.55, 0), (w * 0.75, 0), (w * 0.35, h), (w * 0.15, h)])
    c.drawPath(g, skia.Paint(Color=hexc('#FFFFFF', 0.10 * a * d.alpha), AntiAlias=True))
    c.restore()
    c.drawPath(scr, d.stroke_paint(INK, 5, a))
    c.restore()

def tv_balloon_content(phase=0.0, heli=True, ghost=0.6, zoom=1.0, field=False):
    def f(d, w, h):
        c = d.c
        d.gradient_rect(skia.Rect(0, 0, w, h), ['#9FBFD3', '#CFE0E8'])
        t = d.t + phase
        cloud(d, (w * 0.2 + t * w * 0.05) % (w * 1.4) - w * 0.2, h * 0.25, w / 900, 0.9)
        cloud(d, (w * 0.85 + t * w * 0.03) % (w * 1.4) - w * 0.2, h * 0.55, w / 1300, 0.9)
        if field:
            c.drawRect(skia.Rect(0, h * 0.62, w, h), skia.Paint(Color=hexc(FIELD)))
        bx = w * 0.5 + math.sin(t * 0.9) * w * 0.06
        by = h * 0.42 + math.sin(t * 1.3) * h * 0.04
        balloon(d, bx, by, zoom * w / 700, rot=math.sin(t) * 3, ghost=ghost, shine=0.7)
        if heli:
            helicopter(d, w * 0.82 + math.sin(t * 0.7) * w * 0.05, h * 0.2, w / 1100, 'news', flip=True)
    return f

# =============================================================== house
def house(d, x, y, s=1.0, attic=0.0, child=0.0, curtains=True, lights=0.0, cutaway=0.0, garage_open=0.0):
    c = d.c; t = d.t
    c.save(); c.translate(x, y); c.scale(s, s)
    # chimney
    d.shape(rect(-210, -390, -170, -300), '#A0614D', lw=4)
    # main block
    d.shape(poly([(-290, -255), (-100, -402), (88, -255)]), ROOF, lw=5, hatch=0.45)
    d.shape(rect(-262, -260, 62, 0), SIDING, lw=5, hatch=0.3)
    for yy in range(-235, 0, 26):
        d.line([(-258, yy), (58, yy)], 1.6, SIDING2, 0.7, rough=0.8)
    # windows
    for (wx, wy) in [(-222, -218), (-62, -218), (-222, -122)]:
        win = rect(wx, wy, wx + 74, wy + 66)
        d.shape(win, mixc('#3A3F5C', '#F2D58A', lights), lw=4, hatch=0.2)
        if curtains:
            sw = 6 * math.sin(t * 1.3 + wx)
            d.shape(poly([(wx + 3, wy + 3), (wx + 22 + sw, wy + 3), (wx + 12 + sw * 0.5, wy + 63), (wx + 3, wy + 63)]),
                    '#E7DCC7', lw=2.5, hatch=0.1)
            d.shape(poly([(wx + 71, wy + 3), (wx + 52 + sw, wy + 3), (wx + 62 + sw * 0.5, wy + 63), (wx + 71, wy + 63)]),
                    '#E7DCC7', lw=2.5, hatch=0.1)
        d.line([(wx + 37, wy), (wx + 37, wy + 66)], 2.5, INK, 0.8)
    # door
    d.shape(rect(-70, -128, -10, 0), '#7A4E3A', lw=4)
    d.shape(circle(-20, -62, 4), YELLOW, lw=2)
    # garage block
    d.shape(rect(62, -200, 290, 0), SIDING, lw=5, hatch=0.3)
    for yy in range(-180, 0, 26):
        d.line([(66, yy), (286, yy)], 1.6, SIDING2, 0.7, rough=0.8)
    gable = poly([(44, -196), (176, -318), (308, -196)])
    d.shape(gable, ROOF, lw=5, hatch=0.45)
    gable_wall = poly([(80, -200), (176, -288), (272, -200)])
    d.shape(gable_wall, SIDING, lw=3.5, hatch=0.25)
    # attic window (above garage)
    aw = rect(150, -262, 202, -214)
    d.shape(aw, mixc('#24223A', '#F0C977', attic), lw=4, hatch=0.15)
    if attic > 0:
        d.glow(176, -238, 40, '#F7D58C', 0.35 * attic)
    if child > 0:
        cc = d.c
        cc.save(); cc.clipPath(aw, skia.ClipOp.kIntersect, True)
        p = skia.Paint(Color=hexc('#2A2350', 0.85 * child * d.alpha), AntiAlias=True)
        cc.drawCircle(178, -232, 9, p)
        cc.drawOval(skia.Rect(162, -224, 194, -200), p)
        cc.restore()
    d.line([(176, -262), (176, -214)], 2.2, INK, 0.8); d.line([(150, -238), (202, -238)], 2.2, INK, 0.8)
    # garage door
    gd = rect(88, -150, 264, 0)
    d.shape(gd, '#EFE9DD', lw=4, hatch=0.2)
    for yy in (-112, -75, -38):
        d.line([(90, yy), (262, yy)], 2.2, INK, 0.6)
    if cutaway > 0:
        # cut-away view into the attic above the garage
        cp = poly([(98, -205), (176, -276), (254, -205)])
        c.save(); c.clipPath(cp, skia.ClipOp.kIntersect, True)
        old = d.alpha; d.alpha = old * cutaway
        c.drawPath(cp, skia.Paint(Color=hexc('#6B4F3A', cutaway * old), AntiAlias=True))
        d.glow(176, -230, 60, '#F5CF83', 0.55)
        d.line([(100, -207), (252, -207)], 5, WOOD_D, 1)
        falcon_sit(d, 168, -207, 0.22)
        d.alpha = old
        c.restore()
        c.drawPath(cp, d.stroke_paint(INK, 4, cutaway))
    c.restore()

def tree(d, x, y, s=1.0, sway=0.0):
    c = d.c
    c.save(); c.translate(x, y); c.scale(s, s)
    d.shape(poly([(-14, 0), (-10, -120), (10, -120), (16, 0)]), WOOD, lw=4)
    sw = math.sin(d.t * 1.4 + x) * 5 * (1 + sway)
    pts = [(math.cos(i / 9 * math.tau) * (80 + 12 * (i % 2)) + sw, -190 + math.sin(i / 9 * math.tau) * (72 + 10 * (i % 2)))
           for i in range(9)]
    d.shape(smooth(pts), GRASS_D, lw=4.5, hatch=0.45)
    c.restore()

def ground(d, y, col=GRASS, x0=-200, x1=W + 200, a=1.0):
    d.shape(rect(x0, y, x1, y + 2600), col, lw=0, hatch=0.25, a=a, rough=0)
    d.line([(x0, y), (x1, y)], 4, INK, 0.8 * a)

def grass_blades(d, x0, x1, y, n=60, h=40, col=GRASS_D, seed=1, wind=1.0, a=1.0):
    r = random.Random(seed)
    t = d.t
    for i in range(n):
        xx = lerp(x0, x1, r.random())
        hh = h * r.uniform(0.6, 1.3)
        sw = math.sin(t * 2.2 + xx * 0.02) * 9 * wind + 6 * wind
        d.line([(xx, y), (xx + sw * 0.4, y - hh * 0.5), (xx + sw, y - hh)], r.uniform(2.2, 3.8), col, 0.9 * a, rough=0.5)

# =============================================================== people
def limb(d, pts, w, col, a=1.0):
    d.line(pts, w + 6, INK, a, rough=0.8)
    d.line(pts, w, col, a, rough=0.5)

def person(d, x, y, s=1.0, shirt='#6E86B5', pants='#4A4E6E', hair='#5A3B2A', skin=SKIN, arms=(20, -20),
           mood='neutral', vest=None, look=0.0, walk=0.0, a=1.0, hat=None, flip=False, child=False):
    """Standing figure, feet at (x,y). arms: angles in degrees from straight down (positive = outward)."""
    c = d.c; t = d.t
    c.save(); c.translate(x, y); c.scale(-s if flip else s, s)
    sc = 0.8 if child else 1.0
    hy = -178 if not child else -128
    # legs
    st = math.sin(walk) * 14
    hip = -78 * sc
    limb(d, [(-9, hip), (-11 - st, -38 * sc), (-12 - st * 1.2, -4)], 12, pants, a)
    limb(d, [(9, hip), (11 + st, -38 * sc), (12 + st * 1.2, -4)], 12, pants, a)
    d.line([(-24 - st * 1.2, -2), (-6 - st * 1.2, -2)], 8, INK, a)
    d.line([(6 + st * 1.2, -2), (24 + st * 1.2, -2)], 8, INK, a)
    # torso
    top = hy + 30 if not child else hy + 26
    torso = P()
    torso.moveTo(-26 * sc, top + 6); torso.cubicTo(-30 * sc, top + 30, -24 * sc, hip, -22 * sc, hip + 4)
    torso.lineTo(22 * sc, hip + 4); torso.cubicTo(24 * sc, hip, 30 * sc, top + 30, 26 * sc, top + 6)
    torso.cubicTo(12, top - 4, -12, top - 4, -26 * sc, top + 6); torso.close()
    # arms (behind)
    def arm(side, ang):
        sx = side * 24 * sc
        a1 = math.radians(ang) * side
        L1, L2 = 40 * sc, 36 * sc
        ex = sx + math.sin(a1) * L1; ey = top + 10 + math.cos(a1) * L1
        a2 = a1 + math.radians(15) * side * (1 if ang < 100 else -1)
        hx = ex + math.sin(a2) * L2; hy2 = ey + math.cos(a2) * L2
        limb(d, [(sx, top + 10), (ex, ey), (hx, hy2)], 11, shirt, a)
        d.shape(circle(hx, hy2, 7), skin, lw=3, a=a, hatch=0)
    arm(-1, arms[0]); arm(1, arms[1])
    d.shape(torso, shirt, lw=4.5, a=a)
    if vest:
        c.save(); c.clipPath(torso, skia.ClipOp.kIntersect, True)
        c.drawRect(skia.Rect(-40, top - 10, 40, hip + 6), skia.Paint(Color=hexc(vest, 0.95 * a * d.alpha)))
        c.drawRect(skia.Rect(-40, (top + hip) / 2, 40, (top + hip) / 2 + 7), skia.Paint(Color=hexc('#F4F1E6', 0.95 * a * d.alpha)))
        c.restore()
        c.drawPath(torso, d.stroke_paint(INK, 4.5, a))
    # head
    hr = 24 if not child else 26
    lx = look * 5
    d.shape(circle(0, hy, hr), skin, lw=4, a=a, hatch=0.12)
    hp = P(); hp.moveTo(-hr - 1, hy + 2); hp.cubicTo(-hr - 2, hy - hr - 10, hr + 2, hy - hr - 10, hr + 1, hy + 2)
    hp.cubicTo(hr * 0.5, hy - hr * 0.55, -hr * 0.4, hy - hr * 0.7, -hr - 1, hy + 2); hp.close()
    d.shape(hp, hair, lw=3.5, a=a)
    if hat:
        d.shape(poly([(-hr - 4, hy - hr * 0.55), (hr + 4, hy - hr * 0.55), (hr * 0.8, hy - hr * 1.15), (-hr * 0.8, hy - hr * 1.15)]),
                hat, lw=3.5, a=a)
        d.line([(-hr - 4, hy - hr * 0.55), (hr + 14, hy - hr * 0.5)], 5, INK, a)
    # face
    blink = (int(t * 10 + x) % 37) == 0
    ey = hy + 2
    for ex in (-9 + lx, 9 + lx):
        if blink:
            d.line([(ex - 3, ey), (ex + 3, ey)], 2.5, INK, a)
        else:
            c.drawCircle(ex, ey, 3.2, skia.Paint(Color=hexc(INK, a * d.alpha), AntiAlias=True))
    if mood == 'worried':
        d.line([(-14 + lx, ey - 10), (-5 + lx, ey - 7)], 2.4, INK, a)
        d.line([(14 + lx, ey - 10), (5 + lx, ey - 7)], 2.4, INK, a)
        d.line([(-6 + lx, hy + 14), (0 + lx, hy + 11), (6 + lx, hy + 14)], 2.4, INK, a)
    elif mood == 'confused':
        d.line([(-14 + lx, ey - 9), (-5 + lx, ey - 10)], 2.4, INK, a)
        d.line([(5 + lx, ey - 12), (14 + lx, ey - 8)], 2.4, INK, a)
        d.line([(-5 + lx, hy + 13), (6 + lx, hy + 12)], 2.4, INK, a)
    elif mood == 'calm':
        d.line([(-6 + lx, hy + 11), (0 + lx, hy + 14), (6 + lx, hy + 11)], 2.4, INK, a)
    elif mood == 'o':
        c.drawCircle(lx, hy + 13, 4, skia.Paint(Color=hexc(INK, a * d.alpha), AntiAlias=True))
    else:
        d.line([(-5 + lx, hy + 13), (5 + lx, hy + 13)], 2.4, INK, a)
    c.drawCircle(-15 + lx, hy + 9, 4, skia.Paint(Color=hexc('#E59A8A', 0.35 * a * d.alpha), AntiAlias=True))
    c.drawCircle(15 + lx, hy + 9, 4, skia.Paint(Color=hexc('#E59A8A', 0.35 * a * d.alpha), AntiAlias=True))
    c.restore()

def falcon_sit(d, x, y, s=1.0, a=1.0, look=0.0):
    """Falcon sitting calmly, cross-legged, safe. (x,y) = floor contact."""
    c = d.c; t = d.t
    c.save(); c.translate(x, y); c.scale(s, s)
    breath = math.sin(t * 2.0) * 1.5
    # legs crossed
    limb(d, [(-34, -10), (-6, -2), (26, -8)], 16, '#5A6390', a)
    limb(d, [(34, -10), (6, -2), (-26, -8)], 16, '#4E5784', a)
    d.shape(oval(-34, -6, 10, 7), '#E9E4DA', lw=3, a=a)
    d.shape(oval(34, -6, 10, 7), '#E9E4DA', lw=3, a=a)
    # torso (striped shirt)
    torso = P()
    torso.moveTo(-26, -88 + breath); torso.cubicTo(-30, -60, -28, -30, -24, -14); torso.lineTo(24, -14)
    torso.cubicTo(28, -30, 30, -60, 26, -88 + breath); torso.cubicTo(12, -96, -12, -96, -26, -88 + breath); torso.close()
    d.shape(torso, '#7FA6C9', lw=4.5, a=a)
    c.save(); c.clipPath(torso, skia.ClipOp.kIntersect, True)
    for yy in (-72, -52, -32):
        c.drawRect(skia.Rect(-40, yy, 40, yy + 8), skia.Paint(Color=hexc('#F1ECE0', 0.9 * a * d.alpha)))
    c.restore()
    c.drawPath(torso, d.stroke_paint(INK, 4.5, a))
    # arms resting on knees
    limb(d, [(-24, -80), (-34, -50), (-30, -24)], 11, '#7FA6C9', a)
    limb(d, [(24, -80), (34, -50), (30, -24)], 11, '#7FA6C9', a)
    d.shape(circle(-29, -22, 7), SKIN, lw=3, a=a, hatch=0)
    d.shape(circle(29, -22, 7), SKIN, lw=3, a=a, hatch=0)
    # head
    hy = -122 + breath
    d.shape(circle(0, hy, 30), SKIN, lw=4, a=a, hatch=0.1)
    hp = P(); hp.moveTo(-31, hy - 2); hp.cubicTo(-34, hy - 44, 34, hy - 44, 31, hy - 2)
    hp.cubicTo(18, hy - 18, -10, hy - 24, -31, hy - 2); hp.close()
    d.shape(hp, '#C9894E', lw=3.5, a=a)
    lx = look * 5
    blink = (int(t * 10) % 41) == 0
    for ex in (-10 + lx, 10 + lx):
        if blink:
            d.line([(ex - 3, hy + 4), (ex + 3, hy + 4)], 2.5, INK, a)
        else:
            c.drawCircle(ex, hy + 4, 3.5, skia.Paint(Color=hexc(INK, a * d.alpha), AntiAlias=True))
    d.line([(-7 + lx, hy + 15), (0 + lx, hy + 19), (7 + lx, hy + 15)], 2.6, INK, a)
    c.drawCircle(-17 + lx, hy + 12, 5, skia.Paint(Color=hexc('#E59A8A', 0.4 * a * d.alpha), AntiAlias=True))
    c.drawCircle(17 + lx, hy + 12, 5, skia.Paint(Color=hexc('#E59A8A', 0.4 * a * d.alpha), AntiAlias=True))
    c.restore()

def viewer_backs(d, y, n=7, s=1.0, col='#5A5284', a=0.9, seed=4, lean=0.0):
    r = random.Random(seed)
    for i in range(n):
        x = (i + 0.5) / n * W + r.uniform(-30, 30)
        sc = s * r.uniform(0.85, 1.15)
        bob = math.sin(d.t * 1.5 + i) * 3
        hx = x + lean * 10 * sc
        d.shape(oval(x, y + 120 * sc, 80 * sc, 90 * sc), mixc(col, '#7A6FA0', r.random() * 0.5), lw=4, a=a, hatch=0.3)
        d.shape(circle(hx, y + bob - lean * 12 * sc, 46 * sc), mixc('#6A4B3B', '#3E3450', r.random()), lw=4, a=a, hatch=0.3)

# =============================================================== vehicles
def police_car(d, x, y, s=1.0, flip=False, a=1.0, lights=True, kind='police'):
    c = d.c; t = d.t
    c.save(); c.translate(x, y); c.scale(-s if flip else s, s)
    body = P()
    body.moveTo(-120, -20); body.lineTo(-118, -52); body.lineTo(-70, -58); body.lineTo(-44, -92); body.lineTo(48, -92)
    body.lineTo(78, -58); body.lineTo(118, -52); body.lineTo(122, -20); body.close()
    col = '#F2F0EA' if kind == 'police' else '#EDE6D6'
    d.shape(body, col, lw=5, a=a)
    if kind == 'police':
        c.save(); c.clipPath(body, skia.ClipOp.kIntersect, True)
        c.drawRect(skia.Rect(-130, -58, 130, -34), skia.Paint(Color=hexc(POLICE, a * d.alpha)))
        c.restore()
        c.drawPath(body, d.stroke_paint(INK, 5, a))
    else:
        c.save(); c.clipPath(body, skia.ClipOp.kIntersect, True)
        c.drawRect(skia.Rect(-130, -50, 130, -40), skia.Paint(Color=hexc(RED, a * d.alpha)))
        c.restore()
    d.shape(poly([(-38, -86), (-6, -86), (-6, -60), (-62, -60)]), '#BFDCEB', lw=3, a=a, hatch=0.1)
    d.shape(poly([(4, -86), (42, -86), (66, -60), (4, -60)]), '#BFDCEB', lw=3, a=a, hatch=0.1)
    # wheels
    for wx in (-72, 74):
        d.shape(circle(wx, -18, 22), '#2B2A35', lw=4, a=a)
        d.shape(circle(wx, -18, 9), '#BDBDC5', lw=2.5, a=a)
    if lights:
        on = int(t * 5) % 2
        d.shape(rect(-24, -104, 0, -92), RED if on else '#7A2A2A', lw=3, a=a)
        d.shape(rect(0, -104, 24, -92), '#3A6FD8' if not on else '#1E2E66', lw=3, a=a)
        d.glow(-12 if on else 12, -98, 34, RED if on else '#3A6FD8', 0.45 * a)
    c.restore()

def clock(d, x, y, r, minutes, a=1.0):
    c = d.c
    c.save(); c.translate(x, y)
    d.shape(circle(0, 0, r * 1.08), '#C9B38E', lw=5, a=a)
    d.shape(circle(0, 0, r), CREAM, lw=5, a=a, hatch=0.08)
    for i in range(60):
        ang = i / 60 * math.tau
        L = 0.14 if i % 5 == 0 else 0.06
        w = 5 if i % 5 == 0 else 2.2
        d.line([(math.sin(ang) * r * 0.9, -math.cos(ang) * r * 0.9),
                (math.sin(ang) * r * (0.9 - L), -math.cos(ang) * r * (0.9 - L))], w, INK, a * (1 if i % 5 == 0 else 0.6), rough=0.3)
    # elapsed wedge
    if minutes > 0:
        wedge = P(); wedge.moveTo(0, 0)
        wedge.arcTo(skia.Rect(-r * 0.86, -r * 0.86, r * 0.86, r * 0.86), -90, min(359.9, (minutes % 60) * 6) if minutes < 60 else 359.9, False)
        wedge.close()
        c.drawPath(wedge, skia.Paint(Color=hexc(RED, 0.16 * a * d.alpha), AntiAlias=True))
        if minutes > 60:
            w2 = P(); w2.moveTo(0, 0)
            w2.arcTo(skia.Rect(-r * 0.6, -r * 0.6, r * 0.6, r * 0.6), -90, (minutes - 60) * 6, False); w2.close()
            c.drawPath(w2, skia.Paint(Color=hexc(RED, 0.22 * a * d.alpha), AntiAlias=True))
    ha = math.radians((minutes * 0.5) + 60)
    ma = math.radians(minutes * 6)
    d.line([(0, 0), (math.sin(ha) * r * 0.5, -math.cos(ha) * r * 0.5)], 9, INK, a, rough=0.5)
    d.line([(0, 0), (math.sin(ma) * r * 0.78, -math.cos(ma) * r * 0.78)], 6, RED_D, a, rough=0.5)
    d.shape(circle(0, 0, 10), INK, lw=2, a=a)
    c.restore()

def news_camera(d, x, y, s=1.0, a=1.0, flip=False):
    """Tripod TV camera, (x,y) floor."""
    c = d.c
    c.save(); c.translate(x, y); c.scale(-s if flip else s, s)
    for (fx) in (-50, 0, 50):
        d.line([(0, -150), (fx, 0)], 6, INK, a)
    d.shape(rrect(-70, -215, 60, -150, 14), '#3B3D52', lw=5, a=a)
    d.shape(poly([(60, -205), (110, -220), (110, -145), (60, -160)]), '#2E3044', lw=4.5, a=a)
    d.shape(oval(110, -182, 10, 38), '#8DB3CF', lw=3, a=a)
    d.shape(rrect(-50, -240, 20, -215, 6), '#3B3D52', lw=4, a=a)
    c.drawCircle(-55, -200, 6, skia.Paint(Color=hexc(RED, (0.5 + 0.5 * (math.sin(d.t * 6) > 0)) * a * d.alpha), AntiAlias=True))
    c.restore()

def paper_sheet(d, x, y, w, h, rot=0.0, seed=0, lines=7, a=1.0, col='#FBF7EE', diagram=False):
    c = d.c
    c.save(); c.translate(x, y); c.rotate(rot)
    d.shape(rect(-w / 2, -h / 2, w / 2, h / 2), col, lw=3.5, a=a, hatch=0.06)
    if diagram:
        balloon(d, 0, -h * 0.12, w / 620, ghost=0.0, box=True, shine=0.0)
        for (ax, ay, bx, by) in [(-w * 0.38, -h * 0.3, -w * 0.38, h * 0.05), (-w * 0.35, h * 0.16, w * 0.35, h * 0.16)]:
            d.line([(ax, ay), (bx, by)], 2.2, '#3C5FA8', a)
        d.scribble(-w * 0.35, h * 0.3, w * 0.6, 4, '#3C5FA8', 2.2, 0.8 * a, seed, lines=2, gap=16)
    else:
        d.scribble(-w * 0.38, -h * 0.36, w * 0.76, 5, INK, 2.2, 0.75 * a, seed, lines=lines, gap=h * 0.72 / max(1, lines))
    c.restore()
