"""Buildables from the pack's furniture, work benches, storage and exterior props.

Art is stored at x1 (bottom-centred, drawn at native x2 so one pack tile = one game tile). Where a single prop is
smaller than the BuildDB footprint, a small vignette of several props is composed so the footprint is visually
filled. Every SOLID build is verified: each footprint cell must lie under visible pixels (no invisible walls,
same rule as VIS_08); otherwise the procedural sprite is kept. Houses, boats, raft, bridge, signal station, loom,
winch, compost bin, rain catchers, water filter, campfire, mechanical bench and pet/monkey props stay procedural."""
from PIL import Image
from core import cell, load, piece, components, trim, PackError

E = 'Objects/Exterior/'
I = 'Objects/Interior/'
WB = 'Objects/Work Benches/'
MINE = E + 'Mine and Dungeon/Mine/'
NON_SOLID = {'BUILD_PATH', 'BUILD_RUG', 'BUILD_BRIDGE', 'BUILD_PIER', 'BUILD_PLANTER', 'BUILD_ANIMAL_TRAP', 'BUILD_CRAB_TRAP', 'BUILD_FISH_TRAP',
             'BUILD_CAMP_MARKER', 'BUILD_GATE', 'BUILD_LEAF_SHELTER', 'BUILD_RAFT', 'BUILD_SIGNAL_STATION'}


def comp(rel, i):
    return piece(rel, i, 20, 1)


def first_by_size(rel, wmin, wmax, hmin, hmax):
    im = load(rel)
    for bb in components(im, 20, 1):
        w, h = bb[2] - bb[0], bb[3] - bb[1]
        if wmin <= w <= wmax and hmin <= h <= hmax:
            return im.crop(bb)
    raise PackError(f'{rel}: no component {wmin}-{wmax} x {hmin}-{hmax}')


def scene(w, h, parts):
    """compose props on a w x h pack-pixel canvas; parts = [(img, x, y_bottom)] (y_bottom = baseline)"""
    out = Image.new('RGBA', (w, h))
    for im, x, yb in parts:
        im = trim(im)
        out.alpha_composite(im, (x, yb - im.height))
    return trim_keep_bottom(out)


def trim_keep_bottom(im):
    bb = im.getchannel('A').getbbox()
    return im.crop((bb[0], bb[1], bb[2], im.height)) if bb else im


def covered(art, fw, fh):
    """art at x1 bottom-centred on a footprint of fw x fh tiles (16 px each at x1): every cell needs visible pixels"""
    W, H = fw * 16, fh * 16
    x0 = (W - art.width) // 2
    y0 = H - art.height
    a = art.getchannel('A').load()
    bad = []
    for cy in range(fh):
        for cx in range(fw):
            hits = 0
            for sy in range(cy * 16, cy * 16 + 16, 2):
                for sx in range(cx * 16, cx * 16 + 16, 2):
                    lx, ly = sx - x0, sy - y0
                    if 0 <= lx < art.width and 0 <= ly < art.height and a[lx, ly]:
                        hits += 1
            if hits < 8:
                bad.append((cx, cy, hits))
    return bad


