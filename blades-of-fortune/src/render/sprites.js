// Prosedürel pixel art kütüphanesi: insanlar, hayvanlar, canavarlar, nesneler, ikonlar.
// Tüm çizimler (x, y) = ayak/zemin noktası, 1 birim = 1 piksel (427×240 tuval).
const R = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w, h); };
const shade = (hex, f) => {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.max(0, Math.min(255, Math.round(r * f))); g = Math.max(0, Math.min(255, Math.round(g * f))); b = Math.max(0, Math.min(255, Math.round(b * f)));
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
};
export { R, shade };
const SKIN = ['#e8b88a', '#d49a6a', '#b87a50', '#8a5a3a', '#f0c8a0'];

// ——— İnsan ön ayarları ———
export const LOOKS = {
  hero: { body: '#7a5a3a', legs: '#4a3a2a', hair: '#5a3a1a', cape: '#8a2a2a' },
  bandit: { body: '#5a4a2a', legs: '#3a2a1a', hat: 'hood', hatCol: '#4a3a22', prop: 'club', mask: 1 },
  archer: { body: '#4a5a2a', legs: '#3a3a1a', hat: 'hood', hatCol: '#3a4a22', prop: 'bow' },
  leader: { body: '#3a2a2a', legs: '#2a1a1a', hat: 'cap', hatCol: '#7a1a1a', prop: 'axe', beard: '#2a1a0a', cape: '#2a1a1a' },
  deserter: { body: '#6a6a7a', legs: '#3a3a4a', hat: 'helm', hatCol: '#7a7a8a', prop: 'spear', tabard: '#5a2a2a' },
  assassin: { body: '#1a1a22', legs: '#141418', hat: 'hood', hatCol: '#141418', prop: 'dagger', mask: 1 },
  soldier: { body: '#8a8a9a', legs: '#4a4a5a', hat: 'helm', hatCol: '#9a9aaa', prop: 'spear', tabard: '#2a4a9a' },
  guard: { body: '#9a9aaa', legs: '#5a5a6a', hat: 'helmFull', hatCol: '#aaaabb', prop: 'shieldSpear', tabard: '#2a4a9a', big: 1 },
  officer: { body: '#2a4a9a', legs: '#2a2a3a', hat: 'feather', hatCol: '#1a2a5a', prop: 'sword', cape: '#1a2a6a' },
  taxman: { body: '#4a2a5a', legs: '#2a2a2a', hat: 'cap', hatCol: '#2a1a3a', prop: 'book', glasses: 1 },
  clerk: { body: '#5a4a6a', legs: '#2a2a2a', prop: 'book', glasses: 1 },
  inspector: { body: '#6a2a2a', legs: '#2a1a1a', hat: 'tall', hatCol: '#1a1a1a', prop: 'cane', cape: '#4a1a1a' },
  herald: { body: '#c8a02a', legs: '#2a4a9a', hat: 'feather', hatCol: '#2a4a9a', prop: 'horn', tabard: '#2a4a9a' },
  merchant: { body: '#8a5a2a', legs: '#4a3a2a', hat: 'turban', hatCol: '#c8a02a', prop: 'bag', beard: '#8a8a8a', belly: 1 },
  veiled: { body: '#5a2a6a', legs: '#3a1a4a', hat: 'veil', hatCol: '#6a3a7a', mask: 1, cape: '#4a1a5a' },
  jeweler: { body: '#2a5a5a', legs: '#2a2a2a', hat: 'beret', hatCol: '#8a2a5a', cape: '#5a1a3a', moustache: 1 },
  healer: { body: '#e8e0c8', legs: '#7a6a4a', hat: 'scarf', hatCol: '#5a8a4a', prop: 'staff' },
  pilgrim: { body: '#8a7a5a', legs: '#6a5a3a', hat: 'hood', hatCol: '#7a6a4a', prop: 'staff', beard: '#d8d8d8', old: 1 },
  shepherd: { body: '#c8b88a', legs: '#6a5a3a', hat: 'straw', hatCol: '#d8c070', prop: 'crook' },
  mason: { body: '#7a6a5a', legs: '#4a3a2a', hat: 'cap', hatCol: '#5a4a3a', prop: 'hammer', beard: '#6a6a6a', apron: '#5a4a3a' },
  smith: { body: '#5a3a2a', legs: '#3a2a1a', prop: 'hammer', apron: '#3a2a1a', hair: '#c8c8c8' },
  bard: { body: '#8a2a5a', legs: '#2a5a8a', hat: 'feather', hatCol: '#5a2a8a', prop: 'lute', cape: '#c8a02a' },
  postman: { body: '#2a6a4a', legs: '#3a3a2a', hat: 'cap', hatCol: '#1a4a3a', prop: 'bag' },
  mute: { body: '#6a6a6a', legs: '#4a4a4a', hat: 'hood', hatCol: '#5a5a5a', cape: '#4a4a4a', mask: 1 },
  father: { body: '#6a4a2a', legs: '#3a3a2a', beard: '#5a3a1a', prop: 'lantern' },
  child: { body: '#c85a3a', legs: '#4a3a2a', small: 1, hair: '#6a3a1a' },
  carpenter: { body: '#9a6a3a', legs: '#4a3a2a', hat: 'cap', hatCol: '#7a4a2a', prop: 'hammer', apron: '#6a4a2a' },
  cook: { body: '#e8e0d0', legs: '#4a4a4a', hat: 'chef', hatCol: '#ffffff', prop: 'ladle', belly: 1 },
  veteran: { body: '#5a5a4a', legs: '#3a3a2a', prop: 'sword', beard: '#c8c8c8', eyepatch: 1, old: 1 },
  carter: { body: '#7a5a3a', legs: '#4a3a2a', hat: 'straw', hatCol: '#b89a5a', prop: 'whip' },
  crowman: { body: '#1a1a2a', legs: '#1a1a1a', hat: 'hood', hatCol: '#1a1a2a', cape: '#2a2a3a', hair: '#e8e8e8' },
  wizard: { body: '#2a2a7a', legs: '#2a2a5a', hat: 'wizard', hatCol: '#2a2a8a', prop: 'staffOrb', beard: '#e8e8e8', robe: 1 },
  witch: { body: '#2a3a2a', legs: '#1a2a1a', hat: 'witch', hatCol: '#1a1a1a', prop: 'staff', robe: 1, skin: '#a8c898' },
  fortune: { body: '#7a2a5a', legs: '#4a1a3a', hat: 'scarf', hatCol: '#c8a02a', robe: 1, old: 1 },
  priest: { body: '#e8e0d0', legs: '#c8c0b0', hat: 'mitre', hatCol: '#e8d8a0', prop: 'staffCross', robe: 1 },
  monk: { body: '#6a4a2a', legs: '#5a3a1a', hat: 'hood', hatCol: '#5a3a1a', robe: 1 },
  knight: { body: '#aaaabb', legs: '#6a6a7a', hat: 'helmFull', hatCol: '#c8c8d8', prop: 'sword', cape: '#3a5a9a', tabard: '#3a5a9a', big: 1 },
  knightDark: { body: '#2a2a32', legs: '#1a1a22', hat: 'helmHorn', hatCol: '#2a2a32', prop: 'swordDark', cape: '#3a0a2a', big: 1, eyes: '#ff3a6a' },
  champion: { body: '#d8c060', legs: '#8a7a3a', hat: 'helmFull', hatCol: '#e8d070', prop: 'greatsword', cape: '#8a1a1a', tabard: '#8a1a1a', big: 1 },
  noble: { body: '#5a2a6a', legs: '#2a1a3a', hair: '#c8a02a', cape: '#8a6a2a', robe: 1 },
  prince: { body: '#c8a02a', legs: '#5a2a2a', hair: '#e8c870', cape: '#7a1a1a', prop: 'sword' },
  king: { body: '#7a1a2a', legs: '#4a1a1a', hat: 'crown', hatCol: '#f2c14e', beard: '#e8e8e8', cape: '#c82a2a', robe: 1, prop: 'scepter' },
  villager: { body: '#7a6a4a', legs: '#4a3a2a' },
  villagerF: { body: '#8a4a5a', legs: '#5a3a3a', hat: 'scarf', hatCol: '#c8b88a', robe: 1 },
  farmer: { body: '#6a7a3a', legs: '#4a3a2a', hat: 'straw', hatCol: '#d8c070', prop: 'pitchfork' },
  hunter: { body: '#4a5a3a', legs: '#3a3a2a', hat: 'hood', hatCol: '#4a3a2a', prop: 'bow', cape: '#3a4a2a' },
  prisoner: { body: '#8a8a7a', legs: '#6a6a5a', chains: 1, hair: '#3a2a1a', beard: '#3a2a1a' },
  forger: { body: '#3a3a4a', legs: '#2a2a3a', hat: 'beret', hatCol: '#2a2a2a', prop: 'quill', moustache: 1 },
  traveler: { body: '#6a6a7a', legs: '#3a3a4a', hat: 'wide', hatCol: '#3a3a4a', cape: '#5a5a6a', prop: 'staff', feather: 1 },
  dwarf: { body: '#7a3a2a', legs: '#3a2a1a', hat: 'helm', hatCol: '#a07a3a', prop: 'axe', beard: '#c86a2a', small: 1, stout: 1 },
  miner: { body: '#6a5a4a', legs: '#3a2a1a', hat: 'helm', hatCol: '#c8a02a', prop: 'pick' },
  fairman: { body: '#c83a3a', legs: '#2a2a5a', hat: 'tall', hatCol: '#c83a3a', prop: 'rope', moustache: 1 },
  potKnight: { body: '#8a8a8a', legs: '#5a4a3a', hat: 'pot', hatCol: '#5a5a5a', prop: 'ladle', panShield: 1 },
};

function weaponProp(c, prop, x, y, dir, raise, t) {
  const sx = dir === 'left' ? -1 : 1, hx = x + (dir === 'up' ? 4 : dir === 'down' ? -4 : sx * 4), hy = y - 7 - raise;
  switch (prop) {
    case 'sword': R(c, hx, hy - 7, 1, 8, '#d8d8e0'); R(c, hx - 1, hy, 3, 1, '#8a6a2a'); break;
    case 'swordDark': R(c, hx, hy - 8, 1, 9, '#5a2a4a'); R(c, hx - 1, hy, 3, 1, '#2a0a1a'); R(c, hx, hy - 8, 1, 2, '#ff3a6a'); break;
    case 'greatsword': R(c, hx, hy - 10, 2, 11, '#e8e8f0'); R(c, hx - 2, hy, 6, 1, '#c8a02a'); break;
    case 'axe': R(c, hx, hy - 7, 1, 9, '#7a5a3a'); R(c, hx + 1, hy - 7, 3, 3, '#b8b8c0'); break;
    case 'spear': R(c, hx, hy - 11, 1, 13, '#8a6a3a'); R(c, hx - 1, hy - 13, 3, 2, '#c8c8d0'); break;
    case 'shieldSpear': R(c, hx, hy - 11, 1, 13, '#8a6a3a'); R(c, hx - 1, hy - 13, 3, 2, '#c8c8d0'); R(c, x - sx * 5 - 2, y - 9, 4, 5, '#2a4a9a'); R(c, x - sx * 5 - 1, y - 8, 2, 3, '#c8a02a'); break;
    case 'club': R(c, hx, hy - 5, 2, 6, '#6a4a2a'); break;
    case 'dagger': R(c, hx, hy - 3, 1, 4, '#c8c8d0'); break;
    case 'bow': R(c, hx, hy - 6, 1, 9, '#8a5a2a'); R(c, hx + sx, hy - 7, 1, 1, '#8a5a2a'); R(c, hx + sx, hy + 2, 1, 1, '#8a5a2a'); break;
    case 'staff': case 'crook': case 'cane': R(c, hx, hy - 8, 1, 12, '#7a5a3a'); if (prop === 'crook') R(c, hx, hy - 9, 2, 1, '#7a5a3a'); break;
    case 'staffOrb': R(c, hx, hy - 8, 1, 12, '#5a3a2a'); R(c, hx - 1, hy - 10, 3, 3, (t * 4) % 2 > 1 ? '#9ad8ff' : '#c8a8ff'); break;
    case 'staffCross': R(c, hx, hy - 9, 1, 13, '#c8a02a'); R(c, hx - 1, hy - 8, 3, 1, '#c8a02a'); break;
    case 'scepter': R(c, hx, hy - 6, 1, 8, '#c8a02a'); R(c, hx - 1, hy - 7, 3, 2, '#ff3a3a'); break;
    case 'hammer': R(c, hx, hy - 5, 1, 7, '#6a4a2a'); R(c, hx - 1, hy - 6, 3, 2, '#8a8a8a'); break;
    case 'pick': R(c, hx, hy - 5, 1, 7, '#6a4a2a'); R(c, hx - 2, hy - 6, 5, 1, '#8a8a8a'); break;
    case 'pitchfork': R(c, hx, hy - 10, 1, 12, '#8a6a3a'); R(c, hx - 1, hy - 11, 3, 1, '#8a8a8a'); R(c, hx - 1, hy - 12, 1, 1, '#8a8a8a'); R(c, hx + 1, hy - 12, 1, 1, '#8a8a8a'); break;
    case 'lute': R(c, x - 2, y - 7, 5, 3, '#c8803a'); R(c, x + 3, y - 8, 3, 1, '#7a4a1a'); break;
    case 'horn': R(c, hx - 1, hy - 3, 3, 2, '#e8c870'); break;
    case 'lantern': R(c, hx, hy, 2, 3, '#ffd27a'); R(c, hx, hy - 1, 2, 1, '#5a4a3a'); break;
    case 'torch': R(c, hx, hy - 2, 1, 5, '#6a4a2a'); R(c, hx - 1, hy - 4, 3, 2, (t * 8) % 2 > 1 ? '#ffb030' : '#ff7020'); break;
    case 'bag': R(c, x - sx * 4 - 1, y - 7, 3, 4, '#8a6a3a'); break;
    case 'book': R(c, x - 2, y - 8, 4, 3, '#6a2a2a'); R(c, x - 1, y - 8, 2, 1, '#e8e0c8'); break;
    case 'quill': R(c, hx, hy - 3, 1, 3, '#e8e8e8'); break;
    case 'ladle': R(c, hx, hy - 5, 1, 6, '#9a9aa0'); R(c, hx - 1, hy - 6, 3, 2, '#9a9aa0'); break;
    case 'whip': R(c, hx, hy - 4, 1, 5, '#5a3a1a'); R(c, hx + sx, hy - 5, 3 * sx > 0 ? 3 : 1, 1, '#5a3a1a'); break;
    case 'rope': R(c, hx - 1, hy - 2, 3, 3, '#c8a86a'); break;
    case 'magnifier': R(c, hx, hy - 3, 2, 2, '#bfe0ff'); R(c, hx, hy - 1, 1, 2, '#5a4a3a'); break;
    case 'hat': R(c, hx - 1, hy - 1, 4, 2, '#5a3a2a'); break;
  }
}

