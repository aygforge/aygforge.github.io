# Hand-drawn assets for Operation Paul Bunyan.
import math
import numpy as np
from lib import *

# ------------------------------------------------------------------ tree
_TREE_BLOBS = {}


def tree_blobs(seed):
    if seed in _TREE_BLOBS:
        return _TREE_BLOBS[seed]
    rs = np.random.default_rng(seed)
    blobs = []
    # two-trunk poplar: crown roughly an inverted egg, wide
    centers = []
    for i in range(30):
        a = rs.uniform(0, 2 * math.pi)
        rr = math.sqrt(rs.uniform(0, 1))
        cx = 235 * rr * math.cos(a)
        cy = -600 + 250 * rr * math.sin(a)
        centers.append((cx, cy))
    # bottom fringe lobes
    for cx in (-230, -150, -60, 40, 140, 225):
        centers.append((cx + rs.uniform(-20, 20), -400 + rs.uniform(-30, 20) + abs(cx) * -0.25))
    for cx in (-120, 0, 110):
        centers.append((cx, -840 + rs.uniform(-15, 15)))
    centers.sort(key=lambda c: c[1])  # top first
    for i, (cx, cy) in enumerate(centers):
        r = rs.uniform(62, 98)
        col = [LEAF3, LEAF1, LEAF2, LEAF1][rs.integers(0, 4)]
        if cy < -720:
            col = LEAF2
        blobs.append((cx, cy, r, col, int(rs.integers(0, 10000))))
    # draw back (upper/darker) first, front ones later: sort by depth = y + noise
    blobs.sort(key=lambda b: b[1] + rs.uniform(-60, 60))
    _TREE_BLOBS[seed] = blobs
    return blobs


TRUNK = [(-40, 0), (-31, -140), (-27, -250), (-66, -440), (-50, -450), (-12, -300), (2, -262), (20, -312),
         (52, -470), (68, -460), (30, -262), (27, -140), (38, 0)]


def tree(p, x, y, s, t, sway=1.0, fall=0.0, cut=0.0, seed=7, alpha=1.0, leaf_shake=0.0, bare=False,
         col_k=1.0, ground_clip=None):
    ctx = p.ctx
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(fall)
    ctx.scale(s, s)
    sub = Pen(ctx, p.boil, p.zoom * s)
    flat = 1 - 0.55 * clamp(abs(fall) / (math.pi / 2))
    # branches
    for i, (bx, by, ex, ey) in enumerate([(-58, -440, -150, -560), (-58, -440, -40, -660), (60, -462, 160, -580),
                                          (60, -462, 70, -700), (-20, -300, -170, -420), (25, -310, 170, -430)]):
        sub.line([(bx, by), ((bx + ex) / 2 + 8, (by + ey) / 2), (ex, ey)], col=BROWN, lw=7, seed=seed + i * 3,
                 alpha=alpha)
    sub.shape(TRUNK, fill=BROWN, seed=seed + 1, lw=3.6, alpha=alpha, hatch_ang=1.45, hatch_sp=8)
    # bark lines
    for i, (a, b) in enumerate([((-20, -30), (-16, -120)), ((10, -60), (12, -170)), ((-8, -150), (-12, -230))]):
        sub.line([a, b], col=darker(BROWN, 0.6), lw=2, seed=seed + 40 + i, alpha=alpha * 0.8)
    if cut > 0:
        d = 64 * cut
        sub.shape([(38, -18), (38 - d, -36), (38, -52)], fill=WOOD, seed=seed + 50, lw=2.6, alpha=alpha, hatch=False)
    if not bare:
        for i, (bx, by, r, col, bs) in enumerate(tree_blobs(seed)):
            h = -by / 800.0
            dx = (sway * 9 * math.sin(1.3 * t + by * 0.005) + leaf_shake * 6 * math.sin(31 * t + i)) * h
            dy = leaf_shake * 3 * math.sin(27 * t + i * 2)
            c = mix(col, GREY, 1 - col_k) if col_k < 1 else col
            sub.shape(blob_pts(bx * flat + dx, by + dy, r, bs, n=22), fill=c, seed=bs, lw=3.0, alpha=alpha,
                      hatch_sp=9, hatch_ang=0.8 + (i % 3) * 0.3)
    ctx.restore()


def stump(p, x, y, s, seed=3, alpha=1.0):
    pts = [(-46, 4), (-40, -58), (36, -58), (44, 4)]
    p.shape(xform(pts, x, y, s), fill=BROWN, seed=seed, alpha=alpha, hatch_ang=1.45)
    p.shape(ellipse_pts(x - 2 * s, y - 58 * s, 38 * s, 11 * s, 24), fill=WOOD, seed=seed + 1, alpha=alpha,
            lw=2.8, hatch=False)
    for i, k in enumerate((0.62, 0.32)):
        p.shape(ellipse_pts(x - 2 * s, y - 58 * s, 38 * s * k, 11 * s * k, 18), fill=None, line=BROWN_L,
                seed=seed + 5 + i, lw=1.8, alpha=alpha, double=False)
    # roots
    for i, (a, b) in enumerate([((-44, 0), (-70, 10)), ((42, 0), (68, 12)), ((-10, 4), (-14, 16))]):
        p.line(xform([a, b], x, y, s), col=BROWN, lw=6, seed=seed + 9 + i, alpha=alpha)


# ------------------------------------------------------------------ ground / scenery
def ground(p, y, x0=-3000, x1=4000, col=GROUND, seed=2, alpha=1.0, wave=12, depth=3000):
    pts = []
    n = 40
    for i in range(n + 1):
        x = x0 + (x1 - x0) * i / n
        pts.append((x, y + wave * math.sin(x * 0.004 + seed)))
    pts += [(x1, y + depth), (x0, y + depth)]
    p.shape(pts, fill=col, seed=seed, alpha=alpha, hatch_sp=13, hatch_ang=0.3, lw=3.2)


