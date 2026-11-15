// Tayfa ve evcil hayvan sprite üretici. Her tayfa verideki "look" parametreleriyle özgün görünür;
// her biri kendi idle (görev) animasyonuna sahiptir. Kareler önbelleğe alınır.
import { makeCanvas, rect, px, hline, vline, line } from './pixel.js';
import { CREW_BY_ID } from '../data/crew.js';

export const FW = 16; // kare genişliği
export const FH = 20; // kare yüksekliği (ayaklar en alt satırda)
const cache = new Map();

function shadeHex(hex, f) {
  const v = parseInt(hex.slice(1), 16);
  let r = (v >> 16) & 255, g = (v >> 8) & 255, b = v & 255;
  const k = (c) => Math.max(0, Math.min(255, Math.round(f < 0 ? c * (1 + f) : c + (255 - c) * f)));
  return `rgb(${k(r)},${k(g)},${k(b)})`;
}

/**
 * state: 'idle' | 'walk' | 'act' | 'sit'
 * frame: 0..3
 */
export function crewFrame(id, state = 'idle', frame = 0) {
  const key = `${id}|${state}|${frame}`;
  if (cache.has(key)) return cache.get(key);
  const c = makeCanvas(FW, FH);
  const ctx = c.getContext('2d');
  const def = CREW_BY_ID[id];
  drawHuman(ctx, def.look, def.build || 'normal', def.idle, state, frame);
  cache.set(key, c);
  return c;
}

function drawHuman(ctx, L, build, idle, state, frame) {
  const ox = 3; // sol boşluk
  const by = state === 'idle' && frame % 2 === 1 ? 1 : 0; // nefes
  const bob = state === 'walk' && frame % 2 === 1 ? -1 : 0;
  const sit = state === 'sit';
  const curtsy = state === 'act' && idle === 'curtsy' && frame % 2 === 1 ? 1 : 0;
  const yo = (sit ? 3 : 0) + bob + curtsy; // gövde aşağı kayması
  const outline = '#1a1423';
  const skin = L.skin;
  const big = build === 'big';
  const round = build === 'round';
  const bootC = '#2a1c14';
  // Bacaklar
  if (!sit) {
    const lf = state === 'walk' ? [0, -1, 0, 1][frame] : 0;
    rect(ctx, ox + 3 + lf, 14, 2, 4, L.pants);
    rect(ctx, ox + 6 - lf, 14, 2, 4, shadeHex(L.pants, -0.15));
    rect(ctx, ox + 3 + lf, 18, 2, 1, bootC);
    rect(ctx, ox + 6 - lf, 18, 2, 1, bootC);
    rect(ctx, ox + 4 + lf, 18, 2, 1, bootC);
    rect(ctx, ox + 7 - lf, 18, 2, 1, bootC);
  } else {
    rect(ctx, ox + 3, 16, 6, 2, L.pants);
    rect(ctx, ox + 8, 17, 2, 2, bootC);
  }
  // Gövde
  const tx0 = big || round ? ox + 1 : ox + 2;
  const tw = big || round ? 8 : 6;
  const ty = 9 + yo + by;
  rect(ctx, tx0, ty, tw, 5 - by, L.top);
  if (round) rect(ctx, tx0 - 1, ty + 2, tw + 2, 3 - by, L.top);
  rect(ctx, tx0, ty + 4 - by, tw, 1, L.top2 || shadeHex(L.top, -0.3)); // kemer
  px(ctx, tx0 + 2, ty + 1, L.top2 || shadeHex(L.top, 0.2));
  px(ctx, tx0 + 3, ty + 2, L.top2 || shadeHex(L.top, 0.2));
  vline(ctx, tx0, ty, ty + 4 - by, shadeHex(L.top, -0.25));
  // Arka kol
  rect(ctx, tx0 - 1, ty + 1, 1, 3, shadeHex(L.top, -0.3));
  // Kafa
  const hx = ox + 3;
  const hy = 3 + yo + by;
  rect(ctx, hx, hy, 4, 5, skin);
  px(ctx, hx + 3, hy + 2, outline); // göz (sağa bakar)
  if (L.glasses) { px(ctx, hx + 2, hy + 2, '#8ad0f0'); px(ctx, hx + 3, hy + 2, '#8ad0f0'); }
  if (L.eyepatch) { px(ctx, hx + 3, hy + 2, '#000000'); hline(ctx, hx, hx + 3, hy + 1, '#000000'); }
  px(ctx, hx + 3, hy + 4, shadeHex(skin, -0.25)); // ağız/çene
  drawHair(ctx, L, hx, hy);
  drawBeard(ctx, L, hx, hy);
  drawHat(ctx, L, hx, hy, idle === 'windsense' ? frame : 0);
  // Ön kol + eylem
  drawArmAndProp(ctx, L, idle, state, frame, tx0 + tw, ty, hx, hy);
}

