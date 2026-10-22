// İnsansı karakterler: oyuncu (Warrior/Mage + zırh/başlık görünümü), NPC'ler; silah ve yardımcı el sprite'ları.
import { PB, shade, OUTLINE } from './pixel.js';
import { ITEMS } from '../data/items.js';

export const HUMAN_W = 24, HUMAN_H = 30;
export const HUMAN_FRAMES = ['idle0', 'idle1', 'walk0', 'walk1', 'walk2', 'walk3', 'atk0', 'atk1', 'atk2', 'cast0', 'cast1'];

// Kare pozları: el konumu (silah tutma noktası) ve vücut hareketi
const POSES = {
  idle0: { bob: 0, lb: 0, lf: 0, hb: [9, 18], hf: [16, 18], lean: 0 },
  idle1: { bob: 1, lb: 0, lf: 0, hb: [9, 19], hf: [16, 19], lean: 0 },
  walk0: { bob: 0, lb: -2, lf: 2, hb: [10, 18], hf: [15, 18], lean: 0 },
  walk1: { bob: 1, lb: 0, lf: 0, lift: 1, hb: [9, 19], hf: [16, 19], lean: 0 },
  walk2: { bob: 0, lb: 2, lf: -2, hb: [8, 18], hf: [17, 18], lean: 0 },
  walk3: { bob: 1, lb: 0, lf: 0, lift: 2, hb: [9, 19], hf: [16, 19], lean: 0 },
  atk0: { bob: 0, lb: -1, lf: 1, hb: [9, 17], hf: [13, 10], lean: -1 },
  atk1: { bob: 0, lb: -2, lf: 3, hb: [8, 18], hf: [20, 15], lean: 1 },
  atk2: { bob: 1, lb: -1, lf: 2, hb: [9, 18], hf: [18, 19], lean: 1 },
  cast0: { bob: 0, lb: 0, lf: 1, hb: [9, 16], hf: [18, 13], lean: 0 },
  cast1: { bob: -1, lb: 0, lf: 1, hb: [7, 11], hf: [18, 10], lean: 0 },
  hurt0: { bob: 0, lb: 1, lf: -1, hb: [8, 17], hf: [14, 17], lean: -1 },   // V2 yaratıkları: darbe alma
};
export function handAnchor(frame, front = true) {
  const p = POSES[frame] || POSES.idle0;
  return front ? p.hf : p.hb;
}

