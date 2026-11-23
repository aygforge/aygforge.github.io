/** Inline the standalone build (JS, CSS, images as data URIs) into one offline HTML file. */
import { readFileSync, writeFileSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SRC = 'dist/standalone-tmp';
let html = readFileSync(join(SRC, 'index.html'), 'utf8');
html = html.replace(/<script type="module" crossorigin src="\.\/([^"]+)"><\/script>/g, (_m, p) => {
  const js = readFileSync(join(SRC, p), 'utf8').replace(/<\/script/g, '<\\/script');
  return `<script type="module">${js}</script>`;
});
html = html.replace(/<link rel="stylesheet" crossorigin href="\.\/([^"]+)">/g, (_m, p) => `<style>${readFileSync(join(SRC, p), 'utf8')}</style>`);
html = html.replace(/<link rel="modulepreload"[^>]*>/g, '');
// verify no external asset references remain
const leftovers = html.match(/(src|href)="\.\/assets\/[^"]+"/g);
if (leftovers) throw new Error('Standalone still references external files: ' + leftovers.join(', '));
const assetDir = join(SRC, 'assets');
const extra = existsSync(assetDir) ? readdirSync(assetDir).filter((f) => f.endsWith('.png')) : [];
if (extra.some((f) => html.includes(f))) throw new Error('PNG files referenced by URL in standalone build');
writeFileSync('dist/standalone.html', html);
rmSync(SRC, { recursive: true, force: true });
console.log(`dist/standalone.html written (${(html.length / 1024 / 1024).toFixed(2)} MB), no external assets`);
