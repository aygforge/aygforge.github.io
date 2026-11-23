import { PC, RGBA, Ramp, hex, ramp, mix, shade } from './canvas';

export type View = 'down' | 'up' | 'side';
export type BodyType = 'heavy' | 'normal' | 'slim' | 'dwarf' | 'tall';
export const DIRS = ['down', 'up', 'left', 'right'] as const;
export type Dir4 = (typeof DIRS)[number];

export interface Pose {
  bob: number; lean: number; legA: number; legB: number; armF: number; armB: number;
  bendF: number; bendB: number; wpn: number; crouch: number;
  glow?: RGBA | null; glowR?: number; glowAt?: 'hand' | 'body' | 'above' | 'ground' | 'offhand';
  flash?: number; // white flash amount
  hideWeapon?: boolean;
}
export const P0: Pose = { bob: 0, lean: 0, legA: 0, legB: 0, armF: 0.2, armB: -0.15, bendF: 0.5, bendB: 0.3, wpn: 0, crouch: 0 };

export type WeaponKind = 'sword' | 'axe' | 'chainHook' | 'rapier' | 'curved' | 'staffFire' | 'staffIce' | 'staffVoid' | 'dagger' | 'glaive' | 'bow' | 'crossbow' | 'bomb' | 'spear' | 'scythe' | 'wrench' | 'none' | 'poisonDagger';
export type OffKind = 'towerShield' | 'chain' | 'dagger' | 'crossbow' | 'flame' | 'orb' | 'runeCube' | 'poisonVial' | 'none';
export type HeadKind = 'rock' | 'greatHelm' | 'hornHelm' | 'wildHair' | 'ponytail' | 'redHood' | 'flameHair' | 'longWhite' | 'sageHood' | 'shadowHood' | 'bandana' | 'silverHair' | 'elf' | 'bun' | 'minerHelm' | 'wolfHood' | 'skull' | 'goggles';

export interface CharSpec {
  id: string;
  body: BodyType;
  skin: string;
  top: string; trim: string; legs: string; boots: string;
  robe?: string; cape?: string; capeTrim?: string;
  shoulders?: { c: string; kind: 'plate' | 'fur' | 'bone' | 'crystal' | 'spike' | 'cloth'; size: number };
  belt?: string;
  head: HeadKind; hair?: string; helm?: string; accent?: string; eye?: string;
  weapon: WeaponKind; wcol?: string; wcol2?: string;
  off: OffKind; ocol?: string;
  chest?: 'plate' | 'leather' | 'robe' | 'bone' | 'fur' | 'rune' | 'bare';
  chestCol?: string;
  extra?: (c: PC, g: Rig, view: View, flip: boolean) => void;
  backpack?: string;
}

const BODY: Record<BodyType, { tw: number; th: number; lh: number; lw: number; aw: number; al: number; hr: number }> = {
  heavy: { tw: 14, th: 11, lh: 9, lw: 4, aw: 4, al: 10, hr: 5 },
  normal: { tw: 11, th: 10, lh: 9, lw: 3, aw: 3, al: 9, hr: 5 },
  slim: { tw: 9, th: 10, lh: 10, lw: 3, aw: 3, al: 9, hr: 4.5 },
  dwarf: { tw: 14, th: 9, lh: 6, lw: 4, aw: 4, al: 8, hr: 5.5 },
  tall: { tw: 10, th: 12, lh: 11, lw: 3, aw: 3, al: 10, hr: 4.5 },
};

export interface Rig {
  view: View; cx: number; hipY: number; top: number; headX: number; headY: number; hr: number;
  shF: [number, number]; shB: [number, number]; elF: [number, number]; elB: [number, number];
  hF: [number, number]; hB: [number, number]; footA: [number, number]; footB: [number, number];
  tw: number; th: number; lw: number; aw: number; wAngF: number; wAngB: number;
}

export const FOOT_Y = 43;

function rig(spec: CharSpec, view: View, p: Pose): Rig {
  const b = BODY[spec.body];
  const cx = 24 + (view === 'side' ? p.lean : 0);
  const hipY = FOOT_Y - b.lh + Math.round(p.crouch * 3) + Math.round(p.bob);
  const top = hipY - b.th;
  const hr = b.hr;
  const headX = cx + (view === 'side' ? 1 + p.lean * 0.4 : 0);
  const headY = top - hr + 1;
  let shF: [number, number], shB: [number, number];
  if (view === 'side') { shF = [cx + 1, top + 2]; shB = [cx - 2, top + 2]; }
  else if (view === 'down') { shF = [cx - b.tw / 2 - 0.5, top + 2]; shB = [cx + b.tw / 2 + 0.5, top + 2]; }
  else { shF = [cx + b.tw / 2 + 0.5, top + 2]; shB = [cx - b.tw / 2 - 0.5, top + 2]; }
  const ua = b.al * 0.55, fa = b.al * 0.5;
  const armPt = (sh: [number, number], ang: number, bend: number, side: number): [[number, number], [number, number]] => {
    // side view: angle positive = forward (+x). front/back: positive = outward (side sign)
    const sx = view === 'side' ? 1 : side;
    const e: [number, number] = [sh[0] + Math.sin(ang) * ua * sx, sh[1] + Math.cos(ang) * ua];
    const a2 = ang + bend;
    const h: [number, number] = [e[0] + Math.sin(a2) * fa * sx, e[1] + Math.cos(a2) * fa];
    return [e, h];
  };
  const fSide = view === 'down' ? -1 : 1;
  const [elF, hF] = armPt(shF, p.armF, p.bendF, fSide);
  const [elB, hB] = armPt(shB, p.armB, p.bendB, -fSide);
  let footA: [number, number], footB: [number, number];
  if (view === 'side') { footA = [cx + 1 + p.legA, FOOT_Y]; footB = [cx - 1 + p.legB, FOOT_Y]; }
  else { footA = [cx - b.tw / 4 - 0.5, FOOT_Y - Math.max(0, p.legA)]; footB = [cx + b.tw / 4 + 0.5, FOOT_Y - Math.max(0, p.legB)]; }
  const sx = view === 'side' ? 1 : fSide;
  // weapon screen angle: 0 = up, + = clockwise. derived from forearm direction
  const fdir = Math.atan2(hF[0] - elF[0], -(hF[1] - elF[1]));
  const bdir = Math.atan2(hB[0] - elB[0], -(hB[1] - elB[1]));
  void sx;
  return { view, cx, hipY, top, headX, headY, hr, shF, shB, elF, elB, hF, hB, footA, footB, tw: b.tw, th: b.th, lw: b.lw, aw: b.aw, wAngF: fdir + p.wpn, wAngB: bdir };
}

