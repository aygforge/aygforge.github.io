// builds the arcade data file: V4 master DB clubs/leagues/metadata + engine config (national teams & flag images are not used by the arcade)
global.window = globalThis; require('../src/v4_data.js');
const db = FW_MASTER_DB;
const out = { metadata: db.metadata, leagues: db.leagues, clubs: db.clubs };
const src = '/* Embedded data: Football_Wars_DB_2026_27 (V4 master: 194 real clubs, 11 leagues, metadata & source attribution) + battle_engine_config.\n * National teams and flag images of V4 are not part of the arcade career and are omitted. */\n' +
  'window.FW_MASTER_DB = ' + JSON.stringify(out) + ';\nwindow.FW_ENGINE_CONFIG = ' + JSON.stringify(FW_ENGINE_CONFIG) + ';\n';
require('fs').writeFileSync(__dirname + '/../src/data.js', src);
console.log('data.js', src.length);
