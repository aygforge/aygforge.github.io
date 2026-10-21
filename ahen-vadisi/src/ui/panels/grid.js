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

export function gridView(container, { cols = 6, cell = 46, onTap, filter = null } = {}) {
  const g = h('div', { class: 'grid', style: { '--cols': cols, '--cell': cell + 'px' } });
  g.style.setProperty('--cols', cols);
  g.style.setProperty('--cell', cell + 'px');
  for (let i = 0; i < container.size; i++) {
    const it = container.slots[i];
    const dim = filter && it && !filter(it);
    const c = itemCell(it, { onTap: it && !dim ? () => onTap?.(it, i) : null });
    if (dim) c.style.opacity = 0.3;
    g.appendChild(c);
  }
  return g;
}

export function cellSize() {
  const H = window.innerHeight, W = window.innerWidth;
  return Math.max(40, Math.min(54, Math.floor(Math.min(H / 8.2, W / 17))));
}
