from objs import *

# =================================================================== timeline
SENTS = [
    "2009’da herkes bu uçan balonun içinde 6 yaşında bir çocuk olduğunu sandı… çocuk aslında evde saklanıyordu.",
    "Colorado’da yaşayan Heene ailesi, oğulları Falcon’ın ev yapımı helyum balonunun içine girip havalandığını söyledi.",
    "Gümüş renkli balon gökyüzünde sürüklenirken polis, helikopterler ve televizyon kanalları onu takip etmeye başladı.",
    "Yaklaşık 90 dakika boyunca herkes balonun içinde küçük bir çocuk olduğuna inanıyordu.",
    "Balon sonunda bir tarlaya indi.",
    "Ama içinden kimse çıkmadı.",
    "Saatler süren aramanın ardından Falcon, ailesinin evinde garajın üzerindeki tavan arasında saklanırken bulundu.",
    "Olay kısa süre sonra daha da garipleşti ve polis bunun kasıtlı olarak hazırlanmış bir aldatmaca olduğuna karar verdi.",
    "“Balloon Boy” olayı, televizyon çağının en tuhaf canlı yayın vakalarından biri olarak tarihe geçti.",
    "İnanması güç ama bu gerçekten yaşandı.",
]
# narration speech onsets (seconds) measured from the ElevenLabs file
STARTS = [0.0, 9.27, 17.46, 25.95, 32.42, 35.10, 37.84, 46.15, 54.70, 61.59]
ENDS = [8.26, 16.45, 24.94, 31.42, 34.41, 36.82, 45.09, 53.63, 60.75, 64.99]
HILITE = [
    ["6 yaşında bir çocuk", "evde saklanıyordu."],
    ["Falcon’ın", "helyum balonunun"],
    ["polis, helikopterler ve televizyon kanalları"],
    ["90 dakika"],
    ["tarlaya indi."],
    ["kimse çıkmadı."],
    ["tavan arasında saklanırken bulundu."],
    ["aldatmaca"],
    ["“Balloon Boy”"],
    [],
]
DURATION = 68.0

# scene boundaries
SB = [0.0, 9.0, 17.2, 25.7, 32.2, 34.9, 37.6, 45.9, 54.4, 61.3, DURATION]

# =================================================================== helpers
def cam(d, cx, cy, z, rot=0.0):
    c = d.c
    c.save()
    c.translate(W / 2, H / 2)
    c.scale(z, z)
    if rot:
        c.rotate(rot)
    c.translate(-cx, -cy)

def uncam(d):
    d.c.restore()

def sky(d, top='#8FB2C8', bot='#D3E2E8', y0=-400, y1=H + 400):
    d.gradient_rect(skia.Rect(-2000, y0, W + 2000, y1), [top, bot])
    m = skia.Matrix(); m.setScale(1.6, 1.6)
    hp = skia.Paint(Shader=HATCH.makeShader(skia.TileMode.kRepeat, skia.TileMode.kRepeat, skia.SamplingOptions(), m))
    hp.setAlphaf(0.05 * d.alpha)
    d.c.drawRect(skia.Rect(-2000, y0, W + 2000, y1), hp)

def drifting_clouds(d, t, y_list, speed=18, s=1.0, a=0.95):
    for i, (bx, by, sc) in enumerate(y_list):
        x = (bx + t * speed * (0.6 + 0.2 * i)) % (W + 600) - 300
        cloud(d, x, by, sc * s, a)

def wind_lines(d, t, n=6, y0=500, y1=1500, a=0.5, seed=2, speed=420):
    r = random.Random(seed)
    for i in range(n):
        yy = r.uniform(y0, y1)
        ph = r.random()
        x = ((t * speed + ph * 1600) % 1700) - 300
        L = r.uniform(90, 200)
        pts = [(x + k * L / 6, yy + math.sin(k * 0.9 + t * 3) * 6) for k in range(7)]
        d.line(pts, 3, '#FFFFFF', a, rough=0.6)

def with_alpha(d, a, fn, *args, **kw):
    if a <= 0.001:
        return
    if a >= 0.999:
        fn(*args, **kw)
        return
    d.c.saveLayerAlpha(None, int(255 * a))
    fn(*args, **kw)
    d.c.restore()

def iris(d, k, cx, cy, fn, maxr=2300, ring=True):
    if k <= 0:
        return
    r = max(1.0, eio(k) * maxr)
    c = d.c
    pth = circle(cx, cy, r)
    c.save()
    c.clipPath(pth, skia.ClipOp.kIntersect, True)
    fn()
    c.restore()
    if ring and k < 0.98:
        c.drawPath(pth, d.stroke_paint(INK, 7, 1.0, rough=2.0))

def rect_iris(d, k, r0, fn, rad0=20, ring=True):
    if k <= 0:
        return
    e = eio(k)
    x0 = lerp(r0[0], -20, e); y0 = lerp(r0[1], -20, e); x1 = lerp(r0[2], W + 20, e); y1 = lerp(r0[3], H + 20, e)
    pth = rrect(x0, y0, x1, y1, rad0 * (1 - e))
    c = d.c
    c.save(); c.clipPath(pth, skia.ClipOp.kIntersect, True)
    fn()
    c.restore()
    if ring and k < 0.98:
        c.drawPath(pth, d.stroke_paint(INK, 7, 1.0))

def string_line(d, a, b, k=1.0, sag=30, col=RED, w=3.2):
    if k <= 0:
        return
    pts = []
    for i in range(16):
        u = i / 15 * k
        x = lerp(a[0], b[0], u); y = lerp(a[1], b[1], u) + math.sin(u * math.pi) * sag
        pts.append((x, y))
    d.line(pts, w, col, 0.95, rough=0.7)

def pin(d, x, y, col=RED):
    d.shape(circle(x, y, 11), col, lw=3, hatch=0.1)
    d.c.drawCircle(x - 3, y - 3, 3, skia.Paint(Color=hexc('#FFFFFF', 0.8 * d.alpha), AntiAlias=True))

def photo(d, x, y, w, h, rot, content, a=1.0, pin_col=RED, border=16):
    """Polaroid-style photo centred at x,y; content(d, w, h) in local coords."""
    c = d.c
    c.save(); c.translate(x, y); c.rotate(rot)
    sh = skia.Paint(Color=hexc('#2A1E10', 0.25 * a * d.alpha), AntiAlias=True,
                    MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 10))
    c.drawRect(skia.Rect(-w / 2 - border + 8, -h / 2 - border + 12, w / 2 + border + 8, h / 2 + border * 2.6 + 12), sh)
    d.shape(rect(-w / 2 - border, -h / 2 - border, w / 2 + border, h / 2 + border * 2.6), '#FBF8F0', lw=3.5, a=a, hatch=0.05)
    c.save(); c.translate(-w / 2, -h / 2)
    c.clipRect(skia.Rect(0, 0, w, h), skia.ClipOp.kIntersect, True)
    old = d.alpha; d.alpha = old * a
    content(d, w, h)
    d.alpha = old
    c.restore()
    c.drawRect(skia.Rect(-w / 2, -h / 2, w / 2, h / 2), d.stroke_paint(INK, 3, a))
    if pin_col:
        pin(d, 0, -h / 2 - border * 0.4, pin_col)
    c.restore()

def sub(d, w, h, fn, base_w=W, base_h=H, cx=None, cy=None, z=None):
    """Draw a full-frame scene fn(d) scaled into a w×h box (local origin)."""
    c = d.c
    if z is None:
        z = max(w / base_w, h / base_h)
    if cx is None:
        cx = base_w / 2
    if cy is None:
        cy = base_h / 2
    c.save()
    c.translate(w / 2, h / 2); c.scale(z, z); c.translate(-cx, -cy)
    fn(d)
    c.restore()

# =================================================================== S1 hook
S1_CLOUDS = [(100, 330, 1.1), (700, 520, 0.8), (380, 980, 0.9), (900, 1150, 0.7)]

