/* =====================================================================
   04_art_chars.js : oyuncu/NPC piksel karakterleri (katmanlı: ten, saç, kıyafet, şapka)
   pozlar: idle0/1, walk0-3, hold, charge, cast, reel0/1, catch, sad  — ve portreler
   ===================================================================== */
const CH_W = 20, CH_H = 31;
function outfitOf(look) { return typeof look.outfit === 'string' ? (OUTFITS.find(o => o.id === look.outfit) || OUTFITS[0]) : look.outfit; }

function drawHair(pb, look, ox, oy, hat) {
  const hc = HAIR_COLORS[look.hairColor] || HAIR_COLORS[0]; const H = hc[0], HL = hc[1], HD = dark(hc[0], 0.25);
  const st = look.hair | 0; const P = (x, y, c) => pb.set(ox + x, oy + y, c || H);
  const cap = () => { for (let x = 5; x <= 11; x++) P(x, 2); for (let x = 4; x <= 12; x++) { P(x, 3); P(x, 4, x > 9 ? H : H); } for (let x = 4; x <= 7; x++) P(x, 5); P(4, 6); P(4, 7); P(5, 6); P(4, 8, HD); for (let x = 6; x <= 10; x++) P(x, 2, x === 8 ? HL : H); P(7, 3, HL); P(8, 3, HL); };
  switch (st) {
    case 0: cap(); P(11, 5); P(12, 5, HD); break;
    case 1: cap(); [5, 7, 9, 11].forEach(x => { P(x, 1); P(x, 0, HD); }); P(12, 5); P(10, 5, HD); break;
    case 2: cap(); for (let x = 8; x <= 12; x++) P(x, 5); P(12, 6); P(9, 4, HL); P(10, 4, HL); P(7, 4, HD); break;
    case 3: cap(); for (let y = 5; y <= 15; y++) { P(3, y); P(4, y); P(5, y, y > 11 ? HD : H); } P(6, 6); P(11, 5); P(2, 10, HD); P(2, 12, HD); break;
    case 4: cap(); P(11, 5); for (let y = 4; y <= 11; y++) { P(2, y, y % 3 ? H : HD); P(3, y); } P(1, 9); P(1, 10); P(3, 4, '#c84a6a'); P(3, 5, '#c84a6a'); break;
    case 5: cap(); pb.ellipse(ox + 5, oy + 1.5, 2.6, 2.1, H); P(5, 0, HL); P(6, 1, HL); P(11, 5); P(12, 6, HD); break;
    case 6: for (let y = 1; y <= 6; y++) for (let x = 3; x <= 13; x++) { const ins = (y > 1 || (x > 4 && x < 12)) && !(y > 4 && x > 7) && !(y === 6 && x > 5); if (ins) P(x, y, ihash(x, y, 7) < 0.3 ? HL : (ihash(x, y, 3) < 0.25 ? HD : H)); } for (let y = 6; y <= 10; y++) { P(3, y); P(4, y, HD); } P(2, 4); P(14, 3, H); P(8, 0); P(10, 0); P(6, 0); break;
    case 7: cap(); for (let y = 5; y <= 10; y++) { P(3, y); P(4, y); P(5, y, HD); } for (let x = 8; x <= 12; x++) P(x, 5); P(12, 6); P(12, 7); P(3, 11, HD); P(4, 11, HD); break;
  }
}
function drawHat(pb, id, ox, oy) {
  const P = (x, y, c) => pb.set(ox + x, oy + y, c);
  switch (id) {
    case 'klasik': { const c = '#6f7a4a', d = '#535c36', l = '#8a9660'; for (let y = 0; y <= 3; y++) for (let x = 5; x <= 11; x++) P(x, y, y === 0 && (x === 5 || x === 11) ? null : (y === 3 ? d : (x === 6 ? l : c))); for (let x = 3; x <= 13; x++) P(x, 4, x === 3 || x === 13 ? d : c); P(4, 5, d); P(12, 5, d); break; }
    case 'bere': { const c = '#3a6a9a', d = '#2a4e74', l = '#5a8aba'; for (let y = 1; y <= 4; y++) for (let x = 4; x <= 12; x++) { if (y === 1 && (x < 6 || x > 10)) continue; P(x, y, y === 4 ? d : (x % 2 ? c : l)); } P(8, 0, '#e8e2d0'); P(7, 0, '#d8d2c0'); P(9, 0, '#d8d2c0'); break; }
    case 'hasir': { const c = '#e8cf7a', d = '#c8aa52', b = '#b84a3a'; for (let y = 0; y <= 3; y++) for (let x = 5; x <= 11; x++) { if (y === 0 && (x === 5 || x === 11)) continue; P(x, y, y === 3 ? b : ((x + y) % 2 ? c : d)); } for (let x = 1; x <= 15; x++) P(x, 4, (x % 2) ? c : d); P(1, 5, d); P(15, 5, d); break; }
    case 'kaptan': { const w = '#f4f2ea', g = '#d8d4c8'; for (let y = 0; y <= 3; y++) for (let x = 4; x <= 12; x++) { if (y === 0 && (x < 5 || x > 11)) continue; P(x, y, y === 3 ? '#1e2230' : (y === 0 ? g : w)); } for (let x = 9; x <= 14; x++) P(x, 4, '#1a1c26'); P(8, 1, '#e8b830'); P(8, 2, '#c89820'); break; }
    case 'usta': { const c = '#4a7a5a', d = '#355a42'; for (let y = 0; y <= 3; y++) for (let x = 5; x <= 11; x++) { if (y === 0 && (x === 5 || x === 11)) continue; P(x, y, y === 3 ? d : c); } for (let x = 3; x <= 13; x++) P(x, 4, d); P(6, 1, '#e8483a'); P(9, 0, '#f2d030'); P(10, 2, '#3a8ae8'); P(7, 2, '#f0f0f0'); break; }
    case 'kasket': case 'flat': { const c = '#6a6258', d = '#4e4840'; for (let y = 2; y <= 4; y++) for (let x = 4; x <= 12; x++) { if (y === 2 && (x < 5 || x > 11)) continue; P(x, y, y === 4 ? d : c); } for (let x = 10; x <= 14; x++) P(x, 4, d); break; }
    case 'denizci_bere': { const c = '#2a3a66', d = '#1c2848'; for (let y = 1; y <= 4; y++) for (let x = 4; x <= 12; x++) { if (y === 1 && (x < 6 || x > 10)) continue; P(x, y, y === 4 ? '#f4f0e4' : (x % 3 ? c : d)); } P(8, 0, '#c4473f'); P(7, 0, '#c4473f'); break; }
    case 'cicek_taci': { const fl = ['#f26a8a', '#f2d030', '#f4f0f8', '#c87af0']; for (let x = 4; x <= 12; x++) { P(x, 3, '#4a8a3a'); if (x % 2 === 0) { P(x, 2, fl[(x / 2) % 4]); P(x, 1, light(fl[(x / 2) % 4], .3)); } } break; }
    case 'fener_beresi': { const c = '#6a3a8a', d = '#4a2a6a'; for (let y = 1; y <= 4; y++) for (let x = 4; x <= 12; x++) { if (y === 1 && (x < 6 || x > 10)) continue; P(x, y, y === 4 ? d : ((x + y) % 2 ? c : light(c, .15))); } P(8, -0, '#f6d838'); P(8, 0, '#ffe870'); P(7, 0, '#f2a830'); P(9, 0, '#f2a830'); break; }
    case 'bandana': { const c = '#c8423a', d = '#9a2e28'; for (let y = 2; y <= 4; y++) for (let x = 4; x <= 12; x++) { if (y === 2 && (x < 5 || x > 11)) continue; P(x, y, (x + y) % 3 === 0 ? '#f0e0d0' : c); } P(3, 4, d); P(2, 5, d); P(2, 4, c); P(3, 6, d); break; }
  }
}
/* pose: {frame name} -> el noktası döndürür */
function personPB(look, pose) {
  const pb = new PB(CH_W, CH_H);
  const sk = SKINS[look.skin] || SKINS[0], SK = sk[0], SD = sk[1];
  const of = outfitOf(look);
  const broad = look.body === 1;
  const walk = pose.startsWith('walk') ? (+pose[4]) : -1;
  const bob = (walk === 1 || walk === 3 || pose === 'idle1') ? 1 : 0;
  const sad = pose === 'sad' ? 1 : 0;
  const oy = 1 + bob + sad; const ox = 0;
  const P = (x, y, c) => pb.set(ox + x, y, c);
  /* bacaklar */
  const pants = of.pants, pantsD = dark(pants, 0.25), shoe = of.shoes;
  let lA = 6, lB = 9;
  if (walk === 0) { lA = 5; lB = 10; } else if (walk === 2) { lA = 9; lB = 6; }
  const legTop = 22, legBot = 27;
  for (let y = legTop; y <= legBot; y++) { P(lA, y, pantsD); P(lA + 1, y, pantsD); }
  for (let y = legTop; y <= legBot; y++) { P(lB, y, pants); P(lB + 1, y, y === legTop ? pantsD : pants); }
  for (const [lx, c] of [[lA, dark(shoe, 0.2)], [lB, shoe]]) { P(lx, 28, c); P(lx + 1, 28, c); P(lx + 2, 28, c); P(lx, 29, dark(c, 0.3)); P(lx + 1, 29, dark(c, 0.3)); P(lx + 2, 29, dark(c, 0.3)); }
  /* gövde */
  const tx0 = broad ? 4 : 5, tx1 = broad ? 12 : 11; const ty0 = 13 + oy - 1, ty1 = 21;
  const sh = of.shirt, sh2 = of.shirt2;
  for (let y = ty0; y <= ty1; y++) for (let x = tx0; x <= tx1; x++) {
    let c = x === tx0 ? dark(sh, 0.2) : sh;
    if (of.pat === 'plaid') c = ((x % 3 === 0) || (y % 3 === 0)) ? sh2 : (x === tx0 ? dark(sh, .2) : sh);
    else if (of.pat === 'knit') c = (y % 2) ? dark(sh, 0.08) : sh;
    else if (of.pat === 'vest') c = (x <= tx0 + 1 || x >= tx1 - 1 || y > ty1 - 3) ? sh2 : sh;
    else if (of.pat === 'nordic') c = (y === ty0 + 2 || y === ty0 + 4) ? sh2 : (y === ty0 + 3 ? ((x % 2) ? sh2 : sh) : sh);
    else if (of.pat === 'flower') c = ihash(x, y, 4) < 0.18 ? sh2 : (ihash(x, y, 8) < 0.1 ? '#f8f4e8' : sh);
    else if (of.pat === 'buttons' && x === 9) c = (y % 2) ? '#e8c050' : dark(sh, 0.15);
    else if (of.pat === 'rain') c = x === 9 ? sh2 : sh;
    else if (of.pat === 'stripes') c = (y % 2) ? sh2 : (x === tx0 ? dark(sh, 0.15) : sh);
    else if (of.pat === 'logo') c = (y >= ty0 + 2 && y <= ty0 + 4 && x >= 8 && x <= 10) ? sh2 : (x === tx0 ? dark(sh, .2) : sh);
    if (y === ty0 && x > tx0 + 1 && x < tx1 - 1) c = light(c, 0.18);
    if (y === ty1) c = dark(c, 0.18);
    P(x, y, c);
  }
  if (of.pat === 'rain') { for (let x = tx0; x <= tx1; x++) { P(x, 22, sh); P(x, 23, x === tx0 ? dark(sh, .2) : sh); } P(9, 22, sh2); }
  if (of.pat === 'apron' || of.pat === 'overalls') {
    const ac = of.apron; for (let y = ty0 + 2; y <= (of.pat === 'apron' ? 24 : 21); y++) for (let x = 7; x <= tx1; x++) P(x, y, x === 7 ? dark(ac, 0.15) : ac);
    P(8, ty0, ac); P(8, ty0 + 1, ac); P(11, ty0, ac); P(11, ty0 + 1, ac);
    if (of.pat === 'overalls') { P(9, ty0 + 3, '#e8c050'); for (let y = 22; y <= 26; y++) { P(lA, y, dark(ac, .25)); P(lA + 1, y, dark(ac, .25)); P(lB, y, ac); P(lB + 1, y, ac); } }
  }
  if (look.scarf) { for (let x = 6; x <= 11; x++) P(x, ty0, look.scarf); P(6, ty0 + 1, look.scarf); P(5, ty0 + 2, dark(look.scarf, .2)); }
  /* kafa */
  const hy = oy - 1; // kafa üst ofseti
  for (let y = 3; y <= 11; y++) for (let x = 4; x <= 12; x++) {
    if ((y === 3 || y === 11) && (x === 4 || x === 12)) continue;
    P(x, y + hy, x <= 5 ? SD : SK);
  }
  P(13, 7 + hy, SK); P(13, 8 + hy, SD); // burun
  P(6, 7 + hy, SD); P(6, 8 + hy, dark(SD, 0.15)); // kulak
  P(7, 12 + hy, SD); P(8, 12 + hy, SD); // boyun
  const eyeC = '#241a26';
  if (sad) { P(9, 8 + hy, eyeC); P(11, 8 + hy, eyeC); P(10, 10 + hy, dark(SD, 0.3)); P(11, 10 + hy, dark(SD, 0.3)); }
  else if (pose === 'catch') { P(9, 7 + hy, eyeC); P(11, 7 + hy, eyeC); P(9, 6 + hy, eyeC); P(11, 6 + hy, eyeC); P(10, 9 + hy, '#9a3a3a'); P(11, 9 + hy, '#9a3a3a'); P(10, 10 + hy, '#c86060'); }
  else { const blink = pose === 'idle1' && look._blink; P(9, 7 + hy, eyeC); P(11, 7 + hy, eyeC); if (!blink) { P(9, 6 + hy, eyeC); P(11, 6 + hy, eyeC); } P(10, 9 + hy, dark(SD, 0.25)); P(11, 9 + hy, dark(SD, 0.15)); }
  P(12, 8 + hy, mix(SK, '#e86a6a', 0.35));
  if (look.beard) { const bc = look.beardColor || (HAIR_COLORS[look.hairColor] || HAIR_COLORS[0])[0]; for (let y = 9; y <= 12; y++) for (let x = 6; x <= 12; x++) { if (y === 12 && (x < 8 || x > 11)) continue; if (y === 9 && x < 9) continue; P(x, y + hy, (x + y) % 3 ? bc : dark(bc, 0.15)); } P(10, 9 + hy, dark(bc, 0.2)); }
  if (look.mustache) { const bc = (HAIR_COLORS[look.hairColor] || HAIR_COLORS[0])[0]; for (let x = 9; x <= 12; x++) P(x, 9 + hy, bc); }
  /* saç + şapka */
  const tmp = new PB(CH_W, CH_H);
  drawHair(tmp, look, 0, hy, look.hat);
  if (look.hat && look.hat !== 'none') { for (let y = 0; y <= 4 + hy; y++) for (let x = 0; x < CH_W; x++) if (y < 3 + hy) tmp.d[y * CH_W + x] = 0; drawHat(tmp, look.hat, 0, hy); }
  pb.blit(tmp, 0, 0);
  /* kollar */
  const sleeve = of.pat === 'rain' ? sh : (of.pat === 'vest' ? sh : sh); const shortS = of.id === 'tisort' || of.id === 'tropik';
  const armC = (k) => (shortS && k > 1) ? SK : dark(sleeve, 0.08);
  let hand = null; const ay = ty0 + 1;
  const arm = (pts) => { pts.forEach((p, k) => { P(p[0], p[1], armC(k)); P(p[0], p[1] + 1, dark(armC(k), 0.12)); }); };
  switch (pose) {
    case 'hold': case 'reel0': case 'reel1': {
      arm([[9, ay], [10, ay + 1], [11, ay + 2], [12, ay + 2], [13, ay + 2]]); P(14, ay + 2, SK); P(14, ay + 3, SD); hand = [14, ay + 2];
      if (pose === 'reel0') { P(12, ay + 4, SK); P(11, ay + 4, sleeve); } else if (pose === 'reel1') { P(13, ay + 5, SK); P(12, ay + 4, sleeve); }
      break;
    }
    case 'charge': arm([[9, ay], [8, ay - 1], [7, ay - 2], [7, ay - 3]]); P(7, ay - 4, SK); P(6, ay - 4, SK); hand = [7, ay - 4]; break;
    case 'cast': arm([[10, ay], [11, ay - 1], [12, ay - 2], [13, ay - 3]]); P(14, ay - 4, SK); P(14, ay - 3, SD); hand = [14, ay - 4]; break;
    case 'catch': arm([[10, ay], [11, ay - 1], [12, ay - 3], [12, ay - 5]]); P(12, ay - 6, SK); P(13, ay - 6, SK); arm([[6, ay], [6, ay - 2], [7, ay - 4]]); P(7, ay - 6, SK); hand = [10, ay - 7]; break;
    default: {
      const sw = walk === 0 ? 1 : walk === 2 ? -1 : 0;
      if (walk >= 0) { P(6 - sw, ay + 1, dark(sleeve, 0.3)); P(6 - sw, ay + 2, dark(sleeve, 0.3)); P(6 - sw, ay + 4, SD); }
      for (let k = 0; k < 5; k++) { P(9 + (k > 2 ? sw : 0), ay + k, armC(k + 1)); P(10 + (k > 2 ? sw : 0), ay + k, dark(armC(k + 1), 0.1)); }
      P(9 + sw, ay + 5, SK); P(10 + sw, ay + 5, SD); hand = [10 + sw, ay + 5];
    }
  }
  pb.outline(null, 0.6);
  pb._hand = hand;
  return pb;
}
const POSES = ['idle0', 'idle1', 'walk0', 'walk1', 'walk2', 'walk3', 'hold', 'charge', 'cast', 'reel0', 'reel1', 'catch', 'sad'];
const lookKey = l => JSON.stringify([l.skin, l.hair, l.hairColor, l.body, typeof l.outfit === 'string' ? l.outfit : l.outfit.shirt + l.outfit.pat, l.hat, l.beard, l.mustache, l.scarf]);
function personSprite(look, pose, flip) {
  const key = 'p:' + lookKey(look) + ':' + pose + (flip ? ':f' : '');
  return Atlas.get(key, () => { const pb = personPB(look, pose); const r = flip ? pb.flipX() : pb; const c = r.canvas(); c._hand = flip ? [CH_W - 1 - pb._hand[0], pb._hand[1]] : pb._hand; return c; });
}
function handOf(look, pose) { return personSprite(look, pose)._hand; }

