"""Core helpers for importing "Farm RPG - Tiny Asset Pack" art (EmanuelleDev) into the AtlasLayout rectangles.

Placement rules
- AtlasLayout rectangles and sprite IDs are never changed (GDD contract).
- Art is placed either at x2 (one pack pixel = 2 game pixels, e.g. 16 px icon -> 32 px rect) or at x1 inside
  a larger rect with a runtime `native` scale of 2 recorded in public/assets/sprite_native.json, so the renderer
  draws it at a crisp integer x2 (lets 32x48 trees fit 64x64 resource rects, etc.).
- Every touched rect gets its 2 px padding re-extruded so tools/validate_atlases.mjs keeps passing.
"""
import json
import os
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SPEC = ROOT / 'Kayip_Ufuk_GDD_v2_0'
PUBLIC = ROOT / 'public'
PACK = Path(os.environ.get('FARMPACK_DIR', ROOT / 'vendor' / 'farmpack'))


class PackError(Exception):
    pass


def pack_file(rel):
    p = PACK / rel
    if not p.is_file():
        raise PackError(f'missing pack file: {rel}')
    return p


def load(rel):
    return Image.open(pack_file(rel)).convert('RGBA')


def cell(rel_or_img, col, row, cw=16, ch=16, ox=0, oy=0):
    """Crop grid cell (col,row) of size cw x ch (optional pixel origin offset)."""
    im = load(rel_or_img) if isinstance(rel_or_img, str) else rel_or_img
    box = (ox + col * cw, oy + row * ch, ox + (col + 1) * cw, oy + (row + 1) * ch)
    if box[2] > im.width or box[3] > im.height:
        raise PackError(f'cell {col},{row} ({cw}x{ch}) outside {getattr(im, "filename", "image")} {im.size}')
    return im.crop(box)


def trim(im):
    bb = im.getchannel('A').getbbox()
    return im.crop(bb) if bb else im


def opaque(im):
    return sum(1 for a in im.getchannel('A').getdata() if a)


def stack(*layers):
    base = Image.new('RGBA', layers[0].size)
    for l in layers:
        if l is not None:
            base.alpha_composite(l.convert('RGBA'))
    return base


