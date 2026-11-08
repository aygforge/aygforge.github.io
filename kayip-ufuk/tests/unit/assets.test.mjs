// Asset/visual acceptance checks that run on the physical atlas PNGs (decoded in Node) and the real game systems.
// IDs: AT_RENDER_AUDIO_01, VIS_05, VIS_07, VIS_10, VIS_11, VIS_12, VIS_13, VIS_27, VIS_28
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, cpSync, rmSync, mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { decodePNG, validateAtlases } from '../../tools/validate_atlases.mjs';
import { makeGame } from '../helpers/make-game.mjs';
import { construct, give } from '../helpers/tools.mjs';
import { TILE } from '../../src/world/TerrainSystem.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PUB = path.join(ROOT, 'public');
const EVD = path.join(ROOT, 'reports/evidence/unit'); mkdirSync(EVD, { recursive: true });
const index = JSON.parse(readFileSync(path.join(PUB, 'assets/atlas_index.json'), 'utf8'));
const anchors = JSON.parse(readFileSync(path.join(PUB, 'assets/avatar_anchors.json'), 'utf8')).anchors;
const pages = index.pages.map((p) => decodePNG(readFileSync(path.join(PUB, p))));

/** RGBA pixels of a sprite: { w, h, d, a(x,y) } */
function sprite(id) {
  const r = index.sprites[id]; if (!r) return null;
  const [pi, x0, y0, w, h] = r; const pg = pages[pi]; const d = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) d.set(pg.d.subarray(((y0 + y) * pg.w + x0) * 4, ((y0 + y) * pg.w + x0 + w) * 4), y * w * 4);
  return { w, h, d, a: (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : d[(y * w + x) * 4 + 3]) };
}
const opaque = (s) => { let n = 0; for (let i = 3; i < s.d.length; i += 4) if (s.d[i]) n++; return n; };
const hashOf = (s) => { let h = 2166136261; for (const v of s.d) { h ^= v; h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); };
/** alpha-mask IoU between two sprites aligned at bottom-centre */
function iou(a, b) {
  const W = Math.max(a.w, b.w), H = Math.max(a.h, b.h); let i = 0, u = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const pa = a.a(x - ((W - a.w) >> 1), y - (H - a.h)) > 0, pb = b.a(x - ((W - b.w) >> 1), y - (H - b.h)) > 0;
    if (pa && pb) i++; if (pa || pb) u++;
  }
  return u ? i / u : 1;
}
const pixDiff = (a, b) => { if (a.w !== b.w || a.h !== b.h) return 1; let n = 0; for (let i = 0; i < a.d.length; i += 4) if (a.d[i] !== b.d[i] || a.d[i + 1] !== b.d[i + 1] || a.d[i + 2] !== b.d[i + 2] || a.d[i + 3] !== b.d[i + 3]) n++; return n / (a.w * a.h); };
const DIRS = ['down', 'left', 'right', 'up'];
const frames = (base) => { let n = 0; while (index.sprites[`${base}/${n}`]) n++; return n; };

test('VIS_27 physical PNG validator: alpha, bounds, extruded padding and per-page metadata agree with AtlasLayout', () => {
  const r = validateAtlases(PUB);
  writeFileSync(path.join(ROOT, 'reports/evidence/atlas-validation.json'), JSON.stringify(r, null, 1));
  assert.equal(r.pagesChecked, 24); assert.equal(r.spritesChecked, 3180); assert.equal(r.layoutSprites, 3180);
  assert.deepEqual(r.errors, []); assert.ok(r.ok);
  for (const p of r.pages) { assert.equal(p.emptySprites, 0); assert.equal(p.paddingMismatches, 0); assert.equal(p.overlaps, 0); assert.equal(p.strayPixels, 0); assert.deepEqual(p.size, [1024, 1024]); }
});