export function drawHuman(c, x, y, spec, dir = 'down', pose = 'idle', t = 0, e = {}) {
  const L = { ...(LOOKS[spec.kind] || LOOKS.villager), ...(spec.look || {}) };
  const skin = L.skin || SKIN[(spec.skinIdx || 0) % SKIN.length];
  const small = L.small ? 0.75 : 1;
  const big = L.big ? 1 : 0;
  x = Math.round(x); y = Math.round(y);
  const walking = pose === 'walk' || pose === 'run';
  const step = walking ? Math.floor(t * (pose === 'run' ? 12 : 7)) % 2 : 0;
  // gölge
  c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x - 5, y - 1, 10, 2);
  if (pose === 'down' || pose === 'sleep') {
    R(c, x - 8, y - 4, 4, 4, skin); R(c, x - 4, y - 4, 7, 4, L.body); R(c, x + 3, y - 3, 4, 3, L.legs);
    if (L.hat && L.hat.startsWith('helm')) R(c, x - 8, y - 5, 4, 2, L.hatCol);
    else R(c, x - 8, y - 5, 4, 1, L.hair || '#3a2a1a');
    return;
  }
  const kneel = pose === 'kneel' || pose === 'dig' || pose === 'sit' || pose === 'cower' || pose === 'bow';
  const h = Math.round((kneel ? 12 : 15) * small) + big;
  const top = y - h;
  const bodyW = L.stout ? 8 : L.belly ? 8 : 6 + big;
  const bx = x - Math.floor(bodyW / 2);
  // bacaklar
  if (!kneel) {
    const lh = Math.round(4 * small);
    if (L.robe) R(c, bx, y - lh - 1, bodyW, lh + 1, shade(L.body, 0.85));
    else {
      R(c, x - 3, y - lh + (step ? -1 : 0), 2, lh - (step ? 1 : 0), L.legs);
      R(c, x + 1, y - lh + (step ? 0 : -1), 2, lh - (step ? 0 : 1), L.legs);
      R(c, x - 3, y - 1 + (step ? -1 : 0), 2, 1, '#2a1a10'); R(c, x + 1, y - 1 + (step ? 0 : -1), 2, 1, '#2a1a10');
    }
  } else R(c, bx, y - 3, bodyW, 3, L.robe ? shade(L.body, 0.85) : L.legs);
  // pelerin (arka)
  const bodyTop = top + Math.round(5 * small), bodyH = Math.round(6 * small) + big;
  if (L.cape && dir !== 'down') R(c, bx - 1, bodyTop, bodyW + 2, bodyH + 2, L.cape);
  // gövde
  R(c, bx, bodyTop, bodyW, bodyH, L.body);
  R(c, bx, bodyTop, bodyW, 1, shade(L.body, 1.2));
  if (L.tabard && dir !== 'up') R(c, x - 1, bodyTop + 1, 3, bodyH - 1, L.tabard);
  if (L.apron && dir === 'down') R(c, x - 2, bodyTop + 2, 4, bodyH, L.apron);
  if (L.chains) R(c, bx - 1, bodyTop + bodyH - 2, bodyW + 2, 1, '#8a8a8a');
  if (spec.acc && dir !== 'up') R(c, x, bodyTop + 1, 1, 1, spec.acc);
  if (spec.armorWeight === 'heavy') { R(c, bx - 1, bodyTop, 2, 2, shade(L.body, 1.3)); R(c, bx + bodyW - 1, bodyTop, 2, 2, shade(L.body, 1.3)); }
  // kollar
  const armUp = ['cast', 'horn', 'salute', 'reach', 'ready', 'aim', 'pull', 'push', 'drink', 'pour', 'throw', 'hammer', 'work', 'play', 'polish'].includes(pose);
  const ay = bodyTop + (armUp ? -1 : 1);
  if (pose === 'cast') { R(c, bx - 2, bodyTop - 3, 2, 4, skin); R(c, bx + bodyW, bodyTop - 3, 2, 4, skin); }
  else { R(c, bx - 1, ay, 1, 4, shade(L.body, 0.8)); R(c, bx + bodyW, ay, 1, 4, shade(L.body, 0.8)); R(c, bx - 1, ay + 4, 1, 1, skin); R(c, bx + bodyW, ay + 4, 1, 1, skin); }
  // baş
  const hs = L.small ? 5 : 6, hx = x - Math.floor(hs / 2), hy = top;
  R(c, hx, hy, hs, Math.round(5 * small), skin);
  const hair = L.hair || '#4a2a1a';
  if (dir === 'up') R(c, hx, hy, hs, 4, hair);
  else {
    R(c, hx, hy, hs, 1, hair);
    if (dir === 'down') {
      const ey = hy + 2, eyeCol = L.eyes || '#1a1010';
      if (L.mask) R(c, hx, hy + 3, hs, 2, shade(L.hatCol || '#333333', 0.8));
      R(c, hx + 1, ey, 1, 1, eyeCol); R(c, hx + hs - 2, ey, 1, 1, eyeCol);
      if (L.eyepatch) R(c, hx + hs - 2, ey, 1, 1, '#000000');
      if (L.glasses) { R(c, hx + 1, ey, 1, 1, '#bfe0ff'); R(c, hx + hs - 2, ey, 1, 1, '#bfe0ff'); }
      if (L.moustache) R(c, hx + 1, ey + 2, hs - 2, 1, hair);
      if (L.tooth) R(c, hx + 2, ey + 2, 1, 1, '#ffd700');
    } else { const ex = dir === 'left' ? hx + 1 : hx + hs - 2; R(c, ex, hy + 2, 1, 1, L.eyes || '#1a1010'); R(c, dir === 'left' ? hx + hs - 2 : hx, hy, 2, 4, hair); }
  }
  if (L.beard && dir !== 'up') R(c, hx + 1, hy + 4, hs - 2, 2, L.beard);
  // şapka
  const hc = L.hatCol || '#5a3a2a';
  switch (L.hat) {
    case 'hood': R(c, hx - 1, hy - 1, hs + 2, 3, hc); R(c, hx - 1, hy, 1, 5, hc); R(c, hx + hs, hy, 1, 5, hc); if (dir === 'up') R(c, hx - 1, hy, hs + 2, 6, hc); break;
    case 'veil': R(c, hx - 1, hy - 1, hs + 2, 7, hc); if (dir === 'down') R(c, hx + 1, hy + 2, hs - 2, 1, '#1a1010'); break;
    case 'helm': R(c, hx - 1, hy - 1, hs + 2, 3, hc); R(c, hx - 1, hy + 2, 1, 2, hc); R(c, hx + hs, hy + 2, 1, 2, hc); break;
    case 'helmFull': R(c, hx - 1, hy - 1, hs + 2, 6, hc); if (dir === 'down') R(c, hx, hy + 2, hs, 1, '#1a1a1a'); if (L.helm === 'gold' || spec.look?.helm === 'gold') R(c, hx, hy - 2, hs, 1, '#f2c14e'); break;
    case 'helmHorn': R(c, hx - 1, hy - 1, hs + 2, 6, hc); R(c, hx - 2, hy - 3, 1, 3, '#d8d0c0'); R(c, hx + hs + 1, hy - 3, 1, 3, '#d8d0c0'); if (dir === 'down') { R(c, hx + 1, hy + 2, 1, 1, L.eyes); R(c, hx + hs - 2, hy + 2, 1, 1, L.eyes); } break;
    case 'cap': R(c, hx - 1, hy - 1, hs + 2, 2, hc); break;
    case 'straw': R(c, hx - 2, hy, hs + 4, 1, hc); R(c, hx, hy - 2, hs, 2, hc); break;
    case 'wide': R(c, hx - 3, hy, hs + 6, 1, hc); R(c, hx, hy - 2, hs, 2, hc); if (L.feather) R(c, hx + hs, hy - 3, 1, 2, '#1a1a1a'); break;
    case 'feather': R(c, hx - 1, hy - 1, hs + 2, 2, hc); R(c, hx + hs - 1, hy - 4, 1, 3, '#e8e8e8'); break;
    case 'turban': R(c, hx - 1, hy - 2, hs + 2, 3, hc); R(c, x, hy - 2, 1, 1, '#ff3a3a'); break;
    case 'beret': R(c, hx - 1, hy - 1, hs + 2, 2, hc); break;
    case 'scarf': R(c, hx - 1, hy - 1, hs + 2, 2, hc); R(c, hx - 1, hy, 1, 4, hc); R(c, hx + hs, hy, 1, 4, hc); break;
    case 'chef': R(c, hx, hy - 4, hs, 4, hc); break;
    case 'tall': R(c, hx, hy - 5, hs, 5, hc); R(c, hx - 1, hy - 1, hs + 2, 1, hc); break;
    case 'wizard': R(c, hx - 1, hy - 1, hs + 2, 2, hc); R(c, hx + 1, hy - 4, hs - 2, 3, hc); R(c, x, hy - 7, 1, 3, hc); R(c, x - 1, hy - 3, 1, 1, '#f2e080'); break;
    case 'witch': R(c, hx - 2, hy, hs + 4, 1, hc); R(c, hx + 1, hy - 4, hs - 2, 4, hc); R(c, x + 1, hy - 6, 1, 2, hc); break;
    case 'mitre': R(c, hx, hy - 4, hs, 4, hc); R(c, x, hy - 3, 1, 2, '#c8a02a'); break;
    case 'crown': R(c, hx, hy - 2, hs, 2, '#f2c14e'); R(c, hx, hy - 3, 1, 1, '#f2c14e'); R(c, x, hy - 3, 1, 1, '#f2c14e'); R(c, hx + hs - 1, hy - 3, 1, 1, '#f2c14e'); break;
    case 'pot': R(c, hx - 1, hy - 2, hs + 2, 4, hc); R(c, hx + hs + 1, hy - 1, 2, 1, hc); break;
  }
  if (spec.look && spec.look.crown && L.hat !== 'crown') { R(c, hx, hy - 2, hs, 1, '#f2c14e'); R(c, hx, hy - 3, 1, 1, '#f2c14e'); R(c, hx + hs - 1, hy - 3, 1, 1, '#f2c14e'); }
  if (spec.look && spec.look.hood) R(c, hx - 1, hy - 1, hs + 2, 3, spec.look.color || '#5a1a3a');
  // ekipman
  const raise = pose === 'ready' || pose === 'aim' ? 2 : pose === 'attack' ? 4 : 0;
  const prop = e.carry ? null : (spec.prop || L.prop);
  if (prop && !kneel) weaponProp(c, prop, x, y, dir, raise, t);
  if (L.panShield) { R(c, x - 6, y - 10, 4, 4, '#3a3a3a'); R(c, x - 7, y - 8, 1, 1, '#3a3a3a'); }
  if (e.carry) drawCarry(c, x, top - 2, e.carry);
}
function drawCarry(c, x, y, what) {
  const m = { crate: '#8a6a3a', chest: '#7a4a1a', sack: '#c8b07a', stone: '#8a8a8a', plank: '#9a7a4a', head: '#a8a8a0', shield: '#5a6a9a', letter: '#e8e0c8', pick: '#8a8a8a', gold: '#f2c14e', pile: '#8a6a3a' };
  const col = m[what] || '#8a6a3a';
  if (what === 'plank') R(c, x - 8, y - 1, 16, 2, col);
  else { R(c, x - 4, y - 4, 8, 5, col); R(c, x - 4, y - 4, 8, 1, shade(col, 1.25)); }
}

