// GDD Bölüm 5: gemi seviyeleri.
export const SHIPS = [
  { level: 1, id: 'SHIP_RUSTY_GULL', name: 'Paslı Martı', cargo: 4, items: 3, crew: 1, hull: 100, desc: 'Yamalı yelkenli, küçük bir balıkçı teknesi. Her dalgada gıcırdar ama yüzer.' },
  { level: 2, id: 'SHIP_DOUBLE_SAIL', name: 'Çift Yelkenli', cargo: 6, items: 4, crew: 2, hull: 150, desc: 'İki direkli, çevik bir kıyı gemisi. İlk gerçek tüccar teknen.' },
  { level: 3, id: 'SHIP_BRIG', name: 'Brig', cargo: 9, items: 5, crew: 3, hull: 220, desc: 'Sağlam omurgalı, geniş ambarlı bir brig. Açık denizlere hazır.' },
  { level: 4, id: 'SHIP_FRIGATE', name: 'Firkateyn', cargo: 13, items: 6, crew: 4, hull: 320, desc: 'Hızlı ve silahlı bir firkateyn. Korsanlar iki kez düşünür.' },
  { level: 5, id: 'SHIP_GALLEON', name: 'Ticaret Galeonu', cargo: 18, items: 7, crew: 5, hull: 450, desc: 'Denizlerin yüzen sarayı. Ambarı bir kasaba kadar mal taşır.' },
];
export const SHIP_BY_LEVEL = Object.fromEntries(SHIPS.map((s) => [s.level, s]));
export const MAX_ITEM_SLOTS = 7;
