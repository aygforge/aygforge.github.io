// node preview.mjs out_dir t1 t2 ...  -> PNG stills
import { createRequire } from 'node:module'; const { chromium } = createRequire(import.meta.url)('playwright'); import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const [out, ...ts] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const srv = await serve(path.join(here, 'src'));
const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
pg.on('console', m => console.log('console:', m.text())); pg.on('pageerror', e => console.log('ERR', e.message));
await pg.goto(`http://127.0.0.1:${srv.address().port}/index.html`); await pg.evaluate(() => window.ready);
for (const t of ts) {
  const t0 = Date.now();
  const data = await pg.evaluate(t => { renderFrame(+t); return document.getElementById('c').toDataURL('image/jpeg', 0.9); }, t);
  fs.writeFileSync(path.join(out, `f_${String(t).padStart(5, '0')}.jpg`), Buffer.from(data.split(',')[1], 'base64'));
  console.log(t, Date.now() - t0, 'ms');
}
await b.close(); srv.close();
