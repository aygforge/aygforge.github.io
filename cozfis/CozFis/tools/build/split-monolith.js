#!/usr/bin/env node
/* tools/build/split-monolith.js
   One-time migration tool: splits the single-file build (CozFis_Multilanguage_v1.html) into the
   modular project tree. Module boundaries are the original "/* ---- NN_name.js ---- *​/" markers; the
   load order and global-scope semantics are preserved (classic <script> tags share one global
   lexical scope). Usage: node tools/build/split-monolith.js <v1.html> <projectRoot>              */
'use strict';
const fs = require('fs'), path = require('path');
const [src, root] = process.argv.slice(2);
if (!src || !root) { console.error('usage: split-monolith.js <v1.html> <projectRoot>'); process.exit(1); }
const html = fs.readFileSync(src, 'utf8');
const grab = (re) => { const m = html.match(re); if (!m) throw new Error('not found: ' + re); return m; };
const css = grab(/<style>\n([\s\S]*?)<\/style>/)[1];
const head = grab(/<head>\n([\s\S]*?)<style>/)[1];
const body = grab(/<body>\n([\s\S]*?)<script id="data">/)[1];
const data = grab(/<script id="data">\n([\s\S]*?)<\/script>/)[1];
const locale = grab(/<script id="locale">\n([\s\S]*?)<\/script>/)[1];
const main = grab(/<script>\n([\s\S]*?)<\/script>\s*<\/body>/)[1];
const W = (rel, txt) => { const p = path.join(root, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, txt); };

const DIR = n => /^00_/.test(n) ? 'src/localization' : /^01_/.test(n) ? 'src/core' : /^0[2-6]/.test(n) ? 'src/rendering'
  : /^0[7-9]/.test(n) ? 'src/systems' : /^10_/.test(n) ? 'src/scenes' : /^11_/.test(n) ? 'src/ui' : 'src/core';
const re = /^\/\* ---- (\d\d_[\w]+\.js) ---- \*\/$/gm; const marks = []; let m;
while ((m = re.exec(main))) marks.push({ name: m[1], at: m.index });
const files = [];
marks.forEach((mk, i) => {
  let code = main.slice(mk.at, i + 1 < marks.length ? marks[i + 1].at : main.length);
  let name = mk.name;
  if (name === '12_main.js') { // boot() is started by src/core/start.js after assets are ready
    if (!/\nboot\(\);\n/.test(code)) throw new Error('boot() call not found');
    code = code.replace(/\nboot\(\);\n/, '\n/* boot(): src/core/start.js tarafından, AssetManager.load() sonrasında çağrılır */\n');
  }
  if (name === '12_v4_tests.js') name = '12_v4_tests.js';
  const rel = DIR(name) + '/' + name;
  W(rel, (/^\s*'use strict';/m.test(code.slice(0, 900)) ? '' : "'use strict';\n") + code.replace(/\s+$/, '') + '\n');
  files.push(rel);
});
W('css/style.css', css);
W('src/data/game_data.js', '/* Oyun verisi (FISHDB / GAMECONFIG / EXPANSION) — tek dosya sürümündeki <script id="data"> */\n' + data);
W('src/localization/locale_data.js', '/* 6 dilin çeviri tabloları — tek dosya sürümündeki <script id="locale"> (değiştirilmedi) */\n' + locale);
// insert asset layer right after the base art module and the hooks after the last art module
const order = [];
for (const f of files) {
  order.push(f);
  if (f.endsWith('02_art_base.js')) order.push('src/rendering/asset_manager.js');
  if (f.endsWith('06_v4_art.js')) order.push('src/rendering/asset_hooks.js');
}
order.push('src/core/start.js');
const scripts = ['src/data/game_data.js', 'src/localization/locale_data.js', 'assets/manifest.js', ...order]
  .map(s => `<script src="${s}"></script>`).join('\n');
W('index.html', `<!DOCTYPE html>\n<html lang="en">\n<head>\n${head}<link rel="stylesheet" href="css/style.css">\n</head>\n<body>\n${body}${scripts}\n</body>\n</html>\n`);
W('tools/build/module-order.json', JSON.stringify(order, null, 1));
console.log('modules:', files.length, 'order:', order.length);
