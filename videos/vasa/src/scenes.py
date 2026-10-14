"""Timeline + scenes for the Vasa episode."""
from world import *

# ------------------------------------------------------------------ master timeline (from narration analysis)
T = [0.0, 7.683, 15.533, 20.837, 24.762, 29.671, 34.623]
SPEECH_END = 37.30
VIDEO_END = 38.80

SENTENCES = [
    "1628’de İsveç’te Vasa savaş gemisi, ilk yolculuğunda daha limandan bile çıkamadan battı.",
    "Gemi dev toplarla ve ağır süslemelerle donatılmıştı, ama gövdesi bu ağırlığı taşımak için yeterince dengeli değildi.",
    "Stockholm’den ayrıldıktan kısa süre sonra güçlü bir rüzgâr gemiyi yana yatırdı.",
    "Alt kattaki açık top kapaklarından içeri su dolmaya başladı.",
    "Vasa, yüzlerce insanın gözleri önünde birkaç dakika içinde battı.",
    "Üstelik gemi yaklaşık 333 yıl sonra denizin dibinden çıkarıldı.",
    "İnanması güç ama bu gerçekten yaşandı.",
]
FINAL_L1 = "İnanması güç ama"
FINAL_L2 = "bu gerçekten yaşandı."
assert FINAL_L1 + " " + FINAL_L2 == SENTENCES[6]

SHIP_X, SHIP_S = 560, 0.68


def lerp_hex(a, b, k):
    return mix_color(a, b, k)


def cam(cv, zoom, fx, fy, tx=W / 2, ty=H / 2):
    cv.translate(tx, ty); cv.scale(zoom, zoom); cv.translate(-fx, -fy)


def ship_xf(pt, x, y, s, heel_deg):
    a = math.radians(heel_deg)
    px, py = pt[0] * s, pt[1] * s
    return (x + px * math.cos(a) - py * math.sin(a), y + px * math.sin(a) + py * math.cos(a))


def draw_ship_stern(cv, t, x, y, s, heel, **kw):
    cv.save(); cv.translate(x, y); cv.rotate(heel); cv.scale(s, s)
    ship_stern(cv, t, **kw)
    cv.restore()


def harbor(cv, t, heel, sink, ship_x=SHIP_X, ship_s=SHIP_S, sail=0.6, gust=0.0, bend=0.0, flag_wind=0.3,
           crowd_react=0.0, crowd_mode='raise', sparkle_a=0.0, crew_brace=0.0, extra_after_ship=None, extra_front=None,
           show_crowd=True, front_alpha=0.9, wind=None, cloud_speed=1.0, far_react=0.0):
    sky(cv, t, cloud_speed=cloud_speed)
    far_shores(cv, t, bend=bend, react=far_react)
    water_back(cv, t)
    if wind:
        wind(cv, 'back')
    # ship
    y = WL + sink * ship_s
    draw_ship_stern(cv, t, ship_x, y, ship_s, heel, sail=sail, gust=gust, sparkle_a=sparkle_a, crew_brace=crew_brace, flag_wind=flag_wind)
    if extra_after_ship:
        extra_after_ship(cv)
    water_front(cv, t, WL, alpha=front_alpha, foam_x=ship_x + (-40 if heel < -10 else 0), foam_w=240 * ship_s / 0.68)
    if extra_front:
        extra_front(cv)
    if wind:
        wind(cv, 'front')
    if show_crowd:
        quay(cv, 1700, t)
        crowd(cv, t, 1640, react=crowd_react, mode=crowd_mode)


# ================================================================== SCENE 1 — hook
def heel_s1(t):
    if t < 1.9:
        return -lerp(9, 17, ease_out(t / 1.9)) - math.sin(t * 2.1) * 1.0
    if t < 4.0:
        k = smooth((t - 1.9) / 0.8)
        base = lerp(17, 12, k)
        return -(base + math.sin(t * 2.1) * 1.5)
    k = ease_in(prog(t, 4.0, 6.6))
    return -lerp(12, 36, k)


def sink_s1(t):
    return lerp(0, 610, ease_in(prog(t, 4.6, 7.0)) * 0.85 + 0.15 * smooth(prog(t, 4.6, 7.0))) + 22 * smooth(prog(t, 0, 1.9)) - 22 * smooth(prog(t, 1.9, 3.0))


def scene1(cv, t):
    heel = heel_s1(t); sink = sink_s1(t)
    # camera: wide -> push in on decorated stern -> pull back
    zin = smooth(prog(t, 1.75, 2.6)) * (1 - smooth(prog(t, 3.75, 4.6)))
    zoom = lerp(1.0, 1.42, zin) + 0.03 * smooth(prog(t, 0, 1.9))
    fx = lerp(540, SHIP_X - 40, zin); fy = lerp(1100, 1000, zin)
    cv.save(); cam(cv, zoom, fx, fy, 540, lerp(1100, 1080, zin))
    react = smooth(prog(t, 0.15, 1.1))
    mode = 'raise' if t < 4.6 else 'head'

    def fx_front(c):
        if t > 6.2:
            mt = ship_xf((-92, -885), SHIP_X, WL + sink * SHIP_S, SHIP_S, heel)
            ripples(c, t, mt[0] + 90, WL + 4, 6.3, n=3, alpha=0.9, scale=1.3)
        if t > 5.9:
            splash(c, t, SHIP_X - 40, WL, 6.15, size=0.9, alpha=0.85)
        if t > 6.0:
            for k_ in range(8):
                ph = (t * 0.9 + hsh('b1', k_)) % 1.0
                bubble(c, SHIP_X - 160 + hsh('bx', k_) * 260, WL + 30 + (1 - ph) * 120, 6 + 6 * hsh('br', k_), alpha=0.8 * (1 - ph), seed=k_)
    harbor(cv, t, heel, sink, sail=0.85, gust=0.25 + 0.2 * math.sin(t * 3), bend=0.15, flag_wind=0.55,
           crowd_react=react if t < 4.6 else 1.0, crowd_mode=mode, sparkle_a=smooth(prog(t, 1.9, 2.4)) * (1 - smooth(prog(t, 3.8, 4.2))),
           crew_brace=0.4 + 0.6 * smooth(prog(t, 4.0, 5.0)), extra_front=fx_front, far_react=1.0)
    cv.restore()
    return dict(heel=heel, sink=sink)