// ——— Hayvanlar ve canavarlar ———
export function drawCreature(c, kind, x, y, e, t) {
  x = Math.round(x); y = Math.round(y);
  const dir = e.dir || 'down', fl = dir === 'left' ? -1 : 1, walk = e.pose === 'walk' || e.pose === 'run';
  const st = walk ? Math.floor(t * 10) % 2 : 0;
  const sc = e.scale || 1, tint = e.tint;
  const sh = (w) => { c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x - w / 2, y - 1, w, 2); };
  switch (kind) {
    case 'wolf': {
      const col = tint || '#7a7a80', d = shade(col, 0.7), w = Math.round(14 * sc), h = Math.round(6 * sc);
      sh(w);
      if (e.pose === 'sit' || e.pose === 'bow') { R(c, x - 3, y - h - 4, 7, h + 4, col); R(c, x - 3, y - h - 8, 6, 4, col); R(c, x - 3, y - h - 10, 1, 2, d); R(c, x + 2, y - h - 10, 1, 2, d); R(c, x - 2, y - h - 6, 1, 1, '#ffd27a'); R(c, x + 1, y - h - 6, 1, 1, '#ffd27a'); break; }
      if (e.pose === 'howl') { R(c, x - w / 2, y - h - 2, w, h, col); R(c, x + fl * 4, y - h - 9, 4, 6, col); break; }
      R(c, x - w / 2, y - h - 2, w, h, col); R(c, x - w / 2, y - h - 2, w, 1, shade(col, 1.2));
      const hx = fl > 0 ? x + w / 2 - 1 : x - w / 2 - 4;
      R(c, hx, y - h - 5, 5, 5, col); R(c, hx + (fl > 0 ? 4 : -1), y - h - 3, 2, 2, d);
      R(c, hx + (fl > 0 ? 1 : 3), y - h - 7, 1, 2, d); R(c, hx + (fl > 0 ? 3 : 1), y - h - 4, 1, 1, e.pose === 'growl' ? '#ff4a3a' : '#ffd27a');
      const tx = fl > 0 ? x - w / 2 - 3 : x + w / 2; R(c, tx, y - h - 3, 3, 2, d);
      for (let i = 0; i < 4; i++) R(c, x - w / 2 + 1 + i * (w / 4), y - 2 - ((i + st) % 2), 2, 2, d);
      if (e.limp) R(c, x - w / 2 + 2, y - 3, 2, 1, '#a02a2a');
      break;
    }
    case 'boar': { const col = '#5a3a2a'; sh(14); R(c, x - 7, y - 8, 14, 7, col); R(c, x - 7, y - 9, 14, 2, shade(col, 0.7)); const hx = fl > 0 ? x + 6 : x - 10; R(c, hx, y - 7, 4, 5, col); R(c, hx + (fl > 0 ? 3 : 0), y - 3, 1, 2, '#f0f0e0'); R(c, hx + (fl > 0 ? 1 : 2), y - 6, 1, 1, '#ff3a3a'); for (let i = 0; i < 4; i++) R(c, x - 6 + i * 4, y - 2 - ((i + st) % 2), 2, 2, '#3a2a1a'); break; }
    case 'spider': { const col = '#3a2a3a'; if (e.hang) R(c, x, y - 60, 1, 50, 'rgba(230,230,230,0.6)'); sh(14); R(c, x - 5, y - 9, 10, 7, col); R(c, x - 3, y - 12, 6, 4, shade(col, 1.2)); for (let i = 0; i < 4; i++) { const ly = y - 8 + i * 2 + ((i + Math.floor(t * 8)) % 2); R(c, x - 9, ly, 4, 1, col); R(c, x + 5, ly, 4, 1, col); } R(c, x - 2, y - 11, 1, 1, '#ff3a3a'); R(c, x + 1, y - 11, 1, 1, '#ff3a3a'); R(c, x - 1, y - 10, 1, 1, '#ff3a3a'); R(c, x, y - 10, 1, 1, '#ff3a3a'); break; }
    case 'swamp': { const col = '#3a5a3a'; const sk = e.sink ? 10 : 0; sh(16); R(c, x - 7, y - 16 + sk, 14, 15 - sk, col); R(c, x - 8, y - 12 + sk, 2, 6, '#2a4a2a'); R(c, x + 6, y - 12 + sk, 2, 6, '#2a4a2a'); R(c, x - 4, y - 14 + sk, 2, 1, '#e8ff6a'); R(c, x + 2, y - 14 + sk, 2, 1, '#e8ff6a'); R(c, x - 6, y - 17 + sk, 4, 2, '#5a7a3a'); R(c, x + 2, y - 18 + sk, 3, 2, '#5a7a3a'); break; }
    case 'skeleton': { sh(8); const b = '#e8e4d8'; R(c, x - 3, y - 15, 6, 5, b); R(c, x - 2, y - 13, 1, 1, e.glowEyes ? '#7ac8ff' : '#2a2a2a'); R(c, x + 1, y - 13, 1, 1, e.glowEyes ? '#7ac8ff' : '#2a2a2a'); R(c, x - 1, y - 10, 2, 6, b); R(c, x - 3, y - 9, 6, 1, b); R(c, x - 3, y - 7, 6, 1, b); R(c, x - 2, y - 4, 1, 4 - st, b); R(c, x + 1, y - 4, 1, 4 - (1 - st), b); R(c, x + 4, y - 15, 1, 8, '#8a7a6a'); if (e.look && e.look.crown) R(c, x - 3, y - 17, 6, 2, '#f2c14e'); break; }
    case 'ghost': case 'wraith': case 'shade': case 'shadow': {
      const big = kind === 'wraith' ? 1.6 : kind === 'shade' ? 1.3 : (e.scale || 1);
      const col = kind === 'shade' ? '#2a3a2a' : kind === 'shadow' ? '#101018' : kind === 'wraith' ? '#3a2a4a' : (e.look && e.look.soldier ? '#bcd0e8' : '#d8e8f0');
      const bob = Math.sin(t * 3 + x) * 2, w = Math.round(10 * big), h = Math.round(14 * big);
      c.globalAlpha *= kind === 'shadow' ? 0.8 : 0.85;
      R(c, x - w / 2, y - h - 4 + bob, w, h, col);
      for (let i = 0; i < w; i += 2) R(c, x - w / 2 + i, y - 4 + bob + ((i / 2 + Math.floor(t * 6)) % 2), 2, 2, col);
      const ec = kind === 'wraith' ? '#ff3a6a' : kind === 'shade' ? '#7aff7a' : kind === 'shadow' ? '#c8c8ff' : '#1a2a3a';
      R(c, x - Math.round(3 * big), y - h + 1 + bob, 2, 2, ec); R(c, x + Math.round(1 * big), y - h + 1 + bob, 2, 2, ec);
      if (kind === 'wraith') { R(c, x - w / 2 - 1, y - h - 6 + bob, w + 2, 3, '#1a1a22'); R(c, x - w / 2 - 2, y - h - 8 + bob, 2, 3, '#d8d0c0'); R(c, x + w / 2, y - h - 8 + bob, 2, 3, '#d8d0c0'); }
      if (e.look && e.look.soldier) R(c, x - w / 2, y - h - 5 + bob, w, 2, '#9ab0c8');
      c.globalAlpha /= kind === 'shadow' ? 0.8 : 0.85;
      break;
    }
    case 'golem': { const col = '#7a7a72'; sh(18); const dorm = e.pose === 'dormant'; R(c, x - 8, y - 20, 16, 14, col); R(c, x - 10, y - 18, 3, 10, shade(col, 0.8)); R(c, x + 7, y - 18, 3, 10, shade(col, 0.8)); R(c, x - 5, y - 26, 10, 7, shade(col, 1.1)); R(c, x - 6, y - 6, 4, 6, shade(col, 0.8)); R(c, x + 2, y - 6, 4, 6, shade(col, 0.8)); R(c, x - 3, y - 23, 2, 1, dorm ? '#5a5a5a' : '#7ae0ff'); R(c, x + 1, y - 23, 2, 1, dorm ? '#5a5a5a' : '#7ae0ff'); R(c, x - 1, y - 15, 2, 3, dorm ? '#4a5a5a' : '#7ae0ff'); R(c, x - 7, y - 19, 3, 2, '#5a7a3a'); break; }
    case 'troll': { const col = '#6a7a6a'; sh(24); const sit = e.pose === 'sit' || e.pose === 'sleep'; const oy = sit ? 6 : 0; R(c, x - 11, y - 28 + oy, 22, 22 - oy, col); R(c, x - 14, y - 24 + oy, 4, 14, shade(col, 0.85)); R(c, x + 10, y - 24 + oy, 4, 14, shade(col, 0.85)); R(c, x - 7, y - 36 + oy, 14, 9, shade(col, 1.08)); R(c, x - 4, y - 32 + oy, 2, 2, e.pose === 'sleep' ? '#4a5a4a' : '#ffd27a'); R(c, x + 2, y - 32 + oy, 2, 2, e.pose === 'sleep' ? '#4a5a4a' : '#ffd27a'); R(c, x - 3, y - 29 + oy, 6, 1, '#3a3a2a'); R(c, x - 3, y - 28 + oy, 1, 2, '#e8e0d0'); R(c, x + 2, y - 28 + oy, 1, 2, '#e8e0d0'); if (!sit) { R(c, x - 8, y - 6, 6, 6, shade(col, 0.8)); R(c, x + 2, y - 6, 6, 6, shade(col, 0.8)); } R(c, x - 10, y - 20 + oy, 20, 2, '#5a4a2a'); break; }
    case 'wyvern': { const col = '#8a5a3a'; sh(30); const flap = Math.sin(t * 5) * 4; R(c, x - 26, y - 30 + flap, 16, 8, shade(col, 0.75)); R(c, x + 10, y - 30 + flap, 16, 8, shade(col, 0.75)); R(c, x - 10, y - 26, 20, 16, col); R(c, x - 6, y - 36, 12, 10, shade(col, 1.1)); R(c, x - 4, y - 33, 2, 2, '#ffd23a'); R(c, x + 2, y - 33, 2, 2, '#ffd23a'); R(c, x - 2, y - 28, 4, 2, '#3a1a0a'); R(c, x - 8, y - 10, 5, 10, shade(col, 0.8)); R(c, x + 3, y - 10, 5, 10, shade(col, 0.8)); for (let i = 0; i < 4; i++) R(c, x - 6 + i * 4, y - 27, 2, 2, '#c8a07a'); if (e.pose === 'roar') R(c, x - 3, y - 26, 6, 3, '#ff6a2a'); break; }
    case 'horse': { const col = e.tint || '#7a4a2a'; sh(18); R(c, x - 9, y - 12, 18, 7, col); const hx = fl > 0 ? x + 7 : x - 12; R(c, hx, y - 18, 5, 8, col); R(c, hx + (fl > 0 ? 3 : 0), y - 18, 2, 4, '#2a1a0a'); for (let i = 0; i < 4; i++) R(c, x - 8 + i * 5, y - 5 - ((i + st) % 2), 2, 5, shade(col, 0.8)); R(c, fl > 0 ? x - 11 : x + 9, y - 12, 2, 6, '#2a1a0a'); if (e.saddle) R(c, x - 3, y - 13, 6, 3, e.saddle === 'royal' ? '#2a4a9a' : '#5a3a1a'); if (e.mounted) { drawHuman(c, x, y - 8, { kind: e.rider || 'herald' }, 'down', 'idle', t); } break; }
    case 'sheep': case 'goat': { const col = kind === 'sheep' ? '#e8e4d8' : '#c8b8a0'; sh(12); R(c, x - 6, y - 9, 12, 6, col); R(c, x - 6, y - 10, 12, 2, shade(col, 1.05)); const hx = fl > 0 ? x + 5 : x - 8; R(c, hx, y - 11, 3, 4, kind === 'sheep' ? '#3a3a3a' : col); if (kind === 'goat') R(c, hx, y - 13, 1, 2, '#8a7a5a'); for (let i = 0; i < 4; i++) R(c, x - 5 + i * 3, y - 3 - ((i + st) % 2), 1, 3, '#3a3a3a'); break; }
    case 'rabbit': case 'squirrel': case 'cat': { const col = kind === 'rabbit' ? (e.tint || '#d8d0c0') : kind === 'squirrel' ? '#b8643a' : '#1a1a1a'; sh(6); R(c, x - 3, y - 5, 6, 4, col); R(c, x - 2, y - 8, 4, 3, col); if (kind === 'rabbit') { R(c, x - 2, y - 11, 1, 3, col); R(c, x + 1, y - 11, 1, 3, col); const eyes = e.eyes === 'glow' ? '#ff2a2a' : e.eyes === 'red' ? '#c82a2a' : '#2a1a1a'; R(c, x - 1, y - 7, 1, 1, eyes); R(c, x + 1, y - 7, 1, 1, eyes); if (e.eyes === 'glow') { R(c, x - 2, y - 7, 1, 1, '#ff8a8a'); } } if (kind === 'squirrel') R(c, x + 3, y - 9, 3, 6, '#c8743a'); if (kind === 'cat') { R(c, x - 2, y - 9, 1, 1, col); R(c, x + 1, y - 9, 1, 1, col); R(c, x - 1, y - 7, 1, 1, '#e8e04a'); R(c, x + 1, y - 7, 1, 1, '#e8e04a'); R(c, x + 3, y - 7, 1, 5, col); } break; }
    case 'deer': { const col = '#a8743a'; sh(14); R(c, x - 7, y - 11, 14, 6, col); const hx = fl > 0 ? x + 6 : x - 9; R(c, hx, y - 16, 3, 6, col); R(c, hx - 1, y - 19, 1, 3, '#d8c8a0'); R(c, hx + 3, y - 19, 1, 3, '#d8c8a0'); for (let i = 0; i < 4; i++) R(c, x - 6 + i * 4, y - 5 - ((i + st) % 2), 1, 5, shade(col, 0.8)); break; }
    case 'frog': { sh(6); R(c, x - 3, y - 4, 6, 3, '#4a9a3a'); R(c, x - 3, y - 5, 2, 1, '#6aba5a'); R(c, x + 1, y - 5, 2, 1, '#6aba5a'); R(c, x - 2, y - 5, 1, 1, '#1a1a1a'); R(c, x + 2, y - 5, 1, 1, '#1a1a1a'); break; }
    case 'goose': { sh(10); const col = '#f4f0e8'; R(c, x - 5, y - 8, 10, 6, col); R(c, x + fl * 3, y - 14, 2, 7, col); R(c, x + fl * 3 + (fl > 0 ? 2 : -2), y - 14, 2, 1, '#f2a03a'); R(c, x + fl * 3 + (fl > 0 ? 1 : 0), y - 13, 1, 1, '#1a1a1a'); R(c, x - 2, y - 2, 1, 2, '#f2a03a'); R(c, x + 1, y - 2, 1, 2, '#f2a03a'); if (e.pose === 'wings') { R(c, x - 10, y - 10, 5, 3, col); R(c, x + 5, y - 10, 5, 3, col); } if (e.pouch) R(c, x + fl * 2, y - 9, 3, 3, '#a07a3a'); break; }
    case 'donkey': { const col = '#8a8078'; sh(16); R(c, x - 8, y - 11, 16, 6, col); const hx = fl > 0 ? x + 6 : x - 10; R(c, hx, y - 16, 4, 6, col); R(c, hx, y - 20, 1, 4, col); R(c, hx + 3, y - 20, 1, 4, col); for (let i = 0; i < 4; i++) R(c, x - 7 + i * 4, y - 5, 2, 5, shade(col, 0.8)); if (e.pose === 'sing') R(c, hx + 1, y - 12, 2, 2, '#3a1a1a'); break; }
    case 'crow': { const fly = e.fly; const flap = fly ? (Math.floor(t * 10) % 2) * 2 : 0; const s = e.scale || 1; if (!fly) sh(5); R(c, x - 2 * s, y - 6 * s - (fly ? 6 : 0), 5 * s, 4 * s, '#1a1a24'); R(c, x + 2 * s, y - 7 * s - (fly ? 6 : 0), 2 * s, 2 * s, '#1a1a24'); R(c, x + 4 * s, y - 6 * s - (fly ? 6 : 0), 1 * s, 1, '#c8a02a'); if (fly) { R(c, x - 6 * s, y - 13 + flap, 5 * s, 2, '#2a2a34'); R(c, x + 3 * s, y - 13 + flap, 5 * s, 2, '#2a2a34'); } break; }
    case 'scorpion': { sh(8); R(c, x - 4, y - 4, 8, 3, '#8a4a1a'); R(c, x + 3, y - 8, 2, 4, '#8a4a1a'); R(c, x + 2, y - 9, 2, 1, '#c86a2a'); R(c, x - 6, y - 4, 2, 2, '#8a4a1a'); break; }
    case 'orb': { const col = e.color || '#7ac8ff'; const p = 1 + Math.sin(t * 4) * 0.2; c.fillStyle = col; c.globalAlpha *= 0.35; c.beginPath(); c.arc(x, y - 10, 8 * p, 0, 7); c.fill(); c.globalAlpha /= 0.35; R(c, x - 3, y - 13, 6, 6, col); R(c, x - 1, y - 12, 2, 2, '#ffffff'); break; }
    case 'livingArmor': { const col = '#9a9aa8'; sh(10); const sit = e.pose === 'sit'; const oy = sit ? 3 : 0; R(c, x - 4, y - 14 + oy, 8, 8, col); R(c, x - 3, y - 19 + oy, 6, 5, shade(col, 1.1)); const open = Math.floor(t * 3) % 2; R(c, x - 2, y - 17 + oy, 4, 1, open ? '#1a1a1a' : col); R(c, x - 3, y - 6 + oy, 2, 6 - oy, shade(col, 0.8)); R(c, x + 1, y - 6 + oy, 2, 6 - oy, shade(col, 0.8)); R(c, x - 6, y - 13 + oy, 2, 6, col); R(c, x + 4, y - 13 + oy, 2, 6, col); break; }
    case 'dragonPuppet': { const col = '#4a9a3a'; sh(30); const st2 = e.state; if (st2 === 'split') { R(c, x - 22, y - 12, 16, 10, col); R(c, x + 8, y - 12, 16, 10, col); break; } R(c, x - 16, y - 14, 32, 12, col); for (let i = 0; i < 6; i++) R(c, x - 14 + i * 5, y - 17, 3, 3, '#c8e84a'); R(c, x + 14, y - 24, 10, 10, col); R(c, x + 20, y - 22, 2, 2, '#ffffff'); R(c, x + 22, y - 18, 3, 2, '#c83a3a'); R(c, x - 24, y - 10, 8, 3, col); if (st2 === 'unmasked') { R(c, x + 14, y - 24, 10, 10, '#e8b88a'); R(c, x + 16, y - 21, 1, 1, '#1a1a1a'); R(c, x + 20, y - 21, 1, 1, '#1a1a1a'); } for (let i = 0; i < 4; i++) R(c, x - 10 + i * 6, y - 3, 2, 3, '#5a3a1a'); break; }
    case 'flyingTent': { const l = e.landed; R(c, x - 14, y - (l ? 14 : 22), 28, 14, '#c83a3a'); for (let i = 0; i < 4; i++) R(c, x - 14 + i * 7, y - (l ? 14 : 22), 3, 14, '#f0e0c0'); R(c, x - 1, y - (l ? 20 : 28), 2, 6, '#7a5a3a'); if (!l) R(c, x, y - 8, 1, 12, '#c8a86a'); break; }
    default: drawHuman(c, x, y, e, dir, e.pose, t, e);
  }
}

