"""Blob-autotile analysis for the pack's 16 px tilesets.

A blob sheet draws a patch of material A (centre) surrounded by material B. Every 16x16 piece is classified by
which of its four sides show material B; that gives the game's 4-bit edge mask (N=1, E=2, S=4, W=8 -> neighbour
on that side is B). Pieces with ambiguous sides or inner-corner notches are rejected.
Material samples are taken from tiles known to be pure A / pure B; transparent pixels count as their own colour."""
from core import load

TRANSPARENT = (-1, -1, -1)


def _key(p):
    return TRANSPARENT if p[3] == 0 else p[:3]


def palette(im, tiles):
    s = set()
    for tx, ty in tiles:
        for y in range(16):
            for x in range(16):
                s.add(_key(im.getpixel((tx * 16 + x, ty * 16 + y))))
    return s


def classify_fn(pal_a, pal_b):
    def dist(c, pal):
        if c == TRANSPARENT:
            return 0 if TRANSPARENT in pal else 999
        return min((abs(c[0] - p[0]) + abs(c[1] - p[1]) + abs(c[2] - p[2])) if p != TRANSPARENT else 999 for p in pal)
    cache = {}
    def cls(p):
        k = _key(p)
        if k not in cache:
            da, db = dist(k, pal_a), dist(k, pal_b)
            cache[k] = 'A' if da < db and da <= 30 else 'B' if db < da and db <= 30 else None
        return cache[k]
    return cls


def edge_pieces(rel, is_a, region=None, strict=0.75, im=None):
    """Return {mask: [(tx, ty), ...]} for pieces whose centre is material A (predicate on RGBA pixels);
    every other pixel is material B."""
    im = im or load(rel)
    cls = lambda p: 'A' if is_a(p) else 'B'
    W, H = im.width // 16, im.height // 16
    x0, y0, x1, y1 = region or (0, 0, W, H)
    x1, y1 = min(x1, W), min(y1, H)

    def frac(tx, ty, pts):
        v = [cls(im.getpixel((tx * 16 + x, ty * 16 + y))) for x, y in pts]
        return sum(1 for c in v if c == 'B') / len(v)

    band = range(5, 11)
    sides = {1: [(x, y) for x in band for y in (0, 1)], 4: [(x, y) for x in band for y in (14, 15)],
             8: [(x, y) for y in band for x in (0, 1)], 2: [(x, y) for y in band for x in (14, 15)]}
    corners = {(1, 8): [(x, y) for x in (0, 1, 2) for y in (0, 1, 2)], (1, 2): [(x, y) for x in (13, 14, 15) for y in (0, 1, 2)],
               (4, 8): [(x, y) for x in (0, 1, 2) for y in (13, 14, 15)], (4, 2): [(x, y) for x in (13, 14, 15) for y in (13, 14, 15)]}
    centre = [(x, y) for x in range(6, 10) for y in range(6, 10)]
    out = {}
    for ty in range(y0, y1):
        for tx in range(x0, x1):
            c = frac(tx, ty, centre)
            if c > 0.05:
                continue
            m, ok = 0, True
            for bit, pts in sides.items():
                f = frac(tx, ty, pts)
                if f >= strict:
                    m |= bit
                elif f > 1 - strict:
                    ok = False
            for (s1, s2), pts in corners.items():
                f = frac(tx, ty, pts)
                if not (m & s1) and not (m & s2) and f > 0.34:
                    ok = False  # inner-corner notch: only diagonal neighbour is B
            if ok:
                out.setdefault(m, []).append((tx, ty))
    return out
