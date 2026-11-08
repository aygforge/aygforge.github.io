"""Illustrated objects: barrels, people, trucks, forklifts, buildings, money..."""
from lib import *


# ------------------------------------------------------------------ barrels
def barrel(cv, x, y, w=120, h=160, lid='closed', fill_level=None, liquid=AMBER, open_amt=0.0, sw=4,
           tint=None, alpha=1.0, highlight=True, crack=0.0, cutaway=False, empty_dark=False):
    """Upright steel drum. origin = bottom center (x,y)."""
    ry = w * 0.15
    top = y - h
    l, r = x - w / 2, x + w / 2
    bulge = w * 0.035
    body = []
    n = 8
    for i in range(n + 1):  # left side top->bottom
        k = i / n
        body.append((l - bulge * math.sin(math.pi * k), lerp(top, y, k)))
    for p in ellipse_pts(x, y, w / 2, ry, 12, math.pi, 0)[1:-1][::-1]:
        body.append(p)
    body = body[:n + 1]
    bottom_arc = [(x + w / 2 * math.cos(a), y + ry * math.sin(a)) for a in np.linspace(math.pi, 0, 12)]
    for i in range(n + 1):
        k = 1 - i / n
        pass
    right = [(r + bulge * math.sin(math.pi * (1 - i / n)), lerp(y, top, i / n)) for i in range(n + 1)]
    top_front = [(x + w / 2 * math.cos(a), top + ry * math.sin(a)) for a in np.linspace(0, math.pi, 12)]
    outline = body + bottom_arc[1:-1] + right + top_front[1:-1]
    base = tint or STEEL
    sh = lin_grad(l, 0, r, 0, [mix(base, INK, 0.25), mix(base, '#FFFFFF', 0.45), base, mix(base, INK, 0.3)])
    if cutaway:
        # interior view: back wall darker
        shape(cv, outline, mix(base, INK, 0.45), INK, sw, smooth=True, jit=1.2, alpha=alpha, hatch_on=True)
        if fill_level is not None and fill_level > 0.001:
            ly = lerp(y, top, fill_level)
            liq = [(l + 6, ly)] + [(l + 6, y - 2)] + [(x + (w / 2 - 6) * math.cos(a), y + (ry - 4) * math.sin(a)) for a in np.linspace(math.pi, 0, 10)] + [(r - 6, ly)]
            liq += [(x + (w / 2 - 6) * math.cos(a), ly + (ry - 3) * math.sin(a)) for a in np.linspace(0, math.pi, 10)]
            if isinstance(liquid, tuple):
                shd = lin_grad(l, 0, r, 0, list(liquid))
                shape(cv, liq, liquid[0], None, 0, jit=0.8, alpha=alpha, fill_shader=shd, spacing=11)
            else:
                shd = lin_grad(0, ly, 0, y, [mix(liquid, '#FFFFFF', 0.3), liquid, mix(liquid, INK, 0.3)])
                shape(cv, liq, liquid, None, 0, jit=0.8, alpha=alpha, fill_shader=shd, spacing=11)
            ellipse(cv, x, ly, w / 2 - 6, ry - 3, mix(liquid if not isinstance(liquid, tuple) else liquid[1], '#FFFFFF', 0.35), INK, 2.5, alpha=alpha, hatch_on=False)
        # cut edges
        line(cv, [(l, top), (l - bulge, (top + y) / 2), (l, y)], INK, sw, a=alpha)
        line(cv, [(r, top), (r + bulge, (top + y) / 2), (r, y)], INK, sw, a=alpha)
        ellipse(cv, x, top, w / 2, ry, None, INK, sw * 0.8, alpha=alpha)
        return
    if lid != 'closed' and open_amt > 0:  # lid hinged at back-right, tilted up behind opening
        cv.save()
        cv.translate(x + w * 0.42, top - ry * 0.6)
        cv.rotate(-open_amt * 38)
        lh = ry + (w / 2 - ry) * open_amt
        ellipse(cv, -w / 2 + w * 0.08, -lh * 0.75, w / 2, lh, mix(base, '#FFFFFF', 0.3), INK, sw, alpha=alpha, hatch_on=False)
        ellipse(cv, -w / 2 + w * 0.08, -lh * 0.75, w / 2 - w * 0.07, lh - w * 0.04, None, mix(base, INK, 0.5), sw * 0.5, alpha=alpha)
        cv.restore()
    shape(cv, outline, base, INK, sw, smooth=True, jit=1.3, alpha=alpha, fill_shader=sh, spacing=10)
    # ribs
    for k in (0.33, 0.66):
        ry2 = y - h * k
        rib = [(x + (w / 2 + bulge * 0.8) * math.cos(a), ry2 + ry * math.sin(a)) for a in np.linspace(math.pi, 0, 14)]
        line(cv, rib, INK, sw * 0.75, a=alpha * 0.9)
        rib2 = [(px, py + 5) for px, py in rib]
        line(cv, rib2, mix(base, INK, 0.4), sw * 0.5, a=alpha * 0.6)
    if highlight:
        line(cv, [(l + w * 0.18, top + h * 0.12), (l + w * 0.16, top + h * 0.3)], '#FFFFFF', sw * 1.2, a=0.7 * alpha)
        line(cv, [(l + w * 0.18, top + h * 0.4), (l + w * 0.17, top + h * 0.6)], '#FFFFFF', sw * 1.0, a=0.5 * alpha)
    # top
    if lid == 'closed':
        ellipse(cv, x, top, w / 2, ry, mix(base, '#FFFFFF', 0.3), INK, sw, alpha=alpha, hatch_on=False)
        ellipse(cv, x, top, w / 2 - w * 0.07, ry - w * 0.03, None, mix(base, INK, 0.5), sw * 0.5, alpha=alpha)
        ellipse(cv, x + w * 0.22, top, w * 0.05, w * 0.022, mix(base, INK, 0.3), INK, sw * 0.5, alpha=alpha, hatch_on=False)
    else:  # open: show liquid surface
        ellipse(cv, x, top, w / 2, ry, mix(base, INK, 0.3), INK, sw, alpha=alpha, hatch_on=False)
        if empty_dark:
            ellipse(cv, x, top + 2, w / 2 - 7, ry - 4, mix(INK, base, 0.2), None, 0, alpha=alpha)
        else:
            shd = skia.GradientShader.MakeRadial(skia.Point(x - w * 0.12, top - ry * 0.2), w * 0.55,
                                                 [col(AMBER_L), col(AMBER), col(AMBER_D)])
            ellipse(cv, x, top + 2, w / 2 - 7, ry - 4, AMBER, None, 0, alpha=alpha, fill_shader=shd, hatch_on=True)
            # gloss
            line(cv, ellipse_pts(x - w * 0.08, top - 1, w * 0.22, ry * 0.35, 8, math.pi * 1.1, math.pi * 1.6), '#FFF6D8', sw * 1.1, a=0.85 * alpha)
    if crack > 0:
        cp = [(x - w * 0.1, top + ry * 0.6), (x - w * 0.05, top + h * 0.12), (x - w * 0.13, top + h * 0.2),
              (x - w * 0.06, top + h * 0.3), (x - w * 0.1, top + h * 0.38)]
        k = int(1 + crack * (len(cp) - 1))
        line(cv, cp[:k + 1], INK, sw * 0.8, smooth=False, a=alpha)
        if crack > 0.7:
            # syrup oozing from crack
            ooze = (crack - 0.7) / 0.3
            dp = [(x - w * 0.07, top + h * 0.15), (x - w * 0.02, top + h * 0.2), (x - w * 0.03, top + h * (0.2 + 0.3 * ooze)),
                  (x - w * 0.1, top + h * (0.2 + 0.3 * ooze)), (x - w * 0.11, top + h * 0.2)]
            shape(cv, dp, AMBER, INK, sw * 0.6, jit=0.8, alpha=alpha)


