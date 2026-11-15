# Colored-pencil drawing library (cairo) for the "Bu Gerçekten Yaşandı" style.
import math
import numpy as np
import cairo

W, H = 1080, 1920
FPS = 30


def hexc(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


PAPER = hexc('F3EAD7')
NAVY = hexc('2B2A4E')
INK = hexc('23204A')
PURPLE = hexc('3E3463')
OLIVE = hexc('6E7943')
OLIVE_L = hexc('8D9A5A')
OLIVE_D = hexc('545E33')
LEAF1 = hexc('6F8046')
LEAF2 = hexc('86955A')
LEAF3 = hexc('5B6B3A')
KHAKI = hexc('BBA877')
KHAKI_L = hexc('D3C59A')
GREY = hexc('8F9093')
GREY_L = hexc('B5B5B3')
GREY_D = hexc('676A70')
BLUE = hexc('7F9BB4')
BLUE_L = hexc('B3C6D3')
SEA = hexc('A4BACA')
BROWN = hexc('7B5E45')
BROWN_L = hexc('A8865F')
WOOD = hexc('D9BE8E')
SKIN = hexc('DDB48E')
RED = hexc('A64B3F')
ORANGE = hexc('C98A4A')
GROUND = hexc('B9B07C')
SKY = hexc('C8D5DC')
WHITE = hexc('FBF6EA')


def darker(c, k=0.72):
    return tuple(x * k for x in c)


def mix(a, b, k):
    return tuple(a[i] * (1 - k) + b[i] * k for i in range(3))


def clamp(x, a=0.0, b=1.0):
    return a if x < a else b if x > b else x


def sstep(e0, e1, t):
    x = clamp((t - e0) / (e1 - e0)) if e1 != e0 else (1.0 if t >= e1 else 0.0)
    return x * x * (3 - 2 * x)


def lin(e0, e1, t):
    return clamp((t - e0) / (e1 - e0))


def ease_out_back(x, k=1.7):
    x = clamp(x)
    x -= 1
    return 1 + x * x * ((k + 1) * x + k)


def ease_io(x):
    x = clamp(x)
    return 0.5 - 0.5 * math.cos(math.pi * x)


def lerp(a, b, k):
    return a + (b - a) * k


# ---------------------------------------------------------------- geometry
def ellipse_pts(cx, cy, rx, ry, n=28, a0=0.0, a1=2 * math.pi):
    return [(cx + rx * math.cos(a0 + (a1 - a0) * i / n), cy + ry * math.sin(a0 + (a1 - a0) * i / n))
            for i in range(n + (0 if a1 - a0 >= 2 * math.pi - 1e-6 else 1))]


def blob_pts(cx, cy, r, seed, n=26, lump=0.13, ry=None):
    rs = np.random.default_rng(seed)
    ph = rs.uniform(0, 6.28, 3)
    ry = r if ry is None else ry
    out = []
    for i in range(n):
        a = 2 * math.pi * i / n
        k = 1 + lump * (math.sin(5 * a + ph[0]) * 0.6 + math.sin(3 * a + ph[1]) * 0.5 + math.sin(7 * a + ph[2]) * 0.3)
        out.append((cx + r * k * math.cos(a), cy + ry * k * math.sin(a)))
    return out


def rect_pts(x, y, w, h):
    return [(x, y), (x + w, y), (x + w, y + h), (x, y + h)]


def xform(pts, x, y, s, flip=1, rot=0.0):
    c, sn = math.cos(rot), math.sin(rot)
    out = []
    for px, py in pts:
        px *= flip
        rx, ry = px * c - py * sn, px * sn + py * c
        out.append((x + rx * s, y + ry * s))
    return out


# ---------------------------------------------------------------- pen
class Pen:
    def __init__(self, ctx, boil, zoom=1.0):
        self.ctx = ctx
        self.boil = boil
        self.zoom = zoom

    def _rng(self, seed):
        return np.random.default_rng((int(seed) * 7919 + self.boil * 104729 + 17) & 0x7fffffff)

    def wob(self, pts, closed, seed, amp):
        p = np.asarray(pts, dtype=float)
        if len(p) < 2:
            return p
        if closed:
            p = np.vstack([p, p[:1]])
        seg = np.diff(p, axis=0)
        L = np.hypot(seg[:, 0], seg[:, 1])
        total = L.sum()
        if total <= 0:
            return p
        step = max(14.0 / self.zoom, total / 160.0)
        n = max(int(total / step), len(p) * 2, 4)
        cum = np.concatenate([[0], np.cumsum(L)])
        d = np.linspace(0, total, n + 1)
        x = np.interp(d, cum, p[:, 0])
        y = np.interp(d, cum, p[:, 1])
        # keep original vertices for crisp corners
        dv = cum
        x = np.concatenate([x, p[:, 0]])
        y = np.concatenate([y, p[:, 1]])
        dd = np.concatenate([d, dv])
        order = np.argsort(dd, kind='stable')
        x, y = x[order], y[order]
        r = self._rng(seed)
        a = amp / self.zoom
        off = r.normal(0, a, (len(x), 2))
        off = (off + np.roll(off, 1, 0) + np.roll(off, -1, 0)) / 3.0
        out = np.stack([x, y], 1) + off
        if closed:
            out[-1] = out[0]
        return out

    def _path(self, w, closed):
        ctx = self.ctx
        ctx.new_path()
        ctx.move_to(*w[0])
        for q in w[1:]:
            ctx.line_to(*q)
        if closed:
            ctx.close_path()

    def lw(self, v):
        return v * self.zoom ** -0.6

    def shape(self, pts, fill=None, line=NAVY, closed=True, seed=1, amp=1.2, lw=3.4,
              hatch=True, alpha=1.0, hatch_col=None, hatch_sp=10, hatch_ang=1.05, fill_a=0.94, double=True):
        ctx = self.ctx
        pts = list(pts)
        if fill is not None and closed:
            w = self.wob(pts, True, seed + 11, amp * 0.6)
            self._path(w, True)
            ctx.set_source_rgba(*fill, fill_a * alpha)
            P = np.asarray(pts)
            ext = (P.max(0) - P.min(0)) * self.zoom
            if hatch and min(ext) > 34:
                ctx.fill_preserve()
                ctx.save()
                ctx.clip()
                hc = hatch_col or darker(fill, 0.7)
                ctx.set_source_rgba(*hc, 0.26 * alpha)
                ctx.set_line_width(max(1.3, 2.0 / self.zoom ** 0.7) )
                x0, y0 = P.min(0)
                x1, y1 = P.max(0)
                sp = hatch_sp / self.zoom ** 0.7
                ca, sa = math.cos(hatch_ang), math.sin(hatch_ang)
                cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
                R = math.hypot(x1 - x0, y1 - y0) / 2 + 4
                r = self._rng(seed + 5)
                k = -R
                i = 0
                while k < R:
                    j = r.normal(0, sp * 0.18)
                    ox, oy = cx + (-sa) * (k + j), cy + ca * (k + j)
                    ctx.move_to(ox - ca * R, oy - sa * R)
                    ctx.line_to(ox + ca * R, oy + sa * R)
                    k += sp
                    i += 1
                ctx.stroke()
                ctx.restore()
            else:
                ctx.fill()
        if line is not None:
            w = self.wob(pts, closed, seed, amp)
            self._path(w, closed)
            ctx.set_line_join(cairo.LINE_JOIN_ROUND)
            ctx.set_line_cap(cairo.LINE_CAP_ROUND)
            ctx.set_source_rgba(*line, 0.92 * alpha)
            ctx.set_line_width(self.lw(lw))
            ctx.stroke()
            if double and lw >= 2.0:
                w2 = self.wob(pts, closed, seed + 3, amp * 1.4)
                self._path(w2, closed)
                ctx.set_source_rgba(*line, 0.35 * alpha)
                ctx.set_line_width(self.lw(lw * 0.55))
                ctx.stroke()

    def line(self, pts, col=NAVY, lw=3.2, seed=1, amp=1.0, alpha=1.0, dash=None, double=False):
        ctx = self.ctx
        w = self.wob(pts, False, seed, amp)
        self._path(w, False)
        ctx.set_line_cap(cairo.LINE_CAP_ROUND)
        ctx.set_line_join(cairo.LINE_JOIN_ROUND)
        ctx.set_source_rgba(*col, 0.92 * alpha)
        ctx.set_line_width(self.lw(lw))
        if dash:
            ctx.set_dash([d * self.zoom ** -0.6 for d in dash])
        ctx.stroke()
        ctx.set_dash([])
        if double:
            w = self.wob(pts, False, seed + 7, amp * 1.4)
            self._path(w, False)
            ctx.set_source_rgba(*col, 0.35 * alpha)
            ctx.set_line_width(self.lw(lw * 0.5))
            ctx.stroke()

    def circle(self, cx, cy, r, fill=None, line=NAVY, seed=1, lw=3.0, alpha=1.0, n=None, hatch=True):
        n = n or max(12, min(40, int(r * self.zoom / 2.5)))
        self.shape(ellipse_pts(cx, cy, r, r, n), fill=fill, line=line, seed=seed, lw=lw, alpha=alpha, hatch=hatch)


# ---------------------------------------------------------------- text
def text_extent(ctx, s, size, font='Kalam', bold=True):
    ctx.select_font_face(font, cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD if bold else cairo.FONT_WEIGHT_NORMAL)
    ctx.set_font_size(size)
    e = ctx.text_extents(s)
    return e.x_advance, e


def draw_text(ctx, s, x, y, size, col=NAVY, font='Kalam', bold=True, align='center', alpha=1.0, rot=0.0):
    ctx.save()
    ctx.select_font_face(font, cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD if bold else cairo.FONT_WEIGHT_NORMAL)
    ctx.set_font_size(size)
    adv = ctx.text_extents(s).x_advance
    ctx.translate(x, y)
    ctx.rotate(rot)
    dx = -adv / 2 if align == 'center' else (-adv if align == 'right' else 0)
    ctx.move_to(dx, 0)
    ctx.set_source_rgba(*col, alpha)
    ctx.show_text(s)
    ctx.restore()
    return adv


def wrap_lines(ctx, s, size, maxw, font='Kalam', bold=True):
    words = s.split(' ')
    lines, cur = [], ''
    for w_ in words:
        t = (cur + ' ' + w_).strip()
        if text_extent(ctx, t, size, font, bold)[0] <= maxw or not cur:
            cur = t
        else:
            lines.append(cur)
            cur = w_
    if cur:
        lines.append(cur)
    return lines


# ---------------------------------------------------------------- paper
_TEX = {}


def textures():
    if _TEX:
        return _TEX
    from PIL import Image, ImageFilter
    rs = np.random.default_rng(42)

    def blurred(scale, rad):
        n = rs.normal(0, 1, (H // scale + 2, W // scale + 2)).astype(np.float32)
        n = (n - n.min()) / (n.max() - n.min())
        im = Image.fromarray((n * 255).astype(np.uint8)).resize((W + 2 * scale, H + 2 * scale), Image.BICUBIC)
        if rad:
            im = im.filter(ImageFilter.GaussianBlur(rad))
        a = np.asarray(im, dtype=np.float32)[:H, :W] / 255.0
        return a - a.mean()

    low = blurred(60, 20)
    mid = blurred(6, 2)
    hi = rs.normal(0, 1, (H, W)).astype(np.float32)
    # fibres
    fib = np.zeros((H, W), np.float32)
    for _ in range(1400):
        x, y = rs.integers(0, W), rs.integers(0, H)
        L = rs.integers(6, 30)
        a = rs.uniform(0, math.pi)
        for k in range(L):
            xi, yi = int(x + k * math.cos(a)), int(y + k * math.sin(a))
            if 0 <= xi < W and 0 <= yi < H:
                fib[yi, xi] += 1
    lum = 1 + 0.06 * low + 0.05 * mid + 0.018 * hi - 0.05 * fib
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    vig = 1 - 0.10 * (((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2) ** 1.4
    paper = np.stack([lum * PAPER[2], lum * PAPER[1], lum * PAPER[0]], -1)  # BGR
    paper = np.clip(paper, 0, 1).astype(np.float32)
    # crayon tooth: where paper shows through pigment
    tooth = np.clip((mid * 3.0 + hi * 0.22) - 0.08, 0, 1) * 0.42
    tooth = tooth.astype(np.float32)[..., None]
    _TEX['paper'] = paper
    _TEX['tooth'] = tooth
    _TEX['vig'] = vig.astype(np.float32)[..., None]
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    buf = np.ndarray((H, W, 4), np.uint8, surf.get_data())
    buf[..., :3] = (paper * 255).astype(np.uint8)
    buf[..., 3] = 255
    surf.mark_dirty()
    _TEX['paper_surf'] = surf
    return _TEX


def new_canvas():
    tx = textures()
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    ctx = cairo.Context(surf)
    ctx.set_source_surface(tx['paper_surf'], 0, 0)
    ctx.paint()
    return surf, ctx


def surf_to_arr(surf):
    surf.flush()
    a = np.ndarray((H, W, 4), np.uint8, surf.get_data())[..., :3].astype(np.float32) / 255.0
    return a


def finish(arr, sat=1.0):
    tx = textures()
    paper = tx['paper']
    out = arr + (paper - arr) * tx['tooth']
    if sat < 0.999:
        g = out[..., 0:1] * 0.11 + out[..., 1:2] * 0.59 + out[..., 2:3] * 0.30
        out = g + (out - g) * sat
    out = out * tx['vig']
    return out


def arr_to_surface(arr):
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    buf = np.ndarray((H, W, 4), np.uint8, surf.get_data())
    buf[..., :3] = np.clip(arr * 255 + 0.5, 0, 255).astype(np.uint8)
    buf[..., 3] = 255
    surf.mark_dirty()
    return surf


def camera(ctx, cx, cy, z, rot=0.0, sx=540, sy=1200):
    ctx.translate(sx, sy)
    ctx.scale(z, z)
    if rot:
        ctx.rotate(rot)
    ctx.translate(-cx, -cy)


def with_alpha(ctx, a, fn):
    if a <= 0.003:
        return
    if a >= 0.997:
        fn()
        return
    ctx.push_group()
    fn()
    ctx.pop_group_to_source()
    ctx.paint_with_alpha(a)
