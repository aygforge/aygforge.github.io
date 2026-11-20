// Rewrite code_p.js replacing catalogued strings with _t() calls.
// usage: node transform.js code_p.js occs.json out.js report.json
const fs = require('fs');
const src = fs.readFileSync(process.argv[2], 'utf8');
const occs = JSON.parse(fs.readFileSync(process.argv[3], 'utf8')).sort((a, b) => a.start - b.start || b.end - a.end);
const report = { getters: 0, arrays: 0, static: [] };

// decide load-time strategy
const inserts = []; // [pos, text]
const arrDone = new Set();
for (const o of occs) {
  o.mode = 'call';
  if (o.inFn) continue;
  const argSrc = o.args.map(([a, b]) => src.slice(a, b)).join(' ');
  if (/\bthis\b/.test(argSrc)) { o.mode = 'call'; report.static.push({ line: o.line, key: o.key, why: 'this' }); continue; }
  if (o.propR) { o.mode = 'getter'; report.getters++; continue; }
  if (o.arr) {
    o.mode = 'arr'; report.arrays++;
    const k = o.arr.join(':'); if (!arrDone.has(k)) { arrDone.add(k); inserts.push([o.arr[0], '_LA(']); inserts.push([o.arr[1], ')']); }
    continue;
  }
  report.static.push({ line: o.line, key: o.key, why: 'static' });
}
// top-level containment: occ ranges (getter uses property range)
for (const o of occs) { o.rs = o.mode === 'getter' ? o.propR[0] : o.start; o.re = o.mode === 'getter' ? o.propR[1] : o.end; }
occs.sort((a, b) => a.rs - b.rs || b.re - a.re);
inserts.sort((a, b) => a[0] - b[0]);

function call(o) {
  const args = o.args.map(([a, b]) => render(a, b));
  return "_t('" + o.key + "'" + (args.length ? ', [' + args.join(', ') + ']' : '') + ')';
}
function emit(o) {
  if (o.mode === 'getter') {
    const k = o.keySrc; const kq = JSON.stringify(/^["']/.test(k) ? JSON.parse(k.replace(/^'(.*)'$/, '"$1"')) : k);
    return `get ${k}() { return ${call(o)}; }, set ${k}(v) { _sv(this, ${kq}, v); }`;
  }
  if (o.mode === 'arr') return '_L(() => ' + call(o) + ')';
  return call(o);
}
function copy(a, b) { // copy source with insert points in [a,b)
  let out = ''; let p = a;
  for (const [pos, txt] of inserts) { if (pos < a || pos >= b) continue; out += src.slice(p, pos) + txt; p = pos; }
  return out + src.slice(p, b);
}
function render(a, b) {
  let out = ''; let p = a;
  for (const o of occs) {
    if (o.rs < p || o.re > b) continue;
    out += copy(p, o.rs) + emit(o); p = o.re;
  }
  // inserts exactly at b (closing) belong to caller level; include if b is end of whole
  return out + copy(p, b);
}
let out = render(0, src.length);
// closing inserts at end positions equal to b were excluded by [a,b) — handle: closing ')' positions are array end (exclusive) which lie in parent gap, fine.
fs.writeFileSync(process.argv[4], out);
fs.writeFileSync(process.argv[5], JSON.stringify(report, null, 1));
console.log('getters', report.getters, 'arrays', report.arrays, 'static', report.static.length);