def barrel_top(cv, x, y, r, alpha=1.0, sw=3, state='closed'):
    """Top-down drum seen from above."""
    if state == 'ghost':
        p = strokep(INK, sw * 0.8, 0.35 * alpha)
        p.setPathEffect(skia.DashPathEffect.Make([r * 0.25, r * 0.18], CTX.boil * 2.0))
        cv.drawPath(mkpath(jitter(ellipse_pts(x, y, r * 0.95, r * 0.95, 18), 1.0, CTX.next())), p)
        return
    shd = skia.GradientShader.MakeRadial(skia.Point(x - r * 0.35, y - r * 0.35), r * 1.5,
                                         [col(STEEL_L), col(STEEL), col(STEEL_D)])
    ellipse(cv, x, y, r, r, STEEL, INK, sw, n=18, alpha=alpha, fill_shader=shd, spacing=8)
    ellipse(cv, x, y, r * 0.8, r * 0.8, None, mix(STEEL, INK, 0.5), sw * 0.55, n=16, alpha=alpha)
    ellipse(cv, x + r * 0.42, y - r * 0.15, r * 0.13, r * 0.13, STEEL_D, INK, sw * 0.5, n=8, alpha=alpha, hatch_on=False)


def barrel_lying(cv, x, y, w=170, h=120, rot=0.0, sw=4, alpha=1.0, base=None):
    """Drum on its side, rolling toward +x. origin = ground contact center. rot = roll angle (rad)."""
    base = base or STEEL
    ry = h / 2
    ex = w * 0.16
    cy = y - ry
    l, r = x - w / 2, x + w / 2 - ex
    body = [(l, cy - ry), (r, cy - ry)] + [(r + ex * math.cos(a), cy + ry * math.sin(a)) for a in np.linspace(-math.pi / 2, math.pi / 2, 10)][1:-1] + [(r, cy + ry), (l, cy + ry)]
    body += [(l - ex * math.cos(a) * 0.9, cy + ry * math.sin(a)) for a in np.linspace(math.pi / 2, -math.pi / 2, 10)][1:-1]
    shd = lin_grad(0, cy - ry, 0, cy + ry, [mix(base, '#FFFFFF', 0.4), base, mix(base, INK, 0.3)])
    shape(cv, body, base, INK, sw, smooth=True, jit=1.2, alpha=alpha, fill_shader=shd, spacing=10, hangle=20)
    # ribs scroll with rotation (vertical arcs)
    for k0 in (0.33, 0.66):
        rx_ = l + (r - l) * k0
        line(cv, [(rx_ + ex * 0.8 * math.cos(a), cy + ry * math.sin(a)) for a in np.linspace(-math.pi / 2, math.pi / 2, 10)], INK, sw * 0.7, a=alpha)
    # end cap
    ellipse(cv, r, cy, ex, ry, mix(base, '#FFFFFF', 0.2), INK, sw, alpha=alpha, hatch_on=False)
    bx = r + ex * 0.55 * math.cos(rot)
    by = cy + ry * 0.55 * math.sin(rot)
    ellipse(cv, bx, by, ex * 0.18, ry * 0.12, STEEL_D, INK, sw * 0.5, alpha=alpha, hatch_on=False)
    # roll streak marks
    for j in range(3):
        a = rot + j * 2.1
        yy = cy + ry * 0.8 * math.sin(a)
        if math.cos(a) > 0:
            line(cv, [(l + 15, yy), (r - 15, yy)], mix(base, INK, 0.35), sw * 0.5, a=0.5 * alpha * math.cos(a))