# ================================================================== SCENE 2 — top heavy
FULC_X, FULC_Y = 540, 1585   # keel tip / pivot
GROUND_Y = 1660
SEC_S = 0.98


def sec_angle(t):
    """balance tilt in degrees (positive = clockwise)"""
    a = 0.0
    # impulses from added weights
    for ti, amp in [(8.62, 2.2), (8.78, -2.2), (8.94, 2.0), (9.10, -2.0), (9.6, 2.6), (10.1, -2.8), (10.4, 3.0), (10.7, -3.0)]:
        if t > ti:
            d = t - ti
            a += amp * math.exp(-d / 0.55) * math.sin(d * 7.5)
    # growing instability on "ama gövdesi ... dengeli değildi"
    if t > 11.3:
        k = smooth(prog(t, 11.3, 14.2))
        a += math.sin((t - 11.3) * 3.4) * lerp(3.0, 13.0, k)
    if t > 14.2:
        a = lerp(a, -17.0 + math.sin(t * 5) * 1.0, smooth(prog(t, 14.2, 14.9)))
    return a


def scene2(cv, t):
    # notebook paper background with faint ruled lines
    for k_ in range(22):
        y = 520 + k_ * 64
        line(cv, [(-10, y), (W + 10, y)], 1.6, '#9DB8CF', seed=('rule', k_), amp=0.6, alpha=0.22)
    ang = sec_angle(t)
    # ground / balance line
    line(cv, [(70, GROUND_Y), (W - 70, GROUND_Y)], 6, INK, seed='ground', amp=1.0, double=True)
    # fulcrum
    shape(cv, [(FULC_X - 62, GROUND_Y), (FULC_X, FULC_Y), (FULC_X + 62, GROUND_Y)], '#C9B48A', INK, 4.2, seed='fulc', amp=0.8)
    draw = smooth(prog(t, 7.95, 8.55))
    can = tuple(clamp((t - ti) / 0.28) for ti in (8.55, 8.70, 8.86, 9.02))
    upper = ease_out(prog(t, 9.30, 9.95))
    orn = prog(t, 9.95, 10.75)
    weights = prog(t, 11.75, 12.6)
    zoom_out = smooth(prog(t, 14.95, 15.53))
    cv.save()
    cv.translate(FULC_X, FULC_Y); cv.rotate(ang); cv.scale(SEC_S, SEC_S)
    ship_section(cv, t, draw=draw, cannons=can, upper=upper, orn=orn, sparkle_a=smooth(prog(t, 10.0, 10.5)) * (1 - smooth(prog(t, 11.3, 11.8))),
                 weights=weights, show_waterline=smooth(prog(t, 8.5, 8.9)), ghost_rows=1.0)
    cv.restore()
    # emphasis scribble around the narrow lower hull on "gövdesi"
    em = prog(t, 11.55, 12.15)
    if em > 0 and t < 13.6:
        a = 1 - smooth(prog(t, 13.0, 13.6))
        cv.save(); cv.translate(FULC_X, FULC_Y); cv.rotate(ang); cv.scale(SEC_S, SEC_S)
        P = wobble_pts(ellipse_pts(0, -120, 190, 140, 40), True, 3, 'emph', 10)
        path = path_from(P, True)
        p = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=5, StrokeCap=skia.Paint.kRound_Cap)
        p.setColor(C('#C8483A')); p.setAlphaf(0.85 * a)
        set_trim(p, em)
        cv.drawPath(path, p)
        cv.restore()
    # wobble motion lines on instability
    if t > 12.3:
        a = smooth(prog(t, 12.3, 12.8))
        for sgn in (-1, 1):
            top = ship_xf((sgn * 260, -720), FULC_X, FULC_Y, SEC_S, ang)
            line(cv, [(top[0] + sgn * 20, top[1] - 30), (top[0] + sgn * 40, top[1]), (top[0] + sgn * 20, top[1] + 30)], 4, INK_SOFT, seed=('ml', sgn), alpha=a)
            line(cv, [(top[0] + sgn * 45, top[1] - 40), (top[0] + sgn * 70, top[1]), (top[0] + sgn * 45, top[1] + 40)], 4, INK_SOFT, seed=('ml2', sgn), alpha=a * 0.7)
    return dict(ang=ang)


def muzzle_point(t):
    """screen position of the upper-right cannon muzzle in scene 2"""
    ang = sec_angle(t)
    # upper deck right cannon: slot (-400, facing 1, x=128) scale 78 -> muzzle at local (+95*0.78, -50*0.78) relative
    return ship_xf((110 + 95, -400 - 50), FULC_X, FULC_Y, SEC_S, ang)


# ================================================================== SCENE 3 — wind
def heel_s3(t):
    calm = -3 - math.sin(t * 1.7) * 1.2
    k = ease_out(prog(t, 17.85, 19.4))
    v = lerp(calm, -25, k)
    if t > 19.4:
        v += math.sin((t - 19.4) * 4) * 1.5 * math.exp(-(t - 19.4))
    return v


def ship_pos_s3(t):
    k = smooth(prog(t, 15.5, 20.8))
    return lerp(600, 545, k), lerp(0.74, 0.66, k)


