import { PC, hex, ramp, RGBA } from './canvas';
import { CharSpec, Dir4, drawCharacter } from './humanoid';
import { animPose } from './champions';

export const CREATURE_ANIMS: Record<string, number> = { idle: 4, walk: 6, attack: 5, s1: 5, hit: 2, death: 6 };
export const CREATURE_RATE: Record<string, number> = { idle: 5, walk: 10, attack: 12, s1: 10, hit: 10, death: 8 };

export interface CreatureDef { key: string; size: number; render: (anim: string, dir: Dir4, i: number) => PC }

// ------------------------------------------------------------ humanoid based creatures
function humanoidCreature(key: string, spec: CharSpec, attack: any, s1: any, glow: string, scale = 1): CreatureDef {
  const art = { spec, attack, s1, s2: s1, ult: s1, glow };
  return {
    key, size: 48 * scale,
    render(anim, dir, i) {
      const a = anim === 's1' ? 's1' : anim;
      const p = animPose(art as any, a === 'death' ? 'death' : a, i);
      let c = drawCharacter(spec, dir, p);
      if (anim === 'death') {
        const rot = [0, 0, 0.5, 1.1, 1.45, 1.5][i] * (dir === 'left' ? -1 : 1);
        if (rot) { const r = c.rotated(rot, 24, 38); c = new PC(48, 48); c.blit(r, 0, [0, 0, 1, 3, 4, 4][i]); }
        if (i >= 4) c = c.withAlpha(i === 5 ? 0.35 : 0.7);
      }
      return scale === 1 ? c : c.scaled(scale);
    },
  };
}

const minionSpec = (team: 0 | 1, sub: 'melee' | 'ranged'): CharSpec => {
  const tc = team === 0 ? '#3a64c8' : '#c83a3a';
  const tc2 = team === 0 ? '#8ab0ff' : '#ffa080';
  if (sub === 'melee') return { id: 'm', body: 'normal', skin: '#d8b090', top: tc, trim: '#d0d0d8', legs: '#4a4a52', boots: '#2a2a30', head: 'greatHelm', helm: '#9aa0ac', accent: tc2, weapon: 'sword', wcol: '#d0d4dc', off: 'towerShield', ocol: tc, chest: 'plate', shoulders: { c: tc, kind: 'plate', size: 2.5 } };
  return { id: 'r', body: 'slim', skin: '#d8b090', top: tc, trim: tc2, legs: '#3a3a44', boots: '#2a2a30', robe: tc, head: 'sageHood', helm: team === 0 ? '#2a4a9a' : '#9a2a2a', eye: tc2, weapon: 'staffVoid', wcol: '#8a6a40', off: 'none', chest: 'robe' };
};

