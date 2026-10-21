// Dünya nesneleri ve efekt sprite'ları (kare dizileri).
import { PB, OUTLINE, hash } from './pixel.js';

const frames = (n, w, h, fn, outline = true) => Array.from({ length: n }, (_, i) => {
  const pb = new PB(w, h);
  fn(pb, i);
  if (outline) pb.outline(OUTLINE);
  return pb;
});

export const OBJECT_SPRITES = {
  waystone: () => frames(4, 16, 28, (pb, i) => {
    pb.ellipse(8, 26, 7, 2, '#2a2a30');
    pb.poly([[3, 26], [4, 6], [8, 1], [12, 6], [13, 26]], '#6a6a78'); pb.poly([[5, 24], [6, 7], [8, 4], [9, 24]], '#8a8a98');
    const g = ['#5ad8ff', '#8ae8ff', '#c0f4ff', '#8ae8ff'][i];
    pb.vline(8, 9, 21, g); pb.hline(6, 10, 13, g); pb.set(6, 17, g); pb.set(10, 17, g); pb.set(8, 7, '#ffffff');
  }),
  altar: () => frames(4, 32, 26, (pb, i) => {
    pb.rect(3, 14, 26, 10, '#6a6470'); pb.rect(1, 12, 30, 3, '#8a8490'); pb.hline(1, 30, 12, '#a8a2ae');
    for (let x = 5; x < 28; x += 6) pb.vline(x, 15, 23, '#4e4854');
    const c = ['#c070ff', '#d090ff', '#e0b0ff', '#d090ff'][i];
    pb.poly([[12, 12], [16, 0 + (i % 2)], [20, 12]], c); pb.vline(16, 3, 10, '#f4e8ff');
    pb.set(7, 18, c); pb.set(25, 18, c);
  }),
  altar_off: () => frames(1, 32, 26, (pb) => {
    pb.rect(3, 14, 26, 10, '#5a5460'); pb.rect(1, 12, 30, 3, '#6a6470');
    pb.poly([[12, 12], [16, 3], [20, 12]], '#4a3a5a');
  }),
  portal: () => frames(4, 20, 20, (pb, i) => {
    const r = 6 + (i % 2);
    pb.ring(10, 10, r + 2, '#3a7ad0', 2); pb.ring(10, 10, r, '#8ad0ff', 1);
    pb.poly([[6, 10], [13, 5], [13, 15]], ['#ffffff', '#e0f4ff', '#c0e8ff', '#e0f4ff'][i]);
  }, false),
  dungeon_gate: () => frames(2, 48, 48, (pb, i) => {
    pb.rect(2, 8, 44, 40, '#3a3640'); pb.poly([[2, 10], [24, 0], [46, 10]], '#4a4652');
    pb.rect(10, 16, 28, 32, i ? '#0a0a12' : '#2a2a34');
    if (!i) { for (let x = 12; x < 38; x += 6) pb.vline(x, 16, 47, '#5a5664'); pb.hline(10, 37, 30, '#5a5664');
      pb.disc(24, 30, 6, '#6a3a8a'); pb.ring(24, 30, 6, '#c070ff'); pb.set(24, 30, '#ffffff'); }
    else { pb.disc(24, 34, 9, '#1a1430'); pb.disc(24, 34, 5, '#3a2a6a'); }
    for (let y = 12; y < 46; y += 6) { pb.rect(3, y, 6, 4, '#4e4a56'); pb.rect(39, y, 6, 4, '#4e4a56'); }
    pb.set(24, 4, '#c070ff');
  }),
  gate_bars: () => frames(1, 16, 16, (pb) => {
    pb.rect(0, 0, 16, 16, '#2a2630');
    for (let x = 1; x < 16; x += 4) { pb.rect(x, 0, 2, 16, '#6a6678'); pb.vline(x, 0, 15, '#8a8698'); }
    pb.rect(0, 3, 16, 2, '#5a5668'); pb.rect(0, 11, 16, 2, '#5a5668');
  }, false),
  herb_healing_herb: () => frames(1, 14, 12, (pb) => {
    pb.ellipse(7, 8, 6, 4, '#2e6a28'); for (let i = 0; i < 5; i++) pb.line(7, 10, 2 + i * 2.5, 3 + (i % 2) * 2, '#4ea040');
    pb.set(4, 4, '#f4f0e8'); pb.set(10, 3, '#f4f0e8'); pb.set(7, 2, '#f0d040');
  }),
  herb_mana_herb: () => frames(1, 14, 12, (pb) => {
    pb.ellipse(7, 8, 6, 4, '#2a4a6a'); for (let i = 0; i < 5; i++) pb.line(7, 10, 2 + i * 2.5, 3 + (i % 2) * 2, '#4a8ad0');
    pb.set(4, 4, '#a0e0ff'); pb.set(10, 3, '#a0e0ff'); pb.set(7, 2, '#ffffff');
  }),
  herb_used: () => frames(1, 14, 12, (pb) => { pb.ellipse(7, 9, 5, 2.5, '#4a4a32'); pb.line(5, 9, 4, 6, '#5a5a3a'); }),
  ore_iron_ore: () => frames(1, 20, 16, (pb) => {
    pb.poly([[1, 15], [3, 5], [9, 1], [16, 3], [19, 15]], '#5a5458'); pb.poly([[4, 13], [5, 6], [9, 3], [14, 5], [16, 13]], '#6e686c');
    for (const [x, y] of [[7, 7], [12, 9], [9, 11], [14, 6]]) { pb.set(x, y, '#c08a5a'); pb.set(x + 1, y, '#e0aa7a'); }
  }),
  ore_hard_ore: () => frames(1, 20, 16, (pb) => {
    pb.poly([[1, 15], [3, 5], [9, 1], [16, 3], [19, 15]], '#3e3a44'); pb.poly([[4, 13], [5, 6], [9, 3], [14, 5], [16, 13]], '#4e4a56');
    for (const [x, y] of [[7, 7], [12, 9], [9, 11], [14, 6]]) { pb.set(x, y, '#d0d4f0'); pb.set(x, y - 1, '#ffffff'); }
  }),
  ore_used: () => frames(1, 20, 16, (pb) => { pb.poly([[2, 15], [5, 9], [12, 8], [18, 15]], '#4a4448'); }),
  track: () => frames(2, 16, 12, (pb, i) => {
    const c = i ? '#f0d060' : '#5a3a22';
    for (const [x, y] of [[3, 8], [9, 3]]) { pb.ellipse(x + 1, y + 1, 1.6, 1.3, c); pb.set(x - 1, y - 1, c); pb.set(x + 1, y - 2, c); pb.set(x + 3, y - 1, c); }
  }, false),
  chest: () => frames(2, 16, 14, (pb, i) => {
    pb.rect(1, 5, 14, 9, '#8a5a32'); pb.rect(1, 5, 14, 2, '#a87040'); pb.hline(1, 14, 9, '#5a3a20'); pb.rect(7, 7, 2, 3, '#e0c060');
    if (i) { pb.rect(1, 1, 14, 4, '#6a4428'); pb.rect(3, 4, 10, 2, '#f0d060'); }
    else pb.poly([[1, 6], [3, 2], [13, 2], [15, 6]], '#9a6a3a');
  }),
  purify: () => frames(2, 18, 26, (pb, i) => {
    pb.ellipse(9, 24, 8, 2, '#1e2a20');
    pb.poly([[3, 24], [4, 6], [9, 2], [14, 6], [15, 24]], '#6a7a6a'); pb.poly([[5, 22], [6, 7], [9, 4], [10, 22]], '#8a9a8a');
    const c = i ? '#7af0ff' : '#3a4a3a';
    pb.disc(9, 12, 3, c); pb.vline(9, 6, 20, i ? '#c0ffff' : '#4a5a4a'); if (i) pb.set(9, 12, '#ffffff');
  }),
  ruin: () => frames(2, 18, 20, (pb, i) => {
    pb.rect(2, 4, 14, 15, '#7a7a6a'); pb.poly([[2, 4], [9, 0], [16, 4]], '#8a8a7a');
    const c = i ? '#f0d060' : '#4a4a3a';
    pb.hline(5, 12, 8, c); pb.hline(5, 10, 11, c); pb.hline(6, 12, 14, c); pb.set(4, 16, '#4a7a3a');
  }),
  checkpoint: () => frames(2, 16, 28, (pb, i) => {
    pb.vline(4, 2, 27, '#6a4628'); pb.poly([[5, 3], [15, 6 + i], [5, 11]], '#c03a3a'); pb.hline(5, 8, 7, '#f0d060');
    pb.ellipse(4, 27, 4, 1, '#2a2a30');
  }),
  campfire: () => frames(4, 16, 18, (pb, i) => {
    pb.line(2, 16, 13, 13, '#5a3a20'); pb.line(2, 13, 13, 16, '#6a4628');
    const h = [8, 10, 9, 11][i];
    pb.poly([[4, 15], [8, 15 - h], [12, 15]], '#e05a20'); pb.poly([[6, 15], [8, 17 - h], [10, 15]], '#f0b030'); pb.set(8, 13, '#fff0a0');
  }, false),
  torch: () => frames(4, 8, 18, (pb, i) => {
    pb.rect(3, 8, 2, 10, '#5a3a20'); pb.rect(2, 7, 4, 2, '#4a4a52');
    const h = [5, 6, 5, 7][i];
    pb.poly([[2, 7], [4, 7 - h], [6, 7]], '#f07a20'); pb.set(4, 5, '#ffe080'); pb.set(4, 4 - (i % 2), '#fff0c0');
  }, false),
  brazier_fire: () => frames(4, 16, 14, (pb, i) => {
    const h = [9, 11, 10, 12][i];
    pb.poly([[2, 13], [5, 13 - h + 3], [8, 13 - h], [11, 13 - h + 2], [14, 13]], '#e05a20'); pb.poly([[5, 13], [8, 15 - h], [11, 13]], '#f0b030');
  }, false),
  smoke: () => frames(1, 8, 8, (pb) => { pb.disc(4, 4, 3.5, '#b8b4b0', 160); pb.disc(3, 3, 1.5, '#d8d4d0', 160); }, false),
  loot_bag: () => frames(1, 12, 12, (pb) => {
    pb.ellipse(6, 8, 5, 4, '#a07a48'); pb.rect(4, 2, 4, 3, '#a07a48'); pb.hline(3, 8, 4, '#5a3a20'); pb.set(5, 7, '#c09a68');
  }),
  shadow: () => frames(1, 16, 6, (pb) => { pb.ellipse(8, 3, 8, 3, '#000000', 90); }, false),
  ring_target: () => frames(1, 32, 14, (pb) => {
    for (let a = 0; a < 40; a++) {
      const t = a / 40 * Math.PI * 2; if ((a % 10) > 6) continue;
      pb.set(16 + Math.cos(t) * 15, 7 + Math.sin(t) * 6, '#ff4a3a'); pb.set(16 + Math.cos(t) * 14, 7 + Math.sin(t) * 5.5, '#ffaa80');
    }
  }, false),
  ring_npc: () => frames(1, 32, 14, (pb) => {
    for (let a = 0; a < 40; a++) { const t = a / 40 * Math.PI * 2; if ((a % 10) > 6) continue; pb.set(16 + Math.cos(t) * 15, 7 + Math.sin(t) * 6, '#ffe060'); }
  }, false),
  quest_mark: () => frames(2, 8, 12, (pb, i) => {
    const c = i ? '#ffe060' : '#f0c020';
    pb.rect(3, 1, 3, 7, c); pb.rect(3, 9, 3, 2, c);
  }),
  quest_turnin: () => frames(2, 10, 12, (pb, i) => {
    const c = i ? '#ffe060' : '#f0c020';
    pb.ellipse(5, 4, 3.5, 3, c); pb.clear(3, 4, 2, 2); pb.rect(5, 6, 2, 2, c); pb.rect(5, 9, 2, 2, c);
    pb.clear(2, 3, 2, 3); pb.rect(2, 2, 2, 2, c);
  }),
};