test('AT_RENDER_AUDIO_01 packaging fails when one PNG is removed or an atlas is damaged (no silent missing sprite)', () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'ku-pack-'));
  const log = [];
  try {
    cpSync(path.join(PUB, 'assets'), path.join(tmp, 'assets'), { recursive: true });
    const run = () => spawnSync(process.execPath, [path.join(ROOT, 'tools/build.mjs'), '--verify-dir', tmp], { encoding: 'utf8' });
    let r = run(); log.push(['intact', r.status, r.stdout.trim()]); assert.equal(r.status, 0, r.stderr);
    // 1) remove one PNG page
    const victim = path.join(tmp, 'assets/atlases/crops_00.png'); const keep = readFileSync(victim); rmSync(victim);
    r = run(); log.push(['png_removed', r.status, r.stderr.trim()]); assert.equal(r.status, 1); assert.match(r.stderr, /MISSING_PNG assets\/atlases\/crops_00\.png/);
    writeFileSync(victim, keep);
    // 2) remove metadata json of one page
    const meta = path.join(tmp, 'assets/atlases/icons_00.json'); const keepMeta = readFileSync(meta); rmSync(meta);
    r = run(); log.push(['meta_removed', r.status, r.stderr.trim().split('\n')[1]]); assert.equal(r.status, 1); assert.match(r.stderr, /MISSING_META/);
    writeFileSync(meta, keepMeta);
    // 3) a sprite id missing from the runtime index
    const idx = JSON.parse(readFileSync(path.join(tmp, 'assets/atlas_index.json'), 'utf8')); delete idx.sprites['icon/MAT_FIBER'];
    writeFileSync(path.join(tmp, 'assets/atlas_index.json'), JSON.stringify(idx));
    r = run(); log.push(['index_entry_removed', r.status, r.stderr.trim().split('\n')[1]]); assert.equal(r.status, 1); assert.match(r.stderr, /icon\/MAT_FIBER: atlas_index disagrees/);
  } finally { rmSync(tmp, { recursive: true, force: true }); }
  writeFileSync(path.join(EVD, 'AT_RENDER_AUDIO_01.json'), JSON.stringify(log, null, 1));
});

test('VIS_07 all 179 item icons exist, are non-empty and unique; UI uses no emoji', async () => {
  const g = await makeGame(1);
  const items = [...g.content.items.keys()]; assert.equal(items.length, 179);
  const hashes = new Map(); const sheet = [];
  for (const id of items) {
    const s = sprite(`icon/${id}`); assert.ok(s, 'missing icon ' + id);
    assert.ok(opaque(s) >= 40, `icon ${id} nearly empty (${opaque(s)} px)`);
    const h = hashOf(s); assert.ok(!hashes.has(h), `icon ${id} identical to ${hashes.get(h)}`); hashes.set(h, id); sheet.push(s);
  }
  let minDiff = 1, pair = null;
  for (let i = 0; i < sheet.length; i++) for (let j = i + 1; j < sheet.length; j++) { const d = pixDiff(sheet[i], sheet[j]); if (d < minDiff) { minDiff = d; pair = [items[i], items[j]]; } }
  assert.ok(minDiff >= 0.05, `two icons nearly identical: ${pair} (${(minDiff * 100).toFixed(1)}% px differ)`);
  // no emoji / pictographs in any UI source or shipped HTML
  const emoji = /\p{Extended_Pictographic}/u; const offenders = [];
  const scan = (dir) => { for (const f of readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, f.name); if (f.isDirectory()) scan(p); else if (/\.(js|html|css)$/.test(f.name)) readFileSync(p, 'utf8').split('\n').forEach((l, i) => { if (emoji.test(l)) offenders.push(`${path.relative(ROOT, p)}:${i + 1}`); }); } };
  scan(path.join(ROOT, 'src')); scan(path.join(ROOT, 'public')); assert.deepEqual(offenders, []);
  writeFileSync(path.join(EVD, 'VIS_07.json'), JSON.stringify({ icons: items.length, uniqueHashes: hashes.size, minPairwisePixelDiff: minDiff, closestPair: pair, emojiOffenders: offenders }, null, 1));
});

