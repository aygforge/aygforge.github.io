"""Hand-drawn colored-pencil drawing primitives on top of skia."""
import math, os
import numpy as np
import skia

W, H = 1080, 1920
HERE = os.path.dirname(os.path.abspath(__file__))
FPS = 30


def col(h, a=1.0):
    h = h.lstrip('#')
    return skia.ColorSetARGB(int(max(0, min(1, a)) * 255), int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def mix(h1, h2, k):
    a = [int(h1[i:i + 2], 16) for i in (1, 3, 5)]
    b = [int(h2[i:i + 2], 16) for i in (1, 3, 5)]
    return '#%02x%02x%02x' % tuple(int(a[i] + (b[i] - a[i]) * k) for i in range(3))


# palette
PAPER = '#F3EAD7'
INK = '#2A2849'        # dark navy / purple ink
INK2 = '#45406B'
AMBER = '#E09A2A'
AMBER_L = '#F4C25A'
AMBER_D = '#A65A14'
STEEL = '#D5D9DD'
STEEL_D = '#A3ABB5'
STEEL_L = '#ECEEF0'
GREEN = '#2F5B48'
GREEN_L = '#5E8A6E'
RED = '#C3352F'
WOOD = '#9A6A43'
WALL = '#E6D7BC'
WALL_D = '#CDBA98'
FLOOR = '#D4C19F'
SKY_N = '#2D3157'
SNOW = '#FBF8F2'
WATER = '#BFE2EC'
WATER_D = '#8FC4D6'
MONEY = '#A9CDA3'
MONEY_D = '#5E8F63'
SKIN = '#E9C4A0'
SHADOW = '#3A3558'


def clamp(x, a=0.0, b=1.0):
    return a if x < a else b if x > b else x


def lerp(a, b, k):
    return a + (b - a) * k


def ease(x):
    x = clamp(x)
    return x * x * (3 - 2 * x)


def ease_out(x):
    x = clamp(x)
    return 1 - (1 - x) ** 3


def ease_in(x):
    x = clamp(x)
    return x ** 3


def ease_io(x):
    x = clamp(x)
    return 4 * x ** 3 if x < .5 else 1 - (-2 * x + 2) ** 3 / 2


def seg(t, a, b):
    """0..1 progress of t between a and b."""
    if b <= a:
        return 1.0 if t >= b else 0.0
    return clamp((t - a) / (b - a))


def hsh(i, k=0):
    x = math.sin(i * 127.1 + k * 311.7 + 0.5) * 43758.5453
    return (x - math.floor(x)) * 2 - 1


class Ctx:
    """per-frame drawing context; boil = line-boil frame index."""
    def __init__(self):
        self.boil = 0
        self.sid = 0
        self.t = 0.0

    def next(self):
        self.sid += 1
        return self.sid


CTX = Ctx()


def begin_frame(t):
    CTX.t = t
    CTX.boil = int(t * 8)
    CTX.sid = 0


def jitter(pts, amp, sid):
    b = CTX.boil
    return [(x + amp * hsh(sid * 131 + j, b), y + amp * hsh(sid * 131 + j + 61, b + 7)) for j, (x, y) in enumerate(pts)]


def mkpath(pts, closed=True, smooth=True):
    p = skia.Path()
    n = len(pts)
    if n < 2:
        return p
    p.moveTo(*pts[0])
    if not smooth:
        for q in pts[1:]:
            p.lineTo(*q)
        if closed:
            p.close()
        return p
    rng = range(n) if closed else range(n - 1)
    for i in rng:
        p0 = pts[i - 1] if (closed or i > 0) else pts[0]
        p1 = pts[i]
        p2 = pts[(i + 1) % n]
        p3 = pts[(i + 2) % n] if (closed or i + 2 < n) else pts[-1]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        p.cubicTo(c1[0], c1[1], c2[0], c2[1], p2[0], p2[1])
    if closed:
        p.close()
    return p


def fillp(c, a=1.0):
    return skia.Paint(Color=col(c, a), AntiAlias=True)


def strokep(c, w, a=1.0):
    return skia.Paint(Color=col(c, a), AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=w,
                      StrokeCap=skia.Paint.kRound_Cap, StrokeJoin=skia.Paint.kRound_Join)


def hatch(cv, path, c, sid, spacing=9, angle=62, a=0.22, w=2.2):
    b = path.computeTightBounds()
    if b.width() <= 0 or b.height() <= 0:
        return
    cx, cy = b.centerX(), b.centerY()
    r = math.hypot(b.width(), b.height()) / 2 + 4
    ang = math.radians(angle)
    dx, dy = math.cos(ang), math.sin(ang)
    nx, ny = -dy, dx
    hp = skia.Path()
    k = -r
    i = 0
    while k <= r:
        jj = hsh(sid * 7 + i, CTX.boil) * spacing * 0.25
        ox, oy = cx + nx * (k + jj), cy + ny * (k + jj)
        l1 = r * (0.9 + 0.1 * hsh(i, sid))
        hp.moveTo(ox - dx * l1, oy - dy * l1)
        hp.lineTo(ox + dx * l1, oy + dy * l1)
        k += spacing
        i += 1
    cv.save()
    cv.clipPath(path, doAntiAlias=True)
    cv.drawPath(hp, strokep(c, w, a))
    cv.restore()


def shape(cv, pts, fill=None, stroke=INK, sw=4.0, closed=True, smooth=True, jit=1.6,
          hatch_on=True, hatch_col=None, alpha=1.0, spacing=9, hangle=62, fill_shader=None, double=True):
    sid = CTX.next()
    jp = jitter(pts, jit, sid)
    path = mkpath(jp, closed, smooth)
    if fill is not None and closed:
        p = fillp(fill, alpha)
        if fill_shader is not None:
            p.setShader(fill_shader)
        cv.drawPath(path, p)
        if hatch_on:
            hatch(cv, path, hatch_col or mix(fill, INK, 0.35), sid, spacing=spacing, angle=hangle, a=0.2 * alpha)
    if stroke is not None and sw > 0:
        cv.drawPath(path, strokep(stroke, sw, 0.92 * alpha))
        if double:
            jp2 = jitter(pts, jit * 1.4 + 0.6, sid + 9000)
            cv.drawPath(mkpath(jp2, closed, smooth), strokep(stroke, sw * 0.45, 0.35 * alpha))
    return path


def line(cv, pts, c=INK, w=4.0, jit=1.4, a=1.0, smooth=True):
    return shape(cv, pts, None, c, w, closed=False, smooth=smooth, jit=jit, alpha=a)


def ellipse_pts(cx, cy, rx, ry, n=24, a0=0.0, a1=math.tau):
    full = abs(a1 - a0 - math.tau) < 1e-6
    m = n if full else n + 1
    out = []
    for i in range(m):
        a = a0 + (a1 - a0) * i / (n if not full else n)
        out.append((cx + rx * math.cos(a), cy + ry * math.sin(a)))
    return out


def rect_pts(x, y, w, h, sub=3):
    pts = []
    corners = [(x, y), (x + w, y), (x + w, y + h), (x, y + h)]
    for i in range(4):
        a, b = corners[i], corners[(i + 1) % 4]
        for k in range(sub):
            pts.append((lerp(a[0], b[0], k / sub), lerp(a[1], b[1], k / sub)))
    return pts


def rrect_pts(x, y, w, h, r, n=5):
    pts = []
    for (cx, cy, a0) in [(x + w - r, y + r, -math.pi / 2), (x + w - r, y + h - r, 0), (x + r, y + h - r, math.pi / 2),
                         (x + r, y + r, math.pi)]:
        for i in range(n + 1):
            a = a0 + (math.pi / 2) * i / n
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def ellipse(cv, cx, cy, rx, ry, fill=None, stroke=INK, sw=4, n=24, **kw):
    return shape(cv, ellipse_pts(cx, cy, rx, ry, n), fill, stroke, sw, **kw)


def rect(cv, x, y, w, h, fill=None, stroke=INK, sw=4, sub=3, **kw):
    kw.setdefault('smooth', False)
    return shape(cv, rect_pts(x, y, w, h, sub), fill, stroke, sw, **kw)


def rrect(cv, x, y, w, h, r, fill=None, stroke=INK, sw=4, **kw):
    return shape(cv, rrect_pts(x, y, w, h, r), fill, stroke, sw, **kw)


def lin_grad(x0, y0, x1, y1, cols):
    return skia.GradientShader.MakeLinear([skia.Point(x0, y0), skia.Point(x1, y1)], [col(c) for c in cols])


def glow(cv, x, y, r, c, a=0.5):
    p = skia.Paint(Color=col(c, a), AntiAlias=True, MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, r * 0.45))
    cv.drawCircle(x, y, r, p)