// o: { skin, hair, hairStyle, beard, top, topTrim, pants, boots, robe, build, hat, helm, apron, cape, tier, belt }
export function drawHumanoid(pb, o, frameName) {
  const f = POSES[frameName];
  const skin = o.skin || '#e8b890', skinD = shade(skin, -0.18);
  const big = o.build === 'big' ? 1 : 0;
  const y0 = 2 + f.bob + (o.build === 'short' ? 2 : 0);
  const L = f.lean;
  const top = o.top || '#9a8a6a', topD = shade(top, -0.25), topL = shade(top, 0.18);
  const trim = o.topTrim || shade(top, -0.4);
  const pants = o.pants || '#4a4060', boots = o.boots || '#4a3424';

  // ---- bacaklar
  const legTop = y0 + 18;
  const legLen = 28 - legTop;
  const leg = (x, lift, col) => {
    pb.rect(x, legTop, 3, legLen - lift, col);
    pb.rect(x - (x < 12 ? 0 : 0), 28 - 2 - lift, 4, 2, boots);
    pb.hline(x, x + 3, 28 - lift - 1 + 1, shade(boots, -0.3));
  };
  if (!o.robe) {
    leg(9 + f.lb, f.lift === 1 ? 1 : 0, shade(pants, -0.2));
    leg(12 + f.lf, f.lift === 2 ? 1 : 0, pants);
  } else {
    pb.rect(9 + f.lb, 26, 4, 2, boots);
    pb.rect(12 + f.lf, 26, 4, 2, shade(boots, 0.1));
  }

  // ---- arka kol
  const shoulderB = [10 + L, y0 + 11];
  pb.thick(shoulderB[0], shoulderB[1], f.hb[0] + L * 0, f.hb[1], o.sleeve ? shade(o.sleeve, -0.2) : topD, 3);
  pb.disc(f.hb[0], f.hb[1], 1.3, skinD);

  // ---- gövde
  const bx = 9 + L, by = y0 + 10;
  if (o.robe) {
    pb.poly([[bx - 1, by], [bx + 8, by], [bx + 10 + (f.lf > 0 ? 1 : 0), 27], [bx - 3 + (f.lb < 0 ? -1 : 0), 27]], top);
    pb.vline(bx, by + 1, 26, topD); pb.vline(bx + 6, by + 1, 26, topL);
    pb.hline(bx - 3, bx + 10, 27, trim);
    pb.vline(bx + 4, by + 2, 26, trim);
  } else {
    pb.rect(bx, by, 7 + big, 9, top);
    pb.vline(bx, by, by + 8, topD); pb.vline(bx + 5 + big, by + 1, by + 7, topL);
  }
  if (o.belt !== false) pb.hline(bx, bx + 6 + big, by + 7, o.beltColor || '#4a3020');
  if (o.apron) { pb.rect(bx + 1, by + 3, 5, 9, o.apron); pb.hline(bx + 1, bx + 5, by + 3, shade(o.apron, 0.2)); }
  // zırh süslemeleri
  const tier = o.tier ?? -1;
  if (tier >= 1 && !o.robe) { pb.hline(bx, bx + 6, by + 1, trim); pb.vline(bx + 3, by + 1, by + 6, trim); }
  if (tier >= 2 && !o.robe) { pb.rect(bx - 1, by - 1, 4, 3, shade(top, 0.25)); pb.rect(bx + 5, by - 1, 3, 3, shade(top, 0.1)); pb.hline(bx - 1, bx + 2, by - 1, shade(top, 0.45)); }
  if (tier >= 4) { pb.rect(bx - 2, by - 2, 5, 4, shade(top, 0.2)); pb.set(bx, by - 1, trim); pb.set(bx + 6, by, trim); pb.set(bx + 3, by + 4, trim); pb.set(bx + 3, by + 5, trim); }
  if (o.robe && tier >= 1) { pb.hline(bx - 1, bx + 8, by, trim); }
  if (o.robe && tier >= 2) { pb.rect(bx - 1, by - 1, 3, 2, trim); pb.rect(bx + 6, by - 1, 3, 2, trim); }
  if (o.robe && tier >= 4) { pb.set(bx + 4, by + 4, '#e0ffff'); pb.set(bx + 4, by + 9, trim); pb.set(bx + 2, by + 14, trim); pb.set(bx + 6, by + 14, trim); }
  if (o.cape) { pb.rect(bx - 2, by, 2, 12, o.cape); pb.vline(bx - 2, by, by + 12, shade(o.cape, -0.3)); }

  // ---- baş
  const hx = 12 + L, hy = y0 + 5;
  pb.ellipse(hx, hy, 4, 4.3, skin);
  pb.vline(hx - 3, hy - 1, hy + 2, skinD);
  pb.set(hx + 2, hy, '#2a1e24'); // göz
  pb.set(hx + 3, hy + 2, skinD); // burun gölgesi
  if (o.beard) { pb.rect(hx - 1, hy + 2, 5, 3, o.beard); pb.set(hx + 3, hy + 1, o.beard); pb.set(hx, hy + 5, o.beard); }
  if (o.mustache) pb.hline(hx + 1, hx + 3, hy + 2, o.mustache);
  // saç
  if (o.hair && !o.helm) {
    const h = o.hair, hd = shade(h, -0.25);
    pb.ellipse(hx - 0.5, hy - 2.5, 4.4, 2.6, h);
    pb.rect(hx - 4, hy - 2, 3, 4, hd);
    if (o.hairStyle === 'long') { pb.rect(hx - 4, hy, 3, 7, h); pb.vline(hx - 4, hy, hy + 6, hd); }
    if (o.hairStyle === 'braid') { pb.rect(hx - 5, hy + 1, 2, 8, h); pb.set(hx - 5, hy + 4, hd); pb.set(hx - 5, hy + 7, hd); }
    if (o.hairStyle === 'bald') { pb.ellipse(hx - 0.5, hy - 2.5, 4.4, 2.6, skin); pb.rect(hx - 4, hy - 1, 2, 3, h); }
  }
  // şapka / başlık
  const helm = o.helm;
  if (helm) {
    const m = helm.main, t = helm.trim || shade(m, -0.3);
    if (helm.type === 'helm') {
      pb.ellipse(hx, hy - 2, 4.6, 3.6, m); pb.hline(hx - 4, hx + 4, hy, t); pb.vline(hx + 2, hy, hy + 2, m);
      pb.set(hx - 1, hy - 4, shade(m, 0.4));
      if (helm.horn) { pb.line(hx - 4, hy - 3, hx - 6, hy - 7, '#e8dcc0'); pb.line(hx + 3, hy - 4, hx + 4, hy - 8, '#e8dcc0'); }
    } else if (helm.type === 'greathelm') {
      pb.ellipse(hx, hy - 1, 4.8, 4.8, m); pb.rect(hx - 4, hy - 1, 9, 5, m);
      pb.hline(hx, hx + 4, hy, '#1a1418'); pb.vline(hx, hy - 4, hy + 3, t); pb.set(hx - 1, hy - 4, shade(m, 0.4));
      pb.rect(hx - 1, hy - 7, 2, 2, t);
    } else if (helm.type === 'hood') {
      pb.ellipse(hx - 0.5, hy - 1, 5, 5, m); pb.ellipse(hx + 1, hy + 0.5, 3, 3.3, skin); pb.set(hx + 2, hy, '#2a1e24');
      pb.rect(hx - 5, hy, 3, 6, shade(m, -0.2)); pb.hline(hx - 1, hx + 3, hy - 3, t);
    } else if (helm.type === 'hat') {
      pb.hline(hx - 6, hx + 6, hy - 2, shade(m, -0.2)); pb.hline(hx - 5, hx + 5, hy - 3, m);
      pb.poly([[hx - 4, hy - 3], [hx - 1, hy - 12], [hx + 1, hy - 13], [hx + 4, hy - 3]], m);
      pb.line(hx + 1, hy - 13, hx + 4, hy - 11, m);
      pb.hline(hx - 4, hx + 4, hy - 4, t);
      pb.set(hx, hy - 8, t);
      if (o.hair) pb.rect(hx - 4, hy - 1, 2, 4, o.hair);
    }
  }
  if (o.hat === 'scarf') { pb.ellipse(hx - 0.5, hy - 2.5, 4.6, 2.8, o.hatColor); pb.rect(hx - 5, hy - 1, 2, 5, o.hatColor); }
  if (o.hat === 'wizard') {
    pb.hline(hx - 6, hx + 6, hy - 2, shade(o.hatColor, -0.2));
    pb.poly([[hx - 4, hy - 2], [hx - 2, hy - 11], [hx + 4, hy - 2]], o.hatColor);
    pb.set(hx, hy - 6, '#f0d040'); pb.set(hx - 1, hy - 4, '#f0d040');
  }
  if (o.hat === 'minerhelm') {
    pb.ellipse(hx, hy - 2, 4.6, 3.4, '#d0a030'); pb.hline(hx - 5, hx + 5, hy, '#a07820'); pb.rect(hx + 2, hy - 3, 2, 2, '#fff0a0');
  }

  // ---- ön kol
  const shoulderF = [14 + L, y0 + 11];
  const sleeve = o.sleeve || top;
  pb.thick(shoulderF[0], shoulderF[1], f.hf[0], f.hf[1], sleeve, 3);
  if (o.robe) pb.thick(shoulderF[0], shoulderF[1], (shoulderF[0] + f.hf[0]) / 2, (shoulderF[1] + f.hf[1]) / 2 + 1, top, 4);
  pb.disc(f.hf[0], f.hf[1], 1.4, o.glove || skin);
  if (o.bow) { pb.line(bx - 2, by - 2, bx + 2, by + 12, '#6a4628'); pb.line(bx - 1, by - 2, bx - 1, by + 11, '#d8d0c0'); }
  if (o.cane) { pb.vline(f.hf[0] + 1, f.hf[1] - 3, 28, '#6a4628'); }
  if (o.keys) { pb.set(bx + 6, by + 8, '#e0c060'); pb.set(bx + 6, by + 9, '#e0c060'); }
  if (o.extra) o.extra(pb, f, { hx, hy, bx, by, frameName });
  if (o.noOutline !== true) pb.outline(o.outline || OUTLINE);
}

