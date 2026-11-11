// Derlenmiş oyunun (vite build → dist/) basit, güvenli statik sunucusu. Yalnız GET/HEAD; klasör dışına çıkılamaz.
import { existsSync, statSync, createReadStream } from 'node:fs';
import { join, normalize, extname, sep } from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.m4a': 'audio/mp4',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.txt': 'text/plain; charset=utf-8',
};

export function staticSite(root) {
  const base = normalize(root.endsWith(sep) ? root : root + sep);
  const ready = existsSync(join(base, 'index.html'));
  function resolve(urlPath) {
    let p;
    try { p = decodeURIComponent(urlPath); } catch { return null; }
    if (p.includes('\0')) return null;
    if (p.endsWith('/')) p += 'index.html';
    const full = normalize(join(base, p));
    if (!full.startsWith(base)) return null;
    try { return statSync(full).isFile() ? full : null; } catch { return null; }
  }
  function serve(req, res) {
    if (!ready || (req.method !== 'GET' && req.method !== 'HEAD')) return false;
    const urlPath = (req.url || '/').split('?')[0];
    const file = resolve(urlPath);
    if (!file) return false;
    const ext = extname(file).toLowerCase();
    // Vite'ın içerik özetli dosyaları (assets/*-HASH.js) değişmez; sayfa, servis işçisi ve ayarlar her seferinde denetlenir
    const immutable = urlPath.startsWith('/assets/') && /-[\w-]{8,}\.\w+$/.test(urlPath);
    res.writeHead(200, {
      'content-type': TYPES[ext] || 'application/octet-stream',
      'content-length': statSync(file).size,
      'cache-control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
      'x-content-type-options': 'nosniff',
    });
    if (req.method === 'HEAD') { res.end(); return true; }
    createReadStream(file).on('error', () => res.destroy()).pipe(res);
    return true;
  }
  return { ready, root: base, serve };
}
