#!/usr/bin/env node
// Generates the 24 RGBA 1024×1024 atlas PNGs exactly at Art/AtlasLayout.json rectangles from original
// procedural pixel-art painters. Output: public/assets/atlases/*.png (+ per-page metadata json),
// public/assets/avatar_anchors.json (measured hand/head anchors per pose), public/assets/atlas_index.json.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pix, encodePNG } from './raster.mjs';
import { drawItemIcon } from './icons.mjs';
import { drawTerrain, drawTransition, drawWater, drawFoliage, drawResource, drawCrop, drawCropOverlay } from './world_art.mjs';
import { drawBody, drawClothingMask, drawHair, drawHeld, drawBag } from './avatar.mjs';
import { drawAnimal, drawCodex } from './animals.mjs';
import { drawBuild, drawActiveFx, drawPOI } from './builds.mjs';
import { drawFx, drawUI, drawBoat, drawScene } from './misc_art.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SPEC = path.join(ROOT, 'Kayip_Ufuk_GDD_v2_0');
const OUT = path.join(ROOT, 'public');
const catalog = JSON.parse(readFileSync(path.join(SPEC, 'Art/SpriteCatalog.json'), 'utf8')).canonicalRecords;
const layout = JSON.parse(readFileSync(path.join(SPEC, 'Art/AtlasLayout.json'), 'utf8'));

// frame counts per animation strip
const frameCount = new Map();
for (const r of catalog) {
  const parts = r.spriteId.split('/');
  if (/^\d+$/.test(parts[parts.length - 1])) { const key = parts.slice(0, -1).join('/'); frameCount.set(key, (frameCount.get(key) || 0) + 1); }
}
const nOf = (sid) => frameCount.get(sid.split('/').slice(0, -1).join('/')) || 1;

const anchors = {};
function draw(rec) {
  const s = rec.spriteId.split('/'); const id = rec.sourceId;
  switch (s[0]) {
    case 'icon': return drawItemIcon(id);
    case 'codex': return drawCodex(id);
    case 'terrain':
      if (s[1] === 'transition') return drawTransition(s[2], +s[3]);
      if (s[1] === 'water') return drawWater(s[2], +s[3]);
      return drawTerrain(s[1], +s[2]);
    case 'foliage': return drawFoliage(s[1], +s[2]);
    case 'resource': return drawResource(s[1], s[2]);
    case 'crop': return s[1] === 'shared' ? drawCropOverlay(s[2]) : drawCrop(s[1], +s[2]);
    case 'avatar': {
      if (s[1] === 'hair') return drawHair(+s[2], s[3]);
      if (s[1] === 'held') return drawHeld(s[2], s[3]);
      if (s[1] === 'bag') return drawBag(s[2], s[3]);
      if (s[1] === 'clothing_mask') return drawClothingMask(s[2], s[3], +s[4], nOf(rec.spriteId));
      const { p, A } = drawBody(s[1], s[2], s[3], +s[4], nOf(rec.spriteId));
      anchors[`${s[1]}/${s[2]}/${s[3]}/${s[4]}`] = { head: A.head, leftHand: A.leftHand, rightHand: A.rightHand, backpack: A.backpack, effect: A.effect, toolAngle: +A.toolAngle.toFixed(3) };
      return p;
    }
    case 'animal': return drawAnimal(s[1], s[2], s[3], +s[4], nOf(rec.spriteId));
    case 'build': return s[2] === 'active_fx' ? drawActiveFx(s[1], rec.w, rec.h) : drawBuild(s[1], s[2], rec.w, rec.h);
    case 'poi': return drawPOI(s[1], s[2]);
    case 'fx': return drawFx(s[1], +s[2]);
    case 'ui': return drawUI(s[1]);
    case 'boat': return drawBoat(s[1], s[2], +s[3]);
    case 'scene': return drawScene(s[1], s[2]);
  }
  throw new Error('No painter for sprite ' + rec.spriteId);
}

const pages = new Map(layout.pages.map((pg) => [pg.pageId, new Pix(pg.width, pg.height)]));
const pageMeta = new Map(layout.pages.map((pg) => [pg.pageId, {}]));
let n = 0; const errors = [];
const t0 = Date.now();
for (const rec of catalog) {
  const rect = layout.sprites[rec.spriteId];
  if (!rect) { errors.push('no rect ' + rec.spriteId); continue; }
  let img;
  try { img = draw(rec); } catch (e) { errors.push(`${rec.spriteId}: ${e.message}`); continue; }
  if (img.w !== rect.w || img.h !== rect.h) errors.push(`size mismatch ${rec.spriteId} ${img.w}x${img.h} vs ${rect.w}x${rect.h}`);
  if (img.countOpaque() === 0) errors.push('empty sprite ' + rec.spriteId);
  const page = pages.get(rect.pageId);
  for (let y = 0; y < Math.min(img.h, rect.h); y++) {
    const src = y * img.w * 4, dst = ((rect.y + y) * page.w + rect.x) * 4;
    page.d.set(img.d.subarray(src, src + Math.min(img.w, rect.w) * 4), dst);
  }
  pageMeta.get(rect.pageId)[rec.spriteId] = { x: rect.x, y: rect.y, w: rect.w, h: rect.h, anchor: rec.anchor, frames: rec.frames, fps: rec.fps };
  n++;
}
if (errors.length) { console.error('ERRORS:\n' + errors.slice(0, 40).join('\n')); process.exitCode = 1; }
mkdirSync(path.join(OUT, 'assets/atlases'), { recursive: true });
const index = { pages: layout.pages.map((pg) => pg.plannedPngPath), sprites: {} };
const pageIdx = new Map(layout.pages.map((pg, i) => [pg.pageId, i]));
for (const pg of layout.pages) {
  writeFileSync(path.join(OUT, pg.plannedPngPath), encodePNG(pg.width, pg.height, pages.get(pg.pageId).d));
  writeFileSync(path.join(OUT, pg.plannedMetadataPath), JSON.stringify({ pageId: pg.pageId, image: path.basename(pg.plannedPngPath), size: [pg.width, pg.height], generator: 'tools/assetgen/generate.mjs', sprites: pageMeta.get(pg.pageId) }));
}
for (const [sid, r] of Object.entries(layout.sprites)) index.sprites[sid] = [pageIdx.get(r.pageId), r.x, r.y, r.w, r.h];
writeFileSync(path.join(OUT, 'assets/atlas_index.json'), JSON.stringify(index));
writeFileSync(path.join(OUT, 'assets/avatar_anchors.json'), JSON.stringify({ note: 'Measured from generated body frames (supersedes provisional AvatarRig anchors)', feetCenterPx: [16, 45], anchors }));
console.log(`atlas generation: ${n}/${catalog.length} sprites drawn into ${layout.pages.length} pages in ${((Date.now() - t0) / 1000).toFixed(1)}s; errors=${errors.length}`);
