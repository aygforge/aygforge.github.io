"""Core hand-drawn rendering helpers (skia)."""
import math, os, random
import numpy as np
import skia

W, H = 1080, 1920
FPS = 30
HERE = os.path.dirname(os.path.abspath(__file__))

# ---------------------------------------------------------------- palette
def C(hexs, a=1.0):
    hexs = hexs.lstrip('#')
    r, g, b = int(hexs[0:2], 16), int(hexs[2:4], 16), int(hexs[4:6], 16)
    return skia.Color(r, g, b, int(255 * max(0, min(1, a))))

PAPER   = '#F3EBDA'
INK     = '#262849'   # dark navy
PURPLE  = '#3B2D55'
BRICK   = '#A84B3C'
BRICK2  = '#C26A52'
GRAY    = '#8E8E95'
CONCR   = '#BDB7AC'
CONCR_D = '#948E85'
POLICE  = '#2F5DA8'
POLICE_L= '#5C8BD6'
SIREN_R = '#E0473A'
SIREN_B = '#3C7BFF'
LED_C   = '#46F7E6'
LED_G   = '#72FF7E'
LED_W   = '#FFF6C8'
BOARD   = '#1D1F27'
SKY     = '#DCE3E6'
WATER   = '#9FC3D3'
GRASS   = '#A9B886'
MUSTARD = '#D8A846'
SKIN    = ['#E8B994', '#C98E68', '#8D5A3C', '#F1CBA8', '#B47A55']
COATS   = ['#3E4F72', '#7A3F3A', '#5B6B4A', '#46424E', '#8A6E4B', '#2F3E5C', '#6B5A7A']

class G:
    seed = 0      # line boil seed (changes every 3 frames)
    frame = 0
    t = 0.0

# ---------------------------------------------------------------- noise
def vnoise(x, seed=0):
    """1D smooth value noise in [-1,1]."""
    i = math.floor(x); f = x - i
    def h(n):
        n = (n * 374761393 + seed * 668265263) & 0xffffffff
        n = (n ^ (n >> 13)) * 1274126177 & 0xffffffff
        return ((n ^ (n >> 16)) & 0xffff) / 32767.5 - 1.0
    u = f * f * (3 - 2 * f)
    return h(i) * (1 - u) + h(i + 1) * u

def ease(x):
    x = max(0.0, min(1.0, x)); return x * x * (3 - 2 * x)

def ease_out(x):
    x = max(0.0, min(1.0, x)); return 1 - (1 - x) ** 3

def ease_in(x):
    x = max(0.0, min(1.0, x)); return x ** 3

def ease_io(x):
    x = max(0.0, min(1.0, x))
    return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2

def back_out(x, s=1.7):
    x = max(0.0, min(1.0, x)); x -= 1
    return x * x * ((s + 1) * x + s) + 1

def seg(t, a, b):
    """normalized progress of t in [a,b]"""
    if b <= a: return 1.0 if t >= b else 0.0
    return max(0.0, min(1.0, (t - a) / (b - a)))

def lerp(a, b, u): return a + (b - a) * u

def pop(t, t0, d=0.35):
    """scale factor for a pop-in at t0"""
    return back_out(seg(t, t0, t0 + d))

# ---------------------------------------------------------------- textures
_HATCH = None
_PAPER = None
_GRAIN = []

def _img_from_np(arr):
    arr = np.ascontiguousarray(arr)
    if arr.ndim == 2:
        arr = np.dstack([arr, arr, arr, np.full_like(arr, 255)])
    return skia.Image.fromarray(arr, colorType=skia.ColorType.kRGBA_8888_ColorType)

def _blur(a, s):
    from scipy.ndimage import gaussian_filter
    return gaussian_filter(a, s)

