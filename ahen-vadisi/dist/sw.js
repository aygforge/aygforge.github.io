// Otomatik üretildi — Ahen Vadisi çevrimdışı önbellek (oyun sürümü 2.0.0)
// Güncelleme akışı: sayfa (index.html) her açılışta önce ağdan istenir, böylece yeni sürümün JS'i
// eski önbellekte takılı kalmaz. Yeni işçi "bekleyen" durumda kalır; oyun kaydı yazdıktan sonra
// SKIP_WAITING mesajıyla etkinleşir (oyuncuya "Yeni sürüm hazır" bildirimi gösterilir).
const CACHE = 'ahen-vadisi-b5822f587b';
const ASSETS = ["./","./assets/index-D-XoMHkG.css","./assets/index-Dr48yTmL.js","./assets/phaser-DXXWZowi.js","./icons/icon-192.png","./icons/icon-512-maskable.png","./icons/icon-512.png","./index.html","./manifest.webmanifest","./sprites/hero_mage/atk.png","./sprites/hero_mage/atk2.png","./sprites/hero_mage/cast.png","./sprites/hero_mage/die.png","./sprites/hero_mage/hurt.png","./sprites/hero_mage/idle.png","./sprites/hero_mage/walk.png","./sprites/hero_warrior/LICENSE.txt","./sprites/hero_warrior/atk.png","./sprites/hero_warrior/atk2.png","./sprites/hero_warrior/cast.png","./sprites/hero_warrior/die.png","./sprites/hero_warrior/hurt.png","./sprites/hero_warrior/idle.png","./sprites/hero_warrior/walk.png","./sprites/mon_ore_priest/LICENSE.txt","./sprites/mon_ore_priest/atk.png","./sprites/mon_ore_priest/atk2.png","./sprites/mon_ore_priest/die.png","./sprites/mon_ore_priest/hurt.png","./sprites/mon_ore_priest/idle.png","./sprites/mon_ore_priest/walk.png"];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});
self.addEventListener('message', (e) => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('ahen-vadisi-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
const put = (req, res) => { if (res.ok && new URL(req.url).origin === location.origin) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; };
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((res) => put(req, res)).catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('./index.html')).then((r) => r || caches.match('./'))));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((r) => r || fetch(req).then((res) => put(req, res))));
});
