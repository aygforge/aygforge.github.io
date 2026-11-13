// Deterministik asset üretimi: `npm run assets` → public/assets altına PNG atlasları ve manifest yazar.
// Rastgelelik sabit tohumludur; aynı kaynak her zaman aynı PNG'leri üretir.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCatalog } from '../src/data/catalog.js';
import { buildTileset } from '../src/art/tiles.js';
import { collectSprites, packAtlas } from '../src/art/atlas.js';
import { charSheet } from '../src/art/chars.js';
import { encodePNG } from './png.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = path.join(root, 'public', 'assets'); fs.mkdirSync(out, { recursive: true });
const C = buildCatalog(JSON.parse(fs.readFileSync(path.join(root, 'Son_Peron_v1_0_Birlesik_Oyun_Verileri.json'), 'utf8')));
if (C.errors.length) { console.error('Katalog hataları:', C.errors); process.exit(1); }

for (const s of C.seasons) fs.writeFileSync(path.join(out, `tiles_${s}.png`), encodePNG(buildTileset(s)));
const { sprites, missing } = collectSprites(C);
const { sheet, json } = packAtlas(sprites);
fs.writeFileSync(path.join(out, 'atlas.png'), encodePNG(sheet));
fs.writeFileSync(path.join(out, 'atlas.json'), JSON.stringify(json));
// Örnek karakter atlası (oyunda karakterler aynı üreticiyle çalışma zamanında, görünüme göre oluşturulur)
fs.writeFileSync(path.join(out, 'chars_preview.png'), encodePNG(charSheet({ skin: 1, hair: 1, style: 0, outfit: 0 })));
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({ generated: 'tools/generate-assets.mjs', frames: Object.keys(json.frames).length, atlas: [sheet.w, sheet.h], missing }, null, 1));
console.log(`atlas ${sheet.w}×${sheet.h}, ${Object.keys(json.frames).length} kare; eksik: ${missing.length ? missing.join(', ') : 'yok'}`);
if (missing.length) process.exit(2);
