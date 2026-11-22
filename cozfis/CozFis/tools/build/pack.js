#!/usr/bin/env node
/* tools/build/pack.js — tek tek PNG'lerden atlas sayfalarını ve çalışma zamanı manifestini kurar.
   Girdi : assets/sprites.json + assets/**​/<id>.png   (sanatçı bir PNG'yi değiştirebilir; boyutu dosyadan okunur)
   Çıktı : assets/atlases/<atlas>[_n].png + .json, assets/manifest.js (+ manifest.json)
   Kurallar: sayfa 1024 (sığmazsa 2048) px kare; 2048'den büyük katmanlar (kasaba ana katmanı 2960 px) bağımsız
   dosya olarak kalır. Kayıpsız PNG; görüntü yumuşatma kapalı; 1 px boşluk.
   Kullanım: node tools/build/pack.js                                                       */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const ATLAS_OF = { fish: 'fish_atlas', characters: 'character_atlas', boats: 'boat_atlas', ui: 'ui_atlas', environment: 'environment_atlas', props: 'props_atlas' };
/* Çevre katmanları gruplara bölünür ve isteğe bağlı yüklenir (özgün oyun da aynı anda en fazla 2 bölge tutar):
   environment_season_<mevsim> (kasaba/iskele/ev/kıyı), environment_region_<bölge>_<mevsim>, environment_common (deniz haritası, çekirdek) */
const SEASON_RE = '(spring|summer|autumn|winter)';
function envAtlas(id) {
  let m = id.match(new RegExp('^env_region_(.+?)_' + SEASON_RE + '_')); if (m) return 'environment_region_' + m[1] + '_' + m[2];
  m = id.match(new RegExp('^env_(town|pier|shore|home)_(?:.*?_)?' + SEASON_RE + '(?:_|$)')); if (m) return 'environment_season_' + m[2];
  return 'environment_common';
}
const groupOf = atlas => /^environment_(season|region)_/.test(atlas) ? atlas.replace(/^environment_/, '') : 'core';
const BOOT_GROUPS = ['region_sakin_liman_spring', 'season_spring'];   // ana menü arka planı (MainMenu sahnesi) bunları kullanır
const PAD = 1, MAX = 2048;

const pngSize = f => { const b = fs.readFileSync(f); if (b.toString('ascii', 12, 16) !== 'IHDR') throw new Error('PNG değil: ' + f); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };

/* raf (shelf) paketleme: yüksekliğe göre sıralı, sayfa dolunca yenisi */
function packPages(rects, size) {
  const pages = [];
  const tryPlace = (pg, r, w, h) => {
    for (const sh of pg.shelves) if (h <= sh.h && sh.x + w <= size) { r.x = sh.x; r.y = sh.y; sh.x += w; return true; }
    if (pg.y + h <= size && w <= size) { pg.shelves.push({ y: pg.y, h, x: w }); r.x = 0; r.y = pg.y; pg.y += h; return true; }
    return false;
  };
  for (const r of [...rects].sort((a, b) => b.h - a.h || b.w - a.w)) {
    const w = r.w + PAD, h = r.h + PAD;
    let pg = pages.find(p => tryPlace(p, r, w, h));
    if (!pg) { pg = { size, shelves: [], items: [], y: 0 }; pages.push(pg); if (!tryPlace(pg, r, w, h)) throw new Error('sığmadı: ' + r.id); }
    pg.items.push(r);
  }
  return pages;
}

