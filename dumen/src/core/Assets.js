// Yerel görsel varlıklar (harici URL yok). Yüklenemezse oyun prosedürel çizime geri düşer.
(function (D) {
  'use strict';
  const LIST = { town: 'assets/town_main.webp', street: 'assets/street_main.webp', map: 'assets/world_map.webp' };
  // Kullanıcının çizdiği karakterler (kırpılmış, şeffaf WebP)
  for (const id of ['rustem', 'hasan', 'zip', 'kaya', 'kropi', 'factory', 'market', 'baskan', 'tekir']) LIST['char_' + id] = 'assets/chars/' + id + '.webp';
  // Kullanıcının çizdiği iç mekân arka planları
  for (const id of ['home', 'belediye', 'factory', 'hasan', 'zip', 'market', 'rustem', 'boatyard', 'komplo']) LIST['bg_' + id] = 'assets/bg/' + id + '.webp';
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