// ---------------------------------------------------------------- parts
function drawLeg(c: PC, hipX: number, hipY: number, foot: [number, number], r: Ramp, boots: Ramp, w: number, view: View) {
  const kneeX = (hipX + foot[0]) / 2 + (view === 'side' ? 1 : 0), kneeY = (hipY + foot[1]) / 2;
  c.limb(hipX, hipY, kneeX, kneeY, r, w);
  c.limb(kneeX, kneeY, foot[0], foot[1] - 2, r, w);
  // boot
  if (view === 'side') c.rectS(foot[0] - 1, foot[1] - 3, w + 2, 3, boots, true);
  else c.rectS(foot[0] - w / 2, foot[1] - 3, w + 1, 3, boots, true);
}

function drawArm(c: PC, sh: [number, number], el: [number, number], h: [number, number], r: Ramp, skin: Ramp, w: number) {
  c.limb(sh[0], sh[1], el[0], el[1], r, w);
  c.limb(el[0], el[1], h[0], h[1], r, Math.max(2, w - 1));
  c.ellS(h[0], h[1], 1.3, 1.3, skin);
}

function drawTorso(c: PC, s: CharSpec, g: Rig, view: View) {
  const top = ramp(s.top), trim = ramp(s.trim);
  const x = g.cx - g.tw / 2;
  const chest = s.chest ?? 'plate';
  // torso shape: slightly wider shoulders
  const w = view === 'side' ? Math.max(6, g.tw - 4) : g.tw;
  const xx = view === 'side' ? g.cx - w / 2 : x;
  c.polyS([[xx - 0.5, g.top], [xx + w + 0.5, g.top], [xx + w - 1, g.hipY + 1], [xx + 1, g.hipY + 1]], top);
  if (chest === 'plate') {
    if (view !== 'up') {
      c.rect(xx + 2, g.top + 2, w - 4, 1, top.l);
      c.rect(g.cx - 0.5, g.top + 2, 1, g.th - 4, top.d);
    }
  } else if (chest === 'leather') {
    if (view !== 'up') c.line(xx + 2, g.top + 1, xx + w - 2, g.hipY - 2, trim.m);
  } else if (chest === 'robe') {
    if (view === 'down') { c.rect(g.cx - 1, g.top, 2, g.th, trim.m); }
  } else if (chest === 'bone') {
    for (let i = 0; i < 3; i++) c.rect(xx + 2, g.top + 2 + i * 3, w - 4, 1, ramp('#e8e0c8').m);
  } else if (chest === 'fur') {
    c.rect(xx, g.top, w, 3, ramp('#8a6a44').m);
  } else if (chest === 'rune') {
    if (view !== 'up') { c.rect(g.cx - 1, g.top + 3, 3, 3, trim.l); c.set(g.cx, g.top + 4, trim.ll); }
  } else if (chest === 'bare') {
    const sk = ramp(s.skin);
    if (view !== 'up') { c.rect(xx + 2, g.top + 1, w - 4, g.th - 4, sk.m); c.rect(xx + 2, g.top + 1, 1, g.th - 4, sk.l); c.line(g.cx, g.top + 3, g.cx, g.top + 6, sk.d); }
  }
  // belt
  const belt = ramp(s.belt ?? '#4a3428');
  c.rect(xx, g.hipY - 2, w, 2, belt.m);
  if (view === 'down') c.rect(g.cx - 1, g.hipY - 2, 2, 2, ramp('#d8b04a').m);
}

function drawRobe(c: PC, s: CharSpec, g: Rig, view: View, p: Pose) {
  if (!s.robe) return;
  const r = ramp(s.robe);
  const w = view === 'side' ? g.tw - 3 : g.tw;
  const sway = view === 'side' ? (p.legA - p.legB) * 0.25 : 0;
  const l = g.cx - w / 2 - 1, rr = g.cx + w / 2 + 1;
  c.polyS([[l + 1, g.hipY - 3], [rr - 1, g.hipY - 3], [rr + 2 + sway, FOOT_Y - 1], [l - 2 + sway, FOOT_Y - 1]], r);
  c.rect(l - 1 + sway, FOOT_Y - 2, w + 4, 1, ramp(s.trim).m);
  if (view === 'down') c.rect(g.cx - 0.5, g.hipY - 2, 1, FOOT_Y - g.hipY, r.d);
}

