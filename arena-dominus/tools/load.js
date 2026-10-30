// Loads the DOM-free game logic modules into a Node vm context for headless testing.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const LOGIC = ['01_core.js', '02_gen.js', '03_combat.js', '04_comp.js', '05_mgmt.js', '06_transfer.js', '07_season.js', '08_save.js'];

function load() {
  const src = LOGIC.map(f => fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8')).join('\n;\n');
  const expose = `\n;globalThis.AD = { get S(){return S}, set S(v){S=v}, get R(){return R}, set R(v){R=v}, GameState, WorldGenerator, GladiatorGenerator, TransferMath, CombatEngine, CombatAI, Leagues, Cups, Calendar, MatchSystem, Squad, Progression, Economy, Reputation, Sponsors, Staff, Facilities, Equipment, Scouting, Transfer, ClubAI, Season, Game, Sanity, SaveManager, CLASSES, CLASS_IDS, TIERS, REGIONS, ECON, FAC, ITEM_TYPES, QUALITIES, LEAGUE_WEEKS, RCUP_WEEKS, ICUP_WEEKS, SEASON_WEEKS, RNG, ovrOf, I18N, Sponsors, txt, cn };`;
  const ctx = { console, setTimeout, clearTimeout, Date, Math, JSON };
  vm.createContext(ctx);
  vm.runInContext(src + expose, ctx, { filename: 'arena-logic.js' });
  return ctx.AD;
}
module.exports = { load };