def grass(p, x0, x1, y, seed=5, alpha=1.0, step=46):
    rs = np.random.default_rng(seed)
    x = x0
    i = 0
    while x < x1:
        h = rs.uniform(10, 22)
        p.line([(x - 6, y), (x, y - h), (x + 5, y)], col=OLIVE_D, lw=2.2, seed=seed + i, alpha=alpha * 0.8)
        x += step * rs.uniform(0.6, 1.4)
        i += 1


def cloud(p, x, y, s, seed=1, alpha=1.0):
    pts = []
    for i in range(36):
        a = 2 * math.pi * i / 36
        k = 1 + 0.18 * abs(math.sin(3 * a + seed))
        pts.append((x + 120 * s * k * math.cos(a), y + 42 * s * k * math.sin(a) * (0.7 if math.sin(a) > 0 else 1)))
    p.shape(pts, fill=WHITE, line=BLUE, seed=seed, lw=2.4, alpha=alpha * 0.85, hatch=False)


def sky_wash(p, y0, y1, x0=-3000, x1=4000, alpha=0.5, seed=4):
    p.shape(rect_pts(x0, y0, x1 - x0, y1 - y0), fill=SKY, line=None, seed=seed, alpha=alpha, hatch_sp=15,
            hatch_ang=0.5)


def fence(p, x0, x1, y, seed=8, alpha=1.0, h=46, step=70):
    x = x0
    i = 0
    while x <= x1:
        p.line([(x, y), (x + 2, y - h)], col=BROWN, lw=3.2, seed=seed + i, alpha=alpha)
        x += step
        i += 1
    for k, yy in enumerate((y - h * 0.35, y - h * 0.8)):
        p.line([(x0, yy), (x1, yy + 2)], col=GREY_D, lw=1.8, seed=seed + 100 + k, alpha=alpha)
        xx = x0 + 15 + k * 12
        pts = []
        while xx < x1:
            p.line([(xx - 4, yy - 4), (xx + 4, yy + 4)], col=GREY_D, lw=1.6, seed=seed + int(xx), amp=0.4,
                   alpha=alpha)
            p.line([(xx - 4, yy + 4), (xx + 4, yy - 4)], col=GREY_D, lw=1.6, seed=seed + int(xx) + 1, amp=0.4,
                   alpha=alpha)
            xx += 26


# ------------------------------------------------------------------ people
def soldier(p, x, y, s, col=OLIVE, helmet=True, beret=False, rifle=False, walk=None, face=1, alpha=1.0,
            seed=0, binoc=False, tool=None, hat_col=None, skin=SKIN):
    """Feet at (x,y); ~100*s tall."""
    small = s * p.zoom < 0.5
    lw = 2.6 if not small else 1.6
    ph = 0.0 if walk is None else walk
    l1 = 9 * math.sin(ph)
    l2 = -l1
    dark = darker(col, 0.75)
    f = face
    if small:
        # compact silhouette
        body = [(-11, 0), (-9, -44), (-13, -78), (13, -78), (9, -44), (11, 0)]
        p.shape(xform(body, x, y, s, f), fill=col, seed=seed, lw=lw, alpha=alpha, hatch=False, double=False)
        p.shape(ellipse_pts(x, y - 88 * s, 9 * s, 9 * s, 10), fill=skin, seed=seed + 1, lw=lw, alpha=alpha,
                hatch=False, double=False)
        if helmet or beret:
            p.shape(ellipse_pts(x, y - 92 * s, 12 * s, 9 * s, 10, math.pi, 2 * math.pi), fill=hat_col or dark,
                    seed=seed + 2, lw=lw, alpha=alpha, hatch=False, double=False)
        if rifle:
            p.line(xform([(8, -40), (16, -110)], x, y, s, f), col=INK, lw=2, seed=seed + 3, alpha=alpha)
        return
    # legs
    p.shape(xform([(-9, -44), (-3, -44), (-2 + l1, 0), (-12 + l1, 0)], x, y, s, f), fill=dark, seed=seed + 1,
            lw=lw, alpha=alpha, hatch=False)
    p.shape(xform([(3, -44), (9, -44), (12 + l2, 0), (2 + l2, 0)], x, y, s, f), fill=dark, seed=seed + 2, lw=lw,
            alpha=alpha, hatch=False)
    # boots
    p.shape(xform([(-14 + l1, -6), (0 + l1, -6), (2 + l1, 1), (-14 + l1, 1)], x, y, s, f), fill=INK,
            seed=seed + 3, lw=1.8, alpha=alpha, hatch=False)
    p.shape(xform([(0 + l2, -6), (14 + l2, -6), (15 + l2, 1), (0 + l2, 1)], x, y, s, f), fill=INK,
            seed=seed + 4, lw=1.8, alpha=alpha, hatch=False)
    # torso
    p.shape(xform([(-13, -42), (13, -42), (12, -80), (-12, -80)], x, y, s, f), fill=col, seed=seed + 5, lw=lw,
            alpha=alpha)
    p.line(xform([(-13, -50), (13, -50)], x, y, s, f), col=dark, lw=3, seed=seed + 6, alpha=alpha)
    # arms
    if binoc:
        p.line(xform([(-10, -76), (0, -66), (8, -88)], x, y, s, f), col=col, lw=7 * s, seed=seed + 7, alpha=alpha)
        p.shape(xform(rect_pts(4, -94, 14, 9), x, y, s, f), fill=INK, seed=seed + 8, lw=1.6, alpha=alpha,
                hatch=False)
    elif tool == 'raise':
        p.line(xform([(-10, -76), (-18, -96), (-14, -118)], x, y, s, f), col=col, lw=7 * s, seed=seed + 7,
               alpha=alpha)
        p.line(xform([(10, -76), (20, -58)], x, y, s, f), col=col, lw=7 * s, seed=seed + 9, alpha=alpha)
    else:
        sw = 0 if walk is None else 6 * math.sin(ph)
        p.line(xform([(-10, -76), (-15 - sw, -48)], x, y, s, f), col=col, lw=7 * s, seed=seed + 7, alpha=alpha)
        p.line(xform([(10, -76), (16 + sw, -50)], x, y, s, f), col=col, lw=7 * s, seed=seed + 9, alpha=alpha)
    if rifle:
        p.line(xform([(9, -44), (18, -122)], x, y, s, f), col=INK, lw=3.2, seed=seed + 10, alpha=alpha)
    # head
    p.shape(ellipse_pts(x, y - 89 * s, 9.5 * s, 10 * s, 14), fill=skin, seed=seed + 11, lw=lw, alpha=alpha,
            hatch=False)
    if helmet:
        hc = hat_col or OLIVE_D
        p.shape(ellipse_pts(x, y - 93 * s, 13 * s, 11 * s, 14, math.pi, 2 * math.pi), fill=hc, seed=seed + 12,
                lw=lw, alpha=alpha, hatch=False)
        p.line([(x - 15 * s, y - 93 * s), (x + 15 * s, y - 93 * s)], col=INK, lw=2.4, seed=seed + 13, alpha=alpha)
    elif beret:
        hc = hat_col or INK
        p.shape(xform([(-11, -94), (12, -99), (8, -104), (-9, -102)], x, y, s, f), fill=hc, seed=seed + 12,
                lw=lw, alpha=alpha, hatch=False)
    else:
        p.shape(xform([(-11, -94), (11, -94), (9, -101), (-9, -101)], x, y, s, f), fill=hat_col or OLIVE_D,
                seed=seed + 12, lw=lw, alpha=alpha, hatch=False)