_SPRITES = {}


def sprite(kind, variant):
    key = (kind, variant)
    if key in _SPRITES:
        return _SPRITES[key]
    S = 2.0
    if kind == 'up':
        sw_, sh_ = 160, 200
        surf = skia.Surface(int(sw_ * S), int(sh_ * S))
        c = surf.getCanvas()
        c.clear(skia.ColorTRANSPARENT)
        c.scale(S, S)
        old = CTX.boil
        CTX.boil = variant * 3 + 1
        barrel(c, sw_ / 2, sh_ - 18, 120, 160, sw=3.6)
        CTX.boil = old
    elif kind == 'top':
        sw_, sh_ = 120, 120
        surf = skia.Surface(int(sw_ * S), int(sh_ * S))
        c = surf.getCanvas()
        c.clear(skia.ColorTRANSPARENT)
        c.scale(S, S)
        old = CTX.boil
        CTX.boil = variant * 3 + 2
        barrel_top(c, 60, 60, 50, sw=3.2)
        CTX.boil = old
    img = surf.makeImageSnapshot()
    _SPRITES[key] = (img, sw_, sh_)
    return _SPRITES[key]


SAMP = skia.SamplingOptions(skia.FilterMode.kLinear, skia.MipmapMode.kLinear)


def barrel_sprite(cv, x, y, scale=1.0, alpha=1.0, kind='up'):
    """x,y = bottom center for 'up' (barrel bottom at y), center for 'top'."""
    img, sw_, sh_ = sprite(kind, CTX.boil % 3)
    if kind == 'up':
        w, h = sw_ * scale, sh_ * scale
        r = skia.Rect(x - w / 2, y - h + 18 * scale, x + w / 2, y + 18 * scale)
    else:
        w, h = sw_ * scale, sh_ * scale
        r = skia.Rect(x - w / 2, y - h / 2, x + w / 2, y + h / 2)
    p = skia.Paint()
    if alpha < 1:
        p.setAlphaf(clamp(alpha))
    cv.drawImageRect(img, r, SAMP, p)


