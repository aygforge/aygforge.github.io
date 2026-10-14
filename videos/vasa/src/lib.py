"""Hand-drawn colored-pencil drawing helpers on top of skia."""
import math, os
import numpy as np
import skia

W, H = 1080, 1920
FPS = 30
HERE = os.path.dirname(os.path.abspath(__file__))
FONTDIR = os.path.join(HERE, '..', 'fonts', 'node_modules', '@expo-google-fonts')

# ---------------------------------------------------------------- palette
def C(hexstr, a=255):
    hexstr = hexstr.lstrip('#')
    return skia.Color(int(hexstr[0:2], 16), int(hexstr[2:4], 16), int(hexstr[4:6], 16), a)

INK = '#2C2654'        # dark navy / purple pencil
INK_SOFT = '#4A4378'
PAPER = '#F5EEDF'

# ---------------------------------------------------------------- global time state (set per frame)
class _State:
    frame = 0
    boil = 0          # changes every 3 frames -> line boil
S = _State()

def set_frame(f):
    S.frame = f
    S.boil = f // 3

# ---------------------------------------------------------------- math helpers
def clamp(x, a=0.0, b=1.0):
    return a if x < a else b if x > b else x

def lerp(a, b, t):
    return a + (b - a) * t

def prog(t, t0, t1):
    if t1 <= t0:
        return 1.0 if t >= t1 else 0.0
    return clamp((t - t0) / (t1 - t0))

def smooth(x):
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
    return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2

def back_out(x, s=1.7):
    x = clamp(x)
    x -= 1
    return x * x * ((s + 1) * x + s) + 1

def mix_color(c1, c2, t):
    a = c1.lstrip('#'); b = c2.lstrip('#')
    ra = [int(a[i:i + 2], 16) for i in (0, 2, 4)]
    rb = [int(b[i:i + 2], 16) for i in (0, 2, 4)]
    r = [int(round(lerp(x, y, clamp(t)))) for x, y in zip(ra, rb)]
    return '#%02X%02X%02X' % tuple(r)

def hsh(*args):
    """deterministic hash -> float in [0,1)"""
    h = 2166136261
    for a in args:
        for ch in str(a):
            h = ((h ^ ord(ch)) * 16777619) & 0xFFFFFFFF
    return (h % 100000) / 100000.0

# ---------------------------------------------------------------- textures
_rng = np.random.default_rng(7)

def _blur(img, r):
    if r <= 0:
        return img
    k = np.ones(2 * r + 1) / (2 * r + 1)
    out = img
    for ax in (0, 1):
        out = np.apply_along_axis(lambda m: np.convolve(np.concatenate([m[-r:], m, m[:r]]), k, 'valid'), ax, out)
    return out

def _make_crayon_tex(size=512, angle=-0.62, seed=1):
    rng = np.random.default_rng(seed)
    alpha = np.full((size, size), 0.80, np.float32)
    surf = skia.Surface(size, size)
    cv = surf.getCanvas()
    cv.clear(skia.Color(0, 0, 0, 0))
    p = skia.Paint(AntiAlias=True, StrokeCap=skia.Paint.kRound_Cap, Style=skia.Paint.kStroke_Style)
    for i in range(1800):
        x, y = rng.uniform(0, size, 2)
        ln = rng.uniform(20, 70)
        a = angle + rng.normal(0, 0.08)
        dx, dy = math.cos(a) * ln, math.sin(a) * ln
        p.setStrokeWidth(rng.uniform(1.0, 3.2))
        v = int(rng.uniform(30, 110))
        p.setColor(skia.Color(255, 255, 255, v))
        for ox in (-size, 0, size):
            for oy in (-size, 0, size):
                cv.drawLine(x + ox, y + oy, x + ox + dx, y + oy + dy, p)
    strokes = surf.makeImageSnapshot().toarray()[:, :, 3].astype(np.float32) / 255.0
    grain = rng.random((size, size)).astype(np.float32)
    alpha = 0.66 + 0.30 * np.clip(strokes * 1.4, 0, 1) - 0.10 * grain
    alpha = np.clip(alpha, 0.35, 1.0)
    arr = np.zeros((size, size, 4), np.uint8)
    arr[..., :3] = 255
    arr[..., 3] = (alpha * 255).astype(np.uint8)
    return skia.Image.fromarray(arr, colorType=skia.kRGBA_8888_ColorType, alphaType=skia.kUnpremul_AlphaType)