def run(atlas, log):
    chest = load(E + 'chest.png')
    chest_closed = lambda i: trim(chest.crop((i * 32, 0, i * 32 + 32, 16)))
    logs = lambda i: piece('Objects/Tree/TREE TRUNKS copiar.png', i)
    furnace = lambda i: comp(WB + 'Furnace.png', i)
    crate = lambda i: comp(MINE + 'Miners props2.png', i)
    veg = lambda i: comp(E + 'Box.png', i)
    chair = comp(I + 'Chairs.png', 0)
    desk = first_by_size(I + 'Others.png', 26, 34, 14, 22)
    clothes = lambda i: comp(E + 'Village Clotheslines.png', i)

    builds = {
        'BUILD_CHEST_SMALL': (chest_closed(0), E + 'chest.png'),
        'BUILD_CHEST_LARGE': (scene(32, 16, [(chest_closed(0), 0, 16), (chest_closed(0), 16, 16)]), E + 'chest.png x2'),
        'BUILD_FOOD_CHEST': (veg(12), E + 'Box.png (produce crate)'),
        'BUILD_PANTRY': (scene(32, 32, [(veg(11), 2, 18), (veg(13), 17, 18), (veg(12), 2, 32), (veg(4), 17, 32)]), E + 'Box.png (4 crates)'),
        'BUILD_ORE_STORE': (scene(32, 32, [(crate(0), 2, 18), (crate(1), 17, 18), (crate(8), 2, 32), (crate(2), 17, 32)]), MINE + 'Miners props2.png (ore crates)'),
        'BUILD_LOG_STORE': (logs(3), 'Objects/Tree/TREE TRUNKS copiar.png'),
        'BUILD_WORKBENCH': (scene(36, 32, [(comp(WB + 'Workbench.png', 0), 0, 30), (comp(WB + 'Sharpening Station.png', 0), 18, 32), (comp(E + 'Farm Tools.png', 1), 22, 16)]), WB + 'Workbench + Sharpening Station + Farm Tools'),
        'BUILD_CARPENTER_BENCH': (scene(48, 30, [(logs(3), 0, 28), (comp(WB + 'Sawmill.png', 0), 28, 30), (comp(E + 'Farm Tools.png', 2), 34, 14)]), WB + 'Sawmill + log pile'),
        'BUILD_KILN': (furnace(0), WB + 'Furnace.png (cold)'),
        'BUILD_SMELTER': (furnace(2), WB + 'Furnace.png (lit)'),
        'BUILD_BENCH': (comp(E + 'Beach/Wooden Bench.png', 1), E + 'Beach/Wooden Bench.png'),
        'BUILD_CHAIR': (chair, I + 'Chairs.png'),
        'BUILD_TABLE': (desk, I + 'Others.png (desk)'),
        'BUILD_MAP_TABLE': (scene(32, 32, [(chair, 10, 20), (desk, 1, 32)]), I + 'Others.png desk + Chairs.png'),
        'BUILD_NAV_TABLE': (scene(32, 32, [(comp(I + 'Chairs.png', 2), 10, 20), (first_by_size(I + 'Others.png', 26, 34, 18, 22), 1, 32)]), I + 'Others.png desk + chair'),
        'BUILD_MATERIAL_SHELF': (first_by_size(I + 'Others.png', 28, 32, 30, 36), I + 'Others.png (shelf)'),
        'BUILD_TOOL_RACK': (scene(26, 16, [(comp(E + 'Farm Tools.png', 0), 0, 16), (comp(E + 'Farm Tools.png', 1), 12, 16), (comp(E + 'Farm Tools.png', 2), 18, 16)]), E + 'Farm Tools.png'),
        'BUILD_COMFORT_BED': (first_by_size(I + 'Beds.png', 28, 34, 28, 38), I + 'Beds.png (double)'),
        'BUILD_LAMP_POST': (comp(E + 'Street Lamp.png', 1), E + 'Street Lamp.png'),
        'BUILD_FENCE': (comp(E + 'Fence and Bridge/Fence Wood.png', 2), E + 'Fence and Bridge/Fence Wood.png'),
        'BUILD_WATER_TANK': (comp(E + 'water box.png', 0), E + 'water box.png'),
        'BUILD_IRRIGATION': (comp(E + 'Well .png', 0), E + 'Well .png'),
        'BUILD_DRYING_RACK': (clothes(0), E + 'Village Clotheslines.png'),
        'BUILD_TANNING_RACK': (scene(36, 32, [(clothes(3), 0, 18), (clothes(1), 0, 32)]), E + 'Village Clotheslines.png x2'),
        'BUILD_PARROT_HOUSE': (comp(E + 'Birdhouse.png', 0), E + 'Birdhouse.png'),
        'BUILD_FEED_BOWL': (load(E + 'animal plates.png').crop((0, 1, 16, 14)), E + 'animal plates.png'),
        # non-solid
        'BUILD_RUG': (comp('Tileset/carpet.png', 1), 'Tileset/carpet.png'),
        'BUILD_CAMP_MARKER': (comp(E + 'Village Signs.png', 1), E + 'Village Signs.png'),
        'BUILD_ANIMAL_TRAP': (comp(E + 'Mine and Dungeon/Trap.png', 0), E + 'Mine and Dungeon/Trap.png'),
        'BUILD_PIER': (scene(48, 28, [(comp(E + 'Fence and Bridge/Bridge Beach.png', 2), 0, 14), (comp(E + 'Fence and Bridge/Bridge Beach.png', 5), 0, 28)]), E + 'Fence and Bridge/Bridge Beach.png'),
        'BUILD_PLANTER': (cell('Tileset/Tilled Soil and wet soil.png', 0, 3), 'Tileset/Tilled Soil and wet soil.png'),
    }
    placed, kept = 0, []
    for bid, (art, src) in builds.items():
        fw, fh = FOOT[bid]
        if bid not in NON_SOLID:
            bad = covered(trim_keep_bottom(art), fw, fh)
            if bad:
                kept.append(f'{bid} (cells without art: {bad})')
                continue
        atlas.put(f'build/{bid}/complete', trim_keep_bottom(art), scale=1, native=2, anchor='bottom', source=src)
        atlas.ghost_from(f'build/{bid}/complete', f'build/{bid}/ghost')
        placed += 1
    # active effect overlays matching the new art
    atlas.put('build/BUILD_KILN/active_fx', furnace(3), scale=1, native=2, anchor='bottom', source=WB + 'Furnace.png (fire frame)')
    atlas.put('build/BUILD_SMELTER/active_fx', furnace(4), scale=1, native=2, anchor='bottom', source=WB + 'Furnace.png (fire frame)')
    log['builds'] = placed
    log['buildsKeptProcedural'] = kept


FOOT = {}


def _load_footprints():
    import json
    from core import SPEC
    db = json.loads((SPEC / 'DB/BuildDB.json').read_text(encoding='utf8'))
    lst = [v for v in db.values() if isinstance(v, list)][0]
    for b in lst:
        FOOT[b['id']] = tuple(b['footprintTiles'])


_load_footprints()