# ------------------------------------------------------------------ people
def person(cv, x, y, s=1.0, body=SHADOW, head=None, hat='beanie', lean=0.0, walk=None, hands=None, facing=1,
           alpha=1.0, vest=None, eyes=True, clipboard=False, hat_col=None, legs_col=None, mouth=None, brow=0.0,
           head_tilt=0.0, sw=4):
    """Origin at feet center. hands: list of two (x,y) targets in local coords (facing +x)."""
    cv.save()
    cv.translate(x, y)
    cv.scale(s * facing, s)
    head = head or body
    legs_col = legs_col or mix(body, INK, 0.3)
    hip = (0, -92)
    if walk is not None:
        f1 = (math.sin(walk) * 24, -max(0, math.cos(walk)) * 12)
        f2 = (-math.sin(walk) * 24, -max(0, -math.cos(walk)) * 12)
    else:
        f1, f2 = (12, 0), (-12, 0)
    for f in (f2, f1):
        knee = ((hip[0] + f[0]) / 2 + 6, (hip[1] + f[1]) / 2)
        line(cv, [hip, knee, f], legs_col, 19, jit=0.8, a=alpha)
        line(cv, [(f[0] - 4, f[1] - 2), (f[0] + 16, f[1] - 2)], INK, 13, jit=0.6, a=alpha)
    la = math.radians(lean)

    def rot(px, py):
        dx, dy = px - hip[0], py - hip[1]
        return (hip[0] + dx * math.cos(la) - dy * math.sin(la), hip[1] + dx * math.sin(la) + dy * math.cos(la))
    torso = [rot(px, py) for px, py in rrect_pts(-27, -188, 54, 104, 20, 4)]
    shape(cv, torso, body, INK, sw, jit=1.3, alpha=alpha, spacing=8)
    if vest:
        vt = [rot(px, py) for px, py in [(-22, -175), (22, -175), (22, -100), (-22, -100)]]
        shape(cv, vt, vest, INK, sw * 0.7, smooth=False, jit=1.0, alpha=alpha, spacing=8)
        line(cv, [rot(-22, -140), rot(22, -140)], '#F6F1E1', 5, a=alpha)
    sh = rot(4, -172)
    hd = rot(2, -214)
    # arms
    if hands is None:
        sway = math.sin(walk) * 16 if walk is not None else 0
        hands = [(18 + sway, -108), (-10 - sway, -110)]
    for hnd in hands[::-1]:
        el = ((sh[0] + hnd[0]) / 2 - 4, (sh[1] + hnd[1]) / 2 + 8)
        line(cv, [sh, el, hnd], mix(body, INK, 0.15), 15, jit=0.8, a=alpha)
        ellipse(cv, hnd[0], hnd[1], 8, 8, head if head != body else mix(body, INK, 0.2), INK, 2.5, n=8, alpha=alpha, hatch_on=False)
    if clipboard:
        hx, hy = hands[0]
        rect(cv, hx - 6, hy - 46, 40, 52, '#F8F3E6', INK, 3, alpha=alpha, hatch_on=False)
        rect(cv, hx + 6, hy - 50, 16, 8, STEEL_D, INK, 2, alpha=alpha, hatch_on=False)
        for k in range(4):
            line(cv, [(hx, hy - 34 + k * 9), (hx + 26 - (k % 2) * 8, hy - 34 + k * 9)], INK2, 2, jit=0.8, a=alpha * 0.8)
    # head
    cv.save()
    cv.translate(*hd)
    cv.rotate(head_tilt)
    ellipse(cv, 0, 0, 25, 27, head, INK, sw, n=14, alpha=alpha, hatch_on=(head == body))
    if eyes:
        ec = '#F6F1E1' if head == body else INK
        ex = 9
        ellipse(cv, ex, -2, 3.6, 4.4, ec, None, 0, n=8, alpha=alpha, hatch_on=False)
        ellipse(cv, ex + 11, -2, 3.2, 4.0, ec, None, 0, n=8, alpha=alpha, hatch_on=False)
        if brow:
            line(cv, [(ex - 4, -11 - brow * 5), (ex + 4, -12 - brow * 7)], INK, 2.6, a=alpha)
            line(cv, [(ex + 8, -12 - brow * 7), (ex + 15, -10 - brow * 5)], INK, 2.6, a=alpha)
        if mouth == 'o':
            ellipse(cv, ex + 5, 11, 3.5, 4.5, INK, None, 0, n=8, alpha=alpha, hatch_on=False)
        elif mouth == 'flat':
            line(cv, [(ex, 11), (ex + 10, 11)], INK, 2.5, a=alpha)
    hc = hat_col
    if hat == 'beanie':
        hc = hc or mix(body, INK, 0.25)
        shape(cv, [(-26, -6)] + ellipse_pts(0, -6, 26, 26, 10, math.pi, math.tau)[1:-1] + [(26, -6)], hc, INK, sw * 0.8, alpha=alpha, spacing=6)
        ellipse(cv, 0, -34, 7, 7, hc, INK, 2.5, n=8, alpha=alpha, hatch_on=False)
    elif hat == 'hardhat':
        hc = hc or AMBER_L
        shape(cv, [(-28, -8)] + ellipse_pts(0, -8, 26, 25, 10, math.pi, math.tau)[1:-1] + [(28, -8), (40, -6), (40, -2), (-28, -2)],
              hc, INK, sw * 0.8, alpha=alpha, smooth=False, spacing=7)
    elif hat == 'cap':
        hc = hc or '#2E3A5E'
        shape(cv, [(-26, -10), (-24, -30), (0, -38), (26, -30), (28, -12), (44, -8), (40, -4), (-26, -6)], hc, INK, sw * 0.8,
              alpha=alpha, smooth=False, spacing=6)
        line(cv, [(-24, -14), (28, -14)], AMBER_L, 3, a=alpha)
    cv.restore()
    cv.restore()


