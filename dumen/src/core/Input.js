// Dokunmatik öncelikli girdi güvenliği.
// - Eylemler yalnız 'click' ile tetiklenir (pointerdown + click çift sayılmaz).
// - Basılı tutma (SAR) pointer capture + pointerup/cancel/lostpointercapture ile güvenle bırakılır.
// - Sahne değişiminde / sekme gizlenince tüm basılılar serbest bırakılır; kısa tıklama kilidi sızan tıklamaları engeller.
(function (D) {
  'use strict';
  const holds = new Set();
  let blockUntil = 0;
  const Input = {
    keys: new Set(),
    blocked() { return performance.now() < blockUntil; },
    block(ms) { blockUntil = Math.max(blockUntil, performance.now() + (ms == null ? 250 : ms)); },
    releaseAll() { for (const h of [...holds]) h.release(); D.bus.emit('releaseAll'); },
    // Basılı tutma düğmesi: onChange(true/false)
    hold(el, onChange) {
      let pid = null;
      const h = {
        down: false,
        release() { if (h.down) { h.down = false; pid = null; el.classList.remove('on'); onChange(false); } }
      };
      holds.add(h);
      el.addEventListener('pointerdown', (e) => {
        if (h.down || Input.blocked()) return;
        e.preventDefault();
        pid = e.pointerId; h.down = true; el.classList.add('on');
        try { el.setPointerCapture(e.pointerId); } catch (err) { /* yok */ }
        onChange(true);
      });
      const up = (e) => { if (pid === null || e.pointerId === pid) h.release(); };
      el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up);
      el.addEventListener('contextmenu', (e) => e.preventDefault());
      h.dispose = () => { h.release(); holds.delete(h); };
      return h;
    },
    // Yalnız YENİ basışlara tepki veren dokunma alanı (hazine barı). since: dinlemeye başlama zamanı.
    freshTap(el, since, fn) {
      const handler = (e) => { if (e.timeStamp < since || Input.blocked()) return; e.preventDefault(); fn(e); };
      el.addEventListener('pointerdown', handler);
      return () => el.removeEventListener('pointerdown', handler);
    },
    init() {
      document.addEventListener('visibilitychange', () => { if (document.hidden) Input.releaseAll(); });
      window.addEventListener('blur', () => Input.releaseAll());
      window.addEventListener('keydown', (e) => { if (e.repeat) return; Input.keys.add(e.code); D.bus.emit('key', e); });
      window.addEventListener('keyup', (e) => { Input.keys.delete(e.code); D.bus.emit('keyup', e); });
      // Oyun alanında pinch/çift dokunma yakınlaştırmasını engelle (paneller içindeki kaydırma serbest)
      document.addEventListener('gesturestart', (e) => e.preventDefault());
      document.addEventListener('dblclick', (e) => e.preventDefault());
    }
  };
  D.Input = Input;
})(globalThis.DUMEN);