def scene3(cv, t, zoom=1.0, focus=None, heel_override=None, sink=0.0, wave_k=0.0):
    heel = heel_override if heel_override is not None else heel_s3(t)
    sx, ss = ship_pos_s3(min(t, 20.837))
    g = smooth(prog(t, 17.85, 18.35))
    bend = g * (0.8 + 0.2 * math.sin(t * 7))

    def wind(c, layer):
        if layer == 'back':
            return
        # wind line inherited from the cannon (scene 2) flowing across in calm phase
        if t < 17.6:
            k = prog(t, 15.0, 16.6)
            f = swirl_fn(-60, 700, W + 80, 760, curl=1.0, loopr=40, loopu=0.55, amp=40)
            wind_line(c, f, t, 0, 1, 'carry', lw=4.5, alpha=1 - smooth(prog(t, 16.8, 17.5)), head=clamp(k * 1.2 + 0.25), tail=clamp(k * 1.2 - 0.35))
        if t > 17.8:
            gust_lines(c, t, 17.85, strength=g, direction=-1, y_range=(560, 1180), n=7, seed='gust')

    def front(c):
        # wind line becomes a wave rolling toward the port side
        if wave_k > 0:
            port = ship_xf((-250, -42), sx, WL + sink * ss, ss, heel)
            k = wave_k
            wx = lerp(port[0] - 260, port[0] - 30, ease_out(k))
            pts = [(wx - 90, WL + 6), (wx - 40, WL - 26 * k), (wx, WL - 48 * k), (wx + 26, WL - 34 * k), (wx + 14, WL - 18 * k)]
            line(c, pts, 6, '#EAF3F7', seed='wv', amp=0.6)
            line(c, [(wx - 110, WL + 10), (wx - 50, WL - 20 * k), (wx - 5, WL - 42 * k)], 3, '#3E6E9A', seed='wv2', amp=0.6, alpha=0.8)
    cv.save()
    if focus is not None:
        cam(cv, zoom, focus[0], focus[1], 540, 1150)
    react = smooth(prog(t, 15.55, 16.2))
    harbor(cv, t, heel, sink, ship_x=sx, ship_s=ss, sail=0.45 + 0.4 * g, gust=g * (0.85 + 0.15 * math.sin(t * 6)), bend=bend,
           flag_wind=0.3 + 0.7 * g, crowd_react=1.0, crowd_mode='wave' if t < 17.9 else 'head',
           crew_brace=g, wind=wind, cloud_speed=1 + 4 * g, extra_front=front, far_react=1.0)
    cv.restore()
    return dict(heel=heel, sx=sx, ss=ss)


# ================================================================== SCENE 4 — water through gun ports
def scene4(cv, t):
    TA = 22.05   # switch from exterior zoom to cross-section close-up
    if t < TA + 0.3:
        # exterior: camera moves toward the lower gun-port row while ship keeps heeling
        k = ease_io(prog(t, 20.84, 21.9))
        heel = lerp(-25, -30, smooth(prog(t, 20.6, 22.2))) + math.sin(t * 3) * 0.6
        sink = lerp(0, 14, smooth(prog(t, 20.84, 22.3)))
        sx, ss = ship_pos_s3(20.837)
        port = ship_xf((-270, -75), sx, WL + sink * ss, ss, heel)
        zoom = lerp(1.0, 3.1, k)
        focus = (lerp(540, port[0], k), lerp(1150, port[1], k))
        scene3(cv, t, zoom=zoom, focus=focus, heel_override=heel, sink=sink, wave_k=smooth(prog(t, 20.3, 21.7)))
        if t > TA - 0.05:
            a = smooth(prog(t, TA - 0.05, TA + 0.3))
            cv.saveLayerAlpha(None, int(255 * a))
            section_closeup(cv, t)
            cv.restore()
        return
    section_closeup(cv, t)


SEC_CLOSE_S = 1.9
PORT_L = (-206, -338)          # lower-deck port (left wall) in section local coords
PORT_TARGET = (250, 1150)


def closeup_heel(t):
    return -lerp(30, 39, smooth(prog(t, 21.9, 24.7))) - math.sin(t * 2.5) * 0.4


def closeup_geom(t):
    heel = closeup_heel(t)
    s = SEC_CLOSE_S
    a = math.radians(-31.5)
    # pivot fixed (computed at heel -31.5) so the port dips as the heel grows
    px, py = PORT_L[0] * s, PORT_L[1] * s
    rx, ry = px * math.cos(a) - py * math.sin(a), px * math.sin(a) + py * math.cos(a)
    pivot = (PORT_TARGET[0] - rx, PORT_TARGET[1] - ry)
    return heel, s, pivot


def section_closeup(cv, t):
    """cross-section close-up of the low (port) side, lower gun deck, water pouring in"""
    heel, s, pivot = closeup_geom(t)
    surf_y = PORT_TARGET[1] - 8
    gradient_rect(cv, -50, 300, W + 50, surf_y, SKY_TOP, SKY_BOT, 10)
    tex_rect(cv, -50, 300, W + 50, surf_y, '#9CC0D6', 0.14)
    for i, (x0, y0, sc) in enumerate([(120, 640, 0.8), (700, 560, 1.0)]):
        cloud(cv, (x0 + t * 12) % 1300 - 100, y0, sc, ('clc', i))
    gradient_rect(cv, -50, surf_y, W + 50, H + 50, WATER_TOP, WATER_BOT, 10)
    tex_rect(cv, -50, surf_y, W + 50, H + 50, '#4D84B0', 0.22, 1)
    wave_strokes(cv, t, surf_y + 30, H, 0.8, 0.6, seed='cw')
    pour = smooth(prog(t, 22.25, 22.9))
    spread = smooth(prog(t, 22.5, 24.7))
    cv.save()
    cv.translate(*pivot); cv.rotate(heel); cv.scale(s, s)
    ship_section_flood(cv, t, heel, s, pivot, surf_y, spread, pour)
    cv.restore()
    # surface line + small waves slapping at the port
    line(cv, [(x, surf_y + math.sin(x * 0.03 + t * 2.4) * 4) for x in range(-40, W + 60, 30)], 3.4, '#3E6E9A', seed='csl', amp=0.8)
    pg = ship_xf(PORT_L, pivot[0], pivot[1], s, heel)
    for k_ in range(3):
        wx = pg[0] - 70 - k_ * 70 + math.sin(t * 3 + k_) * 10
        line(cv, [(wx - 26, surf_y + 4), (wx - 8, surf_y - 12), (wx + 8, surf_y - 4), (wx + 22, surf_y - 12)], 4, '#EAF3F7', seed=('cwv', k_), amp=0.6)