# ------------------------------------------------------------------ vehicles
def wheel(cv, x, y, r, rot, alpha=1.0, sw=4):
    ellipse(cv, x, y, r, r, '#3B3A4A', INK, sw, n=14, alpha=alpha, spacing=7)
    ellipse(cv, x, y, r * 0.5, r * 0.5, STEEL, INK, sw * 0.6, n=10, alpha=alpha, hatch_on=False)
    for k in range(3):
        a = rot + k * math.tau / 3
        line(cv, [(x, y), (x + r * 0.45 * math.cos(a), y + r * 0.45 * math.sin(a))], INK, 2.5, a=alpha)


def truck(cv, x, y, s=1.0, wrot=0.0, lights=False, facing=1, alpha=1.0, cab=GREEN, box=STEEL_L, open_back=0.0,
          cargo=0, silhouette=False, exhaust_t=None):
    cv.save()
    cv.translate(x, y)
    cv.scale(s * facing, s)
    if silhouette:
        cab = box = SHADOW
    soft_shadow(cv, 0, 2, 270, 12, 0.2 * alpha)
    # box
    rect(cv, -265, -270, 345, 215, box, INK, 4.5, alpha=alpha, spacing=11)
    if not silhouette:
        line(cv, [(-255, -95), (70, -95)], cab, 9, a=alpha * 0.9)
        for k in range(1, 5):
            line(cv, [(-265 + k * 69, -262), (-265 + k * 69, -62)], mix(box, INK, 0.25), 2, a=alpha * 0.7)
    if open_back > 0:
        rect(cv, -262, -264, 60 * open_back + 4, 205, mix(INK, AMBER_D, 0.15), INK, 3, alpha=alpha)
        for i in range(min(cargo, 2)):
            barrel(cv, -238 + i * 0, -66 - i * 0, 40, 60, sw=2.5, alpha=alpha * open_back)
    # cab
    cabp = [(80, -205), (175, -205), (232, -130), (240, -55), (80, -55)]
    shape(cv, cabp, cab, INK, 4.5, smooth=False, alpha=alpha, spacing=9)
    if not silhouette:
        shape(cv, [(100, -190), (168, -190), (210, -132), (100, -132)], '#CFE6EE', INK, 3.5, smooth=False, alpha=alpha, hatch_on=False)
        line(cv, [(118, -180), (130, -145)], '#FFFFFF', 4, a=0.7 * alpha)
        line(cv, [(120, -110), (140, -110)], INK, 3, a=alpha)
    rect(cv, 225, -78, 20, 14, '#FFF3C0' if lights else STEEL, INK, 2.5, alpha=alpha, hatch_on=False)
    if lights:
        glow(cv, 250, -71, 50, '#FFE9A0', 0.55 * alpha)
        p = skia.Paint(Color=col('#FFEFB8', 0.28 * alpha), AntiAlias=True, MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 14))
        pp = skia.Path(); pp.moveTo(245, -78); pp.lineTo(560, -150); pp.lineTo(560, 20); pp.close()
        cv.drawPath(pp, p)
    rect(cv, -270, -70, 14, 14, RED, INK, 2.5, alpha=alpha, hatch_on=False)
    line(cv, [(-268, -52), (245, -52)], INK, 6, a=alpha)
    for wx in (-180, -100, 170):
        wheel(cv, wx, -30, 32, wrot, alpha)
    if exhaust_t is not None:
        for k in range(4):
            ph = (exhaust_t * 1.4 + k / 4) % 1
            ellipse(cv, -280 - ph * 90, -40 - ph * 40, 10 + ph * 22, 8 + ph * 16, '#E9E4DA', INK, 2, alpha=alpha * (1 - ph) * 0.8, hatch_on=False)
    cv.restore()


