// ui/UITheme.js — shared UI helpers: number formats, ranks, reusable widget markup.
import { T } from '../core/i18n.js';
import { icon } from './icons.js';

export const fmtNum = n => Math.floor(n).toLocaleString('tr-TR');
/** Courier ranks by career level (Master Prompt §14): 1–9, 10–19, 20–34, 35–49, 50–74, 75–99, 100. */
export const RANK_LEVELS = [1, 10, 20, 35, 50, 75, 100];
export function rankOf(level) { let r = 0; RANK_LEVELS.forEach((l, i) => { if (level >= l) r = i; }); return r; }

export const coin = n => `<span class="p-coin">${icon('coin')}<b>${fmtNum(n)}</b></span>`;
export const stars = (n, max = 3, cls = '') => `<span class="p-stars ${cls}">${Array.from({ length: max }, (_, i) => icon('star', i < n)).join('')}</span>`;
export const bar = (pct, cls = '') => `<span class="p-bar ${cls}"><i style="width:${Math.max(0, Math.min(100, pct * 100)).toFixed(1)}%"></i></span>`;
/** Big bevelled button. variant: gold | orange | blue | teal | red | steel */
export const btn = (label, attrs = '', variant = 'gold', extra = '') => `<button class="p-btn p-${variant} ${extra}" ${attrs}><span>${label}</span></button>`;
export const lockNote = text => `<div class="p-locknote">${icon('lock')}<span>${text}</span></div>`;
export const sectionTitle = text => `<div class="p-sec">${text}</div>`;
export const fmtSec = s => T('secShort', Math.round(s));

/** Animate a number inside `el` from a to b over ms (scene-scoped; instant when reduced). */
export function countUp(ctx, el, a, b, ms, reduced, fmt = fmtNum) {
  if (!el) return;
  if (reduced || ms <= 0) { el.textContent = fmt(b); return; }
  const t0 = performance.now();
  const step = () => {
    if (!ctx.alive) return;
    const k = Math.min(1, (performance.now() - t0) / ms), e = 1 - Math.pow(1 - k, 3);
    el.textContent = fmt(Math.round(a + (b - a) * e));
    if (k < 1 && !el.dataset.skip) requestAnimationFrame(step); else el.textContent = fmt(b);
  };
  requestAnimationFrame(step);
}
