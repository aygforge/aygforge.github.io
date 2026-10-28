// tiny static server for the renderer
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2' };
export function serve(root, port = 0) {
  return new Promise(res => {
    const srv = http.createServer((q, r) => {
      const p = path.join(root, decodeURIComponent(q.url.split('?')[0]));
      fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); r.end(d); });
    }).listen(port, '127.0.0.1', () => res(srv));
  });
}