// ------------------------------------------------------------ quadruped (wolves, bear)
interface QuadSpec { body: string; belly: string; dark: string; eye: string; len: number; h: number; head: number; mane?: string; collar?: string; bulky?: boolean; ears?: boolean }
function drawQuad(q: QuadSpec, dir: Dir4, anim: string, i: number, frame = 48): PC {
  const c = new PC(frame, frame);
  const R = ramp(q.body), B = ramp(q.belly), D = ramp(q.dark);
  const cx = frame / 2, fy = frame - 6;
  const n = CREATURE_ANIMS[anim];
  const ph = (i / n) * Math.PI * 2;
  let lunge = 0, bob = 0, open = 0, legSw = 0;
  if (anim === 'walk') { legSw = Math.sin(ph) * 3; bob = -Math.abs(Math.sin(ph)); }
  if (anim === 'idle') bob = [0, 0, 1, 1][i];
  if (anim === 'attack' || anim === 's1') { lunge = [0, -2, 4, 4, 1][i]; open = [0, 0, 1, 1, 0][i]; }
  if (anim === 'hit') lunge = -2;
  const L = q.len, H = q.h;
  c.ell(cx, fy, L / 2 + 2, 2.5, [0, 0, 0, 70]);
  if (dir === 'left' || dir === 'right') {
    const bx = cx + lunge, by = fy - H - 3 + bob;
    // legs
    const legs = [[-L / 2 + 3, legSw], [-L / 2 + 6, -legSw], [L / 2 - 6, -legSw], [L / 2 - 3, legSw]];
    legs.forEach(([lx, sw], k) => c.limb(bx + lx, by + 2, bx + lx + sw, fy - 1, k % 2 ? D : R, q.bulky ? 4 : 3));
    // tail
    c.line(bx - L / 2, by - 1, bx - L / 2 - 5, by - 4 - Math.sin(ph) * 2, R.m, q.bulky ? 3 : 2);
    c.ellS(bx, by, L / 2, H / 2 + 1, R);
    c.ell(bx + 1, by + H / 4, L / 2 - 3, H / 4, B.m);
    if (q.mane) c.ellS(bx + L / 2 - 4, by - 2, 5, H / 2 + 1, ramp(q.mane));
    // head
    const hx = bx + L / 2 + 1, hy = by - H / 2 + 1;
    c.ellS(hx, hy, q.head, q.head * 0.85, R);
    c.polyS([[hx + 1, hy - 1], [hx + q.head + 5, hy + 1 - open], [hx + q.head + 4, hy + 3], [hx + 1, hy + 3]], R);
    if (open) c.line(hx + 3, hy + 3, hx + q.head + 4, hy + 5, hex('#f0e8e0'), 1);
    c.set(hx + q.head + 4, hy, hex('#141014'));
    if (q.ears !== false) c.polyS([[hx - 2, hy - q.head + 1], [hx - 1, hy - q.head - 4], [hx + 1, hy - q.head + 1]], D);
    c.set(hx + 2, hy - 1, hex(q.eye));
    if (q.collar) c.rect(hx - 2, hy + 2, 3, 3, ramp(q.collar).m);
  } else {
    const front = dir === 'down';
    const bx = cx, by = fy - H - 2 + bob + (front ? lunge * 0.5 : -lunge * 0.5);
    const lw = q.bulky ? 4 : 3;
    c.limb(bx - 5, by + 2, bx - 5, fy - 1 - Math.max(0, legSw), D, lw);
    c.limb(bx + 5, by + 2, bx + 5, fy - 1 - Math.max(0, -legSw), D, lw);
    c.ellS(bx, by - 1, H / 2 + 3, H / 2 + 2, R);
    if (front) {
      c.limb(bx - 4, by + 1, bx - 4, fy - 1 - Math.max(0, -legSw), R, lw);
      c.limb(bx + 4, by + 1, bx + 4, fy - 1 - Math.max(0, legSw), R, lw);
      const hy = by - H / 2 - 1 - (open ? 1 : 0);
      if (q.mane) c.ellS(bx, hy + 2, q.head + 3, q.head + 1, ramp(q.mane));
      c.ellS(bx, hy, q.head + 1, q.head, R);
      c.ellS(bx, hy + 3, q.head * 0.55, q.head * 0.45, B);
      c.set(bx, hy + 2, hex('#141014'));
      c.set(bx - 2, hy - 1, hex(q.eye)); c.set(bx + 2, hy - 1, hex(q.eye));
      if (open) c.rect(bx - 1, hy + 4, 3, 1, hex('#f0e8e0'));
      if (q.ears !== false) { c.polyS([[bx - q.head, hy - 2], [bx - q.head + 1, hy - q.head - 4], [bx - 1, hy - q.head + 1]], D); c.polyS([[bx + q.head, hy - 2], [bx + q.head - 1, hy - q.head - 4], [bx + 1, hy - q.head + 1]], D); }
      if (q.collar) c.rect(bx - 3, hy + q.head, 7, 2, ramp(q.collar).m);
    } else {
      c.line(bx, by + 2, bx + Math.sin(ph) * 2, by + 8, R.m, 2);
      const hy = by - H / 2 - 2;
      c.ellS(bx, hy, q.head + 1, q.head, D);
      if (q.ears !== false) { c.polyS([[bx - q.head, hy - 1], [bx - q.head + 1, hy - q.head - 4], [bx - 1, hy - q.head + 1]], D); c.polyS([[bx + q.head, hy - 1], [bx + q.head - 1, hy - q.head - 4], [bx + 1, hy - q.head + 1]], D); }
    }
  }
  let out = c;
  out.outline([20, 16, 22, 255]);
  if (anim === 'hit' && i === 0) out = out.tinted([255, 255, 255, 255], 0.6);
  if (anim === 'death') {
    const rot = [0, 0.3, 0.8, 1.3, 1.5, 1.5][i] * (dir === 'left' ? -1 : 1);
    const r = out.rotated(rot, frame / 2, fy - 4);
    out = new PC(frame, frame);
    out.blit(r, 0, [0, 1, 2, 3, 3, 3][i]);
    if (i >= 4) out = out.withAlpha(i === 5 ? 0.35 : 0.7);
  }
  if (dir === 'left') { const f = new PC(frame, frame); f.blit(out, 0, 0, { flipX: true }); out = f; }
  return out;
}

