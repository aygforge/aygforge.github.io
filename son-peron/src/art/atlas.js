// Tüm statik sprite'ları tek atlasta toplar (raf paketleme) ve Phaser JSON-hash atlas verisi üretir.
import { Px } from './px.js';
import { itemIcon, potSprite } from './items.js';
import { buildFurniture, furnitureIcon } from './furniture.js';
import { buildWorld, uiSprites } from './world.js';
import { drawTile } from './tiles.js';
import { T } from '../world/maps.js';

export function collectSprites(C) {
  const out = {}; const missing = [];
  const tileIcon = (id) => drawTile(id === 'wood_floor' ? T.WOODF : id === 'stone_floor' ? T.STONEF : T.STONEPATH, 'spring', 0);
  for (const it of Object.values(C.items)) {
    let p = itemIcon(it.id); if (!p && C.placeables[it.id]) p = furnitureIcon(C, it.id, tileIcon);
    if (p) out['i/' + it.id] = p; else missing.push('ikon:' + it.id);
  }
  const f = buildFurniture(C); Object.assign(out, f.sprites); missing.push(...f.missing.map((m) => 'mobilya:' + m));
  for (const id of ['wood_floor', 'stone_floor', 'stone_path']) out[`f/${id}/0`] = Object.assign(tileIcon(id), { H: 0 });
  Object.assign(out, buildWorld(), uiSprites());
  for (const r of Object.values(C.recipes)) if (!r.ready) out['pot/' + r.id] = potSprite({ food: '#d98a3c', drink: '#8fc3e0' }[r.kind]);
  return { sprites: out, missing };
}
export function packAtlas(sprites, width = 2048) {
  const names = Object.keys(sprites).sort((a, b) => sprites[b].h - sprites[a].h || a.localeCompare(b));
  let x = 0, y = 0, rowH = 0; const pos = {};
  for (const n of names) { const s = sprites[n], w = s.w * 2 + 2, h = s.h * 2 + 2; if (x + w > width) { x = 0; y += rowH; rowH = 0; } pos[n] = [x + 1, y + 1]; x += w; rowH = Math.max(rowH, h); }
  const height = y + rowH; const sheet = new Px(width, height); const frames = {};
  for (const n of names) { const s = sprites[n].scaled(2); sheet.blit(s, pos[n][0], pos[n][1]); frames[n] = { frame: { x: pos[n][0], y: pos[n][1], w: s.w, h: s.h }, rotated: false, trimmed: false, spriteSourceSize: { x: 0, y: 0, w: s.w, h: s.h }, sourceSize: { w: s.w, h: s.h }, extra: (sprites[n].H || 0) * 2 }; }
  return { sheet, json: { frames, meta: { app: 'son-peron-asset-generator', image: 'atlas.png', format: 'RGBA8888', size: { w: width, h: height }, scale: '1' } } };
}