def s1_world(d, lt, k):
    t = d.t
    sky(d, '#8DB0C7', '#D6E4E9', -1200, 2600)
    drifting_clouds(d, t, S1_CLOUDS, 16)
    cloud(d, (t * 10) % 1500 - 300, 1650, 0.9, 0.9)
    cloud(d, (600 + t * 12) % 1500 - 300, 1900, 1.1, 0.9)
    if k > 0:
        hills = smooth([(-700, 2330), (0, 2270), (500, 2300), (1100, 2260), (1800, 2320), (1800, 3300), (-700, 3300)])
        d.shape(hills, '#B8C88A', lw=4, hatch=0.25)
        for hx, hs in [(-200, 0.7), (1290, 0.7)]:
            house(d, hx, 2360, hs, curtains=False)
        ground(d, 2350, GRASS, -900, 2000)
        for fx in range(-500, 1700, 46):
            if 150 < fx < 990:
                continue
            d.line([(fx, 2350), (fx, 2300)], 5, '#F1EADB', 1.0)
        d.line([(-500, 2322), (150, 2322)], 4, '#E4DCCB'); d.line([(990, 2322), (1700, 2322)], 4, '#E4DCCB')
        tree(d, 70, 2352, 0.95)
        tree(d, 1040, 2352, 0.85)
        house(d, 560, 2350, 1.3, attic=0.0, child=ease(prog(lt, 6.4, 7.0)))
        kc = prog(lt, 7.0, 7.7)
        if kc > 0:
            ax, ay = 560 + 176 * 1.3, 2350 - 238 * 1.3
            pts = []
            for i in range(int(40 * kc) + 2):
                ang = i / 36 * math.tau - 1.2
                pts.append((ax + math.cos(ang) * 74, ay + math.sin(ang) * 64))
            d.line(pts, 6, RED, 0.9, rough=1.2)
    hx = 870 + 70 * math.sin(t * 0.8)
    hy = lerp(560, 1010, k) + 30 * math.sin(t * 1.1)
    helicopter(d, hx, hy, 0.92 + 0.08 * math.sin(t * 0.8), 'police', flip=True)
    nx = lerp(-260, 190, eout(prog(lt, 0.6, 2.6))) + 30 * math.sin(t * 0.9)
    helicopter(d, nx, lerp(660, 1120, k) + 20 * math.sin(t * 1.4), 0.66, 'news', flip=False, tilt=-8)
    bx = 540 + 26 * math.sin(t * 0.7)
    by = lerp(930, 1160, k) + 18 * math.sin(t * 1.1)
    balloon(d, bx, by, 1.45, rot=3 * math.sin(t * 0.9), ghost=1.0 - 0.3 * k)
    return bx, by

def s1_tvs(d, lt):
    t = d.t
    k_out = ein(prog(lt, 5.6, 6.6))
    if k_out >= 1:
        return
    a = 1 - k_out
    dy = k_out * 700
    d.c.save(); d.c.translate(0, dy)
    pop = [back(prog(lt, 0.0 + i * 0.25, 0.45 + i * 0.25)) for i in range(3)]
    # belief dots from TVs to balloon
    for i, (sx, sy) in enumerate([(205, 1330), (540, 1290), (880, 1340)]):
        k = prog(lt, 0.2 + i * 0.2, 1.2 + i * 0.2)
        for j in range(4):
            u = (j + 1) / 5
            if k < u:
                continue
            px = lerp(sx, 540, u); py = lerp(sy, 1080 - dy, u)
            d.shape(circle(px, py, 9 + 4 * j), CREAM, lw=3.5, a=a * 0.95, hatch=0)
    specs = [(40, 1360, 330, 230, -5, 'crt', 0.0), (330, 1320, 420, 290, 0, 'flat', 0.7), (720, 1370, 320, 225, 5, 'crt', 1.3)]
    for i, (x, y, w, h, rot, st, ph) in enumerate(specs):
        s = pop[i] if i != 1 else max(pop[i], 1.0 if lt > 0 else 0)
        if i == 1:
            s = 1.0  # centre TV present on frame one
        if s <= 0:
            continue
        d.c.save(); d.c.translate(x + w / 2, y + h / 2); d.c.rotate(rot); d.c.scale(s, s); d.c.translate(-w / 2, -h / 2)
        tv(d, 0, 0, w, h, tv_balloon_content(ph, heli=True, ghost=1.0), style=st, a=a, seed=i)
        d.c.restore()
    # viewers in front of the TVs
    if a > 0:
        viewer_backs(d, 1760, 6, 0.75, a=a * 0.95, lean=0.6)
    d.c.restore()

def scene1(d, lt):
    k = eio(prog(lt, 5.7, 7.3))
    z = lerp(1.0 + 0.03 * lt / 6, 0.9, k)
    cy = lerp(960, 1417, k)
    cam(d, 540, cy, z)
    s1_world(d, lt, k)
    uncam(d)
    s1_tvs(d, lt)

# =================================================================== S2 family report
def scene2(d, lt):
    t = d.t
    z = lerp(0.95, 1.0, lt / 8)
    pan = -380 * eio(prog(lt, 6.8, 8.6))
    m = eio(prog(lt, 0.0, 1.4))   # match S1's final house framing, then pull back
    cam(d, lerp(286, 540, m), lerp(764, 960 + pan, m), lerp(1.27, z, m))
    sky(d, '#93B5CA', '#D9E6EA', -1000, 1600)
    drifting_clouds(d, t, [(50, 420, 0.9), (650, 700, 0.8), (300, 160, 0.7)], 14)
    tree(d, 980, 1430, 1.1)
    ground(d, 1420, GRASS, -400, 1500)
    # neighbour fence + yard
    for fx in range(560, 1200, 44):
        d.line([(fx, 1420), (fx, 1350)], 5, '#F1EADB')
    d.line([(560, 1372), (1200, 1372)], 4, '#E4DCCB'); d.line([(560, 1395), (1200, 1395)], 4, '#E4DCCB')
    house(d, 300, 1425, 0.92, curtains=True)
    # tether stake + rope
    d.shape(poly([(792, 1470), (802, 1470), (797, 1500)]), WOOD_D, lw=3)
    lift = eio(prog(lt, 0.7, 6.5))
    bx = lerp(800, 860, lift) + 20 * math.sin(t * 1.2) * lift
    by = lerp(1330, 520, lift)
    bs = lerp(0.62, 0.42, lift)
    if lift < 0.12:
        d.line([(797, 1470), (bx, by + 110 * bs)], 3, '#8A6240')
    else:
        # snapped loose rope on the empty yard
        d.line([(797, 1470), (830, 1480), (870, 1472), (900, 1484)], 3, '#8A6240')
        d.line([(bx, by + 110 * bs), (bx - 10, by + 170 * bs + 10 * math.sin(t * 3)), (bx + 5, by + 230 * bs)], 2.5, '#8A6240')
    balloon(d, bx, by, bs, rot=4 * math.sin(t * 1.3) * lift, ghost=0.0)
    # family (worried)
    fam = eout(prog(lt, 1.4, 2.6))
    if fam > 0:
        off = (1 - fam) * 120
        person(d, 600 - off, 1720, 1.3, shirt='#7D5BA6', pants='#3E4566', hair='#3B2A22', mood='worried',
               arms=(165, 25), look=0.5)
        person(d, 770 - off, 1735, 1.25, shirt='#C66A4E', pants='#4A4E6E', hair='#7A4A2A', mood='worried',
               arms=(20, 160), look=0.6)
        person(d, 920 - off, 1745, 0.95, shirt='#6FA36F', pants='#3E4566', hair='#C9894E', mood='worried',
               arms=(15, 150), look=0.4, child=True)
    # belief bubble: Falcon supposedly in the balloon (imagined, not real)
    kb = prog(lt, 2.6, 4.0)
    if kb > 0:
        def bubble_content(dd, x, y, r, a):
            dd.c.save(); dd.c.translate(x, y + 10)
            sc = r / 215
            balloon(dd, 0, 0, sc, box=True, ghost=0, shine=0.6)
            imagined_child(dd, 0, -45 * sc, sc * 1.05, a)
            dd.c.restore()
        thought_bubble(d, 640, 1470, 330, 960, 205, 1.0, bubble_content, t, kb)
    # search begins: police car arrives
    kp = eout(prog(lt, 5.3, 6.8))
    if kp > 0:
        police_car(d, lerp(-300, 180, kp), 1700, 0.95)
        if kp > 0.9:
            person(d, 330, 1710, 0.95, shirt=POLICE, pants='#2B2F45', hair='#2A2020', hat=POLICE, arms=(30, 100),
                   mood='neutral', look=0.8)
    uncam(d)

