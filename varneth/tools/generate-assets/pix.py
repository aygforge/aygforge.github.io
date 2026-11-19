"""Small pixel-art drawing toolkit on top of Pillow + numpy.
Everything is drawn at native resolution (no anti-aliasing) and finished with
an automatic 1px dark outline and a consistent top-left light direction."""
import math
import numpy as np
from PIL import Image, ImageDraw

OUTLINE = (18, 12, 22, 255)


def hexc(s, a=255):
    s = s.lstrip('#')
    return (int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16), a)


def shade(c, f):
    return tuple(max(0, min(255, int(round(v * f)))) for v in c[:3]) + (c[3] if len(c) > 3 else 255,)


def mix(a, b, t):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3)) + (255,)


def new(w, h):
    return Image.new('RGBA', (w, h), (0, 0, 0, 0))


class Pen:
    """Wraps ImageDraw with pixel-art friendly helpers."""

    def __init__(self, img):
        self.img = img
        self.d = ImageDraw.Draw(img)

    def px(self, x, y, c):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < self.img.width and 0 <= y < self.img.height:
            self.img.putpixel((x, y), c)

    def line(self, p1, p2, c, w=1):
        p1 = (round(p1[0]), round(p1[1]))
        p2 = (round(p2[0]), round(p2[1]))
        if w <= 1:
            self.d.line([p1, p2], fill=c, width=1)
            return
        self.d.line([p1, p2], fill=c, width=int(w))
        r = (w - 1) / 2
        for p in (p1, p2):
            self.d.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=c)

    def circle(self, cx, cy, r, c):
        self.d.ellipse([round(cx - r), round(cy - r), round(cx + r), round(cy + r)], fill=c)

    def ellipse(self, cx, cy, rx, ry, c):
        self.d.ellipse([round(cx - rx), round(cy - ry), round(cx + rx), round(cy + ry)], fill=c)

    def poly(self, pts, c):
        self.d.polygon([(round(x), round(y)) for x, y in pts], fill=c)

    def rect(self, x0, y0, x1, y1, c):
        self.d.rectangle([round(x0), round(y0), round(x1), round(y1)], fill=c)

    def limb(self, p1, p2, w, base):
        """Cylindrical shaded limb: dark core, mid fill, 1px highlight on the lit side."""
        self.line(p1, p2, shade(base, 0.72), w)
        if w >= 3:
            self.line((p1[0] - 0.4, p1[1] - 0.4), (p2[0] - 0.4, p2[1] - 0.4), base, w - 1)
            self.line((p1[0] - 1, p1[1] - 0.6), (p2[0] - 1, p2[1] - 0.6), shade(base, 1.18), 1)
        else:
            self.line(p1, p2, base, w)

    def shaded_poly(self, pts, base):
        self.poly(pts, shade(base, 0.75))
        cx = sum(p[0] for p in pts) / len(pts)
        cy = sum(p[1] for p in pts) / len(pts)
        inner = [(cx + (x - cx) * 0.78 - 0.6, cy + (y - cy) * 0.78 - 0.6) for x, y in pts]
        self.poly(inner, base)
        hi = [(cx + (x - cx) * 0.45 - 1.2, cy + (y - cy) * 0.45 - 1.2) for x, y in pts]
        self.poly(hi, shade(base, 1.15))

    def shaded_ellipse(self, cx, cy, rx, ry, base):
        self.ellipse(cx, cy, rx, ry, shade(base, 0.72))
        self.ellipse(cx - 0.5, cy - 0.5, rx - 0.8, ry - 0.8, base)
        self.ellipse(cx - rx * 0.35, cy - ry * 0.35, max(0.6, rx * 0.35), max(0.6, ry * 0.35), shade(base, 1.2))


def outline(img, color=OUTLINE):
    a = np.array(img)
    alpha = a[:, :, 3] > 0
    n = np.zeros_like(alpha)
    n[1:, :] |= alpha[:-1, :]
    n[:-1, :] |= alpha[1:, :]
    n[:, 1:] |= alpha[:, :-1]
    n[:, :-1] |= alpha[:, 1:]
    edge = n & ~alpha
    a[edge] = color
    return Image.fromarray(a)


def dither_gradient(w, h, top, bottom, steps=8):
    """Vertical gradient using ordered (Bayer) dithering between bands — classic pixel-art sky."""
    bayer = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16.0
    a = np.zeros((h, w, 4), dtype=np.uint8)
    for y in range(h):
        t = y / max(1, h - 1) * (steps - 1)
        band = int(t)
        frac = t - band
        c0 = mix(top, bottom, band / (steps - 1))
        c1 = mix(top, bottom, min(steps - 1, band + 1) / (steps - 1))
        row = np.where(bayer[y % 4, np.arange(w) % 4] < frac, 1, 0)
        a[y, :, :3] = np.where(row[:, None] == 1, np.array(c1[:3]), np.array(c0[:3]))
        a[y, :, 3] = 255
    return Image.fromarray(a)


def rot(p, ang, origin=(0, 0)):
    s, c = math.sin(ang), math.cos(ang)
    x, y = p[0] - origin[0], p[1] - origin[1]
    return (origin[0] + x * c - y * s, origin[1] + x * s + y * c)


def lerp(a, b, t):
    return a + (b - a) * t


def lerp2(p, q, t):
    return (lerp(p[0], q[0], t), lerp(p[1], q[1], t))


def ease(t):
    return t * t * (3 - 2 * t)


def sheet(frames, cols):
    w, h = frames[0].size
    rows = (len(frames) + cols - 1) // cols
    out = new(w * cols, h * rows)
    for i, f in enumerate(frames):
        out.paste(f, ((i % cols) * w, (i // cols) * h), f)
    return out