// ------------------------------------------------------------ floating spirits
function drawSpirit(kind: 'spirit' | 'wisp', dir: Dir4, anim: string, i: number): PC {
  const c = new PC(48, 48);
  const n = CREATURE_ANIMS[anim];
  const ph = (i / n) * Math.PI * 2;
  const fl = Math.sin(ph) * 1.5;
  const atk = anim === 'attack' || anim === 's1' ? [0, 1, 2, 2, 0][i] : 0;
  c.ell(24, 43, kind === 'spirit' ? 8 : 5, 2, [0, 0, 0, 60]);
  if (kind === 'wisp') {
    c.glow(24, 28 + fl, 10 + atk * 2, hex('#80ffe0', 200));
    c.ellS(24, 28 + fl, 4, 4, ramp('#a0fff0'));
    c.set(23, 27 + fl, hex('#ffffff'));
  } else {
    const R = ramp('#6ad0c8');
    c.glow(24, 24 + fl, 16, hex('#60f0d0', 120));
    // tattered robe body
    c.polyS([[16, 18 + fl], [32, 18 + fl], [34, 38 + fl], [30, 35 + fl], [27, 40 + fl], [24, 36 + fl], [21, 40 + fl], [18, 35 + fl], [14, 38 + fl]], R);
    // hood head
    c.ellS(24, 15 + fl, 6, 6, ramp('#4ab0a8'));
    if (dir !== 'up') { c.ell(24 + (dir === 'right' ? 2 : dir === 'left' ? -2 : 0), 16 + fl, 3.5, 3.5, hex('#0a1e20')); c.set(23 + (dir === 'right' ? 2 : dir === 'left' ? -2 : 0), 16 + fl, hex('#e0fff8')); c.set(25 + (dir === 'right' ? 2 : dir === 'left' ? -2 : 0), 16 + fl, hex('#e0fff8')); }
    // lantern
    const lx = dir === 'left' ? 13 : 35, ly = 26 + fl - atk * 2;
    c.line(lx, ly - 6, lx, ly - 2, hex('#6a5a40'), 1);
    c.rectS(lx - 2, ly - 2, 5, 6, ramp('#d8b050'));
    c.glow(lx, ly + 1, 6 + atk * 2, hex('#fff080', 220));
  }
  let out = c;
  out.outline([16, 30, 34, 255]);
  if (anim === 'hit' && i === 0) out = out.tinted([255, 255, 255, 255], 0.6);
  if (anim === 'death') out = out.withAlpha(1 - i / 6);
  return out;
}