// ——— Nesneler (prop) ———
export function drawProp(c, kind, x, y, e, t) {
  x = Math.round(x); y = Math.round(y);
  const st = e.state;
  const sh = (w, h = 2) => { c.fillStyle = 'rgba(0,0,0,0.22)'; c.fillRect(x - w / 2, y - 1, w, h); };
  switch (kind) {
    case 'tree': case 'bigTree': case 'talkingTree': case 'fallingTree': {
      const s = kind === 'bigTree' || kind === 'talkingTree' ? 1.5 : 1; const burning = e.burning;
      if (kind === 'fallingTree' && e.rot) { c.save(); c.translate(x, y); c.rotate(e.rot); c.translate(-x, -y); }
      sh(14 * s, 3); R(c, x - 2 * s, y - 10 * s, 4 * s, 10 * s, '#5a3a1a');
      const g = burning ? '#5a3a1a' : '#3f7a34';
      R(c, x - 9 * s, y - 24 * s, 18 * s, 14 * s, g); R(c, x - 7 * s, y - 28 * s, 14 * s, 5 * s, shade(g, 1.15)); R(c, x - 9 * s, y - 12 * s, 18 * s, 2, shade(g, 0.75));
      if (kind === 'talkingTree') { const awake = st === 'awake' || st === 'sleep'; R(c, x - 3, y - 12, 2, awake ? 2 : 1, st === 'sleep' ? '#3a2a1a' : '#ffd27a'); R(c, x + 2, y - 12, 2, awake ? 2 : 1, st === 'sleep' ? '#3a2a1a' : '#ffd27a'); R(c, x - 2, y - 8, 5, 1, '#2a1a0a'); R(c, x - 3, y - 6, 7, 4, '#5a7a4a'); }
      if (burning) for (let i = 0; i < 4; i++) R(c, x - 8 * s + i * 4 * s, y - 26 * s - ((Math.floor(t * 9) + i) % 3) * 2, 3, 4, i % 2 ? '#ff9a2a' : '#ffd23a');
      if (e.mark) R(c, x - 1, y - 8, 3, 3, '#c82a2a');
      if (kind === 'fallingTree' && e.rot) c.restore();
      break;
    }
    case 'pine': { sh(10, 3); R(c, x - 1, y - 6, 3, 6, '#5a3a1a'); const g = e.burning ? '#4a3a2a' : '#2f5f34'; R(c, x - 7, y - 12, 14, 6, g); R(c, x - 5, y - 18, 10, 6, shade(g, 1.1)); R(c, x - 3, y - 23, 6, 5, shade(g, 1.2)); R(c, x - 1, y - 26, 2, 3, shade(g, 1.2)); if (e.mark) R(c, x - 1, y - 5, 3, 3, '#c82a2a'); if (e.burning) for (let i = 0; i < 3; i++) R(c, x - 5 + i * 4, y - 24 - ((Math.floor(t * 9) + i) % 3) * 2, 3, 4, '#ff9a2a'); break; }
    case 'deadtree': { sh(8); R(c, x - 1, y - 18, 3, 18, '#4a3a2a'); R(c, x - 6, y - 14, 5, 1, '#4a3a2a'); R(c, x + 2, y - 11, 5, 1, '#4a3a2a'); R(c, x - 6, y - 16, 1, 2, '#4a3a2a'); break; }
    case 'bush': case 'brushPile': { sh(12); const g = kind === 'brushPile' ? '#6a5a2a' : '#3f7a34'; R(c, x - 7, y - 7, 14, 6, g); R(c, x - 5, y - 9, 10, 3, shade(g, 1.15)); if (kind === 'brushPile') R(c, x - 6, y - 6, 12, 1, '#4a3a1a'); break; }
    case 'hedge': { R(c, x - 10, y - 7, 20, 7, '#3a6a2a'); R(c, x - 10, y - 8, 20, 2, '#4a7a3a'); break; }
    case 'flowers': { for (let i = 0; i < 5; i++) R(c, x - 6 + i * 3, y - 2 - (i % 2), 1, 1, ['#ff6a8a', '#ffe06a', '#c8a8ff', '#ffffff', '#ff9a4a'][i]); break; }
    case 'mushroom': case 'mushrooms': { const red = e.red || kind === 'mushroom'; for (let i = 0; i < 3; i++) { const mx = x - 4 + i * 4; R(c, mx, y - 3, 1, 3, '#e8e0d0'); R(c, mx - 1, y - 5, 3, 2, red ? '#c82a2a' : '#a8845a'); if (red) R(c, mx, y - 5, 1, 1, '#ffffff'); } break; }
    case 'mushroomBig': { sh(10); R(c, x - 1, y - 7, 3, 7, '#e8e0d0'); R(c, x - 6, y - 11, 12, 4, '#8a5ac8'); R(c, x - 3, y - 11, 1, 1, '#e8d8ff'); R(c, x + 2, y - 10, 1, 1, '#e8d8ff'); break; }
    case 'moonLily': { R(c, x, y - 6, 1, 6, '#4a7a3a'); R(c, x - 2, y - 9, 5, 3, '#e8f0ff'); R(c, x - 1, y - 10, 3, 1, '#ffffff'); break; }
    case 'root': { R(c, x - 6, y - 2, 12, 2, '#5a3a1a'); R(c, x - 6, y - 4, 2, 2, '#5a3a1a'); break; }
    case 'branch': { R(c, x - 8, y - 2, 16, 2, '#6a4a2a'); R(c, x + 2, y - 4, 4, 1, '#6a4a2a'); break; }
    case 'leaves': { for (let i = 0; i < 8; i++) R(c, x - 8 + i * 2, y - 2 + (i % 2), 2, 1, i % 2 ? '#a8742a' : '#c8943a'); break; }
    case 'acorns': { for (let i = 0; i < 6; i++) R(c, x - 6 + i * 2, y - 1 - (i % 2), 1, 1, '#8a5a2a'); break; }
    case 'log': { sh(18); R(c, x - 9, y - 5, 18, 5, '#7a5a3a'); R(c, x + 7, y - 5, 2, 5, '#c8a06a'); break; }
    case 'stump': { sh(12); R(c, x - 6, y - 6, 12, 6, '#7a5a3a'); R(c, x - 6, y - 7, 12, 2, '#c8a06a'); break; }
    case 'hill': { c.fillStyle = '#5a8a4a'; c.beginPath(); c.ellipse(x, y - 4, 30, 12, 0, Math.PI, 0); c.fill(); break; }
    case 'rock': case 'stone': { sh(10); const col = e.melted ? '#5a4a4a' : '#8a8a8a'; const s = kind === 'stone' ? 0.6 : 1; R(c, x - 6 * s, y - 6 * s, 12 * s, 6 * s, col); R(c, x - 4 * s, y - 8 * s, 8 * s, 2 * s, shade(col, 1.15)); break; }
    case 'boulder': { sh(18, 3); R(c, x - 10, y - 12, 20, 12, '#7a7a78'); R(c, x - 8, y - 15, 16, 4, '#8a8a88'); R(c, x - 10, y - 3, 20, 3, '#5a5a58'); break; }
    case 'cliff': case 'cliffEdge': case 'canyon': { R(c, x - 22, y - 30, 44, 30, '#7a6e5e'); R(c, x - 22, y - 32, 44, 3, '#8a7e6e'); for (let i = 0; i < 5; i++) R(c, x - 20 + i * 9, y - 26 + (i % 2) * 8, 6, 2, '#5a5040'); if (kind === 'canyon') R(c, x - 22, y - 30, 44, 30, 'rgba(160,60,40,0.3)'); break; }
    case 'rubble': { for (let i = 0; i < 6; i++) R(c, x - 10 + i * 4, y - 3 - (i % 3), 4, 3, i % 2 ? '#7a7a78' : '#8a8a88'); break; }
    case 'crater': { c.fillStyle = '#4a3a2a'; c.beginPath(); c.ellipse(x, y - 3, 16, 6, 0, 0, 7); c.fill(); c.fillStyle = '#2a1a10'; c.beginPath(); c.ellipse(x, y - 3, 10, 3, 0, 0, 7); c.fill(); break; }
    case 'standingStone': case 'runeStone': { sh(8); const col = e.dark ? '#2a2a32' : '#7a7a80'; R(c, x - 3, y - 18, 6, 18, col); R(c, x - 2, y - 20, 4, 2, col); R(c, x - 1, y - 14, 2, 1, kind === 'runeStone' ? '#7ae0ff' : e.dark ? '#6a2aff' : '#5a5a60'); R(c, x - 1, y - 10, 2, 1, kind === 'runeStone' ? '#7ae0ff' : '#5a5a60'); break; }
    case 'crystal': case 'starOre': { const col = kind === 'starOre' ? '#5a6a9a' : '#9adfff'; R(c, x - 3, y - 10, 6, 10, col); R(c, x - 1, y - 12, 2, 2, '#ffffff'); if (kind === 'starOre') R(c, x - 1, y - 6, 1, 3, '#7ac8ff'); break; }
    case 'chest': case 'chestIron': case 'chestTime': case 'safe': {
      if (e.buried) { R(c, x - 6, y - 2, 12, 2, '#6a4a2a'); break; }
      sh(14); const iron = kind === 'chestIron' || kind === 'safe'; const col = kind === 'safe' ? '#5a5a62' : iron ? '#5a3a2a' : kind === 'chestTime' ? '#6a4a8a' : '#7a4a1a';
      const open = st === 'open' || st === 'broken' || st === 'ajar';
      R(c, x - 6, y - 7, 12, 7, col); R(c, x - 6, y - 7, 12, 1, shade(col, 1.2));
      if (iron || kind === 'chest') { R(c, x - 6, y - 4, 12, 1, '#a8a8b0'); R(c, x - 1, y - 5, 2, 2, '#f2c14e'); }
      if (open) { R(c, x - 6, y - 12, 12, 4, shade(col, 0.8)); R(c, x - 5, y - 8, 10, 2, '#f2c14e'); }
      else R(c, x - 6, y - 9, 12, 2, shade(col, 0.9));
      if (kind === 'chestTime') R(c, x - 1, y - 6, 2, 3, '#e8d8a0');
      if (st === 'broken') R(c, x - 6, y - 7, 3, 3, '#3a2a1a');
      break;
    }
    case 'crate': case 'box': { if (e.broken) { R(c, x - 6, y - 3, 5, 3, '#8a6a3a'); R(c, x + 1, y - 2, 5, 2, '#8a6a3a'); break; } sh(10); R(c, x - 5, y - 9, 10, 9, '#8a6a3a'); R(c, x - 5, y - 9, 10, 1, '#a8885a'); R(c, x - 5, y - 5, 10, 1, '#6a4a2a'); if (e.seal) R(c, x - 1, y - 6, 2, 2, '#c82a2a'); if (st === 'open') R(c, x - 5, y - 11, 10, 2, '#a8885a'); break; }
    case 'barrel': { sh(8); R(c, x - 4, y - 10, 8, 10, '#7a4a2a'); R(c, x - 4, y - 8, 8, 1, '#5a5a5a'); R(c, x - 4, y - 3, 8, 1, '#5a5a5a'); break; }
    case 'sack': { sh(8); R(c, x - 4, y - 7, 8, 7, '#c8b07a'); R(c, x - 2, y - 9, 4, 2, '#a8905a'); break; }
    case 'basket': { R(c, x - 5, y - 5, 10, 5, '#a8743a'); R(c, x - 5, y - 6, 10, 1, '#c8944a'); if (e.spilled) for (let i = 0; i < 4; i++) R(c, x + 5 + i * 2, y - 1, 1, 1, '#5a9a3a'); else R(c, x - 3, y - 7, 6, 2, '#c83a3a'); break; }
    case 'pouch': case 'satchel': { if (e.hang) R(c, x, y - 12, 1, 6, '#5a3a1a'); const col = e.silk ? '#c83a6a' : kind === 'satchel' ? '#6a4a2a' : '#8a6a3a'; R(c, x - 3, y - (e.hang ? 7 : 5), 6, 5, col); R(c, x - 1, y - (e.hang ? 8 : 6), 2, 1, e.silk ? '#f2c14e' : shade(col, 0.7)); break; }
    case 'jewelBox': { R(c, x - 4, y - 5, 8, 5, '#6a2a4a'); R(c, x - 3, y - 6, 6, 1, '#f2c14e'); R(c, x - 1, y - 4, 2, 2, '#7affda'); break; }
    case 'goldPile': { for (let i = 0; i < 5; i++) R(c, x - 10 + i * 4, y - 3 - (i % 2) * 2, 5, 3 + (i % 2) * 2, i % 2 ? '#f2c14e' : '#d8a83a'); R(c, x - 4, y - 8, 8, 4, '#f2d06e'); break; }
    case 'pot': case 'cauldron': { sh(12); const col = kind === 'cauldron' ? '#2a2a2a' : '#a8643a'; R(c, x - 6, y - 8, 12, 8, col); R(c, x - 7, y - 9, 14, 2, shade(col, 1.3)); if (kind === 'cauldron') { R(c, x - 5, y - 9, 10, 1, e.dark ? '#2a1a3a' : '#6aba5a'); R(c, x - 4, y - 1, 8, 1, '#ff7a2a'); } break; }
    case 'campfire': case 'embers': { R(c, x - 5, y - 2, 10, 2, '#5a3a1a'); if (kind === 'campfire') { const f = Math.floor(t * 10) % 3; R(c, x - 3, y - 6 - f, 6, 4 + f, '#ff7a2a'); R(c, x - 1, y - 8 - f, 2, 3, '#ffd23a'); } else for (let i = 0; i < 4; i++) R(c, x - 5 + i * 3, y - 2, 1, 1, (Math.floor(t * 4) + i) % 2 ? '#ff5a2a' : '#8a2a1a'); break; }
    case 'lanternGlow': { R(c, x - 1, y - 6, 3, 4, '#ffd27a'); c.fillStyle = 'rgba(255,220,140,0.25)'; c.beginPath(); c.arc(x, y - 4, 22, 0, 7); c.fill(); break; }
    case 'bedroll': { R(c, x - 8, y - 4, 16, 4, '#7a3a3a'); R(c, x - 8, y - 4, 4, 4, '#c8b88a'); break; }
    case 'tent': { sh(22); R(c, x - 11, y - 12, 22, 12, '#b8a07a'); R(c, x - 8, y - 16, 16, 4, '#c8b08a'); R(c, x - 3, y - 18, 6, 2, '#d8c09a'); R(c, x - 2, y - 8, 4, 8, '#4a3a2a'); break; }
    case 'hut': case 'hutRuin': case 'barn': case 'witchHut': {
      const ruin = kind === 'hutRuin', w = kind === 'barn' ? 30 : 24, col = kind === 'barn' ? '#8a3a2a' : kind === 'witchHut' ? '#4a3a2a' : '#a8845a';
      sh(w + 4, 3); R(c, x - w / 2, y - 16, w, 16, col); R(c, x - w / 2, y - 16, w, 1, shade(col, 1.2));
      const roof = e.snowy ? '#e8f0f8' : kind === 'witchHut' ? '#3a4a2a' : '#7a4a2a';
      if (!ruin) { R(c, x - w / 2 - 3, y - 22, w + 6, 6, roof); R(c, x - w / 2, y - 26, w, 4, shade(roof, 1.1)); }
      else { R(c, x - w / 2, y - 20, w / 2, 4, '#5a3a1a'); }
      R(c, x - 3, y - 9, 6, 9, '#4a2a1a'); R(c, x + w / 2 - 8, y - 12, 4, 4, '#ffd27a');
      if (e.cross) { R(c, x - 3, y - 9, 6, 1, '#c82a2a'); R(c, x, y - 12, 1, 6, '#c82a2a'); }
      if (kind === 'witchHut') { R(c, x - w / 2 + 2, y - 14, 2, 2, '#e8e0d0'); R(c, x + w / 2 - 4, y - 6, 2, 2, '#e8e0d0'); }
      break;
    }
    case 'mill': { sh(20, 3); R(c, x - 8, y - 26, 16, 26, '#c8b89a'); R(c, x - 10, y - 30, 20, 5, '#7a4a2a'); c.save(); c.translate(x, y - 22); c.rotate((e.rot || 0) + t * 0.3 * (e.spin ? 1 : 0.15)); for (let i = 0; i < 4; i++) { c.rotate(Math.PI / 2); R(c, -1, -18, 3, 16, '#e8e0d0'); } c.restore(); R(c, x - 2, y - 8, 4, 8, '#4a2a1a'); break; }
    case 'towerRuin': { sh(18, 3); R(c, x - 8, y - 40, 16, 40, '#8a8a80'); R(c, x - 10, y - 44, 20, 4, '#9a9a90'); for (let i = 0; i < 4; i++) R(c, x - 10 + i * 6, y - 47, 3, 3, '#9a9a90'); R(c, x - 2, y - 30, 4, 6, '#2a2a2a'); R(c, x + 4, y - 40, 4, 10, '#5a5a50'); break; }
    case 'ruin': case 'manorRuin': case 'pillar': {
      if (kind === 'pillar') { R(c, x - 3, y - 22, 6, 22, '#a8a498'); R(c, x - 4, y - 24, 8, 2, '#b8b4a8'); break; }
      const w = kind === 'manorRuin' ? 50 : 30; R(c, x - w / 2, y - 18, 5, 18, '#8a8478'); R(c, x + w / 2 - 5, y - 24, 5, 24, '#8a8478'); R(c, x - w / 2, y - 6, w, 6, '#7a7468'); R(c, x - w / 2 + 6, y - 12, 8, 6, '#7a7468');
      if (kind === 'manorRuin') { R(c, x - 6, y - 30, 12, 30, '#3a2a22'); R(c, x - 4, y - 26, 8, 6, '#1a1210'); }
      break;
    }
    case 'monasteryFar': { R(c, x - 20, y - 20, 40, 20, '#5a5a6a'); R(c, x - 4, y - 34, 8, 14, '#6a6a7a'); R(c, x - 2, y - 38, 4, 4, '#6a6a7a'); R(c, x - 1, y - 30, 2, 3, '#ffd27a'); break; }
    case 'outpost': case 'gatehouse': case 'gate': case 'palisade': {
      if (kind === 'palisade') { for (let i = -6; i <= 6; i++) { if (Math.abs(i) < 1) continue; R(c, x + i * 6 - 2, y - 22, 4, 22, '#7a5a3a'); R(c, x + i * 6 - 1, y - 24, 2, 2, '#7a5a3a'); } break; }
      if (kind === 'gate') { R(c, x - 20, y - 18, 4, 18, '#5a5a5a'); R(c, x + 16, y - 18, 4, 18, '#5a5a5a'); R(c, x - 20, y - 20, 40, 3, '#5a5a5a'); for (let i = 0; i < 6; i++) R(c, x - 15 + i * 6, y - 17, 1, 17, '#3a3a3a'); break; }
      const burning = e.burning; R(c, x - 18, y - 30, 36, 30, kind === 'gatehouse' ? '#8a8a88' : '#7a5a3a'); R(c, x - 20, y - 34, 40, 5, kind === 'gatehouse' ? '#9a9a98' : '#6a4a2a');
      const open = st === 'open'; R(c, x - 6, y - 16, 12, 16, open ? '#2a1a10' : '#5a3a1a'); if (!open) R(c, x - 6, y - 10, 12, 1, '#3a2a1a');
      if (kind === 'outpost') R(c, x + 12, y - 44, 2, 12, '#5a3a1a'), R(c, x + 14, y - 44, 8, 5, '#2a4a9a');
      if (burning) for (let i = 0; i < 6; i++) R(c, x - 16 + i * 6, y - 36 - ((Math.floor(t * 9) + i) % 3) * 3, 4, 6, i % 2 ? '#ff7a2a' : '#ffd23a');
      break;
    }
    case 'barrier': case 'chainGate': { R(c, x - 22, y - 10, 3, 10, '#5a4a3a'); R(c, x + 19, y - 10, 3, 10, '#5a4a3a'); if (st !== 'open') { if (kind === 'chainGate') for (let i = 0; i < 10; i++) R(c, x - 19 + i * 4, y - 8 + (i % 2), 3, 2, '#8a8a8a'); else { R(c, x - 19, y - 8, 38, 2, '#c82a2a'); R(c, x - 12, y - 8, 6, 2, '#f0f0f0'); R(c, x + 4, y - 8, 6, 2, '#f0f0f0'); } } break; }
    case 'barricade': { sh(30); const roy = e.royal; for (let i = -2; i <= 2; i++) { R(c, x + i * 7 - 3, y - 8, 7, 8, roy ? '#7a5a3a' : '#8a6a3a'); R(c, x + i * 7 - 3, y - 8, 7, 1, '#a8885a'); } if (roy) { R(c, x - 2, y - 16, 2, 8, '#5a3a1a'); R(c, x, y - 16, 6, 4, '#2a4a9a'); } break; }
    case 'mausoleum': case 'tomb': { const w = kind === 'tomb' ? 18 : 40; R(c, x - w / 2, y - (kind === 'tomb' ? 8 : 32), w, kind === 'tomb' ? 8 : 32, '#6a6a72'); if (kind === 'mausoleum') { R(c, x - w / 2 - 3, y - 36, w + 6, 5, '#7a7a82'); R(c, x - 6, y - 18, 12, 18, st === 'open' ? '#101014' : '#3a3a42'); } else R(c, x - w / 2, y - 10, w, 2, '#8a8a92'); break; }
    case 'coffin': { R(c, x - 4, y - 12, 8, 12, '#5a3a2a'); R(c, x - 1, y - 9, 2, 5, '#c8a02a'); R(c, x - 3, y - 6, 6, 1, '#c8a02a'); if (st === 'open') R(c, x - 4, y - 12, 8, 3, '#2a1a10'); break; }
    case 'grave': { R(c, x - 3, y - 9, 6, 9, '#8a8a90'); R(c, x - 2, y - 10, 4, 1, '#9a9aa0'); R(c, x - 1, y - 7, 2, 1, '#5a5a60'); if (st === 'open') R(c, x - 5, y - 1, 10, 2, '#3a2a1a'); break; }
    case 'swordGrave': { R(c, x - 1, y - 12, 1, 12, '#8a8a7a'); R(c, x - 3, y - 10, 5, 1, '#6a5a3a'); break; }
    case 'swordInStone': { R(c, x - 6, y - 5, 12, 5, '#7a7a78'); if (st !== 'clean') { R(c, x, y - 18, 1, 13, e.dark ? '#3a2a3a' : '#c8c8d0'); R(c, x - 2, y - 18, 5, 1, '#2a1a1a'); R(c, x, y - 20, 1, 2, '#ff2a6a'); } else { R(c, x, y - 18, 1, 13, '#f8f8ff'); R(c, x - 2, y - 18, 5, 1, '#f2c14e'); } break; }
    case 'statue': case 'statueBroken': { sh(12); R(c, x - 6, y - 6, 12, 6, '#9a9a92'); R(c, x - 3, y - 18, 6, 12, '#aaa9a0'); if (kind === 'statue' || st === 'whole') { R(c, x - 2, y - 23, 4, 5, '#aaa9a0'); R(c, x - 2, y - 25, 4, 2, '#c8a02a'); } break; }
    case 'statueHead': { R(c, x - 3, y - 5, 6, 5, '#aaa9a0'); R(c, x - 2, y - 7, 4, 2, '#c8a02a'); R(c, x - 2, y - 3, 1, 1, '#5a5a52'); R(c, x + 1, y - 3, 1, 1, '#5a5a52'); break; }
    case 'altar': case 'table': case 'stall': case 'bench': case 'anvil': case 'grindstone': case 'throne': case 'crownStand': {
      if (kind === 'throne') { R(c, x - 8, y - 22, 16, 22, '#8a1a2a'); R(c, x - 10, y - 24, 20, 3, '#f2c14e'); R(c, x - 10, y - 8, 4, 8, '#c8a02a'); R(c, x + 6, y - 8, 4, 8, '#c8a02a'); break; }
      if (kind === 'anvil') { R(c, x - 5, y - 6, 10, 3, '#5a5a62'); R(c, x - 2, y - 3, 4, 3, '#4a4a52'); break; }
      if (kind === 'grindstone') { R(c, x - 4, y - 9, 8, 8, '#8a8a80'); R(c, x - 1, y - 6, 2, 2, '#5a5a50'); R(c, x - 5, y - 2, 10, 2, '#6a4a2a'); break; }
      if (kind === 'crownStand') { R(c, x - 2, y - 10, 4, 10, '#c8a02a'); R(c, x - 4, y - 14, 8, 4, '#f2c14e'); R(c, x - 1, y - 13, 2, 1, '#ff3a3a'); break; }
      const col = kind === 'altar' ? '#8a8a80' : '#7a5a3a'; R(c, x - 8, y - 6, 16, 3, col); R(c, x - 7, y - 3, 2, 3, shade(col, 0.8)); R(c, x + 5, y - 3, 2, 3, shade(col, 0.8));
      if (kind === 'stall') { R(c, x - 9, y - 18, 2, 12, '#5a3a1a'); R(c, x + 7, y - 18, 2, 12, '#5a3a1a'); R(c, x - 10, y - 20, 20, 3, '#c83a3a'); for (let i = 0; i < 4; i++) R(c, x - 8 + i * 5, y - 20, 2, 3, '#f0e0c0'); }
      if (kind === 'altar') R(c, x - 3, y - 7, 6, 1, '#4a4a44');
      break;
    }
    case 'forge': case 'forgeRuin': { R(c, x - 8, y - 14, 16, 14, kind === 'forgeRuin' ? '#3a3230' : '#6a5a52'); R(c, x - 4, y - 8, 8, 6, st === 'lit' ? '#ff7a2a' : '#1a1210'); if (st === 'lit') R(c, x - 2, y - 7, 4, 3, '#ffd23a'); R(c, x - 3, y - 20, 6, 6, '#5a4a42'); break; }
    case 'scaffold': { c.save(); c.translate(x, y); c.rotate(e.rot || 0); R(c, -10, -24, 2, 24, '#8a6a3a'); R(c, 8, -24, 2, 24, '#8a6a3a'); R(c, -10, -14, 20, 2, '#8a6a3a'); R(c, -10, -24, 20, 2, '#8a6a3a'); c.restore(); break; }
    case 'well': { sh(14); R(c, x - 7, y - 8, 14, 8, '#8a8a88'); R(c, x - 5, y - 7, 10, 2, e.poison ? '#5aaa3a' : '#2a3a5a'); R(c, x - 7, y - 18, 2, 10, '#6a4a2a'); R(c, x + 5, y - 18, 2, 10, '#6a4a2a'); R(c, x - 8, y - 20, 16, 2, '#7a4a2a'); break; }
    case 'cave': case 'iceCave': case 'tunnel': case 'snowCave': { const col = kind === 'iceCave' || kind === 'snowCave' ? '#c8e0f0' : '#6a6260'; R(c, x - 22, y - 26, 44, 26, col); R(c, x - 12, y - 18, 24, 18, '#141018'); R(c, x - 10, y - 20, 20, 2, '#141018'); if (kind === 'iceCave') for (let i = 0; i < 5; i++) R(c, x - 10 + i * 5, y - 18, 2, 3, '#e8f8ff'); break; }
    case 'stoneDoor': case 'vaultDoor': case 'cellarDoor': {
      if (kind === 'cellarDoor') { R(c, x - 6, y - 4, 12, 4, st === 'open' ? '#1a1210' : '#6a4a2a'); R(c, x - 6, y - 2, 12, 1, '#4a3a1a'); break; }
      R(c, x - 20, y - 32, 40, 32, '#7a7270'); const open = st === 'open'; R(c, x - 12, y - 26, 24, 26, open ? '#141018' : (kind === 'vaultDoor' ? '#8a7a4a' : '#5a5250'));
      if (!open) { R(c, x - 1, y - 26, 2, 26, '#3a3230'); R(c, x - 8, y - 18, 3, 3, '#f2c14e'); R(c, x - 1, y - 20, 2, 3, '#bfe0ff'); R(c, x + 5, y - 18, 3, 3, '#c8c8d0'); }
      else if (kind === 'vaultDoor') for (let i = 0; i < 4; i++) R(c, x - 10 + i * 6, y - 6 - (i % 2) * 2, 5, 5, '#f2c14e');
      break;
    }
    case 'bridge': case 'stoneBridge': { const stone = kind === 'stoneBridge'; R(c, x - 70, y - 4, 140, 26, '#3a6a9a'); R(c, x - 26, y - 2, 52, 24, stone ? '#8a8a80' : '#8a6a3a'); for (let i = 0; i < 8; i++) R(c, x - 26, y + i * 3, 52, 1, stone ? '#6a6a60' : '#6a4a2a'); if (e.broken) R(c, x - 8, y + 6, 16, 8, '#3a6a9a'); R(c, x - 28, y - 4, 2, 26, '#5a3a1a'); R(c, x + 26, y - 4, 2, 26, '#5a3a1a'); break; }
    case 'raft': { R(c, x - 8, y - 4, 16, 6, '#8a6a3a'); for (let i = 0; i < 4; i++) R(c, x - 8 + i * 4, y - 4, 1, 6, '#6a4a2a'); break; }
    case 'fence': case 'fenceBroken': { for (let i = -2; i <= 2; i++) { if (kind === 'fenceBroken' && i === 0) continue; R(c, x + i * 6, y - 8, 2, 8, '#8a6a3a'); } R(c, x - 12, y - 6, kind === 'fenceBroken' ? 8 : 26, 1, '#8a6a3a'); if (kind === 'fenceBroken') R(c, x + 6, y - 6, 8, 1, '#8a6a3a'); break; }
    case 'clothesline': { R(c, x - 20, y - 16, 1, 16, '#6a4a2a'); R(c, x + 19, y - 16, 1, 16, '#6a4a2a'); R(c, x - 20, y - 15, 40, 1, '#c8c8c8'); R(c, x - 14, y - 14, 6, 6, '#c83a3a'); R(c, x + 2, y - 14, 6, 6, '#3a7ac8'); break; }
    case 'digPit': case 'pit': case 'hole': case 'ditch': { c.fillStyle = kind === 'ditch' ? '#4a3a24' : '#3a2a1a'; c.beginPath(); c.ellipse(x, y - 3, kind === 'hole' ? 5 : 12, kind === 'hole' ? 2 : 5, 0, 0, 7); c.fill(); if (kind === 'digPit') R(c, x - 4, y - 5, 8, 3, '#8a8478'); break; }
    case 'deadEnd': { R(c, x - 14, y - 20, 28, 20, '#7a7270'); R(c, x - 12, y - 18, 24, 2, '#8a8280'); break; }
    case 'nest': { R(c, x - 20, y - 8, 40, 8, '#7a5a3a'); for (let i = 0; i < 3; i++) R(c, x - 8 + i * 6, y - 11, 4, 4, '#e8e0c8'); break; }
    case 'netTrap': { for (let i = 0; i < 5; i++) { R(c, x - 6 + i * 3, y - 50, 1, 14, '#c8a86a'); } R(c, x, y - 70, 1, 20, '#c8a86a'); break; }
    case 'cage': { R(c, x - 6, y - 12, 12, 12, 'rgba(0,0,0,0)'); if (st !== 'open') for (let i = 0; i < 5; i++) R(c, x - 6 + i * 3, y - 12, 1, 12, '#6a6a6a'); R(c, x - 6, y - 12, 12, 1, '#6a6a6a'); R(c, x - 6, y - 1, 12, 1, '#6a6a6a'); break; }
    case 'trap': { R(c, x - 5, y - 2, 10, 2, '#5a5a5a'); if (st === 'shut') { R(c, x - 4, y - 5, 8, 3, '#7a7a7a'); for (let i = 0; i < 4; i++) R(c, x - 4 + i * 2, y - 6, 1, 1, '#a8a8a8'); } else { R(c, x - 7, y - 3, 3, 1, '#a8a8a8'); R(c, x + 4, y - 3, 3, 1, '#a8a8a8'); } break; }
    case 'web': { c.strokeStyle = 'rgba(230,230,230,0.7)'; c.lineWidth = 1; c.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; c.moveTo(x, y - 14); c.lineTo(x + Math.cos(a) * 12, y - 14 + Math.sin(a) * 12); } c.stroke(); c.beginPath(); c.arc(x, y - 14, 6, 0, 7); c.stroke(); break; }
    case 'waterfall': { R(c, x - 14, y - 40, 28, 40, '#7ac0e8'); for (let i = 0; i < 6; i++) R(c, x - 12 + i * 5, y - 40 + ((Math.floor(t * 12) + i * 3) % 40), 2, 6, '#e8f8ff'); break; }
    case 'spring': case 'stream': case 'flood': case 'swamp': case 'mudPool': {
      const col = kind === 'swamp' ? '#3a4a2a' : kind === 'mudPool' ? '#5a4024' : '#3a7aba';
      const w = kind === 'flood' ? 90 : kind === 'stream' ? 24 : 26, h = kind === 'flood' ? 34 : kind === 'stream' ? 40 : 10;
      c.fillStyle = col; c.beginPath(); c.ellipse(x, y - h / 2, w / 2, h / 2, 0, 0, 7); c.fill();
      c.fillStyle = shade(col, 1.3); for (let i = 0; i < 3; i++) c.fillRect(x - w / 4 + i * 8, y - h / 2 + ((Math.floor(t * 3) + i) % 3) * 3, 4, 1);
      if (kind === 'flood') { R(c, x - 26, y - 30, 2, 8, '#6a4a2a'); R(c, x + 24, y - 30, 2, 8, '#6a4a2a'); }
      break;
    }
    case 'fogBank': { c.fillStyle = 'rgba(220,225,235,0.55)'; for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(x - 20 + i * 14, y - 10 - (i % 2) * 4, 16, 8, 0, 0, 7); c.fill(); } break; }
    case 'path': { R(c, x - 6, y - 30, 12, 30, '#a8845a'); break; }
    case 'sign': case 'signpost': case 'signStack': case 'notice': case 'noticeBoard': case 'marker': case 'pilgrimMark': {
      if (kind === 'marker') { R(c, x, y - 8, 1, 8, '#6a4a2a'); R(c, x + 1, y - 8, 4, 3, '#c82a2a'); break; }
      if (kind === 'pilgrimMark') { R(c, x - 2, y - 10, 4, 10, '#8a8a80'); R(c, x - 1, y - 8, 2, 1, '#c8a02a'); R(c, x, y - 9, 1, 3, '#c8a02a'); break; }
      R(c, x - 1, y - 14, 2, 14, '#6a4a2a');
      if (kind === 'signStack') { for (let i = 0; i < 3; i++) R(c, x - 8 + (i % 2) * 2, y - 16 + i * 4, 14, 3, ['#a8845a', '#9a7a4a', '#b8946a'][i]); break; }
      if (kind === 'signpost') { R(c, x - 10, y - 14, 10, 3, '#a8845a'); R(c, x, y - 11, 10, 3, '#a8845a'); R(c, x - 8, y - 8, 8, 3, '#a8845a'); break; }
      const w = kind === 'noticeBoard' ? 18 : 12; R(c, x - w / 2, y - 18, w, 8, e.red ? '#a02a2a' : '#a8845a');
      if (e.poster || kind === 'notice' || kind === 'noticeBoard') { if (st !== 'torn') { R(c, x - 3, y - 17, 6, 6, '#e8e0c8'); R(c, x - 2, y - 15, 4, 2, '#8a5a3a'); } else R(c, x - 3, y - 13, 3, 2, '#e8e0c8'); }
      break;
    }
    case 'banner': { R(c, x, y - 24, 1, 24, '#5a3a1a'); const col = e.color || '#2a4a9a'; R(c, x + 1, y - 24, 8, 10, col); if (e.torn) R(c, x + 6, y - 16, 3, 2, 'rgba(0,0,0,0)'); if (!e.torn && !e.crooked) R(c, x + 4, y - 21, 2, 3, '#f2c14e'); if (e.crooked) R(c, x + 3, y - 18, 3, 2, '#f2c14e'); break; }
    case 'lamp': { R(c, x, y - 18, 1, 18, '#3a3a3a'); R(c, x - 2, y - 21, 5, 4, '#ffd27a'); break; }
    case 'tower': { R(c, x - 7, y - 34, 14, 34, '#b8b4a8'); R(c, x - 9, y - 38, 18, 4, '#c8c4b8'); R(c, x - 2, y - 26, 4, 5, '#2a2a3a'); R(c, x - 1, y - 46, 2, 8, '#5a3a1a'); R(c, x + 1, y - 46, 6, 4, '#c82a2a'); break; }
    case 'chalk': { if (e.lit) { R(c, x - 6, y - 2, 12, 1, '#e8e8e8'); R(c, x - 1, y - 4, 3, 1, '#e8e8e8'); R(c, x, y - 5, 1, 3, '#e8e8e8'); } else R(c, x - 6, y - 2, 12, 1, '#b8b8b8'); break; }
    case 'footprints': case 'pawprints': case 'grainTrail': { for (let i = 0; i < 5; i++) R(c, x - 4 + (i % 2) * 4, y - i * 6, 2, kind === 'grainTrail' ? 1 : 2, kind === 'grainTrail' ? '#e8c870' : '#5a4024'); break; }
    case 'scorch': { c.fillStyle = 'rgba(30,20,20,0.6)'; c.beginPath(); c.ellipse(x, y - 3, 18, 6, 0, 0, 7); c.fill(); for (let i = 0; i < 3; i++) R(c, x - 14 + i * 12, y - 6, 3, 3, '#2a2020'); break; }
    case 'arrowStuck': { R(c, x, y - 7, 1, 7, '#8a6a3a'); R(c, x - 1, y - 8, 3, 1, '#e8e8e8'); break; }
    case 'armorPile': { R(c, x - 10, y - 5, 20, 5, '#8a8a90'); R(c, x - 6, y - 8, 6, 3, '#6a6a70'); R(c, x + 2, y - 9, 5, 4, '#a8a8b0'); R(c, x - 8, y - 6, 1, 6, '#c8c8d0'); break; }
    case 'armorStand': { R(c, x, y - 18, 1, 18, '#6a4a2a'); if (!e.empty) { R(c, x - 4, y - 16, 8, 8, '#9a9aa8'); R(c, x - 3, y - 20, 6, 4, '#aaaabb'); R(c, x - 1, y - 13, 1, 1, '#1a1a1a'); } break; }
    case 'shield': case 'shieldBroken': { R(c, x - 4, y - 8, 8, 8, kind === 'shieldBroken' ? '#5a5a62' : '#5a6a9a'); R(c, x - 1, y - 7, 2, 6, '#e8e8f0'); if (kind === 'shieldBroken') R(c, x + 1, y - 8, 3, 3, 'rgba(0,0,0,0.6)'); if (e.glint && Math.floor(t * 3) % 3 === 0) R(c, x + 2, y - 8, 1, 1, '#ffffff'); break; }
    case 'helmet': { R(c, x - 3, y - 5, 6, 5, '#8a7a6a'); R(c, x - 2, y - 3, 4, 1, '#2a2a2a'); break; }
    case 'pickaxe': { R(c, x - 4, y - 2, 8, 1, '#6a4a2a'); R(c, x + 3, y - 4, 1, 4, '#8a8a8a'); break; }
    case 'planks': { for (let i = 0; i < 3; i++) R(c, x - 8, y - 2 - i * 2, 16, 2, i % 2 ? '#9a7a4a' : '#8a6a3a'); break; }
    case 'bones': { R(c, x - 5, y - 2, 10, 1, '#e8e4d8'); R(c, x - 2, y - 4, 4, 3, '#e8e4d8'); R(c, x - 1, y - 3, 1, 1, '#2a2a2a'); break; }
    case 'cartWreck': case 'cart': case 'cartTipped': case 'wagon': case 'carriage': {
      const col = kind === 'carriage' ? (e.royal ? '#2a4a9a' : '#5a2a2a') : kind === 'cartWreck' ? '#5a4a3a' : kind === 'wagon' ? '#7a2a6a' : '#8a6a3a';
      if (kind === 'cartTipped' || e.tipped) { c.save(); c.translate(x, y); c.rotate(0.5); c.translate(-x, -y); }
      sh(24, 3); R(c, x - 12, y - 14, 24, 9, col); R(c, x - 12, y - 14, 24, 1, shade(col, 1.25));
      if (kind === 'carriage') { R(c, x - 10, y - 22, 20, 8, col); R(c, x - 6, y - 20, 4, 4, '#bfe0ff'); R(c, x + 2, y - 20, 4, 4, '#bfe0ff'); R(c, x - 10, y - 23, 20, 1, '#f2c14e'); }
      if (kind === 'wagon') { R(c, x - 12, y - 24, 24, 10, e.colorful ? '#c8a02a' : '#d8c8a8'); for (let i = 0; i < 4; i++) R(c, x - 12 + i * 7, y - 24, 3, 10, '#7a2a6a'); }
      if (e.grain) R(c, x - 10, y - 17, 20, 3, '#e8c870');
      R(c, x - 10, y - 6, 6, 6, '#4a3a2a'); R(c, x + 4, y - 6, 6, 6, kind === 'cartWreck' ? '#3a2a1a' : '#4a3a2a'); R(c, x - 8, y - 4, 2, 2, '#8a6a3a'); R(c, x + 6, y - 4, 2, 2, '#8a6a3a');
      if (kind === 'cartWreck') R(c, x + 4, y - 14, 8, 9, 'rgba(0,0,0,0.5)');
      if (kind === 'cartTipped' || e.tipped) c.restore();
      break;
    }
    case 'horseDead': { R(c, x - 10, y - 5, 20, 5, '#6a4a2a'); R(c, x + 8, y - 7, 5, 4, '#6a4a2a'); R(c, x - 2, y - 6, 6, 2, '#2a4a9a'); break; }
    case 'bell': { R(c, x - 8, y - 26, 16, 2, '#5a3a1a'); R(c, x - 8, y - 26, 2, 26, '#5a3a1a'); R(c, x + 6, y - 26, 2, 26, '#5a3a1a'); c.save(); c.translate(x, y - 24); c.rotate(e.rot || Math.sin(t * 6) * 0.1); R(c, -4, 0, 8, 9, '#c8943a'); R(c, -5, 8, 10, 2, '#a8742a'); c.restore(); break; }
    case 'scroll': case 'book': case 'seal': case 'sealDark': case 'ring': case 'necklace': case 'feather': case 'scarf': case 'scale': case 'inkpot': case 'sparkle': case 'helmetSmall': {
      if (e.buried) { R(c, x - 3, y - 1, 6, 1, '#5a4024'); if (Math.floor(t * 3) % 2) R(c, x, y - 2, 1, 1, '#f2c14e'); break; }
      if (e.hang) R(c, x, y - 12, 1, 6, '#5a3a1a');
      const yy = e.hang ? y - 6 : y;
      if (kind === 'sparkle') { const f = Math.floor(t * 6) % 2; R(c, x - (f ? 2 : 1), yy - 4, f ? 5 : 3, 1, '#fff6c0'); R(c, x, yy - 6 + (f ? 0 : 1), 1, f ? 5 : 3, '#fff6c0'); break; }
      const map = { scroll: '#e8e0c8', book: '#6a2a2a', seal: '#f2c14e', sealDark: '#3a1a4a', ring: '#f2c14e', necklace: '#4ac88a', feather: '#1a1a2a', scarf: '#c82a2a', scale: '#8a5a3a', inkpot: '#1a1a3a' };
      const col = map[kind];
      if (kind === 'sealDark') { R(c, x - 6, y - 6, 12, 6, col); R(c, x - 2, y - 5, 4, 4, '#6a2aff'); break; }
      if (kind === 'scale') { R(c, x - 5, y - 6, 10, 6, col); R(c, x - 3, y - 5, 2, 2, '#c8843a'); break; }
      R(c, x - 2, yy - 3, 4, 3, col); if (e.bloody) R(c, x - 1, yy - 2, 2, 1, '#8a1a1a'); if (e.seal) R(c, x, yy - 2, 1, 1, '#c82a2a');
      if (kind === 'ring' || kind === 'necklace') R(c, x - 1, yy - 2, 2, 1, kind === 'ring' ? '#ff3a3a' : '#ffffff');
      break;
    }
    case 'rug': { R(c, x - 14, y - 6, 28, 8, '#7a2a4a'); R(c, x - 12, y - 4, 24, 4, '#c8a02a'); R(c, x - 10, y - 3, 20, 2, '#7a2a4a'); break; }
    case 'spikes': break;
    default: R(c, x - 4, y - 6, 8, 6, '#8a6a3a');
  }
}

