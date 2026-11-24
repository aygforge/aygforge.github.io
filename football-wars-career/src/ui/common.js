import { esc, fmtC } from '../career/util.js';
export { esc, fmtC };
export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export function teamLike(c) { return { id: c.id, name: c.name, short: c.short, type: 'club', visual: { primary_color: c.kit.primary, secondary_color: c.kit.secondary, pattern: c.kit.pattern, crest: c.kit.crest } }; }
const crestCache = new Map();
export function crestURL(c, size = 48) {
  const k = c.id + '|' + c.name + '|' + c.kit.primary + c.kit.secondary + c.kit.crest + '|' + size;
  let u = crestCache.get(k); if (u) return u;
  try { u = window.FWSprites.generatedCrest(teamLike(c), size).toDataURL('image/png'); } catch (e) { u = ''; }
  crestCache.set(k, u); return u;
}
export const crest = (c, cls = '') => c ? `<img class="crest ${cls}" alt="" src="${crestURL(c, cls === 'lg' ? 96 : 48)}">` : '';
export function toast(text, kind) {
  const t = document.createElement('div'); t.className = 'toast ' + (kind || ''); t.textContent = text; document.body.appendChild(t);
  setTimeout(() => t.remove(), kind === 'bad' ? 4200 : 2600);
}
export function modal(html, onClick) {
  const m = document.createElement('div'); m.className = 'modal'; m.innerHTML = `<div class="box">${html}</div>`;
  document.body.appendChild(m);
  m.addEventListener('click', e => { const a = e.target.closest('[data-m]'); if (e.target === m) { m.remove(); return; } if (a && onClick) { const keep = onClick(a.dataset.m, m, a); if (!keep) m.remove(); } });
  return m;
}
export const form5 = arr => `<span class="form">${(arr || []).map(x => `<span class="${x}">${x}</span>`).join('')}</span>`;
export const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
export const bar = (v, max) => `<div class="bar"><i style="width:${Math.max(0, Math.min(100, v / max * 100)).toFixed(1)}%"></i></div>`;
// global action registry (kept here to avoid circular-import initialisation order issues)
export const ACTIONS = {};
export function registerActions(o) { Object.assign(ACTIONS, o); }