def ship_section_flood(cv, t, heel, s, pivot, surf_y, spread, pour):
    """section in local coords with level (screen-horizontal) water pooling in the lower deck + inflow jet"""
    shift = -spread * 1.6 - math.sin(t * 4) * 0.08 * spread
    ship_section(cv, t, draw=1.0, cannons=(1, 1, 1, 1), upper=1.0, orn=1.0, show_waterline=0.0, ghost_rows=0.6, shift=shift)
    deck = [(-186, -301), (186, -301), (206, -399), (-206, -399)]
    a = math.radians(heel)

    def to_local(X, Y):
        dx, dy = (X - pivot[0]) / s, (Y - pivot[1]) / s
        ca, sa = math.cos(-a), math.sin(-a)
        return (dx * ca - dy * sa, dx * sa + dy * ca)
    low = ship_xf((-186, -301), pivot[0], pivot[1], s, heel)
    far = ship_xf((90, -301), pivot[0], pivot[1], s, heel)
    lvl = lerp(low[1] + 6, far[1], spread)
    if spread > 0.01:
        cv.save()
        cv.clipPath(path_from(np.asarray(deck, float), True, False), doAntiAlias=True)
        wv = math.sin(t * 3.2) * 5 * s
        Lp = [to_local(-600, lvl + wv), to_local(W / 2, lvl - wv * 0.5), to_local(W + 600, lvl - wv), to_local(W + 600, H + 2000), to_local(-600, H + 2000)]
        shape(cv, Lp, '#5C93C0', '#3E6E9A', 2.6 / s * 1.6, seed='inw', amp=1.0, alpha=0.9, double=False)
        # foam on the pool surface
        for k_ in range(5):
            X = lerp(low[0] + 30, low[0] + (far[0] - low[0]) * spread, k_ / 4)
            p1 = to_local(X - 14, lvl + 2); p2 = to_local(X, lvl - 6); p3 = to_local(X + 14, lvl + 2)
            line(cv, [p1, p2, p3], 3 / s * 1.6, '#FFFFFF', seed=('pf', k_), amp=0.4, alpha=0.9)
        cv.restore()
    if pour > 0:
        # inflow jet: enters horizontally through the wall, then falls under gravity (screen space)
        pg = ship_xf(PORT_L, pivot[0], pivot[1], s, heel)
        nx, ny = math.cos(a), math.sin(a)           # inward wall normal (local +x) in screen space
        L = 230 * pour
        P0 = pg
        P1 = (pg[0] + nx * L, pg[1] + ny * L)
        P2 = (P1[0] + 60 * pour, P1[1] + 190 * pour)
        top = bez(P0, P1, P2, 12)
        th = 36
        outer = [(x - ny * th * (1 - i / 14), y + nx * th * (1 - i / 14)) for i, (x, y) in enumerate(top)]
        inner = [(x + ny * th * 0.6 * (1 - i / 14), y - nx * th * 0.6 * (1 - i / 14)) for i, (x, y) in enumerate(top)]
        pts = [to_local(*p) for p in inner + outer[::-1]]
        shape(cv, pts, '#7FB3D9', '#3E6E9A', 3 / s * 1.6, seed='jet', amp=0.8, alpha=0.95)
        for k_ in range(4):
            u = (t * 2.4 + k_ * 0.25) % 1.0
            q = top[int(u * 12)]
            p1 = to_local(q[0] - 10, q[1] + 2); p2 = to_local(q[0], q[1] - 4); p3 = to_local(q[0] + 10, q[1] + 2)
            line(cv, [p1, p2, p3], 3 / s * 1.6, '#FFFFFF', seed=('jf', k_), amp=0.3, alpha=0.9)
        for k_ in range(6):
            u = (t * 3 + k_ * 0.17) % 1.0
            sx_ = P2[0] + (k_ - 2.5) * 12 + u * 25 * (1 if k_ % 2 else -1)
            sy_ = min(P2[1], lvl) - math.sin(u * math.pi) * 40
            q = to_local(sx_, sy_)
            circle(cv, q[0], q[1], 3.2, '#DCEEF7', '#3E6E9A', 1.2, seed=('fs', k_), alpha=(1 - u) * pour, double=False)


# ================================================================== SCENE 5 — sinking in front of the crowd
def heel_s5(t):
    return -lerp(30, 44, smooth(prog(t, 24.6, 28.6))) - math.sin(t * 2) * 0.8


def sink_s5(t):
    k = prog(t, 25.3, 28.9)
    return lerp(30, 690, ease_in(k) * 0.7 + smooth(k) * 0.3)


S5_X, S5_S = 560, 0.62


def scene5(cv, t, pan=0.0):
    heel = heel_s5(t); sink = sink_s5(t)
    zoom = lerp(1.25, 1.0, ease_out(prog(t, 24.76, 25.6)))
    cv.save()
    cam(cv, zoom, 540, 1150 + pan * 0, 540, 1150 - pan)

    def fx_front(c):
        splash(c, t, S5_X - 30, WL, 27.85, size=1.15, alpha=0.9)
        mt = ship_xf((-92, -885), S5_X, WL + sink * S5_S, S5_S, heel)
        ripples(c, t, S5_X - 60, WL + 6, 27.9, n=4, alpha=0.95, scale=1.5)
        if t > 26.5:
            for k_ in range(10):
                ph = (t * 0.8 + hsh('b5', k_)) % 1.0
                bubble(c, S5_X - 220 + hsh('bx5', k_) * 360, WL + 20 + (1 - ph) * 160, 5 + 7 * hsh('br5', k_), alpha=0.8 * (1 - ph), seed=('b5', k_))
    harbor(cv, t, heel, sink, ship_x=S5_X, ship_s=S5_S, sail=0.5, gust=0.25, bend=0.25, flag_wind=0.5,
           crowd_react=smooth(prog(t, 24.8, 25.6)), crowd_mode='head', crew_brace=1.0, extra_front=fx_front, far_react=1.0)
    cv.restore()
    return dict(heel=heel, sink=sink)


# ================================================================== SCENE 6 — 333 years later
UW_SURF = 520     # screen y of the surface while underwater
SEABED = 1560
SIDE_S = 0.72


