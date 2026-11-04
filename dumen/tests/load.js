// Node'da DOM'suz oyun çekirdeğini yükler (index.html ile aynı sıra).
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
const CORE_FILES = [
  'src/core/ns.js', 'src/data/source/sources.js', 'src/core/RNG.js', 'src/core/EventBus.js', 'src/core/Clock.js',
  'src/core/Transactions.js', 'src/core/Save.js',
  'src/data/EconomyConfig.js', 'src/data/RegionDB.js', 'src/data/FishBalanceDB.js', 'src/data/ItemBalanceDB.js',
  'src/data/BoatDB.js', 'src/data/ChestDB.js', 'src/data/RecipeDB.js', 'src/data/MartiLines.js', 'src/data/NPCDB.js', 'src/data/QuestDB.js',
  'src/systems/Inventory.js', 'src/systems/Loadout.js', 'src/systems/Encounter.js', 'src/systems/Fishing.js',
  'src/systems/Quests.js', 'src/systems/Actions.js', 'src/data/Validate.js', 'src/core/Ads.js', 'src/core/Game.js'
];
function load(extraGlobals) {
  const ctx = Object.assign({ console, structuredClone, setTimeout, clearTimeout, Date, Math, JSON }, extraGlobals || {});
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const f of CORE_FILES) {
    const p = path.join(ROOT, f);
    if (!fs.existsSync(p)) continue;
    vm.runInContext(fs.readFileSync(p, 'utf8'), ctx, { filename: f });
  }
  return ctx.DUMEN;
}
module.exports = { load, ROOT, CORE_FILES };