# =================================================================== S3 live chase
def s3_country(d, lt):
    t = d.t
    sky(d, '#8FB1C6', '#DCE7E6', -200, 1400)
    drifting_clouds(d, t, [(0, 380, 0.9), (500, 620, 0.7), (900, 300, 0.6)], 30)
    h1 = smooth([(-200, 1180), (200, 1120), (600, 1170), (1000, 1110), (1300, 1160), (1300, 2100), (-200, 2100)])
    d.shape(h1, '#B4C483', lw=4, hatch=0.25)
    h2 = smooth([(-200, 1330), (300, 1270), (800, 1320), (1300, 1260), (1300, 2100), (-200, 2100)])
    d.shape(h2, FIELD, lw=4, hatch=0.3)
    for i in range(6):
        d.line([(-100 + i * 260, 1500), (200 + i * 200, 1900)], 2.5, FIELD_D, 0.5)
    road = smooth([(-200, 1560), (300, 1540), (700, 1580), (1300, 1550), (1300, 1640), (700, 1670), (300, 1630), (-200, 1650)])
    d.shape(road, '#9A9486', lw=4, hatch=0.2)
    for i in range(8):
        xx = (i * 180 - t * 120) % 1500 - 200
        d.line([(xx, 1600), (xx + 60, 1600)], 4, '#F3EBDC', 0.9)
    # farmhouse far
    house(d, 900, 1190, 0.22, curtains=False)
    # balloon drifting
    bx = 260 + lt * 120
    by = 760 + 20 * math.sin(t * 1.4)
    balloon(d, bx, by, 0.82, rot=4 * math.sin(t), ghost=0.0)
    # chasers
    for i, ox in enumerate((0, -280)):
        police_car(d, 180 + lt * 200 + ox + 80 * i, 1612 + i * 6, 0.8)
    helicopter(d, bx + 280 + 60 * math.sin(t * 1.3), 560 + 40 * math.cos(t * 1.3), 0.7, 'police', flip=True)
    helicopter(d, bx - 330 + 40 * math.sin(t), 520, 0.5, 'news', tilt=-10)
    wind_lines(d, t, 5, 560, 1100, 0.6)
    return bx, by

def s3_living(d, lt):
    t = d.t
    d.c.drawRect(skia.Rect(0, 0, W, H), skia.Paint(Color=hexc('#E9DCC2', d.alpha)))
    for x in range(0, W, 90):
        d.line([(x + 20, 0), (x + 20, H)], 10, '#E0CFAF', 0.6, rough=0.6)
    # window with curtains
    d.shape(rect(760, 560, 1010, 860), '#BCD5E2', lw=5)
    sw = 10 * math.sin(t * 1.2)
    d.shape(poly([(750, 540), (820 + sw, 540), (800 + sw, 880), (750, 880)]), '#C46B54', lw=4)
    d.shape(poly([(1020, 540), (950 + sw, 540), (970 + sw, 880), (1020, 880)]), '#C46B54', lw=4)
    # lamp
    d.line([(150, 640), (150, 1150)], 6, INK)
    d.shape(poly([(90, 640), (210, 640), (180, 540), (120, 540)]), '#EBC77D', lw=4)
    d.glow(150, 620, 120, '#F7DC9A', 0.35)
    # cabinet + TV
    d.shape(rect(160, 1240, 920, 1330), WOOD, lw=5)
    tv(d, 230, 760, 620, 430, tv_balloon_content(0.3, True, 1.0), style='crt', seed=4)
    # family on couch (backs)
    d.shape(rrect(-40, 1480, 1120, 1760, 50), '#7D6E9E', lw=5)
    viewer_backs(d, 1470, 4, 1.25, a=1.0, seed=9, lean=0.8)
    d.shape(rrect(-60, 1700, 1140, 2000, 40), '#6A5C8A', lw=5)

def s3_cockpit(d, lt):
    t = d.t
    sky(d, '#86A9C0', '#D6E3E6')
    drifting_clouds(d, t * 3, [(0, 700, 1.3), (700, 1200, 1.0), (300, 1500, 1.2)], 60)
    bx = 560 + 40 * math.sin(t * 1.5)
    by = 900 + 30 * math.sin(t * 1.1)
    balloon(d, bx, by, 1.05, rot=5 * math.sin(t), ghost=0.0)
    # rotor shadow flicker
    if int(t * 14) % 2 == 0:
        d.c.drawRect(skia.Rect(0, 0, W, H), skia.Paint(Color=hexc('#1E2238', 0.07 * d.alpha)))
    # cockpit frame
    win = rrect(70, 520, 1010, 1430, 160)
    d.c.save(); d.c.clipPath(win, skia.ClipOp.kDifference, True)
    d.fill_rect_tex(skia.Rect(-60, -60, W + 60, H + 60), '#3A3E55', 1.0, s=0.3, hatch=0.3)
    d.c.restore()
    d.line([(540, 520), (540, 1430)], 14, '#3A3E55', 1.0)
    d.c.drawPath(win, d.stroke_paint(INK, 7))
    # dashboard
    d.shape(rrect(40, 1480, 1040, 1900, 40), '#2E3247', lw=5)
    for i, gx in enumerate((200, 380, 700, 880)):
        d.shape(circle(gx, 1620, 62), '#E8E2D2', lw=4)
        ang = math.radians(-60 + 120 * (0.5 + 0.4 * math.sin(t * (1.3 + i * 0.4))))
        d.line([(gx, 1620), (gx + math.sin(ang) * 48, 1620 - math.cos(ang) * 48)], 4, RED)
    d.c.drawCircle(540, 1600, 14, skia.Paint(Color=hexc(RED, (0.5 + 0.5 * (math.sin(t * 7) > 0)) * d.alpha), AntiAlias=True))

def s3_street(d, lt):
    t = d.t
    sky(d, '#8FB1C6', '#DCE7E6', -200, 1400)
    drifting_clouds(d, t, [(100, 500, 0.8), (700, 340, 0.7)], 18)
    bx = 700 + 30 * math.sin(t * 0.8)
    by = 700 + 15 * math.sin(t * 1.3)
    balloon(d, bx, by, 0.6, rot=4 * math.sin(t), ghost=0.0)
    helicopter(d, bx - 260, 600 + 20 * math.sin(t * 2), 0.45, 'police')
    # street + houses
    for hx in (-60, 400, 860):
        house(d, hx, 1380, 0.55, curtains=False)
    d.shape(rect(-100, 1380, 1200, 2000), '#A8A396', lw=4, hatch=0.2)
    d.shape(rect(-100, 1380, 1200, 1440), '#D9D2C3', lw=3)
    # people stopping and pointing
    person(d, 380, 1760, 1.0, shirt='#5D8A9E', mood='o', arms=(20, 160), look=0.9)
    person(d, 520, 1790, 1.05, shirt='#B65C70', hair='#2A1E1A', mood='o', arms=(150, 20), look=0.7, flip=True)
    person(d, 640, 1750, 0.95, shirt='#D9A441', hair='#6A4A2A', mood='neutral', arms=(15, 120), look=0.8)
    # news camera operator
    news_camera(d, 170, 1840, 1.25, flip=False)
    person(d, 60, 1850, 1.15, shirt='#3E5C8A', mood='neutral', arms=(95, 60), look=1.0)

def s3_lens(d, k):
    # big camera lens with balloon reflection
    c = d.c
    c.drawRect(skia.Rect(0, 0, W, H), skia.Paint(Color=hexc('#2B2D40', d.alpha)))
    for i, (r, col) in enumerate([(520, '#3B3D52'), (430, '#1F2133'), (360, '#2C4A66'), (250, '#1A2A3E')]):
        d.shape(circle(540, 1080, r), col, lw=6, hatch=0.2)
    c.save(); c.clipPath(circle(540, 1080, 250), skia.ClipOp.kIntersect, True)
    c.translate(540, 1080); c.scale(-0.45, 0.45); c.translate(-540, -960)
    sky(d, '#6E8FA8', '#AFC5D2', 0, 1920)
    balloon(d, 540 + 60 * math.sin(d.t), 900, 1.3, ghost=0)
    c.restore()
    d.c.drawPath(oval(420, 960, 70, 40), skia.Paint(Color=hexc('#FFFFFF', 0.25 * d.alpha), AntiAlias=True))

