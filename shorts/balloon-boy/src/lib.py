# Hand-drawn colored-pencil drawing library (skia) for "Bu Gerçekten Yaşandı"
import math, os, random
import numpy as np
import skia

W, H = 1080, 1920
FPS = 30
HERE = os.path.dirname(os.path.abspath(__file__))

# ---------------------------------------------------------------- palette
def hexc(h, a=1.0):
    h = h.lstrip('#')
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return skia.ColorSetARGB(int(255 * max(0, min(1, a))), r, g, b)

def rgbf(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4))

INK = '#2A2350'       # dark navy / purple outline
INK2 = '#3B2D5E'
PAPER = '#F4ECDC'
SKY = '#A9C4D6'
SKY2 = '#C9DBE4'
SILVER = '#C9CED6'
SILVER_D = '#8E95A2'
SILVER_L = '#EEF1F4'
RED = '#C8372D'
RED_D = '#9E2A23'
CREAM = '#FBF5E8'
GRASS = '#9DB46A'
GRASS_D = '#6F8C46'
FIELD = '#D9C27A'
FIELD_D = '#B89A50'
ROOF = '#9B5A47'
SIDING = '#E3D2B0'
SIDING2 = '#CDB991'
WOOD = '#B98B5E'
WOOD_D = '#8A6240'
SKIN = '#EDC4A0'
NAVYF = '#3D4A7A'
POLICE = '#2F3D6B'
ORANGE = '#E58A3A'
YELLOW = '#E9C450'
SCREEN = '#2D3247'
CORK = '#C49A6C'

# ---------------------------------------------------------------- textures
def _blur(a, k):
    # cheap box blur via cumulative sums (wraps)
    for ax in (0, 1):
        a = sum(np.roll(a, s, axis=ax) for s in range(-k, k + 1)) / (2 * k + 1)
    return a