def soft_shadow(cv, cx, cy, rx, ry, a=0.18):
    p = skia.Paint(Color=col(INK, a), AntiAlias=True, MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 8))
    cv.drawOval(skia.Rect(cx - rx, cy - ry, cx + rx, cy + ry), p)


# ---------------------------------------------------------------- maple leaf
_LEAF = [(0, -1.0), (0.12, -0.72), (0.32, -0.8), (0.27, -0.42), (0.62, -0.62), (0.55, -0.42), (0.86, -0.36),
         (0.62, -0.08), (0.78, 0.05), (0.38, 0.18), (0.42, 0.42), (0.06, 0.32), (0.05, 0.75), (-0.05, 0.75),
         (-0.06, 0.32), (-0.42, 0.42), (-0.38, 0.18), (-0.78, 0.05), (-0.62, -0.08), (-0.86, -0.36), (-0.55, -0.42),
         (-0.62, -0.62), (-0.27, -0.42), (-0.32, -0.8), (-0.12, -0.72)]


def maple_leaf(cv, x, y, s, fill=RED, stroke=INK, sw=3, rot=0.0, alpha=1.0, **kw):
    ca, sa = math.cos(rot), math.sin(rot)
    pts = [(x + s * (px * ca - py * sa), y + s * (px * sa + py * ca)) for px, py in _LEAF]
    return shape(cv, pts, fill, stroke, sw, smooth=False, jit=s * 0.02, alpha=alpha, **kw)