def scene3(d, lt):
    t = d.t
    # a) countryside chase 0-2.4, b) living room 2.2-4.5, c) cockpit 4.3-6.5, d) street 6.3-8.5
    if lt < 2.6:
        cam(d, 540 + lt * 10, 960, 1.0 + lt * 0.02)
        bx, by = s3_country(d, lt)
        uncam(d)
        k = prog(lt, 2.05, 2.6)
        # balloon reflection -> TV screen
        iris(d, k, bx - 95 * 0.82, by - 110 * 0.82, lambda: s3_living(d, lt), maxr=2300)
        return
    if lt < 4.7:
        z = 1.0 + 0.18 * eio(prog(lt, 3.7, 4.7))
        cam(d, 540, 975, z)
        s3_living(d, lt)
        uncam(d)
        k = prog(lt, 4.15, 4.7)
        # zoom into TV screen -> helicopter window
        x0 = (230 - 540) * z + 540; y0 = (760 - 975) * z + 960
        x1 = (850 - 540) * z + 540; y1 = (1190 - 975) * z + 960
        rect_iris(d, k, (x0, y0, x1, y1), lambda: s3_cockpit(d, lt), 26)
        return
    if lt < 6.6:
        cam(d, 540, 960, 1.0 + 0.04 * math.sin(t * 2))
        s3_cockpit(d, lt)
        uncam(d)
        k = prog(lt, 6.05, 6.6)
        iris(d, k, 540, 960, lambda: s3_street(d, lt))
        return
    z = 1.0 + 1.2 * ein(prog(lt, 7.4, 8.5))
    cam(d, lerp(540, 300, ein(prog(lt, 7.4, 8.5))), lerp(960, 1650, ein(prog(lt, 7.4, 8.5))), z)
    s3_street(d, lt)
    uncam(d)
    # camera lens fills: lens -> clock
    k = prog(lt, 7.7, 8.5)
    with_alpha(d, ease(k), s3_lens, d, k)

# =================================================================== S4 90 minutes
TV_POS = [(40, 800, -6), (800, 790, 5), (30, 1150, 4), (810, 1150, -4), (200, 1400, -3), (640, 1405, 4)]

def scene4(d, lt):
    t = d.t
    sky(d, '#8EB0C5', '#D5E2E6')
    # balloon travelling along a dotted path
    k = prog(lt, 0.0, 6.5)
    bx = lerp(-80, 1120, k)
    by = 690 + 40 * math.sin(k * 5)
    for i in range(30):
        u = i / 30 * k
        px = lerp(-80, 1120, u); py = 690 + 40 * math.sin(u * 5) + 60
        if px < bx - 150:
            d.c.drawCircle(px, py, 4, skia.Paint(Color=hexc('#FFFFFF', 0.85 * d.alpha), AntiAlias=True))
    drifting_clouds(d, t, [(200, 900, 0.6), (800, 1000, 0.5)], 40)
    helicopter(d, bx - 280, 600 + 20 * math.sin(t * 2), 0.5, 'police')
    helicopter(d, bx - 470, 760 + 20 * math.cos(t * 2), 0.42, 'news')
    if prog(lt, 1.5, 2.5) > 0:
        helicopter(d, bx + 250 - 80 * (1 - eout(prog(lt, 1.5, 2.5))), 520, 0.38, 'police', flip=True)
    balloon(d, bx, by, 0.62, rot=4 * math.sin(t), ghost=1.0)
    # ground with emergency teams
    d.shape(smooth([(-200, 1500), (500, 1470), (1300, 1500), (1300, 2100), (-200, 2100)]), '#B4C483', lw=4, hatch=0.25)
    for i in range(3):
        police_car(d, -150 + lt * 190 + i * 260, 1640 + i * 4, 0.55)
    # TVs multiplying
    for i, (x, y, rot) in enumerate(TV_POS):
        s = back(prog(lt, 0.6 + i * 0.55, 1.0 + i * 0.55))
        if s <= 0:
            continue
        w, h = 240, 165
        d.c.save(); d.c.translate(x + w / 2, y + h / 2); d.c.rotate(rot); d.c.scale(s, s); d.c.translate(-w / 2, -h / 2)
        tv(d, 0, 0, w, h, tv_balloon_content(i * 0.4, False, 1.0), style='crt' if i % 2 else 'flat', seed=i + 10)
        d.c.restore()
    # the clock: 90 minutes pass
    kz = eio(prog(lt, 0.0, 1.2))
    r = lerp(250, 175, kz)
    cx, cy = 540, lerp(1080, 1010, kz)
    mins = 90 * eio(prog(lt, 0.3, 6.0))
    clock(d, cx, cy, r, mins)
    # viewers leaning in
    viewer_backs(d, 1740, 7, 0.78, a=1.0, seed=12, lean=prog(lt, 0, 6))

# =================================================================== S5 landing
def s5_field(d, lt, land_k, squash, rescue_k, heli=True):
    t = d.t
    sky(d, '#93B3C6', '#E2E7DF', -400, 1200)
    drifting_clouds(d, t, [(0, 420, 0.8), (600, 640, 0.6)], 14)
    d.shape(smooth([(-300, 1060), (300, 1030), (800, 1050), (1400, 1020), (1400, 2200), (-300, 2200)]), FIELD, lw=4, hatch=0.32)
    for i in range(-6, 14):
        d.line([(540 + i * 30, 1050), (540 + i * 190, 2100)], 2.5, FIELD_D, 0.55)
    house(d, 140, 1048, 0.16, curtains=False)
    tree(d, 260, 1050, 0.3)
    if heli:
        helicopter(d, 760 + 120 * math.sin(t * 0.7), 520 + 30 * math.cos(t * 0.7), 0.42, 'police', flip=math.cos(t * 0.7) > 0)
    bx = lerp(520, 560, land_k) + 25 * math.sin(t * 1.2) * (1 - land_k)
    by = lerp(560, 1200, land_k)
    balloon(d, bx, by, lerp(0.75, 0.9, land_k), rot=6 * math.sin(t * 1.4) * (1 - land_k), squash=squash, ghost=0.0)
    # rescuers + vehicles approaching
    if rescue_k > 0:
        police_car(d, lerp(-150, 140, rescue_k), 1150, 0.42)
        police_car(d, lerp(1250, 960, rescue_k), 1160, 0.42, flip=True, kind='ambulance')
        for i, (sx, ex, yy, col) in enumerate([(-80, 330, 1330, ORANGE), (1150, 790, 1345, YELLOW), (-160, 220, 1380, ORANGE)]):
            person(d, lerp(sx, ex, rescue_k), yy, 0.55, shirt='#4A5A7E', vest=col, mood='neutral', walk=t * 9 + i,
                   arms=(30 + 20 * math.sin(t * 9 + i), 30 - 20 * math.sin(t * 9 + i)), flip=i == 1, hat=None)
    grass_blades(d, -50, 1130, 1960, 90, 120, GRASS_D, 3, wind=1.3)
    grass_blades(d, -50, 1130, 1900, 50, 80, '#8EA65A', 4, wind=1.1)
    wind_lines(d, t, 4, 700, 1300, 0.45, seed=5, speed=300)

def scene5(d, lt):
    land = eio(prog(lt, 0.0, 2.05))
    sq = 0.0
    if lt > 2.0:
        u = lt - 2.0
        sq = 0.5 * math.exp(-u * 4) * math.cos(u * 14) + 0.18 * min(1, u * 4)
    z = 1.0 + 0.07 * lt / 2.7
    mm = eio(prog(lt, 2.25, 2.85))  # push in to match S6's close framing
    cam(d, lerp(540, 560, mm), lerp(960 + 40 * lt / 2.7, 1200, mm), lerp(z, 1.72, mm))
    s5_field(d, lt, land, max(0, sq), eout(prog(lt, 0.3, 2.7)))
    uncam(d)