def underwater_bg(cv, t, top, day):
    """world drawn with water surface at screen y=top"""
    deep = '#16323A'
    gradient_rect(cv, -50, top - 1300, W + 50, top, '#CDE3EC', '#F2F0E2', 14)
    tex_rect(cv, -50, top - 1300, W + 50, top, '#9CC0D6', 0.14)
    mid = mix_color('#1F4A52', '#2E6E70', day)
    gradient_rect(cv, -50, top, W + 50, top + 1400, mid, deep, 16)
    tex_rect(cv, -50, top, W + 50, top + 1400, '#0F2A30', 0.25, 1)
    # light rays
    for k_ in range(5):
        x = 120 + k_ * 230 + math.sin(t * 0.7 + k_) * 20
        a = (0.10 + 0.08 * math.sin(t * 1.3 + k_)) * (0.3 + 0.7 * day)
        pts = [(x - 30, top), (x + 30, top), (x + 170, top + 1000), (x + 40, top + 1000)]
        shape(cv, pts, '#CFEBD8', None, 0, seed=('ray', k_), amp=1, alpha=a, tex=True, opaque=False)
    # surface line
    line(cv, [(x, top + math.sin(x * 0.03 + t * 2) * 4) for x in range(-40, W + 60, 30)], 3.4, '#9FD0D8', seed='usl', amp=0.8, alpha=0.9)


def seabed(cv, t, y, mud_k=0.0):
    pts = [(-60, H + 60)] + [(x, y + math.sin(x * 0.012 + 0.6) * 26 + math.sin(x * 0.04) * 8 - mud_k * 20) for x in range(-60, W + 80, 40)] + [(W + 80, H + 60)]
    shape(cv, pts, '#5E5537', INK, 3.4, seed='bed', amp=1.4)
    hatch(cv, pts, '#3E3824', spacing=10, angle=0.25, lw=2, alpha=0.35, seed='bedh')
    for k_, (rx, rs) in enumerate([(90, 30), (180, 18), (860, 34), (960, 22), (420, 14)]):
        shape(cv, ellipse_pts(rx, y + 30, rs * 1.4, rs, 12), '#7C7A6E', INK, 2.6, seed=('rock', k_), amp=0.8, double=False)


def scene6(cv, t):
    TP0, TP1 = 29.62, 30.45           # pan down through the surface
    TJ = 32.05                         # jump forward
    TL0, TL1 = 32.35, 33.38            # lift to surface
    if t < TP1:
        k = ease_io(prog(t, TP0, TP1))
        # harbor slides up, underwater appears beneath the surface
        surf = lerp(WL, UW_SURF, k)
        cv.save(); cv.translate(0, surf - WL)
        scene5_end(cv, t)
        cv.restore()
        cv.save(); cv.translate(0, surf - UW_SURF)
        cv.clipRect(skia.Rect.MakeLTRB(-100, UW_SURF, W + 100, H + 2000))
        underwater_scene(cv, t, mast_k=1 - k)
        cv.restore()
        return
    if t < TL1 - 0.05:
        underwater_scene(cv, t)
        return
    above_scene(cv, t)


def scene5_end(cv, t):
    # frozen final state of the sinking with live water
    heel = heel_s5(29.6); sink = sink_s5(29.6) + (t - 29.6) * 40
    harbor(cv, t, heel, sink, ship_x=S5_X, ship_s=S5_S, sail=0.5, gust=0.2, bend=0.2, crowd_react=1.0, crowd_mode='head',
           extra_front=lambda c: ripples(c, t, S5_X - 60, WL + 6, 27.9, n=4, alpha=0.95, scale=1.5), far_react=1.0)


def mast_tip_screen():
    heel = heel_s5(29.6); sink = sink_s5(29.6)
    return ship_xf((-92, -885), S5_X, WL + sink * S5_S, S5_S, heel)


