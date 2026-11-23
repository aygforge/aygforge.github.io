import { JSON_DATA, MANIFEST, PNG } from './render/assets';

const root = document.getElementById('root')!;
const imgs: Record<string, HTMLImageElement> = {};
const load = (a: string) => (imgs[a] ??= Object.assign(new Image(), { src: PNG[a] }));
const players: { cv: HTMLCanvasElement; atlas: string; frames: string[]; rate: number; scale: number }[] = [];

function section(title: string) { const h = document.createElement('h2'); h.textContent = title; root.appendChild(h); const d = document.createElement('div'); d.className = 'wrap'; root.appendChild(d); return d; }
function anim(parent: HTMLElement, atlas: string, frames: string[], rate: number, label: string, scale = 2) {
  const f0 = JSON_DATA[atlas].frames[frames[0]].frame;
  const cell = document.createElement('div'); cell.className = 'cell';
  const cv = document.createElement('canvas'); cv.width = f0.w * scale; cv.height = f0.h * scale;
  cell.appendChild(cv); cell.appendChild(document.createTextNode(label)); parent.appendChild(cell);
  load(atlas); players.push({ cv, atlas, frames, rate, scale });
}
document.getElementById('sum')!.textContent = `${MANIFEST.counts.atlases} atlas · ${MANIFEST.counts.frames} kare · ${MANIFEST.counts.champions} şampiyon · ${MANIFEST.counts.units} birim/yaratık · ${MANIFEST.counts.vfx} efekt · ${MANIFEST.counts.icons} ikon`;
const DIRS = ['down', 'left', 'right', 'up'];
for (const [id, c] of Object.entries(MANIFEST.champions)) {
  const s = section(`Şampiyon: ${id}`);
  for (const [a, d] of Object.entries(c.anims)) for (const dir of DIRS) anim(s, c.atlas, Array.from({ length: d.frames }, (_, i) => `${a}_${dir}_${i}`), d.rate, `${a} ${dir}`, 2);
}
for (const [id, c] of Object.entries(MANIFEST.units)) {
  const s = section(`Birim: ${id}`);
  for (const [a, d] of Object.entries(c.anims)) for (const dir of DIRS) anim(s, c.atlas, Array.from({ length: d.frames }, (_, i) => `${a}_${dir}_${i}`), d.rate, `${a} ${dir}`, c.size > 48 ? 1 : 2);
}
{ const s = section('Efektler'); for (const [k, v] of Object.entries(MANIFEST.vfx)) anim(s, 'vfx', Array.from({ length: v.frames }, (_, i) => `${k}_${i}`), v.rate, k, v.size > 48 ? 1 : 2); }
{ const s = section('Yapılar'); for (const t of [0, 1]) { anim(s, 'structures', [0, 1, 2, 3].map((i) => `tower_${t}_idle_${i}`), 5, `kule ${t}`); anim(s, 'structures', [0, 1, 2, 3, 4, 5].map((i) => `crystal_${t}_idle_${i}`), 6, `kristal ${t}`); anim(s, 'structures', [`tower_${t}_ruin_0`], 1, 'yıkık kule'); anim(s, 'structures', [`fountain_${t}`], 1, 'üs'); } }
for (const a of ['tiles', 'decor', 'icons', 'portraits']) { const s = section(a); for (const f of Object.keys(JSON_DATA[a].frames)) anim(s, a, [f], 1, f, a === 'tiles' || a === 'icons' ? 3 : 2); }
{ const s = section('Harita'); const im = new Image(); im.src = PNG.map; im.className = 'full'; s.appendChild(im); }

let t0 = performance.now();
function tick(t: number) {
  for (const p of players) {
    const img = imgs[p.atlas]; if (!img.complete) continue;
    const i = Math.floor(((t - t0) / 1000) * p.rate) % p.frames.length;
    const f = JSON_DATA[p.atlas].frames[p.frames[i]].frame;
    const g = p.cv.getContext('2d')!; g.imageSmoothingEnabled = false; g.clearRect(0, 0, p.cv.width, p.cv.height);
    g.drawImage(img, f.x, f.y, f.w, f.h, 0, 0, f.w * p.scale, f.h * p.scale);
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
void t0;