# =================================================================== S6 empty
def scene6(d, lt):
    t = d.t
    open_k = eout(prog(lt, 0.80, 1.05))
    near = eio(prog(lt, 0.15, 0.85))
    push = ein(prog(lt, 1.85, 2.7))
    tx, ty = 540, 1000 + 84 * 1.55
    z0 = lerp(1.0, 1.85, near)
    z = lerp(z0, 9.0, push)
    cam(d, lerp(540, tx, push), lerp(lerp(1000, 1190, near), ty, push), z)
    sky(d, '#93B3C6', '#E2E7DF', -400, 1100)
    drifting_clouds(d, t, [(0, 600, 0.7)], 12)
    d.shape(smooth([(-300, 950), (500, 930), (1400, 960), (1400, 2400), (-300, 2400)]), FIELD, lw=4, hatch=0.32)
    for i in range(-6, 14):
        d.line([(540 + i * 40, 950), (540 + i * 220, 2200)], 2.5, FIELD_D, 0.5)
    helicopter(d, 860 + 60 * math.sin(t * 0.8), 700, 0.35, 'police', flip=True)
    balloon(d, 540, 1000, 1.55, rot=0, squash=0.18, open_=open_k, empty_glow=open_k)
    # flashlight beam into the EMPTY compartment
    ap = eout(prog(lt, 0.0, 0.75))
    if open_k > 0:
        hx = lerp(-100, 330, ap) + 60
        beam = poly([(hx, 1440), (hx + 10, 1415), (510, 1130), (520, 1200)])
        d.c.drawPath(beam, skia.Paint(Color=hexc('#FFF2BF', 0.38 * open_k * d.alpha), AntiAlias=True,
                                      MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 6)))
        d.glow(540, 1160, 40, '#FFF2BF', 0.35 * open_k)
    mood = 'confused' if lt > 1.05 else 'neutral'
    person(d, lerp(-100, 330, ap), 1650, 1.35, shirt='#4A5A7E', vest=ORANGE, mood=mood, arms=(70, 30), look=1.0,
           walk=(1 - ap) * t * 9)
    person(d, lerp(1180, 750, ap), 1660, 1.35, shirt='#4A5A7E', vest=YELLOW, mood=mood, arms=(25, 55), look=-1.0,
           walk=(1 - ap) * t * 9, flip=True)
    if lt > 1.1:
        f = font('kalamb', 70)
        for i, (qx, qy) in enumerate([(330, 1340), (750, 1350)]):
            k = back(prog(lt, 1.1 + i * 0.12, 1.4 + i * 0.12))
            d.c.save(); d.c.translate(qx, qy - 20 * k); d.c.scale(k, k)
            d.text('?', 0, 0, f, RED, 1.0, align='center', stroke=CREAM, sw=10)
            d.c.restore()
    grass_blades(d, -50, 1130, 1960, 70, 110, GRASS_D, 7, wind=0.9)
    uncam(d)
    if push > 0.6:
        d.c.drawRect(skia.Rect(0, 0, W, H), skia.Paint(Color=hexc('#1E1B2E', clamp((push - 0.6) / 0.35) * d.alpha)))

# =================================================================== S7 attic reveal
DUST = [(random.Random(i).uniform(0, 1), random.Random(i * 3 + 1).uniform(0, 1), random.Random(i * 7 + 2).uniform(2, 5))
        for i in range(60)]

def attic_interior(d, light=1.0, falcon=True):
    t = d.t
    c = d.c
    c.drawRect(skia.Rect(-600, -600, W + 600, H + 600), skia.Paint(Color=hexc('#4A3528', d.alpha)))
    # back wall gable
    d.shape(poly([(-200, 1560), (540, 520), (1280, 1560)]), '#8A6A4E', lw=5, hatch=0.35)
    for i in range(-6, 7):
        d.line([(540 + i * 4, 540), (540 + i * 150, 1560)], 3, '#6E5039', 0.5)
    # rafters
    for i in range(5):
        y = 760 + i * 190
        xo = (y - 520) / 1040 * 740
        d.line([(540 - xo, y), (540 + xo, y)], 9, '#5C4130', 0.8)
    # small window and light beam
    d.shape(rect(470, 820, 610, 940), mixc('#2A2840', '#F6DFA0', light), lw=5)
    d.line([(540, 820), (540, 940)], 4, INK); d.line([(470, 880), (610, 880)], 4, INK)
    beam = poly([(470, 830), (610, 830), (980, 1700), (420, 1700)])
    c.drawPath(beam, skia.Paint(Color=hexc('#FBE6A8', 0.22 * light * d.alpha), AntiAlias=True,
                                MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 14)))
    # floor
    d.shape(rect(-300, 1560, W + 300, H + 400), '#9C7650', lw=5, hatch=0.3)
    for i in range(8):
        d.line([(-300, 1600 + i * 60), (W + 300, 1600 + i * 60)], 2.5, '#6E5039', 0.6)
    # boxes
    d.shape(rect(80, 1300, 330, 1580), '#C9A877', lw=5)
    d.line([(80, 1360), (330, 1360)], 3, WOOD_D, 0.7)
    d.shape(rect(120, 1130, 300, 1300), '#D4B688', lw=5)
    d.line([(210, 1130), (210, 1180)], 6, '#E9DBBF', 0.8)
    d.shape(rect(820, 1380, 1010, 1580), '#BFA070', lw=5)
    # old blanket
    d.shape(smooth([(380, 1580), (520, 1560), (800, 1570), (860, 1600), (360, 1610)]), '#7C93B8', lw=4)
    if falcon:
        falcon_sit(d, 620, 1590, 1.7, look=0.3)
    # dust motes
    for (u, v, r) in DUST:
        x = 430 + u * 520 + math.sin(t * 0.6 + v * 9) * 30
        y = 830 + ((v * 900 - t * 22) % 900)
        c.drawCircle(x, y, r * 0.8, skia.Paint(Color=hexc('#FFF4D0', 0.55 * light * d.alpha), AntiAlias=True))
    # soft warm glow around Falcon (safe, calm)
    d.glow(620, 1450, 260, '#F6D99A', 0.12 * light)

def garage_hatch(d, k_open, morph):
    c = d.c
    c.drawRect(skia.Rect(-400, -400, W + 400, H + 400), skia.Paint(Color=hexc('#2A2433', d.alpha)))
    # ceiling planks seen from below
    for i in range(-4, 14):
        d.line([(-200, i * 150), (W + 200, i * 150 + 40)], 4, '#3D3446', 0.8)
    # opening: circle (from balloon box) morphs into square attic hatch
    s = lerp(120, 230, morph)
    rad = lerp(s, 18, morph)
    hole = rrect(540 - s, 960 - s, 540 + s, 960 + s, rad)
    c.save(); c.clipPath(hole, skia.ClipOp.kIntersect, True)
    c.drawRect(skia.Rect(0, 0, W, H), skia.Paint(Color=hexc('#F5D893', k_open * d.alpha)))
    d.glow(540, 960, 200, '#FFF0C0', 0.6 * k_open)
    c.restore()
    c.drawPath(hole, d.stroke_paint('#8A6A4E', 10, 1.0))
    if morph > 0.6:
        # ladder going up
        a = clamp((morph - 0.6) / 0.4)
        for sx in (-110, 110):
            d.line([(540 + sx * 1.6, 1900), (540 + sx, 960 + s)], 12, WOOD, a)
        for i in range(6):
            yy = 1850 - i * 140
            if yy < 960 + s:
                break
            ww = lerp(176, 110, (1850 - yy) / (890 - s)) if (890 - s) else 110
            d.line([(540 - ww, yy), (540 + ww, yy)], 10, WOOD, a)
    for (u, v, r) in DUST[:30]:
        x = u * W
        y = (v * H - d.t * 30) % H
        c.drawCircle(x, y, r * 0.7, skia.Paint(Color=hexc('#F5E7C0', 0.35 * d.alpha), AntiAlias=True))

def search_panel(d):
    """Left half of the contrast: helicopters, police, live TV, empty balloon."""
    t = d.t
    sky(d, '#8EAFC4', '#D8E3E4', -200, 1300)
    d.shape(smooth([(-300, 1180), (500, 1150), (1400, 1180), (1400, 2200), (-300, 2200)]), FIELD, lw=4, hatch=0.3)
    helicopter(d, 300 + 80 * math.sin(t * 0.9), 620, 0.95, 'police')
    helicopter(d, 800 + 60 * math.cos(t * 1.1), 820, 0.75, 'news', flip=True)
    balloon(d, 560, 1240, 1.0, squash=0.3, open_=1.0, empty_glow=0.4)
    police_car(d, 230, 1560, 1.0)
    police_car(d, 880, 1600, 0.9, flip=True)
    tv(d, 300, 1640, 460, 300, tv_balloon_content(0.2, True, 0.0, field=True), style='flat', seed=21)

def scene7(d, lt):
    t = d.t
    if lt < 1.5:
        morph = eio(prog(lt, 0.0, 0.8))
        k_open = eout(prog(lt, 0.35, 0.9))
        z = 1.0 + 5.0 * ein(prog(lt, 0.9, 1.5))
        cam(d, 540, 960, z)
        garage_hatch(d, k_open, morph)
        uncam(d)
        if lt > 1.2:
            with_alpha(d, prog(lt, 1.2, 1.5), lambda: attic_interior(d))
        return
    if lt < 4.3:
        # inside the attic: Falcon quietly sitting
        u = prog(lt, 1.5, 4.3)
        z = lerp(1.35, 1.05, eout(u))
        cam(d, lerp(600, 560, u), lerp(1330, 1150, eout(u)), z)
        attic_interior(d)
        uncam(d)
        if lt > 3.9:
            # pull outward: attic -> house
            k = prog(lt, 3.9, 4.3)
            with_alpha(d, ease(k), lambda: s7_house_pull(d, 0.0))
        return
    if lt < 5.4:
        s7_house_pull(d, prog(lt, 4.3, 5.4))
        if lt > 5.0:
            s7_split(d, prog(lt, 5.0, 5.6))
        return
    s7_house_pull(d, 1.0)
    d.c.drawRect(skia.Rect(0, 0, W, H), skia.Paint(Color=hexc(PAPER, 0.45 * d.alpha)))
    s7_split(d, prog(lt, 5.0, 5.6))