def squad(p, x0, y0, nx, ny, dx, dy, s, kind='army', alpha=1.0, seed=100, appear=None, t=0.0, rifle=True):
    """Rows of standing soldiers. appear(i)->scale factor (0..)."""
    i = 0
    for j in range(ny):
        for k in range(nx):
            xx = x0 + k * dx + (j % 2) * dx * 0.5
            yy = y0 + j * dy
            a = 1.0 if appear is None else appear(i)
            if a > 0.01:
                if kind == 'rok':
                    soldier(p, xx, yy, s * a, col=OLIVE_D, helmet=False, beret=True, rifle=rifle, alpha=alpha,
                            seed=seed + i * 17, hat_col=INK)
                elif kind == 'eng':
                    soldier(p, xx, yy, s * a, col=KHAKI, helmet=True, alpha=alpha, seed=seed + i * 17,
                            hat_col=OLIVE)
                else:
                    soldier(p, xx, yy, s * a, col=OLIVE, helmet=True, rifle=rifle, alpha=alpha, seed=seed + i * 17)
            i += 1


def helmet_on_ground(p, x, y, s, seed=1, alpha=1.0, col=OLIVE_D):
    p.shape(ellipse_pts(x, y - 4 * s, 46 * s, 40 * s, 22, math.pi, 2 * math.pi), fill=col, seed=seed, alpha=alpha,
            lw=3.4)
    p.shape(ellipse_pts(x, y - 2 * s, 56 * s, 9 * s, 22), fill=darker(col, 0.8), seed=seed + 1, alpha=alpha, lw=3,
            hatch=False)
    p.line([(x - 30 * s, y - 26 * s), (x + 26 * s, y - 30 * s)], col=darker(col, 0.6), lw=2, seed=seed + 2,
           alpha=alpha * 0.6)


# ------------------------------------------------------------------ vehicles & aircraft
def helicopter(p, x, y, s, t, col=OLIVE, face=1, seed=30, alpha=1.0, rotor=True):
    body = [(150, 4), (128, -16), (70, -30), (0, -34), (-50, -26), (-70, -14), (-170, -10), (-182, -40),
            (-196, -42), (-192, 2), (-170, 6), (-70, 12), (0, 22), (90, 18), (135, 12)]
    p.shape(xform(body, x, y, s, face), fill=col, seed=seed, alpha=alpha)
    canopy = [(132, -10), (100, -30), (40, -36), (10, -30), (40, -22), (110, -14)]
    p.shape(xform(canopy, x, y, s, face), fill=BLUE_L, seed=seed + 1, alpha=alpha, lw=2.6, hatch=False)
    # stub wing + pod
    p.shape(xform(rect_pts(-20, 8, 50, 14), x, y, s, face), fill=darker(col, 0.8), seed=seed + 2, alpha=alpha,
            lw=2.4, hatch=False)
    # skids
    p.line(xform([(-60, 22), (-50, 40)], x, y, s, face), lw=2.6, seed=seed + 3, alpha=alpha)
    p.line(xform([(40, 20), (50, 40)], x, y, s, face), lw=2.6, seed=seed + 4, alpha=alpha)
    p.line(xform([(-90, 40), (90, 40), (102, 34)], x, y, s, face), lw=3, seed=seed + 5, alpha=alpha)
    # mast + rotor
    p.line(xform([(0, -34), (0, -50)], x, y, s, face), lw=3.4, seed=seed + 6, alpha=alpha)
    if rotor:
        ph = t * 22 + seed
        L1 = 210 * abs(math.cos(ph))
        L2 = 210 * abs(math.sin(ph))
        p.line(xform([(-L1, -52), (L1, -52)], x, y, s, face), col=INK, lw=3.4, seed=seed + 7, alpha=alpha)
        p.line(xform([(-L2, -51), (L2, -51)], x, y, s, face), col=INK, lw=2.2, seed=seed + 8, alpha=alpha * 0.6)
        p.shape(ellipse_pts(x, y - 52 * s, 215 * s, 7 * s, 30), fill=None, line=INK, seed=seed + 9, lw=1.4,
                alpha=alpha * 0.25, double=False)
        tr = 24
        a = t * 30
        cx, cy = xform([(-189, -40)], x, y, s, face)[0]
        p.line([(cx - tr * s * math.cos(a), cy - tr * s * math.sin(a)), (cx + tr * s * math.cos(a),
                                                                        cy + tr * s * math.sin(a))], col=INK, lw=2,
               seed=seed + 10, alpha=alpha * 0.8)
        p.shape(ellipse_pts(cx, cy, tr * s, tr * s, 16), fill=None, line=INK, seed=seed + 11, lw=1.2,
                alpha=alpha * 0.25, double=False)


