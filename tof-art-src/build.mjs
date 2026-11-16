// Tides of Fortune — 3/4 art rebuild pipeline
import fs from 'node:fs';
import { execSync } from 'node:child_process';
const W = new URL('.', import.meta.url).pathname;
const dev = process.argv.includes('--dev');
const src = fs.readFileSync(W + 'game.pretty.js', 'utf8').split('\n');
const L = (n) => src[n - 1];
const art = (f) => fs.readFileSync(W + 'art/' + f, 'utf8');
const has = (f) => fs.existsSync(W + 'art/' + f);
// patches: [startLine (incl), endLine (excl), expectedStartPrefix, expectedEndPrefix, replacement()]
const P = [];
const add = (a, b, sa, sb, fn) => P.push({ a, b, sa, sb, fn });
const npcTable = () => '  var NPCL = {\n' + src.slice(12177 - 1, 12501).join('\n') + '\n  };\n';
if (has('ship.js')) add(11269, 11548, '  function yc(', '  function wo(', () => art('ship.js'));
if (has('chars.js')) add(11598, 12511, '  var Be = 22,', '  var oi = new Map();', () => npcTable() + art('chars.js') + (has('pets.js') ? art('pets.js') : ''));
if (has('cargo.js')) add(12511, 12584, '  var oi = new Map();', '  var N = {},', () => art('cargo.js'));
if (has('props1.js')) add(12584, 12830, '  var N = {},', '  var rn = {', () => art('props1.js'));
if (has('harbor.js')) add(12830, 12899, '  var rn = {', '  var zo = {', () => art('harbor.js'));
if (has('ocean_tile.js')) add(12899, 12941, '  var zo = {', '  var nn = class {', () => art('ocean_tile.js'));
if (has('ocean_base.js')) add(13041, 13053, '    drawBase(e, a, r) {', '    drawAmbient(e, a) {', () => art('ocean_base.js'));
if (has('icons.js')) add(14667, 14855, '  var Ar = {', '  var Tt = ', () => art('icons.js'));
if (has('ocean_amb.js')) add(13073, 13086, '        case "distantShip": {', '        case "fogBank":', () => art('ocean_amb.js'));
if (has('ocean_top.js')) add(13095, 13109, '      for (let n of this.ambient)', '      for (let n of this.weather)', () => art('ocean_top.js'));
if (has('deckdraw.js')) add(13983, 14019, '      draw(e, a = "deck") {', '      info(e) {', () => art('deckdraw.js'));
if (has('deckbub.js')) add(14034, 14042, '      bubblePositions() {', '    };', () => art('deckbub.js'));
if (has('props2.js')) add(14043, 14667, '  var ut = ', '  var Ar = {', () => art('props2.js'));
if (has('worlddraw.js')) add(15079, 15241, '      drawOurShip(e, a) {', '      overlays(e, a) {', () => art('worlddraw.js'));
if (has('dock.js')) add(22083, 22088, '  N.dockCat', '  var ge = {', () => art('dock.js'));
if (has('portraits.js')) add(24460, 24480, '  function kt(', '  var Qo = ', () => art('portraits.js'));
P.sort((x, y) => x.a - y.a);
let out = [], cur = 1;
for (const p of P) {
  if (!L(p.a).startsWith(p.sa)) throw new Error(`anchor mismatch @${p.a}: ${L(p.a).slice(0, 60)} != ${p.sa}`);
  if (!L(p.b).startsWith(p.sb)) throw new Error(`end anchor mismatch @${p.b}: ${L(p.b).slice(0, 60)} != ${p.sb}`);
  out.push(...src.slice(cur - 1, p.a - 1));
  out.push(p.fn());
  cur = p.b;
}
out.push(...src.slice(cur - 1));
let js = out.join('\n');
// tek satırlık yamalar
const rep = (from, to, count = 1) => {
  const n = js.split(from).length - 1;
  if (n !== count) throw new Error(`rep count ${n} != ${count} for: ${from.slice(0, 70)}`);
  js = js.split(from).join(to);
};
if (has('worlddraw.js')) {
  rep('this.ocean.emitWake(l.x + n.x, 0, i.beam, this.speed, l.y + n.y + i.len / 2 - 4, l.y + n.y - i.len / 2 + 4)',
      'this.ocean.emitWake(l.x + n.x, 0, i.beam, this.speed, l.y + n.y + i.len / 2 + (i.sternH || 0) - 2, l.y + n.y - i.len / 2 + 4)');
}
if (has('icons.js')) {
  rep('H(t, s.x, s.y, 9, "#e0b040"), H(t, s.x, s.y, 7, "#f8e8a8"), t.drawImage(vt("crown"), s.x - 5, s.y - 5);', 'H(t, s.x, s.y, 12, "#e0b040"), H(t, s.x, s.y, 10, "#f8e8a8"), t.drawImage(vt("crown"), s.x - 8, s.y - 8);');
  rep('(H(t, C, X, T.final ? 9 : 7, T.final ? "#e0b040" : q ? "#7a5a3a" : "#b8a070"),', '(H(t, C, X, T.final ? 12 : 11, T.final ? "#e0b040" : q ? "#7a5a3a" : "#b8a070"),');
  rep('H(t, C, X, T.final ? 7 : 5, T.final ? "#f8e8a8" : q ? "#f4ead5" : "#e8d6a8"),', 'H(t, C, X, T.final ? 10 : 9, T.final ? "#f8e8a8" : q ? "#f4ead5" : "#e8d6a8"),');
  rep('t.drawImage(D, C - 5, X - 5);', 't.drawImage(D, C - 8, X - 8);', 2);
}
if (fs.existsSync(W + 'art/patches.mjs')) { const m = await import(W + 'art/patches.mjs?' + Date.now()); m.default(rep, { has, dev }); }
if (dev) {
  const hook = '\n  ;window.__ART = { Mo, Ar, ui, ln, shipCompose: typeof shipCompose!=="undefined"?shipCompose:null, Ht, Ro, ha, pa, Ca, N, Ae, Xe, Qe, dS: typeof dS!=="undefined"?dS:null, NPCL: typeof NPCL!=="undefined"?NPCL:null, vt, kt, Qa, So: typeof So!=="undefined"?So:null, Co: typeof Co!=="undefined"?Co:null, Io: typeof Io!=="undefined"?Io:null };\n';
  const i = js.indexOf('  var c = (t, e = {}) => ({ type: t, ...e }),');
  if (i < 0) throw new Error('dev hook anchor');
  js = js.slice(0, i) + hook + js.slice(i);
}
fs.writeFileSync(W + 'out/game.new.js', js);
let finalJs = js;
if (!process.argv.includes('--nomin')) {
  execSync(`npx --yes esbuild@0.21.5 ${W}out/game.new.js --minify --charset=utf8 --target=es2019 --outfile=${W}out/game.min.js --log-level=warning`, { stdio: 'inherit' });
  finalJs = fs.readFileSync(W + 'out/game.min.js', 'utf8');
}
const html = fs.readFileSync(W + 'orig/game.html', 'utf8').split('\n');
// satır 568-569 = oyun betiği (0-index 567,568)
if (!html[567].startsWith('(()=>{var Y=')) throw new Error('html script anchor');
const res = [...html.slice(0, 567), finalJs.replace(/<\/script/gi, '<\\/script'), ...html.slice(569)].join('\n');
const name = dev ? 'dev.html' : 'TidesOfFortune.html';
fs.writeFileSync(W + 'out/' + name, res);
console.log('built', name, (res.length / 1024).toFixed(0) + 'KB');