def s7_house_pull(d, u):
    t = d.t
    e = eio(u)
    # house world: house at (560, 1500); attic at house-local (176,-238)
    hs = 1.0
    ax, ay = 560 + 176 * hs, 1500 - 238 * hs
    z = lerp(5.5, 0.75, e)
    cx = lerp(ax, 640, e); cy = lerp(ay, 1180, e)
    cam(d, cx, cy, z)
    sky(d, '#93B5CA', '#D9E6EA', -1200, 1600)
    drifting_clouds(d, t, [(0, 700, 0.8), (900, 560, 0.7)], 12)
    # the enormous search operation far away
    for i in range(3):
        helicopter(d, 1250 + i * 160 + 30 * math.sin(t + i), 640 + i * 70, 0.3, 'police' if i % 2 == 0 else 'news', flip=True)
    balloon(d, 1420, 1360, 0.22, squash=0.3, open_=1.0)
    d.shape(smooth([(-1200, 1440), (500, 1420), (2400, 1440), (2400, 2600), (-1200, 2600)]), '#B8C88A', lw=4, hatch=0.25)
    ground(d, 1500, GRASS, -1500, 2600)
    police_car(d, 1300, 1430, 0.35, kind='police')
    tree(d, 140, 1502, 0.9)
    house(d, 560, 1500, hs, attic=1.0, child=0.0, cutaway=1.0)
    uncam(d)

def s7_split(d, k):
    t = d.t
    e = eout(k)
    c = d.c
    # left panel slides from left, right from right
    L = (30, 520, 528, 1760)
    R = (552, 520, 1050, 1760)
    if e < 1:
        pass
    c.save(); c.translate(-(1 - e) * 600, 0)
    c.save(); c.clipRect(skia.Rect(*L), skia.ClipOp.kIntersect, True)
    c.translate(L[0], L[1]); sub(d, L[2] - L[0], L[3] - L[1], search_panel, cx=560, cy=1180, z=0.56)
    c.restore()
    c.drawRect(skia.Rect(*L), d.stroke_paint(INK, 7))
    c.restore()
    c.save(); c.translate((1 - e) * 600, 0)
    c.save(); c.clipRect(skia.Rect(*R), skia.ClipOp.kIntersect, True)
    c.translate(R[0], R[1]); sub(d, R[2] - R[0], R[3] - R[1], lambda dd: attic_interior(dd), cx=600, cy=1260, z=0.6)
    c.restore()
    c.drawRect(skia.Rect(*R), d.stroke_paint(INK, 7))
    c.restore()

# =================================================================== S8 hoax investigation
def cork(d):
    d.c.drawRect(skia.Rect(-400, -400, W + 400, H + 400), skia.Paint(Color=hexc(CORK, d.alpha)))
    d.fill_rect_tex(skia.Rect(-400, -400, W + 400, H + 400), '#A57A4E', 0.35, s=1.0, hatch=0.15)
    r = random.Random(11)
    for i in range(260):
        x, y = r.uniform(-300, W + 300), r.uniform(-300, H + 300)
        d.c.drawCircle(x, y, r.uniform(1.5, 3.5), skia.Paint(Color=hexc('#7E5A36', 0.45 * d.alpha), AntiAlias=True))
    d.shape(rect(-30, -30, W + 30, H + 30), None, lw=0)

def interview_content(d, w, h):
    d.c.drawRect(skia.Rect(0, 0, w, h), skia.Paint(Color=hexc('#9AA6B4', d.alpha)))
    d.shape(poly([(w * 0.42, 0), (w * 0.58, 0), (w * 0.62, h * 0.16), (w * 0.38, h * 0.16)]), '#E8D9A8', lw=3)
    d.c.drawPath(poly([(w * 0.38, h * 0.16), (w * 0.62, h * 0.16), (w * 0.95, h * 0.9), (w * 0.05, h * 0.9)]),
                 skia.Paint(Color=hexc('#FFF4C8', 0.3 * d.alpha), AntiAlias=True))
    for sx in (0.22, 0.78):
        d.shape(circle(w * sx, h * 0.42, h * 0.1), '#3B3560', lw=3)
        d.shape(rrect(w * sx - h * 0.15, h * 0.52, w * sx + h * 0.15, h * 0.85, 20), '#3B3560', lw=3)
    d.shape(rect(w * 0.18, h * 0.68, w * 0.82, h * 0.76), WOOD, lw=3)
    paper_sheet(d, w * 0.5, h * 0.66, w * 0.16, h * 0.08, 0, seed=3, lines=2)

def tvint_content(d, w, h):
    def inner(dd, ww, hh):
        dd.c.drawRect(skia.Rect(0, 0, ww, hh), skia.Paint(Color=hexc('#C9B9A0', dd.alpha)))
        dd.shape(rrect(ww * 0.08, hh * 0.45, ww * 0.92, hh * 0.78, 18), '#7D6E9E', lw=3)
        for sx, col in ((0.3, '#C66A4E'), (0.62, '#7D5BA6')):
            dd.shape(circle(ww * sx, hh * 0.3, hh * 0.1), '#3B3560', lw=3)
            dd.shape(rrect(ww * sx - hh * 0.12, hh * 0.4, ww * sx + hh * 0.12, hh * 0.68, 14), col, lw=3)
    d.c.drawRect(skia.Rect(0, 0, w, h), skia.Paint(Color=hexc('#E3D6BF', d.alpha)))
    tv(d, w * 0.1, h * 0.1, w * 0.8, h * 0.7, inner, style='flat', seed=31)

def house_content(d, w, h):
    sub(d, w, h, lambda dd: (sky(dd, '#93B5CA', '#D9E6EA', -200, 1500), ground(dd, 1400, GRASS), house(dd, 540, 1400, 1.2, attic=0.4)),
        cx=560, cy=1200, z=w / 900)

def heli_content(d, w, h):
    sky(d, '#93B5CA', '#D9E6EA', 0, h)
    helicopter(d, w * 0.5, h * 0.5, w / 520, 'police')

def folder(d, x, y, w, h, open_k, plan_k, stamp_k):
    c = d.c
    c.save(); c.translate(x, y)
    # back cover + tab
    d.shape(poly([(-w / 2, -h / 2), (-w / 2 + w * 0.3, -h / 2), (-w / 2 + w * 0.34, -h / 2 - 40), (-w / 2 + w * 0.58, -h / 2 - 40),
                  (-w / 2 + w * 0.62, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2, h / 2)]), '#D9B97A', lw=5, hatch=0.3)
    # paper with the "plan" diagram
    d.shape(rect(-w / 2 + 30, -h / 2 + 24, w / 2 - 30, h / 2 - 20), '#FBF7EE', lw=3.5, hatch=0.05)
    d.scribble(-w / 2 + 60, -h / 2 + 70, w * 0.5, 5, INK, 2.4, 0.7, 41, lines=2, gap=26)
    # house -> balloon -> TV : drawn in blue pencil, step by step
    icons = [(-w * 0.3, 30), (0, -10), (w * 0.3, 30)]
    for i, (ix, iy) in enumerate(icons):
        kk = prog(plan_k, i * 0.3, i * 0.3 + 0.25)
        if kk <= 0:
            continue
        c.save(); c.translate(ix, iy); c.scale(kk, kk)
        d.c.drawCircle(0, 0, 70, skia.Paint(Color=hexc('#3C5FA8', 0.10 * d.alpha), AntiAlias=True))
        d.dashed(circle(0, 0, 70), 3, '#3C5FA8', 0.9, 10, 6, 0)
        if i == 0:
            house(d, -8, 40, 0.18, curtains=False)
        elif i == 1:
            balloon(d, 0, 0, 0.24, shine=0.4)
        else:
            tv(d, -45, -32, 90, 60, tv_balloon_content(0, False, 0.0), style='crt', lower=True, live=False, scan=False)
        c.restore()
        if i > 0:
            ka = prog(plan_k, i * 0.3 - 0.1, i * 0.3 + 0.05)
            px, py = icons[i - 1]
            if ka > 0:
                sx, sy = px + 75, py - 10
                ex, ey = lerp(sx, ix - 75, ka), lerp(sy, iy - 10, ka)
                d.line([(sx, sy), ((sx + ex) / 2, min(sy, ey) - 30), (ex, ey)], 4, '#3C5FA8', 0.95)
                if ka > 0.95:
                    d.line([(ex - 14, ey - 12), (ex, ey), (ex - 16, ey + 8)], 4, '#3C5FA8', 0.95, curve=False)
    d.scribble(-w / 2 + 60, h / 2 - 110, w * 0.7, 5, INK, 2.4, 0.6, 42, lines=2, gap=26)
    # front cover folding open
    if open_k < 1:
        fw = w * (1 - open_k)
        d.shape(rect(-w / 2, -h / 2 + 6, -w / 2 + fw, h / 2), '#E3C68C', lw=5, hatch=0.3)
    # stamp
    if stamp_k > 0:
        s = lerp(1.6, 1.0, eout(clamp(stamp_k * 2)))
        a = clamp(stamp_k * 3)
        c.save(); c.translate(w * 0.22, h * 0.2); c.rotate(-12); c.scale(s * 1.35, s * 1.35)
        st = rrect(-110, -60, 110, 60, 12)
        c.drawPath(st, d.stroke_paint(RED, 10, a, rough=2.5))
        c.drawPath(rrect(-96, -46, 96, 46, 8), d.stroke_paint(RED, 4, a * 0.8, rough=2.0))
        f = font('kalamb', 100)
        d.text('!', 0, 36, f, RED, a, align='center')
        c.restore()
    c.restore()

