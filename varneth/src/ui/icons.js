// Canvas helpers for icons and hero previews drawn from the generated sprite atlases.
import { heroLayers } from '../game/visuals.js';

let MAN = null;
const IMG = new Map();

function load(src) {
  if (IMG.has(src)) return IMG.get(src);
  const p = new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = 'assets/' + src; });
  IMG.set(src, p);
  return p;
}

export async function initIcons(manifest) {
  MAN = manifest;
  await Promise.all([manifest.icons.items.file, manifest.icons.materials.file, manifest.icons.skills.file].map(load));
}

function atlasCanvas(atlas, index, size = 32) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const i = atlas.index[index];
  if (i == null) return c;
  load(atlas.file).then((img) => {
    if (!img) return;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, (i % atlas.cols) * atlas.size, Math.floor(i / atlas.cols) * atlas.size, atlas.size, atlas.size, 0, 0, size, size);
  });
  return c;
}

export const itemIcon = (baseId) => atlasCanvas(MAN.icons.items, baseId);
export const matIcon = (id) => atlasCanvas(MAN.icons.materials, id);
export const skillIcon = (id) => atlasCanvas(MAN.icons.skills, id);

function tintImage(img, sx, sy, w, h, tint) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, sx, sy, w, h, 0, 0, w, h);
  if (tint != null) {
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = '#' + tint.toString(16).padStart(6, '0');
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(img, sx, sy, w, h, 0, 0, w, h);
  }
  return c;
}

// Composite the layered hero at a given frame into a canvas.
export function heroCanvas(cls, appearance, equipped, scale = 2, frame = 0) {
  const W = MAN.hero.frameW, H = MAN.hero.frameH;
  const c = document.createElement('canvas');
  c.width = W * scale; c.height = H * scale;
  const { layers } = heroLayers(cls, appearance, equipped);
  const files = MAN.hero.classes[cls];
  Promise.all(layers.map((l) => {
    const key = l.tex.replace(`hero_${cls}_`, '');
    return files[key] ? load(files[key]).then((img) => ({ img, tint: l.tint })) : null;
  })).then((imgs) => {
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const cols = MAN.hero.cols;
    const sx = (frame % cols) * W, sy = Math.floor(frame / cols) * H;
    for (const x of imgs) {
      if (!x?.img) continue;
      ctx.drawImage(tintImage(x.img, sx, sy, W, H, x.tint), 0, 0, W * scale, H * scale);
    }
  });
  return c;
}
