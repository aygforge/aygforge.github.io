// UIManager: ekranlar, paneller (oyunu duraklatır), bildirimler, onay diyaloğu.
import { h, clear } from './dom.js';
import { bus } from '../core/events.js';
import { sound } from '../audio/sound.js';

export const ui = {
  root: null,
  layers: {},
  openName: null,
  toastBox: null,

  init(root) {
    this.root = root;
    for (const n of ['screen', 'hud', 'panel', 'modal', 'top']) {
      const el = h('div', { id: 'l-' + n, style: { position: 'absolute', inset: '0', pointerEvents: 'none' } });
      root.appendChild(el);
      this.layers[n] = el;
    }
    bus.on('confirm', (o) => this.confirm(o));
    bus.on('closePanels', () => this.closePanel());
  },

  // ---------------------------------------------------------------- paneller
  openPanel(name, build) {
    this.closePanel(true);
    this.openName = name;
    const el = build();
    el.dataset.panel = name;
    this.layers.panel.appendChild(el);
    bus.emit('modal', true);
    bus.emit('panelOpen', name);
    return el;
  },

  closePanel(silent = false) {
    const had = !!this.layers.panel.firstChild;
    clear(this.layers.panel);
    const name = this.openName;
    this.openName = null;
    if (had && !silent) { bus.emit('modal', false); bus.emit('panelClose', name); }
  },

  isOpen() { return !!this.openName || !!this.layers.modal.firstChild; },

  // Panel iskeleti: başlık sekmeleri + gövde
  shell({ tabs = [], active, onTab, title, onClose, cls = '', extra = null }) {
    const tabBar = h('div', { class: 'tabs' });
    const body = h('div', { class: 'pb' });
    const el = h('div', { class: 'panel frame ' + cls },
      h('div', { class: 'ph' },
        title ? h('h3', { class: 't', style: { margin: '0 8px 0 4px' } }, title) : null,
        tabBar,
        extra,
        h('button', { class: 'xbtn', onTap: () => { sound.play('click'); (onClose || (() => this.closePanel()))(); }, 'aria-label': 'Kapat' }, '×')),
      body);
    // Dar ekranda (ör. iPhone yatay + Safari çubukları) sekmeler sığmazsa yalnız simge kalır, seçili sekme yazılı
    // kalır; o da sığmazsa hepsi simge olur. Böylece Ayarlar sekmesi ekran dışına taşmaz.
    const fit = () => {
      if (!tabBar.isConnected) return;
      tabBar.classList.remove('compact', 'tight');
      if (tabBar.scrollWidth > tabBar.clientWidth + 1) tabBar.classList.add('compact');
      if (tabBar.scrollWidth > tabBar.clientWidth + 1) tabBar.classList.add('tight');
      tabBar.querySelector('.tab.on')?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    };
    const renderTabs = (cur) => {
      clear(tabBar);
      for (const t of tabs) {
        tabBar.appendChild(h('button', { class: 'tab' + (t.id === cur ? ' on' : ''), 'data-testid': 'tab-' + t.id, title: t.label, 'aria-label': t.label, onTap: () => { sound.play('click'); renderTabs(t.id); onTab(t.id); } },
          t.icon ? h('img', { src: t.icon, class: 'px' }) : null, t.icon ? h('span', { class: 'lbl' }, t.label) : t.label));
      }
      requestAnimationFrame(fit);
    };
    if (tabs.length) {
      renderTabs(active);
      const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => fit()) : null;
      ro?.observe(tabBar);
    }
    return { el, body, renderTabs };
  },

  // ---------------------------------------------------------------- modal
  modal(content, { onClose, dismiss = true } = {}) {
    const ov = h('div', { class: 'overlay' }, content);
    if (dismiss) ov.addEventListener('pointerdown', (e) => { if (e.target === ov) { this.closeModal(); onClose?.(); } });
    this.layers.modal.appendChild(ov);
    if (!this.openName) bus.emit('modal', true);
    return ov;
  },

  closeModal() {
    const last = this.layers.modal.lastChild;
    if (last) last.remove();
    if (!this.layers.modal.firstChild && !this.openName) bus.emit('modal', false);
  },

  // text: düz metin; body: isteğe bağlı ek içerik (ör. alışveriş özeti)
  confirm({ title, text, body = null, ok = 'Tamam', cancel = 'Vazgeç', onOk, danger = false, okDisabled = false }) {
    const box = h('div', { class: 'dlg frame' },
      title ? h('h3', { class: 't' }, title) : null,
      text ? h('p', {}, text) : null,
      body,
      h('div', { class: 'row', style: { justifyContent: 'flex-end' } },
        h('button', { class: 'btn ghost', 'data-testid': 'dlg-cancel', onTap: () => { sound.play('click'); this.closeModal(); } }, cancel),
        h('button', { class: 'btn ' + (danger ? 'red' : 'green') + (okDisabled ? ' dis' : ''), 'data-testid': 'dlg-ok', onTap: () => { sound.play('click'); this.closeModal(); onOk?.(); } }, ok)));
    this.modal(box);
  },

  alert(title, text) {
    const box = h('div', { class: 'dlg frame' }, h('h3', { class: 't' }, title), h('p', {}, text),
      h('div', { class: 'row', style: { justifyContent: 'flex-end' } }, h('button', { class: 'btn', onTap: () => this.closeModal() }, 'Tamam')));
    this.modal(box);
  },
};