_TEX = None
_TEX2 = None
def crayon_shader(variant=0):
    global _TEX, _TEX2
    if _TEX is None:
        _TEX = _make_crayon_tex(seed=1)
        _TEX2 = _make_crayon_tex(seed=5, angle=0.5)
    img = _TEX if variant == 0 else _TEX2
    return img.makeShader(skia.TileMode.kRepeat, skia.TileMode.kRepeat)

def make_paper():
    rng = np.random.default_rng(3)
    base = np.array([245, 238, 223], np.float32)
    n1 = _blur(rng.random((H // 4, W // 4)).astype(np.float32), 2)
    n1 = np.kron(n1, np.ones((4, 4), np.float32))
    fine = rng.random((H, W)).astype(np.float32)
    v = (n1 - n1.mean()) * 22 + (fine - 0.5) * 9
    img = base[None, None, :] + v[..., None]
    # fibers
    surf = skia.Surface(W, H)
    cv = surf.getCanvas(); cv.clear(skia.Color(0, 0, 0, 0))
    p = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=1.2)
    for i in range(500):
        x, y = rng.uniform(0, W), rng.uniform(0, H)
        a = rng.uniform(0, math.pi); ln = rng.uniform(6, 26)
        p.setColor(skia.Color(120, 100, 70, int(rng.uniform(10, 35))))
        cv.drawLine(x, y, x + math.cos(a) * ln, y + math.sin(a) * ln, p)
    fib = surf.makeImageSnapshot().toarray()[:, :, 3].astype(np.float32) / 255.0
    img -= fib[..., None] * 60
    # warm vignette
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    d = np.sqrt(((xx - W / 2) / (W * 0.62)) ** 2 + ((yy - H / 2) / (H * 0.62)) ** 2)
    vig = np.clip(d - 0.55, 0, 1) ** 1.6
    img -= vig[..., None] * np.array([28, 34, 44], np.float32)
    img = np.clip(img, 0, 255).astype(np.uint8)
    arr = np.dstack([img, np.full((H, W), 255, np.uint8)])
    return arr

def make_grain():
    """multiply overlay: tooth of paper visible through everything"""
    rng = np.random.default_rng(11)
    fine = rng.random((H, W)).astype(np.float32)
    n1 = _blur(rng.random((H // 3, W // 3)).astype(np.float32), 1)
    n1 = np.kron(n1, np.ones((3, 3), np.float32))[:H, :W]
    g = 1.0 - (0.07 * fine + 0.07 * n1)
    v = (np.clip(g, 0, 1) * 255).astype(np.uint8)
    arr = np.dstack([v, v, v, np.full((H, W), 255, np.uint8)])
    return arr

# ---------------------------------------------------------------- wobbly paths
def _noise1(s, seed, freq=0.045):
    r1 = hsh(seed, 'a') * 6.28; r2 = hsh(seed, 'b') * 6.28; r3 = hsh(seed, 'c') * 6.28
    return (np.sin(s * freq + r1) * 0.6 + np.sin(s * freq * 2.3 + r2) * 0.3 + np.sin(s * freq * 5.1 + r3) * 0.18)

def resample(pts, closed, step=10.0):
    pts = np.asarray(pts, np.float64)
    if closed:
        pts = np.vstack([pts, pts[:1]])
    out = []
    for i in range(len(pts) - 1):
        a, b = pts[i], pts[i + 1]
        L = float(np.hypot(*(b - a)))
        n = max(1, int(L / step))
        for k in range(n):
            out.append(a + (b - a) * (k / n))
    if not closed:
        out.append(pts[-1])
    return np.array(out)

def wobble_pts(pts, closed=True, amp=1.6, seed=0, step=10.0, boil=True):
    P = resample(pts, closed, step)
    if len(P) < 2:
        return P
    d = np.diff(P, axis=0, append=P[:1] if closed else P[-1:] * 2 - P[-2:-1])
    nrm = np.stack([-d[:, 1], d[:, 0]], 1)
    ln = np.hypot(nrm[:, 0], nrm[:, 1]) + 1e-6
    nrm /= ln[:, None]
    seg = np.hypot(*np.diff(P, axis=0).T) if len(P) > 1 else np.zeros(0)
    s = np.concatenate([[0], np.cumsum(seg)])
    sd = (seed, S.boil) if boil else (seed,)
    off = _noise1(s, sd) * amp
    return P + nrm * off[:, None]

def path_from(P, closed=True, smooth_=True):
    path = skia.Path()
    n = len(P)
    if n == 0:
        return path
    if not smooth_ or n < 3:
        path.moveTo(*P[0])
        for p in P[1:]:
            path.lineTo(*p)
        if closed:
            path.close()
        return path
    if closed:
        m0 = (P[-1] + P[0]) / 2
        path.moveTo(*m0)
        for i in range(n):
            a = P[i]; b = P[(i + 1) % n]
            m = (a + b) / 2
            path.quadTo(a[0], a[1], m[0], m[1])
        path.close()
    else:
        path.moveTo(*P[0])
        for i in range(1, n - 1):
            a = P[i]; b = P[i + 1]
            m = (a + b) / 2
            path.quadTo(a[0], a[1], m[0], m[1])
        path.lineTo(*P[-1])
    return path

def wpath(pts, closed=True, amp=1.6, seed=0, step=10.0, boil=True):
    return path_from(wobble_pts(pts, closed, amp, seed, step, boil), closed)

def ellipse_pts(cx, cy, rx, ry, n=28, a0=0.0, a1=2 * math.pi):
    return [(cx + rx * math.cos(a0 + (a1 - a0) * i / n), cy + ry * math.sin(a0 + (a1 - a0) * i / n)) for i in range(n)]

def bez(p0, p1, p2, n=16):
    out = []
    for i in range(n + 1):
        t = i / n
        out.append(((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
                    (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]))
    return out

# ---------------------------------------------------------------- painting
_BASEP = {}
def _base_paint(variant):
    if variant not in _BASEP:
        bp = skia.Paint(AntiAlias=True)
        bp.setShader(crayon_shader(variant))   # setShader is very slow in skia-python -> do once
        _BASEP[variant] = bp
    return _BASEP[variant]

def fill_path(cv, path, color, alpha=1.0, tex=True, variant=0, opaque=True):
    col = C(color)
    if tex:
        if opaque:
            u = skia.Paint(AntiAlias=True)
            u.setColor(C(mix_color(color, PAPER, 0.42)))
            u.setAlphaf(alpha)
            cv.drawPath(path, u)
        p = skia.Paint(_base_paint(variant))
        p.setColorFilter(skia.ColorFilters.Blend(col, skia.BlendMode.kSrcIn))
        p.setAlphaf(alpha)
    else:
        p = skia.Paint(AntiAlias=True)
        p.setColor(col)
        p.setAlphaf(alpha)
    cv.drawPath(path, p)

def stroke_path(cv, path, width=4.0, color=INK, alpha=1.0, cap=True):
    p = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=width,
                   StrokeCap=skia.Paint.kRound_Cap if cap else skia.Paint.kButt_Cap,
                   StrokeJoin=skia.Paint.kRound_Join)
    p.setColor(C(color))
    p.setAlphaf(alpha)
    cv.drawPath(path, p)

def shape(cv, pts, fill=None, line=INK, lw=4.0, closed=True, seed=0, amp=1.6, alpha=1.0,
          tex=True, double=True, step=10.0, lalpha=1.0, variant=0, opaque=True):
    """fill + pencil outline of a polygon/polyline"""
    if fill is not None and closed:
        fp = wpath(pts, True, amp * 0.8, (seed, 'f'), step)
        fill_path(cv, fp, fill, alpha, tex, variant, opaque)
    if line is not None and lw > 0:
        op = wpath(pts, closed, amp, seed, step)
        stroke_path(cv, op, lw, line, alpha * lalpha)
        if double:
            op2 = wpath(pts, closed, amp * 1.4, (seed, 'd'), step)
            stroke_path(cv, op2, max(1.0, lw * 0.38), line, 0.45 * alpha * lalpha)

def line(cv, pts, lw=3.5, color=INK, seed=0, amp=1.2, alpha=1.0, double=False, step=10.0):
    shape(cv, pts, None, color, lw, closed=False, seed=seed, amp=amp, alpha=alpha, double=double, step=step)

def hatch(cv, clip_pts, color, spacing=11, angle=-0.7, lw=2.0, alpha=0.35, seed=0, bbox=None):
    """pencil hatching clipped to a polygon"""
    cv.save()
    cv.clipPath(path_from(np.asarray(clip_pts, float), True, False), doAntiAlias=True)
    xs = [p[0] for p in clip_pts]; ys = [p[1] for p in clip_pts]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    R = math.hypot(x1 - x0, y1 - y0) / 2 + 5
    ca, sa = math.cos(angle), math.sin(angle)
    p = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=lw, StrokeCap=skia.Paint.kRound_Cap)
    p.setColor(C(color)); p.setAlphaf(alpha)
    k = -R
    i = 0
    while k <= R:
        j = hsh(seed, i, S.boil) - 0.5
        ox, oy = cx - sa * (k + j * 3), cy + ca * (k + j * 3)
        cv.drawLine(ox - ca * R, oy - sa * R, ox + ca * R, oy + sa * R, p)
        k += spacing; i += 1
    cv.restore()

def circle(cv, cx, cy, r, fill=None, line=INK, lw=3.5, seed=0, alpha=1.0, amp=1.2, double=True, n=None):
    n = n or max(12, int(r * 0.9))
    shape(cv, ellipse_pts(cx, cy, r, r, n), fill, line, lw, True, seed, amp, alpha, double=double, step=8)

# ---------------------------------------------------------------- text
_TF = {}
def typeface(name):
    if name not in _TF:
        paths = {
            'kalam_bold': 'kalam/700Bold/Kalam_700Bold.ttf',
            'kalam': 'kalam/400Regular/Kalam_400Regular.ttf',
            'kalam_light': 'kalam/300Light/Kalam_300Light.ttf',
            'caveat_bold': 'caveat/700Bold/Caveat_700Bold.ttf',
            'patrick': 'patrick-hand/400Regular/PatrickHand_400Regular.ttf',
        }
        _TF[name] = skia.Typeface.MakeFromFile(os.path.join(FONTDIR, paths[name]))
    return _TF[name]

def font(name, size):
    f = skia.Font(typeface(name), size)
    f.setSubpixel(True)
    f.setEdging(skia.Font.Edging.kAntiAlias)
    return f

def wrap(text, fnt, maxw):
    words = text.split(' ')
    lines = []; cur = ''
    for w_ in words:
        t = (cur + ' ' + w_).strip()
        if fnt.measureText(t) <= maxw or not cur:
            cur = t
        else:
            lines.append(cur); cur = w_
    if cur:
        lines.append(cur)
    return lines

def balance_wrap(text, fnt, maxw):
    """wrap then rebalance so lines have similar width (never alters words)"""
    lines = wrap(text, fnt, maxw)
    n = len(lines)
    if n <= 1:
        return lines
    lo, hi = maxw * 0.5, maxw
    best = lines
    for _ in range(18):
        mid = (lo + hi) / 2
        l2 = wrap(text, fnt, mid)
        if len(l2) <= n:
            best = l2; hi = mid
        else:
            lo = mid
    return best

def draw_text(cv, txt, x, y, fnt, color=INK, alpha=1.0, align='center'):
    p = skia.Paint(AntiAlias=True)
    p.setColor(C(color)); p.setAlphaf(alpha)
    w_ = fnt.measureText(txt)
    if align == 'center':
        x -= w_ / 2
    elif align == 'right':
        x -= w_
    cv.drawString(txt, x, y, fnt, p)
    return w_


def set_trim(p, k):
    """trim a stroke to fraction k (skia returns None for a no-op trim)"""
    if k < 0.999:
        e = skia.TrimPathEffect.Make(0, max(0.001, k))
        if e is not None:
            p.setPathEffect(e)