// ------------------------------------------------------------------ oyuncu görünümü
const BASE = {
  warrior: { skin: '#e8b890', hair: '#6a3e22', top: '#9a8a6a', pants: '#4a4060', boots: '#4a3424' },
  mage: { skin: '#f0c8a0', hair: '#2e2a3a', hairStyle: 'long', top: '#5a5a8a', pants: '#3a3a5a', boots: '#3a2a3a', robe: true, belt: false },
};

export function playerLook(cls, equipment) {
  const o = { ...BASE[cls] };
  const chest = equipment?.chest ? ITEMS[equipment.chest.tid] : null;
  const helm = equipment?.helm ? ITEMS[equipment.helm.tid] : null;
  const gloves = equipment?.gloves ? ITEMS[equipment.gloves.tid] : null;
  const bootsI = equipment?.boots ? ITEMS[equipment.boots.tid] : null;
  if (chest) {
    o.top = chest.look.main; o.topTrim = chest.look.trim; o.tier = chest.look.tier;
    if (cls === 'warrior') o.sleeve = shade(chest.look.main, -0.1);
  }
  if (helm) o.helm = helm.look;
  if (gloves) o.glove = gloves.look.main;
  if (bootsI) o.boots = bootsI.look.main;
  return o;
}

export function lookKey(cls, equipment) {
  const g = (s) => equipment?.[s]?.tid || '-';
  return `pl_${cls}_${g('chest')}_${g('helm')}_${g('gloves')}_${g('boots')}`;
}

