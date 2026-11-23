/**
 * Deterministic procedural pixel-art generator.
 * Produces PNG sprite sheets, Phaser JSON atlases and an animation manifest in assets/generated/.
 * Run: npm run generate:assets
 */
import { mkdirSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs';
import { PC } from './gen/canvas';
import { encodePNG } from './gen/png';
import { writeAtlas, AtlasResult } from './gen/atlas';
import { CHAMP_ART, ANIMS, ANIM_RATE, renderFrame } from './gen/champions';
import { DIRS } from './gen/humanoid';
import { CREATURES, CREATURE_ANIMS, CREATURE_RATE } from './gen/creatures';
import { makeTiles, makeDecor, composeMap, tower, crystal, fountainArt } from './gen/world_art';
import { VFX, makeIcons, makePortraits } from './gen/vfx_icons';

const OUT = 'assets/generated';
mkdirSync(OUT, { recursive: true });
for (const f of readdirSync(OUT)) unlinkSync(`${OUT}/${f}`);
const t0 = Date.now();
const atlases: AtlasResult[] = [];
const manifest: any = { version: 1, generated: 'deterministic', champions: {}, units: {}, vfx: {}, structures: {}, atlases: [], runtimeDecor: [], counts: {} };
let frameCount = 0;

// champions
for (const id of Object.keys(CHAMP_ART)) {
  const frames: [string, PC][] = [];
  for (const a of Object.keys(ANIMS)) for (const d of DIRS) for (let i = 0; i < ANIMS[a]; i++) frames.push([`${a}_${d}_${i}`, renderFrame(CHAMP_ART[id], a, d, i)]);
  atlases.push(writeAtlas(OUT, `champ_${id}`, frames));
  frameCount += frames.length;
  manifest.champions[id] = { atlas: `champ_${id}`, size: 48, anims: Object.fromEntries(Object.keys(ANIMS).map((a) => [a, { frames: ANIMS[a], rate: ANIM_RATE[a], repeat: a === 'idle' || a === 'walk' || a === 'recall' ? -1 : 0 }])) };
  process.stdout.write('.');
}
// creatures, minions, summons, bosses
for (const cr of CREATURES) {
  const frames: [string, PC][] = [];
  for (const a of Object.keys(CREATURE_ANIMS)) for (const d of DIRS) for (let i = 0; i < CREATURE_ANIMS[a]; i++) frames.push([`${a}_${d}_${i}`, cr.render(a, d, i)]);
  atlases.push(writeAtlas(OUT, `unit_${cr.key}`, frames));
  frameCount += frames.length;
  manifest.units[cr.key] = { atlas: `unit_${cr.key}`, size: cr.size, anims: Object.fromEntries(Object.keys(CREATURE_ANIMS).map((a) => [a, { frames: CREATURE_ANIMS[a], rate: CREATURE_RATE[a], repeat: a === 'idle' || a === 'walk' ? -1 : 0 }])) };
  process.stdout.write('+');
}
// structures
{
  const frames: [string, PC][] = [];
  for (const t of [0, 1] as const) {
    for (let i = 0; i < 4; i++) frames.push([`tower_${t}_idle_${i}`, tower(t, 'idle', i)]);
    for (let i = 0; i < 2; i++) frames.push([`tower_${t}_attack_${i}`, tower(t, 'attack', i)]);
    frames.push([`tower_${t}_ruin_0`, tower(t, 'ruin', 0)]);
    for (let i = 0; i < 6; i++) frames.push([`crystal_${t}_idle_${i}`, crystal(t, 'idle', i)]);
    frames.push([`crystal_${t}_hit_0`, crystal(t, 'hit', 0)]);
    frames.push([`crystal_${t}_ruin_0`, crystal(t, 'ruin', 0)]);
    frames.push([`fountain_${t}`, fountainArt(t)]);
  }
  atlases.push(writeAtlas(OUT, 'structures', frames));
  frameCount += frames.length;
  manifest.structures = { tower: { idle: 4, attack: 2 }, crystal: { idle: 6 } };
}
// tiles, decor, map
const T = makeTiles(), D = makeDecor();
atlases.push(writeAtlas(OUT, 'tiles', Object.entries(T)));
atlases.push(writeAtlas(OUT, 'decor', Object.entries(D)));
frameCount += Object.keys(T).length + Object.keys(D).length;
const map = composeMap(T, D);
writeFileSync(`${OUT}/map.png`, encodePNG(map.img.w, map.img.h, map.img.d));
manifest.runtimeDecor = map.decorList;
const mini = new PC(320, 180);
for (let y = 0; y < 180; y++) for (let x = 0; x < 320; x++) mini.set(x, y, map.img.get(x * 5 + 2, y * 5 + 2));
writeFileSync(`${OUT}/minimap.png`, encodePNG(mini.w, mini.h, mini.d));
// vfx
{
  const frames: [string, PC][] = [];
  for (const v of VFX) {
    for (let i = 0; i < v.frames; i++) { const c = new PC(v.size, v.size); v.draw(c, i, v.frames); frames.push([`${v.key}_${i}`, c]); }
    manifest.vfx[v.key] = { frames: v.frames, rate: v.rate, loop: !!v.loop, size: v.size };
  }
  atlases.push(writeAtlas(OUT, 'vfx', frames));
  frameCount += frames.length;
}
// icons + portraits
const icons = makeIcons();
atlases.push(writeAtlas(OUT, 'icons', Object.entries(icons), 512));
const portraits = makePortraits();
atlases.push(writeAtlas(OUT, 'portraits', Object.entries(portraits), 512));
frameCount += Object.keys(icons).length + Object.keys(portraits).length;

manifest.atlases = atlases.map((a) => a.name);
manifest.counts = { atlases: atlases.length, frames: frameCount, champions: Object.keys(CHAMP_ART).length, units: CREATURES.length, vfx: VFX.length, icons: Object.keys(icons).length, portraits: Object.keys(portraits).length, tiles: Object.keys(T).length, decor: Object.keys(D).length };
writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 1));
console.log(`\nGenerated ${atlases.length} atlases, ${frameCount} frames, map ${map.img.w}x${map.img.h} in ${Date.now() - t0}ms`);
for (const a of atlases) console.log(`  ${a.name}: ${a.w}x${a.h} (${a.frames})`);
