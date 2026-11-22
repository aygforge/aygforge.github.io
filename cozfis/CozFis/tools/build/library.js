#!/usr/bin/env node
/* tools/build/library.js — CozFis_AssetLibrary/ klasörünü kurar:
   sprites/<kategori>/*.png (tek tek kaynak PNG'ler), l10n/ (dil yamaları), atlases/ (+json), manifest.json, sprites.json,
   previews/*.png (katalog sayfaları, 2× büyütülmüş, etiketsiz ızgara) ve CATALOG.md (id → dosya, boyut, anahtar).
   Kullanım: node tools/build/library.js <hedefKlasör>                                                         */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const dest = path.resolve(process.argv[2] || path.join(ROOT, 'dist/CozFis_AssetLibrary'));
const cpdir = (a, b) => fs.cpSync(path.join(ROOT, a), path.join(dest, b), { recursive: true });

(async () => {
  fs.rmSync(dest, { recursive: true, force: true }); fs.mkdirSync(dest, { recursive: true });
  for (const d of ['fish', 'characters', 'boats', 'ui', 'environments']) cpdir('assets/' + d, 'sprites/' + d);
  cpdir('assets/l10n', 'l10n'); cpdir('assets/atlases', 'atlases');
  for (const f of ['manifest.json', 'sprites.json']) fs.copyFileSync(path.join(ROOT, 'assets', f), path.join(dest, f));
  const src = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/sprites.json'), 'utf8'));
  // katalog sayfaları
  const sheets = {
    fish_left: s => /^fish_.*_left$/.test(s.id) && !/_sil_/.test(s.id), fish_silhouettes: s => /^fish_.*_sil_left$/.test(s.id),
    icons: s => /^icon_/.test(s.id), ui_skins: s => /^skin_/.test(s.id), characters_hair: s => /^char_hair_/.test(s.id), characters_hats: s => /^char_hat_/.test(s.id),
    boats_base: s => /^boat_.*_base_(back|front)$/.test(s.id) && /_sea_green_/.test(s.id), wildlife: s => /^wild_.*_left_f0$/.test(s.id), shore_items: s => /^shore_[a-z_]+$/.test(s.id) && !/_ui/.test(s.id) && s.cat !== 'environment',
    props: s => s.cat === 'props' && !/^(wild_|shore_)/.test(s.id),
  };
  const { chromium } = require('playwright');
  const server = require('../serve-lib.js').start(ROOT, 0); const port = await server.ready;
  const b = await chromium.launch(); const p = await b.newPage(); await p.goto(`http://localhost:${port}/assets/sprites.json`);
  fs.mkdirSync(path.join(dest, 'previews'), { recursive: true });
  for (const [name, f] of Object.entries(sheets)) {
    const items = src.sprites.filter(f).map(s => s.file);
    const data = await p.evaluate(async (files) => {
      const ims = await Promise.all(files.map(u => new Promise(r => { const im = new Image(); im.onload = () => r(im); im.src = '/' + u; })));
      const S = 2, pad = 6, W = 1200; let x = pad, y = pad, rowH = 0; const pos = [];
      for (const im of ims) { const w = im.width * S, h = im.height * S; if (x + w > W - pad) { x = pad; y += rowH + pad; rowH = 0; } pos.push([x, y]); x += w + pad; rowH = Math.max(rowH, h); }
      const c = document.createElement('canvas'); c.width = W; c.height = y + rowH + pad; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
      g.fillStyle = '#2a2238'; g.fillRect(0, 0, c.width, c.height);
      ims.forEach((im, i) => g.drawImage(im, pos[i][0], pos[i][1], im.width * S, im.height * S));
      return c.toDataURL();
    }, items);
    fs.writeFileSync(path.join(dest, 'previews', name + '.png'), Buffer.from(data.split(',')[1], 'base64'));
  }
  await b.close(); server.close();
  // CATALOG.md
  const rows = src.sprites.map(s => `| \`${s.id}\` | ${s.cat} | ${s.w}×${s.h} | ${s.key ? '`' + s.key + '`' : '—'} | ${s.l10n ? Object.keys(s.l10n).join(', ') : ''} | ${s.file.replace(/^assets\//, 'sprites/')} |`);
  fs.writeFileSync(path.join(dest, 'CATALOG.md'), `# CozFis Varlık Kütüphanesi — Katalog\n\nToplam **${src.sprites.length}** görsel. Kaynak: oyunun kendi prosedürel üreticileri (\`tools/export-assets\`), kayıpsız PNG, özgün çözünürlük.\n` +
    `Atlas sayfaları \`atlases/\`, çalışma zamanı manifesti \`manifest.json\`, kaynak metaveri \`sprites.json\`. Önizlemeler \`previews/\` (2×).\n\n| id | kategori | boyut | çalışma zamanı anahtarı | dil yaması | dosya |\n|---|---|---|---|---|---|\n` + rows.join('\n') + '\n');
  console.log('kütüphane:', dest, src.sprites.length, 'görsel');
})();
