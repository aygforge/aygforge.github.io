// Renders the animation to silent H.264 chunks in parallel, then concatenates.
// usage: node render.mjs <out.mp4> [workers=4] [fps=30]
import { createRequire } from 'node:module'; import { spawn } from 'node:child_process';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const out = process.argv[2], workers = +(process.argv[3] || 4), fps = +(process.argv[4] || 30);
const srv = await serve(path.join(here, 'src'));
const url = `http://127.0.0.1:${srv.address().port}/index.html`;
const browser = await chromium.launch();
const probe = await browser.newPage(); await probe.goto(url); await probe.evaluate(() => window.ready);
const end = await probe.evaluate(() => END); await probe.close();
const total = Math.ceil(end * fps);
const tmp = fs.mkdtempSync(path.join(path.dirname(out), '.chunks-'));
async function work(w) {
  const a = Math.floor(total * w / workers), b = Math.floor(total * (w + 1) / workers);
  const pg = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto(url); await pg.evaluate(() => window.ready);
  const file = path.join(tmp, `c${w}.mp4`);
  const ff = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(fps), '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-maxrate', '11M', '-bufsize', '22M', '-pix_fmt', 'yuv420p', '-r', String(fps), file], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = a; f < b; f++) {
    const data = await pg.evaluate(t => { renderFrame(t); return document.getElementById('c').toDataURL('image/jpeg', 0.96); }, f / fps);
    if (!ff.stdin.write(Buffer.from(data.slice(data.indexOf(',') + 1), 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if ((f - a) % 120 === 0) console.log(`worker ${w}: ${f - a}/${b - a}`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await pg.close();
  return file;
}
const files = await Promise.all([...Array(workers).keys()].map(work));
fs.writeFileSync(path.join(tmp, 'list.txt'), files.map(f => `file '${f}'`).join('\n'));
await new Promise(r => spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'), '-c', 'copy', out], { stdio: 'inherit' }).on('close', r));
fs.rmSync(tmp, { recursive: true });
await browser.close(); srv.close();
console.log('frames', total, '->', out);