class Atlas:
    def __init__(self):
        self.layout = json.loads((SPEC / 'Art/AtlasLayout.json').read_text(encoding='utf8'))
        self.rects = self.layout['sprites']
        self.pad = self.layout['paddingPixels']
        self.pages = {}
        for pg in self.layout['pages']:
            self.pages[pg['pageId']] = Image.open(PUBLIC / pg['plannedPngPath']).convert('RGBA')
        native_path = PUBLIC / 'assets/sprite_native.json'
        self.native = {}
        self.prov = {}
        self.touched = set()

    def rect(self, sid):
        r = self.rects.get(sid)
        if not r:
            raise PackError(f'unknown sprite id {sid}')
        return r

    def put(self, sid, art, scale=2, anchor='bottom', native=None, dy=0, dx=0, source=None, clear=True):
        """Place `art` (pack pixels) into the rect of `sid`.
        scale: integer upscale applied before placement (nearest neighbour).
        anchor: 'bottom' (bottom-centre), 'center', 'top', or (x, y) top-left in rect pixels.
        native: runtime draw multiplier recorded for the renderer (e.g. 2 when art is stored at x1)."""
        r = self.rect(sid)
        art = art.convert('RGBA')
        if scale != 1:
            art = art.resize((art.width * scale, art.height * scale), Image.NEAREST)
        if art.width > r['w'] or art.height > r['h']:
            raise PackError(f'{sid}: art {art.size} larger than rect {r["w"]}x{r["h"]}')
        if anchor == 'bottom':
            x, y = (r['w'] - art.width) // 2, r['h'] - art.height
        elif anchor == 'center':
            x, y = (r['w'] - art.width) // 2, (r['h'] - art.height) // 2
        elif anchor == 'top':
            x, y = (r['w'] - art.width) // 2, 0
        else:
            x, y = anchor
        x += dx; y += dy
        page = self.pages[r['pageId']]
        if clear:
            page.paste((0, 0, 0, 0), (r['x'], r['y'], r['x'] + r['w'], r['y'] + r['h']))
        tile = Image.new('RGBA', (r['w'], r['h']))
        tile.alpha_composite(art, (x, y))
        if clear:
            page.paste(tile, (r['x'], r['y']))
        else:
            page.alpha_composite(tile, (r['x'], r['y']))
        bb = tile.getchannel('A').getbbox()
        if native and native != 1:
            self.native[sid] = {'scale': native, 'bbox': list(bb) if bb else None}
        else:
            self.native.pop(sid, None)
            if bb and (bb[2] - bb[0]) * (bb[3] - bb[1]) < r['w'] * r['h'] * 0.35:
                self.native[sid] = {'scale': 1, 'bbox': list(bb)}
        self.prov[sid] = source or 'farmpack'
        self.touched.add(sid)
        return tile

    def get(self, sid):
        r = self.rect(sid)
        return self.pages[r['pageId']].crop((r['x'], r['y'], r['x'] + r['w'], r['y'] + r['h']))

    def ghost_from(self, sid_complete, sid_ghost):
        """Placement ghost = translucent cyan-tinted copy of the finished sprite (same layout)."""
        src = self.get(sid_complete)
        px = src.load()
        out = Image.new('RGBA', src.size)
        po = out.load()
        for y in range(src.height):
            for x in range(src.width):
                r, g, b, a = px[x, y]
                if a:
                    l = (r * 3 + g * 6 + b) // 10
                    po[x, y] = (min(255, 90 + l // 2), min(255, 170 + l // 3), 255, 150)
        r = self.rect(sid_ghost)
        if src.size != (r['w'], r['h']):
            raise PackError(f'ghost size mismatch {sid_complete} -> {sid_ghost}')
        page = self.pages[r['pageId']]
        page.paste(out, (r['x'], r['y']))
        if sid_complete in self.native:
            self.native[sid_ghost] = dict(self.native[sid_complete])
        self.prov[sid_ghost] = 'derived ghost of ' + sid_complete
        self.touched.add(sid_ghost)

    def extrude(self):
        for sid in self.touched:
            r = self.rects[sid]
            page = self.pages[r['pageId']]
            px = page.load()
            W, H = page.size
            x0, y0, w, h, p = r['x'], r['y'], r['w'], r['h'], self.pad
            for k in range(1, p + 1):
                for x in range(x0, x0 + w):
                    if y0 - k >= 0: px[x, y0 - k] = px[x, y0]
                    if y0 + h - 1 + k < H: px[x, y0 + h - 1 + k] = px[x, y0 + h - 1]
                for y in range(y0 - p, y0 + h + p):
                    cy = max(y0, min(y0 + h - 1, y))
                    if 0 <= y < H:
                        if x0 - k >= 0: px[x0 - k, y] = px[x0, cy]
                        if x0 + w - 1 + k < W: px[x0 + w - 1 + k, y] = px[x0 + w - 1, cy]

    def save(self):
        self.extrude()
        for pg in self.layout['pages']:
            self.pages[pg['pageId']].save(PUBLIC / pg['plannedPngPath'], optimize=True)
        (PUBLIC / 'assets/sprite_native.json').write_text(json.dumps(self.native, sort_keys=True), encoding='utf8')


def components(im, min_px=12, gap=1):
    """Bounding boxes (l,t,r,b) of opaque connected regions (8-neighbour, bridging `gap` transparent px), top-to-bottom."""
    w, h = im.size
    a = im.getchannel('A').load()
    seen = [[False] * w for _ in range(h)]
    out = []
    for y in range(h):
        for x in range(w):
            if seen[y][x] or not a[x, y]:
                continue
            stack = [(x, y)]; seen[y][x] = True; n = 0; l, t, r, b = x, y, x, y
            while stack:
                cx, cy = stack.pop(); n += 1
                l, t, r, b = min(l, cx), min(t, cy), max(r, cx), max(b, cy)
                for dy in range(-1 - gap, 2 + gap):
                    for dx in range(-1 - gap, 2 + gap):
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < w and 0 <= ny < h and not seen[ny][nx] and a[nx, ny]:
                            seen[ny][nx] = True; stack.append((nx, ny))
            if n >= min_px:
                out.append((l, t, r + 1, b + 1))
    return sorted(out, key=lambda bb: (bb[1] // 8, bb[0]))


def piece(rel, index, min_px=12, gap=1):
    im = load(rel)
    comps = components(im, min_px, gap)
    if index >= len(comps):
        raise PackError(f'{rel}: component {index} of {len(comps)}')
    return im.crop(comps[index])