function drawCape(c: PC, s: CharSpec, g: Rig, view: View, p: Pose, front: boolean) {
  if (!s.cape) return;
  const r = ramp(s.cape);
  const trim = ramp(s.capeTrim ?? s.cape);
  const wave = Math.sin((p.legA + p.bob) * 0.6) * 1;
  if (view === 'up' && front) {
    c.polyS([[g.cx - g.tw / 2, g.top + 1], [g.cx + g.tw / 2, g.top + 1], [g.cx + g.tw / 2 + 2, FOOT_Y - 3 + wave], [g.cx - g.tw / 2 - 2, FOOT_Y - 3 - wave]], r);
    c.rect(g.cx - g.tw / 2 - 1, FOOT_Y - 4, g.tw + 2, 1, trim.l);
  } else if (view === 'side' && !front) {
    c.polyS([[g.cx - 2, g.top + 1], [g.cx + 1, g.top + 1], [g.cx - 5 - Math.abs(p.lean) - wave, FOOT_Y - 4], [g.cx - 9 - Math.abs(p.lean), FOOT_Y - 6]], r);
  } else if (view === 'down' && !front) {
    c.rect(g.cx - g.tw / 2 - 1, g.top + 1, 2, g.th + 5, r.d);
    c.rect(g.cx + g.tw / 2 - 1, g.top + 1, 2, g.th + 5, r.d);
  }
}

function drawShoulders(c: PC, s: CharSpec, g: Rig, view: View) {
  if (!s.shoulders) return;
  const r = ramp(s.shoulders.c);
  const k = s.shoulders.size;
  const pts = view === 'side' ? [g.shF] : [g.shF, g.shB];
  for (const sh of pts) {
    const kind = s.shoulders.kind;
    if (kind === 'plate') c.ellS(sh[0], sh[1], k, k * 0.8, r);
    else if (kind === 'fur') { c.ellS(sh[0], sh[1] - 1, k + 1, k * 0.8, r); for (let i = -k; i <= k; i += 2) c.set(sh[0] + i, sh[1] + k * 0.6, r.l); }
    else if (kind === 'bone') { c.ellS(sh[0], sh[1], k, k * 0.7, r); c.line(sh[0], sh[1] - 1, sh[0] + (sh[0] < g.cx ? -k - 1 : k + 1), sh[1] - k - 1, r.ll, 1); }
    else if (kind === 'spike') { c.ellS(sh[0], sh[1], k, k * 0.8, r); c.line(sh[0], sh[1] - 1, sh[0] + (sh[0] < g.cx ? -2 : 2), sh[1] - k - 2, r.l, 2); }
    else if (kind === 'crystal') { c.polyS([[sh[0] - k, sh[1] + 1], [sh[0], sh[1] - k - 2], [sh[0] + k, sh[1] + 1]], r); }
    else c.ellS(sh[0], sh[1], k, k * 0.7, r);
  }
}