export function humanSheet(look) {
  return HUMAN_FRAMES.map((fr) => {
    const pb = new PB(HUMAN_W, HUMAN_H);
    drawHumanoid(pb, look, fr);
    return pb;
  });
}

export const NPC_LOOKS = {
  npc_muhtar: { skin: '#e0b090', hair: '#e8e8e8', beard: '#f0f0f0', top: '#7a5a3a', topTrim: '#c0a060', robe: true, cane: true, boots: '#3a2a1a' },
  npc_boran: { skin: '#d8a080', hair: '#3a2a1a', hairStyle: 'bald', beard: '#3a2a1a', top: '#4a4a52', sleeve: '#d8a080', apron: '#6a4628', build: 'big', pants: '#3a3238' },
  npc_mira: { skin: '#f0c8a0', hair: '#b8482a', hairStyle: 'long', top: '#3e8a5a', topTrim: '#e0c060', robe: true, hat: 'scarf', hatColor: '#e0c060' },
  npc_elin: { skin: '#f4d0b0', hair: '#e8c868', hairStyle: 'braid', top: '#e8eef4', topTrim: '#6ab0d8', robe: true },
  npc_hunter: { skin: '#d8a880', helm: { type: 'hood', main: '#3e6a32', trim: '#2a4a22' }, top: '#7a5a32', topTrim: '#3e6a32', pants: '#4a4030', bow: true, tier: 1 },
  npc_sage: { skin: '#e0b898', hair: '#c8c8d0', beard: '#d8d8e0', top: '#3a4a8a', topTrim: '#c0a060', robe: true, hat: 'wizard', hatColor: '#5a3a7a', cane: true },
  npc_keeper: { skin: '#e0a888', hair: '#5a3a2a', hairStyle: 'bald', mustache: '#5a3a2a', top: '#8a5a32', topTrim: '#5a3a20', build: 'big', keys: true },
  npc_miner: { skin: '#d8a078', hair: '#4a3020', beard: '#4a3020', top: '#4a5a7a', pants: '#3a3a4a', hat: 'minerhelm' },
  // V2
  npc_demre: { skin: '#c89070', hair: '#2a1a14', hairStyle: 'long', top: '#8a5a2a', topTrim: '#e0a040', pants: '#4a3a2a', boots: '#2a1e16', hat: 'scarf', hatColor: '#c85a2a', cane: true, tier: 1 },
  npc_yaren: { skin: '#e0a880', hair: '#6a2a1a', hairStyle: 'braid', top: '#5a4a44', sleeve: '#e0a880', apron: '#4a3a2e', pants: '#3a3030', glove: '#3a2a20' },
  npc_ilgar: { skin: '#d8b090', beard: '#8a8a90', helm: { type: 'greathelm', main: '#a8c8dc', trim: '#5a7a9a' }, top: '#4a6a8a', topTrim: '#e0f0ff', cape: '#3a5a7a', tier: 2, pants: '#2e3a4a' },
  npc_scout: { skin: '#d0a080', hair: '#3a2a1a', top: '#6a5a3a', topTrim: '#3a3020', pants: '#4a4030', bow: true, tier: 1, sleeve: '#8a3a2a' },
  npc_sena: { skin: '#f0c8a8', helm: { type: 'hood', main: '#e8eef4', trim: '#7a8a9a' }, top: '#8a9aa8', topTrim: '#e8eef4', pants: '#5a6a7a', bow: true, tier: 1 },
  // V3
  npc_rauf: { skin: '#c89070', beard: '#3a2a1a', mustache: '#3a2a1a', top: '#8a6a3a', topTrim: '#c0a060', pants: '#5a4a3a', hat: 'scarf', hatColor: '#d8c8a0', build: 'big' },
  npc_lale: { skin: '#f0c8a0', hair: '#6a3a1a', hairStyle: 'long', top: '#4a7a5a', topTrim: '#e0d0a0', robe: true, cape: '#3a5a4a' },
  npc_nisa: { skin: '#f4d4b8', hair: '#2a1a2a', hairStyle: 'braid', top: '#6a3a7a', topTrim: '#e0b0ff', robe: true, apron: '#5a4a3a' },
  npc_doruk: { skin: '#d8a078', helm: { type: 'hood', main: '#6a5a3a', trim: '#3a3020' }, top: '#5a6a3a', topTrim: '#3a4020', pants: '#4a4030', bow: true, tier: 1 },
  npc_nil: { skin: '#f0c8a8', hair: '#a0602a', hairStyle: 'long', helm: { type: 'hood', main: '#3e7a42', trim: '#2a5a2e' }, top: '#5a7a3a', topTrim: '#c0d070', pants: '#4a5030', bow: true, tier: 1 },
  npc_fikret: { skin: '#d0a078', hair: '#8a8a8a', beard: '#9a9a9a', top: '#6a5a4a', pants: '#3a3a4a', hat: 'minerhelm', build: 'big', glove: '#4a3a2a' },
  npc_isil: { skin: '#f4dcc8', hair: '#e8e0c8', hairStyle: 'long', top: '#e8f0f0', topTrim: '#4ac0b0', robe: true },
  npc_beril: { skin: '#d8a888', hair: '#3a2018', hairStyle: 'braid', top: '#7a4a2a', topTrim: '#e0a040', pants: '#4a3a2a', boots: '#2a1e16', hat: 'scarf', hatColor: '#c86a2a', tier: 1 },
  npc_kaya: { skin: '#e0b898', hair: '#d0d0d8', beard: '#e0e0e8', top: '#4a5a7a', topTrim: '#d0e0f0', robe: true, hat: 'wizard', hatColor: '#3a4a6a', cane: true },
  npc_seher: { skin: '#f0d8c8', helm: { type: 'hood', main: '#d8d8e0', trim: '#8a8aa0' }, top: '#c8c8d4', topTrim: '#a080c0', robe: true },
  npc_hamit: { skin: '#c8a888', hair: '#b0b0b0', beard: '#c0c0c0', helm: { type: 'hood', main: '#4a4a52', trim: '#2a2a32' }, top: '#5a5a5a', topTrim: '#8a8a8a', robe: true, cane: true },
  npc_eren: { skin: '#d8b090', helm: { type: 'greathelm', main: '#3a3a44', trim: '#8a6ac0' }, top: '#2e2e3a', topTrim: '#a080e0', cape: '#4a2a6a', tier: 3, pants: '#22222c' },
  npc_veysel: { skin: '#e0c0a0', hair: '#8a8a8a', beard: '#9a9a9a', top: '#6a2a2a', topTrim: '#e0c060', robe: true, hat: 'wizard', hatColor: '#4a1a1a' },
  // V3 görev olayı karakterleri
  npc_expedition: { skin: '#d8a888', helm: { type: 'hood', main: '#7a8a9a', trim: '#e8eef4' }, top: '#5a6a7a', topTrim: '#c8d8e8', pants: '#3a4a5a', bow: true, tier: 1 },
  npc_guard: { skin: '#d0a888', helm: { type: 'greathelm', main: '#4a4a54', trim: '#9a8ac0' }, top: '#3a3a46', topTrim: '#9a8ac0', tier: 2, pants: '#2a2a34' },
};