function drawHair(ctx, L, hx, hy) {
  const h = L.hair;
  switch (L.hairStyle) {
    case 'bald': break;
    case 'long': hline(ctx, hx, hx + 3, hy - 1, h); rect(ctx, hx - 1, hy, 2, 7, h); break;
    case 'bun': hline(ctx, hx, hx + 3, hy - 1, h); rect(ctx, hx - 1, hy, 1, 3, h); rect(ctx, hx - 2, hy - 2, 2, 2, h); break;
    case 'braid': hline(ctx, hx, hx + 3, hy - 1, h); rect(ctx, hx - 1, hy, 1, 4, h); for (let i = 0; i < 4; i++) px(ctx, hx - 2 + (i % 2), hy + 4 + i, h); break;
    case 'ponytail': hline(ctx, hx, hx + 3, hy - 1, h); rect(ctx, hx - 1, hy, 1, 2, h); rect(ctx, hx - 2, hy + 1, 1, 4, h); break;
    case 'curly': rect(ctx, hx - 1, hy - 2, 6, 2, h); px(ctx, hx - 1, hy, h); px(ctx, hx - 1, hy + 1, h); px(ctx, hx + 4, hy - 1, h); break;
    case 'mohawk': rect(ctx, hx + 1, hy - 3, 2, 3, h); hline(ctx, hx, hx + 3, hy - 1, shadeHex(h, -0.3)); break;
    case 'topknot': hline(ctx, hx, hx + 3, hy - 1, h); rect(ctx, hx - 1, hy, 1, 2, h); rect(ctx, hx + 1, hy - 3, 2, 2, h); break;
    default: hline(ctx, hx, hx + 3, hy - 1, h); rect(ctx, hx - 1, hy - 1, 1, 3, h); px(ctx, hx, hy, h); break;
  }
}

function drawBeard(ctx, L, hx, hy) {
  const b = L.beardColor || L.hair;
  switch (L.beard) {
    case 'short': rect(ctx, hx + 1, hy + 3, 3, 2, b); break;
    case 'full': rect(ctx, hx, hy + 3, 4, 3, b); px(ctx, hx + 3, hy + 3, shadeHex(b, 0.2)); break;
    case 'long': rect(ctx, hx + 1, hy + 3, 3, 5, b); break;
    case 'braids': rect(ctx, hx, hy + 3, 4, 3, b); vline(ctx, hx + 1, hy + 6, hy + 8, b); vline(ctx, hx + 3, hy + 6, hy + 8, b); break;
    case 'mustache': hline(ctx, hx + 2, hx + 4, hy + 3, b); break;
  }
}