def scene8(d, lt):
    t = d.t
    c = d.c
    drift = 12 * math.sin(t * 0.5)
    push = ein(prog(lt, 7.9, 8.5))
    zc = lerp(1.0, 3.2, push)
    cam(d, lerp(540 + drift, 250, push), lerp(960, 1160, push), zc)
    if lt < 0.7:
        s7_house_pull(d, 1.0)
        d.c.drawRect(skia.Rect(-400, -400, W + 400, H + 400), skia.Paint(Color=hexc(PAPER, 0.45 * d.alpha)))
    with_alpha(d, ease(prog(lt, 0.0, 0.7)), cork, d)
    # 1) split panels shrink into photos
    e = eio(prog(lt, 0.0, 0.9))
    L0 = (30, 520, 528, 1760); R0 = (552, 520, 1050, 1760)
    def lerp_rect(r0, cx, cy, w, h):
        x0 = lerp(r0[0], cx - w / 2, e); x1 = lerp(r0[2], cx + w / 2, e)
        y0 = lerp(r0[1], cy - h / 2, e); y1 = lerp(r0[3], cy + h / 2, e)
        return x0, y0, x1, y1
    items = []
    lx0, ly0, lx1, ly1 = lerp_rect(L0, 270, 730, 300, 250)
    rx0, ry0, rx1, ry1 = lerp_rect(R0, 820, 760, 290, 250)
    # extra evidence pinned
    extras = [
        (0.7, 560, 640, 220, 170, 4, interview_content),
        (1.1, 250, 1170, 260, 200, -5, tvint_content),
        (1.5, 840, 1180, 250, 200, 6, lambda dd, w, h: paper_sheet(dd, w / 2, h / 2, w, h, 0, 5, diagram=True)),
        (1.9, 560, 980, 200, 160, -3, house_content),
    ]
    # strings (behind photos)
    nodes = [(270, 610), (820, 640), (560, 560), (250, 1075), (840, 1085), (560, 905)]
    pairs = [(0, 2), (2, 1), (0, 3), (1, 4), (3, 5), (5, 4), (2, 5)]
    for i, (a_, b_) in enumerate(pairs):
        k = prog(lt, 1.0 + i * 0.25, 1.5 + i * 0.25)
        string_line(d, nodes[a_], nodes[b_], k, 25)
    for (st, x, y, w, h, rot, fn) in extras:
        s = back(prog(lt, st, st + 0.35))
        if s > 0:
            c.save(); c.translate(x, y); c.scale(s, s)
            photo(d, 0, 0, w, h, rot, fn)
            c.restore()
    # the two split panels as photos
    rot = lerp(0, -4, e)
    photo(d, (lx0 + lx1) / 2, (ly0 + ly1) / 2, lx1 - lx0, ly1 - ly0, rot,
          lambda dd, w, h: sub(dd, w, h, search_panel, cx=560, cy=1180, z=0.56 * w / 498), pin_col=RED if e > 0.9 else None,
          border=16 * e)
    photo(d, (rx0 + rx1) / 2, (ry0 + ry1) / 2, rx1 - rx0, ry1 - ry0, lerp(0, 5, e),
          lambda dd, w, h: sub(dd, w, h, attic_interior, cx=600, cy=1260, z=0.6 * w / 498), pin_col=RED if e > 0.9 else None,
          border=16 * e)
    # big question mark -> becomes "!" once police conclude
    kq = prog(lt, 1.2, 2.0)
    if kq > 0 and lt < 5.6:
        f = font('brush', 260)
        a = ease(kq) * (1 - prog(lt, 5.3, 5.6))
        sc = back(kq)
        d.c.save(); d.c.translate(560, 1000); d.c.scale(sc, sc); d.c.rotate(4 * math.sin(t * 2))
        d.text('?', 0, 90, f, RED, a, align='center', stroke=CREAM, sw=16)
        d.c.restore()
    # folder slides in, opens, plan diagram, stamp
    kf = eout(prog(lt, 3.0, 3.8))
    if kf > 0:
        strings_to = prog(lt, 5.6, 6.4)
        for nd in nodes[:4]:
            string_line(d, nd, (540, 1420), strings_to, 10, RED, 2.6)
        folder(d, 540, lerp(2300, 1480, kf), 820, 520, eout(prog(lt, 3.8, 4.4)), prog(lt, 4.3, 6.2), prog(lt, 6.3, 6.8))
    uncam(d)

# =================================================================== S9 media phenomenon
def newspaper(d, x, y, w, h, rot, seed, a=1.0):
    c = d.c
    c.save(); c.translate(x, y); c.rotate(rot)
    d.shape(rect(-w / 2, -h / 2, w / 2, h / 2), '#EFEADF', lw=4, a=a, hatch=0.08)
    c.drawRect(skia.Rect(-w / 2 + 16, -h / 2 + 16, w / 2 - 16, -h / 2 + 58), skia.Paint(Color=hexc('#2A2838', 0.85 * a * d.alpha)))
    d.scribble(-w / 2 + 30, -h / 2 + 40, w * 0.6, 4, '#EFEADF', 4, 0.9 * a, seed)
    d.scribble(-w / 2 + 20, -h / 2 + 92, w * 0.8, 6, INK, 7, 0.9 * a, seed + 1)
    c.save(); c.translate(-w / 2 + 20, -h / 2 + 120)
    c.clipRect(skia.Rect(0, 0, w * 0.55, h * 0.42))
    tv_balloon_content(seed * 0.3, False, 0.0)(d, w * 0.55, h * 0.42)
    c.restore()
    c.drawRect(skia.Rect(-w / 2 + 20, -h / 2 + 120, -w / 2 + 20 + w * 0.55, -h / 2 + 120 + h * 0.42), d.stroke_paint(INK, 3, a))
    for i in range(6):
        d.scribble(w * 0.12, -h / 2 + 130 + i * 24, w * 0.3, 2, INK, 2, 0.6 * a, seed + 10 + i)
    for i in range(5):
        d.scribble(-w / 2 + 22, h * 0.1 + i * 24, w * 0.85, 2, INK, 2, 0.6 * a, seed + 30 + i)
    c.restore()

