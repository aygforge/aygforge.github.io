#!/usr/bin/env node
/* tools/build/build.js — dağıtım çıktıları (bağımlılıksız)
   dist/web/                       : çalışma zamanında gereken dosyalar (index.html, css, src, atlas sayfaları, manifest)
                                     → herhangi bir statik sunucuda veya ileride Capacitor'ın www klasöründe çalışır (göreli yollar)
   dist/CozFis_Standalone.html     : tek dosya; tüm script/stil satır içi, atlas sayfaları data: URI olarak gömülü
                                     → file:// ile çift tıklayınca da atlaslardan çalışır (canvas kirlenmez)
   Kullanım: node tools/build/build.js                                                                          */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../..'), DIST = path.join(ROOT, 'dist');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const copy = (rel, destRoot) => { const d = path.join(destRoot, rel); fs.mkdirSync(path.dirname(d), { recursive: true }); fs.copyFileSync(path.join(ROOT, rel), d); };

function build() {
  const t0 = Date.now();
  fs.rmSync(DIST, { recursive: true, force: true });
  const html = read('index.html');
  const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
  const css = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map(m => m[1]);
  const manifest = JSON.parse(read('assets/manifest.json'));
  const pageFiles = Object.values(manifest.pages).map(p => p.file);
  // 1) dist/web
  const web = path.join(DIST, 'web');
  for (const f of ['index.html', ...scripts, ...css, ...pageFiles]) copy(f, web);
  for (const f of ['assets/audio/README.md']) if (fs.existsSync(path.join(ROOT, f))) copy(f, web);
  // 2) tek dosya
  const m2 = JSON.parse(JSON.stringify(manifest));
  for (const n in m2.pages) m2.pages[n].file = 'data:image/png;base64,' + fs.readFileSync(path.join(ROOT, m2.pages[n].file)).toString('base64');
  let one = html;
  for (const c of css) one = one.replace(`<link rel="stylesheet" href="${c}">`, () => `<style>\n${read(c)}</style>`);
  for (const s of scripts) {
    const body = s === 'assets/manifest.js' ? '/* gömülü atlas manifesti (data: URI) */\nwindow.ASSET_MANIFEST = ' + JSON.stringify(m2) + ';\n' : read(s);
    one = one.replace(`<script src="${s}"></script>`, () => `<script>/* ---- ${s} ---- */\n${body.replace(/<\/script/gi, '<\\/script')}</script>`);
  }
  fs.mkdirSync(DIST, { recursive: true }); fs.writeFileSync(path.join(DIST, 'CozFis_Standalone.html'), one);
  const size = f => fs.statSync(f).size;
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).reduce((a, e) => a + (e.isDirectory() ? walk(path.join(d, e.name)) : size(path.join(d, e.name))), 0);
  console.log(`dist/web: ${(walk(web) / 1024).toFixed(0)} KB · dist/CozFis_Standalone.html: ${(size(path.join(DIST, 'CozFis_Standalone.html')) / 1024).toFixed(0)} KB · ${Date.now() - t0} ms`);
}
module.exports = { build };
if (require.main === module) build();
