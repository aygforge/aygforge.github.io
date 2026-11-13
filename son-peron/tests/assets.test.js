import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { C } from './helpers/setup.js';
import { collectSprites } from '../src/art/atlas.js';
import { STATES } from '../src/art/furniture.js';
import { charSheet, lookKey } from '../src/art/chars.js';
import { buildTileset } from '../src/art/tiles.js';

const atlas = JSON.parse(fs.readFileSync(new URL('../public/assets/atlas.json', import.meta.url), 'utf8')).frames;
describe('Asset manifesti (T30, T32, T37)', () => {
  it('her eşyanın ikonu; her mobilya/ekipman/kozmetiğin yön ve durum sprite\'ı atlasta var', () => {
    const missing = [];
    for (const id of Object.keys(C.items)) if (!atlas['i/' + id]) missing.push('i/' + id);
    for (const d of Object.values(C.placeables)) { const rots = d.place === 'wall' || ['wood_floor', 'stone_floor', 'stone_path'].includes(d.id) ? [0] : [0, 1, 2, 3]; for (const r of rots) for (const st of STATES[d.id] || ['']) { const k = `f/${d.id}/${r}${st ? '/' + st : ''}`; if (!atlas[k]) missing.push(k); } }
    for (const r of Object.values(C.recipes)) if (!r.ready && !atlas['pot/' + r.id]) missing.push('pot/' + r.id);
    for (const s of C.seasons) for (const k of ['o/tree/', 'o/pine/', 'o/berry/', 'o/bush/']) if (!atlas[k + s]) missing.push(k + s);
    for (const sd of Object.keys(C.seeds)) for (let i = 0; i < 4; i++) if (!atlas[`crop/${sd}/${i}`]) missing.push(`crop/${sd}/${i}`);
    for (const k of ['t/loco/0', 't/loco/1', 't/wagon/0/open', 't/wagon/1/closed', 'b/restaurant/old', 'b/restaurant/new', 'b/station/old', 'b/station/new', 'fx/steam', 'fx/smoke', 'fx/flame', 'fx/rain', 'fx/snow', 'fx/glow', 'fx/ekey', 'fx/b_order', 'fx/b_pay', 'h/axe', 'h/pickaxe', 'h/hoe', 'h/watering_can', 'h/cloth', 'o/sign/open', 'o/sign/closed', 'ui/panel', 'ui/slot']) if (!atlas[k]) missing.push(k);
    expect(missing).toEqual([]);
    expect(Object.keys(atlas).length).toBeGreaterThan(600);
    for (const s of C.seasons) expect(fs.existsSync(new URL(`../public/assets/tiles_${s}.png`, import.meta.url))).toBe(true);
  });
  it('üretim deterministiktir; ikonlar tek renkli kutu/placeholder değildir', () => {
    const a = collectSprites(C), b = collectSprites(C); expect(a.missing).toEqual([]);
    for (const [k, p] of Object.entries(a.sprites)) { expect(Buffer.from(p.d).equals(Buffer.from(b.sprites[k].d)), k).toBe(true); }
    for (const id of [...Object.keys(C.recipes), ...Object.values(C.items).filter((i) => i.cat === 'ingredient').map((i) => i.id)]) { const p = a.sprites['i/' + id]; const colors = new Set(); let opaque = 0; for (let i = 0; i < p.d.length; i += 4) if (p.d[i + 3]) { opaque++; colors.add((p.d[i] << 16) | (p.d[i + 1] << 8) | p.d[i + 2]); } expect(colors.size, id).toBeGreaterThanOrEqual(4); expect(opaque, id).toBeLessThan(16 * 16 * 0.95); }
    const uniq = new Set(Object.keys(C.recipes).map((id) => Buffer.from(a.sprites['i/' + id].d).toString('base64'))); expect(uniq.size).toBe(21);
    expect(Buffer.from(buildTileset('winter').d).equals(Buffer.from(buildTileset('winter').d))).toBe(true);
  });
  it('karakter atlası: 4 yön × 16 kare, görünüme göre farklı ve tekrar üretilebilir', () => {
    const l1 = { skin: 0, hair: 1, style: 0, outfit: 2 }, l2 = { skin: 3, hair: 4, style: 2, outfit: 5, hat: 'cap' };
    const s1 = charSheet(l1), s2 = charSheet(l2); expect([s1.w, s1.h]).toEqual([512, 192]);
    expect(Buffer.from(s1.d).equals(Buffer.from(charSheet(l1).d))).toBe(true); expect(Buffer.from(s1.d).equals(Buffer.from(s2.d))).toBe(false); expect(lookKey(l1)).not.toBe(lookKey(l2));
    const frame = (s, d, f) => { const out = []; for (let y = 0; y < 48; y++) for (let x = 0; x < 32; x++) out.push(s.d[((d * 48 + y) * s.w + f * 32 + x) * 4 + 3] ? s.d[((d * 48 + y) * s.w + f * 32 + x) * 4] : -1); return out.join(); };
    expect(frame(s1, 0, 2)).not.toBe(frame(s1, 0, 3)); expect(frame(s1, 0, 0)).not.toBe(frame(s1, 1, 0)); expect(frame(s1, 2, 0)).not.toBe(frame(s1, 3, 0)); expect(frame(s1, 0, 6)).not.toBe(frame(s1, 0, 8)); expect(frame(s1, 0, 13)).not.toBe(frame(s1, 0, 0));
  });
});
