// Android ikon + splash üretici: mevcut özgün chef/tabak pixel sprite'larından (Playwright canvas, nearest-neighbour).
// Çalıştırma: node tools/gen-android-icons.cjs  (android/ projesi oluşturulduktan sonra)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const res = path.join(root, 'android/app/src/main/res');
const b64 = (f) => fs.readFileSync(path.join(root, 'public/assets', f)).toString('base64');
const pngSize = (f) => { const b = fs.readFileSync(f); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
const jobs = [];
const dens = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [d, k] of Object.entries(dens)) {
  jobs.push({ file: `mipmap-${d}/ic_launcher.png`, w: 48 * k, h: 48 * k, kind: 'legacy' });
  jobs.push({ file: `mipmap-${d}/ic_launcher_round.png`, w: 48 * k, h: 48 * k, kind: 'round' });
  jobs.push({ file: `mipmap-${d}/ic_launcher_foreground.png`, w: 108 * k, h: 108 * k, kind: 'fg' });
}
for (const dir of fs.readdirSync(res).filter((d) => d.startsWith('drawable'))) {
  const f = path.join(res, dir, 'splash.png');
  if (fs.existsSync(f)) { const [w, h] = pngSize(f); jobs.push({ file: `${dir}/splash.png`, w, h, kind: 'splash' }); }
}
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(`<img id=c src="data:image/png;base64,${b64('chefs/chef.png')}"><img id=d src="data:image/png;base64,${b64('kitchen/dish_menemen.png')}">`);
  for (const j of jobs) {
    const data = await page.evaluate(({ w, h, kind }) => {
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      const g = cv.getContext('2d');
      g.imageSmoothingEnabled = false;
      const chef = document.getElementById('c'); const dish = document.getElementById('d');
      if (kind !== 'fg') { g.fillStyle = kind === 'splash' ? '#2b2530' : '#c8693f'; if (kind === 'round') { g.beginPath(); g.arc(w / 2, h / 2, w / 2, 0, 7); g.fill(); } else g.fillRect(0, 0, w, h); }
      const box = kind === 'splash' ? Math.min(w, h) * 0.32 : kind === 'fg' ? w * 0.5 : w * 0.72; // fg: adaptive safe zone (66 %)
      const s = Math.max(1, Math.floor(box / chef.naturalHeight));
      const cw = chef.naturalWidth * s, ch = chef.naturalHeight * s;
      g.drawImage(chef, Math.round((w - cw) / 2), Math.round((h - ch) / 2 - (kind === 'splash' ? h * 0.04 : 0)), cw, ch);
      if (kind === 'splash') { const ds = Math.max(1, Math.floor(s * 0.8)); g.drawImage(dish, Math.round(w / 2 - (dish.naturalWidth * ds) / 2), Math.round(h / 2 + ch / 2), dish.naturalWidth * ds, dish.naturalHeight * ds); }
      return cv.toDataURL('image/png').split(',')[1];
    }, j);
    fs.writeFileSync(path.join(res, j.file), Buffer.from(data, 'base64'));
  }
  await browser.close();
  console.log(`android icons/splash: ${jobs.length} files`);
})();