def forklift(cv, x, y, s=1.0, fork_h=0.0, wrot=0.0, cargo=True, facing=1, alpha=1.0, body=AMBER_L, driver=True):
    cv.save()
    cv.translate(x, y)
    cv.scale(s * facing, s)
    soft_shadow(cv, 20, 2, 140, 10, 0.18 * alpha)
    # mast
    rect(cv, 70, -250, 16, 230, STEEL_D, INK, 3.5, alpha=alpha, hatch_on=False)
    rect(cv, 92, -250, 10, 230, STEEL_D, INK, 3, alpha=alpha, hatch_on=False)
    fy = -28 - fork_h
    line(cv, [(100, fy - 50), (100, fy), (190, fy)], '#5A5A6A', 7, smooth=False, a=alpha)
    if cargo:
        barrel(cv, 148, fy - 4, 72, 96, sw=3, alpha=alpha)
    # guard
    line(cv, [(-40, -90), (-30, -215), (60, -215), (68, -100)], INK, 6, smooth=False, a=alpha)
    if driver:
        person(cv, 10, -82, 0.55, body=GREEN, head=SKIN, hat='hardhat', hands=[(60, -120), (50, -118)], alpha=alpha, eyes=True)
    # body
    shape(cv, [(-85, -110), (-40, -112), (-30, -88), (68, -88), (72, -20), (-90, -20)], body, INK, 4.5, smooth=False, alpha=alpha, spacing=9)
    rect(cv, -95, -95, 30, 70, mix(body, INK, 0.45), INK, 3, alpha=alpha)
    wheel(cv, 40, -22, 28, wrot, alpha)
    wheel(cv, -55, -18, 20, wrot * 1.4, alpha)
    cv.restore()


