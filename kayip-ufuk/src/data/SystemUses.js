// Non-recipe gameplay uses for items (so no ItemDB entry is a dead UI entry). Each points to the code using it.
export const SYSTEM_USES = {
  CMP_SIMPLE_BAIT: 'FishingSystem.cast bait + TrapDB crab trap bait', CMP_ADV_BAIT: 'FishingSystem.cast bait (FishDB.fishBaitIds)', CMP_FISH_BAIT: 'FishingSystem/TrapSystem bait',
  MAT_WORM: 'FishingSystem bait / fish trap bait', CMP_ARROW: 'WildlifeSystem.attack ammo for bows', CMP_SLING_STONE: 'WildlifeSystem.attack ammo for sling',
  CMP_COMPOST: 'FarmSystem.fertilize (CropDB.fertilizerId)', SAL_BOTTLE: 'InventorySystem.WATER_VESSELS (2 portions)', SAL_TIN_CAN: 'InventorySystem.WATER_VESSELS (1 portion, early boiling)',
  TOOL_BAMBOO_CUP: 'InventorySystem.WATER_VESSELS (2 portions)', SAL_PLASTIC: 'FishingSystem.cast float (bite wait ×0.9, not consumed)', SAL_ROPE: 'Game.dismantle → 2 MAT_FIBER (salvage processing)',
  FOOD_BERRY: 'eat / trap bait / pet food', FOOD_BANANA: 'eat / trap bait / pet food', FOOD_COCONUT: 'eat / pet food',
};
export const DISMANTLE = { SAL_ROPE: { MAT_FIBER: 2 } };