/* ---------- Portre (40×40) ---------- */
function portraitPB(look) {
  const pb = new PB(40, 40);
  const sk = SKINS[look.skin] || SKINS[0], SK = sk[0], SD = sk[1];
  const of = outfitOf(look);
  const hc = HAIR_COLORS[look.hairColor] || HAIR_COLORS[0], H = hc[0], HL = hc[1], HD = dark(H, 0.25);
  /* omuzlar */
  pb.ellipse(20, 41, 17, 10, of.shirt, (x, y) => x < 12 ? dark(of.shirt, 0.15) : (of.pat === 'plaid' && (x % 4 === 0 || y % 4 === 0) ? of.shirt2 : (of.pat === 'flower' && ihash(x, y, 2) < 0.15 ? of.shirt2 : of.shirt)));
  if (of.pat === 'apron' || of.pat === 'overalls') { pb.rect(14, 33, 12, 7, of.apron); pb.rect(14, 31, 2, 3, of.apron); pb.rect(24, 31, 2, 3, of.apron); }
  if (of.pat === 'vest') { pb.rect(6, 33, 7, 7, of.shirt2); pb.rect(27, 33, 7, 7, of.shirt2); }
  if (of.pat === 'buttons') { for (let y = 33; y < 40; y += 2) pb.set(20, y, '#e8c050'); }
  if (of.pat === 'nordic') { for (let x = 6; x < 34; x++) pb.set(x, 35, (x % 2) ? of.shirt2 : of.shirt); pb.rect(6, 34, 28, 1, of.shirt2); pb.rect(6, 36, 28, 1, of.shirt2); }
  if (of.pat === 'rain') { pb.rect(19, 32, 2, 8, of.shirt2); }
  if (of.pat === 'stripes') { for (let y = 32; y < 40; y += 2) for (let x = 2; x < 38; x++) if (pb.has(x, y)) pb.set(x, y, of.shirt2); }
  if (of.pat === 'logo') { pb.ellipse(20, 36, 3, 2.5, of.shirt2); }
  if (look.scarf) { pb.rect(13, 30, 14, 3, look.scarf); pb.rect(13, 33, 3, 4, dark(look.scarf, .2)); }
  /* boyun & kafa */
  pb.rect(16, 26, 8, 6, SD);
  pb.ellipse(20, 17, 10.5, 11.5, SK, (x, y) => x < 13 ? SD : (x > 25 && y > 18 && y < 24 ? mix(SK, '#f08a7a', 0.12) : SK));
  pb.ellipse(10, 19, 2, 3, SD);
  /* saç kapağı */
  const hairTop = (x, y) => (ihash(x, y, 5) < 0.12 ? HL : (x < 14 ? HD : H));
  const st = look.hair | 0;
  if (st === 6) pb.ellipse(20, 11, 14, 10, H, hairTop); else pb.ellipse(20, 11, 11.5, 7.5, H, hairTop);
  if (st === 3 || st === 7) { pb.rect(8, 10, 5, st === 3 ? 22 : 16, H); pb.rect(27, 10, 4, st === 3 ? 12 : 12, HD); }
  if (st === 4) { pb.ellipse(6, 18, 3, 8, H); pb.rect(7, 10, 3, 4, '#c84a6a'); }
  if (st === 5) pb.ellipse(14, 4, 5, 4, H, hairTop);
  if (st === 1) for (let x = 11; x <= 29; x += 3) { pb.set(x, 3, H); pb.set(x + 1, 3, H); pb.set(x, 2, HD); }
  if (st === 2) { for (let x = 16; x <= 30; x++) for (let y = 9; y <= 12 - Math.floor((x - 16) / 5); y++) pb.set(x, y, H); }
  if (st === 0 || st === 7) for (let x = 20; x <= 29; x++) pb.set(x, 11, H);
  /* yüz */
  const E = '#241a26';
  for (const ex of [16, 24]) { pb.rect(ex - 1, 17, 4, 3, '#fbf8f2'); pb.rect(ex + 1, 17, 2, 3, E); pb.set(ex + 1, 17, '#5a4a6a'); pb.rect(ex - 1, 16, 4, 1, E); pb.set(ex + 2, 18, '#ffffff'); }
  pb.rect(14, 14, 4, 1, HD); pb.rect(23, 14, 4, 1, HD);
  pb.set(22, 21, SD); pb.set(22, 22, SD); pb.set(21, 23, SD);
  pb.rect(18, 25, 5, 1, '#8a3a3a'); pb.set(17, 24, '#8a3a3a'); pb.set(23, 24, '#8a3a3a'); pb.rect(19, 26, 3, 1, '#c86868');
  pb.rect(12, 22, 2, 1, mix(SK, '#f06a6a', 0.4)); pb.rect(27, 22, 2, 1, mix(SK, '#f06a6a', 0.4));
  if (look.beard) { const bc = look.beardColor || H; pb.ellipse(20, 26, 9.5, 6, bc, (x, y) => (y < 25 && x > 16 && x < 24) ? null : ((x + y) % 3 ? bc : dark(bc, 0.15))); for (let y = 24; y <= 26; y++) for (let x = 17; x <= 23; x++) if (y === 25 || y === 26) pb.set(x, y, y === 25 ? '#8a3a3a' : bc); pb.rect(16, 23, 9, 1, bc); }
  if (look.mustache) { pb.rect(16, 23, 9, 2, H); pb.set(15, 24, H); pb.set(25, 24, H); }
  /* şapka */
  const hat = look.hat;
  if (hat === 'klasik') { pb.ellipse(20, 7, 10, 6, '#6f7a4a'); pb.rect(5, 9, 30, 3, '#535c36'); pb.rect(11, 3, 16, 1, '#8a9660'); }
  if (hat === 'bere') { pb.ellipse(20, 8, 12, 7, '#3a6a9a', (x) => x % 2 ? '#3a6a9a' : '#5a8aba'); pb.rect(8, 9, 24, 3, '#2a4e74'); pb.ellipse(20, 1.5, 3, 2, '#e8e2d0'); }
  if (hat === 'hasir') { pb.ellipse(20, 6, 8, 5, '#e8cf7a', (x, y) => (x + y) % 2 ? '#e8cf7a' : '#c8aa52'); pb.rect(12, 8, 16, 2, '#b84a3a'); pb.rect(1, 10, 38, 2, '#d8bc62'); }
  if (hat === 'kaptan') { pb.ellipse(20, 6, 12, 5, '#f4f2ea'); pb.rect(8, 8, 24, 3, '#1e2230'); pb.rect(18, 3, 4, 4, '#e8b830'); pb.rect(20, 11, 13, 2, '#1a1c26'); }
  if (hat === 'usta') { pb.ellipse(20, 7, 10, 6, '#4a7a5a'); pb.rect(5, 9, 30, 3, '#355a42'); pb.set(14, 5, '#e8483a'); pb.set(20, 3, '#f2d030'); pb.set(25, 6, '#3a8ae8'); }
  if (hat === 'denizci_bere') { pb.ellipse(20, 8, 12, 7, '#2a3a66', (x) => x % 3 ? '#2a3a66' : '#1c2848'); pb.rect(8, 9, 24, 3, '#f4f0e4'); pb.ellipse(20, 1.5, 3, 2, '#c4473f'); }
  if (hat === 'cicek_taci') { pb.rect(9, 8, 22, 2, '#4a8a3a'); ['#f26a8a', '#f2d030', '#f4f0f8', '#c87af0', '#f26a8a', '#f2d030'].forEach((c, i) => pb.ellipse(11 + i * 3.6, 7, 2, 2, c)); }
  if (hat === 'fener_beresi') { pb.ellipse(20, 8, 12, 7, '#6a3a8a', (x, y) => (x + y) % 2 ? '#6a3a8a' : '#7a4a9a'); pb.rect(8, 9, 24, 3, '#4a2a6a'); pb.ellipse(20, 1.5, 3, 2.5, '#ffe870'); pb.set(20, 1, '#ffffff'); }
  if (hat === 'kasket') { pb.ellipse(20, 8, 11, 5, '#6a6258'); pb.rect(18, 10, 16, 2, '#4e4840'); }
  if (hat === 'flat') { pb.ellipse(20, 8, 11, 5, '#6a6258'); pb.rect(18, 10, 16, 2, '#4e4840'); }
  if (hat === 'bandana') { pb.ellipse(20, 9, 11, 5.5, '#c8423a', (x, y) => (x + y) % 4 === 0 ? '#f0e0d0' : '#c8423a'); pb.rect(5, 11, 5, 3, '#9a2e28'); }
  pb.outline(null, 0.55);
  return pb;
}
const portraitUrl = (look, sc) => Atlas.url('portrait:' + lookKey(look), () => portraitPB(look), sc || 2);