# ------------------------------------------------------------------ bits
def banknote(cv, x, y, w=150, h=72, rot=0.0, alpha=1.0, sw=3):
    cv.save()
    cv.translate(x, y)
    cv.rotate(rot)
    rect(cv, -w / 2, -h / 2, w, h, MONEY, MONEY_D, sw, alpha=alpha, spacing=7, hangle=30)
    rect(cv, -w / 2 + 7, -h / 2 + 7, w - 14, h - 14, None, MONEY_D, sw * 0.5, alpha=alpha)
    ellipse(cv, 0, 0, h * 0.3, h * 0.3, mix(MONEY, '#FFFFFF', 0.4), MONEY_D, sw * 0.6, n=12, alpha=alpha, hatch_on=False)
    maple_leaf(cv, 0, 0, h * 0.2, MONEY_D, None, 0, alpha=alpha, hatch_on=False)
    ellipse(cv, -w * 0.33, 0, h * 0.12, h * 0.12, None, MONEY_D, sw * 0.5, n=8, alpha=alpha)
    ellipse(cv, w * 0.33, 0, h * 0.12, h * 0.12, None, MONEY_D, sw * 0.5, n=8, alpha=alpha)
    cv.restore()


def money_bundle(cv, x, y, w=150, h=70, alpha=1.0):
    """front-ish view of a stack of notes; origin bottom center."""
    for k in range(4):
        rect(cv, x - w / 2, y - h + k * 4 - 12, w, h - k * 4, mix(MONEY, MONEY_D, 0.15 * k), MONEY_D, 2.5, alpha=alpha, spacing=7)
    rect(cv, x - w / 2, y - h - 14, w, 22, MONEY, MONEY_D, 3, alpha=alpha, spacing=7)
    rect(cv, x - 14, y - h - 16, 28, h + 4, AMBER_L, INK, 2.5, alpha=alpha, hatch_on=False)


def snow(cv, t, n=70, seed=1, a=0.9, area=(0, 0, W, H), dark=False, size=1.0, speed=1.0):
    x0, y0, x1, y1 = area
    for i in range(n):
        sx = (hsh(i, seed) + 1) / 2
        sy = (hsh(i + 500, seed) + 1) / 2
        sp = (0.5 + 0.5 * (hsh(i + 900, seed) + 1) / 2) * speed
        r = (3 + 4 * (hsh(i + 77, seed) + 1) / 2) * size
        y = y0 + ((sy * (y1 - y0) + t * 110 * sp) % (y1 - y0))
        x = x0 + sx * (x1 - x0) + math.sin(t * 1.3 + i) * 18
        if dark:
            cv.drawCircle(x, y, r, fillp(SNOW, a))
        else:
            cv.drawCircle(x, y, r, fillp('#FFFFFF', a))
            cv.drawCircle(x, y, r, strokep(STEEL_D, 1.2, a * 0.7))