// ---------------------------------------------------------------- heads
function drawHead(c: PC, s: CharSpec, g: Rig, view: View) {
  const x = g.headX, y = g.headY, r = g.hr;
  const skin = ramp(s.skin);
  const hair = ramp(s.hair ?? '#3a2a20');
  const helm = ramp(s.helm ?? '#9aa4b4');
  const acc = ramp(s.accent ?? '#c8a040');
  const eye: RGBA = s.eye ? hex(s.eye) : hex('#1a1a22');
  const face = view !== 'up';
  const fx = view === 'side' ? 1 : 0; // face offset forward
  const drawFace = (glow = false) => {
    if (!face) return;
    if (view === 'down') { c.set(x - 2, y, eye); c.set(x + 1, y, eye); if (glow) { c.set(x - 2, y - 1, mix(eye, [255, 255, 255, 255], 0.4)); c.set(x + 1, y - 1, mix(eye, [255, 255, 255, 255], 0.4)); } }
    else { c.set(x + 2, y, eye); if (glow) c.set(x + 3, y, mix(eye, [255, 255, 255, 255], 0.3)); }
  };
  const baseHead = () => c.ellS(x + fx * 0.3, y, r, r, skin);
  switch (s.head) {
    case 'rock': {
      const rk = ramp('#8a8270');
      c.ellS(x, y + 1, r + 1.5, r + 0.5, rk);
      c.ellS(x - 2, y - 2, 2.5, 2, ramp('#9a927e'));
      c.rect(x - r, y - 3, 3, 1, ramp('#4a8a3a').m);
      const e: RGBA = hex('#ffa030');
      if (view === 'down') { c.rect(x - 3, y, 2, 1, e); c.rect(x + 1, y, 2, 1, e); c.rect(x - 1, y + 3, 3, 1, rk.dd); }
      else if (view === 'side') { c.rect(x + 2, y, 2, 1, e); }
      break;
    }
    case 'greatHelm': {
      c.ellS(x, y, r + 0.5, r + 0.5, helm);
      if (view === 'down') { c.rect(x - r + 1, y - 0.5, r * 2 - 1, 1.5, hex('#20242c')); c.rect(x - 0.5, y - 0.5, 1, 4, hex('#20242c')); }
      else if (view === 'side') c.rect(x + 1, y - 0.5, r, 1.5, hex('#20242c'));
      c.rect(x - 0.5, y - r - 3, 2, 3, acc.m);
      c.line(x, y - r - 3, x - (view === 'side' ? 4 : 0), y - r - 5 - (view === 'up' ? 0 : 0), ramp(s.accent ?? '#3a6ad8').l, 2);
      break;
    }
    case 'hornHelm': {
      c.ellS(x, y, r + 0.5, r + 0.3, helm);
      const hc = ramp('#e0d8c0');
      if (view === 'side') { c.line(x - 1, y - r + 1, x - 4, y - r - 4, hc.m, 2); c.set(x - 5, y - r - 5, hc.l); }
      else { c.line(x - r + 1, y - r + 2, x - r - 3, y - r - 3, hc.m, 2); c.line(x + r - 1, y - r + 2, x + r + 3, y - r - 3, hc.m, 2); }
      if (view === 'down') { c.set(x - 2, y, hex('#c060ff')); c.set(x + 1, y, hex('#c060ff')); c.rect(x - r + 1, y + 2, r * 2 - 1, 1, helm.d); }
      else if (view === 'side') c.set(x + 2, y, hex('#c060ff'));
      break;
    }
    case 'wildHair': {
      baseHead();
      drawFace();
      c.ellS(x - fx, y - 2, r + 1, r * 0.75, hair);
      for (let i = -r; i <= r; i += 2) c.set(x + i, y - r - 1 - ((i + 9) % 3), hair.l);
      if (face) { // beard
        if (view === 'down') c.polyS([[x - 3, y + 2], [x + 3, y + 2], [x, y + 6]], hair);
        else c.polyS([[x, y + 2], [x + 3, y + 2], [x + 1, y + 6]], hair);
        if (view === 'down') { c.rect(x - 3, y - 1, 1, 2, hex('#c02020')); c.rect(x + 2, y - 1, 1, 2, hex('#c02020')); }
      }
      if (view === 'up') c.ellS(x, y, r + 1, r, hair);
      break;
    }
    case 'ponytail': {
      baseHead();
      drawFace();
      c.ellS(x - fx, y - 2, r + 0.5, r * 0.6, hair);
      if (view === 'side') { c.line(x - r, y - 2, x - r - 3, y + 4, hair.m, 2); }
      else if (view === 'up') { c.ellS(x, y - 1, r + 0.5, r, hair); c.line(x, y + 1, x, y + 7, hair.m, 2); }
      else c.rect(x - r, y - 2, 1, 4, hair.d);
      break;
    }
    case 'redHood': case 'sageHood': case 'shadowHood': {
      const hood = ramp(s.helm ?? '#702030');
      c.ellS(x, y - 0.5, r + 1, r + 1, hood);
      if (face) {
        const fcx = view === 'side' ? x + 2 : x;
        c.ell(fcx, y + 0.5, view === 'side' ? r * 0.55 : r * 0.7, r * 0.7, s.head === 'shadowHood' ? hex('#14101c') : shade(skin.m, -0.25));
        const ec: RGBA = hex(s.eye ?? '#ff3030');
        if (view === 'down') { c.set(x - 2, y, ec); c.set(x + 1, y, ec); }
        else c.set(fcx + 1, y, ec);
        if (s.head === 'shadowHood' && view === 'down') c.rect(x - 2, y + 2, 4, 2, ramp('#3a2a50').m);
        if (s.head === 'sageHood') { // white beard
          const bd = ramp('#e8e4dc');
          if (view === 'down') c.polyS([[x - 3, y + 2], [x + 3, y + 2], [x, y + 8]], bd);
          else c.polyS([[fcx - 1, y + 2], [fcx + 2, y + 2], [fcx, y + 7]], bd);
        }
      }
      c.set(x, y - r - 1, hood.ll);
      break;
    }
    case 'flameHair': {
      baseHead();
      drawFace(true);
      const f1 = ramp('#ff7a1a'), f2 = ramp('#ffd040');
      c.ellS(x - fx, y - 2, r + 1, r * 0.7, f1);
      for (let i = -r; i <= r; i += 2) { c.line(x + i, y - r, x + i - 1, y - r - 3 - (Math.abs(i) % 3), f1.m, 1); c.set(x + i - 1, y - r - 3 - (Math.abs(i) % 3), f2.l); }
      if (view === 'up') c.ellS(x, y, r + 1, r + 0.5, f1);
      if (view === 'side') c.line(x - r, y - 1, x - r - 2, y + 5, f1.d, 2);
      break;
    }
    case 'longWhite': {
      baseHead();
      drawFace();
      c.ellS(x - fx, y - 2, r + 0.8, r * 0.7, hair);
      if (view === 'down') { c.rect(x - r - 1, y - 2, 2, r + 5, hair.m); c.rect(x + r - 1, y - 2, 2, r + 5, hair.m); }
      else if (view === 'up') c.rectS(x - r - 1, y - 3, r * 2 + 2, r + 7, hair);
      else c.rectS(x - r - 1, y - 3, 3, r + 6, hair);
      // ice tiara
      c.set(x, y - r - 1, hex('#bff4ff')); c.set(x - 2, y - r, hex('#7fd8ff')); c.set(x + 2, y - r, hex('#7fd8ff'));
      break;
    }
    case 'bandana': {
      baseHead();
      drawFace();
      c.ellS(x - fx, y - 2, r + 0.4, r * 0.65, hair);
      const band = ramp(s.helm ?? '#2a5a2a');
      if (view === 'down') c.rect(x - r, y + 1, r * 2 + 1, 3, band.m);
      else if (view === 'side') { c.rect(x - 1, y + 1, r + 2, 3, band.m); c.line(x - r, y - 1, x - r - 3, y + 2, band.d, 1); }
      else { c.ellS(x, y, r + 0.5, r, hair); c.line(x - 1, y, x - 3, y + 4, band.m, 1); }
      break;
    }
    case 'silverHair': {
      baseHead();
      drawFace();
      c.ellS(x - fx - 0.5, y - 2, r + 0.6, r * 0.65, hair);
      if (view !== 'up') { c.line(x - r, y - 3, x - r - 2, y - 6, hair.l, 1); c.line(x + r, y - 3, x + r + 1, y - 6, hair.l, 1); }
      else c.ellS(x, y, r + 0.6, r, hair);
      if (view === 'down') { c.set(x - 2, y, hex('#40f0ff')); c.set(x + 1, y, hex('#40f0ff')); }
      else if (view === 'side') c.set(x + 2, y, hex('#40f0ff'));
      break;
    }
    case 'elf': {
      baseHead();
      drawFace();
      c.ellS(x - fx, y - 2, r + 0.7, r * 0.65, hair);
      if (view === 'down') { c.line(x - r, y, x - r - 3, y - 3, skin.m, 1); c.line(x + r, y, x + r + 3, y - 3, skin.m, 1); c.rect(x - r - 1, y - 2, 1, r + 2, hair.m); c.rect(x + r, y - 2, 1, r + 2, hair.m); }
      else if (view === 'side') { c.line(x - 1, y, x - 4, y - 3, skin.l, 1); c.rect(x - r - 1, y - 2, 2, r + 3, hair.m); }
      else { c.ellS(x, y, r + 0.7, r, hair); c.line(x - r, y, x - r - 3, y - 3, skin.d, 1); c.line(x + r, y, x + r + 3, y - 3, skin.d, 1); }
      break;
    }
    case 'bun': {
      baseHead();
      drawFace();
      c.ellS(x - fx, y - 2, r + 0.5, r * 0.65, hair);
      c.ellS(x - fx * 2, y - r - 1, 2, 2, hair);
      // goggles on forehead
      if (view !== 'up') { c.rect(x - r + 1 + fx, y - 3, r * 2 - 1 - fx * 3, 2, hex('#3a3028')); c.set(x - 2 + fx * 3, y - 3, hex('#80e0ff')); if (view === 'down') c.set(x + 1, y - 3, hex('#80e0ff')); }
      // scarf
      c.rect(x - r, y + r - 1, r * 2 + 1, 2, ramp('#c03028').m);
      break;
    }
    case 'minerHelm': {
      baseHead();
      drawFace();
      const beard = ramp(s.hair ?? '#d0702a');
      if (face) {
        if (view === 'down') c.polyS([[x - r - 0.5, y + 1], [x + r + 0.5, y + 1], [x + 2, y + 8], [x - 2, y + 8]], beard);
        else c.polyS([[x - 1, y + 1], [x + r + 0.5, y + 1], [x + 2, y + 8], [x - 1, y + 7]], beard);
        if (view === 'down') c.rect(x - 2, y + 2, 4, 1, beard.l);
      }
      c.ellS(x, y - 2, r + 1, r * 0.7, helm);
      c.rect(x - r - 1, y - 1, r * 2 + 3, 1, helm.d);
      if (view !== 'up') { c.ellS(x + (view === 'side' ? r : 0), y - 3, 1.5, 1.5, ramp('#ffe880')); }
      break;
    }
    case 'wolfHood': {
      baseHead();
      drawFace();
      const fur = ramp(s.helm ?? '#7a7a80');
      c.ellS(x - fx, y - 2.5, r + 1.2, r * 0.8, fur);
      if (view === 'down') { c.polyS([[x - r - 1, y - 4], [x - r + 1, y - r - 4], [x - r + 3, y - 4]], fur); c.polyS([[x + r + 1, y - 4], [x + r - 1, y - r - 4], [x + r - 3, y - 4]], fur); c.rect(x - 2, y - r, 4, 2, fur.l); c.set(x - 2, y - r + 1, hex('#ffd040')); c.set(x + 1, y - r + 1, hex('#ffd040')); }
      else if (view === 'side') { c.polyS([[x + r + 4, y - 3], [x + r - 1, y - r], [x, y - 3]], fur); c.polyS([[x - 2, y - r - 1], [x, y - r - 5], [x + 1, y - r]], fur); c.set(x + r + 1, y - 4, hex('#ffd040')); }
      else { c.ellS(x, y, r + 1.2, r + 0.5, fur); c.rectS(x - 3, y + 2, 6, 6, fur); }
      if (face && view === 'down') { c.rect(x - 3, y + 1, 1, 2, hex('#e0e0d0')); c.rect(x + 2, y + 1, 1, 2, hex('#e0e0d0')); }
      break;
    }
    case 'skull': {
      const bone = ramp('#e6dfc8');
      c.ellS(x, y, r + 0.3, r + 0.3, bone);
      if (view === 'down') { c.rect(x - 3, y - 1, 2, 2, hex('#101010')); c.rect(x + 1, y - 1, 2, 2, hex('#101010')); c.set(x - 2, y - 1, hex('#60ff90')); c.set(x + 2, y - 1, hex('#60ff90')); c.rect(x - 2, y + 2, 5, 1, bone.d); }
      else if (view === 'side') { c.rect(x + 1, y - 1, 2, 2, hex('#101010')); c.set(x + 2, y - 1, hex('#60ff90')); c.rect(x + 1, y + 2, 3, 1, bone.d); }
      // hood behind/around
      const hood = ramp(s.helm ?? '#2a2430');
      if (view === 'up') c.ellS(x, y, r + 1.2, r + 1.2, hood);
      else c.ring(x, y, r + 1, r + 1, hood.m, 1);
      // crown spikes
      for (let i = -2; i <= 2; i += 2) c.set(x + i, y - r - 2, bone.l);
      break;
    }
    case 'goggles': {
      baseHead();
      drawFace();
      c.ellS(x - fx, y - 2, r + 0.6, r * 0.7, hair);
      if (view === 'side') c.line(x - r, y - 2, x - r - 2, y + 3, hair.m, 2);
      if (view === 'up') c.ellS(x, y - 0.5, r + 0.6, r, hair);
      c.rect(x - r, y - 3, r * 2 + 1, 1, hex('#5a4030'));
      if (view === 'down') { c.ellS(x - 2, y - 3, 1.5, 1.2, ramp('#40e0c0')); c.ellS(x + 2, y - 3, 1.5, 1.2, ramp('#40e0c0')); }
      else if (view === 'side') c.ellS(x + 1, y - 3, 1.5, 1.2, ramp('#40e0c0'));
      break;
    }
  }
}

