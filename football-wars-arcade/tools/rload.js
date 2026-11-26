// loads the Roguelite Reborn modules into node (no DOM)
global.window = globalThis;
require('../src/v4_data.js'); require('../src/engine_rogue.js'); require('../src/rogue_data.js'); require('../src/rogue_core.js');
module.exports = globalThis.FWRogue;