def build_textures():
    global _HATCH, _PAPER, _GRAIN
    rng = np.random.default_rng(7)
    # hatch: diagonal crayon strokes (multiply texture, mostly light)
    S = 512
    surf = skia.Surface(S, S)
    cv = surf.getCanvas(); cv.clear(skia.ColorWHITE)
    p = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeCap=skia.Paint.kRound_Cap)
    rr = random.Random(3)
    for _ in range(2600):
        x, y = rr.uniform(-40, S + 40), rr.uniform(-40, S + 40)
        L = rr.uniform(14, 46); ang = math.radians(rr.gauss(-38, 7))
        v = rr.randint(172, 232)
        p.setColor(skia.Color(v, v, v, rr.randint(30, 95)))
        p.setStrokeWidth(rr.uniform(1.0, 2.6))
        for dx in (0, S, -S):
            for dy in (0, S, -S):
                cv.drawLine(x + dx, y + dy, x + dx + L * math.cos(ang), y + dy + L * math.sin(ang), p)
    img = surf.makeImageSnapshot()
    arr = img.toarray()[:, :, :3].astype(np.float32)
    # add speckle (lighter = paper showing through)
    n = rng.random((S, S)) ** 6 * 40
    arr = np.clip(arr + n[..., None], 0, 255)
    a8 = np.dstack([arr.astype(np.uint8), np.full((S, S), 255, np.uint8)])
    _HATCH = _img_from_np(a8).makeRasterImage()

    # paper
    base = np.array([243, 235, 218], np.float32)
    low = _blur(rng.standard_normal((H // 4, W // 4)), 18)
    low = np.kron(low / (np.abs(low).max() + 1e-6), np.ones((4, 4)))[:H, :W]
    mid = _blur(rng.standard_normal((H, W)), 2.2)
    mid /= np.abs(mid).max()
    hi = rng.standard_normal((H, W)) * 0.5
    lum = low * 7 + mid * 5 + hi * 3
    yy, xx = np.mgrid[0:H, 0:W]
    vig = ((xx / W - 0.5) ** 2 * 1.2 + (yy / H - 0.5) ** 2) * 34
    lum = lum - vig
    rgb = base[None, None, :] + lum[..., None] * np.array([1.0, 0.97, 0.9])
    # fibers
    fib = np.zeros((H, W), np.float32)
    for _ in range(260):
        x0, y0 = rng.uniform(0, W), rng.uniform(0, H)
        ang = rng.uniform(0, math.pi); L = rng.uniform(10, 50)
        ts = np.linspace(0, 1, int(L))
        cx = (x0 + np.cos(ang) * L * ts + np.sin(ts * 6) * 2).astype(int)
        cy = (y0 + np.sin(ang) * L * ts).astype(int)
        m = (cx >= 0) & (cx < W) & (cy >= 0) & (cy < H)
        fib[cy[m], cx[m]] += rng.choice([-1, 1]) * rng.uniform(5, 12)
    rgb += _blur(fib, 0.6)[..., None]
    rgb = np.clip(rgb, 0, 255).astype(np.uint8)
    _PAPER = _img_from_np(np.dstack([rgb, np.full((H, W), 255, np.uint8)]))

    # grain overlays (multiply-ish: centered at 255)
    for k in range(3):
        g = rng.standard_normal((H, W)) * 9 + _blur(rng.standard_normal((H, W)), 1.0) * 10
        g = np.clip(244 + g, 0, 255).astype(np.uint8)
        _GRAIN.append(_img_from_np(g))

_HS = {}
def hatch_shader(scale=1.0):
    if scale not in _HS:
        m = skia.Matrix.Scale(scale, scale)
        _HS[scale] = _HATCH.makeShader(skia.TileMode.kRepeat, skia.TileMode.kRepeat, skia.SamplingOptions(skia.FilterMode.kLinear), m)
    return _HS[scale]

def paper_image(): return _PAPER
def grain_image(i): return _GRAIN[i % len(_GRAIN)]

# ---------------------------------------------------------------- paths
def P(pts, closed=True):
    p = skia.Path()
    p.moveTo(*pts[0])
    for q in pts[1:]: p.lineTo(*q)
    if closed: p.close()
    return p

def S(pts, closed=True):
    """smooth path through points (quadratic midpoints)"""
    p = skia.Path()
    n = len(pts)
    if n < 3: return P(pts, closed)
    if closed:
        m0 = ((pts[-1][0] + pts[0][0]) / 2, (pts[-1][1] + pts[0][1]) / 2)
        p.moveTo(*m0)
        for i in range(n):
            a = pts[i]; b = pts[(i + 1) % n]
            p.quadTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
        p.close()
    else:
        p.moveTo(*pts[0])
        for i in range(1, n - 1):
            a = pts[i]; b = pts[i + 1]
            p.quadTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
        p.lineTo(*pts[-1])
    return p

def R(x, y, w, h, r=0):
    p = skia.Path()
    if r > 0: p.addRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, w, h), r, r))
    else: p.addRect(skia.Rect.MakeXYWH(x, y, w, h))
    return p

def O(cx, cy, rx, ry=None):
    p = skia.Path(); ry = rx if ry is None else ry
    p.addOval(skia.Rect.MakeLTRB(cx - rx, cy - ry, cx + rx, cy + ry))
    return p

def wob_circle(cx, cy, r, seed=0, amp=0.06, n=28):
    pts = []
    for i in range(n):
        a = i / n * 2 * math.pi
        rr = r * (1 + amp * vnoise(i * 0.7, seed))
        pts.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr))
    return S(pts)

# ---------------------------------------------------------------- drawing
def _pe(seg, dev, seed):
    return skia.DiscretePathEffect.Make(seg, dev, int(seed) & 0x7fffffff)

