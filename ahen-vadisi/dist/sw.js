// Otomatik üretildi — Ahen Vadisi çevrimdışı önbellek
const CACHE = 'ahen-vadisi-a055bcd732';
const ASSETS = ["./","./assets/index-B84T2rYs.js","./assets/index-DYUBYIcq.css","./assets/phaser-DXXWZowi.js","./icons/icon-192.png","./icons/icon-512-maskable.png","./icons/icon-512.png","./index.html","./manifest.webmanifest","./sprites/hero_mage/atk.png","./sprites/hero_mage/atk2.png","./sprites/hero_mage/cast.png","./sprites/hero_mage/die.png","./sprites/hero_mage/hurt.png","./sprites/hero_mage/idle.png","./sprites/hero_mage/walk.png","./sprites/hero_warrior/LICENSE.txt","./sprites/hero_warrior/atk.png","./sprites/hero_warrior/atk2.png","./sprites/hero_warrior/cast.png","./sprites/hero_warrior/die.png","./sprites/hero_warrior/hurt.png","./sprites/hero_warrior/idle.png","./sprites/hero_warrior/walk.png","./sprites/mon_ore_priest/LICENSE.txt","./sprites/mon_ore_priest/atk.png","./sprites/mon_ore_priest/atk2.png","./sprites/mon_ore_priest/die.png","./sprites/mon_ore_priest/hurt.png","./sprites/mon_ore_priest/idle.png","./sprites/mon_ore_priest/walk.png"];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('ahen-vadisi-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request).then((res) => {
    if (res.ok && new URL(e.request.url).origin === location.origin) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match('./index.html'))));
});
