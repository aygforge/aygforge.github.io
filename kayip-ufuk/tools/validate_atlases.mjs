// Physical atlas validator (VIS_27 / AT_RENDER_AUDIO_01).
// Decodes every atlas PNG (own zlib/unfilter decoder, no deps) and checks:
//  - file exists, 1024×1024 RGBA8, non-interlaced
//  - per-page metadata JSON and runtime atlas_index.json agree with Art/AtlasLayout.json rectangles
//  - every rect inside page bounds; padded rects never overlap (2px margin per AtlasLayout.paddingPixels)
//  - every sprite has opaque pixels (no empty placeholder)
//  - the 2px margin is an exact extrusion of the sprite's edge pixels
//  - no stray pixels outside padded rects
// Usage: node tools/validate_atlases.mjs [assetsRoot=public] [--json out.json]
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const base = path.resolve(ROOT, args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--json') || 'public');
const jsonOut = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;
const layout = JSON.parse(readFileSync(path.join(ROOT, 'Kayip_Ufuk_GDD_v2_0/Art/AtlasLayout.json'), 'utf8'));
const PAD = layout.paddingPixels;

export function decodePNG(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
  let off = 8; let w = 0, h = 0, depth = 0, ctype = 0, inter = 0; const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off); const type = buf.toString('ascii', off + 4, off + 8); const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depth = data[8]; ctype = data[9]; inter = data[12]; }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  if (depth !== 8 || ctype !== 6 || inter !== 0) return { w, h, depth, ctype, inter, d: null };
  const raw = zlib.inflateSync(Buffer.concat(idat)); const stride = w * 4; const out = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)]; const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= 4 ? out[y * stride + x - 4] : 0, b = y ? out[(y - 1) * stride + x] : 0, c = x >= 4 && y ? out[(y - 1) * stride + x - 4] : 0;
      let v = line[x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      out[y * stride + x] = v & 255;
    }
  }
  return { w, h, depth, ctype, inter, d: out };
}

export function validateAtlases(assetsRoot = base) {
  const errors = []; const pages = []; const t0 = Date.now();
  const idxPath = path.join(assetsRoot, 'assets/atlas_index.json');
  const index = existsSync(idxPath) ? JSON.parse(readFileSync(idxPath, 'utf8')) : null;
  if (!index) errors.push('missing assets/atlas_index.json');
  let sprites = 0, semiAlphaPx = 0;
  layout.pages.forEach((pg, pi) => {
    const f = path.join(assetsRoot, pg.plannedPngPath); const mf = path.join(assetsRoot, pg.plannedMetadataPath);
    if (!existsSync(f)) { errors.push(`MISSING_PNG ${pg.plannedPngPath}`); return; }
    if (!existsSync(mf)) errors.push(`MISSING_META ${pg.plannedMetadataPath}`);
    const img = decodePNG(readFileSync(f));
    if (img.w !== pg.width || img.h !== pg.height) errors.push(`${pg.pageId}: size ${img.w}x${img.h} != ${pg.width}x${pg.height}`);
    if (!img.d) { errors.push(`${pg.pageId}: not RGBA8 non-interlaced (depth=${img.depth} ctype=${img.ctype})`); return; }
    const meta = existsSync(mf) ? JSON.parse(readFileSync(mf, 'utf8')) : { sprites: {} };
    if (index && index.pages[pi] !== pg.plannedPngPath) errors.push(`atlas_index page ${pi} = ${index.pages[pi]} != ${pg.plannedPngPath}`);
    const rects = Object.entries(layout.sprites).filter(([, r]) => r.pageId === pg.pageId);
    const owner = new Int32Array(img.w * img.h).fill(-1); let empty = 0, badPad = 0, overlap = 0, oob = 0, stray = 0;
    rects.forEach(([id, r], k) => {
      sprites++;
      const m = meta.sprites[id]; if (!m || m.x !== r.x || m.y !== r.y || m.w !== r.w || m.h !== r.h) errors.push(`${id}: page metadata disagrees with AtlasLayout`);
      const ix = index?.sprites[id]; if (!ix || ix[0] !== pi || ix[1] !== r.x || ix[2] !== r.y || ix[3] !== r.w || ix[4] !== r.h) errors.push(`${id}: atlas_index disagrees with AtlasLayout`);
      if (r.x - PAD < 0 || r.y - PAD < 0 || r.x + r.w + PAD > img.w || r.y + r.h + PAD > img.h) { oob++; errors.push(`${id}: padded rect out of page bounds`); }
      for (let y = Math.max(0, r.y - PAD); y < Math.min(img.h, r.y + r.h + PAD); y++) for (let x = Math.max(0, r.x - PAD); x < Math.min(img.w, r.x + r.w + PAD); x++) {
        const o = y * img.w + x; if (owner[o] !== -1) overlap++; owner[o] = k;
      }
      let opaque = 0;
      for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) { const a = img.d[(y * img.w + x) * 4 + 3]; if (a) opaque++; if (a && a !== 255) semiAlphaPx++; }
      if (!opaque) { empty++; errors.push(`${id}: EMPTY sprite (no opaque pixel)`); }
      for (let y = r.y - PAD; y < r.y + r.h + PAD; y++) for (let x = r.x - PAD; x < r.x + r.w + PAD; x++) {
        if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) continue;
        const sx = Math.max(r.x, Math.min(r.x + r.w - 1, x)), sy = Math.max(r.y, Math.min(r.y + r.h - 1, y));
        const a = (y * img.w + x) * 4, b = (sy * img.w + sx) * 4;
        if (img.d[a] !== img.d[b] || img.d[a + 1] !== img.d[b + 1] || img.d[a + 2] !== img.d[b + 2] || img.d[a + 3] !== img.d[b + 3]) badPad++;
      }
    });
    for (let o = 0; o < owner.length; o++) if (owner[o] === -1 && img.d[o * 4 + 3]) stray++;
    if (overlap) errors.push(`${pg.pageId}: ${overlap} px where padded rects overlap`);
    if (badPad) errors.push(`${pg.pageId}: ${badPad} padding px are not edge extrusions`);
    if (stray) errors.push(`${pg.pageId}: ${stray} stray opaque px outside sprite rects`);
    pages.push({ pageId: pg.pageId, size: [img.w, img.h], sprites: rects.length, emptySprites: empty, paddingMismatches: badPad, overlaps: overlap, outOfBounds: oob, strayPixels: stray });
  });
  return { ok: errors.length === 0, assetsRoot: path.relative(ROOT, assetsRoot) || '.', paddingPixels: PAD, pagesChecked: pages.length, spritesChecked: sprites, layoutSprites: Object.keys(layout.sprites).length, semiTransparentPixels: semiAlphaPx, pages, errors: errors.slice(0, 200), errorCount: errors.length, ms: Date.now() - t0 };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const r = validateAtlases(base);
  if (jsonOut) writeFileSync(path.resolve(ROOT, jsonOut), JSON.stringify(r, null, 1));
  console.log(`atlas validation: ${r.ok ? 'OK' : 'FAILED'} — ${r.pagesChecked}/24 pages, ${r.spritesChecked}/${r.layoutSprites} sprites, ${r.errorCount} errors (${r.ms} ms)`);
  for (const e of r.errors.slice(0, 15)) console.log('  ' + e);
  if (!r.ok) process.exitCode = 1;
}
