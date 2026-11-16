// Tides of Fortune (Expansion 3) — art patch pipeline
import fs from 'node:fs';
import { execSync } from 'node:child_process';
const W = new URL('.', import.meta.url).pathname;
const dev = process.argv.includes('--dev');
let js = fs.readFileSync(W + 'game.pretty.js', 'utf8');
const rep = (from, to, count = 1) => {
  const n = js.split(from).length - 1;
  if (n !== count) throw new Error(`rep count ${n} != ${count} for: ${from.slice(0, 80)}`);
  js = js.split(from).join(to);
};
// art/*.js: her dosya "//@@ <çapa satırı>" ile başlar; içerik o satırın hemen ÖNCESİNE eklenir (sonradan tanımlanan kazanır)
if (fs.existsSync(W + 'art/patches.mjs')) { const m = await import(W + 'art/patches.mjs?' + Date.now()); m.default(rep, { dev, js: () => js, set: (s) => { js = s; }, read: (f) => fs.readFileSync(W + 'art/' + f, 'utf8') }); }
if (dev) {
  const hook = '\n  ;window.__ART = { N: U, ha: Na, pa: va, Ro: Pi, dS: Be, Ht: nr, shipCompose: Bi, Ca: La, vt: wr, Mo: Ed, Ar: fn, ui: Xi, ln: Ui, So: gd, Co: bd, Io: Kr, NPCL: ld, Ae: aa };\n';
  rep('  var c = (a, e = {}) => ({ type: a, ...e }),', hook + '  var c = (a, e = {}) => ({ type: a, ...e }),');
}
fs.writeFileSync(W + 'out/game.new.js', js);
let finalJs = js;
if (!process.argv.includes('--nomin')) {
  execSync(`npx --yes esbuild@0.21.5 ${W}out/game.new.js --minify --charset=utf8 --target=es2019 --outfile=${W}out/game.min.js --log-level=error`, { stdio: 'inherit' });
  finalJs = fs.readFileSync(W + 'out/game.min.js', 'utf8');
}
const html = fs.readFileSync(W + 'game.html', 'utf8').split('\n');
if (!html[572].startsWith('(()=>{var pe=')) throw new Error('html script anchor');
const res = [...html.slice(0, 572), finalJs.replace(/<\/script/gi, '<\\/script'), ...html.slice(574)].join('\n');
const name = dev ? 'dev.html' : 'TidesOfFortune.html';
fs.writeFileSync(W + 'out/' + name, res);
console.log('built', name, (res.length / 1024).toFixed(0) + 'KB');