# ---------------------------------------------------------------- textures
def make_paper():
    rng = np.random.default_rng(7)
    # low-frequency mottling
    small = rng.normal(0, 1, (H // 60 + 2, W // 60 + 2))
    from PIL import Image
    mott = np.array(Image.fromarray(((small - small.min()) / (np.ptp(small)) * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC), np.float32) / 255
    grain = rng.normal(0, 1, (H, W)).astype(np.float32)
    g2 = np.array(Image.fromarray(((grain * 30 + 128).clip(0, 255)).astype(np.uint8)).resize((W // 2, H // 2), Image.BILINEAR).resize((W, H), Image.BILINEAR), np.float32) / 255 - 0.5
    val = 1.0 - 0.05 * mott - 0.035 * np.abs(grain) * 0.6 - 0.06 * g2
    # fibers
    fib = Image.new('L', (W, H), 255)
    from PIL import ImageDraw
    d = ImageDraw.Draw(fib)
    for i in range(500):
        x, y = rng.uniform(0, W), rng.uniform(0, H)
        a = rng.uniform(0, math.pi)
        l = rng.uniform(6, 26)
        d.line([(x, y), (x + l * math.cos(a), y + l * math.sin(a))], fill=int(rng.uniform(228, 246)), width=1)
    val *= np.array(fib, np.float32) / 255
    val = val.clip(0.75, 1.0)
    rgba = np.zeros((H, W, 4), np.uint8)
    for i, cc in enumerate((255, 252, 246)):
        rgba[..., i] = (val * cc).clip(0, 255)
    rgba[..., 3] = 255
    # tooth: white specks (paper showing through crayon)
    tooth = np.zeros((H, W, 4), np.uint8)
    n = rng.random((H, W))
    m = n > 0.965
    tooth[m, 0] = 255; tooth[m, 1] = 252; tooth[m, 2] = 244
    tooth[m, 3] = (rng.uniform(40, 110, m.sum())).astype(np.uint8)
    return skia.Image.fromarray(rgba), skia.Image.fromarray(tooth)


PAPER_IMG = None
TOOTH_IMG = None


def textures():
    global PAPER_IMG, TOOTH_IMG
    if PAPER_IMG is None:
        PAPER_IMG, TOOTH_IMG = make_paper()
    return PAPER_IMG, TOOTH_IMG


def apply_paper(cv):
    p_img, t_img = textures()
    cv.drawImage(t_img, 0, 0)
    cv.drawImage(p_img, 0, 0, skia.SamplingOptions(), skia.Paint(BlendMode=skia.BlendMode.kMultiply))


# ---------------------------------------------------------------- fonts
FONT_DIR = os.path.join(HERE, 'fonts')
TF_BOLD = skia.Typeface.MakeFromFile(os.path.join(FONT_DIR, 'f4.ttf'))   # Kalam Bold
TF_REG = skia.Typeface.MakeFromFile(os.path.join(FONT_DIR, 'f5.ttf'))    # Kalam Regular
TF_CAV = skia.Typeface.MakeFromFile(os.path.join(FONT_DIR, 'f1.ttf'))    # Caveat Bold
