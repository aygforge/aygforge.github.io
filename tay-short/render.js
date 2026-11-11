// Renders the canvas animation frame-by-frame with headless Chromium and pipes JPEG frames to ffmpeg.
// usage: node render.js <startFrame> <endFrame> <out.mp4>      (video segment)
//        node render.js still <seconds,seconds,...> <outDir>   (preview stills)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.woff': 'font/woff' };
// tiny static server (file:// images would taint the canvas)
const server = http.createServer((req, res) => { const f = path.join(__dirname, decodeURIComponent(req.url.split('?')[0])); if (!f.startsWith(__dirname) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); });

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => { console.error('PAGE ERROR', e.message); });
  await page.goto(`http://127.0.0.1:${server.address().port}/src/index.html`);
  await page.evaluate(() => window.ready);
  const grab = async (t, q) => Buffer.from((await page.evaluate(([t, q]) => { render(t); return document.getElementById('c').toDataURL('image/jpeg', q).split(',')[1]; }, [t, q])), 'base64');

  if (process.argv[2] === 'still') {
    const outDir = process.argv[4]; fs.mkdirSync(outDir, { recursive: true });
    for (const s of process.argv[3].split(',')) fs.writeFileSync(path.join(outDir, `t${(+s).toFixed(2).padStart(6, '0')}.jpg`), await grab(+s, 0.8));
  } else {
    const [a, b, out] = [+process.argv[2], +process.argv[3], process.argv[4]];
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', '30', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '15', '-pix_fmt', 'yuv420p', '-r', '30', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let f = a; f < b; f++) {
      const buf = await grab(f / 30, 0.95);
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if ((f - a) % 150 === 0) console.log(`[${a}] frame ${f}/${b}`);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  }
  await browser.close(); server.close();
})().catch(e => { console.error(e); process.exit(1); });
