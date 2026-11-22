#!/usr/bin/env node
/* Yerel geliştirme sunucusu (çevrimdışı):  node tools/serve.js [kök=.] [port=8080]  →  http://localhost:8080/ */
'use strict';
const path = require('path');
const root = path.resolve(process.argv[2] || path.join(__dirname, '..')), port = +(process.argv[3] || process.env.PORT || 8080);
const s = require('./serve-lib.js').start(root, port);
s.ready.then(p => console.log(`CozFis → http://localhost:${p}/  (kök: ${root})`));
