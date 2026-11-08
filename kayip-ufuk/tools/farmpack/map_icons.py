"""Item / codex icons: pack 16x16 icon cell (plain state) -> 32x32 rect at x2.
Only faithful matches are mapped; everything else keeps its procedural icon (see tools/farmpack/README.md)."""
from core import cell

W = 'Icons/RPG icons/Weapons and Armor/'
X = 'Icons/RPG icons/Extras/'
F = 'Icons/Food Icons/'
S = 'Icons/Fish/Sea/'
R = 'Icons/Fish/River/'
C = 'Crops/'

# spriteId: (file, col, row)  — col/row index 16x16 cells, (0,0) is the plain icon state
ICONS = {
    # tools (wood / copper / iron tiers)
    'icon/TOOL_STONE_AXE': (W + '1. Wood/Axe.png', 0, 0),
    'icon/TOOL_COPPER_AXE': (W + '2. Cooper/Axe.png', 0, 0),
    'icon/TOOL_IRON_AXE': (W + '3. Iron/Axe.png', 0, 0),
    'icon/TOOL_STONE_PICK': (W + '1. Wood/Pickaxe.png', 0, 0),
    'icon/TOOL_COPPER_PICK': (W + '2. Cooper/Pickaxe.png', 0, 0),
    'icon/TOOL_IRON_PICK': (W + '3. Iron/Pickaxe.png', 0, 0),
    'icon/TOOL_BOW': (W + '1. Wood/Bow.png', 0, 0),
    'icon/TOOL_HUNTER_BOW': (W + '2. Cooper/Bow.png', 0, 0),
    'icon/TOOL_FISH_ROD': (W + '1. Wood/Fishing Rod.png', 0, 0),
    'icon/TOOL_FISH_ROD_ADV': (W + '3. Iron/Fishing Rod.png', 0, 0),
    'icon/TOOL_SHOVEL': (W + '3. Iron/Shovel.png', 0, 0),
    'icon/TOOL_WATERING_CAN': (W + '1. Wood/Watering can.png', 0, 0),
    'icon/TOOL_MACHETE': (W + '3. Iron/Sword.png', 0, 0),
    'icon/CMP_ARROW': (W + '1. Wood/Arrow.png', 0, 0),
    'icon/EQ_LEATHER_BOOTS': (W + '1. Wood/Boots.png', 0, 0),
    'icon/EQ_LEATHER_VEST': (W + '1. Wood/Chestplate.png', 0, 0),
    'icon/EQ_LEATHER_HAT': (W + '1. Wood/Helmet.png', 0, 0),
    # bags
    'icon/EQ_BAG_SMALL': (X + 'Bags.png', 0, 0),
    'icon/EQ_BAG_LARGE': (X + 'Bags.png', 1, 0),
    'icon/EQ_EXPLORER_BAG': (X + 'Bags.png', 2, 0),
    # materials / components
    'icon/MAT_LOG': (X + 'Wood.png', 0, 0),
    'icon/CMP_PLANK': (X + 'Wood.png', 1, 0),
    'icon/MAT_HARDWOOD': (X + 'Wood.png', 0, 1),
    'icon/CMP_TREATED_PLANK': (X + 'Wood.png', 1, 1),
    'icon/MAT_STONE': (X + 'Stones.png', 0, 0),
    'icon/CMP_BRICK': (X + 'Stones.png', 1, 0),
    'icon/MAT_BONE': (X + 'Bones.png', 0, 0),
    'icon/MAT_COAL': (X + 'Coal.png', 0, 0),
    'icon/MAT_RAW_HIDE': (X + 'Leather.png', 0, 0),
    'icon/CMP_LEATHER': (X + 'Leather.png', 1, 0),
    'icon/MAT_VINE': (X + 'Rope of vines.png', 0, 0),
    'icon/MAT_FEATHER': (X + 'Chicken feather.png', 0, 0),
    'icon/CMP_COPPER_INGOT': (X + 'Bars and ores.png', 0, 0),
    'icon/MAT_COPPER_ORE': (X + 'Bars and ores.png', 1, 0),
    'icon/CMP_IRON_INGOT': (X + 'Bars and ores.png', 2, 0),
    'icon/MAT_IRON_ORE': (X + 'Bars and ores.png', 3, 0),
    'icon/MAT_QUARTZ': (X + 'Gemstones.png', 6, 0),
    'icon/CMP_CLOTH': (X + 'Cloth.png', 3, 2),
    'icon/SAL_CANVAS': (X + 'Cloth.png', 1, 2),
    'icon/SAL_CLOTH': (X + 'Cloth.png', 2, 0),
    'icon/SAL_BOTTLE': (X + 'Potions.png', 0, 2),
    'icon/CON_ANTIDOTE': (X + 'Potions.png', 1, 2),
    'icon/MAT_RESIN': (F + 'Wax.png', 0, 0),
    'icon/MAT_SAP': (F + 'Oil.png', 0, 0),
    'icon/MAT_SALT': (F + 'Salt.png', 0, 0),
    'icon/MAT_MED_HERB': (F + 'Aloe.png', 0, 0),
    # fishing
    'icon/MAT_WORM': ('Icons/Fish/Worm bait.png', 0, 0),
    'icon/CMP_SIMPLE_BAIT': ('Icons/Fish/Worm bait.png', 1, 0),
    'icon/CMP_ADV_BAIT': ('Icons/Fish/Artificial bait.png', 0, 0),
    'icon/CMP_FISH_HOOK': ('Icons/Fish/Artificial bait.png', 1, 0),
    'icon/MAT_RAW_FISH': (S + 'Bream.png', 0, 0),
    'icon/MAT_SEASHELL': (S + 'Creatures/Shell.png', 0, 0),
    'icon/MAT_SHELL': (S + 'Creatures/Clam.png', 0, 0),
    # food
    'icon/FOOD_BANANA': (F + 'Banana.png', 0, 0),
    'icon/FOOD_COCONUT': (F + 'Coconut.png', 0, 0),
    'icon/FOOD_BERRY': (F + 'Blackberry.png', 0, 0),
    'icon/FOOD_COOKED_FISH': (F + 'Baked Fish.png', 0, 0),
    'icon/MAT_RAW_MEAT': (F + 'Beef.png', 0, 0),
    'icon/FOOD_COOKED_MEAT': (F + 'Chicken Drumstick.png', 0, 0),
    'icon/FOOD_DRIED_MEAT': (F + 'Bacon.png', 0, 0),
    'icon/FOOD_FISH_SOUP': (F + 'Fish Stew.png', 0, 0),
    'icon/FOOD_GRILLED_CRAB': (F + 'Crab Cakes.png', 0, 0),
    'icon/FOOD_HERBAL_TEA': (F + 'Chamomile Tea.png', 0, 0),
    'icon/FOOD_WARM_TEA': (F + 'Spice Tea.png', 0, 0),
    'icon/FOOD_ROAST_ROOT': (F + 'Baked Potato.png', 0, 0),
    'icon/FOOD_SPICED_FISH': (F + 'Anguilla fritta.png', 0, 0),
    'icon/FOOD_VEG_STEW': (F + 'Vegetable Mix.png', 0, 0),
    'icon/FOOD_BEAN_STEW': (F + 'Bean Hotpot.png', 0, 0),
    'icon/FOOD_FRUIT_SALAD': (F + 'Fruit Salad.png', 0, 0),
    'icon/FOOD_PINEAPPLE_SNACK': (F + 'Tropical Fruit Salad.png', 0, 0),
    'icon/FOOD_FEAST': (F + 'Tropical Shrimp.png', 0, 0),
    'icon/FOOD_RATION': (F + 'Bread .png', 0, 0),
    # crop harvest items (produce icons from the food set)
    'icon/CROP_PINEAPPLE': (F + 'Pineapple.png', 0, 0),
    'icon/CROP_PEPPER': (F + 'Hot Pepper.png', 0, 0),
    'icon/CROP_BEAN': (F + 'Green Beans.png', 0, 0),
    'icon/CROP_PUMPKIN': (F + 'Pumpkin.png', 0, 0),
    'icon/CROP_SWEET_POTATO': (F + 'Potato.png', 0, 0),
    'icon/CROP_GREENS': (F + 'Cabbage.png', 0, 0),
    'icon/CROP_ROOT': (F + 'Carrot.png', 0, 0),
    'icon/CROP_SPICE': (F + 'Red Bell Pepper.png', 0, 0),
    'icon/CROP_FIBER': (F + 'Wheat.png', 0, 0),
    # codex (species journal)
    'codex/FISH_TUNA': (S + 'Tuna.png', 0, 0),
    'codex/FISH_SARDINE': (S + 'Sardine.png', 0, 0),
    'codex/FISH_PUFFER': (S + 'pufferfish.png', 0, 0),
    'codex/FISH_MULLET': (S + 'Red Mullet.png', 0, 0),
    'codex/FISH_MACKEREL': (S + 'Herring.png', 0, 0),
    'codex/FISH_GROUPER': (S + 'Lingcod.png', 0, 0),
    'codex/FISH_PARROT': (S + 'Regal Blue Tang.png', 0, 0),
    'codex/FISH_REEF': (S + 'Clownfish.png', 0, 0),
    'codex/FISH_FRESHWATER_BASS': (R + 'Large Mouth Bass.png', 0, 0),
    'codex/FISH_BARRACUDA': (R + 'Pike Fish.png', 0, 0),
    'codex/MARINE_RAY': (S + 'Creatures/Stingray.png', 0, 0),
    'codex/ANIMAL_CRAB': (S + 'Creatures/Crab.png', 0, 0),
    'codex/ANIMAL_FROG': (R + 'Creatures/Frog.png', 0, 0),
}


def run(atlas, log):
    for sid, (f, c, r) in ICONS.items():
        atlas.put(sid, cell(f, c, r), scale=2, anchor='center', source=f'{f}#cell({c},{r})')
    log['icons'] = len(ICONS)
