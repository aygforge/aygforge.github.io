// loads the browser modules into node (no DOM)
global.window = globalThis;
require('../src/v4_data.js'); require('../src/engine.js'); require('../src/arcade_data.js');
module.exports = require('../src/arcade_core.js');
