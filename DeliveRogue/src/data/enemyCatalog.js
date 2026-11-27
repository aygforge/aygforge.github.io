// data/enemyCatalog.js — canonical 100-enemy catalog (verbatim from DeliveRogue_Enemy_Listesi.json).
// ID / name / role / archetype / district are immutable authority fields (Master Prompt Ek A).
export const ENEMY_CATALOG = Object.freeze([
  {
    "districtCode": "COF",
    "districtName": "Coffee District",
    "enemyId": "COF_N_BeanBandit",
    "name": "Bean Bandit",
    "role": "Normal",
    "archetype": "Runner"
  },
  {
    "districtCode": "COF",
    "districtName": "Coffee District",
    "enemyId": "COF_N_LatteImp",
    "name": "Latte Imp",
    "role": "Normal",
    "archetype": "Disruptor"
  },
  {
    "districtCode": "COF",
    "districtName": "Coffee District",
    "enemyId": "COF_N_SugarSprite",
    "name": "Sugar Sprite",
    "role": "Normal",
    "archetype": "Swarm"
  },
  {
    "districtCode": "COF",
    "districtName": "Coffee District",
    "enemyId": "COF_N_BaristaGoblin",
    "name": "Barista Goblin",
    "role": "Normal",
    "archetype": "Bruiser"
  },
  {
    "districtCode": "COF",
    "districtName": "Coffee District",
    "enemyId": "COF_N_DripCultist",
    "name": "Drip Cultist",
    "role": "Normal",
    "archetype": "Caster"
  },
  {
    "districtCode": "COF",
    "districtName": "Coffee District",
    "enemyId": "COF_N_MugMimic",
    "name": "Mug Mimic",
    "role": "Normal",
    "archetype": "Disruptor"
  },
  {
    "districtCode": "COF",
    "districtName": "Coffee District",
    "enemyId": "COF_N_CreamDrifter",
    "name": "Cream Drifter",
    "role": "Normal",
    "archetype": "Tank"
  },
  {
    "districtCode": "COF",
    "districtName": "Coffee District",
    "enemyId": "COF_E_GrinderKnight",
    "name": "Grinder Knight",
    "role": "Elite",
    "archetype": "Bruiser"
  },
  {
    "districtCode": "COF",
    "districtName": "Coffee District",
    "enemyId": "COF_E_SteamJugger",
    "name": "Steam Jugger",
    "role": "Elite",
    "archetype": "Tank"
  },
  {
    "districtCode": "COF",
    "districtName": "Coffee District",
    "enemyId": "COF_B_LatteArtDragon",
    "name": "Latte Art Dragon",
    "role": "Boss",
    "archetype": "Boss"
  },
  {
    "districtCode": "BRG",
    "districtName": "MegaBoyBurger",
    "enemyId": "BRG_N_CheeseRaider",
    "name": "Cheese Raider",
    "role": "Normal",
    "archetype": "Swarm"
  },
  {
    "districtCode": "BRG",
    "districtName": "MegaBoyBurger",
    "enemyId": "BRG_N_FryThief",
    "name": "Fry Thief",
    "role": "Normal",
    "archetype": "Runner"
  },
  {
    "districtCode": "BRG",
    "districtName": "MegaBoyBurger",
    "enemyId": "BRG_N_SodaSprayer",
    "name": "Soda Sprayer",
    "role": "Normal",
    "archetype": "Ranged"
  },
  {
    "districtCode": "BRG",
    "districtName": "MegaBoyBurger",
    "enemyId": "BRG_N_NuggetNinja",
    "name": "Nugget Ninja",
    "role": "Normal",
    "archetype": "Runner"
  },
  {
    "districtCode": "BRG",
    "districtName": "MegaBoyBurger",
    "enemyId": "BRG_N_PickleRoller",
    "name": "Pickle Roller",
    "role": "Normal",
    "archetype": "Disruptor"
  },
  {
    "districtCode": "BRG",
    "districtName": "MegaBoyBurger",
    "enemyId": "BRG_N_TrayTroll",
    "name": "Tray Troll",
    "role": "Normal",
    "archetype": "Disruptor"
  },
  {
    "districtCode": "BRG",
    "districtName": "MegaBoyBurger",
    "enemyId": "BRG_N_MayoBlop",
    "name": "Mayo Blop",
    "role": "Normal",
    "archetype": "Caster"
  },
  {
    "districtCode": "BRG",
    "districtName": "MegaBoyBurger",
    "enemyId": "BRG_E_SesameBruiser",
    "name": "Sesame Bruiser",
    "role": "Elite",
    "archetype": "Bruiser"
  },
  {
    "districtCode": "BRG",
    "districtName": "MegaBoyBurger",
    "enemyId": "BRG_E_DeepFryJuggernaut",
    "name": "Deep Fry Juggernaut",
    "role": "Elite",
    "archetype": "Tank"
  },
  {
    "districtCode": "BRG",
    "districtName": "MegaBoyBurger",
    "enemyId": "BRG_B_MegaboyburgerTitan",
    "name": "MegaBoyBurger Titan",
    "role": "Boss",
    "archetype": "Boss"
  },
  {
    "districtCode": "SUS",
    "districtName": "Asabi Sushi",
    "enemyId": "SUS_N_WasabiWisp",
    "name": "Wasabi Wisp",
    "role": "Normal",
    "archetype": "Disruptor"
  },
  {
    "districtCode": "SUS",
    "districtName": "Asabi Sushi",
    "enemyId": "SUS_N_SoySauceSlime",
    "name": "Soy Sauce Slime",
    "role": "Normal",
    "archetype": "Disruptor"
  },
  {
    "districtCode": "SUS",
    "districtName": "Asabi Sushi",
    "enemyId": "SUS_N_GingerNinja",
    "name": "Ginger Ninja",
    "role": "Normal",
    "archetype": "Runner"
  },
  {
    "districtCode": "SUS",
    "districtName": "Asabi Sushi",
    "enemyId": "SUS_N_ChopstickBandit",
    "name": "Chopstick Bandit",
    "role": "Normal",
    "archetype": "Ranged"
  },
  {
    "districtCode": "SUS",
    "districtName": "Asabi Sushi",
    "enemyId": "SUS_N_TempuraRoach",
    "name": "Tempura Roach",
    "role": "Normal",
    "archetype": "Swarm"
  },
  {
    "districtCode": "SUS",
    "districtName": "Asabi Sushi",
    "enemyId": "SUS_N_MisoMonk",
    "name": "Miso Monk",
    "role": "Normal",
    "archetype": "Caster"
  },
  {
    "districtCode": "SUS",
    "districtName": "Asabi Sushi",
    "enemyId": "SUS_N_SushiRollGolem",
    "name": "Sushi Roll Golem",
    "role": "Normal",
    "archetype": "Tank"
  },
  {
    "districtCode": "SUS",
    "districtName": "Asabi Sushi",
    "enemyId": "SUS_E_KatanaChef",
    "name": "Katana Chef",
    "role": "Elite",
    "archetype": "Bruiser"
  },
  {
    "districtCode": "SUS",
    "districtName": "Asabi Sushi",
    "enemyId": "SUS_E_EelAssassin",
    "name": "Eel Assassin",
    "role": "Elite",
    "archetype": "Disruptor"
  },
  {
    "districtCode": "SUS",
    "districtName": "Asabi Sushi",
    "enemyId": "SUS_B_AsabiOniRoll",
    "name": "Asabi Oni Roll",
    "role": "Boss",
    "archetype": "Boss"
  },
  {
    "districtCode": "DON",
    "districtName": "Dönerse Senindir",
    "enemyId": "DON_N_LavaLahmacunImp",
    "name": "Lava Lahmacun Imp",
    "role": "Normal",
    "archetype": "Disruptor"
  },
  {
    "districtCode": "DON",
    "districtName": "Dönerse Senindir",
    "enemyId": "DON_N_AyranSlosher",
    "name": "Ayran Slosher",
    "role": "Normal",
    "archetype": "Ranged"
  },
  {
    "districtCode": "DON",
    "districtName": "Dönerse Senindir",
    "enemyId": "DON_N_OnionDjinn",
    "name": "Onion Djinn",
    "role": "Normal",
    "archetype": "Disruptor"
  },
  {
    "districtCode": "DON",
    "districtName": "Dönerse Senindir",
    "enemyId": "DON_N_SumacSneak",
    "name": "Sumac Sneak",
    "role": "Normal",
    "archetype": "Runner"
  },
  {
    "districtCode": "DON",
    "districtName": "Dönerse Senindir",
    "enemyId": "DON_N_PitaPirate",
    "name": "Pita Pirate",
    "role": "Normal",
    "archetype": "Swarm"
  },
  {
    "districtCode": "DON",
    "districtName": "Dönerse Senindir",
    "enemyId": "DON_N_YogurtSplash",
    "name": "Yogurt Splash",
    "role": "Normal",
    "archetype": "Ranged"
  },
  {
    "districtCode": "DON",
    "districtName": "Dönerse Senindir",
    "enemyId": "DON_N_GarlicVampire",
    "name": "Garlic Vampire",
    "role": "Normal",
    "archetype": "Disruptor"
  },
  {
    "districtCode": "DON",
    "districtName": "Dönerse Senindir",
    "enemyId": "DON_E_UstaOcakbasi",
    "name": "Usta Ocakbasi",
    "role": "Elite",
    "archetype": "Bruiser"
  },
  {
    "districtCode": "DON",
    "districtName": "Dönerse Senindir",
    "enemyId": "DON_E_SpiceEnforcer",
    "name": "Spice Enforcer",
    "role": "Elite",
    "archetype": "Disruptor"
  },
  {
    "districtCode": "DON",
    "districtName": "Dönerse Senindir",
    "enemyId": "DON_B_DonerTornadoTitan",
    "name": "Doner Tornado Titan",
    "role": "Boss",
    "archetype": "Boss"
  },
  {
    "districtCode": "DES",
    "districtName": "Çok Şeker Patisserie",
    "enemyId": "DES_N_CandyGremlin",
    "name": "Candy Gremlin",
    "role": "Normal",
    "archetype": "Swarm"
  },
  {
    "districtCode": "DES",
    "districtName": "Çok Şeker Patisserie",
    "enemyId": "DES_N_CupcakeCrab",
    "name": "Cupcake Crab",
    "role": "Normal",
    "archetype": "Bruiser"
  },
  {
    "districtCode": "DES",
    "districtName": "Çok Şeker Patisserie",
    "enemyId": "DES_N_MacaronBomber",
    "name": "Macaron Bomber",
    "role": "Normal",
    "archetype": "Disruptor"
  },
  {
    "districtCode": "DES",
    "districtName": "Çok Şeker Patisserie",
    "enemyId": "DES_N_SugarcubeGolem",
    "name": "Sugarcube Golem",
    "role": "Normal",
    "archetype": "Tank"
  },
  {
    "districtCode": "DES",
    "districtName": "Çok Şeker Patisserie",
    "enemyId": "DES_N_DonutRoller",
    "name": "Donut Roller",
    "role": "Normal",
    "archetype": "Runner"
  },
  {
    "districtCode": "DES",
    "districtName": "Çok Şeker Patisserie",
    "enemyId": "DES_N_ChocolateDripper",
    "name": "Chocolate Dripper",
    "role": "Normal",
    "archetype": "Disruptor"
  },
  {
    "districtCode": "DES",
    "districtName": "Çok Şeker Patisserie",
    "enemyId": "DES_N_JellyJester",
    "name": "Jelly Jester",
    "role": "Normal",
    "archetype": "Runner"
  },
  {
    "districtCode": "DES",
    "districtName": "Çok Şeker Patisserie",
    "enemyId": "DES_E_PastryDuelist",
    "name": "Pastry Duelist",
    "role": "Elite",
    "archetype": "Bruiser"
  },
  {
    "districtCode": "DES",
    "districtName": "Çok Şeker Patisserie",
    "enemyId": "DES_E_CaramelCrusher",
    "name": "Caramel Crusher",
    "role": "Elite",
    "archetype": "Tank"
  },
  {
    "districtCode": "DES",
    "districtName": "Çok Şeker Patisserie",
    "enemyId": "DES_B_GateauQueen",
    "name": "Gateau Queen",
    "role": "Boss",
    "archetype": "Boss"
  },
  {
    "districtCode": "PIZ",
    "districtName": "Ekşimaya (PIZ)",
    "enemyId": "PIZ_N_PepperoniPiranha",
    "name": "Pepperoni Piranha",
    "role": "Normal",
    "archetype": "Runner"
  },
  {
    "districtCode": "PIZ",
    "districtName": "Ekşimaya (PIZ)",
    "enemyId": "PIZ_N_OliveGremlin",
    "name": "Olive Gremlin",
    "role": "Normal",
    "archetype": "Runner"
  },
  {
    "districtCode": "PIZ",
    "districtName": "Ekşimaya (PIZ)",
    "enemyId": "PIZ_N_CheeseStretch",
    "name": "Cheese Stretch",
    "role": "Normal",
    "archetype": "Bruiser"
  },
  {
    "districtCode": "PIZ",
    "districtName": "Ekşimaya (PIZ)",
    "enemyId": "PIZ_N_DoughDodger",
    "name": "Dough Dodger",
    "role": "Normal",
    "archetype": "Disruptor"
  },
  {
    "districtCode": "PIZ",
    "districtName": "Ekşimaya (PIZ)",
    "enemyId": "PIZ_N_BasiliskLeaf",
    "name": "Basilisk Leaf",
    "role": "Normal",
    "archetype": "Swarm"
  },
  {
    "districtCode": "PIZ",
    "districtName": "Ekşimaya (PIZ)",
    "enemyId": "PIZ_N_SliceShruken",
    "name": "Slice Shruken",
    "role": "Normal",
    "archetype": "Ranged"
  },
  {
    "districtCode": "PIZ",
    "districtName": "Ekşimaya (PIZ)",
    "enemyId": "PIZ_N_AnchovyAssassin",
    "name": "Anchovy Assassin",
    "role": "Normal",
    "archetype": "Runner"
  },
  {
    "districtCode": "PIZ",
    "districtName": "Ekşimaya (PIZ)",
    "enemyId": "PIZ_E_PizzacutterKnight",
    "name": "Pizzacutter Knight",
    "role": "Elite",
    "archetype": "Bruiser"
  },
  {
    "districtCode": "PIZ",
    "districtName": "Ekşimaya (PIZ)",
    "enemyId": "PIZ_E_OvenBrute",
    "name": "Oven Brute",
    "role": "Elite",
    "archetype": "Tank"
  },
  {
    "districtCode": "PIZ",
    "districtName": "Ekşimaya (PIZ)",
    "enemyId": "PIZ_B_StardoughVolcano",
    "name": "Stardough Volcano",
    "role": "Boss",
    "archetype": "Boss"
  },
  {
    "districtCode": "VEG",
    "districtName": "Fazla Yeşil",
    "enemyId": "VEG_N_KaleCrusader",
    "name": "Kale Crusader",
    "role": "Normal",
    "archetype": "Bruiser"
  },
  {
    "districtCode": "VEG",
    "districtName": "Fazla Yeşil",
    "enemyId": "VEG_N_AvocadoBandit",
    "name": "Avocado Bandit",
    "role": "Normal",
    "archetype": "Runner"
  },
  {
    "districtCode": "VEG",
    "districtName": "Fazla Yeşil",
    "enemyId": "VEG_N_TofuTotem",
    "name": "Tofu Totem",
    "role": "Normal",
    "archetype": "Tank"
  },
  {
    "districtCode": "VEG",
    "districtName": "Fazla Yeşil",
    "enemyId": "VEG_N_SmoothieSlime",
    "name": "Smoothie Slime",
    "role": "Normal",
    "archetype": "Disruptor"
  },
  {
    "districtCode": "VEG",
    "districtName": "Fazla Yeşil",
    "enemyId": "VEG_N_CeleryStabber",
    "name": "Celery Stabber",
    "role": "Normal",
    "archetype": "Runner"
  },
  {
    "districtCode": "VEG",
    "districtName": "Fazla Yeşil",
    "enemyId": "VEG_N_BeetBerserker",
    "name": "Beet Berserker",
    "role": "Normal",
    "archetype": "Bruiser"
  },
  {
    "districtCode": "VEG",
    "districtName": "Fazla Yeşil",
    "enemyId": "VEG_N_SeedSwarmPixie",
    "name": "Seed Swarm Pixie",
    "role": "Normal",
    "archetype": "Swarm"
  },
  {
    "districtCode": "VEG",
    "districtName": "Fazla Yeşil",
    "enemyId": "VEG_E_KombuchaWarlock",
    "name": "Kombucha Warlock",
    "role": "Elite",
    "archetype": "Caster"
  },
  {
    "districtCode": "VEG",
    "districtName": "Fazla Yeşil",
    "enemyId": "VEG_E_SaladKnight",
    "name": "Salad Knight",
    "role": "Elite",
    "archetype": "Tank"
  },
  {
    "districtCode": "VEG",
    "districtName": "Fazla Yeşil",
    "enemyId": "VEG_B_GreenhouseHydra",
    "name": "Greenhouse Hydra",
    "role": "Boss",
    "archetype": "Boss"
  },
  {
    "districtCode": "FSH",
    "districtName": "Dümen Restoran (FSH)",
    "enemyId": "FSH_N_CrabCrusher",
    "name": "Crab Crusher",
    "role": "Normal",
    "archetype": "Bruiser"
  },
  {
    "districtCode": "FSH",
    "districtName": "Dümen Restoran (FSH)",
    "enemyId": "FSH_N_SquidTrickster",
    "name": "Squid Trickster",
    "role": "Normal",
    "archetype": "Disruptor"
  },
  {
    "districtCode": "FSH",
    "districtName": "Dümen Restoran (FSH)",
    "enemyId": "FSH_N_PufferPunk",
    "name": "Puffer Punk",
    "role": "Normal",
    "archetype": "Tank"
  },
  {
    "districtCode": "FSH",
    "districtName": "Dümen Restoran (FSH)",
    "enemyId": "FSH_N_EelSprinter",
    "name": "Eel Sprinter",
    "role": "Normal",
    "archetype": "Runner"
  },
  {
    "districtCode": "FSH",
    "districtName": "Dümen Restoran (FSH)",
    "enemyId": "FSH_N_ShellShieldSnail",
    "name": "ShellShield Snail",
    "role": "Normal",
    "archetype": "Tank"
  },
  {
    "districtCode": "FSH",
    "districtName": "Dümen Restoran (FSH)",
    "enemyId": "FSH_N_ShrimpShiv",
    "name": "Shrimp Shiv",
    "role": "Normal",
    "archetype": "Runner"
  },
  {
    "districtCode": "FSH",
    "districtName": "Dümen Restoran (FSH)",
    "enemyId": "FSH_N_KelpCreeper",
    "name": "Kelp Creeper",
    "role": "Normal",
    "archetype": "Disruptor"
  },
  {
    "districtCode": "FSH",
    "districtName": "Dümen Restoran (FSH)",
    "enemyId": "FSH_E_HarpoonCaptain",
    "name": "Harpoon Captain",
    "role": "Elite",
    "archetype": "Bruiser"
  },
  {
    "districtCode": "FSH",
    "districtName": "Dümen Restoran (FSH)",
    "enemyId": "FSH_E_SharkApronEnforcer",
    "name": "Shark Apron Enforcer",
    "role": "Elite",
    "archetype": "Tank"
  },
  {
    "districtCode": "FSH",
    "districtName": "Dümen Restoran (FSH)",
    "enemyId": "FSH_B_LeviathanFishFryer",
    "name": "Leviathan Fish Fryer",
    "role": "Boss",
    "archetype": "Boss"
  },
  {
    "districtCode": "KUM",
    "districtName": "Kumpir Komutanlığı",
    "enemyId": "KUM_N_PotatoPirate",
    "name": "Potato Pirate",
    "role": "Normal",
    "archetype": "Swarm"
  },
  {
    "districtCode": "KUM",
    "districtName": "Kumpir Komutanlığı",
    "enemyId": "KUM_N_ButterBomber",
    "name": "Butter Bomber",
    "role": "Normal",
    "archetype": "Disruptor"
  },
  {
    "districtCode": "KUM",
    "districtName": "Kumpir Komutanlığı",
    "enemyId": "KUM_N_CornCadet",
    "name": "Corn Cadet",
    "role": "Normal",
    "archetype": "Runner"
  },
  {
    "districtCode": "KUM",
    "districtName": "Kumpir Komutanlığı",
    "enemyId": "KUM_N_PickleSergeant",
    "name": "Pickle Sergeant",
    "role": "Normal",
    "archetype": "Bruiser"
  },
  {
    "districtCode": "KUM",
    "districtName": "Kumpir Komutanlığı",
    "enemyId": "KUM_N_OliveOperative",
    "name": "Olive Operative",
    "role": "Normal",
    "archetype": "Runner"
  },
  {
    "districtCode": "KUM",
    "districtName": "Kumpir Komutanlığı",
    "enemyId": "KUM_N_CheddarCorporal",
    "name": "Cheddar Corporal",
    "role": "Normal",
    "archetype": "Tank"
  },
  {
    "districtCode": "KUM",
    "districtName": "Kumpir Komutanlığı",
    "enemyId": "KUM_N_SauceSniper",
    "name": "Sauce Sniper",
    "role": "Normal",
    "archetype": "Ranged"
  },
  {
    "districtCode": "KUM",
    "districtName": "Kumpir Komutanlığı",
    "enemyId": "KUM_E_MashMajor",
    "name": "Mash Major",
    "role": "Elite",
    "archetype": "Tank"
  },
  {
    "districtCode": "KUM",
    "districtName": "Kumpir Komutanlığı",
    "enemyId": "KUM_E_ToppingTactician",
    "name": "Topping Tactician",
    "role": "Elite",
    "archetype": "Caster"
  },
  {
    "districtCode": "KUM",
    "districtName": "Kumpir Komutanlığı",
    "enemyId": "KUM_B_KumpirGeneralIronSpud",
    "name": "Kumpir General Iron Spud",
    "role": "Boss",
    "archetype": "Boss"
  },
  {
    "districtCode": "TAC",
    "districtName": "Taco Tornado",
    "enemyId": "TAC_N_SalsaSkater",
    "name": "Salsa Skater",
    "role": "Normal",
    "archetype": "Runner"
  },
  {
    "districtCode": "TAC",
    "districtName": "Taco Tornado",
    "enemyId": "TAC_N_TortillaThief",
    "name": "Tortilla Thief",
    "role": "Normal",
    "archetype": "Runner"
  },
  {
    "districtCode": "TAC",
    "districtName": "Taco Tornado",
    "enemyId": "TAC_N_BeanBrawler",
    "name": "Bean Brawler",
    "role": "Normal",
    "archetype": "Bruiser"
  },
  {
    "districtCode": "TAC",
    "districtName": "Taco Tornado",
    "enemyId": "TAC_N_GuacGoo",
    "name": "Guac Goo",
    "role": "Normal",
    "archetype": "Disruptor"
  },
  {
    "districtCode": "TAC",
    "districtName": "Taco Tornado",
    "enemyId": "TAC_N_JalapenoJabber",
    "name": "Jalapeno Jabber",
    "role": "Normal",
    "archetype": "Runner"
  },
  {
    "districtCode": "TAC",
    "districtName": "Taco Tornado",
    "enemyId": "TAC_N_QuesoDrifter",
    "name": "Queso Drifter",
    "role": "Normal",
    "archetype": "Tank"
  },
  {
    "districtCode": "TAC",
    "districtName": "Taco Tornado",
    "enemyId": "TAC_N_CactusCritter",
    "name": "Cactus Critter",
    "role": "Normal",
    "archetype": "Swarm"
  },
  {
    "districtCode": "TAC",
    "districtName": "Taco Tornado",
    "enemyId": "TAC_E_ChiliLuchador",
    "name": "Chili Luchador",
    "role": "Elite",
    "archetype": "Bruiser"
  },
  {
    "districtCode": "TAC",
    "districtName": "Taco Tornado",
    "enemyId": "TAC_E_FajitaPhantom",
    "name": "Fajita Phantom",
    "role": "Elite",
    "archetype": "Disruptor"
  },
  {
    "districtCode": "TAC",
    "districtName": "Taco Tornado",
    "enemyId": "TAC_B_TornadoOverlord",
    "name": "Tornado Overlord",
    "role": "Boss",
    "archetype": "Boss"
  }
]);