def b52(p, x, y, s, col=GREY, seed=50, alpha=1.0, face=1):
    """Plan view, nose to the right. Span ~ 900*s."""
    for side in (-1, 1):
        wing = [(70, -20 * side), (-120, -450 * side), (-168, -452 * side), (-60, -20 * side)]
        p.shape(xform(wing, x, y, s, face), fill=col, seed=seed + (1 if side > 0 else 2), alpha=alpha,
                hatch_ang=0.4)
        # engine pods (pairs)
        for k, f in enumerate((0.28, 0.58)):
            px = 70 + (-120 - 70) * f - 12
            py = (-20 + (-450 + 20) * f) * side
            for d in (-13, 13):
                pod = rect_pts(px - 8, py + d - 6, 62, 12)
                p.shape(xform(pod, x, y, s, face), fill=GREY_D, seed=seed + 10 + k * 3 + (d > 0) + (side > 0) * 7,
                        alpha=alpha, lw=2.2, hatch=False)
        tail = [(-250, -12 * side), (-300, -150 * side), (-330, -150 * side), (-310, -12 * side)]
        p.shape(xform(tail, x, y, s, face), fill=col, seed=seed + 30 + (side > 0), alpha=alpha)
    fus = [(330, 0), (306, -16), (262, -24), (-300, -24), (-336, -10), (-340, 0), (-336, 10), (-300, 24),
           (262, 24), (306, 16)]
    p.shape(xform(fus, x, y, s, face), fill=mix(col, GREY_L, 0.4), seed=seed + 40, alpha=alpha, hatch_ang=0.1)
    p.shape(xform([(318, -6), (300, -12), (288, -6), (288, 6), (300, 12), (318, 6)], x, y, s, face),
            fill=BLUE_L, seed=seed + 41, alpha=alpha, lw=2, hatch=False)
    p.line(xform([(-330, 0), (-100, 0)], x, y, s, face), col=GREY_D, lw=4, seed=seed + 42, alpha=alpha * 0.8)


def fighter(p, x, y, s, col=GREY, seed=70, alpha=1.0, face=1, rot=0.0):
    """Plan view, nose right, ~170*s long."""
    fus = [(90, 0), (60, -7), (-60, -9), (-80, -6), (-80, 6), (-60, 9), (60, 7)]
    for side in (-1, 1):
        wing = [(15, -8 * side), (-40, -62 * side), (-56, -60 * side), (-40, -8 * side)]
        p.shape(xform(wing, x, y, s, face, rot), fill=col, seed=seed + (side > 0), alpha=alpha, lw=2.6)
        tail = [(-58, -8 * side), (-82, -34 * side), (-92, -32 * side), (-80, -8 * side)]
        p.shape(xform(tail, x, y, s, face, rot), fill=col, seed=seed + 4 + (side > 0), alpha=alpha, lw=2.4,
                hatch=False)
    p.shape(xform(fus, x, y, s, face, rot), fill=mix(col, GREY_L, 0.4), seed=seed + 8, alpha=alpha, lw=2.6)
    p.shape(xform([(56, -3), (40, -5), (40, 5), (56, 3)], x, y, s, face, rot), fill=BLUE_L, seed=seed + 9,
            alpha=alpha, lw=1.6, hatch=False)


def speed_lines(p, x, y, s, n=3, alpha=0.6, seed=1, face=1):
    for i in range(n):
        yy = y + (i - (n - 1) / 2) * 26 * s
        p.line([(x - face * 120 * s, yy), (x - face * (260 + 40 * i) * s, yy)], col=BLUE, lw=2.2, seed=seed + i,
               alpha=alpha)


