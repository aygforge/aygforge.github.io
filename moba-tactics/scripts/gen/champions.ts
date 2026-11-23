import { PC, hex, ramp, RGBA } from './canvas';
import { CharSpec, DIRS, Dir4, P0, Pose, drawCharacter } from './humanoid';

export const ANIMS: Record<string, number> = { idle: 4, walk: 6, attack: 5, s1: 5, s2: 5, ult: 6, hit: 2, death: 6, recall: 4 };
export const ANIM_RATE: Record<string, number> = { idle: 5, walk: 10, attack: 14, s1: 12, s2: 12, ult: 10, hit: 10, death: 8, recall: 6 };

type Arch = 'slash' | 'thrust' | 'overhead' | 'cast' | 'raise' | 'slam' | 'throw' | 'shield' | 'shoot' | 'dash' | 'channel' | 'summon' | 'stab' | 'punch' | 'crossShot';

interface ChampArt {
  spec: CharSpec;
  attack: Arch; s1: Arch; s2: Arch; ult: Arch;
  glow: string; // signature colour
  glowS1?: string; glowS2?: string; glowUlt?: string;
}

const g = (h: string, a = 220): RGBA => hex(h, a);

function arch(a: Arch, i: number, n: number, col: RGBA | null, big = false): Pose {
  const t = i / (n - 1);
  const p: Pose = { ...P0 };
  const pick = (arr: number[]) => arr[Math.min(arr.length - 1, Math.round(t * (arr.length - 1)))];
  switch (a) {
    case 'slash':
      p.armF = pick([0.3, -2.1, -2.4, 1.3, 1.7, 0.6]); p.bendF = pick([0.4, 0.2, 0.1, 0.1, 0.2, 0.4]);
      p.lean = pick([0, -1, -1, 2, 2, 0]); p.wpn = pick([0, -0.4, -0.5, 0.5, 0.7, 0]);
      p.armB = pick([-0.2, 0.4, 0.5, -0.6, -0.6, -0.2]);
      break;
    case 'thrust':
      p.armF = pick([0.4, 0.1, 1.55, 1.55, 0.6]); p.bendF = pick([1.4, 1.6, 0, 0, 0.6]);
      p.lean = pick([0, -1, 3, 3, 0]); p.wpn = pick([0, 0, 0.1, 0.1, 0]); p.legA = pick([0, -1, 4, 4, 0]); p.legB = pick([0, 0, -3, -3, 0]);
      break;
    case 'overhead':
      p.armF = pick([0.4, -2.7, -2.9, 0.9, 1.0]); p.armB = pick([-0.2, -2.6, -2.8, 0.8, 0.9]); p.bendF = 0.2; p.bendB = 0.2;
      p.crouch = pick([0, 0, 0, 1, 0.6]); p.bob = pick([0, -1, -1, 1, 0]); p.lean = pick([0, -1, -1, 2, 1]);
      break;
    case 'cast':
      p.armF = pick([0.3, 0.8, 1.6, 1.6, 0.6]); p.bendF = pick([0.6, 0.4, 0, 0, 0.5]); p.armB = pick([-0.2, 0.5, 1.1, 1.0, 0]);
      p.lean = pick([0, 0, 1, 1, 0]);
      if (t > 0.3 && t < 0.9) { p.glow = col; p.glowR = big ? 9 : 6; p.glowAt = 'hand'; }
      break;
    case 'raise':
      p.armF = pick([0.3, -1.2, -2.8, -2.9, -2.8, 0.4]); p.armB = pick([-0.3, -1.2, -2.8, -2.9, -2.8, -0.3]); p.bendF = 0.1; p.bendB = 0.1;
      p.bob = pick([0, -1, -2, -2, -1, 0]);
      if (t > 0.3) { p.glow = col; p.glowR = big ? 12 : 8; p.glowAt = 'above'; }
      break;
    case 'slam':
      p.armF = pick([0.3, -2.8, -2.9, 0.6, 0.5]); p.armB = pick([-0.3, -2.8, -2.9, 0.6, 0.5]); p.bendF = 0.1; p.bendB = 0.1;
      p.bob = pick([0, -2, -3, 2, 1]); p.crouch = pick([0, 0, 0, 1, 0.8]);
      if (t > 0.6) { p.glow = col; p.glowR = big ? 14 : 10; p.glowAt = 'ground'; }
      break;
    case 'throw':
      p.armF = pick([0.3, -2.0, -2.3, 1.4, 1.2]); p.bendF = pick([0.5, 0.8, 0.9, 0, 0.2]); p.lean = pick([0, -2, -2, 2, 1]);
      if (t > 0.6) p.hideWeapon = true;
      break;
    case 'shield':
      p.armF = pick([0.3, 1.2, 1.4, 1.4, 0.6]); p.bendF = pick([0.5, 0.8, 0.9, 0.9, 0.5]); p.crouch = pick([0, 0.5, 1, 1, 0.3]);
      if (col && t > 0.2) { p.glow = col; p.glowR = big ? 14 : 10; p.glowAt = 'body'; }
      break;
    case 'shoot':
      p.armF = 1.45; p.bendF = 0.05; p.armB = pick([0.9, 1.3, 1.35, 1.0, 0.8]); p.bendB = pick([-0.4, -1.7, -1.9, 0.2, -0.3]);
      p.lean = pick([0, -1, -1, 0, 0]);
      if (col && t > 0.4 && t < 0.9) { p.glow = col; p.glowR = big ? 8 : 5; p.glowAt = 'hand'; }
      break;
    case 'crossShot':
      p.armF = pick([1.3, 1.5, 1.5, 1.5, 1.3]); p.bendF = 0.05; p.armB = pick([1.2, 1.4, 1.5, 1.4, 1.2]); p.bendB = 0.05;
      p.lean = pick([0, -1, -2, -1, 0]);
      if (col && t > 0.3 && t < 0.8) { p.glow = col; p.glowR = 5; p.glowAt = 'hand'; }
      break;
    case 'dash':
      p.lean = pick([0, 3, 5, 5, 2]); p.armF = pick([0.3, -0.6, -0.8, 1.6, 0.5]); p.armB = pick([-0.3, -1.2, -1.3, -1.0, -0.2]); p.legA = pick([0, 5, 6, 6, 1]); p.legB = pick([0, -5, -6, -6, -1]);
      p.bob = pick([0, -1, -1, 0, 0]);
      if (col && t > 0.3) { p.glow = col; p.glowR = 7; p.glowAt = 'body'; }
      break;
    case 'channel':
      p.armF = pick([0.3, 1.2, 1.5, 1.5, 1.5, 0.4]); p.armB = pick([-0.2, 1.1, 1.4, 1.4, 1.4, -0.2]); p.bendF = 0.1; p.bendB = 0.1;
      if (t > 0.2 && t < 0.95) { p.glow = col; p.glowR = (big ? 9 : 6) + (i % 2); p.glowAt = 'hand'; }
      break;
    case 'summon':
      p.armF = pick([0.3, -1.5, -2.5, -2.6, -0.4, 0.3]); p.armB = pick([-0.3, -1.5, -2.5, -2.6, -0.4, -0.3]); p.bendF = 0.2; p.bendB = 0.2;
      p.bob = pick([0, -1, -1, -1, 1, 0]);
      if (t > 0.4) { p.glow = col; p.glowR = big ? 13 : 9; p.glowAt = 'ground'; }
      break;
    case 'stab':
      p.armF = pick([0.4, 1.5, 0.5, 1.6, 0.4]); p.armB = pick([0.2, 0.3, 1.5, 0.4, -0.2]); p.bendF = pick([0.6, 0, 0.7, 0, 0.6]); p.bendB = pick([0.6, 0.6, 0, 0.6, 0.4]);
      p.lean = pick([0, 2, 1, 2, 0]);
      break;
    case 'punch':
      p.armF = pick([0.3, -0.2, 1.6, 1.6, 0.4]); p.bendF = pick([0.4, 1.8, 0, 0, 0.4]); p.lean = pick([0, -1, 3, 3, 0]); p.armB = pick([-0.3, 0.3, -0.5, -0.5, -0.3]);
      break;
  }
  return p;
}