function drawHat(ctx, L, hx, hy, wind) {
  const c = L.hatColor || '#444';
  const d = shadeHex(c, -0.3);
  switch (L.hat) {
    case 'turban': rect(ctx, hx - 1, hy - 3, 6, 3, c); hline(ctx, hx - 1, hx + 4, hy - 1, d); px(ctx, hx + 2, hy - 3, d); if (L.hatGem) px(ctx, hx + 3, hy - 2, '#2fa04a'); break;
    case 'tricorn': hline(ctx, hx - 2, hx + 5, hy - 1, c); rect(ctx, hx, hy - 3, 4, 2, c); px(ctx, hx - 2, hy - 2, c); px(ctx, hx + 5, hy - 2, c); px(ctx, hx + 2, hy - 2, '#e8e0c0'); break;
    case 'bandana': hline(ctx, hx, hx + 3, hy - 1, c); hline(ctx, hx, hx + 3, hy, c); px(ctx, hx - 1, hy + 1, c); px(ctx, hx - 2, hy + 2, c); break;
    case 'cap': rect(ctx, hx, hy - 2, 4, 2, c); hline(ctx, hx + 2, hx + 5, hy - 1, d); break;
    case 'horned': rect(ctx, hx, hy - 2, 4, 2, c); hline(ctx, hx, hx + 3, hy - 1, d); px(ctx, hx - 1, hy - 3, '#f0ead8'); px(ctx, hx - 1, hy - 2, '#f0ead8'); px(ctx, hx + 4, hy - 3, '#f0ead8'); px(ctx, hx + 4, hy - 2, '#f0ead8'); break;
    case 'straw': hline(ctx, hx - 2, hx + 5, hy - 1, c); rect(ctx, hx, hy - 3, 4, 2, c); hline(ctx, hx, hx + 3, hy - 2, d); break;
    case 'hood': rect(ctx, hx - 1, hy - 2, 6, 2, c); rect(ctx, hx - 1, hy, 1, 7, c); px(ctx, hx + 4, hy, c); rect(ctx, hx - 2, hy + 1, 1, 6, d); break;
    case 'scarf': rect(ctx, hx - 1, hy - 2, 6, 2, c); rect(ctx, hx - 1, hy, 1, 6, c); rect(ctx, hx - 2, hy + 2, 1, 4, d); break;
    case 'crown': hline(ctx, hx, hx + 3, hy - 2, c); px(ctx, hx, hy - 3, c); px(ctx, hx + 2, hy - 3, c); px(ctx, hx + 3, hy - 3, c); px(ctx, hx + 1, hy - 2, '#c8423b'); break;
    case 'tiara': hline(ctx, hx, hx + 3, hy - 2, c); px(ctx, hx + 2, hy - 3, '#8ad0ff'); break;
    case 'feather': hline(ctx, hx, hx + 3, hy - 1, c); px(ctx, hx - 1, hy - 2, '#e8e2d0'); px(ctx, hx - 1, hy - 3, '#e8e2d0'); px(ctx, hx - 2, hy - 4, '#e8e2d0'); break;
    case 'headwrap': rect(ctx, hx, hy - 2, 4, 2, c); px(ctx, hx - 1, hy - 1, d); break;
    case 'fez': rect(ctx, hx + 1, hy - 3, 3, 3, c); px(ctx, hx, hy - 3, '#1a1a1a'); px(ctx, hx - 1, hy - 2, '#1a1a1a'); break;
    case 'chef': rect(ctx, hx, hy - 4, 4, 4, c); rect(ctx, hx - 1, hy - 5, 6, 2, c); hline(ctx, hx, hx + 3, hy - 1, '#d8d8d8'); break;
    case 'beret': rect(ctx, hx - 1, hy - 2, 5, 2, c); px(ctx, hx + 1, hy - 3, c); break;
    case 'sunhalo': hline(ctx, hx - 1, hx + 4, hy - 3, c); px(ctx, hx - 2, hy - 2, c); px(ctx, hx + 5, hy - 2, c); px(ctx, hx + 1, hy - 4, '#fff0a0'); break;
    default: break;
  }
  if (wind) { px(ctx, hx - 2, hy - 1 + (wind % 2), L.hair); px(ctx, hx - 3, hy + (wind % 2), L.hair); }
}