def _make_textures():
    rng = np.random.default_rng(7)
    # grain tile used for crayon alpha modulation
    n = rng.random((512, 512))
    n2 = _blur(rng.random((512, 512)), 2)
    g = 0.55 * n + 0.45 * (n2 - n2.min()) / (n2.max() - n2.min())
    # add directional pencil strokes
    img = np.zeros((512, 512))
    for _ in range(2600):
        x0, y0 = rng.integers(0, 512, 2)
        L = rng.integers(10, 40)
        ang = -0.9 + rng.normal(0, 0.12)
        val = rng.random()
        for i in range(L):
            xx = int(x0 + i * math.cos(ang)) % 512
            yy = int(y0 + i * math.sin(ang)) % 512
            img[yy, xx] = max(img[yy, xx], val)
    g = np.clip(0.6 * g + 0.4 * img, 0, 1)
    g = (g - g.min()) / (g.max() - g.min())
    grain = np.zeros((512, 512, 4), np.uint8)
    grain[..., 0] = grain[..., 1] = grain[..., 2] = (g * 255).astype(np.uint8)
    grain[..., 3] = 255

    # hatch tile: dark diagonal pencil lines on transparent
    hat = np.zeros((256, 256, 4), np.uint8)
    hs = skia.Surface.MakeRaster(skia.ImageInfo.Make(256, 256, skia.kRGBA_8888_ColorType, skia.kPremul_AlphaType))
    hc = hs.getCanvas()
    hc.clear(0)
    r = random.Random(3)
    for i in range(520):
        x = r.uniform(-20, 276); y = r.uniform(-20, 276)
        L = r.uniform(14, 34)
        ang = math.radians(-58 + r.gauss(0, 7))
        p = skia.Paint(Color=skia.ColorSetARGB(int(r.uniform(22, 70)), 40, 30, 70), StrokeWidth=r.uniform(0.8, 1.8),
                       Style=skia.Paint.kStroke_Style, AntiAlias=True, StrokeCap=skia.Paint.kRound_Cap)
        for ox in (-256, 0, 256):
            for oy in (-256, 0, 256):
                hc.drawLine(x + ox, y + oy, x + ox + math.cos(ang) * L, y + oy + math.sin(ang) * L, p)
    hatch = hs.makeImageSnapshot()

    # paper overlay (multiply): near-white with mottling and grain
    ph = []
    big = rng.random((H // 4, W // 4))
    big = _blur(big, 6)
    big = (big - big.min()) / (big.max() - big.min())
    big = np.kron(big, np.ones((4, 4)))
    for v in range(3):
        fine = rng.random((H, W))
        val = 1.0 - 0.055 * big - 0.07 * fine ** 3
        # fibers
        arr = np.clip(val, 0, 1)
        o = np.zeros((H, W, 4), np.uint8)
        o[..., 0] = (arr * 255).astype(np.uint8)
        o[..., 1] = (arr * 252).astype(np.uint8)
        o[..., 2] = (arr * 246).astype(np.uint8)
        o[..., 3] = 255
        ph.append(skia.Image.fromarray(o))
        if v == 0:
            pass
    # vignette
    yy, xx = np.mgrid[0:H, 0:W]
    d = np.sqrt(((xx - W / 2) / (W * 0.62)) ** 2 + ((yy - H / 2) / (H * 0.62)) ** 2)
    vg = np.clip(1.0 - 0.22 * np.clip(d - 0.55, 0, 1) ** 1.6, 0, 1)
    vo = np.zeros((H, W, 4), np.uint8)
    vo[..., 0] = (vg * 255).astype(np.uint8)
    vo[..., 1] = (vg * 250).astype(np.uint8)
    vo[..., 2] = (vg * 240).astype(np.uint8)
    vo[..., 3] = 255
    return skia.Image.fromarray(grain), hatch, ph, skia.Image.fromarray(vo)

GRAIN, HATCH, PAPER_OV, VIGNETTE = _make_textures()

def font(name, size):
    f = skia.Font(TF[name], size)
    f.setEdging(skia.Font.Edging.kAntiAlias)
    f.setSubpixel(True)
    return f

TF = {
    'kalam': skia.Typeface.MakeFromFile(os.path.join(HERE, 'fonts/f6.ttf')),
    'kalamb': skia.Typeface.MakeFromFile(os.path.join(HERE, 'fonts/f5.ttf')),
    'caveat': skia.Typeface.MakeFromFile(os.path.join(HERE, 'fonts/f2.ttf')),
    'caveatb': skia.Typeface.MakeFromFile(os.path.join(HERE, 'fonts/f1.ttf')),
    'brush': skia.Typeface.MakeFromFile(os.path.join(HERE, 'fonts/f3.ttf')),
}

# ---------------------------------------------------------------- easing
def clamp(x, a=0.0, b=1.0):
    return a if x < a else b if x > b else x

def lerp(a, b, t):
    return a + (b - a) * t

def ease(t):
    t = clamp(t)
    return t * t * (3 - 2 * t)

def eio(t):
    t = clamp(t)
    return 4 * t * t * t if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2

def eout(t):
    t = clamp(t)
    return 1 - (1 - t) ** 3

def ein(t):
    t = clamp(t)
    return t * t * t

def back(t):
    t = clamp(t)
    c1 = 1.70158; c3 = c1 + 1
    return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2

def prog(t, a, b):
    return clamp((t - a) / (b - a)) if b > a else (1.0 if t >= a else 0.0)

def mixc(h1, h2, t):
    a = rgbf(h1); b = rgbf(h2)
    return '#%02X%02X%02X' % tuple(int(255 * lerp(a[i], b[i], clamp(t))) for i in range(3))

# ---------------------------------------------------------------- drawing ctx
class Ctx:
    def __init__(self):
        self.info = skia.ImageInfo.Make(W, H, skia.kRGBA_8888_ColorType, skia.kPremul_AlphaType)
        self.surf = skia.Surface.MakeRaster(self.info)
        self.c = self.surf.getCanvas()
        self.t = 0.0
        self.seed = 0
        self.alpha = 1.0

    def begin(self, t):
        self.t = t
        self.seed = int(t * 7.5)  # line boil rate
        self.c.clear(hexc(PAPER))

    # -- paints
    def grain_paint(self, color, a=1.0, s=0.45, scale=1.0, off=(0, 0)):
        r, g, b = rgbf(color)
        a *= self.alpha
        m = skia.Matrix()
        m.setScale(scale, scale)
        m.postTranslate(off[0] + (self.seed % 3) * 37, off[1] + (self.seed % 3) * 19)
        sh = GRAIN.makeShader(skia.TileMode.kRepeat, skia.TileMode.kRepeat, skia.SamplingOptions(), m)
        cf = skia.ColorFilters.Matrix([0, 0, 0, 0, r,
                                       0, 0, 0, 0, g,
                                       0, 0, 0, 0, b,
                                       s * a, 0, 0, 0, (1 - s) * a])
        return skia.Paint(Shader=sh, ColorFilter=cf, AntiAlias=True)

    def stroke_paint(self, color, w, a=1.0, rough=2.0, seg=12, seed_off=0, grain=0.35):
        p = self.grain_paint(color, a, s=grain, scale=0.7)
        p.setStyle(skia.Paint.kStroke_Style)
        p.setStrokeWidth(w)
        p.setStrokeCap(skia.Paint.kRound_Cap)
        p.setStrokeJoin(skia.Paint.kRound_Join)
        if rough > 0:
            p.setPathEffect(skia.DiscretePathEffect.Make(seg, rough, (self.seed * 13 + seed_off) & 0xFFFF))
        return p

    # -- primitives
    def shape(self, path, fill=None, lw=5.0, ink=INK, hatch=0.35, a=1.0, rough=1.8, grain=0.42,
              misreg=(2.5, 2.0), double=True, ink_a=1.0, shader=None):
        c = self.c
        if fill is not None or shader is not None:
            c.save()
            c.translate(misreg[0], misreg[1])
            if shader is not None:
                p = skia.Paint(Shader=shader, AntiAlias=True)
                p.setAlphaf(a * self.alpha)
                c.drawPath(path, p)
                gp = self.grain_paint('#FFFFFF', a * 0.25, s=1.0)
                c.drawPath(path, gp)
            else:
                fp = self.grain_paint(fill, a, s=grain)
                if rough > 0:
                    fp.setPathEffect(skia.DiscretePathEffect.Make(18, rough * 0.8, (self.seed * 7 + 3) & 0xFFFF))
                c.drawPath(path, fp)
            if hatch > 0:
                c.save()
                c.clipPath(path, skia.ClipOp.kIntersect, True)
                m = skia.Matrix()
                m.setTranslate((self.seed % 2) * 3, 0)
                hp = skia.Paint(Shader=HATCH.makeShader(skia.TileMode.kRepeat, skia.TileMode.kRepeat,
                                                        skia.SamplingOptions(), m), AntiAlias=True)
                hp.setAlphaf(clamp(hatch * a * self.alpha))
                b = path.computeTightBounds()
                c.drawRect(b.makeOutset(4, 4), hp)
                c.restore()
            c.restore()
        if lw > 0:
            c.drawPath(path, self.stroke_paint(ink, lw, a * ink_a, rough=rough))
            if double:
                c.drawPath(path, self.stroke_paint(ink, max(1.0, lw * 0.38), 0.55 * a * ink_a, rough=rough * 1.4,
                                                   seed_off=91, seg=9))

    def line(self, pts, w=4.0, color=INK, a=1.0, rough=1.5, closed=False, curve=True):
        if len(pts) < 2:
            return
        p = skia.Path()
        p.moveTo(*pts[0])
        if curve and len(pts) > 2:
            for i in range(1, len(pts) - 1):
                mx = (pts[i][0] + pts[i + 1][0]) / 2
                my = (pts[i][1] + pts[i + 1][1]) / 2
                p.quadTo(pts[i][0], pts[i][1], mx, my)
            p.lineTo(*pts[-1])
        else:
            for q in pts[1:]:
                p.lineTo(*q)
        if closed:
            p.close()
        self.c.drawPath(p, self.stroke_paint(color, w, a, rough=rough))

    def dashed(self, path, w=4, color='#FFFFFF', a=1.0, on=16, offp=11, phase=0.0, rough=1.2):
        pe = skia.PathEffect.MakeCompose(skia.DiscretePathEffect.Make(10, rough, self.seed & 0xFFFF),
                                         skia.DashPathEffect.Make([on, offp], phase))
        p = self.grain_paint(color, a, s=0.3)
        p.setStyle(skia.Paint.kStroke_Style)
        p.setStrokeWidth(w)
        p.setStrokeCap(skia.Paint.kRound_Cap)
        p.setPathEffect(pe)
        self.c.drawPath(path, p)

    def glow(self, x, y, r, color, a=0.5):
        p = skia.Paint(Color=hexc(color, a * self.alpha), AntiAlias=True,
                       MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, r * 0.45))
        self.c.drawCircle(x, y, r, p)

    def soft_rect(self, rect, color, a, blur=0):
        p = skia.Paint(Color=hexc(color, a * self.alpha), AntiAlias=True)
        if blur:
            p.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, blur))
        self.c.drawRect(rect, p)

    def fill_rect_tex(self, rect, color, a=1.0, s=0.4, hatch=0.0):
        p = skia.Path(); p.addRect(rect)
        self.shape(p, color, lw=0, hatch=hatch, a=a, rough=0, grain=s, misreg=(0, 0))

    def gradient_rect(self, rect, cols, a=1.0, vertical=True, pos=None):
        if vertical:
            pts = [skia.Point(rect.left(), rect.top()), skia.Point(rect.left(), rect.bottom())]
        else:
            pts = [skia.Point(rect.left(), rect.top()), skia.Point(rect.right(), rect.top())]
        sh = skia.GradientShader.MakeLinear(pts, [hexc(cc, a * self.alpha) for cc in cols], pos)
        self.c.drawRect(rect, skia.Paint(Shader=sh, AntiAlias=True))

    def paper_overlay(self, strength=1.0):
        img = PAPER_OV[(self.seed // 1) % 3]
        p = skia.Paint(BlendMode=skia.BlendMode.kMultiply)
        p.setAlphaf(strength)
        self.c.drawImage(img, 0, 0, skia.SamplingOptions(), p)
        p2 = skia.Paint(BlendMode=skia.BlendMode.kMultiply)
        self.c.drawImage(VIGNETTE, 0, 0, skia.SamplingOptions(), p2)

    def text(self, s, x, y, f, color=INK, a=1.0, align='left', stroke=None, sw=10):
        w = f.measureText(s)
        if align == 'center':
            x -= w / 2
        elif align == 'right':
            x -= w
        if stroke:
            sp = skia.Paint(Color=hexc(stroke, a * self.alpha), AntiAlias=True, Style=skia.Paint.kStroke_Style,
                            StrokeWidth=sw, StrokeJoin=skia.Paint.kRound_Join)
            self.c.drawString(s, x, y, f, sp)
        self.c.drawString(s, x, y, f, skia.Paint(Color=hexc(color, a * self.alpha), AntiAlias=True))
        return w

    def scribble(self, x, y, w, h=0, color=INK, lw=3, a=0.8, seed=0, lines=1, gap=14):
        # abstract handwriting: wavy loops, unreadable
        r = random.Random(seed)
        for li in range(lines):
            pts = []
            xx = x
            ln = w * r.uniform(0.6, 1.0) if lines > 1 else w
            while xx < x + ln:
                pts.append((xx, y + li * gap + r.uniform(-h * 0.5, h * 0.5) - (r.random() < 0.3) * h))
                xx += r.uniform(5, 11)
            self.line(pts, lw, color, a, rough=0.8)

# ---------------------------------------------------------------- path helpers
def P():
    return skia.Path()

def oval(x, y, rx, ry):
    p = skia.Path(); p.addOval(skia.Rect(x - rx, y - ry, x + rx, y + ry)); return p

def circle(x, y, r):
    return oval(x, y, r, r)

def rect(x0, y0, x1, y1):
    p = skia.Path(); p.addRect(skia.Rect(x0, y0, x1, y1)); return p

def rrect(x0, y0, x1, y1, r):
    p = skia.Path(); p.addRRect(skia.RRect.MakeRectXY(skia.Rect(x0, y0, x1, y1), r, r)); return p

def poly(pts, close=True):
    p = skia.Path(); p.moveTo(*pts[0])
    for q in pts[1:]:
        p.lineTo(*q)
    if close:
        p.close()
    return p

def smooth(pts, close=True):
    p = skia.Path()
    n = len(pts)
    if close:
        m0 = ((pts[-1][0] + pts[0][0]) / 2, (pts[-1][1] + pts[0][1]) / 2)
        p.moveTo(*m0)
        for i in range(n):
            a = pts[i]; b = pts[(i + 1) % n]
            p.quadTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
        p.close()
    else:
        p.moveTo(*pts[0])
        for i in range(1, n - 1):
            p.quadTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2)
        p.lineTo(*pts[-1])
    return p
