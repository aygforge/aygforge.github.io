#!/usr/bin/env node
// Minimal static HTTP server for dist/ (npm run dev builds first). Usage: node tools/devserver.mjs [port] [dir]
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = +(process.argv[2] || 8000); const dir = path.resolve(ROOT, process.argv[3] || 'dist');
if (!process.argv[3]) execFileSync(process.execPath, [path.join(ROOT, 'tools/build.mjs'), '--skip-assets'], { stdio: 'inherit' });
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
    const f = path.join(dir, p); if (!f.startsWith(dir)) throw new Error('forbidden');
    await stat(f); res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); res.end(await readFile(f));
  } catch { res.writeHead(404); res.end('not found'); }
}).listen(port, () => console.log(`Kayıp Ufuk: http://localhost:${port}/`));