function drawArmAndProp(ctx, L, idle, state, f, ax, ty, hx, hy) {
  const sleeve = L.top;
  const skin = L.skin;
  const act = state === 'act';
  const raise = (dy) => {
    rect(ctx, ax, ty + dy, 1, 3, sleeve);
    px(ctx, ax, ty + dy + 3, skin);
  };
  if (!act) {
    raise(1);
    return;
  }
  const wood = '#6a4424';
  const steel = '#b8c0c8';
  switch (idle) {
    case 'beads': raise(1); for (let i = 0; i < 4; i++) px(ctx, ax + ((i + f) % 2), ty + 5 + i, i === f ? '#f2c14e' : '#c8423b'); break;
    case 'fan': rect(ctx, ax, ty - 1 + (f % 2), 1, 3, sleeve); hline(ctx, ax + 1, ax + 3, ty - 2 + (f % 2), '#e8c45a'); hline(ctx, ax + 1, ax + 4, ty - 1 + (f % 2), '#b8323e'); hline(ctx, ax + 1, ax + 3, ty + (f % 2), '#e8c45a'); break;
    case 'lookback': raise(1); px(ctx, hx + 3, hy + 2, skin); px(ctx, hx, hy + 2, '#1a1423'); break;
    case 'inspect': raise(0); rect(ctx, ax + 1, ty - 1 + (f % 2), 3, 3, 'rgba(160,220,255,0.7)'); px(ctx, ax + 1, ty + 2 + (f % 2), wood); break;
    case 'count': raise(2); rect(ctx, ax, ty + 3, 4, 3, wood); for (let i = 0; i < 3; i++) px(ctx, ax + 1 + ((i + f) % 3), ty + 4 + (i % 2), '#e07b39'); break;
    case 'sniff': rect(ctx, ax - 1, ty - 1, 1, 3, sleeve); rect(ctx, hx + 4, hy + 2 + (f % 2), 2, 2, '#e07b39'); break;
    case 'sharpen': raise(1); line(ctx, ax, ty + 4, ax + 3, ty + 1, wood); rect(ctx, ax + 2, ty - 1, 3, 3, steel); if (f % 2) px(ctx, ax + 5, ty - 2, '#fff0a0'); break;
    case 'bow': rect(ctx, ax, ty + 1, 2, 1, sleeve); vline(ctx, ax + 3, ty - 3, ty + 5, wood); px(ctx, ax + 2, ty - 2, wood); px(ctx, ax + 2, ty + 4, wood); hline(ctx, ax - 1 - (f % 2), ax + 2, ty + 1, '#e8e0c8'); break;
    case 'swagger': rect(ctx, ax, ty - 1 + (f % 2 ? -1 : 0), 1, 3, sleeve); rect(ctx, hx + 4, hy + 3 - (f % 2), 1, 3, '#3a7a3a'); px(ctx, hx + 4, hy + 2 - (f % 2), '#c8a060'); break;
    case 'guard': raise(1); vline(ctx, ax + 1, ty - 6 + (f % 2), ty + 4, steel); px(ctx, ax + 1, ty + 4, '#2a2a2a'); hline(ctx, ax, ax + 2, ty + 3, '#c8a040'); break;
    case 'twinblades': raise(1); line(ctx, ax - 3, ty - 3 + (f % 2), ax + 3, ty + 4, steel); line(ctx, ax + 3, ty - 3 + (f % 2), ax - 3, ty + 4, steel); break;
    case 'spear': raise(1); vline(ctx, ax + 1, ty - 8, ty + 6, wood); rect(ctx, ax + 1, ty - 10, 1, 2, steel); rect(ctx, ax - 6, ty + 1, 3, 5, '#e8e2d0'); vline(ctx, ax - 5, ty + 1, ty + 5, '#7a3b1f'); break;
    case 'spyglass': rect(ctx, ax, ty - 1, 1, 2, sleeve); hline(ctx, hx + 3, hx + 6 + (f % 2), hy + 2, '#c8a040'); px(ctx, hx + 6 + (f % 2), hy + 2, '#8a6a20'); break;
    case 'windsense': rect(ctx, ax, ty - 3, 1, 3, sleeve); px(ctx, ax, ty - 4, skin); break;
    case 'map': raise(1); rect(ctx, ax - 3, ty + 1 - (f % 2), 6, 4, '#e8d8a8'); px(ctx, ax - 1, ty + 2, '#c8423b'); hline(ctx, ax - 3, ax + 2, ty + 4 - (f % 2), '#b8a070'); break;
    case 'fish': raise(1); line(ctx, ax, ty + 3, ax + 6, ty - 4, wood); vline(ctx, ax + 6, ty - 4, ty + 6 + (f % 2), 'rgba(230,230,230,0.8)'); break;
    case 'wetfinger': rect(ctx, ax, ty - 2, 1, 3, sleeve); px(ctx, ax, ty - 3 - (f % 2), skin); break;
    case 'stretch': rect(ctx, ax, ty - 3, 1, 3, sleeve); rect(ctx, hx - 1, ty - 3, 1, 3, sleeve); px(ctx, ax, ty - 4 + (f % 2), skin); break;
    case 'lantern': raise(1); vline(ctx, ax + 1, ty + 3, ty + 4, '#2a2a2a'); rect(ctx, ax, ty + 5, 3, 3, f % 2 ? '#fff0a0' : '#f2c14e'); px(ctx, ax + 3, ty + 6, 'rgba(255,240,160,0.5)'); break;
    case 'bag': raise(2); rect(ctx, ax - 1, ty + 4, 4, 3, '#2a2a2a'); px(ctx, ax, ty + 5, '#c8423b'); px(ctx, ax + 1, ty + 5 - (f % 2), '#c8423b'); break;
    case 'hammer': { const up = f % 2 === 0; rect(ctx, ax, ty + (up ? -2 : 1), 1, 3, sleeve); line(ctx, ax, ty + (up ? -2 : 3), ax + 3, ty + (up ? -4 : 3), wood); rect(ctx, ax + 3, ty + (up ? -6 : 2), 2, 3, steel); if (!up) px(ctx, ax + 5, ty + 5, '#fff0a0'); break; }
    case 'spell': rect(ctx, ax, ty - 3, 1, 3, sleeve); rect(ctx, hx - 1, ty - 3, 1, 3, sleeve); for (let i = 0; i < 3; i++) px(ctx, ax - 2 + ((f + i * 3) % 7), ty - 6 + ((f + i) % 3), i % 2 ? '#c8a0ff' : '#8b5bb5'); break;
    case 'stir': raise(1); rect(ctx, ax - 1, ty + 4, 5, 3, '#5d6470'); hline(ctx, ax - 1, ax + 3, ty + 4, '#9aa1a8'); line(ctx, ax + 1, ty + 1, ax + 1 + (f % 2 ? 1 : -1), ty + 4, wood); px(ctx, ax + (f % 3), ty + 1 - (f % 2), 'rgba(240,240,240,0.7)'); break;
    case 'pray': rect(ctx, ax - 1, ty + 1, 1, 2, skin); px(ctx, ax - 1, ty, skin); if (f % 2) px(ctx, ax, ty - 2, '#fff6c0'); break;
    case 'polish': raise(2); rect(ctx, ax, ty + 4, 3, 3, '#2a2a2e'); px(ctx, ax + (f % 2), ty + 4, '#e8e0c8'); break;
    case 'whisper': rect(ctx, ax - 1, ty - 1, 1, 3, sleeve); px(ctx, hx + 4, hy + 3, skin); break;
    case 'staff': raise(1); vline(ctx, ax + 1, ty - 7, ty + 6, wood); rect(ctx, ax, ty - 9, 3, 2, '#e8b83a'); if (f % 2) px(ctx, ax + 1, ty - 10, '#fff0a0'); break;
    case 'curtsy': raise(2); break;
    case 'scroll': raise(1); rect(ctx, ax - 2, ty + 1, 4, 4, '#f0e6c8'); hline(ctx, ax - 2, ax + 1, ty + 2 + (f % 2), '#8a7a5a'); break;
    case 'sunglow': rect(ctx, ax, ty - 2, 1, 3, sleeve); if (f % 2) { px(ctx, hx - 2, hy - 1, '#ffe080'); px(ctx, hx + 5, hy - 1, '#ffe080'); px(ctx, hx + 1, hy - 5, '#ffe080'); } break;
    default: raise(1);
  }
}