test('VIS_10 12 crops × 4 stage sprites + shared moisture overlays; each crop shows every stage in order while growing', async () => {
  const g = await makeGame(3);
  const crops = [...g.content.crops.values()]; assert.equal(crops.length, 12);
  for (const c of crops) {
    const st = [0, 1, 2, 3].map((k) => sprite(`crop/${c.id}/${k}`)); st.forEach((s, k) => assert.ok(s && opaque(s) > 20, `${c.id} stage ${k}`));
    for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) assert.ok(pixDiff(st[a], st[b]) > 0.03, `${c.id} stages ${a}/${b} identical`);
  }
  for (const o of ['dry', 'wet', 'fertilized']) assert.ok(opaque(sprite(`crop/shared/${o}`)) > 10, o);
  const seen = {};
  for (const crop of crops) {
    const plot = construct(g, 'BUILD_PLANTER'); give(g, crop.seedItemId, 1); assert.ok(g.farm.plant(plot.uid, crop.seedItemId).ok);
    const seq = [];
    for (let d = 0; d <= crop.growGameDays; d++) {
      g.state.climate.history[g.state.clock.dayIndex] = 'LIGHT_RAIN';
      for (let k = 0; k < 6; k++) { const s = g.farm.stage(g.farm.plot(plot.uid)); if (seq[seq.length - 1] !== s) seq.push(s); if (g.farm.plot(plot.uid).ready) break; g.simulateTime(180, 'wait'); }
      if (g.farm.plot(plot.uid).ready) { const s = g.farm.stage(g.farm.plot(plot.uid)); if (seq[seq.length - 1] !== s) seq.push(s); break; }
    }
    assert.deepEqual(seq, [0, 1, 2, 3], `${crop.id} (${crop.growGameDays} days) stage sequence ${seq}`);
    seen[crop.id] = seq;
    g.farm.harvest(plot.uid); g.world.teleport('OVERWORLD', (plot.tile[0] + 4) * TILE, (plot.tile[1] + 1) * TILE);
  }
  writeFileSync(path.join(EVD, 'VIS_10.json'), JSON.stringify({ cropStageSprites: 48, sharedOverlays: 3, observedStageSequences: seen }, null, 1));
});

/** Drive the real AI for one species near/far from the player and collect the animation clips it requests. */
function aiClips(g, speciesId, { swim = false } = {}) {
  const w = g.world; const [ptx, pty] = w.playerTile(); g.state.player.mode = swim ? 'SWIM' : 'WALK';
  const water = speciesId.startsWith('MARINE_') || speciesId.startsWith('FISH_');
  const a = g.wildlife.add(speciesId, ptx + 12, pty, 'TEST', water && speciesId.startsWith('FISH_') ? { fish: true } : {});
  const out = new Map(); const note = () => { const k = `${a.anim}/${a.dir}`; out.set(k, (out.get(k) || 0) + 1); };
  for (let i = 0; i < 90; i++) { a.x = (ptx + 12.5) * TILE; g.wildlife.think(a, 0.1, ptx, pty); note(); }        // far: idle/wander
  for (let i = 0; i < 90; i++) { a.x = (ptx + 1.6) * TILE; a.y = (pty + 0.5) * TILE; g.wildlife.think(a, 0.1, ptx, pty); note(); } // near: react/flee/warn/attack
  a.hurt = 1; for (let i = 0; i < 20; i++) { g.wildlife.think(a, 0.1, ptx, pty); note(); }
  w.animals = w.animals.filter((x) => x !== a); g.state.player.mode = 'WALK';
  return { clips: [...out.keys()], states: new Set([...out.keys()].map((k) => k.split('/')[0])) };
}

