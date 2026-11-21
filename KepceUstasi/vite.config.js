import { defineConfig } from 'vite';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// Emits dist/sw.js: a tiny offline service worker that precaches every built file + public asset.
function offlineServiceWorker() {
  return {
    name: 'kepce-offline-sw',
    apply: 'build',
    generateBundle(_opts, bundle) {
      const files = new Set(['./', './index.html']);
      for (const f of Object.keys(bundle)) files.add('./' + f);
      const pub = join(process.cwd(), 'public');
      const walk = (d) => {
        for (const f of readdirSync(d)) {
          const p = join(d, f);
          if (statSync(p).isDirectory()) walk(p);
          else files.add('./' + relative(pub, p).split('\\').join('/'));
        }
      };
      walk(pub);
      const version = Date.now().toString(36);
      const list = JSON.stringify([...files].sort(), null, 1);
      const source = `// Kepçe Ustası offline cache (auto-generated)
const CACHE = 'kepce-ustasi-${version}';
const FILES = ${list};
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true, ignoreVary: true }).then((r) => r || fetch(e.request)));
});
`;
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 2000,
    rollupOptions: { output: { manualChunks: { phaser: ['phaser'], matter: ['matter-js'] } } },
  },
  server: { host: true },
  plugins: [offlineServiceWorker()],
});