/* ---------- küçük canlılar ---------- */
function catPB(f) {
  const pb = new PB(14, 10); const c = '#d88a4a', d = '#a8642e', l = '#f0b070';
  pb.rect(2, 4, 8, 4, c); pb.rect(3, 3, 6, 1, l); pb.rect(9, 1, 4, 4, c); pb.set(9, 0, d); pb.set(12, 0, d); pb.set(11, 2, '#2a2020'); pb.set(12, 3, '#e87a7a');
  for (let i = 0; i < 4; i += 1) pb.set(3 + i * 2, 4, d);
  const lg = f ? [2, 5, 7, 9] : [3, 4, 8, 9]; lg.forEach(x => { pb.set(x, 8, d); pb.set(x, 9, d); });
  pb.set(1, 3 - (f ? 1 : 0), c); pb.set(0, 2 - (f ? 1 : 0), c); pb.set(1, 4, c);
  pb.outline(null, 0.5); return pb;
}
function gullPB(f) {
  const pb = new PB(13, 7); const w = '#f4f4f0', g = '#a8b0b8', k = '#2a2a30';
  pb.rect(4, 3, 5, 2, w); pb.set(9, 3, w); pb.set(10, 3, '#e8b030'); pb.set(8, 2, w); pb.set(9, 2, k);
  if (f === 0) { pb.line(1, 0, 4, 3, g); pb.line(12, 0, 8, 3, g); pb.set(1, 0, k); pb.set(12, 0, k); }
  else if (f === 1) { pb.rect(1, 3, 3, 1, g); pb.rect(9, 3, 3, 1, g); }
  else { pb.line(1, 6, 4, 4, g); pb.line(12, 6, 8, 4, g); }
  pb.set(3, 4, g); pb.outline(null, 0.45); return pb;
}
function gullStandPB() { const pb = new PB(10, 9); pb.rect(2, 2, 5, 3, '#f4f4f0'); pb.rect(3, 3, 4, 2, '#a8b0b8'); pb.rect(6, 0, 3, 3, '#f4f4f0'); pb.set(8, 1, '#2a2a30'); pb.set(9, 1, '#e8b030'); pb.set(1, 3, '#a8b0b8'); pb.set(4, 5, '#e8b030'); pb.set(4, 6, '#e8b030'); pb.set(5, 5, '#e8b030'); pb.set(5, 6, '#e8b030'); pb.outline(null, 0.45); return pb; }