// ------------------------------------------------------------ sentry (rune structure)
function drawSentry(dir: Dir4, anim: string, i: number): PC {
  const c = new PC(48, 48);
  const n = CREATURE_ANIMS[anim];
  const fl = Math.sin((i / n) * Math.PI * 2) * 1.5;
  const atk = anim === 'attack' || anim === 's1' ? [0, 1, 2, 1, 0][i] : 0;
  c.ell(24, 42, 9, 2.5, [0, 0, 0, 70]);
  c.polyS([[16, 42], [32, 42], [29, 33], [19, 33]], ramp('#7a6a5a'));
  c.rect(18, 36, 12, 1, ramp('#40e0c0').m);
  c.rectS(21, 25, 6, 9, ramp('#8a7a68'));
  c.set(24, 29, hex('#60fff0'));
  const cy = 18 + fl - atk;
  c.glow(24, cy, 9 + atk * 2, hex('#40f0d0', 200));
  c.polyS([[24, cy - 6], [28, cy], [24, cy + 6], [20, cy]], ramp('#40d8c0'));
  c.set(23, cy - 2, hex('#e0fff8'));
  // orbiting runes
  for (let k = 0; k < 3; k++) {
    const a = (i / n) * Math.PI * 2 + (k * Math.PI * 2) / 3;
    c.rect(24 + Math.cos(a) * 9, cy + Math.sin(a) * 3, 2, 2, hex('#a0fff0'));
  }
  let out = c;
  out.outline([20, 30, 30, 255]);
  if (anim === 'hit' && i === 0) out = out.tinted([255, 255, 255, 255], 0.6);
  if (anim === 'death') { const k = new PC(48, 48); k.blit(out, 0, i * 2); out = k.withAlpha(1 - i / 6); }
  void dir;
  return out;
}

// ------------------------------------------------------------ siege minion (rune cart)
function drawSiege(team: 0 | 1, dir: Dir4, anim: string, i: number): PC {
  const c = new PC(48, 48);
  const tc = ramp(team === 0 ? '#3a64c8' : '#c83a3a');
  const wood = ramp('#7a5a38');
  const n = CREATURE_ANIMS[anim];
  const rot = anim === 'walk' ? i / n : 0;
  const recoil = anim === 'attack' ? [0, -1, 2, 1, 0][i] : 0;
  c.ell(24, 42, 13, 3, [0, 0, 0, 70]);
  const side = dir === 'left' || dir === 'right';
  if (side) {
    c.rectS(12 - recoil, 28, 24, 8, wood);
    c.rect(12 - recoil, 30, 24, 2, tc.m);
    // cannon barrel
    c.limb(22 - recoil, 26, 36 - recoil, 22, ramp('#4a4a54'), 5);
    c.ellS(36 - recoil, 22, 2.5, 2.5, ramp('#2a2a30'));
    for (const wx of [16, 32]) {
      c.ellS(wx - recoil, 38, 4.5, 4.5, ramp('#5a4028'));
      const a = rot * Math.PI * 2;
      c.line(wx - recoil - Math.cos(a) * 3, 38 - Math.sin(a) * 3, wx - recoil + Math.cos(a) * 3, 38 + Math.sin(a) * 3, wood.l, 1);
    }
    c.rectS(14 - recoil, 20, 6, 8, tc);
  } else {
    c.rectS(14, 26, 20, 10, wood);
    c.rect(14, 28, 20, 2, tc.m);
    c.ellS(24, 24 + (dir === 'down' ? recoil : -recoil), 5, 5, ramp('#4a4a54'));
    if (dir === 'down') c.ell(24, 24 + recoil, 2.5, 2.5, hex('#141418'));
    c.ellS(13, 38, 3, 4.5, ramp('#5a4028')); c.ellS(35, 38, 3, 4.5, ramp('#5a4028'));
    c.rectS(21, 17, 6, 5, tc);
  }
  if (anim === 'attack' && i === 2) c.glow(side ? 39 : 24, side ? 21 : 20, 7, hex('#ffd060', 240));
  let out = c;
  out.outline([20, 16, 22, 255]);
  if (anim === 'hit' && i === 0) out = out.tinted([255, 255, 255, 255], 0.6);
  if (anim === 'death') { const k = new PC(48, 48); k.blit(out.rotated(i * 0.15, 24, 40), 0, i); out = k.withAlpha(Math.max(0.2, 1 - i / 6)); }
  if (dir === 'left') { const f = new PC(48, 48); f.blit(out, 0, 0, { flipX: true }); out = f; }
  return out;
}

