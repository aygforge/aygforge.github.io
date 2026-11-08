"""Terrain: 20 base textures, edge transitions and water animation frames from the pack's 16 px tilesets (x2).

Transition semantics in pack mode (renderer reads sprite_native.__meta.terrain == 'pack'):
  shore/<m>       drawn on sea tiles (shallow/reef/deep), m = which neighbours are land  -> beach blob pieces
  river_bank/<m>  drawn on river/wetland tiles, m = which neighbours are land            -> grass-over-water pieces
  path/<m>        drawn on trail tiles, m = which neighbours are not trail               -> dirt-in-grass pieces
  cliff/<m>       unchanged procedural shading on land next to cliff walls
Water animation frames become sparse highlight layers so they never hide the baked shoreline edges."""
from PIL import Image
from core import load, cell
from autotile import edge_pieces

BEACH = 'Tileset/Beach animations tiles.png'
GRASS = 'Tileset/Tileset Grass Summer.png'
GRASS_SPRING = 'Tileset/Tileset Grass Spring.png'
GRASS_DEEP = 'Tileset/Tileset Grass Deep Forest.png'
WATER = 'Tileset/Water tile.png'
WATERGROUND = 'Tileset/Water Ground animations tiles.png'
ROCKCAVES = 'Tileset/Rock Caves.png'
CAVES = 'Tileset/Caves.png'
PATHS = 'Tileset/Path tiles.png'
PROPS = 'Objects/Props/Summer/PropsWater Summer.png'

is_sea = lambda p: p[3] and (p[2] > p[0] + 40 or (p[0] > 200 and p[1] > 220 and p[2] > 220))
is_clear = lambda p: p[3] == 0
is_dirt = lambda p: p[3] and p[0] > 190 and 100 < p[1] < 215 and p[2] < 150


def pure_tiles(im, pred, region=None, limit=8):
    W, H = im.width // 16, im.height // 16
    x0, y0, x1, y1 = region or (0, 0, W, H)
    out = []
    for ty in range(y0, min(y1, H)):
        for tx in range(x0, min(x1, W)):
            if all(pred(im.getpixel((tx * 16 + x, ty * 16 + y))) for x in range(16) for y in range(16)):
                out.append((tx, ty))
                if len(out) >= limit:
                    return out
    return out


def distinct(im, tiles, n=4):
    """pick up to n visually different tiles (by raw bytes) from the candidates"""
    seen, out = set(), []
    for t in tiles:
        b = cell(im, *t).tobytes()
        if b not in seen:
            seen.add(b); out.append(t)
        if len(out) == n:
            break
    if not out:
        raise RuntimeError('no candidate tiles found')
    while len(out) < n:
        out.append(out[len(out) % len(out)])
    return out


def tint(im, mul=(1, 1, 1), add=(0, 0, 0)):
    px = im.load(); out = im.copy(); po = out.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            po[x, y] = (max(0, min(255, int(r * mul[0] + add[0]))), max(0, min(255, int(g * mul[1] + add[1]))), max(0, min(255, int(b * mul[2] + add[2]))), a)
    return out


def over(base, top):
    out = base.copy(); out.alpha_composite(top); return out


def highlights(tile, base_lum=None):
    """ripple specks: bluish pixels that differ from the tile's dominant water colour; everything else transparent"""
    from collections import Counter
    dom = Counter(p[:3] for p in tile.getdata() if p[3]).most_common(1)[0][0]
    out = Image.new('RGBA', tile.size); po = out.load(); px = tile.load()
    for y in range(tile.height):
        for x in range(tile.width):
            r, g, b, a = px[x, y]
            if a and b >= r and (r, g, b) != dom:
                po[x, y] = (r, g, b, 200)
    return out


