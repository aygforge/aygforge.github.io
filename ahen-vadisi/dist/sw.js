// Otomatik üretildi — Ahen Vadisi çevrimdışı önbellek (oyun sürümü 2.0.2)
// Güncelleme akışı: sayfa (index.html) her açılışta önce ağdan istenir, böylece yeni sürümün JS'i
// eski önbellekte takılı kalmaz. Yeni işçi "bekleyen" durumda kalır; oyun kaydı yazdıktan sonra
// SKIP_WAITING mesajıyla etkinleşir (oyuncuya "Yeni sürüm hazır" bildirimi gösterilir).
const CACHE = 'ahen-vadisi-29ec64309d';
const ASSETS = ["./","./assets/index-D4TPY2j7.js","./assets/index-DPR7iqy1.css","./assets/phaser-DXXWZowi.js","./icons/icon-192.png","./icons/icon-512-maskable.png","./icons/icon-512.png","./index.html","./manifest.webmanifest","./sprites/hero_mage/atk.png","./sprites/hero_mage/atk2.png","./sprites/hero_mage/cast.png","./sprites/hero_mage/die.png","./sprites/hero_mage/hurt.png","./sprites/hero_mage/idle.png","./sprites/hero_mage/walk.png","./sprites/hero_warrior/LICENSE.txt","./sprites/hero_warrior/atk.png","./sprites/hero_warrior/atk2.png","./sprites/hero_warrior/cast.png","./sprites/hero_warrior/die.png","./sprites/hero_warrior/hurt.png","./sprites/hero_warrior/idle.png","./sprites/hero_warrior/walk.png","./sprites/mon_cave_bat/atk.png","./sprites/mon_cave_bat/die.png","./sprites/mon_cave_bat/hurt.png","./sprites/mon_cave_bat/idle.png","./sprites/mon_cave_bat/walk.png","./sprites/mon_crimson_scorpion/atk.png","./sprites/mon_crimson_scorpion/die.png","./sprites/mon_crimson_scorpion/hurt.png","./sprites/mon_crimson_scorpion/idle.png","./sprites/mon_crimson_scorpion/walk.png","./sprites/mon_forest_raider/LICENSE.txt","./sprites/mon_forest_raider/atk.png","./sprites/mon_forest_raider/die.png","./sprites/mon_forest_raider/hurt.png","./sprites/mon_forest_raider/idle.png","./sprites/mon_forest_raider/walk.png","./sprites/mon_meadow_rat/atk.png","./sprites/mon_meadow_rat/die.png","./sprites/mon_meadow_rat/hurt.png","./sprites/mon_meadow_rat/idle.png","./sprites/mon_meadow_rat/walk.png","./sprites/mon_ore_priest/LICENSE.txt","./sprites/mon_ore_priest/atk.png","./sprites/mon_ore_priest/atk2.png","./sprites/mon_ore_priest/die.png","./sprites/mon_ore_priest/hurt.png","./sprites/mon_ore_priest/idle.png","./sprites/mon_ore_priest/walk.png","./sprites/mon_pick_goblin/atk.png","./sprites/mon_pick_goblin/die.png","./sprites/mon_pick_goblin/hurt.png","./sprites/mon_pick_goblin/idle.png","./sprites/mon_pick_goblin/walk.png","./sprites/mon_red_vein_watcher/atk.png","./sprites/mon_red_vein_watcher/die.png","./sprites/mon_red_vein_watcher/hurt.png","./sprites/mon_red_vein_watcher/idle.png","./sprites/mon_red_vein_watcher/walk.png","./sprites/mon_rotten_guard/atk.png","./sprites/mon_rotten_guard/die.png","./sprites/mon_rotten_guard/hurt.png","./sprites/mon_rotten_guard/idle.png","./sprites/mon_rotten_guard/walk.png","./sprites/mon_swamp_leech/atk.png","./sprites/mon_swamp_leech/die.png","./sprites/mon_swamp_leech/hurt.png","./sprites/mon_swamp_leech/idle.png","./sprites/mon_swamp_leech/walk.png","./sprites/mon_thorn_rootling/atk.png","./sprites/mon_thorn_rootling/die.png","./sprites/mon_thorn_rootling/hurt.png","./sprites/mon_thorn_rootling/idle.png","./sprites/mon_thorn_rootling/walk.png"];
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
