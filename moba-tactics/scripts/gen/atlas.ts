import { writeFileSync } from 'node:fs';
import { PC } from './canvas';
import { encodePNG } from './png';

export interface AtlasResult { name: string; w: number; h: number; frames: number }

/** Shelf-pack frames into a PNG + Phaser JSON-hash atlas. */
export function writeAtlas(dir: string, name: string, frames: [string, PC][], maxW = 2048): AtlasResult {
  const pad = 1;
  const items = frames.map(([k, pc]) => ({ k, pc }));
  // keep insertion order for same-size frames, sort shelves by height desc
  const order = items.map((it, i) => ({ it, i })).sort((a, b) => b.it.pc.h - a.it.pc.h || a.i - b.i).map((o) => o.it);
  let x = 0, y = 0, shelfH = 0, W = 0;
  const pos = new Map<string, { x: number; y: number }>();
  for (const it of order) {
    if (x + it.pc.w + pad > maxW) { x = 0; y += shelfH + pad; shelfH = 0; }
    pos.set(it.k, { x, y });
    x += it.pc.w + pad;
    shelfH = Math.max(shelfH, it.pc.h);
    W = Math.max(W, x);
  }
  const H = y + shelfH;
  const pw = Math.ceil(W / 4) * 4, ph = Math.ceil(H / 4) * 4;
  const img = new PC(pw, ph);
  const json: any = { frames: {}, meta: { app: 'moba-tactics generate-assets', version: '1', image: `${name}.png`, format: 'RGBA8888', size: { w: pw, h: ph }, scale: '1' } };
  for (const it of items) {
    const p = pos.get(it.k)!;
    img.blit(it.pc, p.x, p.y);
    json.frames[it.k] = { frame: { x: p.x, y: p.y, w: it.pc.w, h: it.pc.h }, rotated: false, trimmed: false, spriteSourceSize: { x: 0, y: 0, w: it.pc.w, h: it.pc.h }, sourceSize: { w: it.pc.w, h: it.pc.h } };
  }
  writeFileSync(`${dir}/${name}.png`, encodePNG(pw, ph, img.d));
  writeFileSync(`${dir}/${name}.json`, JSON.stringify(json));
  return { name, w: pw, h: ph, frames: items.length };
}
