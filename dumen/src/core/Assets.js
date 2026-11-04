// Yerel görsel varlıklar (harici URL yok). Yüklenemezse oyun prosedürel çizime geri düşer.
(function (D) {
  'use strict';
  const LIST = { town: 'assets/town_main.webp', street: 'assets/street_main.webp', map: 'assets/world_map.webp' };
  // Kullanıcının çizdiği karakterler (kırpılmış, şeffaf WebP)
  for (const id of ['rustem', 'hasan', 'zip', 'kaya', 'kropi', 'factory', 'market', 'baskan', 'tekir', 'marti']) LIST['char_' + id] = 'assets/chars/' + id + '.webp';
  // Kullanıcının çizdiği iç mekân arka planları
  for (const id of ['home', 'belediye', 'factory', 'hasan', 'zip', 'market', 'rustem', 'boatyard', 'komplo']) LIST['bg_' + id] = 'assets/bg/' + id + '.webp';
  // Kullanıcının çizdiği balıkçılık bölgesi arka planları (1920×1072) ve çerçeveli su altı panelleri (1100 genişlik, şeffaf kenar)
  for (const code of ['EL', 'TS', 'PSK', 'YK', 'TB', 'BKM', 'KKD', 'BG']) { LIST['region_' + code] = 'assets/regions/' + code + '.webp'; LIST['panel_' + code] = 'assets/panels/' + code + '.webp'; }
  // Bölgeye göre kayık (aynalanmış, boyalı olta üstü silinmiş; olta oyunda çizilir) ve HUD görselleri
  for (const code of ['EL', 'TS', 'PSK', 'YK', 'TB', 'BKM', 'KKD', 'BG']) LIST['boat_' + code] = 'assets/boats/' + code + '.webp';
  for (const id of ['bar', 'miyav', 'scrap', 'coin', 'bag']) LIST['hud_' + id] = 'assets/hud/' + id + '.webp';
  // Çöp ikonları, SAR makarası kareleri (sarma F1–F6, bırakma RB1–RB5), ÇEK düğmesi, kasabadaki kayık
  for (const id of ['T_BOLT', 'T_GEAR', 'T_BELL', 'T_CABLE', 'T_LID', 'T_MOTOR', 'T_BAG', 'T_SOCK', 'T_BOTTLE']) LIST['trash_' + id] = 'assets/trash/' + id + '.webp';
  for (const f of ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'RB1', 'RB2', 'RB3', 'RB4', 'RB5']) LIST['reel_' + f] = 'assets/ui/reel_' + f + '.webp';
  LIST.btn_cek = 'assets/ui/cek.webp'; LIST.bubble = 'assets/ui/bubble.webp'; LIST.town_boat = 'assets/town_boat.webp';
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
