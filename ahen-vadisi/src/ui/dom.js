// Küçük DOM yardımcıları
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') {
      const ev = k.slice(2).toLowerCase();
      if (ev === 'tap') tap(el, v);
      else el.addEventListener(ev, v);
    } else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

// Dokunmatik uyumlu tıklama (gecikmesiz, kaydırmayla karışmaz)
export function tap(el, fn) {
  let sx = 0, sy = 0, id = null, moved = false;
  el.addEventListener('pointerdown', (e) => { id = e.pointerId; sx = e.clientX; sy = e.clientY; moved = false; });
  el.addEventListener('pointermove', (e) => { if (e.pointerId === id && Math.hypot(e.clientX - sx, e.clientY - sy) > 12) moved = true; });
  el.addEventListener('pointerup', (e) => {
    if (e.pointerId !== id) return;
    id = null;
    if (!moved) { e.preventDefault(); fn(e); }
  });
  el.addEventListener('pointercancel', () => { id = null; });
}

export function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }

export function img(src, cls = 'px') { return h('img', { src, class: cls, draggable: 'false', alt: '' }); }

export function fmt(n) { return Math.round(n).toLocaleString('tr-TR'); }
export function pct(v, d = 1) { return `%${(v * 100).toFixed(d).replace('.', ',')}`; }