// ---------------------------------------------------------------- weapons
function vec(a: number, l: number): [number, number] {
  return [Math.sin(a) * l, -Math.cos(a) * l];
}
export function drawWeapon(c: PC, kind: WeaponKind, hx: number, hy: number, a: number, col: string, col2: string) {
  const m = ramp(col), m2 = ramp(col2);
  const ln = (len: number, th: number, r: Ramp, off = 0) => {
    const [dx, dy] = vec(a, 1);
    c.line(hx + dx * off, hy + dy * off, hx + dx * (off + len), hy + dy * (off + len), r.m, th);
    if (th >= 2) c.line(hx + dx * off - 0.5, hy + dy * off - 0.5, hx + dx * (off + len) - 0.5, hy + dy * (off + len) - 0.5, r.l, 1);
  };
  const at = (d: number): [number, number] => { const [dx, dy] = vec(a, d); return [hx + dx, hy + dy]; };
  const perp = (d: number, side: number): [number, number] => { const [dx, dy] = vec(a + Math.PI / 2, side); const [px, py] = at(d); return [px + dx, py + dy]; };
  switch (kind) {
    case 'sword': {
      ln(3, 2, ramp('#5a3a20'), -2);
      const g1 = perp(1, -3), g2 = perp(1, 3);
      c.line(g1[0], g1[1], g2[0], g2[1], m2.m, 2);
      ln(11, 2, m, 1);
      const t = at(12); c.set(t[0], t[1], m.ll);
      break;
    }
    case 'axe': {
      ln(17, 2, ramp('#6a4426'), -4);
      const b = at(11);
      const [px, py] = vec(a + Math.PI / 2, 1);
      const pts: [number, number][] = [[b[0], b[1]], [b[0] + px * 7 + vec(a, 4)[0], b[1] + py * 7 + vec(a, 4)[1]], [b[0] + px * 8 - vec(a, 3)[0], b[1] + py * 8 - vec(a, 3)[1]], [b[0] - vec(a, 3)[0], b[1] - vec(a, 3)[1]]];
      c.polyS(pts, m);
      const pts2: [number, number][] = [[b[0], b[1]], [b[0] - px * 5 + vec(a, 3)[0], b[1] - py * 5 + vec(a, 3)[1]], [b[0] - px * 5 - vec(a, 2)[0], b[1] - py * 5 - vec(a, 2)[1]], [b[0] - vec(a, 2)[0], b[1] - vec(a, 2)[1]]];
      c.polyS(pts2, m);
      c.line(b[0] + px * 8 + vec(a, 3.5)[0], b[1] + py * 8 + vec(a, 3.5)[1], b[0] + px * 8 - vec(a, 3)[0], b[1] + py * 8 - vec(a, 3)[1], hex('#c02020'), 1);
      break;
    }
    case 'rapier': {
      const g1 = perp(0.5, -2), g2 = perp(0.5, 2);
      c.line(g1[0], g1[1], g2[0], g2[1], m2.l, 1);
      c.ring(hx, hy, 1.5, 1.5, m2.m);
      ln(15, 1, m, 1);
      break;
    }
    case 'curved': {
      ln(3, 2, ramp('#3a1a1a'), -2);
      for (let i = 1; i < 12; i++) { const p = at(i); const [qx, qy] = vec(a + Math.PI / 2, (i * i) / 40); c.set(p[0] + qx, p[1] + qy, i % 3 === 0 ? hex('#ff4040') : m.m); c.set(p[0] + qx + 0.6, p[1] + qy, m.l); }
      break;
    }
    case 'dagger': case 'poisonDagger': {
      ln(2, 2, ramp('#3a2a2a'), -1);
      ln(6, 2, m, 1);
      const t = at(7); c.set(t[0], t[1], kind === 'poisonDagger' ? hex('#80ff60') : m.ll);
      if (kind === 'poisonDagger') { const d2 = at(4); c.set(d2[0] + 1, d2[1] + 2, hex('#60e040')); }
      break;
    }
    case 'glaive': {
      ln(16, 2, ramp('#2a3a4a'), -6);
      const t = at(10);
      const [px, py] = vec(a + Math.PI / 2, 1);
      c.polyS([[t[0], t[1]], [t[0] + px * 3 + vec(a, 5)[0], t[1] + py * 3 + vec(a, 5)[1]], [t[0] + vec(a, 8)[0], t[1] + vec(a, 8)[1]]], m);
      const bt = at(-6);
      c.polyS([[bt[0], bt[1]], [bt[0] - px * 3 - vec(a, 4)[0], bt[1] - py * 3 - vec(a, 4)[1]], [bt[0] - vec(a, 6)[0], bt[1] - vec(a, 6)[1]]], m);
      c.glow(t[0], t[1], 4, hex('#40f0ff', 200));
      break;
    }
    case 'staffFire': case 'staffIce': case 'staffVoid': {
      ln(20, 2, ramp(kind === 'staffIce' ? '#c8d8e8' : '#5a3a28'), -7);
      const t = at(13);
      const gc = kind === 'staffFire' ? '#ff8020' : kind === 'staffIce' ? '#7fdcff' : '#b060ff';
      if (kind === 'staffIce') c.polyS([[t[0], t[1] - 4], [t[0] + 2.5, t[1]], [t[0], t[1] + 3], [t[0] - 2.5, t[1]]], ramp(gc));
      else { c.ring(t[0], t[1], 2.5, 2.5, m2.m, 1); c.ellS(t[0], t[1], 1.7, 1.7, ramp(gc)); }
      c.glow(t[0], t[1], 5, hex(gc, 160));
      break;
    }
    case 'bow': {
      const [px, py] = vec(a + Math.PI / 2, 1);
      const [dx, dy] = vec(a, 1);
      // bow is perpendicular to arm direction, curved toward aim
      const pts: [number, number][] = [];
      for (let i = -9; i <= 9; i++) pts.push([hx + px * i + dx * (3 - (i * i) / 27), hy + py * i + dy * (3 - (i * i) / 27)]);
      for (let k = 0; k < pts.length - 1; k++) c.line(pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1], m.m, 2);
      c.line(pts[0][0], pts[0][1], pts[pts.length - 1][0], pts[pts.length - 1][1], hex('#f0f0e0', 200), 1);
      break;
    }
    case 'crossbow': {
      ln(8, 2, ramp('#6a4428'), -1);
      const t = at(5);
      const [px, py] = vec(a + Math.PI / 2, 1);
      c.line(t[0] - px * 4, t[1] - py * 4, t[0] + px * 4, t[1] + py * 4, m.m, 2);
      c.set(at(8)[0], at(8)[1], m2.l);
      break;
    }
    case 'bomb': {
      const t = at(2);
      c.ellS(t[0], t[1], 3, 3, ramp('#2a2a32'));
      c.line(t[0] + 1, t[1] - 3, t[0] + 3, t[1] - 5, hex('#c8a060'), 1);
      c.set(t[0] + 3, t[1] - 6, hex('#ffd040'));
      c.set(t[0] - 1, t[1] - 1, hex('#80808a'));
      break;
    }
    case 'spear': {
      ln(20, 2, ramp('#8a6a40'), -8);
      const t = at(12);
      c.polyS([[t[0] + vec(a, 6)[0], t[1] + vec(a, 6)[1]], [t[0] + vec(a + 1.5, 2.5)[0], t[1] + vec(a + 1.5, 2.5)[1]], [t[0] + vec(a - 1.5, 2.5)[0], t[1] + vec(a - 1.5, 2.5)[1]]], ramp('#e8e0c8'));
      const f = at(10); c.set(f[0] + 1, f[1], hex('#c03030')); c.set(f[0] + 1, f[1] + 1, hex('#c03030'));
      break;
    }
    case 'scythe': {
      ln(21, 2, ramp('#3a3030'), -8);
      const t = at(13);
      const [px, py] = vec(a + Math.PI / 2, 1);
      for (let i = 0; i < 9; i++) { const q = i / 8; c.line(t[0] + px * i - vec(a, q * q * 4)[0], t[1] + py * i - vec(a, q * q * 4)[1], t[0] + px * i - vec(a, q * q * 4 - 1.5 + q)[0], t[1] + py * i - vec(a, q * q * 4 - 1.5 + q)[1], i > 6 ? m.l : m.m, 1); }
      c.glow(t[0], t[1], 4, hex('#60ff90', 160));
      break;
    }
    case 'wrench': {
      ln(12, 2, m, -2);
      const t = at(10);
      c.ellS(t[0], t[1], 2.5, 2.5, m2);
      c.set(t[0], t[1], hex('#40f0d0'));
      break;
    }
    case 'chainHook': {
      for (let i = 0; i < 8; i += 2) { const p = at(i); c.ring(p[0], p[1], 1, 1, m.m); }
      const t = at(9);
      const [px, py] = vec(a + Math.PI / 2, 1);
      c.line(t[0], t[1], t[0] + vec(a, 3)[0], t[1] + vec(a, 3)[1], m.l, 2);
      c.line(t[0] + vec(a, 3)[0], t[1] + vec(a, 3)[1], t[0] + px * 3 + vec(a, 1)[0], t[1] + py * 3 + vec(a, 1)[1], m.l, 1);
      break;
    }
    case 'none': break;
  }
}

