// ui/Overlays.js — secondary overlays only (pause, skill choice, chapter intro, confirm dialogs, toasts).
// Main scenes are never overlays. The active scene installs a handler for its overlay actions; generic
// actions (confirm / cancel / settings toggles) are handled here. Overlay taps are debounced.
import { Save } from '../core/SaveManager.js';
import { Audio } from '../core/AudioManager.js';
import { Haptic } from '../platform/Haptics.js';
import { T } from '../core/i18n.js';

export const Overlays = (() => {
  let modal, toasts, kind = null, confirmCb = null, cancelCb = null, handler = null, lockT = 0;
  function init(modalEl, toastEl) { modal = modalEl; toasts = toastEl; modal.addEventListener('click', onClick); }
  function open(html, k, cls = '') { modal.innerHTML = `<div class="mbox ${cls}">${html}</div>`; modal.classList.add('open'); kind = k; }
  function close() { modal.classList.remove('open'); modal.innerHTML = ''; kind = null; confirmCb = null; cancelCb = null; }
  function confirm(text, yes, cb, { onCancel = null, danger = true, sub = '' } = {}) {
    open(`<h2 style="font-size:17px">${text}</h2>${sub ? `<div class="sub">${sub}</div>` : ''}<div class="row" style="margin-top:10px"><button class="btn alt" style="flex:1" data-a="cancel">${T('s_cancel')}</button><button class="btn ${danger ? 'red' : 'mint'}" style="flex:1" data-a="confirm">${yes}</button></div>`, 'confirm');
    confirmCb = cb; cancelCb = onCancel;
  }
  function toast(text) { while (toasts.children.length >= 3) toasts.firstChild.remove(); const t = document.createElement('div'); t.className = 'toast'; t.textContent = text; toasts.appendChild(t); setTimeout(() => t.remove(), 3200); }
  function toggleSetting(k, btn) {
    const s = Save.data; s.settings[k] = !s.settings[k]; Save.write(); Audio.apply();
    if (k === 'vibe' && s.settings.vibe) Haptic.buzz(30);
    if (btn) btn.classList.toggle('on', s.settings[k]);
    return s.settings[k];
  }
  function onClick(e) {
    const b = e.target.closest('[data-a]'); if (!b || b.disabled) return;
    const now = performance.now(); if (now - lockT < 250) return; lockT = now;
    Audio.init(); Audio.play('click');
    const a = b.dataset.a;
    if (a === 'confirm') { const cb = confirmCb; close(); if (cb) cb(); return; }
    if (a === 'cancel') { const cb = cancelCb; close(); if (cb) cb(); return; }
    if (a === 'tog') { toggleSetting(b.dataset.k, b); return; }
    if (handler) handler(a, b);
  }
  /** Pressing back while an overlay is open. Returns true if consumed. */
  function back() {
    if (!kind) return false;
    if (kind === 'confirm') { const cb = cancelCb; close(); if (cb) cb(); return true; }
    if (handler) return handler('__back', null) !== false;
    return true;
  }
  return { init, open, close, confirm, toast, toggleSetting, back, setHandler(h) { handler = h; }, get kind() { return kind; } };
})();