// ------------------------------------------------------------ bosses
const bloodSpec: CharSpec = {
  id: 'blood', body: 'heavy', skin: '#a82030', top: '#6a0a18', trim: '#ffcc40', legs: '#3a0810', boots: '#1a0408', head: 'hornHelm', helm: '#4a0610',
  weapon: 'curved', wcol: '#e8d0d0', off: 'none', chest: 'bare', cape: '#3a0610', capeTrim: '#ff3040', shoulders: { c: '#5a0814', kind: 'spike', size: 4 },
  extra: (c, g, view) => {
    // bat wings
    const w = ramp('#5a0a1a');
    if (view !== 'side') {
      c.polyS([[g.cx - 6, g.top + 2], [g.cx - 20, g.top - 8], [g.cx - 22, g.top + 6], [g.cx - 16, g.top + 4], [g.cx - 14, g.top + 10], [g.cx - 8, g.top + 6]], w);
      c.polyS([[g.cx + 6, g.top + 2], [g.cx + 20, g.top - 8], [g.cx + 22, g.top + 6], [g.cx + 16, g.top + 4], [g.cx + 14, g.top + 10], [g.cx + 8, g.top + 6]], w);
    } else c.polyS([[g.cx - 3, g.top + 2], [g.cx - 16, g.top - 10], [g.cx - 18, g.top + 4], [g.cx - 10, g.top + 9]], w);
    // crown
    const cr = ramp('#ffcc40');
    for (let k = -3; k <= 3; k += 2) c.line(g.headX + k, g.headY - g.hr - 1, g.headX + k, g.headY - g.hr - 3, cr.l, 1);
    c.glow(g.cx, (g.top + g.hipY) / 2, 6, hex('#ff2040', 120));
  },
};
const titanSpec: CharSpec = {
  id: 'titan', body: 'heavy', skin: '#7a8290', top: '#6a7280', trim: '#40e0ff', legs: '#5a6270', boots: '#4a525e', head: 'rock', weapon: 'none', off: 'none', chest: 'rune',
  shoulders: { c: '#8a929e', kind: 'plate', size: 6 },
  extra: (c, g, view) => {
    const rune = hex('#40e0ff');
    if (view !== 'up') { c.rect(g.cx - 4, g.top + 3, 8, 1, rune); c.rect(g.cx - 1, g.top + 3, 2, 6, rune); }
    c.ellS(g.hF[0], g.hF[1], 4, 4, ramp('#8a929e')); c.ellS(g.hB[0], g.hB[1], 4, 4, ramp('#7a8290'));
    c.rectS(g.shF[0] - 3, g.shF[1] - 7, 4, 4, ramp('#5a8a4a')); // moss/ruin block
    c.glow(g.headX, g.headY, 5, hex('#40e0ff', 120));
  },
};
function bossDef(key: string, spec: CharSpec, attack: string, glow: string): CreatureDef {
  const base = humanoidCreature(key, spec, attack, 'slam', glow, 1);
  return { key, size: 96, render: (a, d, i) => base.render(a, d, i).scaled(2) };
}

