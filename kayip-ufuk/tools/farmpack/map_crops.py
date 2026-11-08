"""Crop growth stages: 4 frames per crop picked from the pack's growth strips, stored at x1 in the 64x64 rect
(bottom-centred) and drawn at native x2. CROP_CANE keeps its procedural art (no sugar-cane equivalent in the pack)."""
from core import cell, load

# crop: (file, frame width, frame height, [stage0, stage1, stage2, stage3] frame indices)
CROPS = {
    'CROP_PINEAPPLE': ('Crops/Summer/Pineapple.png', 16, 32, [1, 2, 4, 5]),
    'CROP_PEPPER': ('Crops/Summer/Hot Pepper.png', 16, 16, [2, 3, 5, 6]),
    'CROP_BEAN': ('Crops/Summer/Green Beans.png', 16, 32, [2, 4, 5, 6]),
    'CROP_PUMPKIN': ('Crops/Fall/Pumpkin.png', 16, 16, [2, 3, 4, 5]),
    'CROP_SWEET_POTATO': ('Crops/Spring/Potato.png', 16, 16, [2, 3, 4, 5]),
    'CROP_GREENS': ('Crops/Spring/Cabbage.png', 16, 16, [2, 3, 5, 6]),
    'CROP_ROOT': ('Crops/Spring/Carrot.png', 16, 16, [2, 3, 4, 5]),
    'CROP_HERB': ('Crops/Fall/Aloe.png', 16, 16, [2, 3, 4, 5]),
    'CROP_SPICE': ('Crops/Summer/Bell Pepper.png', 16, 16, [2, 3, 4, 6]),
    'CROP_FIBER': ('Crops/Summer/Wheat.png', 16, 16, [1, 2, 3, 4]),
    'CROP_BANANA': ('Crops/Fruits Tree/Summer/Banana Tree.png', 32, 48, [0, 1, 2, 4]),
}
SOIL = 'Tileset/Tilled Soil and wet soil.png'


def run(atlas, log):
    n = 0
    for crop, (f, fw, fh, frames) in CROPS.items():
        im = load(f)
        for stage, idx in enumerate(frames):
            atlas.put(f'crop/{crop}/{stage}', cell(im, idx, 0, fw, fh), scale=1, native=2, anchor='bottom', source=f'{f}#frame{idx}')
            n += 1
    # planter moisture states: isolated tilled-soil tile (dry) and the wet overlay tile, x2 into 32x32
    atlas.put('crop/shared/dry', cell(SOIL, 0, 3), scale=2, anchor='center', source=SOIL + '#cell(0,3)')
    atlas.put('crop/shared/wet', cell(SOIL, 12, 3), scale=2, anchor='center', source=SOIL + '#cell(12,3)')
    log['cropStages'] = n
    log['cropKeptProcedural'] = ['CROP_CANE (no sugar cane in pack)', 'crop/shared/fertilized']