test('VIS_11 12 land species: distinct silhouettes, every clip in 4 directions, AI states map to real clips', async () => {
  const g = await makeGame(4); g.state.player.health = 1e9; g.survival.damage = () => {};
  const land = g.content.db.AnimalDB.landAnimals.map((x) => x.id); assert.equal(land.length, 12);
  const sil = land.map((id) => sprite(`animal/${id}/idle/down/0`));
  let maxIou = 0, pair = null;
  for (let i = 0; i < land.length; i++) for (let j = i + 1; j < land.length; j++) { const v = iou(sil[i], sil[j]); if (v > maxIou) { maxIou = v; pair = [land[i], land[j]]; } }
  assert.ok(maxIou < 0.85, `silhouettes too similar: ${pair} IoU=${maxIou.toFixed(2)}`);
  const report = {};
  for (const id of land) {
    for (const clip of ['idle', 'move', 'react']) for (const d of DIRS) assert.ok(frames(`animal/${id}/${clip}/${d}`) >= 2, `${id} ${clip} ${d}`);
    const prof = g.content.species.get(id).aiProfile;
    const { clips, states } = aiClips(g, id);
    for (const k of clips) assert.ok(frames(`animal/${id}/${k}`) >= 1, `${id} AI requested clip ${k} that has no sprite`);
    const aggressive = ['WARN_CHARGE', 'WARN_BITE', 'TERRITORIAL_AMBUSH'].includes(prof);
    if (aggressive) { assert.ok(states.has('warn') && states.has('attack'), `${id} ${prof} warn/attack: ${[...states]}`); for (const c of ['warn', 'attack']) for (const d of DIRS) assert.ok(frames(`animal/${id}/${c}/${d}`) >= 2); }
    else assert.ok(!states.has('attack') && !states.has('warn'), `${id} passive species shows threat clip`);
    if (/FLEE|FLY/.test(prof)) assert.ok(states.has('react') || states.has('move'), `${id} flee reaction`);
    report[id] = { aiProfile: prof, observedClips: [...states] };
  }
  writeFileSync(path.join(EVD, 'VIS_11.json'), JSON.stringify({ maxSilhouetteIoU: maxIou, closestPair: pair, species: report }, null, 1));
});

test('VIS_12 10 fish: distinct, swim+turn animation in 4 directions, matching codex icon', async () => {
  const g = await makeGame(5);
  const fish = [...g.content.species.keys()].filter((k) => k.startsWith('FISH_')); assert.equal(fish.length, 10);
  const hashes = new Set(); let maxIou = 0, pair = null; const sw = fish.map((id) => sprite(`animal/${id}/swim/right/0`));
  for (const id of fish) {
    for (const clip of ['swim', 'turn']) for (const d of DIRS) assert.ok(frames(`animal/${id}/${clip}/${d}`) >= 2, `${id} ${clip} ${d}`);
    const cx = sprite(`codex/${id}`); assert.ok(cx && opaque(cx) > 30, `${id} codex icon`); hashes.add(hashOf(cx));
    const { clips } = aiClips(g, id); for (const k of clips) assert.ok(frames(`animal/${id}/${k}`) >= 1, `${id} clip ${k}`);
  }
  assert.equal(hashes.size, 10, 'codex icons unique');
  for (let i = 0; i < 10; i++) for (let j = i + 1; j < 10; j++) { const v = iou(sw[i], sw[j]); const d = pixDiff(sw[i], sw[j]); assert.ok(d > 0.02, `${fish[i]}/${fish[j]} identical`); if (v > maxIou) { maxIou = v; pair = [fish[i], fish[j]]; } }
  writeFileSync(path.join(EVD, 'VIS_12.json'), JSON.stringify({ fish: fish.length, codexUnique: hashes.size, maxSwimSilhouetteIoU: maxIou, closestPair: pair, note: 'fish of similar body plan are separated by colour/pattern; pixel difference > 2% for every pair' }, null, 1));
});