// ───────────── Evcil hayvanlar ─────────────

export const PET_FW = 14;
export const PET_FH = 12;

/** pose: walk0/walk1, sit, sleep, stand, wag0/wag1, bark, run0/run1, fly0/fly1, perch0/perch1, hold, climb */
export function petFrame(id, pose) {
  const key = `${id}|${pose}`;
  if (cache.has(key)) return cache.get(key);
  const c = id === 'PET_TARCIN' ? makeCanvas(DOG_FW, DOG_FH) : makeCanvas(PET_FW, PET_FH);
  const ctx = c.getContext('2d');
  if (id === 'PET_ZIPIR') drawCat(ctx, pose);
  else if (id === 'PET_TARCIN') drawDog(ctx, pose);
  else if (id === 'PET_KIRMIZI') drawParrot(ctx, pose, '#d43a2a', '#f2c14e', '#3b6ea5');
  else if (id === 'PET_GECEYARISI') drawParrot(ctx, pose, '#1f1630', '#6a3a9a', '#3a2a6a', pose === 'fluff');
  else if (id === 'PET_CUCE') drawMonkey(ctx, pose);
  else if (id === 'PET_MARTI') drawGull(ctx, pose);
  else if (id === 'PET_KAPLUMBAGA') drawTurtle(ctx, pose);
  else if (id === 'PET_GELINCIK') drawFerret(ctx, pose);
  else if (id === 'PET_AHTAPOT') drawOcto(ctx, pose);
  cache.set(key, c);
  return c;
}