function drawOff(c: PC, kind: OffKind, hx: number, hy: number, a: number, col: string, view: View, behind: boolean) {
  const r = ramp(col);
  switch (kind) {
    case 'towerShield': {
      if (view === 'side' && behind) return;
      const w = view === 'side' ? 4 : 10, h = 14;
      const x = hx - w / 2 + (view === 'side' ? 2 : 0), y = hy - h / 2;
      c.rectS(x, y, w, h, r);
      c.rect(x, y, w, 1, ramp('#d8b04a').m); c.rect(x, y + h - 1, w, 1, ramp('#d8b04a').d);
      if (view !== 'side') { c.rect(x + w / 2 - 1, y + 3, 2, 8, ramp('#d8b04a').l); c.rect(x + 2, y + 6, w - 4, 2, ramp('#d8b04a').l); }
      else c.rect(x + 1, y + 2, 1, h - 4, r.l);
      break;
    }
    case 'chain': {
      for (let i = 0; i < 4; i++) c.ring(hx + Math.sin(a) * i * 2, hy + 1 + i * 2, 1, 1, ramp('#8a8a96').m);
      break;
    }
    case 'dagger': drawWeapon(c, 'dagger', hx, hy, a, '#c8c8d8', '#5a3a6a'); break;
    case 'crossbow': drawWeapon(c, 'crossbow', hx, hy, a, '#8a5a30', '#c8c8c8'); break;
    case 'flame': c.glow(hx, hy - 2, 5, hex('#ff9020', 220)); c.ellS(hx, hy - 2, 2, 2.5, ramp('#ffb040')); c.set(hx, hy - 4, hex('#fff0a0')); break;
    case 'orb': c.glow(hx, hy - 3, 5, hex(col, 200)); c.ellS(hx, hy - 3, 2.5, 2.5, r); c.set(hx - 1, hy - 4, r.ll); break;
    case 'runeCube': c.rectS(hx - 2, hy - 6, 4, 4, ramp('#40d0b0')); c.set(hx, hy - 5, hex('#e0fff8')); c.glow(hx, hy - 4, 4, hex('#40f0d0', 150)); break;
    case 'poisonVial': c.rectS(hx - 1, hy - 4, 3, 4, ramp('#50c040')); c.set(hx, hy - 5, hex('#8a6a40')); break;
    case 'none': break;
  }
}