def underwater_scene(cv, t, mast_k=0.0):
    TJ = 32.05
    days = prog(t, 30.3, TJ)
    # day/night flicker accelerating
    cyc = (days ** 1.6) * 9.0
    day = 0.5 + 0.5 * math.cos(cyc * 2 * math.pi) if t > 30.3 else 1.0
    lift = ease_in(prog(t, 32.35, 33.38))
    cam_up = lift * 900       # camera pans up with the ship
    cv.save(); cv.translate(0, cam_up)
    underwater_bg(cv, t, UW_SURF, day)
    # sun / moon glimmer at the surface
    if 30.3 < t < TJ:
        gx = 540 + math.sin(cyc * math.pi) * 300
        gl = 0.6 * (1 - abs(days - 0.5) * 0.6)
        circle(cv, gx, UW_SURF - 40, 34, '#F6E7A8' if day > 0.5 else '#DDE3EE', INK_SOFT, 2.4, seed='sun', alpha=gl, double=False)
    mud = smooth(prog(t, 30.3, TJ)) * 0.55
    seabed(cv, t, SEABED, mud * 0.6)
    # seaweed (the first one grows out of the sinking mast)
    mx, my = mast_tip_screen()
    if mast_k > 0:
        # mast line transforming into seaweed: straight -> wavy
        pass
    # the sunken mast continues below the surface and turns into this seaweed strand
    mk = smooth(mast_k)
    h_sw = lerp(300, (SEABED + 20) - (UW_SURF - 60), mk)
    seaweed(cv, mx, SEABED + 20, h_sw, t, 1, color=mix_color('#4F8A5B', WOOD_D, mk), lw=lerp(7, 9, mk), sway=1 - mk, leaves=1 - mk)
    seaweed(cv, 900, SEABED + 30, 220, t, 2)
    seaweed(cv, 980, SEABED + 30, 160, t, 3, color='#5E9A62')
    seaweed(cv, 70, SEABED + 30, 150, t, 4, color='#5E9A62')
    # ship resting on the seabed (side view), rises during the lift
    rest_y = SEABED - 70
    sy = lerp(rest_y, UW_SURF + 40, lift)
    age = smooth(prog(t, 30.0, TJ))
    cv.save(); cv.translate(540, sy); cv.rotate(lerp(-4, 0, lift)); cv.scale(SIDE_S, SIDE_S)
    ship_side(cv, t, preserved=age > 0.25, sails=0, masts=lerp(1.0, 0.0, age), mud=mud, stumps=age > 0.6, sail_wave=0, flags=False)
    cv.restore()
    # bubbles -> time circles, calendar pages flowing upward
    if t > 30.0 and t < TJ + 0.25:
        fade = 1 - smooth(prog(t, TJ - 0.1, TJ + 0.25))
        for k_ in range(9):
            ph = ((t - 30.0) * (0.45 + 0.25 * hsh('tb', k_)) + hsh('tbp', k_)) % 1.0
            x = 140 + hsh('tbx', k_) * 800 + math.sin(t * 2 + k_) * 20
            y = SEABED - 150 - ph * 850
            morph = smooth((ph - 0.25) / 0.35)
            if morph < 1:
                bubble(cv, x, y, 9 + 10 * morph, alpha=(1 - morph) * fade, seed=('tb', k_))
            if morph > 0:
                time_circle(cv, x, y, 20 + 16 * morph, t * 3 + k_, morph * (1 - ph) * fade, ('tc', k_))
        speed = 1 + 4 * days
        for k_ in range(6):
            ph = ((t - 30.3) * 0.6 * speed / 2 + k_ / 6) % 1.0
            if t < 30.3:
                continue
            x = 540 + (hsh('cpx', k_) - 0.5) * 700
            y = SEABED - 250 - ph * 700
            calendar_page(cv, x, y, 0.9, (ph * 120 - 60) * (1 if k_ % 2 else -1), (1 - ph) * fade * smooth(ph * 5), ('cpg', k_))
    # time jump flash on "yıl sonra"
    if TJ - 0.05 < t < TJ + 0.3:
        a = math.sin(prog(t, TJ - 0.05, TJ + 0.3) * math.pi)
        p = skia.Paint(); p.setColor(C('#FBF7EC')); p.setAlphaf(0.35 * a)
        cv.drawRect(skia.Rect.MakeLTRB(-50, -2000, W + 50, H + 2000), p)
    # lifting rig: pontoons at the surface + cables down to the hull
    if t > 32.2:
        rk = smooth(prog(t, 32.2, 32.6))
        for sgn in (-1, 1):
            px = 540 + sgn * 330
            pontoon(cv, px, UW_SURF - 6, 220, 64, ('pp', sgn), alpha=rk)
            hull_attach = (540 + sgn * 230, sy + 60 * SIDE_S)
            cable_y_end = lerp(UW_SURF + 20, hull_attach[1], rk)
            for j in (-1, 1):
                line(cv, [(px + j * 40, UW_SURF + 20), (hull_attach[0] + j * 50, cable_y_end)], 4, '#2C2A33', seed=('cab', sgn, j), amp=0.4, alpha=rk)
    cv.restore()
    # mast -> seaweed morph on top during the pan
    if mast_k > 0:
        pass


