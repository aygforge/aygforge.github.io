"""Resource nodes (ready/depleted) and world foliage from the pack's trees, bushes, rocks, ores and water props.
Stored at x1 inside the AtlasLayout rects (bottom-centred) and drawn at native x2.
Kept procedural (no faithful equivalent): MAT_BAMBOO, MAT_CLAY, MAT_VINE nodes, foliage bamboo_cluster, mangrove,
vine, moss, cliff_grass."""
from PIL import Image
from core import cell, load, piece, trim

TREE = 'Objects/Tree/Common/Shadow/'
COCO = 'Crops/Fruits Tree/Summer/Coconut tree.png'
BANANA = 'Crops/Fruits Tree/Summer/Banana Tree.png'
BUSH = 'Objects/Tree/Deep Forest/bushes.png'
ORES = 'Objects/Exterior/Mine and Dungeon/Mine/Miners props.png'
RUBBLE = 'Objects/Exterior/Mine and Dungeon/Mine/Miners props4.png'
STONES = 'Objects/Props/Summer/Stones Summer.png'
WATERPROPS = 'Objects/Props/Summer/PropsWater Summer.png'
CORAL = 'Objects/Exterior/Beach/sea coral.png'
LOGS = 'Objects/Tree/TREE TRUNKS copiar.png'
BIGTREE = 'Objects/Tree/Deep Forest/Big old Tree.png'
MINETREE = 'Objects/Tree/Mine/Tree.png'


def tree(f, col, row):
    return cell(f, col, row, 32, 48)


def cluster(parts, size=(32, 32)):
    """Compose small props into one decor tuft: parts = [(img, x, y)] (bottom-aligned art)."""
    out = Image.new('RGBA', size)
    for im, x, y in parts:
        out.alpha_composite(trim(im), (x, y))
    return out


def run(atlas, log):
    n = 0

    def node(item, ready, depleted, src):
        nonlocal n
        atlas.put(f'resource/{item}/ready', trim(ready), scale=1, native=2, source=src + ' (ready)')
        atlas.put(f'resource/{item}/depleted', trim(depleted), scale=1, native=2, source=src + ' (depleted)')
        n += 2

    # trees: full summer tree + its own stump
    node('MAT_LOG', tree(TREE + 'Maple Tree.png', 0, 1), tree(TREE + 'Maple Tree.png', 0, 2), TREE + 'Maple Tree.png')
    node('MAT_HARDWOOD', tree(TREE + 'Mahogany Tree.png', 3, 0), tree(TREE + 'Mahogany Tree.png', 8, 0), TREE + 'Mahogany Tree.png')
    node('MAT_RESIN', tree(TREE + 'Pine Tree.png', 3, 0), tree(TREE + 'Pine Tree.png', 6, 0), TREE + 'Pine Tree.png')
    node('FOOD_COCONUT', tree(COCO, 6, 0), tree(COCO, 7, 0), COCO)
    node('MAT_PALM_LEAF', tree(COCO, 1, 0), tree(COCO, 0, 0), COCO)
    node('FOOD_BANANA', tree(BANANA, 3, 0), tree(BANANA, 2, 0), BANANA)
    # bushes / ground plants
    node('FOOD_BERRY', cell(BUSH, 1, 4, 48, 32), cell(BUSH, 1, 0, 48, 32), BUSH)
    node('MAT_FIBER', cell(WATERPROPS, 7, 4), cell(WATERPROPS, 8, 4), WATERPROPS + ' (tall grass)')
    node('MAT_BRANCH', piece(LOGS, 3), piece(LOGS, 1), LOGS)
    # rocks and ore piles; depleted = rubble
    node('MAT_STONE', cell(STONES, 0, 0, 32, 16), cell(RUBBLE, 8, 0), STONES)
    node('MAT_COPPER_ORE', cell(ORES, 0, 1), cell(RUBBLE, 7, 0), ORES + ' (copper)')
    node('MAT_IRON_ORE', cell(ORES, 1, 1), cell(RUBBLE, 6, 0), ORES + ' (iron)')
    node('MAT_COAL', cell(ORES, 8, 1), cell(RUBBLE, 9, 0), ORES + ' (coal)')
    node('MAT_QUARTZ', cell(ORES, 9, 1), cell(RUBBLE, 5, 0), ORES + ' (quartz)')

    # foliage decor
    f = 0

    def fol(sid, im, src):
        nonlocal f
        atlas.put(sid, trim(im), scale=1, native=2, source=src); f += 1

    for i, (c, r) in enumerate([(2, 0), (5, 0), (7, 0)]):
        fol(f'foliage/palm/{i}', tree(COCO, c, r), COCO)
    fol('foliage/broadleaf/0', tree(TREE + 'Maple Tree.png', 1, 1), TREE + 'Maple Tree.png')
    fol('foliage/broadleaf/1', tree(TREE + 'Birch Tree.png', 3, 0), TREE + 'Birch Tree.png')
    fol('foliage/broadleaf/2', cell(MINETREE, 0, 0, 32, 48), MINETREE)
    for i, (c, r) in enumerate([(1, 1), (0, 4), (1, 7)]):
        fol(f'foliage/flower_bush/{i}', cell(BUSH, c, r, 48, 32), BUSH)
    fol('foliage/fallen_log/0', piece(BIGTREE, 2), BIGTREE)
    fol('foliage/fallen_log/1', piece(BIGTREE, 3), BIGTREE)
    fol('foliage/fallen_log/2', piece(LOGS, 2), LOGS)
    # reeds: cattails + tall grass tufts composed into small clumps
    cat, grass = cell(WATERPROPS, 9, 0), cell(WATERPROPS, 7, 4)
    fol('foliage/reeds/0', cluster([(cat, 2, 16), (grass, 14, 18)]), WATERPROPS)
    fol('foliage/reeds/1', cluster([(grass, 0, 18), (cat, 10, 14), (cat, 20, 17)]), WATERPROPS)
    fol('foliage/reeds/2', cluster([(cell(WATERPROPS, 7, 5), 4, 18), (cat, 16, 16)]), WATERPROPS)
    # reef: coral + starfish clusters
    coral = load(CORAL)
    pc = lambda c, r: cell(coral, c, r)
    fol('foliage/reef_coral/0', cluster([(pc(1, 0), 2, 18), (pc(0, 0), 16, 22), (pc(2, 0), 18, 12)]), CORAL)
    fol('foliage/reef_coral/1', cluster([(pc(1, 1), 4, 16), (pc(1, 3), 16, 20)]), CORAL)
    fol('foliage/reef_coral/2', cluster([(pc(2, 1), 2, 14), (pc(0, 2), 14, 20), (pc(1, 2), 18, 10)]), CORAL)
    fol('foliage/cave_stalactite/0', cell('Objects/Exterior/Deep Forest/Stones anim/stone anim 1.png', 0, 0, 32, 32), 'stone anim 1.png')
    fol('foliage/cave_stalactite/1', cell('Objects/Exterior/Deep Forest/Stones anim/stone anim 1.png', 2, 0, 32, 32), 'stone anim 1.png')
    fol('foliage/cave_stalactite/2', cell(STONES, 1, 0, 32, 16), STONES)
    # extra icons from the beach props
    atlas.put('icon/MAT_SEAWEED', pc(2, 0), scale=2, anchor='center', source=CORAL + '#cell(2,0)')
    log['resourceNodes'] = n
    log['foliage'] = f