function drawCat(ctx, pose) {
  const g = '#9a9aa4', d = '#6c6c78', l = '#c4c4cc', eye = '#3a3a46';
  const by = PET_FH - 1;
  if (pose === 'sleep') {
    rect(ctx, 2, by - 3, 9, 3, g);
    hline(ctx, 3, 9, by - 4, g);
    rect(ctx, 9, by - 5, 3, 3, g); // kafa
    px(ctx, 9, by - 6, d); px(ctx, 11, by - 6, d);
    hline(ctx, 10, 11, by - 4, eye);
    hline(ctx, 1, 4, by, d); // kuyruk sarılı
    px(ctx, 5, by - 2, l);
    return;
  }
  if (pose === 'sit') {
    rect(ctx, 4, by - 5, 4, 5, g);
    px(ctx, 3, by, d); px(ctx, 8, by, d);
    rect(ctx, 4, by - 9, 5, 4, g);
    px(ctx, 4, by - 10, d); px(ctx, 8, by - 10, d);
    hline(ctx, 6, 7, by - 7, eye); // kapalı gözler
    px(ctx, 5, by - 7, eye);
    px(ctx, 6, by - 6, '#e8a0a8');
    vline(ctx, 2, by - 3, by, d); px(ctx, 3, by - 4, d);
    px(ctx, 5, by - 3, l);
    return;
  }
  // yürüme / ayakta (yavaş, yumuşak)
  const step = pose === 'walk1' ? 1 : 0;
  rect(ctx, 3, by - 4, 7, 3, g);
  hline(ctx, 4, 8, by - 5, g);
  rect(ctx, 9, by - 7, 4, 4, g); // kafa
  px(ctx, 9, by - 8, d); px(ctx, 12, by - 8, d);
  hline(ctx, 11, 12, by - 6, eye);
  px(ctx, 13, by - 5, '#e8a0a8');
  vline(ctx, 3 + step, by - 1, by, d); vline(ctx, 5 - step, by - 1, by, g);
  vline(ctx, 8 + step, by - 1, by, d); vline(ctx, 9 - step, by - 1, by, g);
  px(ctx, 2, by - 5, d); px(ctx, 1, by - 6, d); px(ctx, 1, by - 7 - step, d);
  hline(ctx, 4, 7, by - 2, l);
}

// TARÇIN portresi (yan görünüm, sağa bakar): fotoğraftaki siyah-beyaz çoban köpeği, beyaz yüz şeridi,
// kabarık beyaz göğüs, beyaz patiler, yarı dik kulaklar, yukarı kıvrık kuyruk, MAVİ tasma ve gümüş künye.
export const DOG_FW = 20, DOG_FH = 17;
const DOG_PAL = { k: '#0e0d12', B: '#1e1c24', G: '#3a3844', W: '#f4f2ec', w: '#c9c6bf', n: '#050505', e: '#7a4524', p: '#ee8a9a', b: '#2f8ae8', d: '#1f5fae', s: '#c8ccd4', i: '#a87070' };
const DOG_ROWS = {
  sit: [
    '..........k...k.....',
    '.........kBk.kBk....',
    '.........kiBkBiBk...',
    '........kBBBWBBBk...',
    '........kBBBWWBBk...',
    '........kBeBWWBek...',
    '..kk....kBBWWWWWWnk.',
    '.kwBk....kBWWWWpWk..',
    '.kBBk...kddbbbbWWk..',
    '..kBk..kBBBbsWWWk...',
    '..kBBkkBBBBWWWWWk...',
    '...kBBBBBBBWWWWWk...',
    '...kBBBBBGBBWWWWk...',
    '..kBBBBBBBBBWkWWk...',
    '..kBBBBBBBBkWWkWWk..',
    '..kWWWBBBBkkWWkWWk..',
    '..kkkkkkkkk.kkkkkk..',
  ],
};
DOG_ROWS.bark = DOG_ROWS.sit.map((r, i) => (i === 7 ? '.kwBk....kBWWWWppk..' : r));