export function animPose(art: ChampArt, anim: string, i: number): Pose {
  const n = ANIMS[anim];
  const p: Pose = { ...P0 };
  switch (anim) {
    case 'idle': {
      p.bob = [0, 0, 1, 1][i];
      p.armF = 0.2 + [0, 0.04, 0.08, 0.04][i];
      p.armB = -0.15 - [0, 0.04, 0.08, 0.04][i];
      return p;
    }
    case 'walk': {
      const ph = (i / n) * Math.PI * 2;
      p.legA = Math.sin(ph) * 4; p.legB = -Math.sin(ph) * 4;
      p.armF = 0.2 - Math.sin(ph) * 0.55; p.armB = -0.1 + Math.sin(ph) * 0.55;
      p.bob = -Math.round(Math.abs(Math.sin(ph)) * 1.2);
      return p;
    }
    case 'attack': return arch(art.attack, i, n, art.attack === 'cast' || art.attack === 'shoot' || art.attack === 'crossShot' ? g(art.glow, 180) : null);
    case 's1': return arch(art.s1, i, n, g(art.glowS1 ?? art.glow));
    case 's2': return arch(art.s2, i, n, g(art.glowS2 ?? art.glow));
    case 'ult': return arch(art.ult, i, n, g(art.glowUlt ?? art.glow, 240), true);
    case 'hit': { p.lean = -2; p.bob = 0; p.armF = -0.4; p.armB = 0.4; p.flash = i === 0 ? 0.6 : 0.15; return p; }
    case 'death': {
      p.flash = i === 0 ? 0.5 : 0;
      p.crouch = [0, 1, 1, 1, 1, 1][i];
      p.lean = [-2, -1, 0, 0, 0, 0][i];
      p.armF = [-0.4, 0.6, 1.0, 1.2, 1.4, 1.4][i];
      p.armB = [0.4, 0.6, 1.0, 1.2, 1.4, 1.4][i];
      return p;
    }
    case 'recall': {
      p.crouch = [0.3, 0.6, 0.6, 0.6][i];
      p.armF = 1.0; p.armB = 1.0; p.bendF = 0.9; p.bendB = 0.9;
      p.glow = hex('#60b0ff', 200); p.glowR = 8 + i * 2; p.glowAt = 'ground';
      return p;
    }
  }
  return p;
}