def carrier(p, x, y, s, t, seed=90, alpha=1.0, wake=True):
    """Plan view, bow to the right, ~720*s long."""
    if wake:
        for i in range(5):
            ph = (t * 0.6 + i * 0.2) % 1.0
            L = 120 + 260 * ph
            a = (1 - ph) * alpha
            for side in (-1, 1):
                p.line([(x - 330 * s, y + side * 30 * s), (x - (330 + L) * s, y + side * (40 + 0.35 * L) * s)],
                       col=WHITE, lw=4, seed=seed + i * 2 + (side > 0), alpha=a * 0.9)
    hull = [(360, 0), (300, -48), (-300, -60), (-345, -40), (-345, 46), (-290, 64), (290, 54)]
    p.shape(xform(hull, x, y, s), fill=GREY, seed=seed, alpha=alpha, hatch_ang=0.15)
    deck = [(330, -6), (280, -40), (-310, -50), (-330, -34), (-330, 40), (-280, 52), (270, 44)]
    p.shape(xform(deck, x, y, s), fill=GREY_L, seed=seed + 1, alpha=alpha, lw=2.4)
    # angled deck lines
    p.line(xform([(-320, 30), (120, -46)], x, y, s), col=WHITE, lw=2.4, seed=seed + 2, alpha=alpha, dash=[16, 12])
    p.line(xform([(-320, 6), (320, 6)], x, y, s), col=WHITE, lw=2.0, seed=seed + 3, alpha=alpha * 0.8,
           dash=[18, 14])
    # island (starboard = +y)
    p.shape(xform(rect_pts(20, 46, 90, 26), x, y, s), fill=GREY_D, seed=seed + 4, alpha=alpha, lw=2.4,
            hatch=False)
    p.shape(xform(rect_pts(45, 52, 30, 12), x, y, s), fill=INK, seed=seed + 5, alpha=alpha, lw=1.4, hatch=False)
    # tiny aircraft on deck
    spots = [(-260, -20, 0.0), (-215, -24, 0.0), (-170, -28, 0.0), (-250, 24, 0.0), (-205, 24, 0.0),
             (180, -18, 0.0), (225, -16, 0.0), (150, 22, 0.0), (-80, -30, 0.0)]
    for i, (ax, ay, r) in enumerate(spots):
        fx, fy = xform([(ax, ay)], x, y, s)[0]
        fighter(p, fx, fy, s * 0.17, col=GREY_D, seed=seed + 20 + i * 11, alpha=alpha)


def truck(p, x, y, s, col=OLIVE, face=1, seed=110, alpha=1.0, cargo=True, t=0.0, moving=False):
    bob = 1.5 * math.sin(t * 20) if moving else 0
    body = [(-130, -40), (60, -40), (60, -88), (-130, -88)]
    p.shape(xform(body, x, y + bob, s, face), fill=col, seed=seed, alpha=alpha)
    cab = [(64, -40), (130, -40), (130, -78), (112, -110), (64, -110)]
    p.shape(xform(cab, x, y + bob, s, face), fill=col, seed=seed + 1, alpha=alpha)
    p.shape(xform([(78, -82), (110, -82), (100, -104), (78, -104)], x, y + bob, s, face), fill=BLUE_L,
            seed=seed + 2, alpha=alpha, lw=2, hatch=False)
    p.line(xform([(-130, -60), (60, -60)], x, y + bob, s, face), col=darker(col), lw=2.4, seed=seed + 3,
           alpha=alpha)
    for i, wx in enumerate((-95, -45, 95)):
        cx, cy = xform([(wx, -20)], x, y, s, face)[0]
        p.circle(cx, cy, 21 * s, fill=INK, seed=seed + 10 + i, lw=2.4, alpha=alpha, hatch=False)
        p.circle(cx, cy, 8 * s, fill=GREY, seed=seed + 20 + i, lw=1.6, alpha=alpha, hatch=False)


def artillery(p, x, y, s, col=OLIVE, face=1, seed=130, alpha=1.0, elev=0.42):
    c, sn = math.cos(elev), math.sin(elev)
    bx, by = 10, -40
    barrel = [(bx, by - 5), (bx + 190 * c, by - 190 * sn - 4), (bx + 190 * c + 3, by - 190 * sn + 5), (bx, by + 6)]
    p.shape(xform(barrel, x, y, s, face), fill=darker(col, 0.85), seed=seed, alpha=alpha, lw=2.8)
    p.line(xform([(0, -30), (-120, 0)], x, y, s, face), col=darker(col, 0.7), lw=6, seed=seed + 1, alpha=alpha)
    p.shape(xform([(-10, -70), (34, -70), (40, -24), (-14, -24)], x, y, s, face), fill=col, seed=seed + 2,
            alpha=alpha)
    cx, cy = xform([(8, -24)], x, y, s, face)[0]
    p.circle(cx, cy, 25 * s, fill=INK, seed=seed + 3, alpha=alpha, lw=2.4, hatch=False)
    p.circle(cx, cy, 9 * s, fill=GREY, seed=seed + 4, alpha=alpha, lw=1.6, hatch=False)


def op_post(p, x, y, s, col=BLUE, seed=150, alpha=1.0, flagcol=None):
    for i, (a, b) in enumerate([((-48, 0), (-40, -130)), ((48, 0), (40, -130)), ((-46, -10), (40, -120)),
                                ((46, -10), (-40, -120))]):
        p.line(xform([a, b], x, y, s), col=BROWN, lw=4 if i < 2 else 2.4, seed=seed + i, alpha=alpha)
    p.shape(xform(rect_pts(-62, -205, 124, 78), x, y, s), fill=col, seed=seed + 5, alpha=alpha)
    p.shape(xform(rect_pts(-50, -192, 100, 26), x, y, s), fill=hexc('3D4A5E'), seed=seed + 6, alpha=alpha, lw=2.2,
            hatch=False)
    p.shape(xform([(-76, -205), (76, -205), (60, -232), (-60, -232)], x, y, s), fill=GREY_D, seed=seed + 7,
            alpha=alpha)
    if flagcol:
        p.line(xform([(56, -232), (56, -300)], x, y, s), lw=2.6, seed=seed + 8, alpha=alpha)
        p.shape(xform([(56, -300), (100, -292), (56, -282)], x, y, s), fill=flagcol, seed=seed + 9, alpha=alpha,
                lw=2, hatch=False)


