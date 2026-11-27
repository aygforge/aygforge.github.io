// Tek dosya derleyici: src/ modüllerini esbuild ile paketler, CSS + gömülü yazı tipini ekler ve BladesOfFortune.html üretir.
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const res = await build({ entryPoints: [join(root, 'src/main.js')], bundle: true, format: 'iife', minify: !process.argv.includes('--dev'), write: false, target: ['es2020'], legalComments: 'none' });
const js = res.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const css = readFileSync(join(root, 'src/ui/font.css'), 'utf8') + '\n' + readFileSync(join(root, 'src/ui/style.css'), 'utf8');
const icon = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect width="16" height="16" fill="#1e120b"/><rect x="7" y="1" width="2" height="10" fill="#d8d8e0"/><rect x="4" y="10" width="8" height="2" fill="#c8a02a"/><rect x="7" y="12" width="2" height="3" fill="#7a4a1a"/></svg>');
const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="theme-color" content="#120c18">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="description" content="Blades of Fortune — Orta Çağ fantastik roguelite RPG. AYG FORGE.">
<title>Blades of Fortune</title>
<link rel="icon" href="${icon}">
<style>
${css}
</style>
</head>
<body>
<div id="app">
  <div id="stage">
    <canvas id="scene" width="427" height="240"></canvas>
    <div id="bubbles"></div>
    <div id="ui"></div>
    <div id="overlay"></div>
  </div>
  <div id="rotate"><div class="rotIcon"></div><h2>Lütfen telefonunu yatay çevir</h2><p>Blades of Fortune yatay ekranda oynanır.</p></div>
  <div id="loading">Blades of Fortune<small>Yükleniyor…</small></div>
</div>
<noscript>Bu oyun için JavaScript gereklidir.</noscript>
<script>
${js}
</script>
</body>
</html>
`;
writeFileSync(join(root, 'BladesOfFortune.html'), html);
console.log('BladesOfFortune.html', (html.length / 1024).toFixed(0) + ' KB');