def pine(cv, x, y, h, alpha=1.0, c=GREEN, snowcap=True):
    w = h * 0.42
    for k in range(3):
        ty = y - h + k * h * 0.26
        bw = w * (0.55 + k * 0.25)
        pts = [(x, ty), (x + bw, ty + h * 0.42), (x - bw, ty + h * 0.42)]
        shape(cv, pts, c, INK, 3, smooth=False, alpha=alpha, spacing=7)
        if snowcap:
            line(cv, [(x - bw * 0.35, ty + h * 0.16), (x, ty + h * 0.05), (x + bw * 0.35, ty + h * 0.16)], SNOW, 6, a=alpha)
    rect(cv, x - w * 0.1, y - h * 0.12, w * 0.2, h * 0.14, WOOD, INK, 2.5, alpha=alpha, hatch_on=False)


def scribble_lines(cv, x, y, w, rows, gap=18, c=INK2, a=0.8, sw=2.6, seed=0):
    for k in range(rows):
        ww = w * (0.55 + 0.45 * (hsh(k, seed) + 1) / 2)
        pts = []
        n = 8
        for i in range(n + 1):
            pts.append((x + ww * i / n, y + k * gap + 2.5 * hsh(i + k * 10, seed + 3)))
        line(cv, pts, c, sw, jit=0.6, a=a)


def light_cone(cv, x, y, w, h, a=0.25, c='#FFE7A8'):
    p = skia.Paint(AntiAlias=True, MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 18))
    p.setShader(lin_grad(x, y, x, y + h, ['#00000000'.replace('#00000000', c), c]))
    p.setShader(skia.GradientShader.MakeLinear([skia.Point(x, y), skia.Point(x, y + h)], [col(c, a), col(c, 0)]))
    pp = skia.Path()
    pp.moveTo(x - 20, y); pp.lineTo(x + 20, y); pp.lineTo(x + w / 2, y + h); pp.lineTo(x - w / 2, y + h); pp.close()
    cv.drawPath(pp, p)


def lamp(cv, x, y, lit=1.0, alpha=1.0):
    line(cv, [(x, y - 120), (x, y - 20)], INK, 3, a=alpha)
    shape(cv, [(x - 34, y), (x - 18, y - 24), (x + 18, y - 24), (x + 34, y)], GREEN, INK, 3, smooth=False, alpha=alpha, spacing=6)
    if lit > 0:
        glow(cv, x, y + 6, 26, '#FFE9A0', 0.7 * lit * alpha)


def calendar(cv, x, y, s, t_flip, n_pages=1, alpha=1.0):
    """calendar pad; t_flip continuous number of flips done (fraction = in-flight)."""
    cv.save()
    cv.translate(x, y)
    cv.scale(s, s)
    w, h = 170, 190
    rect(cv, -w / 2 + 6, -h / 2 + 8, w, h, mix(PAPER, INK, 0.12), INK, 3, alpha=alpha, hatch_on=False)

    def page(k, sy=1.0):
        cv.save()
        cv.translate(0, -h / 2)
        cv.scale(1, sy)
        hc = RED if int(k) % 2 == 0 else GREEN
        rect(cv, -w / 2, 0, w, h, '#FBF6EA', INK, 3.5, alpha=alpha, hatch_on=False)
        rect(cv, -w / 2, 0, w, 44, hc, INK, 3.5, alpha=alpha, spacing=7)
        if sy > 0:
            for r_ in range(4):
                for c_ in range(5):
                    xx = -w / 2 + 24 + c_ * 30
                    yy = 66 + r_ * 30
                    if (r_ * 5 + c_ + int(k)) % 7 == 3:
                        line(cv, [(xx - 7, yy - 7), (xx + 7, yy + 7)], INK2, 2.5, a=alpha * 0.8)
                        line(cv, [(xx + 7, yy - 7), (xx - 7, yy + 7)], INK2, 2.5, a=alpha * 0.8)
                    else:
                        cv.drawCircle(xx, yy, 3.4, fillp(INK2, 0.7 * alpha))
        cv.restore()
    k = math.floor(t_flip)
    fr = t_flip - k
    page(k + 1)
    if fr > 0:
        ang = fr * math.pi
        page(k, math.cos(ang))
    else:
        page(k)
    for rx in (-45, 0, 45):
        line(cv, [(rx, -h / 2 - 14), (rx, -h / 2 + 10)], INK, 5, a=alpha)
    cv.restore()
