// Minimal DOM helpers (no framework).
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'html') el.innerHTML = v;
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export const fmt = (n) => Math.round(Number(n) || 0).toLocaleString('tr-TR');
export const pct = (v, d = 1) => '%' + (Math.round(v * 100 * 10 ** d) / 10 ** d).toLocaleString('tr-TR');

let uiRoot = null;
export function setRoot(el) { uiRoot = el; }
export function root() { return uiRoot; }

let toastWrap = null;
export function toast(msg, kind = '') {
  if (!toastWrap || !toastWrap.isConnected) { toastWrap = h('div', { class: 'toast-wrap' }); uiRoot.append(toastWrap); }
  const t = h('div', { class: 'toast ' + kind }, msg);
  toastWrap.append(t);
  setTimeout(() => t.remove(), kind === 'err' ? 4200 : 2800);
  while (toastWrap.children.length > 5) toastWrap.firstChild.remove();
}

export function modal(title, body, { onClose, wide = true, actions = [] } = {}) {
  const wrap = h('div', { class: 'modal-wrap' });
  const close = () => { wrap.remove(); hideTooltip(); onClose?.(); };
  const box = h('div', { class: 'modal frame' + (wide ? '' : ' narrow') },
    h('header', {}, h('h2', {}, title), ...actions, h('button', { class: 'ghost small', onclick: close, 'aria-label': 'Kapat' }, '✕')),
    h('div', { class: 'body' }, body));
  wrap.append(box);
  wrap.addEventListener('mousedown', (e) => { if (e.target === wrap) close(); });
  uiRoot.append(wrap);
  return { wrap, box, close, body: box.querySelector('.body') };
}

export function confirmBox(text, { ok = 'Onayla', danger = false } = {}) {
  return new Promise((resolve) => {
    const wrap = h('div', { class: 'modal-wrap', style: { zIndex: 40 } });
    const done = (v) => { wrap.remove(); resolve(v); };
    wrap.append(h('div', { class: 'confirm-box frame' },
      h('p', {}, text),
      h('div', { class: 'row', style: { justifyContent: 'flex-end' } },
        h('button', { class: 'ghost', onclick: () => done(false) }, 'Vazgeç'),
        h('button', { class: danger ? 'danger' : 'primary', onclick: () => done(true) }, ok))));
    uiRoot.append(wrap);
  });
}

export function promptBox(text, fields, { ok = 'Tamam' } = {}) {
  return new Promise((resolve) => {
    const wrap = h('div', { class: 'modal-wrap', style: { zIndex: 40 } });
    const inputs = {};
    const done = (v) => { wrap.remove(); resolve(v); };
    const rows = fields.map((f) => {
      const el = f.options
        ? h('select', {}, f.options.map((o) => h('option', { value: o.value, selected: o.value === f.value }, o.label)))
        : h('input', { type: f.type || 'text', value: f.value ?? '', min: f.min, max: f.max, step: f.step });
      inputs[f.name] = el;
      if (f.onInput) el.addEventListener('input', () => f.onInput(inputs));
      return h('div', {}, h('label', {}, f.label), el, f.hint ? h('div', { class: 'small muted', id: 'hint-' + f.name }, f.hint) : null);
    });
    wrap.append(h('div', { class: 'confirm-box frame' }, h('p', {}, text), ...rows,
      h('div', { class: 'row', style: { justifyContent: 'flex-end', marginTop: '10px' } },
        h('button', { class: 'ghost', onclick: () => done(null) }, 'Vazgeç'),
        h('button', { class: 'primary', onclick: () => done(Object.fromEntries(Object.entries(inputs).map(([k, v]) => [k, v.value]))) }, ok))));
    uiRoot.append(wrap);
    fields.forEach((f) => f.onInput?.(inputs));
  });
}

// ---- tooltip (clamped to the viewport)
let tip = null;
export function showTooltip(content, x, y, wide = false) {
  if (!tip) { tip = h('div', { class: 'tooltip frame' }); document.body.append(tip); }
  tip.className = 'tooltip frame' + (wide ? ' wide' : '');
  tip.replaceChildren(content);
  tip.style.display = 'block';
  const r = tip.getBoundingClientRect();
  let left = x + 14, top = y + 14;
  if (left + r.width > window.innerWidth - 4) left = Math.max(4, x - r.width - 14);
  if (top + r.height > window.innerHeight - 4) top = Math.max(4, window.innerHeight - r.height - 4);
  tip.style.left = left + 'px';
  tip.style.top = top + 'px';
}
export function hideTooltip() { if (tip) tip.style.display = 'none'; }
export function withTooltip(el, contentFn, wide = false) {
  el.addEventListener('mouseenter', (e) => showTooltip(contentFn(), e.clientX, e.clientY, wide));
  el.addEventListener('mousemove', (e) => showTooltip(contentFn(), e.clientX, e.clientY, wide));
  el.addEventListener('mouseleave', hideTooltip);
  el.addEventListener('touchstart', (e) => { const t = e.touches[0]; showTooltip(contentFn(), t.clientX, t.clientY, wide); }, { passive: true });
  return el;
}