def nk_post(p, x, y, s, col=GREY, seed=170, alpha=1.0):
    p.shape(xform(rect_pts(-150, -200, 300, 200), x, y, s), fill=col, seed=seed, alpha=alpha)
    p.shape(xform([(-170, -200), (170, -200), (150, -230), (-150, -230)], x, y, s), fill=GREY_D, seed=seed + 1,
            alpha=alpha)
    for r in range(2):
        for c in range(4):
            p.shape(xform(rect_pts(-125 + c * 66, -180 + r * 86, 40, 50), x, y, s), fill=hexc('3D4A5E'),
                    seed=seed + 10 + r * 4 + c, alpha=alpha, lw=2, hatch=False)


def ladder(p, x1, y1, x2, y2, w=34, seed=190, alpha=1.0, col=BROWN_L):
    dx, dy = x2 - x1, y2 - y1
    L = math.hypot(dx, dy)
    nx, ny = -dy / L * w / 2, dx / L * w / 2
    p.line([(x1 + nx, y1 + ny), (x2 + nx, y2 + ny)], col=col, lw=4, seed=seed, alpha=alpha)
    p.line([(x1 - nx, y1 - ny), (x2 - nx, y2 - ny)], col=col, lw=4, seed=seed + 1, alpha=alpha)
    n = int(L / 28)
    for i in range(1, n):
        k = i / n
        cx, cy = x1 + dx * k, y1 + dy * k
        p.line([(cx + nx, cy + ny), (cx - nx, cy - ny)], col=col, lw=3, seed=seed + 2 + i, alpha=alpha)


def chainsaw(p, x, y, s, rot=0.0, seed=210, alpha=1.0, t=0.0, running=False):
    j = (1.2 * math.sin(t * 90), 1.0 * math.cos(t * 77)) if running else (0, 0)
    X, Y = x + j[0] * s, y + j[1] * s
    bar = [(40, -12), (210, -12), (226, 0), (210, 12), (40, 12)]
    p.shape(xform(bar, X, Y, s, 1, rot), fill=GREY_L, seed=seed, alpha=alpha, lw=3)
    # chain teeth
    pts = []
    for i in range(18):
        u = 46 + i * 10
        pts.append((u, -15 if i % 2 else -12))
    p.line(xform(pts, X, Y, s, 1, rot), col=INK, lw=1.8, seed=seed + 1, alpha=alpha, amp=0.3)
    body = [(-70, -36), (50, -36), (58, 0), (50, 30), (-70, 30), (-80, 0)]
    p.shape(xform(body, X, Y, s, 1, rot), fill=ORANGE, seed=seed + 2, alpha=alpha)
    p.shape(xform([(-50, -36), (-30, -62), (30, -62), (40, -36)], X, Y, s, 1, rot), fill=None, seed=seed + 3,
            alpha=alpha, lw=6, closed=False)
    p.shape(xform(rect_pts(-56, -20, 50, 30), X, Y, s, 1, rot), fill=GREY_D, seed=seed + 4, alpha=alpha, lw=2,
            hatch=False)
    p.line(xform([(-80, 0), (-120, 6)], X, Y, s, 1, rot), col=INK, lw=6, seed=seed + 5, alpha=alpha)


def shears(p, x, y, s, rot=0.0, seed=230, alpha=1.0, open_=0.25):
    for k, sg in enumerate((-1, 1)):
        a = rot + sg * open_
        blade = [(0, 0), (70, -9), (110, 0), (70, 6)]
        p.shape(xform(blade, x, y, s, 1, a), fill=GREY_L, seed=seed + k, alpha=alpha, lw=2.8)
        handle = [(0, -6), (-90, -16), (-96, -2), (0, 6)]
        p.shape(xform(handle, x, y, s, 1, a + sg * 0.12), fill=RED, seed=seed + 4 + k, alpha=alpha, lw=2.8)
    p.circle(x, y, 7 * s, fill=GREY_D, seed=seed + 9, alpha=alpha, lw=2)


def handsaw(p, x, y, s, rot=0.0, seed=250, alpha=1.0):
    blade = [(0, -14), (120, -6), (120, 6), (0, 18)]
    p.shape(xform(blade, x, y, s, 1, rot), fill=GREY_L, seed=seed, alpha=alpha, lw=2.4, hatch=False)
    teeth = [(i * 10, 18 - i * 1.0 + (4 if i % 2 else 0)) for i in range(13)]
    p.line(xform(teeth, x, y, s, 1, rot), col=INK, lw=1.4, seed=seed + 1, alpha=alpha, amp=0.2)
    p.shape(xform([(-36, -18), (2, -18), (2, 22), (-36, 22)], x, y, s, 1, rot), fill=BROWN_L, seed=seed + 2,
            alpha=alpha, lw=2.4, hatch=False)


def sawdust(p, x, y, t, t0, rate=40, seed=5, alpha=1.0, spread=1.0):
    rs = np.random.default_rng(seed)
    n = 70
    for i in range(n):
        born = t0 + rs.uniform(0, 30)
        if t < born:
            continue
        age = (t - born) % 0.9
        vx = rs.uniform(30, 160) * spread
        vy = rs.uniform(-160, -40)
        px = x + vx * age
        py = y + vy * age + 260 * age * age
        a = alpha * (1 - age / 0.9)
        p.ctx.set_source_rgba(*WOOD, a)
        r = rs.uniform(2, 4.5)
        p.ctx.arc(px, py, r, 0, 6.283)
        p.ctx.fill()