// -------------------------------------------------------------- efektler
export const EFFECT_SPRITES = {
  slash: () => frames(3, 32, 32, (pb, i) => {
    const a0 = -1.6 + i * 0.5, a1 = a0 + 1.6;
    for (let r = 10; r < 15; r++) for (let t = a0; t < a1; t += 0.03) {
      const fade = (t - a0) / (a1 - a0);
      pb.set(16 + Math.cos(t) * r, 16 + Math.sin(t) * r, r > 12 ? '#ffffff' : '#c0e0ff', Math.round(255 * fade));
    }
  }, false),
  spark: () => frames(3, 16, 16, (pb, i) => {
    const r = 2 + i * 2.5;
    for (let k = 0; k < 8; k++) { const t = k / 8 * Math.PI * 2; pb.line(8 + Math.cos(t) * r * 0.4, 8 + Math.sin(t) * r * 0.4, 8 + Math.cos(t) * r, 8 + Math.sin(t) * r, i < 2 ? '#fff4c0' : '#f0a040'); }
    if (i === 0) pb.disc(8, 8, 2.5, '#ffffff');
  }, false),
  fireball: () => frames(2, 14, 14, (pb, i) => {
    pb.disc(7, 7, 5.5, '#e04a1a'); pb.disc(7 + i * 0.5, 7, 4, '#f09030'); pb.disc(8, 6, 2.2, '#fff0a0');
    for (let k = 0; k < 4; k++) pb.set(hash(k, i) * 4, 4 + hash(i, k) * 6, '#f0a030');
  }, false),
  ore_bolt: () => frames(2, 10, 10, (pb, i) => { pb.disc(5, 5, 3.5, '#ff8a2a'); pb.disc(5, 5, 2, '#ffe0a0'); pb.set(1 + i, 5, '#ff8a2a'); }, false),
  mist_bolt: () => frames(2, 10, 10, (pb, i) => { pb.disc(5, 5, 3.5, '#3ad0a0'); pb.disc(5, 5, 2, '#c0ffe8'); pb.set(1 + i, 4, '#3ad0a0'); }, false),
  arcane_bolt: () => frames(2, 10, 10, (pb, i) => { pb.disc(5, 5, 3.2, '#7a8aff'); pb.disc(5, 5, 1.8, '#e0e8ff'); pb.set(1 + i, 5, '#a0b0ff'); }, false),
  crimson: () => frames(3, 24, 24, (pb, i) => {
    const r = 4 + i * 3;
    pb.ring(12, 12, r, '#ff3a2a', 2); pb.disc(12, 12, Math.max(1, 5 - i * 2), '#ffd060');
  }, false),
  spirit: () => frames(3, 24, 24, (pb, i) => {
    const r = 4 + i * 3;
    pb.ring(12, 12, r, '#80e0ff', 2); pb.ring(12, 12, Math.max(1, r - 4), '#e0faff', 1);
  }, false),
  ice: () => frames(3, 48, 48, (pb, i) => {
    for (let k = 0; k < 10; k++) {
      const t = k / 10 * Math.PI * 2 + i * 0.2, r = 6 + i * 7 + hash(k, 1) * 4;
      const x = 24 + Math.cos(t) * r, y = 24 + Math.sin(t) * r;
      pb.poly([[x - 2, y + 2], [x, y - 4], [x + 2, y + 2]], '#a0e0ff'); pb.set(x, y - 2, '#ffffff');
    }
    pb.disc(24, 24, Math.max(2, 10 - i * 4), '#e0f8ff', 180);
  }, false),
  meteor: () => frames(2, 20, 28, (pb, i) => {
    for (let k = 0; k < 10; k++) pb.disc(8 - k * 0.4 + hash(k, i) * 2, 6 - k * 0.6, 3 - k * 0.25, k < 4 ? '#f0b030' : '#e05a20', 220 - k * 18);
    pb.disc(10, 18, 7, '#5a3a2a'); pb.disc(9, 17, 5, '#7a4a32'); pb.disc(12, 20, 3, '#f06020'); pb.set(8, 15, '#ffd080');
  }, false),
  explosion: () => frames(4, 48, 48, (pb, i) => {
    const r = 6 + i * 6;
    pb.disc(24, 24, r, i < 2 ? '#f09030' : '#c04a20', i < 3 ? 230 : 120);
    pb.disc(24, 24, r * 0.65, i < 2 ? '#fff0a0' : '#f09030', 220);
    for (let k = 0; k < 8; k++) { const t = k / 8 * Math.PI * 2; pb.disc(24 + Math.cos(t) * r, 24 + Math.sin(t) * r, 2, '#5a4a4a', 150); }
  }, false),
  levelup: () => frames(4, 32, 64, (pb, i) => {
    for (let y = 0; y < 64; y++) {
      const w = 6 + Math.sin(y * 0.2 + i) * 2;
      pb.hline(16 - w, 16 + w, y, '#ffe060', Math.round(140 * (y / 64)));
    }
    for (let k = 0; k < 8; k++) pb.set(6 + hash(k, i) * 20, hash(i, k) * 60, '#ffffff');
  }, false),
  beam: () => frames(2, 16, 64, (pb, i) => {
    for (let y = 0; y < 64; y++) pb.hline(8 - 3, 8 + 3, y, '#ffffff', Math.round(170 * (y / 64)));
    pb.set(8, 10 + i * 20, '#ffffff');
  }, false),
  sparkle: () => frames(3, 8, 8, (pb, i) => {
    const s = 1 + (i === 1 ? 2 : 1);
    pb.hline(4 - s, 4 + s, 4, '#ffffff'); pb.vline(4, 4 - s, 4 + s, '#ffffff'); pb.set(4, 4, '#fff8c0');
  }, false),
  poison: () => frames(3, 12, 12, (pb, i) => { pb.disc(4, 9 - i * 2, 2, '#7ad050'); pb.disc(8, 7 - i, 1.5, '#a0f070'); }, false),
  stun: () => frames(3, 20, 8, (pb, i) => {
    for (let k = 0; k < 3; k++) { const t = k / 3 * Math.PI * 2 + i * 0.7; const x = 10 + Math.cos(t) * 7, y = 4 + Math.sin(t) * 2.5; pb.set(x, y, '#ffe060'); pb.set(x + 1, y, '#ffffff'); pb.set(x, y - 1, '#ffe060'); }
  }, false),
  aura_iron: () => frames(2, 32, 40, (pb, i) => {
    pb.ellipse(16, 22, 14, 18, '#c0c8d0', 50 + i * 20); pb.ring(16, 22, 14, '#e0e8f0');
  }, false),
  aura_mana: () => frames(2, 32, 40, (pb, i) => { pb.ellipse(16, 22, 14, 18, '#4a8aff', 60 + i * 20); pb.ellipse(16, 22, 13, 17, '#80c0ff', 30); }, false),
  aura_will: () => frames(2, 32, 40, (pb, i) => { pb.ellipse(16, 22, 14, 18, '#ffd060', 60 + i * 20); }, false),
  heal: () => frames(3, 16, 16, (pb, i) => { pb.rect(6, 4 - i, 4, 10, '#7af070'); pb.rect(3, 7 - i, 10, 4, '#7af070'); pb.rect(7, 5 - i, 2, 8, '#d0ffd0'); }, false),
  px: () => frames(1, 2, 2, (pb) => pb.rect(0, 0, 2, 2, '#ffffff'), false),
  soft: () => frames(1, 16, 16, (pb) => { for (let r = 8; r > 0; r--) pb.disc(8, 8, r, '#ffffff', Math.round(255 * (1 - r / 8) * 0.9)); }, false),
  mist: () => frames(1, 48, 24, (pb) => { for (let k = 0; k < 6; k++) pb.ellipse(10 + k * 6, 12 + Math.sin(k) * 3, 10, 6, '#c8d8d0', 22); }, false),
  firefly: () => frames(2, 4, 4, (pb, i) => { pb.rect(1, 1, 2, 2, i ? '#f0ff90' : '#c0e060'); }, false),
};

// Telegraf şekilleri ve ışık dokuları canvas ile (yumuşak kenarlı)
export function makeSoftCircle(size, inner = '#ffffff', alpha = 1) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return c;
}

export function makeVignette(w, h, strength) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.18, w / 2, h / 2, Math.max(w, h) * 0.62);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(4,2,10,${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  return c;
}

export function makeTelegraphTex(kind) {
  const S = 128;
  const c = document.createElement('canvas');
  c.width = S; c.height = kind === 'rect' ? 32 : S;
  const ctx = c.getContext('2d');
  if (kind === 'circle') {
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2 - 2, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.stroke();
  } else if (kind === 'fill') {
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2 - 2, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'rect') {
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(0, 2, S, 28);
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.strokeRect(1, 2, S - 2, 28);
  } else if (kind === 'ring') {
    ctx.lineWidth = 14; ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2 - 8, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.stroke();
  } else if (kind === 'cone') {
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.moveTo(S / 2, S / 2); ctx.arc(S / 2, S / 2, S / 2 - 2, -Math.PI / 3, Math.PI / 3); ctx.closePath(); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.stroke();
  }
  return c;
}
