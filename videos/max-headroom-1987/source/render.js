const { chromium } = require('playwright'); const path = require('path'); const { spawn } = require('child_process');
const TOTAL = +process.argv[2], N = +process.argv[3] || 4;
(async () => {
  const b = await chromium.launch();
  const per = Math.ceil(TOTAL / N); const t0 = Date.now();
  await Promise.all([...Array(N).keys()].map(async w => {
    const s = w * per, e = Math.min(TOTAL, s + per);
    const p = await b.newPage({ viewport: { width: 1080, height: 1920 } }); p.on('pageerror', er => console.log('ERR', er.message));
    await p.goto('file://' + path.resolve('index.html')); await p.evaluate(() => window.ready);
    const ff = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', '30', `chunk${w}.mp4`], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let f = s; f < e; f++) {
      const d = await p.evaluate(f => window.renderFrame(f, 0.95), f);
      const buf = Buffer.from(d.split(',')[1], 'base64'); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (f % 150 === 0) console.log('w', w, 'frame', f, ((Date.now() - t0) / 1000).toFixed(0) + 's');
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  }));
  await b.close(); console.log('done', (Date.now() - t0) / 1000);
})();
