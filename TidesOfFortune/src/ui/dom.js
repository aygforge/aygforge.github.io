// Küçük DOM yardımcıları: element oluşturma, dokunma (çift tetiklemeye karşı korumalı), uzun basma.

export function h(tag, attrs = {}, ...children) {
  const [name, ...classes] = tag.split('.');
  const el = document.createElement(name || 'div');
  if (classes.length) el.className = classes.join(' ');
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className += (el.className ? ' ' : '') + v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'onTap') tap(el, v);
    else if (k === 'onLong') longPress(el, v);
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('data-')) el.setAttribute(k, v);
    else if (k in el && typeof v !== 'string') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  appendAll(el, children);
  return el;
}

function appendAll(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

export function icon(name, cls = '') {
  return h(`i.ic.ic-${name}${cls ? '.' + cls : ''}`, { 'aria-hidden': 'true' });
}

let lastTapAt = 0;
let lastTapEl = null;
export let tapSound = null;
export function setTapSound(fn) {
  tapSound = fn;
}

/** Dokunma: click olayı + aynı öğeye 280ms içinde ikinci tetiklemeyi engeller. */
export function tap(el, fn) {
  el.addEventListener('click', (e) => {
    const now = performance.now();
    if (el === lastTapEl && now - lastTapAt < 280) return;
    if (el.dataset.longFired === '1') {
      el.dataset.longFired = '0';
      return;
    }
    if (el.disabled || el.classList.contains('disabled-hard')) return;
    lastTapAt = now;
    lastTapEl = el;
    e.stopPropagation();
    if (tapSound && !el.classList.contains('silent')) tapSound();
    fn(e);
  });
}

/** Uzun basma: ayrıntı açmak için (normal dokunmayla da erişilebilir tutulur). */
export function longPress(el, fn, ms = 480) {
  let timer = null;
  let sx = 0, sy = 0;
  el.addEventListener('pointerdown', (e) => {
    sx = e.clientX; sy = e.clientY;
    timer = setTimeout(() => {
      el.dataset.longFired = '1';
      fn(e);
    }, ms);
  });
  const cancel = () => clearTimeout(timer);
  el.addEventListener('pointerup', cancel);
  el.addEventListener('pointercancel', cancel);
  el.addEventListener('pointerleave', cancel);
  el.addEventListener('pointermove', (e) => {
    if (Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) > 12) cancel();
  });
  el.addEventListener('contextmenu', (e) => e.preventDefault());
}

export function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
  return el;
}

export function fmt(n) {
  return Math.round(n).toLocaleString('tr-TR');
}