// ------------------------------------------------------------ registry
const skeletonSpec: CharSpec = { id: 'skel', body: 'slim', skin: '#e6dfc8', top: '#d8d0b8', trim: '#8a8070', legs: '#d8d0b8', boots: '#a8a090', head: 'skull', helm: '#3a3040', weapon: 'sword', wcol: '#a8a8a0', off: 'none', chest: 'bone' };
const giantSpec: CharSpec = { id: 'giant', body: 'heavy', skin: '#e6dfc8', top: '#cfc6aa', trim: '#60ff90', legs: '#cfc6aa', boots: '#a8a090', head: 'skull', helm: '#2a2430', weapon: 'none', off: 'none', chest: 'bone', shoulders: { c: '#e6dfc8', kind: 'bone', size: 5 },
  extra: (c, g) => { c.ellS(g.hF[0], g.hF[1], 3, 3, ramp('#e6dfc8')); c.ellS(g.hB[0], g.hB[1], 3, 3, ramp('#d8d0b8')); c.glow(g.cx, g.top + 5, 5, hex('#60ff90', 140)); } };
const golemSpec: CharSpec = { id: 'golem', body: 'heavy', skin: '#6a7a5a', top: '#5a6a4a', trim: '#c0ff60', legs: '#4a5a3a', boots: '#3a4a2e', head: 'rock', weapon: 'none', off: 'none', chest: 'rune', shoulders: { c: '#4a8a3a', kind: 'plate', size: 4.5 },
  extra: (c, g) => { c.ellS(g.hF[0], g.hF[1], 3, 3, ramp('#6a7a5a')); c.ellS(g.hB[0], g.hB[1], 3, 3, ramp('#5a6a4a')); } };

export const CREATURES: CreatureDef[] = [
  humanoidCreature('minion_melee_0', minionSpec(0, 'melee'), 'slash', 'slash', '#8ab0ff'),
  humanoidCreature('minion_melee_1', minionSpec(1, 'melee'), 'slash', 'slash', '#ffa080'),
  humanoidCreature('minion_ranged_0', minionSpec(0, 'ranged'), 'cast', 'cast', '#8ab0ff'),
  humanoidCreature('minion_ranged_1', minionSpec(1, 'ranged'), 'cast', 'cast', '#ffa080'),
  { key: 'minion_siege_0', size: 48, render: (a, d, i) => drawSiege(0, d, a, i) },
  { key: 'minion_siege_1', size: 48, render: (a, d, i) => drawSiege(1, d, a, i) },
  { key: 'alphawolf', size: 48, render: (a, d, i) => drawQuad({ body: '#6a6e78', belly: '#a8acb4', dark: '#4a4e58', eye: '#ffd040', len: 22, h: 10, head: 5, mane: '#5a5e68', bulky: true }, d, a, i) },
  { key: 'wolfling', size: 48, render: (a, d, i) => drawQuad({ body: '#8a8e96', belly: '#c0c4c8', dark: '#5a5e66', eye: '#ffd040', len: 16, h: 7, head: 4 }, d, a, i) },
  { key: 'wolf', size: 48, render: (a, d, i) => drawQuad({ body: '#8a6a4a', belly: '#d0b890', dark: '#5a4430', eye: '#80ff80', len: 18, h: 8, head: 4.5, collar: '#c0a060' }, d, a, i) },
  { key: 'beast', size: 48, render: (a, d, i) => drawQuad({ body: '#5a3a24', belly: '#8a6a48', dark: '#3a2416', eye: '#ff6030', len: 26, h: 13, head: 6, mane: '#4a2e1c', bulky: true, collar: '#ffd040' }, d, a, i) },
  humanoidCreature('golem', golemSpec, 'punch', 'slam', '#c0ff60'),
  { key: 'spirit', size: 48, render: (a, d, i) => drawSpirit('spirit', d, a, i) },
  { key: 'wisp', size: 48, render: (a, d, i) => drawSpirit('wisp', d, a, i) },
  humanoidCreature('skeleton', skeletonSpec, 'slash', 'slash', '#60ff90'),
  humanoidCreature('bonegiant', giantSpec, 'punch', 'slam', '#60ff90'),
  { key: 'sentry', size: 48, render: (a, d, i) => drawSentry(d, a, i) },
  bossDef('boss_blood', bloodSpec, 'slash', '#ff2040'),
  bossDef('boss_titan', titanSpec, 'punch', '#40e0ff'),
];
export type { RGBA };
