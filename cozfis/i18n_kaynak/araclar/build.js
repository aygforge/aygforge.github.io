// Build i18n catalog of player-facing strings from code.js
// usage: node build.js code.js outdir
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');
const src = fs.readFileSync(process.argv[2], 'utf8');
const OUT = process.argv[3];
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'rules.json'), 'utf8'));
const lineStarts = [0]; for (let i = 0; i < src.length; i++) if (src[i] === '\n') lineStarts.push(i + 1);
const lineOf = p => { let lo = 0, hi = lineStarts.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (lineStarts[m] <= p) lo = m; else hi = m - 1; } return lo + 1; };
const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'script' });
const mods = []; { const re = /\/\* ---- ([0-9a-z_]+)\.js ---- \*\//g; let m; while ((m = re.exec(src))) mods.push([m.index, m[1]]); }
const modOf = p => { let n = 'core'; for (const [i, name] of mods) if (i <= p) n = name; return n; };

// parent links
(function link(n, p) {
  n.parent = p;
  for (const k in n) { if (k === 'parent') continue; const v = n[k]; if (Array.isArray(v)) v.forEach(c => c && typeof c.type === 'string' && link(c, n)); else if (v && typeof v.type === 'string') link(v, n); }
})(ast, null);
const all = []; (function each(n) { all.push(n); for (const k in n) { if (k === 'parent') continue; const v = n[k]; if (Array.isArray(v)) v.forEach(c => c && typeof c.type === 'string' && each(c)); else if (v && typeof v.type === 'string') each(v); } })(ast);

const isStr = n => (n.type === 'Literal' && typeof n.value === 'string') || n.type === 'TemplateLiteral';
const INC = new Set(cfg.includeText);
const TRCH = /[çğıöşüÇĞİÖŞÜâîûÂÎÛ]/;
const TAGRE = /<\/?[a-zA-Z][^<>]*>/g;
const visText = s => s.replace(TAGRE, ' ').replace(/&[a-z#0-9]+;/g, ' ');
const lineExcluded = l => cfg.excludeLines.some(([a, b]) => l >= a && l <= b);

function calleeName(c) {
  if (!c) return '';
  if (c.type === 'Identifier') return c.name;
  if (c.type === 'MemberExpression') return (calleeName(c.object) + '.' + (c.property.name || c.property.value || '')).replace(/^\./, '');
  return '';
}
// is this string node in a non-display position?
function badPosition(n) {
  let p = n.parent, c = n;
  // climb through conditional / logical / concat wrappers
  while (p && (p.type === 'ConditionalExpression' && p.test !== c || p.type === 'LogicalExpression' || (p.type === 'BinaryExpression' && p.operator === '+'))) { c = p; p = p.parent; }
  if (!p) return null;
  if (p.type === 'BinaryExpression' && /^(===|!==|==|!=|in|instanceof)$/.test(p.operator)) return 'cmp';
  if (p.type === 'SwitchCase' && p.test === c) return 'case';
  if (p.type === 'MemberExpression' && p.property === c) return 'member';
  if (p.type === 'Property' && p.key === c) return 'key';
  if ((p.type === 'CallExpression' || p.type === 'NewExpression')) {
    const nm = calleeName(p.callee);
    if (cfg.badCallees.some(b => nm === b || nm.endsWith('.' + b))) return 'call:' + nm;
    if (p.callee.type === 'MemberExpression' && cfg.badMethods.includes(p.callee.property.name) && p.arguments[0] === c) return 'm:' + p.callee.property.name;
    if (/^console\./.test(nm)) return 'console';
    if (p.type === 'NewExpression' && /Error$/.test(nm)) return 'error';
  }
  if (p.type === 'Property' && !p.computed && cfg.badPropKeys.includes(p.key.name || p.key.value)) return 'prop';
  return null;
}
function textOf(n) { return n.type === 'Literal' ? n.value : n.quasis.map(q => q.value.cooked).join(' '); }
function isCandidateText(n) {
  const t = textOf(n);
  if (cfg.excludeText.includes(t)) return false;
  const v = visText(t);
  const attrs = (t.match(/(?:title|placeholder|alt|aria-label)="[^"]*"/g) || []).join(' ');
  if (TRCH.test(v) || TRCH.test(attrs)) return true;
  if (/(?:title|placeholder|alt|aria-label)="[^"]*[A-Za-z]{2,}/.test(t)) return true;
  if (INC.has(v.replace(/\s+/g, ' ').trim())) return true;
  return false;
}

// ---- collect chains ----
const candidates = []; const consumed = new Set();
function flatten(b) { const ops = []; let n = b; while (n.type === 'BinaryExpression' && n.operator === '+') { ops.unshift(n.right); n = n.left; } ops.unshift(n); return ops; }
for (const n of all) {
  if (n.type !== 'BinaryExpression' || n.operator !== '+') continue;
  if (n.parent && n.parent.type === 'BinaryExpression' && n.parent.operator === '+' && n.parent.left === n) continue; // not chain top
  const ops = flatten(n);
  const j = ops.findIndex(isStr); if (j < 0) continue;
  const strOps = ops.filter(isStr);
  if (!strOps.some(o => isCandidateText(o) && !lineExcluded(lineOf(o.start)))) continue;
  // prefix: left node containing ops[0..j-1]
  let prefix = null;
  if (j > 0) { let x = n; for (let k = ops.length - 1; k > j; k--) x = x.left; prefix = x.left; }
  const parts = []; if (prefix) parts.push({ expr: prefix });
  for (let k = j; k < ops.length; k++) parts.push(isStr(ops[k]) ? { str: ops[k] } : { expr: ops[k] });
  strOps.forEach(o => consumed.add(o));
  candidates.push({ node: n, kind: 'concat', parts });
}
for (const n of all) {
  if (!isStr(n) || consumed.has(n)) continue;
  if (n.parent && n.parent.type === 'TaggedTemplateExpression') continue;
  if (n.parent && n.parent.type === 'Property' && n.parent.key === n) continue;
  if (!isCandidateText(n)) continue;
  candidates.push({ node: n, kind: 'single', parts: [{ str: n }] });
}

// ---- build messages ----
// message pieces: text with {k} placeholders, args = expression nodes
function buildMsg(c) {
  let msg = ''; const args = [];
  for (const p of c.parts) {
    if (p.expr) { msg += '{' + args.length + '}'; args.push(p.expr); continue; }
    const s = p.str;
    if (s.type === 'Literal') msg += s.value.replace(/\{(\d)/g, '{​$1');
    else s.quasis.forEach((q, i) => { msg += q.value.cooked.replace(/\{(\d)/g, '{​$1'); if (i < s.expressions.length) { msg += '{' + args.length + '}'; args.push(s.expressions[i]); } });
  }
  return { msg, args };
}
const fold = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i').replace(/İ/g, 'I').toLowerCase();
function slug(msg) {
  const at = (msg.match(/(?:title|placeholder|alt|aria-label)="([^"]*)"/g) || []).map(x => x.replace(/^[^"]*"|"$/g, '')).join(' ');
  const v = (visText(msg) + ' ' + at).replace(/\{\d+\}/g, ' n ');
  const w = fold(v).replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean).slice(0, 5);
  return w.join('_') || 'x';
}
const modShort = m => (cfg.modShort[m] || m.replace(/^\d+_/, '').replace(/_?v\d$/, ''));
const skipped = []; const occs = []; const catalog = {}; const byMsg = {};
for (const c of candidates) {
  const line = lineOf(c.node.start);
  if (lineExcluded(line)) continue;
  const why = badPosition(c.node);
  if (why) { skipped.push({ line, why, text: buildMsg(c).msg.slice(0, 80) }); continue; }
  const { msg, args } = buildMsg(c);
  const mod = modOf(c.node.start);
  // in function?
  let inFn = false; for (let a = c.node.parent; a; a = a.parent) if (/Function/.test(a.type) && !(a.parent && a.parent.type === 'CallExpression' && a.parent.callee === a)) { inFn = true; break; }
  let key = byMsg[msg];
  if (!key) {
    let base = modShort(mod) + '.' + slug(msg); key = base; let k = 2; while (catalog[key]) key = base + '_' + (k++);
    byMsg[msg] = key; catalog[key] = { tr: msg, n: 0, lines: [], mod, why: [] };
  }
  catalog[key].n++; catalog[key].lines.push(line); if (why) catalog[key].why.push(why);
  const pp = c.node.parent;
  occs.push({ key, start: c.node.start, end: c.node.end, line, inFn, why, args: args.map(a => [a.start, a.end]),
    prop: pp && pp.type === 'Property' && pp.value === c.node && !pp.computed && pp.kind === 'init' && !pp.method && !pp.shorthand ? (pp.key.type === 'Identifier' ? pp.key.name : JSON.stringify(pp.key.value)) : null,
    inArr: !!(pp && pp.type === 'ArrayExpression'), arr: pp && pp.type === 'ArrayExpression' ? [pp.start, pp.end] : null,
    propR: pp && pp.type === 'Property' && pp.value === c.node ? [pp.start, pp.end] : null, keySrc: pp && pp.type === 'Property' && pp.value === c.node ? src.slice(pp.key.start, pp.key.end) : null });
}
fs.writeFileSync(path.join(OUT, 'catalog.json'), JSON.stringify(catalog, null, 1));
fs.writeFileSync(path.join(OUT, 'occs.json'), JSON.stringify(occs));
fs.writeFileSync(path.join(OUT, 'skipped.json'), JSON.stringify(skipped, null, 1));
const keys = Object.keys(catalog);
console.log('occurrences', occs.length, 'keys', keys.length, 'chars', keys.reduce((a, k) => a + catalog[k].tr.length, 0), 'bad', occs.filter(o => o.why).length, 'loadtime', occs.filter(o => !o.inFn).length);
