import { defineConfig } from 'vite';
import { readdirSync, statSync, writeFileSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';

const pkgVersion = () => JSON.parse(readFileSync('package.json', 'utf8')).version;

// Derleme sonrası çevrimdışı oynanış için servis işçisi üretir: tüm dist dosyaları önbelleğe alınır.
function serviceWorkerPlugin() {
  let outDir = 'dist';
  return {
    name: 'ahen-sw',
    apply: 'build',
    configResolved(c) { outDir = c.build.outDir; },
    closeBundle() {
      const files = [];
      const walk = (d) => {
        for (const f of readdirSync(d)) {
          const p = join(d, f);
          if (statSync(p).isDirectory()) walk(p);
          else if (!f.endsWith('.map') && f !== 'sw.js') files.push('./' + relative(outDir, p).split('\\').join('/'));
        }
      };
      walk(outDir);
      const hash = createHash('sha1');
      for (const f of files) hash.update(readFileSync(join(outDir, f)));
      const version = hash.digest('hex').slice(0, 10);
      const sw = `// Otomatik üretildi — Ahen Vadisi çevrimdışı önbellek (oyun sürümü ${pkgVersion()})
// Güncelleme akışı: sayfa (index.html) her açılışta önce ağdan istenir, böylece yeni sürümün JS'i
// eski önbellekte takılı kalmaz. Yeni işçi "bekleyen" durumda kalır; oyun kaydı yazdıktan sonra
// SKIP_WAITING mesajıyla etkinleşir (oyuncuya "Yeni sürüm hazır" bildirimi gösterilir).
const CACHE = 'ahen-vadisi-${version}';
const ASSETS = ${JSON.stringify(['./', ...files], null, 0)};
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
  // başka kökene (ör. çevrimiçi test sunucusu) giden istekler önbelleğe hiç girmez: doğrudan ağ
  if (new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((res) => put(req, res)).catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('./index.html')).then((r) => r || caches.match('./'))));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((r) => r || fetch(req).then((res) => put(req, res))));
});
`;
      writeFileSync(join(outDir, 'sw.js'), sw);
      console.log(`[ahen-sw] ${files.length} dosya önbelleğe alınacak (sürüm ${version})`);
    },
  };
}

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    target: 'es2020',
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      input: 'index.html',
      output: { manualChunks: { phaser: ['phaser'] } },
    },
  },
  define: { __GAME_VERSION__: JSON.stringify(pkgVersion()) },
  plugins: [serviceWorkerPlugin()],
  server: { host: true },
});