def lum(im):
    v = [(r * 3 + g * 6 + b) / 10 for r, g, b, a in im.getdata() if a]
    return sorted(v)[len(v) // 2]


def calm_sand(ripple, variant):
    """plain sand derived from the pack ripple tile's two colours: dominant colour + sparse grain (deterministic)"""
    from collections import Counter
    cols = [c for c, _ in Counter(p[:3] for p in ripple.getdata() if p[3]).most_common(2)]
    out = Image.new('RGBA', (16, 16), cols[0] + (255,)); px = out.load()
    h = 2166136261 ^ (variant * 977)
    for i in range(14):
        h = (h * 16777619 + i * 31) & 0xFFFFFFFF
        x, y = h % 16, (h >> 8) % 16
        px[x, y] = cols[1] + (255,)
        if (h >> 16) % 3 == 0 and x < 15:
            px[x + 1, y] = cols[1] + (255,)
    return out


def run(atlas, log):
    beach, grass, deep, water = load(BEACH), load(GRASS), load(GRASS_DEEP), load(WATER)
    spring = load(GRASS_SPRING)
    put = lambda sid, im, src: atlas.put(sid, im, scale=2, anchor=(0, 0), source=src)
    n = 0

    def base(name, tiles, src):
        nonlocal n
        for v, im in enumerate(tiles[:4]):
            put(f'terrain/{name}/{v}', im, src); n += 1

    # --- base textures ---
    sea_pure = [cell(beach, *t) for t in distinct(beach, pure_tiles(beach, is_sea, (0, 0, 12, 16), limit=40))]
    sand = [calm_sand(cell(beach, 12, 12), v) for v in range(4)]
    grass_light = [cell(grass, *t) for t in distinct(grass, pure_tiles(grass, lambda p: p[3] and p[1] > p[0] and p[1] > p[2], (0, 0, 12, 4)))]
    grass_dark = [cell(grass, *t) for t in distinct(grass, pure_tiles(grass, lambda p: p[3] and p[1] > p[0] and p[1] > p[2], (12, 0, 24, 4)))]
    grass_deep = [cell(deep, *t) for t in distinct(deep, pure_tiles(deep, lambda p: p[3] and p[1] >= p[0] and p[1] >= p[2], (0, 0, 24, 4)))]
    grass_spring = [cell(spring, *t) for t in distinct(spring, pure_tiles(spring, lambda p: p[3] and p[1] >= p[0] and p[1] >= p[2], (0, 0, 24, 4)))]
    dirt = [cell(grass, *t) for t in distinct(grass, edge_pieces(GRASS, is_dirt, (0, 8, 24, 16), im=grass)[0])]
    river = [water, water.transpose(Image.FLIP_LEFT_RIGHT), water.transpose(Image.FLIP_TOP_BOTTOM), water.transpose(Image.ROTATE_180)]
    caves = load(CAVES)
    floor = [cell(caves, *t) for t in distinct(caves, pure_tiles(caves, lambda p: p[3] and p[0] > 150 and p[0] > p[1] > p[2], (12, 0, 36, 3)))]
    rockim = load(ROCKCAVES)  # stone-column wall faces (opaque) for cliff walls
    rock = [cell(rockim, *t) for t in distinct(rockim, pure_tiles(rockim, lambda p: p[3] > 0, (0, 3, 4, 5)))]
    paths = load(PATHS)
    plaza = [cell(paths, *t) for t in distinct(paths, pure_tiles(paths, lambda p: p[3] > 0, (5, 1, 7, 3)))]
    props = load(PROPS)
    stone_in_water = cell(props, 4, 4)

    base('OCEAN_SHALLOW', sea_pure, BEACH + ' (pure sea pieces)')
    base('OCEAN_DEEP', [tint(t, (0.82, 0.82, 0.9)) for t in river], WATER + ' (darkened)')
    base('SEA_REEF', [over(sea_pure[i], stone_in_water) if i % 2 == 0 else tint(sea_pure[i], (0.9, 0.95, 0.95)) for i in range(4)], BEACH + ' + ' + PROPS)
    base('BEACH_SAND', sand, BEACH + ' (colours of the sand ripple tile, calm grain)')
    base('TIDAL_SANDBAR', [tint(s, (0.82, 0.86, 0.9)) for s in sand], BEACH + ' (sand, wet tint)')
    base('MEADOW', grass_light, GRASS)
    base('GROVE', grass_spring, GRASS_SPRING)
    base('LAGOON_SOIL', [tint(g, (1.06, 1.02, 0.86)) for g in grass_light], GRASS + ' (warm tint)')
    base('FOREST_FLOOR', grass_dark, GRASS + ' (dark grass)')
    base('REED_PATCH', [tint(g, (0.9, 1.0, 0.85)) for g in grass_deep], GRASS_DEEP + ' (tinted)')
    base('SWAMP_SOIL', [tint(g, (0.85, 0.85, 0.7), (12, 4, 0)) for g in grass_deep], GRASS_DEEP + ' (swamp tint)')
    base('RIVER_BANK', [tint(d, (0.72, 0.68, 0.62)) for d in dirt], GRASS + ' (dirt, mud tint)')
    base('DIRT_TRAIL', dirt, GRASS + ' (dirt patch)')
    base('RIVER_DEEP', river, WATER)
    base('WETLAND_WADE', [tint(r, (0.9, 1.0, 0.85), (6, 10, 0)) for r in river], WATER + ' (wetland tint)')
    base('RIVER_FORD', [over(river[0], stone_in_water), river[1], over(river[2], stone_in_water.transpose(Image.FLIP_LEFT_RIGHT)), river[3]], WATER + ' + ' + PROPS)
    base('MOUNTAIN_SOIL', floor, CAVES + ' (floor)')
    base('ROCKY_GROUND', [tint(f, (0.8, 0.8, 0.82), (10, 10, 12)) for f in floor], CAVES + ' (floor, grey tint)')
    base('CLIFF_WALL', rock, ROCKCAVES + ' (stone wall face)')
    base('SETTLEMENT_GROUND', plaza, PATHS + ' (paved)')

    # --- transitions (16 masks each; 0 = pure centre material) ---
    t = 0
    for fam, sheet, im, pred, region, under in [
        ('shore', BEACH, beach, is_sea, (0, 0, 12, 4), None),
        ('river_bank', GRASS, grass, is_clear, (0, 4, 12, 8), water),
        ('path', GRASS, grass, is_dirt, (0, 8, 12, 12), None),
    ]:
        pieces = edge_pieces(sheet, pred, region, im=im)
        missing = [m for m in range(16) if m not in pieces]
        if missing:
            raise RuntimeError(f'{fam}: masks {missing} not found in {sheet}')
        for m in range(16):
            tile = cell(im, *pieces[m][0])
            if under is not None:
                tile = over(under, tile)
            put(f'terrain/transition/{fam}/{m}', tile, f'{sheet}#cell{pieces[m][0]} mask {m}'); t += 1

    # --- water animation: sparse highlight frames (never hide baked edges) ---
    w = 0
    wg = load(WATERGROUND)
    sea_frames = [cell(beach, *p) for p in pure_tiles(beach, is_sea, (0, 0, 12, 16), limit=40)]
    # ripple-ring tiles of the water-in-ground blob, 4 animation phases (rows 0/4/8/12) + 2 offsets
    blue_frames = [cell(wg, *p) for p in [(16, 0), (16, 4), (16, 8), (16, 12), (14, 1), (14, 5)]]
    for kind, frames in [('shallow_water', blue_frames), ('deep_water', blue_frames[::-1]), ('river', blue_frames), ('shore_foam', blue_frames[1:] + blue_frames[:1])]:
        bl = lum(frames[0])
        hi = [h for h in (highlights(f, bl) for f in frames) if h.getbbox()]
        if not hi:
            raise RuntimeError(f'no highlight pixels for {kind}')
        for k in range(6):
            frame = hi[(k * 3 + (1 if kind == 'deep_water' else 0)) % len(hi)]
            if k % 2:
                frame = frame.transpose(Image.FLIP_LEFT_RIGHT)
            put(f'terrain/water/{kind}/{k}', frame, f'{BEACH if "sea" in kind or "shallow" in kind or "foam" in kind else WATERGROUND} highlights'); w += 1
    atlas.native['__meta'] = {'terrain': 'pack'}
    log['terrainBase'] = n
    log['terrainTransitions'] = t
    log['waterFrames'] = w