def ink(c, path, w=4.0, col=INK, a=1.0, dev=None, double=True, seed=0):
    sd = G.seed * 7 + seed
    p = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=w,
                   Color=C(col, 0.92 * a), StrokeCap=skia.Paint.kRound_Cap, StrokeJoin=skia.Paint.kRound_Join)
    p.setPathEffect(_pe(max(6, w * 2.6), dev if dev is not None else 0.32 * w + 0.5, sd))
    c.drawPath(path, p)
    if double:
        p2 = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=max(1, w * 0.45),
                        Color=C(col, 0.42 * a), StrokeCap=skia.Paint.kRound_Cap)
        p2.setPathEffect(_pe(max(5, w * 2.0), 0.55 * w + 0.6, sd + 131))
        c.drawPath(path, p2)

_HP = {}
def hatch_paint(scale=1.0, key=''):
    """shared paint holding the hatch shader (passing shaders across pybind is slow)"""
    k = (scale, key)
    if k not in _HP:
        p = skia.Paint(AntiAlias=True); p.setShader(hatch_shader(scale)); _HP[k] = p
    return _HP[k]

def fill(c, path, col, a=1.0, hatch=True, off=(1.6, 1.4), rough=True, seed=0):
    if hatch:
        p = hatch_paint(1.0, 'r' if rough else 's')
        p.setColorFilter(skia.ColorFilters.Blend(C(col), skia.BlendMode.kMultiply))
        p.setAlphaf(max(0.0, min(1.0, a)))
    else:
        p = skia.Paint(AntiAlias=True, Color=C(col, a))
    if rough: p.setPathEffect(_pe(14, 1.4, G.seed * 7 + 77 + seed))
    if off:
        c.save(); c.translate(*off); c.drawPath(path, p); c.restore()
    else:
        c.drawPath(path, p)

def shape(c, path, col=None, w=4.0, inkc=INK, a=1.0, hatch=True, line=True, seed=0):
    if col: fill(c, path, col, a, hatch, seed=seed)
    if line and w > 0: ink(c, path, w, inkc, a, seed=seed)

def line(c, pts, w=4.0, col=INK, a=1.0, smooth=False, seed=0):
    path = S(pts, False) if smooth else P(pts, False)
    ink(c, path, w, col, a, seed=seed)

def glow(c, x, y, r, col, a=1.0):
    p = skia.Paint(AntiAlias=True, Color=C(col, a))
    p.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, max(0.5, r * 0.5)))
    c.drawCircle(x, y, r, p)

def glow_path(c, path, col, sigma, a=1.0):
    p = skia.Paint(AntiAlias=True, Color=C(col, a))
    p.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, sigma))
    c.drawPath(path, p)

def soft_light(c, x, y, r, col, a=0.5):
    """additive-ish radial light"""
    p = skia.Paint(AntiAlias=True)
    p.setShader(skia.GradientShader.MakeRadial((x, y), r, [C(col, a), C(col, 0)]))
    p.setBlendMode(skia.BlendMode.kPlus if False else skia.BlendMode.kScreen)
    c.drawCircle(x, y, r, p)

def flat(c, path, col, a=1.0):
    c.drawPath(path, skia.Paint(AntiAlias=True, Color=C(col, a)))

def scribble_lines(c, x, y, w, h, n, col=GRAY, lw=3, seed=0, a=0.8, last_short=True):
    """illegible handwriting-ish lines"""
    rr = random.Random(seed)
    gap = h / max(1, n)
    for i in range(n):
        yy = y + gap * (i + 0.5)
        ww = w * (rr.uniform(0.55, 0.75) if (last_short and i == n - 1) else rr.uniform(0.85, 1.0))
        pts = []
        k = int(ww / 9) + 2
        for j in range(k):
            xx = x + ww * j / (k - 1)
            pts.append((xx, yy + math.sin(j * 1.7 + i) * gap * 0.12 + rr.uniform(-1, 1)))
        line(c, pts, lw, col, a, smooth=True, seed=seed + i)

# ---------------------------------------------------------------- text
_TF = {}
def typeface(name):
    if name not in _TF:
        _TF[name] = skia.Typeface.MakeFromFile(os.path.join(HERE, 'fonts', name))
    return _TF[name]

def text_width(s, font):
    return font.measureText(s)

def wrap(s, font, maxw):
    words = s.split(' ')
    lines, cur = [], ''
    for wd in words:
        tryl = (cur + ' ' + wd).strip()
        if font.measureText(tryl) <= maxw or not cur:
            cur = tryl
        else:
            lines.append(cur); cur = wd
    if cur: lines.append(cur)
    return lines

def balanced_wrap(s, font, maxw):
    """wrap then rebalance to reduce ragged last line"""
    lines = wrap(s, font, maxw)
    n = len(lines)
    if n <= 1: return lines
    lo, hi = maxw * 0.5, maxw
    best = lines
    for _ in range(18):
        mid = (lo + hi) / 2
        l2 = wrap(s, font, mid)
        if len(l2) <= n: best = l2; hi = mid
        else: lo = mid
    return best
