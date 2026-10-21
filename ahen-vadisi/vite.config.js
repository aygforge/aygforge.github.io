import { defineConfig } from 'vite';
import { readdirSync, statSync, writeFileSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';

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
      const sw = `// Otomatik üretildi — Ahen Vadisi çevrimdışı önbellek
const CACHE = 'ahen-vadisi-${version}';
const ASSETS = ${JSON.stringify(['./', ...files], null, 0)};
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
  plugins: [serviceWorkerPlugin()],
  server: { host: true },
});