function drawDog(ctx, pose) {
  const rows = DOG_ROWS[pose] || DOG_ROWS.sit;
  rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) { const c = DOG_PAL[row[x]]; if (c) px(ctx, x, y, c); } });
}

function drawParrot(ctx, pose, body, chest, wing, fluff = false) {
  const by = PET_FH - 1;
  const beak = '#e8c040';
  if (pose === 'fly0' || pose === 'fly1') {
    const up = pose === 'fly0';
    rect(ctx, 5, 5, 5, 3, body);
    rect(ctx, 9, 4, 3, 3, body);
    px(ctx, 12, 5, beak);
    px(ctx, 10, 4, '#ffffff');
    if (up) { line(ctx, 6, 5, 4, 1, wing); line(ctx, 7, 5, 6, 1, wing); }
    else { line(ctx, 6, 7, 4, 10, wing); line(ctx, 7, 7, 6, 10, wing); }
    hline(ctx, 2, 5, 7, chest);
    return;
  }
  const bob = pose === 'perch1' ? 1 : 0;
  const f = fluff ? 1 : 0;
  rect(ctx, 6 - f, by - 7 + bob, 4 + f * 2, 5 - bob, body);
  rect(ctx, 7, by - 9 + bob, 3, 3, body);
  px(ctx, 10, by - 8 + bob, beak);
  px(ctx, 10, by - 7 + bob, beak);
  px(ctx, 8, by - 8 + bob, '#ffffff');
  px(ctx, 9, by - 8 + bob, '#000000');
  rect(ctx, 6 - f, by - 6 + bob, 2, 3, wing);
  hline(ctx, 8, 9, by - 4, chest);
  vline(ctx, 6, by - 2, by + 0, wing);
  vline(ctx, 5, by - 1, by + 0, body);
  px(ctx, 7, by, '#5a4a3a'); px(ctx, 9, by, '#5a4a3a');
  if (fluff) { px(ctx, 5, by - 8, body); px(ctx, 11, by - 6, body); px(ctx, 7, by - 10, body); }
}

function drawMonkey(ctx, pose) {
  const b = '#8a5a2b', o = '#c87a3a', face = '#e8c49a', hat = '#1e1e24';
  const by = PET_FH - 1;
  if (pose === 'sit' || pose === 'hold') {
    rect(ctx, 5, by - 5, 4, 5, b);
    rect(ctx, 5, by - 9, 4, 4, b);
    rect(ctx, 6, by - 8, 3, 2, face);
    px(ctx, 8, by - 8, '#000');
    hline(ctx, 4, 9, by - 10, hat); rect(ctx, 5, by - 11, 4, 1, hat); px(ctx, 6, by - 11, '#e8e0c0');
    line(ctx, 4, by - 1, 2, by - 4, o); px(ctx, 2, by - 5, o);
    if (pose === 'hold') { rect(ctx, 9, by - 6, 2, 2, '#f2c14e'); px(ctx, 9, by - 4, b); }
    else { px(ctx, 9, by - 3, b); }
    return;
  }
  if (pose === 'climb') {
    rect(ctx, 5, 3, 4, 5, b);
    rect(ctx, 5, 0, 4, 3, b);
    px(ctx, 8, 1, face);
    vline(ctx, 4, 2, 5, b); vline(ctx, 9, 4, 7, b);
    line(ctx, 5, 8, 3, 11, o);
    return;
  }
  const f = pose === 'walk1' ? 1 : 0;
  rect(ctx, 3, by - 5, 6, 3, b);
  rect(ctx, 8, by - 8, 4, 4, b);
  rect(ctx, 9, by - 7, 3, 2, face);
  px(ctx, 11, by - 7, '#000');
  hline(ctx, 7, 12, by - 9, hat); rect(ctx, 8, by - 10, 4, 1, hat);
  vline(ctx, 4 - f, by - 2, by, b); vline(ctx, 8 + f, by - 2, by, b);
  line(ctx, 3, by - 5, 1, by - 8 + f, o); px(ctx, 2, by - 9 + f, o);
}

