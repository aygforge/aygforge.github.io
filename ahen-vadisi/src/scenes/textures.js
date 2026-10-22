// Procedural sanatı Phaser doku yöneticisine kaydeder; animasyonları oluşturur.
import { buildTileset } from '../art/tiles.js';
import { humanSheet, playerLook, lookKey, npcSheet, NPC_LOOKS, weaponSprite, offhandSprite, HUMAN_FRAMES, HUMAN_W, HUMAN_H } from '../art/characters.js';
import { monsterSheet, MONSTER_SPRITES } from '../art/monsters.js';
import { OBJECT_SPRITES, EFFECT_SPRITES, makeSoftCircle, makeVignette, makeTelegraphTex } from '../art/objects.js';
import { ITEM_LIST } from '../data/items.js';
import { ART_SCALE } from '../data/constants.js';

// PB dizisini yatay şerit canvas'a yerleştirip numaralı kareler ekler
export function addSheet(scene, key, pbs, scale = ART_SCALE, names = null) {
  if (scene.textures.exists(key)) return;
  const fw = Math.max(...pbs.map((p) => p.w)), fh = Math.max(...pbs.map((p) => p.h));
  const c = document.createElement('canvas');
  c.width = fw * scale * pbs.length; c.height = fh * scale;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  pbs.forEach((pb, i) => pb.drawTo(ctx, i * fw * scale + Math.floor((fw - pb.w) / 2) * scale, (fh - pb.h) * scale, scale));
  const tex = scene.textures.addCanvas(key, c);
  pbs.forEach((_, i) => tex.add(names ? names[i] : i, 0, i * fw * scale, 0, fw * scale, fh * scale));
  return tex;
}

function anim(scene, key, tex, frames, rate, repeat = -1) {
  if (scene.anims.exists(key)) return;
  scene.anims.create({ key, frames: frames.map((f) => ({ key: tex, frame: f })), frameRate: rate, repeat });
}

export function ensurePlayerTexture(scene, cls, equipment) {
  const key = lookKey(cls, equipment);
  if (!scene.textures.exists(key)) {
    addSheet(scene, key, humanSheet(playerLook(cls, equipment)), ART_SCALE, HUMAN_FRAMES);
    anim(scene, key + '_idle', key, ['idle0', 'idle1'], 2.5);
    anim(scene, key + '_walk', key, ['walk0', 'walk1', 'walk2', 'walk3'], 9);
    anim(scene, key + '_atk', key, ['atk0', 'atk1', 'atk2'], 12, 0);
    anim(scene, key + '_cast', key, ['cast0', 'cast1'], 8, 0);
  }
  return key;
}

export function registerAll(scene, onProgress = () => {}) {
  const t0 = performance.now();
  // tileset
  if (!scene.textures.exists('tiles')) scene.textures.addCanvas('tiles', buildTileset((p) => onProgress(p * 0.5)));
  onProgress(0.5);
  // canavarlar
  for (const s of MONSTER_SPRITES) {
    const key = 'mon_' + s;
    const sheet = monsterSheet(s);
    addSheet(scene, key, sheet.frames, ART_SCALE, sheet.names);
    if (sheet.anims) {   // kendi animasyon tablosu olan çizimler (kurtlar)
      for (const [a, d] of Object.entries(sheet.anims)) anim(scene, key + '_' + a, key, d.frames, d.fps, d.repeat ?? -1);
      continue;
    }
    anim(scene, key + '_idle', key, ['idle0', 'idle1'], 3);
    anim(scene, key + '_walk', key, ['walk0', 'walk1', 'walk2', 'walk3'], 8);
    anim(scene, key + '_atk', key, ['atk0', 'atk1'], 7, 0);
    if (sheet.names.includes('die0')) {
      anim(scene, key + '_hurt', key, ['hurt0'], 6, 0);
      anim(scene, key + '_die', key, ['hurt0', 'die0', 'die1', 'die2'], 8, 0);
    }
  }
  onProgress(0.65);
  for (const k of Object.keys(NPC_LOOKS)) {
    addSheet(scene, k, npcSheet(k), ART_SCALE, ['idle0', 'idle1']);
    anim(scene, k + '_idle', k, ['idle0', 'idle1'], 1.6);
  }
  // silahlar / yardımcı el
  for (const t of ITEM_LIST) {
    if (t.slot === 'weapon') {
      const w = weaponSprite(t.id);
      addSheet(scene, 'wpn_' + t.id, [w.pb]);
      scene.textures.get('wpn_' + t.id).customData = { ox: w.ox / w.pb.w, oy: w.oy / w.pb.h };
    } else if (t.slot === 'offhand') {
      const o = offhandSprite(t.id);
      addSheet(scene, 'off_' + t.id, [o.pb]);
    }
  }
  onProgress(0.75);
  for (const [k, fn] of Object.entries(OBJECT_SPRITES)) {
    const pbs = fn();
    addSheet(scene, 'obj_' + k, pbs);
    if (pbs.length > 1) anim(scene, 'obj_' + k + '_a', 'obj_' + k, pbs.map((_, i) => i), k === 'campfire' || k === 'torch' || k === 'brazier_fire' ? 8 : 4);
  }
  for (const [k, fn] of Object.entries(EFFECT_SPRITES)) {
    const pbs = fn();
    addSheet(scene, 'fx_' + k, pbs);
    if (pbs.length > 1) anim(scene, 'fx_' + k + '_a', 'fx_' + k, pbs.map((_, i) => i), { slash: 24, spark: 20, explosion: 14, ice: 14, levelup: 10, crimson: 14, spirit: 14, ash_puff: 12, shatter: 14, chain: 20, fire_ground: 9 }[k] || 8, ['slash', 'spark', 'explosion', 'ice', 'crimson', 'spirit', 'heal', 'ash_puff', 'shatter'].includes(k) ? 0 : -1);
  }
  onProgress(0.9);
  const canv = (key, c) => { if (!scene.textures.exists(key)) scene.textures.addCanvas(key, c); };
  canv('light', makeSoftCircle(128, 'rgba(255,220,160,1)'));
  canv('light_blue', makeSoftCircle(128, 'rgba(120,200,255,1)'));
  canv('light_white', makeSoftCircle(128, 'rgba(255,255,255,1)'));
  canv('vignette', makeVignette(512, 512, 0.85));
  canv('vignette_soft', makeVignette(512, 512, 0.45));
  for (const k of ['circle', 'rect', 'ring', 'cone', 'fill']) canv('tg_' + k, makeTelegraphTex(k));
  onProgress(1);
  return performance.now() - t0;
}

export { HUMAN_W, HUMAN_H };