async function pack() {
  const t0 = Date.now();
  const src = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/sprites.json'), 'utf8'));
  // tüm görüntü birimleri (sprite + dil yamaları)
  const units = [];
  for (const sp of src.sprites) {
    const [w, h] = pngSize(path.join(ROOT, sp.file)); sp._w = w; sp._h = h;
    const atlas = sp.cat === 'environment' ? envAtlas(sp.id) : ATLAS_OF[sp.cat]; units.push({ id: sp.id, file: sp.file, w, h, atlas, ref: sp });
    for (const l in (sp.l10n || {})) for (const p of sp.l10n[l]) { const [pw, ph] = pngSize(path.join(ROOT, p.file)); units.push({ id: path.basename(p.file, '.png'), file: p.file, w: pw, h: ph, atlas, patch: p }); }
  }
  const pages = {}; const place = new Map();
  const groups = {}; for (const u of units) (u.w > MAX || u.h > MAX ? (groups.__solo = groups.__solo || []) : (groups[u.atlas] = groups[u.atlas] || [])).push(u);
  for (const u of groups.__solo || []) { const name = 'solo_' + u.id; pages[name] = { file: u.file, w: u.w, h: u.h, group: groupOf(u.atlas), solo: true }; place.set(u.id, { page: name, x: 0, y: 0 }); }
  delete groups.__solo;
  const compose = [];
  for (const atlas of Object.keys(groups).sort()) {
    const rs = groups[atlas]; const area = rs.reduce((a, r) => a + (r.w + PAD) * (r.h + PAD), 0);
    let pgs = area < 1024 * 1024 * 0.8 ? packPages(rs, 1024) : null; if (!pgs || pgs.length > 1) pgs = packPages(rs, MAX);
    pgs.forEach((pg, i) => {
      const name = pgs.length > 1 ? atlas + '_' + i : atlas, file = 'assets/atlases/' + name + '.png';
      const trim = true;   // sayfa genişliği 1024/2048 sınırında; yükseklik ve genişlik kullanılan alana kırpılır (çözülmüş bellek)
      const W = trim ? Math.max(...pg.shelves.map(s => s.x)) : pg.size, H = trim ? pg.y : pg.size;
      pages[name] = { file, w: W, h: H, group: groupOf(atlas) };
      compose.push({ name, file, w: W, h: H, items: pg.items.map(r => ({ id: r.id, file: r.file, x: r.x, y: r.y, w: r.w, h: r.h })) });
      for (const r of pg.items) place.set(r.id, { page: name, x: r.x, y: r.y });
    });
  }
  // sayfaları tarayıcıda birleştir (Chromium PNG kod çözücü/kodlayıcı; kayıpsız)
  fs.rmSync(path.join(ROOT, 'assets/atlases'), { recursive: true, force: true }); fs.mkdirSync(path.join(ROOT, 'assets/atlases'), { recursive: true });
  const { chromium } = require('playwright');
  const server = require('../serve-lib.js').start(ROOT, 0); const port = await server.ready;
  const browser = await chromium.launch(); const page = await browser.newPage();
  await page.goto(`http://localhost:${port}/assets/sprites.json`);
  for (const c of compose) {
    const data = await page.evaluate(async c => {
      const cv = document.createElement('canvas'); cv.width = c.w; cv.height = c.h; const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
      await Promise.all(c.items.map(it => new Promise((res, rej) => { const im = new Image(); im.onload = () => { g.drawImage(im, it.x, it.y); res(); }; im.onerror = () => rej(new Error(it.file)); im.src = '/' + it.file; })));
      return cv.toDataURL('image/png');
    }, c);
    const buf = Buffer.from(data.split(',')[1], 'base64'); fs.writeFileSync(path.join(ROOT, c.file), buf); pages[c.name].bytes = buf.length;
    fs.writeFileSync(path.join(ROOT, c.file.replace(/\.png$/, '.json')), JSON.stringify({ atlas: c.name, image: path.basename(c.file), size: [c.w, c.h],
      frames: Object.fromEntries(c.items.map(it => { const sp = src.sprites.find(s => s.id === it.id); return [it.id, Object.assign({ file: it.file, rect: [it.x, it.y, it.w, it.h], w: it.w, h: it.h, pivot: (sp && sp.pivot) || [0, 0] }, sp && sp.key ? { key: sp.key } : {}, sp && sp.meta && sp.meta.layer ? { layer: sp.meta.layer } : {})]; })) }, null, 1));
  }
  await browser.close(); server.close();
  for (const n in pages) if (pages[n].solo) pages[n].bytes = fs.statSync(path.join(ROOT, pages[n].file)).size;
  // çalışma zamanı manifesti
  const anims = {};
  for (const sp of src.sprites) { const m = sp.id.match(/^(.*)_f(\d)$/) || (sp.key && sp.key.match(/^((?:gull|cat|lure|shrock))(\d)$/)); if (m) (anims[m[1]] = anims[m[1]] || []).push(sp.id); }
  const sprites = {};
  for (const sp of src.sprites) {
    const p = place.get(sp.id); const o = { page: p.page, x: p.x, y: p.y, w: sp._w, h: sp._h };
    if (sp.pivot) o.pivot = sp.pivot; if (sp.meta) o.meta = sp.meta;
    if (sp.l10n) { o.l10n = {}; for (const l in sp.l10n) o.l10n[l] = sp.l10n[l].map(q => { const pp = place.get(path.basename(q.file, '.png')); return { page: pp.page, x: pp.x, y: pp.y, w: q.w, h: q.h, dx: q.dx, dy: q.dy }; }); }
    sprites[sp.id] = o;
  }
  const manifest = { version: 2, bootGroups: BOOT_GROUPS, built: 'tools/build/pack.js', logical: [640, 360], pages, keys: src.keyMap, sprites, anims };
  const js = '/* Otomatik üretildi: tools/build/pack.js — elle düzenlemeyin; kaynak: assets/sprites.json */\nwindow.ASSET_MANIFEST = ' + JSON.stringify(manifest) + ';\n';
  fs.writeFileSync(path.join(ROOT, 'assets/manifest.js'), js);
  fs.writeFileSync(path.join(ROOT, 'assets/manifest.json'), JSON.stringify(manifest, null, 1));
  const tot = Object.values(pages).reduce((a, p) => a + (p.bytes || 0), 0);
  console.log(`paketlendi: ${Object.keys(sprites).length} sprite, ${Object.keys(pages).length} sayfa (${Object.values(pages).filter(p => p.group === 'core').length} çekirdek, ${new Set(Object.values(pages).map(p => p.group)).size - 1} isteğe bağlı grup), toplam ${(tot / 1024).toFixed(0)} KB, ${Date.now() - t0} ms`);
  return manifest;
}
module.exports = { pack };
if (require.main === module) pack().catch(e => { console.error(e); process.exit(1); });