// ───────── Yeni hayvanlar (yandan, 14×12) ─────────
function drawGull(ctx, pose) {
  const w = '#f2f2ee', g = '#9aa4ae', y = '#f0b030', by = PET_FH - 1;
  rect(ctx, 4, by - 6, 6, 4, w); rect(ctx, 4, by - 6, 4, 2, g);
  rect(ctx, 9, by - 9, 3, 3, w); px(ctx, 11, by - 8, '#101010');
  hline(ctx, 12, 13, by - 7, y);
  hline(ctx, 1, 4, by - 5, g);
  vline(ctx, 6, by - 1, by, y); vline(ctx, 8, by - 1, by, y);
}
function drawTurtle(ctx, pose) {
  const sh = '#5a7a3a', sd = '#3e5a28', sk = '#a8b878', by = PET_FH - 1;
  rect(ctx, 3, by - 5, 8, 3, sh); rect(ctx, 4, by - 6, 6, 1, sh); hline(ctx, 4, 9, by - 4, sd);
  px(ctx, 5, by - 5, sd); px(ctx, 8, by - 5, sd);
  rect(ctx, 11, by - 4, 3, 2, sk); px(ctx, 13, by - 4, '#202018');
  rect(ctx, 3, by - 2, 2, 2, sk); rect(ctx, 9, by - 2, 2, 2, sk); px(ctx, 2, by - 3, sk);
}
function drawFerret(ctx, pose) {
  const b = '#c89a62', d = '#7a5432', l = '#f0e0c0', by = PET_FH - 1;
  rect(ctx, 3, by - 4, 8, 3, b); rect(ctx, 10, by - 6, 3, 3, l); hline(ctx, 10, 12, by - 5, '#4a3424'); px(ctx, 12, by - 5, '#101010');
  px(ctx, 10, by - 7, d); line(ctx, 3, by - 3, 0, by - 5, d); px(ctx, 0, by - 6, d);
  vline(ctx, 4, by - 1, by, d); vline(ctx, 9, by - 1, by, d);
}
function drawOcto(ctx, pose) {
  const b = '#9a4ab0', d = '#6a2a80', l = '#c88ad8', by = PET_FH - 1;
  rect(ctx, 4, by - 9, 6, 5, b); rect(ctx, 5, by - 10, 4, 1, b); rect(ctx, 5, by - 8, 2, 1, l);
  px(ctx, 6, by - 6, '#fff'); px(ctx, 8, by - 6, '#fff'); px(ctx, 6, by - 5, '#101010'); px(ctx, 8, by - 5, '#101010');
  for (const x of [3, 5, 7, 9, 11]) { vline(ctx, x, by - 3, by - 1, d); px(ctx, x + (x % 4 === 1 ? 1 : -1), by, l); }
}

/** Portre (UI kartları için): sprite'ı büyütülmüş dataURL olarak döndürür */
const portraitCache = new Map();
export function crewPortraitURL(id, scale = 4) {
  const k = id + scale;
  if (portraitCache.has(k)) return portraitCache.get(k);
  const src = crewFrame(id, 'idle', 0);
  const c = makeCanvas(FW * scale, FH * scale);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, 0, 0, FW * scale, FH * scale);
  const url = c.toDataURL ? c.toDataURL() : '';
  portraitCache.set(k, url);
  return url;
}

export function petPortraitURL(id, scale = 4) {
  const k = 'p' + id + scale;
  if (portraitCache.has(k)) return portraitCache.get(k);
  const pose = id === 'PET_KIRMIZI' || id === 'PET_GECEYARISI' ? 'perch0' : 'sit';
  const src = petFrame(id, pose);
  const c = makeCanvas(src.width * scale, src.height * scale);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, 0, 0, src.width * scale, src.height * scale);
  const url = c.toDataURL ? c.toDataURL() : '';
  portraitCache.set(k, url);
  return url;
}
