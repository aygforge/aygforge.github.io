// Çanta / depo ızgarası bileşeni
import { h, img } from '../dom.js';
import { iconURL } from '../../art/icons.js';
import { ITEMS } from '../../data/items.js';

export function itemCell(it, { onTap, sel = false, eq = false, slotLabel = '' } = {}) {
  const cell = h('div', { class: 'cell ia' + (eq ? ' eq' : '') + (it && it.q === undefined ? ' r-' + it.r : '') + (sel ? ' sel' : ''), onTap: onTap || null });
  if (!it) {
    if (slotLabel) cell.appendChild(h('div', { class: 'sl' }, slotLabel));
    return cell;
  }
  cell.appendChild(img(iconURL(it.tid)));
  if (it.q !== undefined) cell.appendChild(h('span', { class: 'q' }, it.q));
  else {
    if (it.p) cell.appendChild(h('span', { class: 'pl' }, '+' + it.p));
    if (it.lock) cell.appendChild(h('span', { class: 'lk', style: { backgroundImage: `url(${iconURL('ui:star')})` } }));
    const t = ITEMS[it.tid];
    if (t.slot !== 'ring' && t.slot !== 'amulet' && it.d < 100) {
      cell.appendChild(h('div', { class: 'dur' }, h('i', { style: { width: it.d + '%', background: it.d < 20 ? '#e44' : '#6c6' } })));
    }
  }
  return cell;
}

export function gridView(container, { cols = 6, cell = 46, onTap, filter = null, onMove = null } = {}) {
  const g = h('div', { class: 'grid', style: { '--cols': cols, '--cell': cell + 'px' } });
  g.style.setProperty('--cols', cols);
  g.style.setProperty('--cell', cell + 'px');
  const drag = onMove ? dragSupport(g, onMove) : null;
  for (let i = 0; i < container.size; i++) {
    const it = container.slots[i];
    const dim = filter && it && !filter(it);
    // sürükleme bitince aynı parmak kaldırması eşya kartını açmasın
    const c = itemCell(it, { onTap: it && !dim ? () => { if (!drag?.busy()) onTap?.(it, i); } : null });
    if (dim) c.style.opacity = 0.3;
    if (drag && it && !dim) drag.source(c, i);
    g.appendChild(c);
  }
  return g;
}

// Sürükle-bırak: dokunmatikte kısa basılı tutunca (fare ile hafif sürükleyince) eşya ele alınır ve başka yuvaya bırakılır.
// Basılı tutmadan kaydırma, listenin kaydırılması olarak kalır.
const HOLD_MS = 230;
function dragSupport(grid, onMove) {
  let st = null;
  const cells = () => [...grid.children];
  const targetAt = (x, y) => {
    const el = document.elementFromPoint(x, y)?.closest?.('.cell');
    return el && el.parentNode === grid ? cells().indexOf(el) : -1;
  };
  const mark = (k) => {
    if (st.over === k) return;
    if (st.over >= 0) cells()[st.over]?.classList.remove('drop');
    st.over = k;
    if (k >= 0 && k !== st.i) cells()[k].classList.add('drop');
  };
  const begin = () => {
    const src = cells()[st.i];
    const r = src.getBoundingClientRect();
    const ghost = src.cloneNode(true);
    ghost.className += ' drag-ghost';
    Object.assign(ghost.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
    document.body.appendChild(ghost);
    st.ghost = ghost; st.ox = st.x - r.left; st.oy = st.y - r.top;
    src.classList.add('drag-src');
    try { navigator.vibrate?.(12); } catch { /* titreşim desteklenmeyebilir */ }
  };
  const end = () => {
    if (!st) return;
    clearTimeout(st.timer);
    st.ghost?.remove();
    cells()[st.i]?.classList.remove('drag-src');
    if (st.over >= 0) cells()[st.over]?.classList.remove('drop');
    document.removeEventListener('pointermove', move);
    document.removeEventListener('pointerup', up);
    document.removeEventListener('pointercancel', end);
    // aynı olay zincirindeki tap işleyicisi sürüklemeyi görsün diye durum bir sonraki karede temizlenir
    const done = st; done.finished = true;
    requestAnimationFrame(() => { if (st === done) st = null; });
  };
  function move(e) {
    if (!st || st.finished || e.pointerId !== st.pid) return;
    if (!st.ghost) {
      const d = Math.hypot(e.clientX - st.x, e.clientY - st.y);
      if (e.pointerType === 'mouse' && d > 6) { clearTimeout(st.timer); begin(); } else if (d > 10) { end(); return; } else return;
    }
    e.preventDefault();
    st.ghost.style.left = e.clientX - st.ox + 'px';
    st.ghost.style.top = e.clientY - st.oy + 'px';
    mark(targetAt(e.clientX, e.clientY));
  }
  function up(e) {
    if (!st || st.finished || e.pointerId !== st.pid) return;
    if (st.ghost) {
      const k = targetAt(e.clientX, e.clientY);
      const from = st.i;
      end();
      if (k >= 0 && k !== from) onMove(from, k);
      return;
    }
    end();
  }
  // sürüklerken sayfa/liste kaydırılmasın (dinleyici baştan pasif olmayan olarak kayıtlı olmalı)
  grid.addEventListener('touchmove', (e) => { if (st?.ghost && !st.finished) e.preventDefault(); }, { passive: false });
  return {
    busy: () => !!st?.ghost,
    source(cell, i) {
      cell.addEventListener('pointerdown', (e) => {
        if (st && !st.finished) return;
        if (e.button > 0) return;
        st = { i, pid: e.pointerId, x: e.clientX, y: e.clientY, over: -1, ghost: null };
        if (e.pointerType !== 'mouse') st.timer = setTimeout(() => { if (st && !st.ghost && !st.finished) begin(); }, HOLD_MS);
        document.addEventListener('pointermove', move, { passive: false });
        document.addEventListener('pointerup', up);
        document.addEventListener('pointercancel', end);
      });
    },
  };
}

export function cellSize() {
  const H = window.innerHeight, W = window.innerWidth;
  return Math.max(40, Math.min(54, Math.floor(Math.min(H / 8.2, W / 17))));
}