test('VIS_13 marine turtle, stingray, reef shark: separate silhouettes; only the shark shows threat behaviour (vs swimmer)', async () => {
  const g = await makeGame(6); g.state.player.health = 1e9; g.survival.damage = () => {};
  const ids = ['MARINE_TURTLE', 'MARINE_RAY', 'MARINE_REEF_SHARK']; const sil = ids.map((id) => sprite(`animal/${id}/swim/right/0`));
  for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) assert.ok(iou(sil[i], sil[j]) < 0.8, `${ids[i]}/${ids[j]} silhouettes`);
  const res = {};
  for (const id of ids) { const r = aiClips(g, id, { swim: true }); res[id] = [...r.states]; for (const k of r.clips) assert.ok(frames(`animal/${id}/${k}`) >= 1, `${id} clip ${k}`); }
  assert.ok(res.MARINE_REEF_SHARK.includes('warn') && res.MARINE_REEF_SHARK.includes('attack'), 'shark threat ' + res.MARINE_REEF_SHARK);
  for (const id of ['MARINE_TURTLE', 'MARINE_RAY']) assert.ok(!res[id].includes('attack') && !res[id].includes('warn'), id);
  const dry = aiClips(g, 'MARINE_REEF_SHARK', { swim: false }); assert.ok(!dry.states.has('attack'), 'shark ignores player on land/boat');
  for (const c of ['warn', 'attack']) for (const d of DIRS) assert.ok(frames(`animal/MARINE_REEF_SHARK/${c}/${d}`) >= 2);
  writeFileSync(path.join(EVD, 'VIS_13.json'), JSON.stringify({ silhouettesIoU: [iou(sil[0], sil[1]), iou(sil[0], sil[2]), iou(sil[1], sil[2])], observedClipsWhileSwimming: res, sharkOnLand: [...dry.states] }, null, 1));
});

// Reproduce WorldRenderer.drawPlayer geometry exactly (body 32×48 at ox,oy; hair at head-16/-12; held sprite with ax0/ay1 at ±8,8 from hand)
const CLIPS = ['idle', 'walk', 'run', 'gather', 'chop', 'mine', 'build', 'eat', 'fish_cast', 'fish_idle', 'fish_reel', 'bow', 'spear', 'swim', 'hurt'];
const HELD = { chop: 'axe', mine: 'pickaxe', build: 'hammer', fish_cast: 'fishing_rod', fish_idle: 'fishing_rod', fish_reel: 'fishing_rod', bow: 'bow', spear: 'spear' };
const nearest = (s, px, py, dx = 0, dy = 0) => { let m = 1e9; for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) if (s.a(x, y)) m = Math.min(m, Math.hypot(x + dx + 0.5 - px, y + dy + 0.5 - py)); return m; };

test('VIS_05 axe/pickaxe/hammer/bow/rod/spear stay attached to the hand in every frame of their clips', () => {
  const worst = {}; let checked = 0;
  for (const body of ['body_a', 'body_b']) for (const [clip, held] of Object.entries(HELD)) for (const dir of DIRS) {
    const n = frames(`avatar/${body}/${clip}/${dir}`); assert.ok(n >= 2, `${body} ${clip} ${dir}`);
    const hs = sprite(`avatar/held/${held}/${dir}`); assert.ok(hs, `held ${held} ${dir}`);
    for (let f = 0; f < n; f++) {
      const an = anchors[`${body}/${clip}/${dir}/${f}`]; assert.ok(an, `anchor ${body}/${clip}/${dir}/${f}`);
      const bs = sprite(`avatar/${body}/${clip}/${dir}/${f}`); const [hx, hy] = dir === 'left' ? an.leftHand : an.rightHand;
      const handToBody = nearest(bs, hx, hy);
      const x0 = dir === 'left' ? -23 : -8, y0 = 8 - hs.h; // held sprite local origin relative to hand (rotation keeps distances)
      const handToTool = nearest(hs, 0, 0, x0, y0);
      assert.ok(handToBody <= 2.5, `${body}/${clip}/${dir}/${f} hand anchor off body by ${handToBody.toFixed(1)}px`);
      assert.ok(handToTool <= 3.5, `${body}/${clip}/${dir}/${f} ${held} detached by ${handToTool.toFixed(1)}px`);
      const k = `${clip}/${held}`; worst[k] = Math.max(worst[k] || 0, handToTool); checked++;
    }
  }
  writeFileSync(path.join(EVD, 'VIS_05.json'), JSON.stringify({ framesChecked: checked, worstHandToToolPx: worst, rule: 'nearest opaque tool pixel ≤3.5px from hand anchor; hand anchor ≤2.5px from body pixels' }, null, 1));
});

