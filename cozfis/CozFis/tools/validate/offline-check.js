#!/usr/bin/env node
/* tools/validate/offline-check.js — çevrimdışı garanti (statik tarama)
   index.html'in yüklediği her dosya + css: uzak URL, CDN, ağ API'si (fetch/XHR/WebSocket/importScripts/sendBeacon) yok;
   tüm src/href göreli. Ayrıca manifest sayfa yolları göreli ve dosyalar mevcut.                       */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m => m[1]);
const bad = [];
for (const r of refs) { if (/^[a-z][a-z0-9+.-]*:|^\/\//i.test(r)) bad.push('uzak/mutlak referans: ' + r); else if (!fs.existsSync(path.join(ROOT, r))) bad.push('eksik dosya: ' + r); }
const NET = /\bfetch\s*\(|XMLHttpRequest|WebSocket|importScripts|sendBeacon|EventSource|https?:\/\/(?!www\.w3\.org\/2000\/svg)/;
let scanned = 0;
for (const r of refs.filter(r => /\.(js|css)$/.test(r))) {
  const txt = fs.readFileSync(path.join(ROOT, r), 'utf8'); scanned += txt.length;
  txt.split('\n').forEach((line, i) => { const m = line.match(NET); if (m) bad.push(`${r}:${i + 1}: ${m[0]}`); });
}
const man = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/manifest.json'), 'utf8'));
for (const p of Object.values(man.pages)) { if (/^[a-z]+:|^\//i.test(p.file)) bad.push('manifest mutlak yol: ' + p.file); else if (!fs.existsSync(path.join(ROOT, p.file))) bad.push('manifest eksik: ' + p.file); }
console.log(JSON.stringify({ files: refs.length, scannedChars: scanned, pages: Object.keys(man.pages).length, problems: bad }, null, 1));
process.exit(bad.length ? 2 : 0);