# ------------------------------------------------------------------ props / UI
def calendar(p, x, y, s, day, prev_day=None, flip=1.0, seed=270, alpha=1.0):
    w, h = 250, 270
    p.shape(xform(rect_pts(-w / 2 + 8, -h / 2 + 10, w, h), x, y, s), fill=GREY, line=None, seed=seed + 1,
            alpha=alpha * 0.35, hatch=False)
    p.shape(xform(rect_pts(-w / 2, -h / 2, w, h), x, y, s), fill=WHITE, seed=seed, alpha=alpha, hatch=False)
    p.shape(xform(rect_pts(-w / 2, -h / 2, w, 66), x, y, s), fill=RED, seed=seed + 2, alpha=alpha)
    for k in (-70, 70):
        p.circle(x + k * s, y - (h / 2 + 4) * s, 9 * s, fill=GREY_D, seed=seed + 3 + k, alpha=alpha, lw=2,
                 hatch=False)
    draw_text(p.ctx, 'AĞUSTOS', x, y + (-h / 2 + 46) * s, 36 * s, col=WHITE, alpha=alpha)
    draw_text(p.ctx, '1976', x, y + (h / 2 - 22) * s, 28 * s, col=GREY_D, bold=False, alpha=alpha)
    draw_text(p.ctx, str(day), x, y + 62 * s, 150 * s, col=INK, alpha=alpha)
    if prev_day is not None and flip < 1:
        # page lifting up from top hinge
        k = 1 - ease_io(flip)
        top = y - (h / 2 - 66) * s
        ph = (h - 66) * s * k
        if ph > 2:
            ctx = p.ctx
            ctx.save()
            ctx.translate(x, top)
            ctx.scale(1, max(k, 0.02))
            ctx.translate(-x, -top)
            p.shape(rect_pts(x - w / 2 * s, top, w * s, (h - 66) * s), fill=mix(WHITE, KHAKI_L, 0.25 + 0.5 * (1 - k)),
                    seed=seed + 9, alpha=alpha, hatch=False)
            draw_text(ctx, str(prev_day), x, top + (62 + h / 2 - 66) * s, 150 * s, col=INK, alpha=alpha)
            ctx.restore()


def folder(p, x, y, s, seed=290, alpha=1.0):
    p.shape(xform([(-300, -210), (-120, -210), (-100, -240), (40, -240), (60, -210), (300, -210), (300, 210),
                   (-300, 210)], x, y, s), fill=KHAKI, seed=seed, alpha=alpha, hatch_ang=0.7)
    p.shape(xform(rect_pts(-270, -180, 520, 370), x, y, s, 1, 0.03), fill=WHITE, seed=seed + 1, alpha=alpha,
            hatch=False)
    for i in range(7):
        yy = -110 + i * 38
        p.line(xform([(-230, yy), (200 - (i % 3) * 60, yy)], x, y, s, 1, 0.03), col=GREY, lw=2.4, seed=seed + 5 + i,
               alpha=alpha * 0.7)
    draw_text(p.ctx, 'TOP SECRET', x - 120 * s, y - 140 * s, 30 * s, col=GREY_D, alpha=alpha * 0.0)


def stamp(p, x, y, s, alpha=1.0, seed=310, rot=-0.12):
    ctx = p.ctx
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    ctx.scale(s, s)
    sub = Pen(ctx, p.boil, p.zoom * s)
    sub.shape(rect_pts(-250, -105, 500, 210), fill=None, line=RED, seed=seed, lw=8, alpha=alpha)
    sub.shape(rect_pts(-236, -91, 472, 182), fill=None, line=RED, seed=seed + 1, lw=3, alpha=alpha)
    draw_text(ctx, 'OPERATION', 0, -16, 62, col=RED, alpha=alpha, font='Kalam')
    draw_text(ctx, 'PAUL BUNYAN', 0, 62, 70, col=RED, alpha=alpha, font='Kalam')
    ctx.restore()


def stopwatch(p, x, y, s, minutes, seed=330, alpha=1.0):
    p.shape(xform(rect_pts(-16, -160, 32, 30), x, y, s), fill=GREY_D, seed=seed, alpha=alpha, hatch=False)
    p.circle(x, y - 172 * s, 12 * s, fill=GREY_D, seed=seed + 1, alpha=alpha, hatch=False)
    p.circle(x, y, 130 * s, fill=WHITE, seed=seed + 2, alpha=alpha, lw=4.5, hatch=False)
    for i in range(12):
        a = i / 12 * 2 * math.pi
        r0 = 108 if i % 3 else 96
        p.line([(x + r0 * s * math.sin(a), y - r0 * s * math.cos(a)), (x + 120 * s * math.sin(a),
                                                                       y - 120 * s * math.cos(a))],
               lw=3 if i % 3 == 0 else 2, seed=seed + 5 + i, alpha=alpha, amp=0.4)
    # filled sweep wedge
    frac = (minutes % 60) / 60.0
    if frac > 0:
        ctx = p.ctx
        ctx.save()
        ctx.move_to(x, y)
        ctx.arc(x, y, 100 * s, -math.pi / 2, -math.pi / 2 + frac * 2 * math.pi)
        ctx.close_path()
        ctx.set_source_rgba(*RED, 0.28 * alpha)
        ctx.fill()
        ctx.restore()
    a = frac * 2 * math.pi
    p.line([(x, y), (x + 98 * s * math.sin(a), y - 98 * s * math.cos(a))], col=RED, lw=4.5, seed=seed + 30,
           alpha=alpha, amp=0.3)
    p.circle(x, y, 8 * s, fill=INK, seed=seed + 31, alpha=alpha, hatch=False)