export function npcSheet(key) {
  return ['idle0', 'idle1'].map((fr) => {
    const pb = new PB(HUMAN_W, HUMAN_H);
    drawHumanoid(pb, NPC_LOOKS[key], fr);
    return pb;
  });
}

// ------------------------------------------------------------------ silah sprite'ı (dikey, kabza altta)
// Döner: { pb, ox, oy } — (ox, oy) kabza noktası
export function weaponSprite(tid) {
  const t = ITEMS[tid];
  const L = t.look;
  const len = L.len;
  const W = 14, H = len + 9;
  const pb = new PB(W, H);
  const cx = 7;
  const gy = H - 4; // kabza
  const metal = L.blade || '#c0c8d0';
  switch (L.type) {
    case 'sword': case 'greatsword': case 'fang': {
      const bw = L.type === 'greatsword' ? 3 : 2;
      pb.rect(cx - 1, gy - 1, 2, 5, L.grip); pb.set(cx - 1, gy + 3, L.guard);
      pb.rect(cx - 3 - (bw > 2 ? 1 : 0), gy - 2, 7 + (bw > 2 ? 2 : 0), 2, L.guard);
      pb.rect(cx - bw + 1, gy - 2 - len, bw, len, metal);
      pb.vline(cx - bw + 1, gy - 2 - len, gy - 3, shade(metal, 0.35));
      pb.set(cx, gy - 3 - len, metal);
      if (L.type === 'fang') for (let y = gy - len; y < gy - 3; y += 3) pb.set(cx + 1, y, shade(metal, -0.3));
      if (L.gem) pb.set(cx, gy - 1, L.gem);
      break;
    }
    case 'machete':
      pb.rect(cx - 1, gy - 1, 2, 5, L.grip); pb.rect(cx - 2, gy - 2, 5, 2, L.guard);
      pb.poly([[cx - 1, gy - 2], [cx - 1, gy - 2 - len], [cx + 3, gy - 2 - len + 3], [cx + 2, gy - 2]], metal);
      pb.vline(cx - 1, gy - 2 - len, gy - 3, shade(metal, 0.3));
      break;
    case 'axe':
      pb.rect(cx - 1, gy - len, 2, len + 4, L.grip);
      pb.poly([[cx + 1, gy - len + 1], [cx + 6, gy - len - 2], [cx + 6, gy - len + 8], [cx + 1, gy - len + 5]], metal);
      pb.poly([[cx - 1, gy - len + 2], [cx - 5, gy - len], [cx - 5, gy - len + 6], [cx - 1, gy - len + 5]], shade(metal, -0.2));
      if (L.gem) pb.set(cx, gy - len + 3, L.gem);
      break;
    case 'maul':
      pb.rect(cx - 1, gy - len + 4, 2, len, L.grip);
      pb.rect(cx - 5, gy - len - 2, 11, 7, metal); pb.hline(cx - 5, cx + 5, gy - len - 2, shade(metal, 0.3));
      if (L.gem) { pb.set(cx, gy - len + 1, L.gem); pb.set(cx + 1, gy - len + 1, L.gem); }
      break;
    case 'staff': case 'wand': {
      const shaft = L.shaft;
      pb.rect(cx - 1, gy - len + 3, 2, len + 4, shaft);
      pb.vline(cx - 1, gy - len + 3, gy + 3, shade(shaft, 0.25));
      const oy = gy - len + 1;
      if (L.head === 'orb') { pb.disc(cx, oy, 2.6, L.orb); pb.set(cx - 1, oy - 1, shade(L.orb, 0.5)); pb.hline(cx - 2, cx + 2, oy + 2, shaft); }
      if (L.head === 'crystal') { pb.poly([[cx - 2, oy + 2], [cx, oy - 5], [cx + 2, oy + 2]], L.orb); pb.vline(cx, oy - 3, oy + 1, shade(L.orb, 0.5)); }
      if (L.head === 'skull') { pb.ellipse(cx, oy, 3, 2.5, shaft); pb.set(cx - 1, oy, L.orb); pb.set(cx + 1, oy, L.orb); pb.line(cx - 3, oy - 1, cx - 4, oy - 4, shaft); pb.line(cx + 3, oy - 1, cx + 4, oy - 4, shaft); }
      if (L.head === 'star') { pb.disc(cx, oy, 2, L.orb); pb.set(cx, oy - 4, L.orb); pb.set(cx, oy + 3, L.orb); pb.set(cx - 3, oy, L.orb); pb.set(cx + 3, oy, L.orb); pb.line(cx - 1, oy - 1, cx + 1, oy + 1, '#3a2a4a'); }
      if (L.head === 'root') { pb.line(cx, oy + 2, cx - 3, oy - 2, shaft); pb.line(cx, oy + 2, cx + 3, oy - 3, shaft); pb.disc(cx, oy - 1, 1.5, L.orb); }
      if (L.head === 'flame') { pb.ring(cx, oy, 3.5, '#f0d080'); pb.disc(cx, oy, 2, L.orb); pb.set(cx, oy - 4, '#ffffff'); pb.set(cx - 2, oy - 4, L.orb); pb.set(cx + 2, oy - 5, L.orb); }
      break;
    }
    default:
      pb.rect(cx - 1, 0, 2, H, '#ff00ff');
  }
  pb.outline(OUTLINE);
  return { pb, ox: cx, oy: gy };
}

export function offhandSprite(tid) {
  const L = ITEMS[tid].look;
  const pb = new PB(12, 12);
  if (L.type === 'shield') {
    pb.poly([[1, 1], [10, 1], [10, 6], [5.5, 11], [1, 6]], L.main);
    pb.hline(1, 10, 1, L.rim); pb.vline(1, 1, 6, L.rim); pb.vline(10, 1, 6, shade(L.rim, -0.2));
    pb.disc(5.5, 5, 1.6, L.boss);
  } else if (L.type === 'focus') {
    pb.disc(6, 6, 3.5, L.orb); pb.disc(5, 5, 1.5, shade(L.orb, 0.5)); pb.ring(6, 6, 4.5, L.main);
  } else if (L.type === 'mirror') {
    pb.ellipse(6, 5, 3.5, 4.5, L.main); pb.ellipse(6, 5, 2.5, 3.5, L.orb); pb.set(5, 3, '#ffffff'); pb.rect(5, 9, 2, 3, '#8a7a6a');
  }
  pb.outline(OUTLINE);
  return { pb, ox: 6, oy: 6 };
}