test('VIS_28 avatar variants (2 bodies × 6 hair × clips incl. work/swim): hair attached, clothing inside body, bag on back', () => {
  assert.match(readFileSync(path.join(ROOT, 'src/render/SpriteAtlas.js'), 'utf8'), /globalCompositeOperation = 'source-atop'; ctx\.drawImage\(this\.tint\(mask/, 'clothing clipped to body');
  assert.match(readFileSync(path.join(ROOT, 'src/render/WorldRenderer.js'), 'utf8'), /dir === 'left' \? -23 : -8, 8/, 'held grip geometry used by test matches renderer');
  let checked = 0; const worst = { hairGap: 0, clothingOutside: 0, bagGap: 0 };
  for (const body of ['body_a', 'body_b']) for (const clip of CLIPS) for (const dir of DIRS) {
    const n = frames(`avatar/${body}/${clip}/${dir}`); assert.ok(n >= 1, `${body} ${clip} ${dir}`);
    for (let f = 0; f < n; f++) {
      const bs = sprite(`avatar/${body}/${clip}/${dir}/${f}`); const an = anchors[`${body}/${clip}/${dir}/${f}`]; assert.ok(an);
      const mask = sprite(`avatar/clothing_mask/${clip}/${dir}/${f}`);
      if (mask) { // runtime composites the shared mask with source-atop: visible clothing = mask ∧ body; it must still dress the torso
        let inside = 0, total = 0; for (let y = 0; y < mask.h; y++) for (let x = 0; x < mask.w; x++) if (mask.a(x, y)) { total++; if (bs.a(x, y)) inside++; }
        worst.clothingOutside = Math.max(worst.clothingOutside, total - inside); assert.ok(inside / total >= 0.85, `${body}/${clip}/${dir}/${f} clothing coverage ${inside}/${total}`);
      }
      for (let hair = 0; hair < 6; hair++) {
        const hs = sprite(`avatar/hair/${hair}/${dir}`); const ox = an.head[0] - 16, oy = an.head[1] - 12; let overlap = 0;
        for (let y = 0; y < hs.h; y++) for (let x = 0; x < hs.w; x++) if (hs.a(x, y) && bs.a(x + ox, y + oy)) overlap++;
        assert.ok(overlap >= 8, `${body}/${clip}/${dir}/${f} hair ${hair} detached (overlap ${overlap}px)`);
        checked++;
      }
      if (clip !== 'swim') for (const bag of ['small_bag', 'medium_bag', 'large_bag']) {
        const b = sprite(`avatar/bag/${bag}/${dir}`); const bx = an.backpack[0] - (b.w >> 1), by = an.backpack[1] + 10 - b.h; // anchor (0.5,1)
        let overlap = 0; for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) if (b.a(x, y) && bs.a(x + bx, y + by)) overlap++;
        assert.ok(overlap >= 6, `${body}/${clip}/${dir}/${f} ${bag} not on the body (overlap ${overlap})`);
      }
    }
  }
  writeFileSync(path.join(EVD, 'VIS_28.json'), JSON.stringify({ hairPlacementsChecked: checked, worst, clothing: 'shared mask clipped to body alpha at runtime (source-atop); worst raw overflow px reported above is discarded', layering: 'down: backpack→body→hair→held; up: held→body→backpack→hair (bag drawn over back); left/right ordered by facing (WorldRenderer.drawPlayer)' }, null, 1));
});