# ------------------------------------------------------------------ map
KOREA = [(124.35, 40.05), (125.0, 40.5), (125.9, 40.9), (126.9, 41.7), (127.6, 41.5), (128.3, 41.6),
         (128.1, 42.0), (129.0, 42.1), (129.7, 42.4), (130.25, 42.9), (130.7, 42.3), (129.7, 41.0), (129.4, 40.7),
         (128.6, 40.2), (127.9, 39.9), (127.5, 39.4), (127.4, 39.1), (128.0, 38.7), (128.4, 38.3), (128.6, 38.0),
         (129.0, 37.6), (129.4, 37.0), (129.45, 36.4), (129.6, 35.9), (129.3, 35.4), (129.0, 35.1), (128.6, 34.9),
         (128.0, 34.85), (127.5, 34.6), (126.9, 34.4), (126.4, 34.4), (126.3, 34.7), (126.5, 35.0), (126.5, 35.6),
         (126.6, 36.0), (126.5, 36.5), (126.2, 36.8), (126.6, 37.1), (126.7, 37.45), (126.3, 37.7), (125.9, 37.75),
         (125.3, 37.75), (124.8, 38.0), (125.0, 38.5), (125.2, 38.8), (125.6, 39.0), (125.4, 39.6), (124.9, 39.65)]
MAINLAND = [(118, 46), (124.35, 40.05), (125.0, 40.5), (125.9, 40.9), (126.9, 41.7), (127.6, 41.5), (128.3, 41.6),
            (128.1, 42.0), (129.0, 42.1), (129.7, 42.4), (130.25, 42.9), (130.7, 42.3), (131.5, 42.8),
            (133.5, 43.5), (136, 46), (136, 50), (118, 50)]
CHINA_COAST = [(117, 39.0), (118.5, 39.2), (121.0, 39.0), (121.6, 39.5), (122.3, 40.2), (123.3, 39.8),
               (124.35, 40.05)]
DMZ = [(126.1, 37.72), (126.5, 37.8), (126.677, 37.956), (127.0, 38.15), (127.4, 38.3), (127.9, 38.27),
       (128.2, 38.5), (128.37, 38.62)]
PANMUNJOM = (126.677, 37.956)
JAPAN = [(129.4, 33.3), (130.4, 33.6), (131.0, 34.4), (132.0, 35.0), (133.4, 35.5), (135.0, 35.7), (136, 36.2),
         (136, 30), (129.6, 30), (129.7, 32.6)]


def proj(lon, lat, ox=540, oy=1150, k=160):
    return (ox + (lon - 127.5) * k * 0.79, oy - (lat - 38.0) * k)


def korea_map(p, t, ox=540, oy=1150, k=160, alpha=1.0, dmz=1.0, pin=0.0, seed=400, sea=True):
    P = lambda pts: [proj(a, b, ox, oy, k) for a, b in pts]
    if sea:
        p.shape(rect_pts(-6000, -6000, 14000, 14000), fill=SEA, line=None, seed=seed, alpha=alpha, hatch_sp=14,
                hatch_ang=0.35)
        # wave marks
        rs = np.random.default_rng(3)
        for i in range(40):
            lo, la = rs.uniform(119, 136), rs.uniform(30, 44)
            x, y = proj(lo, la, ox, oy, k)
            p.line([(x - 14, y), (x - 5, y - 6), (x + 5, y), (x + 14, y - 6)], col=BLUE, lw=2, seed=seed + 50 + i,
                   alpha=alpha * 0.6, amp=0.5)
    china = MAINLAND[:1] + CHINA_COAST + MAINLAND[1:]
    china = [(117, 46), (117, 39.0)] + CHINA_COAST[1:] + MAINLAND[1:]
    p.shape(P(china), fill=KHAKI_L, seed=seed + 1, alpha=alpha, hatch_sp=14)
    p.shape(P(JAPAN), fill=KHAKI_L, seed=seed + 2, alpha=alpha, hatch_sp=14)
    p.shape(P(KOREA), fill=OLIVE_L, seed=seed + 3, alpha=alpha, hatch_sp=12, lw=4)
    p.shape(ellipse_pts(*proj(126.55, 33.38, ox, oy, k), 0.33 * k * 0.79, 0.14 * k, 16), fill=OLIVE_L,
            seed=seed + 4, alpha=alpha, hatch=False)
    if dmz > 0:
        pts = P(DMZ)
        n = max(2, int(len(pts) * 1))
        # draw progressively
        tot = [0]
        for i in range(1, len(pts)):
            tot.append(tot[-1] + math.dist(pts[i - 1], pts[i]))
        L = tot[-1] * clamp(dmz)
        drawn = [pts[0]]
        for i in range(1, len(pts)):
            if tot[i] <= L:
                drawn.append(pts[i])
            else:
                f = (L - tot[i - 1]) / max(1e-6, tot[i] - tot[i - 1])
                drawn.append((lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)))
                break
        if len(drawn) > 1:
            p.line(drawn, col=RED, lw=9, seed=seed + 5, alpha=alpha * 0.35)
            p.line(drawn, col=RED, lw=3.2, seed=seed + 6, alpha=alpha, dash=[14, 9])
    if pin > 0:
        x, y = proj(*PANMUNJOM, ox, oy, k)
        a = ease_out_back(pin)
        drop = (1 - clamp(pin * 1.4)) * -80
        ctx = p.ctx
        sz = 1.8 / max(p.zoom, 0.01) * a
        ctx.save()
        p.circle(x, y, 14 * sz, fill=RED, seed=seed + 7, alpha=alpha * 0.4, hatch=False)
        pin_pts = [(0, 0), (-22, -40), (-22, -58), (-12, -70), (12, -70), (22, -58), (22, -40)]
        p.shape(xform(pin_pts, x, y + drop * sz, sz), fill=RED, seed=seed + 8, alpha=alpha, lw=3)
        p.circle(x, y + (drop - 52) * sz, 8 * sz, fill=WHITE, seed=seed + 9, alpha=alpha, hatch=False)
        ctx.restore()