def laptop(d, x, y, w, k_comments):
    c = d.c
    h = w * 0.62
    c.save(); c.translate(x, y)
    d.shape(rrect(-w / 2, -h, w / 2, 0, 18), '#5A5D6E', lw=5)
    scr = (-w / 2 + 24, -h + 24, w / 2 - 24, -20)
    c.drawRect(skia.Rect(*scr), skia.Paint(Color=hexc('#F4F2EC', d.alpha)))
    # browser chrome
    c.drawRect(skia.Rect(scr[0], scr[1], scr[2], scr[1] + 52), skia.Paint(Color=hexc('#C9CCD6', d.alpha)))
    for i in range(3):
        d.shape(rrect(scr[0] + 14 + i * 130, scr[1] + 8, scr[0] + 134 + i * 130, scr[1] + 40, 8),
                '#E9EBF0' if i == 0 else '#B5B9C6', lw=2.5)
    d.shape(rrect(scr[0] + 14, scr[1] + 60, scr[2] - 14, scr[1] + 92, 14), '#FFFFFF', lw=2.5)
    d.scribble(scr[0] + 40, scr[1] + 78, 200, 2, '#7A7F90', 2, 0.8, 77)
    # video player
    vx0, vy0, vx1, vy1 = scr[0] + 20, scr[1] + 108, scr[0] + (scr[2] - scr[0]) * 0.58, scr[3] - 50
    c.save(); c.translate(vx0, vy0); c.clipRect(skia.Rect(0, 0, vx1 - vx0, vy1 - vy0))
    tv_balloon_content(0.7, True, 0.0)(d, vx1 - vx0, vy1 - vy0)
    c.restore()
    c.drawRect(skia.Rect(vx0, vy0, vx1, vy1), d.stroke_paint(INK, 3))
    c.drawRect(skia.Rect(vx0, vy1 + 12, vx1, vy1 + 20), skia.Paint(Color=hexc('#B5B9C6', d.alpha)))
    c.drawRect(skia.Rect(vx0, vy1 + 12, lerp(vx0, vx1, (d.t * 0.12) % 1), vy1 + 20), skia.Paint(Color=hexc(RED, d.alpha)))
    # comments
    for i in range(5):
        kk = prog(k_comments, i * 0.18, i * 0.18 + 0.2)
        if kk <= 0:
            continue
        yy = scr[1] + 120 + i * 62
        cx0 = vx1 + 20
        d.shape(circle(cx0 + 18, yy + 16, 15), ['#C66A4E', '#7D5BA6', '#6FA36F', '#D9A441', '#5D8A9E'][i], lw=2.5, a=kk)
        d.scribble(cx0 + 44, yy + 10, (scr[2] - cx0) * 0.6, 2, INK, 2, 0.7 * kk, 90 + i)
        d.scribble(cx0 + 44, yy + 30, (scr[2] - cx0) * 0.4, 2, '#7A7F90', 2, 0.6 * kk, 95 + i)
    c.drawRect(skia.Rect(*scr), d.stroke_paint(INK, 3.5))
    # base
    d.shape(poly([(-w / 2 - 40, 0), (w / 2 + 40, 0), (w / 2 + 70, 46), (-w / 2 - 70, 46)]), '#8A8D9C', lw=5)
    d.line([(-60, 24), (60, 24)], 4, '#5A5D6E', 0.8)
    c.restore()

def msg_panel(d, x, y, w, rot, seed, a=1.0):
    c = d.c
    c.save(); c.translate(x, y); c.rotate(rot)
    h = 120
    d.shape(rrect(-w / 2, -h / 2, w / 2, h / 2, 18), '#FDFBF6', lw=4, a=a, hatch=0.05)
    d.shape(circle(-w / 2 + 42, -6, 24), ['#C66A4E', '#7D5BA6', '#6FA36F', '#5D8A9E'][seed % 4], lw=3, a=a)
    d.scribble(-w / 2 + 80, -22, w * 0.5, 2, INK, 2.5, 0.8 * a, seed)
    d.scribble(-w / 2 + 80, 6, w * 0.6, 2, '#7A7F90', 2.2, 0.7 * a, seed + 5)
    balloon(d, w / 2 - 44, 4, 0.12, shine=0.4)
    c.restore()

def scene9(d, lt):
    t = d.t
    c = d.c
    zout = eio(prog(lt, 0.9, 2.6))
    z = lerp(1.0, 1.0, zout)
    c.drawRect(skia.Rect(0, 0, W, H), skia.Paint(Color=hexc('#E6D9C0', d.alpha)))
    for x in range(0, W, 90):
        d.line([(x + 20, 0), (x + 20, H)], 10, '#DCCCAA', 0.5, rough=0.6)
    # TV wall grid 3 x 4
    cols, rows = 3, 4
    gw, gh = 300, 210
    gx0 = (W - cols * gw - (cols - 1) * 30) / 2
    gy0 = 520
    centre_idx = 4
    for r_ in range(rows):
        for c_ in range(cols):
            i = r_ * cols + c_
            x = gx0 + c_ * (gw + 30); y = gy0 + r_ * (gh + 70)
            if i == centre_idx:
                # first TV: grows from big single screen into the grid
                bx, by, bw, bh = 200, 760, 680, 470
                xx = lerp(bx, x, zout); yy = lerp(by, y, zout); ww = lerp(bw, gw, zout); hh = lerp(bh, gh, zout)
                tv(d, xx, yy, ww, hh, tv_balloon_content(0.0, True, 0.0), style='flat', seed=50)
                continue
            s = back(prog(lt, 1.4 + ((i * 7) % 11) * 0.09, 1.75 + ((i * 7) % 11) * 0.09))
            if s <= 0:
                continue
            c.save(); c.translate(x + gw / 2, y + gh / 2); c.scale(s, s); c.translate(-gw / 2, -gh / 2)
            tv(d, 0, 0, gw, gh, tv_balloon_content(i * 0.37, i % 3 == 0, 0.0), style='crt' if i % 2 else 'flat', seed=50 + i)
            c.restore()
    # newspapers flying in
    for i, (st, ex, ey, rot) in enumerate([(2.6, 280, 1080, -10), (2.9, 800, 1150, 8), (3.2, 540, 1300, -4)]):
        k = eout(prog(lt, st, st + 0.6))
        if k <= 0:
            continue
        sx = -400 if i % 2 == 0 else W + 400
        newspaper(d, lerp(sx, ex, k), lerp(ey - 500, ey, k), 430, 520, lerp(rot * 4, rot, k), 60 + i * 13)
    # old laptop with early online discussion
    kl = eout(prog(lt, 3.9, 4.6))
    if kl > 0:
        msgs = [(4.6, 210, 700, -4), (4.9, 870, 760, 5), (5.2, 220, 1450, 3), (5.5, 860, 1480, -5)]
        for (st, mx, my, rot) in msgs:
            k = back(prog(lt, st, st + 0.3))
            if k > 0:
                c.save(); c.translate(mx, my); c.scale(k, k)
                msg_panel(d, 0, 0, 360, rot, int(st * 10))
                c.restore()
        laptop(d, 540, lerp(2400, 1800, kl), 760, prog(lt, 4.6, 6.6))

# =================================================================== S10 final composition
def scene10(d, lt):
    t = d.t
    u = prog(lt, 0, 6.7)
    cam(d, 540, 960 - 30 * eout(u), lerp(1.05, 1.0, eout(prog(lt, 0, 2))))
    sky(d, '#8DB0C7', '#E0E9E9', -400, 1700)
    drifting_clouds(d, t, [(80, 560, 0.9), (720, 760, 0.75), (400, 1080, 0.6)], 12)
    helicopter(d, 840 + 40 * math.sin(t * 0.8), 610 + 20 * math.cos(t), 0.62, 'police', flip=True)
    helicopter(d, 170 + 30 * math.sin(t * 0.7), 820, 0.42, 'news')
    balloon(d, 520 + 20 * math.sin(t * 0.7), 760 + 14 * math.sin(t * 1.1), 0.95, rot=3 * math.sin(t))
    # TVs on the lawn watching it all
    d.shape(smooth([(-300, 1430), (400, 1400), (1400, 1420), (1400, 2300), (-300, 2300)]), '#B8C88A', lw=4, hatch=0.25)
    ground(d, 1560, GRASS, -400, 1500)
    tree(d, 90, 1562, 0.8)
    tree(d, 1010, 1562, 0.75)
    house(d, 470, 1560, 0.9, attic=0.85, child=1.0, lights=0.3)
    for i, (x, y, w, h, rot) in enumerate([(40, 1060, 220, 150, -6), (820, 1100, 210, 145, 5)]):
        d.c.save(); d.c.translate(x + w / 2, y + h / 2); d.c.rotate(rot); d.c.translate(-w / 2, -h / 2)
        tv(d, 0, 0, w, h, tv_balloon_content(i * 0.6, False, 0.0), style='crt' if i else 'flat', seed=70 + i)
        d.c.restore()
    grass_blades(d, -50, 1130, 1925, 60, 60, GRASS_D, 9, wind=0.7)
    # warm safe glow around the attic window
    uncam(d)

SCENES = [scene1, scene2, scene3, scene4, scene5, scene6, scene7, scene8, scene9, scene10]
# transition style into scene i (from i-1): (kind, duration)
TRANS = {1: ('fade', 0.5), 2: ('fade', 0.45), 3: ('fade', 0.25), 4: ('fade', 0.4), 5: ('fade', 0.3),
         6: ('cut', 0), 7: ('cut', 0), 8: ('fade', 0.3), 9: ('fade', 0.5)}
