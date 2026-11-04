// Yerel görsel varlıklar (harici URL yok). Yüklenemezse oyun prosedürel çizime geri düşer.
(function (D) {
  'use strict';
  const LIST = { town: 'assets/town_main.webp' };
  const Assets = {
    imgs: {},
    get(k) { return Assets.imgs[k] || null; },
    load() {
      if (typeof Image === 'undefined') return Promise.resolve();
      return Promise.all(Object.entries(LIST).map(([k, src]) => new Promise((res) => {
        const im = new Image();
        im.onload = () => { Assets.imgs[k] = im; res(); };
        im.onerror = () => { console.warn('Görsel yüklenemedi:', src); res(); };
        im.src = src;
      })));
    }
  };
  D.Assets = Assets;
})(globalThis.DUMEN);