export function renderFrame(art: ChampArt, anim: string, dir: Dir4, i: number): PC {
  const p = animPose(art, anim, i);
  let c = drawCharacter(art.spec, dir, p);
  if (anim === 'death') {
    const rot = [0, 0, 0.5, 1.1, 1.45, 1.5][i] * (dir === 'left' ? -1 : 1);
    if (rot !== 0) {
      const r = c.rotated(rot, 24, 38);
      const s = new PC(48, 48);
      s.blit(r, 0, [0, 0, 1, 3, 4, 4][i]);
      c = s;
    }
    if (i === 5) c = c.withAlpha(0.55);
  }
  if (anim === 'recall') {
    // rising sparkles
    for (let k = 0; k < 4; k++) {
      const x = 14 + ((k * 7 + i * 5) % 20), y = 40 - ((k * 9 + i * 6) % 30);
      c.set(x, y, hex('#bfe4ff')); c.set(x, y - 1, hex('#60b0ff', 160));
    }
  }
  return c;
}

const S = (s: CharSpec) => s;
export const CHAMP_ART: Record<string, ChampArt> = {
  boran: { spec: S({ id: 'boran', body: 'heavy', skin: '#e0b090', top: '#8a96aa', trim: '#d8b04a', legs: '#5a6478', boots: '#3a3a48', cape: '#2a50b0', capeTrim: '#d8b04a', shoulders: { c: '#a8b4c8', kind: 'plate', size: 3.5 }, head: 'greatHelm', helm: '#a8b2c4', accent: '#3a6ad8', weapon: 'sword', wcol: '#dfe6f0', wcol2: '#d8b04a', off: 'towerShield', ocol: '#2a50b0', chest: 'plate' }), attack: 'slash', s1: 'shield', s2: 'dash', ult: 'raise', glow: '#80c0ff', glowUlt: '#ffe080' },
  korruk: { spec: S({ id: 'korruk', body: 'heavy', skin: '#8a8070', top: '#7a7262', trim: '#ff8a30', legs: '#6a6254', boots: '#5a5246', shoulders: { c: '#8a826e', kind: 'plate', size: 5 }, head: 'rock', weapon: 'none', off: 'none', chest: 'rune', eye: '#ff9a30',
    extra: (c, r, view) => { // rock cracks & moss
      const glow = hex('#ff8a30'); const moss = ramp('#4a8a3a');
      if (view !== 'up') { c.set(r.cx - 3, r.top + 4, glow); c.set(r.cx - 2, r.top + 5, glow); c.set(r.cx + 3, r.top + 6, glow); }
      c.rect(r.shF[0] - 3, r.shF[1] - 4, 4, 2, moss.m); c.rect(r.shB[0] - 1, r.shB[1] - 4, 3, 2, moss.l);
      c.ellS(r.hF[0], r.hF[1], 3, 3, ramp('#8a826e')); c.ellS(r.hB[0], r.hB[1], 3, 3, ramp('#7a7262'));
    } }), attack: 'punch', s1: 'slam', s2: 'shield', ult: 'slam', glow: '#ff9a40', glowS2: '#c0a080' },
  tharok: { spec: S({ id: 'tharok', body: 'heavy', skin: '#9a8a8a', top: '#4a4a58', trim: '#9a50d0', legs: '#3a3a44', boots: '#26262e', shoulders: { c: '#5a5a6a', kind: 'spike', size: 3.5 }, head: 'hornHelm', helm: '#4e4e5e', weapon: 'chainHook', wcol: '#a0a0b0', off: 'chain', chest: 'plate', cape: '#3a1a4a',
    extra: (c, r, view) => { if (view !== 'up') for (let i = 0; i < 5; i++) c.set(r.cx - 4 + i * 2, r.top + 3 + i, hex('#9a9aa8')); } }), attack: 'slash', s1: 'throw', s2: 'cast', ult: 'slam', glow: '#b060ff' },
  rovan: { spec: S({ id: 'rovan', body: 'heavy', skin: '#d89a70', top: '#6a3a28', trim: '#b02020', legs: '#4a3020', boots: '#3a2418', shoulders: { c: '#7a5a3a', kind: 'fur', size: 4 }, head: 'wildHair', hair: '#c0401a', weapon: 'axe', wcol: '#b8bcc8', off: 'none', chest: 'bare', belt: '#3a2010' }), attack: 'overhead', s1: 'slash', s2: 'dash', ult: 'raise', glow: '#ff3030' },
  selda: { spec: S({ id: 'selda', body: 'slim', skin: '#f0c8a8', top: '#e0e4ec', trim: '#20a0a0', legs: '#3a4a5a', boots: '#2a3038', head: 'ponytail', hair: '#2a1a18', weapon: 'rapier', wcol: '#eef4ff', wcol2: '#20a0a0', off: 'none', chest: 'leather', cape: '#1a7a80', shoulders: { c: '#c8ccd8', kind: 'cloth', size: 2 } }), attack: 'thrust', s1: 'shield', s2: 'thrust', ult: 'channel', glow: '#60ffe0', glowS1: '#c0ffff' },
  malvek: { spec: S({ id: 'malvek', body: 'normal', skin: '#c89a8a', top: '#7a1a24', trim: '#ff4040', legs: '#3a1418', boots: '#241010', head: 'redHood', helm: '#5a1018', eye: '#ff3030', weapon: 'curved', wcol: '#c8c0c8', off: 'none', chest: 'rune', shoulders: { c: '#5a1a20', kind: 'spike', size: 3 }, cape: '#4a0a14' }), attack: 'slash', s1: 'slash', s2: 'cast', ult: 'raise', glow: '#ff2030' },
  asira: { spec: S({ id: 'asira', body: 'slim', skin: '#f0c098', top: '#c0401a', trim: '#ffb030', legs: '#6a2010', boots: '#3a1408', robe: '#a83018', head: 'flameHair', weapon: 'none', off: 'flame', chest: 'robe', eye: '#ffd040', shoulders: { c: '#d86a20', kind: 'cloth', size: 2 } }), attack: 'cast', s1: 'throw', s2: 'cast', ult: 'raise', glow: '#ff8020', glowUlt: '#ff3010' },
  liris: { spec: S({ id: 'liris', body: 'slim', skin: '#f4dcd0', top: '#4a7ad0', trim: '#cfefff', legs: '#2a4a8a', boots: '#203060', robe: '#5a8ae0', head: 'longWhite', hair: '#e8f0ff', weapon: 'staffIce', wcol: '#7fdcff', off: 'none', chest: 'robe', shoulders: { c: '#bfe8ff', kind: 'crystal', size: 2.5 } }), attack: 'cast', s1: 'thrust', s2: 'slam', ult: 'raise', glow: '#7fdcff' },
  orun: { spec: S({ id: 'orun', body: 'tall', skin: '#d8b0a0', top: '#4a2a7a', trim: '#e0c060', legs: '#2a1a4a', boots: '#1a1030', robe: '#3a2068', head: 'sageHood', helm: '#5a3a90', eye: '#e0a0ff', weapon: 'staffVoid', wcol: '#d0b060', off: 'orb', ocol: '#b060ff', chest: 'robe' }), attack: 'cast', s1: 'channel', s2: 'thrust', ult: 'raise', glow: '#b060ff' },
  nyra: { spec: S({ id: 'nyra', body: 'slim', skin: '#d8b8c8', top: '#2a1a3a', trim: '#9a50e0', legs: '#1a1028', boots: '#120a1a', head: 'shadowHood', helm: '#2e2040', eye: '#c070ff', weapon: 'dagger', wcol: '#d0c8e8', off: 'dagger', chest: 'leather', cape: '#1e1230' }), attack: 'stab', s1: 'dash', s2: 'shield', ult: 'stab', glow: '#9a40ff', glowS2: '#4a3a5a' },
  zereth: { spec: S({ id: 'zereth', body: 'slim', skin: '#c8a888', top: '#2a4a2a', trim: '#80e040', legs: '#1a2a1a', boots: '#141e12', head: 'bandana', hair: '#1a1a14', helm: '#1e3a1e', weapon: 'poisonDagger', wcol: '#a0d890', off: 'poisonVial', chest: 'leather', belt: '#2a2a1a', shoulders: { c: '#3a5a2a', kind: 'cloth', size: 2 } }), attack: 'stab', s1: 'throw', s2: 'cast', ult: 'raise', glow: '#70ff40' },
  vaelis: { spec: S({ id: 'vaelis', body: 'slim', skin: '#e0c8b8', top: '#1a5a6a', trim: '#40f0ff', legs: '#123a48', boots: '#0c2430', head: 'silverHair', hair: '#d8e4ec', weapon: 'glaive', wcol: '#b0f8ff', off: 'none', chest: 'rune', shoulders: { c: '#2a7a8a', kind: 'spike', size: 2.5 } }), attack: 'slash', s1: 'dash', s2: 'slash', ult: 'dash', glow: '#40f0ff' },
  edrin: { spec: S({ id: 'edrin', body: 'slim', skin: '#f0d0b0', top: '#3a6a2a', trim: '#c8b060', legs: '#4a3a24', boots: '#3a2a18', head: 'elf', hair: '#f0d860', weapon: 'bow', wcol: '#8a5a2a', off: 'none', chest: 'leather', cape: '#2a5a20', capeTrim: '#c8b060', backpack: '#6a4a2a' }), attack: 'shoot', s1: 'shoot', s2: 'raise', ult: 'shoot', glow: '#ffe880', glowS2: '#a0e0ff' },
  tessa: { spec: S({ id: 'tessa', body: 'normal', skin: '#e8b890', top: '#7a4a2a', trim: '#c03028', legs: '#4a3020', boots: '#2a1a10', head: 'bun', hair: '#6a3018', weapon: 'crossbow', wcol: '#7a4a28', off: 'crossbow', chest: 'leather', shoulders: { c: '#8a5a34', kind: 'cloth', size: 2.5 } }), attack: 'crossShot', s1: 'crossShot', s2: 'dash', ult: 'channel', glow: '#ffb040' },
  dorn: { spec: S({ id: 'dorn', body: 'dwarf', skin: '#e0a880', top: '#6a5040', trim: '#d0a040', legs: '#4a3a30', boots: '#2a2018', head: 'minerHelm', hair: '#e0702a', helm: '#8a7040', weapon: 'bomb', off: 'none', chest: 'leather', belt: '#3a2a18', backpack: '#8a5a30' }), attack: 'throw', s1: 'throw', s2: 'throw', ult: 'overhead', glow: '#ffa030' },
  rughan: { spec: S({ id: 'rughan', body: 'normal', skin: '#c89070', top: '#5a4a3a', trim: '#c0a060', legs: '#3a3024', boots: '#2a2218', head: 'wolfHood', helm: '#8a8a90', weapon: 'spear', wcol: '#d0c8b0', off: 'none', chest: 'fur', shoulders: { c: '#9a9aa0', kind: 'fur', size: 3.5 }, cape: '#6a6a70' }), attack: 'thrust', s1: 'cast', s2: 'raise', ult: 'summon', glow: '#ffd040', glowS2: '#ff8040' },
  nekmar: { spec: S({ id: 'nekmar', body: 'tall', skin: '#b0b0a0', top: '#2a2430', trim: '#e6dfc8', legs: '#1a1620', boots: '#121016', robe: '#241e2a', head: 'skull', helm: '#1a1620', weapon: 'scythe', wcol: '#c8d0c0', off: 'none', chest: 'bone', shoulders: { c: '#e6dfc8', kind: 'bone', size: 3 } }), attack: 'cast', s1: 'summon', s2: 'cast', ult: 'summon', glow: '#60ff90' },
  ilvara: { spec: S({ id: 'ilvara', body: 'normal', skin: '#f0c8a0', top: '#2a6a6a', trim: '#d08a40', legs: '#3a3a40', boots: '#2a2a2e', head: 'goggles', hair: '#40c0b0', weapon: 'wrench', wcol: '#c08a50', wcol2: '#8a6040', off: 'runeCube', chest: 'leather', belt: '#5a3a20', shoulders: { c: '#c08a50', kind: 'plate', size: 2.5 }, backpack: '#7a5a3a' }), attack: 'cast', s1: 'summon', s2: 'throw', ult: 'channel', glow: '#40f0d0' },
};

export { DIRS };