def above_scene(cv, t):
    """1961: Vasa breaks the surface, held by pontoons and cranes."""
    k = ease_out(prog(t, 33.33, 34.3))
    surf = 1290
    # sky + far Stockholm
    gradient_rect(cv, -50, 300, W + 50, surf, '#CDE3EC', '#F2F0E2', 14)
    tex_rect(cv, -50, 300, W + 50, surf, '#9CC0D6', 0.14)
    for i, (x0, y0, s) in enumerate([(200, 640, 0.9), (820, 700, 1.1)]):
        cloud(cv, (x0 + t * 10) % 1300 - 100, y0, s, ('cl6', i))
    # far skyline (low, simple)
    sk = [(-50, surf - 40)] + [(x, surf - 40 - (30 + 40 * hsh('sky', x)) * (1 if (x // 60) % 2 else 0.6)) for x in range(-50, W + 60, 60)] + [(W + 60, surf - 40)]
    shape(cv, [(-50, surf + 5)] + sk + [(W + 60, surf + 5)], '#B8B9A6', INK_SOFT, 2.2, seed='sk6', amp=1.0, alpha=0.75, double=False)
    church(cv, 120, surf - 40, 0.55, 'sk6c', color='#D0C3A4')
    # water back
    gradient_rect(cv, -50, surf, W + 50, H + 50, WATER_TOP, WATER_BOT, 10)
    tex_rect(cv, -50, surf, W + 50, H + 50, '#4D84B0', 0.22, 1)
    # ship rising
    sy = lerp(surf + 260, surf - 10, k)
    cables_y = 300
    for sgn in (-1, 1):
        crane(cv, 540 + sgn * 370, surf + 30, 0.95, -sgn, ('cr', sgn), t=t)
    cv.save(); cv.translate(540, sy); cv.scale(0.66, 0.66)
    ship_side(cv, t, preserved=True, sails=0, stumps=True, mud=0.35 * (1 - k * 0.5), drip=k, sail_wave=0)
    cv.restore()
    # cables from crane jibs to the hull
    for sgn in (-1, 1):
        jx, jy = 540 + sgn * 370 + (-sgn) * 190 * 0.95, surf + 30 - 300 * 0.95
        ax, ay = 540 + sgn * 200, sy - 120
        line(cv, [(jx, jy), (ax, ay)], 4, '#2C2A33', seed=('ac', sgn), amp=0.4)
    water_front(cv, t, surf, alpha=0.82, foam_x=540, foam_w=500)
    splash(cv, t, 540, surf, 33.36, size=1.5, alpha=0.9)
    for sgn in (-1, 1):
        pontoon(cv, 540 + sgn * 330, surf + 18, 240, 70, ('pa', sgn))
    ripples(cv, t, 540, surf + 8, 33.4, n=3, scale=2.0)
    # sun burst behind the reveal
    sb = smooth(prog(t, 33.38, 33.9)) * (1 - smooth(prog(t, 34.5, 35.0)))
    if sb > 0:
        for j in range(12):
            a = j * math.pi / 6 + t * 0.2
            r0, r1 = 120, 200 + 30 * math.sin(t * 4 + j)
            cx, cy = 880, 560
            line(cv, [(cx + math.cos(a) * r0, cy + math.sin(a) * r0), (cx + math.cos(a) * r1, cy + math.sin(a) * r1)], 4, '#E3B13A', seed=('sb', j), alpha=sb * 0.8)
        circle(cv, 880, 560, 70, '#F6E3A0', '#E3B13A', 3, seed='sun6', alpha=sb)


# ================================================================== SCENE 7 — final card
def final_scene(cv, t, alpha=1.0):
    surf = 1410
    # subtle harbor background
    gradient_rect(cv, -50, 420, W + 50, surf, '#D5E7EE', '#F3EFE0', 12, alpha * 0.9)
    tex_rect(cv, -50, 420, W + 50, surf, '#9CC0D6', 0.12 * alpha)
    cv.saveLayerAlpha(None, int(255 * alpha * 0.75))
    sk = [(x, surf - 30 - (25 + 50 * hsh('fsk', x)) * (1 if (x // 70) % 2 else 0.5)) for x in range(-50, W + 70, 70)]
    shape(cv, [(-50, surf + 5)] + sk + [(W + 70, surf + 5)], '#C7C2A8', INK_SOFT, 2.0, seed='fsk', amp=1.0, double=False)
    church(cv, 150, surf - 30, 0.62, 'fch', color='#D8C9A6')
    castle(cv, 930, surf - 30, 0.6, 'fca')
    cv.restore()
    gradient_rect(cv, -50, surf, W + 50, H + 50, WATER_TOP, WATER_BOT, 10, alpha)
    tex_rect(cv, -50, surf, W + 50, H + 50, '#4D84B0', 0.22 * alpha, 1)
    cv.saveLayerAlpha(None, int(255 * alpha))
    bob = math.sin(t * 1.6) * 4
    split_x = 560
    SS = 0.86
    # left: 1628 painted ship with sails
    cv.save(); cv.clipRect(skia.Rect.MakeLTRB(-100, 0, split_x, H))
    cv.translate(560, surf + bob); cv.rotate(math.sin(t * 1.2) * 0.8); cv.scale(SS, SS)
    ship_side(cv, t, preserved=False, sails=1.0, flag_wind=0.4, sparkle_a=0.8)
    cv.restore()
    # right: preserved ship
    cv.save(); cv.clipRect(skia.Rect.MakeLTRB(split_x, 0, W + 100, H))
    cv.translate(560, surf + bob); cv.rotate(math.sin(t * 1.2) * 0.8); cv.scale(SS, SS)
    ship_side(cv, t, preserved=True, sails=0, stumps=True)
    cv.restore()
    # torn-paper seam
    seam = [(split_x + math.sin(y * 0.05) * 5, y) for y in range(560, surf + 150, 18)]
    line(cv, seam, 4, INK, seed='seam', amp=1.5, double=True)
    water_front(cv, t, surf, alpha=0.85)
    cv.restore()


# ================================================================== captions / overlays
CAP_TOP, CAP_BOT = 92, 440


def top_fade(cv, alpha=1.0):
    """paper header so captions read cleanly; fades into the scene"""
    p = skia.Paint()
    for i in range(18):
        y0 = 380 + i * 12
        p.setColor(C(PAPER)); p.setAlphaf(alpha * 0.92 * (1 - i / 18) ** 1.4)
        cv.drawRect(skia.Rect.MakeLTRB(0, y0, W, y0 + 12), p)
    p.setColor(C(PAPER)); p.setAlphaf(alpha * 0.92)
    cv.drawRect(skia.Rect.MakeLTRB(0, 0, W, 380), p)


_CAP_CACHE = {}


def caption_layout(idx):
    if idx in _CAP_CACHE:
        return _CAP_CACHE[idx]
    txt = SENTENCES[idx]
    size = 68
    while True:
        f = font('kalam_bold', size)
        lines = balance_wrap(txt, f, 960)
        lh = size * 1.16
        if len(lines) * lh <= (CAP_BOT - CAP_TOP) or size <= 50:
            break
        size -= 2
    assert ' '.join(lines) == txt, (lines, txt)
    _CAP_CACHE[idx] = (f, lines, lh, size)
    return _CAP_CACHE[idx]


def draw_caption(cv, idx, t_in, t):
    f, lines, lh, size = caption_layout(idx)
    a = 1.0 if idx == 0 else smooth((t - t_in) / 0.12)
    dy = 0.0 if idx == 0 else (1 - ease_out((t - t_in) / 0.25)) * 14
    block = len(lines) * lh
    y0 = CAP_TOP + ((CAP_BOT - CAP_TOP) - block) / 2 + size * 0.95
    for i, l in enumerate(lines):
        draw_text(cv, l, W / 2, y0 + i * lh + dy, f, INK, a)


def draw_final_caption(cv, t):
    f1 = font('kalam', 74)
    f2 = font('kalam_bold', 94)
    a1 = smooth((t - (T[6] - 0.03)) / 0.15)
    draw_text(cv, FINAL_L1, W / 2, 228 + (1 - ease_out((t - T[6]) / 0.3)) * 12, f1, '#7D76A6', a1)
    # second line written in as it is spoken
    t2 = 35.70
    a2 = smooth((t - t2) / 0.14)
    if a2 > 0:
        sc = lerp(1.08, 1.0, ease_out((t - t2) / 0.35))
        cv.save(); cv.translate(W / 2, 352); cv.scale(sc, sc)
        draw_text(cv, FINAL_L2, 0, 0, f2, '#1C1840', a2)
        cv.restore()
        # hand-drawn underline
        k = smooth(prog(t, 36.0, 36.6))
        if k > 0:
            P = wobble_pts([(170, 382), (540, 390), (910, 380)], False, 2, 'ul', 12)
            path = path_from(P, False)
            p = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=6, StrokeCap=skia.Paint.kRound_Cap)
            p.setColor(C('#C8483A')); p.setAlphaf(0.85)
            set_trim(p, k)
            cv.drawPath(path, p)


def watermark(cv, alpha=0.62):
    f = font('kalam', 30)
    txt = '@bugercektenyasandi'
    p = skia.Paint(AntiAlias=True)
    p.setColor(C(PAPER)); p.setAlphaf(alpha * 0.8)
    p.setStyle(skia.Paint.kStroke_Style); p.setStrokeWidth(6); p.setStrokeJoin(skia.Paint.kRound_Join)
    w_ = f.measureText(txt)
    cv.drawString(txt, W - 34 - w_, H - 34, f, p)
    draw_text(cv, txt, W - 34, H - 34, f, INK, alpha, align='right')


# ================================================================== frame
def render_frame(cv, t):
    cv.clear(C(PAPER))
    cv.drawImage(PAPER_IMG, 0, 0)
    if t < T[1]:
        scene1(cv, t)
    elif t < T[1] + 0.75:
        # S1 -> S2: harbor fades to paper while the last mast becomes the balance line
        k = smooth(prog(t, T[1], T[1] + 0.6))
        cv.saveLayerAlpha(None, int(255 * (1 - k)))
        scene1(cv, t)
        cv.restore()
        scene2_pre(cv, t, k)
    elif t < T[2] - 0.25:
        scene2(cv, t)
    elif t < T[2] + 0.35:
        k = smooth(prog(t, T[2] - 0.25, T[2] + 0.35))
        scene2(cv, min(t, T[2] - 0.02))
        mz = muzzle_point(min(t, T[2] - 0.02))
        # cannon barrel -> wind line, harbor revealed in a growing circle around it
        R = 30 + 1500 * ease_in(k)
        cv.save()
        path = skia.Path(); path.addCircle(mz[0], mz[1], R)
        cv.clipPath(path, doAntiAlias=True)
        cv.drawImage(PAPER_IMG, 0, 0)
        scene3(cv, max(t, T[2]))
        cv.restore()
        f = swirl_fn(mz[0], mz[1], W + 80, mz[1] - 60, curl=1.0, loopr=40, loopu=0.55, amp=30)
        head = clamp(prog(t, T[2] - 0.25, T[2] + 0.1) * 1.2)
        wind_line(cv, f, t, 0, 1, 'mz', lw=5, alpha=1.0, head=head, tail=clamp(head - 0.6) * (1 - k))
    elif t < T[3]:
        scene3(cv, t)
    elif t < T[4]:
        scene4(cv, t)
    elif t < T[4] + 0.5:
        k = smooth(prog(t, T[4], T[4] + 0.5))
        scene5(cv, t)
        cv.saveLayerAlpha(None, int(255 * (1 - k)))
        cv.drawImage(PAPER_IMG, 0, 0)
        section_closeup(cv, t)
        cv.restore()
    elif t < 29.62:
        scene5(cv, t)
    elif t < 34.2:
        scene6(cv, t)
    else:
        # cables become the frame border, final composition fades in
        k = smooth(prog(t, 34.2, 35.0))
        if k < 1:
            cv.saveLayerAlpha(None, int(255 * (1 - k)))
            above_scene(cv, t)
            cv.restore()
        final_scene(cv, t, alpha=k)
        rk = smooth(prog(t, 34.25, 35.1))
        rope_border(cv, rk, t)
        # the two lifting cables swing out and become the sides of the frame
        if rk < 1:
            for sgn in (-1, 1):
                surf = 1290
                jx, jy = 540 + sgn * 370 + (-sgn) * 190 * 0.95, surf + 30 - 300 * 0.95
                ax, ay = 540 + sgn * 200, surf - 130
                bx = 34 if sgn < 0 else W - 34
                m = ease_io(prog(t, 34.2, 34.9))
                p0 = (lerp(jx, bx, m), lerp(jy, 470, m)); p1 = (lerp(ax, bx, m), lerp(ay, H - 28, m))
                line(cv, [p0, p1], lerp(4, 7, m), lerp_hex('#2C2A33', '#8C6B45', m), seed=('cb2', sgn), amp=0.6, alpha=1 - smooth(prog(t, 34.85, 35.1)))
    # paper grain over everything
    pm = skia.Paint(BlendMode=skia.BlendMode.kMultiply)
    cv.drawImage(GRAIN_IMG, 0, 0, skia.SamplingOptions(), pm)
    # captions
    top_fade(cv, 1.0)
    idx = sum(1 for x in T if t >= x - 0.03) - 1
    if idx < 6:
        draw_caption(cv, idx, T[idx] - 0.03, t)
    else:
        draw_final_caption(cv, t)
    watermark(cv, 0.62 if t < T[6] else 0.8)


def scene2_pre(cv, t, k):
    """mast (still poking out of the water) rotates into the balance line"""
    heel = heel_s1(T[1]); sink = sink_s1(T[1])
    a = ship_xf((-92, -885), SHIP_X, WL + sink * SHIP_S, SHIP_S, heel)
    b = ship_xf((-92, -600), SHIP_X, WL + sink * SHIP_S, SHIP_S, heel)
    m = ease_io(prog(t, T[1] + 0.05, T[1] + 0.6))
    p0 = (lerp(b[0], 70, m), lerp(b[1], GROUND_Y, m))
    p1 = (lerp(a[0], W - 70, m), lerp(a[1], GROUND_Y, m))
    if m < 1:
        line(cv, [p0, p1], lerp(5, 6, m), INK, seed='mast2line', amp=1.0, double=True)
    if t > T[1] + 0.3:
        cv.saveLayerAlpha(None, int(255 * smooth(prog(t, T[1] + 0.3, T[1] + 0.7))))
        scene2(cv, t)
        cv.restore()


PAPER_IMG = None
GRAIN_IMG = None


def init():
    global PAPER_IMG, GRAIN_IMG
    PAPER_IMG = skia.Image.fromarray(make_paper(), colorType=skia.kRGBA_8888_ColorType)
    GRAIN_IMG = skia.Image.fromarray(make_grain(), colorType=skia.kRGBA_8888_ColorType)
    for i in range(6):
        caption_layout(i)
