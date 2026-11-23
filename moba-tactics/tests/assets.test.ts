import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { decodePNG } from '../scripts/gen/png';
import { CHAMPIONS } from '../src/data/champions';
import { ITEMS, COMP_CODES } from '../src/data/items';

const DIR = 'assets/generated';
const manifest = JSON.parse(readFileSync(`${DIR}/manifest.json`, 'utf8'));
const DIRS = ['down', 'up', 'left', 'right'];

function frameStats(atlas: string) {
  const img = decodePNG(readFileSync(`${DIR}/${atlas}.png`));
  const json = JSON.parse(readFileSync(`${DIR}/${atlas}.json`, 'utf8'));
  return { img, json };
}
function opaque(img: { w: number; data: Uint8Array }, f: { x: number; y: number; w: number; h: number }) {
  let n = 0;
  for (let y = f.y; y < f.y + f.h; y++) for (let x = f.x; x < f.x + f.w; x++) if (img.data[(y * img.w + x) * 4 + 3] > 0) n++;
  return n;
}

describe('generated assets', () => {
  it('every atlas listed in the manifest exists and frames are inside the image', () => {
    for (const a of manifest.atlases) {
      expect(existsSync(`${DIR}/${a}.png`)).toBe(true);
      const { img, json } = frameStats(a);
      expect(json.meta.size).toEqual({ w: img.w, h: img.h });
      for (const [k, f] of Object.entries<any>(json.frames)) {
        expect(f.frame.x + f.frame.w, `${a}/${k}`).toBeLessThanOrEqual(img.w);
        expect(f.frame.y + f.frame.h, `${a}/${k}`).toBeLessThanOrEqual(img.h);
      }
    }
  });
  it('18 champions have all 9 animations in 4 directions with non-empty, distinct frames', () => {
    expect(Object.keys(manifest.champions).length).toBe(18);
    const sigs = new Set<string>();
    for (const c of CHAMPIONS) {
      const m = manifest.champions[c.id];
      expect(m).toBeTruthy();
      const { img, json } = frameStats(m.atlas);
      for (const a of ['idle', 'walk', 'attack', 's1', 's2', 'ult', 'hit', 'death', 'recall']) {
        expect(m.anims[a].frames).toBeGreaterThanOrEqual(2);
        for (const d of DIRS) {
          const covs: number[] = [];
          const raws: string[] = [];
          for (let i = 0; i < m.anims[a].frames; i++) {
            const f = json.frames[`${a}_${d}_${i}`];
            expect(f, `${c.id} ${a}_${d}_${i}`).toBeTruthy();
            covs.push(opaque(img, f.frame));
            let h = 0; for (let y = f.frame.y; y < f.frame.y + f.frame.h; y += 2) for (let x = f.frame.x; x < f.frame.x + f.frame.w; x += 2) h = (h * 31 + img.data[(y * img.w + x) * 4] + img.data[(y * img.w + x) * 4 + 3]) >>> 0;
            raws.push(String(h));
          }
          expect(Math.min(...covs), `${c.id} ${a} ${d} empty frame`).toBeGreaterThan(40);
          if (a !== 'hit') expect(new Set(raws).size, `${c.id} ${a} ${d} must not be a single repeated pose`).toBeGreaterThan(1);
        }
      }
      // champion identity: idle-down frame differs between champions
      const f = json.frames['idle_down_0'].frame;
      let h = 0; for (let y = f.y; y < f.y + f.h; y++) for (let x = f.x; x < f.x + f.w; x++) h = (h * 33 + img.data[(y * img.w + x) * 4 + 1]) >>> 0;
      sigs.add(String(h));
    }
    expect(sigs.size).toBe(18);
  });
  it('creatures, summons, bosses and minions are animated in 4 directions', () => {
    for (const k of ['wolf', 'beast', 'skeleton', 'bonegiant', 'sentry', 'boss_blood', 'boss_titan', 'alphawolf', 'wolfling', 'golem', 'spirit', 'wisp', 'minion_melee_0', 'minion_ranged_1', 'minion_siege_0']) {
      const m = manifest.units[k];
      expect(m, k).toBeTruthy();
      const { img, json } = frameStats(m.atlas);
      for (const a of ['idle', 'walk', 'attack', 's1', 'hit', 'death']) for (const d of DIRS) for (let i = 0; i < m.anims[a].frames; i++) {
        const f = json.frames[`${a}_${d}_${i}`];
        expect(f, `${k} ${a}_${d}_${i}`).toBeTruthy();
        if (a !== 'death' || i < 4) expect(opaque(img, f.frame), `${k} ${a}_${d}_${i}`).toBeGreaterThan(20);
      }
    }
  });
  it('item, component, order and class icons plus 18 portraits exist', () => {
    const icons = JSON.parse(readFileSync(`${DIR}/icons.json`, 'utf8')).frames;
    for (const it of ITEMS) expect(icons[`i${it.id}`]).toBeTruthy();
    for (const c of COMP_CODES) expect(icons[c]).toBeTruthy();
    for (const o of ['farm', 'push', 'defend', 'retreat', 'jungle', 'raid_top', 'raid_bot', 'boss']) expect(icons[`o_${o}`]).toBeTruthy();
    const portraits = JSON.parse(readFileSync(`${DIR}/portraits.json`, 'utf8')).frames;
    for (const c of CHAMPIONS) expect(portraits[c.id]).toBeTruthy();
  });
  it('map, tiles, decor, structures and VFX are present', () => {
    const map = decodePNG(readFileSync(`${DIR}/map.png`));
    expect(map.w).toBe(1600); expect(map.h).toBe(900);
    const vfx = JSON.parse(readFileSync(`${DIR}/vfx.json`, 'utf8')).frames;
    for (const k of ['fireExplosion', 'iceBurst', 'shadowPuff', 'poisonBurst', 'hitSpark', 'shieldBubble', 'heal', 'stun', 'bloodNova', 'titanSlam', 'p_towerBlue', 'recallRing', 'deathPuff', 'crystalShatter']) expect(vfx[`${k}_0`], k).toBeTruthy();
    const st = JSON.parse(readFileSync(`${DIR}/structures.json`, 'utf8')).frames;
    for (const k of ['tower_0_idle_0', 'tower_1_ruin_0', 'crystal_0_idle_0', 'crystal_1_ruin_0']) expect(st[k]).toBeTruthy();
    expect(Object.keys(JSON.parse(readFileSync(`${DIR}/tiles.json`, 'utf8')).frames).length).toBeGreaterThan(10);
    expect(Object.keys(JSON.parse(readFileSync(`${DIR}/decor.json`, 'utf8')).frames).length).toBeGreaterThan(15);
  });
  it('every VFX/zone key used by the renderer exists', async () => {
    const { VFX_FOR, ZONE_FOR } = await import('../src/render/vfxMap');
    const vfx = JSON.parse(readFileSync(`${DIR}/vfx.json`, 'utf8')).frames;
    for (const v of [...Object.values(VFX_FOR), ...Object.values(ZONE_FOR)]) expect(vfx[`${v.key}_0`], v.key).toBeTruthy();
  });
});