/** Render one character frame */
export function drawCharacter(spec: CharSpec, dir: Dir4, p: Pose): PC {
  const view: View = dir === 'left' || dir === 'right' ? 'side' : dir;
  const c = new PC(48, 48);
  const g = rig(spec, view, p);
  const limbR = ramp(spec.top), skinR = ramp(spec.skin), legR = ramp(spec.legs), bootR = ramp(spec.boots);
  const armCol = spec.chest === 'bare' ? skinR : limbR;
  const wc = spec.wcol ?? '#c8ccd8', wc2 = spec.wcol2 ?? '#c8a040', oc = spec.ocol ?? '#3a5aa8';
  const showW = !p.hideWeapon;
  const GRIP = new Set(['sword', 'axe', 'glaive', 'spear', 'scythe', 'staffFire', 'staffIce', 'staffVoid', 'curved', 'rapier', 'wrench']);
  if (GRIP.has(spec.weapon)) g.wAngF += view === 'side' ? -Math.PI / 2 : view === 'down' ? Math.PI * 0.75 : -Math.PI * 0.75;

  // shadow
  c.ell(24 + (view === 'side' ? p.lean * 0.5 : 0), FOOT_Y, g.tw / 2 + 3, 2, [0, 0, 0, 70]);

  if (view === 'side') {
    drawCape(c, spec, g, view, p, false);
    if (spec.backpack) { c.rectS(g.cx - g.tw / 2 - 3, g.top + 1, 5, 8, ramp(spec.backpack)); c.rect(g.cx - g.tw / 2 - 3, g.top + 3, 5, 1, ramp('#3a2a20').m); }
    // far arm + offhand
    drawOff(c, spec.off, g.hB[0], g.hB[1], g.wAngB, oc, view, true);
    drawArm(c, g.shB, g.elB, g.hB, { ...armCol, m: armCol.d, l: armCol.m, d: armCol.dd }, skinR, g.aw);
    drawLeg(c, g.cx - 1, g.hipY, g.footB, { ...legR, m: legR.d, l: legR.m, d: legR.dd }, bootR, g.lw, view);
    drawLeg(c, g.cx + 1, g.hipY, g.footA, legR, bootR, g.lw, view);
    drawRobe(c, spec, g, view, p);
    drawTorso(c, spec, g, view);
    drawShoulders(c, spec, g, view);
    drawHead(c, spec, g, view);
    if (spec.off === 'towerShield') drawOff(c, spec.off, g.hF[0] + 1, g.hF[1] - 3, g.wAngF, oc, view, false);
    if (showW && spec.off !== 'towerShield') drawWeapon(c, spec.weapon, g.hF[0], g.hF[1], g.wAngF, wc, wc2);
    if (showW && spec.off === 'towerShield') drawWeapon(c, spec.weapon, g.hB[0], g.hB[1], g.wAngB, wc, wc2);
    drawArm(c, g.shF, g.elF, g.hF, armCol, skinR, g.aw);
  } else if (view === 'down') {
    drawCape(c, spec, g, view, p, false);
    drawLeg(c, g.cx - g.tw / 4 - 0.5, g.hipY, g.footA, legR, bootR, g.lw, view);
    drawLeg(c, g.cx + g.tw / 4 + 0.5, g.hipY, g.footB, legR, bootR, g.lw, view);
    drawRobe(c, spec, g, view, p);
    drawTorso(c, spec, g, view);
    drawArm(c, g.shF, g.elF, g.hF, armCol, skinR, g.aw);
    drawArm(c, g.shB, g.elB, g.hB, armCol, skinR, g.aw);
    drawShoulders(c, spec, g, view);
    drawHead(c, spec, g, view);
    if (showW) drawWeapon(c, spec.weapon, g.hF[0], g.hF[1], g.wAngF, wc, wc2);
    drawOff(c, spec.off, g.hB[0], g.hB[1], g.wAngB, oc, view, false);
  } else {
    // back view: weapons behind body
    if (showW) drawWeapon(c, spec.weapon, g.hF[0], g.hF[1], g.wAngF, wc, wc2);
    drawOff(c, spec.off, g.hB[0], g.hB[1], g.wAngB, oc, view, true);
    drawLeg(c, g.cx - g.tw / 4 - 0.5, g.hipY, g.footB, legR, bootR, g.lw, view);
    drawLeg(c, g.cx + g.tw / 4 + 0.5, g.hipY, g.footA, legR, bootR, g.lw, view);
    drawRobe(c, spec, g, view, p);
    drawTorso(c, spec, g, view);
    if (spec.backpack) c.rectS(g.cx - 4, g.top + 1, 8, 9, ramp(spec.backpack));
    drawArm(c, g.shF, g.elF, g.hF, armCol, skinR, g.aw);
    drawArm(c, g.shB, g.elB, g.hB, armCol, skinR, g.aw);
    drawShoulders(c, spec, g, view);
    drawHead(c, spec, g, view);
    drawCape(c, spec, g, view, p, true);
  }
  spec.extra?.(c, g, view, false);
  // aura / glow
  if (p.glow) {
    const gr = p.glowR ?? 6;
    let gx = g.hF[0], gy = g.hF[1];
    if (p.glowAt === 'body') { gx = g.cx; gy = (g.top + g.hipY) / 2; }
    else if (p.glowAt === 'above') { gx = g.headX; gy = g.headY - g.hr - 6; }
    else if (p.glowAt === 'ground') { gx = 24; gy = FOOT_Y - 1; }
    else if (p.glowAt === 'offhand') { gx = g.hB[0]; gy = g.hB[1]; }
    c.glow(gx, gy, gr, p.glow);
    c.ellS(gx, gy, Math.max(1, gr / 4), Math.max(1, gr / 4), ramp(mix(p.glow, [255, 255, 255, 255], 0.5)));
  }
  let out = c;
  out.outline([24, 18, 28, 255]);
  if (p.flash) out = out.tinted([255, 255, 255, 255], p.flash);
  if (dir === 'left') {
    const f = new PC(48, 48);
    f.blit(out, 0, 0, { flipX: true });
    out = f;
  }
  return out;
}
