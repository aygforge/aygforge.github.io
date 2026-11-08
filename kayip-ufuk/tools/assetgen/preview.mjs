// Contact-sheet preview helper: node tools/assetgen/preview.mjs <module> <fn> <out.png>
import { Pix, encodePNG } from './raster.mjs';
import { writeFileSync } from 'node:fs';
export function sheet(pixes, cols, scale, out, bg = [40, 60, 70, 255]) {
  const cw = Math.max(...pixes.map((p) => p.w)) + 2, ch = Math.max(...pixes.map((p) => p.h)) + 2;
  const rows = Math.ceil(pixes.length / cols);
  const W = cols * cw * scale, H = rows * ch * scale; const big = new Pix(W, H);
  big.rect(0, 0, W, H, bg);
  pixes.forEach((p, i) => { const ox = (i % cols) * cw * scale, oy = Math.floor(i / cols) * ch * scale; for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) { const c = p.get(x, y); if (c[3]) big.rect(ox + x * scale, oy + y * scale, scale, scale, c); } });
  writeFileSync(out, encodePNG(W, H, big.d));
}