// ——— İkonlar (UI ve havada taşınan eşyalar için küçük pixel ikonlar) ———
export function drawIcon(c, key, x, y, s = 1) {
  const P = (px, py, w, h, col) => R(c, x + px * s, y + py * s, w * s, h * s, col);
  const k = (key || '').toLowerCase();
  if (k.startsWith('w_sword') || k === 'sword') { P(5, 0, 1, 8, '#d8d8e0'); P(4, 7, 3, 1, '#8a6a2a'); P(5, 8, 1, 2, '#6a4a2a'); return; }
  if (k.startsWith('w_axe') || k === 'axe') { P(4, 1, 1, 9, '#7a5a3a'); P(5, 1, 3, 4, '#b8b8c0'); return; }
  if (k.startsWith('w_spear') || k === 'spear') { P(5, 2, 1, 8, '#8a6a3a'); P(4, 0, 3, 2, '#c8c8d0'); return; }
  if (k.startsWith('a_')) { const col = k.includes('heavy') ? '#a8a8b8' : k.includes('medium') ? '#8a8a98' : '#8a6a4a'; P(2, 1, 6, 7, col); P(1, 1, 2, 3, col); P(7, 1, 2, 3, col); P(4, 2, 2, 1, '#2a2a2a'); return; }
  const map = {
    x_wolf: () => { P(2, 3, 6, 1, '#8a6a3a'); P(4, 4, 2, 4, '#f0ead8'); },
    x_ring: () => { P(3, 3, 4, 4, '#f2c14e'); P(4, 4, 2, 2, 'rgba(0,0,0,0)'); P(4, 2, 2, 1, '#4ac88a'); },
    ring: () => { P(3, 3, 4, 4, '#f2c14e'); P(4, 2, 2, 1, '#ff3a3a'); },
    x_holy: () => { P(4, 1, 2, 8, '#f2e080'); P(2, 3, 6, 2, '#f2e080'); },
    x_brooch: () => { P(2, 3, 6, 4, '#f2c14e'); P(4, 4, 2, 2, '#2a4a9a'); },
    x_locket: () => { P(4, 2, 2, 2, '#c8a02a'); P(3, 4, 4, 4, '#c8a02a'); P(4, 5, 2, 2, '#ff6a8a'); },
    x_eye: () => { P(2, 3, 6, 4, '#1a1a2a'); P(4, 4, 2, 2, '#9a6aff'); },
    c_potion: () => { P(4, 1, 2, 2, '#8a6a3a'); P(3, 3, 4, 5, '#d83a3a'); P(4, 4, 1, 1, '#ff9a9a'); },
    c_potionl: () => { P(4, 0, 2, 2, '#8a6a3a'); P(2, 2, 6, 7, '#c82a5a'); P(3, 3, 1, 2, '#ff9aba'); },
    c_bandage: () => { P(2, 4, 6, 2, '#f0ead8'); P(4, 3, 2, 4, '#f0ead8'); P(4, 4, 2, 2, '#d83a3a'); },
    c_herb: () => { P(4, 4, 1, 5, '#3a7a2a'); P(2, 2, 3, 3, '#5aaa3a'); P(5, 3, 3, 3, '#4a9a3a'); },
    c_smoke: () => { P(3, 3, 4, 5, '#6a6a6a'); P(4, 1, 2, 2, '#9a9a9a'); P(2, 1, 2, 2, '#c8c8c8'); },
    c_fire: () => { P(3, 4, 4, 4, '#3a3a3a'); P(4, 2, 1, 2, '#8a6a3a'); P(4, 0, 2, 2, '#ff7a2a'); },
    c_pick: () => { P(2, 5, 6, 1, '#a8a8b0'); P(7, 3, 1, 3, '#a8a8b0'); P(1, 4, 2, 3, '#6a4a2a'); },
    c_charm: () => { P(3, 2, 4, 6, '#7ac8ff'); P(4, 3, 2, 4, '#e8f8ff'); P(4, 1, 2, 1, '#c8a02a'); },
    q_seal: () => { P(2, 2, 6, 6, '#f2c14e'); P(3, 3, 4, 4, '#c8943a'); P(4, 4, 2, 2, '#8a1a1a'); },
    q_map: () => { P(1, 2, 8, 6, '#e8d8a8'); P(3, 4, 1, 1, '#8a5a3a'); P(5, 3, 2, 2, '#c82a2a'); },
    letter: () => { P(1, 2, 8, 6, '#e8e0c8'); P(1, 2, 8, 1, '#c8b890'); P(4, 4, 2, 2, '#c82a2a'); },
    scroll: () => { P(2, 2, 6, 6, '#e8e0c8'); P(1, 2, 8, 1, '#a8905a'); P(1, 7, 8, 1, '#a8905a'); },
    book: () => { P(2, 2, 6, 7, '#6a2a2a'); P(3, 3, 4, 1, '#c8a02a'); },
    bag: () => { P(2, 3, 6, 6, '#8a6a3a'); P(4, 2, 2, 1, '#5a3a1a'); },
    bread: () => { P(1, 4, 8, 4, '#c88a3a'); P(2, 3, 6, 1, '#e8aa5a'); },
    bowl: () => { P(2, 5, 6, 3, '#8a5a3a'); P(2, 4, 6, 1, '#c86a2a'); },
    crate: () => { P(2, 2, 6, 6, '#8a6a3a'); P(2, 4, 6, 1, '#6a4a2a'); },
    box: () => { P(2, 3, 6, 5, '#6a4a2a'); P(2, 3, 6, 1, '#c8a02a'); },
    crown: () => { P(2, 4, 6, 3, '#f2c14e'); P(2, 2, 1, 2, '#f2c14e'); P(4, 2, 2, 2, '#f2c14e'); P(7, 2, 1, 2, '#f2c14e'); P(4, 5, 2, 1, '#ff3a3a'); },
    feather: () => { P(4, 1, 2, 7, '#2a2a3a'); P(5, 7, 1, 2, '#8a8a8a'); },
    flag: () => { P(2, 1, 1, 8, '#5a3a1a'); P(3, 1, 5, 4, '#5a1a1a'); },
    flower: () => { P(4, 4, 1, 5, '#4a7a3a'); P(3, 1, 3, 3, '#e8f0ff'); },
    gem: () => { P(3, 3, 4, 4, '#4ac8e8'); P(4, 3, 1, 1, '#ffffff'); },
    hammer: () => { P(4, 3, 1, 6, '#6a4a2a'); P(2, 1, 5, 3, '#8a8a8a'); },
    heart: () => { P(2, 3, 2, 2, '#e83a5a'); P(5, 3, 2, 2, '#e83a5a'); P(2, 4, 5, 2, '#e83a5a'); P(3, 6, 3, 1, '#e83a5a'); P(4, 7, 1, 1, '#e83a5a'); },
    key: () => { P(2, 3, 3, 3, '#f2c14e'); P(5, 4, 4, 1, '#f2c14e'); P(7, 5, 1, 2, '#f2c14e'); },
    map: () => { P(1, 2, 8, 6, '#e8d8a8'); P(3, 4, 4, 1, '#8a5a3a'); },
    necklace: () => { P(2, 2, 1, 4, '#c8a02a'); P(7, 2, 1, 4, '#c8a02a'); P(3, 6, 4, 1, '#c8a02a'); P(4, 6, 2, 2, '#4ac88a'); },
    ore: () => { P(2, 3, 6, 5, '#5a6a9a'); P(3, 4, 2, 1, '#7ac8ff'); },
    rune: () => { P(2, 2, 6, 6, '#7a7a80'); P(4, 3, 1, 4, '#7ae0ff'); P(3, 4, 3, 1, '#7ae0ff'); },
    scale: () => { P(2, 2, 6, 6, '#8a5a3a'); P(3, 3, 2, 2, '#c8843a'); },
    shield: () => { P(2, 1, 6, 7, '#5a6a9a'); P(4, 2, 2, 5, '#e8e8f0'); },
    coin: () => { P(3, 3, 4, 4, '#f2c14e'); P(4, 4, 2, 2, '#c8943a'); },
  };
  (map[k] || (() => { P(2, 2, 6, 6, '#a8845a'); P(3, 3, 4, 4, '#c8a46a'); }))();
}
export function iconForItem(id) {
  const k = id.toLowerCase();
  if (k.startsWith('w_') || k.startsWith('a_')) return k;
  return k.replace('c_potion_l', 'c_potionl');
}
